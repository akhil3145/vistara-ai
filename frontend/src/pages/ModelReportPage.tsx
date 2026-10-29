import React from 'react';
import { PageContainer } from '../components/layout/PageContainer';

export const ModelReportPage: React.FC = () => {
  return (
    <PageContainer
      title="Model Evaluation Report"
      subtitle="Held-out test set performance metrics, confusion matrices, and loss/accuracy curves."
      badge={
        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
          Screen D
        </span>
      }
    >
      {/* Test Benchmark Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Held-Out Test Accuracy</span>
          <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white font-mono">Pending Train</div>
          <span className="text-xs text-slate-400 mt-1 block">Phase 5 Colab export</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Macro-Averaged F1</span>
          <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white font-mono">Pending Train</div>
          <span className="text-xs text-slate-400 mt-1 block">Across all 38 classes</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Dataset Split</span>
          <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white font-mono">70 / 15 / 15</div>
          <span className="text-xs text-slate-400 mt-1 block">Stratified Train / Val / Test</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Model Checkpoint Format</span>
          <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white font-mono">.keras</div>
          <span className="text-xs text-slate-400 mt-1 block">Keras v3 / TensorFlow</span>
        </div>
      </div>

      {/* Model Metadata Section */}
      <div className="p-6 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
          Model Architecture & Training Configuration
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Evaluation artifacts, confusion matrix plots, and per-class precision/recall curves will be loaded from the validated Colab experiment artifact bundle (`evaluation_report.json`) in Phase 5.
        </p>
        <div className="p-4 rounded-lg bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800 font-mono text-xs text-slate-600 dark:text-slate-400 space-y-1">
          <div>• Base Architecture: MobileNetV2 (ImageNet weights, frozen feature extractor)</div>
          <div>• Head: GlobalAveragePooling2D → Dense(256, relu) → Dropout(0.3) → Dense(38, softmax)</div>
          <div>• Input Dimensions: 224 x 224 x 3 RGB</div>
          <div>• Explainability Hook: Conv_1 layer target for Grad-CAM</div>
        </div>
      </div>
    </PageContainer>
  );
};
