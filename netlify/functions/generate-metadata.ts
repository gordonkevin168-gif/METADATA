import { GoogleGenAI, Type } from '@google/genai';

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
        styleTheme: { type: Type.STRING },
        productFormat: { type: Type.STRING },
        visualElements: { type: Type.STRING },
        useCase: { type: Type.STRING },
      },
      required: ['styleTheme', 'productFormat', 'visualElements', 'useCase'],
    },
    tier1Keywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Tier 1 (1-10): Exactly 10 primary subject/object keywords seen directly. Max 2 words per keyword.',
    },
    tier2Keywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Tier 2 (11-20): Exactly 10 style, mood, aesthetic, and color keywords. Max 2 words per keyword.',
    },
    tier3Keywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Tier 3 (21-35): Exactly 15 use case, design application keywords. Max 2 words per keyword.',
    },
    tier4Keywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Tier 4 (36-49): Exactly 14 broad concepts and technical stock search keywords. Max 2 words per keyword.',
    },
    allKeywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Exactly 49 total ordered keywords combining Tier 1 to 4. Max 2 words per keyword.',
    },
    category: { type: Type.STRING },
    categoryId: { type: Type.INTEGER },
    secondaryCategory: { type: Type.STRING },
    rejectionRiskScore: { type: Type.STRING },
    reviewNotes: { type: Type.STRING },
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

export const handler = async (event: any) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-gemini-api-key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const {
      imageBase64,
      mimeType = 'image/jpeg',
      fileName = 'untitled.jpg',
      customContext = '',
      targetPlatform = 'all',
      artworkType = 'auto',
      mediaType = 'image',
      videoMeta,
      apiKey: bodyApiKey,
      selectedModel = 'gemini-3.8-flash',
    } = payload;

    const apiKey = bodyApiKey || event.headers['x-gemini-api-key'] || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'NO_API_KEY',
          message: 'Gemini API key is required. Please set GEMINI_API_KEY or provide custom key.',
        }),
      };
    }

    if (!imageBase64) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Image base64 data is required' }),
      };
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
The contributor explicitly uploaded this visual asset preview so that the metadata accurately reflects what is in the artwork.
DO NOT guess or invent random elements. DO NOT output boilerplate or irrelevant terms.
1. VISUAL INSPECTION:
   - Identify the exact real subject(s) in the image/video frame.
   - Identify the true dominant color palette seen directly in the preview.
   - Identify the visual format and technique (${isVideoAsset ? 'cinematic video footage, slow motion b-roll, aerial drone clip' : 'flat vector illustration, 3D clay render, realistic photo, minimalist line art, seamless pattern, badge logo, infographic, watercolor'}).
   - Identify real visual attributes (copy space, isolated on white, dark background, geometric symmetry, gradient glow, motion blur, natural light).
2. TRUTHFULNESS & RELEVANCE:
   - If there are no people in the image/video, NEVER write "person", "man", "woman", "human", "face".
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
     * Tier 1 (Keywords 1-10): The exact primary objects, subjects, and main shapes visible to the eye.
     * Tier 2 (Keywords 11-20): The exact visual style, colors, mood, lighting, and aesthetic attributes seen in this artwork.
     * Tier 3 (Keywords 21-35): Realistic commercial design applications, industries, and creative use cases relevant to THIS specific subject matter.
     * Tier 4 (Keywords 36-49): Directly related broader stock search terms, design categories, and technical terminology.
5. NO TRADEMARKS OR SPAM: No brand names (Apple, Nike, Photoshop, etc.). No repetitive keyword spam.
6. ADOBE STOCK CATEGORY: Pick the single most accurate category name and numeric Category ID (1 to 21).
${videoContextPrompt}
${customContext ? `CONTRIBUTOR FOCUS / CONTEXT: "${customContext}". Incorporate this context into Tier 3 and the Title's application part if relevant.` : ''}
${artworkType !== 'auto' ? `ARTWORK TYPE: ${artworkType}.` : ''}
${targetPlatform !== 'all' ? `TARGET PLATFORM: ${targetPlatform.toUpperCase()}` : ''}
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

    const ai = new GoogleGenAI({ apiKey });
    let primaryModel = selectedModel || 'gemini-3.8-flash';

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
      const isQuota = modelErr?.message?.includes('429') || modelErr?.message?.includes('quota') || modelErr?.message?.includes('RESOURCE_EXHAUSTED');
      if (isQuota) {
        return {
          statusCode: 429,
          headers,
          body: JSON.stringify({
            error: 'QUOTA_EXHAUSTED',
            message: 'Quota API Key telah habis atau rate limit terlampaui (429). Putar API key berikutnya.',
          }),
        };
      }

      const fallbackModel = primaryModel === 'gemini-3.8-flash'
        ? 'gemini-flash-latest'
        : (primaryModel === 'gemini-flash-latest' ? 'gemini-3.1-flash-lite' : 'gemini-3.8-flash');
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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        fileName,
        title: parsedData.title,
        titleWordCount: words.length,
        breakdown: parsedData.breakdown || {},
        tier1Keywords: uniqueT1.slice(0, 10),
        tier2Keywords: uniqueT2.slice(0, 10),
        tier3Keywords: uniqueT3.slice(0, 15),
        tier4Keywords: uniqueT4.slice(0, 14),
        allKeywords: finalKeywords,
        category: parsedData.category || (isVideoAsset ? 'Landscapes' : 'Graphic Resources'),
        categoryId,
        secondaryCategory: parsedData.secondaryCategory || (isVideoAsset ? 'Technology' : 'Abstract'),
        rejectionRiskScore: parsedData.rejectionRiskScore || 'low',
        reviewNotes: parsedData.reviewNotes || (isVideoAsset ? 'Optimized for 4K/HD microstock stock footage.' : 'Metadata optimized for high search impression.'),
      }),
    };
  } catch (err: any) {
    const isQuota = err?.message?.includes('429') || err?.message?.includes('quota');
    return {
      statusCode: isQuota ? 429 : 500,
      headers,
      body: JSON.stringify({
        error: isQuota ? 'QUOTA_EXHAUSTED' : err?.message || 'Server error',
        message: err?.message || 'Internal error',
      }),
    };
  }
};
