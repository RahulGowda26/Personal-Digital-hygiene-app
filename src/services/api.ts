import { supabase } from '@/lib/supabase';
import type {
  CheckupAnswer,
  CheckupRow,
  DashboardData,
  DeviceRow,
  ProfileRow,
  RiskScore,
  SecurityCapability,
  SecurityEventRow,
  SecurityFinding,
  DeviceSecuritySignals,
  NetworkSecuritySignals,
  AppMetadata,
  AppScanResult,
} from '@/types';
import { runRiskEngine } from '@/engine/riskEngine';
import { getSecurityAdapter } from '@/platform/SecurityAdapter';
import { BreachCheckResult, PasswordExposureCheckResult } from '@/platform/ThreatIntelligence';

/**
 * Data service — the repository layer between the React UI and Supabase.
 *
 * On a FastAPI backend these calls would be HTTPS requests to the REST API.
 * Here they run against Supabase directly, with the risk engine executing
 * client-side (it is deterministic and auditable, so the location does not
 * change the result). The shape of each function mirrors the API endpoints
 * in the system spec so the transport can be swapped later.
 */

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

export async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertProfile(
  userId: string,
  displayName: string,
): Promise<ProfileRow> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, display_name: displayName })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Devices
// ---------------------------------------------------------------------------

export async function ensureDevice(
  userId: string,
  platform: string,
): Promise<DeviceRow> {
  const { data: existing } = await supabase
    .from('devices')
    .select('*')
    .eq('user_id', userId)
    .eq('platform', platform)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('devices')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const name =
    platform === 'web'
      ? 'Web Browser'
      : `${platform.charAt(0).toUpperCase() + platform.slice(1)} Device`;

  const { data, error } = await supabase
    .from('devices')
    .insert({ user_id: userId, name, platform })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Capabilities
// ---------------------------------------------------------------------------

export async function fetchCapabilities(): Promise<SecurityCapability[]> {
  const adapter = getSecurityAdapter();
  const local = adapter.getCapabilities();
  const { data, error } = await supabase
    .from('security_capabilities')
    .select('platform, capability, status, notes');
  if (error) throw error;
  // Prefer DB rows when available; fall back to adapter-reported capabilities.
  if (data && data.length > 0) {
    return data as SecurityCapability[];
  }
  return local;
}

// ---------------------------------------------------------------------------
// Checkups — create, answer, complete
// ---------------------------------------------------------------------------

export async function createCheckup(
  userId: string,
  deviceId: string | null,
): Promise<CheckupRow> {
  const { data, error } = await supabase
    .from('checkups')
    .insert({ user_id: userId, device_id: deviceId, status: 'in_progress' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function saveCheckupAnswers(
  checkupId: string,
  userId: string,
  answers: CheckupAnswer[],
): Promise<void> {
  const rows = answers.map((a) => ({
    checkup_id: checkupId,
    user_id: userId,
    category: a.category,
    question_id: a.questionId,
    answer: a.value,
  }));
  const { error } = await supabase.from('checkup_answers').insert(rows);
  if (error) throw error;
}


export async function completeCheckup(
  checkupId: string,
  userId: string,
  answers: CheckupAnswer[],
  breachResult?: BreachCheckResult | null,
  passwordResult?: PasswordExposureCheckResult | null,
  installedApps: AppScanResult | null = null,
  deviceSignals?: DeviceSecuritySignals | null,
  networkSignals?: NetworkSecuritySignals | null
): Promise<{ score: RiskScore; findings: SecurityFinding[] }> {
  const result = runRiskEngine(answers, breachResult, passwordResult, installedApps, deviceSignals, networkSignals);

  const { data: scoreRow, error: scoreError } = await supabase
    .from('risk_scores')
    .insert({
      user_id: userId,
      checkup_id: checkupId,
      score: result.score,
      grade: result.grade,
      components: result.components,
      is_preliminary: result.isPreliminary,
    })
    .select()
    .single();
  if (scoreError) throw scoreError;

  const findingRows = result.findings.map((f) => ({
    checkup_id: checkupId,
    user_id: userId,
    category: f.category,
    title: f.title,
    description: f.description,
    severity: f.severity,
    source: f.source,
    platform: f.platform,
    confidence: f.confidence,
    status: f.status,
    detected_at: f.detected_at,
    recommended_playbook: f.recommended_playbook,
  }));

  const { data: insertedFindings, error: findingsError } = await supabase
    .from('security_findings')
    .insert(findingRows)
    .select();
  if (findingsError) throw findingsError;

  const { error: checkupError } = await supabase
    .from('checkups')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', checkupId);
  if (checkupError) throw checkupError;

  if (passwordResult && passwordResult.status !== 'error' && passwordResult.status !== 'rate_limit') {
    const { error: pwdError } = await supabase
      .from('password_exposure_checks')
      .insert({
        user_id: userId,
        checkup_id: checkupId,
        exposed: passwordResult.status === 'exposed',
        occurrence_count: passwordResult.occurrenceCount,
      });
    if (pwdError) {
      console.error('Failed to save password exposure check', pwdError);
      // We don't throw here to avoid failing the entire checkup if this minor insert fails
    }
  }

  await logEvent(userId, 'checkup_completed', `Score: ${result.score}/100`);

  return {
    score: scoreRow as RiskScore,
    findings: insertedFindings as SecurityFinding[],
  };
}

export async function fetchLatestCheckup(userId: string): Promise<CheckupRow | null> {
  const { data, error } = await supabase
    .from('checkups')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Score
// ---------------------------------------------------------------------------

export async function fetchLatestScore(userId: string): Promise<RiskScore | null> {
  const { data, error } = await supabase
    .from('risk_scores')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Findings / Issues
// ---------------------------------------------------------------------------

export async function fetchFindings(userId: string): Promise<SecurityFinding[]> {
  const { data, error } = await supabase
    .from('security_findings')
    .select('*')
    .eq('user_id', userId)
    .order('detected_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as SecurityFinding[];
}

export async function fetchFinding(id: string): Promise<SecurityFinding | null> {
  const { data, error } = await supabase
    .from('security_findings')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function resolveFinding(
  id: string,
  userId: string,
): Promise<SecurityFinding> {
  const { data, error } = await supabase
    .from('security_findings')
    .update({ status: 'resolved' })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  await logEvent(userId, 'issue_resolved', id);
  return data;
}

export async function dismissFinding(
  id: string,
  userId: string,
): Promise<SecurityFinding> {
  const { data, error } = await supabase
    .from('security_findings')
    .update({ status: 'dismissed' })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Playbook progress
// ---------------------------------------------------------------------------

export interface PlaybookProgressRow {
  id: string;
  user_id: string;
  finding_id: string | null;
  playbook_id: string;
  current_step: number;
  completed: boolean;
  started_at: string;
  completed_at: string | null;
}

export async function fetchPlaybookProgress(
  userId: string,
  findingId: string | null,
  playbookId: string,
): Promise<PlaybookProgressRow | null> {
  let query = supabase
    .from('playbook_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('playbook_id', playbookId);
  if (findingId) {
    query = query.eq('finding_id', findingId);
  }
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
}

export async function startPlaybook(
  userId: string,
  findingId: string | null,
  playbookId: string,
): Promise<PlaybookProgressRow> {
  const existing = await fetchPlaybookProgress(userId, findingId, playbookId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from('playbook_progress')
    .insert({
      user_id: userId,
      finding_id: findingId,
      playbook_id: playbookId,
      current_step: 0,
      completed: false,
    })
    .select()
    .maybeSingle();

  if (error) {
    // Handle unique constraint violation (Postgres code 23505) due to race conditions (e.g., React Strict Mode double-invoking useEffect)
    if (error.code === '23505') {
      const existingNow = await fetchPlaybookProgress(userId, findingId, playbookId);
      if (existingNow) return existingNow;
    }
    throw error;
  }
  if (!data) throw new Error('Failed to start playbook');

  await logEvent(userId, 'playbook_started', playbookId);
  return data;
}

export async function advancePlaybookStep(
  progressId: string,
  userId: string,
  totalSteps: number,
): Promise<PlaybookProgressRow> {
  const { data: current } = await supabase
    .from('playbook_progress')
    .select('*')
    .eq('id', progressId)
    .single();
  if (!current) throw new Error('Playbook progress not found');

  const nextStep = current.current_step + 1;
  const isCompleted = nextStep >= totalSteps;

  const { data, error } = await supabase
    .from('playbook_progress')
    .update({
      current_step: nextStep,
      completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
    })
    .eq('id', progressId)
    .select()
    .single();
  if (error) throw error;

  if (isCompleted) {
    await logEvent(userId, 'playbook_completed', current.playbook_id);
    if (current.finding_id) {
      await resolveFinding(current.finding_id, userId);
    }
  }

  return data;
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export async function logEvent(
  userId: string,
  eventType: string,
  detail?: string,
): Promise<void> {
  const { error } = await supabase
    .from('security_events')
    .insert({ user_id: userId, event_type: eventType, detail });
  if (error) {
    // Logging is best-effort; do not throw and break the user flow.
    console.warn('Failed to log security event:', error.message);
  }
}

export async function fetchRecentEvents(
  userId: string,
  limit = 5,
): Promise<SecurityEventRow[]> {
  const { data, error } = await supabase
    .from('security_events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as SecurityEventRow[];
}

// ---------------------------------------------------------------------------
// Dashboard aggregate
// ---------------------------------------------------------------------------

export async function fetchDashboard(userId: string): Promise<DashboardData> {
  const [latestScore, findings, lastCheckup, recentEvents] = await Promise.all([
    fetchLatestScore(userId),
    fetchFindings(userId),
    fetchLatestCheckup(userId),
    fetchRecentEvents(userId, 5),
  ]);

  return { latestScore, findings, lastCheckup, recentEvents };
}

// ---------------------------------------------------------------------------
// Data deletion (privacy layer)
// ---------------------------------------------------------------------------

export async function deleteAllUserData(userId: string): Promise<void> {
  // RLS-scoped deletes cascade through foreign keys where configured.
  const tables = [
    'security_events',
    'playbook_progress',
    'risk_scores',
    'security_findings',
    'checkup_answers',
    'checkups',
    'devices',
  ] as const;

  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('user_id', userId);
    if (error) console.warn(`Failed to delete from ${table}:`, error.message);
  }

  const { error } = await supabase.from('profiles').delete().eq('id', userId);
  if (error) console.warn('Failed to delete profile:', error.message);
}
