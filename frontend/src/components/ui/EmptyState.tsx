import React from 'react';

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  hint?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  hint,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-10 text-center dark:border-navy-700 dark:bg-navy-950/40 ${className}`}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-navy-850 dark:text-slate-500">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h4>
      <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        {description}
      </p>
      {hint && (
        <p className="mt-2 max-w-md font-mono text-[10px] text-slate-400 dark:text-slate-500">
          {hint}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
