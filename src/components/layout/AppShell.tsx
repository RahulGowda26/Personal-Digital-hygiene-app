import { type ReactNode } from 'react';
import {
  Home,
  Stethoscope,
  AlertTriangle,
  GraduationCap,
  Settings,
  ShieldCheck,
  LogOut,
  type LucideIcon,
  CheckSquare,
} from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';

export type TabId = 'home' | 'checkup' | 'issues' | 'learn' | 'settings' | 'habits';

interface NavItem {
  id: TabId;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'checkup', label: 'Checkup', icon: Stethoscope },
  { id: 'issues', label: 'Issues', icon: AlertTriangle },
  { id: 'learn', label: 'Learn', icon: GraduationCap },
];

interface AppShellProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  children: ReactNode;
}

export function AppShell({ activeTab, onTabChange, children }: AppShellProps) {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-60 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-slate-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
            <ShieldCheck size={20} />
          </div>
          <span className="font-semibold text-slate-900 text-[15px]">
            Sentinel
          </span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <DesktopNavItem
              key={item.id}
              item={item}
              active={activeTab === item.id}
              onClick={() => onTabChange(item.id)}
            />
          ))}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
              {(user?.email ?? '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-700">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="mt-2 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 backdrop-blur px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
            <ShieldCheck size={18} />
          </div>
          <span className="font-semibold text-[15px]">Sentinel</span>
          {import.meta.env.VITE_DEMO_MODE === 'true' && (
            <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900 tracking-wide">
              DEMO
            </span>
          )}
        </div>
        <button
          onClick={() => onTabChange('settings')}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600"
          aria-label="Settings"
        >
          {(user?.email ?? '?').charAt(0).toUpperCase()}
        </button>
      </header>

      {/* Main content */}
      <main className="md:pl-60 pb-20 md:pb-0">
        {/* Desktop top bar (Settings only) */}
        <header className="hidden md:flex h-16 items-center justify-between px-8">
          <div>
            {import.meta.env.VITE_DEMO_MODE === 'true' && (
              <span className="rounded bg-amber-100 px-2 py-1 text-xs font-bold text-amber-900 tracking-wide border border-amber-200">
                DEMO MODE - Simulated Data
              </span>
            )}
          </div>
          <button
            onClick={() => onTabChange('settings')}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'settings'
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
            aria-label="Settings"
          >
            <Settings size={20} />
            Settings
          </button>
        </header>

        <div className="mx-auto max-w-5xl px-4 md:px-8 md:py-4">
          {children}
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex items-stretch justify-around">
          {navItems.map((item) => (
            <MobileNavItem
              key={item.id}
              item={item}
              active={activeTab === item.id}
              onClick={() => onTabChange(item.id)}
            />
          ))}
        </div>
      </nav>

    </div>
  );
}

function DesktopNavItem({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-slate-100 text-slate-900'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
      }`}
    >
      <Icon size={18} />
      {item.label}
    </button>
  );
}

function MobileNavItem({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
        active ? 'text-slate-900' : 'text-slate-400'
      }`}
    >
      <Icon size={20} strokeWidth={active ? 2.4 : 2} />
      {item.label}
    </button>
  );
}
