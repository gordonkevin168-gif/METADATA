import { StockItem } from '../types';

function escapeCsvField(value: string | undefined): string {
  if (!value) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const escapeCsvCell = escapeCsvField;

/**
 * Adobe Stock bulk metadata CSV specification matching official template:
 * Filename,Title,Keywords,Category,Releases
 * e.g. "asset.jpg","Title Here","keyword1, keyword2, keyword3",8,
 */
export function generateAdobeStockCsv(items: StockItem[]): string {
  const headers = 'Filename,Title,Keywords,Category,Releases';
  const rows = items
    .filter((item) => item.status === 'completed' && item.title)
    .map((item) => {
      const filename = escapeCsvField(item.fileName);
      const title = escapeCsvField(item.title || '');
      // Format keywords as quoted string with comma-space separation
      const kwList = (item.allKeywords || []).map((k) => k.trim()).filter(Boolean);
      const keywords = `"${kwList.join(', ')}"`;
      const categoryId = item.categoryId || 8;
      const releases = '';
      return `${filename},${title},${keywords},${categoryId},${releases}`;
    });

  return [headers, ...rows].join('\r\n');
}

export const SHUTTERSTOCK_CATEGORIES = [
  'Abstract',
  'Animals/Wildlife',
  'Arts',
  'Backgrounds/Textures',
  'Beauty/Fashion',
  'Buildings/Landmarks',
  'Business/Finance',
  'Celebrities',
  'Education',
  'Food and Drink',
  'Healthcare/Medical',
  'Holidays',
  'Industrial',
  'Interiors',
  'Miscellaneous',
  'Nature',
  'Objects',
  'Parks/Outdoor',
  'People',
  'Religion',
  'Science',
  'Signs/Symbols',
  'Sports/Recreation',
  'Technology',
  'Transportation',
  'Vectors/Illustrations',
  'Vintage',
] as const;

export const SHUTTERSTOCK_FALLBACK_CATEGORY_MAP: Record<string, string> = {
  'animals': 'Animals/Wildlife',
  'buildings': 'Buildings/Landmarks',
  'architecture': 'Buildings/Landmarks',
  'business': 'Business/Finance',
  'drinks': 'Food and Drink',
  'food': 'Food and Drink',
  'the environment': 'Nature',
  'environment': 'Nature',
  'states of mind': 'People',
  'graphic resources': 'Signs/Symbols',
  'graphics': 'Signs/Symbols',
  'hobbies': 'Sports/Recreation',
  'leisure': 'Sports/Recreation',
  'industry': 'Industrial',
  'landscapes': 'Nature',
  'lifestyle': 'People',
  'people': 'People',
  'plants': 'Nature',
  'flowers': 'Nature',
  'culture': 'Religion',
  'religion': 'Religion',
  'science': 'Science',
  'social issues': 'People',
  'sports': 'Sports/Recreation',
  'technology': 'Technology',
  'tech': 'Technology',
  'transport': 'Transportation',
  'transportation': 'Transportation',
  'travel': 'Parks/Outdoor',
  'abstract': 'Abstract',
};

export function mapToShutterstockCategory(item: StockItem): string {
  const category = (item.category || '').trim();
  const secondaryCategory = (item.secondaryCategory || '').trim();
  const title = (item.title || '').toLowerCase();
  const fileName = (item.fileName || '').toLowerCase();
  const kwText = (item.allKeywords || []).slice(0, 15).join(' ').toLowerCase();
  const combined = `${category} ${secondaryCategory} ${title} ${fileName} ${kwText}`.toLowerCase();

  // 1. Direct match or alias for primary category
  for (const cat of SHUTTERSTOCK_CATEGORIES) {
    if (category.toLowerCase() === cat.toLowerCase()) return cat;
  }
  const primaryFallback = SHUTTERSTOCK_FALLBACK_CATEGORY_MAP[category.toLowerCase()];
  if (primaryFallback && category.toLowerCase() !== 'graphic resources') {
    return primaryFallback;
  }

  // 2. High-precision contextual mapping matching stock video and visual metadata
  if (
    combined.includes('mountain') ||
    combined.includes('sunset') ||
    combined.includes('valley') ||
    combined.includes('landscape') ||
    combined.includes('nature') ||
    combined.includes('forest') ||
    combined.includes('beach') ||
    combined.includes('ocean') ||
    combined.includes('river') ||
    combined.includes('lake') ||
    combined.includes('tree') ||
    combined.includes('flower') ||
    combined.includes('botanical') ||
    combined.includes('flora')
  ) {
    return 'Nature';
  }

  if (
    combined.includes('dollar') ||
    combined.includes('icon') ||
    combined.includes('symbol') ||
    combined.includes('sign') ||
    combined.includes('checkmark') ||
    combined.includes('check mark') ||
    combined.includes('approved') ||
    combined.includes('magnifying') ||
    combined.includes('briefcase') ||
    combined.includes('target') ||
    combined.includes('bullseye') ||
    combined.includes('arrow') ||
    combined.includes('rocket') ||
    combined.includes('trophy') ||
    combined.includes('subscribe') ||
    combined.includes('envelope') ||
    combined.includes('shopping cart') ||
    combined.includes('credit card') ||
    combined.includes('calculator') ||
    combined.includes('calendar') ||
    combined.includes('clock')
  ) {
    return 'Signs/Symbols';
  }

  if (
    combined.includes('chart') ||
    combined.includes('graph') ||
    combined.includes('revenue') ||
    combined.includes('finance') ||
    combined.includes('financial') ||
    combined.includes('growth') ||
    combined.includes('bank') ||
    combined.includes('business') ||
    combined.includes('investment') ||
    combined.includes('profit') ||
    combined.includes('mechanism') ||
    combined.includes('organizational')
  ) {
    return 'Business/Finance';
  }

  if (
    combined.includes('monitor') ||
    combined.includes('computer') ||
    combined.includes('screen') ||
    combined.includes('software') ||
    combined.includes('interface') ||
    combined.includes('dashboard') ||
    combined.includes('network') ||
    combined.includes('router') ||
    combined.includes('server') ||
    combined.includes('database') ||
    combined.includes('technology') ||
    combined.includes('digital') ||
    combined.includes('cloud') ||
    combined.includes('login') ||
    combined.includes('progress bar') ||
    combined.includes('folder') ||
    combined.includes('payment') ||
    combined.includes('pos terminal') ||
    combined.includes('smart lock') ||
    combined.includes('app') ||
    combined.includes('data') ||
    combined.includes('chat') ||
    combined.includes('laptop')
  ) {
    return 'Technology';
  }

  if (
    combined.includes('hand drawn') ||
    combined.includes('doodle') ||
    combined.includes('sketch') ||
    combined.includes('drawing') ||
    combined.includes('roller shutter') ||
    combined.includes('smart home') ||
    combined.includes('lighting control') ||
    combined.includes('climate control') ||
    combined.includes('screen mirroring') ||
    combined.includes('art') ||
    combined.includes('creative')
  ) {
    return 'Arts';
  }

  if (
    combined.includes('elearning') ||
    combined.includes('learning') ||
    combined.includes('training') ||
    combined.includes('course') ||
    combined.includes('education') ||
    combined.includes('school') ||
    combined.includes('student') ||
    combined.includes('lesson')
  ) {
    return 'Education';
  }

  if (
    combined.includes('poll') ||
    combined.includes('people') ||
    combined.includes('user') ||
    combined.includes('profile') ||
    combined.includes('avatar') ||
    combined.includes('human') ||
    combined.includes('crowd') ||
    combined.includes('lifestyle')
  ) {
    return 'People';
  }

  if (
    combined.includes('background') ||
    combined.includes('texture') ||
    combined.includes('backdrop') ||
    combined.includes('pattern') ||
    combined.includes('time is money') ||
    combined.includes('abstract')
  ) {
    return 'Backgrounds/Textures';
  }

  return SHUTTERSTOCK_FALLBACK_CATEGORY_MAP[category.toLowerCase()] || 'Technology';
}

/**
 * Shutterstock bulk CSV specification matching official contributor template:
 * Filename,Description,Keywords,Categories,Editorial,Mature content,illustration
 * e.g. video.mp4,"Description here...","kw1, kw2, kw3",Signs/Symbols,no,,
 */
export function generateShutterstockCsv(items: StockItem[]): string {
  const headers = 'Filename,Description,Keywords,Categories,Editorial,Mature content,illustration';
  const rows = items
    .filter((item) => item.status === 'completed' && item.title)
    .map((item) => {
      const filename = escapeCsvField(item.fileName);
      const description = escapeCsvField(item.title || '');
      
      // Keywords formatted as quoted string with comma-space separation
      const kwList = (item.allKeywords || []).map((k) => k.trim()).filter(Boolean);
      const keywords = `"${kwList.join(', ').replace(/"/g, '""')}"`;
      
      const category = mapToShutterstockCategory(item);
      const editorial = 'no';
      const matureContent = '';
      const isIllustration = 
        item.artworkType === 'vector' || 
        item.artworkType === 'illustration' ||
        item.mimeType?.includes('svg') || 
        item.fileName.toLowerCase().endsWith('.ai') ||
        item.fileName.toLowerCase().endsWith('.eps') ||
        item.fileName.toLowerCase().endsWith('.svg')
          ? 'yes'
          : '';

      return `${filename},${description},${keywords},${category},${editorial},${matureContent},${isIllustration}`;
    });

  return [headers, ...rows].join('\r\n');
}

/**
 * Universal Master CSV with full 4-tier hierarchy breakdown
 */
export function generateUniversalCsv(items: StockItem[]): string {
  const headers = [
    'Filename',
    'Title',
    'Word Count',
    'Keywords (All 49)',
    'Tier 1 (Subject)',
    'Tier 2 (Style & Color)',
    'Tier 3 (Application)',
    'Tier 4 (Concepts)',
    'Category',
    'Secondary Category',
    'Rejection Risk',
    'Review Strategy Notes',
  ];

  const rows = items
    .filter((item) => item.status === 'completed' && item.title)
    .map((item) => {
      return [
        escapeCsvCell(item.fileName),
        escapeCsvCell(item.title || ''),
        escapeCsvCell(String(item.titleWordCount || 0)),
        escapeCsvCell((item.allKeywords || []).join(', ')),
        escapeCsvCell((item.tier1Keywords || []).join(', ')),
        escapeCsvCell((item.tier2Keywords || []).join(', ')),
        escapeCsvCell((item.tier3Keywords || []).join(', ')),
        escapeCsvCell((item.tier4Keywords || []).join(', ')),
        escapeCsvCell(item.category || ''),
        escapeCsvCell(item.secondaryCategory || ''),
        escapeCsvCell(item.rejectionRiskScore || 'low'),
        escapeCsvCell(item.reviewNotes || ''),
      ].join(',');
    });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Formatted plain text block output for quick copy or Adobe Bridge / IPTC panels
 */
export function generateBridgeTextBlock(item: StockItem): string {
  const isVideo = item.mediaType === 'video' || item.artworkType === 'footage';
  const lines = [
    `File Name: ${item.fileName}`,
    `Media Type: ${isVideo ? `Video Footage (${item.videoMeta?.resolutionLabel || '4K/HD'})` : (item.artworkType === 'vector' ? 'Vector Illustration' : 'Raster Image')}`,
  ];

  if (isVideo && item.videoMeta) {
    lines.push(`Resolution: ${item.videoMeta.resolutionLabel} (${item.videoMeta.width}x${item.videoMeta.height})`);
    lines.push(`Duration: ${item.videoMeta.duration}s`);
    lines.push(`Aspect Ratio: ${item.videoMeta.aspectRatio}`);
  }

  lines.push(
    `Title: ${item.title || ''}`,
    `Keywords: ${(item.allKeywords || []).join(', ')}`,
    `Category: ${item.category || 'General'}`,
    `Word Count: ${item.titleWordCount || 0} words (Target: 15-25)`,
    `Keywords Count: ${(item.allKeywords || []).length} keywords (Target: 49)`,
    `Tier 1 (Subject): ${(item.tier1Keywords || []).join(', ')}`,
    `Tier 2 (Style & Mood): ${(item.tier2Keywords || []).join(', ')}`,
    `Tier 3 (Application): ${(item.tier3Keywords || []).join(', ')}`,
    `Tier 4 (Concepts): ${(item.tier4Keywords || []).join(', ')}`,
  );

  return lines.join('\n');
}

/**
 * Formatted batch copy for all completed items in queue
 */
export function generateAllBridgeTextBlock(items: StockItem[]): string {
  return items
    .filter((item) => item.status === 'completed' && item.title)
    .map((item, index) => {
      return [
        `=== [${index + 1}/${items.length}] ${item.fileName} ===`,
        `File Name: ${item.fileName}`,
        `Title: ${item.title || ''}`,
        `Keywords: ${(item.allKeywords || []).join(', ')}`,
        `Category: ${item.category || 'General'}`,
      ].join('\n');
    })
    .join('\n\n');
}

/**
 * Trigger CSV download in browser
 */
export function downloadCsvFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
