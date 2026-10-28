import React from 'react';
import {
  Layers,
  History as HistoryIcon,
  FolderArchive,
  Heart,
  Sparkles,
  ArrowRight,
  Play,
  FileSpreadsheet,
  Image as ImageIcon,
  Film,
  Download,
  Trash2,
} from 'lucide-react';
import { SubAppMode, StockItem } from '../types';
import { MOTION_PRESETS } from '../utils/motionPresets';

interface SecondaryViewsProps {
  mode: 'presets' | 'history' | 'files' | 'favorites';
  onSelectSubApp: (mode: SubAppMode) => void;
  items?: StockItem[];
  theme?: 'dark' | 'light';
}

export const SecondaryViews: React.FC<SecondaryViewsProps> = ({
  mode,
  onSelectSubApp,
  items = [],
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  if (mode === 'presets') {
    return (
      <div className={`space-y-6 select-none font-sans ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
        <div className={`rounded-3xl border p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
          isLight ? 'bg-white border-slate-200/90 shadow-sm' : 'bg-[#0f121e] border-white/10'
        }`}>
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>Template &amp; Preset Koleksi</h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Preset animasi kanvas 60 FPS, template prompt visual, dan formula metadata.</p>
            </div>
          </div>
          <button
            onClick={() => onSelectSubApp('motion')}
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition shadow-md shadow-orange-600/25"
          >
            <span>Buka di Motion Studio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOTION_PRESETS.map((preset) => (
            <div
              key={preset.id}
              onClick={() => onSelectSubApp('motion')}
              className={`border rounded-2xl p-4 transition-all duration-300 shadow-sm flex flex-col justify-between space-y-3 cursor-pointer group ${
                isLight
                  ? 'bg-white hover:bg-slate-50 border-slate-200/90 hover:border-orange-400'
                  : 'bg-[#0f121e] hover:bg-[#141829] border-white/10 hover:border-orange-500/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{preset.thumbnailIcon}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                  isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-slate-300'
                }`}>
                  {preset.category}
                </span>
              </div>
              <div>
                <h3 className={`font-bold text-sm transition-colors ${
                  isLight ? 'text-slate-900 group-hover:text-orange-600' : 'text-white group-hover:text-orange-300'
                }`}>
                  {preset.title}
                </h3>
                <p className={`text-xs line-clamp-2 mt-1 leading-relaxed ${
                  isLight ? 'text-slate-600' : 'text-slate-400'
                }`}>
                  {preset.prompt}
                </p>
              </div>
              <div className={`flex items-center justify-between pt-2 border-t text-[11px] ${
                isLight ? 'border-slate-100 text-slate-500' : 'border-white/5 text-slate-400'
              }`}>
                <span>Durasi: {preset.defaultDuration}s</span>
                <span className="text-orange-500 font-bold group-hover:underline flex items-center gap-1">
                  <span>Gunakan</span> &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (mode === 'history') {
    return (
      <div className={`space-y-6 select-none font-sans ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
        <div className={`rounded-3xl border p-6 flex items-center gap-3.5 transition-all ${
          isLight ? 'bg-white border-slate-200/90 shadow-sm' : 'bg-[#0f121e] border-white/10'
        }`}>
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
            <HistoryIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-base font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>Riwayat Aktivitas &amp; Sesi</h2>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Daftar generasi metadata, render gambar AI, dan kompilasi motion terakhir.</p>
          </div>
        </div>

        <div className={`rounded-3xl border p-5 space-y-3 transition-all ${
          isLight ? 'bg-white border-slate-200/90 shadow-sm' : 'bg-[#0f121e] border-white/10'
        }`}>
          <div className="space-y-2">
            {[
              { title: 'Christmas Poster Set', type: 'Image Generator', time: '10 menit yang lalu', status: 'Selesai', mode: 'image' as SubAppMode },
              { title: 'Product Promo Animation (60 FPS)', type: 'Motion Studio', time: '2 jam yang lalu', status: 'Tersimpan', mode: 'motion' as SubAppMode },
              { title: 'Stock Metadata - Travel Vacation', type: 'Metadata Generator', time: '5 jam yang lalu', status: 'Export CSV Siap', mode: 'metadata' as SubAppMode },
              { title: 'Mecha Cyberpunk Cat Vector Art', type: 'Image Generator', time: '1 hari yang lalu', status: 'Alpha Transparan', mode: 'image' as SubAppMode },
            ].map((hist, idx) => (
              <div
                key={idx}
                onClick={() => onSelectSubApp(hist.mode)}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition cursor-pointer ${
                  isLight
                    ? 'bg-slate-50 hover:bg-slate-100 border-slate-200/80'
                    : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-xs">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className={`font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>{hist.title}</h4>
                    <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{hist.type} &bull; {hist.time}</span>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/25 px-2.5 py-0.5 rounded-full font-semibold">
                  {hist.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'files') {
    return (
      <div className={`space-y-6 select-none font-sans ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
        <div className={`rounded-3xl border p-6 flex items-center justify-between gap-4 transition-all ${
          isLight ? 'bg-white border-slate-200/90 shadow-sm' : 'bg-[#0f121e] border-white/10'
        }`}>
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>My Files ({items.length} Aset Antrean)</h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Semua berkas gambar dan footage yang sedang diproses di lembar kerja.</p>
            </div>
          </div>
          <button
            onClick={() => onSelectSubApp('metadata')}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition shadow-md shadow-blue-600/25"
          >
            <span>Buka Batch Queue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectSubApp('metadata')}
              className={`rounded-2xl border p-3 flex items-center gap-3 transition cursor-pointer ${
                isLight ? 'bg-white border-slate-200/90 hover:border-slate-300 shadow-xs' : 'bg-[#0f121e] border-white/10 hover:border-white/20'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-black/40 overflow-hidden border border-white/10 shrink-0">
                {item.previewUrl ? (
                  <img src={item.previewUrl} alt={item.fileName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500">📁</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{item.fileName}</p>
                <p className={`text-[10px] capitalize ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{item.mediaType} &bull; {item.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Favorites
  return (
    <div className={`space-y-6 select-none font-sans ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
      <div className={`rounded-3xl border p-6 flex items-center gap-3.5 transition-all ${
        isLight ? 'bg-white border-slate-200/90 shadow-sm' : 'bg-[#0f121e] border-white/10'
      }`}>
        <div className="w-10 h-10 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-500">
          <Heart className="w-5 h-5 fill-current" />
        </div>
        <div>
          <h2 className={`text-base font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>Favorit &amp; Pin</h2>
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Aset, prompt, dan formula yang Anda tandai sebagai favorit.</p>
        </div>
      </div>

      <div className={`rounded-3xl border p-8 text-center space-y-3 transition-all ${
        isLight ? 'bg-white border-slate-200/90 shadow-sm text-slate-500' : 'bg-[#0f121e] border-white/10 text-slate-400'
      }`}>
        <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center mx-auto text-pink-500">
          <Heart className="w-6 h-6" />
        </div>
        <p className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Belum Ada Item Favorit</p>
        <p className={`text-xs max-w-sm mx-auto leading-relaxed ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          Tandai prompt gambar atau formula keyword sebagai favorit untuk mengaksesnya secara instan kapan saja.
        </p>
      </div>
    </div>
  );
};
