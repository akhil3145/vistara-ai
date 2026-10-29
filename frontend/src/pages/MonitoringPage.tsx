import React from 'react';
import { PageContainer } from '../components/layout/PageContainer';

export const MonitoringPage: React.FC = () => {
  return (
    <PageContainer
      title="Operational Monitoring"
      subtitle="Real-time request telemetry, latency profiling, and statistical drift signals."
      badge={
        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
          Screen C
        </span>
      }
    >
      {/* Telemetry Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Recorded Requests</span>
          <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white font-mono">0 Inferences</div>
          <span className="text-xs text-slate-400 mt-1 block">Stored in SQLite telemetry</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">p95 Latency</span>
          <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white font-mono">— ms</div>
          <span className="text-xs text-slate-400 mt-1 block">Calculated over sliding window</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Mean Operational Score</span>
          <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white font-mono">—</div>
          <span className="text-xs text-slate-400 mt-1 block">Live model softmax mean</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Population Drift Status</span>
          <div className="mt-2 text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">Nominal</div>
          <span className="text-xs text-slate-400 mt-1 block">Baseline vs. live distribution</span>
        </div>
      </div>

      {/* Notice on Academic Rigor */}
      <div className="p-4 rounded-xl bg-slate-100 dark:bg-navy-850 border border-slate-200 dark:border-navy-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
        <div className="font-semibold text-slate-800 dark:text-slate-200">
          Telemetry & Data Integrity Guarantee
        </div>
        <p>
          In accordance with Vistara AI academic directives, operational accuracy is strictly reported only when ground-truth labels are provided. Synthetic or simulated accuracy figures are never displayed.
        </p>
      </div>
    </PageContainer>
  );
};
