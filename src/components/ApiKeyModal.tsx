import React, { useState, useRef } from 'react';
import { 
  Key, 
  Upload, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  FileText, 
  ShieldCheck, 
  X,
  Sparkles,
  Zap,
  Server
} from 'lucide-react';
import { ApiKeyConfig, ApiKeyItem } from '../types';
import { smartValidateKey } from '../services/geminiClient';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ApiKeyConfig;
  onChangeConfig: (newConfig: ApiKeyConfig) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
}) => {
  const [singleKeyInput, setSingleKeyInput] = useState('');
  const [singleKeyLabel, setSingleKeyLabel] = useState('');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleAddSingleKey = async () => {
    const rawKey = singleKeyInput.trim();
    if (!rawKey) {
      showToast('error', 'Masukkan API Key terlebih dahulu.');
      return;
    }

    if (rawKey.length < 8) {
      showToast('error', 'Format API Key terlalu pendek atau tidak valid.');
      return;
    }

    // Check duplicate
    if (config.keys.some((k) => k.key === rawKey)) {
      showToast('error', 'API Key ini sudah ada di dalam daftar.');
      return;
    }

    const newKeyItem: ApiKeyItem = {
      id: `key-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      key: rawKey,
      label: singleKeyLabel.trim() || `Key #${config.keys.length + 1}`,
      status: 'ready',
      usageCount: 0,
    };

    const updatedKeys = [...config.keys, newKeyItem];
    const newActiveId = config.activeKeyId || newKeyItem.id;

    onChangeConfig({
      ...config,
      keys: updatedKeys,
      activeKeyId: newActiveId,
      useCustomKeys: true,
    });

    setSingleKeyInput('');
    setSingleKeyLabel('');
    showToast('success', `Berhasil menambahkan API Key: ${newKeyItem.label}`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.txt')) {
      showToast('error', 'Harap unggah file teks (.txt) yang berisi 1 API key per baris.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        showToast('error', 'File .txt kosong.');
        return;
      }

      const lines = text.split(/\r?\n/);
      const importedKeys: ApiKeyItem[] = [];
      const existingKeySet = new Set(config.keys.map((k) => k.key));
      let duplicateCount = 0;
      let invalidCount = 0;

      lines.forEach((rawLine, idx) => {
        let line = rawLine.trim();
        // Remove comments if any
        if (line.startsWith('#') || line.startsWith('//')) return;
        if (!line) return;

        // Strip trailing comments
        if (line.includes(' ')) {
          const parts = line.split(/\s+/);
          line = parts[0];
        }

        if (line.length < 10) {
          invalidCount++;
          return;
        }

        if (existingKeySet.has(line)) {
          duplicateCount++;
          return;
        }

        existingKeySet.add(line);
        importedKeys.push({
          id: `key-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
          key: line,
          label: `Imported Key #${config.keys.length + importedKeys.length + 1}`,
          status: 'ready',
          usageCount: 0,
        });
      });

      if (importedKeys.length === 0) {
        showToast(
          'error',
          duplicateCount > 0
            ? `${duplicateCount} API Key dalam file sudah ada di daftar.`
            : 'Tidak ditemukan API Key valid di dalam file .txt.'
        );
        return;
      }

      const updatedKeys = [...config.keys, ...importedKeys];
      const newActiveId = config.activeKeyId || importedKeys[0].id;

      onChangeConfig({
        ...config,
        keys: updatedKeys,
        activeKeyId: newActiveId,
        useCustomKeys: true,
      });

      showToast(
        'success',
        `Sukses mengimpor ${importedKeys.length} API Key dari ${file.name}${
          duplicateCount > 0 ? ` (${duplicateCount} duplikat dilewati)` : ''
        }`
      );
    };

    reader.onerror = () => {
      showToast('error', 'Gagal membaca file .txt');
    };

    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleTestKey = async (item: ApiKeyItem) => {
    setTestingKeyId(item.id);
    try {
      const res = await smartValidateKey(item.key);

      if (res.valid) {
        const updated = config.keys.map((k) =>
          k.id === item.id ? { ...k, status: 'ready' as const, errorMsg: undefined } : k
        );
        onChangeConfig({ ...config, keys: updated });
        showToast('success', `API Key "${item.label}" valid dan siap digunakan!`);
      } else if (res.isQuota) {
        const updated = config.keys.map((k) =>
          k.id === item.id ? { ...k, status: 'exhausted' as const, errorMsg: 'Quota habis (429)' } : k
        );
        onChangeConfig({ ...config, keys: updated });
        showToast('error', `API Key "${item.label}" telah melampaui quota (429).`);
      } else {
        const updated = config.keys.map((k) =>
          k.id === item.id ? { ...k, status: 'invalid' as const, errorMsg: res.message || 'Invalid key' } : k
        );
        onChangeConfig({ ...config, keys: updated });
        showToast('error', `API Key tidak valid: ${res.message}`);
      }
    } catch (err: any) {
      showToast('error', `Gagal menguji key: ${err.message}`);
    } finally {
      setTestingKeyId(null);
    }
  };

  const handleDeleteKey = (id: string) => {
    const updatedKeys = config.keys.filter((k) => k.id !== id);
    let newActiveId = config.activeKeyId;
    if (newActiveId === id) {
      newActiveId = updatedKeys.length > 0 ? updatedKeys[0].id : null;
    }
    onChangeConfig({
      ...config,
      keys: updatedKeys,
      activeKeyId: newActiveId,
      useCustomKeys: updatedKeys.length > 0 && config.useCustomKeys,
    });
    showToast('info', 'API Key dihapus.');
  };

  const handleClearAll = () => {
    onChangeConfig({
      ...config,
      keys: [],
      activeKeyId: null,
      useCustomKeys: false,
    });
    showToast('info', 'Semua API Key dibersihkan. Kembali menggunakan Server Default Key.');
  };

  const toggleShowKey = (id: string) => {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const maskKey = (key: string, show: boolean) => {
    if (show) return key;
    if (key.length <= 10) return '••••••••••';
    return `${key.substring(0, 6)}••••••••${key.substring(key.length - 4)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 font-mono select-none">
      <div className="bg-[#12131c] border-2 border-[#2b2d3d] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[8px_8px_0px_#000] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b-2 border-[#212332] flex items-center justify-between bg-[#161824]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_#000]">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">C46u5 Studio &bull; Key Manager</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                  AUTO-ROTATION
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Input langsung atau upload file <code>.txt</code> (1 key per baris) untuk auto-failover saat quota limit.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notification Banner */}
        {notification && (
          <div
            className={`px-4 py-2.5 text-xs flex items-center gap-2 border-b transition-all ${
              notification.type === 'success'
                ? 'bg-emerald-950/70 border-emerald-800/60 text-emerald-300'
                : notification.type === 'error'
                ? 'bg-rose-950/70 border-rose-800/60 text-rose-300'
                : 'bg-indigo-950/70 border-indigo-800/60 text-indigo-300'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : notification.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            ) : (
              <Zap className="w-4 h-4 shrink-0 text-indigo-400" />
            )}
            <span className="flex-1">{notification.message}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Active Mode Selector */}
          <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Server className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <span className="font-semibold text-slate-200 block text-xs">Mode Sumber API Key:</span>
                <span className="text-[11px] text-slate-400">
                  {config.useCustomKeys && config.keys.length > 0
                    ? `Menggunakan Pool Custom (${config.keys.length} Key terdaftar)`
                    : 'Menggunakan Server Default API Key (Bawaan Sistem)'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onChangeConfig({ ...config, useCustomKeys: false })}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  !config.useCustomKeys
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Server Default
              </button>
              <button
                onClick={() => {
                  if (config.keys.length === 0) {
                    showToast('info', 'Silakan tambahkan atau upload API Key terlebih dahulu.');
                  }
                  onChangeConfig({ ...config, useCustomKeys: true });
                }}
                disabled={config.keys.length === 0}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer disabled:opacity-40 ${
                  config.useCustomKeys && config.keys.length > 0
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Custom Pool ({config.keys.length})
              </button>
            </div>
          </div>

          {/* Upload and Manual Input Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Input Manual */}
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-slate-200 font-semibold">
                <Plus className="w-4 h-4 text-indigo-400" />
                <span>Input API Key Manual</span>
              </div>

              <div className="space-y-2">
                <input
                  type="password"
                  value={singleKeyInput}
                  onChange={(e) => setSingleKeyInput(e.target.value)}
                  placeholder="Paste Gemini API Key (AIzaSy...)"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={singleKeyLabel}
                    onChange={(e) => setSingleKeyLabel(e.target.value)}
                    placeholder="Label/Nama Key (opsional)"
                    className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-[11px]"
                  />
                  <button
                    onClick={handleAddSingleKey}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-sm shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Upload .txt */}
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-2 text-slate-200 font-semibold">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Upload File .txt (1 Key / Baris)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Upload file teks berekstensi <code>.txt</code> berisi daftar API Key Gemini (satu baris untuk setiap key). Sistem otomatis mengabaikan spasi dan komentar.
                </p>
              </div>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,text/plain"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 rounded-lg border border-dashed border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Pilih File .txt dari Komputer</span>
                </button>
              </div>
            </div>
          </div>

          {/* Key Pool List & Rotation Settings */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-white uppercase tracking-wider text-xs">
                  Daftar API Key Pool ({config.keys.length})
                </h4>
                {config.useCustomKeys && (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                    Aktif Digunakan
                  </span>
                )}
              </div>

              {config.keys.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Semua</span>
                </button>
              )}
            </div>

            {/* Auto-Rotation Setting Checkbox */}
            {config.keys.length > 1 && (
              <div className="bg-indigo-950/40 border border-indigo-900/50 p-3 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <RefreshCw className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-200 block text-xs">
                      Otomatis Rotasi Key saat Quota Terlampaui (HTTP 429)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Jika salah satu key terkena limit, sistem langsung otomatis berpindah ke key berikutnya tanpa menghentikan proses batch.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.autoRotate}
                  onChange={(e) => onChangeConfig({ ...config, autoRotate: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700 cursor-pointer"
                />
              </div>
            )}

            {/* Keys Table / List */}
            {config.keys.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-2">
                <Key className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-slate-400 font-medium">Belum ada custom API key yang dimasukkan.</p>
                <p className="text-slate-500 text-[11px]">
                  Aplikasi saat ini menggunakan server environment key bawaan. Anda dapat menambahkan key Anda sendiri untuk kapasitas tanpa batas.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {config.keys.map((item, idx) => {
                  const isActive = config.activeKeyId === item.id;
                  const isTesting = testingKeyId === item.id;
                  const isVisible = !!showKeys[item.id];

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isActive
                          ? 'bg-indigo-950/40 border-indigo-600/60 ring-1 ring-indigo-500/40'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Left: Radio & Info */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <input
                          type="radio"
                          name="active-api-key"
                          checked={isActive}
                          onChange={() =>
                            onChangeConfig({
                              ...config,
                              activeKeyId: item.id,
                              useCustomKeys: true,
                            })
                          }
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700 cursor-pointer"
                          title="Setel sebagai Key Aktif"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-200 truncate text-xs">
                              {item.label}
                            </span>
                            {/* Status Pill */}
                            {item.status === 'ready' ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                Ready
                              </span>
                            ) : item.status === 'exhausted' ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                Quota Habis (429)
                              </span>
                            ) : item.status === 'invalid' ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                Invalid
                              </span>
                            ) : null}

                            {isActive && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                                Active Key
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-[11px] text-slate-400 font-mono">
                              {maskKey(item.key, isVisible)}
                            </code>
                            <button
                              onClick={() => toggleShowKey(item.id)}
                              className="text-slate-500 hover:text-slate-300"
                              title={isVisible ? 'Sembunyikan' : 'Tampilkan'}
                            >
                              {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                            {item.usageCount > 0 && (
                              <span className="text-[10px] text-slate-500">
                                ({item.usageCount} requests)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleTestKey(item)}
                          disabled={isTesting}
                          className="px-2.5 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                          title="Uji konektivitas key ini ke Gemini API"
                        >
                          <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                          <span>{isTesting ? 'Testing...' : 'Test'}</span>
                        </button>

                        <button
                          onClick={() => handleDeleteKey(item.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Key"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>API Key disimpan aman di browser lokal Anda (localStorage)</span>
          </span>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors cursor-pointer shadow-md"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
