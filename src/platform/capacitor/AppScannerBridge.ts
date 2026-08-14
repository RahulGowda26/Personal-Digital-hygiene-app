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
  /** Total number of packages the OS reported (before filtering). */
  totalPackagesReported: number;
  /** Whether visibility was restricted by the OS. */
  visibilityRestricted: boolean;
}

export interface SentinelAppScannerPlugin {
  /**
   * Returns metadata for all user-installed (non-system) packages.
   * Runs entirely on-device — no data leaves the phone.
   */
  getInstalledPackages(): Promise<NativeAppScanResponse>;
}

const SentinelAppScanner = registerPlugin<SentinelAppScannerPlugin>('SentinelAppScanner');

/**
 * Fetch real installed-app metadata from the native Android layer.
 * Returns a full AppScanResult with provenance, coverage, and visibility.
 * Throws if Capacitor is not available or the plugin is not registered.
 */
export async function getInstalledAppsNative(): Promise<AppScanResult> {
  const result = await SentinelAppScanner.getInstalledPackages();
  
  const coveragePercent = result.totalPackagesReported > 0
    ? Math.round((result.apps.length / result.totalPackagesReported) * 100)
    : 100;

  return {
    apps: result.apps,
    source: 'ANDROID_PACKAGE_MANAGER',
    totalPackagesReported: result.totalPackagesReported,
    coveragePercent,
    visibility: result.visibilityRestricted ? 'LIMITED' : 'FULL',
    confidence: result.visibilityRestricted ? 'medium' : 'high',
    scannedAt: new Date().toISOString(),
  };
}
