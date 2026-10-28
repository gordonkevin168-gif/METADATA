import React from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Play, 
  Search, 
  Video,
  FileCode,
  ImagePlus,
  Sparkles,
  Loader2
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
    <div className="bg-[#12131c] rounded-2xl border-2 border-[#2b2d3d] p-4 shadow-[4px_4px_0px_#000] flex flex-col h-full max-h-[780px] font-mono select-none text-slate-100">
      {/* Header & Controls */}
      <div className="pb-3 border-b-2 border-[#212332] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-black text-white uppercase tracking-wider">
              Batch Queue
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1e2030] text-amber-300 border border-[#3b3e5b]">
              {items.length} ASET
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {pendingCount > 0 && (
              <button
                onClick={onProcessAll}
                disabled={isProcessing}
                className="px-2.5 py-1 text-[11px] font-black rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-50 flex items-center gap-1 transition-all cursor-pointer"
                title="Proses semua file yang pending"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Run ({pendingCount})</span>
              </button>
            )}

            {items.length > 0 && (
              <button
                onClick={onClearAll}
                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg border border-transparent hover:border-rose-500/40 transition-colors cursor-pointer"
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
              className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-[#090a12] border-2 border-[#2b2d3d] rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-2 py-1.5 bg-[#090a12] border-2 border-[#2b2d3d] rounded-lg text-slate-300 text-xs focus:outline-none focus:border-amber-400 cursor-pointer font-mono"
          >
            <option value="all">Semua ({items.length})</option>
            <option value="completed">Ready ({completedCount})</option>
            <option value="pending">Pending ({pendingCount})</option>
            <option value="error">Error</option>
          </select>
        </div>
      </div>

      {/* Item List */}
      <div className="flex-1 overflow-y-auto pr-1 mt-3 space-y-2">
        {filteredItems.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-slate-500 text-xs space-y-2">
            <p>Antrian kosong.</p>
            <p className="text-[11px] text-slate-600">Unggah file atau klik "Muat 6 Demo Microstock".</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isSelected = item.id === selectedId;
            const ext = item.fileName.split('.').pop()?.toUpperCase() || 'FILE';
            const isAi = ext === 'AI';
            const isEps = ext === 'EPS';
            const isVideo = item.mediaType === 'video' || ['MP4', 'MOV', 'WEBM', 'M4V', 'AVI', 'MKV'].includes(ext);
            const isVector = isAi || isEps || ext === 'SVG';

            return (
              <div
                key={item.id}
                onClick={() => onSelectItem(item.id)}
                className={`group flex items-center gap-2.5 p-2.5 rounded-xl border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#1a1c2c] border-indigo-500 shadow-[2px_2px_0px_#000]'
                    : 'bg-[#0d0e17] hover:bg-[#141624] border-[#222436]'
                }`}
              >
                {/* Thumbnail */}
                {item.previewUrl ? (
                  <div className="w-12 h-12 rounded-lg bg-[#07080e] border-2 border-[#292c3f] overflow-hidden shrink-0 relative flex items-center justify-center p-0.5 shadow-[1px_1px_0px_#000]">
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
                      <div className="absolute bottom-0.5 right-0.5 bg-emerald-500 text-black rounded p-0.5 shadow z-10">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                      </div>
                    )}
                    {isVideo && (
                      <div className="absolute top-0.5 left-0.5 text-[7px] font-bold px-1 rounded bg-black/80 text-emerald-400 border border-emerald-500/50 uppercase tracking-tighter">
                        {item.videoMeta?.resolutionLabel || 'VIDEO'}
                      </div>
                    )}
                    {isVector && !isVideo && (
                      <div className="absolute top-0.5 left-0.5 text-[7px] font-bold px-1 rounded bg-black/80 text-amber-300 uppercase tracking-tighter">
                        {ext}
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className="w-12 h-12 rounded-lg border-2 border-dashed flex flex-col items-center justify-center shrink-0 relative text-center"
                    style={{
                      borderColor: isVideo ? '#10b981' : isAi ? '#f59e0b' : isEps ? '#a855f7' : '#64748b',
                      backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    }}
                    title="File tanpa preview bawaan. Klik untuk lampirkan preview JPG/PNG"
                  >
                    <span className="font-black text-[10px]" style={{ color: isVideo ? '#34d399' : isAi ? '#fbbf24' : isEps ? '#c084fc' : '#94a3b8' }}>
                      {ext}
                    </span>
                    <span className="text-[7px] text-amber-400 font-bold scale-90 leading-tight">
                      +JPG
                    </span>
                  </div>
                )}

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-bold text-white truncate max-w-[170px]">
                      {item.fileName}
                    </p>
                    {/* Status badge */}
                    {item.status === 'completed' ? (
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/40 shrink-0">
                        {item.allKeywords?.length || 40} KW
                      </span>
                    ) : item.status === 'analyzing' ? (
                      <span className="text-[9px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40 shrink-0 flex items-center gap-1">
                        <Loader2 className="w-2.5 h-2.5 animate-spin text-amber-400" /> Memproses
                      </span>
                    ) : item.status === 'error' ? (
                      <span className="text-[9px] font-bold text-rose-400 bg-rose-950 px-1.5 py-0.5 rounded border border-rose-500/40 shrink-0">
                        Error
                      </span>
                    ) : item.needsPreview ? (
                      <span className="text-[9px] font-bold text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-500/40 shrink-0">
                        Need JPG
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-slate-400 bg-[#1e2030] px-1.5 py-0.5 rounded shrink-0">
                        Pending
                      </span>
                    )}
                  </div>

                  {item.title ? (
                    <p className="text-[10px] text-slate-400 truncate mt-0.5 font-normal">
                      {item.title}
                    </p>
                  ) : item.status === 'analyzing' ? (
                    <p className="text-[10px] text-amber-300/90 font-medium mt-0.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block mr-1" />
                      Menganalisis visual...
                    </p>
                  ) : item.needsPreview ? (
                    <label className="text-[10px] text-amber-300 font-bold mt-0.5 flex items-center gap-1 truncate cursor-pointer hover:underline">
                      <ImagePlus className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>Lampirkan preview JPG</span>
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
                  ) : (
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {(item.fileSize / 1024).toFixed(0)} KB &bull; Siap di-generate
                    </p>
                  )}
                </div>

                {/* Right Item Actions */}
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 shrink-0">
                  {item.status === 'idle' && !item.needsPreview && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onProcessItem(item.id);
                      }}
                      disabled={isProcessing}
                      className="p-1 rounded bg-[#1e2030] hover:bg-emerald-500 hover:text-black text-emerald-400 border border-emerald-500/40 transition-colors cursor-pointer"
                      title="Proses file ini sekarang"
                    >
                      <Play className="w-3 h-3 fill-current" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteItem(item.id);
                    }}
                    className="p-1 rounded hover:bg-rose-950/60 hover:text-rose-400 text-slate-500 transition-colors cursor-pointer"
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
