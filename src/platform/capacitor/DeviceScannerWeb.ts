import { WebPlugin } from '@capacitor/core';
import type { SentinelDeviceScannerPlugin, NativeDeviceSignalsResponse } from './DeviceScannerBridge';

export class DeviceScannerWeb extends WebPlugin implements SentinelDeviceScannerPlugin {
  async getDeviceSignals(): Promise<NativeDeviceSignalsResponse> {
    throw this.unimplemented('Device scanning is only available on native platforms.');
  }

  async isUnknownSourcesEnabled(): Promise<{ enabled: boolean }> {
    return { enabled: false };
  }
}
