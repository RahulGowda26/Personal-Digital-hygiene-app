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

  // 8. USB Debugging
  if (signals.usbDebuggingStatus && signals.usbDebuggingStatus.status === 'UNSUPPORTED') {
    findings.push({
      title: 'USB Debugging is enabled',
      severity: 'low',
      confidence: signals.usbDebuggingStatus.confidence,
      reason: 'USB debugging allows external devices to bypass security protocols and issue commands directly to your device.',
      evidence: [`State: ${signals.usbDebuggingStatus.value}`],
      recommendedPlaybook: 'disable_developer_mode',
    });
  }

  // 9. Play Protect
  if (signals.playProtectStatus && signals.playProtectStatus.status === 'UNSUPPORTED') {
    findings.push({
      title: 'Google Play Protect is disabled',
      severity: 'high',
      confidence: signals.playProtectStatus.confidence,
      reason: 'Play Protect scans your apps for malware. Disabling it leaves your device exposed to harmful applications.',
      evidence: [`State: ${signals.playProtectStatus.value}`],
      recommendedPlaybook: 'enable_security_software',
    });
  }

  // 10. Unknown Sources
  if (signals.unknownSourcesStatus && signals.unknownSourcesStatus.status === 'UNSUPPORTED') {
    findings.push({
      title: 'Unknown app sources are permitted',
      severity: 'medium',
      confidence: signals.unknownSourcesStatus.confidence,
      reason: 'Allowing app installations from unknown sources increases the risk of installing malicious software outside the official store.',
      evidence: [`State: ${signals.unknownSourcesStatus.value}`],
      recommendedPlaybook: 'disable_unknown_sources',
    });
  }

  // 11. Accessibility Services
  if (signals.accessibilityServicesStatus && signals.accessibilityServicesStatus.status === 'UNKNOWN') {
    findings.push({
      title: 'High-risk accessibility services enabled',
      severity: 'medium',
      confidence: signals.accessibilityServicesStatus.confidence,
      reason: 'Accessibility services can read your screen and simulate touches. Malicious apps abuse this to steal passwords and bypass 2FA.',
      evidence: [`Detected: ${signals.accessibilityServicesStatus.value}`],
      recommendedPlaybook: 'review_accessibility',
    });
  }

  // 12. Device Admins
  if (signals.deviceAdminsStatus && signals.deviceAdminsStatus.status === 'UNKNOWN') {
    findings.push({
      title: 'Third-party device administrators detected',
      severity: 'medium',
      confidence: signals.deviceAdminsStatus.confidence,
      reason: 'Device administrators have elevated privileges, such as the ability to wipe your device or lock your screen.',
      evidence: [`Detected: ${signals.deviceAdminsStatus.value}`],
      recommendedPlaybook: 'review_device_admins',
    });
  }

  // 13. CA Certificates
  if (signals.caCertificatesStatus && signals.caCertificatesStatus.status === 'UNKNOWN') {
    findings.push({
      title: 'Custom security certificates installed',
      severity: 'high',
      confidence: signals.caCertificatesStatus.confidence,
      reason: 'Custom Root CA certificates can intercept and decrypt your secure network traffic (Man-in-the-Middle attacks).',
      evidence: [`Detected: ${signals.caCertificatesStatus.value}`],
      recommendedPlaybook: 'review_certificates',
    });
  }

  // 14. Bootloader
  if (signals.bootloaderStatus && signals.bootloaderStatus.status === 'UNSUPPORTED') {
    findings.push({
      title: 'Device bootloader is unlocked',
      severity: 'critical',
      confidence: signals.bootloaderStatus.confidence,
      reason: 'An unlocked bootloader breaks the chain of trust, allowing modified, potentially malicious system software to be installed.',
      evidence: [`State: ${signals.bootloaderStatus.value}`],
      recommendedPlaybook: 'review_root_status',
    });
  }

  return findings;
}
