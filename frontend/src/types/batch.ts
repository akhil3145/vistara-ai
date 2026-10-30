import type { FormattedPrediction, ImageMetadata } from './prediction';

export type BatchItemStatus = 'queued' | 'analyzing' | 'complete' | 'error';

export interface BatchItem {
  id: string;
  src: string;
  seed: string;
  sampleClassId?: string;
  meta: ImageMetadata;
  file?: File;
  status: BatchItemStatus;
  prediction?: FormattedPrediction;
  error?: string;
}

export type BatchStatusFilter =
  | 'all'
  | 'review'
  | 'confident'
  | 'pending'
  | 'error';

export type BatchConfidenceFilter =
  | 'all'
  | 'lt50'
  | '50to70'
  | '70to90'
  | 'gte90';
