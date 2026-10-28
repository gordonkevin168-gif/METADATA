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
  'wireframe model'
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
};

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
  title: string = ''
) {
  const cleanKeyword = (str: string) =>
    str.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, ' ');

  const seen = new Set<string>();
  let totalCompounds = 0;
  const MAX_TOTAL_COMPOUNDS = 12;

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

  for (const subject of coreSubjectNouns) {
    if (!seen.has(subject)) {
      if (t1.length < 10) {
        seen.add(subject);
        t1.push(subject);
      } else if (t3.length < 15) {
        seen.add(subject);
        t3.push(subject);
      }
    }
  }

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
    if (combined.length >= 49) break;
    if (!seen.has(filler)) {
      seen.add(filler);
      combined.push(filler);
    }
  }

  const final49 = combined.slice(0, 49);
  const finalT1 = final49.slice(0, 10);
  const finalT2 = final49.slice(10, 20);
  const finalT3 = final49.slice(20, 35);
  const finalT4 = final49.slice(35, 49);

  const singleWords = final49.filter((k) => k.split(/\s+/).length === 1);
  const compoundWords = final49.filter((k) => k.split(/\s+/).length > 1);

  const matchedCoreSubjects = coreSubjectNouns.filter((cs) =>
    final49.some((k) => k === cs || k.split(' ').includes(cs))
  );

  return {
    tier1Keywords: finalT1,
    tier2Keywords: finalT2,
    tier3Keywords: finalT3,
    tier4Keywords: finalT4,
    allKeywords: final49,
    singleWordCount: singleWords.length,
    compoundCount: compoundWords.length,
    singleWordPercentage: Math.round((singleWords.length / final49.length) * 100),
    titleMatchCount: matchedCoreSubjects.length,
    titleMatchPercentage: coreSubjectNouns.length > 0
      ? Math.round((matchedCoreSubjects.length / coreSubjectNouns.length) * 100)
      : 100,
    coreSubjectsFound: matchedCoreSubjects,
  };
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

    const systemPrompt = `You are a Senior Stock Contributor Strategist and Master AI Vision Specialist for Adobe Stock.
Refine the provided microstock metadata according to the contributor's instruction while maintaining the strict formula:
1. Title must be 15-25 words following: [Style/Theme] + [Product Format] + [Specific Visual Elements] + [Use Case/Application]
2. EXPERT ADOBE STOCK CURATOR CONSTITUTION (TITLE & KEYWORD HARMONY WITHOUT RAW WORD SCRAPING):
   - Tier 1 (1-10): Retain the primary visual hero elements seen in the preview (e.g. robot, dashboard, battery, charger, gauge) + core commercial subject nouns. Never put technical video specs (4k, footage) in Tier 1!
   - DO NOT dump all words from title into keywords. Filter out filler verbs (showing, using, having, featuring) and prepositions (for, from, with, by).
   - Convert verbs to search nouns: 'automating' -> 'automation', 'recruiting' -> 'recruitment', 'managing' -> 'management'.
   - Tier 2 (11-20): Visual style, aesthetics, colors, lighting, rendering technique.
   - Tier 3 (21-35): Commercial use case, application, workflow, target industry.
   - Tier 4 (36-49): Video specs (footage, 4k, clip, loop) and broad conceptual search terms.
3. CRITICAL KEYWORD MANDATE: 75% to 85% of keywords MUST be strictly 1 single word. Maximum 15% to 25% may be 2 words for recognized fixed compound phrases (e.g. electric vehicle, fast charger, 3d rendering, copy space, golden hour, slow motion, drone shot). Never output 3 or more words per keyword.
4. No brand names, no spam. Stay 100% truthful to the visual asset.`;

    const userText = `Current Title: "${currentTitle}"
Current Keywords (${(currentKeywords || []).length}): ${(currentKeywords || []).join(', ')}
Contributor Refinement Request: "${refinementInstruction}"
File Name: ${fileName}

Please update the title (15-25 words) and all 49 keywords (1-2 words max each) strictly following the requested changes while maintaining 100% mutual relevance between Title and Keywords.`;

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

    const isVideoAsset = fileName.toLowerCase().match(/\.(mp4|mov|webm|m4v|avi|mkv)$/) !== null;

    const curated = curateStockKeywords(
      parsedData.tier1Keywords,
      parsedData.tier2Keywords,
      parsedData.tier3Keywords,
      parsedData.tier4Keywords,
      isVideoAsset,
      parsedData.title
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        fileName,
        title: parsedData.title,
        titleWordCount: words.length,
        breakdown: parsedData.breakdown || {},
        tier1Keywords: curated.tier1Keywords,
        tier2Keywords: curated.tier2Keywords,
        tier3Keywords: curated.tier3Keywords,
        tier4Keywords: curated.tier4Keywords,
        allKeywords: curated.allKeywords,
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
