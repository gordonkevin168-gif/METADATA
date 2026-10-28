import { GoogleGenAI, Type } from '@google/genai';
import { GeminiModelId, PlatformPreset, MetadataBreakdown, GenerateMotionPayload, RefineMotionPayload } from '../types';

export interface GenerateMetadataPayload {
  imageBase64: string;
  mimeType?: string;
  fileName?: string;
  customContext?: string;
  targetPlatform?: PlatformPreset;
  artworkType?: string;
  mediaType?: 'image' | 'vector' | 'video';
  videoMeta?: {
    duration?: number;
    resolutionLabel?: string;
    aspectRatio?: string;
    format?: string;
  };
  videoFrames?: Array<{
    timestamp: number;
    percent: number;
    label: string;
    previewUrl?: string;
    imageBase64: string;
  }>;
  targetKeywordCount?: number;
  apiKey?: string;
  selectedModel?: GeminiModelId;
}

export interface RefineMetadataPayload {
  currentTitle?: string;
  currentKeywords?: string[];
  refinementInstruction: string;
  fileName?: string;
  imageBase64?: string;
  mimeType?: string;
  targetKeywordCount?: number;
  apiKey?: string;
  selectedModel?: GeminiModelId;
}

export interface MetadataResult {
  fileName: string;
  title: string;
  titleWordCount: number;
  titleCharCount?: number;
  breakdown: MetadataBreakdown;
  tier1Keywords: string[];
  tier2Keywords: string[];
  tier3Keywords: string[];
  tier4Keywords: string[];
  allKeywords: string[];
  category: string;
  categoryId: number;
  secondaryCategory: string;
  rejectionRiskScore: 'low' | 'medium' | 'high';
  reviewNotes: string;
}

const ADOBE_CATEGORY_MAP: Record<string, number> = {
  animals: 1,
  buildings: 2,
  architecture: 2,
  business: 3,
  drinks: 4,
  environment: 5,
  'the environment': 5,
  'states of mind': 6,
  food: 7,
  'graphic resources': 8,
  graphics: 8,
  backgrounds: 8,
  abstract: 8,
  hobbies: 9,
  leisure: 9,
  industry: 10,
  landscapes: 11,
  lifestyle: 12,
  people: 13,
  plants: 14,
  flowers: 14,
  culture: 15,
  religion: 15,
  science: 16,
  'social issues': 17,
  sports: 18,
  technology: 19,
  tech: 19,
  transport: 20,
  transportation: 20,
  travel: 21,
};

function getAdobeCategoryId(categoryStr?: string, categoryNum?: number): number {
  if (categoryNum && categoryNum >= 1 && categoryNum <= 21) {
    return categoryNum;
  }
  if (!categoryStr) return 8;
  const lower = categoryStr.toLowerCase().trim();
  for (const [key, id] of Object.entries(ADOBE_CATEGORY_MAP)) {
    if (lower.includes(key)) return id;
  }
  return 8;
}

function detectImageMimeType(base64Data: string, declaredMime?: string): string {
  if (base64Data.startsWith('iVBORw0KGgo')) return 'image/png';
  if (base64Data.startsWith('/9j/')) return 'image/jpeg';
  if (base64Data.startsWith('UklGR')) return 'image/webp';
  if (base64Data.startsWith('R0lGOD')) return 'image/gif';
  if (declaredMime && (declaredMime === 'image/png' || declaredMime === 'image/jpeg' || declaredMime === 'image/webp')) {
    return declaredMime;
  }
  return 'image/png';
}

const METADATA_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: 'The stock title following [Style/Theme] + [Product Format] + [Specific Visual Elements] + [Use Case/Application] formula, strictly maximum 15 words (ideal: 10 to 15 words) in professional English. NEVER exceed 15 words.',
    },
    titleWordCount: {
      type: Type.INTEGER,
      description: 'Number of words in the title, must be at most 15 words (maximum 15 words).',
    },
    breakdown: {
      type: Type.OBJECT,
      properties: {
        styleTheme: { type: Type.STRING, description: 'Style or theme component (e.g. Modern Minimalist, Vibrant Cyberpunk, Elegant Corporate)' },
        productFormat: { type: Type.STRING, description: 'Format component (e.g. Vector Illustration, 3D Render Banner, Flyer Template, Background Texture, Poster Collection)' },
        visualElements: { type: Type.STRING, description: 'Specific visual elements (e.g. geometric gradients, golden leaves, neon glowing grid)' },
        useCase: { type: Type.STRING, description: 'Application or target use case (e.g. for marketing campaign, website landing page, social media poster)' },
        // 1. Bedah Struktur Judul: 4 Pilar Formula
        subjectAndFormat: { type: Type.STRING, description: 'Subjek Utama & Format (e.g. Abstract vector gradient poster collection)' },
        baseConditionOrColor: { type: Type.STRING, description: 'Kondisi/Warna Dasar (e.g. with deep navy backgrounds / with dark red and black gradients)' },
        specificVisualElements: { type: Type.STRING, description: 'Elemen Visual Spesifik (e.g. , cyan light effects, blurred color waves)' },
        styleAndDetails: { type: Type.STRING, description: 'Gaya & Detail Tambahan (e.g. and futuristic line graphics for modern branding, print layout and presentation cover.)' },
        isBundleOrCollection: { type: Type.BOOLEAN, description: 'True if asset represents a bundle, set, series, or multi-design collection (e.g. 5 posters in 1 preview).' },
        bundleElementsSummary: { type: Type.STRING, description: 'Summary of unique elements across variants in the bundle (e.g. blurred waves, geometric arrows, glowing orb, diagonal halftone stripes).' },
        curatorStrengths: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Key curator strengths of this title (e.g. Menjawab Kebutuhan Bundel, Format Kalimat Alami ramah AI Search/Adobe Sensei).',
        },
        curatorTechnicalWarning: {
          type: Type.STRING,
          description: 'Technical evaluation warning comparing Web UI character limit (max 200 chars) vs CSV/FTP upload limit (recommended under 70-100 chars).',
        },
      },
      required: ['styleTheme', 'productFormat', 'visualElements', 'useCase', 'subjectAndFormat', 'baseConditionOrColor', 'specificVisualElements', 'styleAndDetails'],
    },
    tier1Keywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Tier 1 (Keywords 1-10): Exactly 10 primary subject/object keywords seen directly. At least 8-9 must be strictly 1 single word (e.g. coffee, woman, cat, mountain, vector, laptop).',
    },
    tier2Keywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Tier 2 (Keywords 11-20): Exactly 10 style, mood, color, lighting keywords. At least 8 must be strictly 1 single word (e.g. gold, vibrant, dark, warm, minimal).',
    },
    tier3Keywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Tier 3 (Keywords 21-35): Exactly 15 use case and industry keywords. At least 11-12 must be strictly 1 single word (e.g. business, travel, medical, culinary, banner).',
    },
    tier4Keywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Tier 4 (Keywords 36-49): Exactly 14 broad concepts, categories, stock terms. At least 10-11 must be strictly 1 single word (e.g. graphic, texture, backdrop, finance, ecology).',
    },
    allKeywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Exactly 49 total ordered keywords. Strictly 75% to 80% single words (approx 38 single words) and max 20% to 25% two-word recognized compound phrases (approx 11 phrases). Zero 3-word phrases.',
    },
    category: {
      type: Type.STRING,
      description: 'Primary Adobe Stock category name',
    },
    categoryId: {
      type: Type.INTEGER,
      description: 'Adobe Stock numeric Category ID (1 to 21)',
    },
    secondaryCategory: {
      type: Type.STRING,
      description: 'Secondary category for Shutterstock.',
    },
    rejectionRiskScore: {
      type: Type.STRING,
      description: 'Microstock rejection risk assessment: low, medium, or high.',
    },
    reviewNotes: {
      type: Type.STRING,
      description: 'Brief strategy summary explaining visual elements identified and search rank strategy.',
    },
  },
  required: [
    'title',
    'titleWordCount',
    'breakdown',
    'tier1Keywords',
    'tier2Keywords',
    'tier3Keywords',
    'tier4Keywords',
    'allKeywords',
    'category',
    'categoryId',
    'secondaryCategory',
    'rejectionRiskScore',
    'reviewNotes',
  ],
};

export const RECOGNIZED_STOCK_COMPOUND_PHRASES = new Set([
  'copy space',
  'copyspace',
  'golden hour',
  'blue hour',
  'slow motion',
  'drone shot',
  'drone view',
  'real estate',
  'graphic design',
  'social media',
  'artificial intelligence',
  'machine learning',
  'deep learning',
  'street food',
  'flat lay',
  'high angle',
  'low angle',
  'birds eye',
  'shallow depth',
  'depth field',
  'time lapse',
  'color grading',
  'green screen',
  'b roll',
  'top view',
  'side view',
  'front view',
  'close up',
  'wide shot',
  'sun set',
  'data science',
  'user interface',
  'user experience',
  'augmented reality',
  'virtual reality',
  'cyber security',
  'cloud computing',
  'health care',
  'mental health',
  'work space',
  'public transport',
  'solar panel',
  'renewable energy',
  'clean energy',
  'electric vehicle',
  'fast charger',
  'charging station',
  'smart car',
  'power level',
  '3d rendering',
  'motion graphic',
  'explainer video',
  'cv screening',
  'recruitment software',
  'human resources',
  'climate change',
  'credit card',
  'smart phone',
  'digital marketing',
  'e commerce',
  'online shopping',
  'wireframe model',
  'data protection',
  'password protection',
  'access control',
  'two factor',
  'cyber security',
  'cybersecurity',
  'lock icon',
  'santa hat',
  'office desk',
  'desk lamp',
  'holiday season',
  'workplace environment',
  'security monitoring',
  'dashboard interface',
  'secure login',
]);

export const TITLE_FILLER_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'for', 'in', 'on', 'at', 'to', 'from',
  'with', 'by', 'as', 'into', 'over', 'through', 'under', 'between', 'out',
  'up', 'down', 'about', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'its', 'their', 'this', 'that', 'these', 'those', 'using', 'showing', 'having',
  'made', 'making', 'without', 'per', 'set', 'via', 'how', 'which', 'who', 'whom',
  'where', 'when', 'why', 'can', 'will', 'do', 'does', 'did', 'so', 'if', 'all',
  'featuring', 'depicting', 'displaying', 'illustrating', 'representing',
  'across', 'along', 'around', 'near', 'off', 'onto', 'toward', 'towards',
  'during', 'hanging', 'holding', 'standing', 'sitting', 'lying', 'walking', 'running',
  'pointing', 'looking', 'including', 'containing', 'expressing', 'symbolizing',
  'static', 'shot', 'shots', 'taking', 'takes', 'various', 'multiple', 'several',
  'against', 'among', 'amidst', 'within', 'throughout', 'view', 'views',
]);

/**
 * Standardize common verb forms and descriptors to high-volume commercial stock nouns.
 * Adobe Stock buyers search for nouns ('automation') rather than conjugated verbs ('automating').
 */
export const VERB_TO_COMMERCIAL_NOUN: Record<string, string> = {
  automating: 'automation',
  automated: 'automation',
  recruiting: 'recruitment',
  managing: 'management',
  designing: 'design',
  analyzing: 'analytics',
  rendering: 'render',
  efficient: 'efficiency',
  charging: 'charging',
  screening: 'screening',
  hiring: 'hiring',
  protecting: 'protection',
  securing: 'security',
  secured: 'security',
  logging: 'login',
  authenticating: 'authentication',
  monitoring: 'monitoring',
  connecting: 'connection',
  communicating: 'communication',
  transmitting: 'transmission',
  computing: 'computing',
  processing: 'processing',
  optimizing: 'optimization',
  encrypting: 'encryption',
  encrypted: 'encryption',
  operating: 'operation',
  working: 'workplace',
};

/**
 * Strips cliché technical camera prefixes from stock footage / video titles:
 * e.g., "Static 4K Video Shot of Red Santa Hat..." -> "Red Santa Hat..."
 * e.g., "Slow Motion 4K Drone Aerial Shot of Sunset..." -> "Sunset..."
 * Ensures titles lead directly with the visual hero subject/scene for Adobe Stock Page 1 ranking.
 */
export function sanitizeStockVideoTitle(rawTitle: string): string {
  if (!rawTitle) return '';
  let cleaned = rawTitle.trim();

  const prefixRegex = /^(?:(?:a|an|the)\s+)?(?:static\s+|slow\s+motion\s+|cinematic\s+|aerial\s+|drone\s+|macro\s+|close[\s-]*up\s+|timelapse\s+|panning\s+|tracking\s+)*(?:(?:4k|8k|uhd|hd|full\s+hd)\s+)?(?:video\s+shot|drone\s+shot|camera\s+shot|aerial\s+shot|video\s+clip|video\s+footage|stock\s+footage|footage|video|clip|shot)\s+of\s+/i;

  if (prefixRegex.test(cleaned)) {
    cleaned = cleaned.replace(prefixRegex, '').trim();
  }

  // Handle "Animated 4K Explainer Video Showing..." or similar
  const explainerPrefixRegex = /^(?:(?:a|an|the)\s+)?(?:animated\s+)?(?:(?:4k|8k|uhd|hd)\s+)?(?:explainer\s+video|motion\s+graphics?\s+video)\s+(?:showing|depicting|featuring)\s+/i;
  if (explainerPrefixRegex.test(cleaned)) {
    cleaned = cleaned.replace(explainerPrefixRegex, 'Animated ').trim();
  }

  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned;
}

/**
 * Ensures title strictly does not exceed maxWords (default 15 words).
 * Safely removes dangling conjunctions and prepositions.
 */
export function clampTitleToMaxWords(rawTitle: string, maxWords: number = 15): string {
  if (!rawTitle) return '';
  const trimmed = rawTitle.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return trimmed;

  const connectors = new Set(['and', 'with', 'for', 'of', 'in', 'on', 'at', 'to', 'from', 'or', 'by', 'as', 'using', 'showing', 'featuring']);
  let slice = words.slice(0, maxWords);
  let clamped = slice.join(' ').replace(/[,;:\-\s]+$/, '');
  const currentWords = clamped.split(/\s+/);
  if (currentWords.length > 1 && connectors.has(currentWords[currentWords.length - 1].toLowerCase())) {
    currentWords.pop();
    clamped = currentWords.join(' ').replace(/[,;:\-\s]+$/, '');
  }
  return clamped;
}

/**
 * Format and technical descriptors that belong in Tier 2 or Tier 4,
 * and should NEVER be forced into Tier 1 core subject keywords.
 */
export const FORMAT_AND_TECHNICAL_TERMS = new Set([
  '4k', 'uhd', 'hd', 'fps', '60fps', 'video', 'footage', 'clip', 'roll',
  'loop', 'explainer', 'broll', 'cinematic', 'horizontal', 'vertical',
  'rendering', 'render', '3d', '2d', 'vector', 'illustration', 'photo',
]);

export interface CuratedTitleAnalysis {
  coreSubjectNouns: string[];
  recognizedCompounds: string[];
  filteredFillerWords: string[];
  formatTerms: string[];
}

/**
 * Expert Adobe Stock Title Filter:
 * Discards prepositions, conjunctions, and depictive filler verbs ('showing', 'using', 'from').
 * Normalizes conjugated verbs to commercial search nouns ('automating' -> 'automation').
 * Separates technical format tags from substantive subject nouns.
 */
export function extractCuratedTitleConcepts(title: string): CuratedTitleAnalysis {
  if (!title) {
    return {
      coreSubjectNouns: [],
      recognizedCompounds: [],
      filteredFillerWords: [],
      formatTerms: [],
    };
  }

  const lower = title.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ');
  const recognizedCompounds: string[] = [];
  const coreSubjectNouns: string[] = [];
  const filteredFillerWords: string[] = [];
  const formatTerms: string[] = [];

  // Check recognized compounds in title
  for (const phrase of RECOGNIZED_STOCK_COMPOUND_PHRASES) {
    if (lower.includes(phrase)) {
      recognizedCompounds.push(phrase);
    }
  }

  const rawWords = lower.split(/[\s-]+/).filter((w) => w.length > 1);
  for (const w of rawWords) {
    if (TITLE_FILLER_WORDS.has(w)) {
      filteredFillerWords.push(w);
      continue;
    }

    if (FORMAT_AND_TECHNICAL_TERMS.has(w)) {
      formatTerms.push(w);
      continue;
    }

    // Normalize verb or conjugated form to commercial noun
    const normalized = VERB_TO_COMMERCIAL_NOUN[w] || w;
    if (!coreSubjectNouns.includes(normalized)) {
      coreSubjectNouns.push(normalized);
    }
  }

  return {
    coreSubjectNouns,
    recognizedCompounds,
    filteredFillerWords: Array.from(new Set(filteredFillerWords)),
    formatTerms: Array.from(new Set(formatTerms)),
  };
}

// Backwards-compatible alias for existing imports
export const extractSignificantTitleTerms = (title: string) => {
  const analysis = extractCuratedTitleConcepts(title);
  return {
    compounds: analysis.recognizedCompounds,
    singles: analysis.coreSubjectNouns,
    filtered: analysis.filteredFillerWords,
    formats: analysis.formatTerms,
  };
};

export interface CuratedKeywordsResult {
  tier1Keywords: string[];
  tier2Keywords: string[];
  tier3Keywords: string[];
  tier4Keywords: string[];
  allKeywords: string[];
  singleWordCount: number;
  compoundCount: number;
  singleWordPercentage: number;
  titleMatchCount: number;
  titleMatchPercentage: number;
  coreSubjectsFound: string[];
}

/**
 * Professional Adobe Stock Curator Keyword Engine:
 * Follows strict Adobe Stock Contributor Guidelines and Algorithmic Search Rules:
 * 1. Tier 1 (1-10) ALGORITHMIC WEIGHT: Retains Hero Visual Subjects seen in preview + primary commercial nouns.
 * 2. 75% to 85% STRICTLY 1 SINGLE WORD (37-41 keywords).
 * 3. 15% to 25% RECOGNIZED COMPOUND PHRASES (8-12 keywords max).
 * 4. ZERO 3+ word phrases.
 * 5. NO RAW TITLE SCRAPING: Does NOT dump words mechanically into keywords. Normalizes verbs to search nouns.
 * 6. Video format tags (4k, footage, clip, loop) strictly placed in Tier 4, NEVER in Tier 1.
 * 7. Exactly 49 total ordered keywords.
 */
export function curateStockKeywords(
  rawT1: any[],
  rawT2: any[],
  rawT3: any[],
  rawT4: any[],
  isVideo: boolean = false,
  title: string = '',
  targetCount: number = 40
): CuratedKeywordsResult {
  const cleanKeyword = (str: string) =>
    str.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, ' ');

  const finalTarget = Math.max(25, Math.min(49, targetCount || 40));
  const t1Target = Math.min(10, Math.max(5, Math.round(finalTarget * 0.22)));
  const t2Target = Math.min(10, Math.max(5, Math.round(finalTarget * 0.22)));
  const t3Target = Math.max(7, Math.round(finalTarget * 0.32));

  const seen = new Set<string>();
  let totalCompounds = 0;
  // Strictly enforce 85% to 100% single words (max 2-3 recognized compound phrases total)
  const MAX_TOTAL_COMPOUNDS = Math.min(3, Math.round(finalTarget * 0.08));

  // Process a tier list preserving expert microstock ranking
  const processTierList = (arr: any[], isTier1: boolean = false): string[] => {
    if (!Array.isArray(arr)) return [];
    const tierResult: string[] = [];
    let tier1CompoundCount = 0;

    for (const raw of arr) {
      if (!raw) continue;
      const cleaned = cleanKeyword(String(raw));
      if (!cleaned) continue;

      const words = cleaned.split(/[\s-]+/).filter((w) => w.length > 1);
      if (words.length === 0) continue;

      if (words.length === 1) {
        const single = VERB_TO_COMMERCIAL_NOUN[words[0]] || words[0];
        if (!seen.has(single)) {
          seen.add(single);
          tierResult.push(single);
        }
      } else if (words.length === 2) {
        const phrase = words.join(' ');
        const isRecognizedCompound = RECOGNIZED_STOCK_COMPOUND_PHRASES.has(phrase);
        const canAddCompound =
          isRecognizedCompound &&
          totalCompounds < MAX_TOTAL_COMPOUNDS &&
          (!isTier1 || tier1CompoundCount < 2);

        if (canAddCompound && !seen.has(phrase)) {
          seen.add(phrase);
          tierResult.push(phrase);
          totalCompounds++;
          if (isTier1) tier1CompoundCount++;
        } else {
          // Decompose generic 2-word combinations into constituent single words
          // to adhere strictly to the 75-80% 1-word Adobe Stock Page 1 rule
          for (const w of words) {
            const single = VERB_TO_COMMERCIAL_NOUN[w] || w;
            if (single.length > 1 && !seen.has(single)) {
              seen.add(single);
              tierResult.push(single);
            }
          }
        }
      } else {
        // 3+ words: decompose into single commercial search words
        for (const w of words) {
          const single = VERB_TO_COMMERCIAL_NOUN[w] || w;
          if (single.length > 1 && !seen.has(single)) {
            seen.add(single);
            tierResult.push(single);
          }
        }
      }
    }
    return tierResult;
  };

  const t1 = processTierList(rawT1, true);
  const t2 = processTierList(rawT2, false);
  const t3 = processTierList(rawT3, false);
  const t4 = processTierList(rawT4, false);

  // Analyze title for core commercial concepts
  const { coreSubjectNouns, recognizedCompounds } = extractCuratedTitleConcepts(title);

  // Intelligently verify if essential subject nouns from title are present.
  // If a core subject noun was omitted by the AI generation, add it gracefully into t1 or t3.
  for (const subject of coreSubjectNouns) {
    if (!seen.has(subject)) {
      if (t1.length < t1Target) {
        seen.add(subject);
        t1.push(subject);
      } else if (t3.length < t3Target) {
        seen.add(subject);
        t3.push(subject);
      }
    }
  }

  // Build combined array adhering to the 4 tiers:
  // Tier 1 (Hero Visual Subjects & Core Action Nouns) remains strictly at index 0-9!
  const combined: string[] = [...t1, ...t2, ...t3, ...t4];

  // If fewer than finalTarget, pad with high-impact single-word stock terms
  const singleWordFillers = isVideo
    ? [
        'footage', 'clip', 'motion', 'video', 'cinematic', 'aerial', 'drone', 'camera', 'panning',
        'movement', 'realtime', 'broll', 'landscape', 'action', 'outdoor', 'indoor', 'light',
        'speed', 'sequence', 'scene', 'visual', 'production', 'creative', 'commercial', 'modern',
        'presentation', 'horizontal', 'loop', 'hd', 'digital'
      ]
    : [
        'illustration', 'vector', 'design', 'graphic', 'isolated', 'background', 'concept',
        'modern', 'art', 'creative', 'element', 'template', 'digital', 'symbol', 'icon',
        'sign', 'layout', 'style', 'clean', 'simple', 'decorative', 'texture', 'commercial',
        'flat', 'visual', 'composition', 'white', 'abstract', 'banner'
      ];

  for (const filler of singleWordFillers) {
    if (combined.length >= finalTarget) break;
    if (!seen.has(filler)) {
      seen.add(filler);
      combined.push(filler);
    }
  }

  // Exactly finalTarget keywords
  const finalKeywords = combined.slice(0, finalTarget);

  // Partition strictly into 4 tiers
  const finalT1 = finalKeywords.slice(0, t1Target);
  const finalT2 = finalKeywords.slice(t1Target, t1Target + t2Target);
  const finalT3 = finalKeywords.slice(t1Target + t2Target, t1Target + t2Target + t3Target);
  const finalT4 = finalKeywords.slice(t1Target + t2Target + t3Target, finalTarget);

  const singleWords = finalKeywords.filter((k) => k.split(/\s+/).length === 1);
  const compoundWords = finalKeywords.filter((k) => k.split(/\s+/).length > 1);

  // Calculate Title-Keyword Core Concordance:
  // Evaluates whether substantive commercial subjects from the Title are present in keywords
  const matchedCoreSubjects = coreSubjectNouns.filter((cs) =>
    finalKeywords.some((k) => k === cs || k.split(' ').includes(cs))
  );
  const titleMatchCount = matchedCoreSubjects.length;
  const titleMatchPercentage = coreSubjectNouns.length > 0
    ? Math.round((titleMatchCount / coreSubjectNouns.length) * 100)
    : 100;

  return {
    tier1Keywords: finalT1,
    tier2Keywords: finalT2,
    tier3Keywords: finalT3,
    tier4Keywords: finalT4,
    allKeywords: finalKeywords,
    singleWordCount: singleWords.length,
    compoundCount: compoundWords.length,
    singleWordPercentage: Math.round((singleWords.length / finalKeywords.length) * 100),
    titleMatchCount,
    titleMatchPercentage,
    coreSubjectsFound: matchedCoreSubjects,
  };
}

export function getEffectiveApiKey(customKey?: string): string | undefined {
  if (customKey && customKey.trim().length > 5) {
    return customKey.trim();
  }
  // Check client env var VITE_GEMINI_API_KEY
  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (envKey && typeof envKey === 'string' && envKey.trim().length > 5) {
    return envKey.trim();
  }
  return undefined;
}

export async function validateGeminiKeyDirect(
  apiKey: string,
  modelId: GeminiModelId = 'gemini-3.8-flash'
): Promise<{ valid: boolean; message: string; isQuota?: boolean }> {
  try {
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
    const response = await ai.models.generateContent({
      model: modelId,
      contents: 'Respond with OK only.',
    });
    if (response.text) {
      return { valid: true, message: `API Key valid dan terhubung dengan ${modelId}!` };
    }
    return { valid: false, message: 'Respon dari Gemini tidak valid.' };
  } catch (err: any) {
    const msg = err?.message || 'Gagal memvalidasi API Key.';
    const isQuota = msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED');
    return {
      valid: false,
      isQuota,
      message: isQuota ? 'Quota API Key telah habis atau rate limit terlampaui (429).' : msg,
    };
  }
}

export async function generateMetadataDirectly(payload: GenerateMetadataPayload): Promise<MetadataResult> {
  const apiKey = getEffectiveApiKey(payload.apiKey);
  if (!apiKey) {
    throw new Error(
      'API Key Gemini tidak ditemukan! Di hosting Netlify, server backend lokal tidak aktif. Harap masukkan API Key Google Gemini Anda melalui tombol "🔑 API Keys" di kanan atas atau atur VITE_GEMINI_API_KEY di Netlify.'
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  const primaryModel = payload.selectedModel || 'gemini-3.8-flash';
  const fileName = payload.fileName || 'untitled.jpg';
  const targetKeywordCount = Math.max(25, Math.min(49, payload.targetKeywordCount || 40));
  const cleanBase64 = payload.imageBase64.replace(/^data:[a-zA-Z0-9\/+-]+;base64,/, '');
  const effectiveMimeType = detectImageMimeType(cleanBase64, payload.mimeType);
  const isVideoAsset = payload.mediaType === 'video' || payload.artworkType === 'footage';

  let videoContextPrompt = '';
  if (isVideoAsset) {
    videoContextPrompt = `
MEDIA TYPE: STOCK FOOTAGE / VIDEO CLIP
TECHNICAL SPECS: Resolution: ${payload.videoMeta?.resolutionLabel || '4K/HD'}, Duration: ${payload.videoMeta?.duration ? payload.videoMeta.duration + ' seconds' : 'Short clip'}, Aspect Ratio: ${payload.videoMeta?.aspectRatio || '16:9 Landscape'}, Format: ${payload.videoMeta?.format?.toUpperCase() || 'MP4'}.

VIDEO TITLE FORMULA (Strictly maximum 15 words in professional stock English):
- CRITICAL ANTI-CLICHÉ RULE (ADOBE STOCK PAGE 1 STANDARD):
  * NEVER begin video titles with camera rig, resolution, or technical format prefixes!
    ❌ FORBIDDEN PREFIXES:
       - "Static 4K Video Shot of..."
       - "4K Video of..." / "4K Footage of..." / "Stock Footage of..."
       - "Video Shot of..." / "Shot of..." / "Slow Motion Shot of..."
       - "Drone Shot of..." / "Aerial Drone Shot of..."
       - "Cinematic Shot of..." / "Close Up Video of..."
  * LEAD DIRECTLY WITH THE HERO SUBJECT, ACTION, OR SCENE!

VIDEO KEYWORD MANDATE:
- Integrate video terms across tiers: footage, 4k, slow motion, b-roll, clip, cinematic, aerial, drone, camera, panning, realtime, loop, horizontal, motion, etc.
- Generate EXACTLY ${targetKeywordCount} keywords (1 or 2 words max each).`;
  }

  const systemPrompt = `You are a Senior Stock Contributor Strategist and Master AI Vision Specialist for Adobe Stock, Shutterstock, Freepik, and Getty Images.
Your task is to analyze the visual preview uploaded by the contributor and produce 100% commercially accurate, truthfully grounded stock metadata: Title (strictly maximum 15 words, ideal: 10 to 15 words) and EXACTLY ${targetKeywordCount} Keywords (requested count: ${targetKeywordCount}, min 25 max 49).

CORE MANDATE 1: EXPERT ADOBE STOCK CURATOR CONSTITUTION (HIGH-DEMAND KEYWORDS & ZERO RAW SCRAPING):
In Adobe Stock's ranking algorithm, the Title describes the asset contextually in strictly maximum 15 words (ideal: 10 to 15 words), while Keywords are high-converting search tags stock buyers type into the search bar.
DO NOT simply copy-paste or blindly scrape every word from the title into keywords!
Exclude filler prepositions and depictive filler verbs ('with', 'and', 'displaying', 'showing', 'featuring').
RATIO: 75% to 85% strictly 1 single word. Only 15% to 25% recognized compound phrases (2 words max). ZERO 3+ word phrases. Total keywords must be EXACTLY ${targetKeywordCount}.

Study this real Adobe Stock Page 1 example carefully:
Title: "Animated laptop displaying password protection dashboard interface with charts and lock icon for cybersecurity monitoring."

HOW AN EXPERT CURATOR EXTRACTS KEYWORDS FROM THIS ASSET & TITLE:
1. ONLY PICK HIGH-DEMAND, HIGH-SEARCH-VOLUME NOUNS & COMMERCIAL TERMS:
   - Hero Visual Objects (Tier 1): laptop, dashboard, interface, charts, lock, icon, password, screen, display
   - Core Commercial Subjects (Tier 1 & Tier 3): cybersecurity, security, protection, login, monitoring, system, data protection, safe
   - Visual Aesthetics (Tier 2): animated, digital, graphic, modern, motion, ui, technology, blue, clean
   - Buyer Verticals & Workflows (Tier 3): information technology, authentication, access, software, cloud, privacy, business, database, firewall
   - Video Specs & Broad Concepts (Tier 4): footage, 4k, clip, animation, loop, concept, virtual, horizontal

2. WHAT AN EXPERT CURATOR STRICTLY REJECTS & EXCLUDES FROM KEYWORDS:
   - Filler prepositions & conjunctions: 'of', 'with', 'and', 'on', 'in', 'during', 'for'
   - Weak depictive verbs & participles: 'displaying', 'representing', 'hanging', 'showing', 'featuring', 'depicting' (Stock buyers NEVER search for "displaying" or "representing"!)
   - Camera & Rig clichés: 'shot', 'static', 'video shot'

3. TIER ARCHITECTURE (Target: ${targetKeywordCount} keywords):
   - Tier 1: Primary physical visual objects seen directly in the preview + core commercial subject nouns. At least 80% must be strictly single words! NEVER place technical video tags ('4k', 'footage') in Tier 1!
   - Tier 2: Visual style, aesthetics, colors, lighting, rendering technique (e.g. animated, digital, blue, modern, motion, clean).
   - Tier 3: Industry verticals, business workflows, buyer use cases (e.g. cybersecurity, authentication, privacy, safe, software, network, access, cloud).
   - Tier 4: Video production & technical formats ('footage', '4k', 'clip', 'animation', 'loop', 'horizontal') and broad conceptual themes ('concept', 'innovation', 'intelligence', 'virtual', 'protection').
   - RATIO: 75% to 85% strictly 1 single word. Only 15% to 25% recognized compound phrases (2 words max). ZERO 3+ word phrases. Exactly ${targetKeywordCount} keywords.

- Example A (Video - Real Page 1 Standard, <= 15 words):
  Title: "Animated Laptop Displaying Password Protection Dashboard Interface with Charts and Lock Icon for Cybersecurity"
  Tier 1 Keywords: laptop, dashboard, interface, charts, lock, icon, password, screen, cybersecurity, display
  Tier 2 Keywords: animated, digital, blue, modern, clean, motion, graphic, ui, tech, minimalist
  Tier 3 Keywords: security, protection, login, monitoring, authentication, privacy, access, data, system, software, safe, cloud, network, corporate, business
  Tier 4 Keywords: footage, 4k, clip, animation, loop, horizontal, concept, innovation, intelligence, virtual, analytics, compliance, enterprise, solution

- Example B (Video - Seasonal Holiday Workplace, <= 15 words):
  Title: "Red Santa Hat Hanging on Modern Office Desk Lamp During Christmas Holiday Season in Workplace"
  Tier 1 Keywords: santa hat, hat, desk, lamp, office, workplace, christmas, holiday, celebration, decoration
  Tier 2 Keywords: red, modern, warm, indoor, cozy, interior, festive, cheerful, contemporary, clean
  Tier 3 Keywords: corporate, business, coworker, party, december, winter, season, employment, professional, greeting, event, year end, tradition, break, commercial
  Tier 4 Keywords: footage, 4k, clip, realtime, broll, horizontal, concept, happiness, joy, leisure, festive season, vacancy, quiet, peace

- Example C (Graphic / 3D Interface / Technology, <= 15 words):
  Title: "Electric Vehicle Battery Fast Charging Status Interface with 3D Futuristic Telemetry Power Indicator Display"
  Tier 1 Keywords: battery, charger, station, vehicle, display, interface, indicator, screen, gauge, charging
  Tier 2 Keywords: 3d rendering, futuristic, fuel, ui, ev, automotive, industry, cyan, glowing, digital
  Tier 3 Keywords: clean energy, electricity, dashboard, eco, mobility, smart car, transport, drive, sustainable, automobile, cable, meter, electric vehicle, power level, fast charger
  Tier 4 Keywords: innovation, high tech, render, visual, commercial, isolated, concept, dark, illuminated, plug, power, energy, device, telemetry

CORE MANDATE 2: STRICT VISUAL GROUNDING (ZERO HALLUCINATIONS, NO GUESSWORK):
The contributor explicitly uploaded this visual preview so that the metadata accurately reflects what is in the artwork.
DO NOT guess or invent random elements. DO NOT output boilerplate or irrelevant terms.
1. VISUAL INSPECTION:
   - Identify the exact real subject(s) in the image/video frame.
   - Identify the true dominant color palette seen directly in the preview.
   - Identify the visual format and technique (${isVideoAsset ? 'cinematic video footage, slow motion b-roll, aerial drone clip' : 'flat vector illustration, 3D clay render, realistic photo, minimalist line art, seamless pattern, badge logo, infographic, watercolor'}).
   - Identify real visual attributes (copy space, isolated on white, dark background, geometric symmetry, gradient glow, motion blur, natural light).
2. TRUTHFULNESS & RELEVANCE:
   - If there are no people, NEVER write "person", "man", "woman", "human", "face".
   - If there is no technology or cryptocurrency, NEVER write "crypto", "blockchain", "phone", "bitcoin", "laptop".
   - If the visual depicts food/drinks, the keywords MUST be gastronomy, culinary, dining, delicious, cooking, meal, recipe, etc.
   - If the visual depicts plants/botanicals, the keywords MUST be flora, leaf, foliage, nature, botanical, branch, organic, garden, etc.
   - If the visual depicts abstract geometric waves/shapes, the keywords MUST describe abstract, geometric, curves, waves, gradients, backdrop, layout, wallpaper, etc.
3. TITLE FORMULA (Strictly maximum 15 words in professional stock English):
   - Title MUST be maximum 15 words in length (ideal: 10 to 15 words). NEVER exceed 15 words.
   - Every element in the title must accurately match what is visible in the preview.
4. HIERARCHICAL KEYWORDS (Exact count: ${targetKeywordCount}):
   CRITICAL SINGLE-WORD MANDATE:
   - 75% to 80% of all keywords MUST BE STRICTLY 1 SINGLE WORD (e.g. "battery", "charging", "software", "recruitment", "screening", "mountain", "coffee", "sunset", "laptop", "vector", "aerial", "minimalist", "gold", "vibrant", "growth").
   - Maximum 20% to 25% may be 2 words, and ONLY for recognized fixed compound phrases (e.g. "electric vehicle", "fast charger", "charging station", "3d rendering", "copy space", "golden hour", "slow motion", "drone shot", "real estate", "social media", "flat lay", "artificial intelligence").
   - DO NOT combine generic adjective + noun into 2 words (e.g. DO NOT write "red car", write "car" and "red"; DO NOT write "modern building", write "modern" and "building").
   - Never output 3 or more words per keyword.
5. NO TRADEMARKS OR SPAM: No brand names (Apple, Nike, Photoshop, etc.).
6. ADOBE STOCK CATEGORY: Pick the single most accurate category name and numeric Category ID (1 to 21).
${videoContextPrompt}
${payload.customContext ? `CONTRIBUTOR FOCUS / CONTEXT: "${payload.customContext}". Incorporate this context into Tier 3 and the Title's application part if relevant.` : ''}
${payload.artworkType && payload.artworkType !== 'auto' ? `ARTWORK TYPE: ${payload.artworkType}.` : ''}
${payload.targetPlatform && payload.targetPlatform !== 'all' ? `TARGET PLATFORM: ${payload.targetPlatform.toUpperCase()}` : ''}
File Name: ${fileName}
`;

  const parts: any[] = [];

  const validVideoFrames = (payload.videoFrames || []).filter(
    (f) => f.imageBase64 && f.imageBase64.replace(/^data:[a-zA-Z0-9\/+-]+;base64,/, '').trim().length > 50
  );

  const hasCleanBase64 = cleanBase64 && cleanBase64.trim().length > 50;

  if (isVideoAsset && validVideoFrames.length > 0) {
    // Multi-frame video vision: Send all valid temporal frames chronologically
    validVideoFrames.forEach((frame, idx) => {
      const fBase64 = frame.imageBase64.replace(/^data:[a-zA-Z0-9\/+-]+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: fBase64,
        },
      });
      parts.push({
        text: `[Video Temporal Frame ${idx + 1} of ${validVideoFrames.length}]: Captured at timestamp ${frame.timestamp}s (${frame.percent}% video timeline). Position: ${frame.label}.`,
      });
    });

    parts.push({
      text: `You have been provided with ${validVideoFrames.length} TEMPORAL FRAMES extracted across this stock video footage clip ("${fileName}"):
- Frame 1: Beginning / establishing shot (initial subjects, lighting, composition).
- Frame 2: Midpoint / action peak (primary motion, camera angle, subject interaction).
- Frame 3: Ending / motion trajectory (motion path, atmosphere, scene resolution).

Carefully analyze the progressive visual evolution across all frames:
1. Identify the camera movement (e.g. aerial drone flyover, smooth panning, tilt shot, gimbal tracking, static tripod, slow motion b-roll).
2. Identify what visible actions occur across the sequence.
3. Generate a highly commercial stock footage title (strictly maximum 15 words, ideal 10 to 15 words) and exactly 49 hierarchical keywords (1 or 2 words max each) grounded in the complete sequence. Ensure 100% mutual relevance between Title and Keywords. Do not guess or invent unrelated keywords.`,
    });
  } else if (hasCleanBase64) {
    // Single image/raster frame vision
    parts.push({
      inlineData: {
        mimeType: effectiveMimeType,
        data: cleanBase64,
      },
    });
    parts.push({
      text: `Examine the exact visual content of this preview "${fileName}". Generate a commercially compelling, 100% relevant stock Title (strictly maximum 15 words, ideal 10 to 15 words) and exactly 49 hierarchical keywords (1 or 2 words max each) strictly grounded in what is visible in this preview. Ensure every substantive word in the Title is represented in the keywords. Do not guess or output unrelated keywords.`,
    });
  } else {
    // TEXT-ONLY CONTEXT FALLBACK (CRITICAL: Prevents "Unable to process input image" when MOV/ProRes/vector has no decoded frame)
    parts.push({
      text: `[STOCK METADATA GENERATION FROM ASSET SPECIFICATION & FILENAME]
Note: This file is a professional stock ${isVideoAsset ? 'video footage clip (MOV/ProRes)' : 'design asset'} ("${fileName}") whose preview frame could not be visually rendered in the contributor's browser.
Synthesize the subject, theme, industry context, and visual composition directly from the file name, media format, and technical details:
- File Name: "${fileName}"
- Media Type: ${isVideoAsset ? 'Stock Video Footage Clip' : 'Commercial Vector / Digital Graphic'}
${payload.customContext ? `- Contributor Subject Notes / Context: "${payload.customContext}"` : ''}
${payload.videoMeta ? `- Technical Specs: Format: ${payload.videoMeta.format?.toUpperCase() || 'MOV'}, Resolution: ${payload.videoMeta.resolutionLabel || '4K UHD'}, Duration: ${payload.videoMeta.duration || 15}s, Aspect Ratio: ${payload.videoMeta.aspectRatio || '16:9 Landscape'}` : ''}
${payload.artworkType && payload.artworkType !== 'auto' ? `- Artwork Type: ${payload.artworkType}` : ''}
${payload.targetPlatform && payload.targetPlatform !== 'all' ? `- Target Microstock Agency: ${payload.targetPlatform.toUpperCase()}` : ''}

Generate a commercially compelling, 100% relevant stock Title (strictly maximum 15 words in professional stock English) and exactly 49 hierarchical keywords (1 or 2 words max each) following Adobe Stock Page 1 standards. Ensure 100% mutual relevance between Title and Keywords.`,
    });
  }

  const contents = { parts };

  let response;
  try {
    response = await ai.models.generateContent({
      model: primaryModel,
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.15,
        responseMimeType: 'application/json',
        responseSchema: METADATA_RESPONSE_SCHEMA,
      },
    });
  } catch (modelErr: any) {
    console.warn(`Primary model ${primaryModel} failed in client:`, modelErr?.message);
    const isQuota = modelErr?.message?.includes('429') || modelErr?.message?.includes('quota') || modelErr?.message?.includes('RESOURCE_EXHAUSTED');
    if (isQuota) {
      throw new Error('Quota API Key telah habis atau rate limit terlampaui (429). Putar API key berikutnya.');
    }

    const fallbackModel = primaryModel === 'gemini-3.8-flash'
      ? 'gemini-flash-latest'
      : (primaryModel === 'gemini-flash-latest' ? 'gemini-3.1-flash-lite' : 'gemini-3.8-flash');
    console.log(`Falling back to ${fallbackModel}...`);
    response = await ai.models.generateContent({
      model: fallbackModel,
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.15,
        responseMimeType: 'application/json',
        responseSchema: METADATA_RESPONSE_SCHEMA,
      },
    });
  }

  const rawText = response.text || '{}';
  let parsedData: any;
  try {
    parsedData = JSON.parse(rawText);
  } catch {
    throw new Error('Gagal mem-parse respon AI model sebagai format JSON.');
  }

  let finalTitle = parsedData.title || fileName;
  if (isVideoAsset) {
    finalTitle = sanitizeStockVideoTitle(finalTitle);
  }
  finalTitle = clampTitleToMaxWords(finalTitle, 15);
  const words = finalTitle.trim().split(/\s+/).filter(Boolean);

  const curated = curateStockKeywords(
    parsedData.tier1Keywords,
    parsedData.tier2Keywords,
    parsedData.tier3Keywords,
    parsedData.tier4Keywords,
    isVideoAsset,
    finalTitle,
    targetKeywordCount
  );

  const categoryId = getAdobeCategoryId(parsedData.category, parsedData.categoryId);

  const riskScore: 'low' | 'medium' | 'high' =
    parsedData.rejectionRiskScore === 'high' || parsedData.rejectionRiskScore === 'medium'
      ? parsedData.rejectionRiskScore
      : 'low';

  return {
    fileName,
    title: finalTitle,
    titleWordCount: words.length,
    titleCharCount: finalTitle.length,
    breakdown: {
      styleTheme: parsedData.breakdown?.styleTheme || 'Modern Commercial',
      productFormat: parsedData.breakdown?.productFormat || (isVideoAsset ? 'Stock Footage' : 'Vector Illustration'),
      visualElements: parsedData.breakdown?.visualElements || 'Detailed visual composition',
      useCase: parsedData.breakdown?.useCase || 'Commercial stock design and marketing',
      subjectAndFormat: parsedData.breakdown?.subjectAndFormat || parsedData.breakdown?.productFormat || 'Abstract vector gradient poster collection',
      baseConditionOrColor: parsedData.breakdown?.baseConditionOrColor || 'with deep gradient background',
      specificVisualElements: parsedData.breakdown?.specificVisualElements || parsedData.breakdown?.visualElements || 'vibrant light effects and blurred color waves',
      styleAndDetails: parsedData.breakdown?.styleAndDetails || 'and futuristic line graphics for modern branding and print layout.',
      isBundleOrCollection: parsedData.breakdown?.isBundleOrCollection ?? (finalTitle.toLowerCase().includes('collection') || finalTitle.toLowerCase().includes('set') || finalTitle.toLowerCase().includes('bundle')),
      bundleElementsSummary: parsedData.breakdown?.bundleElementsSummary || 'Merangkum ragam elemen unik tiap desain dalam bundel visual.',
      curatorStrengths: parsedData.breakdown?.curatorStrengths || [
        'Menjawab Kebutuhan Bundel (Collection): Merangkum semua elemen unik variasi desain dalam satu kalimat alami.',
        'Format Kalimat Alami (Natural Language): Ramah AI Search / Adobe Sensei tanpa tumpukan kata spam.'
      ],
      curatorTechnicalWarning: parsedData.breakdown?.curatorTechnicalWarning || (
        finalTitle.length <= 70
          ? `Panjang ${finalTitle.length} karakter (${words.length} kata): Sangat optimal untuk Web UI (maks 200) dan kolom CSV/FTP (maks 70).`
          : `Panjang ${finalTitle.length} karakter (${words.length} kata): Lolos upload Web UI langsung (maks 200). Kolom CSV/FTP membatasi maks 70-100 karakter.`
      ),
    },
    tier1Keywords: curated.tier1Keywords,
    tier2Keywords: curated.tier2Keywords,
    tier3Keywords: curated.tier3Keywords,
    tier4Keywords: curated.tier4Keywords,
    allKeywords: curated.allKeywords,
    category: parsedData.category || (isVideoAsset ? 'Landscapes' : 'Graphic Resources'),
    categoryId,
    secondaryCategory: parsedData.secondaryCategory || (isVideoAsset ? 'Technology' : 'Abstract'),
    rejectionRiskScore: riskScore,
    reviewNotes: parsedData.reviewNotes || (isVideoAsset ? 'Optimized for microstock stock footage.' : 'Metadata optimized for high search impression and conversion.'),
  };
}

export async function refineMetadataDirectly(payload: RefineMetadataPayload): Promise<MetadataResult> {
  const apiKey = getEffectiveApiKey(payload.apiKey);
  if (!apiKey) {
    throw new Error(
      'API Key Gemini tidak ditemukan! Di hosting Netlify, backend lokal tidak aktif. Harap masukkan API Key Google Gemini Anda melalui tombol "🔑 API Keys".'
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  const primaryModel = payload.selectedModel || 'gemini-3.8-flash';
  const fileName = payload.fileName || 'image.jpg';

  const systemPrompt = `You are a Senior Stock Contributor Strategist and Master AI Vision Specialist for Adobe Stock.
Refine the provided microstock metadata according to the contributor's instruction while maintaining the strict formula:
1. Title must be MAXIMUM 15 words (ideal: 10 to 15 words) following: [Style/Theme] + [Product Format] + [Specific Visual Elements] + [Use Case/Application]. NEVER exceed 15 words.
2. EXPERT ADOBE STOCK CURATOR CONSTITUTION (TITLE & KEYWORD HARMONY WITHOUT RAW WORD SCRAPING):
   - Tier 1 (1-10): Retain the primary visual hero elements seen in the preview (e.g. robot, dashboard, battery, charger, gauge) + core commercial subject nouns. Never put technical video specs (4k, footage) in Tier 1!
   - DO NOT dump all words from title into keywords. Filter out filler verbs (showing, using, having, featuring) and prepositions (for, from, with, by).
   - Convert verbs to search nouns: 'automating' -> 'automation', 'recruiting' -> 'recruitment', 'managing' -> 'management'.
   - Tier 2 (11-20): Visual style, aesthetics, colors, lighting, rendering technique.
   - Tier 3 (21-35): Commercial use case, application, workflow, target industry.
   - Tier 4 (36-49): Video specs (footage, 4k, clip, loop) and broad conceptual search terms.
3. CRITICAL KEYWORD MANDATE: 75% to 85% of keywords MUST be strictly 1 single word. Maximum 15% to 25% may be 2 words for recognized fixed compound phrases (e.g. electric vehicle, fast charger, 3d rendering, copy space, golden hour, slow motion, drone shot). Never output 3 or more words per keyword.
4. No brand names, no spam. Stay 100% truthful to the visual asset.`;

  const userText = `Current Title: "${payload.currentTitle}"
Current Keywords (${(payload.currentKeywords || []).length}): ${(payload.currentKeywords || []).join(', ')}
Contributor Refinement Request: "${payload.refinementInstruction}"
File Name: ${fileName}

Please update the title (strictly maximum 15 words, ideal 10-15 words) and keywords (1-2 words max each) strictly following the requested changes while maintaining 100% mutual relevance between Title and Keywords.`;

  const parts: any[] = [];
  const cleanRefineBase64 = (payload.imageBase64 || '').replace(/^data:[a-zA-Z0-9\/+-]+;base64,/, '');
  if (cleanRefineBase64.trim().length > 50) {
    const effMime = detectImageMimeType(cleanRefineBase64, payload.mimeType);
    parts.push({
      inlineData: {
        mimeType: effMime,
        data: cleanRefineBase64,
      },
    });
  }
  parts.push({ text: userText });

  let response;
  try {
    response = await ai.models.generateContent({
      model: primaryModel,
      contents: { parts },
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: METADATA_RESPONSE_SCHEMA,
      },
    });
  } catch (modelErr: any) {
    const isQuota = modelErr?.message?.includes('429') || modelErr?.message?.includes('quota') || modelErr?.message?.includes('RESOURCE_EXHAUSTED');
    if (isQuota) {
      throw new Error('Quota API Key telah habis (429).');
    }

    const fallbackModel = primaryModel === 'gemini-3.8-flash'
      ? 'gemini-flash-latest'
      : (primaryModel === 'gemini-flash-latest' ? 'gemini-3.1-flash-lite' : 'gemini-3.8-flash');
    response = await ai.models.generateContent({
      model: fallbackModel,
      contents: { parts },
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: METADATA_RESPONSE_SCHEMA,
      },
    });
  }

  const parsedData = JSON.parse(response.text || '{}');
  const isVideoAsset = fileName.toLowerCase().match(/\.(mp4|mov|webm|m4v|avi|mkv)$/) !== null;
  let finalTitle = parsedData.title || fileName;
  if (isVideoAsset) {
    finalTitle = sanitizeStockVideoTitle(finalTitle);
  }
  finalTitle = clampTitleToMaxWords(finalTitle, 15);
  const words = finalTitle.trim().split(/\s+/).filter(Boolean);
  const targetCount = payload.targetKeywordCount || (payload.currentKeywords ? payload.currentKeywords.length : 40);
  const curated = curateStockKeywords(
    parsedData.tier1Keywords,
    parsedData.tier2Keywords,
    parsedData.tier3Keywords,
    parsedData.tier4Keywords,
    isVideoAsset,
    finalTitle,
    targetCount
  );

  const riskScore: 'low' | 'medium' | 'high' =
    parsedData.rejectionRiskScore === 'high' || parsedData.rejectionRiskScore === 'medium'
      ? parsedData.rejectionRiskScore
      : 'low';

  return {
    fileName,
    title: finalTitle,
    titleWordCount: words.length,
    titleCharCount: finalTitle.length,
    breakdown: {
      styleTheme: parsedData.breakdown?.styleTheme || 'Modern Commercial',
      productFormat: parsedData.breakdown?.productFormat || (isVideoAsset ? 'Stock Footage' : 'Stock Illustration'),
      visualElements: parsedData.breakdown?.visualElements || 'Detailed visual composition',
      useCase: parsedData.breakdown?.useCase || 'Commercial stock design and marketing',
      subjectAndFormat: parsedData.breakdown?.subjectAndFormat || parsedData.breakdown?.productFormat || 'Abstract vector gradient poster collection',
      baseConditionOrColor: parsedData.breakdown?.baseConditionOrColor || 'with deep gradient background',
      specificVisualElements: parsedData.breakdown?.specificVisualElements || parsedData.breakdown?.visualElements || 'vibrant light effects and blurred color waves',
      styleAndDetails: parsedData.breakdown?.styleAndDetails || 'and futuristic line graphics for modern branding and print layout.',
      isBundleOrCollection: parsedData.breakdown?.isBundleOrCollection ?? (finalTitle.toLowerCase().includes('collection') || finalTitle.toLowerCase().includes('set') || finalTitle.toLowerCase().includes('bundle')),
      bundleElementsSummary: parsedData.breakdown?.bundleElementsSummary || 'Merangkum ragam elemen visual unik tiap desain dalam bundel visual.',
      curatorStrengths: parsedData.breakdown?.curatorStrengths || [
        'Menjawab Kebutuhan Bundel (Collection): Merangkum semua elemen unik variasi desain dalam satu kalimat alami.',
        'Format Kalimat Alami (Natural Language): Ramah AI Search / Adobe Sensei tanpa tumpukan kata spam.'
      ],
      curatorTechnicalWarning: parsedData.breakdown?.curatorTechnicalWarning || (
        finalTitle.length <= 70
          ? `Panjang ${finalTitle.length} karakter (${words.length} kata): Sangat optimal untuk Web UI (maks 200) dan kolom CSV/FTP (maks 70).`
          : `Panjang ${finalTitle.length} karakter (${words.length} kata): Lolos upload Web UI langsung (maks 200). Kolom CSV/FTP membatasi maks 70-100 karakter.`
      ),
    },
    tier1Keywords: curated.tier1Keywords,
    tier2Keywords: curated.tier2Keywords,
    tier3Keywords: curated.tier3Keywords,
    tier4Keywords: curated.tier4Keywords,
    allKeywords: curated.allKeywords,
    category: parsedData.category || 'Graphic Resources',
    categoryId: getAdobeCategoryId(parsedData.category, parsedData.categoryId),
    secondaryCategory: parsedData.secondaryCategory || 'Abstract',
    rejectionRiskScore: riskScore,
    reviewNotes: parsedData.reviewNotes || 'Metadata successfully refined.',
  };
}

/**
 * Smart metadata generator:
 * 1. Tries backend endpoint /api/generate-metadata first (works on localhost dev or Netlify Functions).
 * 2. If it detects that /api/generate-metadata returns HTML (Netlify static SPA redirect) or 404 or fails,
 *    it seamlessly falls back to client-side direct Gemini generation using @google/genai!
 */
export async function smartGenerateMetadata(
  payload: GenerateMetadataPayload,
  onQuotaExhausted?: () => Promise<string | undefined>
): Promise<MetadataResult> {
  let backendFailedOrHtml = false;

  try {
    const response = await fetch('/api/generate-metadata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get('content-type') || '';

    // If server returned HTML (typical of Netlify /* -> /index.html 200 redirect for missing API routes)
    if (contentType.includes('text/html')) {
      console.warn('[StockMeta] Detected HTML response from /api/generate-metadata (Netlify static hosting). Falling back to direct client-side Gemini...');
      backendFailedOrHtml = true;
    } else if (response.status === 404 || response.status === 405 || response.status === 502) {
      console.warn(`[StockMeta] Server endpoint returned ${response.status}. Falling back to direct client-side Gemini...`);
      backendFailedOrHtml = true;
    } else if (response.status === 429) {
      if (onQuotaExhausted) {
        const nextKey = await onQuotaExhausted();
        if (nextKey) {
          return smartGenerateMetadata({ ...payload, apiKey: nextKey }, onQuotaExhausted);
        }
      }
      throw new Error('Quota API Key telah habis atau rate limit terlampaui (429). Putar API key berikutnya.');
    } else if (!response.ok) {
      let errorMsg = 'Server error generating metadata';
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorData.message || errorMsg;
      } catch {
        // If not json, fall back to direct client
        backendFailedOrHtml = true;
      }
      if (!backendFailedOrHtml) {
        throw new Error(errorMsg);
      }
    } else {
      const text = await response.text();
      try {
        const result = JSON.parse(text);
        return result;
      } catch {
        // Not valid JSON, probably HTML
        backendFailedOrHtml = true;
      }
    }
  } catch (netErr: any) {
    if (netErr?.message?.includes('Quota API Key telah habis')) {
      throw netErr;
    }
    console.warn('[StockMeta] Network or backend fetch error, falling back to direct client-side Gemini execution:', netErr?.message);
    backendFailedOrHtml = true;
  }

  if (backendFailedOrHtml) {
    return await generateMetadataDirectly(payload);
  }

  throw new Error('Failed to generate metadata');
}

/**
 * Smart metadata refiner:
 * Tries server endpoint first, falls back to direct client on static Netlify.
 */
export async function smartRefineMetadata(payload: RefineMetadataPayload): Promise<MetadataResult> {
  try {
    const response = await fetch('/api/refine-metadata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && response.ok) {
      const result = await response.json();
      return result;
    }
  } catch (e) {
    console.warn('[StockMeta] Refine endpoint failed, falling back to direct client:', e);
  }

  return await refineMetadataDirectly(payload);
}

/**
 * Smart key validator:
 * Validates key via server if available, otherwise tests directly via @google/genai client.
 */
export async function smartValidateKey(
  apiKey: string,
  modelId: GeminiModelId = 'gemini-3.8-flash'
): Promise<{ valid: boolean; message: string; isQuota?: boolean }> {
  try {
    const response = await fetch('/api/validate-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, model: modelId }),
    });

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && (response.ok || response.status === 429)) {
      const res = await response.json();
      return {
        valid: res.valid || false,
        message: res.message || (res.valid ? 'API Key valid!' : 'API Key tidak valid'),
        isQuota: res.isQuota || response.status === 429,
      };
    }
  } catch (e) {
    console.warn('[StockMeta] /api/validate-key not reachable, using direct client-side validation...');
  }

  return await validateGeminiKeyDirect(apiKey, modelId);
}

/**
 * Generate Canvas JS Motion Code directly via Gemini API
 */
export async function generateMotionCodeDirectly(payload: GenerateMotionPayload): Promise<string> {
  const apiKey = getEffectiveApiKey(payload.apiKey);
  if (!apiKey) {
    throw new Error('API Key Gemini tidak ditemukan! Harap masukkan API Key Gemini Anda melalui tombol "🔑 API Keys".');
  }

  const ai = new GoogleGenAI({ apiKey });
  const primaryModel = payload.selectedModel || 'gemini-3.8-flash';

  const bgVal = payload.bgMode || 'transparent';
  const bgRule = bgVal === 'custom'
    ? 'DIIZINKAN merender background artistik kustom sendiri di dalam kode.'
    : 'DILARANG merender background warna solid (seperti hitam/putih/hijau) di dalam kode. Biarkan area dasar transparan (Alpha Channel) agar engine dapat mengatur background solid/green-screen secara fleksibel.';

  const systemPrompt = `You are an elite Motion Graphics Designer and JavaScript HTML5 Canvas Animation Specialist for Anime, 3D, VFX, and Microstock Video clips.
Your task is to generate a PURE, HIGH-PERFORMANCE Canvas 2D API code snippet.

Execution Environment & Injected Variables:
1. \`ctx\` (CanvasRenderingContext2D instance)
2. \`t\` (Float representing animation time in seconds, e.g. 0.00, 1.25, 14.90)
3. \`opts\` ({ width: 1920, height: 1080 } representing fixed 16:9 Landscape resolution)

STRICT CODING RULES:
1. Output ONLY the raw JavaScript execution snippet. NEVER wrap in a function declaration (no \`function draw() { ... }\`).
2. NEVER output markdown code blocks or backticks (\`\`\`javascript or \`\`\`). Output pure executable JavaScript code directly.
3. Always wrap code within a block scope \`ctx.save(); { const { width, height } = opts; const cx = width / 2; const cy = height / 2; ... } ctx.restore();\`.
4. Create vibrant, fluid, professional animations (anime 3D cel-shaded, isometric, sci-fi HUD, neon laser glow, smooth sin/cos interpolation, shadows, particle loops).
5. Ensure animations loop seamlessly or evolve smoothly over time \`t\`.
6. ${bgRule}
7. Use pure standard Canvas 2D methods (arc, rect, roundRect, bezierCurveTo, quadraticCurveTo, createLinearGradient, createRadialGradient, ellipse, fill, stroke, shadowBlur, shadowColor, etc.).`;

  const parts: any[] = [];
  if (payload.referenceImageBase64) {
    const cleanBase64 = payload.referenceImageBase64.replace(/^data:[a-zA-Z0-9\/+-]+;base64,/, '');
    const effMime = detectImageMimeType(cleanBase64, 'image/png');
    parts.push({
      inlineData: {
        mimeType: effMime,
        data: cleanBase64,
      },
    });
    parts.push({
      text: `Analyze this reference artwork. Create a high-end HTML5 Canvas 2D animation inspired by this visual style and composition with instruction: "${payload.prompt}". Target duration: ${payload.duration} seconds.`,
    });
  } else {
    parts.push({
      text: `Create a high-end HTML5 Canvas 2D animation with instruction: "${payload.prompt}". Target duration: ${payload.duration} seconds.`,
    });
  }

  let response;
  try {
    response = await ai.models.generateContent({
      model: primaryModel,
      contents: { parts },
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.25,
      },
    });
  } catch (err: any) {
    const isQuota = err?.message?.includes('429') || err?.message?.includes('quota') || err?.message?.includes('RESOURCE_EXHAUSTED');
    if (isQuota) {
      throw new Error('Quota API Key telah habis (429). Putar API Key berikutnya.');
    }
    const fallbackModel = primaryModel === 'gemini-3.8-flash'
      ? 'gemini-flash-latest'
      : (primaryModel === 'gemini-flash-latest' ? 'gemini-3.1-flash-lite' : 'gemini-3.8-flash');
    response = await ai.models.generateContent({
      model: fallbackModel,
      contents: { parts },
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.25,
      },
    });
  }

  let code = (response.text || '').trim();
  if (code.startsWith('```javascript')) code = code.slice(13);
  else if (code.startsWith('```js')) code = code.slice(5);
  else if (code.startsWith('```')) code = code.slice(3);
  if (code.endsWith('```')) code = code.slice(0, -3);

  return code.trim();
}

/**
 * Refine Canvas JS Motion Code via Copilot
 */
export async function refineMotionCodeDirectly(payload: RefineMotionPayload): Promise<string> {
  const apiKey = getEffectiveApiKey(payload.apiKey);
  if (!apiKey) {
    throw new Error('API Key Gemini tidak ditemukan! Harap masukkan API Key Gemini Anda melalui tombol "🔑 API Keys".');
  }

  const ai = new GoogleGenAI({ apiKey });
  const primaryModel = payload.selectedModel || 'gemini-3.8-flash';

  const systemPrompt = `You are an elite Motion Graphics Copilot and Canvas 2D Specialist.
Modify the provided Canvas JavaScript code according to the contributor's refinement request.
Output ONLY raw executable JavaScript code. Do NOT wrap in function or markdown backticks.`;

  const userQuery = `KODE SEBELUMNYA:
${payload.currentCode}

PERINTAH PERBAIKAN COPILOT:
"${payload.refinementPrompt}"

Durasi: ${payload.duration}s. Kembalikan HANYA kode JS yang telah diperbaiki.`;

  const parts: any[] = [];
  if (payload.referenceImageBase64) {
    const cleanBase64 = payload.referenceImageBase64.replace(/^data:[a-zA-Z0-9\/+-]+;base64,/, '');
    const effMime = detectImageMimeType(cleanBase64, 'image/png');
    parts.push({
      inlineData: {
        mimeType: effMime,
        data: cleanBase64,
      },
    });
  }
  parts.push({ text: userQuery });

  let response;
  try {
    response = await ai.models.generateContent({
      model: primaryModel,
      contents: { parts },
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
      },
    });
  } catch (err: any) {
    const isQuota = err?.message?.includes('429') || err?.message?.includes('quota') || err?.message?.includes('RESOURCE_EXHAUSTED');
    if (isQuota) {
      throw new Error('Quota API Key telah habis (429). Putar API Key berikutnya.');
    }
    const fallbackModel = primaryModel === 'gemini-3.8-flash'
      ? 'gemini-flash-latest'
      : (primaryModel === 'gemini-flash-latest' ? 'gemini-3.1-flash-lite' : 'gemini-3.8-flash');
    response = await ai.models.generateContent({
      model: fallbackModel,
      contents: { parts },
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
      },
    });
  }

  let code = (response.text || '').trim();
  if (code.startsWith('```javascript')) code = code.slice(13);
  else if (code.startsWith('```js')) code = code.slice(5);
  else if (code.startsWith('```')) code = code.slice(3);
  if (code.endsWith('```')) code = code.slice(0, -3);

  return code.trim();
}

/**
 * Smart Motion Generator with server-proxy and client-side fallback
 */
export async function smartGenerateMotionCode(payload: GenerateMotionPayload): Promise<string> {
  try {
    const response = await fetch('/api/generate-motion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && response.ok) {
      const result = await response.json();
      if (result.code) return result.code;
    }
  } catch (e) {
    console.warn('[MotionStudio] /api/generate-motion failed, using direct client:', e);
  }

  return await generateMotionCodeDirectly(payload);
}

/**
 * Smart Motion Refiner with server-proxy and client-side fallback
 */
export async function smartRefineMotionCode(payload: RefineMotionPayload): Promise<string> {
  try {
    const response = await fetch('/api/refine-motion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && response.ok) {
      const result = await response.json();
      if (result.code) return result.code;
    }
  } catch (e) {
    console.warn('[MotionStudio] /api/refine-motion failed, using direct client:', e);
  }

  return await refineMotionCodeDirectly(payload);
}

