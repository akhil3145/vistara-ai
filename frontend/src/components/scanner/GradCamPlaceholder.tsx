import React from 'react';
import { ScanEye } from 'lucide-react';

interface GradCamPlaceholderProps {
  image?: string | null;
}

export const GradCamPlaceholder: React.FC<GradCamPlaceholderProps> = ({
  image,
}) => {
  const hasImage = Boolean(image?.startsWith('data:image/'));

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-[10px] font-bold uppercase tracking-[0.14em] text-faint">
          Grad-CAM activation map
        </h4>

        <span
          className={`rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] ${
            hasImage
              ? 'border-accent/30 bg-accent/10 text-accent'
              : 'border-line text-faint'
          }`}
        >
          {hasImage ? 'Generated' : 'Unavailable'}
        </span>
      </div>

      {hasImage ? (
        <div className="overflow-hidden rounded-xl border border-line bg-base p-2">
          <img
            src={image!}
            alt="Grad-CAM activation map highlighting image regions influencing the model prediction"
            className="mx-auto max-h-80 w-full rounded-lg object-contain"
          />
          <p className="px-2 pb-1 pt-3 text-center text-[10px] leading-relaxed text-faint">
            Grad-CAM visualization of the regions influencing the model&apos;s
            prediction.
          </p>
        </div>
      ) : (
        <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-line bg-base/30 px-5 py-8 text-center">
          <div className="pointer-events-none absolute inset-0 bg-grid-fade bg-[size:30px_30px] opacity-[0.14]" />
          <div className="relative mb-2 flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-raised/60">
            <ScanEye className="h-5 w-5 text-faint" aria-hidden="true" />
          </div>
          <p className="relative text-xs font-semibold text-muted">
            No heatmap available
          </p>
          <p className="relative mt-1 max-w-sm text-[10px] leading-relaxed text-faint">
            The backend did not return a Grad-CAM visualization for this
            prediction. The classification result is still available.
          </p>
        </div>
      )}
    </section>
  );
};
