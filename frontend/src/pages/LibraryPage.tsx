import React, { useMemo, useState } from 'react';
import { BookOpen, FilterX, Info, Search } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { DiseaseCard } from '../components/library/DiseaseCard';
import { EmptyState } from '../components/ui/EmptyState';
import {
  CROP_OPTIONS,
  DISEASE_CLASSES,
  PATHOGEN_TYPE_OPTIONS,
} from '../data/diseaseClasses';
import type { PathogenType } from '../types/disease';

type ConditionFilter = 'all' | 'diseased' | 'healthy';
type PathogenFilter = 'all' | PathogenType;

export const LibraryPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [cropFilter, setCropFilter] = useState('all');
  const [conditionFilter, setConditionFilter] =
    useState<ConditionFilter>('all');
  const [pathogenFilter, setPathogenFilter] = useState<PathogenFilter>('all');

  const filteredDiseases = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return DISEASE_CLASSES.filter((disease) => {
      if (cropFilter !== 'all' && disease.crop !== cropFilter) return false;
      if (conditionFilter === 'healthy' && !disease.healthy) return false;
      if (conditionFilter === 'diseased' && disease.healthy) return false;
      if (pathogenFilter !== 'all' && disease.pathogenType !== pathogenFilter) {
        return false;
      }
      if (!query) return true;
      const haystack = [
        disease.crop,
        disease.name,
        disease.pathogen,
        disease.pathogenType,
        disease.symptoms,
        disease.note,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [searchQuery, cropFilter, conditionFilter, pathogenFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setCropFilter('all');
    setConditionFilter('all');
    setPathogenFilter('all');
  };

  return (
    <PageContainer
      title="Disease Reference Library"
      subtitle="Searchable educational reference for the supported crop classes and their reported foliar symptoms."
      badge={
        <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
          {DISEASE_CLASSES.length} classes
        </span>
      }
    >
      <div
        role="note"
        className="flex items-start gap-3 rounded-xl border border-sky-500/25 bg-sky-500/5 p-4 text-xs text-sky-800 dark:text-sky-300"
      >
        <Info
          className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400"
          aria-hidden="true"
        />
        <div className="space-y-1">
          <div className="font-semibold">Educational reference, not a diagnosis</div>
          <p className="leading-relaxed text-sky-700/90 dark:text-sky-300/90">
            Descriptions summarize widely reported symptom patterns for the
            PlantVillage class taxonomy. Visual symptoms can overlap across
            pathogens, nutrient disorders, and environmental stress. Confirm any
            suspected disease with a qualified plant pathologist or local
            agricultural extension service before treatment.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-navy-800 dark:bg-navy-900">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <label
              htmlFor="library-search"
              className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              Search reference
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="library-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search crop, disease, pathogen, or symptom"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:border-navy-800 dark:bg-navy-950/40 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="lg:col-span-3">
            <label
              htmlFor="library-crop-filter"
              className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              Crop
            </label>
            <select
              id="library-crop-filter"
              value={cropFilter}
              onChange={(event) => setCropFilter(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:border-navy-800 dark:bg-navy-950/40 dark:text-slate-100"
            >
              <option value="all">All crops</option>
              {CROP_OPTIONS.map((crop) => (
                <option key={crop} value={crop}>
                  {crop}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor="library-condition-filter"
              className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              Condition
            </label>
            <select
              id="library-condition-filter"
              value={conditionFilter}
              onChange={(event) =>
                setConditionFilter(event.target.value as ConditionFilter)
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:border-navy-800 dark:bg-navy-950/40 dark:text-slate-100"
            >
              <option value="all">All</option>
              <option value="diseased">Diseased</option>
              <option value="healthy">Healthy</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor="library-pathogen-filter"
              className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              Agent type
            </label>
            <select
              id="library-pathogen-filter"
              value={pathogenFilter}
              onChange={(event) =>
                setPathogenFilter(event.target.value as PathogenFilter)
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:border-navy-800 dark:bg-navy-950/40 dark:text-slate-100"
            >
              <option value="all">All agents</option>
              {PATHOGEN_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <span>
            Showing <span className="font-mono">{filteredDiseases.length}</span>{' '}
            of <span className="font-mono">{DISEASE_CLASSES.length}</span> classes
          </span>
          {(searchQuery ||
            cropFilter !== 'all' ||
            conditionFilter !== 'all' ||
            pathogenFilter !== 'all') && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 hover:border-teal-500/40 hover:text-teal-700 dark:border-navy-800 dark:text-slate-300 dark:hover:text-teal-300"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {filteredDiseases.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-navy-800 dark:bg-navy-900">
          <EmptyState
            icon={FilterX}
            title="No reference entries match"
            description="Try a broader search term or reset the crop, condition, and agent filters."
            action={
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-teal-500/40 hover:text-teal-700 dark:border-navy-800 dark:text-slate-200 dark:hover:text-teal-300"
              >
                Reset filters
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredDiseases.map((disease) => (
            <DiseaseCard key={disease.id} disease={disease} />
          ))}
        </div>
      )}

      <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-[11px] leading-relaxed text-slate-500 dark:border-navy-800 dark:bg-navy-950/40 dark:text-slate-400">
        <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
        <p>
          Reference basis: PlantVillage class labels and general plant pathology
          extension literature. Class names follow the dataset taxonomy, including
          its historical spellings. This library is not a diagnostic key and
          does not replace laboratory confirmation.
        </p>
      </div>
    </PageContainer>
  );
};
