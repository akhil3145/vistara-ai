import React from 'react';

type StatTone = 'teal' | 'sky' | 'amber' | 'slate' | 'purple' | 'rose' | 'emerald';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ElementType;
  tone?: StatTone;
  badge?: React.ReactNode;
}

const TONES: Record<
  StatTone,
  { icon: string; tile: string; bar: string; glow: string }
> = {
  teal: {
    icon: 'text-accent',
    tile: 'border-accent/25 bg-accent/10',
    bar: 'bg-accent',
    glow: 'bg-accent/[0.09]',
  },
  sky: {
    icon: 'text-cyan',
    tile: 'border-cyan/25 bg-cyan/10',
    bar: 'bg-cyan',
    glow: 'bg-cyan/[0.09]',
  },
  emerald: {
    icon: 'text-lime',
    tile: 'border-lime/25 bg-lime/10',
    bar: 'bg-lime',
    glow: 'bg-lime/[0.09]',
  },
  amber: {
    icon: 'text-warning',
    tile: 'border-warning/25 bg-warning/10',
    bar: 'bg-warning',
    glow: 'bg-warning/[0.08]',
  },
  purple: {
    icon: 'text-accent',
    tile: 'border-accent/20 bg-accent/[0.07]',
    bar: 'bg-accent',
    glow: 'bg-accent/[0.08]',
  },
  rose: {
    icon: 'text-danger',
    tile: 'border-danger/25 bg-danger/10',
    bar: 'bg-danger',
    glow: 'bg-danger/[0.08]',
  },
  slate: {
    icon: 'text-muted',
    tile: 'border-line bg-raised/70',
    bar: 'bg-faint',
    glow: 'bg-cyan/[0.05]',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'teal',
  badge,
}) => {
  const styles = TONES[tone];

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-line bg-panel p-4 shadow-panel panel-hover sm:p-5">
      <div
        className={`pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full blur-2xl ${styles.glow}`}
      />
      <div className={`absolute left-0 top-5 h-8 w-[2px] rounded-r-full ${styles.bar} opacity-70`} />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[11px] font-medium text-muted">{label}</span>
          <div className="mt-2 flex flex-wrap items-baseline gap-2">
            <span className="font-mono text-[22px] font-semibold leading-none tracking-tight text-ink">
              {value}
            </span>
            {badge}
          </div>
        </div>

        {Icon && (
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${styles.tile}`}
          >
            <Icon className={`h-[16px] w-[16px] ${styles.icon}`} aria-hidden="true" />
          </div>
        )}
      </div>

      {hint && (
        <span className="relative mt-3 block border-t border-line/70 pt-2.5 text-[11px] leading-relaxed text-faint">
          {hint}
        </span>
      )}
    </div>
  );
};
