import React from 'react';
import { Menu, Sun, Moon, Cpu, Database } from 'lucide-react';
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
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 sm:px-6 bg-white/90 dark:bg-navy-900/90 backdrop-blur-md border-b border-slate-200 dark:border-navy-800">
      {/* Left side: Mobile menu toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-1.5 rounded-lg lg:hidden text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <h1 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            {currentNav?.label}
          </h1>
          <span className="hidden sm:inline-block text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {currentNav?.shortDescription}
          </span>
        </div>
      </div>

      {/* Right side: Telemetry badges & Theme toggle */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Model Spec Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-navy-850 border border-slate-200 dark:border-navy-800 text-[11px] font-mono text-slate-600 dark:text-slate-300">
          <Cpu className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span>MobileNetV2</span>
        </div>

        {/* Mode Indicator: Real vs Demo Badge */}
        {isDemoMode ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-mono font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>DEMO MODE</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] font-mono font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>BACKEND READY</span>
          </div>
        )}

        {/* SQLite Indicator */}
        <div className="hidden xl:flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 dark:bg-navy-855 border border-slate-200 dark:border-navy-800 text-[11px] font-mono text-slate-500 dark:text-slate-400">
          <Database className="w-3 h-3 text-sky-500" />
          <span>SQLite</span>
        </div>

        <div className="h-4 w-px bg-slate-200 dark:bg-navy-800 mx-1 hidden sm:block" />

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>
      </div>
    </header>
  );
};
