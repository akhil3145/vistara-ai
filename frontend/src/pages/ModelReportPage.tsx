import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Cpu,
  FileJson,
  FileText,
  RefreshCw,
  ShieldCheck,
  Table2,
  Target,
  TrendingUp,
} from 'lucide-react';

import { getModelReport } from '../services/modelReportService';
import type {
  ClassMetrics,
  EvaluationReport,
  ModelReportResponse,
} from '../services/modelReportService';

import { PageContainer } from '../components/layout/PageContainer';
import { StatCard } from '../components/ui/StatCard';

type ClassRow = {
  name: string;
  precision: number;
  recall: number;
  f1: number;
  support: number;
};

const isClassMetrics = (value: unknown): value is ClassMetrics => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const metrics = value as Record<string, unknown>;

  return (
    typeof metrics.precision === 'number' &&
    typeof metrics.recall === 'number' &&
    typeof metrics['f1-score'] === 'number' &&
    typeof metrics.support === 'number'
  );
};

const formatPercent = (value?: number | null) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '—';
  }

  return `${(value * 100).toFixed(2)}%`;
};

const formatNumber = (value?: number | null) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '—';
  }

  return value.toLocaleString();
};

const formatDate = (value?: string | null) => {
  if (!value) return 'Not provided';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

const getMetric = (
  metrics: EvaluationReport['metrics'] | undefined,
  key: keyof NonNullable<EvaluationReport['metrics']>,
) => {
  const value = metrics?.[key];
  return typeof value === 'number' ? value : undefined;
};

export function ModelReportPage() {
  const [data, setData] = useState<ModelReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadReport = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await getModelReport(signal);

      if (!signal?.aborted) {
        setData(response);
      }
    } catch (err) {
      if (!signal?.aborted) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load the model evaluation report.',
        );
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void loadReport(controller.signal);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadReport, refreshKey]);

  const report = data?.report;

  const classRows = useMemo(() => {
    if (!report?.classification_report) return [];

    const rows: ClassRow[] = [];

    for (const [name, raw] of Object.entries(
      report.classification_report,
    )) {
      if (!name.includes('___') || !isClassMetrics(raw)) {
        continue;
      }

      rows.push({
        name,
        precision: raw.precision,
        recall: raw.recall,
        f1: raw['f1-score'],
        support: raw.support,
      });
    }

    return rows.sort((a, b) => a.name.localeCompare(b.name));
  }, [report]);

  const metrics = report?.metrics;

  const artifactFiles = data?.artifacts?.expectedFiles ?? [];
  const foundFiles = data?.artifacts?.foundFiles ?? [];
  const missingFiles = data?.artifacts?.missingFiles ?? [];

  const artifactReady =
    data?.artifacts?.evaluationReportPresent === true &&
    missingFiles.length === 0;

  const artifactRatio =
    artifactFiles.length > 0
      ? Math.round((foundFiles.length / artifactFiles.length) * 100)
      : 0;

  const metricCards = [
    {
      label: 'Test accuracy',
      value: formatPercent(getMetric(metrics, 'accuracy')),
      description: 'Overall correct predictions on the reported test set.',
      icon: Target,
      tone: 'teal' as const,
    },
    {
      label: 'Macro precision',
      value: formatPercent(getMetric(metrics, 'macro_precision')),
      description: 'Unweighted average precision across classes.',
      icon: BarChart3,
      tone: 'sky' as const,
    },
    {
      label: 'Macro recall',
      value: formatPercent(getMetric(metrics, 'macro_recall')),
      description: 'Unweighted average recall across classes.',
      icon: TrendingUp,
      tone: 'purple' as const,
    },
    {
      label: 'Macro F1 score',
      value: formatPercent(getMetric(metrics, 'macro_f1')),
      description: 'Unweighted average F1 across classes.',
      icon: CheckCircle2,
      tone: 'emerald' as const,
    },
    {
      label: 'Weighted F1 score',
      value: formatPercent(getMetric(metrics, 'weighted_f1')),
      description: 'F1 weighted by each class support.',
      icon: CheckCircle2,
      tone: 'amber' as const,
    },
    {
      label: 'Test loss',
      value:
        typeof metrics?.test_loss === 'number'
          ? metrics.test_loss.toFixed(4)
          : '—',
      description: 'Reported loss on the test dataset.',
      icon: AlertCircle,
      tone: 'slate' as const,
    },
  ];

  return (
    <PageContainer
      eyebrow="Model evaluation · offline report"
      title="Model Evaluation Report"
      subtitle="Held-out test metrics, per-class performance, and model artifact availability."
      badge={
        data ? (
          <span
            className={`chip ${
              data.status === 'available' ? 'chip-lime' : 'chip-warning'
            } font-mono`}
          >
            {data.status}
          </span>
        ) : undefined
      }
      actions={
        <button
          type="button"
          onClick={() => {
            setError(null);
            setLoading(true);
            setRefreshKey((current) => current + 1);
          }}
          disabled={loading}
          className="btn-secondary"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh report
        </button>
      }
    >
      <div className="space-y-5">
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-danger/25 bg-danger/[0.06] p-4">
            <AlertCircle className="mt-0.5 shrink-0 text-danger" size={18} />
            <div>
              <p className="text-sm font-semibold text-danger">
                Could not load evaluation report
              </p>
              <p className="mt-1 text-xs text-muted">{error}</p>
            </div>
          </div>
        )}

        {loading && !data && (
          <div className="flex items-center gap-3 rounded-xl border border-line bg-panel p-6 text-sm text-muted">
            <RefreshCw className="h-4 w-4 animate-spin text-accent" />
            Loading model evaluation report...
          </div>
        )}

        {!loading && !error && !data && (
          <div className="rounded-xl border border-line bg-panel p-6 text-center text-sm text-muted">
            No report data is currently available.
          </div>
        )}

        {data && (
          <>
            {/* Status hero */}
            <section className="relative overflow-hidden rounded-2xl border border-line bg-panel p-5 shadow-panel">
              <div className="pointer-events-none absolute inset-0 bg-hero-spot opacity-60" />
              <div className="relative flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-accent/25 bg-accent/10">
                    <ShieldCheck className="text-accent" size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-ink">
                      {data.status === 'available'
                        ? 'Evaluation report loaded'
                        : 'Evaluation report unavailable'}
                    </h2>
                    <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-muted">
                      {data.message ?? 'Report status returned by backend.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {report?.model_name && (
                    <span className="chip">
                      <Cpu className="h-3 w-3 text-accent" />
                      {report.model_name}
                    </span>
                  )}
                  {report?.dataset && (
                    <span className="chip">{report.dataset}</span>
                  )}
                  <span className="chip">Generated {formatDate(data.generatedAt)}</span>
                </div>
              </div>
            </section>

            {report && (
              <>
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {metricCards.map((metric) => (
                    <StatCard
                      key={metric.label}
                      label={metric.label}
                      value={metric.value}
                      hint={metric.description}
                      icon={metric.icon}
                      tone={metric.tone}
                    />
                  ))}
                </section>

                {/* Model info */}
                <section className="panel p-4 sm:p-5">
                  <div className="mb-4 flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan/25 bg-cyan/10">
                      <FileText className="text-cyan" size={15} />
                    </span>
                    <div>
                      <h2 className="text-sm font-semibold text-ink">
                        Model information
                      </h2>
                      <p className="text-[10px] text-faint">
                        Reported configuration and evaluation scope
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                    <InfoItem label="Model" value={report.model_name ?? '—'} />
                    <InfoItem
                      label="Architecture"
                      value={report.architecture ?? '—'}
                    />
                    <InfoItem label="Dataset" value={report.dataset ?? '—'} />
                    <InfoItem
                      label="Dataset version"
                      value={report.dataset_version ?? '—'}
                    />
                    <InfoItem
                      label="Number of classes"
                      value={formatNumber(report.num_classes)}
                    />
                    <InfoItem
                      label="Test samples"
                      value={formatNumber(report.test_samples)}
                    />
                    <InfoItem
                      label="Input image size"
                      value={
                        report.image_size?.length
                          ? `${report.image_size[0]} × ${report.image_size[1]}`
                          : '—'
                      }
                    />
                    <InfoItem
                      label="Report generated"
                      value={formatDate(data.generatedAt)}
                    />
                    <InfoItem
                      label="Per-class results"
                      value={`${classRows.length} classes`}
                    />
                  </div>
                </section>

                {/* Per-class table */}
                <section className="table-shell">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3.5 sm:px-5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-accent/25 bg-accent/10">
                        <Table2 className="text-accent" size={15} />
                      </span>
                      <div>
                        <h2 className="text-sm font-semibold text-ink">
                          Per-class performance
                        </h2>
                        <p className="text-[10px] text-faint">
                          Precision, recall, and F1 by target class
                        </p>
                      </div>
                    </div>
                    <span className="chip">{classRows.length} classes</span>
                  </div>

                  {classRows.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[680px] text-left text-xs">
                        <thead className="table-head">
                          <tr>
                            <th className="px-4 py-2.5 font-medium">Class</th>
                            <th className="px-4 py-2.5 text-right font-medium">
                              Precision
                            </th>
                            <th className="px-4 py-2.5 text-right font-medium">
                              Recall
                            </th>
                            <th className="px-4 py-2.5 text-right font-medium">
                              F1 score
                            </th>
                            <th className="px-4 py-2.5 text-right font-medium">
                              Support
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line/70">
                          {classRows.map((row) => (
                            <tr
                              key={row.name}
                              className="transition-colors hover:bg-raised/[0.28]"
                            >
                              <td className="px-4 py-2.5 text-[11px] font-medium text-ink">
                                {row.name.replaceAll('___', ' / ')}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono text-[10px] text-muted">
                                {formatPercent(row.precision)}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono text-[10px] text-muted">
                                {formatPercent(row.recall)}
                              </td>
                              <td className="px-4 py-2.5">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-base/70 sm:block">
                                    <div
                                      className="h-full rounded-full bg-gradient-to-r from-accent to-lime"
                                      style={{
                                        width: `${Math.min(100, row.f1 * 100)}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="w-14 text-right font-mono text-[10px] text-ink">
                                    {formatPercent(row.f1)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono text-[10px] text-faint">
                                {formatNumber(row.support)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="py-8 text-center text-xs text-muted">
                      No per-class metrics found in the evaluation report.
                    </p>
                  )}
                </section>
              </>
            )}

            {/* Artifacts */}
            <section className="panel p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-lime/25 bg-lime/10">
                    <FileJson className="text-lime" size={15} />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-ink">
                      Model artifact status
                    </h2>
                    <p className="text-[10px] text-faint">
                      Expected evaluation and model bundle files
                    </p>
                  </div>
                </div>

                <span
                  className={`chip ${artifactReady ? 'chip-lime' : 'chip-warning'}`}
                >
                  {artifactReady ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <AlertCircle className="h-3 w-3" />
                  )}
                  {foundFiles.length} of {artifactFiles.length} found
                </span>
              </div>

              <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-base/70">
                <div
                  className={`h-full rounded-full transition-all ${
                    artifactReady
                      ? 'bg-gradient-to-r from-lime to-accent'
                      : 'bg-warning'
                  }`}
                  style={{ width: `${artifactRatio}%` }}
                />
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {artifactFiles.map((file) => {
                  const found = foundFiles.includes(file);

                  return (
                    <div
                      key={file}
                      className="flex items-center justify-between gap-3 rounded-lg border border-line bg-base/30 px-3 py-2.5"
                    >
                      <span className="break-all font-mono text-[10px] text-muted">
                        {file}
                      </span>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[8.5px] ${
                          found
                            ? 'border-lime/30 bg-lime/10 text-lime'
                            : 'border-danger/30 bg-danger/10 text-danger'
                        }`}
                      >
                        {found ? 'Found' : 'Missing'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {missingFiles.length > 0 && (
                <p className="mt-3 break-words text-[10px] text-warning">
                  Missing: {missingFiles.join(', ')}
                </p>
              )}
            </section>

            {/* Limitations */}
            <section className="rounded-2xl border border-warning/20 bg-warning/[0.045] p-4 sm:p-5">
              <div className="mb-3 flex items-center gap-2">
                <AlertCircle className="text-warning" size={17} />
                <h2 className="text-sm font-semibold text-warning">
                  Evaluation limitations
                </h2>
              </div>

              <ul className="space-y-2 pl-5 text-[11px] leading-relaxed text-muted">
                <li className="list-disc">
                  Metrics are reported from the supplied held-out test
                  evaluation artifact; this page does not independently
                  reproduce the training or evaluation process.
                </li>
                <li className="list-disc">
                  Softmax scores are not necessarily calibrated probabilities
                  and should not be interpreted as guaranteed confidence.
                </li>
                <li className="list-disc">
                  A confusion matrix and training curves are not included in
                  the available evaluation report.
                </li>
                <li className="list-disc">
                  Predictions are decision-support outputs, not definitive
                  agricultural diagnoses.
                </li>
              </ul>
            </section>
          </>
        )}
      </div>
    </PageContainer>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line/60 bg-base/25 px-3 py-2.5">
      <p className="mb-1 text-[9px] uppercase tracking-[0.1em] text-faint">
        {label}
      </p>
      <p className="break-words text-[11px] font-medium text-ink">{value}</p>
    </div>
  );
}
