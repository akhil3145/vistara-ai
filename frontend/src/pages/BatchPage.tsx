import React from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { UploadCloud } from 'lucide-react';

export const BatchPage: React.FC = () => {
  return (
    <PageContainer
      title="Batch Analysis Queue"
      subtitle="High-throughput batch foliar screening with uncertainty threshold filtering and CSV exports."
      badge={
        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
          Screen B
        </span>
      }
    >
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total in Queue</span>
          <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white font-mono">0 Images</div>
          <span className="text-xs text-slate-400 mt-1 block">Awaiting batch selection</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Mean Batch Confidence</span>
          <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white font-mono">—</div>
          <span className="text-xs text-slate-400 mt-1 block">Computed post-inference</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Needs Review (&lt;70%)</span>
          <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white font-mono">0</div>
          <span className="text-xs text-slate-400 mt-1 block">Configurable threshold</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Top Predicted Category</span>
          <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white font-mono">—</div>
          <span className="text-xs text-slate-400 mt-1 block">Distribution mode</span>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="p-6 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
        <div className="border-2 border-dashed border-slate-300 dark:border-navy-700 hover:border-sky-500 dark:hover:border-sky-400 rounded-xl p-8 text-center transition-colors cursor-pointer bg-slate-50/50 dark:bg-navy-950/40">
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="text-sm font-medium text-slate-900 dark:text-white">
              Drag and drop multiple leaf photographs
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Select multiple files or folders for batch diagnosis
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
