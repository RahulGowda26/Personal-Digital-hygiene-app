import { useCallback, useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  PlayCircle,
  Award,
} from 'lucide-react';
import type { Playbook, PlaybookProgress, SecurityFinding } from '@/types';
import { getPlaybook } from '@/data/playbooks';
import { fetchFinding, startPlaybook, advancePlaybookStep } from '@/services/api';
import { useAuth } from '@/auth/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SeverityBadge } from '@/components/ui/SeverityBadge';
import { CenteredLoader, ErrorState } from '@/components/ui/Spinner';
import { userFacingError } from '@/lib/errors';

interface PlaybookScreenProps {
  findingId: string;
  onBack: () => void;
  onComplete: () => void;
}

export function PlaybookScreen({
  findingId,
  onBack,
  onComplete,
}: PlaybookScreenProps) {
  const { user } = useAuth();
  const [finding, setFinding] = useState<SecurityFinding | null>(null);
  const [playbook, setPlaybook] = useState<Playbook | null>(null);
  const [progress, setProgress] = useState<PlaybookProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const f = await fetchFinding(findingId);
      if (!f) {
        setError('Issue not found.');
        return;
      }
      setFinding(f);

      if (f.recommended_playbook) {
        const pb = getPlaybook(f.recommended_playbook);
        if (pb) {
          setPlaybook(pb);
          const p = await startPlaybook(user.id, f.id, pb.id);
          setProgress(p);
        } else {
          setError('No remediation playbook is available for this issue.');
        }
      } else {
        setError('No remediation playbook is available for this issue.');
      }
    } catch (err) {
      setError(userFacingError(err, 'Could not load playbook.'));
    } finally {
      setLoading(false);
    }
  }, [user, findingId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdvance = useCallback(async () => {
    if (!user || !progress || !playbook) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await advancePlaybookStep(
        progress.id,
        user.id,
        playbook.steps.length,
      );
      setProgress(updated);
      if (updated.completed) {
        await new Promise((r) => setTimeout(r, 1500));
        onComplete();
      }
    } catch (err) {
      setError(userFacingError(err, 'Could not save progress.'));
    } finally {
      setBusy(false);
    }
  }, [user, progress, playbook, onComplete]);

  if (loading) return <CenteredLoader label="Loading remediation steps..." />;
  if (error)
    return (
      <div className="space-y-4">
        <BackButton onBack={onBack} />
        <ErrorState message={error} onRetry={load} />
      </div>
    );
  if (!finding || !playbook || !progress) return null;

  const currentStep = playbook.steps[Math.min(progress.current_step, playbook.steps.length - 1)];
  const isLastStep = progress.current_step >= playbook.steps.length - 1;
  const isCompleted = progress.completed;
  const stepNumber = Math.min(progress.current_step + 1, playbook.steps.length);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <BackButton onBack={onBack} />

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <SeverityBadge severity={finding.severity} />
          <span className="text-xs text-slate-400">
            {finding.category.replace('_', ' ')}
          </span>
        </div>
        <h1 className="text-xl font-bold text-slate-900">{playbook.title}</h1>
        <p className="text-sm text-slate-500 mt-1.5">{playbook.summary}</p>
      </div>

      {isCompleted ? (
        <Card className="flex flex-col items-center text-center py-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
            <Award size={28} />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">
            Playbook completed
          </h2>
          <p className="text-sm text-slate-500 mt-1.5 max-w-sm">
            Great work. This issue has been marked as resolved and your score
            will update on your next checkup.
          </p>
          <Button className="mt-6" onClick={onComplete}>
            Back to issues
          </Button>
        </Card>
      ) : (
        <>
          {/* Progress steps */}
          <div className="flex items-center gap-1.5">
            {playbook.steps.map((s, i) => (
              <div
                key={s.index}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i < progress.current_step
                    ? 'bg-emerald-500'
                    : i === progress.current_step
                      ? 'bg-slate-900'
                      : 'bg-slate-200'
                }`}
              />
            ))}
          </div>

          {/* Current step */}
          <Card padding="lg">
            <div className="flex items-center gap-2 mb-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white text-xs font-bold">
                {stepNumber}
              </span>
              <span className="text-sm font-medium text-slate-500">
                Step {stepNumber} of {playbook.steps.length}
              </span>
            </div>

            <h2 className="text-lg font-semibold text-slate-900">
              {currentStep.title}
            </h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              {currentStep.explanation}
            </p>

            <div className="mt-5 rounded-xl bg-slate-50 border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                What to do
              </p>
              <p className="text-sm text-slate-700">{currentStep.action}</p>
              {currentStep.deepLink && (
                <a
                  href={currentStep.deepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-900 hover:underline"
                >
                  Open settings
                  <ExternalLink size={14} />
                </a>
              )}
            </div>

            <div className="mt-4 flex items-start gap-2.5">
              <ShieldCheck
                size={16}
                className="text-emerald-500 mt-0.5 shrink-0"
              />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  How to verify
                </p>
                <p className="text-sm text-slate-600 mt-0.5">
                  {currentStep.verification}
                </p>
              </div>
            </div>
          </Card>

          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}

          {/* Navigation */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack} disabled={busy}>
              <ChevronLeft size={16} />
              Pause
            </Button>
            <Button
              fullWidth
              variant="secondary"
              disabled={busy}
              onClick={handleAdvance}
            >
              {busy ? (
                'Saving...'
              ) : isLastStep ? (
                <>
                  <CheckCircle2 size={16} />
                  Complete & resolve
                </>
              ) : (
                <>
                  Next step
                  <ChevronRight size={16} />
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      onClick={onBack}
      className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
    >
      <ChevronLeft size={16} />
      Back
    </button>
  );
}

// Unused but kept for potential future "start" overview screen.
export function PlaybookStartIcon() {
  return <PlayCircle size={20} />;
}
