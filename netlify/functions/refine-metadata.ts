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

const METADATA_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    titleWordCount: { type: Type.INTEGER },
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
    tier1Keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
    tier2Keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
    tier3Keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
    tier4Keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
    allKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
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
      currentTitle,
      currentKeywords,
      refinementInstruction,
      fileName = 'image.jpg',
      imageBase64,
      mimeType = 'image/jpeg',
      apiKey: bodyApiKey,
      selectedModel = 'gemini-3.8-flash',
    } = payload;

    const apiKey = bodyApiKey || event.headers['x-gemini-api-key'] || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'NO_API_KEY', message: 'Gemini API key is required.' }),
      };
    }

    if (!refinementInstruction) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Refinement instruction is required' }),
      };
    }

    const systemPrompt = `You are a Senior Stock Contributor Strategist and Master AI Vision Specialist.
Refine the provided microstock metadata according to the contributor's instruction while maintaining the strict formula:
1. Title must be 15-25 words following: [Style/Theme] + [Product Format] + [Specific Visual Elements] + [Use Case/Application]
2. Keywords must be exactly 49 unique keywords in 4 tiers:
   - Tier 1 (1-10): Main object/subject visible in the image
   - Tier 2 (11-20): Style, mood, & color
   - Tier 3 (21-35): Use case, application, target industry
   - Tier 4 (36-49): Broad concepts, categories, technical
CRITICAL KEYWORD RULE: Each keyword must strictly be 1 or 2 words maximum.
No brand names, no spam. Stay 100% truthful to the visual asset.`;

    const userText = `Current Title: "${currentTitle}"
Current Keywords (${(currentKeywords || []).length}): ${(currentKeywords || []).join(', ')}
Contributor Refinement Request: "${refinementInstruction}"
File Name: ${fileName}

Please update the title (15-25 words) and all 49 keywords (1-2 words max each) strictly following the requested changes while maintaining truthful visual relevance.`;

    const parts: any[] = [];
    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9\/+-]+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: cleanBase64,
        },
      });
    }
    parts.push({ text: userText });

    const ai = new GoogleGenAI({ apiKey });
    let response;
    try {
      response = await ai.models.generateContent({
        model: selectedModel || 'gemini-3.8-flash',
        contents: { parts },
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.2,
          responseMimeType: 'application/json',
          responseSchema: METADATA_RESPONSE_SCHEMA,
        },
      });
    } catch (err: any) {
      const fallback = selectedModel === 'gemini-3.8-flash' ? 'gemini-flash-latest' : 'gemini-3.8-flash';
      response = await ai.models.generateContent({
        model: fallback,
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
        allKeywords: combined,
        category: parsedData.category || 'Graphic Resources',
        categoryId: getAdobeCategoryId(parsedData.category, parsedData.categoryId),
        secondaryCategory: parsedData.secondaryCategory || 'Abstract',
        rejectionRiskScore: parsedData.rejectionRiskScore || 'low',
        reviewNotes: parsedData.reviewNotes || 'Metadata successfully refined.',
      }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err?.message || 'Refinement error' }),
    };
  }
};
