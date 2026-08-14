import { useState, type FormEvent } from 'react';
import { ShieldCheck, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'signup') {
        if (!displayName.trim()) {
          throw new Error('Please enter your name.');
        }
        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters.');
        }
        await signUp(email.trim(), password, displayName.trim());
      } else {
        await signIn(email.trim(), password);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed.';
      setError(translateAuthError(msg));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg mb-4">
              <ShieldCheck size={28} />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Sentinel</h1>
            <p className="text-sm text-slate-500 mt-1">
              Your personal digital security companion
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex gap-1 mb-6 rounded-xl bg-slate-100 p-1">
              <TabButton
                active={mode === 'signin'}
                onClick={() => setMode('signin')}
              >
                Sign in
              </TabButton>
              <TabButton
                active={mode === 'signup'}
                onClick={() => setMode('signup')}
              >
                Create account
              </TabButton>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <Field
                  icon={<User size={18} />}
                  label="Your name"
                  type="text"
                  value={displayName}
                  onChange={setDisplayName}
                  placeholder="Alex Morgan"
                  autoComplete="name"
                />
              )}
              <Field
                icon={<Mail size={18} />}
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
              <Field
                icon={<Lock size={18} />}
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                required
              />

              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 active:bg-slate-950 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy
                  ? 'Please wait...'
                  : mode === 'signin'
                    ? 'Sign in'
                    : 'Create account'}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            Sentinel never stores your passwords or private messages.
          </p>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
        active
          ? 'bg-white text-slate-900 shadow-sm'
          : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      {children}
    </button>
  );
}

function Field({
  icon,
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
}: {
  icon: React.ReactNode;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
        />
      </div>
    </div>
  );
}

function translateAuthError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes('invalid login credentials')) return 'Incorrect email or password.';
  if (lower.includes('user already registered')) return 'An account with this email already exists. Try signing in.';
  if (lower.includes('password')) return 'Please check your password and try again.';
  if (lower.includes('email')) return 'Please enter a valid email address.';
  if (lower.includes('network') || lower.includes('fetch')) return 'Could not connect. Check your internet and try again.';
  return msg;
}
