import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  Inbox,
  RefreshCw,
} from 'lucide-react';
import type { SecurityFinding, Severity } from '@/types';
import { fetchFindings } from '@/services/api';
import { useAuth } from '@/auth/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SeverityBadge, StatusBadge } from '@/components/ui/SeverityBadge';
import { CenteredLoader, EmptyState, ErrorState } from '@/components/ui/Spinner';
import { severityRank, severityColors, formatRelativeTime } from '@/lib/severity';
import { categoryLabels } from '@/data/checkupQuestions';

interface IssuesScreenProps {
  onOpenPlaybook: (findingId: string) => void;
}

const severityFilters: { value: Severity | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export function IssuesScreen({ onOpenPlaybook }: IssuesScreenProps) {
  const { user } = useAuth();
  const [findings, setFindings] = useState<SecurityFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Severity | 'all'>('all');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFindings(user.id);
      setFindings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load issues.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const sortedFindings = useMemo(() => {
    return [...findings]
      .filter((f) => f.status !== 'dismissed')
      .sort((a, b) => {
        // Open issues first
        const aOpen = a.status === 'open' ? 0 : 1;
        const bOpen = b.status === 'open' ? 0 : 1;
        if (aOpen !== bOpen) return aOpen - bOpen;
        // Then by severity
        return severityRank[a.severity] - severityRank[b.severity];
      });
  }, [findings]);

  const filtered = useMemo(() => {
    if (filter === 'all') return sortedFindings;
    return sortedFindings.filter((f) => f.severity === filter);
  }, [sortedFindings, filter]);

  const openCount = findings.filter((f) => f.status === 'open').length;

  if (loading) return <CenteredLoader label="Loading issues..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Issues</h1>
          <p className="text-sm text-slate-500 mt-1">
            {openCount > 0
              ? `${openCount} ${openCount === 1 ? 'issue' : 'issues'} need attention`
              : 'No open issues. Your digital security looks healthy.'}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={load}>
          <RefreshCw size={14} />
          Refresh
        </Button>
      </div>

      {findings.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Inbox size={24} />}
            title="No issues yet"
            description="Run a checkup to detect security issues and get personalized recommendations."
          />
        </Card>
      ) : (
        <>
          {/* Filter pills */}
          <div className="flex flex-wrap gap-2">
            {severityFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  filter === f.value
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Issue cards */}
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <Card>
                <p className="text-sm text-slate-500 text-center py-6">
                  No issues at this severity level.
                </p>
              </Card>
            ) : (
              filtered.map((finding) => (
                <IssueCard
                  key={finding.id}
                  finding={finding}
                  onOpenPlaybook={onOpenPlaybook}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function IssueCard({
  finding,
  onOpenPlaybook,
}: {
  finding: SecurityFinding;
  onOpenPlaybook: (id: string) => void;
}) {
  const c = severityColors[finding.severity];
  const isResolved = finding.status === 'resolved';

  return (
    <Card
      className={`border-l-4 ${c.border}`}
      padding="md"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <SeverityBadge severity={finding.severity} />
            <StatusBadge status={finding.status} />
          </div>
          <span className="text-xs text-slate-400 shrink-0">
            {formatRelativeTime(finding.detected_at)}
          </span>
        </div>

        <div>
          <h3 className="text-base font-semibold text-slate-900">
            {finding.title}
          </h3>
          <p className="text-xs font-medium text-slate-400 mt-0.5">
            {categoryLabels[finding.category]}
          </p>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">
          {finding.description}
        </p>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="capitalize">{finding.confidence} confidence</span>
          <span>·</span>
          <span className="capitalize">{finding.platform} platform</span>
          {finding.source && (
            <>
              <span>·</span>
              <span className="uppercase text-slate-500 font-medium">
                {finding.source.replace('_', ' ')}
              </span>
            </>
          )}
        </div>

        {finding.evidence && finding.evidence.length > 0 && (
          <div className="bg-slate-900 rounded-md p-3 border border-slate-700 mt-2 space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Evidence</p>
            {finding.evidence.map((ev, i) => (
              <div key={i} className="text-xs text-slate-300 font-mono">
                {ev}
              </div>
            ))}
          </div>
        )}

        {!isResolved && finding.recommended_playbook && (
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            onClick={() => onOpenPlaybook(finding.id)}
          >
            <AlertTriangle size={14} />
            Fix this issue
            <ChevronRight size={14} />
          </Button>
        )}
        {isResolved && (
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
            <CheckCircle2 size={16} />
            Resolved
          </div>
        )}
      </div>
    </Card>
  );
}
