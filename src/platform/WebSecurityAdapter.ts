import type { SecurityAdapter, DeviceSecuritySignals, AppScanResult, PlatformId, NetworkSecuritySignals } from '@/types';

const defaultDeviceSignal = (category: string) => ({
  id: '',
  category: category as any,
  status: 'UNKNOWN' as const,
  value: '',
  source: 'web',
  confidence: 'low' as const,
  observedAt: ''
});

/**
 * WebSecurityAdapter is a fallback for testing in the browser.
 */
export class WebSecurityAdapter implements SecurityAdapter {
  readonly platform: PlatformId = 'web';

  async getDeviceSecuritySignals(): Promise<DeviceSecuritySignals> {
    return {
      platform: 'web',
      osVersion: defaultDeviceSignal('OS_VERSION'),
      securityPatchLevel: defaultDeviceSignal('PATCH_LEVEL'),
      encryptionStatus: defaultDeviceSignal('ENCRYPTION'),
      screenLockStatus: defaultDeviceSignal('SCREEN_LOCK'),
      secureBootStatus: defaultDeviceSignal('SECURE_BOOT'),
      developerModeStatus: defaultDeviceSignal('DEVELOPER_MODE'),
      rootOrJailbreakStatus: defaultDeviceSignal('ROOT_JAILBREAK'),
      firewallStatus: defaultDeviceSignal('FIREWALL'),
      antivirusStatus: defaultDeviceSignal('ANTIVIRUS'),
      automaticUpdatesStatus: defaultDeviceSignal('AUTO_UPDATES'),
      visibility: 'UNSUPPORTED',
      confidence: 'low'
    };
  }

  async getNetworkSecuritySignals(): Promise<NetworkSecuritySignals> {
    return {
      platform: 'web',
      connectionType: { id: '', category: 'CONNECTION_TYPE', status: 'UNKNOWN', value: '', source: 'web', confidence: 'low', observedAt: '' },
      tlsStatus: { id: '', category: 'TLS_STATUS', status: 'UNKNOWN', value: '', source: 'web', confidence: 'low', observedAt: '' },
      wifiSecurity: { id: '', category: 'WIFI_SECURITY', status: 'UNKNOWN', value: '', source: 'web', confidence: 'low', observedAt: '' },
      vpnState: { id: '', category: 'VPN_STATE', status: 'UNKNOWN', value: '', source: 'web', confidence: 'low', observedAt: '' },
      dnsConfig: { id: '', category: 'DNS_CONFIG', status: 'UNKNOWN', value: '', source: 'web', confidence: 'low', observedAt: '' },
      visibility: 'UNSUPPORTED',
      confidence: 'low'
    };
  }

  async getInstalledApps(): Promise<AppScanResult> {
    return {
      apps: [],
      source: 'UNSUPPORTED',
      coveragePercent: 0,
      visibility: 'LIMITED',
      confidence: 'low',
      scannedAt: new Date().toISOString()
    };
  }

  async getInstalledAppSignals() { return []; }
  async getPermissionSignals() { return []; }
  async getAccountSecuritySignals() { return []; }
  getCapabilities() { return []; }
}
