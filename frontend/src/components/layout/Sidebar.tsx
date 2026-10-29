import React from 'react';
import {
  LayoutDashboard,
  ScanLine,
  Layers,
  Activity,
  BarChart3,
  BookOpen,
  HelpCircle,
  Sprout,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import type { PageId } from '../../types/navigation';
import { NAV_ITEMS } from '../../types/navigation';

interface SidebarProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
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

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onSelectPage }) => {
  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white dark:bg-navy-900 border-r border-slate-200 dark:border-navy-800 h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 dark:border-navy-800">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
          <Sprout className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
            Vistara AI
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 font-medium">
              v1.0
            </span>
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal truncate">
            Plant Health Intelligence
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Console Navigation
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.id];
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectPage(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-850 hover:text-slate-900 dark:hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive
                      ? 'text-teal-600 dark:text-teal-400'
                      : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {isActive ? (
                <div className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Academic / Disclaimer Callout */}
      <div className="p-3 border-t border-slate-200 dark:border-navy-800">
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-navy-800 text-[11px] space-y-1">
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>Academic Decision Support</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 leading-snug">
            Preliminary screening tool. Not an agricultural diagnostic authority.
          </p>
        </div>
      </div>
    </aside>
  );
};
