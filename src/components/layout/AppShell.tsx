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
  { id: 'checkup', label: 'Scan', icon: Stethoscope },
  { id: 'issues', label: 'Problems', icon: AlertTriangle },
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
    <div className="min-h-screen bg-theme-6 text-theme-1">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-60 flex-col border-r border-theme-5/20 bg-white">
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-theme-5/20">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-theme-1 text-white">
            <ShieldCheck size={20} />
          </div>
          <span className="font-semibold text-theme-1 text-[15px]">
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
        <div className="border-t border-fiery-lightblue/20 p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fiery-lightblue/20 text-sm font-semibold text-fiery-darkblue">
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
            className="mt-2 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-fiery-darkblue/70 hover:bg-fiery-cream hover:text-fiery-darkred"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-fiery-lightblue/20 bg-white/90 backdrop-blur px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fiery-darkred text-white">
            <ShieldCheck size={18} />
          </div>
          <span className="font-semibold text-[15px]">Sentinel</span>
        </div>
        <button
          onClick={() => onTabChange('settings')}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-fiery-lightblue/20 text-sm font-semibold text-fiery-darkblue"
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
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
        active 
          ? 'bg-theme-1 text-white' 
          : 'text-theme-4 hover:bg-theme-5 hover:text-white'
      }`}
    >
      <Icon 
        size={20} 
        className={active ? 'text-white' : 'text-theme-4 group-hover:text-white'} 
      />
      <span className="font-medium text-[15px]">{item.label}</span>
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
        active ? 'text-theme-1' : 'text-theme-4'
      }`}
    >
      <Icon size={20} strokeWidth={active ? 2.4 : 2} />
      {item.label}
    </button>
  );
}
