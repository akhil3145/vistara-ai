import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Info,
  Loader2,
  ScanLine,
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
      title="Disease Scanner"
      subtitle="Single-leaf foliar image analysis with top-5 class scores and a Grad-CAM placeholder."
      badge={
        <span className="rounded border border-teal-500/20 bg-teal-500/10 px-2 py-0.5 font-mono text-[11px] text-teal-600 dark:text-teal-400">
          Screen A
        </span>
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
            <span className="rounded border border-teal-500/30 bg-teal-500/10 px-2.5 py-0.5 font-mono text-[11px] font-medium text-teal-600 dark:text-teal-400">
              REAL INFERENCE
            </span>
          )
        ) : image?.meta.source === 'upload' ? (
          <DemoBadge label="READY TO ANALYZE" />
        ) : image?.meta.source === 'sample' ? (
          <DemoBadge label="DEMO SAMPLE" />
        ) : null
      }
    >
      {/* Explain the source and execution mode without mislabelling pending uploads. */}
      {prediction && !prediction.isDemo ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-teal-500/30 bg-teal-500/5 p-4 text-xs text-teal-900 dark:text-teal-200"
        >
          <ScanLine className="mt-0.5 h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
          <div className="space-y-0.5">
            <span className="font-semibold">Live Model Inference Output</span>
            <p className="leading-relaxed text-teal-800/90 dark:text-teal-300/90">
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
        <div role="status" className="flex items-start gap-3 rounded-xl border border-sky-500/25 bg-sky-500/5 p-4 text-xs text-sky-900 dark:text-sky-200">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
          <div className="space-y-0.5">
            <span className="font-semibold">Uploaded image ready for backend analysis</span>
            <p className="leading-relaxed text-sky-800/90 dark:text-sky-300/90">
              Click &quot;Analyze Leaf&quot; to send this image to the FastAPI
              backend (<code>POST /api/v1/predict</code>) for MobileNetV2 inference.
            </p>
          </div>
        </div>
      ) : null}

      {inputError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{inputError}</span>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-xl border border-sky-500/25 bg-sky-500/5 p-3 text-xs text-sky-800 dark:text-sky-300"
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{notice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
        <div className="contents lg:col-span-7 lg:block lg:space-y-4">
          <div className="order-1 lg:order-none">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-navy-800 dark:bg-navy-900">
              <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
                Foliar Image Upload
              </h3>
              <FileDropzone
                id="scanner-upload"
                title="Drag and drop a leaf photograph"
                description="or browse a local file from your device"
                hint="JPEG, PNG, or WEBP. Maximum 10 MB. One image per scan."
                onFiles={handleFiles}
                disabled={status === 'analyzing'}
              />

              {/* Action Bar with prominent Analyze Leaf Button */}
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-navy-800">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {image ? (
                    <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
                      <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                      Ready: <span className="font-mono truncate max-w-[220px]">{image.meta.name}</span>
                    </span>
                  ) : (
                    'Select or drop a leaf image to begin'
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAnalyzeLeaf}
                  disabled={!image || status === 'analyzing'}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-navy-900"
                >
                  {status === 'analyzing' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-teal-200" />
                      <span>Analyzing Leaf...</span>
                    </>
                  ) : (
                    <>
                      <ScanLine className="h-4 w-4" />
                      <span>Analyze Leaf</span>
                    </>
                  )}
                </button>
              </div>

              <p className="mt-3 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                Uploaded leaf files are sent securely to the FastAPI backend (
                <code>POST /api/v1/predict</code>) for MobileNetV2 classification.
              </p>
            </div>
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
