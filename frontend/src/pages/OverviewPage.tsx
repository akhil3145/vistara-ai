import React from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import {
  ScanLine,
  Layers,
  Activity,
  BarChart3,
  AlertTriangle,
  ArrowRight,
  Database,
  Cpu,
} from 'lucide-react';
import type { PageId } from '../types/navigation';

interface OverviewPageProps {
  onNavigate: (page: PageId) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigate }) => {
  return (
    <PageContainer
      title="System Overview"
      subtitle="Operational command center for plant foliar screening, model status, and telemetry."
      badge={
        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
          Frontend Preview
        </span>
      }
    >
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Model Engine</span>
            <Cpu className="w-4 h-4 text-teal-500" />
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white font-mono">MobileNetV2</div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>Planned 224×224 RGB input</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Supported Target Classes</span>
            <BarChart3 className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white font-mono">38 Categories</div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>PlantVillage benchmark</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Telemetry Storage</span>
            <Database className="w-4 h-4 text-teal-500" />
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white font-mono">SQLite (planned)</div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Backend not connected</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Explainability (XAI)</span>
            <Activity className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white font-mono">Grad-CAM</div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>Planned: Conv_1 activation</span>
          </div>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <ScanLine className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Single-Leaf Disease Scanner</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Upload an individual photograph of a plant leaf or select from the curated sample gallery to inspect top-k predicted disease categories and visual Grad-CAM activation heatmaps.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-navy-800">
            <button
              onClick={() => onNavigate('scanner')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
            >
              <span>Open Disease Scanner</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Batch Analysis Queue</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Queue multiple foliar images simultaneously. Inspect aggregate confidence metrics, filter low-confidence predictions requiring human inspection, and export batch summaries to CSV.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-navy-800">
            <button
              onClick={() => onNavigate('batch')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
            >
              <span>Open Batch Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Operational Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
        <div className="space-y-1">
          <span className="font-semibold">Academic Diagnostic Demarcation</span>
          <p className="text-amber-700/90 dark:text-amber-400/90 leading-relaxed">
            Vistara AI is an experimental decision-support system trained on laboratory-controlled foliar photographs. Heatmaps indicate influential feature zones rather than causal phytopathology. Outputs must be verified by agricultural professionals prior to any field interventions.
          </p>
        </div>
      </div>
    </PageContainer>
  );
};
