import { MotionPresetItem } from '../types';

export const DEFAULT_MOTION_CODE = `// --- Layer: 3D Isometric Anime Pin ---
ctx.save();
{
  const { width, height } = opts;
  const cx = width / 2;
  const cy = height / 2;

  // Floating bobbing effect based on time \`t\`
  const floatY = Math.sin(t * 3) * 15;
  const shadowScale = 1 - (Math.sin(t * 3) * 0.1);

  // Soft Ground Shadow
  ctx.save();
  ctx.translate(cx, cy + 120);
  ctx.scale(shadowScale, shadowScale * 0.4);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.arc(0, 0, 80, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Isometric Base Platform (Map Square)
  ctx.save();
  ctx.translate(cx, cy + 40 + floatY);
  ctx.scale(1, 0.55);
  ctx.rotate(Math.PI / 4);

  // Platform Outer Bevel
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.roundRect(-130, -130, 260, 260, 36);
  ctx.fill();

  // Platform Surface Map
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.roundRect(-120, -120, 240, 240, 28);
  ctx.fill();

  // Sci-Fi Grid Lines on Map
  ctx.strokeStyle = 'rgba(244, 63, 94, 0.25)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Cyber Roads / Highlights
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-90, 20); ctx.lineTo(20, -90);
  ctx.moveTo(-40, 90); ctx.lineTo(90, -40);
  ctx.stroke();

  ctx.restore();

  // 3D Red Location Pin Body (Hovering)
  ctx.save();
  ctx.translate(cx, cy - 30 + floatY);

  // Pin Shadow / Depth Layer
  ctx.fillStyle = '#881337';
  ctx.beginPath();
  ctx.arc(0, -20, 64, 0, Math.PI * 2);
  ctx.fill();

  // Main Red Pin Head Gradient
  const pinGrad = ctx.createRadialGradient(-20, -60, 10, 0, -20, 80);
  pinGrad.addColorStop(0, '#fb7185');
  pinGrad.addColorStop(0.5, '#f43f5e');
  pinGrad.addColorStop(1, '#9f1239');
  
  ctx.fillStyle = pinGrad;
  ctx.beginPath();
  ctx.arc(0, -35, 60, 0, Math.PI * 2);
  ctx.fill();

  // Pin Point Cone
  ctx.beginPath();
  ctx.moveTo(-48, -10);
  ctx.lineTo(0, 75);
  ctx.lineTo(48, -10);
  ctx.closePath();
  ctx.fill();

  // Inner White Hole of the Pin
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, -35, 22, 0, Math.PI * 2);
  ctx.fill();

  // Inner Core Glow
  ctx.fillStyle = '#f43f5e';
  ctx.beginPath();
  ctx.arc(0, -35, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Cybernetic Energy Rings pulsing upward
  const ringAlpha = (Math.sin(t * 5) + 1) / 2;
  ctx.save();
  ctx.translate(cx, cy + 60);
  ctx.scale(1, 0.4);
  ctx.strokeStyle = \`rgba(56, 189, 248, \${ringAlpha * 0.8})\`;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, 90 + ((t * 40) % 60), 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
ctx.restore();`;

export const MOTION_PRESETS: MotionPresetItem[] = [
  {
    id: 'iso-anime-pin',
    title: '3D Isometric Anime Pin',
    category: 'Anime 3D Icon',
    prompt: 'Buat scene animasi pin lokasi 3D isometric mengambang di atas peta platform kota cyberpunk futuristik dengan ring energi bercahaya neon.',
    defaultDuration: 15,
    defaultBg: 'transparent',
    code: DEFAULT_MOTION_CODE,
    thumbnailIcon: '📍',
  },
  {
    id: 'cyberpunk-portal',
    title: 'Cyberpunk Shuriken & Portal',
    category: 'VFX / Action',
    prompt: 'Animasi portal sci-fi berputar dengan bilah shuriken bercahaya laser merah dan biru, partikel melingkar berkecepatan tinggi, dan ripple distorsi ruang.',
    defaultDuration: 10,
    defaultBg: 'black',
    code: `ctx.save();
{
  const { width, height } = opts;
  const cx = width / 2;
  const cy = height / 2;

  // Background ambient glow
  const bgGlow = ctx.createRadialGradient(cx, cy, 50, cx, cy, 400);
  bgGlow.addColorStop(0, 'rgba(244, 63, 94, 0.25)');
  bgGlow.addColorStop(0.5, 'rgba(14, 165, 233, 0.1)');
  bgGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = bgGlow;
  ctx.fillRect(0, 0, width, height);

  // Rotating Cyber Rings
  const numRings = 4;
  for (let r = 0; r < numRings; r++) {
    ctx.save();
    ctx.translate(cx, cy);
    const dir = r % 2 === 0 ? 1 : -1;
    ctx.rotate(t * (0.8 + r * 0.4) * dir);

    const radius = 90 + r * 55;
    ctx.strokeStyle = r % 2 === 0 ? '#f43f5e' : '#00f2fe';
    ctx.lineWidth = 3 + (r === 0 ? 3 : 1);
    ctx.setLineDash([30 + r * 15, 20 + r * 10, 10, 15]);
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Small cyber nodes
    for (let a = 0; a < 6; a++) {
      const angle = (a * Math.PI) / 3;
      const nx = Math.cos(angle) * radius;
      const ny = Math.sin(angle) * radius;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(nx, ny, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Central Spinning Neon Shuriken
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(t * 3.5);

  const blades = 4;
  for (let b = 0; b < blades; b++) {
    ctx.save();
    ctx.rotate((b * Math.PI * 2) / blades);
    
    // Blade gradient
    const bGrad = ctx.createLinearGradient(0, 0, 120, 0);
    bGrad.addColorStop(0, '#ffffff');
    bGrad.addColorStop(0.3, '#fb7185');
    bGrad.addColorStop(1, '#9f1239');

    ctx.fillStyle = bGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(25, -15);
    ctx.lineTo(130, 0);
    ctx.lineTo(25, 15);
    ctx.closePath();
    ctx.fill();

    // Sharp glowing edge
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  // Center Core Orb
  const corePulse = 20 + Math.sin(t * 8) * 5;
  const coreGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, corePulse);
  coreGrad.addColorStop(0, '#ffffff');
  coreGrad.addColorStop(0.4, '#00f2fe');
  coreGrad.addColorStop(1, 'rgba(244, 63, 94, 0)');
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(0, 0, corePulse * 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Floating Spark Particles
  for (let p = 0; p < 24; p++) {
    const pSeed = (p * 9301 + 49297) % 233280;
    const pAngle = (pSeed + t * 40 * (p % 3 + 1)) * 0.05;
    const pDist = 60 + ((pSeed * 0.7 + t * 90) % 280);
    const px = cx + Math.cos(pAngle) * pDist;
    const py = cy + Math.sin(pAngle) * pDist;
    const pSize = 1.5 + (p % 3);

    ctx.fillStyle = p % 2 === 0 ? '#38bdf8' : '#fb7185';
    ctx.beginPath();
    ctx.arc(px, py, pSize, 0, Math.PI * 2);
    ctx.fill();
  }
}
ctx.restore();`,
    thumbnailIcon: '⚡',
  },
  {
    id: 'cyber-hud-telemetry',
    title: 'Cyberpunk HUD Telemetry & Radar',
    category: 'HUD / UI Tech',
    prompt: 'Animasi HUD telemetry futuristik dengan radar pemindaian melingkar, indikator gelombang audio, bar status persentase, dan grid target teknologi tinggi.',
    defaultDuration: 15,
    defaultBg: 'black',
    code: `ctx.save();
{
  const { width, height } = opts;
  const cx = width / 2;
  const cy = height / 2;

  // Outer Reticle Circles
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 280, 0, Math.PI * 2);
  ctx.stroke();

  // Sweeping Radar Line
  ctx.save();
  ctx.translate(cx, cy);
  const radarAngle = t * 2.2;
  ctx.rotate(radarAngle);

  const sweepGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 260);
  sweepGrad.addColorStop(0, 'rgba(16, 185, 129, 0.8)');
  sweepGrad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
  ctx.fillStyle = sweepGrad;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, 260, 0, -Math.PI / 4, true);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#34d399';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(260, 0);
  ctx.stroke();
  ctx.restore();

  // Target Crosshair
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 300, cy); ctx.lineTo(cx + 300, cy);
  ctx.moveTo(cx, cy - 300); ctx.lineTo(cx, cy + 300);
  ctx.stroke();

  // Concentric Dotted Compass Ring
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-t * 0.6);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 12]);
  ctx.beginPath();
  ctx.arc(0, 0, 180, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Floating Target Blips
  const blip1Alpha = (Math.sin(t * 4) + 1) / 2;
  ctx.fillStyle = \`rgba(239, 68, 68, \${blip1Alpha})\`;
  ctx.beginPath();
  ctx.arc(cx + 120, cy - 80, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ef4444';
  ctx.strokeRect(cx + 105, cy - 95, 30, 30);

  // Digital readout typography
  ctx.font = 'bold 16px monospace';
  ctx.fillStyle = '#34d399';
  ctx.fillText(\`TARGET ACQUIRED: T-\${t.toFixed(2)}s\`, cx - 110, cy + 140);
  ctx.fillStyle = '#38bdf8';
  ctx.fillText(\`RADAR FREQ: 98.4 GHz · SCAN 360°\`, cx - 130, cy + 165);
}
ctx.restore();`,
    thumbnailIcon: '🎯',
  },
  {
    id: 'crypto-coin-3d',
    title: 'Floating 3D Gold Crypto Coin',
    category: 'Commercial 3D Asset',
    prompt: 'Koin cryptocurrency emas 3D berputar halus di udara dengan bayangan tanah lembut, kilauan cahaya berkilap, dan simbol bitcoin neon teremboss.',
    defaultDuration: 12,
    defaultBg: 'transparent',
    code: `ctx.save();
{
  const { width, height } = opts;
  const cx = width / 2;
  const cy = height / 2;

  const floatY = Math.sin(t * 2.5) * 18;
  const rot = t * 1.8;
  const cosRot = Math.cos(rot);
  const sinRot = Math.sin(rot);

  // Soft Ground Shadow
  ctx.save();
  ctx.translate(cx, cy + 160);
  const shadowW = 120 * Math.abs(cosRot) + 40;
  ctx.scale(shadowW / 120, 0.25);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.arc(0, 0, 120, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 3D Coin Body (Front and Thickness Extrusion)
  ctx.save();
  ctx.translate(cx, cy + floatY);

  const radius = 130;
  const thickness = 28;

  // Extrusion edge
  const steps = 15;
  for (let i = 0; i <= steps; i++) {
    const off = (i / steps) * thickness * sinRot;
    ctx.fillStyle = i === steps ? '#b45309' : '#d97706';
    ctx.beginPath();
    ctx.ellipse(off, 0, radius * Math.abs(cosRot), radius, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Front Face
  const goldGrad = ctx.createRadialGradient(-30, -40, 10, 0, 0, radius);
  goldGrad.addColorStop(0, '#fef08a');
  goldGrad.addColorStop(0.3, '#f59e0b');
  goldGrad.addColorStop(0.8, '#d97706');
  goldGrad.addColorStop(1, '#78350f');

  ctx.fillStyle = goldGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * Math.abs(cosRot), radius, 0, 0, Math.PI * 2);
  ctx.fill();

  // Outer Rim Ridge
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 6;
  ctx.stroke();

  // Central Crypto Symbol (scales with cosRot)
  ctx.save();
  ctx.scale(cosRot, 1);
  ctx.font = '900 110px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('₿', 0, 5);

  // Inner ring
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, 95, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Gleam Highlight flare
  const gleamX = Math.sin(t * 3) * 70;
  const gleamGrad = ctx.createLinearGradient(gleamX - 20, -100, gleamX + 20, 100);
  gleamGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
  gleamGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.35)');
  gleamGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gleamGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * Math.abs(cosRot), radius, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
ctx.restore();`,
    thumbnailIcon: '🪙',
  },
  {
    id: 'ev-battery-hud',
    title: 'EV Battery Charging Gauge HUD',
    category: 'Clean Energy & Auto',
    prompt: 'Indikator dashboard status pengisian baterai kendaraan listrik 3D dengan gauge melingkar neon cyan, kilatan listrik, dan angka persentase digital naik mulus.',
    defaultDuration: 15,
    defaultBg: 'black',
    code: `ctx.save();
{
  const { width, height } = opts;
  const cx = width / 2;
  const cy = height / 2;

  // Background Grid Lines
  ctx.strokeStyle = 'rgba(30, 41, 59, 0.5)';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 80) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
  }
  for (let y = 0; y < height; y += 80) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }

  // Circular Gauge Background Track
  const radius = 170;
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, Math.PI * 0.75, Math.PI * 2.25);
  ctx.stroke();

  // Dynamic Animated Charge Level
  const chargeCycle = (t % 10) / 10;
  const pct = Math.floor(20 + chargeCycle * 78);
  const startAngle = Math.PI * 0.75;
  const totalSweep = Math.PI * 1.5;
  const endAngle = startAngle + totalSweep * (pct / 100);

  // Gradient Arc
  const arcGrad = ctx.createLinearGradient(cx - radius, cy, cx + radius, cy);
  arcGrad.addColorStop(0, '#00f2fe');
  arcGrad.addColorStop(0.6, '#10b981');
  arcGrad.addColorStop(1, '#34d399');

  ctx.strokeStyle = arcGrad;
  ctx.lineWidth = 22;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy, radius, startAngle, endAngle);
  ctx.stroke();

  // Central Electric Bolt Icon
  ctx.fillStyle = '#00f2fe';
  ctx.beginPath();
  ctx.moveTo(cx - 5, cy - 80);
  ctx.lineTo(cx - 25, cy - 30);
  ctx.lineTo(cx + 5, cy - 30);
  ctx.lineTo(cx - 15, cy + 25);
  ctx.lineTo(cx + 25, cy - 40);
  ctx.lineTo(cx - 5, cy - 40);
  ctx.closePath();
  ctx.fill();

  // Digital Percentage Readout
  ctx.font = '900 68px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(\`\${pct}%\`, cx, cy + 85);

  ctx.font = 'bold 14px monospace';
  ctx.fillStyle = '#34d399';
  ctx.fillText('DC FAST CHARGING · 350 kW', cx, cy + 120);
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('STATION #04 ACTIVE · 420V', cx, cy + 145);
}
ctx.restore();`,
    thumbnailIcon: '🔋',
  },
  {
    id: 'anime-speedlines-burst',
    title: 'Anime Action Speedlines & Burst',
    category: 'Anime FX',
    prompt: 'Efek speedlines aksi anime dramatis berkecepatan tinggi dengan pancaran sinar radiasi dari pusat, getaran layar kinetik, dan partikel benturan emas.',
    defaultDuration: 8,
    defaultBg: 'black',
    code: `ctx.save();
{
  const { width, height } = opts;
  const cx = width / 2;
  const cy = height / 2;

  // Screen shake
  const shakeX = Math.sin(t * 40) * 4;
  const shakeY = Math.cos(t * 35) * 4;
  ctx.translate(shakeX, shakeY);

  // Radial Action Speedlines
  const lineCount = 72;
  for (let i = 0; i < lineCount; i++) {
    const angle = (i * Math.PI * 2) / lineCount + Math.sin(t * 10 + i) * 0.02;
    const innerDist = 120 + ((i * 37 + t * 500) % 200);
    const outerDist = Math.max(width, height);
    const lineW = (i % 3 === 0 ? 5 : 2) + Math.sin(t * 20 + i) * 1.5;

    const x1 = cx + Math.cos(angle) * innerDist;
    const y1 = cy + Math.sin(angle) * innerDist;
    const x2 = cx + Math.cos(angle) * outerDist;
    const y2 = cy + Math.sin(angle) * outerDist;

    ctx.strokeStyle = i % 4 === 0 ? '#f43f5e' : (i % 2 === 0 ? '#ffffff' : '#38bdf8');
    ctx.lineWidth = lineW;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Central Impact Flash Burst
  const flashAlpha = (Math.sin(t * 12) + 1) / 2;
  const burstGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 180);
  burstGrad.addColorStop(0, '#ffffff');
  burstGrad.addColorStop(0.3, \`rgba(254, 240, 138, \${flashAlpha})\`);
  burstGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = burstGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 180, 0, Math.PI * 2);
  ctx.fill();
}
ctx.restore();`,
    thumbnailIcon: '🌪️',
  },
];
