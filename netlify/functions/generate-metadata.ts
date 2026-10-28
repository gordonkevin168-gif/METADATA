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
      imageBase64,
      mimeType = 'image/jpeg',
      fileName = 'untitled.jpg',
      customContext = '',
      targetPlatform = 'all',
      artworkType = 'auto',
      mediaType = 'image',
      videoMeta,
      videoFrames,
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

CORE MANDATE 1: EXPERT ADOBE STOCK CURATOR CONSTITUTION (TITLE & KEYWORD HARMONY WITHOUT RAW WORD SCRAPING):
In Adobe Stock's ranking algorithm, the Title describes the asset contextually in 15-25 words, while Keywords are the high-converting search tags stock buyers type into the search bar.
DO NOT simply copy-paste or blindly scrape every word from the title into keywords!
Filter with expert microstock curation precision:
1. TIER 1 (Pos 1-10 - CRITICAL ALGORITHMIC SEARCH WEIGHT):
   - MUST feature the primary PHYSICAL VISUAL OBJECTS seen directly in the preview (e.g. 'robot', 'dashboard', 'infographic', 'interface' for an explainer UI video, or 'battery', 'charger', 'station', 'indicator', 'display' for an EV charging HUD).
   - Followed by the core commercial subject nouns from the asset (e.g. 'recruitment', 'screening', 'automation', 'software', 'hiring', 'process').
   - NEVER place technical video/format tags ('4k', 'footage', 'clip', 'video') in Tier 1!
2. FILTER OUT GRAMMATICAL & DEPICTIVE FILLER:
   - NEVER use filler verbs ('showing', 'using', 'featuring', 'depicting', 'having', 'including', 'made').
   - NEVER use prepositions or conjunctions ('for', 'from', 'with', 'by', 'into', 'over', 'and', 'of', 'in', 'on', 'at').
3. CONVERT CONJUGATED VERBS TO HIGH-VOLUME COMMERCIAL SEARCH NOUNS:
   - Adobe Stock buyers search for nouns, NOT conjugated verbs! Convert:
     * 'automating' -> 'automation'
     * 'recruiting' -> 'recruitment'
     * 'managing' -> 'management'
     * 'analyzing' -> 'analytics'
     * 'efficient' -> 'efficiency'
4. TIER 2 (Pos 11-20): Visual style, aesthetics, colors, lighting, rendering technique (e.g. 'animated', 'digital', 'blue', 'minimalist', 'graphic', 'modern', 'clean', 'motion', 'corporate', 'tech' or '3d rendering', 'futuristic', 'cyan', 'glowing').
5. TIER 3 (Pos 21-35): Industry verticals, business workflows, job roles, buyer use-cases (e.g. 'hr', 'management', 'business', 'workflow', 'ux', 'designer', 'analytics', 'efficiency', 'technology', 'presentation', 'marketing', 'strategy', 'data', 'application', 'employment').
6. TIER 4 (Pos 36-49): Video production & technical formats ('footage', '4k', 'clip', 'roll', 'cinematic', 'loop', 'horizontal') and broad conceptual themes ('concept', 'innovation', 'intelligence', 'virtual', 'system', 'optimization', 'professional').
7. RATIO: 75% to 85% strictly 1 single word. Only 15% to 25% recognized compound phrases (2 words max). ZERO 3+ word phrases. Exactly 49 keywords.

- Example A (Video):
  Title: "Animated 4K Explainer Video Showing AI Recruitment Software Automating CV Screening Process for Efficient Hiring and Human Resources Management Workflow"
  Tier 1 Keywords (1-10 - Visual hero objects + core subject): robot, dashboard, infographic, interface, recruitment, screening, automation, software, hiring, process
  Tier 2 Keywords (11-20 - Visual style & aesthetics): animated, digital, blue, minimalist, graphic, modern, clean, motion, corporate, tech
  Tier 3 Keywords (21-35 - Commercial context & workflow): hr, management, business, workflow, ux, designer, analytics, efficiency, technology, presentation, marketing, strategy, data, application, employment
  Tier 4 Keywords (36-49 - Format specs & broad concepts): footage, 4k, clip, roll, cinematic, loop, horizontal, concept, innovation, intelligence, virtual, system, optimization, professional

- Example B (Graphic / 3D Interface / Technology):
  Title: "Battery Charging Status of Electric Vehicle Interface Using DC Fast Charger from Charging Station, 3D Rendering Futuristic Fuel Power Level Indicator UI Display for EV Automotive Industry Technology"
  Tier 1 Keywords (1-10 - Visual hero objects + core action): battery, charger, station, vehicle, display, interface, indicator, screen, gauge, charging
  Tier 2 Keywords (11-20 - Visual style & rendering): 3d rendering, futuristic, fuel, ui, ev, automotive, industry, cyan, glowing, digital
  Tier 3 Keywords (21-35 - Commercial context & clean energy): clean energy, electricity, dashboard, eco, mobility, smart car, transport, drive, sustainable, automobile, cable, meter, electric vehicle, power level, fast charger
  Tier 4 Keywords (36-49 - Technical specs & broad concepts): innovation, high tech, render, visual, commercial, isolated, concept, dark, illuminated, plug, power, energy, device, telemetry

CORE MANDATE 2: STRICT VISUAL GROUNDING (ZERO HALLUCINATIONS, NO GUESSWORK):
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
   - 75% to 80% of all keywords (approx 37-40 of the 49 keywords) MUST BE STRICTLY 1 SINGLE WORD (e.g. "battery", "charging", "software", "recruitment", "screening", "mountain", "coffee", "sunset", "laptop", "vector", "aerial", "minimalist", "gold", "vibrant", "growth").
   - Maximum 20% to 25% (approx 9-12 keywords) may be 2 words, and ONLY for recognized fixed compound phrases (e.g. "electric vehicle", "fast charger", "charging station", "3d rendering", "copy space", "golden hour", "slow motion", "drone shot", "real estate", "social media", "flat lay", "artificial intelligence").
   - DO NOT combine generic adjective + noun into 2 words.
   - Never output 3 or more words per keyword.
   - Hierarchy:
     * Tier 1 (Keywords 1-10): The exact primary objects, subjects, and main shapes visible to the eye. MUST directly match the core subject in the Title! At least 8-9 must be strictly single words!
     * Tier 2 (Keywords 11-20): The exact visual style, colors, mood, lighting, aesthetic attributes, and secondary descriptors from the Title. At least 8 must be single words!
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
3. Generate a highly commercial stock footage title (strictly 15 to 25 words in professional stock English) and exactly 49 hierarchical keywords (1 or 2 words max each) grounded in the complete 3-frame sequence. Do not guess or invent unrelated keywords.`,
      });
    } else {
      parts.push({
        inlineData: {
          mimeType: effectiveMimeType,
          data: cleanBase64,
        },
      });
      parts.push({
        text: `Examine the exact visual content of this ${isVideoAsset ? 'video footage representative frame' : 'image preview'} "${fileName}". Generate a commercially compelling, 100% relevant stock Title (15-25 words) and exactly 49 hierarchical keywords (1 or 2 words max each) strictly grounded in what is visible in this preview. Do not guess or output unrelated keywords.`,
      });
    }

    const contents = { parts };

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

    const curated = curateStockKeywords(
      parsedData.tier1Keywords,
      parsedData.tier2Keywords,
      parsedData.tier3Keywords,
      parsedData.tier4Keywords,
      isVideoAsset,
      parsedData.title
    );

    const categoryId = getAdobeCategoryId(parsedData.category, parsedData.categoryId);

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
