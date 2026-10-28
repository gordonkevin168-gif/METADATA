import React from 'react';
import { Loader2, Sparkles, CheckCircle2, Film, Layers, FileText } from 'lucide-react';

interface CartoonLoaderProps {
  fileName?: string;
  isVideo?: boolean;
  targetKeywordCount?: number;
}

export const CartoonLoader: React.FC<CartoonLoaderProps> = ({ fileName, isVideo, targetKeywordCount = 40 }) => {
  return (
    <div className="bg-[#10121a] rounded-2xl border border-white/10 p-8 shadow-md flex flex-col items-center justify-center text-center space-y-5 min-h-[420px] select-none font-sans text-slate-100">
      {/* Sleek Minimal Spinner */}
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-2 border-amber-400/20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        </div>
      </div>

      {/* Main Title & Status */}
      <div className="space-y-1.5 max-w-md">
        <h3 className="text-base font-bold text-white tracking-wide">
          Menganalisis Visual &amp; Meramu Metadata
        </h3>
        <p className="text-xs text-slate-400">
          Mengekstrak subjek visual, menyusun formula judul 15-25 kata, dan 49 keywords 4-Tier.
        </p>
      </div>

      {/* Target Asset Pill */}
      {fileName && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300 max-w-sm truncate">
          {isVideo ? (
            <Film className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : (
            <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          )}
          <span className="truncate font-mono">{fileName}</span>
          {isVideo && (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">
              Video
            </span>
          )}
        </div>
      )}

      {/* Simple Subtle Progress Bar */}
      <div className="w-full max-w-xs space-y-1.5 pt-2">
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full animate-pulse w-3/4" />
        </div>
        <div className="flex justify-between text-[11px] text-slate-500 font-mono">
          <span>Memproses AI Vision</span>
          <span>Cepat &bull; Page 1 Standard</span>
        </div>
      </div>

      {/* 3 Step Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-md w-full pt-3 border-t border-white/5 text-left text-xs">
        <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>1. Visual Subjek</span>
          </div>
          <p className="text-[10px] text-slate-500">Deteksi objek &amp; palet warna</p>
        </div>

        <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>2. Judul 15-25 Kata</span>
          </div>
          <p className="text-[10px] text-slate-500">Formula deskriptif komersial</p>
        </div>

        <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
            <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>3. {targetKeywordCount} Keywords</span>
          </div>
          <p className="text-[10px] text-slate-500">75% kata tunggal kurator</p>
        </div>
      </div>
    </div>
  );
};
