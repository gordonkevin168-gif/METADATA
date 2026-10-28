import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Wand2, 
  RefreshCw, 
  Play, 
  Pause, 
  RotateCcw, 
  Copy, 
  Check, 
  Download, 
  Camera, 
  Send, 
  ImagePlus, 
  Trash2, 
  AlertTriangle, 
  Code2, 
  Sparkles, 
  Layers, 
  Video, 
  Monitor, 
  Zap, 
  CheckCircle2,
  Clock,
  Undo2,
  Settings2,
  Film
} from 'lucide-react';
import { MotionBgMode, MotionVersion, GeminiModelId } from '../types';
import { DEFAULT_MOTION_CODE } from '../utils/motionPresets';
import { smartGenerateMotionCode, smartRefineMotionCode } from '../services/geminiClient';
import { MotionExportModal } from './MotionExportModal';
import { MotionMascot } from './CartoonMascots';

interface MotionStudioProps {
  selectedModel: GeminiModelId;
  onSendToMetadataStudio?: (imageDataUrl: string, promptTitle: string, duration: number) => void;
  apiKeyCount?: number;
  useCustomKeys?: boolean;
  incomingReferenceAsset?: {
    imageUrl: string;
    prompt: string;
    timestamp: number;
  } | null;
  onClearIncomingReference?: () => void;
}

export const MotionStudio: React.FC<MotionStudioProps> = ({
  selectedModel,
  onSendToMetadataStudio,
  incomingReferenceAsset,
  onClearIncomingReference,
}) => {
  // Canvas & Engine state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentCode, setCurrentCode] = useState<string>(DEFAULT_MOTION_CODE);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(15);
  const [bgMode, setBgMode] = useState<MotionBgMode>('transparent');
  const [sceneCount, setSceneCount] = useState<number>(1);
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  // Input state
  const [promptUtama, setPromptUtama] = useState<string>('');
  const [promptKoreksi, setPromptKoreksi] = useState<string>('');
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const [referenceSourceInfo, setReferenceSourceInfo] = useState<{
    prompt: string;
    fromApp: 'image' | 'upload';
  } | null>(null);
  const lastProcessedRefTimestamp = useRef<number | null>(null);

  // Auto-load incoming reference asset from Image Studio when user clicks "Buat Motion"
  useEffect(() => {
    if (incomingReferenceAsset && incomingReferenceAsset.timestamp !== lastProcessedRefTimestamp.current) {
      lastProcessedRefTimestamp.current = incomingReferenceAsset.timestamp;
      setUploadedImageBase64(incomingReferenceAsset.imageUrl);
      setReferenceSourceInfo({
        prompt: incomingReferenceAsset.prompt,
        fromApp: 'image',
      });
      // Suggest polished motion prompt based on image prompt
      const generatedPrompt = `Animasi 3D dinamis dari gambar referensi: ${incomingReferenceAsset.prompt}. Objek bergerak melayang mulus (smooth floating oscillation), rotasi perlahan, efek partikel cahaya dan ambient glow, looping sempurna untuk footage microstock.`;
      setPromptUtama(generatedPrompt);
    }
  }, [incomingReferenceAsset]);

  const handleClearReferenceImage = () => {
    setUploadedImageBase64(null);
    setReferenceSourceInfo(null);
    if (onClearIncomingReference) {
      onClearIncomingReference();
    }
  };

  // History for Copilot revisions
  const [versionHistory, setVersionHistory] = useState<MotionVersion[]>([
    { version: 1, code: DEFAULT_MOTION_CODE, prompt: 'Default 3D Isometric Pin', timestamp: Date.now() },
  ]);
  const [currentVersion, setCurrentVersion] = useState<number>(1);

  // Export Modal state
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);

  // UI feedback
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [snapshotTaken, setSnapshotTaken] = useState<boolean>(false);
  const [sentToMetadata, setSentToMetadata] = useState<boolean>(false);

  // Animation frame ref & compiled function ref
  const drawFuncRef = useRef<((ctx: CanvasRenderingContext2D, t: number, opts: { width: number; height: number }) => void) | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const currentTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(duration);
  const isPlayingRef = useRef<boolean>(isPlaying);
  const bgModeRef = useRef<MotionBgMode>(bgMode);

  // Sync refs
  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    bgModeRef.current = bgMode;
  }, [bgMode]);

  // Compile JS code safely into drawFunc
  const compileCode = useCallback((codeString: string) => {
    try {
      setRuntimeError(null);
      let cleanCode = codeString.trim();
      if (cleanCode.startsWith('```javascript')) cleanCode = cleanCode.slice(13);
      else if (cleanCode.startsWith('```js')) cleanCode = cleanCode.slice(5);
      else if (cleanCode.startsWith('```')) cleanCode = cleanCode.slice(3);
      if (cleanCode.endsWith('```')) cleanCode = cleanCode.slice(0, -3);

      const compiled = new Function('ctx', 't', 'opts', cleanCode);
      if (typeof compiled === 'function') {
        drawFuncRef.current = compiled as any;
      }
    } catch (err: any) {
      console.error('Compilation Error:', err);
      setRuntimeError(`Sintaks Error: ${err.message || err}`);
    }
  }, []);

  // Initialize with default code
  useEffect(() => {
    compileCode(currentCode);
  }, [compileCode, currentCode]);

  // Main Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set fixed 16:9 Landscape 1920x1080 resolution for viewport
    canvas.width = 1920;
    canvas.height = 1080;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let localLastTime = performance.now();

    const render = (now: number) => {
      const dt = (now - localLastTime) / 1000;
      localLastTime = now;

      if (isPlayingRef.current) {
        currentTimeRef.current += dt;
        if (currentTimeRef.current >= durationRef.current) {
          currentTimeRef.current = 0; // Loop seamlessly
        }
        setCurrentTime(currentTimeRef.current);
      }

      const t = currentTimeRef.current;
      const width = canvas.width;
      const height = canvas.height;

      // Clear Canvas
      ctx.clearRect(0, 0, width, height);

      // Render solid background based on mode
      const currentBg = bgModeRef.current;
      if (currentBg === 'green') {
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(0, 0, width, height);
      } else if (currentBg === 'white') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
      } else if (currentBg === 'black') {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
      }

      // Execute dynamic animation function
      if (drawFuncRef.current) {
        try {
          ctx.save();
          const originalClearRect = ctx.clearRect;
          if (currentBg !== 'custom') {
            ctx.clearRect = () => {};
          }

          drawFuncRef.current(ctx, t, { width, height });

          if (currentBg !== 'custom') {
            ctx.clearRect = originalClearRect;
          }
          ctx.restore();
        } catch (err: any) {
          setIsPlaying(false);
          setRuntimeError(`Runtime Error di t=${t.toFixed(2)}s: ${err.message}`);
        }
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, []);

  // Generate Main Code from AI
  const handleGenerateUtama = async () => {
    if (!promptUtama.trim()) {
      alert('Silakan tulis instruksi prompt utama terlebih dahulu.');
      return;
    }

    setIsCompiling(true);
    setRuntimeError(null);

    try {
      const generatedCode = await smartGenerateMotionCode({
        prompt: promptUtama.trim(),
        duration,
        scenes: sceneCount,
        bgMode,
        referenceImageBase64: uploadedImageBase64 || undefined,
        selectedModel,
      });

      if (generatedCode) {
        setCurrentCode(generatedCode);
        compileCode(generatedCode);
        currentTimeRef.current = 0;
        setCurrentTime(0);
        setIsPlaying(true);

        const newV: MotionVersion = {
          version: versionHistory.length + 1,
          code: generatedCode,
          prompt: promptUtama.trim(),
          timestamp: Date.now(),
        };
        setVersionHistory((prev) => [...prev, newV]);
        setCurrentVersion(newV.version);
      }
    } catch (err: any) {
      console.error('Error generating motion:', err);
      setRuntimeError(`Gagal menghasilkan kode AI: ${err.message || err}`);
    } finally {
      setIsCompiling(false);
    }
  };

  // Copilot Refinement
  const handleGenerateKoreksi = async () => {
    if (!promptKoreksi.trim()) {
      alert('Silakan tulis perintah koreksi copilot terlebih dahulu.');
      return;
    }

    setIsCompiling(true);
    setRuntimeError(null);

    try {
      const refinedCode = await smartRefineMotionCode({
        currentCode,
        refinementPrompt: promptKoreksi.trim(),
        duration,
        bgMode,
        referenceImageBase64: uploadedImageBase64 || undefined,
        selectedModel,
      });

      if (refinedCode) {
        setCurrentCode(refinedCode);
        compileCode(refinedCode);
        setPromptKoreksi('');
        currentTimeRef.current = 0;
        setCurrentTime(0);
        setIsPlaying(true);

        const newV: MotionVersion = {
          version: versionHistory.length + 1,
          code: refinedCode,
          prompt: `Koreksi: ${promptKoreksi.trim()}`,
          timestamp: Date.now(),
        };
        setVersionHistory((prev) => [...prev, newV]);
        setCurrentVersion(newV.version);
      }
    } catch (err: any) {
      console.error('Error refining motion:', err);
      setRuntimeError(`Gagal memproses perbaikan copilot: ${err.message || err}`);
    } finally {
      setIsCompiling(false);
    }
  };

  // Rollback to previous version
  const handleRollbackVersion = (ver: MotionVersion) => {
    setCurrentCode(ver.code);
    compileCode(ver.code);
    setCurrentVersion(ver.version);
    currentTimeRef.current = 0;
    setCurrentTime(0);
    setIsPlaying(true);
  };

  // Scrubber change
  const handleScrubberChange = (val: number) => {
    setIsPlaying(false);
    currentTimeRef.current = val;
    setCurrentTime(val);
  };

  // Reset time
  const handleResetTime = () => {
    currentTimeRef.current = 0;
    setCurrentTime(0);
  };

  // Copy JS Code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Snapshot PNG Frame
  const handleTakeSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `motion_snapshot_${Date.now()}.png`;
    a.click();
    setSnapshotTaken(true);
    setTimeout(() => setSnapshotTaken(false), 2000);
  };

  // Send current canvas snapshot to Sub-App 1 (Metadata Studio)
  const handleSendToMetadata = () => {
    const canvas = canvasRef.current;
    if (!canvas || !onSendToMetadataStudio) return;

    const dataUrl = canvas.toDataURL('image/png');
    const titleContext = promptUtama.trim() || 'Animated 3D Motion Graphics Scene';
    onSendToMetadataStudio(dataUrl, titleContext, duration);

    setSentToMetadata(true);
    setTimeout(() => setSentToMetadata(false), 3000);
  };

  // Drag & drop reference image handler
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Silakan pilih berkas format gambar saja (PNG, JPG, WEBP, SVG).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImageBase64(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5 select-none text-slate-100">
      
      {/* Cartoon App Profile Header: Motion Director */}
      <div className="bg-[#0f111a] rounded-2xl border border-orange-500/30 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg shadow-orange-950/20 relative overflow-hidden select-none">
        {/* Soft Ambient Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 min-w-0 relative z-10">
          <div className="shrink-0 drop-shadow-md transition-transform hover:scale-105 duration-300">
            <MotionMascot size={74} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-extrabold text-white tracking-wide uppercase">
                Motion Studio
              </h2>
              <span className="text-[10px] bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full font-bold border border-orange-500/30">
                Profile #03 &bull; Orange Anime
              </span>
              <span className="text-[10px] bg-rose-500/15 text-rose-300 px-2 py-0.5 rounded-full font-bold border border-rose-500/30">
                ProRes 4444 (RGBA)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                60 FPS Canvas
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Custom Bitrate &bull; Multi-Ratio
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Direktur animasi procedural real-time dengan dukungan input referensi gambar, export MOV ProRes 4444 transparan, dan sinergi ke metadata.
            </p>
          </div>
        </div>
      </div>

      {/* Main 2-Column Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN: Controls, Prompts & Copilot (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Active Reference Banner from Image Studio */}
          {uploadedImageBase64 && (
            <div className="bg-gradient-to-r from-rose-500/10 via-purple-500/10 to-transparent border border-rose-500/30 rounded-2xl p-3.5 shadow-sm space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                  {referenceSourceInfo?.fromApp === 'image'
                    ? 'Gambar Referensi Aktif dari Image Studio'
                    : 'Gambar Referensi Kustom Aktif'}
                </span>
                <span className="text-[9px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/30 font-semibold">
                  Alur Opsional
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {referenceSourceInfo?.prompt
                  ? `Subjek: "${referenceSourceInfo.prompt}". Mesin AI akan menganalisis visual gambar ini untuk diubah menjadi animasi kanvas 60 FPS.`
                  : 'Gambar referensi visual telah terpasang. Mesin AI akan menggunakan gaya dan komposisinya.'}
              </p>
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                <span className="text-[10px] text-slate-400">
                  Tinggal beri instruksi gerakan di Step 2.
                </span>
                <button
                  type="button"
                  onClick={handleClearReferenceImage}
                  className="text-[10px] text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Hapus Referensi (Opsional)</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Upload / Gambar Referensi */}
          <div className="bg-[#0f111a] rounded-2xl border border-white/10 p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center text-[10px] font-bold">
                  1
                </span>
                <h3 className="font-semibold text-xs text-white uppercase tracking-wider">
                  Gambar Referensi (Opsional)
                </h3>
              </div>
              {uploadedImageBase64 && (
                <button
                  type="button"
                  onClick={handleClearReferenceImage}
                  className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Hapus</span>
                </button>
              )}
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleImageFile(e.dataTransfer.files[0]);
                }
              }}
              className="border border-dashed border-white/15 hover:border-rose-500/50 bg-white/[0.02] rounded-xl p-3 text-center cursor-pointer transition-all relative overflow-hidden group"
            >
              <input
                type="file"
                id="ref-img-upload"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleImageFile(e.target.files[0]);
                  }
                }}
              />

              {!uploadedImageBase64 ? (
                <label htmlFor="ref-img-upload" className="cursor-pointer space-y-1.5 py-1 block">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mx-auto group-hover:bg-rose-500/20 transition-all border border-white/10">
                    <ImagePlus className="w-4 h-4 text-slate-400 group-hover:text-rose-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-200 font-medium">Klik / Seret Gambar Referensi</p>
                    <p className="text-[10px] text-slate-500">
                      Otomatis terisi saat klik "Buat Motion" di Image Studio, atau upload manual
                    </p>
                  </div>
                </label>
              ) : (
                <div className="space-y-2">
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black/40 border border-white/10">
                    <img
                      src={uploadedImageBase64}
                      alt="Referensi"
                      className="w-full h-full object-contain"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearReferenceImage();
                      }}
                      className="absolute top-2 right-2 bg-rose-600 hover:bg-rose-500 text-white p-1 rounded-md transition shadow-md cursor-pointer"
                      title="Hapus Gambar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                    <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> Referensi Siap Dianimasikan
                    </span>
                    <span className="text-slate-500">Bisa diganti kapan saja</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Konfigurasi Prompt Utama & Parameter */}
          <div className="bg-[#0f111a] rounded-2xl border border-white/10 p-4 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px] font-bold">
                  2
                </span>
                <h3 className="font-semibold text-xs text-white uppercase tracking-wider">
                  Prompt Perintah Gerak &amp; Parameter
                </h3>
              </div>
              <span className="text-[10px] text-slate-400">Instruksi Animasi</span>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 font-medium mb-1">
                Perintah Kreatif Visual / Instruksi Gerakan:
              </label>
              <textarea
                value={promptUtama}
                onChange={(e) => setPromptUtama(e.target.value)}
                rows={3}
                className="w-full p-3 text-xs bg-black/30 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 leading-relaxed resize-y font-mono"
                placeholder="Contoh: Buat scene animasi mecha cyberpunk futuristik dengan laser neon merah berdetak cepat..."
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] text-slate-400 font-medium mb-1">
                  Durasi Timeline (Detik)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={duration}
                    onChange={(e) => setDuration(Math.max(1, Math.min(60, parseFloat(e.target.value) || 15)))}
                    className="w-full pl-3 pr-9 py-1.5 text-xs font-semibold bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-rose-500 font-mono"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono">
                    detik
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-medium mb-1">
                  Jumlah Scene
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={sceneCount}
                  onChange={(e) => setSceneCount(Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 1)))}
                  className="w-full px-3 py-1.5 text-xs font-semibold bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] text-slate-400 font-medium mb-1">
                  Background Kanvas (Alpha / Solid)
                </label>
                <select
                  value={bgMode}
                  onChange={(e) => setBgMode(e.target.value as MotionBgMode)}
                  className="w-full px-3 py-1.5 text-xs font-medium bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-rose-500 cursor-pointer"
                >
                  <option value="transparent">Alpha Channel (Transparan / ProRes 4444 Ready)</option>
                  <option value="green">Green Screen (#00FF00 - Keyable Video)</option>
                  <option value="black">Black Solid (#000000)</option>
                  <option value="white">White Solid (#FFFFFF)</option>
                  <option value="custom">Sesuai Prompt (Custom AI Background)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerateUtama}
              disabled={isCompiling}
              className="w-full bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-md shadow-rose-500/20 disabled:opacity-50 cursor-pointer"
            >
              <Wand2 className={`w-4 h-4 ${isCompiling ? 'animate-spin' : ''}`} />
              <span>{isCompiling ? 'Merender Kode Animasi...' : 'Generate Kode Utama AI'}</span>
            </button>
          </div>

          {/* Step 3: Copilot Koreksi & Modifikasi */}
          <div className="bg-[#0f111a] rounded-2xl border border-white/10 p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">
                  3
                </span>
                <h3 className="font-semibold text-xs text-white uppercase tracking-wider">
                  Copilot: Koreksi &amp; Versi
                </h3>
              </div>

              {versionHistory.length > 1 && (
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <span>Versi Aktif: v{currentVersion}</span>
                </div>
              )}
            </div>

            <div>
              <textarea
                value={promptKoreksi}
                onChange={(e) => setPromptKoreksi(e.target.value)}
                rows={2}
                className="w-full p-2.5 text-xs bg-black/30 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 leading-relaxed resize-y font-mono"
                placeholder="Contoh: Jadikan partikel neon lebih terang dan ubah rotasi jadi searah jarum jam..."
              />
            </div>

            <button
              onClick={handleGenerateKoreksi}
              disabled={isCompiling || !promptKoreksi.trim()}
              className="w-full bg-white/[0.04] hover:bg-white/[0.08] text-rose-300 font-semibold py-2 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1.5 border border-rose-500/30 disabled:opacity-40 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCompiling ? 'animate-spin' : ''}`} />
              <span>Terapkan Perbaikan Copilot</span>
            </button>

            {/* Version rollback pills */}
            {versionHistory.length > 1 && (
              <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Undo2 className="w-3 h-3" /> Riwayat:
                </span>
                {versionHistory.map((v) => (
                  <button
                    key={v.version}
                    onClick={() => handleRollbackVersion(v)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                      currentVersion === v.version
                        ? 'bg-rose-500 text-white'
                        : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
                    }`}
                  >
                    v{v.version}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Canvas Viewport, Scrubber & Action Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Canvas Viewport Stream (16:9) */}
          <div className="bg-[#0f111a] rounded-2xl border border-white/10 p-4 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <h3 className="font-semibold text-xs tracking-wide text-white uppercase">
                  Canvas Viewport Stream
                </h3>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-medium">
                <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 flex items-center gap-1">
                  <Monitor className="w-3 h-3 text-rose-400" /> 1920x1080 Full HD
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  60 FPS
                </span>
              </div>
            </div>

            {/* Canvas Outer with Checkerboard Background for Alpha Transparency */}
            <div className="relative w-full aspect-video bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMGUxMjFiIi8+PHJlY3QgeD0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iIzE2MWMyOSIvPjxyZWN0IHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMxNjFjMjkiLz48cmVjdCB4PSIxMCIgeT0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iIzBlMTIxYiIvPjwvc3ZnPg==')] bg-slate-950 rounded-xl overflow-hidden border border-white/10 shadow-inner flex items-center justify-center">
              <canvas ref={canvasRef} className="block w-full h-full object-contain" />

              {/* Loading Overlay */}
              {isCompiling && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center space-y-3 z-20">
                  <div className="relative flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
                    <Zap className="w-4 h-4 text-rose-400 absolute animate-pulse" />
                  </div>
                  <div className="text-center px-4">
                    <p className="text-xs font-bold tracking-wide uppercase text-white">AI Sedang Merender Canvas...</p>
                    <p className="text-[10px] text-rose-400/90 mt-0.5 font-mono">MEMBUAT JALUR KANVAS &amp; EFEK SINEMATIK</p>
                  </div>
                </div>
              )}
            </div>

            {/* Playback Timeline Controls */}
            <div className="bg-black/30 rounded-xl p-2.5 border border-white/10 flex items-center justify-between gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="bg-white/5 hover:bg-white/10 text-white p-2 rounded-lg border border-white/10 transition cursor-pointer"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 text-rose-400" />
                ) : (
                  <Play className="w-4 h-4 text-emerald-400 fill-current" />
                )}
              </button>

              <div className="flex-1 flex items-center space-x-2.5">
                <span className="text-[11px] font-mono font-medium text-slate-300 w-12 text-right">
                  {currentTime.toFixed(2)}s
                </span>
                <input
                  type="range"
                  min={0}
                  max={duration}
                  step={0.05}
                  value={currentTime}
                  onChange={(e) => handleScrubberChange(parseFloat(e.target.value))}
                  className="flex-1 accent-rose-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-[11px] font-mono text-slate-400 w-12">
                  {duration.toFixed(2)}s
                </span>
              </div>

              <button
                onClick={handleResetTime}
                className="bg-white/5 hover:bg-white/10 text-slate-300 p-2 rounded-lg border border-white/10 transition cursor-pointer"
                title="Reset Timeline ke 0.00s"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Actions Toolbar with ProRes 4444 Exporter */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
              <div className="flex items-center gap-2">
                {/* PRO EXPORT & DOWNLOAD BUTTON */}
                <button
                  onClick={() => setExportModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 flex items-center gap-2 cursor-pointer transition"
                  title="Buka panel kustomisasi export: Rasio aspek, resolusi 4K, bitrate, MOV ProRes 4444, MP4, dan ukuran minimal download"
                >
                  <Download className="w-4 h-4" />
                  <span>Export &amp; Download (ProRes 4444 / MP4)</span>
                </button>

                {/* Quick Snapshot PNG */}
                <button
                  onClick={handleTakeSnapshot}
                  className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 font-medium text-xs border border-white/10 flex items-center gap-1.5 cursor-pointer transition"
                  title="Unduh frame kanvas saat ini sebagai gambar PNG"
                >
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{snapshotTaken ? 'Tersimpan!' : 'Snapshot PNG'}</span>
                </button>
              </div>

              {/* Synergize with Sub-App 1 (Metadata Studio) */}
              {onSendToMetadataStudio && (
                <button
                  onClick={handleSendToMetadata}
                  className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs shadow-md shadow-amber-400/20 flex items-center gap-1.5 cursor-pointer shrink-0 transition"
                  title="Kirim snapshot animasi ini ke Metadata Studio untuk membuat Judul & 49 Keywords Adobe Stock!"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sentToMetadata ? 'Terkirim ke Metadata!' : 'Kirim ke Metadata Studio 🚀'}</span>
                </button>
              )}
            </div>

            {/* Runtime Error Console */}
            {runtimeError && (
              <div className="bg-rose-950/30 border border-rose-500/40 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-200">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <h4 className="font-semibold text-rose-300 uppercase tracking-wider text-[10px]">
                    Runtime Error:
                  </h4>
                  <p className="text-[11px] text-rose-200/90 font-mono mt-0.5 leading-relaxed break-all">
                    {runtimeError}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Rendered Code Output Tab */}
          <div className="bg-[#0f111a] rounded-2xl border border-white/10 p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-rose-400" />
                <h3 className="font-semibold text-xs text-white uppercase tracking-wider">
                  Kode Canvas JavaScript
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => compileCode(currentCode)}
                  className="text-xs bg-white/5 hover:bg-white/10 text-slate-300 px-2.5 py-1 rounded-lg border border-white/10 font-medium flex items-center gap-1 transition cursor-pointer"
                  title="Jalankan ulang kode setelah mengedit manual"
                >
                  <RefreshCw className="w-3 h-3 text-amber-400" />
                  <span>Run</span>
                </button>

                <button
                  onClick={handleCopyCode}
                  className="text-xs bg-white/5 hover:bg-white/10 text-slate-200 px-2.5 py-1 rounded-lg border border-white/10 font-medium flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Kode</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="relative bg-black/40 rounded-xl overflow-hidden border border-white/10">
              <textarea
                value={currentCode}
                onChange={(e) => setCurrentCode(e.target.value)}
                rows={9}
                className="w-full p-3 text-xs font-mono text-slate-300 bg-transparent focus:outline-none leading-relaxed resize-y"
                spellCheck={false}
              />
            </div>
          </div>

        </div>

      </div>

      {/* Motion Export & Download Modal (Ratio, Resolution, Bitrate, ProRes 4444, Min Size) */}
      <MotionExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        currentCode={currentCode}
        duration={duration}
        bgMode={bgMode}
        projectTitle={promptUtama || 'anime_motion'}
      />

    </div>
  );
};
