import React from 'react';
import { AlertTriangle, X, RefreshCw, Upload } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  onDismiss: () => void;
  onSelectDifferent?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  onDismiss,
  onSelectDifferent,
}) => {
  return (
    <div
      role="alert"
      className="w-full max-w-2xl mx-auto my-4 rounded-2xl border border-red-200 bg-red-50/90 p-4 sm:p-5 shadow-xs text-red-900 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
          <AlertTriangle className="h-5 w-5" />
        </div>

        <div className="flex-1 space-y-1">
          <h4 className="text-sm font-semibold text-red-900">
            Unable to process image
          </h4>
          <p className="text-xs sm:text-sm text-red-700 leading-relaxed">
            {message}
          </p>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-red-700 active:scale-95 transition-all"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Try Again
              </button>
            )}
            {onSelectDifferent && (
              <button
                type="button"
                onClick={onSelectDifferent}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors"
              >
                <Upload className="h-3.5 w-3.5" />
                Select Different Image
              </button>
            )}
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error message"
          className="rounded-lg p-1 text-red-500 hover:bg-red-100 hover:text-red-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
