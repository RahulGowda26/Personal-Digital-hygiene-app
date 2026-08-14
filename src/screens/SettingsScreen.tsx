import { useCallback, useEffect, useState } from 'react';
import {
  User,
  Monitor,
  ShieldCheck,
  LogOut,
  Trash2,
  Info,
  AlertTriangle,
  Check,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { fetchProfile, upsertProfile, deleteAllUserData, fetchCapabilities } from '@/services/api';
import { detectPlatform } from '@/platform/SecurityAdapter';
import type { ProfileRow, SecurityCapability } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CenteredLoader, ErrorState } from '@/components/ui/Spinner';
import { userFacingError } from '@/lib/errors';

const capabilityLabels: Record<string, string> = {
  account_security: 'Account Security',
  password_hygiene: 'Password Hygiene',
  app_security: 'App Security',
  privacy: 'Privacy',
  device_security: 'Device Security',
  network_security: 'Network Security',
  breach_check: 'Breach Check',
  threat_simulation: 'Threat Simulation',
  permission_analysis: 'Permission Analysis',
  system_configuration: 'System Configuration',
};

export function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [caps, setCaps] = useState<SecurityCapability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const platform = detectPlatform();

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [p, c] = await Promise.all([
        fetchProfile(user.id),
        fetchCapabilities(),
      ]);
      setProfile(p);
      setDisplayName(p?.display_name ?? '');
      setCaps(c.filter((cap) => cap.platform === platform));
    } catch (err) {
      setError(userFacingError(err, 'Could not load settings.'));
    } finally {
      setLoading(false);
    }
  }, [user, platform]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSaveName() {
    if (!user) return;
    setSaving(true);
    setSaved(false);
    try {
      const updated = await upsertProfile(user.id, displayName.trim());
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(userFacingError(err, 'Could not save.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteData() {
    if (!user) return;
    setDeleting(true);
    try {
      await deleteAllUserData(user.id);
      await signOut();
    } catch (err) {
      setError(userFacingError(err, 'Could not delete data.'));
      setDeleting(false);
    }
  }

  if (loading) return <CenteredLoader label="Loading settings..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your account, review platform capabilities, and control your
          data.
        </p>
      </div>

      {/* Account */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <User size={18} className="text-slate-400" />
          <h3 className="text-base font-semibold text-slate-900">Account</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Display name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
              />
              <Button
                onClick={handleSaveName}
                disabled={saving || displayName.trim() === (profile?.display_name ?? '')}
              >
                {saving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : saved ? (
                  <Check size={14} />
                ) : null}
                {saved ? 'Saved' : 'Save'}
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Email
            </label>
            <p className="text-sm text-slate-500 rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5">
              {user?.email}
            </p>
          </div>
        </div>
      </Card>

      {/* Platform capabilities */}
      <Card>
        <div className="flex items-center gap-2 mb-1">
          <Monitor size={18} className="text-slate-400" />
          <h3 className="text-base font-semibold text-slate-900">
            Platform capabilities
          </h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          What Sentinel can check on this platform ({platform}). Some
          capabilities require a native app or local security agent.
        </p>
        <div className="space-y-2.5">
          {caps.length > 0 ? (
            caps.map((cap) => <CapabilityRow key={cap.capability} cap={cap} />)
          ) : (
            <p className="text-sm text-slate-500">
              No capability information available.
            </p>
          )}
        </div>
      </Card>

      {/* Privacy */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={18} className="text-slate-400" />
          <h3 className="text-base font-semibold text-slate-900">
            Your privacy
          </h3>
        </div>
        <ul className="space-y-2.5 text-sm text-slate-600">
          <li className="flex items-start gap-2.5">
            <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />
            We never store your passwords or private messages.
          </li>
          <li className="flex items-start gap-2.5">
            <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />
            Checkup answers are stored only in your account and never shared.
          </li>
          <li className="flex items-start gap-2.5">
            <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />
            Breach checks send only your email address to the breach database.
          </li>
          <li className="flex items-start gap-2.5">
            <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />
            You can delete all your data at any time.
          </li>
        </ul>
      </Card>

      {/* About */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Info size={18} className="text-slate-400" />
          <h3 className="text-base font-semibold text-slate-900">About</h3>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          Sentinel is a personal digital hygiene platform. It helps you
          understand your security posture, identify risks, and follow
          step-by-step remediation. It is not an antivirus replacement.
        </p>
      </Card>

      {/* Danger zone */}
      <Card className="border-red-200">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={18} className="text-red-500" />
          <h3 className="text-base font-semibold text-slate-900">
            Delete all data
          </h3>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          This permanently deletes your checkup history, scores, issues, and
          playbook progress. This cannot be undone.
        </p>
        {!deleteConfirm ? (
          <Button variant="danger" size="sm" onClick={() => setDeleteConfirm(true)}>
            <Trash2 size={14} />
            Delete my data
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteData}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
              {deleting ? 'Deleting...' : 'Yes, delete everything'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirm(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
          </div>
        )}
      </Card>

      {/* Sign out */}
      <div className="pt-2">
        <Button variant="outline" fullWidth onClick={() => signOut()}>
          <LogOut size={16} />
          Sign out
        </Button>
      </div>
    </div>
  );
}

function CapabilityRow({ cap }: { cap: SecurityCapability }) {
  const styles: Record<string, { dot: string; label: string; text: string }> = {
    supported: { dot: 'bg-emerald-500', label: 'Supported', text: 'text-emerald-700' },
    partial: { dot: 'bg-amber-500', label: 'Partial', text: 'text-amber-700' },
    unsupported: { dot: 'bg-slate-300', label: 'Unsupported', text: 'text-slate-500' },
  };
  const s = styles[cap.status] ?? styles.unsupported;
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-2.5">
      <span className="text-sm text-slate-700">
        {capabilityLabels[cap.capability] ?? cap.capability.replace(/_/g, ' ')}
      </span>
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${s.dot}`} />
        <span className={`text-xs font-medium ${s.text}`}>{s.label}</span>
      </div>
    </div>
  );
}
