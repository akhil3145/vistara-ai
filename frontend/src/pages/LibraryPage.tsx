import React from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { BookOpen, Search, Filter } from 'lucide-react';

export const LibraryPage: React.FC = () => {
  return (
    <PageContainer
      title="Disease Reference Library"
      subtitle="Curated foliar symptom descriptions, causal pathogens, and educational context for supported crop classes."
      badge={
        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          38 Categories
        </span>
      }
    >
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by crop (Apple, Tomato, Corn...) or disease name..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-teal-500 dark:focus:border-teal-400"
            disabled
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-xs font-medium text-slate-500 dark:text-slate-400 cursor-not-allowed"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Crops</span>
          </button>
        </div>
      </div>

      {/* Catalog Placeholder */}
      <div className="p-8 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
          <BookOpen className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
          Verified Phytopathology Reference Catalog
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
          Full disease profiles with biological descriptions and symptom benchmarks will be populated in Phase 3.
        </p>
      </div>
    </PageContainer>
  );
};
