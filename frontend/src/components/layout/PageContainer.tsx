import React from 'react';

interface PageContainerProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: string;
  children: React.ReactNode;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  title,
  subtitle,
  badge,
  actions,
  eyebrow,
  children,
}) => {
  return (
    <main className="mx-auto w-full max-w-[1580px] flex-1 px-4 py-5 sm:px-6 sm:py-6 xl:px-8 xl:py-7">
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-line bg-panel/60 px-5 py-5 sm:px-6">
        <div className="pointer-events-none absolute inset-0 bg-hero-spot opacity-70" />
        <div className="pointer-events-none absolute -right-10 -top-24 h-56 w-56 rounded-full border border-accent/[0.08]" />
        <div className="pointer-events-none absolute -right-2 -top-16 h-40 w-40 rounded-full border border-accent/[0.07]" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}

            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
                {title}
              </h2>
              {badge}
            </div>

            {subtitle && (
              <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted sm:text-[13px]">
                {subtitle}
              </p>
            )}
          </div>

          {actions && (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">{children}</div>
    </main>
  );
};
