import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Eraser, 
  Paintbrush, 
  Undo2, 
  Redo2, 
  RotateCcw, 
  Check, 
  X, 
  Sliders,
  Sparkles
} from 'lucide-react';
import type { ImageFileMeta, ProcessedResult } from '../types';

interface TouchupModalProps {
  isOpen: boolean;
  onClose: () => void;
  original: ImageFileMeta;
  result: ProcessedResult;
  onApplyResult: (updatedResult: ProcessedResult) => void;
}

type BrushMode = 'erase' | 'restore';

export const TouchupModal: React.FC<TouchupModalProps> = ({
  isOpen,
  onClose,
  original,
  result,
  onApplyResult,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mode, setMode] = useState<BrushMode>('erase');
  const [brushSize, setBrushSize] = useState<number>(32);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [undoStack, setUndoStack] = useState<ImageData[]>([]);
  const [redoStack, setRedoStack] = useState<ImageData[]>([]);
  const [isReady, setIsReady] = useState<boolean>(false);

  // Cached HTML Image elements
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const processedImageRef = useRef<HTMLImageElement | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Initialize canvas and load images when modal opens
  useEffect(() => {
    if (!isOpen) {
      setIsReady(false);
      setUndoStack([]);
      setRedoStack([]);
      return;
    }

    let isMounted = true;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const origImg = new Image();
    const procImg = new Image();
    origImg.crossOrigin = 'anonymous';
    procImg.crossOrigin = 'anonymous';

    let loadedCount = 0;
    const handleLoaded = () => {
      loadedCount++;
      if (loadedCount === 2 && isMounted) {
        originalImageRef.current = origImg;
        processedImageRef.current = procImg;

        // Set intrinsic canvas dimensions
        canvas.width = procImg.naturalWidth;
        canvas.height = procImg.naturalHeight;

        // Draw initial AI result onto canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(procImg, 0, 0);

        // Save initial snapshot
        const initialData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setUndoStack([initialData]);
        setRedoStack([]);
        setIsReady(true);
      }
    };

    origImg.onload = handleLoaded;
    procImg.onload = handleLoaded;
    origImg.src = original.originalUrl;
    procImg.src = result.url;

    return () => {
      isMounted = false;
    };
  }, [isOpen, original.originalUrl, result.url]);

  // Push current canvas state to undo stack
  const saveSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setUndoStack((prev) => {
      const next = [...prev, snapshot];
      if (next.length > 20) next.shift(); // Limit to 20 history steps
      return next;
    });
    setRedoStack([]);
  }, []);

  // Handle Undo
  const handleUndo = () => {
    if (undoStack.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const current = undoStack[undoStack.length - 1];
    const previous = undoStack[undoStack.length - 2];

    setRedoStack((prev) => [...prev, current]);
    setUndoStack((prev) => prev.slice(0, prev.length - 1));

    ctx.putImageData(previous, 0, 0);
  };

  // Handle Redo
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const nextState = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setUndoStack((prev) => [...prev, nextState]);

    ctx.putImageData(nextState, 0, 0);
  };

  // Reset to original AI processed image
  const handleResetToAI = () => {
    const canvas = canvasRef.current;
    const procImg = processedImageRef.current;
    if (!canvas || !procImg) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(procImg, 0, 0);
    saveSnapshot();
  };

  // Convert mouse/pointer event coordinates to canvas internal pixel coordinates
  const getCanvasCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // Execute drawing stroke on canvas
  const drawStroke = (toX: number, toY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const from = lastPointRef.current || { x: toX, y: toY };

    ctx.save();
    if (mode === 'erase') {
      // Erase transparently
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(toX, toY);
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Dot stamp
      ctx.beginPath();
      ctx.arc(toX, toY, brushSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.fill();
    } else {
      // Restore from original image
      const origImg = originalImageRef.current;
      if (origImg) {
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(toX, toY);
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(toX, toY, brushSize / 2, 0, Math.PI * 2);

        // Clip to the brush stroke and draw the original image
        ctx.clip();
        ctx.drawImage(origImg, 0, 0, canvas.width, canvas.height);
      }
    }
    ctx.restore();

    lastPointRef.current = { x: toX, y: toY };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    const coords = getCanvasCoordinates(e);
    lastPointRef.current = coords;
    drawStroke(coords.x, coords.y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e);
    setCursorPos({ x: e.clientX, y: e.clientY });

    if (!isDrawing) return;
    drawStroke(coords.x, coords.y);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPointRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if not captured
    }
    saveSnapshot();
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === '[') {
        setBrushSize((s) => Math.max(6, s - 6));
      } else if (e.key === ']') {
        setBrushSize((s) => Math.min(120, s + 6));
      } else if (e.key === 'e' || e.key === 'E') {
        setMode('erase');
      } else if (e.key === 'r' || e.key === 'R') {
        setMode('restore');
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, undoStack, redoStack, onClose]);

  // Export edited canvas to high-res transparent PNG blob
  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const newUrl = URL.createObjectURL(blob);
      onApplyResult({
        ...result,
        blob,
        url: newUrl,
      });
      onClose();
    }, 'image/png');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        ref={containerRef}
        className="relative flex flex-col w-full max-w-5xl h-[92vh] max-h-[850px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Magic Touch-up Brush</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-700">
                  Precision Erase & Restore
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Erase background photobombers or restore subject edges with pixel accuracy
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
            title="Close editor"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toolbar Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 bg-white border-b border-slate-200 text-xs">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setMode('erase')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                mode === 'erase'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Erase unwanted background people, artifacts, or objects (Key: E)"
            >
              <Eraser className="h-4 w-4" />
              <span>Erase (Remove)</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('restore')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                mode === 'restore'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Restore parts of the original image (Key: R)"
            >
              <Paintbrush className="h-4 w-4" />
              <span>Restore</span>
            </button>
          </div>

          {/* Brush Size Slider */}
          <div className="flex items-center gap-2.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Sliders className="h-3.5 w-3.5 text-slate-500" />
            <span className="font-medium text-slate-700">Size:</span>
            <input
              type="range"
              min="8"
              max="100"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
              className="w-24 sm:w-32 accent-indigo-600 cursor-pointer"
            />
            <span className="w-8 font-mono font-semibold text-slate-800 text-right">
              {brushSize}px
            </span>
            <div 
              className="w-4 h-4 rounded-full border border-slate-400 bg-slate-300 flex items-center justify-center shrink-0 ml-1"
              title="Brush scale preview"
            >
              <div 
                className="rounded-full bg-slate-900"
                style={{ width: `${Math.max(2, brushSize / 7)}px`, height: `${Math.max(2, brushSize / 7)}px` }}
              />
            </div>
          </div>

          {/* History & Reset Controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleUndo}
              disabled={undoStack.length <= 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleResetToAI}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
              title="Reset all touch-ups back to AI result"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Canvas Interactive Work Area */}
        <div 
          className="relative flex-1 bg-checkerboard overflow-hidden flex items-center justify-center p-4 cursor-crosshair select-none"
          onPointerLeave={() => setCursorPos(null)}
        >
          {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
              <span className="text-sm font-semibold text-slate-600 animate-pulse">
                Preparing high-resolution canvas...
              </span>
            </div>
          )}

          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="max-h-full max-w-full object-contain shadow-lg rounded-lg border border-slate-300 touch-none"
          />

          {/* Dynamic Brush Hover Circle */}
          {cursorPos && (
            <div
              className="pointer-events-none fixed -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-indigo-600/80 bg-indigo-500/20 z-50 transition-[width,height] duration-75"
              style={{
                left: `${cursorPos.x}px`,
                top: `${cursorPos.y}px`,
                width: `${brushSize}px`,
                height: `${brushSize}px`,
              }}
            />
          )}
        </div>

        {/* Bottom Action Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50">
          <div className="text-xs text-slate-500 hidden sm:block">
            Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 font-mono text-[10px]">E</kbd> for Erase, <kbd className="px-1.5 py-0.5 rounded bg-slate-200 font-mono text-[10px]">R</kbd> for Restore, <kbd className="px-1.5 py-0.5 rounded bg-slate-200 font-mono text-[10px]">[</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-slate-200 font-mono text-[10px]">]</kbd> to resize brush.
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-98 transition-all"
            >
              <Check className="h-4 w-4" />
              <span>Apply & Save Touch-ups</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
