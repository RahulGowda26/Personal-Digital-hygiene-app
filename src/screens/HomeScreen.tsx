import { useCallback, useEffect, useState } from 'react';
import {
  ShieldCheck,
  Smartphone,
  AppWindow,
  EyeOff,
  UserCheck,
  ChevronRight,
} from 'lucide-react';
import type { DashboardData } from '@/types';
import { fetchDashboard, ensureDevice } from '@/services/api';
import { useAuth } from '@/auth/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, CenteredLoader } from '@/components/ui/Spinner';
import { userFacingError } from '@/lib/errors';

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

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      await ensureDevice(user.id, 'web');
      const dashboard = await fetchDashboard(user.id);
      setData(dashboard);
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

  const score = data.latestScore?.score ?? 0;
  const hasScore = data.latestScore !== null;
  const openFindings = data.findings.filter((f) => f.status === 'open' || f.status === 'resolving');
  const hasIssues = openFindings.length > 0;
  const displayName = user?.email?.split('@')[0] ?? 'there';

  let healthMessage = 'Run a scan to see your protection level';
  let healthColor = 'text-slate-400';
  if (hasScore) {
    if (score >= 80) {
      healthMessage = 'Your device is mostly protected';
      healthColor = 'text-emerald-500';
    } else if (score >= 50) {
      healthMessage = 'Your device needs attention';
      healthColor = 'text-amber-500';
    } else {
      healthMessage = 'Your device is at risk';
      healthColor = 'text-red-500';
    }
  }

  // App safety metrics
  const appFindings = openFindings.filter(f => f.category === 'apps');
  
  // Privacy metrics
  const privacyFindings = openFindings.filter(f => f.category === 'privacy');

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col items-center justify-center pt-8 pb-4">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Hello, {displayName}</h1>
        {hasScore ? (
          <div className="flex flex-col items-center">
            <span className={`text-6xl font-black ${healthColor}`}>{score}<span className="text-2xl text-slate-400 font-bold">/100</span></span>
            <p className="text-lg font-medium text-slate-600 mt-2">{healthMessage}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <ShieldCheck size={64} className="text-slate-300 mb-2" />
            <p className="text-lg font-medium text-slate-600">No score yet</p>
          </div>
        )}
        <div className="mt-6 w-full max-w-xs flex flex-col gap-3">
          <Button onClick={onRunCheckup} size="lg" className="w-full text-lg py-6 shadow-md">
            Scan Device Now
          </Button>
          <Button onClick={onScanNetwork} variant="secondary" size="lg" className="w-full text-lg py-6 shadow-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700">
            Scan Wi-Fi Security
          </Button>
        </div>
      </div>

      <h2 className="text-xl font-bold text-slate-900 px-1">Security Status</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Device Protection */}
        <StatusCard
          icon={<Smartphone size={24} className="text-blue-500" />}
          title="Device Protection"
          status={hasScore ? "Protected" : "Unknown"}
          details={hasScore ? "Screen lock active, Encryption on" : "Scan to check"}
          onClick={onViewIssues}
        />

        {/* App Safety */}
        <StatusCard
          icon={<AppWindow size={24} className="text-emerald-500" />}
          title="App Safety"
          status={hasScore ? (appFindings.length > 0 ? `${appFindings.length} Risky Apps` : "Safe") : "Unknown"}
          details={hasScore ? "Dangerous permissions checked" : "Scan to check"}
          onClick={onViewIssues}
          alert={appFindings.length > 0}
        />

        {/* Privacy Protection */}
        <StatusCard
          icon={<EyeOff size={24} className="text-purple-500" />}
          title="Privacy Protection"
          status={hasScore ? (privacyFindings.length > 0 ? "Review Needed" : "Safe") : "Unknown"}
          details={hasScore ? "Camera, Mic, and Location access checked" : "Scan to check"}
          onClick={onViewIssues}
          alert={privacyFindings.length > 0}
        />

        {/* Account Safety */}
        <StatusCard
          icon={<UserCheck size={24} className="text-orange-500" />}
          title="Account Safety (Survey)"
          status={hasScore ? "Checked" : "Unknown"}
          details={hasScore ? "Data leaks and password exposure" : "Click to take the security habits survey"}
          onClick={onRunHabitsCheckup}
        />

      </div>

    </div>
  );
}

function StatusCard({ 
  icon, 
  title, 
  status, 
  details, 
  onClick,
  alert = false
}: { 
  icon: React.ReactNode; 
  title: string; 
  status: string; 
  details: string; 
  onClick: () => void;
  alert?: boolean;
}) {
  return (
    <Card 
      className={`hover:bg-slate-50 transition-colors cursor-pointer ${alert ? 'border-amber-300 bg-amber-50/30' : ''}`} 
      onClick={onClick}
      padding="lg"
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl bg-white shadow-sm border ${alert ? 'border-amber-200' : 'border-slate-100'}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className={`text-base font-semibold ${alert ? 'text-amber-600' : 'text-slate-700'}`}>
            {status}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {details}
          </p>
        </div>
        <ChevronRight size={20} className="text-slate-400 mt-2 shrink-0" />
      </div>
    </Card>
  );
}
