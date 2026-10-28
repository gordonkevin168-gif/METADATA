/**
 * Fast client-side image downscaling for Gemini Vision.
 * Resizes large stock images (which are often 4000x3000, 5-15MB) to max 512px JPEG (~25-45KB).
 * Reduces Gemini upload payload size by ~98% and cuts network transmission latency dramatically.
 */
export async function optimizePreviewForVision(
  dataUrlOrBase64: string,
  maxDimension = 512,
  quality = 0.75
): Promise<{ base64: string; mimeType: string }> {
  if (!dataUrlOrBase64 || dataUrlOrBase64.length < 50) {
    return { base64: '', mimeType: 'image/jpeg' };
  }

  const src = dataUrlOrBase64.startsWith('data:')
    ? dataUrlOrBase64
    : `data:image/jpeg;base64,${dataUrlOrBase64}`;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      // If already small enough and is compact JPEG
      if (width <= maxDimension && height <= maxDimension && src.startsWith('data:image/jpeg') && src.length < 90000) {
        resolve({
          base64: src.replace(/^data:[a-zA-Z0-9\/+-]+;base64,/, ''),
          mimeType: 'image/jpeg',
        });
        return;
      }

      // Calculate scaled dimensions keeping aspect ratio
      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({
          base64: dataUrlOrBase64.replace(/^data:[a-zA-Z0-9\/+-]+;base64,/, ''),
          mimeType: 'image/jpeg',
        });
        return;
      }

      // Fill clean white background for PNG/SVG transparent pixels
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve({
        base64: jpegDataUrl.replace(/^data:image\/jpeg;base64,/, ''),
        mimeType: 'image/jpeg',
      });
    };

    img.onerror = () => {
      // Graceful fallback to raw input if image load fails
      resolve({
        base64: dataUrlOrBase64.replace(/^data:[a-zA-Z0-9\/+-]+;base64,/, ''),
        mimeType: 'image/jpeg',
      });
    };

    img.src = src;
  });
}
