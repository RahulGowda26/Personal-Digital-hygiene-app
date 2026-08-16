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
import { getInstalledAppsNative } from './capacitor/AppScannerBridge';
import { getDeviceSignalsNative } from './capacitor/DeviceScannerBridge';
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


  getCapabilities(): SecurityCapability[] {
    return [
      { platform: 'android', capability: 'account_security', status: 'supported' },
      { platform: 'android', capability: 'password_hygiene', status: 'supported' },
      { platform: 'android', capability: 'app_security', status: 'supported' },
      { platform: 'android', capability: 'privacy', status: 'supported' },
      { platform: 'android', capability: 'breach_check', status: 'supported' },
      { platform: 'android', capability: 'threat_simulation', status: 'supported' },
      { platform: 'android', capability: 'device_security', status: this.isNative ? 'supported' : 'unsupported' },
      { platform: 'android', capability: 'network_security', status: this.isNative ? 'supported' : 'unsupported' },
    ];
  }

  async getDeviceSecuritySignals(sessionId?: string): Promise<DeviceSecuritySignals> {
    const time = new Date().toISOString();
    const signal = (category: DeviceSecurityCategory, id: string, status: any, value: string): DeviceSecuritySignal => ({
      id,
      category,
      status,
      value,
      source: this.isNative ? 'ANDROID_SYSTEM' : 'UNSUPPORTED',
      confidence: this.isNative ? 'high' : 'low',
      observedAt: time,
    });

    if (this.isNative) {
      try {
        const sid = sessionId || 'unknown';
        const nativeResult = await getDeviceSignalsNative(sid);
        
        return {
          platform: 'android',
          osVersion: signal('OS_SECURITY', 'android_os_version', 'SUPPORTED', nativeResult.osVersion),
          securityPatchLevel: signal('SYSTEM_UPDATES', 'android_patch_level', 'SUPPORTED', nativeResult.securityPatch),
          encryptionStatus: signal('ENCRYPTION', 'android_encryption', nativeResult.isEncrypted ? 'SUPPORTED' : 'UNSUPPORTED', nativeResult.isEncrypted ? 'Encrypted' : 'Unencrypted'),
          screenLockStatus: signal('SCREEN_LOCK', 'android_screen_lock', nativeResult.isDeviceSecure ? 'SUPPORTED' : 'UNSUPPORTED', nativeResult.isDeviceSecure ? 'Secure' : 'Insecure'),
          secureBootStatus: signal('SECURE_BOOT', 'android_secure_boot', 'UNKNOWN', 'Cannot verify natively via this API'),
          developerModeStatus: signal('DEVELOPER_MODE', 'android_dev_mode', nativeResult.isDeveloperModeEnabled ? 'UNSUPPORTED' : 'SUPPORTED', nativeResult.isDeveloperModeEnabled ? 'Enabled' : 'Disabled'),
          rootOrJailbreakStatus: signal('ROOT_JAILBREAK', 'android_root', nativeResult.isRooted ? 'UNSUPPORTED' : 'SUPPORTED', nativeResult.isRooted ? 'Rooted/Test-Keys' : 'Clean'),
          firewallStatus: signal('FIREWALL', 'android_firewall', 'UNKNOWN', 'OS does not expose firewall natively'),
          antivirusStatus: signal('SECURITY_SOFTWARE', 'android_antivirus', 'UNKNOWN', 'OS does not expose AV status natively'),
          automaticUpdatesStatus: signal('SYSTEM_UPDATES', 'android_auto_update', 'UNKNOWN', 'Requires privileged access'),
          usbDebuggingStatus: signal('DEVELOPER_MODE', 'android_usb_debug', nativeResult.isUsbDebuggingEnabled ? 'UNSUPPORTED' : 'SUPPORTED', nativeResult.isUsbDebuggingEnabled ? 'Enabled' : 'Disabled'),
          playProtectStatus: signal('SECURITY_SOFTWARE', 'android_play_protect', nativeResult.isPlayProtectEnabled ? 'SUPPORTED' : 'UNSUPPORTED', nativeResult.isPlayProtectEnabled ? 'Enabled' : 'Disabled'),
          unknownSourcesStatus: signal('OS_SECURITY', 'android_unknown_sources', nativeResult.unknownSourcesEnabled ? 'UNSUPPORTED' : 'SUPPORTED', nativeResult.unknownSourcesEnabled ? 'Enabled' : 'Disabled'),
          accessibilityServicesStatus: signal('ACCESSIBILITY_SERVICES', 'android_accessibility', nativeResult.enabledAccessibilityServices.length > 0 ? 'UNKNOWN' : 'SUPPORTED', `${nativeResult.enabledAccessibilityServices.length} active`),
          deviceAdminsStatus: signal('DEVICE_ADMINS', 'android_device_admins', nativeResult.activeDeviceAdmins.length > 0 ? 'UNKNOWN' : 'SUPPORTED', `${nativeResult.activeDeviceAdmins.length} active`),
          caCertificatesStatus: signal('CERTIFICATES', 'android_ca_certs', nativeResult.userCerts.length > 0 ? 'UNKNOWN' : 'SUPPORTED', `${nativeResult.userCerts.length} user certs`),
          bootloaderStatus: signal('INTEGRITY_CHECK', 'android_bootloader', nativeResult.isBootloaderUnlocked ? 'UNSUPPORTED' : 'SUPPORTED', nativeResult.isBootloaderUnlocked ? 'Unlocked' : 'Locked'),
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
          usbDebuggingStatus: signal('DEVELOPER_MODE', 'android_usb_debug', 'UNKNOWN', 'Scan failed'),
          playProtectStatus: signal('SECURITY_SOFTWARE', 'android_play_protect', 'UNKNOWN', 'Scan failed'),
          unknownSourcesStatus: signal('OS_SECURITY', 'android_unknown_sources', 'UNKNOWN', 'Scan failed'),
          accessibilityServicesStatus: signal('ACCESSIBILITY_SERVICES', 'android_accessibility', 'UNKNOWN', 'Scan failed'),
          deviceAdminsStatus: signal('DEVICE_ADMINS', 'android_device_admins', 'UNKNOWN', 'Scan failed'),
          caCertificatesStatus: signal('CERTIFICATES', 'android_ca_certs', 'UNKNOWN', 'Scan failed'),
          bootloaderStatus: signal('INTEGRITY_CHECK', 'android_bootloader', 'UNKNOWN', 'Scan failed'),
          visibility: 'LIMITED',
          confidence: 'low',
        };
      }
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
      usbDebuggingStatus: signal('DEVELOPER_MODE', 'android_usb_debug', 'UNSUPPORTED', 'Cannot scan'),
      playProtectStatus: signal('SECURITY_SOFTWARE', 'android_play_protect', 'UNSUPPORTED', 'Cannot scan'),
      unknownSourcesStatus: signal('OS_SECURITY', 'android_unknown_sources', 'UNSUPPORTED', 'Cannot scan'),
      accessibilityServicesStatus: signal('ACCESSIBILITY_SERVICES', 'android_accessibility', 'UNSUPPORTED', 'Cannot scan'),
      deviceAdminsStatus: signal('DEVICE_ADMINS', 'android_device_admins', 'UNSUPPORTED', 'Cannot scan'),
      caCertificatesStatus: signal('CERTIFICATES', 'android_ca_certs', 'UNSUPPORTED', 'Cannot scan'),
      bootloaderStatus: signal('INTEGRITY_CHECK', 'android_bootloader', 'UNSUPPORTED', 'Cannot scan'),
      visibility: 'UNSUPPORTED',
      confidence: 'low',
    };
  }

  async getInstalledAppSignals(): Promise<SecuritySignal[]> {
    return [];
  }

  async getInstalledApps(sessionId?: string): Promise<AppScanResult> {
    const now = new Date().toISOString();

    // 1. Real native scan via Capacitor plugin
    if (this.isNative) {
      try {
        const sid = sessionId || 'unknown';
        const result = await getInstalledAppsNative(sid);
        console.log(`[AppScan] Real scan: ${result.apps.length} apps from PackageManager`);
        return result;
      } catch (err) {
        // NEVER fall back to mock data on native failure.
        // Report the error explicitly so the UI can show "Scan failed".
        console.error('[AppScan] Native plugin failed:', err);
        return {
          apps: [],
          source: 'SCAN_ERROR',
          totalPackagesDetected: 0,
          userInstalledApps: 0,
          systemApps: 0,
          vendorApps: 0,
          analyzedApps: 0,
          skippedApps: 0,
          skipReasons: [],
          coveragePercent: 0,
          visibility: 'NONE',
          confidence: 'low',
          scannedAt: now,
          error: err instanceof Error ? err.message : 'Native app scan failed',
        };
      }
    }

    // 2. Return unsupported explicitly if not native
    return {
      apps: [],
      source: 'UNSUPPORTED',
      totalPackagesDetected: 0,
      userInstalledApps: 0,
      systemApps: 0,
      vendorApps: 0,
      analyzedApps: 0,
      skippedApps: 0,
      skipReasons: [],
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
      connectionType: signal('CONNECTION_TYPE', 'android_conn_type', 'UNSUPPORTED', 'Native scan not implemented'),
      tlsStatus: signal('TLS_STATUS', 'android_tls_status', 'UNSUPPORTED', 'Native scan not implemented'),
      wifiSecurity: signal('WIFI_SECURITY', 'android_wifi_sec', 'UNSUPPORTED', 'Native scan not implemented'),
      vpnState: signal('VPN_STATE', 'android_vpn_state', 'UNSUPPORTED', 'Native scan not implemented'),
      dnsConfig: signal('DNS_CONFIG', 'android_dns_config', 'UNSUPPORTED', 'Native scan not implemented'),
      visibility: 'UNSUPPORTED',
      confidence: 'low',
    };
  }

  async getAccountSecuritySignals(): Promise<SecuritySignal[]> {
    return [];
  }
}
