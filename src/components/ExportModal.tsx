import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  FileSpreadsheet, 
  FileText, 
  Layers,
  Sparkles 
} from 'lucide-react';
import { StockItem } from '../types';
import { 
  generateAdobeStockCsv, 
  generateShutterstockCsv, 
  generateUniversalCsv, 
  generateAllBridgeTextBlock,
  downloadCsvFile 
} from '../utils/csvExport';

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

  if (!isOpen) return null;

  const completedItems = items.filter((i) => i.status === 'completed' && i.title);

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
      adobestock: `adobe_stock_metadata_${dateStr}.csv`,
      shutterstock: `shutterstock_metadata_${dateStr}.csv`,
      universal: `stockmeta_master_metadata_${dateStr}.csv`,
      bridge: `bridge_iptc_metadata_${dateStr}.txt`,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Export Microstock Metadata ({completedItems.length} Files Ready)
              </h3>
              <p className="text-xs text-slate-400">
                Pilih format yang sesuai dengan platform upload kontributor Anda.
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
        <div className="px-6 pt-4 pb-2 border-b border-slate-800/60 bg-slate-850">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <button
              onClick={() => setExportFormat('adobestock')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                exportFormat === 'adobestock'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5 text-indigo-300">
                <FileSpreadsheet className="w-3.5 h-3.5" /> Adobe Stock Official CSV
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Filename,Title,Keywords,Category ID,Releases</p>
            </button>

            <button
              onClick={() => setExportFormat('shutterstock')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                exportFormat === 'shutterstock'
                  ? 'bg-red-600/20 border-red-500 text-white shadow-sm'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5 text-rose-300">
                <FileSpreadsheet className="w-3.5 h-3.5" /> Shutterstock CSV
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Filename,Description,Keywords,Categories,Editorial,Mature content,illustration</p>
            </button>

            <button
              onClick={() => setExportFormat('universal')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                exportFormat === 'universal'
                  ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-sm'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5 text-emerald-300">
                <Layers className="w-3.5 h-3.5" /> Universal Master CSV
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Lengkap dengan Tier 1-4 breakdown</p>
            </button>

            <button
              onClick={() => setExportFormat('bridge')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                exportFormat === 'bridge'
                  ? 'bg-purple-600/20 border-purple-500 text-white shadow-sm'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5 text-purple-300">
                <FileText className="w-3.5 h-3.5" /> Adobe Bridge / IPTC
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Format blok teks terstruktur</p>
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Pratinjau Output:</span>
            <span>{currentContent.split('\n').length} baris data</span>
          </div>

          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-[11px] font-mono overflow-x-auto whitespace-pre leading-relaxed max-h-72">
            {currentContent || 'Tidak ada data file selesai untuk diekspor.'}
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-850">
          <span className="text-xs text-slate-400">
            {completedItems.length === 0 ? (
              <span className="text-amber-400">Belum ada file yang selesai dianalisis.</span>
            ) : (
              <span>Siap untuk diunduh dan diimpor langsung ke panel kontributor.</span>
            )}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyContent}
              disabled={completedItems.length === 0}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Text</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              disabled={completedItems.length === 0}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 flex items-center gap-1.5 disabled:opacity-40 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
