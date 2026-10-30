import React from 'react';
import {
  FileJson,
  Grid3X3,
  Info,
  ScanEye,
  ShieldAlert,
  Table2,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { ChartEmptyFrame } from '../components/ui/ChartEmptyFrame';
import { EmptyState } from '../components/ui/EmptyState';
import { StatCard } from '../components/ui/StatCard';

const METRIC_CARDS = [
  { label: 'Held-Out Test Accuracy' },
  { label: 'Macro-Averaged F1' },
  { label: 'Weighted-Averaged F1' },
  { label: 'Macro Precision' },
  { label: 'Macro Recall' },
];

const CONFIG_ITEMS = [
  { label: 'Base architecture', value: 'MobileNetV2, ImageNet weights' },
  { label: 'Input dimensions', value: '224 x 224 x 3 RGB' },
  { label: 'Target classes', value: '38 PlantVillage taxonomy classes' },
  { label: 'Planned head', value: 'GAP -> Dense(256, ReLU) -> Dropout(0.3) -> Dense(38, softmax)' },
  { label: 'Checkpoint format', value: '.keras (Keras v3 / TensorFlow)' },
  { label: 'Grad-CAM target', value: 'Conv_1 final convolutional layer' },
  { label: 'Planned split', value: 'Stratified 70% train / 15% validation / 15% test' },
  { label: 'Evaluation status', value: 'Not loaded. No local evaluation has been run.' },
];

const ARTIFACTS = [
  'model_checkpoint.keras',
  'classes.json',
  'preprocess_config.json',
  'model_metadata.json',
  'evaluation_report.json',
];

export const ModelReportPage: React.FC = () => {
  return (
    <PageContainer
      title="Model Evaluation Report"
      subtitle="Held-out test performance, per-class metrics, confusion matrix, and training curves."
      badge={
        <span className="rounded border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 font-mono text-[11px] text-purple-600 dark:text-purple-400">
          Screen D
        </span>
      }
      actions={
        <span className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-amber-700 dark:text-amber-300">
          Artifacts pending
        </span>
      }
    >
      <div
        role="note"
        className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-xs text-amber-800 dark:text-amber-300"
      >
        <ShieldAlert
          className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
          aria-hidden="true"
        />
        <div className="space-y-1">
          <div className="font-semibold">No verified evaluation artifacts are loaded</div>
          <p className="leading-relaxed text-amber-700/90 dark:text-amber-400/90">
            The layout below is intentionally empty. Accuracy, F1, per-class
            metrics, confusion matrices, and learning curves will appear only
            after a real held-out test run produces a verified
            <span className="font-mono"> evaluation_report.json</span>. No
            placeholder values are substituted for measured results.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {METRIC_CARDS.map((metric) => (
          <StatCard
            key={metric.label}
            label={metric.label}
            value="—"
            hint="Awaiting verified artifact"
            tone="slate"
          />
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-navy-800 dark:bg-navy-900">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Model Architecture and Training Configuration
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Planned specification from the project context. This is not a
              record of training results.
            </p>
          </div>
          <span className="rounded border border-slate-300 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-slate-500 dark:border-navy-700 dark:text-slate-400">
            Planned configuration
          </span>
        </div>
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CONFIG_ITEMS.map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 dark:border-navy-800 dark:bg-navy-950/40"
            >
              <dt className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {item.label}
              </dt>
              <dd className="mt-0.5 font-mono text-[11px] leading-relaxed text-slate-700 dark:text-slate-200">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-navy-800 dark:bg-navy-900">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Per-Class Precision, Recall, and F1
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Requires per-class metrics and support counts from the held-out
              test split.
            </p>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
            No artifact
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <caption className="sr-only">
              Per-class evaluation metrics. Empty until a verified artifact is
              loaded.
            </caption>
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 dark:bg-navy-950/60 dark:text-slate-400">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">Crop</th>
                <th scope="col" className="px-3 py-2 font-medium">Class</th>
                <th scope="col" className="px-3 py-2 font-medium">Precision</th>
                <th scope="col" className="px-3 py-2 font-medium">Recall</th>
                <th scope="col" className="px-3 py-2 font-medium">F1</th>
                <th scope="col" className="px-3 py-2 font-medium">Support</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6} className="p-4">
                  <EmptyState
                    icon={Table2}
                    title="Per-class metrics unavailable"
                    description="No verified per-class precision, recall, F1, or support values are available. The table will be populated directly from the evaluation artifact."
                    hint="evaluation_report.json not loaded"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-navy-800 dark:bg-navy-900">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Confusion Matrix
            </h3>
            <span className="font-mono text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Not drawn
            </span>
          </div>
          <EmptyState
            icon={Grid3X3}
            title="No confusion matrix available"
            description="A multi-class matrix will render here only after a verified held-out test artifact is loaded. No matrix cells are fabricated."
            hint="Raw and normalized matrices require evaluation_report.json"
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-navy-800 dark:bg-navy-900">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Explainability Artifact
            </h3>
            <span className="font-mono text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Not available
            </span>
          </div>
          <EmptyState
            icon={ScanEye}
            title="No Grad-CAM validation panel"
            description="Grad-CAM samples will appear after a trained .keras model and the inference backend are available. No heatmap is generated or presented as evidence in this phase."
            hint="Target layer: Conv_1"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-navy-800 dark:bg-navy-900">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Training and Validation Curves
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Loss and accuracy curves are withheld until real training logs are
              available.
            </p>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Empty state
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ChartEmptyFrame
            title="Training vs. Validation Loss"
            description="No verified loss curve has been loaded. No synthetic training line is drawn."
            xLabel="Epoch"
            yLabel="Loss"
          />
          <ChartEmptyFrame
            title="Training vs. Validation Accuracy"
            description="No verified accuracy curve has been loaded. No synthetic training line is drawn."
            xLabel="Epoch"
            yLabel="Accuracy"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-navy-800 dark:bg-navy-900">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileJson className="h-4 w-4 text-sky-500" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Expected Artifact Bundle
            </h3>
          </div>
          <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-amber-700 dark:text-amber-300">
            Not loaded
          </span>
        </div>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ARTIFACTS.map((artifact) => (
            <li
              key={artifact}
              className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 font-mono text-[11px] text-slate-600 dark:border-navy-800 dark:bg-navy-950/40 dark:text-slate-300"
            >
              {artifact}
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-sky-500/20 bg-sky-500/5 p-3 text-[11px] leading-relaxed text-sky-800 dark:text-sky-300">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <p>
            Metrics are reported once, on the held-out test split, from the
            exported artifact bundle. The dataset split remains a planned
            configuration until the actual exported counts are verified.
          </p>
        </div>
      </div>
    </PageContainer>
  );
};
