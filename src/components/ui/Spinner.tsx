import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './Button';

export function CenteredLoader({ label = 'Loading...' }: { label?: string }) {
  return <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-sm text-slate-500"><Loader2 className="animate-spin" />{label}</div>;
}
export function FullPageLoader({ label }: { label?: string }) {
  return <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 text-sm text-slate-500"><Loader2 className="animate-spin" />{label ?? 'Loading...'}</div>;
}
export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return <div className="py-8 text-center">{icon && <div className="mb-3 flex justify-center text-slate-400">{icon}</div>}<p className="font-medium text-slate-900">{title}</p>{description && <p className="mt-1 text-sm text-slate-500">{description}</p>}{action && <div className="mt-4">{action}</div>}</div>;
}
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="py-8 text-center"><p className="text-sm text-red-600">{message}</p>{onRetry && <Button variant="outline" className="mt-4" onClick={onRetry}>Try again</Button>}</div>;
}
