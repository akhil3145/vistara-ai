import React from 'react';
import {
  AlertTriangle,
  Image as ImageIcon,
  Loader2,
  ScanLine,
} from 'lucide-react';
import { ConfidenceRing } from '../ui/ConfidenceRing';
import { DemoBadge } from '../ui/DemoBadge';
import { EmptyState } from '../ui/EmptyState';
import { ScoreBarList } from '../ui/ScoreBarList';
import { GradCamPlaceholder } from './GradCamPlaceholder';
import { ImageMetadataPanel } from './ImageMetadataPanel';
import type { DemoPrediction, SelectedImage } from '../../types/prediction';

export type ScanStatus = 'idle' | 'analyzing' | 'success' | 'error';

interface ScanResultPanelProps {
  image: SelectedImage | null;
  status: ScanStatus;
  prediction: DemoPrediction | null;
  error: string | null;
}

const ringTone = (score: number): 'teal' | 'amber' | 'rose' => {
  if (score < 50) return 'rose';
  if (score < 70) return 'amber';
  return 'teal';
};

export const ScanResultPanel: React.FC<ScanResultPanelProps> = ({
  image,
  status,
  prediction,
  error,
}) => {
  return (
    <div
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-navy-800 dark:bg-navy-900"
      aria-live="polite"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Analysis Result
        </h3>
        {status === 'success' && <DemoBadge />}
      </div>

      {status === 'idle' && (
        <EmptyState
          icon={ImageIcon}
          title="Awaiting foliar input"
          description="Upload an image or select an illustrative sample to inspect the simulated result layout, confidence ring, and top-5 class scores."
          hint="No inference runs until a trained model and backend are available."
          className="min-h-[360px]"
        />
      )}

      {status === 'analyzing' && (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-6 text-center dark:border-navy-700 dark:bg-navy-950/40">
          <Loader2
            className="mb-3 h-8 w-8 animate-spin text-teal-500"
            aria-hidden="true"
          />
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Preparing simulated result
          </p>
          <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Generating deterministic DEMO DATA for the interface preview. No
            model inference is being performed.
          </p>
        </div>
      )}

      {status === 'error' && (
        <EmptyState
          icon={AlertTriangle}
          title="Image could not be analyzed"
          description={error ?? 'The selected file could not be read.'}
          hint="Choose a JPEG, PNG, or WEBP image under 10 MB."
          className="min-h-[360px] border-rose-500/30 bg-rose-500/5 dark:border-rose-500/30 dark:bg-rose-500/5"
        />
      )}

      {status === 'success' && image && prediction && (
        <div className="space-y-5">
          <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-navy-950 dark:border-navy-800">
            <img
              src={image.src}
              alt={`Preview of ${image.meta.name}`}
              className="max-h-72 w-full object-contain"
            />
            <div className="absolute left-2 top-2">
              <DemoBadge label="SIMULATED" />
            </div>
            <div className="absolute bottom-2 right-2 rounded bg-slate-950/75 px-1.5 py-0.5 font-mono text-[10px] text-slate-200">
              {image.meta.source === 'upload' ? 'UPLOAD' : 'SAMPLE ASSET'}
            </div>
          </div>

          <ImageMetadataPanel meta={image.meta} />

          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 dark:border-navy-800 dark:bg-navy-950/40">
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <ConfidenceRing
                value={prediction.top.score * 100}
                label="Top-1 demo score"
                tone={ringTone(prediction.top.score * 100)}
              />
              <div className="min-w-0 space-y-1.5 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span className="font-mono text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    Top prediction
                  </span>
                  <DemoBadge label="DEMO" />
                </div>
                <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                  {prediction.top.label}
                </h4>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Closed-set softmax-style demo score. It is not a calibrated
                  probability of diagnostic correctness.
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2 border-t border-slate-200 pt-3 text-[11px] dark:border-navy-800 sm:grid-cols-2">
              <div>
                <span className="text-slate-400 dark:text-slate-500">
                  Simulated latency:{' '}
                </span>
                <span className="font-mono text-slate-700 dark:text-slate-200">
                  {prediction.latencyMs} ms
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500">
                  Model version:{' '}
                </span>
                <span className="font-mono text-slate-700 dark:text-slate-200">
                  {prediction.modelVersion}
                </span>
              </div>
            </div>
          </div>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Top-5 Class Scores
              </h4>
              <DemoBadge label="DEMO" />
            </div>
            <ScoreBarList scores={prediction.classes} />
          </section>

          <GradCamPlaceholder />

          <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-[11px] leading-relaxed text-slate-500 dark:border-navy-800 dark:bg-navy-950/40 dark:text-slate-400">
            <ScanLine className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-500" aria-hidden="true" />
            <p>
              The same input seed produces the same simulated scores by design.
              These values demonstrate the result layout only and must not be
              interpreted as model evidence.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
