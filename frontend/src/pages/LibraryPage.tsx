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
import { SAMPLE_GALLERY } from '../data/sampleGallery';
import type { PathogenType } from '../types/disease';

type ConditionFilter = 'all' | 'diseased' | 'healthy';
type PathogenFilter = 'all' | PathogenType;

const SAMPLE_IMAGE_BY_CLASS = new Map(
  SAMPLE_GALLERY.map((sample) => [sample.classId, sample.src]),
);

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

  const hasActiveFilters =
    searchQuery !== '' ||
    cropFilter !== 'all' ||
    conditionFilter !== 'all' ||
    pathogenFilter !== 'all';

  const healthyCount = DISEASE_CLASSES.filter((item) => item.healthy).length;

  return (
    <PageContainer
      eyebrow="Reference library · PlantVillage taxonomy"
      title="Disease Reference Library"
      subtitle="Searchable educational reference for supported crop classes and their reported foliar symptoms."
      badge={
        <span className="chip chip-lime font-mono">
          {DISEASE_CLASSES.length} classes
        </span>
      }
      actions={
        <span className="chip">
          <span className="h-1.5 w-1.5 rounded-full bg-lime" />
          {DISEASE_CLASSES.length - healthyCount} diseased · {healthyCount} healthy
        </span>
      }
    >
      <div
        role="note"
        className="flex items-start gap-3 rounded-xl border border-cyan/25 bg-cyan/[0.045] p-4 text-xs text-muted"
      >
        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-cyan/25 bg-cyan/10">
          <Info className="h-3.5 w-3.5 text-cyan" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <div className="font-semibold text-ink">
            Educational reference, not a diagnosis
          </div>
          <p className="max-w-4xl leading-relaxed">
            Descriptions summarize widely reported symptom patterns for the
            PlantVillage class taxonomy. Visual symptoms can overlap across
            pathogens, nutrient disorders, and environmental stress. Confirm any
            suspected disease with a qualified plant pathologist or local
            agricultural extension service before treatment.
          </p>
        </div>
      </div>

      <section className="panel p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <label
              htmlFor="library-search"
              className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.1em] text-faint"
            >
              Search reference
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint"
                aria-hidden="true"
              />
              <input
                id="library-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search crop, disease, pathogen, or symptom"
                className="field pl-9"
              />
            </div>
          </div>

          <div className="lg:col-span-3">
            <label
              htmlFor="library-crop-filter"
              className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.1em] text-faint"
            >
              Crop
            </label>
            <select
              id="library-crop-filter"
              value={cropFilter}
              onChange={(event) => setCropFilter(event.target.value)}
              className="field"
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
              className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.1em] text-faint"
            >
              Condition
            </label>
            <select
              id="library-condition-filter"
              value={conditionFilter}
              onChange={(event) =>
                setConditionFilter(event.target.value as ConditionFilter)
              }
              className="field"
            >
              <option value="all">All</option>
              <option value="diseased">Diseased</option>
              <option value="healthy">Healthy</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor="library-pathogen-filter"
              className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.1em] text-faint"
            >
              Agent type
            </label>
            <select
              id="library-pathogen-filter"
              value={pathogenFilter}
              onChange={(event) =>
                setPathogenFilter(event.target.value as PathogenFilter)
              }
              className="field"
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

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line/70 pt-3 text-[10px] text-faint">
          <span>
            Showing{' '}
            <span className="font-mono text-accent">{filteredDiseases.length}</span>{' '}
            of <span className="font-mono text-muted">{DISEASE_CLASSES.length}</span>{' '}
            classes
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 font-medium text-muted transition-colors hover:border-accent/40 hover:text-accent"
            >
              <FilterX className="h-3 w-3" />
              Reset filters
            </button>
          )}
        </div>
      </section>

      {filteredDiseases.length === 0 ? (
        <div className="panel p-4">
          <EmptyState
            icon={FilterX}
            title="No reference entries match"
            description="Try a broader search term or reset the crop, condition, and agent filters."
            action={
              <button
                type="button"
                onClick={clearFilters}
                className="btn-secondary"
              >
                Reset filters
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredDiseases.map((disease) => (
            <DiseaseCard
              key={disease.id}
              disease={disease}
              imageSrc={SAMPLE_IMAGE_BY_CLASS.get(disease.id)}
            />
          ))}
        </div>
      )}

      <div className="flex items-start gap-2 rounded-xl border border-line bg-panel/60 p-4 text-[10px] leading-relaxed text-faint">
        <BookOpen
          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lime"
          aria-hidden="true"
        />
        <p>
          Reference basis: PlantVillage class labels and general plant pathology
          extension literature. Class names follow the dataset taxonomy,
          including its historical spellings. This library is not a diagnostic
          key and does not replace laboratory confirmation.
        </p>
      </div>
    </PageContainer>
  );
};
