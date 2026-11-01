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
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-base/35 px-6 py-10 text-center ${className}`}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-raised/70 text-faint">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h4 className="text-sm font-semibold text-ink">{title}</h4>
      <p className="mt-1.5 max-w-md text-xs leading-relaxed text-muted">
        {description}
      </p>
      {hint && (
        <p className="mt-2 max-w-md font-mono text-[10px] leading-relaxed text-faint">
          {hint}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
