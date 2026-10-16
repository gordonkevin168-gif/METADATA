import { StockItem } from '../types';

// Helper to convert SVG string to base64
function svgToBase64(svg: string): string {
  return btoa(unescape(encodeURIComponent(svg)));
}

const sample1Svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <defs>
    <linearGradient id="bg1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>
    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#2563eb" />
    </linearGradient>
    <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
    <linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ec4899" />
      <stop offset="100%" stop-color="#8b5cf6" />
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#bg1)" />
  <g transform="translate(100, 100)">
    <!-- Icon 1: Wallet / Payment -->
    <rect x="0" y="0" width="120" height="120" rx="24" fill="#334155" opacity="0.6" />
    <rect x="25" y="35" width="70" height="50" rx="8" fill="url(#g1)" />
    <circle cx="75" cy="60" r="6" fill="#ffffff" />
    <!-- Icon 2: Growth Chart -->
    <rect x="160" y="0" width="120" height="120" rx="24" fill="#334155" opacity="0.6" />
    <path d="M185 85 L210 65 L235 75 L260 40" fill="none" stroke="url(#g2)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
    <!-- Icon 3: Safe / Security -->
    <rect x="320" y="0" width="120" height="120" rx="24" fill="#334155" opacity="0.6" />
    <circle cx="380" cy="60" r="30" fill="url(#g3)" />
    <circle cx="380" cy="60" r="14" fill="#1e293b" />
    <!-- Icon 4: Analytics -->
    <rect x="480" y="0" width="120" height="120" rx="24" fill="#334155" opacity="0.6" />
    <rect x="500" y="65" width="16" height="30" rx="4" fill="url(#g4)" />
    <rect x="524" y="45" width="16" height="50" rx="4" fill="url(#g4)" />
    <rect x="548" y="30" width="16" height="65" rx="4" fill="url(#g4)" />
  </g>
  <g transform="translate(100, 260)">
    <!-- Icon 5: Currency Exchange -->
    <rect x="0" y="0" width="120" height="120" rx="24" fill="#334155" opacity="0.6" />
    <path d="M35 55 L75 55 M65 45 L75 55 L65 65" fill="none" stroke="url(#g1)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M85 70 L45 70 M55 60 L45 70 L55 80" fill="none" stroke="url(#g2)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
    <!-- Icon 6: Cloud Database -->
    <rect x="160" y="0" width="120" height="120" rx="24" fill="#334155" opacity="0.6" />
    <path d="M190 70 A16 16 0 0 1 205 45 A24 24 0 0 1 245 50 A16 16 0 0 1 250 70 Z" fill="url(#g3)" />
    <!-- Icon 7: Blockchain Cube -->
    <rect x="320" y="0" width="120" height="120" rx="24" fill="#334155" opacity="0.6" />
    <path d="M380 35 L405 50 L405 75 L380 90 L355 75 L355 50 Z" fill="url(#g4)" opacity="0.8" />
    <!-- Icon 8: Mobile Banking -->
    <rect x="480" y="0" width="120" height="120" rx="24" fill="#334155" opacity="0.6" />
    <rect x="520" y="30" width="40" height="65" rx="6" fill="#ffffff" opacity="0.9" />
    <rect x="525" y="40" width="30" height="40" rx="2" fill="url(#g1)" />
  </g>
</svg>`;

const sample2Svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <defs>
    <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4f46e5" />
      <stop offset="50%" stop-color="#7c3aed" />
      <stop offset="100%" stop-color="#db2777" />
    </linearGradient>
    <filter id="blurFilter" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="40" />
    </filter>
  </defs>
  <rect width="800" height="600" fill="#090d16" />
  <circle cx="250" cy="220" r="180" fill="#6366f1" filter="url(#blurFilter)" opacity="0.8" />
  <circle cx="550" cy="350" r="220" fill="#ec4899" filter="url(#blurFilter)" opacity="0.7" />
  <circle cx="380" cy="450" r="160" fill="#06b6d4" filter="url(#blurFilter)" opacity="0.6" />
  <path d="M-100 350 C 150 150, 350 500, 600 250 C 750 100, 850 400, 950 250" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="3" />
  <path d="M-100 390 C 150 190, 350 540, 600 290 C 750 140, 850 440, 950 290" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2" />
  <path d="M-100 430 C 150 230, 350 580, 600 330 C 750 180, 850 480, 950 330" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1.5" />
</svg>`;

const sample3Svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <rect width="800" height="600" fill="#f8fafc" />
  <path d="M0 0 L450 0 L250 600 L0 600 Z" fill="#0f172a" />
  <path d="M250 0 L550 0 L350 600 L50 600 Z" fill="#0284c7" opacity="0.85" />
  <circle cx="620" cy="180" r="90" fill="#e0f2fe" />
  <rect x="520" y="320" width="200" height="12" rx="6" fill="#334155" />
  <rect x="520" y="348" width="160" height="8" rx="4" fill="#94a3b8" />
  <rect x="520" y="368" width="180" height="8" rx="4" fill="#94a3b8" />
  <rect x="520" y="388" width="130" height="8" rx="4" fill="#94a3b8" />
  <rect x="70" y="100" width="140" height="18" rx="4" fill="#38bdf8" />
  <rect x="70" y="130" width="100" height="10" rx="3" fill="#ffffff" opacity="0.8" />
  <rect x="70" y="150" width="120" height="10" rx="3" fill="#ffffff" opacity="0.8" />
  <circle cx="100" cy="480" r="24" fill="#38bdf8" />
</svg>`;

const sample4Svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <rect width="800" height="600" fill="#faf6f0" />
  <!-- Terracotta geometric backdrop -->
  <circle cx="340" cy="300" r="170" fill="#e2a87c" opacity="0.4" />
  <rect x="420" y="220" width="180" height="260" rx="90" fill="#d0845c" opacity="0.3" />
  <!-- Minimalist Monstera leaf line art -->
  <g fill="none" stroke="#2c2826" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M400 480 C 400 350, 400 200, 380 120" />
    <path d="M380 120 C 330 140, 270 200, 270 260 C 270 310, 330 350, 400 370" />
    <path d="M380 120 C 430 140, 490 200, 490 260 C 490 310, 430 350, 400 370" />
    <path d="M310 200 C 340 220, 370 230, 395 240" />
    <path d="M450 200 C 420 220, 390 230, 385 240" />
    <path d="M290 260 C 330 270, 360 280, 390 285" />
    <path d="M470 260 C 430 270, 400 280, 390 285" />
  </g>
</svg>`;

const sample5Svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <rect width="800" height="600" fill="#070714" />
  <!-- Grid wireframe floor -->
  <defs>
    <linearGradient id="neonPink" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ff007f" />
      <stop offset="100%" stop-color="#b000ff" />
    </linearGradient>
    <linearGradient id="neonCyan" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#00ffff" />
      <stop offset="100%" stop-color="#0055ff" />
    </linearGradient>
  </defs>
  <!-- Neon Sun / Horizon -->
  <circle cx="400" cy="260" r="130" fill="url(#neonPink)" opacity="0.9" />
  <rect x="250" y="270" width="300" height="6" fill="#070714" />
  <rect x="260" y="285" width="280" height="8" fill="#070714" />
  <rect x="275" y="302" width="250" height="10" fill="#070714" />
  <rect x="290" y="322" width="220" height="12" fill="#070714" />
  <rect x="310" y="344" width="180" height="14" fill="#070714" />
  <!-- Neon Triangle -->
  <polygon points="400,100 220,400 580,400" fill="none" stroke="#00ffff" stroke-width="5" />
  <!-- Synthwave lines -->
  <line x1="0" y1="430" x2="800" y2="430" stroke="#ff007f" stroke-width="2" />
  <line x1="0" y1="460" x2="800" y2="460" stroke="#ff007f" stroke-width="2.5" />
  <line x1="0" y1="500" x2="800" y2="500" stroke="#00ffff" stroke-width="3" />
  <line x1="0" y1="550" x2="800" y2="550" stroke="#00ffff" stroke-width="4" />
</svg>`;

const sampleVideoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
  <defs>
    <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="35%" stop-color="#7c2d12" />
      <stop offset="70%" stop-color="#ea580c" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>
    <radialGradient id="sunGlow" cx="50%" cy="58%" r="45%">
      <stop offset="0%" stop-color="#fef08a" stop-opacity="1" />
      <stop offset="40%" stop-color="#f97316" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#7c2d12" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="800" height="450" fill="url(#skyGrad)" />
  <circle cx="400" cy="260" r="130" fill="url(#sunGlow)" />
  <!-- Mountains in silhouette -->
  <polygon points="0,450 140,250 270,330 400,230 570,350 710,270 800,310 800,450" fill="#1c1917" />
  <polygon points="0,450 90,310 230,370 350,290 490,400 640,320 800,380 800,450" fill="#0c0a09" opacity="0.9" />
  <!-- Cinematic Camera Overlay -->
  <rect x="25" y="25" width="750" height="400" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.3" stroke-dasharray="10 20" />
  <text x="45" y="55" fill="#facc15" font-family="monospace" font-size="14" font-weight="bold">REC [●] 4K UHD 60FPS 16:9</text>
  <text x="670" y="55" fill="#ffffff" font-family="monospace" font-size="14" opacity="0.8">00:00:18:12</text>
  <circle cx="400" cy="225" r="10" fill="none" stroke="#facc15" stroke-width="2" opacity="0.7" />
  <line x1="380" y1="225" x2="420" y2="225" stroke="#facc15" stroke-width="1.5" opacity="0.7" />
  <line x1="400" y1="205" x2="400" y2="245" stroke="#facc15" stroke-width="1.5" opacity="0.7" />
</svg>`;

export const SAMPLE_STOCK_ASSETS: StockItem[] = [
  {
    id: 'sample-1',
    file: null,
    fileName: 'fintech_crypto_banking_vector_icons_set.svg',
    fileSize: 42000,
    mimeType: 'image/svg+xml',
    previewUrl: `data:image/svg+xml;base64,${svgToBase64(sample1Svg)}`,
    imageBase64: svgToBase64(sample1Svg),
    artworkType: 'vector',
    customContext: 'Modern fintech startup banking app and web UI icons',
    status: 'completed',
    title: 'Modern Minimalist Flat Vector Illustration of Financial Banking and Cryptocurrency Icons Set for Technology Mobile Application and Web Interface Design',
    titleWordCount: 20,
    breakdown: {
      styleTheme: 'Modern Minimalist Flat',
      productFormat: 'Vector Illustration Set',
      visualElements: 'Financial Banking and Cryptocurrency Icons',
      useCase: 'Technology Mobile Application and Web Interface Design',
    },
    categoryId: 8,
    tier1Keywords: [
      'finance',
      'banking',
      'wallet',
      'chart',
      'safe',
      'analytics',
      'payment',
      'blockchain',
      'exchange',
      'cloud',
    ],
    tier2Keywords: [
      'modern',
      'minimalist',
      'flat',
      'blue',
      'cyan',
      'green',
      'dark',
      'clean',
      'vibrant',
      'geometric',
    ],
    tier3Keywords: [
      'fintech',
      'mobile app',
      'dashboard',
      'web design',
      'crypto',
      'online banking',
      'investment',
      'startup',
      'brochure',
      'marketing',
      'infographic',
      'ui',
      'ux',
      'checkout',
      'trading',
    ],
    tier4Keywords: [
      'vector',
      'illustration',
      'icon pack',
      'graphic design',
      'technology',
      'digital asset',
      'commercial',
      'template',
      'symbol',
      'sign',
      'button',
      'isolated',
      'creative',
      'eps',
    ],
    allKeywords: [
      'finance',
      'banking',
      'wallet',
      'chart',
      'safe',
      'analytics',
      'payment',
      'blockchain',
      'exchange',
      'cloud',
      'modern',
      'minimalist',
      'flat',
      'blue',
      'cyan',
      'green',
      'dark',
      'clean',
      'vibrant',
      'geometric',
      'fintech',
      'mobile app',
      'dashboard',
      'web design',
      'crypto',
      'online banking',
      'investment',
      'startup',
      'brochure',
      'marketing',
      'infographic',
      'ui',
      'ux',
      'checkout',
      'trading',
      'vector',
      'illustration',
      'icon pack',
      'graphic design',
      'technology',
      'digital asset',
      'commercial',
      'template',
      'symbol',
      'sign',
      'button',
      'isolated',
      'creative',
      'eps',
    ],
    category: 'Graphic Resources',
    secondaryCategory: 'Technology',
    rejectionRiskScore: 'low',
    reviewNotes: 'High commercial demand. Strict 20-word title adhering to [Style] + [Format] + [Elements] + [Use Case]. 49 unique keywords organized strictly across 4 tiers.',
  },
  {
    id: 'sample-2',
    file: null,
    fileName: 'abstract_3d_fluid_gradient_wave_background.svg',
    fileSize: 38000,
    mimeType: 'image/svg+xml',
    previewUrl: `data:image/svg+xml;base64,${svgToBase64(sample2Svg)}`,
    imageBase64: svgToBase64(sample2Svg),
    artworkType: 'illustration',
    customContext: 'Digital agency hero banner and music festival backdrop',
    status: 'idle',
  },
  {
    id: 'sample-3',
    file: null,
    fileName: 'corporate_annual_report_flyer_template.svg',
    fileSize: 45000,
    mimeType: 'image/svg+xml',
    previewUrl: `data:image/svg+xml;base64,${svgToBase64(sample3Svg)}`,
    imageBase64: svgToBase64(sample3Svg),
    artworkType: 'vector',
    customContext: 'Q4 financial report cover and corporate business brochure',
    status: 'idle',
  },
  {
    id: 'sample-4',
    file: null,
    fileName: 'minimalist_boho_botanical_monstera_line_art.svg',
    fileSize: 31000,
    mimeType: 'image/svg+xml',
    previewUrl: `data:image/svg+xml;base64,${svgToBase64(sample4Svg)}`,
    imageBase64: svgToBase64(sample4Svg),
    artworkType: 'illustration',
    customContext: 'Boho interior wall art print and minimalist cosmetic packaging',
    status: 'idle',
  },
  {
    id: 'sample-5',
    file: null,
    fileName: 'synthwave_cyberpunk_neon_nightclub_banner.svg',
    fileSize: 52000,
    mimeType: 'image/svg+xml',
    previewUrl: `data:image/svg+xml;base64,${svgToBase64(sample5Svg)}`,
    imageBase64: svgToBase64(sample5Svg),
    artworkType: 'illustration',
    customContext: 'EDM music event poster and futuristic synthwave album cover',
    status: 'idle',
  },
  {
    id: 'sample-video-1',
    file: null,
    fileName: 'cinematic_drone_sunset_mountain_valley_footage.mp4',
    fileSize: 45000000,
    mimeType: 'video/mp4',
    mediaType: 'video',
    artworkType: 'footage',
    previewUrl: `data:image/svg+xml;base64,${svgToBase64(sampleVideoSvg)}`,
    imageBase64: svgToBase64(sampleVideoSvg),
    customContext: 'Cinematic 4K drone travel documentary and nature b-roll commercial',
    status: 'completed',
    videoMeta: {
      duration: 18.5,
      width: 3840,
      height: 2160,
      resolutionLabel: '4K UHD',
      aspectRatio: '16:9 Landscape',
      format: 'mp4',
      extractedFrameTimestamp: 1.2,
    },
    title: 'Slow Motion 4K Drone Aerial Shot of Golden Sunset Over Mountain Valley for Cinematic Travel Commercial B-Roll',
    titleWordCount: 19,
    breakdown: {
      styleTheme: 'Cinematic Aerial Drone',
      productFormat: '4K Stock Footage B-Roll',
      visualElements: 'Golden sunset over mountain valley ridges',
      useCase: 'Travel commercial and documentary production',
    },
    tier1Keywords: [
      'mountain',
      'sunset',
      'valley',
      'aerial',
      'drone',
      'ridge',
      'sun',
      'landscape',
      'skyline',
      'horizon',
    ],
    tier2Keywords: [
      'golden hour',
      'orange',
      'warm',
      'cinematic',
      'scenic',
      'majestic',
      'silhouette',
      'glowing',
      'misty',
      'dramatic',
    ],
    tier3Keywords: [
      'travel',
      'documentary',
      'commercial',
      'tourism',
      'b-roll',
      'adventure',
      'broadcasting',
      'youtube',
      'production',
      'wilderness',
      'filmmaking',
      'marketing',
      'background',
      'promo',
      'exploration',
    ],
    tier4Keywords: [
      'footage',
      '4k',
      'slow motion',
      'clip',
      'drone shot',
      'motion',
      'camera',
      'nature',
      'environment',
      'outdoor',
      'panoramic',
      'timelapse',
      'realtime',
      'horizontal',
    ],
    allKeywords: [
      'mountain',
      'sunset',
      'valley',
      'aerial',
      'drone',
      'ridge',
      'sun',
      'landscape',
      'skyline',
      'horizon',
      'golden hour',
      'orange',
      'warm',
      'cinematic',
      'scenic',
      'majestic',
      'silhouette',
      'glowing',
      'misty',
      'dramatic',
      'travel',
      'documentary',
      'commercial',
      'tourism',
      'b-roll',
      'adventure',
      'broadcasting',
      'youtube',
      'production',
      'wilderness',
      'filmmaking',
      'marketing',
      'background',
      'promo',
      'exploration',
      'footage',
      '4k',
      'slow motion',
      'clip',
      'drone shot',
      'motion',
      'camera',
      'nature',
      'environment',
      'outdoor',
      'panoramic',
      'timelapse',
      'realtime',
      'horizontal',
    ],
    category: 'Landscapes',
    categoryId: 11,
    secondaryCategory: 'Technology',
    rejectionRiskScore: 'low',
    reviewNotes: 'High commercial demand 4K drone stock footage with all 49 keywords adhering to Adobe Stock & Shutterstock specifications.',
  },
];
