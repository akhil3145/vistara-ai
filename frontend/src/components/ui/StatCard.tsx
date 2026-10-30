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

const ICON_TONES: Record<StatTone, string> = {
  teal: 'text-teal-500',
  sky: 'text-sky-500',
  amber: 'text-amber-500',
  slate: 'text-slate-400',
  purple: 'text-purple-500',
  rose: 'text-rose-500',
  emerald: 'text-emerald-500',
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'teal',
  badge,
}) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-navy-800 dark:bg-navy-900">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {label}
        </span>
        {Icon && (
          <Icon
            className={`h-4 w-4 shrink-0 ${ICON_TONES[tone]}`}
            aria-hidden="true"
          />
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="font-mono text-xl font-bold text-slate-900 dark:text-white">
          {value}
        </span>
        {badge}
      </div>
      {hint && (
        <span className="mt-1 block text-xs text-slate-400 dark:text-slate-500">
          {hint}
        </span>
      )}
    </div>
  );
};
