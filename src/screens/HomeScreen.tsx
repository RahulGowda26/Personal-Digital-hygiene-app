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
            <h1 className="font-marker text-[32px] md:text-5xl font-bold tracking-wide">Home</h1>
            <p className="text-base font-hand font-bold text-slate-500 mt-1">
              {new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}
            </p>
          </div>
          <button className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-slate-800 bg-yellow-300 flex items-center justify-center text-slate-900 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] active:translate-y-0.5 active:shadow-[0px_0px_0px_0px_rgba(30,41,59,1)] transition-all">
            <Calendar size={24} className="stroke-[2.5]" />
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

            <div className="simple-card p-5 pb-4 bg-white flex flex-col justify-between order-2 lg:order-1">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-marker font-bold text-slate-900 text-lg mb-1">7-Day Posture</h3>
                  <p className="text-xs font-hand font-bold text-slate-500 uppercase tracking-wider">Device Score Trend</p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-800 rounded-full border-2 border-slate-800 shadow-[2px_2px_0px_0px_rgba(22,101,52,1)]">
                  <TrendingUp size={14} className="stroke-[3]" />
                  <span className="text-sm font-hand font-bold tracking-wide">Growing</span>
                </div>
              </div>
              
              <div className="h-40 w-full mb-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={scoreColorHex} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={scoreColorHex} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 12, fill: '#64748b', fontFamily: '"Patrick Hand", cursive'}} 
                      dy={10}
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 12, fill: '#64748b', fontFamily: '"Patrick Hand", cursive'}}
                      dx={-10}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '2px solid #1e293b', boxShadow: '4px 4px 0px 0px rgba(30,41,59,1)', fontFamily: '"Patrick Hand", cursive', fontWeight: 'bold' }}
                      itemStyle={{ color: scoreColorHex, fontWeight: 'bold' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      stroke={scoreColorHex} 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorScore)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            {deviceInfo && (
              <div className="simple-card p-6">
                <p className="text-xs font-hand font-bold text-slate-500 uppercase tracking-widest mb-2">OS Status</p>
                <div className="flex items-center justify-between">
                  <span className="font-marker font-bold">Android {deviceInfo.osVersion}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${deviceInfo.isOutdated ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {deviceInfo.isOutdated ? 'Outdated' : 'Secure'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6 md:gap-8">
            <div className="simple-card overflow-hidden order-1 lg:order-2 flex-1 flex flex-col justify-center relative p-8 md:p-10">
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
              <div className="flex flex-col items-center justify-center z-10 w-full h-full">
                <div className="relative w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 mb-6">
                  <svg className="w-full h-full transform -rotate-90 filter drop-shadow-md" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke={scoreColorHex} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${hasScanned ? (score / 100) * 264 : 0} 264`} className="transition-all duration-1500 ease-out" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[56px] md:text-[64px] lg:text-[72px] font-marker font-bold leading-none tracking-tighter" style={{ color: scoreColorHex }}>
                      {hasScanned ? score : '--'}
                    </span>
                    <span className="text-sm font-hand font-bold text-slate-500 uppercase tracking-widest mt-1">
                      {hasScanned ? 'Score' : 'Unscanned'}
                    </span>
                  </div>
                </div>
                <div className="text-center w-full mt-4">
                  <h2 className="text-2xl font-marker font-bold text-slate-900 mb-2">
                    {hasScanned ? 'Security Score' : 'Action Required'}
                  </h2>
                  <p className="text-base font-hand text-slate-600 max-w-sm mx-auto">
                    {hasScanned ? 'Your device security posture based on recent scans.' : 'Run a checkup to assess your device security posture.'}
                  </p>
                  {!hasScanned && (
                    <button onClick={() => navigate('/issues')} className="simple-button mt-6 w-full max-w-[200px] mx-auto py-3 px-6 flex items-center justify-center gap-2">
                      <Zap size={20} className="fill-yellow-400 stroke-yellow-400" />
                      Start Checkup
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 flex flex-col gap-6 md:gap-8">
            <div className="simple-card p-6 flex flex-col justify-between flex-1 min-h-[160px]">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Smartphone size={20} className="text-slate-900" />
                  <h3 className="text-lg md:text-xl font-black leading-tight text-slate-900">Scan Device</h3>
                </div>
                <p className="text-xs md:text-sm font-medium text-slate-500 mt-2">Run an automated sweep of your device, network, and apps.</p>
              </div>
              <button onClick={onRunCheckup} className="mt-6 w-full simple-button py-3 text-sm">Start Scan</button>
            </div>
            <div className="simple-card p-6 flex flex-col justify-between flex-1 min-h-[160px]">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <ShieldCheck size={20} className="text-[#ff6b52]" />
                  <h3 className="text-lg md:text-xl font-black leading-tight text-slate-900">Security Habits</h3>
                </div>
                <p className="text-xs md:text-sm font-medium text-slate-500 mt-2">Assess your human security vulnerabilities.</p>
              </div>
              <button onClick={onRunHabitsCheckup} className="mt-6 w-full simple-button py-3 text-sm">Answer Questions</button>
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
