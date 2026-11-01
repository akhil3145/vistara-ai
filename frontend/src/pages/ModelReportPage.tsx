
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileJson,
  FileText,
  RefreshCw,
  ShieldCheck,
  Table2,
} from 'lucide-react';

import { getModelReport } from '../services/modelReportService';
import type {
  ClassMetrics,
  EvaluationReport,
  ModelReportResponse,
} from '../services/modelReportService';

import { PageContainer } from '../components/layout/PageContainer';

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
      setError(null);

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

    void loadReport(controller.signal);

    return () => controller.abort();
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

  const metricCards = [
    {
      label: 'Test Accuracy',
      value: formatPercent(getMetric(metrics, 'accuracy')),
      description: 'Overall correct predictions on the reported test set.',
      tone: 'teal' as const,
    },
    {
      label: 'Macro Precision',
      value: formatPercent(getMetric(metrics, 'macro_precision')),
      description: 'Unweighted average precision across classes.',
      tone: 'sky' as const,
    },
    {
      label: 'Macro Recall',
      value: formatPercent(getMetric(metrics, 'macro_recall')),
      description: 'Unweighted average recall across classes.',
      tone: 'purple' as const,
    },
    {
      label: 'Macro F1 Score',
      value: formatPercent(getMetric(metrics, 'macro_f1')),
      description: 'Unweighted average F1 across classes.',
      tone: 'emerald' as const,
    },
    {
      label: 'Weighted F1 Score',
      value: formatPercent(getMetric(metrics, 'weighted_f1')),
      description: 'F1 weighted by each class support.',
      tone: 'amber' as const,
    },
    {
      label: 'Test Loss',
      value:
        typeof metrics?.test_loss === 'number'
          ? metrics.test_loss.toFixed(4)
          : '—',
      description: 'Reported loss on the test dataset.',
      tone: 'slate' as const,
    },
  ];

  return (
    <PageContainer
      title="Model Evaluation Report"
      actions={
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            setRefreshKey((current) => current + 1);
          }}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            className={loading ? 'animate-spin' : ''}
          />
          Refresh report
        </button>
      }
    >
      <div className="space-y-6">
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
            <AlertCircle className="mt-0.5 shrink-0 text-rose-400" size={19} />
            <div>
              <p className="font-medium text-rose-300">
                Could not load evaluation report
              </p>
              <p className="mt-1 text-sm text-slate-400">{error}</p>
            </div>
          </div>
        )}

        {loading && !data && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center text-sm text-slate-400">
            Loading model evaluation report...
          </div>
        )}

        {!loading && !error && !data && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center text-sm text-slate-400">
            No report data is currently available.
          </div>
        )}

        {data && (
          <>
            <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-teal-500/10 p-3">
                    <ShieldCheck className="text-teal-400" size={22} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-100">
                      {data.status === 'available'
                        ? 'Evaluation report loaded'
                        : 'Evaluation report unavailable'}
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      {data.message ?? 'Report status returned by backend.'}
                    </p>
                  </div>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    data.status === 'available'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-amber-500/10 text-amber-400'
                  }`}
                >
                  {data.status}
                </span>
              </div>
            </section>

            {report && (
              <>
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
  {metricCards.map((metric) => (
    <div
      key={metric.label}
      className="rounded-xl border border-slate-800 bg-slate-900/50 p-5"
    >
      <p className="text-sm text-slate-400">{metric.label}</p>

      <p className="mt-3 text-2xl font-semibold text-slate-100">
        {metric.value}
      </p>

      <p className="mt-2 text-xs leading-relaxed text-slate-500">
        {metric.description}
      </p>
    </div>
  ))}
</section>

                <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                  <div className="mb-5 flex items-center gap-2">
                    <FileText className="text-teal-400" size={19} />
                    <h2 className="font-semibold text-slate-100">
                      Model information
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    <InfoItem
                      label="Model"
                      value={report.model_name ?? '—'}
                    />
                    <InfoItem
                      label="Architecture"
                      value={report.architecture ?? '—'}
                    />
                    <InfoItem
                      label="Dataset"
                      value={report.dataset ?? '—'}
                    />
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

                <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Table2 className="text-teal-400" size={19} />
                      <h2 className="font-semibold text-slate-100">
                        Per-class performance
                      </h2>
                    </div>
                    <span className="text-xs text-slate-400">
                      {classRows.length} classes
                    </span>
                  </div>

                  {classRows.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[680px] text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-500">
                            <th className="px-3 py-3 font-medium">Class</th>
                            <th className="px-3 py-3 text-right font-medium">
                              Precision
                            </th>
                            <th className="px-3 py-3 text-right font-medium">
                              Recall
                            </th>
                            <th className="px-3 py-3 text-right font-medium">
                              F1 Score
                            </th>
                            <th className="px-3 py-3 text-right font-medium">
                              Support
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {classRows.map((row) => (
                            <tr
                              key={row.name}
                              className="border-b border-slate-800/70 last:border-0 hover:bg-slate-800/30"
                            >
                              <td className="px-3 py-3 font-medium text-slate-200">
                                {row.name.replaceAll('___', ' / ')}
                              </td>
                              <td className="px-3 py-3 text-right tabular-nums text-slate-300">
                                {formatPercent(row.precision)}
                              </td>
                              <td className="px-3 py-3 text-right tabular-nums text-slate-300">
                                {formatPercent(row.recall)}
                              </td>
                              <td className="px-3 py-3 text-right tabular-nums text-slate-300">
                                {formatPercent(row.f1)}
                              </td>
                              <td className="px-3 py-3 text-right tabular-nums text-slate-400">
                                {formatNumber(row.support)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="py-6 text-center text-sm text-slate-400">
                      No per-class metrics found in the evaluation report.
                    </p>
                  )}
                </section>
              </>
            )}

            <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <div className="mb-4 flex items-center gap-2">
                <FileJson className="text-teal-400" size={19} />
                <h2 className="font-semibold text-slate-100">
                  Model artifact status
                </h2>
              </div>

              <div className="mb-4 flex items-center gap-2">
                {artifactReady ? (
                  <CheckCircle2 className="text-emerald-400" size={18} />
                ) : (
                  <AlertCircle className="text-amber-400" size={18} />
                )}
                <span className="text-sm text-slate-300">
                  {foundFiles.length} of {artifactFiles.length} expected artifacts found
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {artifactFiles.map((file) => {
                  const found = foundFiles.includes(file);

                  return (
                    <div
                      key={file}
                      className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 px-3 py-3"
                    >
                      <span className="break-all text-sm text-slate-300">
                        {file}
                      </span>
                      <span
                        className={`shrink-0 text-xs ${
                          found ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {found ? 'Found' : 'Missing'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {missingFiles.length > 0 && (
                <p className="mt-3 text-sm text-amber-400">
                  Missing: {missingFiles.join(', ')}
                </p>
              )}
            </section>

            <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
              <div className="mb-2 flex items-center gap-2">
                <AlertCircle className="text-amber-400" size={18} />
                <h2 className="font-semibold text-slate-100">
                  Evaluation limitations
                </h2>
              </div>

              <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-400">
                <li>
                  Metrics are reported from the supplied held-out test
                  evaluation artifact; this page does not independently
                  reproduce the training or evaluation process.
                </li>
                <li>
                  Softmax scores are not necessarily calibrated probabilities
                  and should not be interpreted as guaranteed confidence.
                </li>
                <li>
                  A confusion matrix and training curves are not included in
                  the available evaluation report.
                </li>
                <li>
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
    <div>
      <p className="mb-1 text-xs text-slate-500">{label}</p>
      <p className="break-words text-sm font-medium text-slate-200">
        {value}
      </p>
    </div>
  );
}
