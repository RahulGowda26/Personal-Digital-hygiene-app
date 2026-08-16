import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  Inbox,
  RefreshCw,
  ChevronDown,
  ChevronUp,
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
        const aSev = typeof severityRank === 'function' ? severityRank(a.severity) : (a.severity === 'critical' ? 0 : a.severity === 'high' ? 1 : a.severity === 'medium' ? 2 : 3);
        const bSev = typeof severityRank === 'function' ? severityRank(b.severity) : (b.severity === 'critical' ? 0 : b.severity === 'high' ? 1 : b.severity === 'medium' ? 2 : 3);
        if (aSev !== bSev) return aSev - bSev;
        
        // Then by detected_at (newest first)
        const aTime = new Date(a.detected_at || 0).getTime();
        const bTime = new Date(b.detected_at || 0).getTime();
        return bTime - aTime;
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
                  No issues at this risk level.
                </p>
              </Card>
            ) : (
              filtered.map((finding) => (
                <IssueCard
                  key={finding.id}
                  finding={finding}
                  onOpenPlaybook={onOpenPlaybook}
                  onResolve={async () => {
                    if (!user) return;
                    try {
                      const { resolveFinding } = await import('@/services/api');
                      await resolveFinding(finding.id, user.id);
                      load();
                    } catch (e) {
                      console.error(e);
                    }
                  }}
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
  onResolve,
}: {
  finding: SecurityFinding;
  onOpenPlaybook: (id: string) => void;
  onResolve: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const c = severityColors[finding.severity];
  const isResolved = finding.status === 'resolved';

  return (
    <Card className={`border-l-8 ${c.border} shadow-sm overflow-hidden`} padding="none">
      <div 
        className="p-5 md:p-6 cursor-pointer hover:bg-slate-50 transition-colors flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <AlertTriangle className={c.text} size={24} />
            <h3 className="text-lg md:text-xl font-bold text-slate-900 leading-tight">
              {finding.title}
            </h3>
            {isResolved && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-bold ml-2">
                <CheckCircle2 size={16} />
                Fixed
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 ml-9">
            <div className="flex items-center gap-2">
              <SeverityBadge severity={finding.severity} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Detected:</span>
              <span className="text-xs font-bold text-slate-900">{formatRelativeTime(finding.detected_at)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center p-2 rounded-full bg-slate-100 text-slate-500">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {isExpanded && (
        <div className="p-5 md:p-6 pt-0 border-t border-slate-100">
          <div className="flex flex-col gap-5 mt-5">
            <div className="bg-slate-50 p-4 rounded-xl space-y-4">
              <div>
                <h4 className="text-base font-bold text-slate-900 mb-2">Why we detected this:</h4>
                {finding.evidence && finding.evidence.length > 0 ? (
                  <div className="space-y-1">
                    {finding.evidence.map((ev, i) => (
                      <p key={i} className="text-sm text-slate-700 font-medium">{ev}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-700">We found an unexpected security risk in this app.</p>
                )}
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900 mb-1">Why this matters:</h4>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {finding.description}
                </p>
              </div>
            </div>

            {!isResolved && (
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h4 className="text-base font-bold text-slate-900 mb-3">What you can do:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700 mb-5 font-medium">
                  <li>Review the permissions requested by this app</li>
                  <li>Remove access to things it doesn't need</li>
                  <li>Uninstall the app if you don't trust it</li>
                </ol>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="primary"
                    className="flex-1 text-base py-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenPlaybook(finding.id);
                    }}
                  >
                    Open Settings
                    <ChevronRight size={18} />
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-base py-3 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      onResolve();
                    }}
                  >
                    <CheckCircle2 size={18} className="mr-2" />
                    Mark as Fixed
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
