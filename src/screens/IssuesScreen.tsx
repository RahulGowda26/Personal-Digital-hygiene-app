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
        const aSev = typeof severityRank === 'function' ? (severityRank as any)(a.severity) : (severityRank as any)[a.severity] ?? (a.severity === 'critical' ? 0 : a.severity === 'high' ? 1 : a.severity === 'medium' ? 2 : 3);
        const bSev = typeof severityRank === 'function' ? (severityRank as any)(b.severity) : (severityRank as any)[b.severity] ?? (b.severity === 'critical' ? 0 : b.severity === 'high' ? 1 : b.severity === 'medium' ? 2 : 3);
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
    <div className="space-y-6 pt-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-outline text-outline-glow tracking-widest uppercase">Issues</h1>
          <p className="text-sm font-sans text-cyber-textMuted mt-1">
            {openCount > 0
              ? `${openCount} ${openCount === 1 ? 'issue' : 'issues'} need attention`
              : 'No open issues. Your digital security looks healthy.'}
          </p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 rounded-full border border-cyber-neon/20 bg-cyber-surface text-cyber-neon text-xs font-sans font-semibold hover:bg-cyber-neon/10 transition-colors" onClick={load}>
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {findings.length === 0 ? (
        <div className="cyber-card p-8 flex flex-col items-center justify-center text-center">
          <Inbox size={48} className="text-cyber-neon/50 mb-4" />
          <h3 className="text-xl font-sans font-semibold text-white mb-2">No issues yet</h3>
          <p className="text-sm text-cyber-textMuted">Run a checkup to detect security issues.</p>
        </div>
      ) : (
        <>
          {/* Filter pills */}
          <div className="flex flex-wrap gap-2">
            {severityFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`rounded-full px-4 py-1.5 text-xs font-sans font-semibold uppercase tracking-wider transition-all border ${
                  filter === f.value
                    ? 'bg-cyber-neon/20 border-cyber-neon text-cyber-neon shadow-[0_0_10px_rgba(255,42,66,0.2)]'
                    : 'bg-cyber-surface/50 border-cyber-neon/10 text-cyber-textMuted hover:border-cyber-neon/30 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Issue cards */}
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <div className="cyber-card p-8 text-center text-cyber-textMuted text-sm font-sans">
                No issues at this risk level.
              </div>
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

  const severityClasses = getSeverityColor(finding.severity);
  const glowClass = getSeverityGlow(finding.severity);
  const isResolved = finding.status === 'resolved';

  return (
    <div className={`cyber-card overflow-hidden transition-all duration-300 ${isExpanded ? glowClass : ''}`}>
      <div 
        className="p-5 flex items-center justify-between cursor-pointer hover:bg-cyber-neon/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex items-center gap-3">
            <AlertTriangle className={isResolved ? 'text-emerald-500' : 'text-cyber-neon'} size={20} />
            <h3 className={`text-lg font-sans font-bold leading-tight ${isResolved ? 'text-cyber-textMuted line-through' : 'text-white'}`}>
              {finding.title}
            </h3>
          </div>
          <div className="flex items-center gap-4 ml-8">
            <span className={`text-[10px] font-sans font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm border ${severityClasses}`}>
              {finding.severity}
            </span>
            <span className="text-xs font-sans text-cyber-textMuted">
              {formatRelativeTime(finding.detected_at)}
            </span>
          </div>
        </div>
        <div className="ml-4 text-cyber-neon/50">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {isExpanded && (
        <div className="p-5 pt-0 border-t border-cyber-neon/10 bg-cyber-bg/50">
          <div className="flex flex-col gap-6 mt-5">
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-sans font-bold text-cyber-neon uppercase tracking-wider mb-2">Why we detected this:</h4>
                {finding.evidence && finding.evidence.length > 0 ? (
                  <div className="space-y-1">
                    {finding.evidence.map((ev, i) => (
                      <p key={i} className="text-sm font-sans text-cyber-text">{ev}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-sans text-cyber-text">We found an unexpected security risk in this app.</p>
                )}
              </div>

              <div>
                <h4 className="text-xs font-sans font-bold text-cyber-neon uppercase tracking-wider mb-2">Why this matters:</h4>
                <p className="text-sm font-sans text-cyber-text leading-relaxed">
                  {finding.description}
                </p>
              </div>
            </div>

            {!isResolved && (
              <div className="border border-cyber-neon/20 bg-cyber-surface rounded-xl p-5 shadow-[0_0_20px_rgba(255,42,66,0.1)]">
                <h4 className="text-xs font-sans font-bold text-cyber-neon uppercase tracking-wider mb-3">Action Plan:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm font-sans text-cyber-text mb-6">
                  <li>Review the permissions requested by this app</li>
                  <li>Remove access to things it doesn't need</li>
                  <li>Uninstall the app if you don't trust it</li>
                </ol>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    className="flex-1 text-sm font-sans font-semibold py-3 px-4 bg-cyber-neon/10 text-cyber-neon border border-cyber-neon hover:bg-cyber-neon hover:text-white transition-colors rounded-lg flex items-center justify-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenPlaybook(finding.id);
                    }}
                  >
                    Open Settings
                    <ChevronRight size={16} />
                  </button>
                  <button
                    className="flex-1 text-sm font-sans font-semibold py-3 px-4 border border-emerald-500/50 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-colors rounded-lg flex items-center justify-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onResolve();
                    }}
                  >
                    <CheckCircle2 size={16} />
                    Mark as Fixed
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
