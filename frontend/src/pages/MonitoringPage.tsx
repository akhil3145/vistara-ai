
import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock3,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';

import { PageContainer } from '../components/layout/PageContainer';
import { EmptyState } from '../components/ui/EmptyState';
import { StatCard } from '../components/ui/StatCard';
import {
  getMonitoringMetrics,
  type MonitoringMetrics,
} from '../services/monitoringService';

const formatMs = (value: number | null) =>
  value === null ? '—' : `${value.toFixed(1)} ms`;

const formatPercent = (value: number | null) =>
  value === null ? '—' : `${(value * 100).toFixed(1)}%`;

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString();
};

const formatClassName = (value: string) =>
  value.replaceAll('___', ' / ').replaceAll('_', ' ');

export const MonitoringPage: React.FC = () => {
  const [data, setData] = useState<MonitoringMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = useCallback(async (signal?: AbortSignal) => {
    try {
      setError(null);
      const result = await getMonitoringMetrics(signal);
      setData(result);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load monitoring metrics.',
      );
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadMetrics(controller.signal);
    return () => controller.abort();
  }, [loadMetrics]);

  const refresh = () => {
    setRefreshing(true);
    void loadMetrics();
  };

  const totals = data?.totals;
  const latency = data?.latency;
  const confidence = data?.confidence;
  const drift = data?.drift;

  const maxClassCount = Math.max(
    1,
    ...(data?.classDistribution.map((item) => item.count) ?? []),
  );

  const trendPoints = data?.confidenceTrend ?? [];
  const trendMin = Math.min(
    ...trendPoints.map((item) => item.meanTop1Score),
    0,
  );
  const trendMax = Math.max(
    ...trendPoints.map((item) => item.meanTop1Score),
    1,
  );
  const trendRange = Math.max(0.01, trendMax - trendMin);

  return (
    <PageContainer
      title="System Monitoring"
      subtitle="Live inference telemetry, prediction distribution, confidence trends, and model drift."
      badge={
        <span className="rounded border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 font-mono text-[11px] text-sky-600 dark:text-sky-400">
          SCREEN C
        </span>
      }
      actions={
        <button
          type="button"
          onClick={refresh}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-navy-700 dark:text-slate-200 dark:hover:bg-navy-800"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${
              refreshing ? 'animate-spin' : ''
            }`}
          />
          Refresh metrics
        </button>
      }
    >
      {loading && (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 dark:border-navy-800 dark:bg-navy-900 dark:text-slate-300">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading live monitoring data...
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/25 bg-red-500/5 p-4 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Monitoring data unavailable</p>
            <p className="mt-1 text-xs">{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && !data && (
        <EmptyState
          icon={Activity}
          title="No monitoring data"
          description="The backend did not return monitoring metrics."
        />
      )}

      {data && (
        <>
          <div className="flex items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4 text-xs text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">
                Monitoring API {data.available ? 'available' : 'unavailable'}
              </p>
              <p className="mt-1">
                {data.status} · Last generated:{' '}
                {formatDate(data.generatedAt)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Requests"
              value={totals?.totalRequests ?? 0}
              hint="Requests recorded by the backend"
              tone="slate"
            />
            <StatCard
              label="Successful Predictions"
              value={totals?.successfulPredictions ?? 0}
              hint="Completed inference requests"
              tone="emerald"
            />
            <StatCard
              label="P50 Latency"
              value={formatMs(latency?.p50Ms ?? null)}
              hint={`${latency?.sampleCount ?? 0} latency samples`}
              tone="slate"
            />
            <StatCard
              label="P95 Latency"
              value={formatMs(latency?.p95Ms ?? null)}
              hint="95th percentile response time"
              tone="slate"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Mean Top-1 Score"
              value={formatPercent(confidence?.meanTop1Score ?? null)}
              hint={`${confidence?.sampleCount ?? 0} confidence samples`}
              tone="sky"
            />
            <StatCard
              label="Model Unavailable"
              value={totals?.modelUnavailable ?? 0}
              hint="Unavailable model responses"
              tone="slate"
            />
            <StatCard
              label="Rejected Uploads"
              value={totals?.rejectedUploads ?? 0}
              hint="Upload validation rejections"
              tone="slate"
            />
            <StatCard
              label="Error Responses"
              value={totals?.errorResponses ?? 0}
              hint="Recorded error responses"
              tone="slate"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-navy-800 dark:bg-navy-900">
              <div className="mb-5 flex items-center gap-2">
                <Activity className="h-4 w-4 text-sky-500" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Prediction Class Distribution
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Recorded predictions grouped by predicted class.
                  </p>
                </div>
              </div>

              {data.classDistribution.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No class distribution data available.
                </p>
              ) : (
                <div className="space-y-4">
                  {data.classDistribution.map((item) => (
                    <div key={item.classId}>
                      <div className="mb-1.5 flex justify-between gap-3 text-xs">
                        <span className="font-medium text-slate-700 dark:text-slate-200">
                          {formatClassName(item.label)}
                        </span>
                        <span className="shrink-0 tabular-nums text-slate-500 dark:text-slate-400">
                          {item.count} · {formatPercent(item.share)}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-navy-800">
                        <div
                          className="h-full rounded-full bg-sky-500 transition-all"
                          style={{
                            width: `${(item.count / maxClassCount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-navy-800 dark:bg-navy-900">
              <div className="mb-5 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-sky-500" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Confidence Trend
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Mean top-1 score across recorded trend intervals.
                  </p>
                </div>
              </div>

              {trendPoints.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No confidence trend data available.
                </p>
              ) : (
                <>
                  <div className="flex h-48 items-end gap-1 border-b border-l border-slate-200 px-2 pb-2 dark:border-navy-700">
                    {trendPoints.map((point, index) => {
                      const height =
                        ((point.meanTop1Score - trendMin) / trendRange) *
                          75 +
                        20;

                      return (
                        <div
                          key={`${point.timestamp}-${index}`}
                          className="group relative flex h-full min-w-0 flex-1 items-end"
                          title={`${formatDate(point.timestamp)}: ${formatPercent(point.meanTop1Score)}`}
                        >
                          <div
                            className="w-full rounded-t-sm bg-teal-500/80 transition hover:bg-teal-400"
                            style={{ height: `${height}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-2 flex justify-between text-[10px] text-slate-400">
                    <span>{formatDate(trendPoints[0].timestamp)}</span>
                    <span>
                      {formatDate(
                        trendPoints[trendPoints.length - 1].timestamp,
                      )}
                    </span>
                  </div>
                </>
              )}
              {confidence?.note && (
                <p className="mt-3 text-[11px] text-amber-600 dark:text-amber-400">
                  {confidence.note}
                </p>
              )}
            </section>
          </div>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-navy-800 dark:bg-navy-900">
            <div className="mb-4 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Model Drift Status
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Drift metrics depend on a verified baseline distribution.
                </p>
              </div>
            </div>

            {drift?.available ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatCard
                  label="Drift Method"
                  value={drift.method ?? '—'}
                  hint="Configured comparison method"
                  tone="slate"
                />
                <StatCard
                  label="PSI"
                  value={drift.psi?.toFixed(4) ?? '—'}
                  hint="Population Stability Index"
                  tone="slate"
                />
                <StatCard
                  label="KS Statistic"
                  value={drift.ksStatistic?.toFixed(4) ?? '—'}
                  hint="Kolmogorov–Smirnov statistic"
                  tone="slate"
                />
              </div>
            ) : (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-800 dark:text-amber-300">
                <p className="font-semibold">Drift analysis unavailable</p>
                <p className="mt-1">
                  {drift?.message ??
                    'No verified baseline distribution is currently loaded.'}
                </p>
                <p className="mt-1">
                  Baseline classes: {drift?.baselineClassCount ?? 0}
                </p>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-navy-800 dark:bg-navy-900">
            <div className="mb-4 flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-sky-500" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Recent Prediction Events
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Latest events recorded by the backend.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 dark:bg-navy-950/60 dark:text-slate-400">
                  <tr>
                    <th className="px-3 py-3 font-medium">Time</th>
                    <th className="px-3 py-3 font-medium">Filename</th>
                    <th className="px-3 py-3 font-medium">Prediction</th>
                    <th className="px-3 py-3 font-medium">Score</th>
                    <th className="px-3 py-3 font-medium">Latency</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                  {data.recentEvents.map((event) => (
                    <tr key={event.id}>
                      <td className="whitespace-nowrap px-3 py-3 text-slate-500 dark:text-slate-400">
                        {formatDate(event.createdAt)}
                      </td>
                      <td className="max-w-48 truncate px-3 py-3 text-slate-700 dark:text-slate-200">
                        {event.filename}
                      </td>
                      <td className="px-3 py-3 text-slate-700 dark:text-slate-200">
                        {event.predictedClassLabel
                          ? formatClassName(event.predictedClassLabel)
                          : event.errorCode ?? '—'}
                      </td>
                      <td className="px-3 py-3 tabular-nums text-slate-600 dark:text-slate-300">
                        {formatPercent(event.top1Score)}
                      </td>
                      <td className="px-3 py-3 tabular-nums text-slate-600 dark:text-slate-300">
                        {formatMs(event.latencyMs)}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-medium ${
                            event.status.toLowerCase() === 'success'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : 'bg-red-500/10 text-red-600'
                          }`}
                        >
                          {event.status}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {data.recentEvents.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-5 text-center text-xs text-slate-500"
                      >
                        No recent prediction events.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {(latency?.note || data.notes.length > 0) && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600 dark:border-navy-800 dark:bg-navy-900 dark:text-slate-300">
              <p className="mb-2 font-semibold">Telemetry notes</p>
              {latency?.note && <p className="mb-1">{latency.note}</p>}
              {data.notes.map((note, index) => (
                <p key={index} className="mb-1">
                  {note}
                </p>
              ))}
              <p className="mt-2 text-[11px] text-slate-500">
                Confidence scores are model softmax scores, not calibrated
                probabilities. Drift is not inferred without a verified
                baseline.
              </p>
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
};

export default MonitoringPage;
