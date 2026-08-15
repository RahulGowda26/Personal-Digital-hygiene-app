import { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Smartphone,
  AppWindow,
  XCircle,
  ShieldAlert,
  Search,
  FileText,
  Lock,
  Terminal,
  AlertTriangle,
  Wifi
} from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { SecurityScanner } from '@/engine/SecurityScanner';
import { supabase } from '@/lib/supabase';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { calculateDeviceScore } from '@/engine/riskEngine';
import type { ScanResult } from '@/types';
import type { ScanPhase } from '@/engine/SecurityScanner';
import { AppInventoryModal } from '@/components/ui/AppInventoryModal';

export type ExtendedScanPhase = ScanPhase | 'idle';

interface CheckupScreenProps {
  mode?: 'all' | 'network';
  onViewIssues: () => void;
  onBackHome: () => void;
}

export function CheckupScreen({
  mode = 'all',
  onViewIssues,
  onBackHome,
}: CheckupScreenProps) {
  const { user } = useAuth();
  const [phase, setPhase] = useState<ExtendedScanPhase>('idle');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [showAppInventory, setShowAppInventory] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const startScan = async () => {
    try {
      setScanResult(null);
      setLogs([]);
      setPhase('INITIALIZING');
      
      // Remove all past issues for this user if doing a full scan
      if (user && mode === 'all') {
        await supabase.from('security_findings').delete().eq('user_id', user.id);
      } else if (user && mode === 'network') {
        // If just network scan, delete only network findings
        await supabase.from('security_findings').delete().eq('user_id', user.id).eq('category', 'device_security').like('title', 'Network%');
      }

      const scanner = new SecurityScanner();
      
      const onProgress = (newPhase: ScanPhase) => setPhase(newPhase);
      const onLog = (log: string) => setLogs(prev => [...prev, log]);

      const result = mode === 'network' 
        ? await scanner.scanNetworkOnly(onProgress, onLog)
        : await scanner.scan(onProgress, onLog);

      console.log("[DATABASE INSERT START]");
      if (user && result.findings) {
        const { data: newCheckup, error: checkupError } = await supabase
          .from('checkups')
          .insert({ user_id: user.id, status: 'completed' })
          .select()
          .single();

        if (checkupError || !newCheckup) {
           console.error('Failed to create checkup for findings:', checkupError);
        } else {
          const findingRows = result.findings.map(f => ({
            user_id: user.id,
            checkup_id: newCheckup.id,
            category: f.category || 'device_security',
            title: f.title,
            description: f.evidence && f.evidence.length > 0 ? `${f.description}\n\nEvidence:\n- ${f.evidence.join('\n- ')}` : f.description,
            severity: f.severity,
            confidence: 'high',
            source: f.source,
            recommended_playbook: f.recommendedPlaybook,
            status: 'open',
            platform: Capacitor.getPlatform() === 'web' ? 'web' : 'android',
            detected_at: new Date().toISOString()
          }));
          
          if (findingRows.length > 0) {
             const { error: dbError } = await supabase.from('security_findings').insert(findingRows);
             if (dbError) {
               console.error('Failed to insert findings:', JSON.stringify(dbError, null, 2));
             } else {
               console.log("[DATABASE INSERT SUCCESS]");
             }
          } else {
             console.log("[DATABASE INSERT SUCCESS] No findings to insert");
          }
        }
      }

      setScanResult(result);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Scanner error.');
      setPhase('idle');
    }
  };

  const currentPhase = phase;

  if (currentPhase === 'idle') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pt-10">
        <div className="text-center space-y-4 mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mb-4 shadow-sm">
            <Search className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900">Security Scan</h2>
          <p className="text-lg text-slate-600">
            Check your device for hidden apps and privacy risks.
          </p>
        </div>
        
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex flex-col items-center">
             <XCircle className="w-8 h-8 text-red-500 mb-2" />
             <p className="text-red-700 font-bold text-lg">Scan unavailable.</p>
             <p className="text-red-600 font-medium text-sm mt-1">{error}</p>
          </div>
        )}

        <div className="flex justify-center pt-8">
          <Button onClick={startScan} size="lg" className="w-full sm:w-auto px-12 py-6 text-xl shadow-md">
            Start Scan
          </Button>
        </div>
      </div>
    );
  }

  if (currentPhase !== 'COMPLETE') {
    return (
      <div className="max-w-3xl mx-auto space-y-6 flex flex-col items-center justify-center py-10 px-4">
        
        {/* Hacker Terminal UI */}
        <div className="w-full bg-[#03213D]/90 backdrop-blur-md rounded-xl border border-[#374365] overflow-hidden shadow-2xl font-mono text-sm">
          <div className="flex items-center gap-2 px-4 py-2 bg-[#062A48] border-b border-[#374365]">
            <Terminal className="w-4 h-4 text-[#669BBC]" />
            <span className="text-[#669BBC] font-semibold text-xs tracking-wider">SENTINEL SECURE TERMINAL v2.1.0</span>
          </div>
          
          <div className="p-4 h-80 overflow-y-auto custom-scrollbar flex flex-col gap-1 text-[#FDF0D5]">
            {logs.length === 0 && <span className="opacity-50">Initializing core systems...</span>}
            {logs.map((log, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-[#644765] whitespace-nowrap">[{new Date().toISOString().split('T')[1].slice(0,-1)}]</span>
                <span className={
                  log.includes('[OK]') ? 'text-emerald-400' :
                  log.includes('[WARN]') ? 'text-[#E6223A]' :
                  log.includes('[AI]') ? 'text-blue-400' : 'text-[#FDF0D5]'
                }>{log}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
            <div className="flex gap-2 items-center mt-2 animate-pulse text-[#669BBC]">
              <span>&gt;</span>
              <span className="w-2 h-4 bg-[#669BBC]" />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 mt-4">
          <Loader2 className="w-8 h-8 text-[#E6223A] animate-spin" />
          <h3 className="text-xl font-bold text-white tracking-wide uppercase">
            {currentPhase.replace('_', ' ')}
          </h3>
        </div>

      </div>
    );
  }

  if (scanResult) {
    if (scanResult.status === 'failed') {
      return (
        <div className="max-w-xl mx-auto py-20 text-center space-y-4">
          <ShieldAlert className="w-20 h-20 text-amber-500 mx-auto" />
          <h2 className="text-2xl font-bold text-slate-900">Scan Incomplete</h2>
          <p className="text-slate-600 text-lg">We couldn't fully scan your device right now.</p>
          <Button onClick={() => setPhase('idle')} variant="primary" className="mt-8 text-lg px-8 py-3">
            Try Again
          </Button>
        </div>
      );
    }

    const safeFindings = Array.isArray(scanResult?.findings) ? scanResult.findings : [];
    const hasFindings = safeFindings.length > 0;
    const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;

    if (mode === 'network') {
      const { ssid, ipAddress, deviceCount, connectedDevices } = scanResult.networkDetails || {};
      const networkSafe = !hasFindings;

      return (
        <div className="max-w-xl mx-auto space-y-6 pt-6 pb-20">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Network Scan Complete</h2>
          </div>

          <Card className="p-8 shadow-md border-slate-200">
            <div className="flex flex-col items-center mb-6">
              {networkSafe ? (
                <ShieldCheck className="w-16 h-16 text-emerald-500 mb-2" />
              ) : (
                <ShieldAlert className="w-16 h-16 text-amber-500 mb-2" />
              )}
              <h3 className="text-xl font-bold text-slate-800">
                {networkSafe ? 'Network looks safe' : 'Network needs attention'}
              </h3>
            </div>

            <div className="space-y-4 w-full">
              <div className="bg-slate-50 p-4 rounded-xl flex justify-between items-center border border-slate-100">
                <span className="text-slate-500 font-medium flex items-center gap-2"><Smartphone className="w-4 h-4"/> Wi-Fi Name (SSID)</span>
                <span className="font-bold text-slate-800">{ssid || 'Hidden by macOS Privacy'}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl flex justify-between items-center border border-slate-100">
                <span className="text-slate-500 font-medium flex items-center gap-2"><AppWindow className="w-4 h-4"/> Your IP Address</span>
                <span className="font-bold text-slate-800">{ipAddress || 'Unknown'}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl flex flex-col border border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium flex items-center gap-2"><Search className="w-4 h-4"/> Connected Devices</span>
                  <span className="font-bold text-emerald-600 text-lg">{deviceCount !== undefined ? deviceCount : 'Unknown'}</span>
                </div>
                {connectedDevices && connectedDevices.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap gap-2">
                    {connectedDevices.map((ip, idx) => (
                      <span key={idx} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 font-mono shadow-sm">
                        {ip}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Button onClick={onViewIssues} variant="primary" className="w-full text-lg py-4 shadow-sm" disabled={!hasFindings}>
            {hasFindings ? `View ${safeFindings.length} Finding${safeFindings.length > 1 ? 's' : ''}` : 'No Issues Found'}
          </Button>

          <Button onClick={onBackHome} variant="secondary" className="w-full text-lg py-4 border-slate-300 border bg-white text-slate-700">
            Go Home
          </Button>
        </div>
      );
    }

    let score: number | null = 0;
    let grade = 'F';
    try {
      const result = calculateDeviceScore(scanResult);
      score = result.score;
      grade = result.grade;
    } catch (e) {
      console.warn("Failed to calculate score:", e);
    }

    // On macOS, coverage might be low leading to a null score. Default to 100 if no findings.
    if (score === null) {
      score = hasFindings ? 50 : 100;
    }

    let scoreColor = 'text-emerald-500';
    let message = 'Your device looks good';
    if (score < 50) {
      scoreColor = 'text-red-500';
      message = 'Your device is at risk';
    } else if (score < 80) {
      scoreColor = 'text-amber-500';
      message = 'Your device needs attention';
    }

    const deviceIntegrityStatus = scanResult?.deviceIntegrity?.status || 'unknown';
    const isDeviceSafe = deviceIntegrityStatus === 'safe' || (isElectron && !hasFindings);
    const hasScannedApps = Array.isArray(scanResult?.apps) && scanResult.apps.length > 0;

    const appFindingsCount = safeFindings.filter(f => f.category === 'app_security').length;
    const networkFindingsCount = safeFindings.filter(f => f.category === 'device_security' && f.title.includes('Network')).length;
    const deviceFindingsCount = safeFindings.filter(f => f.category === 'device_security' && !f.title.includes('Network')).length;
    
    const appsScannedCount = scanResult?.apps?.length || 0;
    const connectedDevicesCount = scanResult?.networkDetails?.deviceCount !== undefined ? scanResult.networkDetails.deviceCount : 'Unknown';
    const isNetworkSafe = networkFindingsCount === 0;
    const totalPermissions = scanResult?.apps?.reduce((sum, app) => sum + (app.grantedPermissions?.length || 0), 0) || 0;

    return (
      <div className="max-w-xl mx-auto space-y-6 pt-6 pb-20">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Scan Complete</h2>
        </div>

        <Card className="p-8 shadow-md border-slate-200">
          <div className="flex flex-col items-center">
            <div className="mb-4">
              <span className={`text-6xl font-black ${scoreColor}`}>{score}</span>
              <span className="text-2xl text-slate-400 font-bold">/100</span>
            </div>
            <h3 className="text-xl font-bold text-slate-800">{message}</h3>
            
            <div className="flex flex-col items-center mt-6 p-4 bg-slate-50 rounded-xl w-full">
               {hasFindings ? (
                 <span className="text-amber-600 font-bold text-lg">{safeFindings.length} Security Problems Found</span>
               ) : (
                 <span className="text-emerald-600 font-bold text-lg flex items-center gap-2">
                   <CheckCircle2 size={24} />
                   No immediate problems found
                 </span>
               )}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <ReportSection 
            icon={<Smartphone size={24}/>} 
            label="Device Security" 
            statusText={deviceFindingsCount === 0 ? "Safe" : "Risks Found"} 
            statusType={deviceFindingsCount === 0 ? "success" : "warning"}
            subtext={deviceFindingsCount === 0 ? "OS and settings are secure" : `${deviceFindingsCount} device configuration issues found`}
          />
          <ReportSection 
            icon={<AppWindow size={24}/>} 
            label="App Analysis" 
            statusText={appFindingsCount === 0 ? "Checked" : "Issues Found"} 
            statusType={appFindingsCount === 0 ? "success" : "warning"}
            subtext={`Scanned ${appsScannedCount} apps. ${appFindingsCount === 0 ? 'No malicious apps detected.' : `${appFindingsCount} apps flagged.`}`}
          />
          <ReportSection 
            icon={<Wifi size={24}/>} 
            label="Network Health" 
            statusText={isNetworkSafe ? "Secure" : "Vulnerable"} 
            statusType={isNetworkSafe ? "success" : "error"}
            subtext={isNetworkSafe ? `Encrypted connection active` : `Unsafe network connection`}
          />
          <ReportSection 
            icon={<Search size={24}/>} 
            label="Connected Devices" 
            statusText="Detected" 
            statusType="info"
            subtext={`${connectedDevicesCount} devices found on your local network`}
          />
          <ReportSection 
            icon={<Lock size={24}/>} 
            label="App Permissions" 
            statusText="Monitored" 
            statusType="info"
            subtext={`${totalPermissions} total permissions granted across apps`}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-8">
          <Button onClick={onViewIssues} className="flex-1 text-lg py-4" variant={hasFindings ? "primary" : "outline"}>
            View Results
          </Button>
          {(scanResult?.apps && scanResult.apps.length > 0) && (
            <Button onClick={() => setShowAppInventory(true)} variant="outline" className="flex-1 text-lg py-4 bg-slate-50 hover:bg-slate-100">
              <AppWindow className="w-5 h-5 mr-2 inline" />
              View App Inventory
            </Button>
          )}
          <Button onClick={onBackHome} variant="outline" className="flex-1 text-lg py-4">
            Go Home
          </Button>
        </div>

        {scanResult && (
          <AppInventoryModal
            isOpen={showAppInventory}
            onClose={() => setShowAppInventory(false)}
            apps={scanResult.apps}
            permissions={scanResult.permissions}
            findings={scanResult.findings}
          />
        )}
      </div>
    );
  }

  return null;
}

function ScanProgressItem({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return (
    <div className={`flex items-center space-x-4 transition-all duration-300 ${active ? 'opacity-100 scale-105' : (done ? 'opacity-60' : 'opacity-30')}`}>
      {done ? (
        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
      ) : active ? (
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      ) : (
        <div className="w-6 h-6 border-2 border-slate-300 rounded-full" />
      )}
      <span className={`text-base font-bold ${active ? 'text-blue-700' : (done ? 'text-slate-600' : 'text-slate-400')}`}>
        {label}
      </span>
    </div>
  );
}

function ReportSection({ 
  icon, 
  label, 
  statusText, 
  statusType = 'success', 
  subtext 
}: { 
  icon: React.ReactNode; 
  label: string; 
  statusText: string; 
  statusType?: 'success' | 'warning' | 'error' | 'info'; 
  subtext?: string 
}) {
  const colors = {
    success: { icon: 'text-emerald-500 bg-emerald-50', text: 'text-emerald-600' },
    warning: { icon: 'text-amber-500 bg-amber-50', text: 'text-amber-600' },
    error: { icon: 'text-red-500 bg-red-50', text: 'text-red-600' },
    info: { icon: 'text-blue-500 bg-blue-50', text: 'text-blue-600' }
  };
  
  const c = colors[statusType];

  return (
    <Card className="p-4 border-slate-200 flex flex-col items-start gap-3 shadow-sm">
      <div className="flex items-center gap-3 w-full">
        <div className={`${c.icon} p-2.5 rounded-xl`}>
          {icon}
        </div>
        <div className="flex-1 leading-tight">
          <span className="block text-[15px] font-bold text-slate-800 mb-0.5">{label}</span>
          <span className={`text-[11px] font-bold uppercase tracking-wider ${c.text}`}>
            {statusText}
          </span>
        </div>
      </div>
      {subtext && (
        <div className="text-[13px] text-slate-600 font-medium bg-slate-50/80 p-3 rounded-lg w-full border border-slate-100 leading-relaxed">
          {subtext}
        </div>
      )}
    </Card>
  );
}
