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
    <section className="table-shell">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3.5 sm:px-5">
        <div>
          <h3 className="text-sm font-semibold text-ink">Batch records</h3>
          <p className="text-[10px] text-faint">
            Per-item classification outcomes. CSV export follows the active
            filters.
          </p>
        </div>
        {items.some((item) => item.prediction && !item.prediction.isDemo) ? (
          <span className="chip chip-accent font-mono">REAL INFERENCE</span>
        ) : (
          <DemoBadge label="DEMO DATA" />
        )}
      </div>

      {items.length === 0 ? (
        <div className="p-4">
          <EmptyState
            icon={UploadCloud}
            title="No images in this view"
            description="Add JPEG, PNG, or WEBP images with the dropzone above, or load the illustrative demo samples. If records exist, check your active filters."
            hint="Uploaded leaves are analyzed live at POST /api/v1/predict/batch."
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-xs">
            <caption className="sr-only">
              Batch analysis records with prediction source and confidence
              details.
            </caption>
            <thead className="table-head">
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
            <tbody className="divide-y divide-line/70">
              {items.map((item) => {
                const confidence = confidenceOf(item);
                const needsReview =
                  confidence !== null && confidence < threshold;

                return (
                  <tr
                    key={item.id}
                    className="group align-middle transition-colors hover:bg-raised/[0.28]"
                  >
                    <td className="px-4 py-2.5">
                      <div className="h-10 w-10 overflow-hidden rounded-lg border border-line bg-base">
                        <img
                          src={item.src}
                          alt={`Preview of ${item.meta.name}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </td>

                    <td className="max-w-[210px] px-4 py-2.5">
                      <div
                        className="truncate text-[11px] font-medium text-ink"
                        title={item.meta.name}
                      >
                        {item.meta.name}
                      </div>
                      <div className="mt-0.5 text-[9.5px] text-faint">
                        {item.meta.source === 'upload'
                          ? 'Local upload'
                          : 'Illustrative sample'}
                        {item.meta.sizeBytes !== undefined
                          ? ` · ${formatBytes(item.meta.sizeBytes)}`
                          : ''}
                      </div>
                    </td>

                    <td className="max-w-[250px] px-4 py-2.5">
                      {item.status === 'complete' && item.prediction ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className="max-w-[180px] truncate text-[11px] text-muted"
                            title={item.prediction.classes
                              .map(
                                (c, i) =>
                                  `${i + 1}. ${c.label}: ${(c.score * 100).toFixed(1)}%`,
                              )
                              .join('\n')}
                          >
                            {item.prediction.top.label}
                          </span>
                          {item.prediction.isDemo ? (
                            <DemoBadge label="DEMO" />
                          ) : (
                            <span className="rounded border border-accent/30 bg-accent/10 px-1 py-0.5 font-mono text-[8px] font-semibold text-accent">
                              REAL
                            </span>
                          )}
                        </div>
                      ) : item.status === 'error' ? (
                        <span
                          className="text-[11px] text-danger"
                          title={item.error}
                        >
                          {item.error ?? 'Analysis error'}
                        </span>
                      ) : item.status === 'analyzing' ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-cyan">
                          <Loader2
                            className="h-3.5 w-3.5 animate-spin"
                            aria-hidden="true"
                          />
                          {item.meta.source === 'upload'
                            ? 'Analyzing via API'
                            : 'Running demo'}
                        </span>
                      ) : (
                        <span className="text-[11px] text-faint">Queued</span>
                      )}
                    </td>

                    <td className="px-4 py-2.5">
                      {confidence === null ? (
                        <span className="text-faint">—</span>
                      ) : (
                        <div className="w-24">
                          <div className="flex items-center justify-between font-mono text-[10px] text-muted">
                            <span>{confidence.toFixed(1)}%</span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-base/70">
                            <div
                              className={`h-full rounded-full ${
                                needsReview
                                  ? 'bg-warning'
                                  : 'bg-gradient-to-r from-accent to-lime'
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
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[9px] ${
                            needsReview
                              ? 'border-warning/30 bg-warning/10 text-warning'
                              : 'border-lime/30 bg-lime/10 text-lime'
                          }`}
                        >
                          {needsReview ? 'Needs review' : 'Confident'}
                        </span>
                      ) : item.status === 'error' ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-danger/30 bg-danger/10 px-2 py-0.5 font-mono text-[9px] text-danger">
                          <AlertTriangle className="h-2.5 w-2.5" aria-hidden="true" />
                          Error
                        </span>
                      ) : item.status === 'analyzing' ? (
                        <span className="rounded-full border border-cyan/30 bg-cyan/10 px-2 py-0.5 font-mono text-[9px] text-cyan">
                          Analyzing
                        </span>
                      ) : (
                        <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[9px] text-faint">
                          Queued
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-2.5 font-mono text-[10px] text-muted">
                      {item.prediction ? (
                        <span
                          title={
                            item.prediction.isDemo
                              ? 'Simulated demo latency'
                              : 'Server-measured inference latency'
                          }
                        >
                          {item.prediction.latencyMs} ms
                        </span>
                      ) : (
                        <span className="text-faint">—</span>
                      )}
                    </td>

                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => onRemove(item.id)}
                        disabled={disabled}
                        aria-label={`Remove ${item.meta.name} from batch`}
                        className="inline-flex items-center justify-center rounded-md border border-transparent p-1.5 text-faint transition-colors hover:border-danger/30 hover:bg-danger/10 hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
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
    </section>
  );
};
