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
import { SecurityScanner } from '@/engine/SecurityScanner';
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

export function SettingsScreen({ onOpenDiagnostics }: { onOpenDiagnostics?: () => void }) {
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
  const [debugResult, setDebugResult] = useState<string | null>(null);

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
    <div className="max-w-2xl mx-auto space-y-6 pt-4 pb-24">
      <div>
        <h1 className="text-3xl font-outline text-outline-glow tracking-widest uppercase">System Settings</h1>
        <p className="text-sm font-sans text-cyber-textMuted mt-1">
          Manage your identity parameters and platform capabilities.
        </p>
      </div>

      {/* Account */}
      <div className="cyber-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <User size={18} className="text-cyber-neon" />
          <h3 className="text-sm font-sans font-bold uppercase tracking-widest text-white">Identity</h3>
        </div>
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-sans font-bold uppercase tracking-widest text-cyber-textMuted mb-2">
              Designation
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="flex-1 rounded-lg border border-cyber-neon/30 bg-cyber-bg px-4 py-2 text-sm font-sans text-white placeholder-cyber-textMuted focus:outline-none focus:border-cyber-neon focus:shadow-[0_0_10px_rgba(255,42,66,0.2)]"
              />
              <button
                onClick={handleSaveName}
                disabled={saving || displayName.trim() === (profile?.display_name ?? '')}
                className="px-6 py-2 bg-cyber-neon/10 border border-cyber-neon text-cyber-neon font-sans font-semibold rounded-lg hover:bg-cyber-neon hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : saved ? (
                  <Check size={16} />
                ) : (
                  'Update'
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-sans font-bold uppercase tracking-widest text-cyber-textMuted mb-2">
              Comm Link (Email)
            </label>
            <p className="text-sm font-sans text-cyber-textMuted rounded-lg bg-cyber-surface/50 border border-cyber-neon/10 px-4 py-3">
              {user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Platform capabilities */}
      <div className="cyber-card p-6">
        <div className="flex items-center gap-2 mb-2">
          <Monitor size={18} className="text-cyber-neon" />
          <h3 className="text-sm font-sans font-bold uppercase tracking-widest text-white">
            System Capabilities
          </h3>
        </div>
        <p className="text-xs font-sans text-cyber-textMuted mb-6">
          Diagnostic capability for platform ({platform}). Some sensors require deep integration.
        </p>
        <div className="space-y-3">
          {caps.length > 0 ? (
            caps.map((cap) => <CapabilityRow key={cap.capability} cap={cap} />)
          ) : (
            <p className="text-sm font-sans text-cyber-textMuted">
              No capability information available.
            </p>
          )}
        </div>
      </div>

      {/* Privacy */}
      <div className="cyber-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck size={18} className="text-cyber-neon" />
          <h3 className="text-sm font-sans font-bold uppercase tracking-widest text-white">
            Data Integrity
          </h3>
        </div>
        <ul className="space-y-3 text-sm font-sans text-cyber-textMuted">
          <li className="flex items-start gap-3">
            <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />
            Zero-knowledge architecture: Passwords/messages remain encrypted.
          </li>
          <li className="flex items-start gap-3">
            <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />
            Telemetry is sandboxed and never shared.
          </li>
          <li className="flex items-start gap-3">
            <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />
            Threat analysis utilizes k-anonymity for breach verification.
          </li>
          <li className="flex items-start gap-3">
            <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />
            Full data purge capability available below.
          </li>
        </ul>
      </div>

      {/* About */}
      <div className="cyber-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Info size={18} className="text-cyber-neon" />
          <h3 className="text-sm font-sans font-bold uppercase tracking-widest text-white">System Info</h3>
        </div>
        <p className="text-sm font-sans text-cyber-textMuted leading-relaxed">
          Sentinel is an advanced threat evaluation protocol. It maps your vulnerability surface, highlights exploit vectors, and provides remediation paths. It does not replace active defense countermeasures.
        </p>
      </div>

      {/* Debug Diagnostics */}
      <div className="cyber-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Monitor size={18} className="text-cyber-neon" />
          <h3 className="text-sm font-sans font-bold uppercase tracking-widest text-white">Diagnostics</h3>
        </div>
        <p className="text-sm font-sans text-cyber-textMuted leading-relaxed mb-6">
          Access raw telemetry and verify native sensor links.
        </p>
        <button 
          className="px-6 py-2 bg-cyber-surface border border-cyber-neon/30 text-cyber-textMuted font-sans font-semibold rounded-lg hover:border-cyber-neon hover:text-cyber-neon transition-colors"
          onClick={() => onOpenDiagnostics?.()}
        >
          Initialize Diagnostics
        </button>
      </div>

      {/* Danger zone */}
      <div className="cyber-card p-6 border-red-500/30">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={18} className="text-red-500" />
          <h3 className="text-sm font-sans font-bold uppercase tracking-widest text-red-500">
            Purge Data
          </h3>
        </div>
        <p className="text-sm font-sans text-cyber-textMuted mb-6">
          Permanent deletion of all telemetry, scores, and mission progress. This action is irreversible.
        </p>
        {!deleteConfirm ? (
          <button 
            className="flex items-center gap-2 px-6 py-2 bg-red-500/10 border border-red-500/30 text-red-500 font-sans font-semibold rounded-lg hover:bg-red-500 hover:text-white transition-colors"
            onClick={() => setDeleteConfirm(true)}
          >
            <Trash2 size={16} />
            Initiate Purge
          </button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              className="flex items-center justify-center gap-2 px-6 py-2 bg-red-500 border border-red-500 text-white font-sans font-semibold rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.4)] disabled:opacity-50"
              onClick={handleDeleteData}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
              {deleting ? 'Purging...' : 'Confirm Purge'}
            </button>
            <button
              className="px-6 py-2 bg-cyber-surface border border-cyber-textMuted text-cyber-textMuted font-sans font-semibold rounded-lg hover:border-white hover:text-white transition-colors disabled:opacity-50"
              onClick={() => setDeleteConfirm(false)}
              disabled={deleting}
            >
              Abort
            </button>
          </div>
        )}
      </div>

      {/* Sign out */}
      <div className="pt-4">
        <button 
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-cyber-surface/50 border border-cyber-neon/20 text-cyber-textMuted font-sans font-bold uppercase tracking-widest hover:border-cyber-neon hover:text-cyber-neon transition-colors rounded-lg"
          onClick={() => signOut()}
        >
          <LogOut size={18} />
          Disconnect
        </button>
      </div>
    </div>
  );
}

function CapabilityRow({ cap }: { cap: SecurityCapability }) {
  const styles: Record<string, { dot: string; label: string; text: string }> = {
    supported: { dot: 'bg-emerald-500', label: 'Online', text: 'text-emerald-500' },
    partial: { dot: 'bg-amber-500', label: 'Degraded', text: 'text-amber-500' },
    unsupported: { dot: 'bg-cyber-textMuted', label: 'Offline', text: 'text-cyber-textMuted' },
  };
  const s = styles[cap.status] || styles.unsupported;
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-cyber-bg border border-cyber-neon/10">
      <span className="text-sm font-sans font-semibold text-white">
        {capabilityLabels[cap.capability] || cap.capability}
      </span>
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-sans font-bold uppercase tracking-widest ${s.text}`}>
          {s.label}
        </span>
        <div className={`w-2 h-2 rounded-full ${s.dot} shadow-[0_0_8px_currentColor]`} />
      </div>
    </div>
  );
}
