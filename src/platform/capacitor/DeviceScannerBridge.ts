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
}

export interface SentinelDeviceScannerPlugin {
  /**
   * Returns security signals for the current device.
   * Runs entirely on-device.
   */
  getDeviceSignals(): Promise<NativeDeviceSignalsResponse>;
}

export const SentinelDeviceScanner = registerPlugin<SentinelDeviceScannerPlugin>('SentinelDeviceScanner', {
  web: () => import('./DeviceScannerWeb').then(m => new m.DeviceScannerWeb()),
});
