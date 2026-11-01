import { getApiBaseUrl } from './apiClient';

export interface MonitoringMetrics {
  status: string;
  available: boolean;
  generatedAt: string;
  totals: {
    totalRequests: number;
    successfulPredictions: number;
    modelUnavailable: number;
    rejectedUploads: number;
    errorResponses: number;
  };
  latency: {
    p50Ms: number | null;
    p95Ms: number | null;
    sampleCount: number;
    note: string | null;
  };
  confidence: {
    meanTop1Score: number | null;
    sampleCount: number;
    note: string | null;
  };
  classDistribution: {
    classId: string;
    label: string;
    count: number;
    share: number;
  }[];
  confidenceTrend: {
    timestamp: string;
    meanTop1Score: number;
  }[];
  drift: {
    available: boolean;
    method: string | null;
    psi: number | null;
    ksStatistic: number | null;
    baselineClassCount: number;
    message: string | null;
  };
  recentEvents: {
    id: number;
    requestId: string;
    createdAt: string;
    filename: string;
    source: string;
    status: string;
    predictedClassId: string | null;
    predictedClassLabel: string | null;
    top1Score: number | null;
    latencyMs: number | null;
    errorCode: string | null;
  }[];
  notes: string[];
}

export async function getMonitoringMetrics(
  signal?: AbortSignal,
): Promise<MonitoringMetrics> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/monitoring/metrics`,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
    },
  );

  if (!response.ok) {
    throw new Error(
      `Monitoring API request failed (${response.status}).`,
    );
  }

  const data = (await response.json()) as MonitoringMetrics;

  if (!data || typeof data !== 'object' || !data.totals) {
    throw new Error('The monitoring API returned an invalid response.');
  }

  return data;
}