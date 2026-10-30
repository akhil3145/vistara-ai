import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { DemoBadge } from '../components/ui/DemoBadge';
import { DemoBanner } from '../components/ui/DemoBanner';
import { FileDropzone } from '../components/ui/FileDropzone';
import { SampleGallery } from '../components/scanner/SampleGallery';
import {
  ScanResultPanel,
  type ScanStatus,
} from '../components/scanner/ScanResultPanel';
import { SAMPLE_GALLERY_BY_ID } from '../data/sampleGallery';
import { generateDemoPrediction } from '../lib/demoPredictions';
import { readImageDimensions, validateImageFile } from '../lib/imageUtils';
import type { DemoPrediction, SelectedImage } from '../types/prediction';

const ANALYSIS_DELAY_MS = 900;

export const ScannerPage: React.FC = () => {
  const [image, setImage] = useState<SelectedImage | null>(null);
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [prediction, setPrediction] = useState<DemoPrediction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const analysisIdRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);

  const clearPendingAnalysis = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const beginRequest = (): number => {
    clearPendingAnalysis();
    analysisIdRef.current += 1;
    return analysisIdRef.current;
  };

  const schedulePrediction = (nextImage: SelectedImage, requestId: number) => {
    setStatus('analyzing');
    setPrediction(null);
    setError(null);
    timeoutRef.current = window.setTimeout(() => {
      if (analysisIdRef.current !== requestId) return;
      setPrediction(
        generateDemoPrediction(nextImage.seed, nextImage.sampleClassId),
      );
      setStatus('success');
      timeoutRef.current = null;
    }, ANALYSIS_DELAY_MS);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const uploadSrc = image?.meta.source === 'upload' ? image.src : null;
  useEffect(() => {
    if (!uploadSrc) return;
    return () => {
      URL.revokeObjectURL(uploadSrc);
    };
  }, [uploadSrc]);

  const handleFiles = (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0];
    const validation = validateImageFile(file);
    if (!validation.ok) {
      setInputError(`${file.name}: ${validation.message}`);
      return;
    }

    const requestId = beginRequest();
    setInputError(null);
    setNotice(
      files.length > 1
        ? 'Only the first image is previewed here. Use Batch Analysis to queue multiple images.'
        : null,
    );

    const src = URL.createObjectURL(file);
    const nextImage: SelectedImage = {
      id: `upload-${file.name}-${file.lastModified}-${file.size}`,
      src,
      seed: `upload:${file.name}:${file.size}:${file.lastModified}`,
      meta: {
        name: file.name,
        mimeType: file.type || 'image/unknown',
        sizeBytes: file.size,
        lastModified: file.lastModified,
        source: 'upload',
      },
    };

    setImage(nextImage);
    setStatus('analyzing');
    setPrediction(null);
    setError(null);

    readImageDimensions(src)
      .then((dimensions) => {
        if (analysisIdRef.current !== requestId) return;
        setImage((current) =>
          current && current.src === src
            ? {
                ...current,
                meta: {
                  ...current.meta,
                  width: dimensions.width,
                  height: dimensions.height,
                },
              }
            : current,
        );
        schedulePrediction(nextImage, requestId);
      })
      .catch(() => {
        if (analysisIdRef.current !== requestId) return;
        setImage(null);
        setPrediction(null);
        setStatus('error');
        setError(
          'The selected file could not be decoded as an image. It may be corrupted or use an unsupported codec.',
        );
      });
  };

  const handleSampleSelect = (sampleId: string) => {
    const sample = SAMPLE_GALLERY_BY_ID.get(sampleId);
    if (!sample) return;
    const requestId = beginRequest();
    const nextImage: SelectedImage = {
      id: sample.id,
      src: sample.src,
      seed: `sample:${sample.id}`,
      sampleClassId: sample.classId,
      meta: {
        name: `${sample.label} (illustrative)`,
        mimeType: 'image/svg+xml',
        width: sample.width,
        height: sample.height,
        source: 'sample',
        licenseNote: sample.license,
      },
    };
    setImage(nextImage);
    setInputError(null);
    setNotice(null);
    schedulePrediction(nextImage, requestId);
  };

  const selectedSampleId =
    image?.meta.source === 'sample' ? image.id : undefined;

  return (
    <PageContainer
      title="Disease Scanner"
      subtitle="Single-leaf foliar image analysis with top-5 class scores and a Grad-CAM placeholder."
      badge={
        <span className="rounded border border-teal-500/20 bg-teal-500/10 px-2 py-0.5 font-mono text-[11px] text-teal-600 dark:text-teal-400">
          Screen A
        </span>
      }
      actions={<DemoBadge label="DEMO MODE" />}
    >
      <DemoBanner title="Simulated scanner results">
        This screen does not contact a model or backend. The upload flow,
        confidence ring, and class-score bars are populated with deterministic
        DEMO DATA so the interface can be reviewed before training is complete.
        No prediction shown here is real model inference.
      </DemoBanner>

      {inputError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{inputError}</span>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-xl border border-sky-500/25 bg-sky-500/5 p-3 text-xs text-sky-800 dark:text-sky-300"
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{notice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
        <div className="contents lg:col-span-7 lg:block lg:space-y-4">
          <div className="order-1 lg:order-none">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-navy-800 dark:bg-navy-900">
              <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
                Foliar Image Upload
              </h3>
              <FileDropzone
                id="scanner-upload"
                title="Drag and drop a leaf photograph"
                description="or browse a local file from your device"
                hint="JPEG, PNG, or WEBP. Maximum 10 MB. One image per scan."
                onFiles={handleFiles}
                disabled={status === 'analyzing'}
              />
              <p className="mt-3 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                Images are read in the browser for preview only. Uploaded files
                are not sent to a server in this phase.
              </p>
            </div>
          </div>

          <div className="order-3 lg:order-none">
            <SampleGallery
              selectedId={selectedSampleId}
              onSelect={handleSampleSelect}
              disabled={status === 'analyzing'}
            />
          </div>
        </div>

        <div className="order-2 lg:order-none lg:col-span-5">
          <ScanResultPanel
            image={image}
            status={status}
            prediction={prediction}
            error={error}
          />
        </div>
      </div>
    </PageContainer>
  );
};
