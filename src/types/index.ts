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
}

/** Tracks where security data actually came from. */
export type ScanSource = 
  | 'ANDROID_PACKAGE_MANAGER'
  | 'IOS_APP_QUERY'
  | 'DEMO_MOCK'
  | 'UNSUPPORTED'
  | 'SCAN_ERROR'
  | 'REAL_DEVICE_DATA'
  | 'ANDROID_API'
  | 'USER_INPUT'
  | 'NOT_AVAILABLE';

export interface ScanFinding {
  id: string;
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
  isEnabled: boolean;
  requestedPermissions: string[];
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
}

/** Result of an installed-app scan with provenance metadata. */
export interface AppScanResult {
  apps: AppMetadata[];
  source: ScanSource;
  /** Number of apps the OS reported vs. how many we could inspect. */
  totalPackagesReported?: number;
  /** Percentage of packages we could fully inspect (0-100). */
  coveragePercent: number;
  /** Whether the OS restricted package visibility. */
  visibility: 'FULL' | 'LIMITED' | 'NONE';
  confidence: Confidence;
  scannedAt: string;
  error?: string;
}

export interface AppRiskFinding {
  appName: string;
  packageName: string;
  severity: Severity;
  confidence: Confidence;
  evidence: string[];
  reason: string;
  title?: string;
  recommendedPlaybook: string;
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
  | 'FIREWALL' | 'SECURITY_SOFTWARE';

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
  findings: SecurityFinding[];
  lastCheckup: CheckupRow | null;
  recentEvents: SecurityEventRow[];
}
