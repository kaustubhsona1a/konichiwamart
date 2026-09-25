import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Upload } from 'lucide-react';
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
    return localStorage.getItem('km_hero_banner_data') || FALLBACK_BANNERS[0];
  });

  const [internalMobileBannerUrl, setInternalMobileBannerUrl] = useState<string>(() => {
    return localStorage.getItem('km_hero_mobile_banner_data') || FALLBACK_MOBILE_BANNERS[0];
  });

  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 640;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [fallbackIndex, setFallbackIndex] = useState<number>(0);
  const bannerUrl = customBannerUrl || internalBannerUrl;
  const mobileBannerUrl = customMobileBannerUrl || internalMobileBannerUrl;
  const setBannerUrl = setInternalBannerUrl;

  const heroSectionRef = useRef<HTMLElement>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleShopNowClick = () => {
    const el = document.getElementById('collection');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Upload file helper for direct banner image drop
  const processUploadedFile = (file: File) => {
    if (!file) return;

    if (file.type.startsWith('image/')) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        setBannerUrl(base64);
        try {
          localStorage.setItem('km_hero_banner_data', base64);
          await fetch('/api/upload-banner', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: base64 })
          });
        } catch (err) {
          console.error('Failed to save banner on server:', err);
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  return (
    <section 
      id="hero-banner" 
      ref={heroSectionRef}
      className="relative w-full overflow-hidden bg-stone-950 dark:bg-black h-[calc(100svh-56px)] min-h-[calc(100svh-56px)] sm:h-[72vh] md:h-[78vh] lg:h-[84vh] 2xl:max-h-[900px] flex flex-col m-0 p-0"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden file input for direct banner photo upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Drag Over Active Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-40 bg-[#C52857]/25 backdrop-blur-sm border-4 border-dashed border-[#C52857] flex flex-col items-center justify-center pointer-events-none">
          <div className="bg-white/95 px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 text-[#912B52] font-semibold text-sm animate-pulse">
            <Upload className="w-6 h-6 text-[#C52857]" />
            <span>Drop photo here to set as hero background</span>
          </div>
        </div>
      )}

      {/* Uploading progress indicator */}
      {isUploading && (
        <div className="absolute top-4 right-4 z-30 bg-black/75 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-white text-xs font-semibold flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Updating banner photo...</span>
        </div>
      )}

      {/* FULL-VIEWPORT HERO IMAGE BANNER CONTAINER */}
      <div className="relative w-full h-full flex-1 overflow-hidden m-0 p-0">
        
        {/* STATIC ART-DIRECTED AUTHENTIC IMAGE BANNER */}
        <picture className="absolute inset-0 w-full h-full block">
          {/* Desktop / Laptop Layout: show laptop background photo */}
          <source media="(min-width: 640px)" srcSet={bannerUrl} />
          {/* Mobile Layout: show mobile layout background */}
          <source media="(max-width: 639px)" srcSet={mobileBannerUrl} />
          <img
            src={isMobileScreen ? mobileBannerUrl : bannerUrl}
            alt="Konichiwa Mart - Japanese Beauty, Made for You"
            loading="eager"
            fetchPriority="high"
            onError={() => {
              if (fallbackIndex < FALLBACK_BANNERS.length - 1) {
                const nextIdx = fallbackIndex + 1;
                setFallbackIndex(nextIdx);
                setBannerUrl(FALLBACK_BANNERS[nextIdx]);
              }
            }}
            className="w-full h-full object-cover object-center block select-none brightness-[0.98] contrast-[1.01] dark:brightness-[0.78] dark:contrast-[1.05]"
          />
        </picture>

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
