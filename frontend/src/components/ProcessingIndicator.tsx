import { Loader2, X, Sparkles, Cpu } from 'lucide-react';
import type { ProcessingStatus } from '../types';

interface ProcessingIndicatorProps {
  status: ProcessingStatus;
  progressPercent: number;
  onCancel: () => void;
  imageName?: string;
}

export const ProcessingIndicator: React.FC<ProcessingIndicatorProps> = ({
  status,
  progressPercent,
  onCancel,
  imageName,
}) => {
  if (status !== 'reading' && status !== 'processing') {
    return null;
  }

  const isUploading = progressPercent < 100;

  return (
    <div className="w-full max-w-xl mx-auto my-8 p-8 bg-white rounded-2xl border border-slate-200/90 shadow-md text-center space-y-6">
      {/* Animated Spinner & Icon */}
      <div className="relative inline-flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-indigo-100 animate-ping opacity-30" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-inner">
          <Loader2 className="h-10 w-10 animate-spin" />
          <Sparkles className="h-4 w-4 absolute top-2 right-2 text-indigo-400" />
        </div>
      </div>

      {/* Status Headlines */}
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-slate-900">
          {isUploading ? 'Uploading Image...' : 'Removing background...'}
        </h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          {isUploading
            ? `Uploading ${imageName || 'image'} to server (${progressPercent}%)`
            : 'AI model is isolating subject foreground and computing transparency mask...'}
        </p>
      </div>

      {/* Progress Bar (if uploading) or indeterminate glowing bar */}
      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
        {isUploading ? (
          <div
            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        ) : (
          <div className="relative w-full h-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 rounded-full animate-pulse" />
          </div>
        )}
      </div>

      {/* Hardware / Processing Note */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
        <Cpu className="h-3.5 w-3.5 text-indigo-500" />
        <span>No fake timers. Inference runs directly on AI model.</span>
      </div>

      {/* Cancel Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-slate-200"
        >
          <X className="h-3.5 w-3.5" />
          Cancel Processing
        </button>
      </div>
    </div>
  );
};
