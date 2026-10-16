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
  Plus
} from 'lucide-react';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  onLoadSamples: () => void;
  globalContext: string;
  setGlobalContext: (ctx: string) => void;
  disabled?: boolean;
}

const CONTEXT_SUGGESTIONS = [
  'Cinematic 4K drone aerial shot of tropical island beach',
  'Slow motion pouring espresso coffee in cafe b-roll',
  'Modern fintech startup banking app and web UI icons',
  'Time-lapse sunset over modern metropolitan city skyline',
  'Minimalist boho interior foliage line art print',
  'Cyberpunk neon synthwave futuristic video background',
  'Ramadan Mubarak Islamic holiday greeting card template',
  '4K vertical 9:16 reels footage of morning coffee barista',
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
    <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/80 p-4 sm:p-5 shadow-sm space-y-4">
      {/* Context Input & Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between pb-3 border-b border-slate-800/70">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-indigo-400 shrink-0" />
          <div>
            <h3 className="text-xs font-semibold text-slate-200">
              Konteks Desain &amp; Tema Aset (Opsional)
            </h3>
            <p className="text-[11px] text-slate-400">
              Mengarahkan kata kunci Tier 3 (aplikasi komersial &amp; industri) sesuai tema spesifik Anda.
            </p>
          </div>
        </div>

        <button
          onClick={onLoadSamples}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-200 border border-slate-700/80 text-xs font-medium transition-all cursor-pointer whitespace-nowrap shadow-sm hover:border-slate-600"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Muat 6 Contoh Demo (Foto, Vektor &amp; Video)</span>
        </button>
      </div>

      {/* Context Input field with quick tags */}
      <div className="space-y-2">
        <div className="relative">
          <input
            type="text"
            value={globalContext}
            onChange={(e) => setGlobalContext(e.target.value)}
            placeholder="Contoh: Modern fintech dashboard, 4K drone sunset footage, atau Ramadan greeting card..."
            className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950/70 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-normal"
          />
          {globalContext && (
            <button
              onClick={() => setGlobalContext('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick context suggestion pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] text-slate-400 no-scrollbar">
          <span className="text-slate-500 flex items-center gap-1 shrink-0 text-[10px]">
            <Tag className="w-3 h-3" /> Ide cepat:
          </span>
          {CONTEXT_SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setGlobalContext(s)}
              className="px-2.5 py-0.5 rounded-full bg-slate-950/80 hover:bg-slate-800 text-slate-300 border border-slate-800/90 shrink-0 transition-colors cursor-pointer text-[10px]"
            >
              {s.length > 36 ? s.substring(0, 36) + '...' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Modern Minimalist Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`relative border border-dashed rounded-xl p-6 sm:p-7 text-center transition-all cursor-pointer select-none ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.002]'
            : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/60'
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
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 transition-transform">
            <UploadCloud className="w-5 h-5" />
          </div>

          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-slate-200">
              Drag &amp; drop file di sini, atau{' '}
              <span className="text-indigo-400 underline decoration-indigo-400/40 font-medium">pilih dari komputer</span>
            </p>
            <p className="text-[11px] text-slate-400 max-w-lg mx-auto">
              Mendukung video <strong className="text-slate-300">MP4, MOV, WebM (4K &amp; HD)</strong>, file vektor{' '}
              <strong className="text-slate-300">EPS, AI, SVG</strong>, serta foto <strong className="text-slate-300">JPG, PNG, WEBP</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-[10px] text-slate-400 font-mono">
            <span className="px-2 py-0.5 rounded-md bg-emerald-950/50 text-emerald-300 border border-emerald-800/40 flex items-center gap-1">
              <Video className="w-3 h-3" /> 4K &amp; HD Video
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 border border-slate-800 flex items-center gap-1">
              <FileCode className="w-3 h-3" /> EPS / AI Vector
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 border border-slate-800 flex items-center gap-1">
              <ImageIcon className="w-3 h-3" /> JPG / PNG / SVG
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
