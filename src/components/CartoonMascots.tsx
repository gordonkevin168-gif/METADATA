import React from 'react';

// ==========================================
// 1. METADATA GENERATOR MASCOT (Blue Theme)
// Boy with blue hair, hoodie, laptop & metadata sheet
// ==========================================
export const MetadataMascot: React.FC<{ size?: number; className?: string; animated?: boolean }> = ({
  size = 220,
  className = '',
  animated = true,
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative select-none shrink-0 ${className} ${animated ? 'group' : ''}`}
    >
      <svg
        viewBox="0 0 320 320"
        className="w-full h-full drop-shadow-[0_12px_24px_rgba(37,99,235,0.35)] transition-transform duration-300 group-hover:scale-105"
      >
        <defs>
          <linearGradient id="metaBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="50%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
          <linearGradient id="metaHairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e40af" />
            <stop offset="60%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
          <linearGradient id="metaHoodieGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <linearGradient id="metaCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f1f5f9" />
          </linearGradient>
          <filter id="metaGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Rounded Container Background */}
        <rect x="10" y="10" width="300" height="300" rx="60" fill="url(#metaBgGrad)" />

        {/* Ambient Cosmic Halos & Soft Highlights */}
        <circle cx="260" cy="60" r="40" fill="#60a5fa" opacity="0.3" filter="url(#metaGlow)" />
        <circle cx="70" cy="250" r="50" fill="#38bdf8" opacity="0.25" />
        <circle cx="160" cy="160" r="110" fill="#1d4ed8" opacity="0.4" />

        {/* Floating Background Icons */}
        {/* Floating Photo Icon Top Right */}
        <g transform="translate(230, 45) rotate(14)">
          <rect width="44" height="36" rx="8" fill="#ffffff" opacity="0.9" />
          <rect x="4" y="4" width="36" height="28" rx="5" fill="#38bdf8" />
          <polygon points="10,26 18,16 26,24 32,18 36,26" fill="#ffffff" />
          <circle cx="15" cy="11" r="3" fill="#facc15" />
        </g>

        {/* Floating Tag Icon Top Right */}
        <g transform="translate(268, 95) rotate(-10)">
          <rect width="28" height="22" rx="6" fill="#f59e0b" />
          <circle cx="8" cy="11" r="2.5" fill="#ffffff" />
          <line x1="14" y1="8" x2="22" y2="8" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          <line x1="14" y1="14" x2="20" y2="14" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Little Sparkling Stars */}
        <polygon points="50,45 53,52 60,55 53,58 50,65 47,58 40,55 47,52" fill="#ffffff" opacity="0.8" />
        <polygon points="275,140 277,145 282,147 277,149 275,154 273,149 268,147 273,145" fill="#fde047" />

        {/* --- Character Boy Body & Hoodie --- */}
        <path
          d="M20,290 C30,230 70,210 120,210 C150,210 180,225 195,280 L20,290 Z"
          fill="url(#metaHoodieGrad)"
        />
        {/* Hoodie Collar & Strings */}
        <path d="M75,215 Q105,250 135,215" stroke="#ffffff" strokeWidth="8" fill="none" strokeLinecap="round" />
        <path d="M90,235 L88,265" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
        <path d="M120,235 L122,265" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />

        {/* Neck */}
        <rect x="90" y="165" width="30" height="25" rx="6" fill="#fed7aa" />

        {/* Face */}
        <ellipse cx="105" cy="140" rx="42" ry="40" fill="#ffedd5" />
        {/* Blushing Cheeks */}
        <ellipse cx="78" cy="152" rx="7" ry="4" fill="#fb7185" opacity="0.75" />
        <ellipse cx="132" cy="152" rx="7" ry="4" fill="#fb7185" opacity="0.75" />

        {/* Left Eye (Big Joyful Anime Eye) */}
        <ellipse cx="88" cy="138" rx="8" ry="11" fill="#1e3a8a" />
        <circle cx="86" cy="133" r="3.5" fill="#ffffff" />
        <circle cx="91" cy="142" r="1.5" fill="#38bdf8" />
        {/* Eyebrow */}
        <path d="M78,124 Q88,120 96,125" stroke="#1e3a8a" strokeWidth="3" strokeLinecap="round" fill="none" />

        {/* Right Eye (Cute Winking Eye) */}
        <path d="M120,138 Q130,130 140,138" stroke="#1e3a8a" strokeWidth="4" strokeLinecap="round" fill="none" />
        {/* Right Eyebrow */}
        <path d="M118,125 Q128,120 138,124" stroke="#1e3a8a" strokeWidth="3" strokeLinecap="round" fill="none" />

        {/* Smile Mouth */}
        <path d="M94,156 Q105,170 118,156" fill="#f43f5e" stroke="#1e3a8a" strokeWidth="2.5" />
        <ellipse cx="106" cy="162" rx="6" ry="3" fill="#ffffff" />

        {/* Anime Spiky Blue Hair */}
        <path
          d="M58,135 C52,105 65,75 95,65 C125,55 155,70 162,100 C168,125 158,150 152,160 
             L145,140 C140,130 135,115 125,120 C120,110 110,105 102,118 C95,110 88,112 85,125 
             C78,125 72,135 68,145 Z"
          fill="url(#metaHairGrad)"
        />
        {/* Front Hair Bangs */}
        <polygon points="70,100 85,125 90,110" fill="#2563eb" />
        <polygon points="88,95 105,130 110,112" fill="#3b82f6" />
        <polygon points="108,98 126,128 132,110" fill="#60a5fa" />
        <polygon points="128,105 145,130 148,115" fill="#2563eb" />

        {/* Left Hand Pointing Forward / Thumbs up */}
        <g transform="translate(70, 185)">
          {/* Sleeve */}
          <path d="M-10,35 Q15,0 45,5 L40,35 Z" fill="#1e40af" />
          <ellipse cx="40" cy="18" rx="8" ry="12" fill="#ffffff" />
          {/* Hand & Pointing Finger */}
          <ellipse cx="55" cy="16" rx="14" ry="10" fill="#fed7aa" />
          {/* Pointing index finger */}
          <rect x="62" y="10" width="28" height="11" rx="5.5" fill="#fed7aa" />
          {/* Thumb up */}
          <rect x="52" y="-2" width="10" height="18" rx="5" fill="#fed7aa" transform="rotate(-20 52 -2)" />
        </g>

        {/* Sleek Laptop In Hand */}
        <g transform="translate(18, 220) rotate(-6)">
          {/* Laptop Screen */}
          <rect width="100" height="65" rx="6" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
          <rect x="5" y="5" width="90" height="55" rx="4" fill="#0f172a" />
          {/* Glowing Laptop content */}
          <rect x="12" y="14" width="40" height="4" rx="2" fill="#38bdf8" />
          <rect x="12" y="24" width="65" height="3" rx="1.5" fill="#94a3b8" />
          <rect x="12" y="32" width="55" height="3" rx="1.5" fill="#94a3b8" />
          <circle cx="70" cy="42" r="7" fill="#38bdf8" />
          {/* Little Crown Logo on laptop lid */}
          <polygon points="45,45 48,50 52,43 56,50 59,45 59,53 45,53" fill="#facc15" />
          {/* Base */}
          <polygon points="-8,65 108,65 100,72 0,72" fill="#cbd5e1" />
        </g>

        {/* --- Floating 3D Metadata Sheet (Signature UI from Image 2) --- */}
        <g transform="translate(155, 120)">
          {/* Drop shadow */}
          <rect x="4" y="6" width="145" height="175" rx="20" fill="#000000" opacity="0.3" filter="url(#metaGlow)" />
          {/* White Card */}
          <rect width="145" height="175" rx="20" fill="url(#metaCardGrad)" stroke="#cbd5e1" strokeWidth="2.5" />

          {/* Header Title Bar */}
          <text x="18" y="32" fontFamily="sans-serif" fontSize="15" fontWeight="800" fill="#1e293b">
            Metadata
          </text>
          {/* Checkmark Badges Top Right */}
          <circle cx="112" cy="26" r="9" fill="#e0f2fe" />
          <path d="M108,26 L111,29 L117,23" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="130" cy="46" r="9" fill="#e0f2fe" />
          <path d="M126,46 L129,49 L135,43" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />

          {/* Decorative lines under title */}
          <line x1="18" y1="44" x2="80" y2="44" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
          <line x1="18" y1="54" x2="65" y2="54" stroke="#e2e8f0" strokeWidth="4" strokeLinecap="round" />

          {/* Pill 1: Title */}
          <g transform="translate(14, 66)">
            <rect width="118" height="24" rx="12" fill="#f0f9ff" stroke="#bae6fd" strokeWidth="1.5" />
            <rect x="4" y="3" width="18" height="18" rx="9" fill="#0284c7" />
            <text x="10" y="16" fontFamily="sans-serif" fontSize="10" fontWeight="900" fill="#ffffff">T</text>
            <text x="28" y="16" fontFamily="sans-serif" fontSize="11" fontWeight="700" fill="#0369a1">Title</text>
          </g>

          {/* Pill 2: Keywords */}
          <g transform="translate(14, 94)">
            <rect width="118" height="24" rx="12" fill="#f0f9ff" stroke="#bae6fd" strokeWidth="1.5" />
            <rect x="4" y="3" width="18" height="18" rx="9" fill="#0284c7" />
            <circle cx="13" cy="11" r="3.5" stroke="#ffffff" strokeWidth="1.5" fill="none" />
            <line x1="15.5" y1="13.5" x2="18.5" y2="16.5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
            <text x="28" y="16" fontFamily="sans-serif" fontSize="11" fontWeight="700" fill="#0369a1">Keywords</text>
          </g>

          {/* Pill 3: Category */}
          <g transform="translate(14, 122)">
            <rect width="118" height="24" rx="12" fill="#f0f9ff" stroke="#bae6fd" strokeWidth="1.5" />
            <rect x="4" y="3" width="18" height="18" rx="9" fill="#0284c7" />
            {/* Folder icon */}
            <path d="M8,9 L11,9 L13,11 L18,11 L18,16 L8,16 Z" fill="#ffffff" />
            <text x="28" y="16" fontFamily="sans-serif" fontSize="11" fontWeight="700" fill="#0369a1">Category</text>
          </g>

          {/* Pill 4: Description */}
          <g transform="translate(14, 150)">
            <rect width="118" height="20" rx="10" fill="#0284c7" />
            <line x1="10" y1="8" x2="16" y2="8" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            <line x1="10" y1="12" x2="16" y2="12" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            <text x="24" y="14" fontFamily="sans-serif" fontSize="10" fontWeight="700" fill="#ffffff">Description</text>
          </g>
        </g>
      </svg>
    </div>
  );
};

// ==========================================
// 2. IMAGE GENERATOR MASCOT (Purple Theme)
// Anime girl with purple hair, stylus, photo polaroids & AI badge
// ==========================================
export const ImageMascot: React.FC<{ size?: number; className?: string; animated?: boolean }> = ({
  size = 220,
  className = '',
  animated = true,
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative select-none shrink-0 ${className} ${animated ? 'group' : ''}`}
    >
      <svg
        viewBox="0 0 320 320"
        className="w-full h-full drop-shadow-[0_12px_24px_rgba(147,51,234,0.35)] transition-transform duration-300 group-hover:scale-105"
      >
        <defs>
          <linearGradient id="imgBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b0764" />
            <stop offset="50%" stopColor="#7e22ce" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
          <linearGradient id="imgHairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2e1065" />
            <stop offset="50%" stopColor="#4c1d95" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <linearGradient id="imgHoodieGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#581c87" />
            <stop offset="100%" stopColor="#7e22ce" />
          </linearGradient>
          <filter id="imgGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Rounded Container Background */}
        <rect x="10" y="10" width="300" height="300" rx="60" fill="url(#imgBgGrad)" />

        {/* Ambient Cosmic Halos */}
        <circle cx="80" cy="70" r="50" fill="#a855f7" opacity="0.3" filter="url(#imgGlow)" />
        <circle cx="260" cy="240" r="45" fill="#e879f9" opacity="0.25" />

        {/* Floating Top AI Badge */}
        <g transform="translate(240, 40) rotate(12)">
          <rect width="48" height="42" rx="14" fill="#a855f7" stroke="#ffffff" strokeWidth="2.5" />
          <text x="24" y="27" fontFamily="sans-serif" fontSize="17" fontWeight="900" fill="#ffffff" textAnchor="middle">
            AI
          </text>
          <polygon points="40,6 42,10 46,11 42,13 40,17 38,13 34,11 38,10" fill="#fde047" />
        </g>

        {/* Floating Top Left Polaroid */}
        <g transform="translate(25, 45) rotate(-16)">
          <rect width="48" height="56" rx="6" fill="#ffffff" opacity="0.9" />
          <rect x="4" y="4" width="40" height="40" rx="4" fill="#38bdf8" />
          <circle cx="16" cy="16" r="4" fill="#facc15" />
          <polygon points="8,40 18,24 28,34 35,26 42,40" fill="#0284c7" />
        </g>

        {/* Sparkling Stars */}
        <polygon points="215,35 218,42 225,45 218,48 215,55 212,48 205,45 212,42" fill="#ffffff" opacity="0.9" />
        <polygon points="45,170 47,174 52,176 47,178 45,183 43,178 38,176 43,174" fill="#fbcfe8" />

        {/* --- Anime Girl Body & Hoodie --- */}
        <path
          d="M80,290 C90,225 130,205 180,205 C230,205 270,225 280,290 Z"
          fill="url(#imgHoodieGrad)"
        />
        {/* Hoodie V-neck with white piping */}
        <path d="M150,210 Q180,240 210,210" stroke="#ffffff" strokeWidth="7" fill="none" strokeLinecap="round" />

        {/* Long Purple Hair Behind */}
        <path
          d="M100,120 C90,170 85,250 110,290 L240,290 C265,250 260,170 250,120 Z"
          fill="url(#imgHairGrad)"
          opacity="0.95"
        />

        {/* Neck */}
        <rect x="168" y="165" width="24" height="25" rx="5" fill="#fed7aa" />

        {/* Face */}
        <ellipse cx="180" cy="138" rx="42" ry="40" fill="#fff1e6" />
        {/* Blushing Cheeks */}
        <ellipse cx="152" cy="150" rx="8" ry="4" fill="#f43f5e" opacity="0.75" />
        <ellipse cx="208" cy="150" rx="8" ry="4" fill="#f43f5e" opacity="0.75" />

        {/* Left Eye (Sparkling Anime Purple Eye) */}
        <ellipse cx="162" cy="135" rx="9" ry="12" fill="#581c87" />
        <ellipse cx="162" cy="138" rx="7" ry="9" fill="#9333ea" />
        <circle cx="159" cy="130" r="4" fill="#ffffff" />
        <circle cx="165" cy="142" r="2" fill="#ffffff" />
        {/* Cute Lash & Eyebrow */}
        <path d="M150,126 Q162,118 174,124" stroke="#2e1065" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M172,126 L175,123" stroke="#2e1065" strokeWidth="2.5" strokeLinecap="round" />

        {/* Right Eye (Cute Winking Eye) */}
        <path d="M192,136 Q204,126 216,136" stroke="#2e1065" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        <path d="M190,122 Q202,116 214,121" stroke="#2e1065" strokeWidth="3" strokeLinecap="round" fill="none" />

        {/* Radiant Smile */}
        <path d="M168,154 Q180,168 192,154" fill="#e11d48" stroke="#4c1d95" strokeWidth="2" />
        <ellipse cx="180" cy="160" rx="6" ry="3" fill="#ffffff" />

        {/* Front Anime Hair with Bangs & Side Locks */}
        <path
          d="M130,120 C125,75 160,50 185,50 C220,50 245,75 240,120 
             L230,130 C225,95 210,90 200,105 C190,92 175,90 170,105 
             C165,92 145,95 140,125 Z"
          fill="url(#imgHairGrad)"
        />
        {/* Cute side hair strands */}
        <path d="M132,115 Q120,150 128,190" stroke="#7e22ce" strokeWidth="9" fill="none" strokeLinecap="round" />
        <path d="M236,115 Q248,150 240,190" stroke="#7e22ce" strokeWidth="9" fill="none" strokeLinecap="round" />

        {/* Left Hand Holding Stylus Pen */}
        <g transform="translate(105, 140) rotate(-15)">
          <ellipse cx="15" cy="30" rx="9" ry="12" fill="#fff1e6" />
          <ellipse cx="8" cy="22" rx="5" ry="8" fill="#fed7aa" />
          {/* Stylus Digital Pen */}
          <rect x="-8" y="-12" width="6" height="52" rx="3" fill="#1e1b4b" stroke="#ffffff" strokeWidth="1" />
          <polygon points="-8,-12 -5,-20 -2,-12" fill="#a855f7" />
          <circle cx="-5" cy="-20" r="2.5" fill="#f43f5e" />
        </g>

        {/* Right Hand Pointing / Beckoning */}
        <g transform="translate(230, 160) rotate(15)">
          <ellipse cx="10" cy="18" rx="10" ry="12" fill="#fff1e6" />
          <rect x="14" y="8" width="24" height="9" rx="4.5" fill="#fed7aa" />
        </g>

        {/* --- Foreground Floating Gallery Polaroids (From Image 2) --- */}
        {/* Main Center Image Card: Mountains & Sun */}
        <g transform="translate(110, 175)">
          <rect x="2" y="4" width="105" height="90" rx="14" fill="#000000" opacity="0.3" filter="url(#imgGlow)" />
          <rect width="105" height="90" rx="14" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2.5" />
          {/* Image inner view */}
          <rect x="6" y="6" width="93" height="78" rx="10" fill="#38bdf8" />
          <circle cx="52" cy="35" r="12" fill="#ffffff" />
          {/* Mountains */}
          <polygon points="12,84 45,45 78,84" fill="#3b82f6" />
          <polygon points="40,84 68,52 96,84" fill="#1d4ed8" />
          <polygon points="40,51 45,45 50,51 47,54 44,52" fill="#ffffff" />
          <polygon points="63,58 68,52 73,58 70,61 66,59" fill="#ffffff" />
        </g>

        {/* Small Polaroid 1: Cute Cat Top Left */}
        <g transform="translate(72, 195) rotate(-14)">
          <rect width="45" height="52" rx="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
          <rect x="4" y="4" width="37" height="36" rx="6" fill="#fef3c7" />
          {/* Cute Cat Face */}
          <circle cx="22" cy="22" r="12" fill="#f97316" />
          <polygon points="12,14 16,8 20,13" fill="#f97316" />
          <polygon points="24,13 28,8 32,14" fill="#f97316" />
          <circle cx="18" cy="21" r="2" fill="#000000" />
          <circle cx="26" cy="21" r="2" fill="#000000" />
          <polygon points="22,24 20,26 24,26" fill="#f43f5e" />
        </g>

        {/* Small Polaroid 2: Anime Girl Portrait */}
        <g transform="translate(135, 235) rotate(8)">
          <rect width="52" height="60" rx="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
          <rect x="4" y="4" width="44" height="42" rx="6" fill="#fce7f3" />
          {/* Anime Face */}
          <ellipse cx="26" cy="24" rx="12" ry="14" fill="#f472b6" />
          <ellipse cx="26" cy="26" rx="9" ry="10" fill="#fff1e6" />
          <circle cx="23" cy="26" r="2" fill="#831843" />
          <circle cx="29" cy="26" r="2" fill="#831843" />
          <path d="M24,31 Q26,34 28,31" stroke="#e11d48" strokeWidth="1" fill="none" />
        </g>

        {/* Floating Color Palette Control Sliders Bottom Right */}
        <g transform="translate(205, 205)">
          <rect width="78" height="50" rx="12" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
          {/* Slider 1 */}
          <rect x="8" y="10" width="62" height="6" rx="3" fill="#e0e7ff" />
          <circle cx="24" cy="13" r="5" fill="#3b82f6" />
          {/* Slider 2 */}
          <rect x="8" y="22" width="62" height="6" rx="3" fill="#fce7f3" />
          <circle cx="48" cy="25" r="5" fill="#ec4899" />
          {/* Color Dots */}
          <circle cx="16" cy="38" r="4" fill="#38bdf8" />
          <circle cx="28" cy="38" r="4" fill="#a855f7" />
          <circle cx="40" cy="38" r="4" fill="#f43f5e" />
          <circle cx="52" cy="38" r="4" fill="#facc15" />
        </g>
      </svg>
    </div>
  );
};

// ==========================================
// 3. MOTION STUDIO MASCOT (Orange Theme)
// Anime boy with backwards cap, hoodie, clapperboard & timeline
// ==========================================
export const MotionMascot: React.FC<{ size?: number; className?: string; animated?: boolean }> = ({
  size = 220,
  className = '',
  animated = true,
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative select-none shrink-0 ${className} ${animated ? 'group' : ''}`}
    >
      <svg
        viewBox="0 0 320 320"
        className="w-full h-full drop-shadow-[0_12px_24px_rgba(249,115,22,0.35)] transition-transform duration-300 group-hover:scale-105"
      >
        <defs>
          <linearGradient id="motBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c2d12" />
            <stop offset="50%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          <linearGradient id="motHoodieGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c2410c" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
          <linearGradient id="motHairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#451a03" />
            <stop offset="60%" stopColor="#78350f" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <filter id="motGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Rounded Container Background */}
        <rect x="10" y="10" width="300" height="300" rx="60" fill="url(#motBgGrad)" />

        {/* Ambient Sunburst & Glow */}
        <circle cx="260" cy="80" r="50" fill="#facc15" opacity="0.3" filter="url(#motGlow)" />
        <circle cx="60" cy="220" r="45" fill="#f97316" opacity="0.25" />

        {/* Floating Filmstrip Icon Top Right */}
        <g transform="translate(225, 45) rotate(-10)">
          <rect width="45" height="32" rx="6" fill="#1e293b" stroke="#ffffff" strokeWidth="2" />
          <rect x="5" y="4" width="8" height="6" rx="1.5" fill="#ffffff" />
          <rect x="18" y="4" width="8" height="6" rx="1.5" fill="#ffffff" />
          <rect x="31" y="4" width="8" height="6" rx="1.5" fill="#ffffff" />
          <rect x="5" y="22" width="8" height="6" rx="1.5" fill="#ffffff" />
          <rect x="18" y="22" width="8" height="6" rx="1.5" fill="#ffffff" />
          <rect x="31" y="22" width="8" height="6" rx="1.5" fill="#ffffff" />
          <rect x="10" y="12" width="25" height="8" rx="2" fill="#f97316" />
        </g>

        {/* Floating Video Play Badge Top Left */}
        <g transform="translate(40, 105) rotate(14)">
          <rect width="36" height="30" rx="8" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
          <polygon points="14,9 26,15 14,21" fill="#ffffff" />
        </g>

        {/* Floating Musical Notes */}
        <g transform="translate(265, 125) rotate(15)">
          <rect width="30" height="30" rx="8" fill="#3b82f6" />
          <circle cx="10" cy="20" r="3.5" fill="#ffffff" />
          <circle cx="20" cy="17" r="3.5" fill="#ffffff" />
          <line x1="13" y1="20" x2="13" y2="9" stroke="#ffffff" strokeWidth="2" />
          <line x1="23" y1="17" x2="23" y2="6" stroke="#ffffff" strokeWidth="2" />
          <line x1="13" y1="9" x2="23" y2="6" stroke="#ffffff" strokeWidth="2" />
        </g>

        {/* Golden Sparkling Stars */}
        <polygon points="60,50 63,57 70,60 63,63 60,70 57,63 50,60 57,57" fill="#ffffff" opacity="0.9" />
        <polygon points="280,180 282,185 287,187 282,189 280,194 278,189 273,187 278,185" fill="#fef08a" />

        {/* --- Anime Boy Body & Orange Hoodie --- */}
        <path
          d="M60,290 C70,225 120,205 170,205 C220,205 270,225 280,290 Z"
          fill="url(#motHoodieGrad)"
        />
        {/* Dark inner shirt */}
        <polygon points="150,210 170,240 190,210" fill="#1e293b" />
        {/* White Hoodie String */}
        <path d="M140,215 Q170,245 200,215" stroke="#ffffff" strokeWidth="7" fill="none" strokeLinecap="round" />

        {/* Neck */}
        <rect x="156" y="165" width="28" height="25" rx="6" fill="#fed7aa" />

        {/* Face */}
        <ellipse cx="170" cy="138" rx="42" ry="40" fill="#ffedd5" />
        {/* Blushing Cheeks */}
        <ellipse cx="144" cy="150" rx="7" ry="4" fill="#ea580c" opacity="0.6" />
        <ellipse cx="196" cy="150" rx="7" ry="4" fill="#ea580c" opacity="0.6" />

        {/* Left Eye (Wide Joyful Eye) */}
        <ellipse cx="152" cy="138" rx="9" ry="12" fill="#451a03" />
        <ellipse cx="152" cy="141" rx="7" ry="9" fill="#b45309" />
        <circle cx="149" cy="133" r="3.5" fill="#ffffff" />
        <circle cx="155" cy="143" r="1.5" fill="#ffffff" />
        {/* Left Eyebrow */}
        <path d="M142,122 Q152,116 162,122" stroke="#451a03" strokeWidth="3" strokeLinecap="round" fill="none" />

        {/* Right Eye (Playful Sparkle Eye) */}
        <ellipse cx="188" cy="138" rx="9" ry="12" fill="#451a03" />
        <ellipse cx="188" cy="141" rx="7" ry="9" fill="#b45309" />
        <circle cx="185" cy="133" r="3.5" fill="#ffffff" />
        <circle cx="191" cy="143" r="1.5" fill="#ffffff" />
        {/* Right Eyebrow */}
        <path d="M178,122 Q188,116 198,122" stroke="#451a03" strokeWidth="3" strokeLinecap="round" fill="none" />

        {/* Big Energetic Open Mouth Smile */}
        <path d="M156,154 Q170,174 184,154" fill="#dc2626" stroke="#451a03" strokeWidth="2.5" />
        <ellipse cx="170" cy="157" rx="7" ry="3" fill="#ffffff" />

        {/* Messy Brown Hair Strands */}
        <path
          d="M125,125 C120,85 145,65 170,65 C195,65 220,85 215,125 Z"
          fill="url(#motHairGrad)"
        />
        {/* Hair Tuft Out of Cap */}
        <polygon points="135,115 145,135 150,120" fill="#78350f" />
        <polygon points="152,118 165,138 170,122" fill="#b45309" />
        <polygon points="172,120 185,136 190,122" fill="#78350f" />

        {/* Backwards Baseball Cap (Signature Cool Feature) */}
        <path
          d="M124,102 C125,60 160,45 190,45 C215,45 224,65 220,102 Z"
          fill="#0f172a"
        />
        {/* Cap Crown Details */}
        <ellipse cx="170" cy="100" rx="46" ry="10" fill="#1e293b" />
        {/* Backwards Cap Strap & Opening */}
        <ellipse cx="170" cy="62" rx="14" ry="8" fill="#ffedd5" />
        <rect x="162" y="58" width="16" height="4" rx="2" fill="#475569" />

        {/* Right Hand Thumbs-Up / Pointing Forward */}
        <g transform="translate(195, 175) rotate(-10)">
          <path d="M0,25 Q15,0 40,5 L35,28 Z" fill="#c2410c" />
          <ellipse cx="36" cy="15" rx="10" ry="12" fill="#ffffff" />
          <ellipse cx="48" cy="14" rx="12" ry="10" fill="#fed7aa" />
          {/* Pointing Finger */}
          <rect x="55" y="8" width="26" height="10" rx="5" fill="#fed7aa" />
          {/* Thumb */}
          <rect x="45" y="-2" width="10" height="16" rx="5" fill="#fed7aa" transform="rotate(-15 45 -2)" />
        </g>

        {/* --- Foreground Director Clapperboard & Timeline Sequencer --- */}
        {/* Clapperboard Body */}
        <g transform="translate(48, 195) rotate(-4)">
          <rect x="2" y="4" width="225" height="110" rx="16" fill="#000000" opacity="0.35" filter="url(#motGlow)" />
          {/* Main Dark Body */}
          <rect width="225" height="110" rx="16" fill="#0f172a" stroke="#334155" strokeWidth="2.5" />

          {/* Top Diagonal Striped Clapper Bar */}
          <g transform="translate(0, 0)">
            <rect width="225" height="28" rx="8" fill="#1e293b" />
            <polygon points="15,0 35,0 20,28 0,28" fill="#ffffff" />
            <polygon points="50,0 70,0 55,28 35,28" fill="#ffffff" />
            <polygon points="85,0 105,0 90,28 70,28" fill="#ffffff" />
            <polygon points="120,0 140,0 125,28 105,28" fill="#ffffff" />
            <polygon points="155,0 175,0 160,28 140,28" fill="#ffffff" />
            <polygon points="190,0 210,0 195,28 175,28" fill="#ffffff" />
          </g>

          {/* Big Play Button in Center */}
          <circle cx="112" cy="50" r="15" fill="#ffffff" />
          <polygon points="108,42 120,50 108,58" fill="#0f172a" />

          {/* Timeline Video Track 1 */}
          <g transform="translate(14, 68)">
            <rect width="197" height="16" rx="4" fill="#1e293b" />
            {/* Purple Clip */}
            <rect x="2" y="2" width="60" height="12" rx="3" fill="#8b5cf6" />
            <circle cx="10" cy="8" r="3" fill="#ffffff" />
            {/* Orange Clip */}
            <rect x="66" y="2" width="75" height="12" rx="3" fill="#f97316" />
            {/* Cyan Clip */}
            <rect x="145" y="2" width="50" height="12" rx="3" fill="#06b6d4" />
          </g>

          {/* Timeline Audio Waveform Track 2 */}
          <g transform="translate(14, 88)">
            <rect width="197" height="14" rx="4" fill="#1e293b" />
            {/* Green Audio Waveform Block */}
            <rect x="2" y="2" width="135" height="10" rx="3" fill="#10b981" />
            {/* Audio Wave spikes */}
            <line x1="12" y1="4" x2="12" y2="10" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="18" y1="3" x2="18" y2="11" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="24" y1="5" x2="24" y2="9" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="30" y1="2" x2="30" y2="12" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="36" y1="4" x2="36" y2="10" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="42" y1="3" x2="42" y2="11" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="48" y1="5" x2="48" y2="9" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="54" y1="2" x2="54" y2="12" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="60" y1="4" x2="60" y2="10" stroke="#ffffff" strokeWidth="1.5" />
          </g>

          {/* Red Playhead Line */}
          <line x1="88" y1="64" x2="88" y2="104" stroke="#ef4444" strokeWidth="2.5" />
          <polygon points="85,64 91,64 88,68" fill="#ef4444" />
        </g>
      </svg>
    </div>
  );
};

// ==========================================
// 4. CREATIVE HERO 3D GRAPHIC (Matching Image 1 Hero)
// Open laptop with floating colorful cards & clapperboard
// ==========================================
export const CreativeHeroGraphic: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative select-none w-full max-w-[480px] aspect-[16/10] ${className}`}>
      <svg viewBox="0 0 540 340" className="w-full h-full drop-shadow-[0_20px_40px_rgba(99,102,241,0.25)]">
        <defs>
          <linearGradient id="laptopLid" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="laptopScreen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="50%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#9333ea" />
          </linearGradient>
          <linearGradient id="cardGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <linearGradient id="cardGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
          <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="50%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
        </defs>

        {/* Ambient Glowing Floating Ribbons */}
        <path
          d="M40,220 C80,120 180,60 300,90 C420,120 500,200 480,280"
          stroke="url(#ribbonGrad)"
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
          opacity="0.45"
        />

        {/* Floating Stars */}
        <polygon points="50,60 54,72 66,76 54,80 50,92 46,80 34,76 46,72" fill="#fde047" />
        <polygon points="490,70 493,79 502,82 493,85 490,94 487,85 478,82 487,79" fill="#fde047" />
        <polygon points="260,25 262,31 268,33 262,35 260,41 258,35 252,33 258,31" fill="#ffffff" />

        {/* --- Open 3D Laptop --- */}
        {/* Laptop Screen Lid */}
        <g transform="translate(100, 50)">
          {/* Outer Frame */}
          <rect width="320" height="200" rx="16" fill="url(#laptopLid)" stroke="#475569" strokeWidth="4" />
          {/* Glossy Screen */}
          <rect x="12" y="12" width="296" height="176" rx="10" fill="url(#laptopScreen)" />

          {/* Browser / Canvas Header Bar */}
          <rect x="22" y="22" width="276" height="18" rx="6" fill="#0f172a" opacity="0.6" />
          <circle cx="32" cy="31" r="3" fill="#f43f5e" />
          <circle cx="42" cy="31" r="3" fill="#facc15" />
          <circle cx="52" cy="31" r="3" fill="#10b981" />
          <rect x="70" y="27" width="120" height="8" rx="4" fill="#334155" />

          {/* Screen Content: Layered Windows */}
          {/* Photo Preview Box */}
          <g transform="translate(30, 52)">
            <rect width="100" height="75" rx="8" fill="url(#cardGrad1)" />
            <polygon points="15,65 40,35 65,65" fill="#ffffff" opacity="0.9" />
            <polygon points="50,65 75,42 95,65" fill="#ffffff" opacity="0.7" />
            <circle cx="30" cy="25" r="7" fill="#facc15" />
          </g>

          {/* Form / Metadata Sheet Box */}
          <g transform="translate(140, 52)">
            <rect width="138" height="60" rx="8" fill="#ffffff" opacity="0.9" />
            <rect x="12" y="10" width="70" height="6" rx="3" fill="#3b82f6" />
            <rect x="12" y="22" width="114" height="4" rx="2" fill="#cbd5e1" />
            <rect x="12" y="32" width="94" height="4" rx="2" fill="#cbd5e1" />
            <rect x="12" y="42" width="50" height="8" rx="4" fill="#0284c7" />
          </g>

          {/* Video Player Box Bottom */}
          <g transform="translate(136, 122)">
            <rect width="142" height="56" rx="8" fill="url(#cardGrad2)" />
            <circle cx="71" cy="28" r="14" fill="#ffffff" />
            <polygon points="68,22 78,28 68,34" fill="#e11d48" />
          </g>
        </g>

        {/* Laptop Base / Keyboard Deck */}
        <polygon points="50,250 470,250 440,285 80,285" fill="#334155" stroke="#1e293b" strokeWidth="2" />
        <rect x="230" y="254" width="60" height="4" rx="2" fill="#64748b" />
        <rect x="210" y="262" width="100" height="16" rx="3" fill="#1e293b" />

        {/* Floating Cartoon Polaroid on Left */}
        <g transform="translate(30, 95) rotate(-14)">
          <rect width="70" height="82" rx="10" fill="#ffffff" filter="url(#motGlow)" opacity="0.95" />
          <rect x="6" y="6" width="58" height="58" rx="6" fill="#38bdf8" />
          <circle cx="20" cy="22" r="6" fill="#facc15" />
          <polygon points="12,58 26,38 42,52 50,44 58,58" fill="#0284c7" />
        </g>

        {/* Floating Metadata Document Bottom Left */}
        <g transform="translate(65, 175) rotate(8)">
          <rect width="68" height="85" rx="10" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
          <rect x="8" y="12" width="35" height="5" rx="2.5" fill="#f43f5e" />
          <rect x="8" y="24" width="52" height="4" rx="2" fill="#e2e8f0" />
          <rect x="8" y="34" width="46" height="4" rx="2" fill="#e2e8f0" />
          <rect x="8" y="44" width="50" height="4" rx="2" fill="#e2e8f0" />
          <circle cx="14" cy="62" r="6" fill="#10b981" />
          <circle cx="30" cy="62" r="6" fill="#3b82f6" />
          <circle cx="46" cy="62" r="6" fill="#f59e0b" />
        </g>

        {/* Floating Clapperboard on Right */}
        <g transform="translate(415, 130) rotate(14)">
          <rect width="90" height="70" rx="10" fill="#0f172a" stroke="#ffffff" strokeWidth="2" />
          <rect width="90" height="18" rx="6" fill="#1e293b" />
          <polygon points="8,0 20,0 12,18 0,18" fill="#ffffff" />
          <polygon points="30,0 42,0 34,18 22,18" fill="#ffffff" />
          <polygon points="52,0 64,0 56,18 44,18" fill="#ffffff" />
          <polygon points="74,0 86,0 78,18 66,18" fill="#ffffff" />
          <circle cx="45" cy="44" r="14" fill="#ffffff" />
          <polygon points="41,38 52,44 41,50" fill="#0f172a" />
        </g>
      </svg>
    </div>
  );
};

// ==========================================
// 5. MINI AVATAR ICONS (For Sidebar, Header, Badges)
// ==========================================

export const MetadataAvatar: React.FC<{ size?: number; className?: string }> = ({
  size = 32,
  className = '',
}) => {
  return (
    <div style={{ width: size, height: size }} className={`relative select-none shrink-0 ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
        <defs>
          <linearGradient id="avMetaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="28" fill="url(#avMetaGrad)" />
        {/* Head & Neck */}
        <ellipse cx="50" cy="54" rx="24" ry="22" fill="#ffedd5" />
        <ellipse cx="36" cy="60" rx="4" ry="2.5" fill="#fb7185" opacity="0.8" />
        <ellipse cx="64" cy="60" rx="4" ry="2.5" fill="#fb7185" opacity="0.8" />
        {/* Left Eye */}
        <ellipse cx="41" cy="52" rx="4.5" ry="6" fill="#1e3a8a" />
        <circle cx="39.5" cy="49" r="2" fill="#ffffff" />
        {/* Right Winking Eye */}
        <path d="M58,52 Q64,47 70,52" stroke="#1e3a8a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        {/* Smile */}
        <path d="M46,62 Q50,68 56,62" fill="#f43f5e" stroke="#1e3a8a" strokeWidth="1.5" />
        {/* Spiky Blue Hair */}
        <path
          d="M26,50 C22,30 36,12 50,12 C64,12 78,30 74,50 L68,40 C64,30 58,26 50,30 C42,26 36,30 32,40 Z"
          fill="#3b82f6"
        />
        <polygon points="34,28 42,42 45,34" fill="#2563eb" />
        <polygon points="44,25 52,44 56,33" fill="#60a5fa" />
        <polygon points="54,27 63,42 66,35" fill="#2563eb" />
      </svg>
    </div>
  );
};

export const ImageAvatar: React.FC<{ size?: number; className?: string }> = ({
  size = 32,
  className = '',
}) => {
  return (
    <div style={{ width: size, height: size }} className={`relative select-none shrink-0 ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
        <defs>
          <linearGradient id="avImgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b0764" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="28" fill="url(#avImgGrad)" />
        {/* Hair Behind */}
        <path d="M25,50 C20,70 24,95 30,100 L70,100 C76,95 80,70 75,50 Z" fill="#4c1d95" />
        {/* Head */}
        <ellipse cx="50" cy="52" rx="23" ry="22" fill="#fff1e6" />
        <ellipse cx="36" cy="59" rx="4.5" ry="2.5" fill="#f43f5e" opacity="0.8" />
        <ellipse cx="64" cy="59" rx="4.5" ry="2.5" fill="#f43f5e" opacity="0.8" />
        {/* Left Sparkling Eye */}
        <ellipse cx="41" cy="50" rx="5" ry="6.5" fill="#581c87" />
        <circle cx="39.5" cy="47" r="2.2" fill="#ffffff" />
        <circle cx="43" cy="53" r="1" fill="#ffffff" />
        {/* Right Winking Eye */}
        <path d="M57,51 Q63,45 69,51" stroke="#2e1065" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        {/* Smile */}
        <path d="M45,61 Q50,68 55,61" fill="#e11d48" stroke="#4c1d95" strokeWidth="1.5" />
        {/* Purple Bangs & Side Locks */}
        <path
          d="M26,45 C25,24 40,12 50,12 C60,12 75,24 74,45 L70,35 C65,22 55,22 50,28 C45,22 35,22 30,35 Z"
          fill="#8b5cf6"
        />
        {/* Cute side hair strands */}
        <path d="M28,45 Q22,65 26,80" stroke="#7e22ce" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M72,45 Q78,65 74,80" stroke="#7e22ce" strokeWidth="5" fill="none" strokeLinecap="round" />
        {/* Tiny Star Hairpin */}
        <polygon points="68,26 70,30 74,31 71,33 72,37 68,34 65,37 66,33 63,31 67,30" fill="#fde047" />
      </svg>
    </div>
  );
};

export const MotionAvatar: React.FC<{ size?: number; className?: string }> = ({
  size = 32,
  className = '',
}) => {
  return (
    <div style={{ width: size, height: size }} className={`relative select-none shrink-0 ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
        <defs>
          <linearGradient id="avMotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c2d12" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="28" fill="url(#avMotGrad)" />
        {/* Backwards Cap */}
        <path d="M26,44 C26,20 45,14 60,14 C73,14 78,25 76,44 Z" fill="#0f172a" />
        <ellipse cx="51" cy="42" rx="26" ry="6" fill="#1e293b" />
        <ellipse cx="51" cy="22" rx="7" ry="4" fill="#ffedd5" />
        {/* Head */}
        <ellipse cx="51" cy="54" rx="23" ry="22" fill="#ffedd5" />
        <ellipse cx="37" cy="61" rx="4" ry="2.5" fill="#ea580c" opacity="0.7" />
        <ellipse cx="65" cy="61" rx="4" ry="2.5" fill="#ea580c" opacity="0.7" />
        {/* Left Eye */}
        <ellipse cx="42" cy="52" rx="5" ry="6.5" fill="#451a03" />
        <circle cx="40.5" cy="49" r="2" fill="#ffffff" />
        {/* Right Playful Eye */}
        <ellipse cx="60" cy="52" rx="5" ry="6.5" fill="#451a03" />
        <circle cx="58.5" cy="49" r="2" fill="#ffffff" />
        {/* Big Smile */}
        <path d="M44,63 Q51,73 58,63" fill="#dc2626" stroke="#451a03" strokeWidth="1.5" />
        {/* Brown messy hair tufts out of cap */}
        <polygon points="34,42 40,51 43,44" fill="#78350f" />
        <polygon points="42,43 49,52 52,44" fill="#b45309" />
        <polygon points="53,44 59,51 63,44" fill="#78350f" />
      </svg>
    </div>
  );
};

// ==========================================
// 6. 3D CARD SHOWCASE GRAPHICS (Matching image.png exactly)
// ==========================================

export const Metadata3DCardGraphic: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative select-none w-full h-44 flex items-center justify-center overflow-hidden ${className}`}>
      <svg viewBox="0 0 300 180" className="w-full h-full drop-shadow-md">
        <defs>
          <linearGradient id="m3dBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="m3dCard" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f0f9ff" />
          </linearGradient>
          <linearGradient id="m3dPen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>

        {/* Ambient Glow */}
        <circle cx="150" cy="90" r="70" fill="#38bdf8" opacity="0.25" filter="blur(20px)" />

        {/* Blue Pen on the left tilted */}
        <g transform="translate(68, 60) rotate(-28)">
          <rect width="14" height="75" rx="7" fill="url(#m3dPen)" stroke="#93c5fd" strokeWidth="1.5" />
          <polygon points="0,0 14,0 7,-16" fill="#93c5fd" />
          <circle cx="7" cy="-16" r="2.5" fill="#facc15" />
          <rect x="3" y="15" width="8" height="35" rx="3" fill="#1e40af" />
          <rect x="5" y="58" width="4" height="12" rx="2" fill="#60a5fa" />
        </g>

        {/* Main 3D Floating Document Sheet */}
        <g transform="translate(100, 20) rotate(-2)">
          {/* Card Shadow */}
          <rect x="4" y="6" width="115" height="135" rx="16" fill="#000000" opacity="0.2" filter="blur(6px)" />
          {/* White Card */}
          <rect width="115" height="135" rx="16" fill="url(#m3dCard)" stroke="#93c5fd" strokeWidth="2" />

          {/* Document Lines */}
          <rect x="14" y="16" width="55" height="6" rx="3" fill="#0284c7" />
          <rect x="14" y="28" width="86" height="4" rx="2" fill="#cbd5e1" />
          <rect x="14" y="36" width="70" height="4" rx="2" fill="#cbd5e1" />
          <rect x="14" y="44" width="80" height="4" rx="2" fill="#e2e8f0" />

          {/* Little check badges */}
          <circle cx="95" cy="18" r="6" fill="#e0f2fe" />
          <path d="M92,18 L94,20 L98,16" stroke="#0284c7" strokeWidth="1.5" strokeLinecap="round" fill="none" />

          {/* Inner Accent Line */}
          <line x1="14" y1="56" x2="100" y2="56" stroke="#e0f2fe" strokeWidth="1.5" />
        </g>

        {/* Floating Metadata Pills on the right */}
        {/* Pill 1: Title */}
        <g transform="translate(180, 42) rotate(4)">
          <rect width="88" height="24" rx="12" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="5" fill="#ffffff" />
          <text x="10" y="15" fontFamily="sans-serif" fontSize="8" fontWeight="900" fill="#0284c7">T</text>
          <text x="24" y="16" fontFamily="sans-serif" fontSize="11" fontWeight="800" fill="#ffffff">Title</text>
        </g>

        {/* Pill 2: Keywords */}
        <g transform="translate(185, 74) rotate(-3)">
          <rect width="92" height="24" rx="12" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="4" stroke="#ffffff" strokeWidth="1.5" fill="none" />
          <line x1="15" y1="15" x2="18" y2="18" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
          <text x="24" y="16" fontFamily="sans-serif" fontSize="11" fontWeight="800" fill="#ffffff">Keywords</text>
        </g>

        {/* Pill 3: Category */}
        <g transform="translate(180, 106) rotate(2)">
          <rect width="90" height="24" rx="12" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
          <path d="M8,8 L11,8 L13,10 L17,10 L17,15 L8,15 Z" fill="#ffffff" />
          <text x="23" y="16" fontFamily="sans-serif" fontSize="11" fontWeight="800" fill="#ffffff">Category</text>
        </g>

        {/* Floating Stars */}
        <polygon points="45,40 48,46 54,48 48,50 45,56 42,50 36,48 42,46" fill="#fde047" opacity="0.9" />
        <polygon points="265,135 267,139 272,141 267,143 265,148 263,143 258,141 263,139" fill="#fde047" opacity="0.8" />
        <polygon points="120,155 122,159 126,160 122,161 120,165 118,161 114,160 118,159" fill="#38bdf8" />
      </svg>
    </div>
  );
};

export const Image3DCardGraphic: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative select-none w-full h-44 flex items-center justify-center overflow-hidden ${className}`}>
      <svg viewBox="0 0 300 180" className="w-full h-full drop-shadow-md">
        <defs>
          <linearGradient id="i3dBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#581c87" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#9333ea" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="i3dPhoto" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <linearGradient id="i3dCard" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f5f3ff" />
          </linearGradient>
          <linearGradient id="i3dBadge" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9333ea" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
        </defs>

        {/* Ambient Glow */}
        <circle cx="150" cy="90" r="70" fill="#c084fc" opacity="0.25" filter="blur(20px)" />

        {/* Background Left Photo Card (Tilted) */}
        <g transform="translate(60, 48) rotate(-16)">
          <rect width="70" height="75" rx="10" fill="#ffffff" stroke="#e9d5ff" strokeWidth="1.5" opacity="0.9" />
          <rect x="5" y="5" width="60" height="50" rx="6" fill="#f472b6" />
          <circle cx="20" cy="20" r="5" fill="#fde047" />
          <polygon points="12,50 30,30 45,45 55,35 62,50" fill="#db2777" />
        </g>

        {/* Background Right Photo Card (Tilted) */}
        <g transform="translate(170, 50) rotate(14)">
          <rect width="68" height="72" rx="10" fill="#ffffff" stroke="#e9d5ff" strokeWidth="1.5" opacity="0.9" />
          <rect x="5" y="5" width="58" height="48" rx="6" fill="#34d399" />
          <circle cx="18" cy="18" r="5" fill="#fde047" />
          <polygon points="10,48 26,28 42,44 50,36 58,48" fill="#059669" />
        </g>

        {/* Center Main 3D Photo Card (Mountains & Sun) */}
        <g transform="translate(100, 24)">
          {/* Drop shadow */}
          <rect x="4" y="6" width="102" height="110" rx="16" fill="#000000" opacity="0.22" filter="blur(6px)" />
          {/* White Card Frame */}
          <rect width="102" height="110" rx="16" fill="url(#i3dCard)" stroke="#c084fc" strokeWidth="2" />

          {/* Photo Inner View */}
          <rect x="8" y="8" width="86" height="76" rx="10" fill="url(#i3dPhoto)" />
          {/* Sun */}
          <circle cx="51" cy="30" r="12" fill="#ffffff" />
          {/* Mountains */}
          <polygon points="12,80 44,40 76,80" fill="#2563eb" />
          <polygon points="38,80 66,46 92,80" fill="#1d4ed8" />
          <polygon points="39,46 44,40 49,46 46,49 43,47" fill="#ffffff" />
          <polygon points="61,52 66,46 71,52 68,55 64,53" fill="#ffffff" />

          {/* Card footer details */}
          <circle cx="20" cy="96" r="4" fill="#a855f7" />
          <rect x="30" y="94" width="45" height="5" rx="2.5" fill="#cbd5e1" />
        </g>

        {/* Glowing AI Pill Badge on the right */}
        <g transform="translate(205, 82) rotate(6)">
          <rect width="48" height="42" rx="14" fill="url(#i3dBadge)" stroke="#ffffff" strokeWidth="2.5" />
          <text x="24" y="27" fontFamily="sans-serif" fontSize="17" fontWeight="900" fill="#ffffff" textAnchor="middle">
            AI
          </text>
          <polygon points="40,6 42,10 46,11 42,13 40,17 38,13 34,11 38,10" fill="#fde047" />
        </g>

        {/* Floating Stars */}
        <polygon points="40,30 43,36 49,38 43,40 40,46 37,40 31,38 37,36" fill="#fde047" />
        <polygon points="260,35 262,39 267,41 262,43 260,47 258,43 253,41 258,39" fill="#fde047" />
        <polygon points="150,155 152,159 156,160 152,161 150,165 148,161 144,160 148,159" fill="#e879f9" />
      </svg>
    </div>
  );
};

export const Motion3DCardGraphic: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative select-none w-full h-44 flex items-center justify-center overflow-hidden ${className}`}>
      <svg viewBox="0 0 300 180" className="w-full h-full drop-shadow-md">
        <defs>
          <linearGradient id="mot3dBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c2d12" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="clapperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>

        {/* Ambient Glow */}
        <circle cx="150" cy="90" r="70" fill="#f97316" opacity="0.25" filter="blur(20px)" />

        {/* Main 3D Clapperboard in Center */}
        <g transform="translate(48, 25)">
          {/* Drop Shadow */}
          <rect x="4" y="6" width="135" height="110" rx="16" fill="#000000" opacity="0.3" filter="blur(6px)" />
          {/* Main Dark Body */}
          <rect width="135" height="110" rx="16" fill="url(#clapperGrad)" stroke="#475569" strokeWidth="2" />

          {/* Diagonal Striped Top Clapper Bar */}
          <g transform="translate(0, 0)">
            <rect width="135" height="24" rx="6" fill="#1e293b" />
            <polygon points="10,0 22,0 12,24 0,24" fill="#ffffff" />
            <polygon points="32,0 44,0 34,24 22,24" fill="#ffffff" />
            <polygon points="54,0 66,0 56,24 44,24" fill="#ffffff" />
            <polygon points="76,0 88,0 78,24 66,24" fill="#ffffff" />
            <polygon points="98,0 110,0 100,24 88,24" fill="#ffffff" />
            <polygon points="120,0 132,0 122,24 110,24" fill="#ffffff" />
          </g>

          {/* Big White Circular Play Button in Center */}
          <circle cx="68" cy="67" r="18" fill="#ffffff" />
          <polygon points="63,58 77,67 63,76" fill="#0f172a" />
        </g>

        {/* Timeline Sequencer Tracks on Right Side */}
        <g transform="translate(192, 50)">
          {/* Track 1: Purple Video Clip */}
          <rect width="80" height="28" rx="8" fill="#8b5cf6" stroke="#c4b5fd" strokeWidth="1.5" />
          <rect x="6" y="6" width="16" height="16" rx="4" fill="#ffffff" opacity="0.3" />
          <line x1="28" y1="14" x2="68" y2="14" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />

          {/* Track 2: Cyan Video Clip */}
          <g transform="translate(0, 36)">
            <rect width="75" height="28" rx="8" fill="#06b6d4" stroke="#a5f3fc" strokeWidth="1.5" />
            <circle cx="14" cy="14" r="6" fill="#ffffff" opacity="0.4" />
            <line x1="28" y1="14" x2="62" y2="14" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
          </g>
        </g>

        {/* Floating Stars */}
        <polygon points="25,50 28,56 34,58 28,60 25,66 22,60 16,58 22,56" fill="#fde047" />
        <polygon points="275,30 277,34 282,36 277,38 275,42 273,38 268,36 273,34" fill="#fde047" />
        <polygon points="190,145 192,149 196,150 192,151 190,155 188,151 184,150 188,149" fill="#fbbf24" />
      </svg>
    </div>
  );
};

// ==========================================
// 8. ZIPSMART AVATAR (Cyan/Pink Anime Kitsune)
// Matching ZIPsmart Anime Aesthetic Logo
// ==========================================
export const ZipSmartAvatar: React.FC<{ size?: number; className?: string }> = ({
  size = 32,
  className = '',
}) => {
  return (
    <div style={{ width: size, height: size }} className={`relative select-none shrink-0 ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_8px_rgba(255,42,109,0.5)]">
        <defs>
          <linearGradient id="avZipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#05D9E8" />
            <stop offset="100%" stopColor="#FF2A6D" />
          </linearGradient>
          <linearGradient id="avZipBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0a0a16" />
            <stop offset="100%" stopColor="#15152a" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="28" fill="url(#avZipBg)" stroke="#05D9E8" strokeWidth="1.5" />
        {/* Mascot Fox/Kitsune Shape */}
        <path d="M22,46 Q50,92 78,46 L86,24 L64,32 Q50,28 36,32 L14,24 Z" fill="url(#avZipGrad)" />
        {/* Inner Ear Highlights */}
        <polygon points="20,29 32,34 25,44" fill="#ffffff" opacity="0.4" />
        <polygon points="80,29 68,34 75,44" fill="#ffffff" opacity="0.4" />
        {/* Eyes */}
        <circle cx="37" cy="55" r="4.5" fill="#ffffff" />
        <circle cx="63" cy="55" r="4.5" fill="#ffffff" />
        <circle cx="38" cy="54" r="2.2" fill="#0a0a16" />
        <circle cx="64" cy="54" r="2.2" fill="#0a0a16" />
        {/* Sparkle Highs */}
        <circle cx="36" cy="53" r="1" fill="#05D9E8" />
        <circle cx="62" cy="53" r="1" fill="#05D9E8" />
        {/* Cheeks Blush */}
        <ellipse cx="26" cy="62" rx="5" ry="2.5" fill="#ffffff" opacity="0.5" />
        <ellipse cx="74" cy="62" rx="5" ry="2.5" fill="#ffffff" opacity="0.5" />
        {/* Cute Nose */}
        <polygon points="48,63 52,63 50,66" fill="#0a0a16" />
        {/* Star Badge on Top */}
        <polygon points="50,12 52,19 59,19 54,24 56,31 50,26 44,31 46,24 41,19 48,19" fill="#FFC600" />
      </svg>
    </div>
  );
};

// ==========================================
// 9. ZIPSMART FULL MASCOT (Anime Archiver)
// ==========================================
export const ZipSmartMascot: React.FC<{ size?: number; className?: string }> = ({
  size = 220,
  className = '',
}) => {
  return (
    <div style={{ width: size, height: size }} className={`relative select-none shrink-0 ${className}`}>
      <svg viewBox="0 0 320 320" className="w-full h-full drop-shadow-[0_12px_24px_rgba(255,42,109,0.35)]">
        <defs>
          <linearGradient id="zipBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0a0a16" />
            <stop offset="50%" stopColor="#15152a" />
            <stop offset="100%" stopColor="#2e1065" />
          </linearGradient>
          <linearGradient id="zipNeonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#05D9E8" />
            <stop offset="100%" stopColor="#FF2A6D" />
          </linearGradient>
          <linearGradient id="zipBoxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7B2CBF" />
            <stop offset="100%" stopColor="#3b0764" />
          </linearGradient>
        </defs>

        {/* Outer Rounded Container */}
        <rect x="10" y="10" width="300" height="300" rx="60" fill="url(#zipBgGrad)" stroke="url(#zipNeonGrad)" strokeWidth="2" />

        {/* Ambient Neon Glows */}
        <circle cx="70" cy="80" r="50" fill="#05D9E8" opacity="0.25" filter="blur(20px)" />
        <circle cx="250" cy="240" r="60" fill="#FF2A6D" opacity="0.25" filter="blur(20px)" />

        {/* Floating EPS Card Top-Left */}
        <g transform="translate(35, 45) rotate(-12)">
          <rect width="55" height="42" rx="10" fill="#15152a" stroke="#7B2CBF" strokeWidth="2" />
          <text x="27" y="26" fill="#c084fc" fontSize="13" fontWeight="bold" textAnchor="middle">.EPS</text>
          <path d="M12,32 L20,32 M25,32 L43,32" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Floating JPG Card Top-Right */}
        <g transform="translate(230, 48) rotate(14)">
          <rect width="55" height="42" rx="10" fill="#15152a" stroke="#FF2A6D" strokeWidth="2" />
          <text x="27" y="26" fill="#f43f5e" fontSize="13" fontWeight="bold" textAnchor="middle">.JPG</text>
          <circle cx="16" cy="18" r="3" fill="#FFC600" />
        </g>

        {/* Central Kitsune Anime Mascot Face */}
        <g transform="translate(90, 80)">
          <path d="M20,65 Q70,135 120,65 L132,30 L100,42 Q70,36 40,42 L8,30 Z" fill="url(#zipNeonGrad)" />
          {/* Inner Ears */}
          <polygon points="18,36 38,44 26,60" fill="#ffffff" opacity="0.4" />
          <polygon points="122,36 102,44 114,60" fill="#ffffff" opacity="0.4" />
          {/* Eyes */}
          <ellipse cx="50" cy="80" rx="7" ry="10" fill="#0a0a16" />
          <ellipse cx="90" cy="80" rx="7" ry="10" fill="#0a0a16" />
          <circle cx="48" cy="76" r="3.5" fill="#ffffff" />
          <circle cx="88" cy="76" r="3.5" fill="#ffffff" />
          <circle cx="52" cy="83" r="1.5" fill="#05D9E8" />
          <circle cx="92" cy="83" r="1.5" fill="#05D9E8" />
          {/* Blush */}
          <ellipse cx="32" cy="90" rx="8" ry="4" fill="#ffffff" opacity="0.5" />
          <ellipse cx="108" cy="90" rx="8" ry="4" fill="#ffffff" opacity="0.5" />
          {/* Smile */}
          <path d="M62,94 Q70,102 78,94" stroke="#0a0a16" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Golden Star Headpiece */}
          <polygon points="70,14 73,24 84,24 76,31 79,41 70,34 61,41 64,31 56,24 67,24" fill="#FFC600" />
        </g>

        {/* Master Archive Box in Hands */}
        <g transform="translate(85, 205)">
          <rect width="150" height="85" rx="18" fill="url(#zipBoxGrad)" stroke="#05D9E8" strokeWidth="2" />
          {/* Zipper Teeth */}
          <line x1="75" y1="0" x2="75" y2="85" stroke="#FFC600" strokeWidth="4" strokeDasharray="3 3" />
          {/* Gold Zipper Pull */}
          <g transform="translate(67, 30)">
            <rect width="16" height="22" rx="4" fill="#FFC600" stroke="#b45309" strokeWidth="1" />
            <circle cx="8" cy="7" r="2.5" fill="#0a0a16" />
          </g>
          {/* Label text */}
          <rect x="25" y="55" width="100" height="20" rx="6" fill="#0a0a16" opacity="0.8" />
          <text x="75" y="69" fill="#05D9E8" fontSize="10" fontWeight="900" textAnchor="middle" letterSpacing="1">
            MASTER.ZIP
          </text>
        </g>

        {/* Speed Lines & Sparkles */}
        <line x1="28" y1="120" x2="50" y2="120" stroke="#05D9E8" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        <line x1="270" y1="130" x2="292" y2="130" stroke="#FF2A6D" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        <polygon points="45,170 48,176 54,178 48,180 45,186 42,180 36,178 42,176" fill="#FFC600" />
        <polygon points="275,175 277,179 281,180 277,181 275,185 273,181 269,180 273,179" fill="#05D9E8" />
      </svg>
    </div>
  );
};

// ==========================================
// 10. ZIPSMART 3D CARD GRAPHIC (Showcase Card)
// ==========================================
export const ZipSmart3DCardGraphic: React.FC<{ size?: number; className?: string }> = ({
  size = 200,
  className = '',
}) => {
  return (
    <div style={{ width: size, height: size * 0.7 }} className={`relative select-none shrink-0 ${className}`}>
      <svg viewBox="0 0 280 180" className="w-full h-full drop-shadow-[0_8px_20px_rgba(5,217,232,0.3)]">
        <defs>
          <linearGradient id="cardZipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#15152a" />
            <stop offset="100%" stopColor="#0a0a16" />
          </linearGradient>
          <linearGradient id="neonCyanPink" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#05D9E8" />
            <stop offset="100%" stopColor="#FF2A6D" />
          </linearGradient>
        </defs>

        {/* Ambient Neon Blobs */}
        <circle cx="140" cy="90" r="60" fill="#7B2CBF" opacity="0.25" filter="blur(16px)" />
        <circle cx="70" cy="70" r="40" fill="#05D9E8" opacity="0.2" filter="blur(14px)" />
        <circle cx="210" cy="80" r="40" fill="#FF2A6D" opacity="0.2" filter="blur(14px)" />

        {/* Central Master ZIP Box */}
        <g transform="translate(90, 35)">
          <rect width="100" height="105" rx="18" fill="url(#cardZipGrad)" stroke="url(#neonCyanPink)" strokeWidth="2.5" />
          {/* Gold Zipper */}
          <line x1="50" y1="0" x2="50" y2="105" stroke="#FFC600" strokeWidth="4" strokeDasharray="3 3" />
          {/* Puller */}
          <rect x="42" y="40" width="16" height="24" rx="4" fill="#FFC600" stroke="#b45309" strokeWidth="1" />
          <circle cx="50" cy="48" r="3" fill="#0a0a16" />

          {/* Master Badge */}
          <rect x="15" y="76" width="70" height="18" rx="6" fill="#05D9E8" />
          <text x="50" y="89" fill="#0a0a16" fontSize="9" fontWeight="900" textAnchor="middle" letterSpacing="1">
            FLAT ZIP
          </text>
        </g>

        {/* Left Floating .EPS Badge */}
        <g transform="translate(25, 45) rotate(-14)">
          <rect width="60" height="48" rx="12" fill="#15152a" stroke="#7B2CBF" strokeWidth="2" />
          <text x="30" y="30" fill="#c084fc" fontSize="14" fontWeight="900" textAnchor="middle">.EPS</text>
          <path d="M14,38 L24,38 M28,38 L46,38" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Right Floating .JPG Badge */}
        <g transform="translate(195, 48) rotate(14)">
          <rect width="60" height="48" rx="12" fill="#15152a" stroke="#FF2A6D" strokeWidth="2" />
          <text x="30" y="30" fill="#f43f5e" fontSize="14" fontWeight="900" textAnchor="middle">.JPG</text>
          <circle cx="18" cy="20" r="3" fill="#FFC600" />
        </g>

        {/* Merge Arrows in between */}
        <path d="M80,85 Q88,85 92,85" stroke="#05D9E8" strokeWidth="2" strokeLinecap="round" />
        <path d="M198,85 Q190,85 186,85" stroke="#FF2A6D" strokeWidth="2" strokeLinecap="round" />

        {/* Floating Stars */}
        <polygon points="20,25 22,29 26,30 22,31 20,35 18,31 14,30 18,29" fill="#FFC600" />
        <polygon points="260,28 262,32 266,33 262,34 260,38 258,34 254,33 258,32" fill="#05D9E8" />
        <polygon points="140,150 142,154 146,155 142,156 140,160 138,156 134,155 138,154" fill="#FF2A6D" />
      </svg>
    </div>
  );
};


