import { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronsLeftRight } from 'lucide-react';
import type { PreviewBackgroundMode } from '../types';

interface BeforeAfterSliderProps {
  originalUrl: string;
  processedUrl: string;
  backgroundMode?: PreviewBackgroundMode;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  originalUrl,
  processedUrl,
  backgroundMode = 'checkerboard',
}) => {
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const getBackgroundClass = (mode: PreviewBackgroundMode) => {
    switch (mode) {
      case 'white':
        return 'bg-white';
      case 'black':
        return 'bg-black';
      case 'gray':
        return 'bg-slate-100';
      case 'indigo':
        return 'bg-indigo-600';
      case 'emerald':
        return 'bg-emerald-600';
      case 'amber':
        return 'bg-amber-500';
      case 'rose':
        return 'bg-rose-500';
      case 'checkerboard':
      default:
        return 'bg-checkerboard';
    }
  };

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.min(Math.max((x / rect.width) * 100, 0), 100);
    setSliderPos(percentage);
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  }, [isDragging, handleMove]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  }, [isDragging, handleMove]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      setSliderPos((prev) => Math.max(prev - 5, 0));
    } else if (e.key === 'ArrowRight') {
      setSliderPos((prev) => Math.min(prev + 5, 100));
    }
  };

  return (
    <div
      ref={containerRef}
      role="slider"
      aria-label="Before and after comparison slider"
      aria-valuenow={Math.round(sliderPos)}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseDown={(e) => {
        setIsDragging(true);
        handleMove(e.clientX);
      }}
      onTouchStart={(e) => {
        setIsDragging(true);
        handleMove(e.touches[0].clientX);
      }}
      className="relative w-full h-[340px] sm:h-[480px] md:h-[540px] rounded-2xl overflow-hidden border border-slate-200/90 shadow-lg select-none cursor-ew-resize focus:outline-hidden focus:ring-4 focus:ring-indigo-500/20"
    >
      {/* Background layer: Processed Image with chosen background style */}
      <div className={`absolute inset-0 w-full h-full ${getBackgroundClass(backgroundMode)} flex items-center justify-center`}>
        <img
          src={processedUrl}
          alt="Background Removed Result"
          className="w-full h-full object-contain pointer-events-none"
        />
        {/* Label: Removed */}
        <span className="absolute bottom-4 right-4 z-10 rounded-md bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 text-xs font-semibold text-white tracking-wide shadow-sm">
          Background Removed
        </span>
      </div>

      {/* Foreground clipped layer: Original Image */}
      <div
        className="absolute inset-0 h-full overflow-hidden flex items-center justify-center border-r-2 border-white shadow-2xl"
        style={{ width: `${sliderPos}%` }}
      >
        <div className="absolute inset-0 w-full h-full bg-slate-100 flex items-center justify-center">
          <img
            src={originalUrl}
            alt="Original Image"
            className="w-full h-full object-contain pointer-events-none max-w-none"
            style={{
              // Match width of container to align images exactly
              width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
              height: '100%',
            }}
          />
        </div>
        {/* Label: Original */}
        <span className="absolute bottom-4 left-4 z-10 rounded-md bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 text-xs font-semibold text-white tracking-wide shadow-sm">
          Original
        </span>
      </div>

      {/* Draggable Divider Handle */}
      <div
        className="absolute top-0 bottom-0 z-20 flex items-center justify-center pointer-events-none"
        style={{ left: `calc(${sliderPos}% - 18px)` }}
      >
        <div className="w-9 h-9 rounded-full bg-white shadow-xl border-2 border-indigo-600 flex items-center justify-center text-indigo-600 transition-transform hover:scale-110 active:scale-95">
          <ChevronsLeftRight className="w-4 h-4 stroke-[2.5]" />
        </div>
      </div>
    </div>
  );
};
