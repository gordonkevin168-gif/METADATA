import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { QueueList } from './components/QueueList';
import { MetadataDetail } from './components/MetadataDetail';
import { ExportModal } from './components/ExportModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { StockItem, PlatformPreset, ApiKeyConfig, ApiKeyItem, GeminiModelId } from './types';
import { SAMPLE_STOCK_ASSETS } from './utils/sampleData';
import { generateAllBridgeTextBlock } from './utils/csvExport';
import { 
  Sparkles, 
  HelpCircle, 
  ShieldCheck, 
  Layers, 
  BookOpen, 
  CheckCircle2,
  FileSpreadsheet,
  Key,
  Film,
  Zap,
  Info
} from 'lucide-react';

import { extractVectorPreview } from './utils/vectorPreviewExtractor';
import { extractVideoData } from './utils/videoExtractor';
import { smartGenerateMetadata, smartRefineMetadata } from './services/geminiClient';

const API_KEY_STORAGE_KEY = 'stockmeta_gemini_api_keys_v1';
const MODEL_STORAGE_KEY = 'stockmeta_gemini_model_v2';

export default function App() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [platform, setPlatform] = useState<PlatformPreset>('all');
  const [globalContext, setGlobalContext] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState<boolean>(false);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [activeGuideTab, setActiveGuideTab] = useState<boolean>(false);

  // Gemini Model Selection State
  const [selectedModel, setSelectedModel] = useState<GeminiModelId>(() => {
    try {
      const saved = localStorage.getItem(MODEL_STORAGE_KEY);
      if (
        saved &&
        (saved === 'gemini-3.8-flash' ||
          saved === 'gemini-flash-latest' ||
          saved === 'gemini-3.1-flash-lite' ||
          saved === 'gemini-2.5-flash' ||
          saved === 'gemini-2.5-pro')
      ) {
        return saved as GeminiModelId;
      }
    } catch {}
    return 'gemini-3.8-flash';
  });

  const handleSelectModel = (model: GeminiModelId) => {
    setSelectedModel(model);
    try {
      localStorage.setItem(MODEL_STORAGE_KEY, model);
    } catch (e) {
      console.error('Failed to save selected model:', e);
    }
  };

  // Gemini API Key Config State
  const [apiKeyConfig, setApiKeyConfig] = useState<ApiKeyConfig>(() => {
    try {
      const saved = localStorage.getItem(API_KEY_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      keys: [],
      activeKeyId: null,
      autoRotate: true,
      useCustomKeys: false,
    };
  });

  const handleUpdateApiKeyConfig = (newConfig: ApiKeyConfig) => {
    setApiKeyConfig(newConfig);
    try {
      localStorage.setItem(API_KEY_STORAGE_KEY, JSON.stringify(newConfig));
    } catch (e) {
      console.error('Failed to save API key config:', e);
    }
  };

  // Initialize with sample assets on first load so user immediately sees a working studio
  useEffect(() => {
    setItems(SAMPLE_STOCK_ASSETS);
    setSelectedId('sample-1');
  }, []);

  const selectedItem = items.find((i) => i.id === selectedId) || items[0] || null;

  const handleFilesSelected = async (files: File[]) => {
    const newItems: StockItem[] = [];

    // First map all companion raster images (JPG, PNG, WEBP) by base name for auto-pairing
    const imageFilesMap = new Map<string, File>();
    for (const f of files) {
      const lower = f.name.toLowerCase();
      if (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp')) {
        const baseName = f.name.substring(0, f.name.lastIndexOf('.')).toLowerCase();
        imageFilesMap.set(baseName, f);
      }
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const id = `item-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 6)}`;
      const fileNameLower = file.name.toLowerCase();
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')).toLowerCase();
      const isVideo = file.type.startsWith('video/') || fileNameLower.match(/\.(mp4|mov|webm|m4v|avi|mkv)$/) !== null;
      const isAiOrEps = fileNameLower.endsWith('.ai') || fileNameLower.endsWith('.eps');
      const isSvg = fileNameLower.endsWith('.svg') || file.type.includes('svg');
      
      try {
        let previewUrl = '';
        let cleanBase64 = '';
        let artworkType: StockItem['artworkType'] = isVideo ? 'footage' : (isAiOrEps || isSvg ? 'vector' : 'auto');
        let needsPreview = false;
        let previewSource: StockItem['previewSource'] = isVideo ? 'video_frame' : 'native';
        let mediaType: StockItem['mediaType'] = isVideo ? 'video' : (isAiOrEps || isSvg ? 'vector' : 'image');
        let videoUrl: string | undefined = undefined;
        let videoMeta: StockItem['videoMeta'] = undefined;

        if (isVideo) {
          try {
            const vData = await extractVideoData(file);
            previewUrl = vData.previewUrl;
            cleanBase64 = vData.imageBase64;
            videoUrl = vData.videoUrl;
            videoMeta = vData.videoMeta;
            needsPreview = false;
          } catch (vErr) {
            console.warn('Video frame extraction failed, falling back:', vErr);
            videoUrl = URL.createObjectURL(file);
            needsPreview = true;
          }
        } else if (isAiOrEps) {
          artworkType = 'vector';
          // 1. Try automated vector preview extraction (PDF.js render, XMP thumbnail, embedded JPEG)
          const extracted = await extractVectorPreview(file);
          if (extracted.previewUrl && extracted.imageBase64) {
            previewUrl = extracted.previewUrl;
            cleanBase64 = extracted.imageBase64;
            previewSource = extracted.source as StockItem['previewSource'];
            needsPreview = false;
          } else {
            // 2. Check if user uploaded a companion JPG/PNG with the same base name (e.g. bas.ai + bas.jpg)
            const companionFile = imageFilesMap.get(baseName);
            if (companionFile && companionFile !== file) {
              const compDataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(companionFile);
              });
              previewUrl = compDataUrl;
              cleanBase64 = compDataUrl.replace(/^data:[a-zA-Z0-9\/+-]+;base64,/, '');
              previewSource = 'companion';
              needsPreview = false;
            } else {
              // 3. Mark as requiring preview (do NOT put raw binary Postscript into previewUrl!)
              previewUrl = '';
              cleanBase64 = '';
              needsPreview = true;
            }
          }
        } else if (isSvg) {
          artworkType = 'vector';
          const svgDataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          previewUrl = svgDataUrl;
          cleanBase64 = svgDataUrl.replace(/^data:[a-zA-Z0-9\/+-]+;base64,/, '');

          // Render SVG on canvas to ensure Gemini vision gets crisp raster image
          try {
            const pngBase64 = await new Promise<string>((res) => {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 800;
                canvas.height = 600;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.fillStyle = '#ffffff';
                  ctx.fillRect(0, 0, 800, 600);
                  ctx.drawImage(img, 0, 0, 800, 600);
                  res(canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, ''));
                  return;
                }
                res(cleanBase64);
              };
              img.onerror = () => res(cleanBase64);
              img.src = svgDataUrl;
            });
            cleanBase64 = pngBase64;
          } catch {
            // fallback
          }
        } else {
          // Standard raster image (JPG, PNG, WEBP)
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          previewUrl = dataUrl;
          cleanBase64 = dataUrl.replace(/^data:[a-zA-Z0-9\/+-]+;base64,/, '');
        }

        newItems.push({
          id,
          file,
          fileName: file.name,
          fileSize: file.size,
          mimeType: isVideo ? (file.type || 'video/mp4') : (isAiOrEps ? 'application/illustrator' : (file.type || 'image/jpeg')),
          previewUrl,
          imageBase64: cleanBase64,
          mediaType,
          artworkType,
          videoUrl,
          videoMeta,
          customContext: globalContext || '',
          needsPreview,
          previewSource,
          status: 'idle',
        });
      } catch (err) {
        console.error('Failed to read file:', file.name, err);
      }
    }

    if (newItems.length > 0) {
      setItems((prev) => [...newItems, ...prev]);
      setSelectedId(newItems[0].id);
    }
  };

  const handleAttachCompanionPreview = async (itemId: string, previewFile: File) => {
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(previewFile);
      });
      const cleanBase64 = dataUrl.replace(/^data:[a-zA-Z0-9\/+-]+;base64,/, '');
      handleUpdateItem(itemId, {
        previewUrl: dataUrl,
        imageBase64: cleanBase64,
        needsPreview: false,
        previewSource: 'companion',
        errorMessage: undefined,
      });
    } catch (err) {
      console.error('Failed to attach companion preview:', err);
    }
  };

  const handleLoadSamples = () => {
    setItems(SAMPLE_STOCK_ASSETS);
    setSelectedId('sample-1');
  };

  const handleUpdateItem = (id: string, updated: Partial<StockItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    );
  };

  const processSingleItem = async (id: string) => {
    const target = items.find((i) => i.id === id);
    if (!target) return;

    handleUpdateItem(id, { status: 'analyzing', errorMessage: undefined });

    try {
      // Ensure Gemini vision receives a pristine raster image (PNG or JPEG) from previewUrl
      let imageBase64ToSend = target.imageBase64;
      let mimeTypeToSend = 'image/png';

      if (target.previewUrl && target.previewUrl.startsWith('data:image/')) {
        if (target.previewUrl.includes('image/svg+xml')) {
          try {
            imageBase64ToSend = await new Promise<string>((resolve) => {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 1000;
                canvas.height = 750;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.fillStyle = '#ffffff';
                  ctx.fillRect(0, 0, 1000, 750);
                  ctx.drawImage(img, 0, 0, 1000, 750);
                  resolve(canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, ''));
                  return;
                }
                resolve(target.imageBase64);
              };
              img.onerror = () => resolve(target.imageBase64);
              img.src = target.previewUrl;
            });
            mimeTypeToSend = 'image/png';
          } catch (e) {
            console.warn('Canvas rasterization fallback:', e);
          }
        } else {
          const match = target.previewUrl.match(/^data:(image\/[a-zA-Z0-9+-]+);base64,(.+)$/);
          if (match) {
            mimeTypeToSend = match[1];
            imageBase64ToSend = match[2];
          }
        }
      }

      let currentKey = apiKeyConfig.useCustomKeys && apiKeyConfig.activeKeyId
        ? apiKeyConfig.keys.find((k) => k.id === apiKeyConfig.activeKeyId)?.key
        : undefined;

      const requestPayload = {
        imageBase64: imageBase64ToSend,
        mimeType: mimeTypeToSend,
        fileName: target.fileName,
        customContext: target.customContext || globalContext,
        targetPlatform: platform,
        artworkType: target.artworkType,
        mediaType: target.mediaType,
        videoMeta: target.videoMeta,
        apiKey: currentKey,
        selectedModel: selectedModel,
      };

      const result = await smartGenerateMetadata(
        requestPayload,
        async () => {
          if (!apiKeyConfig.useCustomKeys || !apiKeyConfig.autoRotate) return undefined;
          const exhaustedId = apiKeyConfig.activeKeyId;
          const availableNext = apiKeyConfig.keys.find((k) => k.id !== exhaustedId && k.status === 'ready');
          if (availableNext) {
            const updatedKeys = apiKeyConfig.keys.map((k) =>
              k.id === exhaustedId ? { ...k, status: 'exhausted' as const, errorMsg: 'Quota habis (429)' } : k
            );
            handleUpdateApiKeyConfig({
              ...apiKeyConfig,
              keys: updatedKeys,
              activeKeyId: availableNext.id,
            });
            currentKey = availableNext.key;
            return availableNext.key;
          }
          return undefined;
        }
      );

      // Increment usage count for active key if custom key was used
      if (currentKey) {
        const updated = apiKeyConfig.keys.map((k) =>
          k.key === currentKey ? { ...k, usageCount: (k.usageCount || 0) + 1, lastUsed: Date.now() } : k
        );
        handleUpdateApiKeyConfig({ ...apiKeyConfig, keys: updated });
      }

      handleUpdateItem(id, {
        status: 'completed',
        title: result.title,
        titleWordCount: result.titleWordCount,
        breakdown: result.breakdown,
        tier1Keywords: result.tier1Keywords,
        tier2Keywords: result.tier2Keywords,
        tier3Keywords: result.tier3Keywords,
        tier4Keywords: result.tier4Keywords,
        allKeywords: result.allKeywords,
        category: result.category,
        categoryId: result.categoryId,
        secondaryCategory: result.secondaryCategory,
        rejectionRiskScore: result.rejectionRiskScore,
        reviewNotes: result.reviewNotes,
      });
    } catch (err: any) {
      console.error('Error analyzing item:', err);
      const msg = err.message || 'Analysis failed. Please check network and retry.';
      if (msg.includes('API Key Gemini tidak ditemukan')) {
        setApiKeyModalOpen(true);
      }
      handleUpdateItem(id, {
        status: 'error',
        errorMessage: msg,
      });
    }
  };

  const handleProcessAll = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    const pending = items.filter((i) => i.status === 'idle' || i.status === 'error');
    for (const item of pending) {
      await processSingleItem(item.id);
    }

    setIsProcessing(false);
  };

  const handleRefineItem = async (id: string, instruction: string) => {
    const target = items.find((i) => i.id === id);
    if (!target) return;

    const currentKey = apiKeyConfig.useCustomKeys && apiKeyConfig.activeKeyId
      ? apiKeyConfig.keys.find((k) => k.id === apiKeyConfig.activeKeyId)?.key
      : undefined;

    try {
      const result = await smartRefineMetadata({
        currentTitle: target.title || '',
        currentKeywords: target.allKeywords || [],
        refinementInstruction: instruction,
        fileName: target.fileName,
        imageBase64: target.imageBase64,
        mimeType: 'image/png',
        apiKey: currentKey,
        selectedModel: selectedModel,
      });

      handleUpdateItem(id, {
        title: result.title,
        titleWordCount: result.titleWordCount,
        breakdown: result.breakdown,
        tier1Keywords: result.tier1Keywords,
        tier2Keywords: result.tier2Keywords,
        tier3Keywords: result.tier3Keywords,
        tier4Keywords: result.tier4Keywords,
        allKeywords: result.allKeywords,
        category: result.category,
        categoryId: result.categoryId,
        secondaryCategory: result.secondaryCategory,
        rejectionRiskScore: result.rejectionRiskScore,
        reviewNotes: result.reviewNotes,
      });
    } catch (err: any) {
      console.error('Error refining item:', err);
      handleUpdateItem(id, {
        reviewNotes: `Refine failed: ${err.message || 'Error'}`,
      });
    }
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (selectedId === id) {
      const remaining = items.filter((i) => i.id !== id);
      setSelectedId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleClearAll = () => {
    setItems([]);
    setSelectedId(null);
  };

  const handleCopyAll = () => {
    const text = generateAllBridgeTextBlock(items);
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const completedCount = items.filter((i) => i.status === 'completed' && i.title).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <Header
        platform={platform}
        setPlatform={setPlatform}
        selectedModel={selectedModel}
        onSelectModel={handleSelectModel}
        totalCount={items.length}
        completedCount={completedCount}
        onOpenExportModal={() => setExportModalOpen(true)}
        onCopyAll={handleCopyAll}
        isProcessing={isProcessing}
        onProcessAll={handleProcessAll}
        copiedAll={copiedAll}
        onOpenApiKeyModal={() => setApiKeyModalOpen(true)}
        apiKeyCount={apiKeyConfig.keys.length}
        useCustomKeys={apiKeyConfig.useCustomKeys}
        activeKeyLabel={apiKeyConfig.keys.find((k) => k.id === apiKeyConfig.activeKeyId)?.label}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-5">
        {/* Modern Minimalist Status Strip */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-white tracking-tight">
                Microstock Contributor AI Studio
              </span>
            </div>
            <span className="text-slate-600 hidden sm:inline">&bull;</span>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Title 15-25 kata berformula komersial &amp; 49 Keywords hierarki bebas pelanggaran trademark
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveGuideTab(!activeGuideTab)}
              className="px-3 py-1.5 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:border-slate-600"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>{activeGuideTab ? 'Tutup Formula' : 'Pedoman Formula & Video'}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Modern Formula & Video Guidelines Card */}
        {activeGuideTab && (
          <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Formula Standar Industri Adobe Stock, Shutterstock &amp; Video Footage
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Adobe Stock Contributor Guideline</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <span className="font-bold text-indigo-300 flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  1. Title Formula (15 - 25 Kata):
                </span>
                <p className="text-slate-300 text-[11px]">
                  <code className="text-indigo-300 bg-slate-900 px-1 py-0.5 rounded border border-indigo-500/20 block text-[10px]">
                    [Gaya/Tema] + [Format Produk] + [Objek Visual Spesifik] + [Kegunaan Komersial]
                  </code>
                </p>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Struktur deskriptif yang menjawab kebutuhan buyer desain &amp; agensi kreatif global.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <span className="font-bold text-teal-300 flex items-center gap-1.5 text-xs">
                  <Layers className="w-3.5 h-3.5 text-teal-400" />
                  2. 49 Keywords 4-Tier Hierarki:
                </span>
                <ul className="space-y-1 text-slate-300 text-[11px]">
                  <li><strong className="text-emerald-400">Tier 1 (1-10):</strong> Objek utama / Subjek visual terlihat.</li>
                  <li><strong className="text-indigo-400">Tier 2 (11-20):</strong> Gaya, lighting, sudut, &amp; palet warna.</li>
                  <li><strong className="text-amber-400">Tier 3 (21-35):</strong> Aplikasi komersial, industri &amp; use case.</li>
                  <li><strong className="text-purple-400">Tier 4 (36-49):</strong> Kategori luas, konsep &amp; tag teknis.</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <span className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                  <Film className="w-3.5 h-3.5 text-amber-400" />
                  3. Video &amp; B-Roll Formula:
                </span>
                <p className="text-slate-300 text-[11px]">
                  Mendukung <strong className="text-white">4K UHD &amp; 1080p</strong> footage dengan deteksi aspect ratio (16:9, 9:16 reels/shorts) dan durasi otomatis.
                </p>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Menyertakan kata kunci stock footage (slow motion, b-roll, drone, aerial, cinematic, 4k, loop) dan capture thumbnail live frame.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Zone */}
        <UploadZone
          onFilesSelected={handleFilesSelected}
          onLoadSamples={handleLoadSamples}
          globalContext={globalContext}
          setGlobalContext={setGlobalContext}
          disabled={isProcessing}
        />

        {/* Batch Queue & Detail Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Queue List (4 cols on lg) */}
          <div className="lg:col-span-4">
            <QueueList
              items={items}
              selectedId={selectedId}
              onSelectItem={(id) => setSelectedId(id)}
              onDeleteItem={handleDeleteItem}
              onProcessItem={(id) => processSingleItem(id)}
              onProcessAll={handleProcessAll}
              onClearAll={handleClearAll}
              onAttachPreview={handleAttachCompanionPreview}
              isProcessing={isProcessing}
            />
          </div>

          {/* Right Column: Metadata Detail & Editor (8 cols on lg) */}
          <div className="lg:col-span-8">
            {selectedItem ? (
              <MetadataDetail
                item={selectedItem}
                onUpdateItem={(updated) => handleUpdateItem(selectedItem.id, updated)}
                onProcessItem={(id) => processSingleItem(id)}
                onRefineItem={handleRefineItem}
                onAttachPreview={handleAttachCompanionPreview}
                isProcessing={isProcessing}
              />
            ) : (
              <div className="bg-slate-850 rounded-2xl border border-slate-800 p-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-3 min-h-[400px]">
                <Layers className="w-10 h-10 text-slate-700" />
                <p>Pilih file di daftar batch queue untuk melihat dan mengedit metadata.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Export Modal */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        items={items}
      />

      {/* API Key Manager Modal */}
      <ApiKeyModal
        isOpen={apiKeyModalOpen}
        onClose={() => setApiKeyModalOpen(false)}
        config={apiKeyConfig}
        onChangeConfig={handleUpdateApiKeyConfig}
      />
    </div>
  );
}
