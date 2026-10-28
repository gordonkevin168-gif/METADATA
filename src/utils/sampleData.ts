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

const sampleEvChargingSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <defs>
    <linearGradient id="evBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#050811" />
      <stop offset="50%" stop-color="#0b1329" />
      <stop offset="100%" stop-color="#030712" />
    </linearGradient>
    <linearGradient id="batteryGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
    <filter id="neonBlur" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
  <rect width="800" height="600" fill="url(#evBg)" />
  <g stroke="#1e293b" stroke-width="1" opacity="0.4">
    <line x1="0" y1="100" x2="800" y2="100" />
    <line x1="0" y1="200" x2="800" y2="200" />
    <line x1="0" y1="300" x2="800" y2="300" />
    <line x1="0" y1="400" x2="800" y2="400" />
    <line x1="0" y1="500" x2="800" y2="500" />
    <line x1="160" y1="0" x2="160" y2="600" />
    <line x1="320" y1="0" x2="320" y2="600" />
    <line x1="480" y1="0" x2="480" y2="600" />
    <line x1="640" y1="0" x2="640" y2="600" />
  </g>
  <circle cx="400" cy="270" r="160" fill="none" stroke="#1e293b" stroke-width="14" />
  <circle cx="400" cy="270" r="160" fill="none" stroke="url(#batteryGrad)" stroke-width="14" stroke-dasharray="880" stroke-dashoffset="190" stroke-linecap="round" filter="url(#neonBlur)" />
  <circle cx="400" cy="270" r="120" fill="#0f172a" stroke="#334155" stroke-width="2" />
  <path d="M395 195 L375 250 L405 250 L390 310 L430 240 L405 240 Z" fill="#00f2fe" filter="url(#neonBlur)" />
  <text x="400" y="345" fill="#ffffff" font-family="monospace" font-size="34" font-weight="900" text-anchor="middle">88%</text>
  <text x="400" y="370" fill="#38bdf8" font-family="monospace" font-size="12" font-weight="bold" letter-spacing="3" text-anchor="middle">FAST CHARGING</text>
  <rect x="80" y="60" width="220" height="60" rx="8" fill="#0f172a" stroke="#00f2fe" stroke-width="1.5" opacity="0.9" />
  <text x="95" y="85" fill="#38bdf8" font-family="monospace" font-size="10" font-weight="bold">DC FAST CHARGER 350kW</text>
  <text x="95" y="105" fill="#ffffff" font-family="monospace" font-size="14" font-weight="bold">STATION #04 ACTIVE</text>
  <rect x="500" y="60" width="220" height="60" rx="8" fill="#0f172a" stroke="#10b981" stroke-width="1.5" opacity="0.9" />
  <text x="515" y="85" fill="#34d399" font-family="monospace" font-size="10" font-weight="bold">ESTIMATED TIME TO FULL</text>
  <text x="515" y="105" fill="#ffffff" font-family="monospace" font-size="14" font-weight="bold">12 MINS · 420V / 240A</text>
  <rect x="120" y="480" width="560" height="70" rx="12" fill="#0b1329" stroke="#334155" stroke-width="1.5" />
  <g transform="translate(145, 500)">
    <rect x="0" y="0" width="85" height="30" rx="4" fill="#06b6d4" />
    <rect x="95" y="0" width="85" height="30" rx="4" fill="#06b6d4" />
    <rect x="190" y="0" width="85" height="30" rx="4" fill="#06b6d4" />
    <rect x="285" y="0" width="85" height="30" rx="4" fill="#06b6d4" />
    <rect x="380" y="0" width="85" height="30" rx="4" fill="#1e293b" stroke="#38bdf8" stroke-dasharray="4 4" />
  </g>
  <text x="400" y="580" fill="#64748b" font-family="monospace" font-size="11" text-anchor="middle">EV AUTOMOTIVE INDUSTRY POWER LEVEL HUD · 3D RENDERING</text>
</svg>`;

const sampleAiRecruitmentSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
  <defs>
    <linearGradient id="aiRecBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0f1d" />
      <stop offset="100%" stop-color="#111827" />
    </linearGradient>
  </defs>
  <rect width="800" height="450" fill="url(#aiRecBg)" />
  <rect x="30" y="30" width="740" height="45" rx="8" fill="#1f2937" stroke="#374151" stroke-width="1.5" />
  <circle cx="55" cy="52" r="6" fill="#ef4444" />
  <circle cx="75" cy="52" r="6" fill="#f59e0b" />
  <circle cx="95" cy="52" r="6" fill="#10b981" />
  <text x="130" y="57" fill="#60a5fa" font-family="monospace" font-size="13" font-weight="bold">AI RECRUITMENT SOFTWARE · CV SCREENING PIPELINE 4K</text>
  <text x="640" y="57" fill="#9ca3af" font-family="monospace" font-size="11">AUTOMATED HR</text>

  <rect x="30" y="90" width="240" height="310" rx="12" fill="#1e2433" stroke="#3b82f6" stroke-width="1.5" />
  <circle cx="150" cy="170" r="50" fill="#0f172a" stroke="#60a5fa" stroke-width="2" />
  <rect x="130" y="150" width="40" height="30" rx="6" fill="#3b82f6" opacity="0.8" />
  <circle cx="140" cy="165" r="4" fill="#ffffff" />
  <circle cx="160" cy="165" r="4" fill="#ffffff" />
  <path d="M150 120 L150 145" stroke="#60a5fa" stroke-width="3" />
  <circle cx="150" cy="118" r="5" fill="#38bdf8" />
  <line x1="80" y1="240" x2="220" y2="240" stroke="#00f2fe" stroke-width="2" stroke-dasharray="6 4" />
  <text x="150" y="275" fill="#ffffff" font-family="monospace" font-size="13" font-weight="bold" text-anchor="middle">AI SCANNING CV</text>
  <text x="150" y="300" fill="#34d399" font-family="monospace" font-size="11" text-anchor="middle">MATCH SCORE: 98.4%</text>
  <text x="150" y="325" fill="#94a3b8" font-family="monospace" font-size="10" text-anchor="middle">EXPERIENCE: 8+ YRS UX</text>
  <rect x="70" y="345" width="160" height="26" rx="6" fill="#10b981" />
  <text x="150" y="362" fill="#064e3b" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle">AUTO-SHORTLISTED</text>

  <g transform="translate(290, 90)">
    <rect x="0" y="0" width="150" height="310" rx="10" fill="#182030" stroke="#334155" />
    <text x="15" y="28" fill="#93c5fd" font-family="monospace" font-size="11" font-weight="bold">INBOX (1,420 CV)</text>
    <rect x="12" y="45" width="126" height="55" rx="6" fill="#0f172a" stroke="#1e293b" />
    <rect x="12" y="110" width="126" height="55" rx="6" fill="#0f172a" stroke="#1e293b" />
    <rect x="12" y="175" width="126" height="55" rx="6" fill="#0f172a" stroke="#1e293b" />

    <rect x="165" y="0" width="150" height="310" rx="10" fill="#182030" stroke="#3b82f6" stroke-width="1.5" />
    <text x="180" y="28" fill="#60a5fa" font-family="monospace" font-size="11" font-weight="bold">AI SCREENING (48)</text>
    <rect x="177" y="45" width="126" height="70" rx="6" fill="#1e3a8a" opacity="0.6" stroke="#3b82f6" />
    <rect x="177" y="125" width="126" height="70" rx="6" fill="#1e3a8a" opacity="0.6" stroke="#3b82f6" />

    <rect x="330" y="0" width="150" height="310" rx="10" fill="#182030" stroke="#10b981" stroke-width="1.5" />
    <text x="345" y="28" fill="#34d399" font-family="monospace" font-size="11" font-weight="bold">HIRED / OFFER (6)</text>
    <rect x="342" y="45" width="126" height="75" rx="6" fill="#064e3b" opacity="0.7" stroke="#10b981" />
  </g>

  <rect x="35" y="415" width="730" height="20" fill="none" />
  <circle cx="50" cy="425" r="5" fill="#ef4444" />
  <text x="65" y="429" fill="#facc15" font-family="monospace" font-size="10" font-weight="bold">REC [●] 4K 60FPS UHD · EXPLAINER MOTION GRAPHICS</text>
  <text x="660" y="429" fill="#9ca3af" font-family="monospace" font-size="10">00:00:24:18</text>
</svg>`;

const sampleCyberSecuritySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
  <defs>
    <linearGradient id="cyberBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#060913" />
      <stop offset="50%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <linearGradient id="laptopScreen" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b1329" />
      <stop offset="100%" stop-color="#030712" />
    </linearGradient>
    <linearGradient id="neonBlue" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00f2fe" />
      <stop offset="100%" stop-color="#4facfe" />
    </linearGradient>
  </defs>
  <rect width="800" height="450" fill="url(#cyberBg)" />
  <g transform="translate(100, 25)">
    <!-- Laptop Body -->
    <rect x="50" y="20" width="500" height="310" rx="16" fill="#1e2433" stroke="#334155" stroke-width="2" />
    <rect x="65" y="35" width="470" height="280" rx="8" fill="url(#laptopScreen)" stroke="#1e293b" />
    <circle cx="300" cy="27" r="3" fill="#64748b" />
    <polygon points="10,340 590,340 550,375 50,375" fill="#1e293b" stroke="#334155" />
    <rect x="250" y="340" width="100" height="6" rx="3" fill="#0f172a" />
    
    <!-- Header bar -->
    <rect x="75" y="45" width="450" height="32" rx="6" fill="#0f172a" stroke="#1e293b" />
    <circle cx="95" cy="61" r="5" fill="#ef4444" />
    <circle cx="110" cy="61" r="5" fill="#f59e0b" />
    <circle cx="125" cy="61" r="5" fill="#10b981" />
    <text x="145" y="65" fill="#38bdf8" font-family="monospace" font-size="11" font-weight="bold">CYBERSECURITY MONITORING SYSTEM · 4K</text>
    
    <!-- Left panel: Password Protection & Lock Icon -->
    <rect x="75" y="85" width="210" height="220" rx="8" fill="#111827" stroke="#1e293b" />
    <circle cx="180" cy="130" r="28" fill="#0f172a" stroke="#00f2fe" stroke-width="2" />
    <path d="M172 126 L172 114 A8 8 0 0 1 188 114 L188 126" fill="none" stroke="#00f2fe" stroke-width="2.5" stroke-linecap="round" />
    <rect x="168" y="126" width="24" height="18" rx="3" fill="#00f2fe" />
    <circle cx="180" cy="134" r="2" fill="#0f172a" />
    <text x="180" y="180" fill="#ffffff" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle">PASSWORD PROTECTION</text>
    <!-- Password dots -->
    <rect x="95" y="195" width="170" height="26" rx="6" fill="#030712" stroke="#374151" />
    <circle cx="120" cy="208" r="3.5" fill="#10b981" />
    <circle cx="138" cy="208" r="3.5" fill="#10b981" />
    <circle cx="156" cy="208" r="3.5" fill="#10b981" />
    <circle cx="174" cy="208" r="3.5" fill="#10b981" />
    <circle cx="192" cy="208" r="3.5" fill="#10b981" />
    <circle cx="210" cy="208" r="3.5" fill="#10b981" />
    <circle cx="228" cy="208" r="3.5" fill="#10b981" />
    <rect x="95" y="235" width="170" height="22" rx="4" fill="#065f46" />
    <text x="180" y="250" fill="#34d399" font-family="monospace" font-size="10" font-weight="bold" text-anchor="middle">SECURE LOGIN · GRANTED</text>

    <!-- Right panel: Charts & Analytics Interface -->
    <rect x="295" y="85" width="230" height="105" rx="8" fill="#111827" stroke="#1e293b" />
    <text x="310" y="105" fill="#94a3b8" font-family="monospace" font-size="9" font-weight="bold">DATA PROTECTION TRAFFIC</text>
    <path d="M315 160 L345 140 L375 150 L405 120 L435 135 L465 110 L495 125" fill="none" stroke="url(#neonBlue)" stroke-width="2.5" stroke-linecap="round" />
    
    <rect x="295" y="198" width="230" height="107" rx="8" fill="#111827" stroke="#1e293b" />
    <text x="310" y="218" fill="#94a3b8" font-family="monospace" font-size="9" font-weight="bold">THREAT DETECTION METRICS</text>
    <rect x="315" y="255" width="18" height="35" rx="2" fill="#10b981" />
    <rect x="345" y="240" width="18" height="50" rx="2" fill="#10b981" />
    <rect x="375" y="230" width="18" height="60" rx="2" fill="#00f2fe" />
    <rect x="405" y="245" width="18" height="45" rx="2" fill="#00f2fe" />
    <rect x="435" y="260" width="18" height="30" rx="2" fill="#3b82f6" />
    <rect x="465" y="235" width="18" height="55" rx="2" fill="#10b981" />
  </g>
</svg>`;

export const SAMPLE_STOCK_ASSETS: StockItem[] = [
  {
    id: 'sample-cybersecurity-laptop',
    file: null,
    fileName: 'animated_laptop_password_cybersecurity_dashboard.mp4',
    fileSize: 52000000,
    mimeType: 'video/mp4',
    mediaType: 'video',
    artworkType: 'footage',
    previewUrl: `data:image/svg+xml;base64,${svgToBase64(sampleCyberSecuritySvg)}`,
    imageBase64: svgToBase64(sampleCyberSecuritySvg),
    customContext: 'High demand Adobe Stock Page 1 animated laptop showing cybersecurity password protection and charts interface',
    status: 'completed',
    videoMeta: {
      duration: 20.0,
      width: 3840,
      height: 2160,
      resolutionLabel: '4K UHD',
      aspectRatio: '16:9 Landscape',
      format: 'mp4',
      extractedFrameTimestamp: 2.0,
    },
    title: 'Animated Laptop Displaying Password Protection Dashboard Interface with Charts for Cybersecurity Monitoring System',
    titleWordCount: 13,
    breakdown: {
      styleTheme: 'Animated Digital UI Graphic',
      productFormat: '4K Stock Footage Motion',
      visualElements: 'Laptop with password protection dashboard, lock icon, and charts',
      useCase: 'Secure login, data protection, and cybersecurity monitoring system',
    },
    categoryId: 19,
    category: 'Technology',
    secondaryCategory: 'Business',
    tier1Keywords: [
      'laptop',
      'dashboard',
      'interface',
      'charts',
      'lock',
      'icon',
      'password',
      'screen',
      'cybersecurity',
      'display',
    ],
    tier2Keywords: [
      'animated',
      'digital',
      'blue',
      'modern',
      'clean',
      'motion',
      'graphic',
      'ui',
      'tech',
      'minimalist',
    ],
    tier3Keywords: [
      'security',
      'protection',
      'login',
      'monitoring',
      'authentication',
      'privacy',
      'access',
      'data',
      'system',
      'software',
      'safe',
      'cloud',
      'network',
      'corporate',
      'business',
    ],
    tier4Keywords: [
      'footage',
      '4k',
      'clip',
      'animation',
      'loop',
      'horizontal',
      'concept',
      'innovation',
      'intelligence',
      'virtual',
      'analytics',
      'compliance',
      'enterprise',
      'solution',
    ],
    allKeywords: [
      'laptop',
      'dashboard',
      'interface',
      'charts',
      'lock',
      'icon',
      'password',
      'screen',
      'cybersecurity',
      'display',
      'animated',
      'digital',
      'blue',
      'modern',
      'clean',
      'motion',
      'graphic',
      'ui',
      'tech',
      'minimalist',
      'security',
      'protection',
      'login',
      'monitoring',
      'authentication',
      'privacy',
      'access',
      'data',
      'system',
      'software',
      'safe',
      'cloud',
      'network',
      'corporate',
      'business',
      'footage',
      '4k',
      'clip',
      'animation',
      'loop',
      'horizontal',
      'concept',
      'innovation',
      'intelligence',
      'virtual',
      'analytics',
      'compliance',
      'enterprise',
      'solution',
    ],
    rejectionRiskScore: 'low',
    reviewNotes: 'Standar Emas Adobe Stock Page 1: Menghindari awalan klise kamera (tanpa "Static 4K Video Shot of..."), langsung ke subjek visual utama. Kata penghubung & kata kerja difilter, hanya mengambil subjek komersial berpeluang pencarian besar.',
  },
  {
    id: 'sample-ev-charging',
    file: null,
    fileName: 'ev_battery_charging_interface_3d_render.svg',
    fileSize: 48000,
    mimeType: 'image/svg+xml',
    previewUrl: `data:image/svg+xml;base64,${svgToBase64(sampleEvChargingSvg)}`,
    imageBase64: svgToBase64(sampleEvChargingSvg),
    artworkType: 'illustration',
    customContext: 'Futuristic electric vehicle charging station UI and 3D telemetry display',
    status: 'completed',
    title: 'Battery Charging Status of Electric Vehicle Interface Using Fast Charger from Station Display',
    titleWordCount: 13,
    breakdown: {
      styleTheme: '3D Rendering Futuristic',
      productFormat: 'UI Display Interface',
      visualElements: 'Battery charging status, DC fast charger, fuel power level indicator',
      useCase: 'EV automotive industry technology and clean energy charging station',
    },
    categoryId: 19,
    category: 'Technology',
    secondaryCategory: 'Transport',
    tier1Keywords: [
      'battery',
      'charger',
      'station',
      'vehicle',
      'display',
      'interface',
      'indicator',
      'screen',
      'gauge',
      'charging',
    ],
    tier2Keywords: [
      '3d rendering',
      'futuristic',
      'fuel',
      'ui',
      'ev',
      'automotive',
      'industry',
      'cyan',
      'glowing',
      'digital',
    ],
    tier3Keywords: [
      'clean energy',
      'electricity',
      'dashboard',
      'eco',
      'mobility',
      'smart car',
      'transport',
      'drive',
      'sustainable',
      'automobile',
      'cable',
      'meter',
      'electric vehicle',
      'power level',
      'fast charger',
    ],
    tier4Keywords: [
      'innovation',
      'high tech',
      'render',
      'visual',
      'commercial',
      'isolated',
      'concept',
      'dark',
      'illuminated',
      'plug',
      'power',
      'energy',
      'device',
      'telemetry',
    ],
    allKeywords: [
      'battery',
      'charger',
      'station',
      'vehicle',
      'display',
      'interface',
      'indicator',
      'screen',
      'gauge',
      'charging',
      '3d rendering',
      'futuristic',
      'fuel',
      'ui',
      'ev',
      'automotive',
      'industry',
      'cyan',
      'glowing',
      'digital',
      'clean energy',
      'electricity',
      'dashboard',
      'eco',
      'mobility',
      'smart car',
      'transport',
      'drive',
      'sustainable',
      'automobile',
      'cable',
      'meter',
      'electric vehicle',
      'power level',
      'fast charger',
      'innovation',
      'high tech',
      'render',
      'visual',
      'commercial',
      'isolated',
      'concept',
      'dark',
      'illuminated',
      'plug',
      'power',
      'energy',
      'device',
      'telemetry',
    ],
    rejectionRiskScore: 'low',
    reviewNotes: 'Audit Kurator Adobe Stock: 100% Selaras. Objek visual hero (battery, charger, station) memimpin Tier 1, 80% kata tunggal, dan kata pengisi judul difilter rapi.',
  },
  {
    id: 'sample-ai-recruitment',
    file: null,
    fileName: 'animated_4k_ai_recruitment_cv_screening_explainer.mp4',
    fileSize: 48000000,
    mimeType: 'video/mp4',
    mediaType: 'video',
    artworkType: 'footage',
    previewUrl: `data:image/svg+xml;base64,${svgToBase64(sampleAiRecruitmentSvg)}`,
    imageBase64: svgToBase64(sampleAiRecruitmentSvg),
    customContext: 'Explainer video animation showing AI recruitment software automating HR workflow',
    status: 'completed',
    videoMeta: {
      duration: 24.5,
      width: 3840,
      height: 2160,
      resolutionLabel: '4K UHD',
      aspectRatio: '16:9 Landscape',
      format: 'mp4',
      extractedFrameTimestamp: 2.4,
    },
    title: 'AI Recruitment Software Automating CV Screening Process for Efficient Hiring and Workflow Management',
    titleWordCount: 13,
    breakdown: {
      styleTheme: 'Animated Explainer Motion Graphic',
      productFormat: '4K Video Footage',
      visualElements: 'AI recruitment software automating CV screening dashboard',
      useCase: 'Efficient hiring and human resources management workflow',
    },
    categoryId: 3,
    category: 'Business',
    secondaryCategory: 'Technology',
    tier1Keywords: [
      'robot',
      'dashboard',
      'infographic',
      'interface',
      'recruitment',
      'screening',
      'automation',
      'software',
      'hiring',
      'process',
    ],
    tier2Keywords: [
      'animated',
      'digital',
      'blue',
      'minimalist',
      'graphic',
      'modern',
      'clean',
      'motion',
      'corporate',
      'tech',
    ],
    tier3Keywords: [
      'hr',
      'management',
      'business',
      'workflow',
      'ux',
      'designer',
      'analytics',
      'efficiency',
      'technology',
      'presentation',
      'marketing',
      'strategy',
      'data',
      'application',
      'employment',
    ],
    tier4Keywords: [
      'footage',
      '4k',
      'clip',
      'roll',
      'cinematic',
      'loop',
      'horizontal',
      'concept',
      'innovation',
      'intelligence',
      'virtual',
      'system',
      'optimization',
      'professional',
    ],
    allKeywords: [
      'robot',
      'dashboard',
      'infographic',
      'interface',
      'recruitment',
      'screening',
      'automation',
      'software',
      'hiring',
      'process',
      'animated',
      'digital',
      'blue',
      'minimalist',
      'graphic',
      'modern',
      'clean',
      'motion',
      'corporate',
      'tech',
      'hr',
      'management',
      'business',
      'workflow',
      'ux',
      'designer',
      'analytics',
      'efficiency',
      'technology',
      'presentation',
      'marketing',
      'strategy',
      'data',
      'application',
      'employment',
      'footage',
      '4k',
      'clip',
      'roll',
      'cinematic',
      'loop',
      'horizontal',
      'concept',
      'innovation',
      'intelligence',
      'virtual',
      'system',
      'optimization',
      'professional',
    ],
    rejectionRiskScore: 'low',
    reviewNotes: 'Perfect title-keyword symbiosis. Top-ranking Adobe Stock 4K video footage keywords matching corporate HR tech search demand.',
  },
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
    title: 'Financial Banking and Cryptocurrency Vector Icons Set for Mobile App and Web Design',
    titleWordCount: 13,
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
    title: 'Golden Sunset Over Mountain Valley Ridges Aerial Panorama for Nature Travel Documentary',
    titleWordCount: 12,
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
    reviewNotes: 'Format Video Standar Page 1: Menghindari awalan klise kamera (tanpa "Slow Motion 4K Drone Aerial Shot of..."), langsung ke subjek visual utama. 49 keyword berbobot komersial tinggi.',
  },
];
