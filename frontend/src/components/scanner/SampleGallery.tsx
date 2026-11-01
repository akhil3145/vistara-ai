import React from 'react';
import { Info, Sparkles } from 'lucide-react';
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
    <section className="panel p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-lime/25 bg-lime/10">
            <Sparkles className="h-3.5 w-3.5 text-lime" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-ink">
              Curated sample gallery
            </h3>
            <p className="text-[10px] text-faint">
              {SAMPLE_GALLERY.length} illustrative benchmark assets
            </p>
          </div>
        </div>
        <span className="chip chip-lime font-mono">DEMO ASSETS</span>
      </div>

      <div className="mb-4 flex items-start gap-2 rounded-lg border border-cyan/20 bg-cyan/[0.04] p-3 text-[10px] leading-relaxed text-muted">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan" aria-hidden="true" />
        <p>
          These are generated SVG illustrations, not photographs or PlantVillage
          images. They exercise the interface while the licensed sample set and
          trained model are pending.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {SAMPLE_GALLERY.map((sample) => {
          const isSelected = selectedId === sample.id;

          return (
            <button
              key={sample.id}
              type="button"
              onClick={() => onSelect(sample.id)}
              disabled={disabled}
              aria-pressed={isSelected}
              className={`group relative overflow-hidden rounded-xl border text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60 ${
                isSelected
                  ? 'border-accent/60 bg-accent/[0.07] shadow-[0_0_0_1px_rgba(32,201,176,0.25)]'
                  : 'border-line bg-base/30 hover:-translate-y-0.5 hover:border-accent/35'
              }`}
            >
              <div className="relative aspect-square overflow-hidden bg-base">
                <img
                  src={sample.src}
                  alt={`Illustrative ${sample.label} leaf asset`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-base/85 to-transparent" />
                {isSelected && (
                  <span className="absolute right-1.5 top-1.5 rounded-full border border-accent/40 bg-base/80 px-1.5 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-wide text-accent backdrop-blur">
                    Selected
                  </span>
                )}
              </div>
              <div className="space-y-0.5 p-2">
                <div className="truncate text-[10.5px] font-semibold text-ink">
                  {sample.crop}
                </div>
                <div className="truncate text-[9.5px] text-faint">
                  {sample.condition}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-3 font-mono text-[9px] leading-relaxed text-faint">
        Asset licence: generated SVG artwork for Vistara AI interface
        demonstration. Not a field photograph.
      </p>
    </section>
  );
};
