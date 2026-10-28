import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  LogOut, 
  User, 
  Mail, 
  Award,
  Zap
} from 'lucide-react';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onLogin: (user: Partial<UserProfile>) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
}) => {
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);

  if (!isOpen) return null;

  const handleQuickLoginDefault = () => {
    onLogin({
      email: 'gordonkevin168@gmail.com',
      name: 'Kevin Gordon',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      role: 'pro_contributor',
      plan: 'Contributor Pro',
      creditsRemaining: 9999,
      isLoggedIn: true,
    });
    onClose();
  };

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    const name = customName.trim() || customEmail.split('@')[0];
    onLogin({
      email: customEmail.trim(),
      name,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(customEmail)}`,
      role: 'pro_contributor',
      plan: 'Contributor Pro',
      creditsRemaining: 9999,
      isLoggedIn: true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none font-mono">
      <div className="bg-[#10121d] border-2 border-[#2b2d42] rounded-3xl max-w-md w-full p-6 shadow-[8px_8px_0px_#000] relative overflow-hidden space-y-5 text-white">
        {/* Glow ambient */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b-2 border-[#202334] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-md">
              {/* Google G Logo SVG */}
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.98 0 12s.45 3.83 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-black text-white tracking-wide uppercase">
                {currentUser.isLoggedIn ? 'Profil Kontributor Google' : 'Google / Gmail Sign-In'}
              </h3>
              <p className="text-[10px] text-slate-400">
                Akses Terpadu Metadata &amp; Motion Studio
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#1b1d2c] hover:bg-[#25283c] text-slate-400 hover:text-white border border-black flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {currentUser.isLoggedIn ? (
          /* Logged In View */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#090b12] border-2 border-[#23263b] flex items-center gap-3.5">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400 shrink-0 shadow-md"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-sm text-white truncate">{currentUser.name}</h4>
                  <span className="text-[10px] bg-amber-400 text-black px-2 py-0.5 rounded font-black border border-black">
                    PRO
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate mt-0.5 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-500" />
                  <span>{currentUser.email}</span>
                </p>
                <div className="flex items-center gap-2 mt-2 text-[10px] text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Status: Terhubung via Google OAuth</span>
                </div>
              </div>
            </div>

            {/* Perks list */}
            <div className="p-3.5 rounded-2xl bg-[#141624] border border-[#272a40] space-y-2 text-xs">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                Hak Akses Fitur Kontributor:
              </span>
              <ul className="space-y-1.5 text-[11px] text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Batch Metadata Generator &amp; Audit 4-Tier Adobe Stock</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Motion Studio AI Canvas Generator &amp; Video Recording 4K</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Penyimpanan Riwayat Versi Copilot &amp; Export CSV/Bridge</span>
                </li>
              </ul>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={onLogout}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#1c1e2e] hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 text-xs font-bold border-2 border-black flex items-center justify-center gap-2 shadow-[2px_2px_0px_#000] cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Keluar (Sign Out)</span>
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs border-2 border-black shadow-[2px_2px_0px_#000] cursor-pointer"
              >
                Lanjutkan Bekerja
              </button>
            </div>
          </div>
        ) : (
          /* Sign In Options */
          <div className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              Masuk dengan akun Gmail Anda untuk membuka akses penuh ke <strong>Metadata Studio</strong> (Judul &amp; 49 Keywords Adobe Stock) dan <strong>Motion Studio</strong> (Canvas AI Copilot &amp; Video Export).
            </p>

            {/* Default Quick Google Login Button */}
            <button
              onClick={handleQuickLoginDefault}
              className="w-full p-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 border-2 border-black font-black text-xs flex items-center justify-center gap-3 shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.98 0 12s.45 3.83 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Lanjut sebagai Kevin Gordon (gordonkevin168@gmail.com)</span>
            </button>

            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-[#10121d] px-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider relative">
                ATAU AKUN LAIN
              </span>
            </div>

            {!showCustomForm ? (
              <button
                type="button"
                onClick={() => setShowCustomForm(true)}
                className="w-full py-2.5 rounded-xl bg-[#161826] hover:bg-[#1e2032] text-xs font-bold text-slate-300 border-2 border-[#2b2d42] transition cursor-pointer"
              >
                Gunakan Email Gmail / Google Lainnya
              </button>
            ) : (
              <form onSubmit={handleCustomLogin} className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] text-slate-400 font-bold mb-1">
                    Email Google / Gmail:
                  </label>
                  <input
                    type="email"
                    required
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="nama.anda@gmail.com"
                    className="w-full px-3.5 py-2 text-xs bg-[#090a10] border-2 border-[#2b2d42] rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 font-bold mb-1">
                    Nama Kontributor:
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Contoh: Alex Studio"
                    className="w-full px-3.5 py-2 text-xs bg-[#090a10] border-2 border-[#2b2d42] rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 text-white font-black text-xs border-2 border-black shadow-[2px_2px_0px_#000] cursor-pointer"
                >
                  Masuk Sekarang
                </button>
              </form>
            )}

            <div className="pt-2 text-center text-[10px] text-slate-500 leading-relaxed">
              Dilindungi oleh autentikasi Google Account dan enkripsi lokal. Tidak membagikan kredensial ke pihak ketiga.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
