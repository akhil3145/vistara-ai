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
import { EmptyState } from '../components/ui/EmptyState';
import { FileDropzone } from '../components/ui/FileDropzone';
import { SAMPLE_GALLERY } from '../data/sampleGallery';
import { downloadCsv } from '../lib/csv';
import { generateDemoPrediction } from '../lib/demoPredictions';
import { readImageDimensions, validateImageFile } from '../lib/imageUtils';
import type {
  BatchConfidenceFilter,
  BatchItem,
  BatchStatusFilter,
} from '../types/batch';

const MAX_BATCH_ITEMS = 24;
const DEMO_ANALYSIS_DELAY_MS = 320;

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

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
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
        ? `Added ${accepted.length} image${accepted.length === 1 ? '' : 's'} to the queue. Run the demo analysis to generate simulated results.`
        : null,
    );

    const newItems: BatchItem[] = accepted.map((file, index) => {
      const src = URL.createObjectURL(file);
      return {
        id: `batch-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
        src,
        seed: `batch:${file.name}:${file.size}:${file.lastModified}`,
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
      `Added ${sampleItems.length} illustrative sample${sampleItems.length === 1 ? '' : 's'}. Run the demo analysis to generate simulated results.`,
    );
  };

  const runBatch = async () => {
    if (isRunning) return;
    const queuedItems = itemsRef.current.filter(
      (item) => item.status === 'queued',
    );
    if (queuedItems.length === 0) return;

    setIsRunning(true);
    setProgress(0);
    setNotice(null);
    let completedCount = 0;

    for (const item of queuedItems) {
      if (!mountedRef.current) return;
      patchItem(item.id, { status: 'analyzing', error: undefined });
      await delay(DEMO_ANALYSIS_DELAY_MS);
      if (!mountedRef.current) return;
      if (!itemsRef.current.some((current) => current.id === item.id)) {
        continue;
      }
      patchItem(item.id, {
        status: 'complete',
        prediction: generateDemoPrediction(item.seed, item.sampleClassId),
        error: undefined,
      });
      completedCount += 1;
      setProgress(Math.round((completedCount / queuedItems.length) * 100));
    }

    if (!mountedRef.current) return;
    setProgress(100);
    setIsRunning(false);
    setNotice(
      `${completedCount} simulated analysis${completedCount === 1 ? '' : 'es'} complete. Every score shown is DEMO DATA.`,
    );
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
      'needs_review',
      'review_threshold_percent',
      'simulated_latency_ms',
      'model_version',
      'error',
      'analysis_mode',
    ];
    const rows = filteredItems.map((item) => {
      const confidence = confidenceOf(item);
      return [
        item.meta.name,
        item.meta.source,
        item.status,
        item.prediction?.top.label ?? '',
        item.prediction?.top.classId ?? '',
        item.prediction?.top.crop ?? '',
        confidence === null ? '' : confidence.toFixed(1),
        confidence === null ? '' : confidence < threshold ? 'yes' : 'no',
        String(threshold),
        item.prediction ? String(item.prediction.latencyMs) : '',
        item.prediction?.modelVersion ?? '',
        item.error ?? '',
        'DEMO DATA',
      ];
    });
    downloadCsv(
      `vistara-batch-demo-${new Date().toISOString().slice(0, 10)}.csv`,
      headers,
      rows,
    );
  };

  return (
    <PageContainer
      title="Batch Analysis Queue"
      subtitle="Multi-image foliar screening with simulated results, uncertainty filters, and CSV export."
      badge={
        <span className="rounded border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 font-mono text-[11px] text-sky-600 dark:text-sky-400">
          Screen B
        </span>
      }
      actions={
        <>
          <DemoBadge label="DEMO MODE" />
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
      <DemoBanner title="Simulated batch analysis">
        Batch processing runs entirely in the browser with deterministic DEMO
        DATA. No upload, model inference, or server request occurs. Every
        prediction, score, and latency is simulated for interface review.
      </DemoBanner>

      {inputErrors.length > 0 && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div className="space-y-1">
            <div className="font-semibold">Some files were not added</div>
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
          <DemoBadge label="DEMO DATA" />
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
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRunning ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>
              {isRunning
                ? 'Running demo analysis'
                : `Run demo analysis${queuedCount > 0 ? ` (${queuedCount})` : ''}`}
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
              <span>Simulated analysis progress</span>
              <span className="font-mono">{progress}%</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-navy-950"
              role="progressbar"
              aria-label="Simulated batch analysis progress"
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
          Files are read locally for thumbnails and metadata only. The demo
          samples are generated SVG illustrations, not photographs.
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
              Confidence band
            </label>
            <select
              id="batch-confidence-filter"
              value={confidenceFilter}
              onChange={(event) =>
                setConfidenceFilter(event.target.value as BatchConfidenceFilter)
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 dark:border-navy-800 dark:bg-navy-950/40 dark:text-slate-100"
            >
              <option value="all">All confidence bands</option>
              <option value="lt50">Below 50%</option>
              <option value="50to70">50% to 69.9%</option>
              <option value="70to90">70% to 89.9%</option>
              <option value="gte90">90% and above</option>
            </select>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <label
                htmlFor="batch-review-threshold"
                className="text-xs font-medium text-slate-600 dark:text-slate-300"
              >
                Review threshold
              </label>
              <output
                htmlFor="batch-review-threshold"
                className="font-mono text-xs text-sky-600 dark:text-sky-400"
              >
                {threshold}%
              </output>
            </div>
            <input
              id="batch-review-threshold"
              type="range"
              min={40}
              max={95}
              step={5}
              value={threshold}
              onChange={(event) => setThreshold(Number(event.target.value))}
              aria-describedby="uncertainty-help"
              className="w-full accent-sky-500"
            />
          </div>
        </div>
        <p
          id="uncertainty-help"
          className="mt-3 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400"
        >
          Uncertainty here is defined as 1 minus the simulated top-1 class
          score. Rows whose score falls below the review threshold are flagged
          as <strong>Needs review</strong>. These demo scores are uncalibrated
          and do not represent diagnostic confidence.
        </p>
      </div>

      {items.length > 0 && filteredItems.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-navy-800 dark:bg-navy-900">
          <EmptyState
            icon={FilterX}
            title="No records match the current filters"
            description="Adjust the status, confidence band, or review threshold to see batch rows."
            action={
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-sky-500/40 hover:text-sky-700 dark:border-navy-800 dark:text-slate-200 dark:hover:text-sky-300"
              >
                Clear filters
              </button>
            }
          />
        </div>
      ) : (
        <BatchTable
          items={filteredItems}
          threshold={threshold}
          onRemove={removeItem}
          disabled={isRunning}
        />
      )}
    </PageContainer>
  );
};
