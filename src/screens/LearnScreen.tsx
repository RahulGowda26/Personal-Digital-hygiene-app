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
  Beginner: 'bg-emerald-950/30 text-emerald-400 border-emerald-500/30',
  Intermediate: 'bg-amber-950/30 text-amber-400 border-amber-500/30',
  Advanced: 'bg-cyber-neon/10 text-cyber-neon border-cyber-neon/30',
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
    <div className="space-y-6 text-cyber-text pb-24 md:pb-8 pt-2 md:pt-4">
      <div>
        <h1 className="text-3xl md:text-4xl font-outline font-bold tracking-widest uppercase text-white mb-2 shadow-cyber">Cyber Defense Training</h1>
        <p className="text-cyber-textMuted font-medium font-mono text-sm uppercase tracking-wide">
          Interactive simulations that teach you to spot common digital threats.
          No prior knowledge needed.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {threatScenarios.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => setActive(scenario)}
            className="text-left group outline-none"
          >
            <Card className="h-full p-5 rounded-[20px] border border-cyber-neon/20 shadow-[0_0_15px_rgba(255,42,66,0.05)] bg-cyber-surface flex flex-col group-hover:border-cyber-neon/40 transition-all relative overflow-hidden group-focus:ring-1 group-focus:ring-cyber-neon">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,42,66,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,42,66,0.05)_1px,transparent_1px)] bg-[size:30px_30px] opacity-0 group-hover:opacity-10 transition-opacity" />
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyber-bg border border-cyber-neon/30 text-cyber-neon">
                    <GraduationCap size={20} />
                  </div>
                  <span
                    className={`rounded-md border px-2 py-1 text-[10px] font-bold font-mono tracking-widest uppercase ${difficultyColors[scenario.difficulty]}`}
                  >
                    {scenario.difficulty}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white font-outline uppercase tracking-wide">
                  {scenario.title}
                </h3>
                <p className="text-xs text-cyber-textMuted mt-1.5 line-clamp-2 leading-relaxed">
                  {scenario.summary}
                </p>
                <div className="flex items-center gap-4 mt-auto pt-4 text-[10px] text-cyber-neon/60 font-mono tracking-wider font-bold">
                  <span className="flex items-center gap-1.5 uppercase">
                    <BookOpen size={14} />
                    {scenario.category}
                  </span>
                  <span className="flex items-center gap-1.5 uppercase">
                    <Clock size={14} />
                    {scenario.duration}
                  </span>
                </div>
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
      <div className="max-w-xl mx-auto space-y-6 pb-24 md:pb-8 pt-2 md:pt-4 text-cyber-text">
        <button
          onClick={onExit}
          className="flex items-center gap-2 text-[10px] font-bold font-mono text-cyber-neon/70 hover:text-cyber-neon uppercase tracking-widest transition-colors"
        >
          <ChevronLeft size={16} />
          Abort Simulation
        </button>

        <Card className="flex flex-col items-center text-center p-10 rounded-[24px] border border-cyber-neon/20 shadow-[0_0_20px_rgba(255,42,66,0.1)] bg-cyber-surface relative overflow-hidden group">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,42,66,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,42,66,0.05)_1px,transparent_1px)] bg-[size:30px_30px] opacity-20 group-hover:opacity-40 transition-opacity" />
          <div className="relative z-10 flex flex-col items-center">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-xl border mb-6 shadow-[0_0_15px_rgba(0,0,0,0.5)] ${
                passed
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/50 shadow-emerald-500/20'
                  : 'bg-cyber-bg text-cyber-neon border-cyber-neon/50 shadow-cyber-neon/20'
              }`}
            >
              {passed ? <Award /> : <GraduationCap size={32} />}
            </div>
            <h2 className="text-2xl font-bold text-white uppercase tracking-wider font-outline mb-2">
              {passed ? 'Simulation Complete' : 'Simulation Failed'}
            </h2>
            <p className="text-xs font-mono text-cyber-neon/80 uppercase tracking-widest mb-4">
              Score: {score} / {scenario.scenes.length}
            </p>
            <p className="text-sm text-cyber-textMuted leading-relaxed max-w-sm">
              {passed
                ? 'You have a solid instinct for this kind of threat. Proceed to the next scenario to maintain operational readiness.'
                : 'Review the post-mortem analysis and re-run the simulation. Practice makes these instincts second nature.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full sm:w-auto">
              <Button onClick={handleRestart} className="bg-cyber-surface border border-cyber-neon/30 text-cyber-neon hover:bg-cyber-neon hover:text-cyber-bg flex items-center justify-center gap-2 px-6 h-10 rounded-lg uppercase tracking-widest font-bold text-[10px] transition-all">
                <RotateCcw size={14} />
                Re-run
              </Button>
              <Button onClick={onExit} className="bg-cyber-neon/10 border border-cyber-neon/50 text-cyber-neon hover:bg-cyber-neon hover:text-cyber-bg flex items-center justify-center gap-2 px-6 h-10 rounded-lg shadow-[0_0_15px_rgba(255,42,66,0.2)] uppercase tracking-widest font-bold text-[10px] transition-all">
                Return to Matrix
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-5 pb-24 md:pb-8 pt-2 md:pt-4 text-cyber-text">
      <div className="flex items-center justify-between">
        <button
          onClick={onExit}
          className="flex items-center gap-2 text-[10px] font-bold font-mono text-cyber-neon/70 hover:text-cyber-neon uppercase tracking-widest transition-colors"
        >
          <ChevronLeft size={16} />
          Abort
        </button>
        <span className="text-[10px] font-bold font-mono text-cyber-neon uppercase tracking-widest">
          {scenario.title}
        </span>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {scenario.scenes.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 transition-all ${
              i < sceneIndex || (i === sceneIndex && revealed)
                ? 'bg-cyber-neon shadow-[0_0_5px_rgba(255,42,66,0.5)]'
                : i === sceneIndex
                  ? 'bg-cyber-neon/50 shadow-[0_0_5px_rgba(255,42,66,0.2)]'
                  : 'bg-cyber-neon/10'
            }`}
          />
        ))}
      </div>

      {/* Scene */}
      <Card className="p-6 md:p-8 rounded-[24px] border border-cyber-neon/20 shadow-[0_0_15px_rgba(255,42,66,0.05)] bg-cyber-surface relative overflow-hidden group">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,42,66,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,42,66,0.05)_1px,transparent_1px)] bg-[size:30px_30px] opacity-10" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6 border-b border-cyber-neon/10 pb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyber-bg border border-cyber-neon/30 text-cyber-neon text-xs font-mono font-bold shadow-[0_0_10px_rgba(255,42,66,0.2)]">
              0{sceneIndex + 1}
            </span>
            <span className="text-xs font-mono font-bold text-cyber-textMuted uppercase tracking-widest">
              Event {sceneIndex + 1} / {scenario.scenes.length}
            </span>
          </div>

          <p className="text-sm text-white leading-relaxed mb-6 font-medium">
            {scene.prompt}
          </p>

          <div className="space-y-3">
            {scene.choices.map((choice, idx) => {
              const isCorrect = idx === scene.correctIndex;
              const isSelected = idx === selected;
              let cls =
                'border-cyber-neon/20 bg-cyber-bg text-cyber-text hover:border-cyber-neon/50 hover:bg-cyber-neon/5';
              if (revealed) {
                if (isCorrect) {
                  cls = 'border-emerald-500/50 bg-emerald-950/30 text-emerald-50 shadow-[0_0_15px_rgba(16,185,129,0.1)]';
                } else if (isSelected) {
                  cls = 'border-cyber-neon/50 bg-cyber-neon/10 text-white shadow-[0_0_15px_rgba(255,42,66,0.1)]';
                } else {
                  cls = 'border-cyber-neon/10 bg-cyber-bg/50 text-cyber-textMuted opacity-50';
                }
              }
              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  disabled={revealed}
                  className={`flex w-full items-center gap-4 rounded-xl border px-5 py-4 text-left text-sm transition-all ${cls}`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                      revealed && isCorrect
                        ? 'border-emerald-500 bg-emerald-500 text-black'
                        : revealed && isSelected
                          ? 'border-cyber-neon bg-cyber-neon text-black'
                          : 'border-cyber-neon/30 bg-cyber-bg'
                    }`}
                  >
                    {revealed && isCorrect && <CheckCircle2 size={12} className="stroke-[3]" />}
                    {revealed && isSelected && !isCorrect && <XCircle size={12} className="stroke-[3]" />}
                  </span>
                  {choice.label}
                </button>
              );
            })}
          </div>

          {revealed && (
            <div className="mt-6 rounded-xl bg-cyber-bg border border-cyber-neon/30 p-5 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
              <p className={`text-[10px] font-bold font-mono uppercase tracking-widest mb-2 flex items-center gap-2 ${selected === scene.correctIndex ? 'text-emerald-400' : 'text-cyber-neon'}`}>
                {selected === scene.correctIndex ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                {selected === scene.correctIndex ? 'THREAT AVOIDED' : 'SYSTEM COMPROMISED'}
              </p>
              <p className="text-sm text-cyber-textMuted leading-relaxed">
                {scene.explanation}
              </p>
            </div>
          )}
        </div>
      </Card>

      {revealed && !isLastScene && (
        <Button onClick={handleNext} className="w-full bg-cyber-neon/10 border border-cyber-neon/50 text-cyber-neon hover:bg-cyber-neon hover:text-cyber-bg flex items-center justify-center gap-2 px-6 h-12 rounded-lg shadow-[0_0_15px_rgba(255,42,66,0.2)] uppercase tracking-widest font-bold text-xs transition-all">
          Next Situation
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
