import { registerPlugin } from '@capacitor/core';

export interface NativeNetworkSignalsResponse {
  isVpnActive: boolean;
  isProxySet: boolean;
  isMetered: boolean;
  proxyHost: string;
  isWifiConnected: boolean;
  isCaptivePortal: boolean;
  isOpenNetwork: boolean;
  deviceCount?: number;
  ipAddress?: string;
  bssid?: string;
  ssid?: string;
}

export interface SentinelNetworkScannerPlugin {
  getNetworkSignals(options: { sessionId: string }): Promise<NativeNetworkSignalsResponse>;
  checkPermissions(): Promise<{ location: string, network: string, wifi: string }>;
  requestPermissions(): Promise<{ location: string, network: string, wifi: string }>;
}

export const SentinelNetworkScanner = registerPlugin<SentinelNetworkScannerPlugin>('SentinelNetworkScanner', {
  web: () => import('./NetworkScannerWeb').then(m => new m.NetworkScannerWeb()),
});
