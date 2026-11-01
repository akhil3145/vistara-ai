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
      className="flex items-start gap-3 rounded-xl border border-warning/25 bg-warning/[0.055] p-4 text-xs text-warning"
    >
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-warning/25 bg-warning/10">
        <FlaskConical className="h-3.5 w-3.5 text-warning" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2 font-semibold text-ink">
          <span>{title}</span>
          <span className="rounded-full border border-warning/30 bg-warning/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.09em] text-warning">
            DEMO DATA
          </span>
        </div>
        <div className="leading-relaxed text-muted">{children}</div>
      </div>
    </div>
  );
};
