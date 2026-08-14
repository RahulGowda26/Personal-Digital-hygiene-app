import type { HTMLAttributes } from 'react';

export function Card({ className = '', padding = 'md', ...props }: HTMLAttributes<HTMLDivElement> & { padding?: 'sm' | 'md' | 'lg' }) {
  const paddingClass = { sm: 'p-3', md: 'p-5', lg: 'p-6' }[padding];
  return <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${paddingClass} ${className}`} {...props} />;
}
