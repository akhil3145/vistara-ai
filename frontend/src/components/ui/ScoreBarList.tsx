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
        return (
          <li key={item.classId}>
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <span className="flex min-w-0 items-center gap-2 text-slate-700 dark:text-slate-200">
                <span className="w-4 shrink-0 font-mono text-[10px] text-slate-400 dark:text-slate-500">
                  {index + 1}
                </span>
                <span className="truncate">{item.label}</span>
              </span>
              <span className="shrink-0 font-mono text-slate-600 dark:text-slate-300">
                {percent.toFixed(1)}%
              </span>
            </div>
            <div
              className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-navy-950"
              role="progressbar"
              aria-label={`${item.label} demo score`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Number(percent.toFixed(1))}
            >
              <div
                className={`h-full rounded-full ${
                  index === 0 ? 'bg-teal-500' : 'bg-sky-500/70'
                }`}
                style={{ width: `${Math.max(percent, 0.5)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
};
