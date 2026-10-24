import { useState } from 'react';
import { 
  Split, 
  Columns, 
  Sparkles, 
  Layers, 
  Check, 
  Clock,
  FileImage,
  Eraser,
  UserCheck
} from 'lucide-react';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { TouchupModal } from './TouchupModal';
import type { ImageFileMeta, ProcessedResult, PreviewBackgroundMode } from '../types';

interface ImagePreviewProps {
  original: ImageFileMeta;
  result: ProcessedResult;
  refineEdges: boolean;
  onToggleRefineEdges: () => void;
  mainSubjectOnly: boolean;
  onToggleMainSubjectOnly: () => void;
  onUpdateResult: (updatedResult: ProcessedResult) => void;
  isReprocessing?: boolean;
}

const BG_COLOR_OPTIONS: { id: PreviewBackgroundMode; name: string; bgClass: string; isChecker?: boolean }[] = [
  { id: 'checkerboard', name: 'Transparent (PNG)', bgClass: 'bg-checkerboard', isChecker: true },
  { id: 'white', name: 'White', bgClass: 'bg-white' },
  { id: 'black', name: 'Black', bgClass: 'bg-slate-950' },
  { id: 'gray', name: 'Light Gray', bgClass: 'bg-slate-100' },
  { id: 'indigo', name: 'Indigo', bgClass: 'bg-indigo-600' },
  { id: 'emerald', name: 'Emerald', bgClass: 'bg-emerald-600' },
  { id: 'amber', name: 'Warm Amber', bgClass: 'bg-amber-500' },
  { id: 'rose', name: 'Rose', bgClass: 'bg-rose-500' },
];

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  original,
  result,
  refineEdges,
  onToggleRefineEdges,
  mainSubjectOnly,
  onToggleMainSubjectOnly,
  onUpdateResult,
  isReprocessing = false,
}) => {
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side' | 'result-only'>('slider');
  const [bgMode, setBgMode] = useState<PreviewBackgroundMode>('checkerboard');
  const [isTouchupOpen, setIsTouchupOpen] = useState<boolean>(false);

  const getBgClass = (mode: PreviewBackgroundMode) => {
    switch (mode) {
      case 'white': return 'bg-white';
      case 'black': return 'bg-slate-950';
      case 'gray': return 'bg-slate-100';
      case 'indigo': return 'bg-indigo-600';
      case 'emerald': return 'bg-emerald-600';
      case 'amber': return 'bg-amber-500';
      case 'rose': return 'bg-rose-500';
      case 'checkerboard':
      default:
        return 'bg-checkerboard';
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Toolbar: View Switcher, Background Color Selector, Edge Refinement, Main Subject, Touch-up */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode('slider')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === 'slider'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Split className="h-3.5 w-3.5" />
            <span>Slider</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('side-by-side')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === 'side-by-side'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Columns className="h-3.5 w-3.5" />
            <span>Side-by-Side</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('result-only')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === 'result-only'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Isolated Only</span>
          </button>
        </div>

        {/* Background Color Preview Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 hidden sm:inline">Preview On:</span>
          <div className="flex items-center gap-1.5">
            {BG_COLOR_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setBgMode(opt.id)}
                title={`Preview on ${opt.name}`}
                className={`relative h-7 w-7 rounded-full border transition-all ${
                  opt.isChecker ? 'bg-checkerboard border-slate-300' : opt.bgClass
                } ${
                  bgMode === opt.id
                    ? 'ring-2 ring-indigo-500 ring-offset-2 scale-110'
                    : 'border-slate-300 hover:scale-105'
                }`}
              >
                {bgMode === opt.id && (
                  <Check
                    className={`h-3.5 w-3.5 absolute inset-0 m-auto ${
                      opt.id === 'white' || opt.id === 'checkerboard' || opt.id === 'gray'
                        ? 'text-slate-900'
                        : 'text-white'
                    }`}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Action Controls: Main Subject Only, Edge Refinement, Touch-up Eraser */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            disabled={isReprocessing}
            onClick={onToggleMainSubjectOnly}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
              mainSubjectOnly
                ? 'bg-violet-50 text-violet-700 ring-1 ring-violet-600/30 font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            } disabled:opacity-50`}
            title="Automatically eliminate background people, photobombers, and stray objects"
          >
            <UserCheck className="h-3.5 w-3.5 text-violet-600" />
            <span>Main Subject Only</span>
            {mainSubjectOnly && <span className="h-1.5 w-1.5 rounded-full bg-violet-600" />}
          </button>

          <button
            type="button"
            disabled={isReprocessing}
            onClick={onToggleRefineEdges}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
              refineEdges
                ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/30 font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            } disabled:opacity-50`}
            title="Uses alpha matting for complex hair and fur boundaries"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            <span>Refine Edges</span>
            {refineEdges && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />}
          </button>

          <button
            type="button"
            onClick={() => setIsTouchupOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 ring-1 ring-rose-200 transition-all shadow-2xs"
            title="Open precision brush to erase background objects or restore edges"
          >
            <Eraser className="h-3.5 w-3.5 text-rose-600" />
            <span>Erase / Touch-up</span>
          </button>
        </div>
      </div>

      {/* Interactive Touch-up Modal */}
      <TouchupModal
        isOpen={isTouchupOpen}
        onClose={() => setIsTouchupOpen(false)}
        original={original}
        result={result}
        onApplyResult={onUpdateResult}
      />

      {/* Main Preview Container */}
      <div className="w-full">
        {viewMode === 'slider' && (
          <BeforeAfterSlider
            originalUrl={original.originalUrl}
            processedUrl={result.url}
            backgroundMode={bgMode}
          />
        )}

        {viewMode === 'side-by-side' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original Card */}
            <div className="flex flex-col rounded-2xl border border-slate-200/90 bg-white p-3 shadow-xs">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Original
                </span>
                <span className="text-[11px] text-slate-400">
                  {original.width} &times; {original.height} px
                </span>
              </div>
              <div className="h-[300px] sm:h-[400px] w-full rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center">
                <img
                  src={original.originalUrl}
                  alt="Original input"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Background Removed Card */}
            <div className="flex flex-col rounded-2xl border border-slate-200/90 bg-white p-3 shadow-xs">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" />
                  Background Removed
                </span>
                <span className="text-[11px] text-emerald-600 font-medium">
                  Transparent PNG
                </span>
              </div>
              <div
                className={`h-[300px] sm:h-[400px] w-full rounded-xl overflow-hidden flex items-center justify-center transition-colors ${getBgClass(
                  bgMode
                )}`}
              >
                <img
                  src={result.url}
                  alt="Background removed result"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        )}

        {viewMode === 'result-only' && (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
            <div
              className={`h-[360px] sm:h-[500px] w-full rounded-xl overflow-hidden flex items-center justify-center transition-colors ${getBgClass(
                bgMode
              )}`}
            >
              <img
                src={result.url}
                alt="Isolated subject"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}
      </div>

      {/* Image Metadata Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white rounded-xl border border-slate-200/80 text-xs text-slate-600 shadow-2xs">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 font-medium text-slate-800">
            <FileImage className="h-4 w-4 text-indigo-500" />
            <span className="truncate max-w-[200px] sm:max-w-[300px]" title={original.name}>
              {original.name}
            </span>
          </div>
          <span className="text-slate-300">|</span>
          <span>
            {original.width} &times; {original.height} px
          </span>
          <span className="text-slate-300">|</span>
          <span>{(original.size / 1024).toFixed(1)} KB</span>
        </div>

        {result.processingTimeMs !== undefined && (
          <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md font-medium">
            <Clock className="h-3.5 w-3.5" />
            <span>AI Processed in {(result.processingTimeMs / 1000).toFixed(2)}s</span>
          </div>
        )}
      </div>
    </div>
  );
};
