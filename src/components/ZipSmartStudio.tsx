import React, { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import {
  Archive,
  CloudUpload,
  Layers,
  Sparkles,
  Trash2,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Info,
  X,
  Play,
  RotateCcw,
  Package,
  Wand2,
  Check,
  Search,
  ExternalLink,
} from 'lucide-react';
import { ZipSmartMascot, ZipSmartAvatar } from './CartoonMascots';

export interface PairedAsset {
  baseName: string;
  originalBase: string;
  eps: File | null;
  jpg: File | null;
  jpgUrl: string | null;
  isCustomSample?: boolean;
}

interface ZipSmartStudioProps {
  theme?: 'dark' | 'light';
  onSendToMetadataStudio?: (previewDataUrl: string, title: string) => void;
}

export const ZipSmartStudio: React.FC<ZipSmartStudioProps> = ({
  theme = 'dark',
  onSendToMetadataStudio,
}) => {
  const isLight = theme === 'light';

  const [pairsMap, setPairsMap] = useState<Map<string, PairedAsset>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'ready' | 'missing'>('all');
  const [isDragging, setIsDragging] = useState(false);

  // Loading Modal State
  const [isLoadingModalOpen, setIsLoadingModalOpen] = useState(false);
  const [loadingPercent, setLoadingPercent] = useState(0);
  const [loadingTitle, setLoadingTitle] = useState('Forging Master Archive...');

  // Structure Info Modal
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ show: false, title: '', message: '', type: 'info' });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ show: true, title, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Process uploaded files
  const processFiles = (fileList: FileList | File[]) => {
    let addedCount = 0;
    const updatedMap = new Map(pairsMap);

    Array.from(fileList).forEach((file) => {
      const name = file.name;
      const lastDot = name.lastIndexOf('.');
      if (lastDot === -1) return;

      const baseName = name.substring(0, lastDot).toLowerCase().trim();
      const originalBase = name.substring(0, lastDot).trim();
      const ext = name.substring(lastDot + 1).toLowerCase();

      // Accepted vector & raster formats
      const isVector = ['eps', 'ai', 'svg'].includes(ext);
      const isRaster = ['jpg', 'jpeg', 'png', 'webp'].includes(ext);

      if (isVector || isRaster) {
        if (!updatedMap.has(baseName)) {
          updatedMap.set(baseName, {
            baseName,
            originalBase,
            eps: null,
            jpg: null,
            jpgUrl: null,
          });
        }

        const pair = updatedMap.get(baseName)!;
        if (isVector) {
          pair.eps = file;
          // preserve best original casing
          if (!pair.jpg) pair.originalBase = originalBase;
        } else {
          pair.jpg = file;
          if (pair.jpgUrl && !pair.isCustomSample) {
            URL.revokeObjectURL(pair.jpgUrl);
          }
          pair.jpgUrl = URL.createObjectURL(file);
          if (!pair.eps) pair.originalBase = originalBase;
        }
        addedCount++;
      }
    });

    if (addedCount > 0) {
      setPairsMap(updatedMap);
      showToast('Super Kawaii!', `${addedCount} berkas berhasil dipasangkan.`, 'success');
    } else {
      showToast('Format Tidak Sesuai', 'Hanya berkas .eps, .ai, .svg dan .jpg/.png yang diterima.', 'error');
    }
  };

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Remove single pair
  const removePair = (baseName: string) => {
    const updated = new Map(pairsMap);
    const pair = updated.get(baseName);
    if (pair?.jpgUrl && !pair.isCustomSample) {
      URL.revokeObjectURL(pair.jpgUrl);
    }
    updated.delete(baseName);
    setPairsMap(updated);
  };

  // Clear all
  const clearAll = () => {
    pairsMap.forEach((pair) => {
      if (pair.jpgUrl && !pair.isCustomSample) {
        URL.revokeObjectURL(pair.jpgUrl);
      }
    });
    setPairsMap(new Map());
    showToast('Semua Dibersihkan', 'Daftar berkas telah dikosongkan.', 'info');
  };

  // Load Sample Demo Pairs
  const loadSamplePairs = () => {
    const samples: Array<{ name: string; title: string; color1: string; color2: string; icon: string }> = [
      { name: 'cyber-mecha-cat-vector', title: 'Cyber Mecha Cat', color1: '#FF2A6D', color2: '#7B2CBF', icon: '🐱' },
      { name: 'ramadan-kareem-gold-lantern', title: 'Golden Ramadan Lantern', color1: '#FFC600', color2: '#d97706', icon: '🏮' },
      { name: 'fintech-crypto-dashboard-isometric', title: 'Fintech Dashboard', color1: '#05D9E8', color2: '#2563eb', icon: '📊' },
      { name: 'summer-beach-sunset-badge', title: 'Summer Sunset Badge', color1: '#f97316', color2: '#e11d48', icon: '🏖️' },
    ];

    const updated = new Map(pairsMap);

    samples.forEach((s) => {
      const baseKey = s.name.toLowerCase();

      // Create SVG content for fake EPS
      const epsContent = `%!PS-Adobe-3.0 EPSF-3.0\n%%Creator: ZIPsmart Demo Vector Generator\n%%Title: ${s.title}\n%%BoundingBox: 0 0 1000 1000\n%%EndComments\n% Vector Asset Sample for ${s.title}\nshowpage\n%%EOF`;
      const epsFile = new File([epsContent], `${s.name}.eps`, { type: 'application/postscript' });

      // Create fake JPEG data URL preview via canvas
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const grad = ctx.createLinearGradient(0, 0, 600, 600);
        grad.addColorStop(0, s.color1);
        grad.addColorStop(1, s.color2);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 600, 600);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(s.title, 300, 240);

        ctx.font = '90px sans-serif';
        ctx.fillText(s.icon, 300, 360);

        ctx.font = '18px monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillText('MICROSTOCK READY VECTOR', 300, 430);
      }
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

      // Convert canvas to File
      const byteString = atob(dataUrl.split(',')[1]);
      const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const jpgFile = new File([ab], `${s.name}.jpg`, { type: mimeString });

      updated.set(baseKey, {
        baseName: baseKey,
        originalBase: s.name,
        eps: epsFile,
        jpg: jpgFile,
        jpgUrl: dataUrl,
        isCustomSample: true,
      });
    });

    setPairsMap(updated);
    showToast('Demo Siap!', '4 Pasangan demo EPS + JPG berhasil dimuat.', 'success');
  };

  // Download Individual Pair ZIP
  const downloadSinglePairZip = async (pair: PairedAsset) => {
    if (!pair.eps || !pair.jpg) {
      showToast('Belum Lengkap', 'Pasangan EPS dan JPG harus lengkap sebelum diunduh.', 'error');
      return;
    }

    try {
      const zip = new JSZip();
      zip.file(pair.eps.name, pair.eps);
      zip.file(pair.jpg.name, pair.jpg);
      const blob = await zip.generateAsync({ type: 'blob' });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${pair.originalBase}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('Berhasil!', `File ${pair.originalBase}.zip siap.`, 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Gagal', 'Terjadi kesalahan saat mengompres berkas.', 'error');
    }
  };

  // ==========================================
  // MASTER BATCH ZIP (STRICT FLAT STRUCTURE)
  // ==========================================
  const downloadMasterBatchZip = async () => {
    const completePairs = Array.from(pairsMap.values()).filter((p) => p.eps && p.jpg);
    if (completePairs.length === 0) {
      showToast('Tidak Ada Pasangan', 'Belum ada pasangan EPS + JPG yang lengkap!', 'error');
      return;
    }

    setIsLoadingModalOpen(true);
    setLoadingPercent(0);
    setLoadingTitle('Menyiapkan Master Archive...');

    try {
      // 1. Initialize Master ZIP
      const masterZip = new JSZip();
      let count = 0;

      // 2. Process each pair
      for (const pair of completePairs) {
        count++;
        const percent = Math.round((count / completePairs.length) * 75);
        setLoadingPercent(percent);
        setLoadingTitle(`Mengompres pasangan ${count} dari ${completePairs.length} (${pair.originalBase})...`);

        // A. Create inner zip containing EPS + JPG
        const innerZip = new JSZip();
        innerZip.file(pair.eps!.name, pair.eps!);
        innerZip.file(pair.jpg!.name, pair.jpg!);
        const innerZipBlob = await innerZip.generateAsync({ type: 'blob' });

        // B. Add inner zip to Master ROOT (No subfolders)
        masterZip.file(`${pair.originalBase}.zip`, innerZipBlob);

        // C. Add loose preview JPG to Master ROOT (No subfolders)
        masterZip.file(pair.jpg!.name, pair.jpg!);
      }

      setLoadingPercent(85);
      setLoadingTitle('Menyatukan Kompresi Master ZIP...');

      // 3. Generate Master Zip Blob
      const masterBlob = await masterZip.generateAsync({ type: 'blob' }, (metadata) => {
        setLoadingPercent(85 + Math.round(metadata.percent * 0.15));
      });

      // 4. Download
      const timestamp = Date.now();
      const url = URL.createObjectURL(masterBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ZIPsmart_Master_${timestamp}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsLoadingModalOpen(false);
      showToast('Selesai!', `Master ZIP (${completePairs.length} aset) berhasil diunduh.`, 'success');
    } catch (err: any) {
      console.error(err);
      setIsLoadingModalOpen(false);
      showToast('Error', 'Gagal membuat Master ZIP. Periksa console browser.', 'error');
    }
  };

  // Filter items
  const allPairs = Array.from(pairsMap.values());
  const filteredPairs = allPairs.filter((p) => {
    const matchesSearch = p.originalBase.toLowerCase().includes(searchQuery.toLowerCase());
    const isReady = p.eps && p.jpg;
    if (filterMode === 'ready') return matchesSearch && isReady;
    if (filterMode === 'missing') return matchesSearch && !isReady;
    return matchesSearch;
  });

  const readyCount = allPairs.filter((p) => p.eps && p.jpg).length;
  const missingCount = allPairs.length - readyCount;

  return (
    <div className={`space-y-6 select-none font-sans ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
      
      {/* Cartoon App Profile Header: ZIPsmart */}
      <div className={`rounded-2xl border p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg relative overflow-hidden transition-all ${
        isLight
          ? 'bg-gradient-to-r from-pink-50 via-purple-50 to-cyan-50 border-pink-200/90 shadow-pink-500/10'
          : 'bg-[#0f111a] border-pink-500/30 shadow-pink-950/20'
      }`}>
        {/* Soft Ambient Glows */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 min-w-0 relative z-10">
          <div className="shrink-0 drop-shadow-md transition-transform hover:scale-105 duration-300">
            <ZipSmartMascot size={74} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className={`text-base font-extrabold tracking-wide uppercase ${isLight ? 'text-slate-900' : 'text-white'}`}>
                ZIPsmart Archiver
              </h2>
              <span className="text-[10px] bg-gradient-to-r from-cyan-500/20 to-pink-500/20 text-pink-400 px-2 py-0.5 rounded-full font-bold border border-pink-500/30">
                Profile #04 &bull; Anime Kitsune
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Freepik &amp; Microstock Flat ZIP
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-300 border border-white/10">
                Auto-Pairing EPS + JPG
              </span>
            </div>
            <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Pengarsip batch cerdas untuk kontributor microstock. Otomatis memasangkan file vektor (.EPS/.AI) dengan preview (.JPG) ke dalam Master ZIP struktur rata tanpa subfolder.
            </p>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2 shrink-0 relative z-10">
          <button
            onClick={() => setIsInfoModalOpen(true)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
              isLight
                ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs'
                : 'bg-white/5 hover:bg-white/10 text-cyan-300 border-cyan-500/30'
            }`}
            title="Lihat Struktur Master ZIP"
          >
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Struktur Flat ZIP</span>
          </button>

          <button
            onClick={loadSamplePairs}
            className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-400 hover:to-pink-400 text-white shadow-md shadow-pink-500/20"
            title="Muat contoh pasangan file untuk demonstrasi cepat"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Muat Contoh Demo</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Upload & Dropzone + Magic Layout Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left 4 Cols: Magic Layout Explanation Card */}
        <div className={`lg:col-span-4 rounded-3xl p-6 border space-y-4 shadow-lg transition-all relative overflow-hidden ${
          isLight ? 'bg-white border-slate-200/90 shadow-slate-200/50' : 'bg-[#0f1424] border-white/10'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-pink-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-extrabold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Format Pengiriman Master ZIP
              </h3>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Standar Flat Microstock (Freepik / Adobe)
              </p>
            </div>
          </div>

          <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            ZIPsmart menyusun arsip dengan struktur <strong>FLAT (Rata)</strong> di root Master ZIP tanpa sub-folder bersarang. Sangat cocok untuk upload massal:
          </p>

          {/* Visual File Tree Box */}
          <div className={`rounded-2xl p-3.5 border font-mono text-[11px] space-y-2.5 ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#090b14] border-cyan-500/20 text-slate-200'
          }`}>
            <div className="text-cyan-400 font-bold flex items-center gap-2 pb-2 border-b border-white/10">
              <Archive className="w-4 h-4 text-pink-500" />
              <span>📦 Master_Batch_Export.zip</span>
            </div>
            <div className="space-y-1.5 pl-2 text-[10px]">
              <div className="flex items-center gap-2 text-purple-400">
                <Archive className="w-3.5 h-3.5" />
                <span>design-01.zip</span>
                <span className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>(berisi .eps + .jpg)</span>
              </div>
              <div className="flex items-center gap-2 text-pink-400">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>design-01.jpg</span>
                <span className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>(preview lepas)</span>
              </div>
              <div className="flex items-center gap-2 text-purple-400 pt-1.5 border-t border-white/5">
                <Archive className="w-3.5 h-3.5" />
                <span>design-02.zip</span>
                <span className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>(berisi .eps + .jpg)</span>
              </div>
              <div className="flex items-center gap-2 text-pink-400">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>design-02.jpg</span>
                <span className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>(preview lepas)</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[11px] space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <span>✨ Pasangan Otomatis</span>
            </p>
            <p className={`text-[10px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Cukup drag semua file sekaligus. File <code>vektor.eps</code> dan <code>vektor.jpg</code> yang memiliki nama dasar serupa akan otomatis disatukan.
            </p>
          </div>
        </div>

        {/* Right 8 Cols: Dropzone & Action Bar */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Main Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 relative overflow-hidden flex flex-col items-center justify-center min-h-[300px] shadow-lg group ${
              isDragging
                ? 'border-pink-500 bg-pink-500/10 scale-[1.01]'
                : isLight
                ? 'border-slate-300 hover:border-pink-500 bg-white hover:bg-slate-50 shadow-slate-200/50'
                : 'border-white/20 hover:border-cyan-400/80 bg-[#0f1424] hover:bg-[#13192f] shadow-black/20'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".eps,.jpg,.jpeg,.ai,.png,.svg"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  processFiles(e.target.files);
                  e.target.value = '';
                }
              }}
            />

            {/* Glowing Mascot Icon in Center */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-500/20 via-purple-500/20 to-pink-500/20 border border-cyan-500/40 flex items-center justify-center text-4xl mb-4 group-hover:scale-110 duration-300 shadow-[0_0_30px_rgba(5,217,232,0.25)]">
              <CloudUpload className="w-9 h-9 text-pink-500 animate-bounce" />
            </div>

            <h3 className={`text-xl sm:text-2xl font-black mb-2 transition-colors ${
              isLight ? 'text-slate-900 group-hover:text-pink-600' : 'text-white group-hover:text-cyan-300'
            }`}>
              Drag &amp; Drop File Vektor &amp; Preview di Sini
            </h3>

            <p className={`text-xs sm:text-sm max-w-md mx-auto mb-5 leading-relaxed ${
              isLight ? 'text-slate-500' : 'text-slate-400'
            }`}>
              Masukkan file <span className="text-cyan-400 font-bold">.EPS / .AI</span> dan <span className="text-pink-400 font-bold">.JPG / .PNG</span> Anda. ZIPsmart akan otomatis memasangkannya berdasarkan nama dasar!
            </p>

            <button className="px-6 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-400 hover:to-pink-400 text-white font-bold text-xs shadow-md shadow-pink-500/25 pointer-events-none">
              Pilih File dari Komputer
            </button>
          </div>

          {/* Quick Action Controls & Stats Strip */}
          {allPairs.length > 0 && (
            <div className={`rounded-2xl p-4 border flex flex-wrap items-center justify-between gap-4 transition-all ${
              isLight ? 'bg-white border-slate-200/90 shadow-sm' : 'bg-[#0f1424] border-white/10'
            }`}>
              
              {/* Stats Counters */}
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1.5 rounded-xl border text-center ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/10'
                }`}>
                  <span className="block font-black text-sm text-cyan-400">{allPairs.length}</span>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Total Pasangan</span>
                </div>

                <div className={`px-3 py-1.5 rounded-xl border text-center ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/10'
                }`}>
                  <span className="block font-black text-sm text-emerald-400">{readyCount}</span>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Lengkap (Ready)</span>
                </div>

                {missingCount > 0 && (
                  <div className={`px-3 py-1.5 rounded-xl border text-center ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/10'
                  }`}>
                    <span className="block font-black text-sm text-rose-400">{missingCount}</span>
                    <span className="text-[9px] uppercase font-bold text-slate-400">Kurang Berkas</span>
                  </div>
                )}

                <button
                  onClick={clearAll}
                  className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1.5 transition cursor-pointer"
                  title="Hapus semua pasangan"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Semua</span>
                </button>
              </div>

              {/* Master Download CTA Button */}
              <button
                onClick={downloadMasterBatchZip}
                disabled={readyCount === 0}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-400 hover:to-pink-400 text-white font-extrabold text-xs shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all transform hover:scale-[1.02]"
              >
                <Archive className="w-4 h-4" />
                <span>Unduh Master ZIP ({readyCount} Pasangan)</span>
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Paired Assets Results Section */}
      {allPairs.length > 0 && (
        <div className="space-y-4 pt-2">
          
          {/* Header & Filter Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <Layers className="w-5 h-5 text-cyan-400" />
              <h3 className={`font-extrabold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Daftar Pasangan Aset ({filteredPairs.length})
              </h3>
            </div>

            {/* Filter Pills & Search */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama aset..."
                  className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border focus:outline-none focus:border-cyan-500 ${
                    isLight
                      ? 'bg-white border-slate-200 text-slate-800'
                      : 'bg-[#0f1424] border-white/10 text-white'
                  }`}
                />
              </div>

              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                    filterMode === 'all' ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setFilterMode('ready')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                    filterMode === 'ready' ? 'bg-emerald-500 text-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Ready ({readyCount})
                </button>
                <button
                  onClick={() => setFilterMode('missing')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                    filterMode === 'missing' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Kurang ({missingCount})
                </button>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPairs.map((pair) => {
              const isReady = pair.eps && pair.jpg;

              return (
                <div
                  key={pair.baseName}
                  className={`rounded-2xl overflow-hidden flex flex-col justify-between border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group ${
                    isReady
                      ? isLight
                        ? 'bg-white border-cyan-200 shadow-cyan-500/10 hover:border-cyan-400'
                        : 'bg-[#0f1424] border-cyan-500/30 hover:border-cyan-400'
                      : isLight
                      ? 'bg-amber-50/50 border-amber-200 opacity-90'
                      : 'bg-[#151322] border-amber-500/30 opacity-90'
                  }`}
                >
                  {/* Thumbnail Preview Area */}
                  <div className="h-40 w-full relative bg-black/60 overflow-hidden flex items-center justify-center border-b border-white/5">
                    {pair.jpgUrl ? (
                      <img
                        src={pair.jpgUrl}
                        alt={pair.originalBase}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-500 space-y-1">
                        <ImageIcon className="w-8 h-8 opacity-40" />
                        <span className="text-[10px] font-bold text-rose-400">PREVIEW HILANG</span>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      {isReady ? (
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500 text-black shadow-md">
                          READY
                        </span>
                      ) : (
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500 text-black shadow-md">
                          INCOMPLETE
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex flex-col flex-grow space-y-3">
                    <h4
                      className={`font-bold text-xs truncate ${isLight ? 'text-slate-900' : 'text-white'}`}
                      title={pair.originalBase}
                    >
                      {pair.originalBase}
                    </h4>

                    {/* Format Specs */}
                    <div className="space-y-1.5 text-xs">
                      {/* EPS Line */}
                      <div className={`flex justify-between items-center p-2 rounded-xl border text-[11px] ${
                        pair.eps
                          ? isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-white/5 border-white/5 text-slate-300'
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-400 font-bold'
                      }`}>
                        <span className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-purple-400" />
                          <span>Vektor (.EPS/.AI)</span>
                        </span>
                        <span>{pair.eps ? formatBytes(pair.eps.size) : 'HILANG'}</span>
                      </div>

                      {/* JPG Line */}
                      <div className={`flex justify-between items-center p-2 rounded-xl border text-[11px] ${
                        pair.jpg
                          ? isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-white/5 border-white/5 text-slate-300'
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-400 font-bold'
                      }`}>
                        <span className="flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
                          <span>Preview (.JPG)</span>
                        </span>
                        <span>{pair.jpg ? formatBytes(pair.jpg.size) : 'HILANG'}</span>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-2 flex items-center gap-2 mt-auto">
                      {isReady && (
                        <button
                          onClick={() => downloadSinglePairZip(pair)}
                          className="flex-1 py-1.5 px-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-400 hover:text-cyan-300 font-bold text-[10px] flex items-center justify-center gap-1 transition cursor-pointer"
                          title="Unduh single ZIP untuk aset ini"
                        >
                          <Download className="w-3 h-3" />
                          <span>Unduh .ZIP</span>
                        </button>
                      )}

                      <button
                        onClick={() => removePair(pair.baseName)}
                        className={`p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border transition cursor-pointer ${
                          isLight ? 'border-slate-200' : 'border-white/5'
                        }`}
                        title="Hapus pasangan ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Structure Info Modal */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl relative space-y-4 ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0f1424] border-white/15 text-white'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <Info className="w-5 h-5 text-cyan-400" />
                <h3 className="font-extrabold text-base">Struktur Flat Master ZIP</h3>
              </div>
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <p className={isLight ? 'text-slate-600' : 'text-slate-300'}>
                Banyak platform microstock (seperti <strong>Freepik</strong>, <strong>Adobe Stock</strong>, dan <strong>Vecteezy</strong>) mensyaratkan setiap aset vektor (.eps) dikompres bersama preview (.jpg) dengan nama yang persis sama.
              </p>

              <div className={`p-4 rounded-2xl border font-mono space-y-2 ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-black/40 border-cyan-500/30 text-cyan-300'
              }`}>
                <p className="font-bold text-pink-400">📦 Master_Export.zip (Root Flat)</p>
                <div className="pl-4 space-y-1 text-[11px]">
                  <p>├── design-v1.zip (berisi design-v1.eps &amp; design-v1.jpg)</p>
                  <p>├── design-v1.jpg (preview loose di root)</p>
                  <p>├── design-v2.zip (berisi design-v2.eps &amp; design-v2.jpg)</p>
                  <p>└── design-v2.jpg (preview loose di root)</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 space-y-1">
                <p className="font-bold">Keuntungan ZIPsmart:</p>
                <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Anda tidak perlu membuka WinRAR/7-Zip berulang kali untuk membungkus puluhan file satu per satu. Cukup drop ratusan EPS &amp; JPG sekaligus, ZIPsmart akan menyusunnya dalam hitungan detik!
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs cursor-pointer"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Anime Loading Modal Overlay (Magical Transformation Style) */}
      {isLoadingModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-[#0a0a16]/95 backdrop-blur-md animate-in fade-in">
          
          {/* Glowing Magic Circle Animation */}
          <div className="relative w-44 h-44 flex items-center justify-center mb-6">
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full animate-[spin_8s_linear_infinite] text-cyan-400 opacity-60">
              <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 8" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="20 10 5 10" />
              <polygon points="50,10 85,75 15,75" fill="none" stroke="currentColor" strokeWidth="1" />
              <polygon points="50,90 15,25 85,25" fill="none" stroke="currentColor" strokeWidth="1" />
            </svg>
            <div className="w-20 h-20 bg-gradient-to-tr from-cyan-400 via-purple-600 to-pink-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(255,42,109,0.8)] z-10 animate-pulse">
              <Archive className="w-9 h-9 text-white animate-bounce" />
            </div>
          </div>

          <h3 className="font-extrabold text-xl text-white tracking-widest uppercase text-center mb-2">
            {loadingTitle}
          </h3>

          <p className="text-pink-500 font-black text-4xl mb-6 font-mono">
            {loadingPercent}%
          </p>

          <div className="w-72 h-2.5 bg-white/10 rounded-full overflow-hidden relative border border-white/20">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 transition-all duration-200"
              style={{ width: `${loadingPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 rounded-2xl p-4 border flex items-center gap-3.5 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom duration-300 ${
          isLight ? 'bg-white/95 text-slate-800' : 'bg-[#0f1424]/95 text-white'
        } ${
          toast.type === 'success'
            ? 'border-cyan-500 shadow-cyan-500/20'
            : toast.type === 'error'
            ? 'border-pink-500 shadow-pink-500/20'
            : 'border-amber-500 shadow-amber-500/20'
        }`}>
          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
            toast.type === 'success'
              ? 'bg-cyan-500/20 text-cyan-400'
              : toast.type === 'error'
              ? 'bg-pink-500/20 text-pink-400'
              : 'bg-amber-500/20 text-amber-400'
          }`}>
            {toast.type === 'success' ? <Check className="w-4 h-4" /> : toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
          </div>
          <div>
            <h5 className="font-bold text-xs">{toast.title}</h5>
            <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{toast.message}</p>
          </div>
        </div>
      )}

    </div>
  );
};
