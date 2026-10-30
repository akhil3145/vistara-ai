import React from 'react';

type RingTone = 'teal' | 'amber' | 'rose' | 'slate';

interface ConfidenceRingProps {
  value: number;
  label?: string;
  tone?: RingTone;
}

const TONE_CLASSES: Record<RingTone, string> = {
  teal: 'text-teal-500',
  amber: 'text-amber-500',
  rose: 'text-rose-500',
  slate: 'text-slate-400',
};

export const ConfidenceRing: React.FC<ConfidenceRingProps> = ({
  value,
  label = 'Top-1 score',
  tone = 'teal',
}) => {
  const clamped = Math.min(100, Math.max(0, value));
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className="relative inline-flex h-36 w-36 shrink-0 items-center justify-center"
      role="img"
      aria-label={`${label}: ${clamped.toFixed(1)} percent`}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-slate-200 dark:text-navy-800"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          className={TONE_CLASSES[tone]}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-2xl font-bold text-slate-900 dark:text-white">
          {clamped.toFixed(1)}%
        </span>
        <span className="mt-0.5 max-w-[92px] text-center text-[10px] leading-tight text-slate-500 dark:text-slate-400">
          {label}
        </span>
      </div>
    </div>
  );
};
