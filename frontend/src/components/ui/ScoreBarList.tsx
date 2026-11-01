import React from 'react';
import type { ClassScore } from '../../types/prediction';

interface ScoreBarListProps {
  scores: ClassScore[];
}

export const ScoreBarList: React.FC<ScoreBarListProps> = ({ scores }) => {
  return (
    <ul className="space-y-3">
      {scores.map((item, index) => {
        const percent = item.score * 100;
        const isTop = index === 0;

        return (
          <li key={item.classId} className="group">
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <span className="flex min-w-0 items-center gap-2.5 text-ink">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md font-mono text-[9px] font-semibold ${
                    isTop
                      ? 'bg-accent/15 text-accent'
                      : 'bg-raised/80 text-faint'
                  }`}
                >
                  {index + 1}
                </span>
                <span className={`truncate ${isTop ? 'font-semibold' : 'text-muted'}`}>
                  {item.label}
                </span>
              </span>
              <span
                className={`shrink-0 font-mono text-[11px] ${
                  isTop ? 'text-accent' : 'text-muted'
                }`}
              >
                {percent.toFixed(1)}%
              </span>
            </div>
            <div
              className="mt-1.5 h-[7px] overflow-hidden rounded-full bg-base/70"
              role="progressbar"
              aria-label={`${item.label} score`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Number(percent.toFixed(1))}
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isTop
                    ? 'bg-gradient-to-r from-accent to-cyan shadow-[0_0_12px_rgba(32,201,176,0.35)]'
                    : 'bg-cyan/50 group-hover:bg-cyan/70'
                }`}
                style={{ width: `${Math.max(percent, 0.6)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
};
