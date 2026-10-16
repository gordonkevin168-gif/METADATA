import { TrademarkWarning } from '../types';

const BANNED_TERMS = [
  { term: 'apple', brand: 'Apple Inc.' },
  { term: 'iphone', brand: 'Apple Inc.' },
  { term: 'ipad', brand: 'Apple Inc.' },
  { term: 'macbook', brand: 'Apple Inc.' },
  { term: 'imac', brand: 'Apple Inc.' },
  { term: 'ios', brand: 'Apple Inc.' },
  { term: 'airpods', brand: 'Apple Inc.' },
  { term: 'nike', brand: 'Nike, Inc.' },
  { term: 'adidas', brand: 'Adidas AG' },
  { term: 'puma', brand: 'Puma SE' },
  { term: 'sony', brand: 'Sony Group' },
  { term: 'playstation', brand: 'Sony PlayStation' },
  { term: 'xbox', brand: 'Microsoft Xbox' },
  { term: 'nintendo', brand: 'Nintendo Co.' },
  { term: 'microsoft', brand: 'Microsoft Corporation' },
  { term: 'windows', brand: 'Microsoft Windows' },
  { term: 'google', brand: 'Google LLC' },
  { term: 'android', brand: 'Google Android' },
  { term: 'samsung', brand: 'Samsung Electronics' },
  { term: 'galaxy', brand: 'Samsung Galaxy' },
  { term: 'coca-cola', brand: 'The Coca-Cola Company' },
  { term: 'cocacola', brand: 'The Coca-Cola Company' },
  { term: 'pepsi', brand: 'PepsiCo' },
  { term: 'starbucks', brand: 'Starbucks Coffee' },
  { term: 'mcdonalds', brand: "McDonald's Corporation" },
  { term: 'disney', brand: 'The Walt Disney Company' },
  { term: 'marvel', brand: 'Marvel Characters' },
  { term: 'lego', brand: 'The LEGO Group' },
  { term: 'tesla', brand: 'Tesla, Inc.' },
  { term: 'bmw', brand: 'BMW AG' },
  { term: 'mercedes', brand: 'Mercedes-Benz Group' },
  { term: 'porsche', brand: 'Porsche AG' },
  { term: 'ferrari', brand: 'Ferrari N.V.' },
  { term: 'photoshop', brand: 'Adobe Photoshop' },
  { term: 'illustrator', brand: 'Adobe Illustrator' },
  { term: 'adobe', brand: 'Adobe Inc.' },
  { term: 'instagram', brand: 'Meta / Instagram' },
  { term: 'facebook', brand: 'Meta / Facebook' },
  { term: 'tiktok', brand: 'ByteDance / TikTok' },
  { term: 'twitter', brand: 'X Corp / Twitter' },
  { term: 'youtube', brand: 'Google / YouTube' },
  { term: 'linkedin', brand: 'Microsoft / LinkedIn' },
  { term: 'whatsapp', brand: 'Meta / WhatsApp' },
  { term: 'intel', brand: 'Intel Corporation' },
  { term: 'nvidia', brand: 'NVIDIA Corporation' },
];

export function checkKeywordsForTrademarks(keywords: string[]): TrademarkWarning[] {
  const warnings: TrademarkWarning[] = [];
  const checked = new Set<string>();

  for (const kw of keywords) {
    const normalized = kw.toLowerCase().trim();
    for (const banned of BANNED_TERMS) {
      // Check if keyword contains whole word of banned term
      const regex = new RegExp(`\\b${banned.term}\\b`, 'i');
      if (regex.test(normalized) && !checked.has(normalized)) {
        checked.add(normalized);
        warnings.push({
          keyword: kw,
          reason: `Violates microstock policy: references trademarked brand "${banned.brand}". Platforms like Adobe Stock & Shutterstock will reject this item.`,
        });
      }
    }
  }

  return warnings;
}

export function checkTitleForTrademarks(title: string): TrademarkWarning[] {
  const warnings: TrademarkWarning[] = [];
  const normalized = title.toLowerCase();

  for (const banned of BANNED_TERMS) {
    const regex = new RegExp(`\\b${banned.term}\\b`, 'i');
    if (regex.test(normalized)) {
      warnings.push({
        keyword: banned.term,
        reason: `Title contains trademark "${banned.brand}". Microstock agencies will reject for IP violation.`,
      });
    }
  }

  return warnings;
}
