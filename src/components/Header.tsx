import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Copy, 
  CheckCircle2, 
  Play, 
  Key, 
  Terminal, 
  FileSpreadsheet,
  Sparkles,
  Layers,
  Wand2,
  Film,
  User,
  LogOut,
  Image as ImageIcon,
  Search,
  Bell,
  Menu,
  ChevronDown,
  LayoutDashboard,
  Sun,
  Moon,
  Archive,
} from 'lucide-react';
import { PlatformPreset, GeminiModelId, SubAppMode, UserProfile } from '../types';
import { ModelSelector } from './ModelSelector';
import { MetadataAvatar, ImageAvatar, MotionAvatar, ZipSmartAvatar } from './CartoonMascots';

interface HeaderProps {
  currentSubApp: SubAppMode;
  onSelectSubApp: (app: SubAppMode) => void;
  currentUser: UserProfile;
  onOpenAuthModal: () => void;
  platform: PlatformPreset;
  setPlatform: (p: PlatformPreset) => void;
  selectedModel: GeminiModelId;
  onSelectModel: (m: GeminiModelId) => void;
  totalCount: number;
  completedCount: number;
  onOpenExportModal: () => void;
  onCopyAll: () => void;
  isProcessing: boolean;
  onProcessAll: () => void;
  copiedAll: boolean;
  onOpenApiKeyModal: () => void;
  apiKeyCount: number;
  useCustomKeys: boolean;
  activeKeyLabel?: string;
  onToggleMobileSidebar?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSubApp,
  onSelectSubApp,
  currentUser,
  onOpenAuthModal,
  platform,
  setPlatform,
  selectedModel,
  onSelectModel,
  totalCount,
  completedCount,
  onOpenExportModal,
  onCopyAll,
  isProcessing,
  onProcessAll,
  copiedAll,
  onOpenApiKeyModal,
  apiKeyCount,
  useCustomKeys,
  onToggleMobileSidebar,
  theme = 'dark',
  onToggleTheme,
}) => {
  const isLight = theme === 'light';
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Keyboard shortcut Ctrl+K / Cmd+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const input = document.getElementById('creativehub-global-search');
        if (input) input.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const searchTools = [
    { title: 'Metadata Generator', sub: 'Adobe Stock Title & 49 Keywords', mode: 'metadata' as SubAppMode, icon: FileSpreadsheet, color: 'text-blue-500' },
    { title: 'Image Generator', sub: 'Batch Vector, 3D & Anime Art', mode: 'image' as SubAppMode, icon: ImageIcon, color: 'text-purple-500' },
    { title: 'Motion Studio', sub: 'ProRes 4444 MOV & 60 FPS Canvas', mode: 'motion' as SubAppMode, icon: Film, color: 'text-orange-500' },
    { title: 'ZIPsmart Archiver', sub: 'Microstock Flat Batch ZIP Packager', mode: 'zipsmart' as SubAppMode, icon: Archive, color: 'text-pink-500' },
    { title: 'Template & Preset', sub: 'Motion presets and stock style guides', mode: 'presets' as SubAppMode, icon: Layers, color: 'text-emerald-500' },
  ];

  const filteredTools = searchTools.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.sub.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-xl border-b select-none transition-colors duration-200 ${
      isLight
        ? 'bg-white/90 border-slate-200/90 text-slate-900 shadow-xs'
        : 'bg-[#0a0e1a]/90 border-white/[0.08] text-white'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[4rem] py-2 flex items-center justify-between gap-3 sm:gap-4">
        
        {/* Left: Mobile Hamburger & Search Bar matching Image 1 */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          {/* Mobile Sidebar Toggle Button */}
          <button
            onClick={onToggleMobileSidebar}
            className={`lg:hidden p-2 rounded-xl border shrink-0 ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border-white/10'
            }`}
            title="Buka Menu Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Global Search Bar (Matching Image 1) */}
          <div className="relative w-full max-w-md hidden sm:block">
            <div className="relative flex items-center">
              <Search className={`w-4 h-4 absolute left-3.5 pointer-events-none ${
                isLight ? 'text-slate-400' : 'text-slate-400'
              }`} />
              <input
                id="creativehub-global-search"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchDropdown(true);
                }}
                onFocus={() => setShowSearchDropdown(true)}
                onBlur={() => setTimeout(() => setShowSearchDropdown(false), 250)}
                placeholder="Search tools, templates, or inspiration..."
                className={`w-full rounded-2xl pl-10 pr-16 py-2 text-xs focus:outline-none transition-all shadow-inner border ${
                  isLight
                    ? 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white'
                    : 'bg-[#121524] border-white/[0.1] hover:border-white/[0.2] focus:border-indigo-500 text-white placeholder-slate-400'
                }`}
              />
              <div className={`absolute right-3 flex items-center gap-1 text-[10px] font-mono border px-1.5 py-0.5 rounded-lg pointer-events-none ${
                isLight ? 'bg-white text-slate-500 border-slate-200' : 'bg-white/[0.06] text-slate-400 border-white/10'
              }`}>
                <span>Ctrl</span>
                <span>K</span>
              </div>
            </div>

            {/* Search Autocomplete Dropdown */}
            {showSearchDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#101322] border border-white/15 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in space-y-1">
                <div className="px-3 py-1 text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  Quick Navigation Tools
                </div>
                {filteredTools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <button
                      key={tool.title}
                      onMouseDown={() => {
                        onSelectSubApp(tool.mode);
                        setShowSearchDropdown(false);
                      }}
                      className="w-full px-3 py-2 rounded-xl hover:bg-white/[0.08] flex items-center justify-between text-left transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${tool.color}`} />
                        <div>
                          <p className="text-xs font-bold text-white group-hover:text-indigo-300">
                            {tool.title}
                          </p>
                          <p className="text-[10px] text-slate-400">{tool.sub}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">&rarr;</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Tools & Notification & User Profile (Matching Image 1) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">

          {/* Active Cartoon App Profile Indicator Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] shadow-inner">
            {currentSubApp === 'metadata' && (
              <>
                <MetadataAvatar size={24} />
                <div className="leading-tight text-left">
                  <p className="text-[11px] font-bold text-white flex items-center gap-1">
                    <span>Metadata Specialist</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  </p>
                  <p className="text-[9px] text-blue-400 font-mono">Page 1 SEO Profile</p>
                </div>
              </>
            )}
            {currentSubApp === 'image' && (
              <>
                <ImageAvatar size={24} />
                <div className="leading-tight text-left">
                  <p className="text-[11px] font-bold text-white flex items-center gap-1">
                    <span>Digital AI Artist</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  </p>
                  <p className="text-[9px] text-purple-400 font-mono">Batch Vector & AI</p>
                </div>
              </>
            )}
            {currentSubApp === 'motion' && (
              <>
                <MotionAvatar size={24} />
                <div className="leading-tight text-left">
                  <p className="text-[11px] font-bold text-white flex items-center gap-1">
                    <span>Motion Director</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                  </p>
                  <p className="text-[9px] text-orange-400 font-mono">ProRes 4444 60FPS</p>
                </div>
              </>
            )}
            {currentSubApp === 'zipsmart' && (
              <>
                <ZipSmartAvatar size={24} />
                <div className="leading-tight text-left">
                  <p className="text-[11px] font-bold text-white flex items-center gap-1">
                    <span>ZIPsmart Archiver</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
                  </p>
                  <p className="text-[9px] text-pink-400 font-mono">Flat Master ZIP</p>
                </div>
              </>
            )}
            {currentSubApp === 'dashboard' && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-xs">✨</div>
                <div className="leading-tight text-left">
                  <p className="text-[11px] font-bold text-white">CreativeHub</p>
                  <p className="text-[9px] text-indigo-400 font-mono">Studio Suite</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Metadata Specific Actions (Run & CSV) if currently in Metadata mode */}
          {currentSubApp === 'metadata' && (
            <div className="flex items-center gap-2">
              {totalCount > 0 && completedCount < totalCount && (
                <button
                  onClick={onProcessAll}
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <Play className={`w-3.5 h-3.5 fill-current ${isProcessing ? 'animate-spin' : ''}`} />
                  <span className="hidden md:inline">{isProcessing ? 'Proses...' : `Run (${totalCount - completedCount})`}</span>
                </button>
              )}

              {completedCount > 0 && (
                <button
                  onClick={onOpenExportModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-400 hover:bg-amber-300 text-black shadow-md shadow-amber-400/20 transition-all cursor-pointer"
                  title="Export batch metadata CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">CSV ({completedCount})</span>
                </button>
              )}
            </div>
          )}

          {/* Gemini Model Selector Pill */}
          <div className="hidden xl:block">
            <ModelSelector
              selectedModel={selectedModel}
              onSelectModel={onSelectModel}
            />
          </div>

          {/* API Key Manager Button */}
          <button
            onClick={onOpenApiKeyModal}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              useCustomKeys && apiKeyCount > 0
                ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/30'
                : 'bg-white/[0.04] border-white/10 text-slate-300 hover:text-white hover:bg-white/[0.08]'
            }`}
            title="Kelola API Key Gemini & Auto-Rotation"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline text-slate-400">Keys:</span>
            <span className="text-white font-mono">
              {useCustomKeys && apiKeyCount > 0 ? `${apiKeyCount}` : 'System'}
            </span>
          </button>

          {/* Notification Bell with Red Dot (Matching Image 1) */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className={`relative p-2 rounded-xl transition cursor-pointer border ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-slate-300 hover:text-white'
              }`}
              title="Notifikasi"
            >
              <Bell className="w-4 h-4" />
              {/* Red Dot Badge */}
              <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ${
                isLight ? 'ring-white' : 'ring-[#0a0e1a]'
              }`} />
            </button>

            {notificationsOpen && (
              <div className={`absolute right-0 mt-2 w-72 rounded-2xl p-3 shadow-2xl z-50 animate-in fade-in space-y-2 border ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-800'
                  : 'bg-[#121524] border-white/15 text-slate-200'
              }`}>
                <div className={`flex items-center justify-between pb-2 border-b ${
                  isLight ? 'border-slate-100' : 'border-white/10'
                }`}>
                  <span className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Notifikasi Studio</span>
                  <span className="text-[10px] text-emerald-500 font-semibold">Semua Sistem Aktif</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
                    <p className="font-semibold text-[11px]">✨ Alur Image ke Motion Siap</p>
                    <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                      Generate gambar dan klik "Buat Motion" untuk otomatis mengisi referensi.
                    </p>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                    <p className="font-semibold text-[11px]">🛡️ Standar Adobe Stock Page 1</p>
                    <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                      Formula 15-25 kata &amp; 49 keyword 4-Tier siap dijalankan.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Theme Switcher Toggle (Light & Dark) */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className={`p-2 rounded-xl transition cursor-pointer border flex items-center justify-center ${
                isLight
                  ? 'bg-amber-100/70 border-amber-300 text-amber-800 hover:bg-amber-200'
                  : 'bg-white/[0.04] border-white/10 text-amber-300 hover:bg-white/[0.08]'
              }`}
              title={isLight ? 'Ganti ke Dark Mode' : 'Ganti ke Light Mode'}
            >
              {isLight ? <Moon className="w-4 h-4 text-indigo-600" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>
          )}

          {/* User Profile Avatar Dropdown (Matching Image 1) */}
          <div className="relative">
            <button
              onClick={onOpenAuthModal}
              className={`flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-2xl transition cursor-pointer border ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-900'
                  : 'bg-white/[0.05] hover:bg-white/[0.1] border-white/10 text-white'
              }`}
              title={currentUser.isLoggedIn ? currentUser.email : 'Login Google'}
            >
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-7 h-7 rounded-xl object-cover border border-indigo-500/50 shrink-0"
              />
              <span className={`text-xs font-bold hidden sm:inline truncate max-w-[90px] ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                {currentUser.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};
