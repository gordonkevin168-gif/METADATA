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

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

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

const METADATA_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: 'The stock photo/vector title following [Style/Theme] + [Product Format] + [Specific Visual Elements] + [Use Case/Application] formula, strictly 15 to 25 words in professional English.',
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
      videoMeta,
      apiKey: bodyApiKey,
      selectedModel = 'gemini-3.8-flash',
    } = req.body;

    const customKey = bodyApiKey || (req.headers['x-gemini-api-key'] as string);
    const activeAi = getGeminiClient(customKey);
    const primaryModel = selectedModel || 'gemini-3.8-flash';

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image base64 data is required for visual analysis' });
    }

    // Clean base64 string if it contains data URI header
    const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9\/+-]+;base64,/, '');

    // Determine accurate raster mime type (never pass application/illustrator or application/postscript to Gemini)
    const effectiveMimeType = detectImageMimeType(cleanBase64, mimeType);

    const isVideoAsset = mediaType === 'video' || artworkType === 'footage';

    let videoContextPrompt = '';
    if (isVideoAsset) {
      videoContextPrompt = `
MEDIA TYPE: STOCK FOOTAGE / VIDEO CLIP
TECHNICAL SPECS: Resolution: ${videoMeta?.resolutionLabel || '4K/HD'}, Duration: ${videoMeta?.duration ? videoMeta.duration + ' seconds' : 'Short clip'}, Aspect Ratio: ${videoMeta?.aspectRatio || '16:9 Landscape'}, Format: ${videoMeta?.format?.toUpperCase() || 'MP4'}.
VIDEO TITLE FORMULA (Strictly 15 to 25 words in professional stock English):
- Pattern: [Camera Motion/Pacing] + [Stock Footage/Video Format] + [Exact Visible Actions, Subjects & Environment] + [Commercial/B-Roll Use Case]
- Examples of proper video title:
  * "Slow Motion 4K Drone Aerial Shot of Sunset Glowing Over Mountain Valley for Cinematic Travel Commercial B-Roll"
  * "Close Up High Speed Realtime Footage of Roasted Espresso Coffee Beans Falling into Grinder for Cafe Promo"
  * "Cinematic Panning 4K Video of Modern Corporate Office Skyline at Dusk with Traffic Lights for Business Presentation"
VIDEO 49 KEYWORD MANDATE:
- Seamlessly integrate essential microstock video search keywords across the 4 tiers:
  * Video terms: footage, 4k, slow motion, b-roll, clip, cinematic, aerial, drone, camera, panning, realtime, loop, horizontal, motion, etc.
  * Tier 1 (1-10): The exact primary subject and action moving in the frame.
  * Tier 2 (11-20): Lighting, camera angle, motion speed, aesthetic mood, and color palette.
  * Tier 3 (21-35): Video production use cases, documentary, advertising, broadcast, youtube, promo, social media.
  * Tier 4 (36-49): Video stock tags, technical tags, and conceptual search terms.
- Every keyword must still be strictly 1 or 2 words maximum.`;
    }

    const systemPrompt = `You are a Senior Stock Contributor Strategist and Master AI Vision Specialist for Adobe Stock, Shutterstock, Freepik, and Getty Images.
Your task is to analyze the visual preview uploaded by the contributor and produce 100% commercially accurate, truthfully grounded stock metadata (Title and exactly 49 Keywords).

CORE MANDATE - STRICT VISUAL GROUNDING (ZERO HALLUCINATIONS, NO GUESSWORK):
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
3. TITLE FORMULA (Strictly 15 to 25 words in professional stock English):
   - Title MUST be between 15 and 25 words in length.
   - Every element in the title must accurately match what is visible in the preview.
4. 49 HIERARCHICAL KEYWORDS (Strict Adobe Stock & Microstock Ranking Order):
   CRITICAL KEYWORD RULE: In accordance with Adobe Stock contributor guidelines and search conversion algorithms:
   - Each keyword must be strictly 1 or 2 words maximum (prefer concise single words for 75-85% of keywords).
   - Never output 3 or more words per keyword.
   - Hierarchy:
     * Tier 1 (Keywords 1-10): The exact primary objects, subjects, and main shapes visible to the eye.
     * Tier 2 (Keywords 11-20): The exact visual style, colors, mood, lighting, and aesthetic attributes seen in this artwork.
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

    // Helper to enforce max 2 words per keyword
    const normalizeKeywords = (arr: any[]): string[] => {
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
          // If model returned > 2 words, split into separate single words
          for (const w of words) {
            if (w.length > 1) res.push(w);
          }
        }
      }
      return res;
    };

    // Post-process to ensure strict 49 keywords and proper tiers
    const t1 = normalizeKeywords(parsedData.tier1Keywords);
    const t2 = normalizeKeywords(parsedData.tier2Keywords);
    const t3 = normalizeKeywords(parsedData.tier3Keywords);
    const t4 = normalizeKeywords(parsedData.tier4Keywords);

    // Deduplicate while preserving tier order
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

    // Compute title word count accurately
    const words = (parsedData.title || '').trim().split(/\s+/).filter(Boolean);

    const categoryId = getAdobeCategoryId(parsedData.category, parsedData.categoryId);

    res.json({
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
    const words = (parsedData.title || '').trim().split(/\s+/).filter(Boolean);

    // Normalize keywords to max 2 words
    const normalizeKeywords = (arr: any[]): string[] => {
      if (!Array.isArray(arr)) return [];
      const res: string[] = [];
      for (const raw of arr) {
        if (!raw) continue;
        const cleaned = String(raw).trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '');
        const wList = cleaned.split(/\s+/).filter(Boolean);
        if (wList.length === 0) continue;
        if (wList.length <= 2) res.push(cleaned);
        else {
          for (const w of wList) {
            if (w.length > 1) res.push(w);
          }
        }
      }
      return res;
    };

    const t1 = normalizeKeywords(parsedData.tier1Keywords);
    const t2 = normalizeKeywords(parsedData.tier2Keywords);
    const t3 = normalizeKeywords(parsedData.tier3Keywords);
    const t4 = normalizeKeywords(parsedData.tier4Keywords);

    const combined = [...t1, ...t2, ...t3, ...t4];
    const categoryId = getAdobeCategoryId(parsedData.category, parsedData.categoryId);

    res.json({
      fileName,
      title: parsedData.title,
      titleWordCount: words.length,
      breakdown: parsedData.breakdown || {},
      tier1Keywords: t1,
      tier2Keywords: t2,
      tier3Keywords: t3,
      tier4Keywords: t4,
      allKeywords: combined,
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
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StockMeta AI server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
});
