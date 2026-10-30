export interface ClassScore {
  classId: string;
  crop: string;
  label: string;
  score: number;
}

export interface DemoPrediction {
  classes: ClassScore[];
  top: ClassScore;
  latencyMs: number;
  modelVersion: string;
  isDemo: true;
  seed: string;
}

export interface ImageMetadata {
  name: string;
  mimeType: string;
  sizeBytes?: number;
  lastModified?: number;
  width?: number;
  height?: number;
  source: 'upload' | 'sample';
  licenseNote?: string;
}

export interface SelectedImage {
  id: string;
  src: string;
  seed: string;
  sampleClassId?: string;
  meta: ImageMetadata;
}
