// ---------------------------------------------------------------------------
// Core domain types for the Digital Security platform.
// ---------------------------------------------------------------------------

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type FindingStatus = 'open' | 'resolving' | 'resolved' | 'dismissed';
export type Confidence = 'high' | 'medium' | 'low';

export type SecurityCategory =
  | 'account_security'
  | 'password_hygiene'
  | 'app_security'
  | 'privacy'
  | 'device_security'
  | 'network_security';

export type PlatformId =
  | 'web'
  | 'android'
  | 'ios'
  | 'windows'
  | 'macos'
  | 'linux';

export type CapabilityStatus = 'supported' | 'partial' | 'unsupported';

// ---------------------------------------------------------------------------
// Platform abstraction
// ---------------------------------------------------------------------------

export interface SecurityCapability {
  platform: PlatformId;
  capability: SecurityCategory | 'breach_check' | 'threat_simulation' | 'permission_analysis' | 'system_configuration';
  status: CapabilityStatus;
  notes?: string;
}

export interface SecuritySignal {
  category: SecurityCategory;
  /** A stable identifier for the specific check that produced this signal. */
  signalId: string;
  /** The user-facing question or probe that produced this signal. */
  question: string;
  /** The answer chosen by the user or gathered from the device. */
  value: string;
  /** "unsupported" or "limited" when the platform cannot produce this signal. */
  availability?: 'supported' | 'unsupported' | 'limited';
}

export interface AppMetadata {
  packageName: string;
  appName: string;
  versionName: string;
  versionCode: number;
  targetSdkVersion: number;
  installSource: string | null;
  requestedPermissions: string[];
  grantedPermissions: string[];
  isSystemApp: boolean;
  isVendorApp: boolean;
  isUserApp: boolean;
}

/** Tracks where security data actually came from. */
export type ScanSource = 
  | 'ANDROID_PACKAGE_MANAGER'
  | 'IOS_APP_QUERY'
  | 'UNSUPPORTED'
  | 'SCAN_ERROR'
  | 'REAL_DEVICE_DATA'
  | 'ANDROID_API'
  | 'USER_INPUT'
  | 'NOT_AVAILABLE';

export type ScanStatus = 
  | 'SCANNED' 
  | 'NOT_AVAILABLE' 
  | 'PERMISSION_REQUIRED' 
  | 'RESTRICTED_BY_ANDROID' 
  | 'FAILED';

export interface SecurityDecision {
  status: 'SAFE' | 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK' | 'CRITICAL_RISK' | 'INSUFFICIENT_EVIDENCE' | 'CANNOT_ASSESS';
  confidence: number; // 0-100
  evidence: string[];
  reason: string;
  recommendedAction?: string;
  limitations?: string[];
}

export interface NormalizedEvidence {
  appInfo?: AppMetadata;
  deviceSignals?: Partial<DeviceSecuritySignals>;
  networkSignals?: Partial<NetworkSecuritySignals>;
  rawFlags: string[];
}

export interface ScanFinding {
  id: string;
  category: SecurityCategory;
  title: string;
  description: string;
  severity: Severity;
  source: ScanSource;
  evidence: string[];
  recommendedPlaybook: string | null;
}

export interface InstalledAppInfo {
  packageName: string;
  appName: string;
  versionName: string;
  versionCode: number;
  isSystemApp: boolean;
  isVendorApp: boolean;
  isUserApp: boolean;
  isEnabled: boolean;
  requestedPermissions: string[];
  grantedPermissions?: string[];
  targetSdkVersion: number;
  installSource: string | null;
}

export interface PermissionFinding {
  permission: string;
  isGranted: boolean;
  description: string;
}

export interface DeviceIntegrityResult {
  status: 'safe' | 'info' | 'low' | 'medium' | 'high' | 'critical' | 'not_available' | 'error';
  confidence: Confidence;
  checksPerformed: string[];
  issues: string[];
  osVersion?: string;
  sdkInt?: number;
  securityPatch?: string;
}

export interface SecurityConfigurationResult {
  status: 'safe' | 'info' | 'low' | 'medium' | 'high' | 'critical' | 'not_available' | 'error';
  developerModeEnabled: boolean;
  unknownSourcesEnabled: boolean;
  screenLockSecured: boolean;
  storageEncrypted: boolean;
  issues: string[];
}

export interface ScanResult {
  deviceId: string;
  timestamp: string;
  status: 'success' | 'partial' | 'failed';
  deviceIntegrity: DeviceIntegrityResult;
  apps: InstalledAppInfo[];
  permissions: { [packageName: string]: PermissionFinding[] };
  configuration: SecurityConfigurationResult;
  findings: ScanFinding[];
  appRiskFindings?: AppRiskFinding[];
  networkDetails?: {
    ssid?: string;
    ipAddress?: string;
    deviceCount?: number;
    connectedDevices?: string[];
  };
}

/** Result of an installed-app scan with provenance metadata. */
export interface AppScanResult {
  apps: AppMetadata[];
  source: ScanSource;
  totalPackagesDetected: number;
  userInstalledApps: number;
  systemApps: number;
  vendorApps: number;
  analyzedApps: number;
  skippedApps: number;
  skipReasons: string[];
  totalPackagesReported?: number;
  /** Percentage of packages we could fully inspect (0-100). */
  coveragePercent: number;
  /** Whether the OS restricted package visibility. */
  visibility: 'FULL' | 'LIMITED' | 'NONE';
  confidence: Confidence;
  scannedAt: string;
  error?: string;
}

export type PermissionClassification = 'expected' | 'contextual' | 'unexpected';
export type PermissionStatus = 'granted' | 'not_granted';

export interface PermissionAnalysis {
  permission: string;
  status: PermissionStatus;
  classification: PermissionClassification;
  explanation: string;
}

export interface AppRiskFinding {
  appName: string;
  packageName: string;
  category?: string;
  severity: Severity;
  confidence: Confidence;
  riskScore?: number;
  riskLevel?: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  permissions?: PermissionAnalysis[];
  evidence: string[];
  reasons?: string[];
  reason?: string; // Legacy support
  recommendedAction?: string;
  recommendedPlaybook: string;
  title?: string;
  description?: string; // used when mapping to ScanFinding
  dataAccess?: {
    high: string[];
    medium: string[];
    low: string[];
  };
}

export type DeviceSecurityState = 
  | 'SUPPORTED' | 'UNSUPPORTED' | 'UNKNOWN' | 'LIMITED' 
  | 'ENABLED' | 'DISABLED' 
  | 'CURRENT' | 'OUTDATED' 
  | 'VERIFIED' | 'NOT_VERIFIED' 
  | 'NONE_DETECTED' | 'INDICATORS_DETECTED';

export type DeviceSecurityCategory = 
  | 'OS_SECURITY' | 'ENCRYPTION' | 'SCREEN_LOCK' | 'SECURE_BOOT' 
  | 'SYSTEM_UPDATES' | 'DEVELOPER_MODE' | 'ROOT_JAILBREAK' 
  | 'FIREWALL' | 'SECURITY_SOFTWARE' | 'INTEGRITY_CHECK'
  | 'DEVICE_ADMINS' | 'ACCESSIBILITY_SERVICES' | 'CERTIFICATES';

export interface DeviceSecuritySignal {
  id: string;
  category: DeviceSecurityCategory;
  status: DeviceSecurityState;
  value: string;
  source: string;
  confidence: Confidence;
  observedAt: string;
}

export interface DeviceSecuritySignals {
  platform: PlatformId;
  osVersion: DeviceSecuritySignal;
  securityPatchLevel: DeviceSecuritySignal;
  encryptionStatus: DeviceSecuritySignal;
  screenLockStatus: DeviceSecuritySignal;
  secureBootStatus: DeviceSecuritySignal;
  developerModeStatus: DeviceSecuritySignal;
  rootOrJailbreakStatus: DeviceSecuritySignal;
  firewallStatus: DeviceSecuritySignal;
  antivirusStatus: DeviceSecuritySignal;
  automaticUpdatesStatus: DeviceSecuritySignal;
  usbDebuggingStatus: DeviceSecuritySignal;
  playProtectStatus: DeviceSecuritySignal;
  unknownSourcesStatus: DeviceSecuritySignal;
  accessibilityServicesStatus: DeviceSecuritySignal;
  deviceAdminsStatus: DeviceSecuritySignal;
  caCertificatesStatus: DeviceSecuritySignal;
  bootloaderStatus: DeviceSecuritySignal;
  visibility: 'SUPPORTED' | 'UNSUPPORTED' | 'LIMITED';
  confidence: Confidence;
}

export type NetworkSecurityState = 
  | 'SECURE' | 'INSECURE' | 'UNKNOWN' | 'LIMITED' | 'UNSUPPORTED'
  | 'PUBLIC' | 'PRIVATE'
  | 'ENABLED' | 'DISABLED';

export type NetworkSecurityCategory = 
  | 'CONNECTION_TYPE' | 'TLS_STATUS' | 'WIFI_SECURITY' 
  | 'VPN_STATE' | 'DNS_CONFIG';

export interface NetworkSecuritySignal {
  id: string;
  category: NetworkSecurityCategory;
  status: NetworkSecurityState;
  value: string;
  source: string;
  confidence: Confidence;
  observedAt: string;
}

export interface NetworkSecuritySignals {
  platform: PlatformId;
  connectionType: NetworkSecuritySignal;
  tlsStatus: NetworkSecuritySignal;
  wifiSecurity: NetworkSecuritySignal;
  vpnState: NetworkSecuritySignal;
  dnsConfig: NetworkSecuritySignal;
  visibility: 'SUPPORTED' | 'UNSUPPORTED' | 'LIMITED';
  confidence: Confidence;
}

export interface SecurityAdapter {
  readonly platform: PlatformId;
  getDeviceSecuritySignals(): Promise<DeviceSecuritySignals>;
  getNetworkSecuritySignals(): Promise<NetworkSecuritySignals>;
  getInstalledAppSignals(): Promise<SecuritySignal[]>;
  getPermissionSignals(): Promise<SecuritySignal[]>;
  getAccountSecuritySignals(): Promise<SecuritySignal[]>;
  getInstalledApps(): Promise<AppScanResult>;
  getCapabilities(): SecurityCapability[];
}

// ---------------------------------------------------------------------------
// Checkup
// ---------------------------------------------------------------------------

export interface CheckupQuestion {
  id: string;
  category: SecurityCategory;
  label: string;
  /** Plain-language explanation shown under the label. */
  help?: string;
  options: CheckupQuestionOption[];
}

export interface CheckupQuestionOption {
  value: string;
  label: string;
}

export interface CheckupAnswer {
  questionId: string;
  category: SecurityCategory;
  value: string;
}

export type CheckupStatus = 'in_progress' | 'completed' | 'failed';

export interface CheckupRow {
  id: string;
  user_id: string;
  device_id: string | null;
  status: CheckupStatus;
  started_at: string;
  completed_at: string | null;
}

// ---------------------------------------------------------------------------
// Findings
// ---------------------------------------------------------------------------

export interface SecurityFinding {
  id: string;
  checkup_id: string;
  user_id: string;
  category: SecurityCategory;
  title: string;
  description: string;
  severity: Severity;
  source: string;
  platform: PlatformId;
  confidence: Confidence;
  status: FindingStatus;
  detected_at: string;
  recommended_playbook: string | null;
  evidence?: string[];
}

// ---------------------------------------------------------------------------
// Risk score
// ---------------------------------------------------------------------------

export interface RiskScoreComponent {
  category: SecurityCategory;
  score: number;
  weight: number;
  /** True when there was not enough data to fully assess this category. */
  insufficientData: boolean;
  confidence?: Confidence;
  coverage?: number; // 0 to 100
}

export interface RiskScore {
  id: string;
  user_id: string;
  checkup_id: string;
  score: number;
  deviceScore: number;
  appScore?: number;
  privacyScore?: number;
  networkScore?: number;
  habitsScore: number;
  grade: ScoreGrade;
  components: RiskScoreComponent[];
  is_preliminary: boolean;
  created_at: string;
}

export type ScoreGrade = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

// ---------------------------------------------------------------------------
// Playbooks
// ---------------------------------------------------------------------------

export interface PlaybookStep {
  index: number;
  title: string;
  explanation: string;
  action: string;
  /** Optional external URL the user can open (e.g. a security settings page). */
  deepLink?: string;
  verification: string;
}

export interface Playbook {
  id: string;
  title: string;
  category: SecurityCategory;
  /** The finding title this playbook remediates, used for matching. */
  forFinding: string;
  summary: string;
  estimatedMinutes: number;
  steps: PlaybookStep[];
}

export interface PlaybookProgress {
  id: string;
  user_id: string;
  finding_id: string | null;
  playbook_id: string;
  current_step: number;
  completed: boolean;
  started_at: string;
  completed_at: string | null;
}

// ---------------------------------------------------------------------------
// Database row shapes (as returned by Supabase)
// ---------------------------------------------------------------------------

export interface ProfileRow {
  id: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeviceRow {
  id: string;
  user_id: string;
  name: string;
  platform: PlatformId;
  os_version: string | null;
  created_at: string;
  last_seen_at: string;
}

export interface SecurityEventRow {
  id: string;
  user_id: string;
  event_type: string;
  detail: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Threat simulations (Learn)
// ---------------------------------------------------------------------------

export interface ThreatScenario {
  id: string;
  title: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  summary: string;
  scenes: ThreatScene[];
}

export interface ThreatChoice {
  label: string;
}

export interface ThreatScene {
  id: string;
  prompt: string;
  choices: ThreatChoice[];
  /** Index into choices of the recommended answer. */
  correctIndex: number;
  explanation: string;
}

// ---------------------------------------------------------------------------
// Dashboard aggregate
// ---------------------------------------------------------------------------

export interface DashboardData {
  latestScore: RiskScore | null;
  trueDeviceScore: number | null;
  historicalScores: Array<{ date: string; score: number }>;
  findings: SecurityFinding[];
  lastCheckup: CheckupRow | null;
  recentEvents: SecurityEventRow[];
}

declare global {
  interface Window {
    electronAPI?: {
      getNetworkSignals: () => Promise<any>;
      scanApps: () => Promise<any>;
      scanPorts: (host?: string) => Promise<Array<{ port: number, status: string, service: string }>>;
    };
  }
}
