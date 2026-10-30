import React from 'react';
import { ScanEye } from 'lucide-react';

export const GradCamPlaceholder: React.FC = () => {
  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Grad-CAM Activation Map
        </h4>
        <span className="rounded border border-slate-300 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-slate-500 dark:border-navy-700 dark:text-slate-400">
          Unavailable
        </span>
      </div>
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50/70 px-5 py-8 text-center dark:border-navy-700 dark:bg-navy-950/40">
        <ScanEye
          className="mb-2 h-7 w-7 text-slate-400 dark:text-slate-600"
          aria-hidden="true"
        />
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          No heatmap has been generated
        </p>
        <p className="mt-1 max-w-sm text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          Grad-CAM requires a trained model checkpoint and a backend inference
          response. This panel will render the verified activation map returned
          by the API once those artifacts exist. No simulated heatmap is shown.
        </p>
      </div>
    </section>
  );
};
