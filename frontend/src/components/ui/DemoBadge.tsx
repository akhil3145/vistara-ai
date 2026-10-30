import React from 'react';

interface DemoBadgeProps {
  label?: string;
  className?: string;
}

export const DemoBadge: React.FC<DemoBadgeProps> = ({
  label = 'DEMO DATA',
  className = '',
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300 ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
      {label}
    </span>
  );
};
