import React from 'react';
import { AlertTriangle, Loader2, Trash2, UploadCloud } from 'lucide-react';
import { DemoBadge } from '../ui/DemoBadge';
import { EmptyState } from '../ui/EmptyState';
import { formatBytes } from '../../lib/imageUtils';
import type { BatchItem } from '../../types/batch';

interface BatchTableProps {
  items: BatchItem[];
  threshold: number;
  disabled?: boolean;
  onRemove: (id: string) => void;
}

const confidenceOf = (item: BatchItem): number | null =>
  item.prediction ? item.prediction.top.score * 100 : null;

export const BatchTable: React.FC<BatchTableProps> = ({
  items,
  threshold,
  disabled = false,
  onRemove,
}) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-navy-800 dark:bg-navy-900">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 dark:border-navy-800">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Batch Records
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Per-item simulated outcomes. CSV export follows the filters below.
          </p>
        </div>
        <DemoBadge label="DEMO DATA" />
      </div>

      {items.length === 0 ? (
        <div className="p-4">
          <EmptyState
            icon={UploadCloud}
            title="No images in the batch"
            description="Add JPEG, PNG, or WEBP images with the dropzone above, or load the illustrative demo samples."
            hint="No files leave the browser in this phase."
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-xs">
            <caption className="sr-only">
              Batch analysis records with simulated predictions. All results are
              DEMO DATA.
            </caption>
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 dark:bg-navy-950/60 dark:text-slate-400">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Image
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  File
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Prediction
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Score
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Status
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Latency
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
              {items.map((item) => {
                const confidence = confidenceOf(item);
                const needsReview =
                  confidence !== null && confidence < threshold;

                return (
                  <tr
                    key={item.id}
                    className="align-middle transition-colors hover:bg-slate-50/70 dark:hover:bg-navy-850/40"
                  >
                    <td className="px-4 py-2.5">
                      <div className="h-11 w-11 overflow-hidden rounded-md border border-slate-200 bg-slate-100 dark:border-navy-800 dark:bg-navy-950">
                        <img
                          src={item.src}
                          alt={`Preview of ${item.meta.name}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="max-w-[210px] px-4 py-2.5">
                      <div
                        className="truncate font-medium text-slate-900 dark:text-white"
                        title={item.meta.name}
                      >
                        {item.meta.name}
                      </div>
                      <div className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                        {item.meta.source === 'upload' ? 'Local upload' : 'Illustrative sample'}
                        {item.meta.sizeBytes !== undefined
                          ? ` · ${formatBytes(item.meta.sizeBytes)}`
                          : ''}
                      </div>
                    </td>
                    <td className="max-w-[250px] px-4 py-2.5">
                      {item.status === 'complete' && item.prediction ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="max-w-[190px] truncate text-slate-700 dark:text-slate-200">
                            {item.prediction.top.label}
                          </span>
                          <DemoBadge label="DEMO" />
                        </div>
                      ) : item.status === 'error' ? (
                        <span
                          className="text-rose-600 dark:text-rose-400"
                          title={item.error}
                        >
                          {item.error ?? 'Analysis error'}
                        </span>
                      ) : item.status === 'analyzing' ? (
                        <span className="inline-flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
                          <Loader2
                            className="h-3.5 w-3.5 animate-spin"
                            aria-hidden="true"
                          />
                          Running demo
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">
                          Queued
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {confidence === null ? (
                        <span className="text-slate-400 dark:text-slate-500">—</span>
                      ) : (
                        <div className="w-24">
                          <div className="flex items-center justify-between font-mono text-[11px] text-slate-600 dark:text-slate-300">
                            <span>{confidence.toFixed(1)}%</span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-navy-950">
                            <div
                              className={`h-full rounded-full ${
                                needsReview ? 'bg-amber-500' : 'bg-teal-500'
                              }`}
                              style={{ width: `${confidence}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {item.status === 'complete' ? (
                        <span
                          className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] ${
                            needsReview
                              ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                          }`}
                        >
                          {needsReview ? 'Needs review' : 'Confident'}
                        </span>
                      ) : item.status === 'error' ? (
                        <span className="inline-flex items-center gap-1 rounded border border-rose-500/30 bg-rose-500/10 px-1.5 py-0.5 font-mono text-[10px] text-rose-700 dark:text-rose-300">
                          <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                          Error
                        </span>
                      ) : item.status === 'analyzing' ? (
                        <span className="font-mono text-[10px] text-sky-600 dark:text-sky-400">
                          Analyzing
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                          Queued
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      {item.prediction ? (
                        <span title="Simulated latency">
                          {item.prediction.latencyMs} ms
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => onRemove(item.id)}
                        disabled={disabled}
                        aria-label={`Remove ${item.meta.name} from batch`}
                        className="inline-flex items-center justify-center rounded-md border border-transparent p-1.5 text-slate-400 transition-colors hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
