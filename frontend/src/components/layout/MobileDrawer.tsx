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
    <div className="fixed inset-0 z-50 flex lg:hidden">
      <div
        className="fixed inset-0 bg-base/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 flex h-full w-[280px] max-w-[82vw] flex-col border-r border-line bg-sidebar shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent/25 bg-accent/10 text-accent">
              <Sprout className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold tracking-tight text-ink">
                Vistara AI
              </span>
              <span className="text-[9px] uppercase tracking-[0.13em] text-faint">
                Plant Health Intelligence
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-raised hover:text-ink"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
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
                className={`relative flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'border-accent/25 bg-accent/[0.12] text-ink'
                    : 'border-transparent text-muted hover:bg-raised/60 hover:text-ink'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r-full bg-accent" />
                )}
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? 'text-accent' : 'text-faint'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-line p-3">
          <div className="flex items-start gap-2 rounded-lg border border-warning/15 bg-warning/[0.045] p-3">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
            <p className="text-[10px] leading-relaxed text-muted">
              Academic decision support. Not a substitute for professional
              diagnosis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
