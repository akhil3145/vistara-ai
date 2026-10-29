import React from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { UploadCloud, Image as ImageIcon } from 'lucide-react';

export const ScannerPage: React.FC = () => {
  return (
    <PageContainer
      title="Disease Scanner"
      subtitle="Single-leaf foliar image analysis with top-k probabilities and Grad-CAM visual explanation."
      badge={
        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
          Screen A
        </span>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload Zone & Gallery (Left Column: 7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Dropzone Card */}
          <div className="p-6 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
              Foliar Image Upload
            </h3>
            <div className="border-2 border-dashed border-slate-300 dark:border-navy-700 hover:border-teal-500 dark:hover:border-teal-400 rounded-xl p-8 text-center transition-colors cursor-pointer bg-slate-50/50 dark:bg-navy-950/40">
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="text-sm font-medium text-slate-900 dark:text-white">
                  Drag and drop leaf photograph here
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Supports JPEG, PNG, WEBP up to 10MB
                </div>
              </div>
            </div>
          </div>

          {/* Sample Gallery Card */}
          <div className="p-5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Curated Sample Gallery
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                8–12 Verified Benchmark Leaves
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Select a benchmark leaf from our curated healthy or infected crop categories to preview model inference and Grad-CAM activation.
            </p>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800 text-xs text-slate-500 text-center">
              Curated leaf asset gallery will be connected in Phase 3.
            </div>
          </div>
        </div>

        {/* Results & Grad-CAM Heatmap (Right Column: 5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm flex flex-col items-center justify-center min-h-[360px] text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-navy-850 text-slate-400 flex items-center justify-center mb-3">
              <ImageIcon className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
              Awaiting Foliar Input
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1">
              Upload an image or choose a sample to inspect class scores, confidence metrics, and Grad-CAM heatmaps.
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
