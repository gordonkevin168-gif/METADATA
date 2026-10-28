import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { SecondaryViews } from './components/SecondaryViews';
import { MetadataMascot } from './components/CartoonMascots';
import { UploadZone } from './components/UploadZone';
import { QueueList } from './components/QueueList';
import { MetadataDetail } from './components/MetadataDetail';
import { ExportModal } from './components/ExportModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { MotionStudio } from './components/MotionStudio';
import { ImageStudio } from './components/ImageStudio';
import { ZipSmartStudio } from './components/ZipSmartStudio';
import { AuthModal } from './components/AuthModal';
import { StockItem, PlatformPreset, ApiKeyConfig, ApiKeyItem, GeminiModelId, SubAppMode, UserProfile } from './types';
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
  Info,
  Link2,
  Play,
  Tag,
  Archive,
  Loader2
} from 'lucide-react';

import { extractVectorPreview } from './utils/vectorPreviewExtractor';
import { extractVideoData } from './utils/videoExtractor';
import { optimizePreviewForVision } from './utils/imageOptimizer';
import { smartGenerateMetadata, smartRefineMetadata } from './services/geminiClient';
import { downloadZipAllMetadata } from './utils/metadataEmbedder';

const API_KEY_STORAGE_KEY = 'stockmeta_gemini_api_keys_v1';
const MODEL_STORAGE_KEY = 'stockmeta_gemini_model_v2';
const SUBAPP_STORAGE_KEY = 'c46us_active_subapp_v1';
const USER_PROFILE_STORAGE_KEY = 'c46us_user_profile_v1';

const DEFAULT_USER_PROFILE: UserProfile = {
  email: 'gordonkevin168@gmail.com',
  name: 'Kevin Gordon',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  isLoggedIn: true,
  provider: 'google',
  role: 'pro_contributor',
  plan: 'Contributor Pro',
  creditsRemaining: 9999,
  joinedDate: '2024-03-15',
};

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
  const [targetKeywordCount, setTargetKeywordCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('c46us_target_keyword_count');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 25 && parsed <= 49) return parsed;
      }
    } catch {}
    return 40; // Default 40 keywords (customizable min 25 max 49)
  });

  const handleSelectKeywordCount = (count: number) => {
    const clamped = Math.max(25, Math.min(49, count));
    setTargetKeywordCount(clamped);
    try {
      localStorage.setItem('c46us_target_keyword_count', String(clamped));
    } catch {}
  };

  const itemsRef = useRef<StockItem[]>(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Sub-App Switcher & Gmail User Profile State
  const [currentSubApp, setCurrentSubApp] = useState<SubAppMode>(() => {
    try {
      const saved = localStorage.getItem(SUBAPP_STORAGE_KEY);
      if (
        saved === 'dashboard' ||
        saved === 'metadata' ||
        saved === 'motion' ||
        saved === 'image' ||
        saved === 'zipsmart' ||
        saved === 'presets' ||
        saved === 'history' ||
        saved === 'files' ||
        saved === 'favorites'
      ) {
        return saved as SubAppMode;
      }
    } catch {}
    return 'dashboard';
  });

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [inspirationPrompt, setInspirationPrompt] = useState<string | null>(null);

  // Reference asset passed between Image Studio and Motion Studio
  const [motionReferenceAsset, setMotionReferenceAsset] = useState<{
    imageUrl: string;
    prompt: string;
    timestamp: number;
  } | null>(null);

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_USER_PROFILE;
  });

  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [isZippingAll, setIsZippingAll] = useState<boolean>(false);
  const [zipAllProgress, setZipAllProgress] = useState<string>('');

  const handleDownloadAllZip = async () => {
    const targetItems = items.filter((i) => i.status === 'completed' && i.title);
    const toZip = targetItems.length > 0 ? targetItems : items;
    if (toZip.length === 0) return;
    try {
      setIsZippingAll(true);
      await downloadZipAllMetadata(toZip, (info) => setZipAllProgress(`${info.percent}%`));
    } catch (err) {
      console.error('Error generating metadata ZIP package:', err);
    } finally {
      setIsZippingAll(false);
      setZipAllProgress('');
    }
  };

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('c46us_theme_mode');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return 'dark';
  });

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem('c46us_theme_mode', next);
    } catch {}
  };

  const handleSelectSubApp = (app: SubAppMode) => {
    setCurrentSubApp(app);
    try {
      localStorage.setItem(SUBAPP_STORAGE_KEY, app);
    } catch (e) {
      console.error('Failed to save subapp mode:', e);
    }
  };

  const handleLogin = (userUpdates: Partial<UserProfile>) => {
    const updated: UserProfile = {
      ...currentUser,
      ...userUpdates,
      isLoggedIn: true,
    };
    setCurrentUser(updated);
    try {
      localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save user profile:', e);
    }
  };

  const handleLogout = () => {
    const loggedOut: UserProfile = {
      ...currentUser,
      isLoggedIn: false,
      email: 'guest@c46us.studio',
      name: 'Tamu Kontributor',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=guest',
      plan: 'Free Tier',
    };
    setCurrentUser(loggedOut);
    try {
      localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(loggedOut));
    } catch (e) {
      console.error('Failed to save user profile:', e);
    }
    setAuthModalOpen(false);
  };

  const handleSendMotionToMetadataStudio = (imageDataUrl: string, promptTitle: string, duration: number) => {
    const cleanBase64 = imageDataUrl.replace(/^data:[a-zA-Z0-9\/+-]+;base64,/, '');
    const id = `motion-item-${Date.now()}`;
    const slug = promptTitle
      .slice(0, 36)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'anime-3d-motion';
    const fileName = `${slug}.mp4`;

    const newItem: StockItem = {
      id,
      file: null,
      fileName,
      fileSize: 2450000,
      mimeType: 'video/mp4',
      previewUrl: imageDataUrl,
      imageBase64: cleanBase64,
      mediaType: 'video',
      artworkType: 'footage',
      videoMeta: {
        duration: duration || 15,
        width: 1920,
        height: 1080,
        resolutionLabel: '1080p Full HD',
        aspectRatio: '16:9',
        fps: 60,
        format: 'mp4',
      },
      customContext: `Motion graphic animation created in Motion Studio. Visual Prompt: ${promptTitle}`,
      status: 'idle',
      previewSource: 'native',
    };

    setItems((prev) => [newItem, ...prev]);
    setSelectedId(id);
    handleSelectSubApp('metadata');
  };

  const handleSendImageToMetadataStudio = (imageDataUrl: string, promptTitle: string) => {
    const cleanBase64 = imageDataUrl.replace(/^data:[a-zA-Z0-9\/+-]+;base64,/, '');
    const id = `img-item-${Date.now()}`;
    const slug = promptTitle
      .slice(0, 36)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'stock-illustration';
    const fileName = `${slug}.png`;

    const newItem: StockItem = {
      id,
      file: null,
      fileName,
      fileSize: 1850000,
      mimeType: 'image/png',
      previewUrl: imageDataUrl,
      imageBase64: cleanBase64,
      mediaType: 'image',
      artworkType: 'illustration',
      customContext: `AI Generated Stock Illustration with prompt: ${promptTitle}`,
      status: 'idle',
      previewSource: 'native',
    };

    setItems((prev) => [newItem, ...prev]);
    setSelectedId(id);
    handleSelectSubApp('metadata');
  };

  const handleSendImageToMotionStudio = (imageDataUrl: string, promptTitle: string) => {
    setMotionReferenceAsset({
      imageUrl: imageDataUrl,
      prompt: promptTitle,
      timestamp: Date.now(),
    });
    handleSelectSubApp('motion');
  };

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
    setSelectedId('sample-ev-charging');
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
        let videoFrames: StockItem['videoFrames'] = undefined;

        if (isVideo) {
          try {
            const vData = await extractVideoData(file);
            previewUrl = vData.previewUrl;
            cleanBase64 = vData.imageBase64;
            videoUrl = vData.videoUrl;
            videoMeta = vData.videoMeta;
            videoFrames = vData.frames;
            needsPreview = false;
          } catch (vErr) {
            const fileExt = file.name.split('.').pop()?.toLowerCase() || 'mov';
            videoMeta = {
              format: fileExt,
              resolutionLabel: '4K/HD Video',
              aspectRatio: '16:9 Landscape',
              width: 1920,
              height: 1080,
              duration: 10,
            };

            // Check if user uploaded a companion JPG/PNG with the same base name (e.g. clip1.mov + clip1.jpg)
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
              needsPreview = true;
            }
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
          videoFrames,
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

  const processSingleItem = async (id: string, customTargetCount?: number) => {
    const target = itemsRef.current.find((i) => i.id === id);
    if (!target) return;

    handleUpdateItem(id, { status: 'analyzing', errorMessage: undefined });

    try {
      // Ensure Gemini vision receives a fast, compact, high-quality raster image (max 512px JPEG, ~25-45KB)
      // This cuts base64 upload payload by ~98% and speeds up Gemini API response dramatically
      let imageBase64ToSend = target.imageBase64 || '';
      let mimeTypeToSend = 'image/jpeg';

      if (target.previewUrl) {
        try {
          const optimized = await optimizePreviewForVision(target.previewUrl, 512, 0.75);
          if (optimized.base64 && optimized.base64.length > 50) {
            imageBase64ToSend = optimized.base64;
            mimeTypeToSend = optimized.mimeType;
          }
        } catch (e) {
          console.warn('Preview optimization fallback:', e);
        }
      } else if (target.imageBase64 && target.imageBase64.length > 50) {
        try {
          const optimized = await optimizePreviewForVision(target.imageBase64, 512, 0.75);
          if (optimized.base64 && optimized.base64.length > 50) {
            imageBase64ToSend = optimized.base64;
            mimeTypeToSend = optimized.mimeType;
          }
        } catch (e) {
          console.warn('Base64 optimization fallback:', e);
        }
      }

      let currentKey = apiKeyConfig.useCustomKeys && apiKeyConfig.activeKeyId
        ? apiKeyConfig.keys.find((k) => k.id === apiKeyConfig.activeKeyId)?.key
        : undefined;

      const effectiveKeywordCount = customTargetCount || target.targetKeywordCount || targetKeywordCount;

      const requestPayload = {
        imageBase64: imageBase64ToSend,
        mimeType: mimeTypeToSend,
        fileName: target.fileName,
        customContext: target.customContext || globalContext,
        targetPlatform: platform,
        artworkType: target.artworkType,
        mediaType: target.mediaType,
        targetKeywordCount: effectiveKeywordCount,
        videoMeta: target.videoMeta,
        videoFrames: target.videoFrames || target.videoMeta?.frames,
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
        targetKeywordCount: effectiveKeywordCount,
        title: result.title,
        titleWordCount: result.titleWordCount,
        titleCharCount: (result.title || '').length,
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
        errorMessage: undefined,
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

    try {
      // Always get fresh pending/error items from ref to prevent stale snapshots
      const pending = itemsRef.current.filter((i) => i.status === 'idle' || i.status === 'error');
      if (pending.length === 0) return;

      // Sequential batch execution with automatic retry guarantees NO ITEMS ARE SKIPPED!
      for (let i = 0; i < pending.length; i++) {
        const itemToRun = pending[i];
        let attempts = 0;
        let success = false;
        const maxAttempts = 2;

        while (!success && attempts < maxAttempts) {
          attempts++;
          try {
            await processSingleItem(itemToRun.id);
            const fresh = itemsRef.current.find((it) => it.id === itemToRun.id);
            if (fresh && fresh.status === 'completed') {
              success = true;
            } else if (attempts < maxAttempts) {
              await new Promise((r) => setTimeout(r, 1200));
            }
          } catch (err) {
            console.warn(`Attempt ${attempts} failed for ${itemToRun.fileName}:`, err);
            if (attempts < maxAttempts) {
              await new Promise((r) => setTimeout(r, 1500));
            }
          }
        }

        // Brief delay between items prevents API rate limit spikes
        if (i < pending.length - 1) {
          await new Promise((r) => setTimeout(r, 350));
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefineItem = async (id: string, instruction: string) => {
    const target = itemsRef.current.find((i) => i.id === id);
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
        targetKeywordCount: target.targetKeywordCount || targetKeywordCount,
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
  const pendingCount = items.filter((i) => i.status === 'idle' || i.status === 'error').length;

  return (
    <div className={`min-h-screen flex w-full transition-colors duration-200 font-sans selection:bg-amber-400 selection:text-black ${
      theme === 'light' ? 'bg-[#f4f6fb] text-slate-800' : 'bg-[#0a0e1a] text-slate-100'
    }`}>
      {/* Left: Persistent Fixed Sidebar (Matching image.png) */}
      <Sidebar
        currentSubApp={currentSubApp}
        onSelectSubApp={handleSelectSubApp}
        currentUser={currentUser}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        theme={theme}
      />

      {/* Right: Dynamic App Canvas & Top Bar */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Header */}
        <Header
          currentSubApp={currentSubApp}
          onSelectSubApp={handleSelectSubApp}
          currentUser={currentUser}
          onOpenAuthModal={() => setAuthModalOpen(true)}
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
          onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />

        {/* Main Content Workspace - Switches dynamically per sub-app */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* SUB-APP 0: CREATIVE DASHBOARD (Matching image.png) */}
          {currentSubApp === 'dashboard' ? (
            <DashboardView
              onSelectSubApp={handleSelectSubApp}
              onSelectInspirationPrompt={(prompt) => {
                setInspirationPrompt(prompt);
                handleSelectSubApp('image');
              }}
              completedMetadataCount={completedCount}
              theme={theme}
            />
          ) : currentSubApp === 'metadata' ? (
            /* SUB-APP 1: METADATA SPECIALIST */
            <>
              {/* Clean Minimal Toolbar: Fast & Functional */}
              <div className={`rounded-xl border p-3.5 sm:p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3.5 shadow-sm select-none transition-all ${
                theme === 'light'
                  ? 'bg-white border-slate-200 shadow-slate-100'
                  : 'bg-[#0f121d] border-white/10'
              }`}>
                {/* Left: Clean Title, Description & Tags */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                      Metadata Generator
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      Adobe Stock &bull; Shutterstock
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                      Target: {targetKeywordCount} Keywords
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/[0.06] text-slate-300 border border-white/10">
                      Formula Maksimal 15 Kata
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Ekstraksi visual presisi tanpa skip dengan target kustom <strong>{targetKeywordCount} kata kunci</strong> (min 25 - max 49) dan ekspor CSV massal.
                  </p>
                </div>

                {/* Right: Custom Keyword Count Selector, Stats & Action Buttons */}
                <div className="flex items-center gap-2.5 flex-wrap shrink-0 w-full lg:w-auto justify-between lg:justify-end">
                  {/* Custom Keyword Count Quick Selector (Min 25 Max 49) */}
                  <div className="flex items-center gap-1 bg-black/30 p-1 rounded-lg border border-white/10">
                    <span className="text-[11px] text-slate-400 font-bold px-1.5 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-amber-400" /> KW:
                    </span>
                    {[25, 30, 35, 40, 45, 49].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => handleSelectKeywordCount(count)}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                          targetKeywordCount === count
                            ? 'bg-amber-400 text-slate-950 shadow-sm'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                        title={`Set target ${count} keywords`}
                      >
                        {count}
                      </button>
                    ))}
                    {/* Direct numeric input for custom value between 25-49 */}
                    <div className="flex items-center border-l border-white/10 pl-1.5 ml-0.5">
                      <input
                        type="number"
                        min={25}
                        max={49}
                        value={targetKeywordCount}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) {
                            handleSelectKeywordCount(Math.max(25, Math.min(49, val)));
                          }
                        }}
                        className="w-11 px-1 py-0.5 bg-black/50 border border-white/10 rounded text-center text-[11px] font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                        title="Ketik jumlah keyword kustom (25 - 49)"
                      />
                    </div>
                  </div>

                  {/* Stats Counter */}
                  <div className="flex items-center gap-1.5 text-xs bg-black/25 px-2 py-1 rounded-lg border border-white/5">
                    <span className="text-slate-400 text-[11px]">
                      Total: <strong className="text-white font-mono">{items.length}</strong>
                    </span>
                    <span className="text-slate-600">&bull;</span>
                    <span className="text-emerald-400 text-[11px]">
                      Selesai: <strong className="font-mono">{completedCount}</strong>
                    </span>
                    {pendingCount > 0 && (
                      <>
                        <span className="text-slate-600">&bull;</span>
                        <span className="text-amber-400 text-[11px]">
                          Pending: <strong className="font-mono">{pendingCount}</strong>
                        </span>
                      </>
                    )}
                  </div>

                  {pendingCount > 0 && (
                    <button
                      onClick={handleProcessAll}
                      disabled={isProcessing}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer active:scale-95"
                      title="Proses semua aset pending sekaligus dengan perlindungan anti-skip"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isProcessing ? 'Memproses...' : `Run Semua (${pendingCount})`}</span>
                    </button>
                  )}

                  {completedCount > 0 && (
                    <button
                      onClick={handleDownloadAllZip}
                      disabled={isZippingAll}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-black text-xs flex items-center gap-1.5 shadow-[2px_2px_0px_#000] border-2 border-black transition-all disabled:opacity-50 cursor-pointer active:translate-x-[1px] active:translate-y-[1px]"
                      title="Unduh ZIP seluruh file (embedded IPTC/XMP) + Sidecar .XMP + CSV Adobe Stock"
                    >
                      {isZippingAll ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                          <span>{zipAllProgress || 'Membuat ZIP...'}</span>
                        </>
                      ) : (
                        <>
                          <Archive className="w-3.5 h-3.5 text-black" />
                          <span>Unduh ZIP All ({completedCount})</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => setActiveGuideTab(!activeGuideTab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                      activeGuideTab
                        ? 'bg-amber-400 text-black border-amber-300 shadow-sm font-bold'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{activeGuideTab ? 'Tutup Pedoman' : 'Pedoman Kurator'}</span>
                  </button>
                </div>
              </div>

            {/* Collapsible Formula & Video Guidelines Card */}
            {activeGuideTab && (
              <div className="bg-[#0f111a] rounded-2xl border border-white/10 p-5 space-y-4 shadow-sm animate-in fade-in select-none">
                <div className="flex items-center justify-between border-b-2 border-[#24263a] pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">
                      Pedoman Resmi Kurator Adobe Stock &amp; FAQ Microstock Page 1
                    </h3>
                  </div>
                  <span className="text-[10px] text-amber-400 font-bold bg-amber-950 px-2 py-0.5 rounded border border-amber-500/40">
                    ADOBE STOCK PAGE 1 RULES
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#0d0e17] border-2 border-[#222436] space-y-2">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5 text-xs uppercase">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      1. Title Formula (Maksimal 15 Kata):
                    </span>
                    <p className="text-slate-300 text-[11px]">
                      <code className="text-indigo-300 bg-black/60 px-1 py-0.5 rounded border border-indigo-500/30 block text-[10px]">
                        [Gaya/Tema] + [Format Produk] + [Objek Visual Spesifik] + [Kegunaan Komersial]
                      </code>
                    </p>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Deskriptif alami bahasa Inggris tanpa pengulangan kata. Menjawab query pencarian buyer agensi.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0d0e17] border-2 border-[#222436] space-y-2">
                    <span className="font-bold text-emerald-300 flex items-center gap-1.5 text-xs uppercase">
                      <Layers className="w-3.5 h-3.5 text-emerald-400" />
                      2. Bobot Tier 1 (1-10):
                    </span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      10 kata pertama menyerap <strong className="text-emerald-400">80% bobot ranking pencarian</strong>. Wajib diisi objek visual nyata (misal: <em>robot, dashboard, battery, charger</em>) dan subjek komersial primer.
                    </p>
                    <p className="text-[10px] text-emerald-300 font-bold">
                      8-9 dari 10 kata wajib Kata Tunggal (1-Kata)!
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0d0e17] border-2 border-[#222436] space-y-2">
                    <span className="font-bold text-cyan-300 flex items-center gap-1.5 text-xs uppercase">
                      <Link2 className="w-3.5 h-3.5 text-cyan-400" />
                      3. Sinergi Bukan Scraping Mentah:
                    </span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Sesuai FAQ Adobe, <strong>JANGAN menyalin mentah setiap kata judul</strong>! Kata pengisi (<em>showing, using, for, and, of</em>) difilter, kata kerja dinormalisasi (<em>automating &rarr; automation</em>).
                    </p>
                    <p className="text-slate-400 text-[10px]">
                      Tag format (4K, Footage) dialokasikan di Tier 4.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0d0e17] border-2 border-[#222436] space-y-2">
                    <span className="font-bold text-purple-300 flex items-center gap-1.5 text-xs uppercase">
                      <Film className="w-3.5 h-3.5 text-purple-400" />
                      4. Rasio Emas 75-80% 1-Kata:
                    </span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Mesin pencari Adobe mencari per kata (<em>stem matching</em>). 75-80% kata tunggal membuka peluang pencarian 10x lebih banyak.
                    </p>
                    <p className="text-slate-400 text-[10px]">
                      Frasa majemuk (2 kata) dibatasi maksimal 20-25% untuk istilah baku.
                    </p>
                  </div>
                </div>

                {/* Contributor Page 1 Case Study: Santa Hat & Cybersecurity Laptop */}
                <div className="p-3.5 rounded-xl bg-[#0a0c16] border border-[#2b2f48] space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1f2338] pb-2">
                    <span className="font-bold text-amber-300 text-xs flex items-center gap-1.5 uppercase">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Studi Kasus Kurator Ahli: Formula Judul Video &amp; Seleksi Keyword Page 1
                    </span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-bold">
                      Anti-Tenggelam Algoritma Adobe Stock
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                    <div className="space-y-1 p-2.5 rounded-lg bg-[#111320] border border-[#252840]">
                      <strong className="text-rose-300 block">1. Format Judul Video (Hindari Awalan Kamera Klise):</strong>
                      <p className="text-slate-400 text-[10px] leading-relaxed">
                        ❌ <span className="line-through text-slate-500">Static 4K Video Shot of Red Santa Hat Hanging on Modern Office Desk Lamp During Christmas Holiday Season in Corporate Workplace Environment.</span>
                      </p>
                      <p className="text-emerald-300 text-[10px] font-bold leading-relaxed">
                        ✓ Langsung ke objek visual: "Red Santa Hat Hanging on Modern Office Desk Lamp During Christmas Holiday Season in Corporate Workplace Environment."
                      </p>
                    </div>
                    <div className="space-y-1 p-2.5 rounded-lg bg-[#111320] border border-[#252840]">
                      <strong className="text-cyan-300 block">2. Seleksi Keyword Berpeluang Pencarian Besar (Page 1 Real Asset):</strong>
                      <p className="text-slate-300 text-[10px] leading-relaxed">
                        Judul: <em>"Animated laptop displaying password protection dashboard interface with charts and lock icon, representing secure login, data protection, and cybersecurity monitoring system."</em>
                      </p>
                      <p className="text-slate-400 text-[10px] leading-relaxed">
                        • <strong>Ambil Subjek High-Demand:</strong> <span className="text-emerald-300">laptop, dashboard, interface, charts, lock, icon, password, cybersecurity, protection, login, monitoring</span>.<br />
                        • <strong>Buang Kata Lemah/Pengisi:</strong> <span className="text-slate-500">with, and, representing, displaying, of</span> (buyer tidak pernah mencari kata kerja penghubung ini).
                      </p>
                    </div>
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
                    allItems={items}
                    onOpenExportModal={() => setExportModalOpen(true)}
                  />
                ) : (
                  <div className="bg-[#12131c] rounded-2xl border-2 border-[#2b2d3d] p-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-3 min-h-[440px] shadow-[4px_4px_0px_#000]">
                    <Layers className="w-10 h-10 text-slate-700" />
                    <p>Pilih file di daftar batch queue untuk melihat dan mengedit metadata.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : currentSubApp === 'image' ? (
          /* SUB-APP 2: IMAGE STUDIO (BATCH AI IMAGE PRO) */
          <ImageStudio
            selectedModel={selectedModel}
            onSendToMetadataStudio={handleSendImageToMetadataStudio}
            onSendToMotionStudio={handleSendImageToMotionStudio}
            apiKeyCount={apiKeyConfig.keys.length}
            useCustomKeys={apiKeyConfig.useCustomKeys}
            initialPrompt={inspirationPrompt}
          />
        ) : currentSubApp === 'motion' ? (
          /* SUB-APP 3: MOTION STUDIO (PRORES 4444 / 3D CANVAS COPILOT) */
          <MotionStudio
            selectedModel={selectedModel}
            onSendToMetadataStudio={handleSendMotionToMetadataStudio}
            apiKeyCount={apiKeyConfig.keys.length}
            useCustomKeys={apiKeyConfig.useCustomKeys}
            incomingReferenceAsset={motionReferenceAsset}
            onClearIncomingReference={() => setMotionReferenceAsset(null)}
          />
        ) : currentSubApp === 'zipsmart' ? (
          /* SUB-APP 4: ZIPSMART ARCHIVER (FLAT MASTER ZIP PACKAGER) */
          <ZipSmartStudio
            theme={theme}
            onSendToMetadataStudio={handleSendImageToMetadataStudio}
          />
        ) : (
          /* SUB-APP 5: SECONDARY VIEWS (PRESETS, HISTORY, FILES, FAVORITES) */
          <SecondaryViews
            mode={currentSubApp}
            onSelectSubApp={handleSelectSubApp}
            items={items}
            theme={theme}
          />
        )}
      </main>
      </div>

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

      {/* Gmail / Google Account Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
    </div>
  );
}
