/*
# Digital Security Platform — Core Schema

Creates the data model for a personal digital hygiene platform that scores a
user's security posture, surfaces issues, and guides remediation through
playbooks.

## Tables
- profiles: per-user display profile (1:1 with auth.users)
- devices: registered devices per user
- security_capabilities: per-platform capability registry (reference data)
- checkups: a run of the diagnostic wizard
- checkup_answers: the user's answers to checkup questions (JSONB payload)
- security_findings: standardized findings produced by the risk engine
- risk_scores: overall Digital Health Score + category breakdown
- playbook_progress: a user's progress through a remediation playbook
- security_events: append-only audit/activity log

## Security
- RLS enabled on every table.
- profiles: owner = the user themselves (id = auth.uid()).
- All user-data tables are owner-scoped to auth.uid() with 4 CRUD policies each.
- security_capabilities is reference data: read-only for authenticated users.
- All owner columns default to auth.uid() so inserts that omit the owner succeed.

## Notes
1. Reference catalogs (playbook templates, playbook step definitions, the
   checkup question catalog, and the risk-engine rule weights) live in the
   service layer (TypeScript), not in the database. They are static
   configuration that changes with code releases, not per-user data.
2. No passwords, private messages, or file contents are ever stored.
3. checkup_answers stores only the user's self-reported answers to the
   checkup questionnaire — no secrets.
*/

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles
  FOR DELETE TO authenticated USING (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- devices
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  platform text NOT NULL,
  os_version text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_devices" ON devices;
CREATE POLICY "select_own_devices" ON devices
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_devices" ON devices;
CREATE POLICY "insert_own_devices" ON devices
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_devices" ON devices;
CREATE POLICY "update_own_devices" ON devices
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_devices" ON devices;
CREATE POLICY "delete_own_devices" ON devices
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- security_capabilities (reference data, read-only to authenticated)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS security_capabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  capability text NOT NULL,
  status text NOT NULL CHECK (status IN ('supported','partial','unsupported')),
  notes text,
  UNIQUE (platform, capability)
);

ALTER TABLE security_capabilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_capabilities" ON security_capabilities;
CREATE POLICY "read_capabilities" ON security_capabilities
  FOR SELECT TO authenticated USING (true);

-- ---------------------------------------------------------------------------
-- checkups
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS checkups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id uuid REFERENCES devices(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed','failed')),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE checkups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_checkups" ON checkups;
CREATE POLICY "select_own_checkups" ON checkups
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_checkups" ON checkups;
CREATE POLICY "insert_own_checkups" ON checkups
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_checkups" ON checkups;
CREATE POLICY "update_own_checkups" ON checkups
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_checkups" ON checkups;
CREATE POLICY "delete_own_checkups" ON checkups
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- checkup_answers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS checkup_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkup_id uuid NOT NULL REFERENCES checkups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  question_id text NOT NULL,
  answer text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE checkup_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_answers" ON checkup_answers;
CREATE POLICY "select_own_answers" ON checkup_answers
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_answers" ON checkup_answers;
CREATE POLICY "insert_own_answers" ON checkup_answers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_answers" ON checkup_answers;
CREATE POLICY "update_own_answers" ON checkup_answers
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_answers" ON checkup_answers;
CREATE POLICY "delete_own_answers" ON checkup_answers
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- security_findings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS security_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkup_id uuid NOT NULL REFERENCES checkups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('critical','high','medium','low','info')),
  source text NOT NULL DEFAULT 'checkup',
  platform text NOT NULL DEFAULT 'web',
  confidence text NOT NULL DEFAULT 'high' CHECK (confidence IN ('high','medium','low')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolving','resolved','dismissed')),
  detected_at timestamptz NOT NULL DEFAULT now(),
  recommended_playbook text
);

ALTER TABLE security_findings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_findings" ON security_findings;
CREATE POLICY "select_own_findings" ON security_findings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_findings" ON security_findings;
CREATE POLICY "insert_own_findings" ON security_findings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_findings" ON security_findings;
CREATE POLICY "update_own_findings" ON security_findings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_findings" ON security_findings;
CREATE POLICY "delete_own_findings" ON security_findings
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_findings_user_status ON security_findings(user_id, status);
CREATE INDEX IF NOT EXISTS idx_findings_checkup ON security_findings(checkup_id);

-- ---------------------------------------------------------------------------
-- risk_scores
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS risk_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  checkup_id uuid NOT NULL REFERENCES checkups(id) ON DELETE CASCADE,
  score int NOT NULL CHECK (score >= 0 AND score <= 100),
  grade text NOT NULL,
  components jsonb NOT NULL,
  is_preliminary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE risk_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_scores" ON risk_scores;
CREATE POLICY "select_own_scores" ON risk_scores
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_scores" ON risk_scores;
CREATE POLICY "insert_own_scores" ON risk_scores
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_scores" ON risk_scores;
CREATE POLICY "update_own_scores" ON risk_scores
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_scores" ON risk_scores;
CREATE POLICY "delete_own_scores" ON risk_scores
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_scores_user ON risk_scores(user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- playbook_progress
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS playbook_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  finding_id uuid REFERENCES security_findings(id) ON DELETE CASCADE,
  playbook_id text NOT NULL,
  current_step int NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (user_id, finding_id)
);

ALTER TABLE playbook_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_progress" ON playbook_progress;
CREATE POLICY "select_own_progress" ON playbook_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_progress" ON playbook_progress;
CREATE POLICY "insert_own_progress" ON playbook_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_progress" ON playbook_progress;
CREATE POLICY "update_own_progress" ON playbook_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_progress" ON playbook_progress;
CREATE POLICY "delete_own_progress" ON playbook_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- security_events
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_events" ON security_events;
CREATE POLICY "select_own_events" ON security_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_events" ON security_events;
CREATE POLICY "insert_own_events" ON security_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_events" ON security_events;
CREATE POLICY "update_own_events" ON security_events
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_events" ON security_events;
CREATE POLICY "delete_own_events" ON security_events
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_events_user ON security_events(user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- updated_at trigger for profiles
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();