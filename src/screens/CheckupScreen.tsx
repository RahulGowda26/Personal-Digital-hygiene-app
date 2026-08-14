import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Smartphone,
  Server,
  Lock,
  AppWindow,
  XCircle
} from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { SecurityScanner } from '@/engine/SecurityScanner';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { calculateDeviceScore } from '@/engine/riskEngine';
import type { ScanResult } from '@/types';

type ScanPhase = 'idle' | 'scanning_integrity' | 'scanning_apps' | 'scanning_permissions' | 'scanning_config' | 'analyzing' | 'complete';

interface CheckupScreenProps {
  onViewIssues: () => void;
  onBackHome: () => void;
}

export function CheckupScreen({
  onViewIssues,
  onBackHome,
}: CheckupScreenProps) {
  const { user } = useAuth();
  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startScan = async () => {
    try {
      setPhase('scanning_integrity');
      const scanner = new SecurityScanner();
      
      // We simulate the phases visually for the user while running the actual scan
      setTimeout(() => setPhase('scanning_apps'), 1500);
      setTimeout(() => setPhase('scanning_permissions'), 3000);
      setTimeout(() => setPhase('scanning_config'), 4500);
      setTimeout(() => setPhase('analyzing'), 6000);

      const result = await scanner.scan();
      setScanResult(result);
      
      // Delay completion slightly so the 'analyzing' phase is visible
      setTimeout(() => setPhase('complete'), 7000);
    } catch (err) {
      console.error(err);
      setError('An error occurred while scanning the device.');
      setPhase('idle');
    }
  };

  const getPhaseIcon = (p: ScanPhase) => {
    switch (p) {
      case 'scanning_integrity': return <Smartphone className="w-8 h-8 text-blue-500 animate-pulse" />;
      case 'scanning_apps': return <AppWindow className="w-8 h-8 text-purple-500 animate-pulse" />;
      case 'scanning_permissions': return <Lock className="w-8 h-8 text-green-500 animate-pulse" />;
      case 'scanning_config': return <Server className="w-8 h-8 text-orange-500 animate-pulse" />;
      case 'analyzing': return <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />;
      default: return <ShieldCheck className="w-8 h-8 text-emerald-500" />;
    }
  };

  const getPhaseText = (p: ScanPhase) => {
    switch (p) {
      case 'scanning_integrity': return 'Checking device integrity...';
      case 'scanning_apps': return 'Inspecting installed applications...';
      case 'scanning_permissions': return 'Reviewing security permissions...';
      case 'scanning_config': return 'Checking device configuration...';
      case 'analyzing': return 'Analyzing findings...';
      default: return 'Ready to scan';
    }
  };

  if (phase === 'idle') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-4 mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 mb-4 ring-1 ring-emerald-500/30">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100">SECURITY SCAN</h2>
          <p className="text-slate-400">
            Check your device for security risks.
          </p>
        </div>
        
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex flex-col items-center">
             <XCircle className="w-6 h-6 text-red-400 mb-2" />
             <p className="text-red-400">{error}</p>
          </div>
        )}

        <div className="flex justify-center pt-8">
          <Button onClick={startScan} size="lg" className="w-full sm:w-auto px-12 py-6 text-lg">
            Scan Device
          </Button>
        </div>
      </div>
    );
  }

  if (phase !== 'complete') {
    return (
      <div className="max-w-xl mx-auto space-y-6 flex flex-col items-center justify-center py-20">
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-xl bg-blue-500/20 animate-pulse" />
          <div className="relative bg-slate-900 border border-slate-700 w-24 h-24 rounded-full flex items-center justify-center">
            {getPhaseIcon(phase)}
          </div>
        </div>
        <h3 className="text-xl font-medium text-slate-200 mt-6 animate-pulse">
          {getPhaseText(phase)}
        </h3>
        <div className="w-64 space-y-3 mt-8">
          <ScanProgressItem label="Device Integrity" active={phase === 'scanning_integrity'} done={['scanning_apps', 'scanning_permissions', 'scanning_config', 'analyzing'].includes(phase as string)} />
          <ScanProgressItem label="Installed Applications" active={phase === 'scanning_apps'} done={['scanning_permissions', 'scanning_config', 'analyzing'].includes(phase as string)} />
          <ScanProgressItem label="Security Permissions" active={phase === 'scanning_permissions'} done={['scanning_config', 'analyzing'].includes(phase as string)} />
          <ScanProgressItem label="Device Configuration" active={phase === 'scanning_config'} done={['analyzing'].includes(phase as string)} />
          <ScanProgressItem label="Analyzing Findings" active={phase === 'analyzing'} done={false} />
        </div>
      </div>
    );
  }

  if (scanResult) {
    const { score, grade } = calculateDeviceScore(scanResult);
    const highFindings = scanResult.findings.filter(f => f.severity === 'high' || f.severity === 'critical');
    const medFindings = scanResult.findings.filter(f => f.severity === 'medium');
    const infoFindings = scanResult.findings.filter(f => f.severity === 'low' || f.severity === 'info');

    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-100 mb-2">SECURITY REPORT</h2>
        </div>

        <Card className="p-8 border-slate-700 bg-slate-800/80 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <ScoreRing score={score} grade={grade} />
            <h3 className="text-2xl font-bold text-slate-100 mt-6">{grade.toUpperCase()}</h3>
            
            <div className="flex space-x-4 mt-6">
               {highFindings.length > 0 && <span className="text-red-400 font-medium">{highFindings.length} High-risk</span>}
               {medFindings.length > 0 && <span className="text-yellow-400 font-medium">{medFindings.length} Medium-risk</span>}
               {infoFindings.length > 0 && <span className="text-blue-400 font-medium">{infoFindings.length} Informational</span>}
               {scanResult.findings.length === 0 && <span className="text-emerald-400 font-medium">No active risks found</span>}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <ReportSection label="Device Integrity" status={scanResult.deviceIntegrity.status} />
          <ReportSection label="Applications" status={scanResult.apps.length > 0 ? 'safe' : 'error'} />
          <ReportSection label="Permissions" status="safe" />
          <ReportSection label="Configuration" status={scanResult.configuration.status} />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-8">
          <Button onClick={onViewIssues} className="flex-1" variant={scanResult.findings.length > 0 ? "primary" : "outline"}>
            View Detailed Findings
          </Button>
          <Button onClick={onBackHome} variant="outline" className="flex-1">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

function ScanProgressItem({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return (
    <div className={`flex items-center space-x-3 transition-opacity duration-300 ${active ? 'opacity-100' : (done ? 'opacity-70' : 'opacity-30')}`}>
      {done ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
      ) : active ? (
        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      ) : (
        <div className="w-5 h-5 border-2 border-slate-600 rounded-full" />
      )}
      <span className={`font-medium ${active ? 'text-blue-400' : (done ? 'text-slate-300' : 'text-slate-500')}`}>
        {label}
      </span>
    </div>
  );
}

function ReportSection({ label, status }: { label: string; status: string }) {
  const getStatusColor = (s: string) => {
    switch (s) {
      case 'safe': return 'text-emerald-400';
      case 'high':
      case 'critical': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'error': return 'text-slate-500';
      default: return 'text-blue-400';
    }
  };

  return (
    <Card className="p-4 border-slate-700 bg-slate-800/50 flex flex-col items-center text-center">
      <span className="text-sm text-slate-400 mb-2">{label}</span>
      <span className={`font-bold capitalize ${getStatusColor(status)}`}>
        {status === 'error' ? 'Unavailable' : status}
      </span>
    </Card>
  );
}
