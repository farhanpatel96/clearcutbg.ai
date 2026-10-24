import { useState } from 'react';
import { Download, CheckCircle2, RotateCcw, Share2 } from 'lucide-react';
import type { ProcessedResult, ImageFileMeta } from '../types';

interface DownloadButtonProps {
  original: ImageFileMeta;
  result: ProcessedResult;
  onReset: () => void;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  original,
  result,
  onReset,
}) => {
  const [downloaded, setDownloaded] = useState<boolean>(false);

  const getCleanFilename = () => {
    const baseName = original.name.replace(/\.[^/.]+$/, '').trim();
    const sanitized = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${sanitized || 'image'}-background-removed.png`;
  };

  const handleDownload = () => {
    try {
      const filename = getCleanFilename();
      const link = document.createElement('a');
      link.href = result.url;
      link.download = filename;
      link.rel = 'noopener noreferrer';

      // Required for mobile WebKit & Firefox
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch {
      // Fallback for mobile WebKit if download attribute is restricted
      window.open(result.url, '_blank');
    }
  };

  // Optional Web Share API for mobile devices
  const handleShare = async () => {
    if (navigator.canShare && navigator.canShare({ files: [new File([result.blob], getCleanFilename(), { type: 'image/png' })] })) {
      try {
        await navigator.share({
          title: 'ClearCut AI - Background Removed',
          text: 'Here is my background-removed image',
          files: [new File([result.blob], getCleanFilename(), { type: 'image/png' })],
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleDownload();
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200/90 shadow-md">
      {/* Left Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 active:scale-98 transition-all"
        >
          <RotateCcw className="h-4 w-4 text-slate-500" />
          Process Another Image
        </button>
      </div>

      {/* Right Primary Download Buttons */}
      <div className="flex items-center gap-3 flex-wrap">
        {typeof navigator !== 'undefined' && 'canShare' in navigator && (
          <button
            type="button"
            onClick={handleShare}
            className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            title="Share image"
          >
            <Share2 className="h-4 w-4" />
          </button>
        )}

        <button
          type="button"
          onClick={handleDownload}
          className={`inline-flex items-center gap-2.5 rounded-xl px-6 py-3 text-sm font-bold shadow-md transition-all active:scale-98 ${
            downloaded
              ? 'bg-emerald-600 text-white shadow-emerald-600/20'
              : 'bg-indigo-600 text-white shadow-indigo-600/20 hover:bg-indigo-700'
          }`}
        >
          {downloaded ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              <span>Downloaded!</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>Download PNG (Transparent)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
