import React, { useState, useRef, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Download, 
  Loader2, 
  Sparkles, 
  Settings, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  Trash2,
  Archive,
  Send,
  Film,
  Ratio,
  Maximize2,
  Sliders,
  Check
} from 'lucide-react';
import JSZip from 'jszip';
import { GeminiModelId } from '../types';
import { ImageMascot } from './CartoonMascots';

export const ASPECT_RATIOS = [
  { label: 'Square (1:1)', value: '1:1' },
  { label: 'Landscape (16:9)', value: '16:9' },
  { label: 'Portrait (9:16)', value: '9:16' },
  { label: 'Standard (4:3)', value: '4:3' },
  { label: 'Vertical (3:4)', value: '3:4' }
];

export const OUTPUT_FORMATS = [
  { label: 'PNG (.png)', value: 'image/png', ext: 'png' },
  { label: 'JPG (.jpg)', value: 'image/jpeg', ext: 'jpg' }
];

export const IMAGE_STYLES = [
  { id: 'flat', label: 'Flat Vector Design', promptSuffix: 'flat 2D vector graphic illustration, clean solid colors, no gradients, sharp edges, minimalist, pure white background, isolated object, UI design asset' },
  { id: 'lineart', label: 'Minimalist Line Art', promptSuffix: 'minimalist continuous line art, black ink on pure white background, vector style, simple, clean strokes, isolated' },
  { id: 'isometric', label: '3D Isometric Vector', promptSuffix: '3D isometric vector art, flat colors, clean geometric shapes, pure white background, isolated, professional design' },
  { id: 'gradient', label: 'Modern Gradient Vector', promptSuffix: 'modern vector logo illustration, smooth vibrant gradients, pure white background, isolated, digital art' },
  { id: 'retro', label: 'Retro/Vintage Vector', promptSuffix: 'retro vintage vector illustration, limited color palette, clean edges, pure white background, isolated' },
  { id: 'ultra_realistic', label: 'Ultra Realistic', promptSuffix: 'ultra realistic, highly detailed, photorealistic, 8k resolution, cinematic lighting, sharp focus' },
  { id: '3d_render', label: '3D Render', promptSuffix: '3D render, highly detailed, octane render, unreal engine 5, beautiful lighting, realistic textures' },
  { id: 'anime', label: 'Anime Style', promptSuffix: 'anime style illustration, studio ghibli style, vibrant colors, detailed, 2d animation aesthetics' },
  { id: 'watercolor', label: 'Watercolor Painting', promptSuffix: 'watercolor painting, artistic, soft fluid brush strokes, vibrant, aesthetic masterpiece, pure white background' },
  { id: 'hand_drawn', label: 'Hand Drawn / Doodle', promptSuffix: 'hand drawn illustration, cute doodle style, ink and marker, rough expressive lines, pure white background, isolated object' },
  { id: 'sketch', label: 'Pencil Sketch', promptSuffix: 'detailed graphite pencil sketch, realistic shading, monochrome, hand drawn, pure white background, isolated' },
];

interface GeneratedImageItem {
  id: number;
  prompt: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  imageUrl: string | null;
  error: string | null;
}

const SAMPLE_INITIAL_IMAGES: GeneratedImageItem[] = [
  {
    id: 1001,
    prompt: 'Kucing mecha futuristik lucu memakai kacamata cyberpunk neon',
    status: 'success',
    imageUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect width="600" height="600" fill="%230a0d18"/><circle cx="300" cy="300" r="180" fill="%231a1f36"/><polygon points="200,190 240,110 270,180" fill="%23f43f5e"/><polygon points="400,190 360,110 330,180" fill="%23f43f5e"/><circle cx="300" cy="320" r="130" fill="%232dd4bf"/><circle cx="250" cy="290" r="38" fill="%2306b6d4" stroke="%2338bdf8" stroke-width="8"/><circle cx="350" cy="290" r="38" fill="%2306b6d4" stroke="%2338bdf8" stroke-width="8"/><line x1="288" y1="290" x2="312" y2="290" stroke="%23facc15" stroke-width="8"/><polygon points="300,340 285,360 315,360" fill="%23fb7185"/><path d="M280,380 Q300,400 320,380" stroke="%23ffffff" stroke-width="6" fill="none"/><text x="300" y="520" font-family="sans-serif" font-size="22" font-weight="bold" fill="%2338bdf8" text-anchor="middle">MECHA CYBER CAT</text></svg>`,
    error: null,
  },
  {
    id: 1002,
    prompt: 'Mobil sport futuristik melaju kencang di jalanan neon cyberpunk malam hari',
    status: 'success',
    imageUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect width="600" height="600" fill="%230a0d18"/><circle cx="300" cy="300" r="220" fill="%23131728"/><path d="M140,360 L200,270 L400,270 L470,360 L480,400 L120,400 Z" fill="%236366f1"/><rect x="220" y="280" width="160" height="60" rx="10" fill="%2306b6d4"/><circle cx="200" cy="400" r="42" fill="%230f172a" stroke="%23f43f5e" stroke-width="8"/><circle cx="410" cy="400" r="42" fill="%230f172a" stroke="%23f43f5e" stroke-width="8"/><line x1="100" y1="440" x2="500" y2="440" stroke="%23ec4899" stroke-width="4"/><text x="300" y="520" font-family="sans-serif" font-size="22" font-weight="bold" fill="%23f43f5e" text-anchor="middle">FUTURISTIC CYBER CAR</text></svg>`,
    error: null,
  },
];

interface ImageStudioProps {
  selectedModel?: GeminiModelId;
  onSendToMetadataStudio?: (imageDataUrl: string, promptTitle: string) => void;
  onSendToMotionStudio?: (imageDataUrl: string, promptTitle: string) => void;
  apiKeyCount?: number;
  useCustomKeys?: boolean;
  initialPrompt?: string | null;
}

export const ImageStudio: React.FC<ImageStudioProps> = ({
  onSendToMetadataStudio,
  onSendToMotionStudio,
  initialPrompt,
}) => {
  const [promptsText, setPromptsText] = useState<string>(
    "Kucing lucu memakai kacamata mecha\nMobil sport futuristik cyberpunk melaju di malam hari\nSecangkir kopi panas dengan asap aromatik"
  );

  // If an inspiration prompt was selected from Dashboard, prefill it!
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      setPromptsText(initialPrompt.trim());
    }
  }, [initialPrompt]);
  const [aspectRatio, setAspectRatio] = useState<string>(ASPECT_RATIOS[0].value);
  const [selectedFormat, setSelectedFormat] = useState<string>(OUTPUT_FORMATS[0].value);
  const [selectedStyle, setSelectedStyle] = useState<string>(IMAGE_STYLES[0].id);
  const [results, setResults] = useState<GeneratedImageItem[]>(SAMPLE_INITIAL_IMAGES);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [isTransparent, setIsTransparent] = useState<boolean>(true);
  const [sentMap, setSentMap] = useState<Record<number, boolean>>({});
  const [sendingMotionId, setSendingMotionId] = useState<number | null>(null);

  const resultsEndRef = useRef<HTMLDivElement | null>(null);

  // Convert image format & apply Euclidean background white removal for vector transparency
  const convertImageFormat = (imageUrl: string, targetFormat: string, applyTransparency = false): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (imageUrl.startsWith(`data:${targetFormat}`) && !applyTransparency) {
        resolve(imageUrl);
        return;
      }

      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(imageUrl);
          return;
        }

        if (targetFormat === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);

        if (targetFormat === 'image/png' && applyTransparency) {
          try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];

              // Euclidean distance to detect pure and near-pure white background
              const distFromWhite = Math.sqrt(
                Math.pow(255 - r, 2) + Math.pow(255 - g, 2) + Math.pow(255 - b, 2)
              );

              if (distFromWhite < 15) {
                data[i + 3] = 0; // Completely transparent
              } else if (distFromWhite < 40) {
                // Smooth anti-aliased edge transition
                const alpha = Math.floor(((distFromWhite - 15) / 25) * 255);
                data[i + 3] = alpha;
              }
            }
            ctx.putImageData(imageData, 0, 0);
          } catch (e) {
            console.error('Gagal memproses transparansi:', e);
          }
        }

        resolve(canvas.toDataURL(targetFormat, 1.0));
      };
      img.onerror = () => reject(new Error('Gagal memuat gambar untuk konversi'));
      img.src = imageUrl;
    });
  };

  // Generate Image via Server Endpoint with fallback to direct Gemini API
  const generateImage = async (basePrompt: string, styleSuffix: string, ratio: string): Promise<string> => {
    const finalPrompt = `Style requirements: ${styleSuffix}. Main subject: ${basePrompt}. MUST strictly follow the style requirements and background color.`;

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt,
          aspectRatio: ratio,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.imageUrl) {
          return data.imageUrl;
        }
      }
    } catch (e) {
      console.warn('Backend /api/generate-image error, trying fallback:', e);
    }

    // Direct Gemini 3.1 Flash Image API call fallback
    const payload = {
      contents: [{
        role: 'user',
        parts: [{ text: finalPrompt }],
      }],
      generationConfig: {
        responseModalities: ['IMAGE'],
        imageConfig: { aspectRatio: ratio },
      },
    };

    let effectiveKey = '';
    try {
      const keyStorage = localStorage.getItem('stockmeta_gemini_api_keys_v1');
      if (keyStorage) {
        const parsed = JSON.parse(keyStorage);
        if (parsed?.keys && parsed.keys.length > 0) {
          effectiveKey = parsed.keys[0].key;
        }
      }
    } catch {}

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key=${effectiveKey}`;
    const directRes = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!directRes.ok) {
      throw new Error(`API error: ${directRes.status}`);
    }

    const json = await directRes.json();
    const part = json?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
    if (!part) {
      throw new Error('Gagal mendapatkan gambar dari API (kemungkinan diblokir filter keamanan atau server sedang sibuk).');
    }

    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
  };

  const startBatchGeneration = async () => {
    setErrorMsg('');

    const lines = promptsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      setErrorMsg('Silakan masukkan minimal satu prompt pada daftar.');
      return;
    }

    setIsGenerating(true);
    setProgress({ current: 0, total: lines.length });

    const styleObj = IMAGE_STYLES.find((s) => s.id === selectedStyle);
    const suffix = styleObj ? styleObj.promptSuffix : IMAGE_STYLES[0].promptSuffix;

    const newResults: GeneratedImageItem[] = lines.map((prompt, index) => ({
      id: Date.now() + index,
      prompt,
      status: 'pending',
      imageUrl: null,
      error: null,
    }));

    setResults((prev) => [...newResults, ...prev]);

    for (let i = 0; i < lines.length; i++) {
      const currentPrompt = lines[i];
      const targetId = newResults[i].id;

      setResults((prev) =>
        prev.map((item) => (item.id === targetId ? { ...item, status: 'loading' } : item))
      );

      try {
        let imageUrl = await generateImage(currentPrompt, suffix, aspectRatio);

        if (selectedFormat === 'image/png' && isTransparent) {
          imageUrl = await convertImageFormat(imageUrl, 'image/png', true);
        }

        setResults((prev) =>
          prev.map((item) =>
            item.id === targetId ? { ...item, status: 'success', imageUrl } : item
          )
        );
      } catch (err: any) {
        console.error('Gagal generate image:', err);
        setResults((prev) =>
          prev.map((item) =>
            item.id === targetId
              ? {
                  ...item,
                  status: 'error',
                  error:
                    err.message === 'API error: 429'
                      ? 'Rate Limit (429): Terlalu cepat, API membatasi request.'
                      : err.message || 'Gagal membuat gambar',
                }
              : item
          )
        );
      }

      setProgress({ current: i + 1, total: lines.length });

      // 6-8 seconds pacing to prevent 429 rate limit
      if (i < lines.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 6000));
      }
    }

    setIsGenerating(false);
  };

  const clearResults = () => {
    if (!isGenerating) {
      setResults([]);
    }
  };

  const handleDownload = async (imageUrl: string, prompt: string) => {
    try {
      const formatInfo = OUTPUT_FORMATS.find((f) => f.value === selectedFormat) || OUTPUT_FORMATS[0];
      const applyTransparency = formatInfo.value === 'image/png' && isTransparent;
      const convertedUrl = await convertImageFormat(imageUrl, formatInfo.value, applyTransparency);

      const link = document.createElement('a');
      link.href = convertedUrl;
      const safeName = prompt.replace(/[^a-z0-9]/gi, '_').substring(0, 30) || 'image';
      link.download = `stock_image_${safeName}_${Date.now()}.${formatInfo.ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Gagal mengunduh gambar. Silakan coba lagi.');
    }
  };

  const handleDownloadZip = async () => {
    const successfulResults = results.filter((r) => r.status === 'success' && r.imageUrl);
    if (successfulResults.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      const imgFolder = zip.folder('Generated_Stock_Images') || zip;
      const formatInfo = OUTPUT_FORMATS.find((f) => f.value === selectedFormat) || OUTPUT_FORMATS[0];

      const conversionPromises = successfulResults.map(async (item, index) => {
        if (!item.imageUrl) return;
        const applyTransparency = formatInfo.value === 'image/png' && isTransparent;
        const convertedUrl = await convertImageFormat(item.imageUrl, formatInfo.value, applyTransparency);
        const base64Data = convertedUrl.split(',')[1];
        const safeName = item.prompt.replace(/[^a-z0-9]/gi, '_').substring(0, 30) || 'image';
        const fileName = `${index + 1}_${safeName}.${formatInfo.ext}`;
        imgFolder.file(fileName, base64Data, { base64: true });
      });

      await Promise.all(conversionPromises);

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `BatchImagePro_Collection_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Gagal membuat file ZIP:', error);
      alert(`Gagal membuat ZIP: ${error.message}`);
    } finally {
      setIsZipping(false);
    }
  };

  // Send to Metadata Studio
  const handleSendToMeta = (item: GeneratedImageItem) => {
    if (!item.imageUrl || !onSendToMetadataStudio) return;
    onSendToMetadataStudio(item.imageUrl, item.prompt);
    setSentMap((prev) => ({ ...prev, [item.id]: true }));
  };

  // Send to Motion Studio as reference
  const handleSendToMotion = (item: GeneratedImageItem) => {
    if (!item.imageUrl || !onSendToMotionStudio) return;
    setSendingMotionId(item.id);
    onSendToMotionStudio(item.imageUrl, item.prompt);
    setTimeout(() => setSendingMotionId(null), 1200);
  };

  return (
    <div className="space-y-5 select-none text-slate-100 font-mono">
      {/* Cartoon App Profile Header: Digital AI Artist */}
      <div className="bg-[#0f111a] rounded-2xl border border-purple-500/30 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg shadow-purple-950/20 relative overflow-hidden select-none">
        {/* Soft Ambient Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 min-w-0 relative z-10">
          <div className="shrink-0 drop-shadow-md transition-transform hover:scale-105 duration-300">
            <ImageMascot size={74} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-extrabold text-white tracking-wide uppercase">
                Image Generator
              </h2>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-bold border border-purple-500/30">
                Profile #02 &bull; Purple Anime
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Alpha Auto-Transparent
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                11 Vector Styles
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                <span>🎬</span> One-Click to Motion
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 font-sans">
              Batch Image Studio dengan AI Vision, penghapus background otomatis, dan integrasi instan ke Motion Studio untuk animasi selanjutnya.
            </p>
          </div>
        </div>

        {/* Quick Action Badges */}
        <div className="flex items-center gap-2 shrink-0 relative z-10">
          {results.some((r) => r.status === 'success') && (
            <button
              onClick={handleDownloadZip}
              disabled={isZipping || isGenerating}
              className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              {isZipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
              <span>{isZipping ? 'Mengekstrak...' : 'Download Semua (ZIP)'}</span>
            </button>
          )}

          {results.length > 0 && (
            <button
              onClick={clearResults}
              disabled={isGenerating}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bersihkan</span>
            </button>
          )}
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN: Controls & Settings (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#0f111a] rounded-2xl border border-white/10 p-4 space-y-4 shadow-sm">
            <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
              <Settings className="w-4 h-4 text-cyan-400" />
              <h3 className="font-semibold text-xs text-white uppercase tracking-wider">
                Pengaturan Batch Image
              </h3>
            </div>

            {/* Prompt List */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Daftar Prompt (Satu per baris):
              </label>
              <textarea
                value={promptsText}
                onChange={(e) => setPromptsText(e.target.value)}
                disabled={isGenerating}
                rows={5}
                className="w-full p-3 text-xs bg-black/30 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed resize-y font-mono"
                placeholder="Kucing lucu memakai kacamata mecha&#10;Mobil sport futuristik melaju&#10;Secangkir kopi panas dengan asap"
              />
            </div>

            {/* Aspect Ratio */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Ratio className="w-3.5 h-3.5 text-cyan-400" />
                <span>Aspek Rasio</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {ASPECT_RATIOS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setAspectRatio(r.value)}
                    disabled={isGenerating}
                    className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition text-center cursor-pointer truncate ${
                      aspectRatio === r.value
                        ? 'bg-cyan-500 text-black border-cyan-400 font-bold'
                        : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    {r.value}
                  </button>
                ))}
              </div>
            </div>

            {/* Image Style Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Style Gambar (11 Pilihan)</span>
              </label>
              <select
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                disabled={isGenerating}
                className="w-full px-3 py-2 text-xs font-semibold bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {IMAGE_STYLES.map((style) => (
                  <option key={style.id} value={style.id} className="bg-slate-900 text-white">
                    {style.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Output Format & Transparency */}
            <div className="space-y-2.5">
              <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-rose-400" />
                <span>Format Output &amp; Transparansi</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {OUTPUT_FORMATS.map((fmt) => (
                  <button
                    key={fmt.value}
                    type="button"
                    onClick={() => {
                      setSelectedFormat(fmt.value);
                      if (fmt.value !== 'image/png') setIsTransparent(false);
                      else setIsTransparent(true);
                    }}
                    disabled={isGenerating}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition text-center cursor-pointer ${
                      selectedFormat === fmt.value
                        ? 'bg-purple-600 text-white border-purple-500 font-bold'
                        : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>

              {selectedFormat === 'image/png' && (
                <div className="flex items-center p-2.5 bg-cyan-950/20 border border-cyan-500/30 rounded-xl">
                  <input
                    id="transparent-toggle"
                    type="checkbox"
                    checked={isTransparent}
                    onChange={(e) => setIsTransparent(e.target.checked)}
                    disabled={isGenerating}
                    className="h-4 w-4 text-cyan-500 focus:ring-cyan-400 border-white/20 rounded cursor-pointer"
                  />
                  <label htmlFor="transparent-toggle" className="ml-2.5 block text-xs text-cyan-200 cursor-pointer">
                    Hapus Background Putih (Alpha Transparan Otomatis)
                  </label>
                </div>
              )}
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 text-rose-200 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Generate Batch Button */}
            <button
              onClick={startBatchGeneration}
              disabled={isGenerating}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs shadow-md flex justify-center items-center gap-2 transition cursor-pointer ${
                isGenerating
                  ? 'bg-cyan-600/50 text-white cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-cyan-500/20'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses {progress.current}/{progress.total}...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Batch Gambar AI</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Results Gallery & Synergy Actions (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Creative Workflow Synergy Banner (Opsional & Fleksibel) */}
          <div className="bg-gradient-to-r from-rose-500/10 via-purple-500/10 to-cyan-500/10 border border-white/10 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-purple-600 flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-rose-500/20">
                <Film className="w-4 h-4 text-white" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-white uppercase tracking-wide">
                    Alur Kerja Studio Terpadu (Opsional)
                  </span>
                  <span className="text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-semibold">
                    Image &rarr; Motion &rarr; Metadata
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Setelah generate gambar: klik tombol <strong className="text-rose-400">"Buat Motion"</strong> di kartu gambar untuk otomatis memasukkannya sebagai <em>Gambar Referensi</em> di Motion Studio, lalu beri perintah gerakan untuk video 60 FPS. <span className="text-slate-400 italic">(Fitur ini sepenuhnya opsional, gambar dapat langsung diunduh tanpa dijadikan motion).</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setResults(SAMPLE_INITIAL_IMAGES)}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-[11px] font-semibold shrink-0 cursor-pointer transition flex items-center gap-1.5"
              title="Muat contoh gambar siap pakai untuk menguji tombol Motion"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Muat Sampel</span>
            </button>
          </div>

          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="font-semibold text-xs text-white uppercase tracking-wider flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-cyan-400" />
              <span>Galeri Hasil Gambar ({results.length})</span>
            </h3>
            {isGenerating && (
              <span className="text-xs text-cyan-300 font-bold flex items-center gap-1.5 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Membuat gambar {progress.current + 1} dari {progress.total}...</span>
              </span>
            )}
          </div>

          {results.length === 0 ? (
            <div className="bg-[#0f111a] border border-dashed border-white/10 rounded-2xl h-80 flex flex-col items-center justify-center text-slate-500 space-y-2.5 p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-slate-400">
                <ImageIcon className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-300">Belum ada gambar yang di-generate</p>
              <p className="text-xs text-slate-500 max-w-sm">
                Masukkan daftar prompt di panel kiri, pilih gaya visual yang diinginkan, lalu tekan "Generate Batch Gambar AI", atau klik "Muat Sampel".
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {results.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#0f111a] rounded-2xl border border-white/10 overflow-hidden flex flex-col group transition hover:border-white/25 shadow-sm"
                >
                  {/* Image Viewport Container */}
                  <div className="relative aspect-square bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMGUxMjFiIi8+PHJlY3QgeD0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iIzE2MWMyOSIvPjxyZWN0IHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMxNjFjMjkiLz48cmVjdCB4PSIxMCIgeT0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iIzBlMTIxYiIvPjwvc3ZnPg==')] bg-slate-950 flex items-center justify-center p-2 overflow-hidden border-b border-white/10">
                    {item.status === 'pending' && (
                      <div className="text-slate-500 flex flex-col items-center gap-2">
                        <Loader2 className="w-6 h-6 opacity-30 animate-spin" />
                        <span className="text-xs">Menunggu giliran...</span>
                      </div>
                    )}

                    {item.status === 'loading' && (
                      <div className="text-cyan-400 flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="text-xs font-semibold animate-pulse">Sedang Merender...</span>
                      </div>
                    )}

                    {item.status === 'error' && (
                      <div className="text-rose-400 flex flex-col items-center gap-2 p-4 text-center">
                        <AlertCircle className="w-7 h-7" />
                        <span className="text-xs font-bold">Gagal Render</span>
                        <span className="text-[10px] text-rose-300 max-w-xs">{item.error}</span>
                      </div>
                    )}

                    {item.status === 'success' && item.imageUrl && (
                      <>
                        <img
                          src={item.imageUrl}
                          alt={item.prompt}
                          className="w-full h-full object-contain relative z-10 transition group-hover:scale-[1.02]"
                        />

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5 z-20">
                          <button
                            onClick={() => handleDownload(item.imageUrl!, item.prompt)}
                            className="bg-white hover:bg-slate-100 text-black p-2.5 rounded-xl shadow-lg transition cursor-pointer"
                            title="Download Gambar"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Info Footer & Suite Synergy Actions */}
                  <div className="p-3.5 bg-[#0a0c14] flex flex-col justify-between flex-grow space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-white/5 border border-white/10">
                          {item.status === 'success' ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Berhasil
                            </span>
                          ) : item.status === 'error' ? (
                            <span className="text-rose-400">Gagal</span>
                          ) : (
                            <span className="text-slate-400">Diproses</span>
                          )}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          ID #{item.id.toString().slice(-4)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 font-medium line-clamp-2 leading-relaxed" title={item.prompt}>
                        {item.prompt}
                      </p>
                    </div>

                    {item.status === 'success' && item.imageUrl && (
                      <div className="space-y-2 pt-2 border-t border-white/5">
                        {/* Primary Workflow Action: Send to Motion Studio */}
                        {onSendToMotionStudio && (
                          <button
                            onClick={() => handleSendToMotion(item)}
                            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-rose-500/25 via-purple-500/25 to-pink-500/20 hover:from-rose-500/40 hover:via-purple-500/40 hover:to-pink-500/35 text-rose-100 hover:text-white border border-rose-500/40 hover:border-rose-400 text-xs font-bold flex items-center justify-between gap-2 transition-all cursor-pointer shadow-sm group/motion"
                            title="Kirim gambar ini otomatis ke Motion Studio sebagai referensi animasi 60 FPS (Alur Opsional)"
                          >
                            <span className="flex items-center gap-2">
                              <Film className="w-4 h-4 text-rose-400 group-hover/motion:scale-110 transition-transform" />
                              <span>{sendingMotionId === item.id ? 'Memuat ke Motion Studio...' : 'Buat Motion (Jadikan Animasi)'}</span>
                            </span>
                            <span className="text-[9px] bg-rose-500/30 text-rose-200 border border-rose-400/30 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                              <span>Opsional</span> &rarr;
                            </span>
                          </button>
                        )}

                        {/* Secondary Actions: Download & Metadata Studio */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDownload(item.imageUrl!, item.prompt)}
                            className="flex-1 py-1.5 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                            title="Download gambar langsung (PNG/JPG)"
                          >
                            <Download className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Download</span>
                          </button>

                          {onSendToMetadataStudio && (
                            <button
                              onClick={() => handleSendToMeta(item)}
                              className="flex-1 py-1.5 px-2.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                              title="Kirim ke Metadata Studio untuk generate Judul & 49 Keywords Adobe Stock!"
                            >
                              <Send className="w-3.5 h-3.5 text-amber-400" />
                              <span>{sentMap[item.id] ? 'Terkirim!' : 'Metadata'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={resultsEndRef} />
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
