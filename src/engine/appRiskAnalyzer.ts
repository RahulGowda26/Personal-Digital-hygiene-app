import type { AppMetadata, AppRiskFinding, Severity, Confidence } from '@/types';

const PERMISSION_SCORES: Record<string, number> = {
  'android.permission.CAMERA': 5,
  'android.permission.RECORD_AUDIO': 10, // Microphone
  'android.permission.ACCESS_FINE_LOCATION': 5,
  'android.permission.ACCESS_COARSE_LOCATION': 5,
  'android.permission.READ_CONTACTS': 15,
  'android.permission.READ_SMS': 20,
  'android.permission.RECEIVE_SMS': 20,
  'android.permission.SEND_SMS': 20,
  'android.permission.READ_CALL_LOG': 20,
  'android.permission.BIND_ACCESSIBILITY_SERVICE': 30,
  'android.permission.BIND_DEVICE_ADMIN': 30,
  'android.permission.SYSTEM_ALERT_WINDOW': 25, // Overlay
  'android.permission.READ_EXTERNAL_STORAGE': 10,
  'android.permission.WRITE_EXTERNAL_STORAGE': 10,
  'android.permission.MANAGE_EXTERNAL_STORAGE': 10,
};

export const PERMISSION_FRIENDLY_NAMES: Record<string, string> = {
  'android.permission.CAMERA': 'Can use your camera to take pictures or video',
  'android.permission.RECORD_AUDIO': 'Can listen to and record your microphone',
  'android.permission.ACCESS_FINE_LOCATION': 'Can track your exact location',
  'android.permission.ACCESS_COARSE_LOCATION': 'Can track your general location',
  'android.permission.READ_CONTACTS': 'Can read your contacts and address book',
  'android.permission.READ_SMS': 'Can read your private text messages',
  'android.permission.RECEIVE_SMS': 'Can monitor incoming text messages',
  'android.permission.SEND_SMS': 'Can send text messages (which may cost money)',
  'android.permission.READ_CALL_LOG': 'Can see who you called and who called you',
  'android.permission.BIND_ACCESSIBILITY_SERVICE': 'Can see everything on your screen and control your device',
  'android.permission.BIND_DEVICE_ADMIN': 'Can lock your device or erase your data',
  'android.permission.SYSTEM_ALERT_WINDOW': 'Can draw over other apps to trick you',
  'android.permission.READ_EXTERNAL_STORAGE': 'Can view your personal files and photos',
  'android.permission.WRITE_EXTERNAL_STORAGE': 'Can delete or change your personal files',
  'android.permission.MANAGE_EXTERNAL_STORAGE': 'Has full access to all your files',
};

const TRUSTED_SOURCES = new Set([
  'com.android.vending',        // Google Play Store
  'com.sec.android.app.samsungapps', // Samsung Galaxy Store
  'com.amazon.venezia',         // Amazon Appstore
  'com.huawei.appmarket',       // Huawei AppGallery
]);

function getAppCategoryHeuristic(packageName: string, appName: string): string {
  const normalized = (packageName + ' ' + appName).toLowerCase();
  if (normalized.includes('map') || normalized.includes('navi') || normalized.includes('transit') || normalized.includes('uber') || normalized.includes('lyft')) {
    return 'maps';
  }
  if (normalized.includes('calc')) {
    return 'calculator';
  }
  if (normalized.includes('camera') || normalized.includes('photo')) {
    return 'camera';
  }
  if (normalized.includes('chat') || normalized.includes('msg') || normalized.includes('whatsapp') || normalized.includes('messenger')) {
    return 'messaging';
  }
  return 'general';
}

function calculateScore(perms: string[]): number {
  let score = 0;
  const counted = new Set<string>();
  for (const p of perms) {
    if (PERMISSION_SCORES[p] && !counted.has(p)) {
      score += PERMISSION_SCORES[p];
      counted.add(p); // avoid double counting if duplicate
    }
  }
  return score;
}

export function analyzeApps(apps: AppMetadata[]): AppRiskFinding[] {
  const findings: AppRiskFinding[] = [];

  for (const app of apps) {
    if (app.isSystemApp || app.isVendorApp) continue;

    const perms = app.requestedPermissions || [];
    let score = calculateScore(perms);

    const isSideloaded = !app.installSource || !TRUSTED_SOURCES.has(app.installSource);
    const category = getAppCategoryHeuristic(app.packageName, app.appName);

    // Apply category heuristics
    const hasLocation = perms.includes('android.permission.ACCESS_FINE_LOCATION');
    const hasContacts = perms.includes('android.permission.READ_CONTACTS');
    const hasMicrophone = perms.includes('android.permission.RECORD_AUDIO');

    if (category === 'calculator' && (hasLocation || hasContacts || hasMicrophone)) {
      score += 40; // High risk for simple tools needing sensitive data
    }

    if (category === 'maps' && hasLocation) {
      score -= 5; // Normal for maps
    }

    if (category === 'camera' && (perms.includes('android.permission.CAMERA') || perms.includes('android.permission.READ_EXTERNAL_STORAGE'))) {
      score -= 5; // Normal for camera
    }

    if (isSideloaded) {
      score += 20;
    }

    // Determine Severity
    let severity: Severity = 'low';
    if (score >= 71) {
      severity = 'high';
    } else if (score >= 41) {
      severity = 'medium';
    } else if (score >= 21) {
      severity = 'low';
    } else {
      // Safe, skip
      continue;
    }

    const friendlyPerms = Array.from(new Set(
      perms.map(p => PERMISSION_FRIENDLY_NAMES[p]).filter(Boolean)
    ));

    const evidence: string[] = [];
    friendlyPerms.forEach(p => evidence.push(`✓ ${p}`));
    
    if (isSideloaded) {
      evidence.push('✓ Installed from an unknown source');
    }

    const dataAccess = {
      high: [] as string[],
      medium: [] as string[],
      low: [] as string[]
    };

    if (perms.includes('android.permission.ACCESS_FINE_LOCATION') || perms.includes('android.permission.ACCESS_COARSE_LOCATION')) dataAccess.high.push('Location');
    if (perms.includes('android.permission.READ_CONTACTS')) dataAccess.medium.push('Contacts');
    if (perms.includes('android.permission.CAMERA')) dataAccess.medium.push('Camera');
    if (perms.includes('android.permission.RECORD_AUDIO')) dataAccess.high.push('Microphone');
    if (perms.includes('android.permission.READ_SMS') || perms.includes('android.permission.RECEIVE_SMS')) dataAccess.high.push('SMS Messages');
    if (perms.includes('android.permission.READ_CALL_LOG')) dataAccess.medium.push('Call Logs');
    if (perms.includes('android.permission.READ_EXTERNAL_STORAGE') || perms.includes('android.permission.WRITE_EXTERNAL_STORAGE')) dataAccess.low.push('Files & Storage');
    
    let riskScore = Math.max(0, 100 - score); // Base 100, minus the risk penalty points

    findings.push({
      appName: app.appName,
      packageName: app.packageName,
      title: `${app.appName || app.packageName} has access to sensitive data`,
      reason: `This application can access sensitive data or features. Unnecessary permissions can collect private information.`,
      severity,
      confidence: 'high',
      evidence,
      recommendedPlaybook: 'review_app_permissions',
      riskScore,
      dataAccess,
    });
  }

  return findings;
}
