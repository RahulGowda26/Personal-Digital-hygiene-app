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
  Wrench,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';

export type TabId = 'home' | 'checkup' | 'issues' | 'tools' | 'vault' | 'learn' | 'settings' | 'habits';

interface NavItem {
  id: TabId;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'issues', label: 'Problems', icon: AlertTriangle },
  { id: 'tools', label: 'Tools', icon: Wrench },
  { id: 'vault', label: 'Vault', icon: Lock },
];

interface AppShellProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  children: ReactNode;
}

export function AppShell({ activeTab, onTabChange, children }: AppShellProps) {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-slate-900 selection:text-white">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-200">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-900 text-white">
            <ShieldCheck size={18} />
          </div>
          <span className="font-semibold text-slate-900 text-lg">
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
        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-200 text-sm font-semibold text-slate-700">
              {(user?.email ?? '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="mt-2 flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-slate-100 bg-white/90 backdrop-blur px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
            <ShieldCheck size={18} />
          </div>
          <span className="font-semibold text-slate-900 text-[15px]">Sentinel</span>
        </div>
        <button
          onClick={() => onTabChange('settings')}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700"
          aria-label="Settings"
        >
          {(user?.email ?? '?').charAt(0).toUpperCase()}
        </button>
      </header>

      {/* Main content */}
      <main className="md:pl-64 pb-20 md:pb-0 min-h-screen flex flex-col">
        {/* Desktop top bar (Settings only) */}
        <header className="hidden md:flex h-16 items-center justify-end px-8 shrink-0 bg-white border-b border-slate-200">
          <button
            onClick={() => onTabChange('settings')}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'settings'
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
            aria-label="Settings"
          >
            <Settings size={16} className="text-slate-500" />
            Settings
          </button>
        </header>

        <div className="mx-auto w-full max-w-5xl px-4 md:px-8 py-8 flex-1">
          {children}
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-6 inset-x-6 z-30 bg-white/90 backdrop-blur-md rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100/50">
        <div className="flex items-center justify-between px-6 py-2">
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
      className={`group flex w-full items-center gap-3 px-3 py-2 rounded-md transition-colors ${
        active 
          ? 'bg-slate-100 text-slate-900 font-semibold' 
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
      }`}
    >
      <Icon 
        size={18} 
        strokeWidth={active ? 2.5 : 2}
        className={active ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'} 
      />
      <span className="text-[14px]">{item.label}</span>
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
      className="flex flex-col items-center justify-center p-3 relative"
    >
      <div className={`flex items-center justify-center w-12 h-12 rounded-full transition-all ${active ? 'bg-transparent border border-slate-300' : 'bg-transparent border border-transparent'}`}>
        <Icon size={22} strokeWidth={active ? 2.5 : 2} className={active ? 'text-slate-900' : 'text-slate-400'} />
      </div>
    </button>
  );
}
