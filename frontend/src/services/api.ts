import type { HealthStatus, ProcessedResult } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Check backend API health and AI model readiness status.
 */
export async function checkApiHealth(): Promise<HealthStatus> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API health check failed with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    return {
      status: 'error',
      model_ready: false,
      model_name: 'unknown',
      version: 'unknown',
    };
  }
}

/**
 * Remove image background with real upload progress tracking and cancellation support.
 */
export function removeBackgroundApi(
  file: File,
  refineEdges: boolean = false,
  mainSubjectOnly: boolean = false,
  onProgress?: (percentage: number) => void,
  signal?: AbortSignal
): Promise<ProcessedResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('refine_edges', refineEdges ? 'true' : 'false');
    formData.append('main_subject_only', mainSubjectOnly ? 'true' : 'false');

    // Handle abort signal
    if (signal) {
      signal.addEventListener('abort', () => {
        xhr.abort();
        reject(new DOMException('Upload canceled by user', 'AbortError'));
      });
    }

    // Real upload progress tracking
    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.open('POST', `${API_BASE_URL}/api/remove-background`);
    xhr.responseType = 'blob';

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const blob = xhr.response as Blob;
        const url = URL.createObjectURL(blob);
        const timeHeader = xhr.getResponseHeader('X-Processing-Time-Ms');
        const processingTimeMs = timeHeader ? parseFloat(timeHeader) : undefined;

        // Inspect image dimensions from the returned blob
        const img = new Image();
        img.onload = () => {
          resolve({
            blob,
            url,
            processingTimeMs,
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
        };
        img.onerror = () => {
          resolve({
            blob,
            url,
            processingTimeMs,
            width: 0,
            height: 0,
          });
        };
        img.src = url;
      } else {
        // Try parsing error message from JSON blob
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errObj = JSON.parse(reader.result as string);
            reject(new Error(errObj.detail || `Server error (${xhr.status})`));
          } catch {
            if (xhr.status === 413) {
              reject(new Error('File exceeds maximum allowed upload size (15MB).'));
            } else if (xhr.status === 503) {
              reject(new Error('AI model is busy or initializing. Please try again shortly.'));
            } else if (xhr.status === 429) {
              reject(new Error('Too many requests. Please wait a minute before trying again.'));
            } else {
              reject(new Error(`Server error (${xhr.status}): Failed to remove background.`));
            }
          }
        };
        reader.onerror = () => {
          reject(new Error(`Failed to remove background (Status code: ${xhr.status})`));
        };
        reader.readAsText(xhr.response);
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network connection error. Please verify the backend server is running.'));
    };

    xhr.ontimeout = () => {
      reject(new Error('The request timed out. High-resolution images may take longer to process.'));
    };

    xhr.send(formData);
  });
}
