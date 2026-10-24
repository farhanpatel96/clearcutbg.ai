import { useState, useEffect, useRef } from 'react';
import { 
  Header 
} from './components/Header';
import { 
  UploadArea 
} from './components/UploadArea';
import { 
  ImagePreview 
} from './components/ImagePreview';
import { 
  ProcessingIndicator 
} from './components/ProcessingIndicator';
import { 
  DownloadButton 
} from './components/DownloadButton';
import { 
  ErrorMessage 
} from './components/ErrorMessage';
import { 
  PrivacyModal 
} from './components/PrivacyModal';
import { 
  checkApiHealth, 
  removeBackgroundApi 
} from './services/api';
import type { 
  HealthStatus, 
  ImageFileMeta, 
  ProcessedResult, 
  ProcessingStatus 
} from './types';
import { 
  Scissors, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Layers, 
  ArrowRight,
} from 'lucide-react';

export function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [selectedImage, setSelectedImage] = useState<ImageFileMeta | null>(null);
  const [processedResult, setProcessedResult] = useState<ProcessedResult | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [refineEdges, setRefineEdges] = useState<boolean>(false);
  const [mainSubjectOnly, setMainSubjectOnly] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState<boolean>(false);
  const [isReprocessing, setIsReprocessing] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Poll health on mount
  useEffect(() => {
    let mounted = true;
    const fetchHealth = async () => {
      const h = await checkApiHealth();
      if (mounted) setHealth(h);
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Handle selected image from file picker / drag-and-drop / sample preset
  const handleImageSelected = (meta: ImageFileMeta) => {
    // Cleanup prior results
    if (processedResult?.url) {
      URL.revokeObjectURL(processedResult.url);
    }
    setErrorMessage(null);
    setSelectedImage(meta);
    setProcessedResult(null);
    setStatus('idle');
    setProgressPercent(0);
  };

  // Trigger background removal execution
  const handleRemoveBackground = async (forceRefine?: boolean, forceMainSubject?: boolean) => {
    if (!selectedImage) return;

    const useMatting = forceRefine !== undefined ? forceRefine : refineEdges;
    const useMainSubject = forceMainSubject !== undefined ? forceMainSubject : mainSubjectOnly;
    setErrorMessage(null);
    setStatus('reading');
    setProgressPercent(10);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const result = await removeBackgroundApi(
        selectedImage.file,
        useMatting,
        useMainSubject,
        (percent) => {
          setProgressPercent(percent);
          if (percent >= 100) {
            setStatus('processing');
          }
        },
        controller.signal
      );

      setProcessedResult(result);
      setStatus('success');
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setStatus('idle');
        return;
      }
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setErrorMessage(message);
      setStatus('error');
    } finally {
      abortControllerRef.current = null;
      setIsReprocessing(false);
    }
  };

  // Toggle refine edges and reprocess
  const handleToggleRefineEdges = () => {
    const nextVal = !refineEdges;
    setRefineEdges(nextVal);
    if (status === 'success' && selectedImage) {
      setIsReprocessing(true);
      handleRemoveBackground(nextVal, mainSubjectOnly);
    }
  };

  // Toggle main subject only and reprocess
  const handleToggleMainSubjectOnly = () => {
    const nextVal = !mainSubjectOnly;
    setMainSubjectOnly(nextVal);
    if (status === 'success' && selectedImage) {
      setIsReprocessing(true);
      handleRemoveBackground(refineEdges, nextVal);
    }
  };

  // Update processed result from touch-up brush
  const handleUpdateResult = (updatedResult: ProcessedResult) => {
    setProcessedResult(updatedResult);
  };

  // Cancel processing in progress
  const handleCancelProcessing = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus('idle');
    setProgressPercent(0);
  };

  // Reset to initial state
  const handleReset = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (selectedImage?.originalUrl) {
      URL.revokeObjectURL(selectedImage.originalUrl);
    }
    if (processedResult?.url) {
      URL.revokeObjectURL(processedResult.url);
    }
    setSelectedImage(null);
    setProcessedResult(null);
    setStatus('idle');
    setErrorMessage(null);
    setProgressPercent(0);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Navigation Header */}
      <Header 
        health={health} 
        onOpenPrivacy={() => setIsPrivacyOpen(true)} 
      />

      {/* Main Content Container */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
        
        {/* Hero Section (visible when no image selected or in idle state) */}
        {!selectedImage && (
          <section className="text-center space-y-4 max-w-3xl mx-auto pt-4 sm:pt-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <span>Real AI Segmentation &bull; Free & Instant</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              Remove Image Backgrounds <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 bg-clip-text text-transparent">
                in Seconds
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Upload your image and get a clean, transparent background in just a few clicks. Powered by state-of-the-art AI segmentation.
            </p>
          </section>
        )}

        {/* Global Error Banner if any */}
        {errorMessage && (
          <ErrorMessage
            message={errorMessage}
            onDismiss={() => setErrorMessage(null)}
            onRetry={selectedImage ? () => handleRemoveBackground() : undefined}
            onSelectDifferent={handleReset}
          />
        )}

        {/* Step 1: Upload Dropzone (When no image is chosen) */}
        {!selectedImage && (
          <UploadArea
            onImageSelected={handleImageSelected}
            onError={(msg) => setErrorMessage(msg)}
            disabled={status === 'reading' || status === 'processing'}
          />
        )}

        {/* Step 2: Image is Selected but not yet processed (or ready to remove BG) */}
        {selectedImage && status === 'idle' && (
          <div className="w-full max-w-2xl mx-auto space-y-6">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-md space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="space-y-0.5">
                  <h3 className="text-base font-bold text-slate-900">Selected Image</h3>
                  <p className="text-xs text-slate-500">
                    {selectedImage.name} &bull; {selectedImage.width} &times; {selectedImage.height}px &bull; {(selectedImage.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors"
                >
                  Change Image
                </button>
              </div>

              {/* Initial Preview Image */}
              <div className="relative h-64 sm:h-80 w-full rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200/80">
                <img
                  src={selectedImage.originalUrl}
                  alt={selectedImage.name}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Options & Action Button */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={mainSubjectOnly}
                      onChange={(e) => setMainSubjectOnly(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                    />
                    <span>Isolate Main Subject (Removes background people & objects)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-slate-600">
                    <input
                      type="checkbox"
                      checked={refineEdges}
                      onChange={(e) => setRefineEdges(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Refine complex edges (Hair / Fur / Matting)</span>
                  </label>
                </div>

                <button
                  type="button"
                  id="remove-background-btn"
                  onClick={() => handleRemoveBackground()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-7 py-3.5 text-sm font-bold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-700 active:scale-98 transition-all"
                >
                  <Scissors className="h-4 w-4" />
                  <span>Remove Background</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Processing State */}
        {(status === 'reading' || status === 'processing') && (
          <ProcessingIndicator
            status={status}
            progressPercent={progressPercent}
            onCancel={handleCancelProcessing}
            imageName={selectedImage?.name}
          />
        )}

        {/* Step 4: Results Section */}
        {status === 'success' && selectedImage && processedResult && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Visual Preview (Slider / Side-by-side / Colors) */}
            <ImagePreview
              original={selectedImage}
              result={processedResult}
              refineEdges={refineEdges}
              onToggleRefineEdges={handleToggleRefineEdges}
              mainSubjectOnly={mainSubjectOnly}
              onToggleMainSubjectOnly={handleToggleMainSubjectOnly}
              onUpdateResult={handleUpdateResult}
              isReprocessing={isReprocessing}
            />

            {/* Action & Download Bar */}
            <DownloadButton
              original={selectedImage}
              result={processedResult}
              onReset={handleReset}
            />
          </div>
        )}

        {/* Key Features & Value Proposition (Shown when in idle mode) */}
        {!selectedImage && (
          <section className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Pixel-Level Precision</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                U²-Net deep learning model detects fine edges around hair, clothing, jewelry, and complex objects with smooth transparent blending.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Complete Privacy</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Images are processed directly in volatile RAM and immediately discarded. No database, no logins, and zero persistent storage.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Full Quality PNG</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Outputs true 32-bit RGBA transparent PNGs preserving original colors, dimensions, and crisp alpha channels ready for any design tool.
              </p>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 bg-white py-6 mt-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">ClearCut AI</span>
            <span>&bull;</span>
            <span>Fast, Private AI Background Removal</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setIsPrivacyOpen(true)}
              className="hover:text-slate-900 transition-colors"
            >
              Privacy Policy
            </button>
            <span>&bull;</span>
            <span>No Cookies &bull; No Tracking</span>
          </div>
        </div>
      </footer>

      {/* Privacy Guarantee Modal */}
      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />
    </div>
  );
}

export default App;
