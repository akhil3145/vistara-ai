import React, { useState } from 'react';
import {
  Activity,
  BarChart3,
  Database,
  FlaskConical,
  Gauge,
  ServerOff,
  ShieldAlert,
  Timer,
  TrendingUp,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { DemoBadge } from '../components/ui/DemoBadge';
import { DemoBanner } from '../components/ui/DemoBanner';
import { EmptyState } from '../components/ui/EmptyState';
import { StatCard } from '../components/ui/StatCard';

const DEMO_DISTRIBUTION = [
  { label: 'Tomato - Early blight', value: 31 },
  { label: 'Tomato - Late blight', value: 24 },
  { label: 'Potato - Early blight', value: 17 },
  { label: 'Apple - Apple scab', value: 15 },
  { label: 'Grape - Black rot', value: 13 },
];

const DEMO_CONFIDENCE_TREND = [72, 76, 79, 74, 83, 81, 86, 84, 88, 82, 85, 87];

const DEMO_EVENTS = [
  {
    window: 'T-4m',
    request: 'demo-0248',
    prediction: 'Tomato - Early blight',
    score: '88.4%',
    latency: '318 ms',
  },
  {
    window: 'T-7m',
    request: 'demo-0247',
    prediction: 'Apple - healthy',
    score: '91.2%',
    latency: '284 ms',
  },
  {
    window: 'T-9m',
    request: 'demo-0246',
    prediction: 'Potato - Late blight',
    score: '63.7%',
    latency: '441 ms',
  },
  {
    window: 'T-12m',
    request: 'demo-0245',
    prediction: 'Grape - Black rot',
    score: '79.5%',
    latency: '356 ms',
  },
  {
    window: 'T-15m',
    request: 'demo-0244',
    prediction: 'Tomato - Late blight',
    score: '84.1%',
    latency: '302 ms',
  },
];

const DemoTag: React.FC = () => <DemoBadge label="DEMO DATA" />;

export const MonitoringPage: React.FC = () => {
  const [showDemoPreview, setShowDemoPreview] = useState(false);

  return (
    <PageContainer
      title="Operational Monitoring"
      subtitle="Request telemetry, latency profiling, class distribution, and drift signals."
      badge={
        <span className="rounded border border-teal-500/20 bg-teal-500/10 px-2 py-0.5 font-mono text-[11px] text-teal-600 dark:text-teal-400">
          Screen C
        </span>
      }
      actions={
        <button
          type="button"
          onClick={() => setShowDemoPreview((current) => !current)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-teal-500/40 hover:text-teal-700 dark:border-navy-800 dark:bg-navy-900 dark:text-slate-200 dark:hover:text-teal-300"
        >
          <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{showDemoPreview ? 'Hide demo preview' : 'Show demo preview'}</span>
        </button>
      }
    >
      {showDemoPreview ? (
        <DemoBanner title="Illustrative monitoring preview">
          Every number, chart, and event below is DEMO DATA. Nothing on this
          page is read from a backend, SQLite telemetry store, or trained model.
          Do not interpret these values as real accuracy, latency, or drift
          monitoring.
        </DemoBanner>
      ) : (
        <div
          role="note"
          className="flex items-start gap-3 rounded-xl border border-slate-300 bg-slate-50/70 p-4 text-xs text-slate-700 dark:border-navy-700 dark:bg-navy-950/40 dark:text-slate-300"
        >
          <ServerOff
            className="mt-0.5 h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <div className="font-semibold text-slate-900 dark:text-white">
              Backend telemetry is unavailable
            </div>
            <p className="leading-relaxed text-slate-600 dark:text-slate-400">
              No monitoring endpoint or SQLite telemetry store is connected in
              this phase. Empty states are shown intentionally. Use the demo
              preview only to inspect the layout, never as operational evidence.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Inferences"
          value={showDemoPreview ? '1,248' : '—'}
          hint={showDemoPreview ? 'Illustrative demo value' : 'Awaiting /api/v1/monitoring/metrics'}
          icon={Activity}
          tone="teal"
          badge={showDemoPreview ? <DemoTag /> : undefined}
        />
        <StatCard
          label="Mean Top-1 Score"
          value={showDemoPreview ? '81.6%' : '—'}
          hint={showDemoPreview ? 'Demo score, not calibrated confidence' : 'No live model scores available'}
          icon={Gauge}
          tone="sky"
          badge={showDemoPreview ? <DemoTag /> : undefined}
        />
        <StatCard
          label="p95 Latency"
          value={showDemoPreview ? '412 ms' : '—'}
          hint={showDemoPreview ? 'Illustrative demo value' : 'No latency samples available'}
          icon={Timer}
          tone="purple"
          badge={showDemoPreview ? <DemoTag /> : undefined}
        />
        <StatCard
          label="Population Drift"
          value={showDemoPreview ? 'Watch' : 'Unavailable'}
          hint={showDemoPreview ? 'Demo flag, not a computed PSI/KS result' : 'Baseline distribution not loaded'}
          icon={ShieldAlert}
          tone={showDemoPreview ? 'amber' : 'slate'}
          badge={showDemoPreview ? <DemoTag /> : undefined}
        />
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-[11px] leading-relaxed text-slate-500 dark:border-navy-800 dark:bg-navy-950/40 dark:text-slate-400">
        <Database className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-500" aria-hidden="true" />
        <p>
          Ground-truth accuracy is intentionally omitted. It will be reported
          only when verified labels are supplied alongside real inference logs.
          Synthetic accuracy figures are never displayed.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-navy-800 dark:bg-navy-900">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Predicted Class Distribution
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Live distribution compared with the baseline training class
                distribution.
              </p>
            </div>
            {showDemoPreview ? <DemoTag /> : <span className="font-mono text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">No data</span>}
          </div>
          {showDemoPreview ? (
            <ul className="space-y-3">
              {DEMO_DISTRIBUTION.map((entry) => (
                <li key={entry.label}>
                  <div className="flex items-baseline justify-between gap-3 text-xs">
                    <span className="truncate text-slate-700 dark:text-slate-200">
                      {entry.label}
                    </span>
                    <span className="font-mono text-slate-500 dark:text-slate-400">
                      {entry.value}%
                    </span>
                  </div>
                  <div
                    className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-navy-950"
                    role="img"
                    aria-label={`${entry.label}: ${entry.value} percent demo share`}
                  >
                    <div
                      className="h-full rounded-full bg-teal-500/80"
                      style={{ width: `${entry.value}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={BarChart3}
              title="No prediction distribution"
              description="A class distribution will appear after inference logs are written to the telemetry store."
              hint="Requires a connected backend and request history"
            />
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-navy-800 dark:bg-navy-900">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Confidence Trend
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Rolling mean of top-1 class scores over recent windows.
              </p>
            </div>
            {showDemoPreview ? <DemoTag /> : <span className="font-mono text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">No data</span>}
          </div>
          {showDemoPreview ? (
            <div>
              <div
                className="flex h-44 items-end gap-1.5"
                role="img"
                aria-label="Illustrative demo confidence trend over twelve windows"
              >
                {DEMO_CONFIDENCE_TREND.map((value, index) => (
                  <div
                    key={`${index}-${value}`}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                  >
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-sky-600/70 to-teal-400/80"
                      style={{ height: `${value}%` }}
                      title={`Window ${index + 1}: ${value}% demo score`}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between font-mono text-[10px] text-slate-400 dark:text-slate-500">
                <span>Older window</span>
                <span>Latest window</span>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={TrendingUp}
              title="No confidence history"
              description="Confidence over time will be derived from stored inference records once the backend is connected."
              hint="No simulated trend is shown outside demo preview"
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-navy-800 dark:bg-navy-900">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Drift Summary
            </h3>
            {showDemoPreview ? <DemoTag /> : <span className="font-mono text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">Unavailable</span>}
          </div>
          {showDemoPreview ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <div className="text-[10px] uppercase tracking-wide text-amber-700 dark:text-amber-300">
                  Population Stability Index
                </div>
                <div className="mt-1 font-mono text-lg font-bold text-amber-700 dark:text-amber-300">
                  0.08
                </div>
                <div className="text-[10px] text-amber-700/80 dark:text-amber-400/80">
                  Demo value
                </div>
              </div>
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <div className="text-[10px] uppercase tracking-wide text-amber-700 dark:text-amber-300">
                  KS Statistic
                </div>
                <div className="mt-1 font-mono text-lg font-bold text-amber-700 dark:text-amber-300">
                  0.05
                </div>
                <div className="text-[10px] text-amber-700/80 dark:text-amber-400/80">
                  Demo value
                </div>
              </div>
              <p className="col-span-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                These demo numbers are illustrative only. They are not computed
                from a baseline training distribution or live prediction logs.
              </p>
            </div>
          ) : (
            <EmptyState
              icon={ShieldAlert}
              title="No drift statistics"
              description="PSI and KS comparisons require a verified baseline training distribution and live request logs."
              hint="No drift status can be claimed without both datasets"
            />
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-navy-800 dark:bg-navy-900">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Telemetry Health
            </h3>
            {showDemoPreview ? <DemoTag /> : <span className="font-mono text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">Offline</span>}
          </div>
          {showDemoPreview ? (
            <dl className="space-y-2 text-[11px]">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 dark:border-navy-800 dark:bg-navy-950/40">
                <dt className="text-slate-500 dark:text-slate-400">Telemetry source</dt>
                <dd className="font-mono text-amber-700 dark:text-amber-300">DEMO PREVIEW</dd>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 dark:border-navy-800 dark:bg-navy-950/40">
                <dt className="text-slate-500 dark:text-slate-400">Backend connection</dt>
                <dd className="font-mono text-slate-600 dark:text-slate-300">Not connected</dd>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 dark:border-navy-800 dark:bg-navy-950/40">
                <dt className="text-slate-500 dark:text-slate-400">Ground truth labels</dt>
                <dd className="font-mono text-slate-600 dark:text-slate-300">Not supplied</dd>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 dark:border-navy-800 dark:bg-navy-950/40">
                <dt className="text-slate-500 dark:text-slate-400">Accuracy metric</dt>
                <dd className="font-mono text-slate-600 dark:text-slate-300">Withheld</dd>
              </div>
            </dl>
          ) : (
            <EmptyState
              icon={ServerOff}
              title="No operational telemetry"
              description="Connect the FastAPI monitoring endpoint to inspect request volume, latency, and drift. No local values are estimated."
              hint="Awaiting /api/v1/monitoring/metrics"
            />
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-navy-800 dark:bg-navy-900">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 dark:border-navy-800">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Recent Prediction Events
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Raw telemetry log from the inference store.
            </p>
          </div>
          {showDemoPreview ? <DemoTag /> : <span className="font-mono text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">No data</span>}
        </div>

        {showDemoPreview ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-xs">
              <caption className="sr-only">
                Illustrative demo prediction events. Not real telemetry.
              </caption>
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 dark:bg-navy-950/60 dark:text-slate-400">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">Window</th>
                  <th scope="col" className="px-4 py-2 font-medium">Request</th>
                  <th scope="col" className="px-4 py-2 font-medium">Prediction</th>
                  <th scope="col" className="px-4 py-2 font-medium">Top-1 score</th>
                  <th scope="col" className="px-4 py-2 font-medium">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                {DEMO_EVENTS.map((event) => (
                  <tr key={event.request}>
                    <td className="px-4 py-2.5 font-mono text-slate-500 dark:text-slate-400">
                      {event.window}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-300">
                      {event.request}
                    </td>
                    <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200">
                      {event.prediction}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-300">
                      {event.score}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-300">
                      {event.latency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4">
            <EmptyState
              icon={Activity}
              title="No recent prediction events"
              description="Inference events will appear here once the API writes requests to the SQLite telemetry store."
              hint="No demo rows are shown in the default state"
            />
          </div>
        )}
      </div>
    </PageContainer>
  );
};
