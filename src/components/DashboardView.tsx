import React from 'react';
import {
  FileSpreadsheet,
  Image as ImageIcon,
  Film,
  Sparkles,
  ArrowRight,
  Layers,
  MoreVertical,
  Clock,
  Compass,
  Zap,
  ExternalLink,
  Archive,
} from 'lucide-react';
import {
  Metadata3DCardGraphic,
  Image3DCardGraphic,
  Motion3DCardGraphic,
  CreativeHeroGraphic,
  ZipSmart3DCardGraphic,
} from './CartoonMascots';
import { SubAppMode } from '../types';

interface DashboardViewProps {
  onSelectSubApp: (mode: SubAppMode) => void;
  onSelectInspirationPrompt?: (prompt: string) => void;
  completedMetadataCount?: number;
  theme?: 'dark' | 'light';
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectSubApp,
  onSelectInspirationPrompt,
  completedMetadataCount = 14,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';

  const recentProjects = [
    {
      id: 'rec-1',
      title: 'Christmas Poster Set',
      type: 'Image',
      appMode: 'image' as SubAppMode,
      time: '10 minutes ago',
      color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      thumb: '🎅',
      bgThumb: 'from-purple-900 to-indigo-950',
    },
    {
      id: 'rec-2',
      title: 'Product Promo Animation',
      type: 'Motion',
      appMode: 'motion' as SubAppMode,
      time: '2 hours ago',
      color: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      thumb: '🎬',
      bgThumb: 'from-orange-950 to-amber-950',
    },
    {
      id: 'rec-3',
      title: 'Stock Metadata - Travel',
      type: 'Metadata',
      appMode: 'metadata' as SubAppMode,
      time: '5 hours ago',
      color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      thumb: '📑',
      bgThumb: 'from-blue-950 to-cyan-950',
    },
  ];

  const inspirations = [
    {
      id: 'insp-1',
      title: 'Christmas Santa Festive Gift',
      prompt: 'Cute festive 3D Santa Claus holding red holiday gift bags, joyful celebration, snow falling, cartoon art style, pure white background',
      emoji: '🎅',
      tag: 'Holiday Season',
      tagColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      gradient: 'from-red-600 via-rose-700 to-amber-700',
    },
    {
      id: 'insp-2',
      title: 'Fantasy Fairytale Castle',
      prompt: 'Majestic fantasy golden palace castle with spires, lush fantasy kingdom, sunbeams, vibrant colors, clean digital vector illustration',
      emoji: '🏰',
      tag: 'Architecture',
      tagColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      gradient: 'from-amber-600 via-yellow-600 to-emerald-700',
    },
    {
      id: 'insp-3',
      title: 'Adventure Anime Boy Running',
      prompt: 'Cheerful anime boy running happily across green meadow, blue sky with fluffy clouds, studio ghibli anime aesthetic, vibrant lighting',
      emoji: '🏃‍♂️',
      tag: 'Anime Style',
      tagColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      gradient: 'from-sky-600 via-cyan-600 to-blue-700',
    },
    {
      id: 'insp-4',
      title: 'Black Friday Sale Banner',
      prompt: 'Black Friday mega sale promotional 3D poster with shopping bags, golden sparkles, sleek black glossy background, luxury commercial graphic',
      emoji: '🛍️',
      tag: 'E-Commerce',
      tagColor: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
      gradient: 'from-slate-900 via-red-950 to-rose-900',
    },
    {
      id: 'insp-5',
      title: 'Tropical Island Beach Villa',
      prompt: 'Tropical paradise beach island with wooden villa bungalow, turquoise sea water, coconut palm trees, sunny summer vacation render',
      emoji: '🏝️',
      tag: 'Travel Stock',
      tagColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      gradient: 'from-emerald-600 via-teal-700 to-cyan-800',
    },
    {
      id: 'insp-6',
      title: 'Winter Snowman Landscape',
      prompt: 'Adorable happy snowman with carrot nose and red scarf in peaceful pine tree winter forest, soft morning sunlight, 3D render',
      emoji: '⛄',
      tag: 'Nature 3D',
      tagColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      gradient: 'from-blue-700 via-indigo-800 to-slate-900',
    },
  ];

  const handleInspirationClick = (prompt: string) => {
    if (onSelectInspirationPrompt) {
      onSelectInspirationPrompt(prompt);
    }
    onSelectSubApp('image');
  };

  return (
    <div className={`space-y-6 select-none font-sans ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
      
      {/* ========================================================= */}
      {/* 1. HERO BANNER ("All-in-One Tools for Creative Content")   */}
      {/* ========================================================= */}
      <div className={`relative rounded-3xl overflow-hidden p-6 sm:p-8 lg:p-10 shadow-2xl transition-all duration-300 ${
        isLight
          ? 'bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-indigo-100 shadow-indigo-500/10'
          : 'bg-gradient-to-r from-[#171b30] via-[#1a1f3c] to-[#251d3b] border border-white/[0.1] shadow-indigo-950/40'
      }`}>
        {/* Ambient Glowing Blobs */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text & CTA */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-xs font-bold tracking-widest uppercase">
              <span>CREATE</span>
              <span>&bull;</span>
              <span>GENERATE</span>
              <span>&bull;</span>
              <span>DOWNLOAD</span>
            </div>

            <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              All-in-One Tools <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
                for Creative Content
              </span>
            </h1>

            <p className={`text-sm sm:text-base max-w-xl leading-relaxed ${
              isLight ? 'text-slate-600' : 'text-slate-300'
            }`}>
              Generate metadata, create stunning images, and produce motion graphics — faster and easier with specialized AI creator engines.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onSelectSubApp('image')}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2.5"
              >
                <span>Start Creating</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onSelectSubApp('metadata')}
                className={`px-5 py-3 rounded-2xl font-bold text-sm border transition cursor-pointer flex items-center gap-2 ${
                  isLight
                    ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-sm'
                    : 'bg-white/[0.06] hover:bg-white/[0.12] text-white border-white/[0.1]'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-blue-500" />
                <span>Adobe Stock Engine</span>
              </button>
            </div>
          </div>

          {/* Right 3D Laptop Graphic matching image.png */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <CreativeHeroGraphic className="w-full max-w-[420px]" />
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. THE 3 SUB-APP CARDS WITH 3D ARTWORKS (Matching image.png) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* CARD 1: METADATA GENERATOR (Blue 3D Document Sheet) */}
        <div
          onClick={() => onSelectSubApp('metadata')}
          className={`group relative rounded-3xl border p-5 transition-all duration-300 shadow-xl flex flex-col justify-between cursor-pointer overflow-hidden ${
            isLight
              ? 'bg-gradient-to-b from-blue-50 to-white border-blue-200/90 hover:border-blue-400 shadow-blue-500/10 hover:shadow-blue-500/20'
              : 'bg-gradient-to-b from-[#11244e] to-[#0c1833] border-blue-500/30 hover:border-blue-400/60 shadow-blue-950/40 hover:shadow-blue-900/50'
          }`}
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* 3D Visual Artwork from image.png */}
          <div className="flex items-center justify-center py-1 relative z-10 transition-transform duration-300 group-hover:scale-105">
            <Metadata3DCardGraphic />
          </div>

          {/* Card Content & Action Button */}
          <div className={`pt-4 border-t space-y-2 relative z-10 ${
            isLight ? 'border-blue-100' : 'border-white/[0.08]'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-extrabold text-base transition-colors ${
                  isLight ? 'text-slate-900 group-hover:text-blue-600' : 'text-white group-hover:text-blue-300'
                }`}>
                  Metadata Generator
                </h3>
              </div>

              {/* Circular Action Button matching image.png */}
              <div className="w-10 h-10 rounded-full bg-blue-600/30 group-hover:bg-blue-600 border border-blue-500/40 text-blue-300 group-hover:text-white flex items-center justify-center transition-all shadow-md group-hover:scale-110">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            <p className={`text-xs leading-relaxed ${
              isLight ? 'text-slate-600' : 'text-slate-300'
            }`}>
              Buat metadata siap upload untuk Shutterstock, Adobe Stock, dan lainnya.
            </p>
          </div>
        </div>

        {/* CARD 2: IMAGE GENERATOR (Purple 3D Photo Frames) */}
        <div
          onClick={() => onSelectSubApp('image')}
          className={`group relative rounded-3xl border p-5 transition-all duration-300 shadow-xl flex flex-col justify-between cursor-pointer overflow-hidden ${
            isLight
              ? 'bg-gradient-to-b from-purple-50 to-white border-purple-200/90 hover:border-purple-400 shadow-purple-500/10 hover:shadow-purple-500/20'
              : 'bg-gradient-to-b from-[#2d134d] to-[#1a0c2e] border-purple-500/30 hover:border-purple-400/60 shadow-purple-950/40 hover:shadow-purple-900/50'
          }`}
        >
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* 3D Visual Artwork from image.png */}
          <div className="flex items-center justify-center py-1 relative z-10 transition-transform duration-300 group-hover:scale-105">
            <Image3DCardGraphic />
          </div>

          {/* Card Content & Action Button */}
          <div className={`pt-4 border-t space-y-2 relative z-10 ${
            isLight ? 'border-purple-100' : 'border-white/[0.08]'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-extrabold text-base transition-colors ${
                  isLight ? 'text-slate-900 group-hover:text-purple-600' : 'text-white group-hover:text-purple-300'
                }`}>
                  Image Generator
                </h3>
              </div>

              {/* Circular Action Button matching image.png */}
              <div className="w-10 h-10 rounded-full bg-purple-600/30 group-hover:bg-purple-600 border border-purple-500/40 text-purple-300 group-hover:text-white flex items-center justify-center transition-all shadow-md group-hover:scale-110">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            <p className={`text-xs leading-relaxed ${
              isLight ? 'text-slate-600' : 'text-slate-300'
            }`}>
              Buat gambar berkualitas tinggi dengan AI untuk berbagai kebutuhan.
            </p>
          </div>
        </div>

        {/* CARD 3: MOTION STUDIO (Orange 3D Clapperboard & Timeline) */}
        <div
          onClick={() => onSelectSubApp('motion')}
          className={`group relative rounded-3xl border p-5 transition-all duration-300 shadow-xl flex flex-col justify-between cursor-pointer overflow-hidden ${
            isLight
              ? 'bg-gradient-to-b from-amber-50 to-white border-amber-200/90 hover:border-amber-400 shadow-amber-500/10 hover:shadow-amber-500/20'
              : 'bg-gradient-to-b from-[#3a1a0c] to-[#241108] border-orange-500/30 hover:border-orange-400/60 shadow-orange-950/40 hover:shadow-orange-900/50'
          }`}
        >
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-orange-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* 3D Visual Artwork from image.png */}
          <div className="flex items-center justify-center py-1 relative z-10 transition-transform duration-300 group-hover:scale-105">
            <Motion3DCardGraphic />
          </div>

          {/* Card Content & Action Button */}
          <div className={`pt-4 border-t space-y-2 relative z-10 ${
            isLight ? 'border-amber-100' : 'border-white/[0.08]'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-extrabold text-base transition-colors ${
                  isLight ? 'text-slate-900 group-hover:text-orange-600' : 'text-white group-hover:text-orange-300'
                }`}>
                  Motion Studio
                </h3>
              </div>

              {/* Circular Action Button matching image.png */}
              <div className="w-10 h-10 rounded-full bg-orange-600/30 group-hover:bg-orange-600 border border-orange-500/40 text-orange-300 group-hover:text-white flex items-center justify-center transition-all shadow-md group-hover:scale-110">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            <p className={`text-xs leading-relaxed ${
              isLight ? 'text-slate-600' : 'text-slate-300'
            }`}>
              Generate motion graphic, animasi, dan video kreatif dengan mudah.
            </p>
          </div>
        </div>

        {/* CARD 4: ZIPSMART ARCHIVER (Cyan/Pink 3D Master Zip Packager) */}
        <div
          onClick={() => onSelectSubApp('zipsmart')}
          className={`group relative rounded-3xl border p-5 transition-all duration-300 shadow-xl flex flex-col justify-between cursor-pointer overflow-hidden ${
            isLight
              ? 'bg-gradient-to-b from-pink-50 via-purple-50 to-white border-pink-200/90 hover:border-pink-400 shadow-pink-500/10 hover:shadow-pink-500/20'
              : 'bg-gradient-to-b from-[#2e1065] to-[#15152a] border-pink-500/30 hover:border-pink-400/60 shadow-pink-950/40 hover:shadow-pink-900/50'
          }`}
        >
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-pink-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* 3D Visual Artwork */}
          <div className="flex items-center justify-center py-1 relative z-10 transition-transform duration-300 group-hover:scale-105">
            <ZipSmart3DCardGraphic />
          </div>

          {/* Card Content & Action Button */}
          <div className={`pt-4 border-t space-y-2 relative z-10 ${
            isLight ? 'border-pink-100' : 'border-white/[0.08]'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-extrabold text-base transition-colors ${
                  isLight ? 'text-slate-900 group-hover:text-pink-600' : 'text-white group-hover:text-pink-300'
                }`}>
                  ZIPsmart Archiver
                </h3>
              </div>

              {/* Circular Action Button */}
              <div className="w-10 h-10 rounded-full bg-pink-600/30 group-hover:bg-pink-600 border border-pink-500/40 text-pink-300 group-hover:text-white flex items-center justify-center transition-all shadow-md group-hover:scale-110">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            <p className={`text-xs leading-relaxed ${
              isLight ? 'text-slate-600' : 'text-slate-300'
            }`}>
              Bungkus otomatis berkas EPS + JPG ke format Master ZIP flat untuk Freepik &amp; Adobe Stock.
            </p>
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* 3. BOTTOM WIDGETS ROW (Quick Actions, Recent, Inspiration) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* WIDGET 1: QUICK ACTIONS (4 Cols) */}
        <div className={`lg:col-span-4 rounded-3xl p-5 space-y-4 shadow-lg border transition-all ${
          isLight
            ? 'bg-white border-slate-200/90 shadow-slate-200/50'
            : 'bg-[#0f1424] border-white/[0.08] shadow-black/20'
        }`}>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className={`font-extrabold text-sm tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Quick Actions
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Tile 1: New Metadata */}
            <button
              onClick={() => onSelectSubApp('metadata')}
              className="p-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 cursor-pointer flex flex-col items-center justify-center text-center space-y-2"
            >
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-bold leading-tight">New Metadata</span>
            </button>

            {/* Tile 2: Generate Image */}
            <button
              onClick={() => onSelectSubApp('image')}
              className="p-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30 transition-all transform hover:-translate-y-0.5 cursor-pointer flex flex-col items-center justify-center text-center space-y-2"
            >
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <ImageIcon className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-bold leading-tight">Generate Image</span>
            </button>

            {/* Tile 3: Create Motion */}
            <button
              onClick={() => onSelectSubApp('motion')}
              className="p-3.5 rounded-2xl bg-orange-500 hover:bg-orange-400 text-white shadow-md shadow-orange-500/30 transition-all transform hover:-translate-y-0.5 cursor-pointer flex flex-col items-center justify-center text-center space-y-2"
            >
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Film className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-bold leading-tight">Create Motion</span>
            </button>

            {/* Tile 4: ZIPsmart Archiver */}
            <button
              onClick={() => onSelectSubApp('zipsmart')}
              className="p-3.5 rounded-2xl bg-gradient-to-br from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-md shadow-pink-600/30 transition-all transform hover:-translate-y-0.5 cursor-pointer flex flex-col items-center justify-center text-center space-y-2"
            >
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Archive className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-bold leading-tight">ZIPsmart Pack</span>
            </button>
          </div>
        </div>

        {/* WIDGET 2: RECENT PROJECTS (4 Cols) */}
        <div className={`lg:col-span-4 rounded-3xl p-5 space-y-3 shadow-lg border transition-all flex flex-col justify-between ${
          isLight
            ? 'bg-white border-slate-200/90 shadow-slate-200/50'
            : 'bg-[#0f1424] border-white/[0.08] shadow-black/20'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <h3 className={`font-extrabold text-sm tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Recent Projects
              </h3>
            </div>
            <button
              onClick={() => onSelectSubApp('history')}
              className="text-xs text-blue-500 hover:text-blue-600 font-semibold cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="space-y-2.5">
            {recentProjects.map((p) => (
              <div
                key={p.id}
                onClick={() => onSelectSubApp(p.appMode)}
                className={`p-2.5 rounded-2xl border flex items-center justify-between gap-3 transition cursor-pointer group ${
                  isLight
                    ? 'bg-slate-50 hover:bg-slate-100 border-slate-200/80'
                    : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.06]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${p.bgThumb} border border-white/10 flex items-center justify-center text-lg shrink-0 shadow-sm`}
                  >
                    <span>{p.thumb}</span>
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate transition-colors ${
                      isLight ? 'text-slate-900 group-hover:text-blue-600' : 'text-white group-hover:text-blue-300'
                    }`}>
                      {p.title}
                    </p>
                    <p className={`text-[10px] flex items-center gap-1.5 mt-0.5 ${
                      isLight ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      <span className={`px-1.5 py-0.2 rounded font-semibold border text-[9px] ${p.color}`}>
                        {p.type}
                      </span>
                      <span>&bull;</span>
                      <span>{p.time}</span>
                    </p>
                  </div>
                </div>

                <div className={`${isLight ? 'text-slate-400 group-hover:text-slate-700' : 'text-slate-500 group-hover:text-white'} p-1`}>
                  <MoreVertical className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>

          <p className={`text-[10px] text-center pt-1 border-t ${
            isLight ? 'text-slate-400 border-slate-100' : 'text-slate-500 border-white/[0.05]'
          }`}>
            Klik project untuk membuka kembali di studio masing-masing
          </p>
        </div>

        {/* WIDGET 3: INSPIRATION (4 Cols) */}
        <div className={`lg:col-span-4 rounded-3xl p-5 space-y-3 shadow-lg border transition-all ${
          isLight
            ? 'bg-white border-slate-200/90 shadow-slate-200/50'
            : 'bg-[#0f1424] border-white/[0.08] shadow-black/20'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">💡</span>
              <h3 className={`font-extrabold text-sm tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Inspiration
              </h3>
            </div>
            <button
              onClick={() => onSelectSubApp('image')}
              className="text-xs text-amber-500 hover:text-amber-600 font-semibold cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {inspirations.map((insp) => (
              <div
                key={insp.id}
                onClick={() => handleInspirationClick(insp.prompt)}
                className={`relative aspect-square rounded-2xl bg-gradient-to-br ${insp.gradient} p-2 border border-white/10 overflow-hidden flex flex-col justify-between cursor-pointer group shadow-md transition-all hover:scale-105`}
                title={`${insp.title} (Klik untuk generate di Image Generator)`}
              >
                <div className="text-xl flex items-center justify-center h-full">
                  <span>{insp.emoji}</span>
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1 text-center">
                  <span className="text-[9px] text-white font-extrabold leading-tight">
                    Coba Prompt
                  </span>
                </div>
              </div>
            ))}
          </div>

          <p className={`text-[10px] text-center pt-1 border-t ${
            isLight ? 'text-slate-400 border-slate-100' : 'text-slate-400 border-white/[0.05]'
          }`}>
            Klik kartu inspirasi untuk langsung memuat prompt ke Image Generator!
          </p>
        </div>

      </div>

    </div>
  );
};

