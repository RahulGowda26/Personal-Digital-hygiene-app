import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Stethoscope,
  ChevronRight,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Smartphone,
  Wifi,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';
import type { 
  CheckupAnswer, 
  AppMetadata, 
  AppScanResult,
  DeviceSecuritySignals, 
  NetworkSecuritySignals,
  SecurityCategory,
  ScoreGrade,
} from '@/types';
import {
  questionsByCategory,
  checkupQuestions,
} from '@/data/checkupQuestions';
import { useAuth } from '@/auth/AuthContext';
import {
  createCheckup,
  saveCheckupAnswers,
  completeCheckup,
  ensureDevice,
} from '@/services/api';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AppInventoryModal } from '@/components/ui/AppInventoryModal';

import { userFacingError } from '@/lib/errors';
import { getSecurityAdapter } from '@/platform/SecurityAdapter';
import { getThreatIntelligenceProvider, BreachCheckResult, PasswordExposureCheckResult } from '@/platform/ThreatIntelligence';

type CheckupPhase = 
  | 'intro' 
  | 'initializing'
  | 'questions'
  | 'scan_account'
  | 'scan_password'
  | 'analyzing'
  | 'complete';

interface SecurityHabitsScreenProps {
  onComplete: (checkupId: string) => void;
  onViewIssues: () => void;
  onBackHome: () => void;
}

export function SecurityHabitsScreen({
  onComplete,
  onViewIssues,
  onBackHome,
}: SecurityHabitsScreenProps) {
  const { user } = useAuth();
  
  // Overall State Machine
  const [phase, setPhase] = useState<CheckupPhase>('intro');
  const [checkupId, setCheckupId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Manual Questions State
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, CheckupAnswer>>({});
  
  const adapter = useMemo(() => getSecurityAdapter(), []);
  
  // Status flags for capabilities
  const isAppSupported = useMemo(() => adapter.getCapabilities().find(c => c.capability === 'app_security')?.status === 'supported', [adapter]);
  const isDeviceSupported = useMemo(() => adapter.getCapabilities().find(c => c.capability === 'device_security')?.status === 'supported', [adapter]);
  const isNetworkSupported = useMemo(() => adapter.getCapabilities().find(c => c.capability === 'network_security')?.status === 'supported', [adapter]);

  const activeQuestions = useMemo(() => {
    return checkupQuestions.filter((q) => {
      if (q.category === 'account_security') return true;
      if (q.category === 'password_hygiene') return true;
      if (q.category === 'privacy') return true;
      if (q.category === 'app_security') return !isAppSupported;
      if (q.category === 'device_security') return !isDeviceSupported;
      if (q.category === 'network_security') return !isNetworkSupported;
      return true;
    });
  }, [isAppSupported, isDeviceSupported, isNetworkSupported]);
  
  // Threat Intel State
  const [breachResult, setBreachResult] = useState<BreachCheckResult | null>(null);
  const [passwordResult, setPasswordResult] = useState<PasswordExposureCheckResult | null>(null);
  
  // Password Input State
  const [checkupPassword, setCheckupPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordChecking, setPasswordChecking] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Final Result State
  const [result, setResult] = useState<{
    score: number;
    grade: string;
    findingsCount: number;
    isPreliminary: boolean;
    apps?: any[];
    permissions?: any;
    findings?: any[];
  } | null>(null);

  // Phase Execution Hooks
  
  const startCheckup = useCallback(async () => {
    if (!user) return;
    setError(null);
    setPhase('initializing');
    try {
      const device = await ensureDevice(user.id, 'web');
      const checkup = await createCheckup(user.id, device.id);
      setCheckupId(checkup.id);
      if (activeQuestions.length > 0) {
        setPhase('questions');
      } else {
        setPhase('scan_account');
      }
    } catch (err) {
      setError(userFacingError(err, 'Could not start the checkup.'));
      setPhase('intro');
    }
  }, [user, activeQuestions.length]);

  const answerQuestion = (questionId: string, value: string) => {
    const currentQuestion = activeQuestions[questionIndex];
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        questionId,
        category: currentQuestion.category,
        value
      }
    }));
    
    if (questionIndex < activeQuestions.length - 1) {
      setQuestionIndex(questionIndex + 1);
    } else {
      setPhase('scan_account');
    }
  };

  // Run Account Scan
  useEffect(() => {
    if (phase === 'scan_account') {
      const runAccountCheck = async () => {
        try {
          const provider = getThreatIntelligenceProvider();
          const res = await provider.checkAccountExposure(user?.email || 'unknown@example.com');
          setBreachResult(res);
        } catch (e) {
          console.error(e);
        } finally {
          setPhase('scan_password');
        }
      };
      runAccountCheck();
    }
  }, [phase, user]);

  // Password Scan is interactive, handled by user click on "Check Password" or "Skip"
  const checkPassword = async () => {
    if (!checkupPassword) {
      setPhase('analyzing'); // skipped
      return;
    }
    setPasswordChecking(true);
    setPasswordError(null);
    try {
      const provider = getThreatIntelligenceProvider();
      const res = await provider.checkPasswordExposure(checkupPassword);
      setPasswordResult(res);
      setCheckupPassword(''); // clear
      setShowPassword(false);
      if (res.status === 'error' || res.status === 'rate_limit') {
        setPasswordError(res.error || 'Service unavailable');
        setPasswordChecking(false);
        // Let them try again or skip
        return;
      }
      setPhase('analyzing');
    } catch (e) {
      setPasswordError('Failed to check password');
    } finally {
      setPasswordChecking(false);
    }
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Run Analysis
  useEffect(() => {
    if (phase === 'analyzing') {
      const runAnalysis = async () => {
        if (!user || !checkupId) {
          setError('Lost session. Please restart checkup.');
          setPhase('intro');
          return;
        }
        try {
          const answerList = Object.values(answers);
          answerList.push({ questionId: 'account_scan', category: 'account_security', value: 'auto_scanned' });
          answerList.push({ questionId: 'password_scan', category: 'password_hygiene', value: 'auto_scanned' });

          await saveCheckupAnswers(checkupId, user.id, answerList);
          
          const { score, findings } = await completeCheckup(
            checkupId,
            user.id,
            answerList,
            breachResult,
            passwordResult,
            null,
            null,
            null
          );
          
          setResult({
            score: score.score,
            grade: score.grade,
            findingsCount: findings.length,
            isPreliminary: score.is_preliminary,
            apps: [],
            permissions: {},
            findings: findings || [],
          });
          setPhase('complete');
        } catch (err) {
          setError(userFacingError(err, 'Failed to analyze results.'));
          setPhase('intro');
        }
      };
      runAnalysis();
    }
  }, [phase, user, checkupId, answers, breachResult, passwordResult]);


  const renderChecklistItem = (
    id: string,
    label: string, 
    isActive: boolean, 
    isDone: boolean, 
    isUnsupported: boolean,
    details?: string
  ) => {
    return (
      <div className={`flex items-start gap-3 p-4 rounded-xl transition-all border ${isActive ? 'bg-cyber-surface/80 border-cyber-neon/50 shadow-[0_0_15px_rgba(255,42,66,0.2)]' : 'border-transparent bg-cyber-bg/30'} ${!isActive && !isDone ? 'opacity-50' : ''}`}>
        <div className="mt-0.5 shrink-0">
          {isDone ? (
            isUnsupported ? (
              <AlertTriangle size={18} className="text-amber-500" />
            ) : (
              <CheckCircle2 size={18} className="text-emerald-500" />
            )
          ) : isActive ? (
            <Loader2 size={18} className="text-cyber-neon animate-spin" />
          ) : (
            <div className="w-4 h-4 rounded-full border border-cyber-textMuted mt-0.5 ml-0.5" />
          )}
        </div>
        <div className="flex-1">
          <p className={`text-sm font-sans font-semibold ${isActive || isDone ? 'text-white' : 'text-cyber-textMuted'}`}>
            {label}
          </p>
          {isActive && !isDone && (
            <p className="text-xs font-sans text-cyber-textMuted mt-1">{details || 'Scanning...'}</p>
          )}
          {isDone && isUnsupported && (
            <p className="text-xs font-sans text-amber-500/80 mt-1">Unsupported in this environment</p>
          )}
        </div>
      </div>
    );
  };

  if (phase === 'intro') {
    return (
      <div className="max-w-xl mx-auto pt-8">
        <div className="flex flex-col items-center text-center py-12 px-6 cyber-card border border-cyber-neon/20 bg-cyber-surface/50">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-cyber-neon/20 blur-xl rounded-full" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-cyber-neon bg-cyber-bg text-cyber-neon shadow-[0_0_20px_rgba(255,42,66,0.3)]">
              <ShieldCheck size={40} />
            </div>
          </div>
          <h1 className="text-3xl font-outline text-outline-glow tracking-widest uppercase mb-4">
            Security Scan
          </h1>
          <p className="text-sm font-sans text-cyber-textMuted max-w-sm mb-8">
            Initiating deep scan of device configuration, network posture, and threat exposure metrics.
          </p>

          {error && (
            <p className="text-sm text-red-500 text-center mb-6">{error}</p>
          )}

          <button 
            className="w-full sm:w-auto px-12 py-4 bg-cyber-neon/10 border border-cyber-neon text-cyber-neon font-sans font-bold uppercase tracking-widest hover:bg-cyber-neon hover:text-white transition-all shadow-[0_0_20px_rgba(255,42,66,0.2)] rounded-lg"
            onClick={startCheckup}
          >
            Initialize Scan
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'questions') {
    const q = activeQuestions[questionIndex];
    const progress = ((questionIndex) / activeQuestions.length) * 100;
    
    // Helper to get category name
    const getCategoryName = (cat: string) => {
      const names: Record<string, string> = {
        privacy: 'Privacy',
        account_security: 'Account Security',
        password_hygiene: 'Password Hygiene',
        app_security: 'App Security',
        device_security: 'Device Security',
        network_security: 'Network Security'
      };
      return names[cat] || cat;
    };
    
    return (
      <div className="max-w-xl mx-auto pt-6">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-sans font-bold uppercase tracking-widest text-cyber-textMuted">
              Vulnerability Assessment
            </span>
            <span className="text-xs font-sans font-bold uppercase tracking-widest text-cyber-neon">
              {getCategoryName(q.category)}
            </span>
          </div>
          <div className="h-1 rounded-full bg-cyber-surface overflow-hidden border border-cyber-neon/20">
            <div className="h-full bg-cyber-neon shadow-[0_0_10px_rgba(255,42,66,0.8)] transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="cyber-card p-6 md:p-8">
          <p className="text-lg font-sans font-semibold text-white leading-tight mb-2">{q.label}</p>
          {q.help && <p className="text-sm font-sans text-cyber-textMuted mb-6">{q.help}</p>}
          <div className="mt-8 space-y-3">
            {q.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => answerQuestion(q.id, opt.value)}
                className="flex w-full items-center gap-4 rounded-xl border border-cyber-neon/20 bg-cyber-surface/50 px-5 py-4 text-left text-sm font-sans font-medium text-cyber-text hover:border-cyber-neon hover:bg-cyber-neon/10 hover:text-white transition-all shadow-[0_0_15px_rgba(255,42,66,0)] hover:shadow-[0_0_15px_rgba(255,42,66,0.1)] group"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-cyber-textMuted group-hover:border-cyber-neon" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (
    phase === 'initializing' ||
    phase === 'scan_account' ||
    phase === 'scan_password' ||
    phase === 'analyzing'
  ) {
    const isPastAccount = ['scan_password', 'analyzing', 'complete'].includes(phase);
    const isPastPassword = ['analyzing', 'complete'].includes(phase);

    return (
      <div className="max-w-xl mx-auto pt-6">
        <div className="mb-8 pb-6 border-b border-cyber-neon/20">
          <h2 className="text-xl font-sans font-bold text-white uppercase tracking-widest">Diagnostic Execution</h2>
          <p className="text-sm font-sans text-cyber-textMuted mt-2">Aggregating telemetry across vectors.</p>
        </div>

        <div className="space-y-2 relative pl-2">
          <div className="absolute left-6 top-6 bottom-6 w-px bg-cyber-neon/20 -z-10" />

          {renderChecklistItem('account', 'Account Breach Exposure', phase === 'scan_account', isPastAccount, false, 'Checking Have I Been Pwned API securely...')}
          
          {renderChecklistItem('password', 'Password Hygiene', phase === 'scan_password', isPastPassword, false, 'Awaiting optional password check...')}
          
          {phase === 'scan_password' && (
            <div className="ml-12 mb-6 p-5 cyber-card border border-cyber-neon/30 bg-cyber-surface/80">
              <p className="text-xs font-sans font-medium text-cyber-textMuted mb-3">Check a commonly used password against known breaches securely (k-anonymity).</p>
              <div className="flex gap-3">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={checkupPassword}
                  onChange={(e) => setCheckupPassword(e.target.value)}
                  placeholder="Password (optional)"
                  className="flex-1 px-4 py-2 bg-cyber-bg border border-cyber-neon/30 rounded-lg text-sm font-sans text-white placeholder-cyber-textMuted focus:outline-none focus:border-cyber-neon focus:shadow-[0_0_10px_rgba(255,42,66,0.2)]"
                  disabled={passwordChecking}
                />
                <button 
                  onClick={checkPassword} 
                  disabled={passwordChecking}
                  className="px-6 py-2 bg-cyber-neon/20 border border-cyber-neon text-cyber-neon font-sans font-semibold rounded-lg hover:bg-cyber-neon hover:text-white transition-colors"
                >
                  {passwordChecking ? <Loader2 size={16} className="animate-spin" /> : (checkupPassword ? 'Verify' : 'Skip')}
                </button>
              </div>
              {passwordError && <p className="text-xs font-sans text-red-500 mt-3">{passwordError}</p>}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'complete' && result) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 pb-24 pt-6">
        <div className="cyber-card p-8 flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500 bg-cyber-bg text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <CheckCircle2 size={32} />
            </div>
          </div>
          <h2 className="text-2xl font-outline text-emerald-500 tracking-widest uppercase mb-2">
            Scan Complete
          </h2>
          <p className="text-sm font-sans text-cyber-textMuted">
            {result.findingsCount === 0
              ? 'Zero critical vulnerabilities detected in human vectors.'
              : `Detected ${result.findingsCount} ${result.findingsCount === 1 ? 'vulnerability' : 'vulnerabilities'} in security posture.`}
          </p>
        </div>

        {result.findings && result.findings.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs font-sans font-bold text-cyber-textMuted uppercase tracking-widest border-b border-cyber-neon/20 pb-2 pl-2">Threat Report</h3>
            {result.findings.map((finding, idx) => (
              <HabitFindingCard key={idx} finding={finding} />
            ))}
          </div>
        )}

        {result.findingsCount === 0 && (
          <div className="cyber-card p-8 text-center border-emerald-500/30 bg-emerald-500/5">
            <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-4 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <h3 className="font-sans font-bold text-emerald-500 uppercase tracking-widest mb-2">Posture Verified</h3>
            <p className="text-emerald-500/70 text-sm font-sans">Behavioral security vectors are within acceptable parameters.</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <button 
            onClick={onBackHome} 
            className="w-full sm:w-auto px-8 py-3 bg-cyber-surface border border-cyber-neon/30 text-cyber-textMuted font-sans font-semibold uppercase tracking-widest hover:border-cyber-neon hover:text-cyber-neon transition-colors rounded-lg"
          >
            Return to Nexus
          </button>
          <button 
            onClick={() => onComplete(checkupId!)} 
            className="w-full sm:w-auto px-8 py-3 bg-cyber-neon/10 border border-cyber-neon text-cyber-neon font-sans font-semibold uppercase tracking-widest hover:bg-cyber-neon hover:text-white transition-all shadow-[0_0_15px_rgba(255,42,66,0.2)] rounded-lg flex items-center justify-center gap-2"
          >
            Review Issues
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return null;
}

function HabitFindingCard({ finding }: { finding: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'critical': return 'text-cyber-neon border-cyber-neon shadow-[0_0_15px_rgba(255,42,66,0.2)]';
      case 'high': return 'text-orange-500 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)]';
      case 'medium': return 'text-yellow-500 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]';
      default: return 'text-blue-500 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]';
    }
  };

  const getSeverityGlow = (sev: string) => {
    switch (sev) {
      case 'critical': return 'shadow-[inset_4px_0_0_0_rgba(255,42,66,1)]';
      case 'high': return 'shadow-[inset_4px_0_0_0_rgba(249,115,22,1)]';
      case 'medium': return 'shadow-[inset_4px_0_0_0_rgba(234,179,8,1)]';
      default: return 'shadow-[inset_4px_0_0_0_rgba(59,130,246,1)]';
    }
  };

  const iconColor = finding.severity === 'critical' ? 'text-cyber-neon' : finding.severity === 'high' ? 'text-orange-500' : 'text-yellow-500';
  const glowClass = getSeverityGlow(finding.severity);

  return (
    <div className={`cyber-card overflow-hidden transition-all duration-300 ${isExpanded ? glowClass : ''}`}>
      <div 
        className="p-5 cursor-pointer hover:bg-cyber-neon/5 transition-colors flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-5 h-5 shrink-0 ${iconColor}`} />
            <h4 className="font-sans font-bold text-white text-base md:text-lg">{finding.title}</h4>
          </div>
        </div>
        <div className="ml-4 text-cyber-neon/50">
          {isExpanded ? <ChevronDown size={20} className="rotate-180" /> : <ChevronDown size={20} />}
        </div>
      </div>

      {isExpanded && (
        <div className="p-5 pt-0 border-t border-cyber-neon/10 bg-cyber-bg/50 mt-2">
          <div className="flex-1 mt-4">
            <p className="text-sm font-sans text-cyber-textMuted mb-4">{finding.description || finding.reason}</p>
            
            {finding.evidence && finding.evidence.length > 0 && (
              <div className="bg-cyber-surface/50 p-4 rounded-xl border border-cyber-neon/20 mb-4">
                <span className="text-[10px] font-sans font-bold text-cyber-neon uppercase tracking-widest mb-2 block">Evidence</span>
                <ul className="list-disc pl-4 space-y-1">
                  {finding.evidence.map((ev: string, i: number) => (
                    <li key={i} className="text-sm font-sans text-cyber-text">{ev}</li>
                  ))}
                </ul>
              </div>
            )}

            {finding.recommendedPlaybook && (
              <div className="mt-4 pt-4 border-t border-cyber-neon/20">
                <span className="text-[10px] font-sans font-bold text-emerald-500 uppercase tracking-widest mb-2 block">Recommendation</span>
                <p className="text-sm font-sans font-semibold text-white">
                  {finding.recommendedPlaybook.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
