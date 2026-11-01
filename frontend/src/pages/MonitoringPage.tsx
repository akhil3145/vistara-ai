import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { TrendChart } from '../components/charts/TrendChart';
import { DistributionBars } from '../components/charts/DistributionBars';
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
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const formatShortDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
    const timer = window.setTimeout(() => {
      void loadMetrics(controller.signal);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadMetrics]);

  const refresh = () => {
    setError(null);
    setRefreshing(true);
    void loadMetrics();
  };

  const totals = data?.totals;
  const latency = data?.latency;
  const confidence = data?.confidence;
  const drift = data?.drift;

  const trendPoints = useMemo(
    () =>
      (data?.confidenceTrend ?? []).map((point) => ({
        timestamp: point.timestamp,
        value: point.meanTop1Score,
      })),
    [data],
  );

  const composition = useMemo(() => {
    const total = totals?.totalRequests ?? 0;
    const rows = [
      {
        label: 'Successful',
        count: totals?.successfulPredictions ?? 0,
        color: 'bg-lime',
        text: 'text-lime',
      },
      {
        label: 'Rejected uploads',
        count: totals?.rejectedUploads ?? 0,
        color: 'bg-warning',
        text: 'text-warning',
      },
      {
        label: 'Model unavailable',
        count: totals?.modelUnavailable ?? 0,
        color: 'bg-cyan',
        text: 'text-cyan',
      },
      {
        label: 'Errors',
        count: totals?.errorResponses ?? 0,
        color: 'bg-danger',
        text: 'text-danger',
      },
    ];

    return {
      total,
      rows,
      segments: rows.filter((row) => row.count > 0),
    };
  }, [totals]);

  const latencyRows = [
    { label: 'P50 median', value: latency?.p50Ms ?? null, color: 'from-accent to-accent/50' },
    { label: 'P95 tail', value: latency?.p95Ms ?? null, color: 'from-cyan to-cyan/50' },
  ];
  const latencyMax = Math.max(
    1,
    latency?.p50Ms ?? 0,
    latency?.p95Ms ?? 0,
  );

  return (
    <PageContainer
      eyebrow="Operational intelligence · telemetry"
      title="System Monitoring"
      subtitle="Live inference telemetry, prediction distribution, confidence trends, and model drift readiness."
      badge={<span className="chip chip-cyan font-mono">Screen C</span>}
      actions={
        <button
          type="button"
          onClick={refresh}
          disabled={loading || refreshing}
          className="btn-secondary"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`}
          />
          Refresh metrics
        </button>
      }
    >
      {loading && (
        <div className="flex items-center gap-3 rounded-xl border border-line bg-panel p-5 text-sm text-muted">
          <RefreshCw className="h-4 w-4 animate-spin text-accent" />
          Loading live monitoring data...
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-danger/25 bg-danger/[0.06] p-4 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Monitoring data unavailable</p>
            <p className="mt-1 text-xs text-muted">{error}</p>
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
          {/* Availability strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-panel px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg border ${
                  data.available
                    ? 'border-lime/25 bg-lime/10 text-lime'
                    : 'border-warning/25 bg-warning/10 text-warning'
                }`}
              >
                {data.available ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5" />
                )}
              </span>
              <div>
                <p className="text-[11px] font-semibold text-ink">
                  Monitoring API{' '}
                  {data.available ? 'available' : 'unavailable'}
                </p>
                <p className="text-[10px] text-faint">
                  {data.status} · generated {formatDate(data.generatedAt)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="chip">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                {confidence?.sampleCount ?? 0} confidence samples
              </span>
              <span className="chip">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
                {latency?.sampleCount ?? 0} latency samples
              </span>
            </div>
          </div>

          {/* Primary KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total requests"
              value={totals?.totalRequests ?? 0}
              hint="Requests recorded by the backend"
              icon={Activity}
              tone="teal"
            />
            <StatCard
              label="Successful predictions"
              value={totals?.successfulPredictions ?? 0}
              hint="Completed inference requests"
              icon={CheckCircle2}
              tone="emerald"
            />
            <StatCard
              label="P50 latency"
              value={formatMs(latency?.p50Ms ?? null)}
              hint="Median response time"
              icon={Clock3}
              tone="sky"
            />
            <StatCard
              label="P95 latency"
              value={formatMs(latency?.p95Ms ?? null)}
              hint="95th percentile response time"
              icon={Clock3}
              tone="sky"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Mean top-1 score"
              value={formatPercent(confidence?.meanTop1Score ?? null)}
              hint={`${confidence?.sampleCount ?? 0} confidence samples`}
              icon={TrendingUp}
              tone="teal"
            />
            <StatCard
              label="Model unavailable"
              value={totals?.modelUnavailable ?? 0}
              hint="Unavailable model responses"
              icon={AlertCircle}
              tone="slate"
            />
            <StatCard
              label="Rejected uploads"
              value={totals?.rejectedUploads ?? 0}
              hint="Upload validation rejections"
              icon={ShieldAlert}
              tone="amber"
            />
            <StatCard
              label="Error responses"
              value={totals?.errorResponses ?? 0}
              hint="Recorded error responses"
              icon={AlertCircle}
              tone="rose"
            />
          </div>

          {/* Trend + composition */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <section className="panel p-4 sm:p-5 xl:col-span-2">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-accent/25 bg-accent/10">
                    <TrendingUp className="h-3.5 w-3.5 text-accent" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">
                      Confidence trend
                    </h3>
                    <p className="text-[10px] text-faint">
                      Mean top-1 score across recorded intervals
                    </p>
                  </div>
                </div>
                <span className="chip">{trendPoints.length} intervals</span>
              </div>

              <TrendChart
                points={trendPoints}
                formatValue={(value) =>
                  `${(value * 100).toFixed(1)}%`
                }
                formatLabel={formatShortDate}
                emptyLabel="No confidence trend data available."
              />

              {confidence?.note && (
                <p className="mt-3 rounded-lg border border-warning/20 bg-warning/[0.05] px-3 py-2 text-[10px] leading-relaxed text-warning">
                  {confidence.note}
                </p>
              )}
            </section>

            <section className="panel p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan/25 bg-cyan/10">
                  <Activity className="h-3.5 w-3.5 text-cyan" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-ink">
                    Response composition
                  </h3>
                  <p className="text-[10px] text-faint">
                    Distribution of recorded outcomes
                  </p>
                </div>
              </div>

              {composition.total === 0 ? (
                <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-line bg-base/30 px-4 text-center">
                  <p className="text-xs text-muted">
                    No response outcomes recorded yet.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex h-3 overflow-hidden rounded-full bg-base/70">
                    {composition.segments.map((segment) => (
                      <div
                        key={segment.label}
                        className={`${segment.color} h-full transition-all`}
                        style={{
                          width: `${(segment.count / composition.total) * 100}%`,
                        }}
                        title={`${segment.label}: ${segment.count}`}
                      />
                    ))}
                  </div>

                  <div className="mt-4 space-y-2.5">
                    {composition.rows.map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center justify-between text-[11px]"
                      >
                        <span className="flex items-center gap-2 text-muted">
                          <span className={`h-1.5 w-1.5 rounded-full ${row.color}`} />
                          {row.label}
                        </span>
                        <span className="font-mono text-ink">
                          {row.count}
                          <span className="ml-1.5 text-[9px] text-faint">
                            {composition.total > 0
                              ? `${((row.count / composition.total) * 100).toFixed(1)}%`
                              : '0%'}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-line/70 pt-3 text-[10px]">
                    <span className="text-faint">Total requests</span>
                    <span className="font-mono text-accent">
                      {composition.total}
                    </span>
                  </div>
                </>
              )}
            </section>
          </div>

          {/* Class distribution + latency */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <section className="panel p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-accent/25 bg-accent/10">
                  <Activity className="h-3.5 w-3.5 text-accent" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-ink">
                    Prediction class distribution
                  </h3>
                  <p className="text-[10px] text-faint">
                    Recorded predictions grouped by predicted class
                  </p>
                </div>
              </div>

              <DistributionBars
                items={data.classDistribution.map((item) => ({
                  id: item.classId,
                  label: formatClassName(item.label),
                  count: item.count,
                  value: item.share,
                  valueLabel: formatPercent(item.share),
                }))}
                emptyLabel="No class distribution data available."
              />
            </section>

            <section className="panel p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan/25 bg-cyan/10">
                  <Clock3 className="h-3.5 w-3.5 text-cyan" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-ink">
                    Latency profile
                  </h3>
                  <p className="text-[10px] text-faint">
                    Response-time percentiles from measured samples
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {latencyRows.map((row) => (
                  <div key={row.label}>
                    <div className="mb-1.5 flex items-baseline justify-between text-[11px]">
                      <span className="text-muted">{row.label}</span>
                      <span className="font-mono text-ink">
                        {formatMs(row.value)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-base/70">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${row.color}`}
                        style={{
                          width: `${row.value ? Math.max(4, (row.value / latencyMax) * 100) : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-2 border-t border-line/70 pt-3">
                  <div className="rounded-lg bg-base/30 px-3 py-2">
                    <p className="text-[9px] uppercase tracking-[0.1em] text-faint">
                      Samples
                    </p>
                    <p className="mt-0.5 font-mono text-sm text-ink">
                      {latency?.sampleCount ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg bg-base/30 px-3 py-2">
                    <p className="text-[9px] uppercase tracking-[0.1em] text-faint">
                      P95 / P50
                    </p>
                    <p className="mt-0.5 font-mono text-sm text-ink">
                      {latency?.p50Ms && latency?.p95Ms
                        ? `${(latency.p95Ms / latency.p50Ms).toFixed(1)}×`
                        : '—'}
                    </p>
                  </div>
                </div>
              </div>

              {latency?.note && (
                <p className="mt-3 text-[10px] leading-relaxed text-faint">
                  {latency.note}
                </p>
              )}
            </section>
          </div>

          {/* Drift */}
          <section className="panel p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-warning/25 bg-warning/10">
                  <ShieldAlert className="h-3.5 w-3.5 text-warning" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-ink">
                    Model drift status
                  </h3>
                  <p className="text-[10px] text-faint">
                    Drift metrics depend on a verified baseline distribution
                  </p>
                </div>
              </div>
              <span
                className={`chip ${
                  drift?.available ? 'chip-lime' : 'chip-warning'
                }`}
              >
                {drift?.available ? 'Baseline available' : 'Baseline pending'}
              </span>
            </div>

            {drift?.available ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard
                  label="Drift method"
                  value={drift.method ?? '—'}
                  hint="Configured comparison method"
                  tone="slate"
                />
                <StatCard
                  label="PSI"
                  value={drift.psi?.toFixed(4) ?? '—'}
                  hint="Population Stability Index"
                  tone="teal"
                />
                <StatCard
                  label="KS statistic"
                  value={drift.ksStatistic?.toFixed(4) ?? '—'}
                  hint="Kolmogorov–Smirnov statistic"
                  tone="sky"
                />
              </div>
            ) : (
              <div className="rounded-xl border border-warning/20 bg-warning/[0.045] p-4 text-xs text-muted">
                <p className="font-semibold text-warning">
                  Drift analysis unavailable
                </p>
                <p className="mt-1">
                  {drift?.message ??
                    'No verified baseline distribution is currently loaded.'}
                </p>
                <p className="mt-1 font-mono text-[10px] text-faint">
                  Baseline classes: {drift?.baselineClassCount ?? 0}
                </p>
              </div>
            )}
          </section>

          {/* Recent events */}
          <section className="table-shell">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3.5 sm:px-5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-accent/25 bg-accent/10">
                  <Clock3 className="h-3.5 w-3.5 text-accent" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-ink">
                    Recent prediction events
                  </h3>
                  <p className="text-[10px] text-faint">
                    Latest events recorded by the backend
                  </p>
                </div>
              </div>
              <span className="chip">{data.recentEvents.length} events</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead className="table-head">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Time</th>
                    <th className="px-4 py-2.5 font-medium">Filename</th>
                    <th className="px-4 py-2.5 font-medium">Prediction</th>
                    <th className="px-4 py-2.5 font-medium">Score</th>
                    <th className="px-4 py-2.5 font-medium">Latency</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/70">
                  {data.recentEvents.map((event) => (
                    <tr
                      key={event.id}
                      className="transition-colors hover:bg-raised/[0.28]"
                    >
                      <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[10px] text-faint">
                        {formatDate(event.createdAt)}
                      </td>
                      <td className="max-w-48 truncate px-4 py-2.5 text-[11px] text-muted">
                        {event.filename}
                      </td>
                      <td className="px-4 py-2.5 text-[11px] text-muted">
                        {event.predictedClassLabel
                          ? formatClassName(event.predictedClassLabel)
                          : event.errorCode ?? '—'}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[10px] text-muted">
                        {formatPercent(event.top1Score)}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[10px] text-muted">
                        {formatMs(event.latencyMs)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`rounded-full border px-2 py-0.5 font-mono text-[9px] ${
                            event.status.toLowerCase() === 'success'
                              ? 'border-lime/30 bg-lime/10 text-lime'
                              : 'border-danger/30 bg-danger/10 text-danger'
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
                        className="p-6 text-center text-xs text-muted"
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
            <div className="rounded-xl border border-line bg-panel/60 p-4 text-[11px] leading-relaxed text-muted">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-faint">
                Telemetry notes
              </p>
              {latency?.note && <p className="mb-1">{latency.note}</p>}
              {data.notes.map((note, index) => (
                <p key={index} className="mb-1">
                  {note}
                </p>
              ))}
              <p className="mt-2 text-[10px] text-faint">
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
