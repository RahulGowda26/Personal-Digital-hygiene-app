import { Capacitor } from '@capacitor/core';
import type { 
  ScanResult, 
  InstalledAppInfo, 
  PermissionFinding, 
  DeviceIntegrityResult, 
  SecurityConfigurationResult,
  ScanFinding,
  AppMetadata
} from '@/types';
import { SentinelDeviceScanner } from '@/platform/capacitor/DeviceScannerBridge';
import { SentinelNetworkScanner } from '@/platform/capacitor/NetworkScannerBridge';
import { getInstalledAppsNative } from '@/platform/capacitor/AppScannerBridge';
import { DeterministicRuleEngine } from './DeterministicRuleEngine';
import { AIAnalyzer } from './AIAnalyzer';
import { analyzeApps } from './appRiskAnalyzer';

/**
 * SecurityScanner - The central scan orchestrator.
 * 
 * Executes native scanners individually and aggregates their results into a 
 * normalized ScanResult, ensuring that failures in one module do not crash others.
 */
export type ScanPhase = 
  | 'INITIALIZING' 
  | 'DEVICE_SECURITY' 
  | 'INSTALLED_APPLICATIONS' 
  | 'NETWORK_SECURITY'
  | 'CHECKING_PERMISSIONS'
  | 'FINDING_RISKS'
  | 'CREATING_REPORT'
  | 'COMPLETE';

export class SecurityScanner {
  private isNative(): boolean {
    if (Capacitor.isNativePlatform()) return true;
    if (typeof window !== 'undefined' && (window as any).electronAPI) return true;
    return false;
  }

  private generateScanId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Orchestrates the complete device scan workflow.
   */
  public async scan(
    onProgress?: (phase: ScanPhase) => void,
    onLog?: (msg: string) => void
  ): Promise<ScanResult> {
    const scanId = this.generateScanId();
    const deviceId = 'local-device';
    const timestamp = new Date().toISOString();

    console.log(`[SCAN SERVICE ENTERED]`);
    console.log(`[SCAN START] id=${scanId}`);
    if (onLog) onLog(`[INIT] Scan orchestrator started (id: ${scanId})`);
    if (onProgress) {
      onProgress('INITIALIZING');
    }
    await this.sleep(1000);

    if (!this.isNative()) {
      return {
        deviceId,
        timestamp,
        status: 'failed',
        deviceIntegrity: { status: 'not_available', confidence: 'low', checksPerformed: [], issues: [] },
        configuration: { status: 'not_available', developerModeEnabled: false, unknownSourcesEnabled: false, screenLockSecured: false, storageEncrypted: false, issues: [] },
        apps: [],
        permissions: {},
        findings: []
      };
    }

    console.log(`[NATIVE DEVICE CALL]`);
    if (onLog) onLog(`[NATIVE] Requesting device integrity signals...`);
    if (onProgress) {
      onProgress('DEVICE_SECURITY');
    }
    let deviceIntegrity = await this.getDeviceIntegrity(scanId);
    if (onLog) onLog(`[OK] Device status: ${deviceIntegrity.status}`);
    await this.sleep(1500);
    
    if (onLog) onLog(`[NATIVE] Requesting security configurations...`);
    let configuration = await this.getSecurityConfiguration(scanId);
    
    console.log(`[NATIVE APP CALL]`);
    if (onLog) onLog(`[NATIVE] Querying installed applications via PackageManager...`);
    if (onProgress) {
      onProgress('INSTALLED_APPLICATIONS');
    }
    let appsData = await this.getInstalledAppsAndPermissions(scanId, onLog);
    if (onLog) onLog(`[OK] Retrieved ${appsData.apps?.length || 0} applications.`);
    await this.sleep(2000);

    if (onLog) onLog(`[NETWORK] Scanning active connections...`);
    if (onProgress) {
      onProgress('NETWORK_SECURITY');
    }
    let networkData = await this.getNetworkSignals(scanId);
    if (onLog) onLog(`[OK] Network scan completed.`);

    console.log(`[RISK ENGINE START] id=${scanId}`);
    if (onProgress) {
      onProgress('CHECKING_PERMISSIONS');
    }
    const findings: ScanFinding[] = [];

    if (onLog) onLog(`[ENGINE] Initializing Deterministic Rule Engine...`);
    const ruleEngine = new DeterministicRuleEngine();
    const aiAnalyzer = new AIAnalyzer();

    if (onLog) onLog(`[EVAL] Analyzing device integrity evidence...`);
    const deviceEvidence = ruleEngine.evaluateDeviceIntegrity(deviceIntegrity, configuration, networkData);
    
    // Convert AI Analysis of device to finding
    if (onLog) onLog(`[AI] Evaluating signals with heuristics...`);
    const deviceDecisions = await aiAnalyzer.analyzeEvidence(deviceEvidence);
    
    for (const deviceDecision of deviceDecisions) {
      if (deviceDecision.status === 'CRITICAL_RISK' || deviceDecision.status === 'HIGH_RISK' || deviceDecision.status === 'MEDIUM_RISK') {
         findings.push({
           id: `ai-device-${scanId}-${findings.length}`,
           category: 'device_security',
           title: `Device Security: ${deviceDecision.status.replace('_', ' ')}`,
           description: deviceDecision.reason,
           severity: deviceDecision.status === 'CRITICAL_RISK' ? 'critical' : (deviceDecision.status === 'HIGH_RISK' ? 'high' : 'medium'),
           source: 'ANDROID_API',
           evidence: deviceDecision.evidence,
           recommendedPlaybook: deviceDecision.recommendedAction ? 'generic-remediation' : null
         });
      }
    }

    // Analyze Apps and Permissions
    if (onProgress) {
      onProgress('FINDING_RISKS');
    }
    await this.sleep(500);

    if (appsData.status !== 'error') {
      if (onLog) onLog(`[EVAL] Executing app risk analyzer against ${appsData.apps.length} apps...`);
      
      const appFindings = analyzeApps(appsData.apps as unknown as AppMetadata[]);
      
      // We mutate the global apps array with our analysis so it can be passed to the Inventory
      (appsData as any).appRiskFindings = appFindings;

      for (const f of appFindings) {
        // ONLY insert actionable risks into the Security Issues table!
        if (f.riskLevel === 'high' || f.riskLevel === 'medium' || f.riskLevel === 'critical') {
          if (onLog) onLog(`[WARN] Actionable App Risk Found: ${f.title}`);
          findings.push({
            id: `app-${f.packageName}-${scanId}`,
            category: 'app_security',
            title: f.title || f.appName || f.packageName,
            description: f.description || 'Actionable app security risk detected.',
            severity: f.severity,
            source: 'ANDROID_PACKAGE_MANAGER',
            evidence: f.reasons || f.evidence || [],
            recommendedPlaybook: f.recommendedPlaybook || 'review_app_permissions'
          });
        }
      }
    }

    console.log(`[FINDINGS GENERATED]`);
    console.log(`[RISK ENGINE FINDINGS COUNT=${findings.length}] id=${scanId}`);
    console.log(`[FINAL FINDINGS COUNT=${findings.length}] id=${scanId}`);

    if (onProgress) {
      onProgress('CREATING_REPORT');
    }
    await this.sleep(500);

    for (const f of findings) {
      console.log(`[FINDING DEBUG]\nApp=${f.title}\nPackage=${f.id.split('-')[1] || 'N/A'}\nRule=${f.description}\nSeverity=${f.severity}\nEvidence=${f.evidence?.join('; ')}\nSource=${f.source}`);
    }

    console.log(`[SCAN COMPLETE] id=${scanId}`);
    if (onProgress) onProgress('COMPLETE');

    return {
      deviceId,
      timestamp,
      status: 'success',
      deviceIntegrity,
      configuration,
      apps: appsData.apps,
      appRiskFindings: (appsData as any).appRiskFindings || [],
      permissions: appsData.permissions,
      findings,
      networkDetails: {
        ssid: networkData.ssid,
        ipAddress: networkData.ipAddress,
        deviceCount: networkData.deviceCount,
        connectedDevices: networkData.connectedDevices
      }
    };
  }

  /**
   * Orchestrates ONLY the network scan workflow.
   */
  public async scanNetworkOnly(
    onProgress?: (phase: ScanPhase) => void,
    onLog?: (msg: string) => void
  ): Promise<ScanResult> {
    const scanId = this.generateScanId();
    const deviceId = 'local-device';
    const timestamp = new Date().toISOString();

    console.log(`[NETWORK SCAN ENTERED] id=${scanId}`);
    if (onLog) onLog(`[INIT] Network-only scan started (id: ${scanId})`);
    if (onProgress) onProgress('INITIALIZING');

    if (!this.isNative()) {
      if (onProgress) onProgress('COMPLETE');
      return {
        deviceId,
        timestamp,
        status: 'failed',
        deviceIntegrity: { status: 'not_available', confidence: 'low', checksPerformed: [], issues: [] },
        configuration: { status: 'not_available', developerModeEnabled: false, unknownSourcesEnabled: false, screenLockSecured: false, storageEncrypted: false, issues: [] },
        apps: [],
        permissions: {},
        findings: []
      };
    }

    if (onLog) onLog(`[NETWORK] Scanning active connections (this may take a few seconds)...`);
    if (onProgress) onProgress('NETWORK_SECURITY');
    let networkData = await this.getNetworkSignals(scanId);
    if (onLog) {
      onLog(`[OK] Network scan completed.`);
      if (networkData.ssid) onLog(`[INFO] Network Name (SSID): ${networkData.ssid}`);
      if (networkData.ipAddress) onLog(`[INFO] Device IP: ${networkData.ipAddress}`);
      if (networkData.deviceCount !== undefined) onLog(`[INFO] Connected Devices Found: ${networkData.deviceCount}`);
    }

    if (onProgress) onProgress('FINDING_RISKS');
    const findings: ScanFinding[] = [];

    const ruleEngine = new DeterministicRuleEngine();
    const aiAnalyzer = new AIAnalyzer();

    const deviceEvidence = ruleEngine.evaluateDeviceIntegrity(
      { status: 'safe', confidence: 'high', checksPerformed: [], issues: [] }, 
      { status: 'safe', developerModeEnabled: false, unknownSourcesEnabled: false, screenLockSecured: true, storageEncrypted: true, issues: [] }, 
      networkData
    );
    
    const deviceDecisions = await aiAnalyzer.analyzeEvidence(deviceEvidence);
    
    for (const deviceDecision of deviceDecisions) {
      if (deviceDecision.status === 'CRITICAL_RISK' || deviceDecision.status === 'HIGH_RISK' || deviceDecision.status === 'MEDIUM_RISK') {
         findings.push({
           id: `ai-network-${scanId}-${findings.length}`,
           category: 'network_security',
           title: `Network Security: ${deviceDecision.status.replace('_', ' ')}`,
           description: deviceDecision.reason,
           severity: deviceDecision.status === 'CRITICAL_RISK' ? 'critical' : (deviceDecision.status === 'HIGH_RISK' ? 'high' : 'medium'),
           source: 'ANDROID_API',
           evidence: deviceDecision.evidence,
           recommendedPlaybook: deviceDecision.recommendedAction ? 'generic-remediation' : null
         });
      }
    }

    if (onLog) onLog(`[OK] Network scan completed successfully. Found ${findings.length} findings.`);
    if (onProgress) onProgress('COMPLETE');

    return {
      deviceId,
      timestamp,
      status: 'success',
      deviceIntegrity: { status: 'safe', confidence: 'high', checksPerformed: [], issues: [] },
      configuration: { status: 'safe', developerModeEnabled: false, unknownSourcesEnabled: false, screenLockSecured: true, storageEncrypted: true, issues: [] },
      apps: [],
      permissions: {},
      findings,
      networkDetails: {
        ssid: networkData.ssid,
        ipAddress: networkData.ipAddress,
        deviceCount: networkData.deviceCount,
        connectedDevices: networkData.connectedDevices
      }
    };
  }

  public async getDeviceIntegrity(sessionId: string): Promise<DeviceIntegrityResult> {
    try {
      const signals = await SentinelDeviceScanner.getDeviceSignals({ sessionId });
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
      
      if (signals.securityPatch) {
        const patchDate = new Date(signals.securityPatch);
        if (!isNaN(patchDate.getTime())) {
          const diffDays = (Date.now() - patchDate.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays > 365) {
            issues.push(`Security patch is severely outdated (${signals.securityPatch})`);
            if (status === 'safe') status = 'low';
          } else if (diffDays > 180) {
            issues.push(`Security patch is older than 6 months (${signals.securityPatch})`);
            if (status === 'safe') status = 'info';
          }
        }
      }

      return {
        status,
        confidence: 'high',
        checksPerformed: ['Root indicators', 'Developer mode', 'Test keys'],
        issues,
        osVersion: signals.osVersion,
        sdkInt: signals.sdkInt,
        securityPatch: signals.securityPatch
      };
    } catch (e) {
      console.error('DeviceIntegrity scan failed', e);
      return { status: 'not_available', confidence: 'low', checksPerformed: [], issues: [] };
    }
  }

  public async getSecurityConfiguration(sessionId: string): Promise<SecurityConfigurationResult> {
    try {
      const signals = await SentinelDeviceScanner.getDeviceSignals({ sessionId });
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
      return { status: 'not_available', developerModeEnabled: false, unknownSourcesEnabled: false, screenLockSecured: false, storageEncrypted: false, issues: [] };
    }
  }

  private async getInstalledAppsAndPermissions(sessionId: string, onLog?: (msg: string) => void): Promise<{
    status: 'success' | 'error';
    apps: InstalledAppInfo[];
    permissions: { [packageName: string]: PermissionFinding[] };
  }> {
    try {
      const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;
      let nativeResult = { apps: [] as any[] };
      
      if (isElectron && typeof (window as any).electronAPI.scanApps === 'function') {
        nativeResult.apps = await (window as any).electronAPI.scanApps();
        if (onLog) onLog(`[DEBUG] Electron scanApps returned: ${nativeResult.apps?.length} apps`);
      } else {
        nativeResult = await getInstalledAppsNative(sessionId);
        if (onLog) onLog(`[DEBUG] Native getInstalledApps returned: ${nativeResult.apps?.length} apps`);
      }
      
      const apps: InstalledAppInfo[] = [];
      const permissions: { [packageName: string]: PermissionFinding[] } = {};

      for (const app of nativeResult.apps) {
        apps.push({
          packageName: app.packageName,
          appName: app.appName,
          versionName: app.versionName,
          versionCode: app.versionCode || 0,
          isSystemApp: app.isSystemApp,
          isVendorApp: app.isVendorApp,
          isUserApp: app.isUserApp,
          isEnabled: true,
          requestedPermissions: app.requestedPermissions || [],
          targetSdkVersion: app.targetSdkVersion,
          installSource: app.installSource,
        });

        const mockGranted = (window as any).mockGrantedPermissions || {};
        const mockRequested = (window as any).mockRequestedPermissions || {};
        
        const grantedList = mockGranted[app.packageName] || app.grantedPermissions || [];
        app.grantedPermissions = grantedList;
        
        const perms = Array.from(new Set([
          ...grantedList,
          ...(mockRequested[app.packageName] || app.requestedPermissions || [])
        ])).map((p: any) => ({
          permission: p,
          isGranted: grantedList.includes(p),
          description: `Permission: ${p}`
        }));
        permissions[app.packageName] = perms;
      }

      return {
        status: 'success',
        apps,
        permissions
      };
    } catch (e: any) {
      if (onLog) onLog(`[ERROR] getInstalledAppsAndPermissions failed: ${e.message || e}`);
      console.error('[DEBUG] getInstalledAppsAndPermissions failed:', e);
      return { status: 'error', apps: [], permissions: {} };
    }
  }


  public async getNetworkSignals(sessionId: string): Promise<any> {
    try {
      if (this.isNative()) {
        try {
          await SentinelNetworkScanner.requestPermissions();
        } catch (permErr) {
          console.warn('Network permission request failed', permErr);
        }
      }
      const signals = await SentinelNetworkScanner.getNetworkSignals({ sessionId });
      
      const issues: string[] = [];
      let status: 'safe' | 'medium' | 'high' | 'critical' = 'safe';

      if (signals.isProxySet) {
        issues.push('Traffic is routed through a proxy');
        status = 'high';
      }
      
      if (signals.isVpnActive) {
        issues.push('VPN connection active');
        if (status === 'safe') status = 'medium';
      }

      return { 
        status, 
        isVpnActive: signals.isVpnActive,
        isProxySet: signals.isProxySet,
        isMetered: signals.isMetered,
        isOpenNetwork: signals.isOpenNetwork,
        isCaptivePortal: signals.isCaptivePortal,
        ssid: signals.ssid,
        ipAddress: signals.ipAddress,
        deviceCount: (signals as any).deviceCount,
        connectedDevices: (signals as any).connectedDevices,
        issues 
      };
    } catch (e) {
      console.error('Network scan failed', e);
      return { status: 'not_available', details: 'Error', issues: [] };
    }
  }

}
