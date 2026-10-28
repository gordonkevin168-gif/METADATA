import React, { useRef, useState } from 'react';
import { 
  UploadCloud, 
  Sparkles, 
  Compass, 
  Tag, 
  Video, 
  Image as ImageIcon, 
  FileCode,
  X,
  Play
} from 'lucide-react';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  onLoadSamples: () => void;
  globalContext: string;
  setGlobalContext: (ctx: string) => void;
  disabled?: boolean;
}

const CONTEXT_SUGGESTIONS = [
  'Fintech startup banking app and web UI icons',
  'Cinematic 4K drone aerial sunset tropical beach',
  'Slow motion espresso coffee beans b-roll',
  'Minimalist boho interior foliage line art print',
  'Cyberpunk neon synthwave video background',
  'Ramadan Mubarak Islamic holiday greeting template',
  '4K vertical 9:16 reels morning coffee barista',
];

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFilesSelected,
  onLoadSamples,
  globalContext,
  setGlobalContext,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  return (
    <div className="bg-[#12131c] rounded-2xl border-2 border-[#2b2d3d] p-4 sm:p-5 shadow-[4px_4px_0px_#000] space-y-4 font-mono select-none">
      {/* Context Input & Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between pb-3 border-b-2 border-[#212332]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-indigo-950 text-indigo-400 border border-indigo-500/40 flex items-center justify-center shrink-0">
            <Compass className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              Konteks Desain &amp; Tema Aset (Opsional)
            </h3>
            <p className="text-[11px] text-slate-400">
              Mengarahkan kata kunci Tier 3 (aplikasi industri &amp; use case) sesuai tema spesifik Anda.
            </p>
          </div>
        </div>

        <button
          onClick={onLoadSamples}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e2030] hover:bg-[#282b40] text-amber-300 border-2 border-black font-bold text-xs shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer whitespace-nowrap"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Muat 6 Demo Microstock</span>
        </button>
      </div>

      {/* Context Input field with quick tags */}
      <div className="space-y-2">
        <div className="relative">
          <input
            type="text"
            value={globalContext}
            onChange={(e) => setGlobalContext(e.target.value)}
            placeholder="Ketik tema aset (misal: Fintech dashboard, 4K sunset drone footage, Ramadan banner)..."
            className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#090a12] border-2 border-[#2b2d3d] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-all font-mono"
          />
          {globalContext && (
            <button
              onClick={() => setGlobalContext('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick context suggestion pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] text-slate-400 no-scrollbar">
          <span className="text-slate-500 flex items-center gap-1 shrink-0 text-[10px] uppercase font-bold">
            <Tag className="w-3 h-3 text-amber-400" /> Ide Cepat:
          </span>
          {CONTEXT_SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setGlobalContext(s)}
              className="px-2.5 py-0.5 rounded-md bg-[#181a28] hover:bg-[#222538] text-slate-300 hover:text-white border border-[#2b2d42] shrink-0 transition-all cursor-pointer text-[10px] active:scale-95"
            >
              {s.length > 34 ? s.substring(0, 34) + '...' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Retro Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 sm:p-7 text-center transition-all cursor-pointer select-none ${
          isDragging
            ? 'border-amber-400 bg-amber-400/10'
            : 'border-[#2d3045] hover:border-amber-400/80 bg-[#090a12] hover:bg-[#0e0f1a]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/svg+xml,video/mp4,video/quicktime,video/webm,video/*,.ai,.eps,.svg,.jpg,.jpeg,.png,.webp,.mp4,.mov,.webm,.m4v,.avi,.mkv"
          className="hidden"
          onChange={handleFileInputChange}
          disabled={disabled}
        />

        <div className="flex flex-col items-center justify-center space-y-2.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-black flex items-center justify-center text-white shadow-[2px_2px_0px_#000]">
            <UploadCloud className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold text-white">
              Drag &amp; drop file ke sini, atau{' '}
              <span className="text-amber-400 underline decoration-amber-400/50 cursor-pointer">pilih dari komputer</span>
            </p>
            <p className="text-[11px] text-slate-400 max-w-lg mx-auto">
              Mendukung video <strong className="text-emerald-300">MP4, MOV, WebM (4K &amp; 3-Frame Vision)</strong>, file vektor{' '}
              <strong className="text-amber-300">EPS, AI, SVG</strong>, serta foto <strong className="text-indigo-300">JPG, PNG, WEBP</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[10px] text-slate-400 font-bold">
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
              <Video className="w-3 h-3" /> 3-FRAME 4K VIDEO
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40 flex items-center gap-1">
              <FileCode className="w-3 h-3" /> EPS / AI VECTOR
            </span>
            <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/40 flex items-center gap-1">
              <ImageIcon className="w-3 h-3" /> JPG / PNG / SVG
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
