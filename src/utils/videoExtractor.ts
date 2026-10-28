import { VideoMetadata, VideoFrameSample } from '../types';

export interface ExtractedVideoData {
  previewUrl: string; // Primary frame (typically middle/action peak frame)
  imageBase64: string; // Clean base64 of primary frame
  videoUrl: string; // Object URL for video playback
  videoMeta: VideoMetadata;
  frames: VideoFrameSample[]; // Exactly 3 temporal frames (Awal, Tengah, Akhir)
}

/**
 * Calculates human readable resolution label from dimensions
 */
export function getResolutionLabel(width: number, height: number): string {
  const maxDim = Math.max(width, height);
  const minDim = Math.min(height, width);

  if (maxDim >= 3800 || minDim >= 2100) return '4K UHD';
  if (maxDim >= 2500 || minDim >= 1400) return '2.5K QHD';
  if (maxDim >= 1900 || minDim >= 1000) return '1080p Full HD';
  if (maxDim >= 1200 || minDim >= 700) return '720p HD';
  return 'SD';
}

/**
 * Calculates aspect ratio string
 */
export function getAspectRatio(width: number, height: number): string {
  if (!width || !height) return '16:9';
  const ratio = width / height;

  if (Math.abs(ratio - 16 / 9) < 0.08) return '16:9 Landscape';
  if (Math.abs(ratio - 9 / 16) < 0.08) return '9:16 Vertical';
  if (Math.abs(ratio - 1) < 0.05) return '1:1 Square';
  if (Math.abs(ratio - 4 / 3) < 0.08) return '4:3 Standard';
  if (Math.abs(ratio - 21 / 9) < 0.1) return '21:9 Cinema Wide';
  if (ratio > 1) return `${ratio.toFixed(2)}:1 Wide`;
  return `1:${(1 / ratio).toFixed(2)} Tall`;
}

/**
 * Helper to render the current frame of a video element to canvas and return base64
 */
function renderFrameFromVideo(
  video: HTMLVideoElement,
  maxCanvasDim: number = 1600
): { previewUrl: string; imageBase64: string } {
  const width = video.videoWidth || 1920;
  const height = video.videoHeight || 1080;

  let canvasWidth = width;
  let canvasHeight = height;

  if (canvasWidth > maxCanvasDim || canvasHeight > maxCanvasDim) {
    if (canvasWidth > canvasHeight) {
      canvasHeight = Math.round((canvasHeight * maxCanvasDim) / canvasWidth);
      canvasWidth = maxCanvasDim;
    } else {
      canvasWidth = Math.round((canvasWidth * maxCanvasDim) / canvasHeight);
      canvasHeight = maxCanvasDim;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  ctx.drawImage(video, 0, 0, canvasWidth, canvasHeight);
  const previewUrl = canvas.toDataURL('image/jpeg', 0.9);
  const imageBase64 = previewUrl.replace(/^data:image\/[a-zA-Z]+;base64,/, '');

  return { previewUrl, imageBase64 };
}

/**
 * Extract 3 temporal frames (Awal ~15%, Tengah ~50%, Akhir ~85%) and metadata from a video File
 */
export async function extractVideoData(file: File): Promise<ExtractedVideoData> {
  const videoUrl = URL.createObjectURL(file);
  const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    let resolved = false;

    // Timeout safety
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        reject(new Error(`Ekstraksi video 3-frame timed out untuk file: ${file.name}`));
      }
    }, 20000);

    video.onloadedmetadata = async () => {
      try {
        const duration = video.duration || 1;
        const width = video.videoWidth || 1920;
        const height = video.videoHeight || 1080;

        // Calculate 3 representative temporal timestamps
        let t1 = 0.5;
        let t2 = duration * 0.5;
        let t3 = Math.max(0.8, duration - 0.5);

        if (duration > 2) {
          t1 = Math.max(0.4, Math.round(duration * 0.15 * 10) / 10);
          t2 = Math.round(duration * 0.5 * 10) / 10;
          t3 = Math.min(duration - 0.3, Math.round(duration * 0.85 * 10) / 10);
        } else if (duration > 0.5) {
          t1 = duration * 0.15;
          t2 = duration * 0.5;
          t3 = duration * 0.85;
        }

        const seekPoints = [
          { time: t1, percent: 15, label: 'Frame Awal (15%)' },
          { time: t2, percent: 50, label: 'Frame Tengah (50%)' },
          { time: t3, percent: 85, label: 'Frame Akhir (85%)' },
        ];

        const capturedFrames: VideoFrameSample[] = [];

        // Sequentially seek and capture each frame
        for (const point of seekPoints) {
          const frameData = await new Promise<VideoFrameSample>((resSeek, rejSeek) => {
            const onSeeked = () => {
              video.removeEventListener('seeked', onSeeked);
              try {
                const rendered = renderFrameFromVideo(video, 1600);
                resSeek({
                  timestamp: Math.round(video.currentTime * 10) / 10,
                  percent: point.percent,
                  label: point.label,
                  previewUrl: rendered.previewUrl,
                  imageBase64: rendered.imageBase64,
                });
              } catch (e) {
                rejSeek(e);
              }
            };

            video.addEventListener('seeked', onSeeked);
            video.currentTime = Math.min(point.time, Math.max(0, duration - 0.1));
          });

          capturedFrames.push(frameData);
        }

        // Primary frame is middle frame (capturedFrames[1]), or first if unavailable
        const primaryFrame = capturedFrames[1] || capturedFrames[0];

        const videoMeta: VideoMetadata = {
          duration: Math.round(duration * 10) / 10,
          width,
          height,
          resolutionLabel: getResolutionLabel(width, height),
          aspectRatio: getAspectRatio(width, height),
          format: ext,
          extractedFrameTimestamp: primaryFrame.timestamp,
          frames: capturedFrames,
        };

        resolved = true;
        clearTimeout(timeout);
        resolve({
          previewUrl: primaryFrame.previewUrl,
          imageBase64: primaryFrame.imageBase64,
          videoUrl,
          videoMeta,
          frames: capturedFrames,
        });
      } catch (err) {
        resolved = true;
        clearTimeout(timeout);
        reject(err);
      }
    };

    video.onerror = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        reject(new Error(`Gagal memuat file video: ${file.name}`));
      }
    };

    video.src = videoUrl;
  });
}

/**
 * Capture frame from an already mounted video element at current playback time
 */
export function captureFrameFromVideoElement(
  videoEl: HTMLVideoElement
): { previewUrl: string; imageBase64: string; timestamp: number } {
  const rendered = renderFrameFromVideo(videoEl, 1600);
  return {
    previewUrl: rendered.previewUrl,
    imageBase64: rendered.imageBase64,
    timestamp: Math.round(videoEl.currentTime * 10) / 10,
  };
}
