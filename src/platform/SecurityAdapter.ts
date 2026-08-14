import type { PlatformId, SecurityAdapter as ISecurityAdapter } from '@/types';
import { WebSecurityAdapter } from './WebSecurityAdapter';
import { AndroidSecurityAdapter } from './AndroidSecurityAdapter';
import { Capacitor } from '@capacitor/core';

const adapterMap: Partial<Record<PlatformId, () => ISecurityAdapter>> = {
  web: () => new WebSecurityAdapter(),
  android: () => new AndroidSecurityAdapter(),
};

let currentAdapter: ISecurityAdapter | null = null;

export function detectPlatform(): PlatformId {
  // Demo mode override for development/testing
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    return 'android';
  }

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

export function getSecurityAdapter(): ISecurityAdapter {
  if (currentAdapter) return currentAdapter;
  const platform = detectPlatform();
  const factory = adapterMap[platform] ?? adapterMap.web;
  if (!factory) throw new Error(`No security adapter for platform: ${platform}`);
  currentAdapter = factory();
  return currentAdapter;
}

export function resetSecurityAdapter(): void {
  currentAdapter = null;
}

export type { ISecurityAdapter };

