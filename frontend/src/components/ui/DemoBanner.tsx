import React from 'react';
import { FlaskConical } from 'lucide-react';

interface DemoBannerProps {
  title?: string;
  children: React.ReactNode;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({
  title = 'Simulated demonstration data',
  children,
}) => {
  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-xs text-amber-800 dark:text-amber-300"
    >
      <FlaskConical
        className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
        aria-hidden="true"
      />
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2 font-semibold">
          <span>{title}</span>
          <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide">
            DEMO DATA
          </span>
        </div>
        <div className="leading-relaxed text-amber-700/90 dark:text-amber-400/90">
          {children}
        </div>
      </div>
    </div>
  );
};
