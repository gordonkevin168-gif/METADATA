import { GoogleGenAI, Type } from '@google/genai';
import { GeminiModelId, PlatformPreset, MetadataBreakdown } from '../types';

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
  apiKey?: string;
  selectedModel?: GeminiModelId;
}

export interface MetadataResult {
  fileName: string;
  title: string;
  titleWordCount: number;
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
      description: 'The stock title following [Style/Theme] + [Product Format] + [Specific Visual Elements] + [Use Case/Application] formula, strictly 15 to 25 words in professional English.',
    },
    titleWordCount: {
      type: Type.INTEGER,
      description: 'Number of words in the title, must be between 15 and 25.',
    },
    breakdown: {
      type: Type.OBJECT,
      properties: {
        styleTheme: { type: Type.STRING, description: 'Style or theme component (e.g. Modern Minimalist, Vibrant Cyberpunk, Elegant Corporate)' },
        productFormat: { type: Type.STRING, description: 'Format component (e.g. Vector Illustration, 3D Render Banner, Flyer Template, Background Texture)' },
        visualElements: { type: Type.STRING, description: 'Specific visual elements (e.g. geometric gradients, golden leaves, neon glowing grid)' },
        useCase: { type: Type.STRING, description: 'Application or target use case (e.g. for marketing campaign, website landing page, social media poster)' },
      },
      required: ['styleTheme', 'productFormat', 'visualElements', 'useCase'],
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

function normalizeKeywords(arr: any[]): string[] {
  if (!Array.isArray(arr)) return [];
  const res: string[] = [];
  for (const raw of arr) {
    if (!raw) continue;
    const cleaned = String(raw).trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '');
    const words = cleaned.split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;
    if (words.length <= 2) {
      res.push(cleaned);
    } else {
      for (const w of words) {
        if (w.length > 1) res.push(w);
      }
    }
  }
  return res;
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
  const cleanBase64 = payload.imageBase64.replace(/^data:[a-zA-Z0-9\/+-]+;base64,/, '');
  const effectiveMimeType = detectImageMimeType(cleanBase64, payload.mimeType);
  const isVideoAsset = payload.mediaType === 'video' || payload.artworkType === 'footage';

  let videoContextPrompt = '';
  if (isVideoAsset) {
    videoContextPrompt = `
MEDIA TYPE: STOCK FOOTAGE / VIDEO CLIP
TECHNICAL SPECS: Resolution: ${payload.videoMeta?.resolutionLabel || '4K/HD'}, Duration: ${payload.videoMeta?.duration ? payload.videoMeta.duration + ' seconds' : 'Short clip'}, Aspect Ratio: ${payload.videoMeta?.aspectRatio || '16:9 Landscape'}, Format: ${payload.videoMeta?.format?.toUpperCase() || 'MP4'}.
VIDEO TITLE FORMULA (Strictly 15 to 25 words in professional stock English):
- Pattern: [Camera Motion/Pacing] + [Stock Footage/Video Format] + [Exact Visible Actions, Subjects & Environment] + [Commercial/B-Roll Use Case]
VIDEO 49 KEYWORD MANDATE:
- Integrate video terms across 4 tiers: footage, 4k, slow motion, b-roll, clip, cinematic, aerial, drone, camera, panning, realtime, loop, horizontal, motion, etc.
- Tier 1 (1-10): The exact primary subject and action moving in the frame.
- Tier 2 (11-20): Lighting, camera angle, motion speed, aesthetic mood, and color palette.
- Tier 3 (21-35): Video production use cases, documentary, advertising, broadcast, youtube, promo, social media.
- Tier 4 (36-49): Video stock tags, technical tags, and conceptual search terms.
- Every keyword must still be strictly 1 or 2 words maximum.`;
  }

  const systemPrompt = `You are a Senior Stock Contributor Strategist and Master AI Vision Specialist for Adobe Stock, Shutterstock, Freepik, and Getty Images.
Your task is to analyze the visual preview uploaded by the contributor and produce 100% commercially accurate, truthfully grounded stock metadata (Title and exactly 49 Keywords).

CORE MANDATE - STRICT VISUAL GROUNDING (ZERO HALLUCINATIONS, NO GUESSWORK):
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
3. TITLE FORMULA (Strictly 15 to 25 words in professional stock English):
   - Title MUST be between 15 and 25 words in length.
   - Every element in the title must accurately match what is visible in the preview.
4. 49 HIERARCHICAL KEYWORDS (Strict Adobe Stock & Microstock Ranking Order):
   - Each keyword must be strictly 1 or 2 words maximum (prefer concise single words).
   - Never output 3 or more words per keyword.
   - Hierarchy:
     * Tier 1 (Keywords 1-10): Exact primary objects, subjects, and main shapes visible.
     * Tier 2 (Keywords 11-20): Exact visual style, colors, mood, lighting, aesthetic attributes.
     * Tier 3 (Keywords 21-35): Realistic commercial design applications, industries, creative use cases.
     * Tier 4 (Keywords 36-49): Directly related broader stock search terms, categories, technical terms.
5. NO TRADEMARKS OR SPAM: No brand names (Apple, Nike, Photoshop, etc.).
6. ADOBE STOCK CATEGORY: Pick the single most accurate category name and numeric Category ID (1 to 21).
${videoContextPrompt}
${payload.customContext ? `CONTRIBUTOR FOCUS / CONTEXT: "${payload.customContext}". Incorporate this context into Tier 3 and the Title's application part if relevant.` : ''}
${payload.artworkType && payload.artworkType !== 'auto' ? `ARTWORK TYPE: ${payload.artworkType}.` : ''}
${payload.targetPlatform && payload.targetPlatform !== 'all' ? `TARGET PLATFORM: ${payload.targetPlatform.toUpperCase()}` : ''}
File Name: ${fileName}
`;

  const contents = {
    parts: [
      {
        inlineData: {
          mimeType: effectiveMimeType,
          data: cleanBase64,
        },
      },
      {
        text: `Examine the exact visual content of this ${isVideoAsset ? 'video footage representative frame' : 'image preview'} "${fileName}". Generate a commercially compelling, 100% relevant stock Title (15-25 words) and exactly 49 hierarchical keywords (1 or 2 words max each) strictly grounded in what is visible in this preview. Do not guess or output unrelated keywords.`,
      },
    ],
  };

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

  const words = (parsedData.title || '').trim().split(/\s+/).filter(Boolean);

  const cleanT1 = normalizeKeywords(parsedData.tier1Keywords);
  const cleanT2 = normalizeKeywords(parsedData.tier2Keywords);
  const cleanT3 = normalizeKeywords(parsedData.tier3Keywords);
  const cleanT4 = normalizeKeywords(parsedData.tier4Keywords);

  const seen = new Set<string>();
  const filterUnique = (arr: string[]): string[] => {
    const out: string[] = [];
    for (const kw of arr) {
      if (!seen.has(kw)) {
        seen.add(kw);
        out.push(kw);
      }
    }
    return out;
  };

  const uniqueT1 = filterUnique(cleanT1);
  const uniqueT2 = filterUnique(cleanT2);
  const uniqueT3 = filterUnique(cleanT3);
  const uniqueT4 = filterUnique(cleanT4);

  const combined = [...uniqueT1, ...uniqueT2, ...uniqueT3, ...uniqueT4];

  // If missing keywords to reach 49, synthesize truthful contextual keywords
  if (combined.length < 49) {
    const fillers = [
      isVideoAsset ? 'video footage' : 'stock illustration',
      isVideoAsset ? '4k clip' : 'commercial vector',
      isVideoAsset ? 'cinematic b-roll' : 'graphic design',
      isVideoAsset ? 'motion' : 'digital art',
      'isolated',
      'creative',
      'modern',
      'background',
      'concept',
      'high resolution',
      'professional',
      'visual element',
      'template',
      'layout',
      'contemporary',
      'presentation',
      'minimalist',
      'editorial',
      'dynamic',
      'composition',
      'backdrop',
      'wallpaper',
      'banner',
      'marketing',
      'advertising',
      'content creation',
    ];
    for (const f of fillers) {
      if (combined.length >= 49) break;
      const cleaned = f.toLowerCase().trim();
      if (!seen.has(cleaned)) {
        seen.add(cleaned);
        combined.push(cleaned);
        uniqueT4.push(cleaned);
      }
    }
  }

  const finalKeywords = combined.slice(0, 49);
  const categoryId = getAdobeCategoryId(parsedData.category, parsedData.categoryId);

  const riskScore: 'low' | 'medium' | 'high' =
    parsedData.rejectionRiskScore === 'high' || parsedData.rejectionRiskScore === 'medium'
      ? parsedData.rejectionRiskScore
      : 'low';

  return {
    fileName,
    title: parsedData.title || fileName,
    titleWordCount: words.length,
    breakdown: {
      styleTheme: parsedData.breakdown?.styleTheme || 'Modern Commercial',
      productFormat: parsedData.breakdown?.productFormat || (isVideoAsset ? 'Stock Footage' : 'Vector Illustration'),
      visualElements: parsedData.breakdown?.visualElements || 'Detailed visual composition',
      useCase: parsedData.breakdown?.useCase || 'Commercial stock design and marketing',
    },
    tier1Keywords: uniqueT1.slice(0, 10),
    tier2Keywords: uniqueT2.slice(0, 10),
    tier3Keywords: uniqueT3.slice(0, 15),
    tier4Keywords: uniqueT4.slice(0, 14),
    allKeywords: finalKeywords,
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

  const systemPrompt = `You are a Senior Stock Contributor Strategist and Master AI Vision Specialist.
Refine the provided microstock metadata according to the contributor's instruction while maintaining the strict formula:
1. Title must be 15-25 words following: [Style/Theme] + [Product Format] + [Specific Visual Elements] + [Use Case/Application]
2. Keywords must be exactly 49 unique keywords in 4 tiers:
   - Tier 1 (1-10): Main object/subject visible in the image
   - Tier 2 (11-20): Style, mood, & color
   - Tier 3 (21-35): Use case, application, target industry
   - Tier 4 (36-49): Broad concepts, categories, technical
CRITICAL KEYWORD RULE: Each keyword must strictly be 1 or 2 words maximum (prefer concise single words).
No brand names, no spam. Stay 100% truthful to the visual asset.`;

  const userText = `Current Title: "${payload.currentTitle}"
Current Keywords (${(payload.currentKeywords || []).length}): ${(payload.currentKeywords || []).join(', ')}
Contributor Refinement Request: "${payload.refinementInstruction}"
File Name: ${fileName}

Please update the title (15-25 words) and all 49 keywords (1-2 words max each) strictly following the requested changes while maintaining truthful visual relevance.`;

  const parts: any[] = [];
  if (payload.imageBase64) {
    const cleanBase64 = payload.imageBase64.replace(/^data:[a-zA-Z0-9\/+-]+;base64,/, '');
    const effMime = detectImageMimeType(cleanBase64, payload.mimeType);
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
  const words = (parsedData.title || '').trim().split(/\s+/).filter(Boolean);

  const cleanT1 = normalizeKeywords(parsedData.tier1Keywords);
  const cleanT2 = normalizeKeywords(parsedData.tier2Keywords);
  const cleanT3 = normalizeKeywords(parsedData.tier3Keywords);
  const cleanT4 = normalizeKeywords(parsedData.tier4Keywords);

  const seen = new Set<string>();
  const filterUnique = (arr: string[]): string[] => {
    const out: string[] = [];
    for (const kw of arr) {
      if (!seen.has(kw)) {
        seen.add(kw);
        out.push(kw);
      }
    }
    return out;
  };

  const uniqueT1 = filterUnique(cleanT1);
  const uniqueT2 = filterUnique(cleanT2);
  const uniqueT3 = filterUnique(cleanT3);
  const uniqueT4 = filterUnique(cleanT4);
  const combined = [...uniqueT1, ...uniqueT2, ...uniqueT3, ...uniqueT4].slice(0, 49);

  const riskScore: 'low' | 'medium' | 'high' =
    parsedData.rejectionRiskScore === 'high' || parsedData.rejectionRiskScore === 'medium'
      ? parsedData.rejectionRiskScore
      : 'low';

  return {
    fileName,
    title: parsedData.title || fileName,
    titleWordCount: words.length,
    breakdown: {
      styleTheme: parsedData.breakdown?.styleTheme || 'Modern Commercial',
      productFormat: parsedData.breakdown?.productFormat || 'Stock Illustration',
      visualElements: parsedData.breakdown?.visualElements || 'Detailed visual composition',
      useCase: parsedData.breakdown?.useCase || 'Commercial stock design and marketing',
    },
    tier1Keywords: uniqueT1.slice(0, 10),
    tier2Keywords: uniqueT2.slice(0, 10),
    tier3Keywords: uniqueT3.slice(0, 15),
    tier4Keywords: uniqueT4.slice(0, 14),
    allKeywords: combined,
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
