import React from 'react';

type RingTone = 'teal' | 'amber' | 'rose' | 'slate';

interface ConfidenceRingProps {
  value: number;
  label?: string;
  tone?: RingTone;
}

const TONE_COLORS: Record<RingTone, string> = {
  teal: 'var(--c-accent)',
  amber: 'var(--c-warning)',
  rose: 'var(--c-danger)',
  slate: 'var(--c-faint)',
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
  const color = TONE_COLORS[tone];

  return (
    <div
      className="relative inline-flex h-36 w-36 shrink-0 items-center justify-center"
      role="img"
      aria-label={`${label}: ${clamped.toFixed(1)} percent`}
    >
      <div
        className="absolute inset-2 rounded-full opacity-25 blur-xl"
        style={{ backgroundColor: color }}
      />
      <svg viewBox="0 0 100 100" className="relative h-full w-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
          className="text-line/70"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-[26px] font-semibold leading-none tracking-tight text-ink">
          {clamped.toFixed(1)}
          <span className="text-sm">%</span>
        </span>
        <span className="mt-1 max-w-[88px] text-center text-[9px] uppercase tracking-[0.12em] text-faint">
          {label}
        </span>
      </div>
    </div>
  );
};
