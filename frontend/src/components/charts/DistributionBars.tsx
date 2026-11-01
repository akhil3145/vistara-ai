import React from 'react';

export interface DistributionItem {
  id: string;
  label: string;
  count: number;
  value: number;
  valueLabel: string;
}

interface DistributionBarsProps {
  items: DistributionItem[];
  emptyLabel?: string;
  tone?: 'teal' | 'cyan' | 'mixed';
}

export const DistributionBars: React.FC<DistributionBarsProps> = ({
  items,
  emptyLabel = 'No distribution data available',
  tone = 'teal',
}) => {
  const max = Math.max(1, ...items.map((item) => item.count));

  if (items.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-line bg-base/30 px-6 text-center">
        <p className="text-xs text-muted">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3.5">
      {items.map((item, index) => {
        const width = (item.count / max) * 100;
        const barClass =
          tone === 'mixed'
            ? index % 3 === 0
              ? 'from-accent to-accent/60'
              : index % 3 === 1
                ? 'from-cyan to-cyan/60'
                : 'from-lime to-lime/60'
            : tone === 'cyan'
              ? 'from-cyan to-cyan/55'
              : 'from-accent to-accent/55';

        return (
          <li key={item.id} className="group">
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span
                className="min-w-0 truncate text-[11px] font-medium text-muted transition-colors group-hover:text-ink"
                title={item.label}
              >
                {item.label}
              </span>
              <span className="shrink-0 font-mono text-[10px] tabular-nums text-faint">
                {item.count}
                <span className="mx-1 text-line-strong">/</span>
                {item.valueLabel}
              </span>
            </div>
            <div className="h-[6px] overflow-hidden rounded-full bg-base/70">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${barClass} transition-all duration-500`}
                style={{ width: `${Math.max(width, 1.5)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
};
