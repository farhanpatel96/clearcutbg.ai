import { X, ShieldCheck, HardDrive, EyeOff, Lock, Trash2 } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div 
        className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 id="privacy-modal-title" className="text-lg font-bold text-slate-900">
                100% Privacy Guarantee
              </h3>
              <p className="text-xs text-slate-500">
                How ClearCut AI protects your personal photos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body / Privacy Guarantees */}
        <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <HardDrive className="h-4 w-4" />
            </div>
            <div>
              <h5 className="font-semibold text-slate-900 text-xs sm:text-sm">
                Zero Permanent Storage
              </h5>
              <p className="text-xs text-slate-500 mt-0.5">
                Uploaded images are streamed directly into volatile system RAM for segmentation. We do not store or save files to databases, local disks, or cloud storage buckets.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Trash2 className="h-4 w-4" />
            </div>
            <div>
              <h5 className="font-semibold text-slate-900 text-xs sm:text-sm">
                Immediate Memory Eviction
              </h5>
              <p className="text-xs text-slate-500 mt-0.5">
                As soon as the transparent PNG is streamed back to your browser, all memory buffers holding your image are immediately discarded by the Python garbage collector.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <EyeOff className="h-4 w-4" />
            </div>
            <div>
              <h5 className="font-semibold text-slate-900 text-xs sm:text-sm">
                No AI Model Training on User Data
              </h5>
              <p className="text-xs text-slate-500 mt-0.5">
                Your images are never used to train or fine-tune AI models, never shared with third parties, and never indexed.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <h5 className="font-semibold text-slate-900 text-xs sm:text-sm">
                No Accounts or Tracking
              </h5>
              <p className="text-xs text-slate-500 mt-0.5">
                No login, registration, email address, cookies, or persistent identifiers required. You can process images with complete anonymity.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
          >
            Understood & Close
          </button>
        </div>
      </div>
    </div>
  );
};
