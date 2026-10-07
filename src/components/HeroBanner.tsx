import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { Product } from '../types';

interface HeroBannerProps {
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  onApplyCoupon?: (code: string) => void;
  customBannerUrl?: string;
  customMobileBannerUrl?: string;
  customVideoUrl?: string;
  customMobileVideoUrl?: string;
  heroMediaType?: 'image' | 'video';
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  customBannerUrl,
  customMobileBannerUrl,
}) => {
  // Desktop Fallback image sources served directly by website server
  const FALLBACK_BANNERS = [
    '/konichiwalaptopbackground.png',
    '/products/konichiwalaptopbackground.png',
    '/products/konichiwalaptopbg.png',
    '/hero-banner.png'
  ];

  // Mobile Fallback image sources served directly by website server
  const FALLBACK_MOBILE_BANNERS = [
    '/konichiwamobilebg.png',
    '/products/konichiwamobilebg.png',
    '/products/konichiwalaptopbg.png'
  ];

  // Clear any legacy video playback stored in client localStorage on mount
  useEffect(() => {
    try {
      localStorage.removeItem('km_hero_video_url');
      localStorage.removeItem('km_hero_mobile_video_url');
    } catch {}
  }, []);

  // Stored or served banner image
  const [internalBannerUrl, setInternalBannerUrl] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('km_hero_banner_data');
      if (stored && !stored.includes('mobile')) return stored;
    } catch {}
    return '/konichiwalaptopbackground.png';
  });

  const [internalMobileBannerUrl, setInternalMobileBannerUrl] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('km_hero_mobile_banner_data');
      if (stored && !stored.includes('laptop')) return stored;
    } catch {}
    return '/konichiwamobilebg.png';
  });

  // Strict separation: laptop banner never falls back to mobile image
  const bannerUrl = (customBannerUrl && !customBannerUrl.includes('mobile'))
    ? customBannerUrl
    : ((internalBannerUrl && !internalBannerUrl.includes('mobile')) ? internalBannerUrl : '/konichiwalaptopbackground.png');

  const mobileBannerUrl = (customMobileBannerUrl && !customMobileBannerUrl.includes('laptop'))
    ? customMobileBannerUrl
    : ((internalMobileBannerUrl && !internalMobileBannerUrl.includes('laptop')) ? internalMobileBannerUrl : '/konichiwamobilebg.png');

  const setBannerUrl = setInternalBannerUrl;

  const heroSectionRef = useRef<HTMLElement>(null);

  const handleShopNowClick = () => {
    const el = document.getElementById('collection');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section 
      id="hero-banner" 
      ref={heroSectionRef}
      className="relative w-full overflow-hidden bg-stone-950 dark:bg-black h-[calc(100svh-56px)] min-h-[calc(100svh-56px)] sm:h-[72vh] md:h-[78vh] lg:h-[84vh] 2xl:max-h-[900px] flex flex-col m-0 p-0"
    >

      {/* FULL-VIEWPORT HERO IMAGE BANNER CONTAINER */}
      <div className="relative w-full h-full flex-1 overflow-hidden m-0 p-0">
        
        {/* STATIC ART-DIRECTED AUTHENTIC IMAGE BANNER */}
        {/* Desktop / Laptop Layout: strictly displayed on desktop/laptop (>= 640px) */}
        <img
          src={bannerUrl}
          alt="Konichiwa Mart - Japanese Beauty, Made for You"
          loading="eager"
          fetchPriority="high"
          decoding="sync"
          className="hidden sm:block absolute inset-0 w-full h-full object-cover object-center select-none brightness-[0.98] contrast-[1.01] dark:brightness-[0.78] dark:contrast-[1.05]"
        />

        {/* Mobile Layout: strictly displayed on mobile devices (< 640px) */}
        <img
          src={mobileBannerUrl}
          alt="Konichiwa Mart - Japanese Beauty, Made for You"
          loading="eager"
          fetchPriority="high"
          decoding="sync"
          className="block sm:hidden absolute inset-0 w-full h-full object-cover object-center select-none brightness-[0.98] contrast-[1.01] dark:brightness-[0.78] dark:contrast-[1.05]"
        />

        {/* Ambient Dimmer Scrim Layer for smoother lighting in both light & dark mode */}
        <div className="absolute inset-0 bg-slate-900/[0.08] dark:bg-black/35 pointer-events-none z-10" />

        {/* Bottom subtle edge blend to eliminate any seam or white strip before the collection */}
        <div className="absolute inset-x-0 bottom-0 h-16 sm:h-24 bg-gradient-to-t from-black/50 via-black/20 to-transparent pointer-events-none z-10" />

        {/* EXACT POSITIONED CLICKABLE [SHOP NOW →] BUTTON OVERLAY */}
        <div className="absolute left-1/2 -translate-x-1/2 sm:left-[8%] sm:translate-x-0 md:left-[10%] bottom-8 sm:bottom-[8%] md:bottom-[10%] z-20 w-auto text-center">
          <button
            id="hero-shop-now-button"
            onClick={handleShopNowClick}
            className="group relative inline-flex items-center justify-center gap-2 sm:gap-3 px-7 sm:px-9 py-3 sm:py-4 rounded-full bg-gradient-to-r from-[#C52857] via-[#B8224E] to-[#912B52] hover:from-[#A81E46] hover:to-[#7E2245] text-white font-bold text-xs sm:text-sm tracking-wider uppercase shadow-xl shadow-pink-950/40 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border border-white/60 ring-2 ring-pink-500/25 whitespace-nowrap"
          >
            <span>SHOP NOW</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1.5 transition-transform duration-200" />
          </button>
        </div>

      </div>
    </section>
  );
};
