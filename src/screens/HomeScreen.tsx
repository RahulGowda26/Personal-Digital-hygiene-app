import { useCallback, useEffect, useState } from 'react';
import {
  ShieldCheck,
  Smartphone,
  AppWindow,
  EyeOff,
  Globe,
  TrendingUp,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import type { DashboardData } from '@/types';
import { fetchDashboard, ensureDevice } from '@/services/api';
import { useAuth } from '@/auth/AuthContext';
import { CenteredLoader, ErrorState } from '@/components/ui/Spinner';
import { userFacingError } from '@/lib/errors';
import { SentinelDeviceScanner } from '@/platform/capacitor/DeviceScannerBridge';
import { Capacitor } from '@capacitor/core';
import { ThreatFeedWidget } from '@/components/dashboard/ThreatFeedWidget';

interface DeviceInfo {
  osVersion: string;
  securityPatch: string;
  isOutdated: boolean;
}

function generateTimeline(historicalScores: Array<{ date: string; score: number }> = []) {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date();
  const timeline = [];
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    const scoreEntry = historicalScores.find(s => s.date === dateStr);
    
    timeline.push({
      day: days[d.getDay()],
      date: d.getDate(),
      active: i === 0,
      hasData: !!scoreEntry,
      score: scoreEntry ? scoreEntry.score : 0,
    });
  }
  return timeline;
}

interface HomeScreenProps {
  onRunCheckup: () => void;
  onScanNetwork: () => void;
  onRunHabitsCheckup: () => void;
  onFixNow: () => void;
  onViewIssues: () => void;
}

export function HomeScreen({ 
  onRunCheckup, 
  onScanNetwork,
  onRunHabitsCheckup,
  onFixNow,
  onViewIssues 
}: HomeScreenProps) {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      await ensureDevice(user.id, 'web');
      const dashboard = await fetchDashboard(user.id);
      setData(dashboard);
      
      if (Capacitor.isNativePlatform()) {
        const signals = await SentinelDeviceScanner.getDeviceSignals({ sessionId: 'home' });
        let isOutdated = false;
        if (signals.securityPatch) {
          const patchDate = new Date(signals.securityPatch);
          if (!isNaN(patchDate.getTime())) {
            const diffDays = (Date.now() - patchDate.getTime()) / (1000 * 60 * 60 * 24);
            if (diffDays > 180) isOutdated = true;
          }
        }
        setDeviceInfo({
          osVersion: signals.osVersion,
          securityPatch: signals.securityPatch,
          isOutdated
        });
      }
    } catch (err) {
      setError(userFacingError(err, 'Failed to load dashboard.'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <CenteredLoader label="Loading your dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return null;

  const deviceScore = data.latestScore?.components?.find(c => c.category === 'device_security')?.score ?? 0;
  // Fall back to 0 if trueDeviceScore is null, otherwise it correctly ignores habit checkup overrides.
  const score = data.trueDeviceScore ?? 0;
  const appScore = data.latestScore?.components?.find(c => c.category === 'app_security')?.score ?? 0;
  const privacyScore = data.latestScore?.components?.find(c => c.category === 'privacy')?.score ?? 0;
  const hasScanned = score > 0;
  
  const getScoreColor = (s: number) => {
    if (s >= 90) return '#10b981'; // emerald-500
    if (s >= 75) return '#f59e0b'; // amber-500
    if (s >= 55) return '#ff6b52'; // coral
    return '#ef4444'; // red-500
  };
  const scoreColorHex = getScoreColor(score);
  
  // Calculate trend
  const trend = hasScanned ? "+5.0 pts" : "Ready";
  const trendColor = hasScanned ? `text-[${scoreColorHex}]` : "text-slate-400";

  return (
    <div className="pb-24 md:pb-8 w-full flex flex-col items-center relative min-h-[calc(100vh-80px)]">
      
      {/* Background Graphic Placeholder (Raven / Celtic knot) */}
      <div className="absolute top-0 inset-x-0 h-[400px] pointer-events-none overflow-hidden flex justify-center opacity-30">
        <div className="w-[350px] h-[350px] rounded-full border border-cyber-neon/20 shadow-[0_0_50px_rgba(255,42,66,0.1)] absolute top-[-50px]"></div>
        <div className="w-[250px] h-[250px] rounded-full border border-cyber-neon/40 shadow-[0_0_100px_rgba(255,42,66,0.2)] absolute top-0 bg-cyber-neon/5"></div>
      </div>

      {/* Hero Typography Section */}
      <div className="relative mt-12 md:mt-20 flex flex-col items-center w-full max-w-sm z-10">
        <div className="flex flex-col items-start w-full pl-4 relative">
          <span className="text-white font-sans font-semibold tracking-[0.3em] text-sm mb-[-10px] ml-1">
            SENTINEL
          </span>
          <div className="relative">
            <h1 className="font-outline text-outline-glow text-[100px] md:text-[120px] leading-none tracking-wider opacity-80 select-none">
              SCORE
            </h1>
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%] font-cursive text-[140px] text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] whitespace-nowrap">
              {hasScanned ? score : '-'}
            </span>
          </div>
        </div>

        {/* Date / Timeline Selector */}
        <div className="flex items-center justify-center gap-4 mt-12 md:mt-16 w-full">
          {generateTimeline(data.historicalScores || []).slice(2, 7).map((item, idx) => (
            <div 
              key={idx}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-sans font-bold text-sm transition-all ${
                item.active 
                  ? 'bg-cyber-neon text-white shadow-[0_0_15px_rgba(255,42,66,0.6)]' 
                  : 'text-cyber-textMuted hover:text-white'
              }`}
            >
              {item.date < 10 ? `0${item.date}` : item.date}
            </div>
          ))}
        </div>
      </div>

      {/* Action Pills Grid */}
      <div className="w-full max-w-md mt-12 md:mt-16 grid grid-cols-2 gap-4 px-4 z-10">
        
        <button 
          onClick={onViewIssues}
          className="cyber-card p-4 flex flex-col items-start gap-1 justify-center relative group overflow-hidden"
        >
          <div className="absolute top-2 right-2 p-1 opacity-50 group-hover:opacity-100 transition-opacity">
            <AlertTriangle size={18} className="text-cyber-neon" />
          </div>
          <span className="text-cyber-neon font-sans font-semibold text-sm">Issues</span>
          <span className="text-cyber-textMuted text-[10px] md:text-xs leading-tight w-[80%] text-left">
            Review vulnerabilities
          </span>
        </button>

        <button 
          onClick={onRunCheckup}
          className="cyber-card p-4 flex flex-col items-start gap-1 justify-center relative group overflow-hidden"
        >
          <div className="absolute top-2 right-2 p-1 opacity-50 group-hover:opacity-100 transition-opacity">
            <Zap size={18} className="text-cyber-neon" />
          </div>
          <span className="text-cyber-neon font-sans font-semibold text-sm">Scan</span>
          <span className="text-cyber-textMuted text-[10px] md:text-xs leading-tight w-[80%] text-left">
            Analyze device security
          </span>
        </button>

        <button 
          onClick={onRunHabitsCheckup}
          className="cyber-card p-4 flex flex-col items-start gap-1 justify-center relative group overflow-hidden"
        >
          <div className="absolute top-2 right-2 p-1 opacity-50 group-hover:opacity-100 transition-opacity">
            <ShieldCheck size={18} className="text-cyber-neon" />
          </div>
          <span className="text-cyber-neon font-sans font-semibold text-sm">Habits</span>
          <span className="text-cyber-textMuted text-[10px] md:text-xs leading-tight w-[80%] text-left">
            Update security posture
          </span>
        </button>

        <button 
          onClick={onScanNetwork}
          className="cyber-card p-4 flex flex-col items-start gap-1 justify-center relative group overflow-hidden"
        >
          <div className="absolute top-2 right-2 p-1 opacity-50 group-hover:opacity-100 transition-opacity">
            <Globe size={18} className="text-cyber-neon" />
          </div>
          <span className="text-cyber-neon font-sans font-semibold text-sm">Network</span>
          <span className="text-cyber-textMuted text-[10px] md:text-xs leading-tight w-[80%] text-left">
            Check connection safety
          </span>
        </button>

      </div>

      <ThreatFeedWidget />

      {/* Action Required Banner */}
      {score > 0 && score < 90 && (
        <div className="w-full max-w-md mt-6 px-4 z-10">
          <div className="bg-cyber-surface/80 border-l-4 border-cyber-neon p-4 rounded-r-xl shadow-[0_0_15px_rgba(255,42,66,0.1)] relative overflow-hidden group cursor-pointer" onClick={onViewIssues}>
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,42,66,0.1)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h4 className="text-white font-outline uppercase tracking-wider text-sm mb-1 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-cyber-neon" />
                  Action Required
                </h4>
                <p className="text-cyber-textMuted font-mono text-[10px] uppercase tracking-wide">
                  Vulnerabilities detected. Review required.
                </p>
              </div>
              <div className="text-cyber-neon bg-cyber-neon/10 p-2 rounded-lg">
                <TrendingUp size={20} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Status / Provenance Meter */}
      <div className="w-full max-w-md mt-8 px-4 z-10">
        <h3 className="text-cyber-neon font-mono text-[10px] uppercase tracking-[0.2em] mb-4 pl-2 border-l border-cyber-neon/50">System Status</h3>
        <div className="bg-cyber-surface/50 border border-cyber-neon/20 p-4 rounded-[20px] flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyber-bg border border-cyber-neon/30 flex items-center justify-center text-cyber-neon">
                <Smartphone size={16} />
              </div>
              <div>
                <p className="text-white font-bold text-xs uppercase tracking-wide">Device Integrity</p>
                <p className="text-cyber-textMuted font-mono text-[9px] uppercase">Hardware backed</p>
              </div>
            </div>
            <div className="text-emerald-400 font-mono text-xs font-bold bg-emerald-950/30 px-2 py-1 rounded border border-emerald-500/30">
              SECURE
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyber-bg border border-cyber-neon/30 flex items-center justify-center text-cyber-neon">
                <AppWindow size={16} />
              </div>
              <div>
                <p className="text-white font-bold text-xs uppercase tracking-wide">App Telemetry</p>
                <p className="text-cyber-textMuted font-mono text-[9px] uppercase">Zero-cloud local</p>
              </div>
            </div>
            <div className="text-emerald-400 font-mono text-xs font-bold bg-emerald-950/30 px-2 py-1 rounded border border-emerald-500/30">
              PRIVATE
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyber-bg border border-cyber-neon/30 flex items-center justify-center text-cyber-neon">
                <EyeOff size={16} />
              </div>
              <div>
                <p className="text-white font-bold text-xs uppercase tracking-wide">Data Provenance</p>
                <p className="text-cyber-textMuted font-mono text-[9px] uppercase">On-device evaluation</p>
              </div>
            </div>
            <div className="text-emerald-400 font-mono text-xs font-bold bg-emerald-950/30 px-2 py-1 rounded border border-emerald-500/30">
              VERIFIED
            </div>
          </div>
        </div>
      </div>

      {/* Active Defenses & Data Privacy */}
      <div className="w-full max-w-md mt-8 px-4 z-10 flex flex-col md:flex-row gap-4">
        {/* Active Defenses */}
        <div className="flex-1 bg-cyber-bg border border-cyber-neon/20 p-4 rounded-[20px] shadow-[0_0_15px_rgba(255,42,66,0.05)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyber-neon/5 rounded-full blur-2xl group-hover:bg-cyber-neon/10 transition-colors" />
          <h3 className="text-white font-sans font-bold text-sm mb-3">Active Defenses</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-[10px] font-mono text-cyber-textMuted mb-1 uppercase">
                <span>Network Encryption</span>
                <span className="text-emerald-400">ON</span>
              </div>
              <div className="h-1 w-full bg-cyber-surface rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-full" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] font-mono text-cyber-textMuted mb-1 uppercase">
                <span>Jailbreak Det.</span>
                <span className="text-emerald-400">ON</span>
              </div>
              <div className="h-1 w-full bg-cyber-surface rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-full" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] font-mono text-cyber-textMuted mb-1 uppercase">
                <span>App Sandboxing</span>
                <span className="text-emerald-400">ON</span>
              </div>
              <div className="h-1 w-full bg-cyber-surface rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Data & Privacy Inventory */}
        <div className="flex-1 bg-cyber-bg border border-cyber-neon/20 p-4 rounded-[20px] shadow-[0_0_15px_rgba(255,42,66,0.05)] flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyber-neon/5 rounded-full blur-2xl" />
          <div>
            <h3 className="text-white font-sans font-bold text-sm mb-1">Data Inventory</h3>
            <p className="text-cyber-textMuted font-mono text-[9px] uppercase">Local telemetry only</p>
          </div>
          <div className="mt-4 flex gap-4">
            <div>
              <div className="text-2xl font-outline text-white font-bold leading-none">0</div>
              <div className="text-cyber-textMuted font-mono text-[8px] uppercase mt-1">Cloud<br/>Syncs</div>
            </div>
            <div>
              <div className="text-2xl font-outline text-cyber-neon font-bold leading-none">12</div>
              <div className="text-cyber-textMuted font-mono text-[8px] uppercase mt-1">Local<br/>Audits</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const getScoreColor = (s: number) => {
    if (s >= 90) return 'bg-emerald-500';
    if (s >= 75) return 'bg-amber-500';
    if (s >= 55) return 'bg-orange-500';
    return 'bg-red-500';
  };
  const colorClass = getScoreColor(score);
  return (
    <div>
      <div className="flex justify-between text-base font-hand font-bold mb-2">
        <span className="text-slate-700">{label}</span>
        <span className="text-slate-900">{score > 0 ? `${score}/100` : '--/100'}</span>
      </div>
      <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden border-2 border-slate-800 shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.1)]">
        <div 
          className={`h-full ${colorClass} transition-all duration-1000 ease-out rounded-full border-r-2 border-slate-800`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
