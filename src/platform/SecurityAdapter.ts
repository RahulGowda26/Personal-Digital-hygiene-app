import type { PlatformId, SecurityAdapter as ISecurityAdapter } from '@/types';
import { AndroidSecurityAdapter } from './AndroidSecurityAdapter';
import { Capacitor } from '@capacitor/core';

const adapterMap: Partial<Record<PlatformId, () => ISecurityAdapter>> = {
  android: () => new AndroidSecurityAdapter(),
};

let currentAdapter: ISecurityAdapter | null = null;

export function detectPlatform(): PlatformId {

  // Capacitor native detection (actual device)
  try {
    if (Capacitor.isNativePlatform()) {
      const platform = Capacitor.getPlatform();
      if (platform === 'android') return 'android';
      if (platform === 'ios') return 'ios';
    }
  } catch {
    // Capacitor not available (plain browser) — fall through
  }

  if (typeof navigator === 'undefined') return 'web';
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('android')) return 'android';
  if (ua.includes('iphone') || ua.includes('ipad')) return 'ios';
  if (ua.includes('win')) return 'windows';
  if (ua.includes('mac')) return 'macos';
  if (ua.includes('linux')) return 'linux';
  return 'web';
}

class DummySecurityAdapter implements ISecurityAdapter {
  platform: PlatformId = 'web';
  
  private isElectron(): boolean {
    return typeof window !== 'undefined' && !!(window as any).electronAPI;
  }

  async getDeviceSecuritySignals() {
    return {
      platform: this.platform,
      osVersion: { id: '', category: 'OS_SECURITY' as any, status: 'UNSUPPORTED' as any, value: '', source: '', confidence: 'low' as any, observedAt: '' },
      securityPatchLevel: { id: '', category: 'OS_SECURITY' as any, status: 'UNSUPPORTED' as any, value: '', source: '', confidence: 'low' as any, observedAt: '' },
      encryptionStatus: { id: '', category: 'ENCRYPTION' as any, status: 'UNSUPPORTED' as any, value: '', source: '', confidence: 'low' as any, observedAt: '' },
      screenLockStatus: { id: '', category: 'SCREEN_LOCK' as any, status: 'UNSUPPORTED' as any, value: '', source: '', confidence: 'low' as any, observedAt: '' },
      secureBootStatus: { id: '', category: 'SECURE_BOOT' as any, status: 'UNSUPPORTED' as any, value: '', source: '', confidence: 'low' as any, observedAt: '' },
      developerModeStatus: { id: '', category: 'DEVELOPER_MODE' as any, status: 'UNSUPPORTED' as any, value: '', source: '', confidence: 'low' as any, observedAt: '' },
      rootOrJailbreakStatus: { id: '', category: 'ROOT_JAILBREAK' as any, status: 'UNSUPPORTED' as any, value: '', source: '', confidence: 'low' as any, observedAt: '' },
      firewallStatus: { id: '', category: 'FIREWALL' as any, status: 'UNSUPPORTED' as any, value: '', source: '', confidence: 'low' as any, observedAt: '' },
      antivirusStatus: { id: '', category: 'SECURITY_SOFTWARE' as any, status: 'UNSUPPORTED' as any, value: '', source: '', confidence: 'low' as any, observedAt: '' },
      automaticUpdatesStatus: { id: '', category: 'SYSTEM_UPDATES' as any, status: 'UNSUPPORTED' as any, value: '', source: '', confidence: 'low' as any, observedAt: '' },
      usbDebuggingStatus: { id: '', category: 'DEVELOPER_MODE' as any, status: 'UNSUPPORTED' as any, value: '', source: '', confidence: 'low' as any, observedAt: '' },
      playProtectStatus: { id: '', category: 'SECURITY_SOFTWARE' as any, status: 'UNSUPPORTED' as any, value: '', source: '', confidence: 'low' as any, observedAt: '' },
      unknownSourcesStatus: { id: '', category: 'SYSTEM_UPDATES' as any, status: 'UNSUPPORTED' as any, value: '', source: '', confidence: 'low' as any, observedAt: '' },
      accessibilityServicesStatus: { id: '', category: 'OS_SECURITY' as any, status: 'UNSUPPORTED' as any, value: '', source: '', confidence: 'low' as any, observedAt: '' },
      deviceAdminStatus: { id: '', category: 'OS_SECURITY' as any, status: 'UNSUPPORTED' as any, value: '', source: '', confidence: 'low' as any, observedAt: '' },
      bootloaderStatus: { id: '', category: 'SECURE_BOOT' as any, status: 'UNSUPPORTED' as any, value: '', source: '', confidence: 'low' as any, observedAt: '' },
      systemTamperStatus: { id: '', category: 'ROOT_JAILBREAK' as any, status: 'UNSUPPORTED' as any, value: '', source: '', confidence: 'low' as any, observedAt: '' },
      visibility: 'UNSUPPORTED' as any,
      confidence: 'low' as any
    } as any;
  }
  async getNetworkSecuritySignals(): Promise<any> {
    const isElectronEnv = this.isElectron();
    return {
      platform: this.platform,
      connectionType: { id: '', category: 'CONNECTION_TYPE' as any, status: isElectronEnv ? 'SUPPORTED' : 'UNSUPPORTED' as any, value: '', source: '', confidence: 'low' as any, observedAt: '' },
      tlsStatus: { id: '', category: 'TLS_STATUS' as any, status: 'UNSUPPORTED' as any, value: '', source: '', confidence: 'low' as any, observedAt: '' },
      wifiSecurity: { id: '', category: 'WIFI_SECURITY' as any, status: isElectronEnv ? 'SUPPORTED' : 'UNSUPPORTED' as any, value: '', source: '', confidence: 'low' as any, observedAt: '' },
      vpnState: { id: '', category: 'VPN_STATE' as any, status: isElectronEnv ? 'SUPPORTED' : 'UNSUPPORTED' as any, value: '', source: '', confidence: 'low' as any, observedAt: '' },
      dnsConfig: { id: '', category: 'DNS_CONFIG' as any, status: 'UNSUPPORTED' as any, value: '', source: '', confidence: 'low' as any, observedAt: '' },
      visibility: isElectronEnv ? 'SUPPORTED' : 'UNSUPPORTED' as any,
      confidence: isElectronEnv ? 'high' : 'low' as any
    } as any;
  }
  async getInstalledAppSignals(): Promise<any> { return []; }
  async getPermissionSignals(): Promise<any> { return []; }
  async getAccountSecuritySignals(): Promise<any> { return []; }
  async getInstalledApps(): Promise<any> { 
    if (this.isElectron() && typeof (window as any).electronAPI.scanApps === 'function') {
      const apps = await (window as any).electronAPI.scanApps();
      const formattedApps = apps.map((app: any) => ({
        packageName: app.packageName,
        appName: app.appName,
        versionName: app.versionName,
        versionCode: app.versionCode || 0,
        isSystemApp: app.isSystemApp,
        isVendorApp: app.isVendorApp,
        isUserApp: app.isUserApp,
        isEnabled: true,
        requestedPermissions: app.requestedPermissions || [],
        grantedPermissions: app.grantedPermissions || [],
        targetSdkVersion: app.targetSdkVersion,
        installSource: app.installSource,
      }));

      return {
        apps: formattedApps,
        source: 'ANDROID_PACKAGE_MANAGER',
        totalPackagesDetected: apps.length,
        userInstalledApps: apps.length,
        systemApps: 0,
        vendorApps: 0,
        analyzedApps: apps.length,
        skippedApps: 0,
        skipReasons: [],
        coveragePercent: 100,
        visibility: 'FULL',
        confidence: 'high',
        scannedAt: new Date().toISOString(),
      };
    }
    return null; 
  }
  getCapabilities(): any { 
    if (this.isElectron()) {
      return [
        { capability: 'app_security', status: 'supported', platform: this.platform },
        { capability: 'device_security', status: 'supported', platform: this.platform },
        { capability: 'network_security', status: 'supported', platform: this.platform }
      ];
    }
    return []; 
  }
}

export function getSecurityAdapter(): ISecurityAdapter {
  if (currentAdapter) return currentAdapter;
  const platform = detectPlatform();
  const factory = adapterMap[platform];
  if (!factory) {
    currentAdapter = new DummySecurityAdapter();
    return currentAdapter;
  }
  currentAdapter = factory();
  return currentAdapter;
}

export function resetSecurityAdapter(): void {
  currentAdapter = null;
}

export type { ISecurityAdapter };

