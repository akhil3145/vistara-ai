
import React from 'react';
import { Menu, Sun, Moon, Cpu, Database, ChevronRight } from 'lucide-react';
import type { PageId } from '../../types/navigation';
import { NAV_ITEMS } from '../../types/navigation';
import { useTheme } from '../../context/useTheme';

interface HeaderProps {
  currentPage: PageId;
  onOpenMobileMenu: () => void;
  isDemoMode?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onOpenMobileMenu,
  isDemoMode = true,
}) => {
  const { theme, toggleTheme } = useTheme();
  const currentNav = NAV_ITEMS.find((item) => item.id === currentPage);

  return (
    <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between gap-3 border-b border-[#20334b] bg-[#0e192b]/95 px-4 backdrop-blur-xl sm:px-6">

      {/* Left: Navigation and page title */}
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="rounded-lg border border-[#30465f] p-2 text-slate-400 transition-colors hover:bg-[#192b43] hover:text-white lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500 sm:inline">
              Workspace
            </span>

            <ChevronRight className="hidden h-3 w-3 text-slate-600 sm:block" />

            <h1 className="truncate text-sm font-semibold tracking-tight text-slate-100 sm:text-[15px]">
              {currentNav?.label ?? 'Dashboard'}
            </h1>
          </div>

          <p className="mt-0.5 hidden truncate text-[11px] text-slate-500 sm:block">
            {currentNav?.shortDescription ?? 'Plant Health Intelligence'}
          </p>
        </div>
      </div>

      {/* Right: System status and controls */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">

        {/* Model indicator */}
        <div className="hidden items-center gap-2 rounded-lg border border-[#30465f] bg-[#142238] px-3 py-2 md:flex">
          <Cpu className="h-3.5 w-3.5 text-teal-400" />

          <span className="text-[10px] font-medium tracking-wide text-slate-300">
            MobileNetV2
          </span>
        </div>

        {/* Backend status */}
        <div
          className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 sm:px-3 ${
            isDemoMode
              ? 'border-amber-400/20 bg-amber-400/[0.07]'
              : 'border-emerald-400/20 bg-emerald-400/[0.07]'
          }`}
          role="status"
          aria-label={isDemoMode ? 'Demo mode active' : 'Backend ready'}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isDemoMode
                ? 'bg-amber-400 animate-pulse'
                : 'bg-emerald-400'
            }`}
          />

          <span
            className={`hidden text-[10px] font-semibold tracking-[0.08em] sm:inline ${
              isDemoMode ? 'text-amber-300' : 'text-emerald-300'
            }`}
          >
            {isDemoMode ? 'DEMO MODE' : 'BACKEND READY'}
          </span>

          <span
            className={`text-[10px] font-semibold sm:hidden ${
              isDemoMode ? 'text-amber-300' : 'text-emerald-300'
            }`}
          >
            {isDemoMode ? 'DEMO' : 'LIVE'}
          </span>
        </div>

        {/* Database indicator */}
        <div className="hidden items-center gap-2 rounded-lg border border-[#30465f] bg-[#142238] px-3 py-2 xl:flex">
          <Database className="h-3.5 w-3.5 text-sky-400" />
          <span className="text-[10px] font-medium text-slate-300">
            SQLite
          </span>
        </div>

        {/* System indicator */}
        <div className="hidden h-8 w-px bg-[#30465f] sm:block" />

        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#30465f] bg-[#142238] text-slate-400 transition-all hover:border-teal-400/30 hover:bg-[#1c3049] hover:text-teal-300"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>
      </div>
    </header>
  );
};
