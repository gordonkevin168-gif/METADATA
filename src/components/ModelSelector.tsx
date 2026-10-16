import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  Check, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Clock, 
  Cpu,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { GeminiModelId, GEMINI_MODEL_OPTIONS } from '../types';

interface ModelSelectorProps {
  selectedModel: GeminiModelId;
  onSelectModel: (model: GeminiModelId) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onSelectModel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeOption = GEMINI_MODEL_OPTIONS.find((m) => m.id === selectedModel) || GEMINI_MODEL_OPTIONS[0];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-200 transition-all cursor-pointer shadow-sm focus:outline-none"
        title="Pilih Engine Model Gemini AI"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-slate-400 hidden xl:inline text-[11px]">Model:</span>
        <span className="font-semibold text-white tracking-tight">{activeOption.name}</span>
        {activeOption.isLatest && (
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30">
            {activeOption.badge}
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Modern Minimalist Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2.5 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white tracking-wide">Pilihan Model Gemini AI</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Vision &amp; 49 Keywords</span>
          </div>

          <div className="p-1 space-y-1.5 max-h-[380px] overflow-y-auto">
            {GEMINI_MODEL_OPTIONS.map((opt) => {
              const isSelected = opt.id === selectedModel;

              return (
                <div
                  key={opt.id}
                  onClick={() => {
                    onSelectModel(opt.id);
                    setIsOpen(false);
                  }}
                  className={`p-3 rounded-xl transition-all cursor-pointer border flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500/50 ring-1 ring-indigo-500/30'
                      : 'bg-slate-950/40 border-slate-800/70 hover:bg-slate-850 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white tracking-tight">{opt.name}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${
                          opt.badge === 'Terbaru'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : opt.badge === 'Ultra Cepat'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : opt.badge === 'Deep Reasoning'
                            ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {opt.badge}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {opt.speed}
                      </span>
                      {isSelected ? (
                        <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-700/80" />
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
                    {opt.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="px-3 py-2 bg-slate-950/60 rounded-xl border-t border-slate-800/80 mt-1 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              Auto-failover aktif untuk mencegah limit kuota 429
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
