import type { DeviceSecuritySignals, Severity, Confidence } from '@/types';

export interface DeviceRiskFinding {
  title: string;
  severity: Severity;
  confidence: Confidence;
  evidence: string[];
  reason: string;
  recommendedPlaybook: string;
}

export function analyzeDevice(signals: DeviceSecuritySignals): DeviceRiskFinding[] {
  const findings: DeviceRiskFinding[] = [];

  if (signals.visibility === 'UNSUPPORTED') {
    return findings;
  }

  // 1. Screen Lock
  if (signals.screenLockStatus.status === 'DISABLED') {
    findings.push({
      title: 'Screen lock is disabled',
      severity: 'high',
      confidence: signals.screenLockStatus.confidence,
      reason: 'Your device is currently unprotected. Anyone with physical access can view your personal data or use your accounts.',
      evidence: [
        `Reported by: ${signals.screenLockStatus.source}`,
        `Current state: ${signals.screenLockStatus.value}`,
      ],
      recommendedPlaybook: 'enable_device_lock',
    });
  }

  // 2. Security Patch / System Updates
  if (signals.securityPatchLevel.status === 'OUTDATED' || signals.osVersion.status === 'OUTDATED') {
    findings.push({
      title: 'Device operating system is outdated',
      severity: 'high',
      confidence: signals.securityPatchLevel.confidence,
      reason: 'Outdated operating systems miss critical security patches, leaving your device vulnerable to known exploits.',
      evidence: [
        `OS Version: ${signals.osVersion.value}`,
        `Security Patch Level: ${signals.securityPatchLevel.value}`,
      ],
      recommendedPlaybook: 'update_os',
    });
  }

  // 3. Encryption
  if (signals.encryptionStatus.status === 'DISABLED') {
    findings.push({
      title: 'Device encryption is disabled',
      severity: 'high',
      confidence: signals.encryptionStatus.confidence,
      reason: 'Without encryption, a thief or attacker could easily extract files, photos, and app data directly from your device storage.',
      evidence: [
        `Reported by: ${signals.encryptionStatus.source}`,
        `State: ${signals.encryptionStatus.value}`,
      ],
      recommendedPlaybook: 'enable_encryption',
    });
  }

  // 4. Secure Boot
  if (signals.secureBootStatus.status === 'NOT_VERIFIED') {
    findings.push({
      title: 'Secure boot verification failed',
      severity: 'high',
      confidence: signals.secureBootStatus.confidence,
      reason: 'The operating system may have been tampered with before starting. Secure Boot ensures only trusted software loads during startup.',
      evidence: [
        `State: ${signals.secureBootStatus.value}`,
      ],
      recommendedPlaybook: 'review_boot_security',
    });
  }

  // 5. Root / Jailbreak Indicators
  if (signals.rootOrJailbreakStatus.status === 'INDICATORS_DETECTED') {
    findings.push({
      title: 'Root or jailbreak indicators detected',
      severity: 'critical',
      confidence: signals.rootOrJailbreakStatus.confidence,
      reason: 'The device security boundaries have been modified. This allows apps to bypass standard sandboxing, increasing the risk of severe malware infection.',
      evidence: [
        `Finding: ${signals.rootOrJailbreakStatus.value}`,
      ],
      recommendedPlaybook: 'review_root_status',
    });
  }

  // 6. Developer Mode
  if (signals.developerModeStatus.status === 'ENABLED') {
    findings.push({
      title: 'Developer mode is enabled',
      severity: 'low',
      confidence: signals.developerModeStatus.confidence,
      reason: 'Developer options are useful for debugging, but leaving them enabled can increase your attack surface (e.g., exposing USB debugging).',
      evidence: [
        `State: ${signals.developerModeStatus.value}`,
      ],
      recommendedPlaybook: 'disable_developer_mode',
    });
  }

  // 7. Security Software / Antivirus (if applicable)
  if (signals.antivirusStatus.status === 'DISABLED') {
    findings.push({
      title: 'Security protections are disabled',
      severity: 'medium',
      confidence: signals.antivirusStatus.confidence,
      reason: 'Built-in security scanning (like Google Play Protect or Windows Defender) is currently disabled.',
      evidence: [
        `State: ${signals.antivirusStatus.value}`,
      ],
      recommendedPlaybook: 'enable_security_software',
    });
  }

  return findings;
}
