/**
 * Vistara AI - Typed Frontend API Client
 *
 * Connects the React application to the FastAPI backend.
 * Uses VITE_API_BASE_URL with a development fallback to http://127.0.0.1:8000.
 */

import type { ClassScore, RealPrediction } from '../types/prediction';

export interface PredictionCandidateDto {
  classId: string;
  crop: string | null;
  label: string | null;
  score: number;
}

export interface SinglePredictionResponseDto {
  status: 'success' | 'model_unavailable';
  message: string;
  modelVersion: string | null;
  isDemo: false;
  requestId: string;
  filename: string | null;
  elapsedMs: number | null;
  predictions: PredictionCandidateDto[];
  logged: boolean;
}

export interface BatchItemResultDto {
  filename: string;
  status: 'success' | 'accepted' | 'rejected' | 'model_unavailable' | 'error';
  sizeBytes?: number | null;
  imageFormat?: string | null;
  elapsedMs?: number | null;
  predictions: PredictionCandidateDto[];
  errorCode?: string | null;
  message?: string | null;
}

export interface BatchPredictionResponseDto {
  status:
    | 'success'
    | 'partial_success'
    | 'model_unavailable'
    | 'rejected'
    | 'error';
  message: string;
  modelVersion: string | null;
  isDemo: false;
  requestId: string;
  batchId: number;
  itemCount: number;
  acceptedCount: number;
  rejectedCount: number;
  items: BatchItemResultDto[];
  predictions: PredictionCandidateDto[];
  logged: boolean;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Resolves the configured backend base URL without a trailing slash.
 */
export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return 'http://127.0.0.1:8000';
}

/**
 * Sends a single leaf image file to the FastAPI backend for real inference.
 * Uses multipart FormData with field name 'file' expected by backend.
 * Browser automatically sets Content-Type header with the multipart boundary.
 */
export async function predictSingle(
  file: File,
  signal?: AbortSignal,
): Promise<SinglePredictionResponseDto> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/v1/predict`;

  const formData = new FormData();
  formData.append('file', file, file.name);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      body: formData,
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    throw new ApiError(
      `Unable to connect to the Vistara AI backend. Please verify that the API server is running at ${baseUrl}.`,
      0,
      'backend_unavailable',
      error,
    );
  }

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    // Response body is not JSON or empty
  }

  if (!response.ok) {
    let message = `API request failed with status ${response.status}`;
    let code: string | undefined;

    if (data?.error?.message) {
      message = data.error.message;
      code = data.error.code;
    } else if (data?.message) {
      message = data.message;
      code = data.status || code;
    } else if (typeof data?.detail === 'string') {
      message = data.detail;
      code = 'validation_error';
    } else if (Array.isArray(data?.detail)) {
      message = data.detail
        .map((d: any) => d.msg || `${d.loc?.join('.')}: ${d.type}`)
        .join(', ');
      code = 'validation_error';
    }

    if (response.status === 503) {
      message =
        message ||
        'The prediction model is currently unavailable on the backend.';
      code = code || 'model_unavailable';
    } else if (response.status === 413) {
      message =
        message || 'The uploaded image exceeds the configured size limit.';
      code = code || 'file_too_large';
    } else if (response.status === 415) {
      message =
        message ||
        'Unsupported image format. Please upload a JPEG, PNG, or WEBP image.';
      code = code || 'unsupported_format';
    } else if (response.status === 422) {
      message = `Validation error: ${message}`;
      code = code || 'unprocessable_entity';
    }

    throw new ApiError(message, response.status, code, data);
  }

  if (!data || typeof data !== 'object') {
    throw new ApiError(
      'Unexpected empty or invalid response from backend.',
      response.status,
      'invalid_response',
      data,
    );
  }

  return data as SinglePredictionResponseDto;
}

/**
 * Sends a batch of leaf image files to the FastAPI backend for real inference.
 * Uses multipart FormData with field name 'files' (plural) expected by backend.
 * Browser automatically sets Content-Type header with the multipart boundary.
 */
export async function predictBatch(
  files: File[],
  signal?: AbortSignal,
): Promise<BatchPredictionResponseDto> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/v1/predict/batch`;

  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file, file.name);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      body: formData,
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    throw new ApiError(
      `Unable to connect to the Vistara AI backend. Please verify that the API server is running at ${baseUrl}.`,
      0,
      'backend_unavailable',
      error,
    );
  }

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    // Response body is not JSON or empty
  }

  if (!response.ok) {
    let message = `Batch request failed with status ${response.status}`;
    let code: string | undefined;

    if (data?.error?.message) {
      message = data.error.message;
      code = data.error.code;
    } else if (data?.message) {
      message = data.message;
      code = data.status || code;
    } else if (typeof data?.detail === 'string') {
      message = data.detail;
      code = 'validation_error';
    } else if (Array.isArray(data?.detail)) {
      message = data.detail
        .map((d: any) => d.msg || `${d.loc?.join('.')}: ${d.type}`)
        .join(', ');
      code = 'validation_error';
    }

    if (response.status === 503) {
      message =
        message ||
        'The prediction model is currently unavailable on the backend.';
      code = code || 'model_unavailable';
    } else if (response.status === 413) {
      message =
        message || 'One or more images exceed the upload size limit (10 MB).';
      code = code || 'file_too_large';
    } else if (response.status === 400 && data?.status === 'rejected') {
      message = data.message || 'All uploaded files were rejected by the server.';
      code = code || 'rejected';
    }

    throw new ApiError(message, response.status, code, data);
  }

  if (!data || typeof data !== 'object') {
    throw new ApiError(
      'Unexpected empty or invalid batch response from backend.',
      response.status,
      'invalid_response',
      data,
    );
  }

  return data as BatchPredictionResponseDto;
}

/**
 * Maps an individual BatchItemResultDto into a strongly-typed RealPrediction object.
 */
export function mapBatchItemPrediction(
  itemDto: BatchItemResultDto,
  modelVersion: string | null,
  requestId: string,
): RealPrediction {
  const predictions: ClassScore[] = (itemDto.predictions || []).map((cand) => ({
    classId: String(cand.classId),
    crop: cand.crop ?? null,
    label: cand.label ?? `Class ${cand.classId}`,
    score: typeof cand.score === 'number' ? cand.score : 0,
  }));

  const top: ClassScore = predictions[0] || {
    classId: 'unknown',
    crop: null,
    label: 'Unknown',
    score: 0,
  };

  return {
    status: itemDto.status === 'success' ? 'success' : 'model_unavailable',
    filename: itemDto.filename,
    latencyMs:
      itemDto.elapsedMs !== null && itemDto.elapsedMs !== undefined
        ? Math.round(itemDto.elapsedMs)
        : 0,
    modelVersion: modelVersion || 'MobileNetV2',
    isDemo: false,
    classes: predictions,
    top,
    message: itemDto.message ?? undefined,
    requestId,
  };
}

/**
 * Maps the raw FastAPI JSON response DTO into the strongly-typed RealPrediction object.
 */
export function mapBackendPrediction(
  dto: SinglePredictionResponseDto,
): RealPrediction {
  const predictions: ClassScore[] = (dto.predictions || []).map((cand) => ({
    classId: String(cand.classId),
    crop: cand.crop ?? null,
    label: cand.label ?? `Class ${cand.classId}`,
    score: typeof cand.score === 'number' ? cand.score : 0,
  }));

  const top: ClassScore = predictions[0] || {
    classId: 'unknown',
    crop: null,
    label: 'Unknown',
    score: 0,
  };

  return {
    status: dto.status,
    filename: dto.filename,
    latencyMs:
      dto.elapsedMs !== null && dto.elapsedMs !== undefined
        ? Math.round(dto.elapsedMs)
        : 0,
    modelVersion: dto.modelVersion || 'MobileNetV2',
    isDemo: false,
    classes: predictions,
    top,
    message: dto.message,
    requestId: dto.requestId,
  };
}
