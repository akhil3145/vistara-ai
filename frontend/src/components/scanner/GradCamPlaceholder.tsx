
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
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Grad-CAM Activation Map
        </h4>

        <span
          className={`rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide ${
            hasImage
              ? 'border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-400'
              : 'border-slate-300 text-slate-500 dark:border-navy-700 dark:text-slate-400'
          }`}
        >
          {hasImage ? 'Generated' : 'Unavailable'}
        </span>
      </div>

      {hasImage ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-navy-950 p-2 dark:border-navy-800">
          <img
            src={image!}
            alt="Grad-CAM activation map highlighting image regions influencing the model prediction"
            className="mx-auto max-h-80 w-full rounded-md object-contain"
          />
          <p className="px-2 pb-1 pt-3 text-center text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            Grad-CAM visualization of the regions influencing the model's prediction.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50/70 px-5 py-8 text-center dark:border-navy-700 dark:bg-navy-950/40">
          <ScanEye
            className="mb-2 h-7 w-7 text-slate-400 dark:text-slate-600"
            aria-hidden="true"
          />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            No heatmap available
          </p>
          <p className="mt-1 max-w-sm text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            The backend did not return a Grad-CAM visualization for this prediction.
            The classification result is still available.
          </p>
        </div>
      )}
    </section>
  );
};
