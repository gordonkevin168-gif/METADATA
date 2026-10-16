import { VideoMetadata } from '../types';

export interface ExtractedVideoData {
  previewUrl: string; // PNG Data URL of the extracted frame
  imageBase64: string; // Clean base64 without data URI header
  videoUrl: string; // Blob or Object URL for playback
  videoMeta: VideoMetadata;
}

/**
 * Calculates human readable resolution label from dimensions
 */
export function getResolutionLabel(width: number, height: number): string {
  const maxDim = Math.max(width, height);
  const minDim = Math.min(width, height);

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
  if (Math.abs(ratio - 9 / 16) < 0.08) return '9:16 Vertical (Reels/TikTok)';
  if (Math.abs(ratio - 1) < 0.05) return '1:1 Square';
  if (Math.abs(ratio - 4 / 3) < 0.08) return '4:3 Standard';
  if (Math.abs(ratio - 21 / 9) < 0.1) return '21:9 UltraWide Cinema';
  if (ratio > 1) return `${ratio.toFixed(2)}:1 Wide`;
  return `1:${(1 / ratio).toFixed(2)} Tall`;
}

/**
 * Extract frame and metadata from a video File
 */
export async function extractVideoData(file: File, seekTime?: number): Promise<ExtractedVideoData> {
  const videoUrl = URL.createObjectURL(file);
  const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    let resolved = false;

    // Timeout safety
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        reject(new Error(`Video metadata extraction timed out for ${file.name}`));
      }
    }, 15000);

    video.onloadedmetadata = () => {
      const duration = video.duration || 0;
      const width = video.videoWidth || 1920;
      const height = video.videoHeight || 1080;
      const targetTime = seekTime !== undefined ? seekTime : Math.min(1.2, duration > 2 ? duration * 0.2 : 0.5);

      video.currentTime = targetTime;
    };

    video.onseeked = () => {
      if (resolved) return;
      try {
        const width = video.videoWidth || 1920;
        const height = video.videoHeight || 1080;
        const duration = video.duration || 0;

        // Render frame to canvas (cap max dimension at 1920 for optimal Gemini Vision performance & fast upload)
        let canvasWidth = width;
        let canvasHeight = height;
        const maxCanvasDim = 1920;

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
          throw new Error('Could not get canvas 2d context for video frame');
        }

        ctx.drawImage(video, 0, 0, canvasWidth, canvasHeight);
        const previewUrl = canvas.toDataURL('image/jpeg', 0.92);
        const imageBase64 = previewUrl.replace(/^data:image\/[a-zA-Z]+;base64,/, '');

        const videoMeta: VideoMetadata = {
          duration: Math.round(duration * 10) / 10,
          width,
          height,
          resolutionLabel: getResolutionLabel(width, height),
          aspectRatio: getAspectRatio(width, height),
          format: ext,
          extractedFrameTimestamp: Math.round(video.currentTime * 10) / 10,
        };

        resolved = true;
        clearTimeout(timeout);
        resolve({
          previewUrl,
          imageBase64,
          videoUrl,
          videoMeta,
        });
      } catch (err) {
        resolved = true;
        clearTimeout(timeout);
        reject(err);
      }
    };

    video.onerror = (e) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        reject(new Error(`Failed to load video: ${file.name}`));
      }
    };

    video.src = videoUrl;
  });
}

/**
 * Capture frame from an already mounted video element at current playback time
 */
export function captureFrameFromVideoElement(videoEl: HTMLVideoElement): { previewUrl: string; imageBase64: string; timestamp: number } {
  const width = videoEl.videoWidth || 1920;
  const height = videoEl.videoHeight || 1080;

  let canvasWidth = width;
  let canvasHeight = height;
  const maxCanvasDim = 1920;

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
  if (!ctx) throw new Error('Could not get canvas context');

  ctx.drawImage(videoEl, 0, 0, canvasWidth, canvasHeight);
  const previewUrl = canvas.toDataURL('image/jpeg', 0.92);
  const imageBase64 = previewUrl.replace(/^data:image\/[a-zA-Z]+;base64,/, '');

  return {
    previewUrl,
    imageBase64,
    timestamp: Math.round(videoEl.currentTime * 10) / 10,
  };
}
