import React from 'react';
import { Bug, Leaf } from 'lucide-react';
import type { DiseaseClass, PathogenType } from '../../types/disease';

interface DiseaseCardProps {
  disease: DiseaseClass;
}

const TYPE_TONES: Record<PathogenType, string> = {
  Fungus: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  Bacterium: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
  Virus: 'border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300',
  Oomycete: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  Mite: 'border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300',
  Healthy: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
};

export const DiseaseCard: React.FC<DiseaseCardProps> = ({ disease }) => {
  const Icon = disease.healthy ? Leaf : Bug;

  return (
    <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-teal-500/30 dark:border-navy-800 dark:bg-navy-900 dark:hover:border-teal-500/30">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:border-navy-800 dark:bg-navy-950/40 dark:text-slate-300">
          {disease.crop}
        </span>
        <span
          className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${TYPE_TONES[disease.pathogenType]}`}
        >
          {disease.pathogenType}
        </span>
      </div>

      <div className="mt-3 flex items-start gap-2">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500 dark:bg-navy-850 dark:text-slate-400">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold leading-tight text-slate-900 dark:text-white">
            {disease.name}
          </h3>
          <p className="mt-0.5 break-words font-mono text-[10px] text-slate-400 dark:text-slate-500">
            {disease.healthy ? 'No causal pathogen' : disease.pathogen}
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-2 text-[11px] leading-relaxed">
        <div>
          <span className="font-semibold text-slate-600 dark:text-slate-300">
            Reported symptoms:{' '}
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            {disease.symptoms}
          </span>
        </div>
        <div>
          <span className="font-semibold text-slate-600 dark:text-slate-300">
            Context:{' '}
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            {disease.note}
          </span>
        </div>
      </div>

      <div className="mt-auto pt-3">
        <div
          className="truncate rounded bg-slate-50 px-2 py-1 font-mono text-[9px] text-slate-400 dark:bg-navy-950/40 dark:text-slate-500"
          title={disease.id}
        >
          {disease.id}
        </div>
      </div>
    </article>
  );
};
