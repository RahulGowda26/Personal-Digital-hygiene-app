import { useCallback, useEffect, useState } from 'react';
import {
  Stethoscope,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Clock,
  Info,
} from 'lucide-react';
import type { DashboardData, SecurityCategory, SecurityFinding } from '@/types';
import { fetchDashboard, ensureDevice } from '@/services/api';
import { useAuth } from '@/auth/AuthContext';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, CenteredLoader } from '@/components/ui/Spinner';
import {
  greeting,
  gradeLabel,
  formatRelativeTime,
  formatDateTime,
  severityRank,
} from '@/lib/severity';
import { categoryLabels, categoryShortLabels } from '@/data/checkupQuestions';
import { userFacingError } from '@/lib/errors';

interface HomeScreenProps {
  onRunCheckup: () => void;
  onFixNow: () => void;
  onViewIssues: () => void;
}

export function HomeScreen({ onRunCheckup, onFixNow, onViewIssues }: HomeScreenProps) {
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

  const score = data.latestScore;
  const openFindings = data.findings.filter(
    (f) => f.status === 'open' || f.status === 'resolving',
  );
  const criticalCount = openFindings.filter((f) => f.severity === 'critical').length;
  const highCount = openFindings.filter((f) => f.severity === 'high').length;
  const warningCount = openFindings.filter(
    (f) => f.severity === 'medium' || f.severity === 'low',
  ).length;
  const hasIssues = openFindings.length > 0;

  const displayName = user?.email?.split('@')[0] ?? 'there';

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {greeting()}, {displayName}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Here is a snapshot of your digital security.
        </p>
      </div>

      {/* Score + actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card padding="lg" className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex items-center gap-6">
            {score ? (
              <ScoreRing
                score={score.deviceScore || score.score}
                grade={score.grade}
                preliminary={score.is_preliminary}
              />
            ) : (
              <NoScorePlaceholder />
            )}
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-900">
                Device Security
              </h2>
              {score ? (
                <>
                  <p className="text-sm text-slate-600">
                    Your device score is{' '}
                    <span className="font-semibold text-slate-900">
                      {score.deviceScore || score.score} / 100
                    </span>
                    .
                  </p>
                  {hasIssues ? (
                    <p className="text-sm text-slate-600">
                      {openFindings.length}{' '}
                      {openFindings.length === 1 ? 'issue' : 'issues'} need
                      attention
                    </p>
                  ) : (
                    <p className="text-sm text-emerald-600">
                      No open issues. Great work.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-500 max-w-xs">
                  Run your first scan to see your Device Security Score.
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card padding="lg" className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex items-center gap-6">
            {score ? (
              <ScoreRing
                score={score.habitsScore || score.score}
                grade={score.grade}
                preliminary={score.is_preliminary}
              />
            ) : (
              <NoScorePlaceholder />
            )}
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-900">
                Security Habits
              </h2>
              {score ? (
                <>
                  <p className="text-sm text-slate-600">
                    Your habits score is{' '}
                    <span className="font-semibold text-slate-900">
                      {score.habitsScore || score.score} / 100
                    </span>
                    .
                  </p>
                  <p className="text-sm text-slate-600">
                    Based on your security practices.
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-500 max-w-xs">
                  Take the checkup to see your Security Habits Score.
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className="flex gap-4">
        {hasIssues ? (
          <Button variant="secondary" onClick={onFixNow}>
            <AlertTriangle size={16} />
            Fix now
          </Button>
        ) : (
          <Button variant="secondary" disabled>
            <ShieldCheck size={16} />
            All clear
          </Button>
        )}
        <Button variant="outline" onClick={onRunCheckup}>
          Scan Device
        </Button>
      </div>

      {/* Issue summary strip */}
      {(criticalCount > 0 || highCount > 0 || warningCount > 0) && (
        <div className="grid grid-cols-3 gap-3">
          <IssueStat
            count={criticalCount}
            label="Critical"
            color="text-red-600"
            bg="bg-red-50"
            border="border-red-200"
          />
          <IssueStat
            count={highCount}
            label="High"
            color="text-orange-600"
            bg="bg-orange-50"
            border="border-orange-200"
          />
          <IssueStat
            count={warningCount}
            label="Warnings"
            color="text-amber-600"
            bg="bg-amber-50"
            border="border-amber-200"
          />
        </div>
      )}

      {/* Security overview */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-900">
            Security overview
          </h3>
          {score && (
            <button
              onClick={onViewIssues}
              className="text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              View issues
            </button>
          )}
        </div>
        {score ? (
          <CategoryOverview components={score.components} />
        ) : (
          <EmptyState
            icon={<ShieldCheck size={24} />}
            title="No score yet"
            description="Run a checkup to see how each area of your digital security is doing."
            action={
              <Button onClick={onRunCheckup}>
                <Stethoscope size={16} />
                Run Checkup
              </Button>
            }
          />
        )}
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Last checkup */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={18} className="text-slate-400" />
            <h3 className="text-base font-semibold text-slate-900">
              Last checkup
            </h3>
          </div>
          {data.lastCheckup ? (
            <div>
              <p className="text-sm text-slate-700">
                {data.lastCheckup.status === 'completed'
                  ? 'Completed'
                  : 'In progress'}
              </p>
              <p className="text-sm text-slate-500 mt-0.5">
                {data.lastCheckup.completed_at
                  ? formatRelativeTime(data.lastCheckup.completed_at)
                  : formatRelativeTime(data.lastCheckup.started_at)}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {data.lastCheckup.completed_at
                  ? formatDateTime(data.lastCheckup.completed_at)
                  : formatDateTime(data.lastCheckup.started_at)}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={onRunCheckup}
              >
                <Stethoscope size={14} />
                Run Checkup
              </Button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-slate-500">
                You have not run a checkup yet.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={onRunCheckup}
              >
                <Stethoscope size={14} />
                Run your first checkup
              </Button>
            </div>
          )}
        </Card>

        {/* Recent activity */}
        <Card>
          <h3 className="text-base font-semibold text-slate-900 mb-3">
            Recent activity
          </h3>
          {data.recentEvents.length > 0 ? (
            <ul className="space-y-2.5">
              {data.recentEvents.map((event) => (
                <li key={event.id} className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                  <div className="min-w-0">
                    <p className="text-sm text-slate-700">
                      {eventLabel(event.event_type)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatRelativeTime(event.created_at)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">
              No recent activity. Run a checkup to get started.
            </p>
          )}
        </Card>
      </div>

      {/* Top priority issues preview */}
      {hasIssues && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900">
              Top priorities
            </h3>
            <button
              onClick={onViewIssues}
              className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              View all <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {[...openFindings]
              .sort((a, b) => severityRank[a.severity] - severityRank[b.severity])
              .slice(0, 3)
              .map((f) => (
                <FindingRow key={f.id} finding={f} onClick={onViewIssues} />
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function NoScorePlaceholder() {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-full border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400"
      style={{ width: 180, height: 180 }}
    >
      <ShieldCheck size={32} />
      <span className="mt-2 text-xs font-medium">No score yet</span>
    </div>
  );
}

function IssueStat({
  count,
  label,
  color,
  bg,
  border,
}: {
  count: number;
  label: string;
  color: string;
  bg: string;
  border: string;
}) {
  return (
    <div className={`rounded-xl border ${bg} ${border} px-4 py-3 text-center`}>
      <p className={`text-2xl font-bold tabular-nums ${color}`}>{count}</p>
      <p className="text-xs font-medium text-slate-600 mt-0.5">{label}</p>
    </div>
  );
}

function CategoryOverview({
  components,
}: {
  components: { category: SecurityCategory; score: number; insufficientData: boolean }[];
}) {
  return (
    <div className="space-y-3">
      {components.map((c) => (
        <div key={c.category}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-slate-700">
              {categoryLabels[c.category]}
            </span>
            <div className="flex items-center gap-2">
              {c.insufficientData && (
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
                  Est.
                </span>
              )}
              <span className="text-sm font-semibold tabular-nums text-slate-900">
                {c.score}
              </span>
              <CategoryStatus score={c.score} />
            </div>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${barColor(c.score)}`}
              style={{ width: `${c.score}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function CategoryStatus({ score }: { score: number }) {
  if (score >= 80)
    return <span className="text-xs font-medium text-emerald-600">Good</span>;
  if (score >= 55)
    return <span className="text-xs font-medium text-amber-600">Fair</span>;
  return <span className="text-xs font-medium text-red-600">Poor</span>;
}

function barColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 55) return 'bg-amber-500';
  return 'bg-red-500';
}

function FindingRow({
  finding,
  onClick,
}: {
  finding: SecurityFinding;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-xl border border-slate-100 p-3 text-left hover:bg-slate-50 transition-colors"
    >
      <span
        className={`mt-1 h-2 w-2 shrink-0 rounded-full ${dotColor(finding.severity)}`}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900 truncate">
          {finding.title}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          {categoryShortLabels[finding.category]}
        </p>
      </div>
      <ChevronRight size={16} className="text-slate-300 mt-1" />
    </button>
  );
}

function dotColor(severity: string): string {
  switch (severity) {
    case 'critical': return 'bg-red-500';
    case 'high': return 'bg-orange-500';
    case 'medium': return 'bg-amber-500';
    case 'low': return 'bg-sky-500';
    default: return 'bg-slate-400';
  }
}

function eventLabel(type: string): string {
  switch (type) {
    case 'checkup_completed': return 'Checkup completed';
    case 'issue_resolved': return 'Issue resolved';
    case 'playbook_started': return 'Remediation started';
    case 'playbook_completed': return 'Remediation completed';
    default: return type.replace(/_/g, ' ');
  }
}
