import type { ScoreGrade } from '@/types';
import { gradeLabel } from '@/lib/severity';

export function ScoreRing({ score, grade, preliminary = false }: { score: number | null; grade: ScoreGrade | 'N/A'; preliminary?: boolean }) {
  const displayScore = score === null ? 'N/A' : score;
  const displayGrade = grade === 'N/A' ? 'Cannot Assess' : gradeLabel[grade as ScoreGrade];
  return <div className="flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-full border-8 border-slate-800 bg-slate-50"><span className="text-3xl font-bold text-slate-900">{displayScore}</span><span className="text-xs font-medium text-slate-500 text-center leading-tight px-1">{displayGrade}</span>{preliminary && <span className="text-[10px] text-slate-400">Preliminary</span>}</div>;
}
