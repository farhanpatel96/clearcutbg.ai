import { useRef, useState, useCallback, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, Shield, Sparkles } from 'lucide-react';
import type { ImageFileMeta } from '../types';

interface UploadAreaProps {
  onImageSelected: (meta: ImageFileMeta) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}

const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Samples for instant testing
const SAMPLE_PRESETS = [
  {
    name: 'Portrait (Person)',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    description: 'Hair & edge precision',
  },
  {
    name: 'Product (Shoe)',
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
    description: 'Clean product cutout',
  },
  {
    name: 'Pet (Cat)',
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80',
    description: 'Fine fur segmentation',
  },
];

export const UploadArea: React.FC<UploadAreaProps> = ({
  onImageSelected,
  onError,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    // 1. Check size
    if (file.size === 0) {
      onError('Selected file is empty. Please select a valid image file.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      onError('File size exceeds the 15MB limit. Please choose a smaller image.');
      return;
    }

    // 2. Check MIME type
    if (!ALLOWED_TYPES.includes(file.type)) {
      onError('Unsupported image format. Please upload a JPG, PNG, or WEBP file.');
      return;
    }

    // 3. Inspect image dimensions using object URL
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      // Check reasonable resolution limit
      const totalPixels = img.naturalWidth * img.naturalHeight;
      if (totalPixels > 25000000) {
        URL.revokeObjectURL(objectUrl);
        onError(`Image resolution (${img.naturalWidth}x${img.naturalHeight}) exceeds maximum allowed 25 Megapixels.`);
        return;
      }

      onImageSelected({
        file,
        name: file.name,
        size: file.size,
        width: img.naturalWidth,
        height: img.naturalHeight,
        format: file.type.replace('image/', '').toUpperCase(),
        originalUrl: objectUrl,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      onError('Unable to decode this image file. It may be corrupted or in an unsupported format.');
    };

    img.src = objectUrl;
  }, [onError, onImageSelected]);

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  // Support clipboard paste (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (disabled || !e.clipboardData) return;
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [disabled, processFile]);

  // Load a sample preset image
  const handleSelectSample = async (preset: typeof SAMPLE_PRESETS[0]) => {
    if (disabled || isLoadingSample) return;
    try {
      setIsLoadingSample(true);
      const res = await fetch(preset.url);
      const blob = await res.blob();
      const file = new File([blob], `${preset.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.jpg`, {
        type: 'image/jpeg',
      });
      processFile(file);
    } catch {
      onError('Failed to load sample image. Please try uploading your own image.');
    } finally {
      setIsLoadingSample(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Upload Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload image drop zone"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        className={`relative group cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-200 focus:outline-hidden focus:ring-4 focus:ring-indigo-500/20 ${
          isDragging
            ? 'border-indigo-600 bg-indigo-50/70 scale-[1.01]'
            : 'border-slate-300 hover:border-indigo-400 bg-white hover:bg-slate-50/60 shadow-xs'
        } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          id="image-file-input"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          {/* Icon Badge */}
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-110 ${
              isDragging
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-indigo-50 text-indigo-600 ring-8 ring-indigo-50/50'
            }`}
          >
            <UploadCloud className="h-8 w-8" />
          </div>

          {/* Heading and Action */}
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">
              {isDragging ? 'Drop your image here' : 'Choose an image or drag it here'}
            </h2>
            <p className="text-sm text-slate-500">
              Supports <span className="font-medium text-slate-700">PNG, JPG, WEBP</span> up to <span className="font-medium text-slate-700">15MB</span>. Or paste from clipboard (<kbd className="rounded border border-slate-200 bg-slate-100 px-1 py-0.5 text-[11px] font-mono text-slate-600">Ctrl+V</kbd>).
            </p>
          </div>

          {/* Primary Button */}
          <div className="pt-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 active:scale-98 transition-all"
            >
              <ImageIcon className="h-4 w-4" />
              Upload Image
            </button>
          </div>
        </div>

        {/* Bottom Privacy Statement inside Dropzone */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Shield className="h-3.5 w-3.5 text-emerald-500" />
          <span>Processed in volatile memory &bull; Never saved or shared &bull; 100% private</span>
        </div>
      </div>

      {/* Preset sample images for quick testing */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            Or try one of these sample images:
          </span>
          {isLoadingSample && (
            <span className="text-xs text-indigo-600 font-medium animate-pulse">
              Loading sample...
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SAMPLE_PRESETS.map((sample) => (
            <button
              key={sample.name}
              type="button"
              disabled={disabled || isLoadingSample}
              onClick={() => handleSelectSample(sample)}
              className="flex items-center gap-3 p-2 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-left transition-all group disabled:opacity-50"
            >
              <img
                src={sample.url}
                alt={sample.name}
                className="h-12 w-12 rounded-md object-cover flex-shrink-0 group-hover:scale-105 transition-transform"
                loading="lazy"
              />
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-indigo-600">
                  {sample.name}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {sample.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
