import { Scissors, ShieldCheck, AlertCircle } from 'lucide-react';
import type { HealthStatus } from '../types';

interface HeaderProps {
  health: HealthStatus | null;
  onOpenPrivacy: () => void;
}

export const Header: React.FC<HeaderProps> = ({ health, onOpenPrivacy }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-md shadow-indigo-500/20">
            <Scissors className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-slate-900">
                ClearCut <span className="text-indigo-600">AI</span>
              </span>
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                Free Tool
              </span>
            </div>
            <p className="hidden text-xs text-slate-500 sm:block">
              AI Background Remover
            </p>
          </div>
        </div>

        {/* Center / Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <span className="text-indigo-600 font-semibold cursor-default">
            Background Remover
          </span>
          <button
            type="button"
            onClick={onOpenPrivacy}
            className="text-slate-500 hover:text-slate-900 transition-colors"
          >
            Privacy Commitment
          </button>
        </nav>

        {/* Right Status & Badges */}
        <div className="flex items-center gap-3">
          {/* Real AI Model Status Badge */}
          {health ? (
            <div
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                health.model_ready
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
                  : 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20'
              }`}
              title={`Model: ${health.model_name} (Status: ${health.status})`}
            >
              {health.model_ready ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="hidden sm:inline">Model Ready</span>
                  <span className="text-[10px] text-emerald-600 font-mono">({health.model_name})</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3" />
                  <span>Loading Model</span>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300 animate-ping" />
              <span className="hidden sm:inline">Connecting...</span>
            </div>
          )}

          {/* Privacy Button */}
          <button
            type="button"
            onClick={onOpenPrivacy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-colors"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span className="hidden xs:inline">100% Private</span>
          </button>
        </div>
      </div>
    </header>
  );
};
