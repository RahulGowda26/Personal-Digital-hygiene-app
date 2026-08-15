import { DeviceIntegrityResult, SecurityConfigurationResult, NormalizedEvidence } from '@/types';

export class DeterministicRuleEngine {
  /**
   * Evaluates raw telemetry and produces a normalized evidence object containing flags
   * that represent objective security conditions.
   */
  evaluateDeviceIntegrity(integrity: DeviceIntegrityResult, config: SecurityConfigurationResult, network: any): NormalizedEvidence {
    const rawFlags: string[] = [];

    if (integrity.status !== 'error' && integrity.status !== 'not_available') {
      if (integrity.issues.includes('Root indicators found')) {
        rawFlags.push('ROOT_DETECTED');
      }
      if (integrity.issues.includes('Developer mode active')) {
        rawFlags.push('DEV_MODE_ACTIVE');
      }
    }

    if (config.status !== 'error' && config.status !== 'not_available') {
      if (!config.screenLockSecured) {
        rawFlags.push('NO_SCREEN_LOCK');
      }
      if (!config.storageEncrypted) {
        rawFlags.push('STORAGE_UNENCRYPTED');
      }
    }

    if (network && network.status !== 'error' && network.status !== 'not_available') {
      if (network.isVpnActive) {
        rawFlags.push('VPN_ACTIVE');
      }
      if (network.isProxySet) {
        rawFlags.push('PROXY_DETECTED');
      }
      if (network.isCaptivePortal) {
        rawFlags.push('CAPTIVE_PORTAL_DETECTED');
      }
      if (network.isOpenNetwork) {
        rawFlags.push('UNENCRYPTED_WIFI');
      }
    }

    return {
      rawFlags
    };
  }

  evaluateAppPermissions(requestedPermissions: string[]): NormalizedEvidence {
    const rawFlags: string[] = [];

    // Simple heuristic for permission combinations
    if (requestedPermissions.includes('android.permission.READ_SMS') && 
        requestedPermissions.includes('android.permission.INTERNET')) {
      rawFlags.push('DANGEROUS_PERMISSION_COMBO');
    }

    return { rawFlags };
  }
}
