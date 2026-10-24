export interface HealthStatus {
  status: string;
  model_ready: boolean;
  model_name: string;
  version: string;
}

export interface ImageFileMeta {
  file: File;
  name: string;
  size: number;
  width: number;
  height: number;
  format: string;
  originalUrl: string;
}

export type ProcessingStatus = 'idle' | 'reading' | 'processing' | 'success' | 'error';

export type PreviewBackgroundMode = 
  | 'checkerboard' 
  | 'white' 
  | 'black' 
  | 'gray' 
  | 'indigo' 
  | 'emerald' 
  | 'amber' 
  | 'rose';

export interface ProcessedResult {
  blob: Blob;
  url: string;
  processingTimeMs?: number;
  width: number;
  height: number;
}

export interface ApiError {
  detail: string;
  error_code?: string;
  help?: string;
}
