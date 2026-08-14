import type {
  NetworkSecuritySignals,
  AppRiskFinding,
  Severity,
} from '@/types';

export function analyzeNetwork(signals: NetworkSecuritySignals): AppRiskFinding[] {
  const findings: AppRiskFinding[] = [];

  // If the adapter explicitly says it cannot see anything (e.g. web browser), we don't guess.
  if (signals.visibility === 'UNSUPPORTED') {
    return [];
  }

  // Evaluate VPN + Public Wi-Fi
  const isPublicWifi = signals.connectionType.status === 'PUBLIC';
  const isVpnDisabled = signals.vpnState.status === 'DISABLED';
  const isWifiInsecure = signals.wifiSecurity.status === 'INSECURE';
  
  if (isPublicWifi || isWifiInsecure) {
    if (isVpnDisabled) {
      findings.push({
        appName: 'Network Scanner',
        packageName: 'system.network',
        severity: 'high',
        confidence: signals.confidence,
        evidence: [
          signals.connectionType.value,
          signals.wifiSecurity.value,
          signals.vpnState.value,
        ],
        reason: 'Network risk detected — this network may provide weaker protection than a trusted network.',
        recommendedPlaybook: 'avoid_insecure_networks',
      });
    } else {
      // VPN is enabled on a public network - good!
      // Could emit an info finding or positive score reinforcement.
    }
  }

  // Evaluate DNS Configuration
  if (signals.dnsConfig.status === 'INSECURE' && isVpnDisabled) {
    findings.push({
      appName: 'Network Scanner',
      packageName: 'system.network',
      severity: 'medium',
      confidence: signals.confidence,
      evidence: [
        signals.dnsConfig.value,
      ],
      reason: 'DNS queries are unencrypted, allowing the network provider to see which websites you visit.',
      recommendedPlaybook: 'enable_secure_dns',
    });
  }

  return findings;
}
