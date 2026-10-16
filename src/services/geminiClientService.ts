import { GoogleGenAI, Type } from '@google/genai';
import { GeminiModelId, PlatformPreset, VideoMetadata } from '../types';

export interface GenerateMetadataClientParams {
  imageBase64: string;
  mimeType?: string;
  fileName?: string;
  customContext?: string;
  targetPlatform?: PlatformPreset;
  artworkType?: string;
  mediaType?: 'image' | 'vector' | 'video';
  videoMeta?: VideoMetadata;
  apiKey: string;
  selectedModel?: GeminiModelId;
}

export interface RefineMetadataClientParams {
  currentTitle?: string;
  currentKeywords?: string[];
  refinementInstruction: string;
  fileName?: string;
  imageBase64?: string;
  mimeType?: string;
  apiKey: string;
  selectedModel?: GeminiModelId;
}

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
      description: 'The stock photo/vector/video title following [Style/Theme] + [Product Format] + [Specific Visual Elements] + [Use Case/Application] formula, strictly 15 to 25 words in professional English.',
    },
    titleWordCount: {
      type: Type.INTEGER,
      description: 'Number of words in the title, must be between 15 and 25.',
    },
    breakdown: {
      type: Type.OBJECT,
      properties: {
        styleTheme: { type: Type.STRING, description: 'Style or theme component' },
        productFormat: { type: Type.STRING, description: 'Format component' },
        visualElements: { type: Type.STRING, description: 'Specific visual elements' },
        useCase: { type: Type.STRING, description: 'Application or target use case' },
      },
      required: ['styleTheme', 'productFormat', 'visualElements', 'useCase'],
    },
    tier1Keywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Tier 1 (Keywords 1-10): Exactly 10 primary subject/object keywords seen directly by the eye. Strictly 1 word or maximum 2 words per keyword.',
    },
    tier2Keywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Tier 2 (Keywords 11-20): Exactly 10 style, mood, aesthetic, and color keywords. Strictly 1 word or maximum 2 words per keyword.',
    },
    tier3Keywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Tier 3 (Keywords 21-35): Exactly 15 use case, design application, and industry target keywords. Strictly 1 word or maximum 2 words per keyword.',
    },
    tier4Keywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Tier 4 (Keywords 36-49): Exactly 14 broad concepts, general categories, and technical stock search keywords. Strictly 1 word or maximum 2 words per keyword.',
    },
    allKeywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Exactly 49 total ordered keywords combining Tier 1 (10) + Tier 2 (10) + Tier 3 (15) + Tier 4 (14). Every keyword must be strictly 1 or 2 words max.',
    },
    category: {
      type: Type.STRING,
      description: 'Primary Adobe Stock category name.',
    },
    categoryId: {
      type: Type.INTEGER,
      description: 'Adobe Stock numeric Category ID (1 to 21).',
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
      description: 'Brief strategy summary explaining visual elements identified.',
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

export async function generateMetadataClientSide(params: GenerateMetadataClientParams) {
  const {
    imageBase64,
    mimeType = 'image/jpeg',
    fileName = 'untitled.jpg',
    customContext = '',
    targetPlatform = 'all',
    artworkType = 'auto',
    mediaType = 'image',
    videoMeta,
    apiKey,
    selectedModel = 'gemini-3.8-flash',
  } = params;

  if (!apiKey || apiKey.trim().length < 5) {
    throw new Error('API Key Gemini diperlukan untuk pemrosesan langsung di Netlify.');
  }

  const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9\/+-]+;base64,/, '');
  const effectiveMimeType = detectImageMimeType(cleanBase64, mimeType);
  const isVideoAsset = mediaType === 'video' || artworkType === 'footage';

  let videoContextPrompt = '';
  if (isVideoAsset) {
    videoContextPrompt = `
MEDIA TYPE: STOCK FOOTAGE / VIDEO CLIP
TECHNICAL SPECS: Resolution: ${videoMeta?.resolutionLabel || '4K/HD'}, Duration: ${videoMeta?.duration ? videoMeta.duration + ' seconds' : 'Short clip'}, Aspect Ratio: ${videoMeta?.aspectRatio || '16:9 Landscape'}, Format: ${videoMeta?.format?.toUpperCase() || 'MP4'}.
VIDEO TITLE FORMULA (Strictly 15 to 25 words in professional stock English):
- Pattern: [Camera Motion/Pacing] + [Stock Footage/Video Format] + [Exact Visible Actions, Subjects & Environment] + [Commercial/B-Roll Use Case]
VIDEO 49 KEYWORD MANDATE:
- Integrate essential microstock video search keywords across the 4 tiers:
  * Video terms: footage, 4k, slow motion, b-roll, clip, cinematic, aerial, drone, camera, panning, realtime, loop, horizontal, motion, etc.
- Every keyword must still be strictly 1 or 2 words maximum.`;
  }

  const systemPrompt = `You are a Senior Stock Contributor Strategist and Master AI Vision Specialist for Adobe Stock, Shutterstock, Freepik, and Getty Images.
Your task is to analyze the visual preview uploaded by the contributor and produce 100% commercially accurate, truthfully grounded stock metadata (Title and exactly 49 Keywords).

CORE MANDATE - STRICT VISUAL GROUNDING (ZERO HALLUCINATIONS, NO GUESSWORK):
The contributor explicitly uploaded this visual asset preview so that the metadata accurately reflects what is in the artwork.
DO NOT guess or invent random elements. DO NOT output boilerplate or irrelevant terms.
1. VISUAL INSPECTION:
   - Identify the exact real subject(s) in the image/video frame.
   - Identify the true dominant color palette seen directly in the preview.
   - Identify the visual format and technique.
2. TRUTHFULNESS & RELEVANCE:
   - If there are no people, NEVER write "person", "man", "woman", "human".
   - If there is no technology or crypto, NEVER write "crypto", "blockchain", "phone", "bitcoin".
3. TITLE FORMULA (Strictly 15 to 25 words in professional stock English):
   - Title MUST be between 15 and 25 words in length.
4. 49 HIERARCHICAL KEYWORDS (Strict Adobe Stock & Microstock Ranking Order):
   - Each keyword must be strictly 1 or 2 words maximum.
   - Tier 1 (1-10): Objects/subjects visible.
   - Tier 2 (11-20): Style, mood, lighting, color.
   - Tier 3 (21-35): Design application, industries, use cases.
   - Tier 4 (36-49): Broader concepts and technical terms.
5. NO TRADEMARKS OR SPAM: No brand names.
6. ADOBE STOCK CATEGORY: Pick accurate category name and numeric Category ID (1 to 21).
${videoContextPrompt}
${customContext ? `CONTRIBUTOR FOCUS / CONTEXT: "${customContext}". Incorporate into Tier 3 and Title.` : ''}
${artworkType !== 'auto' ? `ARTWORK TYPE: ${artworkType}.` : ''}
${targetPlatform !== 'all' ? `TARGET PLATFORM: ${targetPlatform.toUpperCase()}` : ''}
File Name: ${fileName}
`;

  const ai = new GoogleGenAI({
    apiKey: apiKey.trim(),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build-client',
      },
    },
  });

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
      model: selectedModel,
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.15,
        responseMimeType: 'application/json',
        responseSchema: METADATA_RESPONSE_SCHEMA,
      },
    });
  } catch (err: any) {
    // Graceful fallback to another modern model
    const fallbackModel = selectedModel === 'gemini-3.8-flash'
      ? 'gemini-flash-latest'
      : (selectedModel === 'gemini-flash-latest' ? 'gemini-3.1-flash-lite' : 'gemini-3.8-flash');
    console.warn(`Client Gemini model ${selectedModel} failed, trying fallback ${fallbackModel}:`, err);
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
  const parsedData = JSON.parse(rawText);

  const t1 = normalizeKeywords(parsedData.tier1Keywords);
  const t2 = normalizeKeywords(parsedData.tier2Keywords);
  const t3 = normalizeKeywords(parsedData.tier3Keywords);
  const t4 = normalizeKeywords(parsedData.tier4Keywords);

  const seen = new Set<string>();
  const filterUnique = (arr: string[]) => arr.filter((k) => {
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const uniqueT1 = filterUnique(t1);
  const uniqueT2 = filterUnique(t2);
  const uniqueT3 = filterUnique(t3);
  const uniqueT4 = filterUnique(t4);
  const combined = [...uniqueT1, ...uniqueT2, ...uniqueT3, ...uniqueT4];
  const words = (parsedData.title || '').trim().split(/\s+/).filter(Boolean);
  const categoryId = getAdobeCategoryId(parsedData.category, parsedData.categoryId);

  return {
    fileName,
    title: parsedData.title,
    titleWordCount: words.length,
    breakdown: parsedData.breakdown || {},
    tier1Keywords: uniqueT1,
    tier2Keywords: uniqueT2,
    tier3Keywords: uniqueT3,
    tier4Keywords: uniqueT4,
    allKeywords: combined,
    category: parsedData.category || (isVideoAsset ? 'Landscapes' : 'Graphic Resources'),
    categoryId,
    secondaryCategory: parsedData.secondaryCategory || (isVideoAsset ? 'Technology' : 'Abstract'),
    rejectionRiskScore: parsedData.rejectionRiskScore || 'low',
    reviewNotes: parsedData.reviewNotes || (isVideoAsset ? 'Optimized for 4K/HD microstock stock footage buyers.' : 'Metadata optimized for high search impression and conversion.'),
  };
}

export async function refineMetadataClientSide(params: RefineMetadataClientParams) {
  const {
    currentTitle,
    currentKeywords,
    refinementInstruction,
    fileName = 'image.jpg',
    imageBase64,
    mimeType = 'image/jpeg',
    apiKey,
    selectedModel = 'gemini-3.8-flash',
  } = params;

  if (!apiKey || apiKey.trim().length < 5) {
    throw new Error('API Key Gemini diperlukan untuk pemrosesan langsung di Netlify.');
  }

  const ai = new GoogleGenAI({
    apiKey: apiKey.trim(),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build-client',
      },
    },
  });

  const systemPrompt = `You are a Senior Stock Contributor Strategist and Master AI Vision Specialist.
Refine the provided microstock metadata according to the contributor's instruction while maintaining the strict formula:
1. Title must be 15-25 words following: [Style/Theme] + [Product Format] + [Specific Visual Elements] + [Use Case/Application]
2. Keywords must be exactly 49 unique keywords in 4 tiers:
   - Tier 1 (1-10): Main object/subject visible in the image
   - Tier 2 (11-20): Style, mood, & color
   - Tier 3 (21-35): Use case, application, target industry
   - Tier 4 (36-49): Broad concepts, categories, technical
CRITICAL KEYWORD RULE: Each keyword must strictly be 1 or 2 words maximum.`;

  const userText = `Current Title: "${currentTitle}"
Current Keywords (${(currentKeywords || []).length}): ${(currentKeywords || []).join(', ')}
Contributor Refinement Request: "${refinementInstruction}"
File Name: ${fileName}

Please update the title (15-25 words) and all 49 keywords (1-2 words max each) strictly following the requested changes while maintaining truthful visual relevance.`;

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

  const response = await ai.models.generateContent({
    model: selectedModel,
    contents: { parts },
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.2,
      responseMimeType: 'application/json',
      responseSchema: METADATA_RESPONSE_SCHEMA,
    },
  });

  const parsedData = JSON.parse(response.text || '{}');
  const words = (parsedData.title || '').trim().split(/\s+/).filter(Boolean);
  const t1 = normalizeKeywords(parsedData.tier1Keywords);
  const t2 = normalizeKeywords(parsedData.tier2Keywords);
  const t3 = normalizeKeywords(parsedData.tier3Keywords);
  const t4 = normalizeKeywords(parsedData.tier4Keywords);

  const seen = new Set<string>();
  const filterUnique = (arr: string[]) => arr.filter((k) => {
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const uniqueT1 = filterUnique(t1);
  const uniqueT2 = filterUnique(t2);
  const uniqueT3 = filterUnique(t3);
  const uniqueT4 = filterUnique(t4);
  const combined = [...uniqueT1, ...uniqueT2, ...uniqueT3, ...uniqueT4];

  return {
    title: parsedData.title,
    titleWordCount: words.length,
    breakdown: parsedData.breakdown || {},
    tier1Keywords: uniqueT1,
    tier2Keywords: uniqueT2,
    tier3Keywords: uniqueT3,
    tier4Keywords: uniqueT4,
    allKeywords: combined,
    category: parsedData.category || 'Graphic Resources',
    categoryId: getAdobeCategoryId(parsedData.category, parsedData.categoryId),
    secondaryCategory: parsedData.secondaryCategory || 'Abstract',
    rejectionRiskScore: parsedData.rejectionRiskScore || 'low',
    reviewNotes: parsedData.reviewNotes || 'Metadata refined based on contributor instructions.',
  };
}

export async function validateApiKeyClientSide(apiKey: string, model: string = 'gemini-3.8-flash'): Promise<{ valid: boolean; error?: string; isQuota?: boolean }> {
  try {
    if (!apiKey || apiKey.trim().length < 5) {
      return { valid: false, error: 'API Key tidak boleh kosong atau terlalu pendek' };
    }
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
    const res = await ai.models.generateContent({
      model,
      contents: 'Respond with OK',
    });
    if (res.text) {
      return { valid: true };
    }
    return { valid: true };
  } catch (err: any) {
    const msg = err?.message || 'Gagal memvalidasi API Key';
    const isQuota = msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED');
    return {
      valid: false,
      error: isQuota ? 'Quota API Key telah terlampaui (429)' : msg,
      isQuota,
    };
  }
}
