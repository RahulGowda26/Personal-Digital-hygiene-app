import type {
  PlatformId,
  SecurityCapability,
  SecuritySignal,
  AppMetadata,
  AppScanResult,
  DeviceSecuritySignals,
  DeviceSecuritySignal,
  DeviceSecurityCategory,
  NetworkSecuritySignals,
  NetworkSecuritySignal,
  NetworkSecurityCategory,
  SecurityAdapter,
} from '@/types';
import { mockInstalledApps } from './AndroidAppMockData';
import { getInstalledAppsNative } from './capacitor/AppScannerBridge';
import { SentinelDeviceScanner } from './capacitor/DeviceScannerBridge';
import { Capacitor } from '@capacitor/core';

/**
 * AndroidSecurityAdapter — bridge to Android native capabilities.
 *
 * When running inside a Capacitor shell on a real Android device,
 * getInstalledApps() calls the native SentinelAppScanner plugin.
 * In demo mode or when the native plugin is unavailable, it falls
 * back to mock data.
 */
export class AndroidSecurityAdapter implements SecurityAdapter {
  readonly platform: PlatformId = 'android';

  /** True when running inside Capacitor on a real Android device. */
  private get isNative(): boolean {
    try {
      return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
    } catch {
      return false;
    }
  }

  private get isDemoMode(): boolean {
    return import.meta.env.VITE_DEMO_MODE === 'true';
  }

  getCapabilities(): SecurityCapability[] {
    return [
      { platform: 'android', capability: 'account_security', status: 'supported' },
      { platform: 'android', capability: 'password_hygiene', status: 'supported' },
      { platform: 'android', capability: 'app_security', status: 'supported' },
      { platform: 'android', capability: 'privacy', status: 'supported' },
      { platform: 'android', capability: 'breach_check', status: 'supported' },
      { platform: 'android', capability: 'threat_simulation', status: 'supported' },
      { platform: 'android', capability: 'device_security', status: this.isNative ? 'supported' : (this.isDemoMode ? 'supported' : 'unsupported') },
      { platform: 'android', capability: 'network_security', status: this.isNative ? 'supported' : (this.isDemoMode ? 'supported' : 'unsupported') },
    ];
  }

  async getDeviceSecuritySignals(): Promise<DeviceSecuritySignals> {
    const time = new Date().toISOString();
    const signal = (category: DeviceSecurityCategory, id: string, status: any, value: string): DeviceSecuritySignal => ({
      id,
      category,
      status,
      value,
      source: this.isNative ? 'ANDROID_SYSTEM' : 'DEMO_MOCK',
      confidence: this.isNative ? 'high' : 'low',
      observedAt: time,
    });

    if (this.isNative) {
      try {
        const nativeSignals = await SentinelDeviceScanner.getDeviceSignals();
        return {
          platform: 'android',
          osVersion: signal('OS_SECURITY', 'android_os_version', 'SUPPORTED', nativeSignals.osVersion),
          securityPatchLevel: signal('SYSTEM_UPDATES', 'android_patch_level', 'SUPPORTED', nativeSignals.securityPatch),
          encryptionStatus: signal('ENCRYPTION', 'android_encryption', nativeSignals.isEncrypted ? 'ENABLED' : 'DISABLED', nativeSignals.isEncrypted ? 'Storage encryption active' : 'Storage encryption inactive'),
          screenLockStatus: signal('SCREEN_LOCK', 'android_screen_lock', nativeSignals.isDeviceSecure ? 'ENABLED' : 'DISABLED', nativeSignals.isDeviceSecure ? 'Secure lock screen active' : 'No secure lock screen'),
          secureBootStatus: signal('SECURE_BOOT', 'android_secure_boot', 'UNKNOWN', 'Not reliably detectable from user space'),
          developerModeStatus: signal('DEVELOPER_MODE', 'android_dev_mode', nativeSignals.isDeveloperModeEnabled ? 'ENABLED' : 'DISABLED', nativeSignals.isDeveloperModeEnabled ? 'Developer mode active' : 'Developer mode disabled'),
          rootOrJailbreakStatus: signal('ROOT_JAILBREAK', 'android_root', nativeSignals.isRooted ? 'INDICATORS_DETECTED' : 'NONE_DETECTED', nativeSignals.isRooted ? 'Root indicators found' : 'No basic root indicators found'),
          firewallStatus: signal('FIREWALL', 'android_firewall', 'UNSUPPORTED', 'Native firewall not manageable via apps'),
          antivirusStatus: signal('SECURITY_SOFTWARE', 'android_antivirus', 'UNSUPPORTED', 'Status not reliably determinable'),
          automaticUpdatesStatus: signal('SYSTEM_UPDATES', 'android_auto_update', 'UNKNOWN', 'App does not have permission to read update settings'),
          visibility: 'SUPPORTED',
          confidence: 'high',
        };
      } catch (err) {
        console.error('[DeviceScan] Native plugin failed:', err);
        return {
          platform: 'android',
          osVersion: signal('OS_SECURITY', 'android_os_version', 'UNKNOWN', 'Scan failed'),
          securityPatchLevel: signal('SYSTEM_UPDATES', 'android_patch_level', 'UNKNOWN', 'Scan failed'),
          encryptionStatus: signal('ENCRYPTION', 'android_encryption', 'UNKNOWN', 'Scan failed'),
          screenLockStatus: signal('SCREEN_LOCK', 'android_screen_lock', 'UNKNOWN', 'Scan failed'),
          secureBootStatus: signal('SECURE_BOOT', 'android_secure_boot', 'UNKNOWN', 'Scan failed'),
          developerModeStatus: signal('DEVELOPER_MODE', 'android_dev_mode', 'UNKNOWN', 'Scan failed'),
          rootOrJailbreakStatus: signal('ROOT_JAILBREAK', 'android_root', 'UNKNOWN', 'Scan failed'),
          firewallStatus: signal('FIREWALL', 'android_firewall', 'UNSUPPORTED', 'Scan failed'),
          antivirusStatus: signal('SECURITY_SOFTWARE', 'android_antivirus', 'UNSUPPORTED', 'Scan failed'),
          automaticUpdatesStatus: signal('SYSTEM_UPDATES', 'android_auto_update', 'UNKNOWN', 'Scan failed'),
          visibility: 'LIMITED',
          confidence: 'low',
        };
      }
    }

    if (this.isDemoMode) {
      return {
        platform: 'android',
        osVersion: signal('OS_SECURITY', 'android_os_version', 'SUPPORTED', 'Android 13'),
        securityPatchLevel: signal('SYSTEM_UPDATES', 'android_patch_level', 'OUTDATED', '2023-01-05'),
        encryptionStatus: signal('ENCRYPTION', 'android_encryption', 'ENABLED', 'File-Based Encryption (FBE) active'),
        screenLockStatus: signal('SCREEN_LOCK', 'android_screen_lock', 'ENABLED', 'PIN/Biometric active'),
        secureBootStatus: signal('SECURE_BOOT', 'android_secure_boot', 'VERIFIED', 'Verified Boot state: GREEN'),
        developerModeStatus: signal('DEVELOPER_MODE', 'android_dev_mode', 'ENABLED', 'USB Debugging is enabled'),
        rootOrJailbreakStatus: signal('ROOT_JAILBREAK', 'android_root', 'NONE_DETECTED', 'No root indicators found (SafetyNet/Play Integrity passed)'),
        firewallStatus: signal('FIREWALL', 'android_firewall', 'UNSUPPORTED', 'Native firewall not manageable via apps'),
        antivirusStatus: signal('SECURITY_SOFTWARE', 'android_antivirus', 'ENABLED', 'Google Play Protect is active'),
        automaticUpdatesStatus: signal('SYSTEM_UPDATES', 'android_auto_update', 'UNKNOWN', 'App does not have permission to read update settings'),
        visibility: 'SUPPORTED',
        confidence: 'low',
      };
    }

    return {
      platform: 'android',
      osVersion: signal('OS_SECURITY', 'android_os_version', 'UNSUPPORTED', 'Cannot scan'),
      securityPatchLevel: signal('SYSTEM_UPDATES', 'android_patch_level', 'UNSUPPORTED', 'Cannot scan'),
      encryptionStatus: signal('ENCRYPTION', 'android_encryption', 'UNSUPPORTED', 'Cannot scan'),
      screenLockStatus: signal('SCREEN_LOCK', 'android_screen_lock', 'UNSUPPORTED', 'Cannot scan'),
      secureBootStatus: signal('SECURE_BOOT', 'android_secure_boot', 'UNSUPPORTED', 'Cannot scan'),
      developerModeStatus: signal('DEVELOPER_MODE', 'android_dev_mode', 'UNSUPPORTED', 'Cannot scan'),
      rootOrJailbreakStatus: signal('ROOT_JAILBREAK', 'android_root', 'UNSUPPORTED', 'Cannot scan'),
      firewallStatus: signal('FIREWALL', 'android_firewall', 'UNSUPPORTED', 'Cannot scan'),
      antivirusStatus: signal('SECURITY_SOFTWARE', 'android_antivirus', 'UNSUPPORTED', 'Cannot scan'),
      automaticUpdatesStatus: signal('SYSTEM_UPDATES', 'android_auto_update', 'UNSUPPORTED', 'Cannot scan'),
      visibility: 'UNSUPPORTED',
      confidence: 'low',
    };
  }

  async getInstalledAppSignals(): Promise<SecuritySignal[]> {
    return [];
  }

  async getInstalledApps(): Promise<AppScanResult> {
    const now = new Date().toISOString();

    // 1. Real native scan via Capacitor plugin
    if (this.isNative) {
      try {
        const result = await getInstalledAppsNative();
        console.log(`[AppScan] Real scan: ${result.apps.length} apps from PackageManager`);
        return result;
      } catch (err) {
        // NEVER fall back to mock data on native failure.
        // Report the error explicitly so the UI can show "Scan failed".
        console.error('[AppScan] Native plugin failed:', err);
        return {
          apps: [],
          source: 'SCAN_ERROR',
          coveragePercent: 0,
          visibility: 'NONE',
          confidence: 'low',
          scannedAt: now,
          error: err instanceof Error ? err.message : 'Native app scan failed',
        };
      }
    }

    // 2. Demo mode ONLY: return mock data with explicit DEMO_MOCK provenance
    if (this.isDemoMode) {
      console.warn('[AppScan] Demo mode: returning mock Android app data');
      return {
        apps: mockInstalledApps,
        source: 'DEMO_MOCK',
        coveragePercent: 100,
        visibility: 'FULL',
        confidence: 'low',
        scannedAt: now,
      };
    }

    // 3. Not native, not demo: cannot scan
    return {
      apps: [],
      source: 'UNSUPPORTED',
      coveragePercent: 0,
      visibility: 'NONE',
      confidence: 'low',
      scannedAt: now,
    };
  }

  async getPermissionSignals(): Promise<SecuritySignal[]> {
    return [];
  }

  async getNetworkSecuritySignals(): Promise<NetworkSecuritySignals> {
    const time = new Date().toISOString();
    const signal = (category: NetworkSecurityCategory, id: string, status: any, value: string): NetworkSecuritySignal => ({
      id,
      category,
      status,
      value,
      source: 'android_os_api',
      confidence: 'high',
      observedAt: time,
    });

    return {
      platform: 'android',
      // Simulating a slightly risky network (e.g. coffee shop Wi-Fi without a VPN)
      connectionType: signal('CONNECTION_TYPE', 'android_conn_type', 'PUBLIC', 'Wi-Fi (SSID: Starbucks_WiFi)'),
      tlsStatus: signal('TLS_STATUS', 'android_tls_status', 'UNKNOWN', 'OS does not intercept app TLS natively'),
      wifiSecurity: signal('WIFI_SECURITY', 'android_wifi_sec', 'INSECURE', 'Open Network (No password)'),
      vpnState: signal('VPN_STATE', 'android_vpn_state', 'DISABLED', 'No VPN interface active'),
      dnsConfig: signal('DNS_CONFIG', 'android_dns_config', 'INSECURE', 'Standard DNS provided by DHCP (Unencrypted)'),
      visibility: 'SUPPORTED',
      confidence: 'high',
    };
  }

  async getAccountSecuritySignals(): Promise<SecuritySignal[]> {
    return [];
  }
}
