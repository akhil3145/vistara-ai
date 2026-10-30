import React from 'react';
import { Info } from 'lucide-react';
import { SAMPLE_GALLERY } from '../../data/sampleGallery';

interface SampleGalleryProps {
  selectedId?: string;
  disabled?: boolean;
  onSelect: (sampleId: string) => void;
}

export const SampleGallery: React.FC<SampleGalleryProps> = ({
  selectedId,
  disabled = false,
  onSelect,
}) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-navy-800 dark:bg-navy-900">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Curated Sample Gallery
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
          8 illustrative assets
        </span>
      </div>
      <div className="mb-4 flex items-start gap-2 rounded-lg border border-sky-500/20 bg-sky-500/5 p-3 text-[11px] leading-relaxed text-sky-800 dark:text-sky-300">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <p>
          These are generated SVG illustrations, not photographs or PlantVillage
          images. They exercise the interface while the licensed sample set and
          trained model are pending.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SAMPLE_GALLERY.map((sample) => {
          const isSelected = selectedId === sample.id;
          return (
            <button
              key={sample.id}
              type="button"
              onClick={() => onSelect(sample.id)}
              disabled={disabled}
              aria-pressed={isSelected}
              className={`group overflow-hidden rounded-lg border text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-60 ${
                isSelected
                  ? 'border-teal-500 bg-teal-500/5 dark:border-teal-400'
                  : 'border-slate-200 bg-slate-50 hover:border-teal-400 dark:border-navy-800 dark:bg-navy-950/40 dark:hover:border-teal-500/60'
              }`}
            >
              <div className="aspect-square overflow-hidden bg-slate-100 dark:bg-navy-950">
                <img
                  src={sample.src}
                  alt={`Illustrative ${sample.label} leaf asset`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
              </div>
              <div className="space-y-0.5 p-2">
                <div className="truncate text-[11px] font-medium text-slate-900 dark:text-white">
                  {sample.crop}
                </div>
                <div className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                  {sample.condition}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <p className="mt-3 font-mono text-[10px] leading-relaxed text-slate-400 dark:text-slate-500">
        Asset licence: generated SVG artwork for Vistara AI interface
        demonstration. Not a field photograph.
      </p>
    </div>
  );
};
