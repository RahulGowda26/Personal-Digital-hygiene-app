import type { FindingStatus, Severity } from '@/types';

const severityClasses: Record<Severity, string> = { critical: 'bg-red-100 text-red-700', high: 'bg-orange-100 text-orange-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-blue-100 text-blue-700', info: 'bg-slate-100 text-slate-700' };
export function SeverityBadge({ severity }: { severity: Severity }) { return <span className={`rounded-full px-2 py-1 text-xs font-semibold capitalize ${severityClasses[severity]}`}>{severity}</span>; }
export function StatusBadge({ status }: { status: FindingStatus }) { return <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium capitalize text-slate-600">{status}</span>; }
