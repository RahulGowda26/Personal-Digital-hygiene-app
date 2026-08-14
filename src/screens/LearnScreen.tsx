import { useState } from 'react';
import {
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  BookOpen,
  RotateCcw,
} from 'lucide-react';
import type { ThreatScenario, ThreatScene } from '@/types';
import { threatScenarios } from '@/data/threatScenarios';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const difficultyColors: Record<string, string> = {
  Beginner: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Intermediate: 'bg-amber-50 text-amber-700 border-amber-200',
  Advanced: 'bg-red-50 text-red-700 border-red-200',
};

export function LearnScreen() {
  const [active, setActive] = useState<ThreatScenario | null>(null);

  if (active) {
    return (
      <ScenarioPlayer
        scenario={active}
        onExit={() => setActive(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Learn</h1>
        <p className="text-sm text-slate-500 mt-1">
          Interactive simulations that teach you to spot common digital threats.
          No prior knowledge needed.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {threatScenarios.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => setActive(scenario)}
            className="text-left"
          >
            <Card className="hover:border-slate-300 hover:shadow-md transition-all h-full">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <GraduationCap size={20} />
                </div>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${difficultyColors[scenario.difficulty]}`}
                >
                  {scenario.difficulty}
                </span>
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                {scenario.title}
              </h3>
              <p className="text-sm text-slate-500 mt-1.5 line-clamp-2">
                {scenario.summary}
              </p>
              <div className="flex items-center gap-3 mt-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <BookOpen size={12} />
                  {scenario.category}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {scenario.duration}
                </span>
              </div>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}

function ScenarioPlayer({
  scenario,
  onExit,
}: {
  scenario: ThreatScenario;
  onExit: () => void;
}) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);

  const scene: ThreatScene = scenario.scenes[sceneIndex];
  const isLastScene = sceneIndex >= scenario.scenes.length - 1;

  function handleSelect(idx: number) {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    if (idx === scene.correctIndex) setScore((s) => s + 1);
  }

  function handleNext() {
    if (isLastScene) return;
    setSceneIndex((i) => i + 1);
    setSelected(null);
    setRevealed(false);
  }

  function handleRestart() {
    setSceneIndex(0);
    setSelected(null);
    setRevealed(false);
    setScore(0);
  }


  // --- Final results ---
  if (isLastScene && revealed) {
    const passed = score >= scenario.scenes.length / 2;
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <button
          onClick={onExit}
          className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ChevronLeft size={16} />
          Back to Learn
        </button>

        <Card className="flex flex-col items-center text-center py-10">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-full mb-4 ${
              passed
                ? 'bg-emerald-100 text-emerald-600'
                : 'bg-amber-100 text-amber-600'
            }`}
          >
            {passed ? <Award /> : <GraduationCap size={28} />}
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {passed ? 'Well done!' : 'Good attempt!'}
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            You got {score} out of {scenario.scenes.length} correct.
          </p>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">
            {passed
              ? 'You have a solid instinct for this kind of threat. Try another scenario to keep sharp.'
              : 'Review the explanations and try again — practice makes these instincts second nature.'}
          </p>
          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={handleRestart}>
              <RotateCcw size={14} />
              Try again
            </Button>
            <Button onClick={onExit}>
              Back to Learn
              <ChevronRight size={14} />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <button
          onClick={onExit}
          className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ChevronLeft size={16} />
          Exit
        </button>
        <span className="text-sm font-medium text-slate-500">
          {scenario.title}
        </span>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-1.5">
        {scenario.scenes.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < sceneIndex || (i === sceneIndex && revealed)
                ? 'bg-slate-900'
                : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* Scene */}
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
            {sceneIndex + 1}
          </span>
          <span className="text-sm text-slate-500">
            Situation {sceneIndex + 1} of {scenario.scenes.length}
          </span>
        </div>

        <p className="text-sm text-slate-800 leading-relaxed mb-5">
          {scene.prompt}
        </p>

        <div className="space-y-2.5">
          {scene.choices.map((choice, idx) => {
            const isCorrect = idx === scene.correctIndex;
            const isSelected = idx === selected;
            let cls =
              'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50';
            if (revealed) {
              if (isCorrect) {
                cls = 'border-emerald-300 bg-emerald-50 text-emerald-900';
              } else if (isSelected) {
                cls = 'border-red-300 bg-red-50 text-red-900';
              } else {
                cls = 'border-slate-200 text-slate-400';
              }
            }
            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={revealed}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all ${cls}`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    revealed && isCorrect
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : revealed && isSelected
                        ? 'border-red-500 bg-red-500 text-white'
                        : 'border-slate-300'
                  }`}
                >
                  {revealed && isCorrect && <CheckCircle2 size={12} />}
                  {revealed && isSelected && !isCorrect && <XCircle size={12} />}
                </span>
                {choice.label}
              </button>
            );
          })}
        </div>

        {revealed && (
          <div className="mt-5 rounded-xl bg-slate-50 border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              {selected === scene.correctIndex ? 'Correct!' : 'Not quite'}
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">
              {scene.explanation}
            </p>
          </div>
        )}
      </Card>

      {revealed && !isLastScene && (
        <Button fullWidth onClick={handleNext}>
          Next situation
          <ArrowRight size={16} />
        </Button>
      )}
    </div>
  );
}

function Award() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}
