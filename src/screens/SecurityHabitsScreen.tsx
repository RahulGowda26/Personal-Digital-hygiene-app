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

import { userFacingError } from '@/lib/errors';
import { getSecurityAdapter } from '@/platform/SecurityAdapter';
import { getThreatIntelligenceProvider, BreachCheckResult, PasswordExposureCheckResult } from '@/platform/ThreatIntelligence';

type CheckupPhase = 
  | 'intro' 
  | 'initializing'
  | 'questions'
  | 'scan_account'
  | 'scan_password'
  | 'scan_apps'
  | 'scan_device'
  | 'scan_network'
  | 'analyzing'
  | 'complete';

interface SecurityHabitsScreenProps {
  onComplete: (checkupId: string) => void;
  onViewIssues: () => void;
  onBackHome: () => void;
}

export function SecurityHabitsScreen({
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
  const privacyQuestions = useMemo(() => questionsByCategory('privacy'), []);

  // Automated Scans Results
  const [breachResult, setBreachResult] = useState<BreachCheckResult | null>(null);
  const [passwordResult, setPasswordResult] = useState<PasswordExposureCheckResult | null>(null);
  const [installedApps, setInstalledApps] = useState<AppScanResult | null>(null);
  const [deviceSignals, setDeviceSignals] = useState<DeviceSecuritySignals | null>(null);
  const [networkSignals, setNetworkSignals] = useState<NetworkSecuritySignals | null>(null);

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
  } | null>(null);

  const adapter = useMemo(() => getSecurityAdapter(), []);
  
  // Status flags for capabilities
  const isAppSupported = useMemo(() => adapter.getCapabilities().find(c => c.capability === 'app_security')?.status === 'supported', [adapter]);
  const isDeviceSupported = useMemo(() => adapter.getCapabilities().find(c => c.capability === 'device_security')?.status === 'supported', [adapter]);
  const isNetworkSupported = useMemo(() => adapter.getCapabilities().find(c => c.capability === 'network_security')?.status === 'supported', [adapter]);

  // Phase Execution Hooks
  
  const startCheckup = useCallback(async () => {
    if (!user) return;
    setError(null);
    setPhase('initializing');
    try {
      const device = await ensureDevice(user.id, 'web');
      const checkup = await createCheckup(user.id, device.id);
      setCheckupId(checkup.id);
      if (privacyQuestions.length > 0) {
        setPhase('questions');
      } else {
        setPhase('scan_account');
      }
    } catch (err) {
      setError(userFacingError(err, 'Could not start the checkup.'));
      setPhase('intro');
    }
  }, [user, privacyQuestions.length]);

  const answerQuestion = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        questionId,
        category: 'privacy',
        value
      }
    }));
    
    if (questionIndex < privacyQuestions.length - 1) {
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
      setPhase('scan_apps'); // skipped
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
      setPhase('scan_apps');
    } catch (e) {
      setPasswordError('Failed to check password');
    } finally {
      setPasswordChecking(false);
    }
  };

  // Run App Scan
  useEffect(() => {
    if (phase === 'scan_apps') {
      const runAppsCheck = async () => {
        try {
          if (isAppSupported) {
            const result = await adapter.getInstalledApps();
            setInstalledApps(result);
          } else {
            setInstalledApps(null); // Explicitly null for unsupported
          }
        } catch (e) {
          console.error(e);
        } finally {
          setPhase('scan_device');
        }
      };
      runAppsCheck();
    }
  }, [phase, isAppSupported, adapter]);

  // Run Device Scan
  useEffect(() => {
    if (phase === 'scan_device') {
      const runDeviceCheck = async () => {
        try {
          if (isDeviceSupported) {
            const signals = await adapter.getDeviceSecuritySignals();
            setDeviceSignals(signals);
          } else {
            const signals = await adapter.getDeviceSecuritySignals();
            setDeviceSignals(signals);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setPhase('scan_network');
        }
      };
      runDeviceCheck();
    }
  }, [phase, isDeviceSupported, adapter]);

  // Run Network Scan
  useEffect(() => {
    if (phase === 'scan_network') {
      const runNetworkCheck = async () => {
        try {
          if (isNetworkSupported) {
            const signals = await adapter.getNetworkSecuritySignals();
            setNetworkSignals(signals);
          } else {
            const signals = await adapter.getNetworkSecuritySignals();
            setNetworkSignals(signals);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setPhase('analyzing');
        }
      };
      runNetworkCheck();
    }
  }, [phase, isNetworkSupported, adapter]);

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
          answerList.push({ questionId: 'app_scan', category: 'app_security', value: 'auto_scanned' });
          answerList.push({ questionId: 'device_scan', category: 'device_security', value: 'auto_scanned' });
          answerList.push({ questionId: 'network_scan', category: 'network_security', value: 'auto_scanned' });

          await saveCheckupAnswers(checkupId, user.id, answerList);
          
          const { score, findings } = await completeCheckup(
            checkupId,
            user.id,
            answerList,
            breachResult,
            passwordResult,
            installedApps,
            deviceSignals,
            networkSignals
          );
          
          setResult({
            score: score.score,
            grade: score.grade,
            findingsCount: findings.length,
            isPreliminary: score.is_preliminary,
          });
          setPhase('complete');
        } catch (err) {
          setError(userFacingError(err, 'Failed to analyze results.'));
          setPhase('intro');
        }
      };
      runAnalysis();
    }
  }, [phase, user, checkupId, answers, breachResult, passwordResult, installedApps, deviceSignals, networkSignals]);


  const renderChecklistItem = (
    id: string,
    label: string, 
    isActive: boolean, 
    isDone: boolean, 
    isUnsupported: boolean,
    details?: string
  ) => {
    return (
      <div className={`flex items-start gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-white shadow-sm border border-slate-200 ring-1 ring-slate-900/5' : ''} ${!isActive && !isDone ? 'opacity-50' : ''}`}>
        <div className="mt-0.5 shrink-0">
          {isDone ? (
            isUnsupported ? (
              <AlertTriangle size={18} className="text-amber-500" />
            ) : (
              <CheckCircle2 size={18} className="text-emerald-500" />
            )
          ) : isActive ? (
            <Loader2 size={18} className="text-slate-900 animate-spin" />
          ) : (
            <div className="w-4 h-4 rounded-full border-2 border-slate-300 mt-0.5 ml-0.5" />
          )}
        </div>
        <div className="flex-1">
          <p className={`text-sm font-medium ${isActive || isDone ? 'text-slate-900' : 'text-slate-500'}`}>
            {label}
          </p>
          {isActive && !isDone && (
            <p className="text-xs text-slate-500 mt-1">{details || 'Scanning...'}</p>
          )}
          {isDone && isUnsupported && (
            <p className="text-xs text-amber-700 mt-1">Unsupported in this environment</p>
          )}
        </div>
      </div>
    );
  };

  if (phase === 'intro') {
    return (
      <div className="max-w-xl mx-auto">
        <div className="flex flex-col items-center text-center py-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 mb-5">
            <Stethoscope size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Security Checkup
          </h1>
          <p className="mt-2 text-sm text-slate-500 max-w-sm">
            We will scan your device configuration, network, and account exposures to measure your digital health.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600 text-center mb-4">{error}</p>
        )}

        <Button fullWidth size="lg" onClick={startCheckup}>
          Start checkup
        </Button>
      </div>
    );
  }

  if (phase === 'questions') {
    const q = privacyQuestions[questionIndex];
    const progress = ((questionIndex) / privacyQuestions.length) * 100;
    
    return (
      <div className="max-w-xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-500">
              Manual Questions
            </span>
            <span className="text-sm font-medium text-slate-900">
              Privacy
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-slate-900 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <Card key={q.id}>
          <p className="text-sm font-semibold text-slate-900">{q.label}</p>
          {q.help && <p className="text-xs text-slate-500 mt-1 mb-3">{q.help}</p>}
          <div className="mt-4 space-y-2">
            {q.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => answerQuestion(q.id, opt.value)}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left text-sm text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-slate-300" />
                {opt.label}
              </button>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (
    phase === 'initializing' ||
    phase === 'scan_account' ||
    phase === 'scan_password' ||
    phase === 'scan_apps' ||
    phase === 'scan_device' ||
    phase === 'scan_network' ||
    phase === 'analyzing'
  ) {
    const isPastAccount = ['scan_password', 'scan_apps', 'scan_device', 'scan_network', 'analyzing', 'complete'].includes(phase);
    const isPastPassword = ['scan_apps', 'scan_device', 'scan_network', 'analyzing', 'complete'].includes(phase);
    const isPastApps = ['scan_device', 'scan_network', 'analyzing', 'complete'].includes(phase);
    const isPastDevice = ['scan_network', 'analyzing', 'complete'].includes(phase);
    const isPastNetwork = ['analyzing', 'complete'].includes(phase);

    return (
      <div className="max-w-xl mx-auto">
        <div className="mb-6 pb-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Scanning your digital security</h2>
          <p className="text-sm text-slate-500 mt-1">Collecting data across all available capabilities.</p>
        </div>

        <div className="space-y-1 relative">
          <div className="absolute left-5 top-4 bottom-4 w-px bg-slate-200 -z-10" />

          {renderChecklistItem('account', 'Account Breach Exposure', phase === 'scan_account', isPastAccount, false, 'Checking Have I Been Pwned API securely...')}
          
          {renderChecklistItem('password', 'Password Hygiene', phase === 'scan_password', isPastPassword, false, 'Awaiting optional password check...')}
          
          {phase === 'scan_password' && (
            <div className="ml-10 mb-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-medium text-slate-700 mb-2">Check a commonly used password against known breaches securely (k-anonymity).</p>
              <div className="flex gap-2">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={checkupPassword}
                  onChange={(e) => setCheckupPassword(e.target.value)}
                  placeholder="Password (optional)"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  disabled={passwordChecking}
                />
                <Button onClick={checkPassword} disabled={passwordChecking}>
                  {passwordChecking ? <Loader2 size={16} className="animate-spin" /> : (checkupPassword ? 'Check' : 'Skip')}
                </Button>
              </div>
              {passwordError && <p className="text-xs text-red-600 mt-2">{passwordError}</p>}
            </div>
          )}

          {renderChecklistItem('apps', 'Application Security', phase === 'scan_apps', isPastApps, !isAppSupported, 'Analyzing installed applications and permissions...')}
          {renderChecklistItem('device', 'Device Security', phase === 'scan_device', isPastDevice, !isDeviceSupported, 'Checking OS updates, encryption, and secure boot...')}
          {renderChecklistItem('network', 'Network Security', phase === 'scan_network', isPastNetwork, !isNetworkSupported, 'Analyzing Wi-Fi security and connection state...')}
          {renderChecklistItem('analyze', 'Analyzing Risk Factors', phase === 'analyzing', false, false, 'Calculating Digital Health Score...')}
        </div>
      </div>
    );
  }

  if (phase === 'complete' && result) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-col items-center text-center py-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
            <CheckCircle2 size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Checkup complete
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="flex flex-col items-center py-8 justify-center">
            <ScoreRing
              score={result.score}
              grade={result.grade as ScoreGrade}
              preliminary={result.isPreliminary}
            />
            <p className="mt-4 text-sm font-medium text-slate-900">
              {result.findingsCount === 0
                ? 'No issues found.'
                : `${result.findingsCount} ${result.findingsCount === 1 ? 'issue' : 'issues'} found`}
            </p>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Scan Details</h3>
              {import.meta.env.VITE_DEMO_MODE === 'true' && (
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded tracking-wide">
                  DEMO DATA
                </span>
              )}
            </div>
            
            <div className="space-y-3 text-sm divide-y divide-slate-100">
              <div className="flex justify-between py-2">
                <span className="text-slate-600">Account Security</span>
                <span className="font-medium text-slate-900">1 account checked</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-600">Password Hygiene</span>
                <span className="font-medium text-slate-900">{passwordResult ? '1 checked' : 'Skipped'}</span>
              </div>
              <div className="flex justify-between py-2 items-center">
                <span className="text-slate-600">Application Security</span>
                {isAppSupported ? (
                  <div className="text-right">
                    <span className="font-medium text-slate-900 block">
                      {installedApps?.source === 'SCAN_ERROR' 
                        ? 'Scan failed'
                        : `${installedApps?.apps.length ?? 0} apps assessed`}
                    </span>
                    {installedApps && installedApps.source !== 'SCAN_ERROR' && (
                      <span className="text-xs text-slate-500 block">
                        Source: {installedApps.source === 'DEMO_MOCK' ? 'Simulated data' : installedApps.source === 'ANDROID_PACKAGE_MANAGER' ? 'Android Package Manager' : installedApps.source}
                        {installedApps.coveragePercent !== undefined ? ` • Coverage: ${installedApps.coveragePercent}%` : ''}
                      </span>
                    )}
                    {installedApps?.error && (
                      <span className="text-xs text-red-500 block">{installedApps.error}</span>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-400">Unsupported</span>
                )}
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-600">Device Security</span>
                {isDeviceSupported ? (
                  <span className="font-medium text-slate-900">Signals assessed</span>
                ) : (
                  <span className="text-slate-400">Unsupported</span>
                )}
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-600">Network Security</span>
                {isNetworkSupported ? (
                  <span className="font-medium text-slate-900">Signals assessed</span>
                ) : (
                  <span className="text-slate-400">Unsupported</span>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onBackHome}>
            Back to home
          </Button>
          {result.findingsCount > 0 && (
            <Button onClick={onViewIssues}>
              View issues
              <ChevronRight size={16} />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
