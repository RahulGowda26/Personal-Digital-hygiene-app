import { registerPlugin } from '@capacitor/core';

export interface NativeDeviceSignalsResponse {
  osVersion: string;
  sdkInt: number;
  securityPatch: string;
  isDeviceSecure: boolean;
  isDeveloperModeEnabled: boolean;
  unknownSourcesEnabled: boolean;
  isRooted: boolean;
  isEncrypted: boolean;
  isUsbDebuggingEnabled: boolean;
  isPlayProtectEnabled: boolean;
  enabledAccessibilityServices: string[];
  activeDeviceAdmins: string[];
  isVpnActive: boolean;
  userCerts: string[];
  isBootloaderUnlocked: boolean;
}

export interface SentinelDeviceScannerPlugin {
  /**
   * Returns security signals for the current device.
   * Runs entirely on-device.
   */
  getDeviceSignals(options: { sessionId: string }): Promise<NativeDeviceSignalsResponse>;
}

export const SentinelDeviceScanner = registerPlugin<SentinelDeviceScannerPlugin>('SentinelDeviceScanner', {
  web: () => import('./DeviceScannerWeb').then(m => new m.DeviceScannerWeb()),
});

export async function getDeviceSignalsNative(sessionId: string): Promise<NativeDeviceSignalsResponse> {
  const result = await SentinelDeviceScanner.getDeviceSignals({ sessionId });
  return result;
}
