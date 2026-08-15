import { WebPlugin } from '@capacitor/core';
import type { SentinelNetworkScannerPlugin, NativeNetworkSignalsResponse } from './NetworkScannerBridge';

export class NetworkScannerWeb extends WebPlugin implements SentinelNetworkScannerPlugin {
  async getNetworkSignals(options: { sessionId: string }): Promise<NativeNetworkSignalsResponse> {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      console.log('Using Electron API for network signals');
      return await (window as any).electronAPI.getNetworkSignals();
    }

    console.log('Mock getNetworkSignals', options);
    return {
      isVpnActive: false,
      isProxySet: false,
      isMetered: false,
      proxyHost: '',
      isWifiConnected: true,
      isCaptivePortal: false,
      isOpenNetwork: false,
      ssid: 'Mock WiFi',
      ipAddress: '192.168.1.100',
      bssid: '00:11:22:33:44:55',
      deviceCount: 4
    };
  }

  async checkPermissions(): Promise<{ location: string, network: string, wifi: string }> {
    return { location: 'granted', network: 'granted', wifi: 'granted' };
  }

  async requestPermissions(): Promise<{ location: string, network: string, wifi: string }> {
    return { location: 'granted', network: 'granted', wifi: 'granted' };
  }
}
