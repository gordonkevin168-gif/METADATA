import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Plus, 
  X, 
  Layers, 
  RefreshCw, 
  FileText, 
  ShieldCheck, 
  ShieldAlert, 
  Tag, 
  Edit3, 
  Compass, 
  Wand2,
  UploadCloud,
  ImagePlus,
  Film,
  Camera,
  Play,
  RotateCcw,
  Link2,
  Zap,
  Download,
  Package,
  FileCode,
  FolderArchive,
  ArrowRight,
  Archive,
  Loader2
} from 'lucide-react';
import { StockItem, TrademarkWarning } from '../types';
import { checkKeywordsForTrademarks, checkTitleForTrademarks } from '../utils/trademarkChecker';
import { generateBridgeTextBlock } from '../utils/csvExport';
import { captureFrameFromVideoElement } from '../utils/videoExtractor';
import { extractCuratedTitleConcepts, curateStockKeywords, sanitizeStockVideoTitle, clampTitleToMaxWords } from '../services/geminiClient';
import { embedMetadataInAsset, generateXmpPacket, dataUrlToBlob, downloadZipAllMetadata } from '../utils/metadataEmbedder';
import { CartoonLoader } from './CartoonLoader';

interface MetadataDetailProps {
  item: StockItem;
  allItems?: StockItem[];
  onUpdateItem: (updated: Partial<StockItem>) => void;
  onProcessItem: (id: string) => void;
  onRefineItem: (id: string, instruction: string) => Promise<void>;
  onAttachPreview?: (id: string, file: File) => void;
  isProcessing: boolean;
  onOpenExportModal?: () => void;
}

export const MetadataDetail: React.FC<MetadataDetailProps> = ({
  item,
  allItems = [],
  onUpdateItem,
  onProcessItem,
  onRefineItem,
  onAttachPreview,
  isProcessing,
  onOpenExportModal,
}) => {
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [copiedKeywords, setCopiedKeywords] = useState(false);
  const [copiedBridgeBlock, setCopiedBridgeBlock] = useState(false);
  const [copiedTier, setCopiedTier] = useState<number | null>(null);
  const [copiedShortTitle, setCopiedShortTitle] = useState(false);
  const [isEmbedding, setIsEmbedding] = useState(false);
  const [embedSuccess, setEmbedSuccess] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgressText, setZipProgressText] = useState('');

  const [activeTierTab, setActiveTierTab] = useState<'all' | 't1' | 't2' | 't3' | 't4'>('all');
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [newKeywordTier, setNewKeywordTier] = useState<1 | 2 | 3 | 4>(1);

  // Refinement state
  const [refinementPrompt, setRefinementPrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);

  // Video state & frame capture
  const videoRef = useRef<HTMLVideoElement>(null);
  const [frameCapturedToast, setFrameCapturedToast] = useState(false);
  const isVideo = item.mediaType === 'video' || item.fileName.toLowerCase().match(/\.(mp4|mov|webm|m4v|avi|mkv)$/i) !== null;

  const handleCaptureVideoFrame = () => {
    if (!videoRef.current) return;
    try {
      const captured = captureFrameFromVideoElement(videoRef.current);
      onUpdateItem({
        previewUrl: captured.previewUrl,
        imageBase64: captured.imageBase64,
        previewSource: 'video_frame',
        videoMeta: item.videoMeta ? {
          ...item.videoMeta,
          extractedFrameTimestamp: captured.timestamp,
        } : undefined,
      });
      setFrameCapturedToast(true);
      setTimeout(() => setFrameCapturedToast(false), 2500);
    } catch (err) {
      console.error('Failed to capture frame from video:', err);
    }
  };

  // Editing single keyword
  const [editingKeywordIndex, setEditingKeywordIndex] = useState<number | null>(null);
  const [editingKeywordValue, setEditingKeywordValue] = useState('');

  // Validate title words & characters
  const titleWords = (item.title || '').trim().split(/\s+/).filter(Boolean);
  const wordCount = titleWords.length;
  const titleCharCount = (item.title || '').length;
  const isWordCountOptimal = wordCount > 0 && wordCount <= 15;
  const isCharCountWebOptimal = titleCharCount <= 200;
  const isCharCountCsvOptimal = titleCharCount <= 70;

  const handleAutoTrimTitle = () => {
    if (!item.title) return;
    const trimmed = clampTitleToMaxWords(item.title, 15);
    const words = trimmed.trim().split(/\s+/).filter(Boolean);
    onUpdateItem({
      title: trimmed,
      titleWordCount: words.length,
      titleCharCount: trimmed.length,
    });
  };

  const extractShortTitle = (title: string, b?: any): string => {
    if (!title) return '';
    if (title.length <= 70) return title;
    if (b?.subjectAndFormat && b?.baseConditionOrColor) {
      const combined = `${b.subjectAndFormat} ${b.baseConditionOrColor}`.trim();
      if (combined.length <= 70) return combined;
      if (b.subjectAndFormat.length <= 70) return b.subjectAndFormat;
    }
    const truncated = title.slice(0, 68);
    const lastSpace = truncated.lastIndexOf(' ');
    return (lastSpace > 25 ? truncated.slice(0, lastSpace) : truncated).trim();
  };

  const shortTitle = extractShortTitle(item.title || '', item.breakdown);

  const handleCopyShortTitle = () => {
    if (!shortTitle) return;
    navigator.clipboard.writeText(shortTitle);
    setCopiedShortTitle(true);
    setTimeout(() => setCopiedShortTitle(false), 2000);
  };

  const handleEmbedAndDownloadAsset = async () => {
    setIsEmbedding(true);
    try {
      let sourceBlob: Blob | null = null;
      if (item.file) {
        sourceBlob = item.file;
      } else if (item.previewUrl && item.previewUrl.startsWith('data:')) {
        sourceBlob = dataUrlToBlob(item.previewUrl);
      } else if (item.imageBase64 && item.imageBase64.length > 50) {
        const dataUri = item.imageBase64.startsWith('data:')
          ? item.imageBase64
          : `data:${item.mimeType || 'image/jpeg'};base64,${item.imageBase64}`;
        sourceBlob = dataUrlToBlob(dataUri);
      }

      if (!sourceBlob) {
        alert('File gambar tidak ditemukan untuk di-embed metadata.');
        return;
      }

      const embeddedBlob = await embedMetadataInAsset(sourceBlob, item);
      onUpdateItem({ embedded: true });

      const url = URL.createObjectURL(embeddedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setEmbedSuccess(true);
      setTimeout(() => setEmbedSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error embedding metadata:', err);
      alert(`Gagal meng-embed metadata ke file: ${err.message || err}`);
    } finally {
      setIsEmbedding(false);
    }
  };

  const handleDownloadXmpSidecar = () => {
    const xmp = generateXmpPacket(item);
    const blob = new Blob([xmp], { type: 'application/rdf+xml;charset=utf-8' });
    const baseName = item.fileName.replace(/\.[^/.]+$/, '');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName}.xmp`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllZip = async () => {
    const targetItems = (allItems && allItems.length > 0) ? allItems : [item];
    setIsZipping(true);
    setZipProgressText('Mempersiapkan berkas ZIP...');
    try {
      await downloadZipAllMetadata(targetItems, (p) => {
        setZipProgressText(`${p.status} (${p.percent}%)`);
      });
    } catch (err: any) {
      alert(`Gagal mengunduh ZIP: ${err.message || err}`);
    } finally {
      setIsZipping(false);
      setZipProgressText('');
    }
  };

  // Validate keywords
  const allKeywords = item.allKeywords || [];
  const totalKeywordsCount = allKeywords.length;

  // Calculate 1-word vs 2-word ratio
  const singleWordKeywords = allKeywords.filter((k) => k.trim().split(/\s+/).length === 1);
  const compoundKeywords = allKeywords.filter((k) => k.trim().split(/\s+/).length > 1);
  const singleWordPct = totalKeywordsCount > 0 ? Math.round((singleWordKeywords.length / totalKeywordsCount) * 100) : 0;
  const compoundPct = totalKeywordsCount > 0 ? Math.round((compoundKeywords.length / totalKeywordsCount) * 100) : 0;
  const isRatioOptimal = singleWordPct >= 70 && singleWordPct <= 85;

  // Title-Keyword Expert Curator Audit (Adobe Stock Page 1 & FAQ guidelines)
  const [showCuratorAuditModal, setShowCuratorAuditModal] = useState(false);
  const curatedTitleAnalysis = extractCuratedTitleConcepts(item.title || '');
  const { coreSubjectNouns, filteredFillerWords, formatTerms } = curatedTitleAnalysis;

  const matchedCoreSubjects = coreSubjectNouns.filter((cs) =>
    allKeywords.some((k) => {
      const lk = k.toLowerCase().trim();
      return lk === cs || lk.split(/[\s-]+/).includes(cs);
    })
  );

  const missingCoreSubjects = coreSubjectNouns.filter((cs) =>
    !allKeywords.some((k) => {
      const lk = k.toLowerCase().trim();
      return lk === cs || lk.split(/[\s-]+/).includes(cs);
    })
  );

  const titleRelevanceScore = coreSubjectNouns.length > 0
    ? Math.round((matchedCoreSubjects.length / coreSubjectNouns.length) * 100)
    : 100;
  const isTitleRelevanceOptimal = titleRelevanceScore >= 80;

  const handleCuratorFormatOptimization = () => {
    const reCurated = curateStockKeywords(
      item.tier1Keywords || allKeywords.slice(0, 10),
      item.tier2Keywords || allKeywords.slice(10, 20),
      item.tier3Keywords || allKeywords.slice(20, 35),
      item.tier4Keywords || allKeywords.slice(35, 49),
      isVideo,
      item.title || ''
    );

    onUpdateItem({
      allKeywords: reCurated.allKeywords,
      tier1Keywords: reCurated.tier1Keywords,
      tier2Keywords: reCurated.tier2Keywords,
      tier3Keywords: reCurated.tier3Keywords,
      tier4Keywords: reCurated.tier4Keywords,
    });
  };

  const sanitizedVideoTitle = isVideo ? sanitizeStockVideoTitle(item.title || '') : (item.title || '');
  const hasClichéVideoPrefix = isVideo && sanitizedVideoTitle !== (item.title || '').trim();

  const handleCleanVideoTitle = () => {
    if (!isVideo) return;
    const cleaned = sanitizeStockVideoTitle(item.title || '');
    const words = cleaned.trim().split(/\s+/).filter(Boolean);
    onUpdateItem({
      title: cleaned,
      titleWordCount: words.length,
    });
  };

  const trademarkWarnings: TrademarkWarning[] = [
    ...checkTitleForTrademarks(item.title || ''),
    ...checkKeywordsForTrademarks(allKeywords),
  ];

  const handleCopyTitle = () => {
    if (!item.title) return;
    navigator.clipboard.writeText(item.title);
    setCopiedTitle(true);
    setTimeout(() => setCopiedTitle(false), 2000);
  };

  const handleCopyKeywords = () => {
    if (allKeywords.length === 0) return;
    navigator.clipboard.writeText(allKeywords.join(', '));
    setCopiedKeywords(true);
    setTimeout(() => setCopiedKeywords(false), 2000);
  };

  const handleCopyTierKeywords = (tierNum: number, keywords: string[]) => {
    if (!keywords || keywords.length === 0) return;
    navigator.clipboard.writeText(keywords.join(', '));
    setCopiedTier(tierNum);
    setTimeout(() => setCopiedTier(null), 2000);
  };

  const handleCopyBridgeBlock = () => {
    const text = generateBridgeTextBlock(item);
    navigator.clipboard.writeText(text);
    setCopiedBridgeBlock(true);
    setTimeout(() => setCopiedBridgeBlock(false), 2000);
  };

  const handleRemoveKeyword = (indexToRemove: number) => {
    const updated = allKeywords.filter((_, idx) => idx !== indexToRemove);
    onUpdateItem({
      allKeywords: updated,
      tier1Keywords: updated.slice(0, 10),
      tier2Keywords: updated.slice(10, 20),
      tier3Keywords: updated.slice(20, 35),
      tier4Keywords: updated.slice(35, 49),
    });
  };

  const handleSaveEditedKeyword = (index: number) => {
    if (!editingKeywordValue.trim()) {
      handleRemoveKeyword(index);
      setEditingKeywordIndex(null);
      return;
    }
    const cleaned = editingKeywordValue.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '');
    const updated = [...allKeywords];
    updated[index] = cleaned;
    onUpdateItem({
      allKeywords: updated,
      tier1Keywords: updated.slice(0, 10),
      tier2Keywords: updated.slice(10, 20),
      tier3Keywords: updated.slice(20, 35),
      tier4Keywords: updated.slice(35, 49),
    });
    setEditingKeywordIndex(null);
  };

  const handleAddKeyword = () => {
    const cleaned = newKeywordInput.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '');
    if (!cleaned) return;
    if (allKeywords.includes(cleaned)) {
      alert('Kata kunci ini sudah ada di dalam daftar.');
      return;
    }
    const updated = [...allKeywords, cleaned];
    onUpdateItem({
      allKeywords: updated,
      tier1Keywords: updated.slice(0, 10),
      tier2Keywords: updated.slice(10, 20),
      tier3Keywords: updated.slice(20, 35),
      tier4Keywords: updated.slice(35, 49),
    });
    setNewKeywordInput('');
  };

  const handleRefineSubmit = async (e?: React.FormEvent, customInstruction?: string) => {
    if (e) e.preventDefault();
    const inst = customInstruction || refinementPrompt;
    if (!inst.trim()) return;
    setIsRefining(true);
    setRefineError(null);
    try {
      await onRefineItem(item.id, inst.trim());
      setRefinementPrompt('');
    } catch (err: any) {
      setRefineError(err.message || 'Gagal memperbarui metadata.');
    } finally {
      setIsRefining(false);
    }
  };

  if (item.status === 'analyzing') {
    return <CartoonLoader fileName={item.fileName} isVideo={isVideo} targetKeywordCount={item.targetKeywordCount} />;
  }

  // Idle state (asset uploaded, waiting for generation)
  if (item.status === 'idle') {
    const ext = item.fileName.split('.').pop()?.toUpperCase() || 'FILE';
    const isAi = ext === 'AI';
    const isEps = ext === 'EPS';

    return (
      <div className="bg-[#12131c] rounded-2xl border-2 border-[#2b2d3d] p-6 shadow-[5px_5px_0px_#000] space-y-6 font-mono text-slate-200">
        {/* Top Asset Header */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-[#242636]">
          <div className="flex items-center gap-3">
            <span
              className="text-xs font-black px-3 py-1 rounded border-2 border-black text-black shadow-[2px_2px_0px_#000]"
              style={{
                background: isVideo ? '#34d399' : isAi ? '#fb923c' : isEps ? '#a78bfa' : '#38bdf8',
              }}
            >
              {ext}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white truncate max-w-md">
                  {item.fileName}
                </h3>
                {isVideo && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                    {item.videoMeta?.resolutionLabel || '3-Frame Video'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {item.videoMeta ? (
                  <span>
                    <strong className="text-emerald-400">{item.videoMeta.resolutionLabel}</strong> ({item.videoMeta.width}x{item.videoMeta.height}) &bull; {item.videoMeta.duration}s &bull; {item.videoMeta.aspectRatio} &bull; {(item.fileSize / (1024 * 1024)).toFixed(1)} MB
                  </span>
                ) : (
                  <span>{(item.fileSize / 1024).toFixed(1)} KB &bull; Status: <span className="text-amber-400">Siap Dianalisis</span></span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Visual Preview Section */}
        {item.previewUrl || item.videoUrl ? (
          <div className="space-y-4">
            <div className="relative rounded-xl bg-[#090a10] border-2 border-[#242636] p-4 flex flex-col items-center justify-center">
              <div className="w-full flex flex-col items-center justify-center overflow-hidden rounded-lg bg-black/60 p-2 min-h-[180px] max-h-80">
                {isVideo && item.videoUrl ? (
                  <video
                    ref={videoRef}
                    src={item.videoUrl}
                    controls
                    playsInline
                    poster={item.previewUrl}
                    className="max-h-72 max-w-full rounded drop-shadow-md bg-black"
                  />
                ) : (
                  <img
                    src={item.previewUrl}
                    alt={item.fileName}
                    className="max-h-72 max-w-full object-contain rounded drop-shadow-md"
                  />
                )}
              </div>

              {/* Source Tag & Change Button */}
              <div className="w-full flex flex-wrap items-center justify-between mt-3 pt-2.5 border-t border-[#242636] text-xs gap-2">
                <span className="text-slate-300 flex items-center gap-1.5 text-[11px] font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {isVideo
                    ? `Analisis 3-Frame Siap (${(item.videoFrames || item.videoMeta?.frames)?.length || 3} Frame Temporal)`
                    : `Pratinjau Visual Siap (${item.previewSource || 'Native'})`
                  }
                </span>

                <div className="flex items-center gap-3">
                  {isVideo && item.videoUrl && (
                    <button
                      type="button"
                      onClick={handleCaptureVideoFrame}
                      className="text-[11px] px-2.5 py-1 rounded bg-[#1e2030] hover:bg-[#282b40] border-2 border-black text-emerald-300 font-bold flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px]"
                      title="Gunakan posisi scrubber video saat ini sebagai frame analisis"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{frameCapturedToast ? 'Frame Disimpan!' : 'Ambil Frame Saat Ini'}</span>
                    </button>
                  )}

                  <label className="text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer font-bold flex items-center gap-1">
                    <ImagePlus className="w-3.5 h-3.5" />
                    <span>Ganti Preview</span>
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
                </div>
              </div>
            </div>

            {/* Video 3-Frame Temporal Strip Preview if Video */}
            {isVideo && (item.videoFrames || item.videoMeta?.frames) && (
              <div className="bg-[#161824] rounded-xl border-2 border-[#2b2e42] p-4 space-y-2.5 shadow-[3px_3px_0px_#000]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      3-Frame Temporal Vision (Awal · Tengah · Akhir)
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/40 font-bold">
                    3 Titik Timeline Siap
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  C46u5 Engine membaca 3 frame temporal video untuk mendeteksi pergerakan kamera (drone shot/panning/tilt) dan aksi dinamis subjek.
                </p>
                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  {(item.videoFrames || item.videoMeta?.frames || []).map((f, idx) => (
                    <div 
                      key={idx}
                      className="relative rounded-lg border-2 border-[#2e324a] bg-black overflow-hidden group cursor-pointer hover:border-amber-400 transition-colors shadow-[2px_2px_0px_#000]"
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.currentTime = f.timestamp;
                          videoRef.current.play();
                        }
                      }}
                    >
                      <img src={f.previewUrl} alt={f.label} className="w-full h-20 object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-1.5">
                        <span className="text-[10px] font-bold text-amber-300">{f.label}</span>
                        <span className="text-[9px] text-slate-300">{f.timestamp}s</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-amber-500/50 bg-amber-500/5 p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border-2 border-amber-500/40 shadow-[2px_2px_0px_#000]">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h4 className="text-sm font-bold text-slate-200">
                {isVideo ? `Preview Frame Video (.${ext}) Belum Tersedia` : `Lampirkan Gambar Preview untuk ${item.fileName}`}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isVideo ? (
                  <>
                    Format <strong>.{ext}</strong> (seperti Apple ProRes 422/4444 atau QuickTime) menggunakan codec profesional yang tidak didukung decoder bawaan web browser.
                    <br />
                    <span className="text-emerald-400 font-semibold">Solusi:</span> Anda dapat melampirkan thumbnail gambar (<strong>.JPG/.PNG</strong>) untuk analisis visual AI Vision, atau langsung klik <strong>Generate Metadata Sekarang</strong> di bawah untuk analisis berbasis nama file &amp; spesifikasi video.
                  </>
                ) : (
                  <>
                    Pilih file preview (<strong>.JPG / .PNG</strong>) agar AI Vision dapat melihat visual aset ini secara detail, atau langsung klik generate di bawah.
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 flex-wrap">
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-[3px_3px_0px_#000] border-2 border-black transition-all cursor-pointer">
                <ImagePlus className="w-4 h-4" />
                <span>Lampirkan Thumbnail Preview (JPG / PNG)</span>
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

              <button
                onClick={() => onProcessItem(item.id)}
                disabled={isProcessing}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-[3px_3px_0px_#000] border-2 border-black transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Analisis Langsung via Teks</span>
              </button>
            </div>
          </div>
        )}

        {/* Custom Context Field */}
        <div className="space-y-1.5 pt-1">
          <label className="text-xs font-bold text-slate-300 block">
            Konteks Khusus untuk File Ini (Opsional):
          </label>
          <input
            type="text"
            value={item.customContext || ''}
            onChange={(e) => onUpdateItem({ customContext: e.target.value })}
            placeholder="Contoh: Modern fintech dashboard, drone sunset mountain b-roll, ramadan lantern..."
            className="w-full px-3.5 py-2 text-xs bg-[#0c0d14] border-2 border-[#2b2d3d] rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={() => onProcessItem(item.id)}
            disabled={isProcessing}
            className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs border-2 border-black shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>GENERATE METADATA SEKARANG</span>
          </button>
        </div>
      </div>
    );
  }

  const ext = item.fileName.split('.').pop()?.toUpperCase() || 'IMG';

  return (
    <div className="space-y-5 font-mono select-none text-slate-100">
      {/* Top Banner / Asset Info */}
      <div className="bg-[#12131c] rounded-2xl border-2 border-[#2b2d3d] p-4 shadow-[4px_4px_0px_#000] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-14 h-14 rounded-lg bg-[#090a10] border-2 border-[#2e324a] overflow-hidden shrink-0 shadow-[2px_2px_0px_#000] relative flex items-center justify-center p-0.5">
            {item.previewUrl ? (
              <img
                src={item.previewUrl}
                alt={item.fileName}
                className="max-w-full max-h-full object-contain"
              />
            ) : null}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-white truncate max-w-md">
                {item.fileName}
              </h2>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#1e2030] text-amber-300 border border-[#3b3e5b]">
                {ext}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {(item.fileSize / 1024).toFixed(1)} KB &bull; Adobe Category:{' '}
              <span className="font-bold text-indigo-300">
                ID {item.categoryId || 8}: {item.category}
              </span>
              {item.secondaryCategory && ` &bull; Secondary: ${item.secondaryCategory}`}
            </p>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center flex-wrap gap-2 w-full lg:w-auto">
          <button
            onClick={() => onProcessItem(item.id)}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#181a28] hover:bg-[#222538] text-slate-200 border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
            title="Re-analyze image with AI"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Regenerate</span>
          </button>

          <button
            onClick={handleEmbedAndDownloadAsset}
            disabled={isEmbedding}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer disabled:opacity-50"
            title="Embed metadata langsung ke file gambar (IPTC / XMP)"
          >
            {embedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Embedded &amp; Downloaded!</span>
              </>
            ) : isEmbedding ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Embedding...</span>
              </>
            ) : (
              <>
                <FileCode className="w-3.5 h-3.5 text-emerald-200" />
                <span>Embed ke File (IPTC/XMP)</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadXmpSidecar}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#1e2030] hover:bg-[#282b40] text-slate-200 border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
            title="Download sidecar .xmp file untuk Lightroom / Bridge / Capture One"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sidecar .XMP</span>
          </button>

          {allItems && allItems.length > 0 && (
            <button
              onClick={handleDownloadAllZip}
              disabled={isZipping}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black rounded-lg bg-amber-400 hover:bg-amber-300 text-black border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer disabled:opacity-50"
              title="Unduh ZIP semua file gambar (metadata embedded) + Sidecars .XMP + CSV Adobe Stock"
            >
              {isZipping ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                  <span>{zipProgressText || 'Membuat ZIP...'}</span>
                </>
              ) : (
                <>
                  <Archive className="w-3.5 h-3.5 text-black" />
                  <span>Unduh ZIP All File</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={handleCopyBridgeBlock}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
            title="Copy IPTC / Adobe Bridge text block"
          >
            {copiedBridgeBlock ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Bridge</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Visual Asset & 3-Frame Video Storyboard */}
      {(item.previewUrl || item.videoUrl) && (
        <div className="bg-[#12131c] rounded-2xl border-2 border-[#2b2d3d] p-4 shadow-[4px_4px_0px_#000] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#242636] text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {isVideo
                  ? `Stock Footage Preview · ${item.videoMeta?.resolutionLabel || 'Video'} (${item.videoMeta?.format?.toUpperCase() || ext})`
                  : `Visual Asset Preview · ${ext}`
                }
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {isVideo && item.videoUrl && (
                <button
                  type="button"
                  onClick={handleCaptureVideoFrame}
                  className="text-[11px] px-2.5 py-1 rounded bg-[#1e2030] hover:bg-[#282b40] border-2 border-black text-emerald-300 font-bold flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#000]"
                  title="Ambil posisi frame video saat ini untuk AI Vision"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{frameCapturedToast ? 'Frame Disimpan!' : 'Ambil Frame'}</span>
                </button>
              )}

              <label className="text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer font-bold flex items-center gap-1">
                <ImagePlus className="w-3.5 h-3.5" />
                <span>Ganti Preview</span>
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
            </div>
          </div>

          <div className="w-full flex items-center justify-center p-3 bg-black/60 rounded-xl border border-[#242636] min-h-[160px] max-h-80 overflow-hidden">
            {isVideo && item.videoUrl ? (
              <video
                ref={videoRef}
                src={item.videoUrl}
                controls
                playsInline
                poster={item.previewUrl}
                className="max-h-72 max-w-full rounded-lg drop-shadow-md bg-black"
              />
            ) : (
              <img
                src={item.previewUrl}
                alt={item.fileName}
                className="max-h-72 max-w-full object-contain rounded-lg drop-shadow-md"
              />
            )}
          </div>

          {/* 3-Frame Video Storyboard Strip (If Video) */}
          {isVideo && (
            <div className="mt-3 p-3.5 bg-[#161824] rounded-xl border-2 border-[#2b2e42] space-y-2.5 shadow-[2px_2px_0px_#000]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    3-Frame Temporal Video Storyboard (Page 1 Quality)
                  </span>
                </div>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40 font-bold">
                  3 Titik Timeline Terbaca
                </span>
              </div>

              <p className="text-[11px] text-slate-400">
                AI membaca ketiga frame berikut untuk mengenali pergerakan kamera drone/pan/tilt dan perubahan aksi dinamis sepanjang video.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {(item.videoFrames || item.videoMeta?.frames || []).map((f, fIdx) => (
                  <div
                    key={fIdx}
                    className="relative group rounded-lg border-2 border-[#2e324a] bg-black overflow-hidden cursor-pointer hover:border-amber-400 transition-all shadow-[2px_2px_0px_#000]"
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.currentTime = f.timestamp;
                        videoRef.current.play();
                      }
                    }}
                  >
                    <img src={f.previewUrl} alt={f.label} className="w-full h-20 object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-2">
                      <span className="text-[10px] font-bold text-amber-300">{f.label}</span>
                      <div className="flex items-center justify-between text-[9px] text-slate-300 mt-0.5">
                        <span>Detik ke-{f.timestamp}s</span>
                        <span className="text-indigo-400 group-hover:underline">Klik Scrobble</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Compliance / Quality Inspection Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Trademark status */}
        <div className="bg-[#12131c] rounded-xl border-2 border-[#2b2d3d] p-3 flex items-center gap-3 shadow-[3px_3px_0px_#000]">
          <div className={`w-9 h-9 rounded-lg border-2 border-black flex items-center justify-center shrink-0 ${
            trademarkWarnings.length > 0 ? 'bg-rose-500 text-black' : 'bg-emerald-400 text-black'
          }`}>
            {trademarkWarnings.length > 0 ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Trademark Audit</p>
            <p className={`text-xs font-black truncate ${
              trademarkWarnings.length > 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {trademarkWarnings.length === 0 ? 'Aman (Bebas Trademark)' : `${trademarkWarnings.length} Flagged Brand(s)`}
            </p>
          </div>
        </div>

        {/* Word count status */}
        <div className="bg-[#12131c] rounded-xl border-2 border-[#2b2d3d] p-3 flex items-center gap-3 shadow-[3px_3px_0px_#000]">
          <div className={`w-9 h-9 rounded-lg border-2 border-black flex items-center justify-center shrink-0 ${
            isWordCountOptimal ? 'bg-emerald-400 text-black' : 'bg-amber-400 text-black'
          }`}>
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Title (Maks 15 Kata)</p>
            <p className={`text-xs font-black truncate ${
              isWordCountOptimal ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {wordCount} Kata {isWordCountOptimal ? '(Optimal <= 15)' : '(Melebihi 15 Kata!)'}
            </p>
          </div>
        </div>

        {/* Keywords ratio status (75-80% 1-word) */}
        <div className="bg-[#12131c] rounded-xl border-2 border-[#2b2d3d] p-3 flex items-center gap-3 shadow-[3px_3px_0px_#000]">
          <div className={`w-9 h-9 rounded-lg border-2 border-black flex items-center justify-center shrink-0 ${
            isRatioOptimal ? 'bg-emerald-400 text-black' : 'bg-indigo-400 text-black'
          }`}>
            <Tag className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Rasio Kata Tunggal</p>
            <p className="text-xs font-black text-amber-300">
              {singleWordPct}% (Target 75-80% 1-Kata)
            </p>
          </div>
        </div>

        {/* Title-Keyword mutual relevance status */}
        <div className="bg-[#12131c] rounded-xl border-2 border-[#2b2d3d] p-3 flex items-center gap-3 shadow-[3px_3px_0px_#000]">
          <div className={`w-9 h-9 rounded-lg border-2 border-black flex items-center justify-center shrink-0 ${
            isTitleRelevanceOptimal ? 'bg-cyan-400 text-black' : 'bg-amber-400 text-black'
          }`}>
            <Link2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Sinergi Kurator Adobe</p>
            <p className={`text-xs font-black truncate ${
              isTitleRelevanceOptimal ? 'text-cyan-300' : 'text-amber-400'
            }`}>
              {titleRelevanceScore}% ({matchedCoreSubjects.length}/{coreSubjectNouns.length} Subjek Selaras)
            </p>
          </div>
        </div>
      </div>

      {/* Trademark warnings banner if any */}
      {trademarkWarnings.length > 0 && (
        <div className="bg-rose-950/60 border-2 border-rose-600 rounded-xl p-3.5 space-y-1.5 text-xs text-rose-200 shadow-[3px_3px_0px_#000]">
          <div className="flex items-center gap-2 font-bold text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Peringatan Merek Dagang (Microstock IP Rejection Risk)</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-300/90 pl-1">
            {trademarkWarnings.map((w, idx) => (
              <li key={idx}>{w.reason}</li>
            ))}
          </ul>
        </div>
      )}

      {/* SECTION 1: BEDAH STRUKTUR JUDUL (TITLE) */}
      <div className="bg-[#12131c] rounded-2xl border-2 border-[#2b2d3d] p-5 sm:p-6 shadow-[4px_4px_0px_#000] space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#222538]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-amber-400 text-black font-black text-xs flex items-center justify-center border border-black shadow-[1px_1px_0px_#000]">
                1
              </span>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Bedah Struktur Judul (Title)
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Formula kalimat alami (Natural Language) maksimal 15 kata, ramah AI Search / Adobe Sensei &amp; anti-keyword stuffing
            </p>
          </div>

          {/* Quick Copy Title Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopyTitle}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
              title="Salin judul lengkap untuk Web UI Adobe Stock (maks 200 karakter)"
            >
              {copiedTitle ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="text-emerald-200">Judul Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Judul Lengkap ({titleCharCount} Karakter)</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopyShortTitle}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#1e2030] hover:bg-[#282b40] text-amber-300 border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
              title="Salin judul ringkas (< 70 karakter) untuk upload via CSV / FTP"
            >
              {copiedShortTitle ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">CSV Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Salin Ringkas CSV (&lt; 70 Karakter)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Teks Judul & Jumlah Karakter Card */}
        <div className="p-4 rounded-xl bg-[#090a12] border-2 border-[#26283c] space-y-2.5">
          <div className="flex items-center justify-between text-xs flex-wrap gap-2">
            <span className="font-bold text-slate-300 uppercase tracking-wide">
              Teks Judul:
            </span>
            <div className="flex items-center gap-2">
              {wordCount > 15 && (
                <button
                  type="button"
                  onClick={handleAutoTrimTitle}
                  className="text-[11px] px-2.5 py-0.5 rounded bg-amber-400 hover:bg-amber-300 text-black font-black border border-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer flex items-center gap-1"
                  title="Pangkas judul otomatis menjadi maksimal 15 kata"
                >
                  <Sparkles className="w-3 h-3 text-black" />
                  <span>Pangkas ke 15 Kata</span>
                </button>
              )}
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded border ${
                isWordCountOptimal
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                  : 'bg-amber-950 text-amber-300 border-amber-500/50'
              }`}>
                Jumlah Karakter: {titleCharCount} karakter ({wordCount} kata &bull; Maks 15 Kata)
              </span>
            </div>
          </div>

          <textarea
            value={item.title || ''}
            onChange={(e) => {
              const newTitle = e.target.value;
              const words = newTitle.trim().split(/\s+/).filter(Boolean);
              onUpdateItem({
                title: newTitle,
                titleWordCount: words.length,
                titleCharCount: newTitle.length,
              });
            }}
            rows={2}
            className="w-full p-3 text-xs sm:text-sm bg-[#10121d] border-2 border-[#2b2d42] rounded-xl text-slate-100 font-sans focus:outline-none focus:border-indigo-500 leading-relaxed resize-y"
            placeholder="Edit title..."
          />
        </div>

        {/* Anatomi Formula yang Digunakan (4 Pilar) */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              Anatomi Formula yang Digunakan
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
            {/* 1. Subjek Utama & Format */}
            <div className="p-3.5 rounded-xl bg-[#151726] border-2 border-[#2c2f46] space-y-1 shadow-[2px_2px_0px_#000]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                  1. Subjek Utama &amp; Format
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 font-bold border border-indigo-700/50">
                  Subjek Inti
                </span>
              </div>
              <p className="text-slate-200 font-medium text-xs leading-relaxed">
                {item.breakdown?.subjectAndFormat || item.breakdown?.styleTheme || item.breakdown?.productFormat || 'Abstract vector gradient poster collection'}
              </p>
            </div>

            {/* 2. Kondisi / Warna Dasar */}
            <div className="p-3.5 rounded-xl bg-[#151726] border-2 border-[#2c2f46] space-y-1 shadow-[2px_2px_0px_#000]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider">
                  2. Kondisi / Warna Dasar
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 font-bold border border-teal-700/50">
                  Background / Tone
                </span>
              </div>
              <p className="text-slate-200 font-medium text-xs leading-relaxed">
                {item.breakdown?.baseConditionOrColor || 'with deep navy backgrounds'}
              </p>
            </div>

            {/* 3. Elemen Visual Spesifik */}
            <div className="p-3.5 rounded-xl bg-[#151726] border-2 border-[#2c2f46] space-y-1 shadow-[2px_2px_0px_#000]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  3. Elemen Visual Spesifik
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 font-bold border border-amber-700/50">
                  Variasi Desain
                </span>
              </div>
              <p className="text-slate-200 font-medium text-xs leading-relaxed">
                {item.breakdown?.specificVisualElements || item.breakdown?.visualElements || ', cyan light effects, blurred color waves'}
              </p>
            </div>

            {/* 4. Gaya & Detail Tambahan */}
            <div className="p-3.5 rounded-xl bg-[#151726] border-2 border-[#2c2f46] space-y-1 shadow-[2px_2px_0px_#000]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-pink-400 uppercase tracking-wider">
                  4. Gaya &amp; Detail Tambahan
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-pink-950 text-pink-300 font-bold border border-pink-700/50">
                  Aplikasi / Mood
                </span>
              </div>
              <p className="text-slate-200 font-medium text-xs leading-relaxed">
                {item.breakdown?.styleAndDetails || item.breakdown?.useCase || 'and futuristic line graphics.'}
              </p>
            </div>
          </div>
        </div>

        {/* 🔍 Catatan Evaluasi Kurator */}
        <div className="p-4 rounded-xl bg-[#0c0d18] border-2 border-indigo-900/60 space-y-3 shadow-[2px_2px_0px_#000]">
          <div className="flex items-center gap-2 text-indigo-300">
            <span className="text-base">🔍</span>
            <h4 className="text-xs font-black uppercase tracking-wider text-indigo-200">
              Catatan Evaluasi Kurator
            </h4>
          </div>

          <div className="space-y-2.5 text-xs">
            {/* Kelebihan (Sangat Kuat) */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Kelebihan (Sangat Kuat):</span>
              </span>

              <div className="pl-5 space-y-1.5 text-slate-300 leading-relaxed">
                <p>
                  <strong className="text-emerald-300">Menjawab Kebutuhan Bundel (Collection):</strong>{' '}
                  {item.breakdown?.bundleElementsSummary ||
                    'Karena aset ini berisi elemen desain yang bervariasi, judulnya tidak hanya menjelaskan satu desain melainkan merangkum semua elemen uniknya: gelombang (waves), garis (lines/halftone), dan gradasi warna.'}
                </p>
                <p>
                  <strong className="text-emerald-300">Format Kalimat Alami (Natural Language):</strong>{' '}
                  Judul ini enak dibaca manusia dan sangat ramah AI Search / Adobe Sensei karena bukan sekadar koma-koma tumpukan kata (keyword stuffing).
                </p>
              </div>
            </div>

            {/* Kekurangannya / Peringatan Teknis */}
            <div className="space-y-1.5 pt-1 border-t border-[#1c1f32]">
              <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Kekurangannya / Peringatan Teknis:</span>
              </span>

              <div className="pl-5 text-slate-300 leading-relaxed space-y-1">
                <p>
                  Panjangnya <strong>{titleCharCount} karakter</strong>.{' '}
                  {titleCharCount <= 200 ? (
                    <span className="text-emerald-300">
                      Ini lolos jika diunggah via web UI langsung (karena limit web maksimal 200 karakter).
                    </span>
                  ) : (
                    <span className="text-rose-400">
                      Melebihi limit Web UI (maksimal 200 karakter). Disarankan dipadatkan.
                    </span>
                  )}
                  {' '}Namun, jika diunggah via file CSV/FTP, sistem Adobe akan memotongnya atau memunculkan error karena kolom CSV membatasi maksimal 70 karakter.
                </p>
                <p className="text-[11px] text-amber-300/90 font-medium">
                  💡 Tips Kurator: Gunakan tombol <strong>"Salin Ringkas CSV (&lt; 70 Karakter)"</strong> di atas jika Anda berencana mengunggah massal via FTP / Spreadsheet!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Anti-Cliché Video Prefix Banner */}
        {hasClichéVideoPrefix && (
          <div className="p-3 rounded-xl bg-amber-950/70 border-2 border-amber-500/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-amber-200 shadow-[2px_2px_0px_#000]">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white text-[11px]">
                  Terdeteksi Awalan Klise Video Kamera (Hindari "Static 4K Video Shot of...")
                </p>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  Sesuai Pedoman Adobe Stock Page 1, jangan gunakan awalan teknis kamera/resolusi. Mulai langsung dari subjek visual utama!
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCleanVideoTitle}
              className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-black text-xs border-2 border-black shadow-[2px_2px_0px_#000] shrink-0 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
            >
              Bersihkan Judul Video
            </button>
          </div>
        )}
      </div>

      {/* SECTION 2: BEDAH STRUKTUR KATA KUNCI (KEYWORDS) */}
      <div className="bg-[#12131c] rounded-2xl border-2 border-[#2b2d3d] p-5 sm:p-6 shadow-[4px_4px_0px_#000] space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#222538]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-emerald-400 text-black font-black text-xs flex items-center justify-center border border-black shadow-[1px_1px_0px_#000]">
                2
              </span>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Bedah Struktur Kata Kunci (Keywords)
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#1e2030] text-emerald-300 border border-emerald-500/40">
                {allKeywords.length} Tag
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Anatomi piramida microstock author teratas: 85%–100% single words &amp; Top 10 literal attributes
            </p>
          </div>

          <button
            onClick={handleCopyKeywords}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
          >
            {copiedKeywords ? (
              <>
                <Check className="w-3.5 h-3.5 text-black" />
                <span>Semua Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-black" />
                <span>Copy {allKeywords.length} Keywords</span>
              </>
            )}
          </button>
        </div>

        {/* A. KONFIRMASI TEORI KATA TUNGGAL (85%-100% SINGLE WORDS!) */}
        <div className="p-4 rounded-xl bg-[#090a14] border-2 border-emerald-900/60 space-y-3 shadow-[2px_2px_0px_#000]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-500/40">
                A
              </span>
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                Konfirmasi Teori Kata Tunggal ({singleWordPct}% Single Words!)
              </h4>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/40">
                {singleWordKeywords.length} Kata Tunggal
              </span>
              <span className="text-slate-400">/</span>
              <span className="text-indigo-300 font-bold bg-indigo-950 px-2 py-0.5 rounded border border-indigo-500/40">
                {compoundKeywords.length} Frasa Majemuk
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-[#1b1d2e] rounded-full h-2.5 overflow-hidden border border-[#2b2d42]">
            <div
              className="bg-emerald-400 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, singleWordPct)}%` }}
            />
          </div>

          <div className="text-xs text-slate-300 leading-relaxed bg-[#111322] p-3 rounded-lg border border-[#23263b] space-y-1.5">
            <p>
              Perhatikan bahwa dari total <strong className="text-emerald-400">{allKeywords.length} tag</strong> tersebut,{' '}
              <strong className="text-emerald-300">{singleWordPct}% adalah kata tunggal (single word)</strong>:
            </p>
            <p className="font-mono text-[11px] text-amber-300/90 bg-black/40 p-2 rounded border border-black/40 overflow-x-auto">
              {allKeywords.slice(0, 10).join(', ')}...
            </p>
            <p className="text-[11px] text-slate-400">
              <strong>Pelajaran Kurator Microstock:</strong> Kontributor level atas di microstock sengaja memecah kata menjadi kata tunggal agar mesin pencari Adobe bebas mengombinasikan pencarian pembeli (misal: mencari <em>"dark cyan poster"</em> atau <em>"blue gradient template"</em> langsung cocok/match).
            </p>
          </div>
        </div>

        {/* B. ANATOMI TOP 10 (PERINGKAT PENENTU) */}
        <div className="p-4 rounded-xl bg-[#090a14] border-2 border-indigo-900/60 space-y-3.5 shadow-[2px_2px_0px_#000]">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-xs font-black border border-indigo-500/40">
              B
            </span>
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              Anatomi Top 10 (Peringkat Penentu 100% Fakta Visual Literal)
            </h4>
          </div>

          <p className="text-xs text-slate-400">
            Perhatikan 10 kata kunci pertama yang menempati peringkat penentu algoritma:
          </p>

          {/* 10 Items Visual Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            {[
              { role: 'Gaya seni', fallback: 'abstract' },
              { role: 'Format teknis file', fallback: 'vector' },
              { role: 'Elemen pembeda', fallback: 'gradient' },
              { role: 'Tipe produk fisik', fallback: 'poster' },
              { role: 'Fungsi komersial', fallback: 'template' },
              { role: 'Warna primer', fallback: 'blue' },
              { role: 'Warna aksen 1', fallback: 'cyan' },
              { role: 'Warna aksen 2', fallback: 'teal' },
              { role: 'Pencahayaan/Nuansa', fallback: 'dark' },
              { role: 'Kontras efek cahaya', fallback: 'light' },
            ].map((meta, idx) => {
              const kw = allKeywords[idx] || meta.fallback;
              return (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-[#141627] border-2 border-[#2b2e45] space-y-1 hover:border-amber-400 transition-colors shadow-[1px_1px_0px_#000]"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-amber-400">#{idx + 1}</span>
                    <span className="text-slate-400 text-[9px] truncate ml-1">{meta.role}</span>
                  </div>
                  <div className="font-bold text-white text-xs truncate">
                    {kw}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200 leading-relaxed">
            <strong className="text-emerald-300 block mb-0.5">🔍 Pelajaran Kurator:</strong>
            10 kata pertama ini <strong>100% fakta visual langsung (literal attributes)</strong>. Tidak ada kata puitis, tidak ada kata spam. Ini alasan kenapa aset ini punya ranking sangat kuat di kata kunci pencarian utama pembeli.
          </div>
        </div>

        {/* C. STRUKTUR PIRAMIDA KE BAWAH (TAG 11 – 49) */}
        <div className="p-4 rounded-xl bg-[#090a14] border-2 border-[#2b2d42] space-y-3.5 shadow-[2px_2px_0px_#000]">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 text-xs font-black border border-pink-500/40">
              C
            </span>
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              Struktur Piramida ke Bawah (Tag 11 – {allKeywords.length})
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* Tag 11-20 */}
            <div className="p-3 rounded-xl bg-[#141626] border-2 border-[#2a2d42] space-y-1.5 shadow-[1px_1px_0px_#000]">
              <div className="flex items-center justify-between">
                <span className="font-black text-indigo-300 text-[11px] uppercase tracking-wide">
                  Tag 11–20
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 font-bold">
                  Elemen Visual Varian
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Elemen visual spesifik tiap varian desain (glow, blur, wave, line, grid, geometric, smooth, fluid).
              </p>
              <div className="flex flex-wrap gap-1 pt-1">
                {allKeywords.slice(10, 20).map((kw, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded bg-black/50 text-indigo-200 text-[10px] border border-indigo-900">
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            {/* Tag 21-38 */}
            <div className="p-3 rounded-xl bg-[#141626] border-2 border-[#2a2d42] space-y-1.5 shadow-[1px_1px_0px_#000]">
              <div className="flex items-center justify-between">
                <span className="font-black text-pink-300 text-[11px] uppercase tracking-wide">
                  Tag 21–38
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-pink-950 text-pink-300 font-bold">
                  Area Aplikasi Pembeli
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Penggunaan nyata oleh pembeli (cover, flier, booklet, banner, layout, branding, presentation, print).
              </p>
              <div className="flex flex-wrap gap-1 pt-1">
                {allKeywords.slice(20, 38).map((kw, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded bg-black/50 text-pink-200 text-[10px] border border-pink-900">
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            {/* Tag 39-49 */}
            <div className="p-3 rounded-xl bg-[#141626] border-2 border-[#2a2d42] space-y-1.5 shadow-[1px_1px_0px_#000]">
              <div className="flex items-center justify-between">
                <span className="font-black text-purple-300 text-[11px] uppercase tracking-wide">
                  Tag 39–{allKeywords.length}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 font-bold">
                  Koleksi &amp; Mood
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Atribut koleksi dan mood komersial (collection, set, trendy, innovation, wallpaper, bundle).
              </p>
              <div className="flex flex-wrap gap-1 pt-1">
                {allKeywords.slice(38).map((kw, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded bg-black/50 text-purple-200 text-[10px] border border-purple-900">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Kesimpulan & Pola yang Wajib Anda Tiru */}
        <div className="p-4 rounded-xl bg-[#14172a] border-2 border-amber-500/50 space-y-2.5 text-xs shadow-[2px_2px_0px_#000]">
          <div className="flex items-center gap-2 text-amber-300 font-black uppercase tracking-wide">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Kesimpulan &amp; Pola yang Wajib Anda Tiru:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-slate-200 text-[11px] leading-relaxed">
            <div className="p-2.5 rounded-lg bg-black/30 border border-amber-500/20">
              <strong className="text-amber-300 block mb-1">1. Gunakan Judul Deskriptif Alami:</strong>
              Jika aset Anda berupa bundle/set, sebutkan elemen-elemen khas tiap variasinya di dalam judul seperti contoh di atas.
            </div>
            <div className="p-2.5 rounded-lg bg-black/30 border border-amber-500/20">
              <strong className="text-amber-300 block mb-1">2. Prioritaskan Warna &amp; Format di Top 10:</strong>
              Masukkan vector/photo, tipe produk (poster/banner), dan palet warna utama (blue, cyan, dark) di 10 tag terdepan.
            </div>
            <div className="p-2.5 rounded-lg bg-black/30 border border-amber-500/20">
              <strong className="text-amber-300 block mb-1">3. Pecah Tag Menjadi Kata Tunggal:</strong>
              Gunakan 85%–100% kata tunggal untuk aset stok karena algoritma Adobe jauh lebih fleksibel dalam mencocokkan pencarian pembeli.
            </div>
          </div>
        </div>

        {/* Tier Tabs Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar pt-2">
          <button
            onClick={() => setActiveTierTab('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer shrink-0 border-2 border-black ${
              activeTierTab === 'all'
                ? 'bg-amber-400 text-black shadow-[2px_2px_0px_#000]'
                : 'bg-[#181a28] text-slate-400 hover:text-white'
            }`}
          >
            Semua Tag ({allKeywords.length})
          </button>

          <button
            onClick={() => setActiveTierTab('t1')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer shrink-0 border-2 border-black flex items-center gap-1.5 ${
              activeTierTab === 't1'
                ? 'bg-emerald-400 text-black shadow-[2px_2px_0px_#000]'
                : 'bg-[#181a28] text-emerald-400 hover:bg-emerald-950/40'
            }`}
          >
            <span>Top 10: Objek &amp; Format</span>
            <span className="text-[10px] opacity-80">({(item.tier1Keywords || []).length})</span>
          </button>

          <button
            onClick={() => setActiveTierTab('t2')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer shrink-0 border-2 border-black flex items-center gap-1.5 ${
              activeTierTab === 't2'
                ? 'bg-indigo-400 text-black shadow-[2px_2px_0px_#000]'
                : 'bg-[#181a28] text-indigo-400 hover:bg-indigo-950/40'
            }`}
          >
            <span>11-20: Gaya &amp; Warna Varian</span>
            <span className="text-[10px] opacity-80">({(item.tier2Keywords || []).length})</span>
          </button>

          <button
            onClick={() => setActiveTierTab('t3')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer shrink-0 border-2 border-black flex items-center gap-1.5 ${
              activeTierTab === 't3'
                ? 'bg-pink-400 text-black shadow-[2px_2px_0px_#000]'
                : 'bg-[#181a28] text-pink-400 hover:bg-pink-950/40'
            }`}
          >
            <span>21-38: Area Aplikasi Pembeli</span>
            <span className="text-[10px] opacity-80">({(item.tier3Keywords || []).length})</span>
          </button>

          <button
            onClick={() => setActiveTierTab('t4')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer shrink-0 border-2 border-black flex items-center gap-1.5 ${
              activeTierTab === 't4'
                ? 'bg-purple-400 text-black shadow-[2px_2px_0px_#000]'
                : 'bg-[#181a28] text-purple-400 hover:bg-purple-950/40'
            }`}
          >
            <span>39-49: Atribut Koleksi</span>
            <span className="text-[10px] opacity-80">({(item.tier4Keywords || []).length})</span>
          </button>
        </div>

        {/* Modal Detail Audit Kurator Adobe Stock */}
        {showCuratorAuditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in select-none">
            <div className="bg-[#131522] border-2 border-[#33374e] rounded-2xl max-w-xl w-full p-5 shadow-[6px_6px_0px_#000] space-y-4 text-xs">
              <div className="flex items-center justify-between border-b-2 border-[#222538] pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">
                    Audit Kurator Adobe Stock &amp; FAQ Microstock
                  </h4>
                </div>
                <button
                  onClick={() => setShowCuratorAuditModal(false)}
                  className="w-7 h-7 rounded-lg bg-[#1e2030] hover:bg-[#282b40] text-slate-300 border border-black flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                <div className="p-3 rounded-xl bg-[#0c0d16] border border-[#23263b] space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-emerald-300">
                    <span>1. Subjek Komersial Terindeks ({matchedCoreSubjects.length}/{coreSubjectNouns.length})</span>
                    <span className="text-[10px] bg-emerald-950 px-2 py-0.5 rounded text-emerald-400 border border-emerald-500/40">Tier 1 &amp; Tier 3</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {coreSubjectNouns.map((cs) => {
                      const isFound = matchedCoreSubjects.includes(cs);
                      return (
                        <span
                          key={cs}
                          className={`inline-block mr-1.5 mb-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isFound
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                              : 'bg-rose-950/80 text-rose-300 border-rose-500/50'
                          }`}
                        >
                          {isFound ? '✓ ' : '✗ '} {cs}
                        </span>
                      );
                    })}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#0c0d16] border border-[#23263b] space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-cyan-300">
                    <span>2. Kata Pengisi / Hubung Yang Difilter ({filteredFillerWords.length})</span>
                    <span className="text-[10px] bg-cyan-950 px-2 py-0.5 rounded text-cyan-400 border border-cyan-500/40">Pedoman Adobe</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Sesuai FAQ Adobe Stock Contributor, kata hubung, preposisi, dan kata kerja visual ('showing', 'using', 'from', 'with') tidak boleh disalin mentah menjadi keywords:
                  </p>
                  <p className="text-[10px] text-slate-400 flex flex-wrap gap-1">
                    {filteredFillerWords.length > 0 ? (
                      filteredFillerWords.map((fw) => (
                        <span key={fw} className="px-1.5 py-0.5 rounded bg-black/60 border border-slate-700 text-slate-400">
                          {fw}
                        </span>
                      ))
                    ) : (
                      <span className="italic text-slate-500">Tidak ada kata pengisi yang terdeteksi.</span>
                    )}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#0c0d16] border border-[#23263b] space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-amber-300">
                    <span>3. Format Teknis Dialokasikan di Tier 4</span>
                    <span className="text-[10px] bg-amber-950 px-2 py-0.5 rounded text-amber-400 border border-amber-500/40">Anti-Spam Tier 1</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Tag format teknis seperti <strong>4K, Footage, Clip, Explainer, 3D Rendering</strong> disimpan di Tier 4 agar tidak mendominasi Tier 1 yang khusus untuk objek visual nyata:
                  </p>
                  <p className="text-[10px] text-amber-200 flex flex-wrap gap-1">
                    {formatTerms.map((ft) => (
                      <span key={ft} className="px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300 font-bold">
                        {ft}
                      </span>
                    ))}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#0c0d16] border border-[#23263b] space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-purple-300">
                    <span>4. Rasio Emas 75-80% Kata Tunggal</span>
                    <span className="text-[10px] bg-purple-950 px-2 py-0.5 rounded text-purple-300 border border-purple-500/40">{singleWordPct}% Terpenuhi</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Algoritma Adobe Stock melakukan pencocokan kata tunggal (stem matching). Penggunaan 1 kata membuka potensi impresi 5x-10x lebih luas dibanding frasa 2 kata.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#0c0d16] border border-[#23263b] space-y-2">
                  <div className="flex items-center justify-between font-bold text-rose-300">
                    <span>5. Standar Judul Video Bebas Klise Kamera (Adobe Stock Page 1)</span>
                    <span className="text-[10px] bg-rose-950 px-2 py-0.5 rounded text-rose-300 border border-rose-500/40">Pedoman Kurator</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Hindari awalan klise kamera/resolusi seperti <em>"Static 4K Video Shot of..."</em> atau <em>"Slow Motion Video of..."</em>. Mulai langsung dari subjek visual aktif:
                  </p>
                  <div className="space-y-1.5 text-[10px] font-mono">
                    <div className="p-2 rounded bg-rose-950/40 border border-rose-500/30 text-rose-200">
                      <span className="text-rose-400 font-bold block">❌ CONTOH KURANG EFEKTIF:</span>
                      "Static 4K Video Shot of Red Santa Hat Hanging on Modern Office Desk Lamp During Christmas Holiday Season in Corporate Workplace Environment."
                    </div>
                    <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-200">
                      <span className="text-emerald-400 font-bold block">✓ CONTOH STANDAR EMAS PAGE 1:</span>
                      "Red Santa Hat Hanging on Modern Office Desk Lamp During Christmas Holiday Season in Corporate Workplace Environment."
                    </div>
                    <div className="p-2 rounded bg-indigo-950/40 border border-indigo-500/30 text-indigo-200">
                      <span className="text-cyan-400 font-bold block">✓ RIIL PAGE 1 (ASSET TOP RANK):</span>
                      "Animated laptop displaying password protection dashboard interface with charts and lock icon, representing secure login, data protection, and cybersecurity monitoring system."
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-[#222538]">
                <button
                  onClick={() => setShowCuratorAuditModal(false)}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs border-2 border-black shadow-[2px_2px_0px_#000] cursor-pointer"
                >
                  Tutup Audit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Interactive Keywords Chips Display */}
        <div className="flex flex-wrap gap-1.5 p-3.5 rounded-xl bg-[#090a10] border-2 border-[#262838] min-h-[140px] max-h-[350px] overflow-y-auto">
          {allKeywords.length === 0 ? (
            <div className="w-full text-center py-8 text-xs text-slate-500">
              Tidak ada kata kunci tersedia.
            </div>
          ) : (
            allKeywords.map((kw, index) => {
              let tierNum = 1;
              let chipStyle = 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60 hover:border-emerald-400';
              if (index >= 10 && index < 20) {
                tierNum = 2;
                chipStyle = 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60 hover:border-indigo-400';
              } else if (index >= 20 && index < 35) {
                tierNum = 3;
                chipStyle = 'bg-pink-950/80 text-pink-300 border-pink-700/60 hover:border-pink-400';
              } else if (index >= 35) {
                tierNum = 4;
                chipStyle = 'bg-purple-950/80 text-purple-300 border-purple-700/60 hover:border-purple-400';
              }

              if (activeTierTab === 't1' && tierNum !== 1) return null;
              if (activeTierTab === 't2' && tierNum !== 2) return null;
              if (activeTierTab === 't3' && tierNum !== 3) return null;
              if (activeTierTab === 't4' && tierNum !== 4) return null;

              const isEditing = editingKeywordIndex === index;

              if (isEditing) {
                return (
                  <div key={index} className="flex items-center gap-1 bg-[#1e2030] border-2 border-indigo-500 px-2 py-0.5 rounded text-xs">
                    <input
                      type="text"
                      autoFocus
                      value={editingKeywordValue}
                      onChange={(e) => setEditingKeywordValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEditedKeyword(index);
                        if (e.key === 'Escape') setEditingKeywordIndex(null);
                      }}
                      onBlur={() => handleSaveEditedKeyword(index)}
                      className="bg-transparent text-white focus:outline-none w-28 text-xs font-mono"
                    />
                  </div>
                );
              }

              const kwWords = kw.trim().split(/\s+/).filter(Boolean);
              const isSingleWord = kwWords.length === 1;
              const isMatchingTitle =
                coreSubjectNouns.includes(kw.toLowerCase().trim()) ||
                curatedTitleAnalysis.recognizedCompounds.some((c: string) => c.toLowerCase() === kw.toLowerCase().trim()) ||
                coreSubjectNouns.some((cs: string) => kw.toLowerCase().includes(cs));

              return (
                <div
                  key={index}
                  className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border transition-all select-none ${
                    isMatchingTitle ? 'ring-1 ring-amber-400/40 ' + chipStyle : chipStyle
                  }`}
                >
                  <span className="text-[10px] opacity-50 font-bold">
                    #{index + 1}
                  </span>
                  <span
                    onClick={() => {
                      setEditingKeywordIndex(index);
                      setEditingKeywordValue(kw);
                    }}
                    className="cursor-pointer hover:underline font-medium"
                    title={isSingleWord ? '1 Kata (Format Utama)' : '2 Kata (Frasa Majemuk)'}
                  >
                    {kw}
                  </span>
                  {isMatchingTitle && (
                    <span
                      className="text-[8px] px-1 py-0.2 bg-amber-400 text-black font-black rounded border border-black/30"
                      title="Kata kunci ini selaras langsung dengan Judul Aset!"
                    >
                      JUDUL
                    </span>
                  )}
                  {!isSingleWord && !isMatchingTitle && (
                    <span className="text-[8px] px-1 py-0.2 bg-indigo-500/20 text-indigo-300 rounded font-bold" title="Frasa 2 Kata">
                      2w
                    </span>
                  )}
                  <button
                    onClick={() => handleRemoveKeyword(index)}
                    className="opacity-40 group-hover:opacity-100 hover:text-rose-400 transition-opacity cursor-pointer"
                    title="Hapus keyword"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Add Keyword Input */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
          <div className="flex-1 flex items-center gap-2 w-full">
            <input
              type="text"
              value={newKeywordInput}
              onChange={(e) => setNewKeywordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
              placeholder="Ketik kata kunci baru (utamakan 1 kata, misal: security, cloud, drone)..."
              className="flex-1 px-3 py-1.5 text-xs bg-[#090a10] border-2 border-[#262838] rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />

            <select
              value={newKeywordTier}
              onChange={(e) => setNewKeywordTier(parseInt(e.target.value, 10) as any)}
              className="px-2.5 py-1.5 text-xs bg-[#161824] border-2 border-black rounded-lg text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value={1}>Tier 1 (Subjek)</option>
              <option value={2}>Tier 2 (Gaya/Warna)</option>
              <option value={3}>Tier 3 (Aplikasi)</option>
              <option value={4}>Tier 4 (Kategori)</option>
            </select>

            <button
              onClick={handleAddKeyword}
              disabled={!newKeywordInput.trim()}
              className="px-3.5 py-1.5 rounded-lg bg-[#1e2030] hover:bg-[#282b40] text-slate-200 border-2 border-black text-xs font-bold flex items-center gap-1 shadow-[2px_2px_0px_#000] disabled:opacity-40 transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Tambah</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: AI REFINEMENT ASSISTANT */}
      <div className="bg-[#12131c] rounded-2xl border-2 border-[#2b2d3d] p-5 shadow-[4px_4px_0px_#000] space-y-3">
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-black text-white uppercase tracking-wider">
            C46u5 AI Refinement (Sesuaikan Hasil)
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          Butuh penyesuaian sudut pandang atau gaya? Berikan instruksi langsung atau klik saran cepat di bawah:
        </p>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {[
            'Pertegas rasio 80% kata tunggal 1-word',
            'Fokuskan ke video footage b-roll komersial',
            'Perjelas pergerakan kamera drone shot',
            'Ubah tema ke industri perbankan & fintech',
            'Buat judul padat maksimal 15 kata',
          ].map((sug, sIdx) => (
            <button
              key={sIdx}
              type="button"
              onClick={() => handleRefineSubmit(undefined, sug)}
              disabled={isRefining}
              className="text-[10px] px-2.5 py-1 rounded bg-[#181a28] hover:bg-[#24273c] text-indigo-300 border border-[#3b3e5b] font-medium transition-colors cursor-pointer"
            >
              {sug}
            </button>
          ))}
        </div>

        <form onSubmit={handleRefineSubmit} className="flex gap-2 pt-1">
          <input
            type="text"
            value={refinementPrompt}
            onChange={(e) => setRefinementPrompt(e.target.value)}
            placeholder="Ketik instruksi perbaikan manual (misal: Tambahkan kata kunci aerial dan sunrise...)"
            className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-[#090a10] border-2 border-[#262838] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
          />
          <button
            type="submit"
            disabled={isRefining || !refinementPrompt.trim()}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black border-2 border-black shadow-[2px_2px_0px_#000] disabled:opacity-50 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isRefining ? 'MEMPROSES...' : 'REFINE'}</span>
          </button>
        </form>

        {refineError && (
          <p className="text-xs text-rose-400 font-bold">{refineError}</p>
        )}

        {item.reviewNotes && (
          <div className="mt-3 p-3 rounded-xl bg-[#0a0b12] border border-[#2b2d3d] text-xs text-slate-400 leading-relaxed">
            <strong className="text-amber-400 block mb-1">Catatan Strategi Kurasi:</strong>
            {item.reviewNotes}
          </div>
        )}
      </div>
    </div>
  );
};
