import React from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Trash2, 
  Play, 
  Search, 
  Video,
  FileCode,
  ImagePlus
} from 'lucide-react';
import { StockItem } from '../types';

interface QueueListProps {
  items: StockItem[];
  selectedId: string | null;
  onSelectItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onProcessItem: (id: string) => void;
  onProcessAll: () => void;
  onClearAll: () => void;
  onAttachPreview?: (id: string, file: File) => void;
  isProcessing: boolean;
}

export const QueueList: React.FC<QueueListProps> = ({
  items,
  selectedId,
  onSelectItem,
  onDeleteItem,
  onProcessItem,
  onProcessAll,
  onClearAll,
  onAttachPreview,
  isProcessing,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState<'all' | 'completed' | 'pending' | 'error'>('all');

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;
    if (filterStatus === 'completed') return item.status === 'completed';
    if (filterStatus === 'pending') return item.status === 'idle' || item.status === 'analyzing';
    if (filterStatus === 'error') return item.status === 'error';
    return true;
  });

  const completedCount = items.filter((i) => i.status === 'completed').length;
  const pendingCount = items.filter((i) => i.status === 'idle').length;

  return (
    <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-800 p-4 shadow-lg flex flex-col h-full max-h-[750px]">
      {/* Header & Controls */}
      <div className="pb-3 border-b border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Batch Queue
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700/80">
              {items.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {pendingCount > 0 && (
              <button
                onClick={onProcessAll}
                disabled={isProcessing}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                title="Proses semua file yang pending"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Proses ({pendingCount})</span>
              </button>
            )}

            {items.length > 0 && (
              <button
                onClick={onClearAll}
                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
                title="Hapus semua file dalam antrian"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Search & filter row */}
        <div className="flex items-center gap-2 text-xs">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari file..."
              className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-2 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-300 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">Semua ({items.length})</option>
            <option value="completed">Ready ({completedCount})</option>
            <option value="pending">Pending ({pendingCount})</option>
            <option value="error">Error</option>
          </select>
        </div>
      </div>

      {/* Item List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-850 pr-1 mt-2 space-y-1">
        {filteredItems.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-slate-500 text-xs">
            <p>Tidak ada file dalam antrian.</p>
            <p className="mt-1 text-[11px] text-slate-600">Unggah file atau klik "Muat 6 Contoh Microstock".</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isSelected = item.id === selectedId;
            return (
              <div
                key={item.id}
                onClick={() => onSelectItem(item.id)}
                className={`group flex items-center gap-3 p-2 rounded-xl transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'bg-indigo-950/40 border border-indigo-500/50 shadow-sm'
                    : 'hover:bg-slate-850/60 border border-transparent'
                }`}
              >
                {/* Thumbnail */}
                {(() => {
                  const ext = item.fileName.split('.').pop()?.toUpperCase() || 'FILE';
                  const isAi = ext === 'AI';
                  const isEps = ext === 'EPS';
                  const isVideo = item.mediaType === 'video' || ['MP4', 'MOV', 'WEBM', 'M4V', 'AVI', 'MKV'].includes(ext);
                  const isVector = isAi || isEps || ext === 'SVG';

                  if (item.previewUrl) {
                    return (
                      <div className="w-11 h-11 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden shrink-0 relative flex items-center justify-center p-0.5">
                        <img
                          src={item.previewUrl}
                          alt={item.fileName}
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                            const fallback = e.currentTarget.parentElement?.querySelector('.vector-fallback') as HTMLElement;
                            if (fallback) fallback.classList.remove('hidden');
                          }}
                        />
                        <div
                          className="vector-fallback hidden absolute inset-0 flex flex-col items-center justify-center font-bold text-[9px] text-white"
                          style={{ background: isVideo ? '#065f46' : isAi ? '#c2410c' : isEps ? '#6d28d9' : '#0369a1' }}
                        >
                          <span>{ext}</span>
                        </div>
                        {item.status === 'completed' && (
                          <div className="absolute bottom-0.5 right-0.5 bg-emerald-500 text-white rounded-full p-0.5 shadow z-10">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                          </div>
                        )}
                        {isVideo && (
                          <div className="absolute top-0.5 left-0.5 text-[7px] font-bold px-1 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-600/50 uppercase tracking-tighter">
                            {item.videoMeta?.resolutionLabel || 'VIDEO'}
                          </div>
                        )}
                        {isVector && !isVideo && (
                          <div className="absolute top-0.5 left-0.5 text-[7px] font-bold px-1 rounded bg-black/60 text-white uppercase tracking-tighter">
                            {ext}
                          </div>
                        )}
                        {isVideo && item.videoMeta?.duration && (
                          <div className="absolute bottom-0.5 left-0.5 text-[7px] font-mono font-bold px-0.5 rounded bg-black/80 text-white leading-tight">
                            {Math.floor(item.videoMeta.duration / 60)}:{(Math.floor(item.videoMeta.duration % 60)).toString().padStart(2, '0')}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div
                      className="w-11 h-11 rounded-lg border border-dashed flex flex-col items-center justify-center shrink-0 relative text-center"
                      style={{
                        borderColor: isVideo ? '#10b981' : isAi ? '#ea580c' : isEps ? '#8b5cf6' : '#64748b',
                        backgroundColor: isVideo ? 'rgba(16, 185, 129, 0.15)' : isAi ? 'rgba(234, 88, 12, 0.15)' : isEps ? 'rgba(139, 92, 246, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                      }}
                      title="File tanpa preview bawaan. Klik untuk lampirkan preview JPG/PNG"
                    >
                      <span className="font-extrabold text-[10px]" style={{ color: isVideo ? '#34d399' : isAi ? '#fb923c' : isEps ? '#c084fc' : '#94a3b8' }}>
                        {ext}
                      </span>
                      <span className="text-[7px] text-amber-300 font-semibold scale-90 leading-tight">
                        +JPG
                      </span>
                    </div>
                  );
                })()}

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-medium text-slate-200 truncate">
                      {item.fileName}
                    </p>
                    {/* Status pill */}
                    {item.status === 'completed' ? (
                      <span className="text-[9px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 shrink-0 font-mono">
                        49 KW
                      </span>
                    ) : item.status === 'analyzing' ? (
                      <span className="text-[9px] font-medium text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20 shrink-0 flex items-center gap-1">
                        <Loader2 className="w-2.5 h-2.5 animate-spin" /> Vision
                      </span>
                    ) : item.status === 'error' ? (
                      <span className="text-[9px] font-medium text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20 shrink-0">
                        Error
                      </span>
                    ) : item.needsPreview ? (
                      <span className="text-[9px] font-medium text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20 shrink-0">
                        Need JPG
                      </span>
                    ) : (
                      <span className="text-[9px] font-medium text-slate-500 bg-slate-800 px-1.5 py-0.2 rounded shrink-0">
                        Pending
                      </span>
                    )}
                  </div>

                  {item.title ? (
                    <p className="text-[10px] text-slate-400 truncate mt-0.5 font-normal">
                      {item.title}
                    </p>
                  ) : item.status === 'analyzing' ? (
                    <p className="text-[10px] text-amber-300/80 animate-pulse mt-0.5">
                      Menganalisis visual &amp; formula...
                    </p>
                  ) : item.needsPreview ? (
                    <p className="text-[10px] text-amber-300/90 font-medium mt-0.5 flex items-center gap-1 truncate">
                      <AlertCircle className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                      <span>Lampirkan preview JPG/PNG</span>
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {item.videoMeta ? (
                        <span>
                          <strong className="text-emerald-400 font-semibold">{item.videoMeta.resolutionLabel}</strong> &bull; {item.videoMeta.duration}s &bull; {(item.fileSize / (1024 * 1024)).toFixed(1)} MB
                        </span>
                      ) : (
                        <span>{(item.fileSize / 1024).toFixed(1)} KB &bull; Siap dianalisis</span>
                      )}
                    </p>
                  )}
                </div>

                {/* Item Action Button */}
                <div className="shrink-0 flex items-center gap-1 opacity-70 group-hover:opacity-100">
                  {item.needsPreview ? (
                    <label
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors cursor-pointer"
                      title="Upload preview JPG/PNG untuk file vektor ini"
                    >
                      <ImagePlus className="w-3 h-3" />
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0] && onAttachPreview) {
                            onAttachPreview(item.id, e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  ) : item.status === 'idle' || item.status === 'error' ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onProcessItem(item.id);
                      }}
                      disabled={isProcessing}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Analisis file ini sekarang"
                    >
                      <Play className="w-3 h-3 fill-current" />
                    </button>
                  ) : null}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteItem(item.id);
                    }}
                    className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Hapus dari antrian"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
