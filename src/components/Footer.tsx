import React, { useRef } from 'react';
import { 
  Sparkles, 
  Droplet,
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
  instagramUrl = 'https://www.instagram.com/konichiwa_mart?stkn=MTRrM3I1a21la2cwOQ%3D%3D&utm_source=qr',
  instagramHandle = '@konichiwa_mart'
}) => {
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Hidden operator triple-tap trigger
  const handleSecretTripleTap = () => {
    tapCountRef.current += 1;
    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
    }

    if (tapCountRef.current >= 3) {
      tapCountRef.current = 0;
      if (onOpenAdmin) {
        onOpenAdmin();
      }
    } else {
      tapTimerRef.current = setTimeout(() => {
        tapCountRef.current = 0;
      }, 700);
    }
  };

  return (
    <footer className="border-t border-slate-200/80 dark:border-zinc-800/90 bg-white/80 dark:bg-[#09090b]/90 text-slate-600 dark:text-zinc-400 text-xs pt-12 pb-10 px-4 md:px-8 relative z-10 transition-colors">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Main Clean Row */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-8 border-b border-slate-200/70 dark:border-zinc-800">
          
          {/* Brand & Mission - Triple tap enabled */}
          <div 
            onClick={handleSecretTripleTap}
            className="space-y-2 text-left max-w-md select-none cursor-pointer group"
            title="Konichiwa_Mart"
          >
            <div className="flex items-center gap-3">
              <KonichiwaMartLogo size={52} />
              <span className="font-serif tracking-tight text-2xl text-slate-900 dark:text-zinc-100 font-black">
                Konichiwa<span className="text-pink-600 dark:text-pink-400">_Mart</span>
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Direct Japanese Skincare Import Dispensary. Delivering 100% authentic, factory-sealed skincare essentials directly from Japan.
            </p>
          </div>

          {/* Quick Links as Pure Clickable Text (Not Button Looking) */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs">
            {onNavigateToProducts && (
              <button
                type="button"
                onClick={onNavigateToProducts}
                className="text-slate-600 dark:text-zinc-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors cursor-pointer font-medium"
              >
                Products
              </button>
            )}

            {onOpenAbout && (
              <button
                type="button"
                onClick={onOpenAbout}
                className="text-slate-600 dark:text-zinc-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors cursor-pointer font-medium"
              >
                About Us
              </button>
            )}

            {onOpenContact && (
              <button
                type="button"
                onClick={onOpenContact}
                className="text-slate-600 dark:text-zinc-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors cursor-pointer font-medium"
              >
                Contact Us
              </button>
            )}

            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 dark:text-zinc-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors cursor-pointer font-medium flex items-center gap-1.5"
              title={`Follow us on Instagram (${instagramHandle})`}
            >
              <Instagram className="w-3.5 h-3.5 text-pink-500" />
              <span>{instagramHandle}</span>
            </a>

            <a
              href="https://wa.me/919820012345"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer font-medium flex items-center gap-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>WhatsApp Care</span>
            </a>
          </div>

          {/* Quality Highlights as Pure Subtle Text (Not Button-like) */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 dark:text-zinc-400">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-500/80" />
              <span>100% Japan Imports</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Droplet className="w-3.5 h-3.5 text-pink-500/80" />
              <span>Gentle Formulations</span>
            </div>
          </div>

        </div>

        {/* Bottom Strip - Triple tap also enabled on copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-zinc-400">
          <div 
            onClick={handleSecretTripleTap}
            className="select-none cursor-default"
          >
            © {new Date().getFullYear()} Konichiwa_Mart. All rights reserved. Authentic Japanese Skincare Essentials.
          </div>
        </div>

      </div>
    </footer>
  );
};
