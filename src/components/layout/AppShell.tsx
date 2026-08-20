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

export type TabId = 'home' | 'checkup' | 'issues' | 'tools' | 'vault' | 'learn' | 'settings' | 'habits' | 'diagnostics';

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
    <div className="min-h-screen bg-transparent">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-cyber-neon/20 bg-cyber-bg/95 backdrop-blur-xl z-20">
        <div className="flex items-center gap-3 px-6 h-16 border-b border-cyber-neon/20">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyber-neon/50 bg-cyber-surface text-cyber-neon shadow-[0_0_15px_rgba(255,42,66,0.3)]">
            <ShieldCheck size={20} className="stroke-[2.5]" />
          </div>
          <span className="font-outline font-bold text-white text-2xl tracking-widest uppercase">
            Sentinel
          </span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <DesktopNavItem
              key={item.id}
              item={item}
              active={activeTab === item.id}
              onClick={() => onTabChange(item.id)}
            />
          ))}
        </nav>
        <div className="border-t border-cyber-neon/20 p-4 bg-cyber-surface/30">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cyber-neon bg-cyber-bg text-lg font-sans font-bold text-white shadow-[0_0_10px_rgba(255,42,66,0.2)]">
              {(user?.email ?? '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-sans font-medium text-cyber-text">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="mt-3 flex w-full items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm font-sans font-medium text-cyber-textMuted hover:text-white hover:bg-cyber-surface transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          >
            <LogOut size={18} className="stroke-[2]" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-cyber-neon/20 bg-cyber-bg/80 backdrop-blur-md px-4 h-16">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyber-neon/50 bg-cyber-surface text-cyber-neon shadow-[0_0_10px_rgba(255,42,66,0.3)]">
            <ShieldCheck size={20} className="stroke-[2.5]" />
          </div>
          <span className="font-outline font-bold text-white text-xl tracking-widest uppercase">Sentinel</span>
        </div>
        <button
          onClick={() => onTabChange('settings')}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-cyber-neon bg-cyber-surface text-sm font-sans font-bold text-white shadow-[0_0_10px_rgba(255,42,66,0.3)] transition-all active:scale-95"
          aria-label="Settings"
        >
          {(user?.email ?? '?').charAt(0).toUpperCase()}
        </button>
      </header>

      {/* Main content area */}
      <main className="md:ml-64 pb-20 md:pb-0 relative z-10">
        <div className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-10">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 z-30 rounded-2xl border border-cyber-neon/20 bg-cyber-surface/90 backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.8)] pb-safe">
        <div className="flex justify-around items-center h-16 px-2">
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
      className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-sm font-sans font-semibold tracking-wide transition-all ${
        active
          ? 'border-cyber-neon/40 bg-cyber-surface/50 text-white shadow-[0_0_15px_rgba(255,42,66,0.2)]'
          : 'border-transparent text-cyber-textMuted hover:text-white hover:bg-cyber-surface/30 hover:border-cyber-neon/10'
      }`}
    >
      <Icon size={20} className={`stroke-[2] transition-colors ${active ? 'text-cyber-neon' : 'text-cyber-textMuted group-hover:text-cyber-neon/70'}`} />
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
      <div className={`p-1.5 rounded-xl transition-all duration-300 ${active ? 'bg-cyber-neon/10 shadow-[0_0_15px_rgba(255,42,66,0.3)] -translate-y-1 scale-110' : 'text-cyber-textMuted'}`}>
        <Icon size={22} className={`stroke-[2] ${active ? 'text-cyber-neon' : ''}`} />
      </div>
    </button>
  );
}
