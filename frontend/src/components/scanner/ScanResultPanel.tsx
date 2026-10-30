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
import type { FormattedPrediction, SelectedImage } from '../../types/prediction';

export type ScanStatus = 'idle' | 'analyzing' | 'success' | 'error';

interface ScanResultPanelProps {
  image: SelectedImage | null;
  status: ScanStatus;
  prediction: FormattedPrediction | null;
  error: string | null;
  onAnalyze?: () => void;
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
  onAnalyze,
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
        {status === 'success' && prediction && (
          prediction.isDemo ? (
            <DemoBadge label="DEMO DATA" />
          ) : (
            <span className="inline-flex items-center gap-1 rounded border border-teal-500/30 bg-teal-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-teal-600 dark:text-teal-400">
              REAL INFERENCE
            </span>
          )
        )}
      </div>

      {/* State 1: No image selected at all */}
      {status === 'idle' && !image && (
        <EmptyState
          icon={ImageIcon}
          title="Awaiting foliar input"
          description="Upload a leaf photograph or select an illustrative sample to inspect image details and run MobileNetV2 disease detection."
          hint="Uploaded leaves will be sent to the FastAPI backend at POST /api/v1/predict."
          className="min-h-[360px]"
        />
      )}

      {/* State 2: Image selected and ready for analysis */}
      {status === 'idle' && image && !prediction && (
        <div className="space-y-5">
          <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-navy-950 dark:border-navy-800">
            <img
              src={image.src}
              alt={`Preview of ${image.meta.name}`}
              className="max-h-72 w-full object-contain"
            />
            <div className="absolute bottom-2 right-2 rounded bg-slate-950/75 px-1.5 py-0.5 font-mono text-[10px] text-slate-200">
              {image.meta.source === 'upload' ? 'UPLOADED' : 'SAMPLE ASSET'}
            </div>
          </div>

          <ImageMetadataPanel meta={image.meta} />

          <div className="rounded-lg border border-teal-500/25 bg-teal-500/5 p-4 text-center">
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
              {image.meta.source === 'upload'
                ? 'Leaf photograph is validated and ready for classification via MobileNetV2.'
                : 'Illustrative benchmark sample selected. Click below to preview demonstration output.'}
            </p>
            {onAnalyze && (
              <button
                type="button"
                onClick={onAnalyze}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-500 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-navy-900"
              >
                <ScanLine className="h-4 w-4" />
                <span>Analyze Leaf</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* State 3: Analysis in progress */}
      {status === 'analyzing' && (
        <div className="space-y-5">
          {image && (
            <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-navy-950 dark:border-navy-800">
              <img
                src={image.src}
                alt={`Preview of ${image.meta.name}`}
                className="max-h-64 w-full object-contain opacity-75"
              />
            </div>
          )}
          <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-teal-500/30 bg-slate-50/60 p-6 text-center dark:border-navy-700 dark:bg-navy-950/40">
            <Loader2
              className="mb-3 h-8 w-8 animate-spin text-teal-500"
              aria-hidden="true"
            />
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {image?.meta.source === 'upload'
                ? 'Running MobileNetV2 inference'
                : 'Preparing simulated result'}
            </p>
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {image?.meta.source === 'upload'
                ? 'Sending leaf image to FastAPI backend (POST /api/v1/predict) and computing class scores...'
                : 'Generating deterministic DEMO DATA for the interface preview. No model inference is being performed.'}
            </p>
          </div>
        </div>
      )}

      {/* State 4: Error encountered */}
      {status === 'error' && (
        <div className="space-y-4">
          {image && (
            <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-navy-950 dark:border-navy-800">
              <img
                src={image.src}
                alt={`Preview of ${image.meta.name}`}
                className="max-h-56 w-full object-contain opacity-60"
              />
              <div className="absolute bottom-2 right-2 rounded bg-slate-950/75 px-1.5 py-0.5 font-mono text-[10px] text-slate-200">
                {image.meta.source === 'upload' ? 'UPLOAD' : 'SAMPLE ASSET'}
              </div>
            </div>
          )}
          <EmptyState
            icon={AlertTriangle}
            title="Image could not be analyzed"
            description={error ?? 'The selected file could not be analyzed.'}
            hint="Please verify that the backend is running at http://127.0.0.1:8000 and the model is loaded."
            className="min-h-[240px] border-rose-500/30 bg-rose-500/5 dark:border-rose-500/30 dark:bg-rose-500/5"
          />
          {onAnalyze && image && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onAnalyze}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-navy-750 transition-colors"
              >
                <ScanLine className="h-3.5 w-3.5 text-teal-500" />
                <span>Retry Analysis</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* State 5: Successful prediction output */}
      {status === 'success' && image && prediction && (
        <div className="space-y-5">
          <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-navy-950 dark:border-navy-800">
            <img
              src={image.src}
              alt={`Preview of ${image.meta.name}`}
              className="max-h-72 w-full object-contain"
            />
            <div className="absolute left-2 top-2">
              {prediction.isDemo ? (
                <DemoBadge label="SIMULATED" />
              ) : (
                <span className="rounded bg-teal-600/90 px-2 py-0.5 font-mono text-[10px] font-semibold text-white shadow">
                  REAL INFERENCE
                </span>
              )}
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
                label={prediction.isDemo ? 'Top-1 demo score' : 'Top-1 confidence'}
                tone={ringTone(prediction.top.score * 100)}
              />
              <div className="min-w-0 space-y-1.5 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span className="font-mono text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    Top prediction
                  </span>
                  {prediction.isDemo ? (
                    <DemoBadge label="DEMO" />
                  ) : (
                    <span className="rounded border border-teal-500/30 bg-teal-500/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-teal-600 dark:text-teal-400">
                      MobileNetV2
                    </span>
                  )}
                </div>
                <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                  {prediction.top.label}
                </h4>
                {prediction.top.crop && (
                  <p className="text-xs font-medium text-teal-600 dark:text-teal-400">
                    Host crop: {prediction.top.crop}
                  </p>
                )}
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {prediction.isDemo
                    ? 'Closed-set softmax-style demo score. It is not a calibrated probability of diagnostic correctness.'
                    : 'Closed-set softmax score from MobileNetV2. Decision-support indication, not a definitive agronomic diagnosis.'}
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2 border-t border-slate-200 pt-3 text-[11px] dark:border-navy-800 sm:grid-cols-2">
              <div>
                <span className="text-slate-400 dark:text-slate-500">
                  {prediction.isDemo ? 'Simulated latency: ' : 'Inference latency: '}
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
              {prediction.isDemo ? (
                <DemoBadge label="DEMO" />
              ) : (
                <span className="font-mono text-[10px] text-teal-600 dark:text-teal-400">
                  38-Class Softmax
                </span>
              )}
            </div>
            <ScoreBarList scores={prediction.classes} />
          </section>

          <GradCamPlaceholder />

          <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-[11px] leading-relaxed text-slate-500 dark:border-navy-800 dark:bg-navy-950/40 dark:text-slate-400">
            <ScanLine className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-500" aria-hidden="true" />
            <p>
              {prediction.isDemo
                ? 'The same input seed produces the same simulated scores by design. These values demonstrate the result layout only and must not be interpreted as model evidence.'
                : 'Inference produced by the local FastAPI backend using MobileNetV2 transfer learning across 38 PlantVillage classes.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
