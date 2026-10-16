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
  ChevronRight, 
  Tag, 
  Edit3, 
  Compass, 
  Wand2,
  UploadCloud,
  ImagePlus,
  FileCode,
  ImageIcon,
  AlertCircle,
  Film,
  Video,
  Camera
} from 'lucide-react';
import { StockItem, TrademarkWarning } from '../types';
import { checkKeywordsForTrademarks, checkTitleForTrademarks } from '../utils/trademarkChecker';
import { generateBridgeTextBlock } from '../utils/csvExport';
import { captureFrameFromVideoElement } from '../utils/videoExtractor';

interface MetadataDetailProps {
  item: StockItem;
  onUpdateItem: (updated: Partial<StockItem>) => void;
  onProcessItem: (id: string) => void;
  onRefineItem: (id: string, instruction: string) => Promise<void>;
  onAttachPreview?: (id: string, file: File) => void;
  isProcessing: boolean;
}

export const MetadataDetail: React.FC<MetadataDetailProps> = ({
  item,
  onUpdateItem,
  onProcessItem,
  onRefineItem,
  onAttachPreview,
  isProcessing,
}) => {
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [copiedKeywords, setCopiedKeywords] = useState(false);
  const [copiedBridgeBlock, setCopiedBridgeBlock] = useState(false);
  const [copiedTier, setCopiedTier] = useState<number | null>(null);

  const [activeTierTab, setActiveTierTab] = useState<'all' | 't1' | 't2' | 't3' | 't4'>('all');
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [newKeywordTier, setNewKeywordTier] = useState<1 | 2 | 3 | 4>(1);

  // Refinement modal state
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

  // Validate title words
  const titleWords = (item.title || '').trim().split(/\s+/).filter(Boolean);
  const wordCount = titleWords.length;
  const isWordCountOptimal = wordCount >= 15 && wordCount <= 25;

  // Validate keywords
  const allKeywords = item.allKeywords || [];
  const totalKeywordsCount = allKeywords.length;
  const trademarkWarnings: TrademarkWarning[] = [
    ...checkTitleForTrademarks(item.title || ''),
    ...checkKeywordsForTrademarks(allKeywords),
  ];

  // Find duplicates in keywords
  const duplicateKeywords = allKeywords.filter(
    (kw, index) => allKeywords.indexOf(kw.toLowerCase()) !== index
  );

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

  const handleRemoveKeyword = (index: number) => {
    const updated = [...allKeywords];
    updated.splice(index, 1);
    
    // Recalculate tiers
    const t1 = updated.slice(0, 10);
    const t2 = updated.slice(10, 20);
    const t3 = updated.slice(20, 35);
    const t4 = updated.slice(35, 49);

    onUpdateItem({
      allKeywords: updated,
      tier1Keywords: t1,
      tier2Keywords: t2,
      tier3Keywords: t3,
      tier4Keywords: t4,
    });
  };

  const handleAddKeyword = () => {
    const rawTokens = newKeywordInput.split(/[,;\n]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (rawTokens.length === 0) return;

    const keywordsToAdd: string[] = [];
    for (const raw of rawTokens) {
      const words = raw.split(/\s+/).filter(Boolean);
      if (words.length <= 2) {
        if (!allKeywords.includes(raw) && !keywordsToAdd.includes(raw)) {
          keywordsToAdd.push(raw);
        }
      } else {
        // Split 3+ words into separate single words to respect Adobe 1-2 words rule
        for (const w of words) {
          if (w.length > 1 && !allKeywords.includes(w) && !keywordsToAdd.includes(w)) {
            keywordsToAdd.push(w);
          }
        }
      }
    }

    if (keywordsToAdd.length === 0) return;

    let updatedT1 = [...(item.tier1Keywords || [])];
    let updatedT2 = [...(item.tier2Keywords || [])];
    let updatedT3 = [...(item.tier3Keywords || [])];
    let updatedT4 = [...(item.tier4Keywords || [])];

    for (const kw of keywordsToAdd) {
      if (newKeywordTier === 1) updatedT1.push(kw);
      else if (newKeywordTier === 2) updatedT2.push(kw);
      else if (newKeywordTier === 3) updatedT3.push(kw);
      else updatedT4.push(kw);
    }

    const combined = [...updatedT1, ...updatedT2, ...updatedT3, ...updatedT4];

    onUpdateItem({
      tier1Keywords: updatedT1,
      tier2Keywords: updatedT2,
      tier3Keywords: updatedT3,
      tier4Keywords: updatedT4,
      allKeywords: combined,
    });

    setNewKeywordInput('');
  };

  const handleSaveEditedKeyword = (index: number) => {
    const trimmed = editingKeywordValue.trim().toLowerCase();
    if (!trimmed) {
      handleRemoveKeyword(index);
    } else {
      const updated = [...allKeywords];
      updated[index] = trimmed;
      const t1 = updated.slice(0, 10);
      const t2 = updated.slice(10, 20);
      const t3 = updated.slice(20, 35);
      const t4 = updated.slice(35, 49);

      onUpdateItem({
        allKeywords: updated,
        tier1Keywords: t1,
        tier2Keywords: t2,
        tier3Keywords: t3,
        tier4Keywords: t4,
      });
    }
    setEditingKeywordIndex(null);
    setEditingKeywordValue('');
  };

  const handleRefineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refinementPrompt.trim()) return;
    setIsRefining(true);
    setRefineError(null);
    try {
      await onRefineItem(item.id, refinementPrompt.trim());
      setRefinementPrompt('');
    } catch (err: any) {
      setRefineError(err?.message || 'Refinement failed');
    } finally {
      setIsRefining(false);
    }
  };

  if (item.status === 'idle') {
    const ext = item.fileName.split('.').pop()?.toUpperCase() || 'FILE';
    const isAi = ext === 'AI';
    const isEps = ext === 'EPS';
    const isVector = isAi || isEps || ext === 'SVG';

    return (
      <div className="bg-slate-850 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
        {/* Top Asset Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-lg text-white"
              style={{
                background: isVideo ? '#065f46' : isAi ? '#c2410c' : isEps ? '#6d28d9' : '#0369a1',
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
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {item.videoMeta?.resolutionLabel || 'Stock Video Footage'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {item.videoMeta ? (
                  <span>
                    <strong className="text-emerald-400">{item.videoMeta.resolutionLabel}</strong> ({item.videoMeta.width}x{item.videoMeta.height}) &bull; {item.videoMeta.duration}s &bull; {item.videoMeta.aspectRatio} &bull; {(item.fileSize / (1024 * 1024)).toFixed(1)} MB
                  </span>
                ) : (
                  <span>{(item.fileSize / 1024).toFixed(1)} KB &bull; Status: <span className="text-slate-300">Siap Dianalisis</span></span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Visual Preview Section */}
        {item.previewUrl || item.videoUrl ? (
          <div className="space-y-3">
            <div className="relative rounded-xl bg-slate-900 border border-slate-800 p-4 flex flex-col items-center justify-center">
              <div className="w-full flex flex-col items-center justify-center overflow-hidden rounded-lg bg-slate-950/80 p-2 min-h-[180px] max-h-80">
                {isVideo && item.videoUrl ? (
                  <div className="w-full flex flex-col items-center">
                    <video
                      ref={videoRef}
                      src={item.videoUrl}
                      controls
                      playsInline
                      poster={item.previewUrl}
                      className="max-h-72 max-w-full rounded drop-shadow-md bg-black"
                    />
                  </div>
                ) : (
                  <img
                    src={item.previewUrl}
                    alt={item.fileName}
                    className="max-h-72 max-w-full object-contain rounded drop-shadow-md"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                      const fallback = e.currentTarget.parentElement?.querySelector('.detail-preview-fallback') as HTMLElement;
                      if (fallback) fallback.classList.remove('hidden');
                    }}
                  />
                )}
                <div className="detail-preview-fallback hidden p-8 text-center text-xs text-amber-400">
                  Pratinjau visual gagal dimuat. Silakan lampirkan gambar preview JPG/PNG.
                </div>
              </div>

              {/* Source Tag & Change Button */}
              <div className="w-full flex flex-wrap items-center justify-between mt-3 pt-2 border-t border-slate-800/60 text-xs gap-2">
                <span className="text-slate-300 flex items-center gap-1.5 text-[11px] font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {isVideo
                    ? `Video Frame Siap untuk AI Vision (${item.videoMeta?.extractedFrameTimestamp !== undefined ? `Detik ke-${item.videoMeta.extractedFrameTimestamp}s` : 'Otomatis'})`
                    : `Pratinjau Visual Siap (${
                        item.previewSource === 'gs_eps_render' ? 'Ghostscript EPS Vector Engine' :
                        item.previewSource === 'gs_ai_render' ? 'Ghostscript AI Artboard Engine' :
                        item.previewSource === 'pdf_render' ? 'Illustrator PDF Artboard' :
                        item.previewSource === 'xmp_thumbnail' ? 'XMP Metadata Thumbnail' :
                        item.previewSource === 'dos_eps_tiff' ? 'EPS Embedded TIFF Header' :
                        item.previewSource === 'companion' ? 'Companion JPG Preview' : 'Proportional Visual Preview'
                      })`
                  }
                </span>

                <div className="flex items-center gap-3">
                  {isVideo && item.videoUrl && (
                    <button
                      type="button"
                      onClick={handleCaptureVideoFrame}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                      title="Gunakan posisi scrubber video saat ini sebagai frame analisis AI Vision"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{frameCapturedToast ? 'Frame Disimpan!' : 'Ambil Frame Saat Ini'}</span>
                    </button>
                  )}

                  <label className="text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer font-medium flex items-center gap-1">
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
          </div>
        ) : (
          /* Companion upload card when vector file has no embedded preview */
          <div className="rounded-xl border-2 border-dashed border-amber-500/40 bg-amber-500/5 p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h4 className="text-sm font-bold text-slate-200">
                Lampirkan Gambar Preview untuk {item.fileName}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                File format <strong>.{ext}</strong> ini belum memiliki pratinjau thumbnail bawaan. Pilih atau drag file preview (<strong>.JPG / .PNG</strong>) agar AI Vision dapat melihat dan menganalisis visual aset ini secara akurat.
              </p>
            </div>

            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer">
              <ImagePlus className="w-4 h-4" />
              <span>Pilih Gambar Preview (JPG / PNG)</span>
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
        )}

        {/* Custom Context Field */}
        <div className="space-y-1.5 pt-2">
          <label className="text-xs font-semibold text-slate-300 block">
            Konteks Khusus untuk File Ini (Opsional):
          </label>
          <input
            type="text"
            value={item.customContext || ''}
            onChange={(e) => onUpdateItem({ customContext: e.target.value })}
            placeholder="Contoh: Modern fintech dashboard icons, techno rave poster, Ramadan greeting..."
            className="w-full px-3.5 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={() => onProcessItem(item.id)}
            disabled={isProcessing || item.needsPreview || !item.imageBase64}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Metadata Sekarang</span>
          </button>
        </div>
      </div>
    );
  }

  if (item.status === 'analyzing') {
    return (
      <div className="bg-slate-850 rounded-2xl border border-slate-800 p-8 shadow-xl flex flex-col items-center justify-center text-center space-y-6 min-h-[500px]">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 animate-pulse">
            <Sparkles className="w-10 h-10 animate-spin" style={{ animationDuration: '4s' }} />
          </div>
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-500 animate-ping" />
        </div>
        <div className="space-y-2 max-w-md">
          <h3 className="text-base font-bold text-white">AI Vision Specialist Sedang Menganalisis...</h3>
          <p className="text-xs text-slate-400">
            Mengidentifikasi subjek utama, estetika warna, formula judul 15-25 kata, dan 49 kata kunci berjenjang 4-tier.
          </p>
        </div>
        {/* Step indicator */}
        <div className="w-full max-w-md bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-2 text-left text-xs">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Visual Inspection & Subject Classification</span>
          </div>
          <div className="flex items-center gap-2 text-indigo-400 animate-pulse">
            <ChevronRight className="w-3.5 h-3.5" />
            <span>Calculating 15-25 Words Formula Title</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <ChevronRight className="w-3.5 h-3.5" />
            <span>Structuring 4-Tier 49 Hierarchical Keywords</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <ChevronRight className="w-3.5 h-3.5" />
            <span>Microstock Policy & Anti-Hallucination Audit</span>
          </div>
        </div>
      </div>
    );
  }

  const ext = item.fileName.split('.').pop()?.toUpperCase() || 'IMG';
  const isAi = ext === 'AI';
  const isEps = ext === 'EPS';

  return (
    <div className="space-y-5">
      {/* Top Banner / Asset Info */}
      <div className="bg-slate-850 rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-14 h-14 rounded-xl bg-slate-950 border border-slate-700 overflow-hidden shrink-0 shadow relative flex items-center justify-center p-0.5">
            {item.previewUrl ? (
              <img
                src={item.previewUrl}
                alt={item.fileName}
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.top-vector-fallback') as HTMLElement;
                  if (fallback) fallback.classList.remove('hidden');
                }}
              />
            ) : null}
            <div
              className={`top-vector-fallback ${item.previewUrl ? 'hidden' : 'flex'} absolute inset-0 flex flex-col items-center justify-center font-bold text-xs text-white`}
              style={{ background: isAi ? '#c2410c' : isEps ? '#6d28d9' : '#0369a1' }}
            >
              <span>{ext}</span>
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white truncate max-w-md">
                {item.fileName}
              </h2>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {item.fileName.split('.').pop() || 'IMG'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {(item.fileSize / 1024).toFixed(1)} KB &bull; Adobe Category:{' '}
              <span className="font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
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
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            title="Re-analyze image with AI"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            <span>Regenerate</span>
          </button>

          <button
            onClick={handleCopyBridgeBlock}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600/90 hover:bg-indigo-600 text-white shadow-sm transition-all cursor-pointer"
            title="Copy IPTC / Adobe Bridge text block"
          >
            {copiedBridgeBlock ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>Copied Block!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Bridge Block</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Visual Asset Preview & Inspection Card */}
      {(item.previewUrl || item.videoUrl) && (
        <div className="bg-slate-850 rounded-2xl border border-slate-800 p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2 font-semibold text-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>
                {isVideo
                  ? `Stock Footage Preview &bull; ${item.videoMeta?.resolutionLabel || 'HD/4K Video'} (${item.videoMeta?.format?.toUpperCase() || ext})`
                  : `Visual Asset Preview &bull; ${ext} (${
                      item.previewSource === 'gs_eps_render' ? 'Ghostscript EPS Vector Engine' :
                      item.previewSource === 'gs_ai_render' ? 'Ghostscript AI Artboard Engine' :
                      item.previewSource === 'pdf_render' ? 'Illustrator PDF Artboard' :
                      item.previewSource === 'xmp_thumbnail' ? 'XMP Metadata Thumbnail' :
                      item.previewSource === 'dos_eps_tiff' ? 'EPS Embedded TIFF Header' :
                      item.previewSource === 'companion' ? 'Companion JPG Preview' : 'Proportional Visual Preview'
                    })`
                }
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {isVideo && item.videoUrl && (
                <button
                  type="button"
                  onClick={handleCaptureVideoFrame}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                  title="Ambil posisi frame video saat ini untuk AI Vision"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{frameCapturedToast ? 'Frame Disimpan!' : 'Ambil Frame Saat Ini'}</span>
                </button>
              )}

              <label className="text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer font-medium flex items-center gap-1">
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

          <div className="w-full flex items-center justify-center p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 min-h-[160px] max-h-80 overflow-hidden">
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

          {/* Video specs banner if video */}
          {isVideo && item.videoMeta && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-400">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-emerald-300">
                  Resolusi: {item.videoMeta.resolutionLabel} ({item.videoMeta.width} &times; {item.videoMeta.height})
                </span>
                <span>Durasi: {item.videoMeta.duration}s</span>
                <span>Rasio: {item.videoMeta.aspectRatio}</span>
              </div>
              <span className="text-slate-500">
                Frame Analisis: Detik ke-{item.videoMeta.extractedFrameTimestamp ?? 1}s
              </span>
            </div>
          )}
        </div>
      )}

      {/* Compliance / Quality Inspection Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Trademark status */}
        <div className="bg-slate-850 rounded-xl border border-slate-800 p-3 flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            trademarkWarnings.length > 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
          }`}>
            {trademarkWarnings.length > 0 ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-slate-400 font-medium">Trademark Safety</p>
            <p className={`text-xs font-bold truncate ${
              trademarkWarnings.length > 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {trademarkWarnings.length === 0 ? 'Safe (No IP Conflict)' : `${trademarkWarnings.length} Flagged Brand(s)`}
            </p>
          </div>
        </div>

        {/* Word count status */}
        <div className="bg-slate-850 rounded-xl border border-slate-800 p-3 flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            isWordCountOptimal ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
          }`}>
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-slate-400 font-medium">Title Formula (15-25 w)</p>
            <p className={`text-xs font-bold truncate ${
              isWordCountOptimal ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {wordCount} Words {isWordCountOptimal ? '(Optimal)' : '(Adjust to 15-25)'}
            </p>
          </div>
        </div>

        {/* Keywords count status */}
        <div className="bg-slate-850 rounded-xl border border-slate-800 p-3 flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            totalKeywordsCount === 49 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'
          }`}>
            <Tag className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-slate-400 font-medium">Keywords Hierarchy</p>
            <p className="text-xs font-bold text-slate-200">
              {totalKeywordsCount} / 49 Keywords
            </p>
          </div>
        </div>
      </div>

      {/* Trademark warnings banner if any */}
      {trademarkWarnings.length > 0 && (
        <div className="bg-rose-950/40 border border-rose-800/80 rounded-xl p-3.5 space-y-1.5 text-xs text-rose-200">
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

      {/* SECTION 1: TITLE STRATEGIST */}
      <div className="bg-slate-850 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Title (Judul Microstock)
              </h3>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                isWordCountOptimal
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                {wordCount} Kata (Target: 15-25)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Formula: <span className="text-indigo-300">[Gaya/Tema]</span> + <span className="text-teal-300">[Format Produk]</span> + <span className="text-amber-300">[Elemen Visual Spesifik]</span> + <span className="text-purple-300">[Kegunaan/Aplikasi]</span>
            </p>
          </div>

          <button
            onClick={handleCopyTitle}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            {copiedTitle ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Title</span>
              </>
            )}
          </button>
        </div>

        {/* Formula breakdown badges */}
        {item.breakdown && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1 text-[11px]">
            <div className="p-2 rounded-lg bg-indigo-950/40 border border-indigo-800/40">
              <span className="font-semibold text-indigo-300 block mb-0.5">Gaya / Tema:</span>
              <span className="text-slate-300">{item.breakdown.styleTheme || '-'}</span>
            </div>
            <div className="p-2 rounded-lg bg-teal-950/40 border border-teal-800/40">
              <span className="font-semibold text-teal-300 block mb-0.5">Format Produk:</span>
              <span className="text-slate-300">{item.breakdown.productFormat || '-'}</span>
            </div>
            <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-800/40">
              <span className="font-semibold text-amber-300 block mb-0.5">Elemen Visual:</span>
              <span className="text-slate-300">{item.breakdown.visualElements || '-'}</span>
            </div>
            <div className="p-2 rounded-lg bg-purple-950/40 border border-purple-800/40">
              <span className="font-semibold text-purple-300 block mb-0.5">Kegunaan / Aplikasi:</span>
              <span className="text-slate-300">{item.breakdown.useCase || '-'}</span>
            </div>
          </div>
        )}

        {/* Editable Title Textarea */}
        <div>
          <textarea
            value={item.title || ''}
            onChange={(e) => {
              const newTitle = e.target.value;
              const words = newTitle.trim().split(/\s+/).filter(Boolean);
              onUpdateItem({
                title: newTitle,
                titleWordCount: words.length,
              });
            }}
            rows={3}
            className="w-full p-3 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500 font-sans leading-relaxed resize-y"
            placeholder="Edit title..."
          />
        </div>
      </div>

      {/* SECTION 2: 49 HIERARCHICAL KEYWORDS */}
      <div className="bg-slate-850 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Keywords (49 Kata Kunci - Hierarkis)
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {allKeywords.length} / 49 Total
              </span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hidden sm:inline">
                Adobe Guideline: 1-2 Kata (Top Seller Standard)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              4 Tingkatan hierarki microstock dengan format 1 kata atau maksimal 2 kata per keyword.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyKeywords}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all cursor-pointer"
            >
              {copiedKeywords ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Copied All!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy All 49 Keywords</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tier Tabs Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            onClick={() => setActiveTierTab('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
              activeTierTab === 'all'
                ? 'bg-slate-700 text-white font-semibold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            Semua ({allKeywords.length})
          </button>

          <button
            onClick={() => setActiveTierTab('t1')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTierTab === 't1'
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 font-semibold'
                : 'text-emerald-400/80 hover:bg-emerald-950/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Tier 1: Objek Utama (1-10)</span>
            <span className="text-[10px] opacity-75">({(item.tier1Keywords || []).length})</span>
          </button>

          <button
            onClick={() => setActiveTierTab('t2')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTierTab === 't2'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 font-semibold'
                : 'text-indigo-400/80 hover:bg-indigo-950/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span>Tier 2: Gaya & Warna (11-20)</span>
            <span className="text-[10px] opacity-75">({(item.tier2Keywords || []).length})</span>
          </button>

          <button
            onClick={() => setActiveTierTab('t3')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTierTab === 't3'
                ? 'bg-amber-600/30 text-amber-300 border border-amber-500/50 font-semibold'
                : 'text-amber-400/80 hover:bg-amber-950/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Tier 3: Kegunaan & Industri (21-35)</span>
            <span className="text-[10px] opacity-75">({(item.tier3Keywords || []).length})</span>
          </button>

          <button
            onClick={() => setActiveTierTab('t4')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTierTab === 't4'
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50 font-semibold'
                : 'text-purple-400/80 hover:bg-purple-950/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span>Tier 4: Konsep Umum (36-49)</span>
            <span className="text-[10px] opacity-75">({(item.tier4Keywords || []).length})</span>
          </button>
        </div>

        {/* Tier description helper */}
        <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>
              {activeTierTab === 'all' && 'Menampilkan seluruh 49 kata kunci dalam urutan hierarki microstock.'}
              {activeTierTab === 't1' && 'Tier 1 (1-10): Subjek visual paling spesifik yang langsung terlihat mata. Tidak boleh berhalusinasi.'}
              {activeTierTab === 't2' && 'Tier 2 (11-20): Adjektiva estetika, pencahayaan, tone emosional, dan palet warna.'}
              {activeTierTab === 't3' && 'Tier 3 (21-35): Solusi desain spesifik, format media (banner, poster, UI), dan target industri.'}
              {activeTierTab === 't4' && 'Tier 4 (36-49): Istilah teknis stok dan kategori payung (vector, graphic design, modern art).'}
            </span>
          </div>

          {activeTierTab !== 'all' && (
            <button
              onClick={() => {
                const tierMap = {
                  t1: { num: 1, list: item.tier1Keywords || [] },
                  t2: { num: 2, list: item.tier2Keywords || [] },
                  t3: { num: 3, list: item.tier3Keywords || [] },
                  t4: { num: 4, list: item.tier4Keywords || [] },
                };
                const current = tierMap[activeTierTab];
                handleCopyTierKeywords(current.num, current.list);
              }}
              className="text-xs text-indigo-300 hover:text-indigo-200 underline shrink-0 cursor-pointer"
            >
              {copiedTier ? 'Copied Tier!' : 'Copy Tier'}
            </button>
          )}
        </div>

        {/* Interactive Keywords Chips Display */}
        <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800 min-h-[140px] max-h-[350px] overflow-y-auto">
          {allKeywords.length === 0 ? (
            <div className="w-full text-center py-8 text-xs text-slate-500">
              Tidak ada kata kunci tersedia.
            </div>
          ) : (
            allKeywords.map((kw, index) => {
              // Determine tier for styling
              let tierNum = 1;
              let chipStyle = 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60 hover:border-emerald-500';
              if (index >= 10 && index < 20) {
                tierNum = 2;
                chipStyle = 'bg-indigo-950/50 text-indigo-300 border-indigo-800/60 hover:border-indigo-500';
              } else if (index >= 20 && index < 35) {
                tierNum = 3;
                chipStyle = 'bg-amber-950/50 text-amber-300 border-amber-800/60 hover:border-amber-500';
              } else if (index >= 35) {
                tierNum = 4;
                chipStyle = 'bg-purple-950/50 text-purple-300 border-purple-800/60 hover:border-purple-500';
              }

              // Check filter
              if (activeTierTab === 't1' && tierNum !== 1) return null;
              if (activeTierTab === 't2' && tierNum !== 2) return null;
              if (activeTierTab === 't3' && tierNum !== 3) return null;
              if (activeTierTab === 't4' && tierNum !== 4) return null;

              const isEditing = editingKeywordIndex === index;

              if (isEditing) {
                return (
                  <div key={index} className="flex items-center gap-1 bg-slate-800 border border-indigo-500 px-2 py-0.5 rounded-lg text-xs">
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
                      className="bg-transparent text-white focus:outline-none w-28 text-xs"
                    />
                  </div>
                );
              }

              const kwWords = kw.trim().split(/\s+/).filter(Boolean);
              const isOverLength = kwWords.length > 2;

              return (
                <div
                  key={index}
                  className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border transition-all ${
                    isOverLength ? 'border-amber-500/80 bg-amber-950/70 text-amber-200' : chipStyle
                  }`}
                >
                  <span className="text-[10px] font-mono opacity-50 select-none">
                    #{index + 1}
                  </span>
                  <span
                    onClick={() => {
                      setEditingKeywordIndex(index);
                      setEditingKeywordValue(kw);
                    }}
                    className="cursor-pointer hover:underline"
                    title={isOverLength ? 'Peringatan: Lebih dari 2 kata! Disarankan 1-2 kata sesuai Adobe Stock.' : 'Click to edit keyword'}
                  >
                    {kw}
                  </span>
                  {isOverLength && (
                    <span className="text-[9px] px-1 py-0.2 bg-amber-500/30 text-amber-300 rounded font-semibold" title="Adobe guideline: max 1-2 kata">
                      &gt;2 kata
                    </span>
                  )}
                  <button
                    onClick={() => handleRemoveKeyword(index)}
                    className="opacity-40 group-hover:opacity-100 hover:text-rose-400 transition-opacity cursor-pointer"
                    title="Remove keyword"
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
              placeholder="Ketik kata kunci baru (1-2 kata, misal: security, cloud, digital)..."
              className="flex-1 px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />

            <select
              value={newKeywordTier}
              onChange={(e) => setNewKeywordTier(parseInt(e.target.value, 10) as any)}
              className="px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value={1}>Tier 1 (Subject)</option>
              <option value={2}>Tier 2 (Style/Color)</option>
              <option value={3}>Tier 3 (Application)</option>
              <option value={4}>Tier 4 (General)</option>
            </select>

            <button
              onClick={handleAddKeyword}
              disabled={!newKeywordInput.trim()}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1 disabled:opacity-40 transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: AI REFINEMENT ASSISTANT */}
      <div className="bg-slate-850 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            AI Refinement & Tweaker (Sesuaikan Hasil)
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          Ingin mengubah sudut pandang metadata? Berikan instruksi langsung (misal: "Fokuskan Tier 3 ke industri perbankan", "Buat judul lebih pendek", "Tambahkan kata kunci liburan natal").
        </p>

        <form onSubmit={handleRefineSubmit} className="flex gap-2">
          <input
            type="text"
            value={refinementPrompt}
            onChange={(e) => setRefinementPrompt(e.target.value)}
            placeholder="Instruksi perbaikan (contoh: Buat Tier 3 lebih relevan untuk poster musik EDM...)"
            className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            disabled={isRefining || !refinementPrompt.trim()}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md disabled:opacity-50 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isRefining ? 'Memperbarui...' : 'Refine'}</span>
          </button>
        </form>

        {refineError && (
          <p className="text-xs text-rose-400">{refineError}</p>
        )}

        {item.reviewNotes && (
          <div className="mt-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400 leading-relaxed">
            <strong className="text-indigo-300 block mb-1">Catatan Strategi Kontributor:</strong>
            {item.reviewNotes}
          </div>
        )}
      </div>
    </div>
  );
};
