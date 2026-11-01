import React from 'react';
import { Menu, Sun, Moon, Cpu, Database, ChevronRight, Sprout } from 'lucide-react';
import type { PageId } from '../../types/navigation';
import { NAV_ITEMS } from '../../types/navigation';
import { useTheme } from '../../context/useTheme';

interface HeaderProps {
  currentPage: PageId;
  onOpenMobileMenu: () => void;
  isDemoMode?: boolean;
}

const SECTION_BY_PAGE: Record<PageId, string> = {
  overview: 'Workspace',
  scanner: 'Workspace',
  batch: 'Workspace',
  monitoring: 'Intelligence',
  report: 'Intelligence',
  library: 'Reference',
  help: 'Support',
};

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onOpenMobileMenu,
  isDemoMode = true,
}) => {
  const { theme, toggleTheme } = useTheme();
  const currentNav = NAV_ITEMS.find((item) => item.id === currentPage);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-sidebar/85 backdrop-blur-xl">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="rounded-lg border border-line bg-raised/60 p-2 text-muted transition-colors hover:border-accent/30 hover:text-ink lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/20 bg-accent/10 text-accent">
              <Sprout className="h-4 w-4" />
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="hidden text-[9px] font-bold uppercase tracking-[0.18em] text-faint md:inline">
                Vistara AI
              </span>
              <ChevronRight className="hidden h-3 w-3 text-line-strong md:block" />
              <span className="hidden text-[9px] font-semibold uppercase tracking-[0.14em] text-faint sm:inline">
                {SECTION_BY_PAGE[currentPage]}
              </span>
              <ChevronRight className="hidden h-3 w-3 text-line-strong sm:block" />

              <h1 className="truncate text-[13px] font-semibold tracking-tight text-ink sm:text-sm">
                {currentNav?.label ?? 'Dashboard'}
              </h1>
            </div>

            <p className="mt-0.5 hidden truncate text-[10px] text-faint sm:block">
              {currentNav?.shortDescription ?? 'Plant health intelligence'}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-2 rounded-lg border border-line bg-raised/45 px-2.5 py-1.5 md:flex">
            <Cpu className="h-3 w-3 text-accent" />
            <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-muted">
              MobileNetV2
            </span>
          </div>

          <div
            className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${
              isDemoMode
                ? 'border-warning/25 bg-warning/[0.07]'
                : 'border-lime/25 bg-lime/[0.07]'
            }`}
            role="status"
            aria-label={isDemoMode ? 'Demo mode active' : 'Backend ready'}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isDemoMode ? 'bg-warning animate-pulse-soft' : 'bg-lime'
              }`}
            />
            <span
              className={`hidden text-[9px] font-bold uppercase tracking-[0.1em] sm:inline ${
                isDemoMode ? 'text-warning' : 'text-lime'
              }`}
            >
              {isDemoMode ? 'Demo mode' : 'Backend ready'}
            </span>
            <span
              className={`text-[9px] font-bold uppercase tracking-[0.1em] sm:hidden ${
                isDemoMode ? 'text-warning' : 'text-lime'
              }`}
            >
              {isDemoMode ? 'Demo' : 'Live'}
            </span>
          </div>

          <div className="hidden items-center gap-2 rounded-lg border border-line bg-raised/45 px-2.5 py-1.5 xl:flex">
            <Database className="h-3 w-3 text-cyan" />
            <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-muted">
              SQLite
            </span>
          </div>

          <span className="hidden h-6 w-px bg-line sm:block" />

          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-raised/45 text-muted transition-all hover:border-accent/30 hover:text-accent"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-warning" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
