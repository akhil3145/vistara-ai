import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Info,
  Loader2,
  ScanLine,
  Image as ImageIcon,
  ShieldCheck,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { DemoBadge } from '../components/ui/DemoBadge';
import { DemoBanner } from '../components/ui/DemoBanner';
import { FileDropzone } from '../components/ui/FileDropzone';
import { SampleGallery } from '../components/scanner/SampleGallery';
import {
  ScanResultPanel,
  type ScanStatus,
} from '../components/scanner/ScanResultPanel';
import { SAMPLE_GALLERY_BY_ID } from '../data/sampleGallery';
import { generateDemoPrediction } from '../lib/demoPredictions';
import { readImageDimensions, validateImageFile } from '../lib/imageUtils';
import {
  mapBackendPrediction,
  predictSingle,
} from '../services/apiClient';
import type { FormattedPrediction, SelectedImage } from '../types/prediction';

const ANALYSIS_DELAY_MS = 900;

export const ScannerPage: React.FC = () => {
  const [image, setImage] = useState<SelectedImage | null>(null);
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [prediction, setPrediction] = useState<FormattedPrediction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const analysisIdRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelPendingRequests = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (abortControllerRef.current !== null) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      cancelPendingRequests();
    };
  }, []);

  const uploadSrc = image?.meta.source === 'upload' ? image.src : null;
  useEffect(() => {
    if (!uploadSrc) return;
    return () => {
      URL.revokeObjectURL(uploadSrc);
    };
  }, [uploadSrc]);

  /**
   * Selection handler: validates the image file, creates its preview,
   * reads dimensions, and stores the file without auto-triggering prediction.
   */
  const handleFiles = (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0];
    const validation = validateImageFile(file);
    if (!validation.ok) {
      setInputError(`${file.name}: ${validation.message}`);
      return;
    }

    cancelPendingRequests();
    analysisIdRef.current += 1;
    const currentSelectionId = analysisIdRef.current;

    setInputError(null);
    setError(null);
    setPrediction(null);
    setStatus('idle');
    setNotice(
      files.length > 1
        ? 'Only the first image is selected. Use Batch Analysis to queue multiple images.'
        : null,
    );

    const src = URL.createObjectURL(file);
    const nextImage: SelectedImage = {
      id: `upload-${file.name}-${file.lastModified}-${file.size}`,
      src,
      seed: `upload:${file.name}:${file.size}:${file.lastModified}`,
      file,
      meta: {
        name: file.name,
        mimeType: file.type || 'image/unknown',
        sizeBytes: file.size,
        lastModified: file.lastModified,
        source: 'upload',
      },
    };

    setImage(nextImage);

    readImageDimensions(src)
      .then((dimensions) => {
        if (analysisIdRef.current !== currentSelectionId) return;
        setImage((current) =>
          current && current.src === src
            ? {
                ...current,
                meta: {
                  ...current.meta,
                  width: dimensions.width,
                  height: dimensions.height,
                },
              }
            : current,
        );
      })
      .catch(() => {
        if (analysisIdRef.current !== currentSelectionId) return;
        setImage(null);
        setPrediction(null);
        setStatus('error');
        setError(
          'The selected file could not be decoded as an image. It may be corrupted or use an unsupported format.',
        );
      });
  };

  /**
   * Selection handler for sample gallery benchmark assets.
   * Updates preview without auto-triggering prediction.
   */
  const handleSampleSelect = (sampleId: string) => {
    const sample = SAMPLE_GALLERY_BY_ID.get(sampleId);
    if (!sample) return;

    cancelPendingRequests();
    analysisIdRef.current += 1;

    const nextImage: SelectedImage = {
      id: sample.id,
      src: sample.src,
      seed: `sample:${sample.id}`,
      sampleClassId: sample.classId,
      meta: {
        name: `${sample.label} (illustrative)`,
        mimeType: 'image/svg+xml',
        width: sample.width,
        height: sample.height,
        source: 'sample',
        licenseNote: sample.license,
      },
    };

    setImage(nextImage);
    setStatus('idle');
    setPrediction(null);
    setError(null);
    setInputError(null);
    setNotice(null);
  };

  /**
   * Explicit manual analysis action triggered by "Analyze Leaf".
   * For uploaded images: sends real image to POST /api/v1/predict.
   * For sample assets: generates simulated demonstration preview.
   * Protects against stale requests.
   */
  const handleAnalyzeLeaf = async () => {
    if (!image || status === 'analyzing') return;

    cancelPendingRequests();
    analysisIdRef.current += 1;
    const currentRequestId = analysisIdRef.current;

    setStatus('analyzing');
    setPrediction(null);
    setError(null);

    if (image.meta.source === 'upload') {
      if (!image.file) {
        setStatus('error');
        setError(
          'No uploaded image file is available for analysis. Please re-select a leaf image.',
        );
        return;
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const responseDto = await predictSingle(
          image.file,
          controller.signal,
        );

        if (analysisIdRef.current !== currentRequestId) {
          // Stale request discarded
          return;
        }

        const realResult = mapBackendPrediction(responseDto);
        setPrediction(realResult);
        setStatus('success');
      } catch (err: any) {
        if (analysisIdRef.current !== currentRequestId) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;

        setStatus('error');
        setError(
          err.message ||
            'An unexpected error occurred while communicating with the backend.',
        );
      } finally {
        if (analysisIdRef.current === currentRequestId) {
          abortControllerRef.current = null;
        }
      }
    } else {
      // Sample gallery illustrative asset: simulated demo prediction
      timeoutRef.current = window.setTimeout(() => {
        if (analysisIdRef.current !== currentRequestId) return;
        const demoResult = generateDemoPrediction(
          image.seed,
          image.sampleClassId,
        );
        setPrediction(demoResult);
        setStatus('success');
        timeoutRef.current = null;
      }, ANALYSIS_DELAY_MS);
    }
  };

  const selectedSampleId =
    image?.meta.source === 'sample' ? image.id : undefined;

  return (
    <PageContainer
      eyebrow="Foliar analysis · single image"
      title="Disease Scanner"
      subtitle="Upload a leaf photograph for MobileNetV2 classification with ranked class scores and Grad-CAM explanation."
      badge={
        <span className="chip chip-accent font-mono">Screen A</span>
      }
      actions={
        status === 'analyzing' ? (
          <DemoBadge label="ANALYZING" />
        ) : status === 'error' ? (
          <DemoBadge label="ANALYSIS ERROR" />
        ) : prediction ? (
          prediction.isDemo ? (
            <DemoBadge label="DEMO SAMPLE" />
          ) : (
            <span className="chip chip-accent font-mono">REAL INFERENCE</span>
          )
        ) : image?.meta.source === 'upload' ? (
          <span className="chip chip-cyan">READY TO ANALYZE</span>
        ) : image?.meta.source === 'sample' ? (
          <DemoBadge label="DEMO SAMPLE" />
        ) : null
      }
    >
      {/* Execution mode context */}
      {prediction && !prediction.isDemo ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-accent/25 bg-accent/[0.05] p-4 text-xs text-muted"
        >
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-accent/25 bg-accent/10">
            <ScanLine className="h-3.5 w-3.5 text-accent" />
          </div>
          <div className="space-y-0.5">
            <span className="font-semibold text-ink">Live model inference output</span>
            <p className="leading-relaxed">
              This prediction was produced by the local FastAPI backend using
              MobileNetV2 over the PlantVillage 38-class benchmark. Inference
              latency was measured directly on the server. The model score is
              not a verified diagnosis.
            </p>
          </div>
        </div>
      ) : image?.meta.source === 'sample' ? (
        <DemoBanner title="Illustrative sample — simulated result">
          This gallery image is an illustrative SVG asset. Its prediction and
          scores are generated locally for demonstration and are not produced
          by the trained model.
        </DemoBanner>
      ) : image?.meta.source === 'upload' ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-cyan/25 bg-cyan/[0.05] p-4 text-xs text-muted"
        >
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-cyan/25 bg-cyan/10">
            <Info className="h-3.5 w-3.5 text-cyan" />
          </div>
          <div className="space-y-0.5">
            <span className="font-semibold text-ink">
              Uploaded image ready for backend analysis
            </span>
            <p className="leading-relaxed">
              Click &quot;Analyze Leaf&quot; to send this image to the FastAPI
              backend (<code className="text-cyan">POST /api/v1/predict</code>)
              for MobileNetV2 inference.
            </p>
          </div>
        </div>
      ) : null}

      {inputError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/[0.07] p-3 text-xs text-danger"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{inputError}</span>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-xl border border-cyan/25 bg-cyan/[0.05] p-3 text-xs text-muted"
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyan" aria-hidden="true" />
          <span>{notice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        <div className="contents lg:col-span-7 lg:block lg:space-y-4">
          <div className="order-1 lg:order-none">
            <section className="panel p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-accent/25 bg-accent/10 font-mono text-[10px] font-semibold text-accent">
                    01
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">
                      Foliar image input
                    </h3>
                    <p className="text-[10px] text-faint">
                      One image per scan · validated before inference
                    </p>
                  </div>
                </div>
                <span className="chip">JPEG · PNG · WEBP</span>
              </div>

              <FileDropzone
                id="scanner-upload"
                title="Drag and drop a leaf photograph"
                description="or browse a local file from your device"
                hint="JPEG, PNG, or WEBP. Maximum 10 MB."
                onFiles={handleFiles}
                disabled={status === 'analyzing'}
              />

              <div className="mt-4 flex flex-col gap-3 border-t border-line/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-2.5">
                  {image ? (
                    <>
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-line bg-base">
                        <img
                          src={image.src}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-[11px] font-medium text-ink">
                          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-soft" />
                          <span className="truncate">{image.meta.name}</span>
                        </p>
                        <p className="mt-0.5 text-[10px] text-faint">
                          {image.meta.source === 'upload'
                            ? 'Uploaded local file'
                            : 'Illustrative sample asset'}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-[11px] text-faint">
                      <ImageIcon className="h-4 w-4" />
                      Select or drop a leaf image to begin
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAnalyzeLeaf}
                  disabled={!image || status === 'analyzing'}
                  className="btn-primary w-full shrink-0 sm:w-auto"
                >
                  {status === 'analyzing' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Analyzing leaf...</span>
                    </>
                  ) : (
                    <>
                      <ScanLine className="h-4 w-4" />
                      <span>Analyze leaf</span>
                    </>
                  )}
                </button>
              </div>

              <div className="mt-3 flex items-start gap-2 rounded-lg border border-line/70 bg-base/30 p-2.5 text-[10px] leading-relaxed text-faint">
                <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
                <p>
                  Uploaded leaf files are sent securely to the FastAPI backend
                  (<code className="text-muted">POST /api/v1/predict</code>) for
                  MobileNetV2 classification. Raw uploads are processed
                  ephemerally.
                </p>
              </div>
            </section>
          </div>

          <div className="order-3 lg:order-none">
            <SampleGallery
              selectedId={selectedSampleId}
              onSelect={handleSampleSelect}
              disabled={status === 'analyzing'}
            />
          </div>
        </div>

        <div className="order-2 lg:order-none lg:col-span-5">
          <ScanResultPanel
            image={image}
            status={status}
            prediction={prediction}
            error={error}
            onAnalyze={handleAnalyzeLeaf}
          />
        </div>
      </div>
    </PageContainer>
  );
};
