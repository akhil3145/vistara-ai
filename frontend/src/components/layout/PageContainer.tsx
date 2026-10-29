import React from 'react';

interface PageContainerProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  title,
  subtitle,
  badge,
  actions,
  children,
}) => {
  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200 dark:border-navy-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h2>
            {badge}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
      </div>

      {/* Main Content */}
      <div className="space-y-6">{children}</div>
    </div>
  );
};

