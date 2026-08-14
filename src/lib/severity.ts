import type { ScoreGrade, Severity } from '@/types';

export const severityLabel: Record<Severity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  info: 'Info',
};

export const severityRank: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

export const severityColors: Record<Severity, { bg: string; text: string; border: string; dot: string }> = {
  critical: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-500',
  },
  high: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
  },
  medium: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  low: {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    dot: 'bg-sky-500',
  },
  info: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
};

export const gradeLabel: Record<ScoreGrade, string> = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
  critical: 'Critical',
};

export const gradeColors: Record<ScoreGrade, { text: string; ring: string; bg: string }> = {
  excellent: { text: 'text-emerald-600', ring: 'stroke-emerald-500', bg: 'bg-emerald-50' },
  good: { text: 'text-green-600', ring: 'stroke-green-500', bg: 'bg-green-50' },
  fair: { text: 'text-amber-600', ring: 'stroke-amber-500', bg: 'bg-amber-50' },
  poor: { text: 'text-orange-600', ring: 'stroke-orange-500', bg: 'bg-orange-50' },
  critical: { text: 'text-red-600', ring: 'stroke-red-500', bg: 'bg-red-50' },
};

export function statusLabel(status: string): string {
  switch (status) {
    case 'open':
      return 'Needs attention';
    case 'resolving':
      return 'In progress';
    case 'resolved':
      return 'Resolved';
    case 'dismissed':
      return 'Dismissed';
    default:
      return status;
  }
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) {
    const h = diffHr === 1 ? '1 hour' : `${diffHr} hours`;
    return `${h} ago`;
  }
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay} days ago`;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: diffDay > 365 ? 'numeric' : undefined,
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}
