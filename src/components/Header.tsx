import React from 'react';
import { 
  Sparkles, 
  Download, 
  Copy, 
  Layers, 
  CheckCircle2, 
  Cpu,
  Key
} from 'lucide-react';
import { PlatformPreset, GeminiModelId } from '../types';
import { ModelSelector } from './ModelSelector';

interface HeaderProps {
  platform: PlatformPreset;
  setPlatform: (p: PlatformPreset) => void;
  selectedModel: GeminiModelId;
  onSelectModel: (m: GeminiModelId) => void;
  totalCount: number;
  completedCount: number;
  onOpenExportModal: () => void;
  onCopyAll: () => void;
  isProcessing: boolean;
  onProcessAll: () => void;
  copiedAll: boolean;
  onOpenApiKeyModal: () => void;
  apiKeyCount: number;
  useCustomKeys: boolean;
  activeKeyLabel?: string;
}

export const Header: React.FC<HeaderProps> = ({
  platform,
  setPlatform,
  selectedModel,
  onSelectModel,
  totalCount,
  completedCount,
  onOpenExportModal,
  onCopyAll,
  isProcessing,
  onProcessAll,
  copiedAll,
  onOpenApiKeyModal,
  apiKeyCount,
  useCustomKeys,
  activeKeyLabel,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center shadow-md shadow-indigo-500/15 shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-tight text-white">
                StockMeta <span className="text-indigo-400 font-semibold">AI</span>
              </span>
              <span className="text-[10px] font-medium tracking-wide px-1.5 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800 font-mono">
                Studio
              </span>
            </div>
          </div>
        </div>

        {/* Platform Target Preset Segmented Control */}
        <div className="hidden lg:flex items-center bg-slate-900/80 p-0.5 rounded-xl border border-slate-800/90 text-xs font-medium">
          {(['all', 'adobestock', 'shutterstock', 'freepik', 'getty'] as PlatformPreset[]).map((p) => {
            const labelMap: Record<PlatformPreset, string> = {
              all: 'Universal',
              adobestock: 'Adobe Stock',
              shutterstock: 'Shutterstock',
              freepik: 'Freepik',
              getty: 'iStock / Getty',
            };
            const active = platform === p;
            return (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`px-3 py-1 rounded-lg transition-all text-[11px] cursor-pointer ${
                  active
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {labelMap[p]}
              </button>
            );
          })}
        </div>

        {/* Global Controls & Selectors */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Gemini Model Selector */}
          <ModelSelector
            selectedModel={selectedModel}
            onSelectModel={onSelectModel}
          />

          {/* API Key Manager Button */}
          <button
            onClick={onOpenApiKeyModal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
              useCustomKeys && apiKeyCount > 0
                ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/50 shadow-sm'
                : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 text-slate-300 hover:text-white'
            }`}
            title="Kelola API Key Gemini & Auto-Rotation Pool"
          >
            <Key className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline text-[11px] text-slate-400">Keys:</span>
            <span className="font-semibold text-white text-xs">
              {useCustomKeys && apiKeyCount > 0 ? `${apiKeyCount}` : 'Default'}
            </span>
          </button>

          {/* Batch Status Pill */}
          {totalCount > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/80 rounded-xl border border-slate-800 text-[11px] text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                <strong>{completedCount}</strong>/{totalCount}
              </span>
            </div>
          )}

          {/* Process All Action */}
          {totalCount > 0 && completedCount < totalCount && (
            <button
              onClick={onProcessAll}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm disabled:opacity-50 transition-all cursor-pointer"
            >
              <Cpu className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isProcessing ? 'Proses...' : 'Analyze All'}</span>
              <span className="sm:hidden">{isProcessing ? '...' : 'Run'}</span>
            </button>
          )}

          {/* Export & Copy Actions */}
          {completedCount > 0 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onCopyAll}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl bg-slate-900/80 hover:bg-slate-850 text-slate-200 border border-slate-800 transition-colors cursor-pointer"
                title="Copy all generated metadata to clipboard"
              >
                {copiedAll ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300 text-[11px]">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[11px]">Copy All</span>
                  </>
                )}
              </button>

              <button
                onClick={onOpenExportModal}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
