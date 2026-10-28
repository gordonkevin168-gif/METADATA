import React from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Image as ImageIcon,
  Film,
  Layers,
  History,
  FolderArchive,
  Heart,
  Crown,
  ChevronRight,
  Sparkles,
  X,
  Archive,
} from 'lucide-react';
import { SubAppMode, UserProfile } from '../types';
import { MetadataAvatar, ImageAvatar, MotionAvatar, ZipSmartAvatar } from './CartoonMascots';

interface SidebarProps {
  currentSubApp: SubAppMode;
  onSelectSubApp: (mode: SubAppMode) => void;
  currentUser: UserProfile;
  onOpenAuthModal: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  theme?: 'dark' | 'light';
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSubApp,
  onSelectSubApp,
  currentUser,
  onOpenAuthModal,
  isOpenMobile = false,
  onCloseMobile,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const mainNavItems = [
    {
      id: 'dashboard' as SubAppMode,
      label: 'Dashboard',
      icon: LayoutDashboard,
      color: 'text-indigo-400',
      activeBg: 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30',
    },
    {
      id: 'metadata' as SubAppMode,
      label: 'Metadata Generator',
      icon: FileSpreadsheet,
      avatar: MetadataAvatar,
      badge: 'Page 1',
      color: 'text-blue-400',
      activeBg: 'bg-blue-600 text-white shadow-lg shadow-blue-600/30',
    },
    {
      id: 'image' as SubAppMode,
      label: 'Image Generator',
      icon: ImageIcon,
      avatar: ImageAvatar,
      badge: 'AI',
      color: 'text-purple-400',
      activeBg: 'bg-purple-600 text-white shadow-lg shadow-purple-600/30',
    },
    {
      id: 'motion' as SubAppMode,
      label: 'Motion Studio',
      icon: Film,
      avatar: MotionAvatar,
      badge: 'ProRes',
      color: 'text-orange-400',
      activeBg: 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30',
    },
    {
      id: 'zipsmart' as SubAppMode,
      label: 'ZIPsmart Archiver',
      icon: Archive,
      avatar: ZipSmartAvatar,
      badge: 'Batch',
      color: 'text-pink-400',
      activeBg: 'bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-600 text-white shadow-lg shadow-pink-600/30',
    },
  ];

  const secondaryNavItems = [
    {
      id: 'presets' as SubAppMode,
      label: 'Template & Preset',
      icon: Layers,
    },
    {
      id: 'history' as SubAppMode,
      label: 'History',
      icon: History,
    },
    {
      id: 'files' as SubAppMode,
      label: 'My Files',
      icon: FolderArchive,
    },
    {
      id: 'favorites' as SubAppMode,
      label: 'Favorites',
      icon: Heart,
    },
  ];

  const handleItemClick = (id: SubAppMode) => {
    onSelectSubApp(id);
    if (onCloseMobile) onCloseMobile();
  };

  const sidebarContent = (
    <aside className={`w-64 h-full border-r flex flex-col justify-between p-4 select-none transition-colors duration-200 ${
      isLight
        ? 'bg-white border-slate-200/90 shadow-sm text-slate-800'
        : 'bg-[#080b13] border-white/[0.08] text-white'
    }`}>
      {/* Top Header & Brand */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2 pt-1">
          <div
            onClick={() => handleItemClick('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            {/* Colorful Brand Icon matching image.png */}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 p-[2px] shadow-lg shadow-pink-500/25 transition-transform group-hover:scale-105 flex items-center justify-center">
              <div className={`w-full h-full rounded-[14px] flex items-center justify-center p-1.5 ${
                isLight ? 'bg-white' : 'bg-[#080b13]'
              }`}>
                <svg viewBox="0 0 24 24" className="w-full h-full">
                  <path
                    d="M3 17 L7 7 L12 14 L17 7 L21 17"
                    fill="none"
                    stroke="url(#sbLogoGrad)"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <defs>
                    <linearGradient id="sbLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="35%" stopColor="#ec4899" />
                      <stop offset="70%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#38bdf8" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1">
                <h1 className={`font-extrabold text-base tracking-tight leading-none ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>
                  CreativeHub
                </h1>
              </div>
              <p className={`text-[10px] font-medium tracking-wide mt-1 ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}>
                AI Tools for Creators
              </p>
            </div>
          </div>

          {/* Close button on mobile */}
          {isOpenMobile && (
            <button
              onClick={onCloseMobile}
              className={`lg:hidden p-1.5 rounded-lg ${
                isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Primary Sub-Apps Menu */}
        <nav className="space-y-1.5">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const Avatar = item.avatar;
            const isActive = currentSubApp === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer group ${
                  isActive
                    ? item.activeBg
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {Avatar ? (
                    <div className="shrink-0 transition-transform group-hover:scale-110">
                      <Avatar size={24} />
                    </div>
                  ) : (
                    <Icon
                      className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-white' : item.color
                      }`}
                    />
                  )}
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                      isActive
                        ? 'bg-black/25 text-white'
                        : isLight
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-white/5 text-slate-400 border border-white/10'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Divider */}
        <div className={`border-t my-3 ${isLight ? 'border-slate-200/80' : 'border-white/[0.07]'}`} />

        {/* Secondary Navigation */}
        <nav className="space-y-1">
          {secondaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSubApp === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? isLight
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'bg-white/10 text-white'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isLight ? 'text-slate-500' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Plan Widget (Matching image.png) */}
      <div className={`pt-4 border-t space-y-3 ${isLight ? 'border-slate-200/80' : 'border-white/[0.07]'}`}>
        <div className={`rounded-2xl p-3.5 space-y-2.5 border transition-all ${
          isLight
            ? 'bg-slate-50 border-slate-200/90 text-slate-800 shadow-xs'
            : 'bg-[#0f1424] border-white/[0.08] text-white'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Your Plan</span>
            <span className="text-[10px] text-amber-500 flex items-center gap-1 font-bold">
              <Crown className="w-3 h-3 text-amber-500" />
              {currentUser.plan || 'Pro Creator'}
            </span>
          </div>

          {/* Credits Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-semibold">
              <span className={isLight ? 'text-slate-900 font-bold' : 'text-white'}>
                {currentUser.creditsRemaining.toLocaleString()} / 2,000
              </span>
              <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>credits</span>
            </div>
            <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-black/50'}`}>
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"
                style={{ width: `${Math.min(100, (currentUser.creditsRemaining / 2000) * 100)}%` }}
              />
            </div>
          </div>

          <button
            onClick={onOpenAuthModal}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-[11px] shadow-md shadow-indigo-600/25 transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Upgrade Plan</span>
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:block shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="relative z-10 w-72 max-w-[85vw] h-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
