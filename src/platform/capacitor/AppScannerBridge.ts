/**
 * AppScannerBridge — TypeScript interface to the native SentinelAppScanner
 * Capacitor plugin.
 *
 * On a real Android device running inside the Capacitor shell, this calls
 * the Kotlin plugin which queries Android's PackageManager.
 *
 * In a browser or when Capacitor is unavailable, callers should catch errors
 * and fall back gracefully (not to mock data).
 */
import { registerPlugin } from '@capacitor/core';
import type { AppMetadata, AppScanResult } from '@/types';

export interface NativeAppScanResponse {
  apps: AppMetadata[];
  totalPackagesDetected: number;
  userInstalledApps: number;
  systemApps: number;
  vendorApps: number;
  analyzedApps: number;
  skippedApps: number;
  skipReasons: string[];
  visibilityRestricted: boolean;
}

export interface SentinelAppScannerPlugin {
  /**
   * Returns metadata for all user-installed (non-system) packages.
   * Runs entirely on-device — no data leaves the phone.
   */
  getInstalledPackages(options: { sessionId: string }): Promise<NativeAppScanResponse>;
}

const SentinelAppScanner = registerPlugin<SentinelAppScannerPlugin>('SentinelAppScanner');

/**
 * Fetch real installed-app metadata from the native Android layer.
 * Returns a full AppScanResult with provenance, coverage, and visibility.
 * Throws if Capacitor is not available or the plugin is not registered.
 */
export async function getInstalledAppsNative(sessionId: string): Promise<AppScanResult> {
  const result = await SentinelAppScanner.getInstalledPackages({ sessionId });
  
  const coveragePercent = result.totalPackagesDetected > 0
    ? Math.round((result.apps.length / result.totalPackagesDetected) * 100)
    : 100;

  return {
    apps: result.apps,
    source: 'ANDROID_PACKAGE_MANAGER',
    totalPackagesDetected: result.totalPackagesDetected,
    userInstalledApps: result.userInstalledApps,
    systemApps: result.systemApps,
    vendorApps: result.vendorApps,
    analyzedApps: result.analyzedApps,
    skippedApps: result.skippedApps,
    skipReasons: result.skipReasons,
    coveragePercent,
    visibility: result.visibilityRestricted ? 'LIMITED' : 'FULL',
    confidence: result.visibilityRestricted ? 'medium' : 'high',
    scannedAt: new Date().toISOString(),
  };
}
