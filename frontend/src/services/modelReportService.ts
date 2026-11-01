
import { getApiBaseUrl } from './apiClient';

export interface ClassMetrics {
  precision: number;
  recall: number;
  'f1-score': number;
  support: number;
}

export interface EvaluationMetrics {
  accuracy: number;
  macro_precision: number;
  macro_recall: number;
  macro_f1: number;
  weighted_f1: number;
  test_loss: number;
}

export interface EvaluationReport {
  model_name: string;
  architecture: string;
  dataset: string;
  dataset_version: string;
  num_classes: number;
  test_samples: number;
  image_size: number[];
  metrics: EvaluationMetrics;
  classification_report: Record<
    string,
    ClassMetrics | number | Record<string, number>
  >;
}

export interface ArtifactStatus {
  directory: string;
  expectedFiles: string[];
  foundFiles: string[];
  missingFiles: string[];
  evaluationReportPresent: boolean;
}

export interface ModelReportResponse {
  available: boolean;
  status: string;
  generatedAt: string | null;
  source: string;
  message: string;
  artifacts: ArtifactStatus;
  report: EvaluationReport | null;
}

export async function getModelReport(
  signal?: AbortSignal,
): Promise<ModelReportResponse> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/model/report`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal,
    },
  );

  if (!response.ok) {
    throw new Error(
      `Model report request failed: ${response.status} ${response.statusText}`,
    );
  }

  return (await response.json()) as ModelReportResponse;
}
