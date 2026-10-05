import React, { useRef } from 'react';
import { 
  Sparkles, 
  Droplet,
  Instagram,
  Package,
  Info,
  PhoneCall
} from 'lucide-react';
import { KonichiwaMartLogo } from './KonichiwaMartLogo';

interface FooterProps {
  onOpenSecurityGuide?: () => void;
  onOpenAdmin?: () => void;
  onOpenAbout?: () => void;
  onOpenContact?: () => void;
  onNavigateToProducts?: () => void;
  onNavigateCategory?: (slug: string) => void;
  onNavigateBrand?: (slug: string) => void;
  onNavigateGuide?: (slug: string) => void;
  instagramUrl?: string;
  instagramHandle?: string;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenAdmin,
  onOpenAbout,
  onOpenContact,
  onNavigateToProducts,
  onNavigateCategory,
  onNavigateBrand,
  onNavigateGuide,
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

        {/* SEO Internal Linking Directory: Crawlable Collections, Brands & Guides */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-2 pb-6 border-b border-slate-200/60 dark:border-zinc-800/80 text-left">
          
          {/* Japanese Skincare Categories */}
          <div className="space-y-2">
            <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-zinc-200">
              Japanese Categories
            </h3>
            <ul className="space-y-1.5 text-[11px] list-none p-0 m-0">
              <li>
                <a
                  href="/collections/sunscreen"
                  onClick={(e) => {
                    if (!e.metaKey && !e.ctrlKey && onNavigateCategory) {
                      e.preventDefault();
                      onNavigateCategory('sunscreen');
                    }
                  }}
                  className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  Japanese Sunscreens (PA++++)
                </a>
              </li>
              <li>
                <a
                  href="/collections/face-wash"
                  onClick={(e) => {
                    if (!e.metaKey && !e.ctrlKey && onNavigateCategory) {
                      e.preventDefault();
                      onNavigateCategory('face-wash');
                    }
                  }}
                  className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  Micro-Dense Cleansers & Face Wash
                </a>
              </li>
              <li>
                <a
                  href="/collections/toner"
                  onClick={(e) => {
                    if (!e.metaKey && !e.ctrlKey && onNavigateCategory) {
                      e.preventDefault();
                      onNavigateCategory('toner');
                    }
                  }}
                  className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  Hydrating Lotions & Toners
                </a>
              </li>
              <li>
                <a
                  href="/collections/serum"
                  onClick={(e) => {
                    if (!e.metaKey && !e.ctrlKey && onNavigateCategory) {
                      e.preventDefault();
                      onNavigateCategory('serum');
                    }
                  }}
                  className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  Targeted Serums & Vitamin C
                </a>
              </li>
              <li>
                <a
                  href="/collections/face-mask"
                  onClick={(e) => {
                    if (!e.metaKey && !e.ctrlKey && onNavigateCategory) {
                      e.preventDefault();
                      onNavigateCategory('face-mask');
                    }
                  }}
                  className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  Japanese Sheet Masks
                </a>
              </li>
              <li>
                <a
                  href="/collections/hair-care"
                  onClick={(e) => {
                    if (!e.metaKey && !e.ctrlKey && onNavigateCategory) {
                      e.preventDefault();
                      onNavigateCategory('hair-care');
                    }
                  }}
                  className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  Intensive Hair Masks & Hair Care
                </a>
              </li>
            </ul>
          </div>

          {/* Authentic Tokyo Brands */}
          <div className="space-y-2">
            <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-zinc-200">
              Japanese Brands
            </h3>
            <ul className="space-y-1.5 text-[11px] list-none p-0 m-0">
              <li>
                <a
                  href="/brands/biore"
                  onClick={(e) => {
                    if (!e.metaKey && !e.ctrlKey && onNavigateBrand) {
                      e.preventDefault();
                      onNavigateBrand('biore');
                    }
                  }}
                  className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  Bioré Japan
                </a>
              </li>
              <li>
                <a
                  href="/brands/senka"
                  onClick={(e) => {
                    if (!e.metaKey && !e.ctrlKey && onNavigateBrand) {
                      e.preventDefault();
                      onNavigateBrand('senka');
                    }
                  }}
                  className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  Senka by Shiseido
                </a>
              </li>
              <li>
                <a
                  href="/brands/hada-labo"
                  onClick={(e) => {
                    if (!e.metaKey && !e.ctrlKey && onNavigateBrand) {
                      e.preventDefault();
                      onNavigateBrand('hada-labo');
                    }
                  }}
                  className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  Hada Labo Rohto
                </a>
              </li>
              <li>
                <a
                  href="/brands/melano-cc"
                  onClick={(e) => {
                    if (!e.metaKey && !e.ctrlKey && onNavigateBrand) {
                      e.preventDefault();
                      onNavigateBrand('melano-cc');
                    }
                  }}
                  className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  Melano CC
                </a>
              </li>
              <li>
                <a
                  href="/brands/lululun"
                  onClick={(e) => {
                    if (!e.metaKey && !e.ctrlKey && onNavigateBrand) {
                      e.preventDefault();
                      onNavigateBrand('lululun');
                    }
                  }}
                  className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  LuLuLun Masks
                </a>
              </li>
              <li>
                <a
                  href="/brands/fino"
                  onClick={(e) => {
                    if (!e.metaKey && !e.ctrlKey && onNavigateBrand) {
                      e.preventDefault();
                      onNavigateBrand('fino');
                    }
                  }}
                  className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  Fino by Shiseido
                </a>
              </li>
              <li>
                <a
                  href="/brands/honey"
                  onClick={(e) => {
                    if (!e.metaKey && !e.ctrlKey && onNavigateBrand) {
                      e.preventDefault();
                      onNavigateBrand('honey');
                    }
                  }}
                  className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  &amp;honey Organic Hair
                </a>
              </li>
              <li>
                <a
                  href="/brands/keana-nadeshiko"
                  onClick={(e) => {
                    if (!e.metaKey && !e.ctrlKey && onNavigateBrand) {
                      e.preventDefault();
                      onNavigateBrand('keana-nadeshiko');
                    }
                  }}
                  className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  Keana Nadeshiko Rice Care
                </a>
              </li>
            </ul>
          </div>

          {/* J-Beauty Skincare Guides */}
          <div className="space-y-2">
            <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-zinc-200">
              Skincare Guides
            </h3>
            <ul className="space-y-1.5 text-[11px] list-none p-0 m-0">
              <li>
                <a
                  href="/guides/japanese-skincare-routine-beginners"
                  onClick={(e) => {
                    if (!e.metaKey && !e.ctrlKey && onNavigateGuide) {
                      e.preventDefault();
                      onNavigateGuide('japanese-skincare-routine-beginners');
                    }
                  }}
                  className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  Beginner's Guide to J-Beauty Routine
                </a>
              </li>
              <li>
                <a
                  href="/guides/japanese-sunscreen-guide-india"
                  onClick={(e) => {
                    if (!e.metaKey && !e.ctrlKey && onNavigateGuide) {
                      e.preventDefault();
                      onNavigateGuide('japanese-sunscreen-guide-india');
                    }
                  }}
                  className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  Japanese Sunscreen Guide for India
                </a>
              </li>
              <li>
                <a
                  href="/guides/double-cleansing-japanese-routine"
                  onClick={(e) => {
                    if (!e.metaKey && !e.ctrlKey && onNavigateGuide) {
                      e.preventDefault();
                      onNavigateGuide('double-cleansing-japanese-routine');
                    }
                  }}
                  className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  Double Cleansing 101 for Glass Skin
                </a>
              </li>
              <li>
                <a
                  href="/guides/how-to-choose-japanese-face-wash"
                  onClick={(e) => {
                    if (!e.metaKey && !e.ctrlKey && onNavigateGuide) {
                      e.preventDefault();
                      onNavigateGuide('how-to-choose-japanese-face-wash');
                    }
                  }}
                  className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  How to Choose Japanese Face Wash
                </a>
              </li>
              <li>
                <a
                  href="/guides/how-to-use-japanese-hair-mask"
                  onClick={(e) => {
                    if (!e.metaKey && !e.ctrlKey && onNavigateGuide) {
                      e.preventDefault();
                      onNavigateGuide('how-to-use-japanese-hair-mask');
                    }
                  }}
                  className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  How to Use Japanese Hair Masks
                </a>
              </li>
            </ul>
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
