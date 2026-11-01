import React from 'react';
import {
  AlertTriangle,
  Image as ImageIcon,
  Loader2,
  ScanLine,
  Sparkles,
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

const Preview: React.FC<{
  image: SelectedImage;
  faded?: boolean;
  scanning?: boolean;
}> = ({ image, faded = false, scanning = false }) => (
  <div className="relative overflow-hidden rounded-xl border border-line bg-base">
    <img
      src={image.src}
      alt={`Preview of ${image.meta.name}`}
      className={`max-h-72 w-full object-contain ${faded ? 'opacity-55' : ''}`}
    />
    {scanning && (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-16 animate-scan-sweep">
          <div className="scan-line h-px w-full" />
        </div>
      </div>
    )}
    <div className="absolute left-2 top-2">
      <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-base/80 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-muted backdrop-blur">
        {image.meta.source === 'upload' ? 'Uploaded' : 'Sample asset'}
      </span>
    </div>
    <div className="absolute bottom-2 right-2 rounded-md border border-line bg-base/80 px-1.5 py-0.5 font-mono text-[9px] text-muted backdrop-blur">
      {image.meta.source === 'upload' ? 'LOCAL FILE' : 'DEMO ASSET'}
    </div>
  </div>
);

export const ScanResultPanel: React.FC<ScanResultPanelProps> = ({
  image,
  status,
  prediction,
  error,
  onAnalyze,
}) => {
  return (
    <div className="panel p-4 sm:p-5" aria-live="polite">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan/25 bg-cyan/10">
            <ScanLine className="h-3.5 w-3.5 text-cyan" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-ink">Analysis output</h3>
            <p className="text-[10px] text-faint">
              Ranked scores · explainability · metadata
            </p>
          </div>
        </div>

        {status === 'success' && prediction && (
          prediction.isDemo ? (
            <DemoBadge label="DEMO DATA" />
          ) : (
            <span className="chip chip-accent font-mono">REAL INFERENCE</span>
          )
        )}
      </div>

      {/* State 1: No image selected at all */}
      {status === 'idle' && !image && (
        <EmptyState
          icon={ImageIcon}
          title="Awaiting foliar input"
          description="Upload a leaf photograph or select an illustrative sample to inspect image details and run MobileNetV2 disease detection."
          hint="Uploaded leaves are sent to POST /api/v1/predict."
          className="min-h-[420px]"
        />
      )}

      {/* State 2: Image selected and ready for analysis */}
      {status === 'idle' && image && !prediction && (
        <div className="space-y-4">
          <Preview image={image} />
          <ImageMetadataPanel meta={image.meta} />

          <div className="rounded-xl border border-accent/20 bg-accent/[0.045] p-4 text-center">
            <p className="mb-3 text-[11px] leading-relaxed text-muted">
              {image.meta.source === 'upload'
                ? 'Leaf photograph is validated and ready for classification via MobileNetV2.'
                : 'Illustrative benchmark sample selected. Run to preview demonstration output.'}
            </p>
            {onAnalyze && (
              <button type="button" onClick={onAnalyze} className="btn-primary">
                <ScanLine className="h-4 w-4" />
                <span>Analyze leaf</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* State 3: Analysis in progress */}
      {status === 'analyzing' && (
        <div className="space-y-4">
          {image && <Preview image={image} faded scanning />}

          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-accent/25 bg-accent/[0.035] p-6 text-center">
            <div className="relative mb-4">
              <Loader2 className="h-9 w-9 animate-spin text-accent" aria-hidden="true" />
              <span className="absolute inset-0 rounded-full bg-accent/20 blur-xl" />
            </div>
            <p className="text-sm font-semibold text-ink">
              {image?.meta.source === 'upload'
                ? 'Running MobileNetV2 inference'
                : 'Preparing simulated result'}
            </p>
            <p className="mt-1.5 max-w-xs text-[11px] leading-relaxed text-muted">
              {image?.meta.source === 'upload'
                ? 'Sending leaf image to the FastAPI backend and computing class scores...'
                : 'Generating deterministic DEMO DATA for the interface preview. No model inference is being performed.'}
            </p>
          </div>
        </div>
      )}

      {/* State 4: Error encountered */}
      {status === 'error' && (
        <div className="space-y-4">
          {image && <Preview image={image} faded />}

          <EmptyState
            icon={AlertTriangle}
            title="Image could not be analyzed"
            description={error ?? 'The selected file could not be analyzed.'}
            hint="Verify the backend is running and the model is loaded."
            className="min-h-[220px] border-danger/30 bg-danger/[0.045]"
          />

          {onAnalyze && image && (
            <div className="text-center">
              <button type="button" onClick={onAnalyze} className="btn-secondary">
                <ScanLine className="h-3.5 w-3.5 text-accent" />
                <span>Retry analysis</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* State 5: Successful prediction output */}
      {status === 'success' && image && prediction && (
        <div className="space-y-4">
          <Preview image={image} />

          <div className="relative overflow-hidden rounded-xl border border-line bg-raised/40 p-4">
            <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-accent/[0.12] blur-2xl" />

            <div className="relative flex flex-col items-center gap-4 sm:flex-row">
              <ConfidenceRing
                value={prediction.top.score * 100}
                label={prediction.isDemo ? 'Demo top-1' : 'Top-1 score'}
                tone={ringTone(prediction.top.score * 100)}
              />

              <div className="min-w-0 space-y-1.5 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
                    Top prediction
                  </span>
                  {prediction.isDemo ? (
                    <DemoBadge label="DEMO" />
                  ) : (
                    <span className="chip chip-accent font-mono">MobileNetV2</span>
                  )}
                </div>

                <h4 className="text-base font-semibold leading-tight text-ink">
                  {prediction.top.label}
                </h4>

                {prediction.top.crop && (
                  <p className="text-[11px] font-medium text-accent">
                    Host crop · {prediction.top.crop}
                  </p>
                )}

                <p className="text-[10.5px] leading-relaxed text-faint">
                  {prediction.isDemo
                    ? 'Closed-set softmax-style demo score. Not a calibrated probability of diagnostic correctness.'
                    : 'Closed-set softmax score from MobileNetV2. Decision support, not a definitive agronomic diagnosis.'}
                </p>
              </div>
            </div>

            <div className="relative mt-4 grid grid-cols-1 gap-2 border-t border-line/70 pt-3 text-[10px] sm:grid-cols-2">
              <div className="flex items-center justify-between gap-2 rounded-lg bg-base/30 px-2.5 py-2">
                <span className="text-faint">
                  {prediction.isDemo ? 'Simulated latency' : 'Inference latency'}
                </span>
                <span className="font-mono text-ink">{prediction.latencyMs} ms</span>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-lg bg-base/30 px-2.5 py-2">
                <span className="text-faint">Model version</span>
                <span className="truncate font-mono text-ink">
                  {prediction.modelVersion}
                </span>
              </div>
            </div>
          </div>

          <ImageMetadataPanel meta={image.meta} />

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.14em] text-faint">
                Top-5 class scores
              </h4>
              {prediction.isDemo ? (
                <DemoBadge label="DEMO" />
              ) : (
                <span className="font-mono text-[9px] text-accent">
                  38-CLASS SOFTMAX
                </span>
              )}
            </div>
            <ScoreBarList scores={prediction.classes} />
          </section>

          <GradCamPlaceholder
            image={prediction.isDemo ? null : prediction.gradcamImage}
          />

          <div className="flex items-start gap-2 rounded-lg border border-line/70 bg-base/30 p-3 text-[10px] leading-relaxed text-faint">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
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
