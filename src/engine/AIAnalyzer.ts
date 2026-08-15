import { NormalizedEvidence, SecurityDecision } from '@/types';

export class AIAnalyzer {
  /**
   * Stub for AI analysis. Takes normalized evidence and returns a strict SecurityDecision.
   * This ensures the AI interprets evidence rather than fabricating it.
   */
  async analyzeEvidence(evidence: NormalizedEvidence): Promise<SecurityDecision[]> {
    const decisions: SecurityDecision[] = [];

    // If we have no real evidence to analyze, the AI must admit it cannot assess.
    if (!evidence.appInfo && !evidence.deviceSignals && !evidence.networkSignals && evidence.rawFlags.length === 0) {
      return [{
        status: 'INSUFFICIENT_EVIDENCE',
        confidence: 100,
        evidence: [],
        reason: 'No evidence provided for AI analysis.',
      }];
    }

    // Since we don't have a real LLM hooked up right now, we return a deterministic baseline 
    // interpretation of the rawFlags provided by the Deterministic Rule Engine.
    
    if (evidence.rawFlags.includes('ROOT_DETECTED')) {
      decisions.push({
        status: 'CRITICAL_RISK',
        confidence: 95,
        evidence: ['Device is rooted or jailbroken.'],
        reason: 'Root access fundamentally breaks the OS security sandbox, allowing any app to potentially read data from other apps.',
        recommendedAction: 'Unroot device or restrict sensitive app usage.',
      });
    }

    if (evidence.rawFlags.includes('DEV_MODE_ACTIVE')) {
      decisions.push({
        status: 'MEDIUM_RISK',
        confidence: 90,
        evidence: ['Developer mode is enabled.'],
        reason: 'Developer mode can allow sideloading of unverified applications or unauthorized ADB access if the device is plugged into a malicious charging port.',
        recommendedAction: 'Disable developer options in Android settings.',
      });
    }

    if (evidence.rawFlags.includes('DANGEROUS_PERMISSION_COMBO')) {
      decisions.push({
        status: 'HIGH_RISK',
        confidence: 85,
        evidence: ['App requests combinations of sensitive permissions.'],
        reason: 'The application requested combinations of permissions that are often used by malware (e.g., READ_SMS + INTERNET).',
      });
    }

    if (evidence.rawFlags.includes('PROXY_DETECTED')) {
      decisions.push({
        status: 'HIGH_RISK',
        confidence: 90,
        evidence: ['Global HTTP Proxy is configured on the network.'],
        reason: 'A proxy can intercept and read all unencrypted traffic. It can also perform MITM attacks if malicious root certificates are installed.',
        recommendedAction: 'Disable proxy in Wi-Fi settings or switch to a trusted network.',
      });
    }

    if (evidence.rawFlags.includes('NO_SCREEN_LOCK')) {
      decisions.push({
        status: 'HIGH_RISK',
        confidence: 100,
        evidence: ['Device does not have a secure screen lock (PIN/Password/Biometric).'],
        reason: 'Without a screen lock, anyone with physical access can read your data and impersonate you.',
        recommendedAction: 'Set up a screen lock immediately in Android Settings.',
      });
    }

    if (evidence.rawFlags.includes('STORAGE_UNENCRYPTED')) {
      decisions.push({
        status: 'HIGH_RISK',
        confidence: 100,
        evidence: ['Device storage is not encrypted.'],
        reason: 'Unencrypted storage allows an attacker with physical access to extract data directly from the flash memory chip.',
        recommendedAction: 'Enable device encryption in Android Settings.',
      });
    }

    if (evidence.rawFlags.includes('VPN_ACTIVE')) {
      decisions.push({
        status: 'MEDIUM_RISK',
        confidence: 100,
        evidence: ['A VPN profile is actively routing traffic.'],
        reason: 'While VPNs are often used for privacy, a malicious VPN app can intercept and log all internet traffic on the device.',
        recommendedAction: 'Ensure the VPN is from a trusted provider. If unknown, disconnect and uninstall the app.',
      });
    }

    if (evidence.rawFlags.includes('CAPTIVE_PORTAL_DETECTED')) {
      decisions.push({
        status: 'HIGH_RISK',
        confidence: 100,
        evidence: ['Network is intercepting traffic (Captive Portal detected).'],
        reason: 'A Captive Portal means the network is actively intercepting requests until you log in. This is common on public Wi-Fi but poses a security risk.',
        recommendedAction: 'Do not transmit sensitive data (like passwords) until you are fully authenticated, or use a trusted VPN.',
      });
    }

    if (evidence.rawFlags.includes('UNENCRYPTED_WIFI')) {
      decisions.push({
        status: 'HIGH_RISK',
        confidence: 100,
        evidence: ['Connected to an Open (Unencrypted) Wi-Fi network.'],
        reason: 'Open networks do not encrypt traffic between your device and the router. Anyone nearby can easily sniff your network traffic.',
        recommendedAction: 'Disconnect from this network or use a trusted VPN immediately.',
      });
    }

    if (decisions.length === 0) {
      decisions.push({
        status: 'SAFE',
        confidence: 80,
        evidence: ['No significant risk indicators found in the provided evidence.'],
        reason: 'The evidence analyzed does not exhibit known high-risk patterns.',
      });
    }

    return decisions;
  }
}
