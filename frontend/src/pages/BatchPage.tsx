import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Download,
  FilterX,
  Info,
  Loader2,
  Play,
  Sparkles,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { BatchKpis } from '../components/batch/BatchKpis';
import { BatchTable } from '../components/batch/BatchTable';
import { DemoBadge } from '../components/ui/DemoBadge';
import { DemoBanner } from '../components/ui/DemoBanner';
import { FileDropzone } from '../components/ui/FileDropzone';
import { SAMPLE_GALLERY } from '../data/sampleGallery';
import { downloadCsv } from '../lib/csv';
import { generateDemoPrediction } from '../lib/demoPredictions';
import { readImageDimensions, validateImageFile } from '../lib/imageUtils';
import {
  mapBatchItemPrediction,
  predictBatch,
} from '../services/apiClient';
import type {
  BatchConfidenceFilter,
  BatchItem,
  BatchStatusFilter,
} from '../types/batch';

const MAX_BATCH_ITEMS = 24;
const DEMO_ANALYSIS_DELAY_MS = 280;

const delay = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });

const confidenceOf = (item: BatchItem): number | null =>
  item.prediction ? item.prediction.top.score * 100 : null;

export const BatchPage: React.FC = () => {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [threshold, setThreshold] = useState(70);
  const [statusFilter, setStatusFilter] = useState<BatchStatusFilter>('all');
  const [confidenceFilter, setConfidenceFilter] =
    useState<BatchConfidenceFilter>('all');
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [inputErrors, setInputErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const itemsRef = useRef(items);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      itemsRef.current.forEach((item) => {
        if (item.meta.source === 'upload') {
          URL.revokeObjectURL(item.src);
        }
      });
    };
  }, []);

  const patchItem = (id: string, patch: Partial<BatchItem>) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  /**
   * Selection handler: preserves raw File object, validates dimensions,
   * and queues items without immediate automatic execution.
   */
  const handleFiles = (files: File[]) => {
    if (isRunning || files.length === 0) return;
    const available = MAX_BATCH_ITEMS - itemsRef.current.length;
    if (available <= 0) {
      setInputErrors([
        `Queue limit reached (${MAX_BATCH_ITEMS} images). Remove an item before adding more.`,
      ]);
      return;
    }

    const errors: string[] = [];
    const accepted: File[] = [];

    files.slice(0, available).forEach((file) => {
      const validation = validateImageFile(file);
      if (validation.ok) {
        accepted.push(file);
      } else {
        errors.push(`${file.name}: ${validation.message}`);
      }
    });

    if (files.length > available) {
      errors.push(
        `Only ${available} more image${available === 1 ? '' : 's'} could be added because the queue limit is ${MAX_BATCH_ITEMS}.`,
      );
    }

    setInputErrors(errors);
    setNotice(
      accepted.length > 0
        ? `Added ${accepted.length} image${accepted.length === 1 ? '' : 's'} to the queue. Click "Run batch analysis" to process.`
        : null,
    );

    const newItems: BatchItem[] = accepted.map((file, index) => {
      const src = URL.createObjectURL(file);
      return {
        id: `batch-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
        src,
        seed: `batch:${file.name}:${file.size}:${file.lastModified}`,
        file, // Preserve raw File object for multipart batch transmission
        meta: {
          name: file.name,
          mimeType: file.type || 'image/unknown',
          sizeBytes: file.size,
          lastModified: file.lastModified,
          source: 'upload',
        },
        status: 'queued',
      };
    });

    setItems((current) => [...current, ...newItems]);

    newItems.forEach((item) => {
      readImageDimensions(item.src)
        .then((dimensions) => {
          if (!mountedRef.current) return;
          setItems((current) =>
            current.map((currentItem) =>
              currentItem.id === item.id
                ? {
                    ...currentItem,
                    meta: {
                      ...currentItem.meta,
                      width: dimensions.width,
                      height: dimensions.height,
                    },
                  }
                : currentItem,
            ),
          );
        })
        .catch(() => {
          if (!mountedRef.current) return;
          patchItem(item.id, {
            status: 'error',
            error: 'Image could not be decoded.',
          });
        });
    });
  };

  /**
   * Loads illustrative SVG benchmark assets into the queue.
   * Kept strictly separate as demonstration items.
   */
  const loadDemoSamples = () => {
    if (isRunning) return;
    const available = MAX_BATCH_ITEMS - itemsRef.current.length;
    if (available <= 0) {
      setInputErrors([
        `Queue limit reached (${MAX_BATCH_ITEMS} images). Remove an item before adding samples.`,
      ]);
      return;
    }

    const existingClassIds = new Set(
      itemsRef.current
        .map((item) => item.sampleClassId)
        .filter((classId): classId is string => Boolean(classId)),
    );
    const samples = SAMPLE_GALLERY.filter(
      (sample) => !existingClassIds.has(sample.classId),
    ).slice(0, Math.min(5, available));

    if (samples.length === 0) {
      setNotice('The illustrative demo samples are already in the queue.');
      return;
    }

    const sampleItems: BatchItem[] = samples.map((sample) => ({
      id: `sample-${sample.id}-${Date.now()}`,
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
      status: 'queued',
    }));

    setItems((current) => [...current, ...sampleItems]);
    setInputErrors([]);
    setNotice(
      `Added ${sampleItems.length} illustrative sample${sampleItems.length === 1 ? '' : 's'}. Demo assets are simulated locally.`,
    );
  };

  /**
   * Executes batch inference:
   * - Real uploaded files are sent in multipart to POST /api/v1/predict/batch
   * - Illustrative SVG demo samples are processed separately via simulation
   * - Prevents duplicate clicks while running
   */
  const runBatch = async () => {
    if (isRunning) return;
    const queuedItems = itemsRef.current.filter(
      (item) => item.status === 'queued',
    );
    if (queuedItems.length === 0) return;

    setIsRunning(true);
    setProgress(5);
    setInputErrors([]);
    setNotice(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Split queued items by source: uploaded files vs. illustrative demo assets
    const uploadedQueued = queuedItems.filter(
      (item) => item.meta.source === 'upload',
    );
    const sampleQueued = queuedItems.filter(
      (item) => item.meta.source === 'sample',
    );

    // Mark all target items as analyzing
    for (const item of queuedItems) {
      patchItem(item.id, { status: 'analyzing', error: undefined });
    }

    let completedUploadCount = 0;

    // 1. Process uploaded files with the real backend endpoint
    if (uploadedQueued.length > 0) {
      const filesToSend: File[] = [];
      const validUploadItems: BatchItem[] = [];

      for (const item of uploadedQueued) {
        if (item.file) {
          filesToSend.push(item.file);
          validUploadItems.push(item);
        } else {
          patchItem(item.id, {
            status: 'error',
            error: 'Missing original file reference.',
          });
        }
      }

      if (filesToSend.length > 0) {
        try {
          setProgress(20);
          const batchResponse = await predictBatch(
            filesToSend,
            controller.signal,
          );

          if (!mountedRef.current) return;
          setProgress(65);

          // Map server results back to corresponding batch items by index
          batchResponse.items.forEach((itemResult, idx) => {
            const batchItem = validUploadItems[idx];
            if (!batchItem) return;

            if (itemResult.status === 'success') {
              const realPrediction = mapBatchItemPrediction(
                itemResult,
                batchResponse.modelVersion,
                batchResponse.requestId,
              );
              patchItem(batchItem.id, {
                status: 'complete',
                prediction: realPrediction,
                error: undefined,
              });
              completedUploadCount += 1;
            } else if (itemResult.status === 'rejected') {
              patchItem(batchItem.id, {
                status: 'error',
                error:
                  itemResult.message ||
                  itemResult.errorCode ||
                  'Image rejected by server.',
              });
            } else if (itemResult.status === 'model_unavailable') {
              patchItem(batchItem.id, {
                status: 'error',
                error:
                  itemResult.message ||
                  'Prediction model is currently unavailable on backend.',
              });
            } else {
              patchItem(batchItem.id, {
                status: 'error',
                error: itemResult.message || 'Server inference error occurred.',
              });
            }
          });

          // Check overall batch status message
          if (batchResponse.status === 'rejected') {
            setInputErrors([
              batchResponse.message ||
                'All uploaded images were rejected by the backend.',
            ]);
          } else if (batchResponse.status === 'model_unavailable') {
            setInputErrors([
              batchResponse.message ||
                'No trained model is currently loaded on the backend.',
            ]);
          } else if (batchResponse.status === 'error') {
            setInputErrors([
              batchResponse.message ||
                'Inference error occurred on all uploaded images.',
            ]);
          }
        } catch (err: any) {
          if (!mountedRef.current) return;
          if (err instanceof DOMException && err.name === 'AbortError') return;

          const errorMsg =
            err.message ||
            'Failed to complete backend batch inference request.';
          for (const item of validUploadItems) {
            patchItem(item.id, {
              status: 'error',
              error: errorMsg,
            });
          }
          setInputErrors([errorMsg]);
        }
      }
    }

    // 2. Process illustrative demo samples separately
    let completedSampleCount = 0;
    if (sampleQueued.length > 0) {
      for (const sample of sampleQueued) {
        if (!mountedRef.current) return;
        await delay(DEMO_ANALYSIS_DELAY_MS);
        if (!mountedRef.current) return;
        patchItem(sample.id, {
          status: 'complete',
          prediction: generateDemoPrediction(sample.seed, sample.sampleClassId),
          error: undefined,
        });
        completedSampleCount += 1;
        const totalItems = queuedItems.length;
        const done = completedUploadCount + completedSampleCount;
        setProgress(Math.min(95, Math.round((done / totalItems) * 100)));
      }
    }

    if (!mountedRef.current) return;
    setProgress(100);
    setIsRunning(false);
    abortControllerRef.current = null;

    // User-facing summary notice
    if (uploadedQueued.length > 0 && sampleQueued.length > 0) {
      setNotice(
        `Batch complete: ${completedUploadCount} uploaded file${completedUploadCount === 1 ? '' : 's'} analyzed by MobileNetV2 backend; ${completedSampleCount} illustrative sample${completedSampleCount === 1 ? '' : 's'} simulated separately.`,
      );
    } else if (uploadedQueued.length > 0) {
      setNotice(
        `Backend batch analysis complete: ${completedUploadCount} of ${uploadedQueued.length} uploaded image${uploadedQueued.length === 1 ? '' : 's'} successfully classified by MobileNetV2.`,
      );
    } else if (sampleQueued.length > 0) {
      setNotice(
        `${completedSampleCount} illustrative sample asset${completedSampleCount === 1 ? '' : 's'} simulated. All sample scores are DEMO DATA.`,
      );
    }
  };

  const removeItem = (id: string) => {
    if (isRunning) return;
    const target = itemsRef.current.find((item) => item.id === id);
    if (target?.meta.source === 'upload') {
      URL.revokeObjectURL(target.src);
    }
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const confidence = confidenceOf(item);

      if (
        statusFilter === 'pending' &&
        item.status !== 'queued' &&
        item.status !== 'analyzing'
      ) {
        return false;
      }
      if (statusFilter === 'error' && item.status !== 'error') {
        return false;
      }
      if (
        statusFilter === 'review' &&
        !(
          item.status === 'complete' &&
          confidence !== null &&
          confidence < threshold
        )
      ) {
        return false;
      }
      if (
        statusFilter === 'confident' &&
        !(
          item.status === 'complete' &&
          confidence !== null &&
          confidence >= threshold
        )
      ) {
        return false;
      }

      if (confidenceFilter !== 'all') {
        if (confidence === null) return false;
        if (confidenceFilter === 'lt50' && confidence >= 50) return false;
        if (
          confidenceFilter === '50to70' &&
          (confidence < 50 || confidence >= 70)
        ) {
          return false;
        }
        if (
          confidenceFilter === '70to90' &&
          (confidence < 70 || confidence >= 90)
        ) {
          return false;
        }
        if (confidenceFilter === 'gte90' && confidence < 90) return false;
      }

      return true;
    });
  }, [items, statusFilter, confidenceFilter, threshold]);

  const queuedCount = items.filter((item) => item.status === 'queued').length;

  const clearFilters = () => {
    setStatusFilter('all');
    setConfidenceFilter('all');
  };

  /**
   * Exports batch classification records to CSV.
   * Accurately exports real backend MobileNetV2 results for uploads and
   * clearly marks illustrative demo rows as DEMO DATA.
   */
  const handleExportCsv = () => {
    if (filteredItems.length === 0) return;
    const headers = [
      'file_name',
      'source',
      'status',
      'predicted_class',
      'class_id',
      'crop',
      'top1_score_percent',
      'top5_scores',
      'needs_review',
      'review_threshold_percent',
      'latency_ms',
      'latency_type',
      'model_version',
      'error',
      'analysis_mode',
    ];

    const rows = filteredItems.map((item) => {
      const confidence = confidenceOf(item);
      const isDemo =
        item.prediction?.isDemo ?? (item.meta.source === 'sample');
      const latencyType = item.prediction
        ? isDemo
          ? 'simulated'
          : 'measured_inference'
        : '';
      const analysisMode = isDemo ? 'DEMO DATA' : 'REAL MODEL';
      const top5Summary = item.prediction
        ? item.prediction.classes
            .map((c) => `${c.label} (${(c.score * 100).toFixed(1)}%)`)
            .join('; ')
        : '';

      return [
        item.meta.name,
        item.meta.source,
        item.status,
        item.prediction?.top.label ?? '',
        item.prediction?.top.classId ?? '',
        item.prediction?.top.crop ?? '',
        confidence === null ? '' : confidence.toFixed(1),
        top5Summary,
        confidence === null ? '' : confidence < threshold ? 'yes' : 'no',
        String(threshold),
        item.prediction ? String(item.prediction.latencyMs) : '',
        latencyType,
        item.prediction?.modelVersion ?? '',
        item.error ?? '',
        analysisMode,
      ];
    });

    const hasRealInferences = filteredItems.some(
      (item) => item.prediction && !item.prediction.isDemo,
    );
    const prefix = hasRealInferences
      ? 'vistara-batch-analysis'
      : 'vistara-batch-demo';

    downloadCsv(
      `${prefix}-${new Date().toISOString().slice(0, 10)}.csv`,
      headers,
      rows,
    );
  };

  const hasRealInferences = items.some(
    (item) => item.prediction && !item.prediction.isDemo,
  );
  const hasDemoPredictions = items.some(
    (item) => item.prediction?.isDemo === true,
  );
  const hasMixedResults = hasRealInferences && hasDemoPredictions;
  const hasQueuedItems = items.some((item) => item.status === 'queued');
  const hasErrors = items.some((item) => item.status === 'error');
  const allItemsFailed = items.length > 0 && items.every((item) => item.status === 'error');

  const batchStatusLabel = isRunning
    ? 'ANALYZING'
    : hasMixedResults
      ? 'MIXED RESULTS'
      : hasRealInferences
        ? 'REAL INFERENCE'
        : hasDemoPredictions
          ? 'DEMO DATA'
          : allItemsFailed
            ? 'ANALYSIS ERROR'
            : hasQueuedItems
              ? 'READY TO ANALYZE'
              : items.length > 0 && hasErrors
                ? 'PARTIAL / ERRORS'
                : 'READY';

  return (
    <PageContainer
      title="Batch Analysis Queue"
      subtitle="High-throughput multi-image foliar screening with backend inference, uncertainty filters, and CSV export."
      badge={
        <span className="rounded border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 font-mono text-[11px] text-sky-600 dark:text-sky-400">
          Screen B
        </span>
      }
      actions={
        <>
          {batchStatusLabel === 'REAL INFERENCE' ? (
            <span className="rounded border border-teal-500/30 bg-teal-500/10 px-2.5 py-0.5 font-mono text-[11px] font-medium text-teal-600 dark:text-teal-400">
              {batchStatusLabel}
            </span>
          ) : (
            <DemoBadge label={batchStatusLabel} />
          )}
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredItems.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-sky-500/40 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-navy-800 dark:bg-navy-900 dark:text-slate-200 dark:hover:text-sky-300"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Export CSV</span>
          </button>
        </>
      }
    >
      {/* Contextual banner: distinguish queued uploads, real results, and simulated samples. */}
      {hasMixedResults ? (
        <div role="status" className="flex items-start gap-3 rounded-xl border border-sky-500/25 bg-sky-500/5 p-4 text-xs text-sky-900 dark:text-sky-200">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
          <div className="space-y-0.5">
            <span className="font-semibold">Mixed batch results</span>
            <p className="leading-relaxed">Uploaded photographs were processed by the FastAPI MobileNetV2 backend. Illustrative SVG samples were simulated locally; those sample scores are demo data.</p>
          </div>
        </div>
      ) : hasRealInferences ? (
        <div role="status" className="flex items-start gap-3 rounded-xl border border-teal-500/30 bg-teal-500/5 p-4 text-xs text-teal-900 dark:text-teal-200">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
          <div className="space-y-0.5">
            <span className="font-semibold">Backend Batch Inference Results</span>
            <p className="leading-relaxed text-teal-800/90 dark:text-teal-300/90">Successful uploaded-image predictions were produced by the FastAPI backend (<code>POST /api/v1/predict/batch</code>) using MobileNetV2. Illustrative SVG samples, if present, are simulated separately.</p>
          </div>
        </div>
      ) : hasDemoPredictions || items.some((item) => item.meta.source === 'sample') ? (
        <DemoBanner title="Illustrative demo samples">
          Gallery SVG assets are simulated locally. Their predictions and scores are
          demonstration data, not output from the trained MobileNetV2 model.
        </DemoBanner>
      ) : items.some((item) => item.meta.source === 'upload') ? (
        <div role="status" className="flex items-start gap-3 rounded-xl border border-sky-500/25 bg-sky-500/5 p-4 text-xs text-sky-900 dark:text-sky-200">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
          <div className="space-y-0.5">
            <span className="font-semibold">Uploaded images queued for analysis</span>
            <p className="leading-relaxed">Click &quot;Run batch analysis&quot; to send queued photographs to the FastAPI backend (<code>POST /api/v1/predict/batch</code>) for MobileNetV2 inference.</p>
          </div>
        </div>
      ) : null}

      {inputErrors.length > 0 && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div className="space-y-1">
            <div className="font-semibold">Notice regarding batch execution</div>
            <ul className="list-inside list-disc space-y-0.5">
              {inputErrors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
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

      <section className="space-y-3" aria-labelledby="batch-summary-heading">
        <div className="flex flex-wrap items-center gap-2">
          <h3
            id="batch-summary-heading"
            className="text-sm font-semibold text-slate-900 dark:text-white"
          >
            Batch Summary
          </h3>
          {hasMixedResults ? (
            <DemoBadge label="MIXED RESULTS" />
          ) : hasRealInferences ? (
            <span className="rounded border border-teal-500/30 bg-teal-500/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-teal-600 dark:text-teal-400">REAL INFERENCE</span>
          ) : hasDemoPredictions ? (
            <DemoBadge label="DEMO DATA" />
          ) : null}
        </div>
        <BatchKpis items={items} threshold={threshold} />
      </section>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-navy-800 dark:bg-navy-900">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Add Images to Queue
          </h3>
          <span className="font-mono text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {items.length} / {MAX_BATCH_ITEMS} items
          </span>
        </div>
        <FileDropzone
          id="batch-upload"
          title="Drag and drop multiple leaf photographs"
          description="or browse files from your device"
          hint="JPEG, PNG, or WEBP. Maximum 10 MB per file. Up to 24 images."
          multiple
          tone="sky"
          onFiles={handleFiles}
          disabled={isRunning}
        />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={runBatch}
            disabled={isRunning || queuedCount === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRunning ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>
              {isRunning
                ? 'Running batch analysis...'
                : `Run batch analysis${queuedCount > 0 ? ` (${queuedCount})` : ''}`}
            </span>
          </button>
          <button
            type="button"
            onClick={loadDemoSamples}
            disabled={isRunning}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-sky-500/40 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-navy-800 dark:bg-navy-950/40 dark:text-slate-200 dark:hover:text-sky-300"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Load illustrative samples</span>
          </button>
        </div>

        {isRunning && (
          <div className="mt-4" role="status" aria-live="polite">
            <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Batch analysis progress</span>
              <span className="font-mono">{progress}%</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-navy-950"
              role="progressbar"
              aria-label="Batch analysis progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <div
                className="h-full rounded-full bg-sky-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <p className="mt-3 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          Uploaded leaf images are sent to the FastAPI backend (
          <code>POST /api/v1/predict/batch</code>) for MobileNetV2 inference.
          Illustrative demo samples are generated SVG graphics processed locally.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-navy-800 dark:bg-navy-900">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Filters and Uncertainty Threshold
        </h3>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label
              htmlFor="batch-status-filter"
              className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              Status filter
            </label>
            <select
              id="batch-status-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as BatchStatusFilter)
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 dark:border-navy-800 dark:bg-navy-950/40 dark:text-slate-100"
            >
              <option value="all">All statuses</option>
              <option value="review">Needs review</option>
              <option value="confident">Confident</option>
              <option value="pending">Pending</option>
              <option value="error">Errors</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="batch-confidence-filter"
              className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              Score range
            </label>
            <select
              id="batch-confidence-filter"
              value={confidenceFilter}
              onChange={(event) =>
                setConfidenceFilter(event.target.value as BatchConfidenceFilter)
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 dark:border-navy-800 dark:bg-navy-950/40 dark:text-slate-100"
            >
              <option value="all">All score ranges</option>
              <option value="gte90">&ge; 90% score</option>
              <option value="70to90">70% to 90% score</option>
              <option value="50to70">50% to 70% score</option>
              <option value="lt50">&lt; 50% score</option>
            </select>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <label
                htmlFor="batch-threshold"
                className="font-medium text-slate-600 dark:text-slate-300"
              >
                Review threshold
              </label>
              <span className="font-mono text-slate-500 dark:text-slate-400">
                {threshold}%
              </span>
            </div>
            <input
              id="batch-threshold"
              type="range"
              min={40}
              max={95}
              step={1}
              value={threshold}
              onChange={(event) => setThreshold(Number(event.target.value))}
              className="w-full accent-sky-500"
            />
          </div>
        </div>

        {(statusFilter !== 'all' || confidenceFilter !== 'all') && (
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Showing {filteredItems.length} of {items.length} items
            </span>
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
            >
              <FilterX className="h-3 w-3" />
              <span>Clear filters</span>
            </button>
          </div>
        )}
      </div>

      <BatchTable
        items={filteredItems}
        threshold={threshold}
        disabled={isRunning}
        onRemove={removeItem}
      />
    </PageContainer>
  );
};
