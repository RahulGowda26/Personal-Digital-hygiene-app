import { useCallback, useEffect, useState } from 'react';
import {
  Calendar,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  AppWindow,
  EyeOff,
  Globe,
} from 'lucide-react';
import type { DashboardData } from '@/types';
import { fetchDashboard, ensureDevice } from '@/services/api';
import { useAuth } from '@/auth/AuthContext';
import { CenteredLoader, ErrorState } from '@/components/ui/Spinner';
import { userFacingError } from '@/lib/errors';
import { SentinelDeviceScanner } from '@/platform/capacitor/DeviceScannerBridge';
import { Capacitor } from '@capacitor/core';

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
    <div className="pb-24 md:pb-8 text-slate-900 font-sans w-full">
      <div className="w-full pt-2 md:pt-4">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 md:mb-10">
          <div>
            <h1 className="text-[28px] md:text-4xl font-bold tracking-tight">Home</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              {new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}
            </p>
          </div>
          <button className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100 text-slate-700 hover:bg-slate-50 transition-colors">
            <Calendar size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          
          {/* Left Column (Timeline & Primary Score) */}
          <div className="lg:col-span-5 flex flex-col gap-6 md:gap-8">
            
            {/* Timeline Widget */}
            <div className="flex justify-between items-center px-1">
              {generateTimeline(data.historicalScores || []).map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">{item.day}</span>
                  <div 
                    className={`w-[38px] h-[38px] md:w-11 md:h-11 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-all
                      ${item.active 
                        ? 'text-white shadow-[0_4px_14px_rgba(0,0,0,0.1)]' 
                        : item.hasData 
                          ? 'bg-[#1c1c1e] text-white' 
                          : 'bg-[#e5e5ea] text-slate-400'
                      }`}
                    style={item.active ? { backgroundColor: scoreColorHex } : {}}
                  >
                    {item.date}
                  </div>
                </div>
              ))}
            </div>

            {/* Primary Score */}
            <div className="simple-card p-6 md:p-8 flex justify-between items-end flex-1">
              <div>
                <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Security Score</p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-[48px] md:text-[64px] font-black tracking-tighter leading-none">{hasScanned ? score : '-'}</span>
                  {hasScanned && <span className="text-xl md:text-2xl font-bold text-slate-400">/100</span>}
                </div>
                <p className="text-sm font-semibold text-slate-500">
                  {hasScanned ? <span>This week <span style={{ color: scoreColorHex }}>{trend} ↑</span></span> : <span>Scan pending</span>}
                </p>
              </div>
              
              {/* Mini Bar Chart Mock */}
              <div className="flex items-end gap-2 md:gap-2.5 h-20 md:h-24 pb-1">
                {generateTimeline(data.historicalScores || []).map((item, idx) => (
                  <div 
                    key={idx}
                    className={`w-[6px] md:w-2 rounded-full transition-all duration-1000 ${
                      item.active 
                        ? '' // we'll use inline style for active color
                        : item.hasData 
                          ? 'bg-slate-300' 
                          : 'bg-[#f1f1f3]'
                    }`}
                    style={{ 
                      height: item.hasData ? `${Math.max(10, item.score)}%` : '10%',
                      ...(item.active ? { backgroundColor: scoreColorHex } : {})
                    }}
                  />
                ))}
              </div>
            </div>

          </div>

          {/* Middle Column (Data Rings & Bars) */}
          <div className="lg:col-span-4 flex flex-col gap-6 md:gap-8">
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-6 md:gap-8 h-full">
              
              {/* Overall Protection Ring */}
              <div className="simple-card p-6 md:p-8 flex flex-col items-center justify-between relative flex-1">
                <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest absolute top-6 left-6">Overall</p>
                
                <div className="relative mt-6 md:mt-8 flex items-center justify-center">
                  <svg className="w-28 h-28 md:w-36 md:h-36 transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="#f1f1f3" strokeWidth="10" fill="transparent" />
                    <circle cx="50" cy="50" r="40" stroke={scoreColorHex} strokeWidth="10" fill="transparent" strokeDasharray={`${(score / 100) * 251.327} 251.327`} strokeLinecap="round" className="drop-shadow-sm transition-all duration-1000 ease-out" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl md:text-3xl font-black">{score}%</span>
                  </div>
                </div>

                <div className="text-center mt-4">
                  <span className="text-base font-bold" style={{ color: scoreColorHex }}>{score}</span>
                  <span className="text-base font-bold text-slate-400"> / 100 pts</span>
                </div>
              </div>

              {/* Sub-scores */}
              <div className="simple-card p-6 md:p-8 flex flex-col justify-center gap-4 flex-1">
                {deviceInfo && (
                  <div className="mb-1 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Android {deviceInfo.osVersion}</p>
                      <p className="text-[10px] text-slate-500">Patch: {deviceInfo.securityPatch}</p>
                    </div>
                    {deviceInfo.isOutdated ? (
                      <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md">Outdated</span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md">Up to date</span>
                    )}
                  </div>
                )}
                <MacroBar label="Device" current={deviceScore} total={100} />
                <div className="w-full h-px bg-slate-100 my-1"></div>
                <MacroBar label="Apps" current={appScore} total={100} />
                <div className="w-full h-px bg-slate-100 my-1"></div>
                <MacroBar label="Privacy" current={privacyScore} total={100} />
              </div>

            </div>
          </div>

          {/* Right Column (Action Cards) */}
          <div className="lg:col-span-3 flex flex-col gap-6 md:gap-8">
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-6 md:gap-8 h-full">
              
              <div className="simple-card p-6 md:p-8 flex flex-col justify-between flex-1 min-h-[160px]">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Smartphone size={20} className="text-slate-900" />
                    <h3 className="text-lg md:text-xl font-black leading-tight text-slate-900">Scan Device</h3>
                  </div>
                  <p className="text-xs md:text-sm font-medium text-slate-500 leading-snug mt-2">Run an automated sweep of your device, network, and apps for risks.</p>
                </div>
                <button 
                  onClick={onRunCheckup}
                  className="mt-6 w-full simple-button py-3 text-sm flex items-center justify-center gap-2"
                >
                  Start Scan
                </button>
              </div>

              <div className="simple-card p-6 md:p-8 flex flex-col justify-between flex-1 min-h-[160px]">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <ShieldCheck size={20} className="text-[#ff6b52]" />
                    <h3 className="text-lg md:text-xl font-black leading-tight text-slate-900">Security Habits</h3>
                  </div>
                  <p className="text-xs md:text-sm font-medium text-slate-500 leading-snug mt-2">Answer a quick questionnaire to assess your human security vulnerabilities.</p>
                </div>
                <button 
                  onClick={onRunHabitsCheckup}
                  className="mt-6 w-full simple-button py-3 text-sm flex items-center justify-center gap-2"
                >
                  Answer Questions
                </button>
              </div>

            </div>
          </div>

        </div>

        {/* Educational Info Row */}
        <div className="mt-6 md:mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div className="simple-card p-6 md:p-8">
            <h3 className="text-base font-semibold mb-2 text-slate-900">Why Device Hygiene Matters</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Even with strong passwords, outdated software or rogue permissions can give attackers a backdoor into your digital life. Regular automated scanning prevents silent compromises.
            </p>
          </div>
          <div className="simple-card p-6 md:p-8">
            <h3 className="text-base font-semibold mb-2 text-slate-900">The Human Element</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Cybersecurity isn't just about software; it's about habits. Clicking unknown links, reusing passwords, and over-sharing online are the leading causes of modern identity theft.
            </p>
          </div>
          <div className="simple-card p-6 md:p-8">
            <h3 className="text-base font-semibold mb-2 text-slate-900">Network Safety</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Connecting to public Wi-Fi without proper encryption exposes your traffic. Always ensure you are on a trusted network or use a reputable VPN when traveling.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

function MacroBar({ label, current, total }: { label: string, current: number, total: number }) {
  const percentage = Math.round((current / total) * 100);
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex justify-between items-center w-full">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
        <div className="text-[10px] font-bold text-slate-700">
          {current} <span className="text-slate-400">/ {total}</span>
        </div>
      </div>
      <div className="w-full h-1.5 bg-[#f1f1f3] rounded-full overflow-hidden">
        <div 
          className="h-full bg-slate-800 rounded-full transition-all duration-500" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}
