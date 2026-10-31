
import { getApiBaseUrl } from './apiClient';

export interface HealthResponse {
  status: string;
  database: {
    status: string;
  };
  model: {
    status: string;
    loaded: boolean;
    message: string | null;
  };
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return false;

    const data: HealthResponse = await response.json();

    return (
      data.status === 'ok' &&
      data.database?.status === 'ok' &&
      data.model?.loaded === true &&
      data.model?.status === 'loaded'
    );
  } catch {
    return false;
  }
}
