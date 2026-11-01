import React from 'react';
import { Bug, Leaf } from 'lucide-react';
import type { DiseaseClass, PathogenType } from '../../types/disease';

interface DiseaseCardProps {
  disease: DiseaseClass;
  imageSrc?: string;
}

const TYPE_TONES: Record<PathogenType, string> = {
  Fungus: 'border-warning/30 bg-warning/10 text-warning',
  Bacterium: 'border-danger/30 bg-danger/10 text-danger',
  Virus: 'border-accent/30 bg-accent/10 text-accent',
  Oomycete: 'border-cyan/30 bg-cyan/10 text-cyan',
  Mite: 'border-warning/30 bg-warning/10 text-warning',
  Healthy: 'border-lime/30 bg-lime/10 text-lime',
};

export const DiseaseCard: React.FC<DiseaseCardProps> = ({
  disease,
  imageSrc,
}) => {
  const Icon = disease.healthy ? Leaf : Bug;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-panel panel-hover">
      {imageSrc ? (
        <div className="relative h-28 overflow-hidden border-b border-line bg-base">
          <img
            src={imageSrc}
            alt={`Illustrative ${disease.crop} ${disease.name} leaf asset`}
            loading="lazy"
            className="h-full w-full object-cover opacity-80 transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-panel via-panel/20 to-transparent" />
          <span className="absolute right-2 top-2 rounded-full border border-line bg-base/75 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.08em] text-faint backdrop-blur">
            Demo asset
          </span>
        </div>
      ) : null}

      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-md border border-line bg-raised/60 px-1.5 py-0.5 text-[9.5px] font-medium text-muted">
            {disease.crop}
          </span>
          <span
            className={`rounded-md border px-1.5 py-0.5 font-mono text-[9px] ${TYPE_TONES[disease.pathogenType]}`}
          >
            {disease.pathogenType}
          </span>
        </div>

        <div className="mt-3 flex items-start gap-2.5">
          <div
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
              disease.healthy
                ? 'border-lime/25 bg-lime/10 text-lime'
                : 'border-accent/25 bg-accent/10 text-accent'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold leading-tight text-ink">
              {disease.name}
            </h3>
            <p className="mt-0.5 break-words font-mono text-[9.5px] text-faint">
              {disease.healthy ? 'No causal pathogen' : disease.pathogen}
            </p>
          </div>
        </div>

        <div className="mt-3 space-y-2.5 text-[10.5px] leading-relaxed">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-faint">
              Reported symptoms
            </span>
            <p className="mt-1 text-muted">{disease.symptoms}</p>
          </div>
          <div>
            <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-faint">
              Context
            </span>
            <p className="mt-1 text-muted">{disease.note}</p>
          </div>
        </div>

        <div className="mt-auto pt-3">
          <div
            className="truncate rounded-md border border-line/70 bg-base/30 px-2 py-1 font-mono text-[8.5px] text-faint"
            title={disease.id}
          >
            {disease.id}
          </div>
        </div>
      </div>
    </article>
  );
};
