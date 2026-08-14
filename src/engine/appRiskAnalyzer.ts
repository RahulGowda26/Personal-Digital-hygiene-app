import type { AppMetadata, AppRiskFinding, Severity, Confidence } from '@/types';

/**
 * App Risk Analyzer — evidence-based, local-only analysis.
 *
 * This analyzer runs entirely on the device. It inspects app metadata
 * (permissions, install source, target SDK) and produces findings with
 * severity, confidence, and evidence. It does NOT perform malware
 * signature matching — that is a separate concern.
 *
 * Privacy: The raw AppMetadata[] never leaves the device. Only the
 * resulting AppRiskFinding[] (normalized security findings) are
 * transmitted to the backend.
 */

// Dangerous permission groups for evidence collection
const DANGEROUS_PERMISSIONS: Record<string, string> = {
  'android.permission.SYSTEM_ALERT_WINDOW': 'Can draw overlays on top of other apps',
  'android.permission.BIND_ACCESSIBILITY_SERVICE': 'Accessibility services can read screen content and perform actions',
  'android.permission.READ_SMS': 'Can read SMS messages',
  'android.permission.RECEIVE_SMS': 'Can intercept incoming SMS messages',
  'android.permission.SEND_SMS': 'Can send SMS messages (potential financial risk)',
  'android.permission.READ_CALL_LOG': 'Can read call history',
  'android.permission.READ_CONTACTS': 'Can read all contacts',
  'android.permission.RECORD_AUDIO': 'Can record audio via microphone',
  'android.permission.CAMERA': 'Can access device camera',
  'android.permission.ACCESS_FINE_LOCATION': 'Can access precise GPS location',
  'android.permission.READ_EXTERNAL_STORAGE': 'Can read files on shared storage',
  'android.permission.WRITE_EXTERNAL_STORAGE': 'Can write files on shared storage',
  'android.permission.REQUEST_INSTALL_PACKAGES': 'Can request to install other apps',
  'android.permission.INSTALL_PACKAGES': 'Can silently install other apps',
  'android.permission.READ_PHONE_STATE': 'Can read phone number and device identifiers',
  'android.permission.PROCESS_OUTGOING_CALLS': 'Can monitor or redirect outgoing calls',
  'android.permission.BIND_DEVICE_ADMIN': 'Can act as a device administrator',
  'android.permission.WRITE_SETTINGS': 'Can modify system settings',
  'android.permission.CHANGE_NETWORK_STATE': 'Can change network connectivity state',
};

// Permission combinations that together indicate elevated risk
const RISKY_COMBINATIONS: { permissions: string[]; label: string }[] = [
  {
    permissions: ['android.permission.SYSTEM_ALERT_WINDOW', 'android.permission.BIND_ACCESSIBILITY_SERVICE'],
    label: 'Overlay + Accessibility: can draw fake UIs and interact with real apps underneath',
  },
  {
    permissions: ['android.permission.READ_SMS', 'android.permission.INTERNET'],
    label: 'SMS read + Internet: could exfiltrate SMS verification codes',
  },
  {
    permissions: ['android.permission.RECORD_AUDIO', 'android.permission.ACCESS_FINE_LOCATION', 'android.permission.INTERNET'],
    label: 'Microphone + GPS + Internet: surveillance-capable combination',
  },
  {
    permissions: ['android.permission.REQUEST_INSTALL_PACKAGES', 'android.permission.BIND_ACCESSIBILITY_SERVICE'],
    label: 'Can install apps + Accessibility: could silently install and approve malicious apps',
  },
];

// Known trusted install sources
const TRUSTED_SOURCES = new Set([
  'com.android.vending',        // Google Play Store
  'com.sec.android.app.samsungapps', // Samsung Galaxy Store
  'com.amazon.venezia',         // Amazon Appstore
  'com.huawei.appmarket',       // Huawei AppGallery
]);

// Minimum acceptable target SDK (API 28 = Android 9, introduced runtime permissions v2)
const MIN_ACCEPTABLE_TARGET_SDK = 28;
// Warning threshold for outdated SDK
const OUTDATED_TARGET_SDK = 23;

export function analyzeApps(apps: AppMetadata[]): AppRiskFinding[] {
  const findings: AppRiskFinding[] = [];

  for (const app of apps) {
    // Generally trust system apps — they come from the device manufacturer
    if (app.isSystemApp) continue;

    const evidence: string[] = [];
    let riskScore = 0;

    // 1. Installation source analysis
    const isSideloaded = !app.installSource || !TRUSTED_SOURCES.has(app.installSource);
    if (isSideloaded) {
      evidence.push(`Installation source: ${app.installSource || 'Unknown'} (not a trusted app store)`);
      riskScore += 3;
    }

    // 2. Target SDK analysis
    const isVeryOutdated = app.targetSdkVersion < OUTDATED_TARGET_SDK;
    const isOutdated = app.targetSdkVersion < MIN_ACCEPTABLE_TARGET_SDK;
    if (isVeryOutdated) {
      evidence.push(`Targets Android API ${app.targetSdkVersion} — bypasses runtime permissions entirely`);
      riskScore += 3;
    } else if (isOutdated) {
      evidence.push(`Targets Android API ${app.targetSdkVersion} — lacks modern security controls`);
      riskScore += 1;
    }

    // 3. Individual dangerous permissions
    const dangerousPerms: string[] = [];
    for (const perm of app.requestedPermissions) {
      if (DANGEROUS_PERMISSIONS[perm]) {
        dangerousPerms.push(perm);
      }
    }

    if (dangerousPerms.length > 0) {
      for (const perm of dangerousPerms) {
        evidence.push(`Permission: ${DANGEROUS_PERMISSIONS[perm]}`);
      }
      // Scale risk by number of dangerous permissions
      if (dangerousPerms.length >= 5) riskScore += 3;
      else if (dangerousPerms.length >= 3) riskScore += 2;
      else riskScore += 1;
    }

    // 4. Risky permission combinations
    const matchedCombinations: string[] = [];
    for (const combo of RISKY_COMBINATIONS) {
      if (combo.permissions.every(p => app.requestedPermissions.includes(p))) {
        matchedCombinations.push(combo.label);
        riskScore += 3;
      }
    }
    for (const label of matchedCombinations) {
      evidence.push(`Risky combination: ${label}`);
    }

    // Skip apps with no evidence
    if (evidence.length === 0) continue;

    // 5. Determine severity and confidence from accumulated evidence
    let severity: Severity;
    let confidence: Confidence;

    if (riskScore >= 9) {
      // Multiple strong signals: sideloaded + dangerous combos + outdated
      severity = 'critical';
      confidence = 'high';
    } else if (riskScore >= 6) {
      severity = 'high';
      confidence = 'high';
    } else if (riskScore >= 3) {
      severity = 'medium';
      confidence = 'medium';
    } else {
      severity = 'low';
      confidence = 'low';
    }

    // Sideloaded + any risky combination → always at least HIGH
    if (isSideloaded && matchedCombinations.length > 0 && severity !== 'critical') {
      severity = 'high';
      confidence = 'high';
    }

    findings.push({
      appName: app.appName,
      packageName: app.packageName,
      severity,
      confidence,
      evidence,
      reason: buildReason(severity, isSideloaded, isOutdated, matchedCombinations.length, dangerousPerms.length),
      title: buildTitle(severity, app.appName),
      recommendedPlaybook: severity === 'critical' || severity === 'high' ? 'remove_risky_app' : 'review_app_permissions',
    });
  }

  return findings;
}

function buildTitle(severity: Severity, appName: string): string {
  switch (severity) {
    case 'critical':
      return `Critical-risk app detected: ${appName}`;
    case 'high':
      return `High-risk app detected: ${appName}`;
    case 'medium':
      return `Elevated risk: ${appName}`;
    case 'low':
      return `Minor concern: ${appName}`;
    default:
      return `Review recommended: ${appName}`;
  }
}

function buildReason(
  severity: Severity,
  isSideloaded: boolean,
  isOutdated: boolean,
  comboCount: number,
  dangerousPermCount: number,
): string {
  const parts: string[] = [];
  
  if (isSideloaded) parts.push('installed from an untrusted source');
  if (isOutdated) parts.push('targets an outdated Android version');
  if (comboCount > 0) parts.push(`has ${comboCount} risky permission combination${comboCount > 1 ? 's' : ''}`);
  if (dangerousPermCount > 0) parts.push(`requests ${dangerousPermCount} sensitive permission${dangerousPermCount > 1 ? 's' : ''}`);

  if (parts.length === 0) return 'Review recommended based on available security signals.';

  const joined = parts.join(', ');
  return `This application ${joined}. ${severity === 'critical' || severity === 'high' ? 'Consider removing it or verifying its legitimacy.' : 'Review whether it needs these capabilities.'}`;
}
