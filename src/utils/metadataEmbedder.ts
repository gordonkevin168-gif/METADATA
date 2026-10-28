import JSZip from 'jszip';
import { StockItem } from '../types';
import {
  generateAdobeStockCsv,
  generateShutterstockCsv,
  generateUniversalCsv,
  generateAllBridgeTextBlock,
} from './csvExport';

/**
 * Generates an Adobe XMP Sidecar XML packet for an asset
 * Dublin Core standard (dc:title, dc:description, dc:subject)
 * Photoshop category & Adobe Stock compatibility
 */
export function generateXmpPacket(item: StockItem): string {
  const escapeXml = (str: string) =>
    (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const title = escapeXml(item.title || '');
  const category = escapeXml(item.category || 'Graphic Resources');
  const keywords = (item.allKeywords || []).map((k) => escapeXml(k.trim())).filter(Boolean);

  return `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Adobe XMP Core 7.0-c000 1.000000, 2022/01/01-00:00:00        ">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"
    xmlns:xmp="http://ns.adobe.com/xap/1.0/"
    xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/"
    xmlns:Iptc4xmpCore="http://iptc.org/std/Iptc4xmpCore/1.0/xmlns/">
   <dc:format>${escapeXml(item.mimeType || 'image/jpeg')}</dc:format>
   <dc:title>
    <rdf:Alt>
     <rdf:li xml:lang="x-default">${title}</rdf:li>
    </rdf:Alt>
   </dc:title>
   <dc:description>
    <rdf:Alt>
     <rdf:li xml:lang="x-default">${title}</rdf:li>
    </rdf:Alt>
   </dc:description>
   <dc:subject>
    <rdf:Bag>
${keywords.map((kw) => `     <rdf:li>${kw}</rdf:li>`).join('\n')}
    </rdf:Bag>
   </dc:subject>
   <photoshop:Category>${category}</photoshop:Category>
   <photoshop:Headline>${title}</photoshop:Headline>
   <photoshop:Credit>Stock Contributor</photoshop:Credit>
   <xmpRights:Marked>True</xmpRights:Marked>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}

/**
 * Injects an XMP APP1 packet into a JPEG ArrayBuffer
 */
export function injectXmpIntoJpeg(buffer: ArrayBuffer, xmpString: string): ArrayBuffer {
  const bytes = new Uint8Array(buffer);
  // Check SOI marker 0xFF, 0xD8
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return buffer; // Not a valid JPEG
  }

  const xmpHeader = 'http://ns.adobe.com/xap/1.0/\0';
  const encoder = new TextEncoder();
  const xmpBytes = encoder.encode(xmpString);
  const headerBytes = encoder.encode(xmpHeader);

  const payloadLength = headerBytes.length + xmpBytes.length;
  // Marker length includes 2 bytes of length itself
  const markerLength = payloadLength + 2;

  // JPEG APP1 segment: 0xFF, 0xE1, [Len High], [Len Low], headerBytes..., xmpBytes...
  const app1Segment = new Uint8Array(2 + 2 + payloadLength);
  app1Segment[0] = 0xff;
  app1Segment[1] = 0xe1;
  app1Segment[2] = (markerLength >> 8) & 0xff;
  app1Segment[3] = markerLength & 0xff;
  app1Segment.set(headerBytes, 4);
  app1Segment.set(xmpBytes, 4 + headerBytes.length);

  // Find insertion point right after SOI (index 2) or after JFIF/EXIF APP0/APP1
  let insertPos = 2;
  let offset = 2;

  while (offset < bytes.length - 1) {
    if (bytes[offset] === 0xff) {
      const marker = bytes[offset + 1];
      // If APP0 (JFIF) or APP1 (Exif), we can insert after it
      if (marker === 0xe0 || marker === 0xe1) {
        const segLen = (bytes[offset + 2] << 8) | bytes[offset + 3];
        // Check if existing segment is already XMP
        let isExistingXmp = false;
        if (marker === 0xe1 && segLen > 30) {
          const segHeader = new TextDecoder().decode(bytes.slice(offset + 4, offset + 4 + 28));
          if (segHeader.startsWith('http://ns.adobe.com/xap/1.0/')) {
            isExistingXmp = true;
          }
        }

        if (isExistingXmp) {
          // Replace existing XMP
          const newTotal = bytes.length - (2 + segLen) + app1Segment.length;
          const out = new Uint8Array(newTotal);
          out.set(bytes.subarray(0, offset), 0);
          out.set(app1Segment, offset);
          out.set(bytes.subarray(offset + 2 + segLen), offset + app1Segment.length);
          return out.buffer;
        }

        offset += 2 + segLen;
        insertPos = offset;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  // Prepend APP1 segment at insertPos
  const newBuffer = new Uint8Array(bytes.length + app1Segment.length);
  newBuffer.set(bytes.subarray(0, insertPos), 0);
  newBuffer.set(app1Segment, insertPos);
  newBuffer.set(bytes.subarray(insertPos), insertPos + app1Segment.length);

  return newBuffer.buffer;
}

/**
 * Calculates CRC32 for PNG chunks
 */
function crc32(buf: Uint8Array): number {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[n] = c;
}

/**
 * Injects XMP as an iTXt chunk into a PNG ArrayBuffer
 */
export function injectXmpIntoPng(buffer: ArrayBuffer, xmpString: string): ArrayBuffer {
  const bytes = new Uint8Array(buffer);
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  const pngSig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < 8; i++) {
    if (bytes[i] !== pngSig[i]) return buffer; // Not PNG
  }

  // Build iTXt chunk: Keyword: "XML:com.adobe.xmp\0", compressionFlag: 0, compMethod: 0, lang: "\0", transKey: "\0", text: xmpString
  const keyword = 'XML:com.adobe.xmp';
  const encoder = new TextEncoder();
  const kwBytes = encoder.encode(keyword);
  const textBytes = encoder.encode(xmpString);

  // Keyword (null-terminated) + 0 + 0 + null + null + text
  const chunkDataLen = kwBytes.length + 1 + 1 + 1 + 1 + 1 + textBytes.length;
  const chunkData = new Uint8Array(chunkDataLen);
  let p = 0;
  chunkData.set(kwBytes, p);
  p += kwBytes.length;
  chunkData[p++] = 0; // null separator
  chunkData[p++] = 0; // uncompressed
  chunkData[p++] = 0; // compression method
  chunkData[p++] = 0; // language tag (empty null)
  chunkData[p++] = 0; // translated keyword (empty null)
  chunkData.set(textBytes, p);

  // Type: 'iTXt'
  const typeBytes = encoder.encode('iTXt');
  const crcPayload = new Uint8Array(4 + chunkDataLen);
  crcPayload.set(typeBytes, 0);
  crcPayload.set(chunkData, 4);
  const crcVal = crc32(crcPayload);

  const fullChunk = new Uint8Array(4 + 4 + chunkDataLen + 4);
  fullChunk[0] = (chunkDataLen >> 24) & 0xff;
  fullChunk[1] = (chunkDataLen >> 16) & 0xff;
  fullChunk[2] = (chunkDataLen >> 8) & 0xff;
  fullChunk[3] = chunkDataLen & 0xff;
  fullChunk.set(typeBytes, 4);
  fullChunk.set(chunkData, 8);
  const crcPos = 8 + chunkDataLen;
  fullChunk[crcPos] = (crcVal >> 24) & 0xff;
  fullChunk[crcPos + 1] = (crcVal >> 16) & 0xff;
  fullChunk[crcPos + 2] = (crcVal >> 8) & 0xff;
  fullChunk[crcPos + 3] = crcVal & 0xff;

  // Insert before IEND
  let iendPos = bytes.length - 12;
  for (let i = 8; i < bytes.length - 8; i++) {
    if (
      bytes[i] === 0x49 &&
      bytes[i + 1] === 0x45 &&
      bytes[i + 2] === 0x4e &&
      bytes[i + 3] === 0x44
    ) {
      iendPos = i - 4; // chunk length begins 4 bytes before IEND
      break;
    }
  }

  const out = new Uint8Array(bytes.length + fullChunk.length);
  out.set(bytes.subarray(0, iendPos), 0);
  out.set(fullChunk, iendPos);
  out.set(bytes.subarray(iendPos), iendPos + fullChunk.length);

  return out.buffer;
}

/**
 * Embeds metadata natively into a Blob/File
 */
export async function embedMetadataInAsset(
  fileOrBlob: Blob,
  item: StockItem
): Promise<Blob> {
  const xmp = generateXmpPacket(item);
  const arrayBuffer = await fileOrBlob.arrayBuffer();
  const lowerName = item.fileName.toLowerCase();

  if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || fileOrBlob.type === 'image/jpeg') {
    const injected = injectXmpIntoJpeg(arrayBuffer, xmp);
    return new Blob([injected], { type: 'image/jpeg' });
  }

  if (lowerName.endsWith('.png') || fileOrBlob.type === 'image/png') {
    const injected = injectXmpIntoPng(arrayBuffer, xmp);
    return new Blob([injected], { type: 'image/png' });
  }

  // For other formats (SVG, AI, EPS, MOV), return original blob (we will provide .xmp sidecar alongside)
  return fileOrBlob;
}

/**
 * Converts a base64 Data URL to a Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

export interface ZipProgressCallback {
  (progress: { percent: number; currentFileName: string; status: string }): void;
}

/**
 * Generates and downloads a complete ZIP package containing:
 * 1. All assets with metadata embedded (JPG/PNG embedded, others with .xmp sidecars)
 * 2. .xmp sidecar files for every asset (Adobe Bridge/Lightroom standard)
 * 3. adobe_stock_metadata.csv (Official template for CSV/FTP upload)
 * 4. shutterstock_metadata.csv
 * 5. universal_metadata_master.csv
 * 6. metadata_summary.txt
 */
export async function downloadZipAllMetadata(
  items: StockItem[],
  onProgress?: ZipProgressCallback
): Promise<void> {
  const completedItems = items.filter((i) => i.status === 'completed' && i.title);
  if (completedItems.length === 0) {
    throw new Error('Tidak ada item yang telah selesai diproses metadata-nya.');
  }

  const zip = new JSZip();

  // 1. Add CSV & Text Manifests
  onProgress?.({
    percent: 5,
    currentFileName: 'adobe_stock_metadata.csv',
    status: 'Membuat file CSV & Sidecar...',
  });

  const adobeCsv = generateAdobeStockCsv(completedItems);
  zip.file('adobe_stock_metadata.csv', adobeCsv);

  const shutterstockCsv = generateShutterstockCsv(completedItems);
  zip.file('shutterstock_metadata.csv', shutterstockCsv);

  const universalCsv = generateUniversalCsv(completedItems);
  zip.file('universal_metadata_master.csv', universalCsv);

  const summaryText = generateAllBridgeTextBlock(completedItems);
  zip.file('metadata_summary.txt', summaryText);

  // Folder for assets with embedded metadata
  const assetsFolder = zip.folder('embedded_assets');
  const sidecarsFolder = zip.folder('xmp_sidecars');

  const total = completedItems.length;

  for (let idx = 0; idx < total; idx++) {
    const item = completedItems[idx];
    const baseName = item.fileName.replace(/\.[^/.]+$/, '');
    const percent = Math.round(10 + ((idx + 1) / total) * 75);

    onProgress?.({
      percent,
      currentFileName: item.fileName,
      status: `Meng-embed metadata ke ${item.fileName} (${idx + 1}/${total})...`,
    });

    // Generate XMP sidecar XML
    const xmpPacket = generateXmpPacket(item);
    sidecarsFolder?.file(`${baseName}.xmp`, xmpPacket);

    // Prepare asset Blob
    let sourceBlob: Blob | null = null;
    if (item.file) {
      sourceBlob = item.file;
    } else if (item.previewUrl && item.previewUrl.startsWith('data:')) {
      sourceBlob = dataUrlToBlob(item.previewUrl);
    } else if (item.imageBase64 && item.imageBase64.length > 50) {
      const dataUri = item.imageBase64.startsWith('data:')
        ? item.imageBase64
        : `data:${item.mimeType || 'image/jpeg'};base64,${item.imageBase64}`;
      sourceBlob = dataUrlToBlob(dataUri);
    }

    if (sourceBlob) {
      try {
        const embeddedBlob = await embedMetadataInAsset(sourceBlob, item);
        const arrayBuf = await embeddedBlob.arrayBuffer();
        assetsFolder?.file(item.fileName, arrayBuf);
      } catch (err) {
        console.warn(`Could not embed metadata into ${item.fileName}:`, err);
        // Fallback: store raw blob
        const rawBuf = await sourceBlob.arrayBuffer();
        assetsFolder?.file(item.fileName, rawBuf);
      }
    }
  }

  onProgress?.({
    percent: 90,
    currentFileName: 'Kompresi Arsip ZIP...',
    status: 'Mengompresi seluruh paket metadata...',
  });

  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      onProgress?.({
        percent: Math.min(99, Math.round(90 + metadata.percent * 0.1)),
        currentFileName: 'Menyelesaikan file ZIP...',
        status: 'Finalisasi arsip ZIP...',
      });
    }
  );

  // Trigger browser download
  const dateStr = new Date().toISOString().slice(0, 10);
  const zipFileName = `Stock_Metadata_Package_${dateStr}.zip`;
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipFileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  onProgress?.({
    percent: 100,
    currentFileName: zipFileName,
    status: 'Pengunduhan ZIP berhasil dimulai!',
  });
}
