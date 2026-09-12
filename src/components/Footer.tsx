import React from 'react';
import { 
  Sparkles, 
  Droplet,
  Lock,
  Instagram,
  Package,
  Info,
  PhoneCall,
  MessageCircle
} from 'lucide-react';
import { KonichiwaMartLogo } from './KonichiwaMartLogo';

interface FooterProps {
  onOpenSecurityGuide?: () => void;
  onOpenAdmin?: () => void;
  onOpenAbout?: () => void;
  onOpenContact?: () => void;
  onNavigateToProducts?: () => void;
  instagramUrl?: string;
  instagramHandle?: string;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenAdmin,
  onOpenAbout,
  onOpenContact,
  onNavigateToProducts,
  instagramUrl = 'https://www.instagram.com',
  instagramHandle = '@konichiwa.mart'
}) => {
  return (
    <footer className="border-t border-slate-200/80 dark:border-zinc-800/90 bg-white/80 dark:bg-[#09090b]/90 text-slate-600 dark:text-zinc-400 text-xs pt-12 pb-10 px-4 md:px-8 relative z-10 transition-colors">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Main Clean Row */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-8 border-b border-slate-200/70 dark:border-zinc-800">
          
          {/* Brand & Mission */}
          <div className="space-y-2 text-left max-w-md">
            <div className="flex items-center gap-3">
              <KonichiwaMartLogo size={52} />
              <span className="font-serif tracking-tight text-2xl text-slate-900 dark:text-zinc-100 font-black">
                Konichiwa<span className="text-pink-600 dark:text-pink-400">_Mart</span>
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Direct Japanese Skincare Import Dispensary. Delivering 100% authentic, factory-sealed skincare essentials directly from Tokyo.
            </p>
          </div>

          {/* Quick Links & Instagram in Footer */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {onNavigateToProducts && (
              <button
                onClick={onNavigateToProducts}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 hover:text-pink-600 dark:hover:text-pink-400 hover:border-pink-200 dark:hover:border-pink-500/40 text-xs font-medium shadow-xs transition-colors cursor-pointer"
              >
                <Package className="w-3.5 h-3.5 text-pink-500" />
                <span>Products</span>
              </button>
            )}

            {onOpenAbout && (
              <button
                onClick={onOpenAbout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 hover:text-pink-600 dark:hover:text-pink-400 hover:border-pink-200 dark:hover:border-pink-500/40 text-xs font-medium shadow-xs transition-colors cursor-pointer"
              >
                <Info className="w-3.5 h-3.5 text-pink-500" />
                <span>About Us</span>
              </button>
            )}

            {onOpenContact && (
              <button
                onClick={onOpenContact}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 hover:text-pink-600 dark:hover:text-pink-400 hover:border-pink-200 dark:hover:border-pink-500/40 text-xs font-medium shadow-xs transition-colors cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5 text-pink-500" />
                <span>Contact Us</span>
              </button>
            )}

            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-tr from-amber-50 to-purple-50 dark:from-zinc-900 dark:to-zinc-900 border border-purple-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 hover:text-purple-700 dark:hover:text-purple-300 text-xs font-medium shadow-xs transition-colors cursor-pointer group"
              title={`Follow us on Instagram (${instagramHandle})`}
            >
              <div className="w-4 h-4 rounded bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center p-0.5 shadow-2xs group-hover:scale-110 transition-transform">
                <Instagram className="w-3 h-3" />
              </div>
              <span className="font-semibold">{instagramHandle}</span>
            </a>

            <a
              href="https://wa.me/919820012345"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-200 text-xs font-medium shadow-xs transition-colors cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>WhatsApp Care</span>
            </a>
          </div>

          {/* Clean Quality Highlights */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-medium shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              <span>100% Tokyo Imports</span>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-medium shadow-xs">
              <Droplet className="w-3.5 h-3.5 text-pink-500" />
              <span>Gentle Formulations</span>
            </div>
          </div>

        </div>

        {/* Bottom Strip with Hidden Operator Entry Key */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-zinc-400">
          <div>
            © {new Date().getFullYear()} Konichiwa_Mart. All rights reserved. Authentic Japanese Skincare Essentials.
          </div>

          {/* Discreet Operator Access Button */}
          <div className="flex items-center gap-3">
            {onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="text-[11px] text-slate-400 dark:text-slate-500 hover:text-pink-600 dark:hover:text-pink-400 flex items-center gap-1 opacity-60 hover:opacity-100 transition-all cursor-pointer p-1"
                title="Store Operator Access (Ctrl+Shift+A)"
              >
                <Lock className="w-3 h-3" />
                <span>Staff Access</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </footer>
  );
};
