import React from 'react';
import {
  LayoutDashboard,
  ScanLine,
  Layers,
  Activity,
  BarChart3,
  BookOpen,
  HelpCircle,
  ChevronRight,
  ShieldAlert,
  Sprout,
  Cpu,
  Database,
} from 'lucide-react';

import type { PageId } from '../../types/navigation';
import { NAV_ITEMS } from '../../types/navigation';

interface SidebarProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  isDemoMode?: boolean;
}

const ICON_MAP: Record<PageId, React.ElementType> = {
  overview: LayoutDashboard,
  scanner: ScanLine,
  batch: Layers,
  monitoring: Activity,
  report: BarChart3,
  library: BookOpen,
  help: HelpCircle,
};

const NAV_GROUPS: { label: string; ids: PageId[] }[] = [
  { label: 'Workspace', ids: ['overview', 'scanner', 'batch'] },
  { label: 'Intelligence', ids: ['monitoring', 'report', 'library'] },
  { label: 'Support', ids: ['help'] },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  isDemoMode = true,
}) => {
  const renderNavItem = (itemId: PageId) => {
    const item = NAV_ITEMS.find((navItem) => navItem.id === itemId);
    if (!item) return null;

    const Icon = ICON_MAP[item.id];
    const isActive = currentPage === item.id;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onSelectPage(item.id)}
        aria-current={isActive ? 'page' : undefined}
        className={`group relative flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-[12px] font-medium transition-all duration-200 ${
          isActive
            ? 'border-accent/25 bg-gradient-to-r from-accent/[0.14] to-accent/[0.03] text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]'
            : 'border-transparent text-muted hover:border-line/70 hover:bg-raised/50 hover:text-ink'
        }`}
      >
        {isActive && (
          <span className="absolute -left-px top-1/2 h-6 w-[2px] -translate-y-1/2 rounded-r-full bg-accent shadow-[0_0_12px_rgba(32,201,176,0.7)]" />
        )}

        <span className="flex min-w-0 items-center gap-3">
          <Icon
            className={`h-[17px] w-[17px] shrink-0 transition-colors ${
              isActive ? 'text-accent' : 'text-faint group-hover:text-muted'
            }`}
            strokeWidth={isActive ? 2.1 : 1.8}
          />
          <span className="truncate">{item.label}</span>
        </span>

        <ChevronRight
          className={`h-3.5 w-3.5 shrink-0 transition-all ${
            isActive
              ? 'translate-x-0 text-accent opacity-100'
              : '-translate-x-1 text-faint opacity-0 group-hover:translate-x-0 group-hover:opacity-60'
          }`}
        />
      </button>
    );
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 select-none flex-col overflow-hidden border-r border-line bg-sidebar lg:flex">
      <div className="pointer-events-none absolute -left-16 top-24 h-64 w-64 rounded-full bg-accent/[0.05] blur-3xl" />

      {/* Brand */}
      <div className="relative border-b border-line px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-accent/25 bg-gradient-to-br from-accent/20 to-cyan/10 shadow-[0_0_24px_-8px_rgba(32,201,176,0.6)]">
            <Sprout className="h-5 w-5 text-accent" strokeWidth={1.9} />
            <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-sidebar bg-lime" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-bold tracking-tight text-ink">
                Vistara AI
              </span>
              <span className="rounded-md border border-accent/20 bg-accent/10 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-accent">
                v1.0
              </span>
            </div>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-faint">
              Plant Health Intelligence
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 overflow-y-auto px-3 py-5">
        {NAV_GROUPS.map((group, groupIndex) => (
          <div key={group.label} className={groupIndex === 0 ? '' : 'mt-6'}>
            <div className="mb-2 flex items-center justify-between px-3">
              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-faint">
                {group.label}
              </span>
              <span className="h-px flex-1 bg-line/70 ml-3" />
            </div>
            <div className="space-y-1">{group.ids.map(renderNavItem)}</div>
          </div>
        ))}
      </nav>

      {/* System context */}
      <div className="relative border-t border-line p-3">
        <div className="rounded-xl border border-line bg-raised/45 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-faint">
              Model Runtime
            </span>
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isDemoMode ? 'bg-warning' : 'bg-lime shadow-[0_0_8px_rgba(132,204,22,0.8)]'
              }`}
            />
          </div>

          <div className="flex items-center gap-2">
            <Cpu className="h-3.5 w-3.5 text-accent" />
            <span className="text-[11px] font-semibold text-ink">MobileNetV2</span>
          </div>

          <div className="mt-2.5 space-y-1.5 border-t border-line/70 pt-2.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="flex items-center gap-1.5 text-faint">
                <Database className="h-3 w-3" />
                Telemetry
              </span>
              <span className="text-muted">SQLite</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-faint">Mode</span>
              <span className={isDemoMode ? 'text-warning' : 'text-lime'}>
                {isDemoMode ? 'Demo preview' : 'Live backend'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-warning/15 bg-warning/[0.045] p-3">
          <div className="mb-1.5 flex items-center gap-2">
            <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-warning" />
            <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-warning">
              Academic Use
            </span>
          </div>
          <p className="text-[10px] leading-relaxed text-muted">
            Preliminary screening only. Verify findings with a plant pathologist
            before field intervention.
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between px-1">
          <span className="text-[9px] tracking-[0.14em] text-faint">VISTARA AI</span>
          <span className="font-mono text-[9px] text-faint">BUILD 1.0</span>
        </div>
      </div>
    </aside>
  );
};
