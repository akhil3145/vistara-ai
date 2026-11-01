
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
  Leaf,
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

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
}) => {
  return (
    <aside className="hidden lg:flex flex-col w-[260px] shrink-0 h-screen sticky top-0 select-none overflow-hidden bg-[#0b1728] border-r border-[#20334b] text-slate-300">

      {/* Brand */}
      <div className="px-5 py-5 border-b border-[#20334b]">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-teal-400/10 border border-teal-400/20">
            <Sprout className="w-5 h-5 text-teal-400" />
            <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-teal-400 border-2 border-[#0b1728]" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-bold tracking-tight text-white">
                Vistara AI
              </span>
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold tracking-wide text-teal-300 bg-teal-400/10 border border-teal-400/20">
                v1.0
              </span>
            </div>

            <p className="mt-0.5 text-[11px] text-slate-400 tracking-wide">
              Plant Health Intelligence
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 overflow-y-auto">

        <div className="px-3 mb-3 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
            Workspace
          </span>
          <span className="text-[9px] text-slate-600 font-medium">
            MAIN
          </span>
        </div>

        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = ICON_MAP[item.id];
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectPage(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative w-full flex items-center justify-between gap-3 px-3 py-3 rounded-lg text-[12px] font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-teal-400/[0.12] text-teal-300 border border-teal-400/20 shadow-[inset_0_0_20px_rgba(45,212,191,0.03)]'
                    : 'text-slate-400 border border-transparent hover:bg-[#15263c] hover:text-slate-100'
                }`}
              >
                {/* Active indicator */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-teal-400" />
                )}

                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-[17px] h-[17px] shrink-0 transition-colors ${
                      isActive
                        ? 'text-teal-300'
                        : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />

                  <span className="truncate">{item.label}</span>
                </div>

                {isActive ? (
                  <ChevronRight
                    className="w-4 h-4 shrink-0 text-teal-400"
                    strokeWidth={2}
                  />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            );
          })}
        </div>

        {/* Workspace footer label */}
        <div className="mt-8 px-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
            <Leaf className="w-3.5 h-3.5 text-teal-500" />
            <span>Plant Intelligence</span>
          </div>
          <p className="mt-2 px-0 text-[11px] leading-relaxed text-slate-500">
            AI-assisted foliar image classification and visual analysis.
          </p>
        </div>
      </nav>

      {/* Academic Disclaimer */}
      <div className="p-3 border-t border-[#20334b]">
        <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.045] p-3">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
            <span className="text-[10px] font-semibold text-amber-300 tracking-wide">
              Academic Decision Support
            </span>
          </div>

          <p className="text-[10px] leading-relaxed text-slate-400">
            Experimental screening system. Verify predictions with agricultural professionals before field interventions.
          </p>
        </div>

        <div className="flex items-center justify-between px-2 pt-3">
          <span className="text-[9px] text-slate-600 tracking-wide">
            VISTARA AI
          </span>
          <span className="text-[9px] text-slate-600">
            BUILD 1.0
          </span>
        </div>
      </div>
    </aside>
  );
};
