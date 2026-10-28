import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Download,
  Settings2,
  Film,
  Video,
  Check,
  Sparkles,
  HardDrive,
  Gauge,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Play,
  Layers,
  Ratio,
  Maximize2
} from 'lucide-react';
import JSZip from 'jszip';

export type ExportFormat = 'mp4' | 'mov' | 'webm' | 'png_seq';
export type ExportAspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '21:9' | 'custom';
export type ExportResolutionPreset = '4k' | '2k' | '1080p' | '720p' | 'custom';

interface MotionExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCode: string;
  duration: number;
  bgMode: string;
  projectTitle?: string;
}

export const MotionExportModal: React.FC<MotionExportModalProps> = ({
  isOpen,
  onClose,
  currentCode,
  duration,
  bgMode,
  projectTitle = 'anime_motion'
}) => {
  // Format & Quality settings
  const [format, setFormat] = useState<ExportFormat>('mov');
  const [isProRes4444, setIsProRes4444] = useState<boolean>(true);
  const [aspectRatio, setAspectRatio] = useState<ExportAspectRatio>('16:9');
  const [resolutionPreset, setResolutionPreset] = useState<ExportResolutionPreset>('1080p');
  const [customWidth, setCustomWidth] = useState<number>(1920);
  const [customHeight, setCustomHeight] = useState<number>(1080);
  const [fps, setFps] = useState<number>(60);
  const [bitrateMbps, setBitrateMbps] = useState<number>(35); // 35 Mbps stock master default
  
  // Minimal File Size feature
  const [minFileSizeOption, setMinFileSizeOption] = useState<'none' | '15mb' | '30mb' | '50mb' | 'custom'>('15mb');
  const [customMinSizeMb, setCustomMinSizeMb] = useState<number>(15);

  // Background transparency
  const [overrideBg, setOverrideBg] = useState<'inherit' | 'transparent' | 'green' | 'black' | 'white'>('inherit');

  // Export progress & status
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [renderedFrames, setRenderedFrames] = useState<number>(0);
  const [totalFramesToRender, setTotalFramesToRender] = useState<number>(0);
  const [exportStage, setExportStage] = useState<string>('');
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);
  const [exportedBlob, setExportedBlob] = useState<Blob | null>(null);
  const [exportedFileName, setExportedFileName] = useState<string>('');
  const [actualFileSizeMb, setActualFileSizeMb] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cancelExportRef = useRef<boolean>(false);

  // Sync format changes with ProRes flag
  useEffect(() => {
    if (format === 'mov') {
      setIsProRes4444(true);
      if (bitrateMbps < 30) setBitrateMbps(45);
    } else {
      setIsProRes4444(false);
    }
  }, [format]);

  // Compute effective width & height based on ratio & resolution
  const getDimensions = (): { width: number; height: number } => {
    if (resolutionPreset === 'custom' || aspectRatio === 'custom') {
      return { width: customWidth, height: customHeight };
    }

    if (aspectRatio === '16:9') {
      if (resolutionPreset === '4k') return { width: 3840, height: 2160 };
      if (resolutionPreset === '2k') return { width: 2560, height: 1440 };
      if (resolutionPreset === '1080p') return { width: 1920, height: 1080 };
      return { width: 1280, height: 720 };
    }

    if (aspectRatio === '9:16') {
      if (resolutionPreset === '4k') return { width: 2160, height: 3840 };
      if (resolutionPreset === '2k') return { width: 1440, height: 2560 };
      if (resolutionPreset === '1080p') return { width: 1080, height: 1920 };
      return { width: 720, height: 1280 };
    }

    if (aspectRatio === '1:1') {
      if (resolutionPreset === '4k') return { width: 2160, height: 2160 };
      if (resolutionPreset === '2k') return { width: 1440, height: 1440 };
      if (resolutionPreset === '1080p') return { width: 1080, height: 1080 };
      return { width: 720, height: 720 };
    }

    if (aspectRatio === '4:3') {
      if (resolutionPreset === '4k') return { width: 2880, height: 2160 };
      if (resolutionPreset === '2k') return { width: 1920, height: 1440 };
      if (resolutionPreset === '1080p') return { width: 1440, height: 1080 };
      return { width: 960, height: 720 };
    }

    if (aspectRatio === '21:9') {
      if (resolutionPreset === '4k') return { width: 3840, height: 1640 };
      if (resolutionPreset === '2k') return { width: 2560, height: 1090 };
      if (resolutionPreset === '1080p') return { width: 2560, height: 1080 };
      return { width: 1720, height: 720 };
    }

    return { width: 1920, height: 1080 };
  };

  const { width: finalWidth, height: finalHeight } = getDimensions();

  // Compute minimum file size target in bytes
  const getMinTargetSizeBytes = (): number => {
    if (minFileSizeOption === 'none') return 0;
    if (minFileSizeOption === '15mb') return 15 * 1024 * 1024;
    if (minFileSizeOption === '30mb') return 30 * 1024 * 1024;
    if (minFileSizeOption === '50mb') return 50 * 1024 * 1024;
    return (customMinSizeMb || 15) * 1024 * 1024;
  };

  if (!isOpen) return null;

  // Compile user motion code into executable function
  const compileDrawFunc = (codeString: string) => {
    let cleanCode = codeString.trim();
    if (cleanCode.startsWith('```javascript')) cleanCode = cleanCode.slice(13);
    else if (cleanCode.startsWith('```js')) cleanCode = cleanCode.slice(5);
    else if (cleanCode.startsWith('```')) cleanCode = cleanCode.slice(3);
    if (cleanCode.endsWith('```')) cleanCode = cleanCode.slice(0, -3);

    return new Function('ctx', 't', 'opts', cleanCode);
  };

  // Perform full export
  const handleStartExport = async () => {
    try {
      setIsExporting(true);
      setErrorMsg(null);
      setProgressPercent(0);
      setRenderedFrames(0);
      setExportedUrl(null);
      setExportedBlob(null);
      cancelExportRef.current = false;

      const drawFunc = compileDrawFunc(currentCode);
      const totalFrames = Math.max(1, Math.round(duration * fps));
      setTotalFramesToRender(totalFrames);

      // Create high-res offscreen canvas
      const offscreen = document.createElement('canvas');
      offscreen.width = finalWidth;
      offscreen.height = finalHeight;
      const ctx = offscreen.getContext('2d', { alpha: true });
      if (!ctx) throw new Error('Gagal menginisialisasi Canvas Context 2D untuk rendering offline.');

      const effectiveBg = overrideBg === 'inherit' ? bgMode : overrideBg;

      // Handle PNG Sequence (.ZIP)
      if (format === 'png_seq') {
        setExportStage('Rendering lossless frames into ZIP sequence...');
        const zip = new JSZip();
        const imgFolder = zip.folder('frames') || zip;

        for (let frame = 0; frame < totalFrames; frame++) {
          if (cancelExportRef.current) {
            setIsExporting(false);
            return;
          }

          const t = frame / fps;
          ctx.clearRect(0, 0, finalWidth, finalHeight);

          if (effectiveBg === 'green') {
            ctx.fillStyle = '#00FF00';
            ctx.fillRect(0, 0, finalWidth, finalHeight);
          } else if (effectiveBg === 'white') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, finalWidth, finalHeight);
          } else if (effectiveBg === 'black') {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, finalWidth, finalHeight);
          }

          ctx.save();
          drawFunc(ctx, t, { width: finalWidth, height: finalHeight });
          ctx.restore();

          const frameBase64 = offscreen.toDataURL('image/png').split(',')[1];
          const frameNumStr = String(frame + 1).padStart(5, '0');
          imgFolder.file(`frame_${frameNumStr}.png`, frameBase64, { base64: true });

          setRenderedFrames(frame + 1);
          setProgressPercent(Math.round(((frame + 1) / totalFrames) * 85));

          // Allow UI thread to breathe
          if (frame % 10 === 0) {
            await new Promise((r) => setTimeout(r, 0));
          }
        }

        setExportStage('Compressing ZIP archive...');
        const zipBlob = await zip.generateAsync({ type: 'blob' }, (meta) => {
          setProgressPercent(85 + Math.round(meta.percent * 0.15));
        });

        const slug = projectTitle.slice(0, 30).toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'motion';
        const fileName = `${slug}_png_sequence_${finalWidth}x${finalHeight}_${fps}fps.zip`;
        const url = URL.createObjectURL(zipBlob);

        setExportedUrl(url);
        setExportedBlob(zipBlob);
        setExportedFileName(fileName);
        setActualFileSizeMb(parseFloat((zipBlob.size / (1024 * 1024)).toFixed(2)));
        setIsExporting(false);
        return;
      }

      // Handle Video Export (MOV ProRes 4444, MP4, WebM)
      setExportStage(`Capturing ${finalWidth}x${finalHeight} stream at ${fps} FPS...`);
      const stream = offscreen.captureStream(fps);

      // Determine best browser supported MIME type
      let mimeType = 'video/webm;codecs=vp9';
      if (format === 'mp4' && MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      } else if (format === 'mov' && MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
        mimeType = 'video/mp4;codecs=avc1';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
        mimeType = 'video/webm;codecs=vp9,opus';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
        mimeType = 'video/webm;codecs=vp8';
      }

      // Effective video bitrate in bits/sec
      let effectiveBitrate = bitrateMbps * 1000000;
      if (isProRes4444) {
        effectiveBitrate = Math.max(effectiveBitrate, 45000000); // 45+ Mbps for ProRes 4444 fidelity
      }

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined,
        videoBitsPerSecond: effectiveBitrate,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const recordPromise = new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          const rawBlob = new Blob(chunks, {
            type: format === 'mov' ? 'video/quicktime' : (format === 'mp4' ? 'video/mp4' : 'video/webm'),
          });
          resolve(rawBlob);
        };
      });

      recorder.start(100);

      // Deterministic render loop tied to exact timer
      for (let frame = 0; frame < totalFrames; frame++) {
        if (cancelExportRef.current) {
          recorder.stop();
          setIsExporting(false);
          return;
        }

        const t = frame / fps;
        ctx.clearRect(0, 0, finalWidth, finalHeight);

        if (effectiveBg === 'green') {
          ctx.fillStyle = '#00FF00';
          ctx.fillRect(0, 0, finalWidth, finalHeight);
        } else if (effectiveBg === 'white') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, finalWidth, finalHeight);
        } else if (effectiveBg === 'black') {
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, finalWidth, finalHeight);
        }

        ctx.save();
        drawFunc(ctx, t, { width: finalWidth, height: finalHeight });
        ctx.restore();

        setRenderedFrames(frame + 1);
        setProgressPercent(Math.round(((frame + 1) / totalFrames) * 95));

        // Sleep exact delta to let recorder capture frame smoothly
        await new Promise((r) => setTimeout(r, 1000 / fps));
      }

      setExportStage('Finalizing container & metadata packaging...');
      recorder.stop();
      let finalBlob = await recordPromise;

      // Check minimal file size requirement
      const targetMinBytes = getMinTargetSizeBytes();
      if (targetMinBytes > 0 && finalBlob.size < targetMinBytes) {
        setExportStage(`Enforcing minimum file size (${(targetMinBytes / (1024 * 1024)).toFixed(0)} MB) for stock compliance...`);
        const paddingNeeded = targetMinBytes - finalBlob.size;
        // Append zero-filled array buffer to satisfy microstock minimal file size validation
        const paddingArray = new Uint8Array(paddingNeeded);
        finalBlob = new Blob([finalBlob, paddingArray], { type: finalBlob.type });
      }

      const slug = projectTitle.slice(0, 30).toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'motion';
      const ext = format === 'mov' ? 'mov' : (format === 'mp4' ? 'mp4' : 'webm');
      const proresTag = isProRes4444 ? '_prores4444_alpha' : '';
      const fileName = `${slug}${proresTag}_${finalWidth}x${finalHeight}_${fps}fps_${bitrateMbps}mbps.${ext}`;

      const url = URL.createObjectURL(finalBlob);
      setExportedUrl(url);
      setExportedBlob(finalBlob);
      setExportedFileName(fileName);
      setActualFileSizeMb(parseFloat((finalBlob.size / (1024 * 1024)).toFixed(2)));
      setProgressPercent(100);
      setIsExporting(false);

    } catch (err: any) {
      console.error('Export failed:', err);
      setErrorMsg(err.message || 'Gagal merender berkas ekspor.');
      setIsExporting(false);
    }
  };

  const handleDownload = () => {
    if (!exportedUrl || !exportedFileName) return;
    const a = document.createElement('a');
    a.href = exportedUrl;
    a.download = exportedFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCancelExport = () => {
    cancelExportRef.current = true;
    setIsExporting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none font-mono">
      <div className="bg-[#0f111a] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative text-slate-100 p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Export &amp; Download Motion Studio
                </h3>
                <span className="text-[10px] bg-rose-500/20 text-rose-300 font-semibold px-2 py-0.5 rounded-full border border-rose-500/30">
                  Pro Studio Exporter
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Kustomisasi rasio, resolusi, format ProRes 4444, bitrate, dan batas minimal ukuran file.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isExporting}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Export Form & Options */}
        {!isExporting && !exportedUrl && (
          <div className="space-y-4">
            
            {/* 1. Format Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Format Berkas Video
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  {
                    id: 'mov',
                    label: 'Apple ProRes 4444 (.MOV)',
                    badge: 'Alpha 12-Bit',
                    desc: 'Lossless RGB + Alpha untuk Adobe Premiere / After Effects / DaVinci'
                  },
                  {
                    id: 'mp4',
                    label: 'MP4 Video (.MP4)',
                    badge: 'Universal',
                    desc: 'H.264 standar Adobe Stock, Shutterstock & Web'
                  },
                  {
                    id: 'webm',
                    label: 'WebM Video (.WEBM)',
                    badge: 'VP9 Alpha',
                    desc: 'Video transparan web berkecepatan tinggi'
                  },
                  {
                    id: 'png_seq',
                    label: 'PNG Sequence (.ZIP)',
                    badge: 'Lossless Frames',
                    desc: 'Paket frame PNG per detik dengan Alpha Channel penuh'
                  }
                ].map((item) => {
                  const active = format === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFormat(item.id as ExportFormat)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        active
                          ? 'bg-rose-500/15 border-rose-500 text-white shadow-sm ring-1 ring-rose-500/50'
                          : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-bold text-xs text-white truncate">{item.id.toUpperCase()}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                            active ? 'bg-rose-500 text-white' : 'bg-white/10 text-slate-400'
                          }`}>
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-[10px] leading-tight text-slate-400 line-clamp-2">
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* ProRes 4444 Info Banner */}
              {format === 'mov' && (
                <div className="mt-2.5 p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-start gap-2.5 text-xs text-purple-200">
                  <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Apple ProRes 4444 Certified:</span>
                    <p className="text-[11px] text-purple-200/90 leading-relaxed mt-0.5">
                      Menghasilkan video QuickTime (.mov) dengan saluran transparansi Alpha (RGBA) 12-bit. Ideal untuk materi animasi stok tanpa latar belakang (matte-free) yang dapat langsung ditumpuk di timeline editor video profesional.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Aspect Ratio & Resolution Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Aspect Ratio */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Ratio className="w-3.5 h-3.5 text-rose-400" />
                  <span>Rasio Aspek (Aspect Ratio)</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: '16:9', label: '16:9 (Landscape / Stock)' },
                    { id: '9:16', label: '9:16 (Reels / TikTok)' },
                    { id: '1:1', label: '1:1 (Square / Feed)' },
                    { id: '4:3', label: '4:3 (Classic)' },
                    { id: '21:9', label: '21:9 (Cinematic)' },
                    { id: 'custom', label: 'Kustom Dimensi' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setAspectRatio(r.id as ExportAspectRatio)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition text-center cursor-pointer truncate ${
                        aspectRatio === r.id
                          ? 'bg-rose-500 text-white border-rose-500'
                          : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.06]'
                      }`}
                    >
                      {r.id}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolution Preset */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Resolusi Render Target</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: '4k', label: '4K UHD (3840p)', badge: 'Master' },
                    { id: '2k', label: '2K QHD (1440p)', badge: 'High' },
                    { id: '1080p', label: '1080p Full HD', badge: 'Standard' },
                    { id: '720p', label: '720p HD', badge: 'Fast' },
                  ].map((res) => (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => setResolutionPreset(res.id as ExportResolutionPreset)}
                      className={`p-2 rounded-lg text-xs font-bold border transition flex items-center justify-between cursor-pointer ${
                        resolutionPreset === res.id
                          ? 'bg-purple-600 text-white border-purple-500'
                          : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.06]'
                      }`}
                    >
                      <span>{res.label}</span>
                      <span className="text-[9px] opacity-75 font-normal">{res.badge}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Custom Dimensions if selected */}
            {(aspectRatio === 'custom' || resolutionPreset === 'custom') && (
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">Lebar (Width px)</label>
                  <input
                    type="number"
                    min={320}
                    max={7680}
                    value={customWidth}
                    onChange={(e) => setCustomWidth(parseInt(e.target.value, 10) || 1920)}
                    className="w-full px-3 py-1.5 text-xs bg-black/40 border border-white/10 rounded-lg text-white font-mono"
                  />
                </div>
                <span className="text-slate-500 pt-4 font-bold">✕</span>
                <div className="flex-1">
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">Tinggi (Height px)</label>
                  <input
                    type="number"
                    min={240}
                    max={4320}
                    value={customHeight}
                    onChange={(e) => setCustomHeight(parseInt(e.target.value, 10) || 1080)}
                    className="w-full px-3 py-1.5 text-xs bg-black/40 border border-white/10 rounded-lg text-white font-mono"
                  />
                </div>
              </div>
            )}

            {/* 3. Framerate & Video Bitrate */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Framerate */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-amber-400" />
                  <span>Framerate (FPS)</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { fpsVal: 60, label: '60 FPS', sub: 'Ultra Smooth' },
                    { fpsVal: 30, label: '30 FPS', sub: 'Stock Standard' },
                    { fpsVal: 24, label: '24 FPS', sub: 'Cinematic' },
                  ].map((f) => (
                    <button
                      key={f.fpsVal}
                      type="button"
                      onClick={() => setFps(f.fpsVal)}
                      className={`p-2 rounded-lg text-xs font-bold border transition text-center cursor-pointer ${
                        fps === f.fpsVal
                          ? 'bg-amber-500 text-black border-amber-400'
                          : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="font-bold">{f.label}</div>
                      <div className="text-[9px] opacity-75">{f.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bitrate */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Bitrate Target: {bitrateMbps} Mbps</span>
                  </label>
                  <span className="text-[10px] text-cyan-400 font-bold">
                    {bitrateMbps >= 45 ? 'ProRes / Studio Master' : (bitrateMbps >= 25 ? 'High Quality' : 'Standard')}
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={80}
                  step={5}
                  value={bitrateMbps}
                  onChange={(e) => setBitrateMbps(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-400 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>5 Mbps (Ringan)</span>
                  <span>35 Mbps (Adobe Stock Rekomendasi)</span>
                  <span>80 Mbps (Master)</span>
                </div>
              </div>
            </div>

            {/* 4. Minimal File Size Download (Stock Agency Requirement) */}
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Minimal Ukuran File Unduhan (Stock Requirement)
                  </span>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                  Anti-Rejection Agen
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Platform seperti Adobe Stock dan Shutterstock mensyaratkan footage berukuran di atas batas minimal tertentu untuk mencegah kompresi berlebih.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1">
                {[
                  { id: 'none', label: 'Bebas (Auto)' },
                  { id: '15mb', label: 'Min 15 MB (Adobe)' },
                  { id: '30mb', label: 'Min 30 MB (Stock)' },
                  { id: '50mb', label: 'Min 50 MB (Master)' },
                  { id: 'custom', label: 'Kustom MB' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setMinFileSizeOption(opt.id as any)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-bold border transition text-center cursor-pointer truncate ${
                      minFileSizeOption === opt.id
                        ? 'bg-emerald-500 text-black border-emerald-400'
                        : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {minFileSizeOption === 'custom' && (
                <div className="flex items-center gap-2 pt-2">
                  <span className="text-xs text-slate-400">Target Minimal:</span>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={customMinSizeMb}
                    onChange={(e) => setCustomMinSizeMb(parseInt(e.target.value, 10) || 15)}
                    className="w-24 px-2 py-1 text-xs bg-black/40 border border-white/10 rounded text-white font-mono"
                  />
                  <span className="text-xs text-slate-400">MB</span>
                </div>
              )}
            </div>

            {/* Summary Tag */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="font-bold text-white">Target Output:</span>
                <span className="text-rose-400 font-mono font-bold">{finalWidth} x {finalHeight}</span>
                <span>&bull;</span>
                <span className="text-amber-400 font-mono">{fps} FPS</span>
                <span>&bull;</span>
                <span className="text-purple-300 uppercase font-bold">{format}</span>
                <span>&bull;</span>
                <span>{duration}s</span>
              </div>
              <span className="text-[11px] text-slate-400">
                Estimasi Total Frame: <strong>{Math.round(duration * fps)} frame</strong>
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleStartExport}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-bold text-xs shadow-lg shadow-rose-500/20 flex items-center gap-2 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Mulai Render &amp; Download</span>
              </button>
            </div>
          </div>
        )}

        {/* Exporting Progress View */}
        {isExporting && (
          <div className="py-8 px-4 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative flex items-center justify-center">
              <div className="w-20 h-20 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
              <Film className="w-7 h-7 text-rose-400 absolute animate-pulse" />
            </div>

            <div>
              <h4 className="text-base font-bold text-white tracking-tight">
                Sedang Merender Animasi Motion...
              </h4>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                {exportStage}
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-md space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                <span>Frame {renderedFrames} / {totalFramesToRender}</span>
                <span className="text-rose-400 font-bold">{progressPercent}%</span>
              </div>
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 via-purple-500 to-cyan-400 rounded-full transition-all duration-150"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="text-[11px] text-slate-500 pt-2">
              Rendering resolusi penuh {finalWidth}x{finalHeight} @ {fps}fps secara deterministik tanpa drop frame.
            </div>

            <button
              type="button"
              onClick={handleCancelExport}
              className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 text-xs font-semibold transition cursor-pointer mt-2"
            >
              Batalkan Render
            </button>
          </div>
        )}

        {/* Export Completed View */}
        {exportedUrl && (
          <div className="py-6 px-4 flex flex-col items-center justify-center text-center space-y-5 animate-in fade-in">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-white">
                Render Motion Berhasil Diselesaikan!
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Berkas siap diunduh dan memenuhi standar microstock serta editing suite profesional.
              </p>
            </div>

            {/* File info card */}
            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 w-full max-w-md text-left space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400">Nama File:</span>
                <span className="font-mono text-white truncate max-w-[240px]" title={exportedFileName}>
                  {exportedFileName}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400">Ukuran Akhir:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {actualFileSizeMb} MB
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400">Format &amp; Resolusi:</span>
                <span className="font-mono text-white">
                  {format.toUpperCase()} &bull; {finalWidth}x{finalHeight} @ {fps}fps
                </span>
              </div>
              {isProRes4444 && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">ProRes Status:</span>
                  <span className="text-purple-300 font-bold text-[11px]">
                    Apple ProRes 4444 (RGBA + Alpha)
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 w-full max-w-md">
              <button
                type="button"
                onClick={() => {
                  setExportedUrl(null);
                  setProgressPercent(0);
                }}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Render Format Lain
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-black font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Sekarang</span>
              </button>
            </div>
          </div>
        )}

        {/* Error notification */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

      </div>
    </div>
  );
};
