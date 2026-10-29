import React from 'react';
import {
  X,
  LayoutDashboard,
  ScanLine,
  Layers,
  Activity,
  BarChart3,
  BookOpen,
  HelpCircle,
  Sprout,
  ShieldAlert,
} from 'lucide-react';
import type { PageId } from '../../types/navigation';
import { NAV_ITEMS } from '../../types/navigation';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
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

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  currentPage,
  onSelectPage,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="relative flex flex-col w-72 max-w-[80vw] bg-white dark:bg-navy-900 h-full shadow-2xl z-10 border-r border-slate-200 dark:border-navy-800">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-navy-800">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              <Sprout className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-xs tracking-tight text-slate-900 dark:text-white">
                Vistara AI
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Plant Health Intelligence
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = ICON_MAP[item.id];
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectPage(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-850 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-navy-800">
          <div className="flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>Academic Decision Support</span>
          </div>
        </div>
      </div>
    </div>
  );
};
