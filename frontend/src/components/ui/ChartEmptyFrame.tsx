import React from 'react';
import { LineChart } from 'lucide-react';

interface ChartEmptyFrameProps {
  title: string;
  description: string;
  xLabel: string;
  yLabel: string;
}

export const ChartEmptyFrame: React.FC<ChartEmptyFrameProps> = ({
  title,
  description,
  xLabel,
  yLabel,
}) => {
  return (
    <div className="rounded-xl border border-dashed border-line bg-base/30 p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-xs font-semibold text-ink">{title}</h4>
        <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint">
          No verified artifact
        </span>
      </div>
      <div className="relative h-48">
        <svg
          viewBox="0 0 400 180"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full text-line"
          aria-hidden="true"
        >
          <line x1="24" y1="12" x2="24" y2="152" stroke="currentColor" strokeWidth="1" />
          <line x1="24" y1="152" x2="388" y2="152" stroke="currentColor" strokeWidth="1" />
          <line x1="24" y1="47" x2="388" y2="47" stroke="currentColor" strokeWidth="0.6" strokeDasharray="4 6" />
          <line x1="24" y1="82" x2="388" y2="82" stroke="currentColor" strokeWidth="0.6" strokeDasharray="4 6" />
          <line x1="24" y1="117" x2="388" y2="117" stroke="currentColor" strokeWidth="0.6" strokeDasharray="4 6" />
          <line x1="115" y1="12" x2="115" y2="152" stroke="currentColor" strokeWidth="0.4" strokeDasharray="4 6" />
          <line x1="206" y1="12" x2="206" y2="152" stroke="currentColor" strokeWidth="0.4" strokeDasharray="4 6" />
          <line x1="297" y1="12" x2="297" y2="152" stroke="currentColor" strokeWidth="0.4" strokeDasharray="4 6" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <LineChart
            className="mb-2 h-5 w-5 text-faint"
            aria-hidden="true"
          />
          <p className="max-w-xs text-xs leading-relaxed text-muted">
            {description}
          </p>
        </div>
      </div>
      <div className="mt-1 flex items-center justify-between font-mono text-[9px] text-faint">
        <span>{yLabel}</span>
        <span>{xLabel}</span>
      </div>
    </div>
  );
};
