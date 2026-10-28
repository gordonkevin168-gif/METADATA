export type PlatformPreset = 'all' | 'adobestock' | 'shutterstock' | 'freepik' | 'getty';

export interface MetadataBreakdown {
  styleTheme: string;
  productFormat: string;
  visualElements: string;
  useCase: string;

  // Bedah Struktur Judul (Title Anatomy & Curator Evaluation)
  subjectAndFormat?: string; // Subjek Utama & Format: e.g. "Abstract vector gradient poster collection"
  baseConditionOrColor?: string; // Kondisi/Warna Dasar: e.g. "with deep navy backgrounds"
  specificVisualElements?: string; // Elemen Visual Spesifik: e.g. ", cyan light effects, blurred color waves"
  styleAndDetails?: string; // Gaya & Detail Tambahan: e.g. "and futuristic line graphics."
  isBundleOrCollection?: boolean; // Menandakan apakah aset berupa bundel/set/koleksi multi-desain
  bundleElementsSummary?: string; // Rangkuman elemen variasi tiap desain dalam bundel
  curatorStrengths?: string[]; // Kelebihan (Sangat Kuat): Menjawab Kebutuhan Bundel, Format Kalimat Alami
  curatorTechnicalWarning?: string; // Peringatan Teknis: Peringatan panjang karakter web UI vs kolom CSV/FTP
}

export interface VideoFrameSample {
  timestamp: number; // in seconds
  percent: number; // percentage of duration, e.g. 15, 50, 85
  label: string; // e.g. 'Frame Awal (15%)', 'Frame Tengah (50%)', 'Frame Akhir (85%)'
  previewUrl: string; // Data URL for rendering thumbnail
  imageBase64: string; // Base64 payload for Gemini Vision
}

export interface VideoMetadata {
  duration: number; // in seconds
  width: number;
  height: number;
  resolutionLabel: string; // '4K UHD', '1080p Full HD', '720p HD', 'SD'
  aspectRatio: string; // '16:9', '9:16', '1:1', '4:3'
  fps?: number;
  format: string; // 'mp4', 'mov', 'webm', etc.
  extractedFrameTimestamp?: number; // timestamp in seconds where primary frame was captured
  frames?: VideoFrameSample[]; // 3 temporal frames for multi-frame vision analysis
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
  videoFrames?: VideoFrameSample[]; // 3 temporal frames for video analysis
  status: 'idle' | 'analyzing' | 'completed' | 'error';
  errorMessage?: string;
  progressStep?: string;
  needsPreview?: boolean;
  previewSource?: 'dos_eps_tiff' | 'ps_preview' | 'pdf_render' | 'xmp_thumbnail' | 'embedded_jpeg' | 'gs_render' | 'gs_ai_render' | 'gs_eps_render' | 'companion' | 'native' | 'video_frame';

  // Generated metadata
  targetKeywordCount?: number;
  title?: string;
  titleWordCount?: number;
  titleCharCount?: number;
  embedded?: boolean;
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

export type SubAppMode = 'dashboard' | 'metadata' | 'image' | 'motion' | 'zipsmart' | 'presets' | 'history' | 'files' | 'favorites';

export interface UserProfile {
  email: string;
  name: string;
  avatarUrl: string;
  isLoggedIn: boolean;
  provider: 'google';
  role: 'contributor' | 'pro_contributor' | 'curator';
  plan: 'Contributor Pro' | 'Free Tier';
  creditsRemaining: number;
  joinedDate: string;
}

export type MotionBgMode = 'transparent' | 'green' | 'white' | 'black' | 'custom';

export interface MotionPresetItem {
  id: string;
  title: string;
  category: string;
  prompt: string;
  defaultDuration: number;
  defaultBg: MotionBgMode;
  code: string;
  thumbnailIcon: string;
}

export interface MotionVersion {
  version: number;
  code: string;
  prompt: string;
  timestamp: number;
}

export interface MotionProject {
  id: string;
  title: string;
  prompt: string;
  duration: number;
  scenes: number;
  bgMode: MotionBgMode;
  code: string;
  referenceImageBase64?: string;
  referenceImagePreview?: string;
  versionHistory: MotionVersion[];
  createdAt: number;
  updatedAt: number;
}

export interface GenerateMotionPayload {
  prompt: string;
  duration: number;
  scenes?: number;
  bgMode?: MotionBgMode;
  referenceImageBase64?: string;
  apiKey?: string;
  selectedModel?: GeminiModelId;
}

export interface RefineMotionPayload {
  currentCode: string;
  refinementPrompt: string;
  duration: number;
  bgMode?: MotionBgMode;
  referenceImageBase64?: string;
  apiKey?: string;
  selectedModel?: GeminiModelId;
}

