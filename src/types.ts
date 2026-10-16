export type PlatformPreset = 'all' | 'adobestock' | 'shutterstock' | 'freepik' | 'getty';

export interface MetadataBreakdown {
  styleTheme: string;
  productFormat: string;
  visualElements: string;
  useCase: string;
}

export interface VideoMetadata {
  duration: number; // in seconds
  width: number;
  height: number;
  resolutionLabel: string; // '4K UHD', '1080p Full HD', '720p HD', 'SD'
  aspectRatio: string; // '16:9', '9:16', '1:1', '4:3'
  fps?: number;
  format: string; // 'mp4', 'mov', 'webm', etc.
  extractedFrameTimestamp?: number; // timestamp in seconds where frame was captured
}

export interface StockItem {
  id: string;
  file: File | null;
  fileName: string;
  fileSize: number;
  mimeType: string;
  previewUrl: string;
  imageBase64: string;
  customContext?: string;
  mediaType?: 'image' | 'vector' | 'video';
  artworkType?: 'auto' | 'vector' | 'photo' | 'illustration' | '3d_render' | 'footage';
  videoMeta?: VideoMetadata;
  videoUrl?: string; // object URL for video playback
  status: 'idle' | 'analyzing' | 'completed' | 'error';
  errorMessage?: string;
  progressStep?: string;
  needsPreview?: boolean;
  previewSource?: 'dos_eps_tiff' | 'ps_preview' | 'pdf_render' | 'xmp_thumbnail' | 'embedded_jpeg' | 'gs_render' | 'gs_ai_render' | 'gs_eps_render' | 'companion' | 'native' | 'video_frame';

  // Generated metadata
  title?: string;
  titleWordCount?: number;
  breakdown?: MetadataBreakdown;
  tier1Keywords?: string[];
  tier2Keywords?: string[];
  tier3Keywords?: string[];
  tier4Keywords?: string[];
  allKeywords?: string[];
  category?: string;
  categoryId?: number;
  secondaryCategory?: string;
  rejectionRiskScore?: 'low' | 'medium' | 'high';
  reviewNotes?: string;
}

export interface TrademarkWarning {
  keyword: string;
  reason: string;
}

export interface ApiKeyItem {
  id: string;
  key: string;
  label?: string;
  status: 'ready' | 'active' | 'exhausted' | 'invalid';
  lastUsed?: number;
  usageCount: number;
  errorMsg?: string;
}

export interface ApiKeyConfig {
  keys: ApiKeyItem[];
  activeKeyId: string | null;
  autoRotate: boolean;
  useCustomKeys: boolean;
}

export type GeminiModelId = 
  | 'gemini-3.8-flash' 
  | 'gemini-flash-latest' 
  | 'gemini-3.1-flash-lite' 
  | 'gemini-2.5-flash' 
  | 'gemini-2.5-pro';

export interface GeminiModelOption {
  id: GeminiModelId;
  name: string;
  badge: string;
  tag: string;
  description: string;
  speed: string;
  isLatest?: boolean;
}

export const GEMINI_MODEL_OPTIONS: GeminiModelOption[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    badge: 'Terbaru',
    tag: 'Next-Gen Multimodal',
    description: 'Model vision multimodal generasi terbaru Google. Kecepatan tinggi dengan visual reasoning mutakhir dan akurasi komersial terbaik.',
    speed: '~1.2s',
    isLatest: true,
  },
  {
    id: 'gemini-flash-latest',
    name: 'Gemini Flash Latest',
    badge: 'Auto Update',
    tag: 'Latest Flash Pointer',
    description: 'Pointer alias otomatis yang selalu merujuk ke rilis Gemini Flash versi terbaru yang disediakan langsung oleh sistem Google.',
    speed: '~1.1s',
    isLatest: true,
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    badge: 'Ultra Cepat',
    tag: 'Ultra-Light & High RPM',
    description: 'Model generasi 3.1 ultra-ringan dengan latensi sub-detik. Sangat hemat kuota token dan optimal untuk batch ratusan foto/video.',
    speed: '~0.8s',
    isLatest: true,
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    badge: 'Stabil',
    tag: 'Proven Workhorse',
    description: 'Model vision stabil dan konsisten. Sangat handal untuk workflow produksi kontributor harian.',
    speed: '~1.0s',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    badge: 'Deep Reasoning',
    tag: 'Maximum Detail',
    description: 'Model penalaran intensif untuk komposisi seni rumit, detail mikro, dan interpretasi konsep visual tinggi.',
    speed: '~2.4s',
  },
];
