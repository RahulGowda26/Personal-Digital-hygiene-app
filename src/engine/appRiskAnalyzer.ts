import type { AppMetadata, AppRiskFinding, Severity, Confidence, PermissionAnalysis, PermissionClassification, PermissionStatus } from '@/types';

export const PERMISSION_FRIENDLY_NAMES: Record<string, string> = {
  'android.permission.CAMERA': 'Camera',
  'android.permission.RECORD_AUDIO': 'Microphone',
  'android.permission.ACCESS_FINE_LOCATION': 'Precise Location',
  'android.permission.ACCESS_COARSE_LOCATION': 'Approximate Location',
  'android.permission.READ_CONTACTS': 'Contacts',
  'android.permission.READ_SMS': 'Read SMS',
  'android.permission.RECEIVE_SMS': 'Receive SMS',
  'android.permission.SEND_SMS': 'Send SMS',
  'android.permission.READ_CALL_LOG': 'Call Logs',
  'android.permission.BIND_ACCESSIBILITY_SERVICE': 'Accessibility Service',
  'android.permission.BIND_DEVICE_ADMIN': 'Device Admin',
  'android.permission.SYSTEM_ALERT_WINDOW': 'Draw Over Other Apps',
  'android.permission.READ_EXTERNAL_STORAGE': 'Read Storage',
  'android.permission.WRITE_EXTERNAL_STORAGE': 'Write Storage',
  'android.permission.MANAGE_EXTERNAL_STORAGE': 'Manage All Files',
};

const EXPLANATIONS = {
  expected: "This permission makes sense because this app uses it for its main features.",
  contextual: "This permission may be useful for some features, but it isn't essential to the app's main purpose.",
  unexpected: "This app appears to have access to this, but that access doesn't seem necessary for what this app does."
};

interface AppProfile {
  expected: string[];
  contextual: string[];
  unexpected: string[];
}

const APP_PROFILES: Record<string, AppProfile> = {
  maps: {
    expected: ['android.permission.ACCESS_FINE_LOCATION', 'android.permission.ACCESS_COARSE_LOCATION'],
    contextual: ['android.permission.RECORD_AUDIO', 'android.permission.CAMERA'],
    unexpected: ['android.permission.READ_SMS', 'android.permission.READ_CONTACTS', 'android.permission.READ_CALL_LOG']
  },
  messaging: {
    expected: ['android.permission.CAMERA', 'android.permission.RECORD_AUDIO', 'android.permission.READ_CONTACTS', 'android.permission.READ_EXTERNAL_STORAGE', 'android.permission.WRITE_EXTERNAL_STORAGE'],
    contextual: ['android.permission.ACCESS_FINE_LOCATION', 'android.permission.ACCESS_COARSE_LOCATION', 'android.permission.READ_SMS'],
    unexpected: ['android.permission.BIND_DEVICE_ADMIN']
  },
  calculator: {
    expected: [],
    contextual: [],
    unexpected: ['android.permission.READ_CONTACTS', 'android.permission.ACCESS_FINE_LOCATION', 'android.permission.RECORD_AUDIO', 'android.permission.CAMERA', 'android.permission.READ_SMS']
  },
  camera: {
    expected: ['android.permission.CAMERA', 'android.permission.RECORD_AUDIO', 'android.permission.READ_EXTERNAL_STORAGE', 'android.permission.WRITE_EXTERNAL_STORAGE'],
    contextual: ['android.permission.ACCESS_FINE_LOCATION'],
    unexpected: ['android.permission.READ_CONTACTS', 'android.permission.READ_SMS', 'android.permission.READ_CALL_LOG']
  },
  flashlight: {
    expected: ['android.permission.CAMERA'], // Needed for LED
    contextual: [],
    unexpected: ['android.permission.READ_CONTACTS', 'android.permission.ACCESS_FINE_LOCATION', 'android.permission.RECORD_AUDIO', 'android.permission.READ_SMS']
  },
  general: {
    expected: [],
    contextual: ['android.permission.READ_EXTERNAL_STORAGE', 'android.permission.WRITE_EXTERNAL_STORAGE', 'android.permission.CAMERA'],
    unexpected: ['android.permission.READ_SMS', 'android.permission.READ_CALL_LOG', 'android.permission.BIND_ACCESSIBILITY_SERVICE']
  }
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
  if (normalized.includes('chat') || normalized.includes('msg') || normalized.includes('whatsapp') || normalized.includes('messenger') || normalized.includes('social')) {
    return 'messaging';
  }
  if (normalized.includes('flash') || normalized.includes('torch')) {
    return 'flashlight';
  }
  return 'general';
}

function getPermissionClassification(perm: string, category: string): PermissionClassification {
  const profile = APP_PROFILES[category] || APP_PROFILES['general'];
  
  if (profile.expected.includes(perm)) return 'expected';
  if (profile.contextual.includes(perm)) return 'contextual';
  if (profile.unexpected.includes(perm)) return 'unexpected';
  
  // Default to unexpected for highly sensitive permissions if not in expected/contextual
  if (['android.permission.READ_SMS', 'android.permission.READ_CONTACTS', 'android.permission.BIND_ACCESSIBILITY_SERVICE', 'android.permission.RECORD_AUDIO', 'android.permission.ACCESS_FINE_LOCATION'].includes(perm)) {
    return 'unexpected';
  }
  
  return 'contextual';
}

export function analyzeApps(apps: AppMetadata[]): AppRiskFinding[] {
  const findings: AppRiskFinding[] = [];

  for (const app of apps) {
    const isSideloaded = app.installSource && !TRUSTED_SOURCES.has(app.installSource);
    const category = getAppCategoryHeuristic(app.packageName, app.appName);
    
    const requested = app.requestedPermissions || [];
    const granted = app.grantedPermissions || [];
    
    const sensitiveRequested = requested.filter(p => PERMISSION_FRIENDLY_NAMES[p]);
    if (sensitiveRequested.length === 0 && !isSideloaded) continue; // nothing to score
    
    let baseRisk = 0;
    let unexpectedScore = 0;
    let contextualScore = 0;
    let suspiciousComboScore = 0;
    
    const permissionAnalyses: PermissionAnalysis[] = [];
    
    let hasSms = false;
    let hasInternet = requested.includes('android.permission.INTERNET');
    let hasContacts = false;
    let hasLocation = false;
    let hasMicrophone = false;
    
    let unexpectedSensitiveCount = 0;

    for (const perm of sensitiveRequested) {
      const isGranted = granted.includes(perm);
      const classification = getPermissionClassification(perm, category);
      
      permissionAnalyses.push({
        permission: PERMISSION_FRIENDLY_NAMES[perm] || perm,
        status: isGranted ? 'granted' : 'not_granted',
        classification,
        explanation: EXPLANATIONS[classification]
      });

      if (isGranted) {
        if (classification === 'unexpected') {
          unexpectedScore += 30;
          unexpectedSensitiveCount++;
        } else if (classification === 'contextual') {
          contextualScore += 5;
        }
      }
      
      if (perm.includes('SMS')) hasSms = true;
      if (perm === 'android.permission.READ_CONTACTS') hasContacts = true;
      if (perm === 'android.permission.ACCESS_FINE_LOCATION') hasLocation = true;
      if (perm === 'android.permission.RECORD_AUDIO') hasMicrophone = true;
    }
    
    if (hasSms && hasInternet && category !== 'messaging') suspiciousComboScore += 25;
    if (hasContacts && hasLocation && hasMicrophone && category === 'general') suspiciousComboScore += 20;
    
    let totalScore = baseRisk + unexpectedScore + contextualScore + suspiciousComboScore;
    if (isSideloaded) totalScore += 20;
    
    if (app.isSystemApp || app.isVendorApp) {
      totalScore = Math.floor(totalScore * 0.2); // drastically reduce score for system apps
    }
    
    let severity: Severity = 'info';
    let riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical' = 'safe';
    
    if (totalScore >= 70 || (isSideloaded && unexpectedSensitiveCount > 0)) {
      severity = 'high';
      riskLevel = 'high';
    } else if (totalScore >= 40 || unexpectedSensitiveCount > 0) {
      severity = 'medium';
      riskLevel = 'medium';
    } else if (totalScore >= 20) {
      severity = 'low';
      riskLevel = 'low';
    } else {
      severity = 'info';
      riskLevel = 'safe';
    }
    const reasons: string[] = [];
    const evidence: string[] = [];
    
    const combos: string[] = [];
    
    // Collect specific unexpected permissions
    const unexpectedPermNames = permissionAnalyses
      .filter(p => p.classification === 'unexpected')
      .map(p => p.permission);
      
    if (unexpectedPermNames.length > 0) {
      const msg = `This app requests ${unexpectedPermNames.length} unexpected permission(s): ${unexpectedPermNames.join(', ')}.`;
      reasons.push(msg);
      evidence.push(msg);
    }
    
    if (isSideloaded) {
      reasons.push('Installed from an unknown source outside of the official Play Store.');
      evidence.push('Sideloaded application');
    }
    
    if (hasSms && hasInternet && category !== 'messaging') {
      const msg = `Suspicious combination: Can read SMS and access the Internet, allowing potential SMS data exfiltration.`;
      combos.push(msg);
      reasons.push(msg);
      evidence.push(msg);
    }
    if (hasContacts && hasLocation && hasMicrophone && category === 'general') {
      const msg = `Suspicious combination: Requests Contacts, Location, and Microphone without a clear use case.`;
      combos.push(msg);
      reasons.push(msg);
      evidence.push(msg);
    }

    let description = 'Routine application analysis.';
    if (unexpectedPermNames.length > 0 && combos.length > 0) {
      description = `This app requests access to sensitive data that does not seem necessary for its primary function, and combines permissions in a way that could allow data to be secretly exfiltrated.`;
    } else if (unexpectedPermNames.length > 0) {
      description = `This app requests access to sensitive data that does not seem necessary for its primary function. If compromised or malicious, it could access private information it shouldn't have.`;
    } else if (combos.length > 0) {
      description = `This app combines permissions in a way that could allow data to be secretly collected and transmitted over the internet without your knowledge.`;
    } else if (isSideloaded) {
      description = `Apps installed outside of official stores bypass standard security checks and may contain malware.`;
    }

    // Sort permissions so expected is last, unexpected first
    permissionAnalyses.sort((a, b) => {
      const rank = { unexpected: 0, contextual: 1, expected: 2 };
      return rank[a.classification] - rank[b.classification];
    });

    findings.push({
      appName: app.appName,
      packageName: app.packageName,
      category,
      severity,
      confidence: 'high',
      riskScore: Math.max(0, 100 - totalScore),
      riskLevel,
      permissions: permissionAnalyses,
      evidence,
      reasons,
      recommendedAction: riskLevel === 'high' ? 'Consider uninstalling or restricting permissions.' : 'Review granted permissions.',
      recommendedPlaybook: 'review_app_permissions',
      title: `${app.appName} Privacy Analysis`,
      description
    });
  }

  return findings;
}
