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
    <div className="min-h-screen bg-paper-50 text-slate-900 selection:bg-slate-900 selection:text-white font-sans">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 flex-col border-r-2 border-slate-800 bg-paper-100 shadow-[4px_0px_0px_0px_rgba(30,41,59,1)] z-20">
        <div className="flex items-center gap-3 px-6 h-16 border-b-2 border-slate-800">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-slate-800 bg-yellow-300 text-slate-900 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]">
            <ShieldCheck size={20} className="stroke-[2.5]" />
          </div>
          <span className="font-marker font-bold text-slate-900 text-2xl tracking-wide">
            Sentinel
          </span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-3">
          {navItems.map((item) => (
            <DesktopNavItem
              key={item.id}
              item={item}
              active={activeTab === item.id}
              onClick={() => onTabChange(item.id)}
            />
          ))}
        </nav>
        <div className="border-t-2 border-slate-800 p-4 bg-paper-200">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-slate-800 bg-blue-300 text-lg font-marker font-bold text-slate-900 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]">
              {(user?.email ?? '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-hand font-bold text-slate-900">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="mt-3 flex w-full items-center gap-2 rounded-lg border-2 border-transparent px-3 py-2 text-base font-hand font-bold text-slate-700 hover:border-slate-800 hover:bg-white transition-all shadow-none hover:shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]"
          >
            <LogOut size={18} className="stroke-[2.5]" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b-2 border-slate-800 bg-paper-100 px-4 h-16 shadow-[0px_2px_0px_0px_rgba(30,41,59,1)]">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-slate-800 bg-yellow-300 text-slate-900 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]">
            <ShieldCheck size={20} className="stroke-[2.5]" />
          </div>
          <span className="font-marker font-bold text-slate-900 text-xl tracking-wide">Sentinel</span>
        </div>
        <button
          onClick={() => onTabChange('settings')}
          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-800 bg-blue-300 text-lg font-marker font-bold text-slate-900 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] active:translate-y-0.5 active:shadow-[0px_0px_0px_0px_rgba(30,41,59,1)] transition-all"
          aria-label="Settings"
        >
          {(user?.email ?? '?').charAt(0).toUpperCase()}
        </button>
      </header>

      {/* Main content area */}
      <main className="md:ml-64 pb-20 md:pb-0">
        <div className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-10">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t-2 border-slate-800 bg-paper-100 pb-safe shadow-[0px_-2px_0px_0px_rgba(30,41,59,1)]">
        <div className="flex justify-around items-end h-16 px-2">
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

function DesktopNavItem({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-xl border-2 px-3 py-3 text-lg font-hand font-bold transition-all ${
        active
          ? 'border-slate-800 bg-white text-slate-900 shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] -translate-y-0.5'
          : 'border-transparent text-slate-600 hover:border-slate-800 hover:bg-white hover:text-slate-900 hover:shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] hover:-translate-y-0.5'
      }`}
    >
      <Icon size={22} className={`stroke-[2.5] ${active ? 'text-blue-600' : 'text-slate-500 group-hover:text-blue-600'}`} />
      {item.label}
    </button>
  );
}

function MobileNavItem({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className="flex flex-1 flex-col items-center justify-center gap-1 h-full relative"
    >
      {active && (
        <div className="absolute top-0 inset-x-0 h-1 bg-slate-800 rounded-b-full"></div>
      )}
      <div className={`p-1.5 rounded-lg border-2 ${active ? 'border-slate-800 bg-white shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] -translate-y-1' : 'border-transparent text-slate-600'} transition-all`}>
        <Icon size={22} className={`stroke-[2.5] ${active ? 'text-blue-600' : ''}`} />
      </div>
      <span
        className={`text-[12px] font-hand font-bold tracking-wide transition-colors ${
          active ? 'text-slate-900' : 'text-slate-500'
        }`}
      >
        {item.label}
      </span>
    </button>
  );
}
