
import { getApiBaseUrl } from './apiClient';

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  environment: string;
  timestamp: string;
  uptimeSeconds: number;
  database: {
    status: string;
    path: string;
    schemaVersion: number;
    message: string | null;
  };
  model: {
    status: string;
    loaded: boolean;
    version: string | null;
    message: string | null;
  };
}

export async function checkBackendHealth(): Promise<HealthResponse | null> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as HealthResponse;
  } catch {
    return null;
  }
}
