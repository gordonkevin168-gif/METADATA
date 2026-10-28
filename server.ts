import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const execAsync = promisify(exec);

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getPort(): number {
  const portArgIdx = process.argv.indexOf('--port');
  if (portArgIdx !== -1 && process.argv[portArgIdx + 1]) {
    const parsed = parseInt(process.argv[portArgIdx + 1], 10);
    if (!isNaN(parsed) && parsed !== 8080) return parsed;
  }
  // In Cloud Run environments, process.env.PORT is 8080 (reserved for nginx proxy).
  // The Node Express / Vite app must strictly bind to port 3000.
  if (process.env.APP_PORT) {
    return parseInt(process.env.APP_PORT, 10);
  }
  if (process.env.PORT && process.env.PORT !== '8080') {
    return parseInt(process.env.PORT, 10);
  }
  return 3000;
}

const PORT = getPort();
const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

function getGeminiClient(customApiKey?: string): GoogleGenAI {
  const key = (customApiKey && typeof customApiKey === 'string' && customApiKey.trim().length > 5)
    ? customApiKey.trim()
    : process.env.GEMINI_API_KEY;

  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const defaultAi = getGeminiClient();

// Endpoint to validate a custom API key provided by the user
app.post('/api/validate-key', async (req: Request, res: Response) => {
  try {
    const { apiKey, model = 'gemini-3.8-flash' } = req.body;
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 5) {
      return res.status(400).json({ valid: false, error: 'API Key tidak boleh kosong atau terlalu pendek' });
    }

    const testAi = getGeminiClient(apiKey.trim());
    const result = await testAi.models.generateContent({
      model: model || 'gemini-3.8-flash',
      contents: 'Respond with OK',
    });

    if (result.text) {
      return res.json({ valid: true, message: 'API Key valid dan siap digunakan' });
    }
    return res.json({ valid: true });
  } catch (err: any) {
    console.error('API Key validation error:', err);
    const msg = err?.message || 'Gagal memvalidasi API Key';
    const isQuota = msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('Quota exceeded');
    return res.status(isQuota ? 429 : 400).json({
      valid: false,
      error: isQuota ? 'Quota API Key telah terlampaui (429)' : msg,
      isQuota,
    });
  }
});

const ADOBE_CATEGORY_MAP: Record<string, number> = {
  'animals': 1,
  'buildings': 2,
  'architecture': 2,
  'business': 3,
  'drinks': 4,
  'environment': 5,
  'the environment': 5,
  'states of mind': 6,
  'food': 7,
  'graphic resources': 8,
  'graphics': 8,
  'backgrounds': 8,
  'abstract': 8,
  'hobbies': 9,
  'leisure': 9,
  'industry': 10,
  'landscapes': 11,
  'lifestyle': 12,
  'people': 13,
  'plants': 14,
  'flowers': 14,
  'culture': 15,
  'religion': 15,
  'science': 16,
  'social issues': 17,
  'sports': 18,
  'technology': 19,
  'tech': 19,
  'transport': 20,
  'transportation': 20,
  'travel': 21,
};

function getAdobeCategoryId(categoryStr?: string, categoryNum?: number): number {
  if (categoryNum && categoryNum >= 1 && categoryNum <= 21) {
    return categoryNum;
  }
  if (!categoryStr) return 8; // Default Graphic Resources
  const lower = categoryStr.toLowerCase().trim();
  for (const [key, id] of Object.entries(ADOBE_CATEGORY_MAP)) {
    if (lower.includes(key)) return id;
  }
  return 8;
}

const RECOGNIZED_STOCK_COMPOUND_PHRASES = new Set([
  'copy space', 'copyspace', 'golden hour', 'blue hour', 'slow motion', 'drone shot', 'drone view',
  'real estate', 'graphic design', 'social media', 'artificial intelligence', 'machine learning',
  'deep learning', 'street food', 'flat lay', 'high angle', 'low angle', 'birds eye', 'shallow depth',
  'depth field', 'time lapse', 'color grading', 'green screen', 'b roll', 'top view', 'side view',
  'front view', 'close up', 'wide shot', 'sun set', 'data science', 'user interface', 'user experience',
  'augmented reality', 'virtual reality', 'cyber security', 'cloud computing', 'health care',
  'mental health', 'work space', 'public transport', 'solar panel', 'renewable energy', 'clean energy',
  'electric vehicle', 'fast charger', 'charging station', 'smart car', 'power level', '3d rendering',
  'motion graphic', 'explainer video', 'cv screening', 'recruitment software', 'human resources',
  'climate change', 'credit card', 'smart phone', 'digital marketing', 'e commerce', 'online shopping',
  'wireframe model', 'data protection', 'password protection', 'access control', 'two factor',
  'cyber security', 'cybersecurity', 'lock icon', 'santa hat', 'office desk', 'desk lamp',
  'holiday season', 'workplace environment', 'security monitoring', 'dashboard interface', 'secure login'
]);

const TITLE_FILLER_WORDS = new Set([
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

const VERB_TO_COMMERCIAL_NOUN: Record<string, string> = {
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

function sanitizeStockVideoTitle(rawTitle: string): string {
  if (!rawTitle) return '';
  let cleaned = rawTitle.trim();

  const prefixRegex = /^(?:(?:a|an|the)\s+)?(?:static\s+|slow\s+motion\s+|cinematic\s+|aerial\s+|drone\s+|macro\s+|close[\s-]*up\s+|timelapse\s+|panning\s+|tracking\s+)*(?:(?:4k|8k|uhd|hd|full\s+hd)\s+)?(?:video\s+shot|drone\s+shot|camera\s+shot|aerial\s+shot|video\s+clip|video\s+footage|stock\s+footage|footage|video|clip|shot)\s+of\s+/i;

  if (prefixRegex.test(cleaned)) {
    cleaned = cleaned.replace(prefixRegex, '').trim();
  }

  const explainerPrefixRegex = /^(?:(?:a|an|the)\s+)?(?:animated\s+)?(?:(?:4k|8k|uhd|hd)\s+)?(?:explainer\s+video|motion\s+graphics?\s+video)\s+(?:showing|depicting|featuring)\s+/i;
  if (explainerPrefixRegex.test(cleaned)) {
    cleaned = cleaned.replace(explainerPrefixRegex, 'Animated ').trim();
  }

  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned;
}

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

const FORMAT_AND_TECHNICAL_TERMS = new Set([
  '4k', 'uhd', 'hd', 'fps', '60fps', 'video', 'footage', 'clip', 'roll',
  'loop', 'explainer', 'broll', 'cinematic', 'horizontal', 'vertical',
  'rendering', 'render', '3d', '2d', 'vector', 'illustration', 'photo',
]);

function extractCuratedTitleConcepts(title: string) {
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

function curateStockKeywords(
  rawT1: any[],
  rawT2: any[],
  rawT3: any[],
  rawT4: any[],
  isVideo: boolean = false,
  title: string = '',
  targetCount: number = 40
) {
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
          for (const w of words) {
            const single = VERB_TO_COMMERCIAL_NOUN[w] || w;
            if (single.length > 1 && !seen.has(single)) {
              seen.add(single);
              tierResult.push(single);
            }
          }
        }
      } else {
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

  const { coreSubjectNouns } = extractCuratedTitleConcepts(title);

  // If a core subject noun was omitted by generation, insert into t1 or t3
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

  // Tier 1 (Hero Visual Subjects) remains at the front
  const combined: string[] = [...t1, ...t2, ...t3, ...t4];

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

  const finalKeywords = combined.slice(0, finalTarget);
  const finalT1 = finalKeywords.slice(0, t1Target);
  const finalT2 = finalKeywords.slice(t1Target, t1Target + t2Target);
  const finalT3 = finalKeywords.slice(t1Target + t2Target, t1Target + t2Target + t3Target);
  const finalT4 = finalKeywords.slice(t1Target + t2Target + t3Target, finalTarget);

  const singleWords = finalKeywords.filter((k) => k.split(/\s+/).length === 1);
  const compoundWords = finalKeywords.filter((k) => k.split(/\s+/).length > 1);

  const matchedCoreSubjects = coreSubjectNouns.filter((cs) =>
    finalKeywords.some((k) => k === cs || k.split(' ').includes(cs))
  );

  return {
    tier1Keywords: finalT1,
    tier2Keywords: finalT2,
    tier3Keywords: finalT3,
    tier4Keywords: finalT4,
    allKeywords: finalKeywords,
    singleWordCount: singleWords.length,
    compoundCount: compoundWords.length,
    singleWordPercentage: Math.round((singleWords.length / finalKeywords.length) * 100),
    titleMatchCount: matchedCoreSubjects.length,
    titleMatchPercentage: coreSubjectNouns.length > 0
      ? Math.round((matchedCoreSubjects.length / coreSubjectNouns.length) * 100)
      : 100,
    coreSubjectsFound: matchedCoreSubjects,
  };
}

const METADATA_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: 'The stock photo/vector/video title following [Style/Theme] + [Product Format] + [Specific Visual Elements] + [Use Case/Application] formula, strictly maximum 15 words (ideal: 10 to 15 words) in professional English. NEVER exceed 15 words.',
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
      description: 'Tier 1 (Keywords 1-10): Exactly 10 primary subject/object keywords seen directly by the eye. Strictly 1 word or maximum 2 words per keyword (mostly single words).',
    },
    tier2Keywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Tier 2 (Keywords 11-20): Exactly 10 style, mood, aesthetic, and color keywords. Strictly 1 word or maximum 2 words per keyword (mostly single words).',
    },
    tier3Keywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Tier 3 (Keywords 21-35): Exactly 15 use case, design application, and industry target keywords. Strictly 1 word or maximum 2 words per keyword (mostly single words).',
    },
    tier4Keywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Tier 4 (Keywords 36-49): Exactly 14 broad concepts, general categories, and technical stock search keywords. Strictly 1 word or maximum 2 words per keyword (mostly single words).',
    },
    allKeywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Exactly 49 total ordered keywords combining Tier 1 (10) + Tier 2 (10) + Tier 3 (15) + Tier 4 (14). Every keyword must be strictly 1 or 2 words max.',
    },
    category: {
      type: Type.STRING,
      description: 'Primary Adobe Stock category name (e.g., Graphic Resources, Technology, The Environment, Business, People, Transport, etc.)',
    },
    categoryId: {
      type: Type.INTEGER,
      description: 'Adobe Stock numeric Category ID (1: Animals, 2: Buildings/Architecture, 3: Business, 4: Drinks, 5: The Environment, 6: States of Mind, 7: Food, 8: Graphic Resources, 9: Hobbies/Leisure, 10: Industry, 11: Landscapes, 12: Lifestyle, 13: People, 14: Plants/Flowers, 15: Culture/Religion, 16: Science, 17: Social Issues, 18: Sports, 19: Technology, 20: Transport, 21: Travel)',
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
      description: 'Brief strategy summary explaining visual elements identified and why this metadata will achieve high search rank.',
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

// Helper to detect actual raster image mime type from base64 signature
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

app.post('/api/generate-metadata', async (req: Request, res: Response) => {
  try {
    const {
      imageBase64,
      mimeType = 'image/jpeg',
      fileName = 'untitled.jpg',
      customContext = '',
      targetPlatform = 'all',
      artworkType = 'auto',
      mediaType = 'image',
      targetKeywordCount: rawTargetCount,
      videoMeta,
      videoFrames,
      apiKey: bodyApiKey,
      selectedModel = 'gemini-3.8-flash',
    } = req.body;

    const targetKeywordCount = Math.max(25, Math.min(49, parseInt(String(rawTargetCount), 10) || 40));
    const customKey = bodyApiKey || (req.headers['x-gemini-api-key'] as string);
    const activeAi = getGeminiClient(customKey);
    const primaryModel = selectedModel || 'gemini-3.8-flash';

    // Clean base64 string if it contains data URI header
    const cleanBase64 = (imageBase64 && typeof imageBase64 === 'string')
      ? imageBase64.replace(/^data:[a-zA-Z0-9\/+-]+;base64,/, '').trim()
      : '';
    const hasCleanBase64 = cleanBase64.length > 50;

    // Determine accurate raster mime type (never pass application/illustrator or application/postscript to Gemini)
    const effectiveMimeType = detectImageMimeType(cleanBase64, mimeType);

    const isVideoAsset = mediaType === 'video' || artworkType === 'footage';

    let videoContextPrompt = '';
    if (isVideoAsset) {
      videoContextPrompt = `
MEDIA TYPE: STOCK FOOTAGE / VIDEO CLIP
TECHNICAL SPECS: Resolution: ${videoMeta?.resolutionLabel || '4K/HD'}, Duration: ${videoMeta?.duration ? videoMeta.duration + ' seconds' : 'Short clip'}, Aspect Ratio: ${videoMeta?.aspectRatio || '16:9 Landscape'}, Format: ${videoMeta?.format?.toUpperCase() || 'MP4'}.

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
    Contoh Perbaikan Langsung:
    ❌ SALAH: "Static 4K Video Shot of Red Santa Hat Hanging on Modern Office Desk Lamp During Christmas Holiday Season in Corporate Workplace Environment."
    ✅ BENAR: "Red Santa Hat Hanging on Modern Office Desk Lamp During Christmas Holiday Season in Corporate Workplace Environment."

    Asset Nyata Page 1 Adobe Stock (Contoh Standar Emas):
    ✅ "Animated laptop displaying password protection dashboard interface with charts and lock icon for cybersecurity monitoring."
    (Perhatikan: Langsung ke subjek aktif "Animated laptop displaying...", BUKAN "Static 4K Video Shot of laptop...", maksimal 15 kata)

- Formula Structure:
  [Visual Subject / Main Object / Scene Focus] + [Visible Motion, Interaction, or State] + [Setting, Environment & Lighting] + [Commercial Theme, Industry Context or Workflow]
- Examples of proper Page 1 video titles (strictly <= 15 words):
  * "Golden Sunset Over Mountain Valley Ridges, Aerial Panorama During Warm Evening for Travel Commercial"
  * "Roasted Espresso Coffee Beans Falling into Grinder in Slow Motion for Cafe Promo Video"
  * "Modern Corporate Office Skyline at Dusk with Busy Street Traffic for Business Presentation"

VIDEO 49 KEYWORD MANDATE:
- Integrate video terms across 4 tiers: footage, 4k, slow motion, b-roll, clip, cinematic, aerial, drone, camera, panning, realtime, loop, horizontal, motion, etc.
- Tier 1 (1-10): The exact primary visual hero subject and action moving in the frame.
- Tier 2 (11-20): Lighting, camera angle, motion speed, aesthetic mood, and color palette.
- Tier 3 (21-35): Video production use cases, documentary, advertising, broadcast, youtube, promo, social media.
- Tier 4 (36-49): Video stock tags, technical tags, and conceptual search terms.
- Every keyword must still be strictly 1 or 2 words maximum.`;
    }

    const systemPrompt = `You are a Senior Stock Contributor Strategist and Master AI Vision Specialist for Adobe Stock, Shutterstock, Freepik, and Getty Images.
Your task is to analyze the visual preview uploaded by the contributor and produce 100% commercially accurate, truthfully grounded stock metadata (Title strictly maximum 15 words, and exactly 49 Keywords).

CORE MANDATE 1: EXPERT ADOBE STOCK CURATOR CONSTITUTION (HIGH-DEMAND KEYWORDS & ZERO RAW SCRAPING):
In Adobe Stock's ranking algorithm, the Title describes the asset contextually in strictly maximum 15 words (ideal: 10 to 15 words), while Keywords are the high-converting search tags stock buyers type into the search bar.
DO NOT simply copy-paste or blindly scrape every word from the title into keywords!
Think like a veteran microstock contributor: keywords determine whether your asset lands on Page 1 or is buried in millions of files.

Study this real Adobe Stock Page 1 example carefully:
Title: "Animated laptop displaying password protection dashboard interface with charts and lock icon, representing secure login, data protection, and cybersecurity monitoring system."

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

3. TIER ARCHITECTURE:
   - Tier 1 (Pos 1-10 - CRITICAL ALGORITHMIC SEARCH WEIGHT): Primary physical visual objects seen directly in the preview + core commercial subject nouns. At least 8-9 must be strictly single words! NEVER place technical video tags ('4k', 'footage') in Tier 1!
   - Tier 2 (Pos 11-20): Visual style, aesthetics, colors, lighting, rendering technique (e.g. animated, digital, blue, modern, motion, clean).
   - Tier 3 (Pos 21-35): Industry verticals, business workflows, buyer use cases (e.g. cybersecurity, authentication, privacy, safe, software, network, access, cloud).
   - Tier 4 (Pos 36-49): Video production & technical formats ('footage', '4k', 'clip', 'animation', 'loop', 'horizontal') and broad conceptual themes ('concept', 'innovation', 'intelligence', 'virtual', 'protection').
   - RATIO: 75% to 85% strictly 1 single word. Only 15% to 25% recognized compound phrases (2 words max). ZERO 3+ word phrases. Exactly 49 keywords.

- Example A (Video - Real Page 1 Standard):
  Title: "Animated Laptop Displaying Password Protection Dashboard Interface with Charts and Lock Icon, Representing Secure Login, Data Protection, and Cybersecurity Monitoring System"
  Tier 1 Keywords (1-10): laptop, dashboard, interface, charts, lock, icon, password, screen, cybersecurity, display
  Tier 2 Keywords (11-20): animated, digital, blue, modern, clean, motion, graphic, ui, tech, minimalist
  Tier 3 Keywords (21-35): security, protection, login, monitoring, authentication, privacy, access, data, system, software, safe, cloud, network, corporate, business
  Tier 4 Keywords (36-49): footage, 4k, clip, animation, loop, horizontal, concept, innovation, intelligence, virtual, analytics, compliance, enterprise, solution

- Example B (Video - Seasonal Holiday Workplace):
  Title: "Red Santa Hat Hanging on Modern Office Desk Lamp During Christmas Holiday Season in Corporate Workplace Environment"
  Tier 1 Keywords (1-10): santa hat, hat, desk, lamp, office, workplace, christmas, holiday, celebration, decoration
  Tier 2 Keywords (11-20): red, modern, warm, indoor, cozy, interior, festive, cheerful, contemporary, clean
  Tier 3 Keywords (21-35): corporate, business, coworker, party, december, winter, season, employment, professional, greeting, event, year end, tradition, break, commercial
  Tier 4 Keywords (36-49): footage, 4k, clip, realtime, broll, horizontal, concept, happiness, joy, leisure, festive season, vacancy, quiet, peace

- Example C (Graphic / 3D Interface / Technology):
  Title: "Battery Charging Status of Electric Vehicle Interface Using DC Fast Charger from Charging Station, 3D Rendering Futuristic Fuel Power Level Indicator UI Display for EV Automotive Industry Technology"
  Tier 1 Keywords (1-10): battery, charger, station, vehicle, display, interface, indicator, screen, gauge, charging
  Tier 2 Keywords (11-20): 3d rendering, futuristic, fuel, ui, ev, automotive, industry, cyan, glowing, digital
  Tier 3 Keywords (21-35): clean energy, electricity, dashboard, eco, mobility, smart car, transport, drive, sustainable, automobile, cable, meter, electric vehicle, power level, fast charger
  Tier 4 Keywords (36-49): innovation, high tech, render, visual, commercial, isolated, concept, dark, illuminated, plug, power, energy, device, telemetry

CORE MANDATE 2: STRICT VISUAL GROUNDING (ZERO HALLUCINATIONS, NO GUESSWORK):
The contributor explicitly uploaded this visual asset preview so that the metadata accurately reflects what is in the artwork.
DO NOT guess or invent random elements. DO NOT output boilerplate or irrelevant terms.
1. VISUAL INSPECTION:
   - Identify the exact real subject(s) in the image/video frame (e.g. food, animals, plants, architecture, vehicle, festive celebration, ramadan lantern, floral motif, abstract geometry, typography, character mascot, isometric building, etc.).
   - Identify the true dominant color palette seen directly in the preview (e.g. gold, navy blue, pastel pink, emerald green, terracotta, monochrome, beige).
   - Identify the visual format and technique (e.g. ${isVideoAsset ? 'cinematic video footage, slow motion b-roll, aerial drone clip' : 'flat vector illustration, 3D clay render, realistic photo, minimalist line art, seamless pattern, badge logo, infographic, watercolor'}).
   - Identify real visual attributes (e.g. copy space, isolated on white, dark background, geometric symmetry, gradient glow, motion blur, natural light).
2. TRUTHFULNESS & RELEVANCE:
   - If there are no people in the image/video, NEVER write "person", "man", "woman", "human", "face".
   - If there is no technology or cryptocurrency, NEVER write "crypto", "blockchain", "phone", "bitcoin", "laptop".
   - If the visual depicts food/drinks, the keywords MUST be gastronomy, culinary, dining, delicious, cooking, meal, recipe, etc.
   - If the visual depicts plants/botanicals, the keywords MUST be flora, leaf, foliage, nature, botanical, branch, organic, garden, etc.
   - If the visual depicts abstract geometric waves/shapes, the keywords MUST describe abstract, geometric, curves, waves, gradients, backdrop, layout, wallpaper, etc.
3. TITLE FORMULA (Strictly maximum 15 words in professional stock English):
   - Title MUST be maximum 15 words in length (ideal: 10 to 15 words). NEVER exceed 15 words.
   - Every element in the title must accurately match what is visible in the preview.
4. 49 HIERARCHICAL KEYWORDS (Strict Adobe Stock & Microstock Ranking Order):
   CRITICAL KEYWORD RULE: In accordance with Adobe Stock contributor guidelines and search conversion algorithms:
   - 75% to 80% of all keywords (approx 37-40 of the 49 keywords) MUST BE STRICTLY 1 SINGLE WORD (e.g. "battery", "charging", "software", "recruitment", "screening", "mountain", "coffee", "sunset", "laptop", "vector", "aerial", "minimalist", "gold", "vibrant", "growth").
   - Maximum 20% to 25% (approx 9-12 keywords) may be 2 words, and ONLY for recognized fixed compound phrases (e.g. "electric vehicle", "fast charger", "charging station", "3d rendering", "copy space", "golden hour", "slow motion", "drone shot", "real estate", "social media", "flat lay", "artificial intelligence").
   - DO NOT combine generic adjective + noun into 2 words (e.g. DO NOT write "red car", write "car" and "red"; DO NOT write "modern building", write "building" and "modern").
   - Never output 3 or more words per keyword.
   - Hierarchy:
     * Tier 1 (Keywords 1-10): The exact primary objects, subjects, and main shapes visible to the eye. MUST directly match the core subject in the Title! At least 8-9 must be strictly single words!
     * Tier 2 (Keywords 11-20): The exact visual style, colors, mood, lighting, aesthetic attributes, and secondary descriptors from the Title. At least 8 must be single words!
     * Tier 3 (Keywords 21-35): Realistic commercial design applications, industries, and creative use cases relevant to THIS specific subject matter.
     * Tier 4 (Keywords 36-49): Directly related broader stock search terms, design categories, and technical terminology.
5. NO TRADEMARKS OR SPAM: No brand names (Apple, Nike, Photoshop, etc.). No repetitive keyword spam.
6. ADOBE STOCK CATEGORY: Pick the single most accurate category name and numeric Category ID (1 to 21) corresponding to what is visibly depicted:
   1: Animals, 2: Buildings/Architecture, 3: Business, 4: Drinks, 5: The Environment, 6: States of Mind, 7: Food, 8: Graphic Resources, 9: Hobbies/Leisure, 10: Industry, 11: Landscapes, 12: Lifestyle, 13: People, 14: Plants/Flowers, 15: Culture/Religion, 16: Science, 17: Social Issues, 18: Sports, 19: Technology, 20: Transport, 21: Travel.
${videoContextPrompt}
${customContext ? `CONTRIBUTOR FOCUS / CONTEXT: "${customContext}". Incorporate this context into Tier 3 (application/industry) and the Title's application part if relevant.` : ''}
${artworkType !== 'auto' ? `ARTWORK TYPE: ${artworkType}.` : ''}
${targetPlatform !== 'all' ? `TARGET PLATFORM: ${targetPlatform.toUpperCase()}` : ''}
File Name: ${fileName}
`;

    const parts: any[] = [];
    if (isVideoAsset && Array.isArray(videoFrames) && videoFrames.length > 0) {
      videoFrames.forEach((frame: any, idx: number) => {
        const fBase64 = (frame.imageBase64 || '').replace(/^data:[a-zA-Z0-9\/+-]+;base64,/, '');
        if (fBase64) {
          parts.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: fBase64,
            },
          });
          parts.push({
            text: `[Video Temporal Frame ${idx + 1} of ${videoFrames.length}]: Captured at timestamp ${frame.timestamp}s (${frame.percent}% video timeline). Position: ${frame.label}.`,
          });
        }
      });
      parts.push({
        text: `You have been provided with 3 TEMPORAL FRAMES extracted across this stock video footage clip ("${fileName}"):
- Frame 1: Beginning / establishing shot (initial subjects, lighting, composition).
- Frame 2: Midpoint / action peak (primary motion, camera angle, subject interaction).
- Frame 3: Ending / motion trajectory (motion path, atmosphere, scene resolution).

Carefully analyze the progressive visual evolution across all 3 frames:
1. Identify the camera movement (e.g. aerial drone flyover, smooth panning, tilt shot, gimbal tracking, static tripod, slow motion b-roll).
2. Identify what visible actions occur across the sequence.
3. Generate a highly commercial stock footage title (strictly maximum 15 words, ideal 10 to 15 words) and exactly 49 hierarchical keywords (1 or 2 words max each) grounded in the complete 3-frame sequence. Do not guess or invent unrelated keywords.`,
      });
    } else if (hasCleanBase64) {
      parts.push({
        inlineData: {
          mimeType: effectiveMimeType,
          data: cleanBase64,
        },
      });
      parts.push({
        text: `Examine the exact visual content of "${fileName}". Generate a commercially compelling stock Title (strictly maximum 15 words, ideal 10 to 15 words) and EXACTLY ${targetKeywordCount} hierarchical keywords (1 or 2 words max each) strictly grounded in what is visible in this preview. Do not guess or output unrelated keywords.`,
      });
    } else {
      // TEXT-ONLY CONTEXT FALLBACK (CRITICAL: Prevents 400 Bad Request error when MOV/ProRes/vector has no decoded frame)
      parts.push({
        text: `[STOCK METADATA GENERATION FROM ASSET SPECIFICATION & FILENAME]
Note: This file is a professional stock ${isVideoAsset ? 'video footage clip (MOV/ProRes)' : 'design asset'} ("${fileName}") whose preview frame could not be visually rendered.
Synthesize the subject, theme, industry context, and visual composition directly from the file name, media format, and technical details:
- File Name: "${fileName}"
- Media Type: ${isVideoAsset ? 'Stock Video Footage Clip' : 'Commercial Vector / Digital Graphic'}
${customContext ? `- Contributor Subject Notes / Context: "${customContext}"` : ''}
${videoMeta ? `- Technical Specs: Format: ${videoMeta.format?.toUpperCase() || 'MOV'}, Resolution: ${videoMeta.resolutionLabel || '4K UHD'}, Duration: ${videoMeta.duration || 15}s, Aspect Ratio: ${videoMeta.aspectRatio || '16:9 Landscape'}` : ''}
${artworkType && artworkType !== 'auto' ? `- Artwork Type: ${artworkType}` : ''}
${targetPlatform && targetPlatform !== 'all' ? `- Target Microstock Agency: ${targetPlatform.toUpperCase()}` : ''}

Generate a commercially compelling stock Title (strictly maximum 15 words in professional stock English) and EXACTLY ${targetKeywordCount} hierarchical keywords (1 or 2 words max each) following Adobe Stock Page 1 standards. Ensure 100% mutual relevance between Title and Keywords.`,
      });
    }

    const contents = { parts };

    let response;
    try {
      response = await activeAi.models.generateContent({
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
      console.warn(`Primary model ${primaryModel} vision call failed:`, modelErr?.message);
      const isQuota = modelErr?.message?.includes('429') || modelErr?.message?.includes('quota') || modelErr?.message?.includes('RESOURCE_EXHAUSTED');
      if (isQuota) {
        return res.status(429).json({
          error: 'QUOTA_EXHAUSTED',
          message: 'Quota API Key telah habis atau rate limit terlampaui (429). Putar API key berikutnya.',
        });
      }

      // Graceful fallback to another modern model
      const fallbackModel = primaryModel === 'gemini-3.8-flash'
        ? 'gemini-flash-latest'
        : (primaryModel === 'gemini-flash-latest' ? 'gemini-3.1-flash-lite' : 'gemini-3.8-flash');
      console.log(`Falling back from ${primaryModel} to ${fallbackModel}...`);
      response = await activeAi.models.generateContent({
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
    let parsedData;
    try {
      parsedData = JSON.parse(rawText);
    } catch {
      return res.status(500).json({ error: 'Failed to parse model output as JSON', raw: rawText });
    }

    let finalTitle = parsedData.title || fileName;
    if (isVideoAsset) {
      finalTitle = sanitizeStockVideoTitle(finalTitle);
    }
    finalTitle = clampTitleToMaxWords(finalTitle, 15);

    const curated = curateStockKeywords(
      parsedData.tier1Keywords,
      parsedData.tier2Keywords,
      parsedData.tier3Keywords,
      parsedData.tier4Keywords,
      isVideoAsset,
      finalTitle,
      targetKeywordCount
    );

    // Compute title word count accurately
    const words = finalTitle.trim().split(/\s+/).filter(Boolean);

    const categoryId = getAdobeCategoryId(parsedData.category, parsedData.categoryId);

    res.json({
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
      rejectionRiskScore: parsedData.rejectionRiskScore || 'low',
      reviewNotes: parsedData.reviewNotes || (isVideoAsset ? 'Optimized for 4K/HD microstock stock footage buyers.' : 'Metadata optimized for high search impression and conversion.'),
    });
  } catch (err: any) {
    console.error('Error generating metadata:', err);
    const errorMessage = err?.message || 'Unknown error during metadata generation';
    const isQuota = errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED');
    res.status(isQuota ? 429 : 500).json({
      error: isQuota ? 'QUOTA_EXHAUSTED' : errorMessage,
      message: errorMessage,
    });
  }
});

// Endpoint for refining or modifying metadata based on user feedback
app.post('/api/refine-metadata', async (req: Request, res: Response) => {
  try {
    const {
      currentTitle,
      currentKeywords,
      refinementInstruction,
      fileName = 'image.jpg',
      imageBase64,
      mimeType = 'image/jpeg',
      apiKey: bodyApiKey,
      selectedModel = 'gemini-3.8-flash',
    } = req.body;

    const customKey = bodyApiKey || (req.headers['x-gemini-api-key'] as string);
    const activeAi = getGeminiClient(customKey);
    const primaryModel = selectedModel || 'gemini-3.8-flash';

    if (!refinementInstruction) {
      return res.status(400).json({ error: 'Refinement instruction is required' });
    }

    const systemPrompt = `You are a Senior Stock Contributor Strategist and Master AI Vision Specialist for Adobe Stock.
Refine the provided microstock metadata according to the contributor's instruction while maintaining the strict formula:
1. Title must be strictly maximum 15 words (ideal: 10 to 15 words) following: [Style/Theme] + [Product Format] + [Specific Visual Elements] + [Use Case/Application]
2. CRITICAL MUTUAL RELEVANCE (TITLE <-> KEYWORDS):
   Every core noun, subject, action, context, and key adjective present in the TITLE MUST directly appear in the keywords (particularly in Tier 1 and Tier 2).
   Zero disconnected or filler keywords.
3. Keywords must be exactly 49 unique keywords in 4 tiers:
   - Tier 1 (1-10): Main object/subject visible in the image, directly matching the core subject of the Title (at least 8 single words)
   - Tier 2 (11-20): Style, mood, & color, matching Title descriptors (at least 8 single words)
   - Tier 3 (21-35): Use case, application, target industry
   - Tier 4 (36-49): Broad concepts, categories, technical
4. CRITICAL KEYWORD MANDATE: 75% to 80% of keywords MUST be strictly 1 single word. Maximum 20% to 25% may be 2 words for recognized fixed compound phrases (e.g. electric vehicle, fast charger, 3d rendering, copy space, golden hour, slow motion, drone shot). Never output 3 or more words per keyword.
No brand names, no spam. Stay 100% truthful to the visual asset.`;

    const userText = `Current Title: "${currentTitle}"
Current Keywords (${(currentKeywords || []).length}): ${(currentKeywords || []).join(', ')}
Contributor Refinement Request: "${refinementInstruction}"
File Name: ${fileName}

Please update the title (strictly maximum 15 words) and all 49 keywords (1-2 words max each) strictly following the requested changes while maintaining 100% mutual relevance between Title and Keywords.`;

    const parts: any[] = [];
    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9\/+-]+;base64,/, '');
      const effMime = detectImageMimeType(cleanBase64, mimeType);
      parts.push({
        inlineData: {
          mimeType: effMime,
          data: cleanBase64,
        },
      });
    }
    parts.push({ text: userText });

    let response;
    try {
      response = await activeAi.models.generateContent({
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
        return res.status(429).json({
          error: 'QUOTA_EXHAUSTED',
          message: 'Quota API Key telah habis (429).',
        });
      }

      const fallbackModel = primaryModel === 'gemini-3.8-flash'
        ? 'gemini-flash-latest'
        : (primaryModel === 'gemini-flash-latest' ? 'gemini-3.1-flash-lite' : 'gemini-3.8-flash');
      console.log(`Refine falling back from ${primaryModel} to ${fallbackModel}...`);
      response = await activeAi.models.generateContent({
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

    const curated = curateStockKeywords(
      parsedData.tier1Keywords,
      parsedData.tier2Keywords,
      parsedData.tier3Keywords,
      parsedData.tier4Keywords,
      isVideoAsset,
      finalTitle
    );

    const categoryId = getAdobeCategoryId(parsedData.category, parsedData.categoryId);

    res.json({
      fileName,
      title: finalTitle,
      titleWordCount: words.length,
      breakdown: parsedData.breakdown || {},
      tier1Keywords: curated.tier1Keywords,
      tier2Keywords: curated.tier2Keywords,
      tier3Keywords: curated.tier3Keywords,
      tier4Keywords: curated.tier4Keywords,
      allKeywords: curated.allKeywords,
      category: parsedData.category || 'Graphic Resources',
      categoryId,
      secondaryCategory: parsedData.secondaryCategory || 'Abstract',
      rejectionRiskScore: parsedData.rejectionRiskScore || 'low',
      reviewNotes: parsedData.reviewNotes || 'Metadata successfully updated.',
    });
  } catch (err: unknown) {
    console.error('Error refining metadata:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error during refinement';
    res.status(500).json({ error: errorMessage });
  }
});

// Motion Studio Canvas Code Generator endpoint
app.post('/api/generate-motion', async (req: Request, res: Response) => {
  try {
    const { prompt, duration = 15, bgMode = 'transparent', referenceImageBase64, apiKey, selectedModel } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY;
    if (!effectiveApiKey) {
      return res.status(400).json({ error: 'GEMINI_API_KEY is not configured' });
    }

    const activeAi = new GoogleGenAI({ apiKey: effectiveApiKey });
    const model = selectedModel || 'gemini-3.8-flash';

    const bgRule = bgMode === 'custom'
      ? 'DIIZINKAN merender background artistik kustom sendiri di dalam kode.'
      : 'DILARANG merender background warna solid di dalam kode. Biarkan area dasar transparan (Alpha Channel) agar engine dapat mengatur background solid/green-screen secara dinamis.';

    const systemPrompt = `You are an elite Motion Graphics Designer and JavaScript HTML5 Canvas Animation Specialist for Anime, 3D, VFX, and Microstock Video clips.
Your task is to generate a PURE, HIGH-PERFORMANCE Canvas 2D API code snippet.

Execution Environment & Injected Variables:
1. \`ctx\` (CanvasRenderingContext2D instance)
2. \`t\` (Float representing animation time in seconds, e.g. 0.00, 1.25, 14.90)
3. \`opts\` ({ width: 1920, height: 1080 } representing fixed 16:9 Landscape resolution)

STRICT CODING RULES:
1. Output ONLY the raw JavaScript execution snippet. NEVER wrap in a function declaration.
2. NEVER output markdown code blocks or backticks (\`\`\`javascript or \`\`\`).
3. Always wrap code within a block scope \`ctx.save(); { const { width, height } = opts; const cx = width / 2; const cy = height / 2; ... } ctx.restore();\`.
4. Create vibrant, fluid, professional animations (anime 3D cel-shaded, isometric, sci-fi HUD, neon laser glow, smooth sin/cos interpolation, shadows, particle loops).
5. Ensure animations loop seamlessly or evolve smoothly over time \`t\`.
6. ${bgRule}
7. Use pure standard Canvas 2D methods.`;

    const parts: any[] = [];
    if (referenceImageBase64) {
      const cleanBase64 = referenceImageBase64.replace(/^data:[a-zA-Z0-9\/+-]+;base64,/, '');
      const effMime = detectImageMimeType(cleanBase64, 'image/png');
      parts.push({
        inlineData: {
          mimeType: effMime,
          data: cleanBase64,
        },
      });
      parts.push({
        text: `Analyze this reference artwork. Create a high-end HTML5 Canvas 2D animation inspired by this visual style and composition with instruction: "${prompt}". Target duration: ${duration} seconds.`,
      });
    } else {
      parts.push({
        text: `Create a high-end HTML5 Canvas 2D animation with instruction: "${prompt}". Target duration: ${duration} seconds.`,
      });
    }

    const response = await activeAi.models.generateContent({
      model,
      contents: { parts },
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.25,
      },
    });

    let code = (response.text || '').trim();
    if (code.startsWith('```javascript')) code = code.slice(13);
    else if (code.startsWith('```js')) code = code.slice(5);
    else if (code.startsWith('```')) code = code.slice(3);
    if (code.endsWith('```')) code = code.slice(0, -3);

    res.json({ code: code.trim() });
  } catch (err: any) {
    console.error('Error generating motion:', err);
    res.status(500).json({ error: err.message || 'Error generating motion code' });
  }
});

// Motion Studio Copilot Refinement endpoint
app.post('/api/refine-motion', async (req: Request, res: Response) => {
  try {
    const { currentCode, refinementPrompt, duration = 15, referenceImageBase64, apiKey, selectedModel } = req.body;
    if (!currentCode || !refinementPrompt) {
      return res.status(400).json({ error: 'currentCode and refinementPrompt are required' });
    }

    const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY;
    if (!effectiveApiKey) {
      return res.status(400).json({ error: 'GEMINI_API_KEY is not configured' });
    }

    const activeAi = new GoogleGenAI({ apiKey: effectiveApiKey });
    const model = selectedModel || 'gemini-3.8-flash';

    const systemPrompt = `You are an elite Motion Graphics Copilot and Canvas 2D Specialist.
Modify the provided Canvas JavaScript code according to the contributor's refinement request.
Output ONLY raw executable JavaScript code. Do NOT wrap in function or markdown backticks.`;

    const userQuery = `KODE SEBELUMNYA:
${currentCode}

PERINTAH PERBAIKAN COPILOT:
"${refinementPrompt}"

Durasi: ${duration}s. Kembalikan HANYA kode JS yang telah diperbaiki.`;

    const parts: any[] = [];
    if (referenceImageBase64) {
      const cleanBase64 = referenceImageBase64.replace(/^data:[a-zA-Z0-9\/+-]+;base64,/, '');
      const effMime = detectImageMimeType(cleanBase64, 'image/png');
      parts.push({
        inlineData: {
          mimeType: effMime,
          data: cleanBase64,
        },
      });
    }
    parts.push({ text: userQuery });

    const response = await activeAi.models.generateContent({
      model,
      contents: { parts },
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
      },
    });

    let code = (response.text || '').trim();
    if (code.startsWith('```javascript')) code = code.slice(13);
    else if (code.startsWith('```js')) code = code.slice(5);
    else if (code.startsWith('```')) code = code.slice(3);
    if (code.endsWith('```')) code = code.slice(0, -3);

    res.json({ code: code.trim() });
  } catch (err: any) {
    console.error('Error refining motion:', err);
    res.status(500).json({ error: err.message || 'Error refining motion code' });
  }
});

// BatchImage Pro AI Image Generator endpoint
app.post('/api/generate-image', async (req: Request, res: Response) => {
  try {
    const { prompt, aspectRatio = '1:1', apiKey, selectedModel } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY;
    if (!effectiveApiKey) {
      return res.status(400).json({ error: 'GEMINI_API_KEY is not configured' });
    }

    const activeAi = new GoogleGenAI({ apiKey: effectiveApiKey });
    const model = selectedModel || 'gemini-3.1-flash-lite-image';

    // 1. Try Imagen 3 first
    try {
      const imgRes = await activeAi.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt,
        config: {
          numberOfImages: 1,
          aspectRatio: (aspectRatio === '16:9' || aspectRatio === '9:16' || aspectRatio === '4:3' || aspectRatio === '3:4') ? aspectRatio : '1:1',
          outputMimeType: 'image/jpeg',
        },
      });
      const b64 = imgRes?.generatedImages?.[0]?.image?.imageBytes;
      if (b64) {
        return res.json({ imageUrl: `data:image/jpeg;base64,${b64}` });
      }
    } catch (imagenErr) {
      // Fallback to generateContent image models
    }

    let response;
    try {
      response = await activeAi.models.generateContent({
        model,
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio || '1:1',
          },
        },
      });
    } catch (modelErr: any) {
      // Fallback model
      const fallbackModel = 'gemini-2.5-flash';
      response = await activeAi.models.generateContent({
        model: fallbackModel,
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio || '1:1',
          },
        },
      });
    }

    const candidate = response?.candidates?.[0];
    const part = candidate?.content?.parts?.find((p: any) => p.inlineData);

    if (part && part.inlineData) {
      const mime = part.inlineData.mimeType || 'image/png';
      const dataUrl = `data:${mime};base64,${part.inlineData.data}`;
      return res.json({ imageUrl: dataUrl });
    }

    throw new Error('Gagal mendapatkan gambar dari AI (tidak ada gambar pada respons).');
  } catch (err: any) {
    console.error('Error generating image in server:', err);
    res.status(500).json({ error: err.message || 'Error generating image' });
  }
});

// High-fidelity vector rendering endpoint for EPS and AI files
app.post('/api/render-vector', async (req: Request, res: Response) => {
  try {
    const { fileBase64, fileName } = req.body;
    if (!fileBase64) {
      return res.status(400).json({ error: 'fileBase64 is required' });
    }

    const cleanBase64 = fileBase64.replace(/^data:[a-zA-Z0-9\/+-]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const ext = (fileName || 'file.eps').toLowerCase().split('.').pop() || 'eps';
    const isAi = ext === 'ai';
    const isEps = ext === 'eps';

    const tmpId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const inExt = isAi ? 'ai' : 'eps';
    const inPath = path.join('/tmp', `vector_${tmpId}.${inExt}`);
    const outPath = path.join('/tmp', `vector_${tmpId}.png`);

    await fs.promises.writeFile(inPath, buffer);

    try {
      if (isAi) {
        // Render Illustrator AI (PDF-based) with CropBox to preserve exact artboard dimensions
        await execAsync(
          `gs -dSAFER -dBATCH -dNOPAUSE -dFirstPage=1 -dLastPage=1 -dUseCropBox -dTextAlphaBits=4 -dGraphicsAlphaBits=4 -sDEVICE=png16m -r150 -sOutputFile="${outPath}" "${inPath}"`,
          { timeout: 15000 }
        );
      } else {
        // Render EPS using EPSCrop to preserve exact BoundingBox
        try {
          await execAsync(
            `gs -dSAFER -dBATCH -dNOPAUSE -dEPSCrop -dTextAlphaBits=4 -dGraphicsAlphaBits=4 -sDEVICE=png16m -r150 -sOutputFile="${outPath}" "${inPath}"`,
            { timeout: 15000 }
          );
        } catch (epsErr) {
          // If direct failed (e.g. non-standard DOS EPS header), check for DOS header and strip if present
          if (
            buffer.length > 30 &&
            (buffer.readUInt32BE(0) === 0xc5d0d3c6 || buffer.readUInt32LE(0) === 0xc6d3d0c5)
          ) {
            const psStart = buffer.readUInt32LE(4);
            const psLen = buffer.readUInt32LE(8);
            if (psStart > 0 && psLen > 0 && psStart + psLen <= buffer.length) {
              const strippedPath = path.join('/tmp', `stripped_${tmpId}.eps`);
              await fs.promises.writeFile(strippedPath, buffer.subarray(psStart, psStart + psLen));
              try {
                await execAsync(
                  `gs -dSAFER -dBATCH -dNOPAUSE -dEPSCrop -dTextAlphaBits=4 -dGraphicsAlphaBits=4 -sDEVICE=png16m -r150 -sOutputFile="${outPath}" "${strippedPath}"`,
                  { timeout: 15000 }
                );
              } finally {
                if (fs.existsSync(strippedPath)) await fs.promises.unlink(strippedPath).catch(() => {});
              }
            } else {
              throw epsErr;
            }
          } else {
            // Fallback without EPSCrop flag
            await execAsync(
              `gs -dSAFER -dBATCH -dNOPAUSE -dTextAlphaBits=4 -dGraphicsAlphaBits=4 -sDEVICE=png16m -r150 -sOutputFile="${outPath}" "${inPath}"`,
              { timeout: 15000 }
            );
          }
        }
      }

      if (fs.existsSync(outPath)) {
        const pngBuf = await fs.promises.readFile(outPath);
        const pngBase64 = pngBuf.toString('base64');
        return res.json({
          success: true,
          previewUrl: `data:image/png;base64,${pngBase64}`,
          imageBase64: pngBase64,
          source: isAi ? 'gs_ai_render' : 'gs_eps_render',
        });
      } else {
        return res.status(422).json({ error: 'Could not generate vector preview' });
      }
    } finally {
      if (fs.existsSync(inPath)) await fs.promises.unlink(inPath).catch(() => {});
      if (fs.existsSync(outPath)) await fs.promises.unlink(outPath).catch(() => {});
    }
  } catch (err: unknown) {
    console.error('Vector rendering error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Render failed' });
  }
});

async function start() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`C46u5 Studio server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
});
