import { Capacitor } from '@capacitor/core';
import type { 
  ScanResult, 
  InstalledAppInfo, 
  PermissionFinding, 
  DeviceIntegrityResult, 
  SecurityConfigurationResult,
  ScanFinding
} from '@/types';
import { SentinelDeviceScanner } from '@/platform/capacitor/DeviceScannerBridge';
import { getInstalledAppsNative } from '@/platform/capacitor/AppScannerBridge';

/**
 * SecurityScanner - The central scan orchestrator.
 * 
 * Executes native scanners individually and aggregates their results into a 
 * normalized ScanResult, ensuring that failures in one module do not crash others.
 */
export class SecurityScanner {
  private isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Orchestrates the complete device scan workflow.
   */
  public async scan(): Promise<ScanResult> {
    const deviceId = 'local-device';
    const timestamp = new Date().toISOString();

    if (!this.isNative()) {
      return this.createMockFallback(deviceId, timestamp);
    }

    let deviceIntegrity = await this.getDeviceIntegrity();
    let configuration = await this.getSecurityConfiguration();
    let appsData = await this.getInstalledAppsAndPermissions();

    const findings: ScanFinding[] = [];

    // Analyze Integrity
    if (deviceIntegrity.status === 'error') {
      // Failed to scan
    } else {
      if (deviceIntegrity.issues.includes('Root indicators found')) {
        findings.push({
          id: 'root-detected',
          title: 'Device Root or Jailbreak Detected',
          description: 'The device exhibits indicators of being rooted, compromising the OS sandbox.',
          severity: 'critical',
          source: 'ANDROID_API',
          evidence: ['Root indicators found'],
          recommendedPlaybook: 'unroot-device'
        });
      }
      if (deviceIntegrity.issues.includes('Developer mode active')) {
        findings.push({
          id: 'dev-mode-active',
          title: 'Developer Mode is Active',
          description: 'Developer options are enabled, which can be used to bypass security controls over USB.',
          severity: 'medium',
          source: 'ANDROID_API',
          evidence: ['Developer mode active'],
          recommendedPlaybook: 'disable-dev-mode'
        });
      }
    }

    // Analyze Configuration
    if (configuration.status !== 'error') {
      if (!configuration.screenLockSecured) {
        findings.push({
          id: 'no-screen-lock',
          title: 'No Secure Screen Lock',
          description: 'The device does not have a PIN, password, or biometric lock enabled.',
          severity: 'high',
          source: 'ANDROID_API',
          evidence: ['No secure lock screen'],
          recommendedPlaybook: 'enable-screen-lock'
        });
      }
      if (!configuration.storageEncrypted) {
        findings.push({
          id: 'storage-unencrypted',
          title: 'Device Storage is Unencrypted',
          description: 'Data on this device can be extracted if it falls into the wrong hands.',
          severity: 'high',
          source: 'ANDROID_API',
          evidence: ['Storage encryption inactive'],
          recommendedPlaybook: 'enable-encryption'
        });
      }
    }

    // Analyze Apps and Permissions
    if (appsData.status !== 'error') {
      for (const app of appsData.apps) {
        // Mock permission analysis based on extracted permissions
        const perms = appsData.permissions[app.packageName] || [];
        for (const p of perms) {
          if (p.isGranted && ['android.permission.RECORD_AUDIO', 'android.permission.CAMERA'].includes(p.permission)) {
             // In a real analyzer, we might cross-reference this with a threat intel list or 
             // unknown source. For now we just flag unknown source + sensitive permission.
             if (app.installSource !== 'com.android.vending') {
                findings.push({
                  id: `app-${app.packageName}-sensitive-perm`,
                  title: 'Unknown Application Has Sensitive Access',
                  description: `${app.appName} was installed from outside the Play Store and has sensitive permissions.`,
                  severity: 'high',
                  source: 'ANDROID_API',
                  evidence: [
                    `Observed: ${p.permission.replace('android.permission.', '')} permission granted`,
                    `App: ${app.appName} (${app.packageName})`,
                    `Source: ${app.installSource || 'Unknown'}`
                  ],
                  recommendedPlaybook: 'review-app-permissions'
                });
             }
          }
        }
      }
    }

    return {
      deviceId,
      timestamp,
      status: 'success',
      deviceIntegrity,
      configuration,
      apps: appsData.apps,
      permissions: appsData.permissions,
      findings
    };
  }

  public async getDeviceIntegrity(): Promise<DeviceIntegrityResult> {
    try {
      const signals = await SentinelDeviceScanner.getDeviceSignals();
      const issues: string[] = [];
      let status: DeviceIntegrityResult['status'] = 'safe';

      if (signals.isRooted) {
        issues.push('Root indicators found');
        status = 'critical';
      }
      if (signals.isDeveloperModeEnabled) {
        issues.push('Developer mode active');
        if (status === 'safe') status = 'medium';
      }

      return {
        status,
        confidence: 'high',
        checksPerformed: ['Root indicators', 'Developer mode', 'Test keys'],
        issues
      };
    } catch (e) {
      console.error('DeviceIntegrity scan failed', e);
      return {
        status: 'error',
        confidence: 'low',
        checksPerformed: [],
        issues: ['Scan failed or unavailable']
      };
    }
  }

  public async getSecurityConfiguration(): Promise<SecurityConfigurationResult> {
    try {
      const signals = await SentinelDeviceScanner.getDeviceSignals();
      const issues: string[] = [];
      let status: SecurityConfigurationResult['status'] = 'safe';

      if (!signals.isDeviceSecure) {
        issues.push('No secure lock screen');
        status = 'high';
      }
      if (!signals.isEncrypted) {
        issues.push('Storage encryption inactive');
        status = 'high';
      }

      return {
        status,
        developerModeEnabled: signals.isDeveloperModeEnabled,
        unknownSourcesEnabled: false, // Will require native plugin update
        screenLockSecured: signals.isDeviceSecure,
        storageEncrypted: signals.isEncrypted,
        issues
      };
    } catch (e) {
      console.error('SecurityConfiguration scan failed', e);
      return {
        status: 'error',
        developerModeEnabled: false,
        unknownSourcesEnabled: false,
        screenLockSecured: false,
        storageEncrypted: false,
        issues: ['Scan failed or unavailable']
      };
    }
  }

  public async getInstalledAppsAndPermissions(): Promise<{
    status: 'success' | 'error';
    apps: InstalledAppInfo[];
    permissions: { [packageName: string]: PermissionFinding[] };
  }> {
    try {
      const nativeResult = await getInstalledAppsNative();
      const apps: InstalledAppInfo[] = [];
      const permissions: { [packageName: string]: PermissionFinding[] } = {};

      for (const app of nativeResult.apps) {
        apps.push({
          packageName: app.packageName,
          appName: app.appName,
          versionName: app.versionName,
          versionCode: app.versionCode || 0,
          isSystemApp: app.isSystemApp,
          isEnabled: true,
          requestedPermissions: app.requestedPermissions || [],
          targetSdkVersion: app.targetSdkVersion,
          installSource: app.installSource,
        });

        const appPerms = app.requestedPermissions || [];
        const grantedPerms = app.grantedPermissions || [];
        permissions[app.packageName] = appPerms.map(p => ({
          permission: p,
          isGranted: grantedPerms.includes(p),
          description: p
        }));
      }

      return {
        status: 'success',
        apps,
        permissions
      };
    } catch (e) {
      console.error('InstalledApps scan failed', e);
      return {
        status: 'error',
        apps: [],
        permissions: {}
      };
    }
  }

  private createMockFallback(deviceId: string, timestamp: string): ScanResult {
    return {
      deviceId,
      timestamp,
      status: 'success',
      deviceIntegrity: {
        status: 'safe',
        confidence: 'high',
        checksPerformed: ['Mock root check'],
        issues: []
      },
      configuration: {
        status: 'safe',
        developerModeEnabled: false,
        unknownSourcesEnabled: false,
        screenLockSecured: true,
        storageEncrypted: true,
        issues: []
      },
      apps: [],
      permissions: {},
      findings: [
        {
          id: 'mock-finding',
          title: 'Running in Browser / Demo Mode',
          description: 'Cannot perform native scans in a web browser.',
          severity: 'info',
          source: 'NOT_AVAILABLE',
          evidence: ['No native capabilities accessible'],
          recommendedPlaybook: null
        }
      ]
    };
  }
}
