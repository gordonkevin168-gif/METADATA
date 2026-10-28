import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  FileSpreadsheet, 
  FileText, 
  Layers,
  Archive,
  Loader2
} from 'lucide-react';
import { StockItem } from '../types';
import { 
  generateAdobeStockCsv, 
  generateShutterstockCsv, 
  generateUniversalCsv, 
  generateAllBridgeTextBlock,
  downloadCsvFile 
} from '../utils/csvExport';
import { downloadZipAllMetadata } from '../utils/metadataEmbedder';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: StockItem[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  items,
}) => {
  const [exportFormat, setExportFormat] = useState<'adobestock' | 'shutterstock' | 'universal' | 'bridge'>('adobestock');
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState<string>('');

  if (!isOpen) return null;

  const completedItems = items.filter((i) => i.status === 'completed' && i.title);

  const handleDownloadAllZip = async () => {
    const targetItems = completedItems.length > 0 ? completedItems : items;
    if (targetItems.length === 0) return;
    try {
      setIsZipping(true);
      await downloadZipAllMetadata(targetItems, (info) => setZipProgress(`${info.percent}%`));
    } catch (err) {
      console.error('Failed to create ZIP package:', err);
    } finally {
      setIsZipping(false);
      setZipProgress('');
    }
  };

  const getExportContent = () => {
    switch (exportFormat) {
      case 'adobestock':
        return generateAdobeStockCsv(completedItems);
      case 'shutterstock':
        return generateShutterstockCsv(completedItems);
      case 'universal':
        return generateUniversalCsv(completedItems);
      case 'bridge':
        return generateAllBridgeTextBlock(completedItems);
      default:
        return '';
    }
  };

  const handleDownload = () => {
    const content = getExportContent();
    const dateStr = new Date().toISOString().split('T')[0];
    const filenameMap = {
      adobestock: `c46u5_adobestock_metadata_${dateStr}.csv`,
      shutterstock: `c46u5_shutterstock_metadata_${dateStr}.csv`,
      universal: `c46u5_master_metadata_${dateStr}.csv`,
      bridge: `c46u5_bridge_iptc_${dateStr}.txt`,
    };

    if (exportFormat === 'bridge') {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filenameMap[exportFormat];
      link.click();
      URL.revokeObjectURL(url);
    } else {
      downloadCsvFile(content, filenameMap[exportFormat]);
    }
  };

  const handleCopyContent = () => {
    const content = getExportContent();
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentContent = getExportContent();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none font-mono">
      <div className="bg-[#12131c] border-2 border-[#2b2d3d] rounded-2xl w-full max-w-3xl overflow-hidden shadow-[8px_8px_0px_#000] flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b-2 border-[#212332] flex items-center justify-between bg-[#161824]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-black border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                C46u5 Studio &bull; Batch Export ({completedItems.length} Aset Selesai)
              </h3>
              <p className="text-xs text-slate-400">
                Format CSV resmi berstandar kurator Adobe Stock &amp; Shutterstock.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector Pills */}
        <div className="px-6 pt-4 pb-2 border-b-2 border-[#212332] bg-[#0d0e17]">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <button
              onClick={() => setExportFormat('adobestock')}
              className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                exportFormat === 'adobestock'
                  ? 'bg-amber-400 text-black border-2 border-black shadow-[2px_2px_0px_#000] font-bold'
                  : 'bg-[#151722] border-[#292c3f] text-slate-300 hover:bg-[#1e2030]'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5" /> Adobe Stock CSV
              </div>
              <p className={`text-[10px] mt-1 ${exportFormat === 'adobestock' ? 'text-black/80' : 'text-slate-400'}`}>
                Filename,Title,Keywords,Category ID
              </p>
            </button>

            <button
              onClick={() => setExportFormat('shutterstock')}
              className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                exportFormat === 'shutterstock'
                  ? 'bg-rose-500 text-white border-2 border-black shadow-[2px_2px_0px_#000] font-bold'
                  : 'bg-[#151722] border-[#292c3f] text-slate-300 hover:bg-[#1e2030]'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5" /> Shutterstock CSV
              </div>
              <p className={`text-[10px] mt-1 ${exportFormat === 'shutterstock' ? 'text-white/80' : 'text-slate-400'}`}>
                Filename,Description,Keywords,Categories
              </p>
            </button>

            <button
              onClick={() => setExportFormat('universal')}
              className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                exportFormat === 'universal'
                  ? 'bg-emerald-400 text-black border-2 border-black shadow-[2px_2px_0px_#000] font-bold'
                  : 'bg-[#151722] border-[#292c3f] text-slate-300 hover:bg-[#1e2030]'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Universal Master
              </div>
              <p className={`text-[10px] mt-1 ${exportFormat === 'universal' ? 'text-black/80' : 'text-slate-400'}`}>
                Lengkap Tier 1-4 breakdown
              </p>
            </button>

            <button
              onClick={() => setExportFormat('bridge')}
              className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                exportFormat === 'bridge'
                  ? 'bg-indigo-500 text-white border-2 border-black shadow-[2px_2px_0px_#000] font-bold'
                  : 'bg-[#151722] border-[#292c3f] text-slate-300 hover:bg-[#1e2030]'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Bridge / IPTC
              </div>
              <p className={`text-[10px] mt-1 ${exportFormat === 'bridge' ? 'text-white/80' : 'text-slate-400'}`}>
                Format blok teks terstruktur
              </p>
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-[#0d0e17]">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Pratinjau Output:</span>
            <span className="text-emerald-400 font-bold">{currentContent.split('\n').length} baris data</span>
          </div>

          <pre className="p-4 rounded-xl bg-[#07080e] border-2 border-[#222436] text-slate-300 text-[11px] font-mono overflow-x-auto whitespace-pre leading-relaxed max-h-72 select-text">
            {currentContent || 'Tidak ada data file selesai untuk diekspor.'}
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t-2 border-[#212332] flex items-center justify-between bg-[#161824]">
          <span className="text-xs text-slate-400">
            {completedItems.length === 0 ? (
              <span className="text-amber-400">Belum ada file yang selesai dianalisis.</span>
            ) : (
              <span>Siap diunggah langsung ke portal kontributor.</span>
            )}
          </span>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              onClick={handleDownloadAllZip}
              disabled={completedItems.length === 0 || isZipping}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black border-2 border-black font-black text-xs shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center gap-1.5 disabled:opacity-40 transition-all cursor-pointer"
              title="Unduh seluruh aset (Metadata Embedded ke file) + Sidecar .XMP + CSV Adobe Stock & Shutterstock"
            >
              {isZipping ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                  <span>{zipProgress || 'Membuat ZIP...'}</span>
                </>
              ) : (
                <>
                  <Archive className="w-3.5 h-3.5 text-black" />
                  <span>Unduh ZIP All File (Embedded + CSV)</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopyContent}
              disabled={completedItems.length === 0}
              className="px-4 py-2 rounded-lg bg-[#1e2030] hover:bg-[#282b40] text-slate-200 border-2 border-black text-xs font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-40 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Teks</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              disabled={completedItems.length === 0}
              className="px-5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black border-2 border-black font-black text-xs shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center gap-1.5 disabled:opacity-40 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
