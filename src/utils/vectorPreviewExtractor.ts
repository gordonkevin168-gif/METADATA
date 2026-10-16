import * as pdfjsLib from 'pdfjs-dist';
import UTIF from 'utif';

// Configure pdfjs worker using CDN fallback or dynamic import
try {
  if (pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  }
} catch (e) {
  console.warn('PDF.js worker initialization warning:', e);
}

/**
 * Decode a TIFF ArrayBuffer into a clean PNG Data URL using UTIF
 * Preserves strict proportional aspect ratio
 */
export function decodeTiffToDataUrl(tiffBuffer: ArrayBuffer): string | null {
  try {
    const utifLib = (UTIF as any).default || UTIF;
    const ifds = utifLib.decode(tiffBuffer);
    if (!ifds || ifds.length === 0) return null;

    utifLib.decodeImage(tiffBuffer, ifds[0]);
    const rgba = utifLib.toRGBA8(ifds[0]);
    if (!rgba || rgba.length === 0) return null;

    const width = ifds[0].width;
    const height = ifds[0].height;
    if (!width || !height) return null;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const imgData = ctx.createImageData(width, height);
    imgData.data.set(rgba);
    ctx.putImageData(imgData, 0, 0);

    return canvas.toDataURL('image/png');
  } catch (err) {
    console.warn('Failed to decode TIFF preview:', err);
    return null;
  }
}

/**
 * Method 1: Extract TIFF preview from DOS EPS binary header (0xC5D0D3C6)
 * Adobe Illustrator EPS 10 writes this header when exported with TIFF preview.
 */
export function extractDosEpsTiff(buffer: ArrayBuffer): string | null {
  try {
    if (buffer.byteLength < 32) return null;
    const bytes = new Uint8Array(buffer);

    // Check magic bytes 0xC5 0xD0 0xD3 0xC6 (big-endian or little-endian)
    const isMagicBE = bytes[0] === 0xc5 && bytes[1] === 0xd0 && bytes[2] === 0xd3 && bytes[3] === 0xc6;
    const isMagicLE = bytes[0] === 0xc6 && bytes[1] === 0xd3 && bytes[2] === 0xd0 && bytes[3] === 0xc5;

    if (isMagicBE || isMagicLE) {
      const view = new DataView(buffer);
      // In DOS EPS header, TIFF start position is at offset 20 (little-endian uint32), length at offset 24
      const tiffOffset = view.getUint32(20, true);
      const tiffLength = view.getUint32(24, true);

      if (tiffOffset > 0 && tiffLength > 0 && tiffOffset + tiffLength <= buffer.byteLength) {
        const tiffSlice = buffer.slice(tiffOffset, tiffOffset + tiffLength);
        const dataUrl = decodeTiffToDataUrl(tiffSlice);
        if (dataUrl) return dataUrl;
      }
    }
  } catch (err) {
    console.warn('DOS EPS header check failed:', err);
  }
  return null;
}

/**
 * Method 2: Extract embedded preview from PostScript ASCII EPS
 * Looks for embedded hex TIFF or bitmap stream
 */
export function extractPostscriptAsciiPreview(buffer: ArrayBuffer): string | null {
  try {
    const decoder = new TextDecoder('latin1');
    const slice = new Uint8Array(buffer.slice(0, Math.min(buffer.byteLength, 2 * 1024 * 1024)));
    const text = decoder.decode(slice);

    // Look for %%BeginPreview or %BeginPreview
    const previewMatch = text.match(/%%?BeginPreview:\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)([\s\S]*?)%%?EndPreview/i);
    if (previewMatch && previewMatch[5]) {
      const rawHexLines = previewMatch[5];
      // Strip comments '%' and whitespace
      const hex = rawHexLines.replace(/%[^\r\n]*/g, '').replace(/[\s\r\n]+/g, '');

      if (hex.length > 200) {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < bytes.length; i++) {
          bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
        }

        // Check if hex data starts with TIFF magic ('II*\0' or 'MM\0*')
        if (
          (bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2a) ||
          (bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[3] === 0x2a)
        ) {
          const tiffUrl = decodeTiffToDataUrl(bytes.buffer);
          if (tiffUrl) return tiffUrl;
        }

        const w = parseInt(previewMatch[1], 10);
        const h = parseInt(previewMatch[2], 10);
        const depth = parseInt(previewMatch[3], 10);
        if (w > 0 && h > 0) {
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const imgData = ctx.createImageData(w, h);
            if (depth === 8) {
              for (let i = 0; i < w * h && i < bytes.length; i++) {
                const val = bytes[i];
                const p = i * 4;
                imgData.data[p] = val;
                imgData.data[p + 1] = val;
                imgData.data[p + 2] = val;
                imgData.data[p + 3] = 255;
              }
              ctx.putImageData(imgData, 0, 0);
              return canvas.toDataURL('image/png');
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('ASCII EPS preview extraction failed:', err);
  }
  return null;
}

/**
 * Method 3: Extract XMP embedded JPEG thumbnail
 * Adobe Illustrator and EPS files embed a JPEG thumbnail in XMP metadata.
 * CRITICAL: In EPS files, XMP lines are prefixed with PostScript comment '%' characters!
 * We strip all '%', whitespace, and newlines so the base64 is completely valid.
 */
export async function extractXmpThumbnail(file: File): Promise<string | null> {
  try {
    const buffer = await file.arrayBuffer();
    const decoder = new TextDecoder('latin1');
    const text = decoder.decode(new Uint8Array(buffer));

    // Match <xmpGImg:image>, <xapGImg:image>, <xmpG:image>, or <thumbnail:image>
    const match = text.match(/<(?:xmpGImg|xapGImg|xmpG|photoshop|thumbnail):image[^>]*>([\s\S]*?)<\/(?:xmpGImg|xapGImg|xmpG|photoshop|thumbnail):image>/i);
    if (match && match[1]) {
      // Strip ALL whitespace AND PostScript comment '%' characters
      const cleanBase64 = match[1].replace(/[\r\n\s%]+/g, '');
      if (cleanBase64.length > 64) {
        return `data:image/jpeg;base64,${cleanBase64}`;
      }
    }

    // Secondary scan: check for <?xpacket begin ... </xpacket> and find raw base64 block
    const xpacketIdx = text.indexOf('<?xpacket begin');
    if (xpacketIdx !== -1) {
      const xpacketEnd = text.indexOf('<?xpacket end', xpacketIdx);
      if (xpacketEnd !== -1) {
        const xmpBlock = text.substring(xpacketIdx, xpacketEnd);
        const subMatch = xmpBlock.match(/image>([A-Za-z0-9+/=%\r\n\s]{100,})</);
        if (subMatch && subMatch[1]) {
          const cleanBase64 = subMatch[1].replace(/[\r\n\s%]+/g, '');
          if (cleanBase64.length > 64) {
            return `data:image/jpeg;base64,${cleanBase64}`;
          }
        }
      }
    }
  } catch (err) {
    console.warn('XMP thumbnail extraction failed:', err);
  }
  return null;
}

/**
 * Method 4: Extract embedded JPEG streams from EPS or PostScript binary
 */
export async function extractEmbeddedJpeg(file: File): Promise<string | null> {
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    let start = -1;
    for (let i = 0; i < bytes.length - 3; i++) {
      if (bytes[i] === 0xff && bytes[i + 1] === 0xd8 && bytes[i + 2] === 0xff) {
        start = i;
        break;
      }
    }

    if (start === -1) return null;

    let end = -1;
    for (let i = start + 4; i < bytes.length - 1; i++) {
      if (bytes[i] === 0xff && bytes[i + 1] === 0xd9) {
        end = i + 2;
        break;
      }
    }

    if (end > start && end - start > 512) {
      const jpegSlice = bytes.subarray(start, end);
      const blob = new Blob([jpegSlice], { type: 'image/jpeg' });
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string) || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(blob);
      });
    }
  } catch (err) {
    console.warn('Embedded JPEG search failed:', err);
  }
  return null;
}

/**
 * Method 5: PDF rendering via PDF.js for Adobe Illustrator (.ai) files
 * Renders the Illustrator artboard with strict proportional fidelity, preserving
 * the exact aspect ratio (e.g., 16:9, 1:1, 4:3, or vertical banner) without cropping!
 */
export async function renderPdfAiToCanvas(file: File): Promise<string | null> {
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Find '%PDF-' marker
    let pdfStart = -1;
    const marker = [0x25, 0x50, 0x44, 0x46, 0x2d]; // '%PDF-'
    for (let i = 0; i < Math.min(bytes.length - 5, 200000); i++) {
      if (
        bytes[i] === marker[0] &&
        bytes[i + 1] === marker[1] &&
        bytes[i + 2] === marker[2] &&
        bytes[i + 3] === marker[3] &&
        bytes[i + 4] === marker[4]
      ) {
        pdfStart = i;
        break;
      }
    }

    if (pdfStart === -1) return null;

    const pdfData = pdfStart === 0 ? bytes : bytes.subarray(pdfStart);

    const loadingTask = pdfjsLib.getDocument({
      data: pdfData,
      useSystemFonts: true,
      disableFontFace: true,
    });

    const pdfDoc = await loadingTask.promise;
    if (pdfDoc.numPages < 1) return null;

    const page = await pdfDoc.getPage(1);
    const defaultViewport = page.getViewport({ scale: 1 });

    if (defaultViewport.width <= 0 || defaultViewport.height <= 0) return null;

    // Scale proportionally preserving exact artboard aspect ratio
    const maxDimension = 1400;
    const scale = Math.min(
      maxDimension / defaultViewport.width,
      maxDimension / defaultViewport.height,
      2.0
    );
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Fill white background for vector transparency
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      canvas: canvas,
      viewport: viewport,
    } as any).promise;

    // Directly return the proportional canvas without destructive cropping!
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.warn('PDF.js render failed for .ai file:', err);
    return null;
  }
}

/**
 * Method 6: Server-side Vector Rendering via Ghostscript
 * Renders ANY EPS and AI file into a razor-sharp, strictly proportional PNG.
 * Handles pure PostScript paths, EPS 8, EPS 10, CC, and PDF-based AI files!
 */
export async function renderVectorViaServer(file: File): Promise<{
  previewUrl: string | null;
  imageBase64: string | null;
  source: 'gs_ai_render' | 'gs_eps_render' | 'none';
}> {
  try {
    const buffer = await file.arrayBuffer();
    // Convert arrayBuffer to base64 safely in chunks
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    const chunkSize = 0x8000;
    for (let i = 0; i < len; i += chunkSize) {
      binary += String.fromCharCode.apply(
        null,
        bytes.subarray(i, Math.min(i + chunkSize, len)) as any
      );
    }
    const fileBase64 = btoa(binary);

    const response = await fetch('/api/render-vector', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileBase64,
        fileName: file.name,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.previewUrl && data.imageBase64) {
        return {
          previewUrl: data.previewUrl,
          imageBase64: data.imageBase64,
          source: data.source || (file.name.toLowerCase().endsWith('.ai') ? 'gs_ai_render' : 'gs_eps_render'),
        };
      }
    }
  } catch (err) {
    console.warn('Server vector rendering failed:', err);
  }
  return { previewUrl: null, imageBase64: null, source: 'none' };
}

/**
 * Master preview extractor for AI and EPS vector files:
 * 1. For EPS files:
 *    - Primary: Call server Ghostscript engine (/api/render-vector), which parses EPS BoundingBox
 *      and renders vector paths with 100% precision and proportional aspect ratio!
 *    - Secondary fallback: DOS EPS TIFF header (UTIF.js)
 *    - Tertiary fallback: XMP thumbnail (<xmpGImg:image> with '%' comments stripped)
 *    - Quaternary fallback: PostScript ASCII preview / embedded JPEG
 * 2. For AI files:
 *    - Primary: PDF.js proportional artboard rendering in browser
 *    - Secondary fallback: Server Ghostscript engine (/api/render-vector) with -dUseCropBox
 *    - Tertiary fallback: XMP metadata thumbnail
 */
export async function extractVectorPreview(file: File): Promise<{
  previewUrl: string | null;
  imageBase64: string | null;
  source:
    | 'gs_eps_render'
    | 'gs_ai_render'
    | 'dos_eps_tiff'
    | 'ps_preview'
    | 'pdf_render'
    | 'xmp_thumbnail'
    | 'embedded_jpeg'
    | 'none';
}> {
  const fileName = file.name.toLowerCase();
  const isAi = fileName.endsWith('.ai');
  const isEps = fileName.endsWith('.eps');

  if (!isAi && !isEps) {
    return { previewUrl: null, imageBase64: null, source: 'none' };
  }

  // Handle EPS files
  if (isEps) {
    // 1. Try server Ghostscript vector rendering first (most reliable & handles all vector EPS)
    const serverResult = await renderVectorViaServer(file);
    if (serverResult.previewUrl && serverResult.imageBase64) {
      return {
        previewUrl: serverResult.previewUrl,
        imageBase64: serverResult.imageBase64,
        source: 'gs_eps_render',
      };
    }

    const buffer = await file.arrayBuffer();

    // 2. Try DOS EPS binary header TIFF
    const dosTiff = extractDosEpsTiff(buffer);
    if (dosTiff && dosTiff.startsWith('data:image/')) {
      const clean = dosTiff.replace(/^data:[a-zA-Z0-9\/+-]+;base64,/, '');
      return { previewUrl: dosTiff, imageBase64: clean, source: 'dos_eps_tiff' };
    }

    // 3. Try XMP thumbnail (with '%' comments cleaned)
    const xmpThumb = await extractXmpThumbnail(file);
    if (xmpThumb && xmpThumb.startsWith('data:image/')) {
      const clean = xmpThumb.replace(/^data:[a-zA-Z0-9\/+-]+;base64,/, '');
      return { previewUrl: xmpThumb, imageBase64: clean, source: 'xmp_thumbnail' };
    }

    // 4. Try PostScript ASCII preview
    const psPreview = extractPostscriptAsciiPreview(buffer);
    if (psPreview && psPreview.startsWith('data:image/')) {
      const clean = psPreview.replace(/^data:[a-zA-Z0-9\/+-]+;base64,/, '');
      return { previewUrl: psPreview, imageBase64: clean, source: 'ps_preview' };
    }

    // 5. Try embedded JPEG
    const embeddedJpeg = await extractEmbeddedJpeg(file);
    if (embeddedJpeg && embeddedJpeg.startsWith('data:image/')) {
      const clean = embeddedJpeg.replace(/^data:[a-zA-Z0-9\/+-]+;base64,/, '');
      return { previewUrl: embeddedJpeg, imageBase64: clean, source: 'embedded_jpeg' };
    }
  }

  // Handle AI files
  if (isAi) {
    // 1. Try PDF.js proportional artboard render in browser
    const renderedPng = await renderPdfAiToCanvas(file);
    if (renderedPng && renderedPng.startsWith('data:image/')) {
      const clean = renderedPng.replace(/^data:[a-zA-Z0-9\/+-]+;base64,/, '');
      return { previewUrl: renderedPng, imageBase64: clean, source: 'pdf_render' };
    }

    // 2. Try server Ghostscript vector rendering with -dUseCropBox
    const serverResult = await renderVectorViaServer(file);
    if (serverResult.previewUrl && serverResult.imageBase64) {
      return {
        previewUrl: serverResult.previewUrl,
        imageBase64: serverResult.imageBase64,
        source: 'gs_ai_render',
      };
    }

    // 3. Try XMP thumbnail extraction
    const xmpThumb = await extractXmpThumbnail(file);
    if (xmpThumb && xmpThumb.startsWith('data:image/')) {
      const clean = xmpThumb.replace(/^data:[a-zA-Z0-9\/+-]+;base64,/, '');
      return { previewUrl: xmpThumb, imageBase64: clean, source: 'xmp_thumbnail' };
    }
  }

  return { previewUrl: null, imageBase64: null, source: 'none' };
}
