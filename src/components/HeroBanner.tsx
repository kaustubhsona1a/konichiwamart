import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Upload, Image as ImageIcon, CheckCircle2, ChevronDown } from 'lucide-react';
import { Product } from '../types';

interface HeroBannerProps {
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  onApplyCoupon?: (code: string) => void;
  customBannerUrl?: string;
  customMobileBannerUrl?: string;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  customBannerUrl,
  customMobileBannerUrl
}) => {
  // Desktop Fallback image sources in order of priority
  const FALLBACK_BANNERS = [
    '/konichiwalaptopbackground.png',
    '/products/konichiwalaptopbackground.png',
    'https://raw.githubusercontent.com/kaustubhsona1a/konichiwamart/main/public/konichiwalaptopbackground.png',
    '/products/konichiwalaptopbg.png',
    '/hero-banner.png'
  ];

  // Mobile Fallback image sources in order of priority
  const FALLBACK_MOBILE_BANNERS = [
    '/products/konichiwamobilebg.png',
    '/konichiwamobilebg.png',
    'https://raw.githubusercontent.com/kaustubhsona1a/konichiwamart/main/public/konichiwamobilebg.png',
    '/products/konichiwalaptopbg.png'
  ];

  // Stored or served banner image
  const [internalBannerUrl, setInternalBannerUrl] = useState<string>(() => {
    return localStorage.getItem('km_hero_banner_data') || FALLBACK_BANNERS[0];
  });

  const [internalMobileBannerUrl, setInternalMobileBannerUrl] = useState<string>(() => {
    return localStorage.getItem('km_hero_mobile_banner_data') || FALLBACK_MOBILE_BANNERS[0];
  });

  const [fallbackIndex, setFallbackIndex] = useState<number>(0);
  const bannerUrl = customBannerUrl || internalBannerUrl;
  const mobileBannerUrl = customMobileBannerUrl || internalMobileBannerUrl;
  const setBannerUrl = setInternalBannerUrl;
  const [imageLoaded, setImageLoaded] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if banner exists on server (optional check for dynamic backend deployments)
  useEffect(() => {
    fetch('/api/banner-status')
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data) => {
        if (data?.exists && data?.url) {
          setBannerUrl(data.url + '?v=' + Date.now());
          setImageLoaded(true);
        }
        if (data?.mobileUrl) {
          setInternalMobileBannerUrl(data.mobileUrl + '?v=' + Date.now());
        }
      })
      .catch(() => {
        // Static deployments won't have /api/banner-status, which is normal.
      });
  }, []);

  const handleShopNowClick = () => {
    const el = document.getElementById('collection');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Upload file helper (used by both file input and drag-and-drop)
  const processImageFile = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setBannerUrl(base64);
      setImageLoaded(true);
      try {
        localStorage.setItem('km_hero_banner_data', base64);
        // Persist directly into public/hero-banner.png on the build server
        await fetch('/api/upload-banner', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 })
        });
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3500);
      } catch (err) {
        console.error('Failed to save banner on server:', err);
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
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
      processImageFile(file);
    }
  };

  return (
    <section 
      id="hero-banner" 
      className="relative w-full overflow-hidden bg-[#0d0d0f]"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden file input for direct computer file upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Drag Over Active Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-40 bg-[#C52857]/20 backdrop-blur-sm border-4 border-dashed border-[#C52857] flex flex-col items-center justify-center pointer-events-none">
          <div className="bg-white/95 px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 text-[#912B52] font-semibold text-sm animate-pulse">
            <Upload className="w-6 h-6 text-[#C52857]" />
            <span>Drop your photo here to set as laptop hero banner</span>
          </div>
        </div>
      )}

      {/* FULL-VIEWPORT LAPTOP & DESKTOP HERO BANNER CONTAINER */}
      <div className="relative w-full max-w-[1920px] mx-auto overflow-hidden">
        {/* Banner image representation with responsive Mobile & Laptop art-direction */}
        <div className="relative w-full overflow-hidden flex items-center justify-center bg-[#0d0d0f]">
          <picture className="w-full h-auto block align-bottom">
            {/* Desktop / Laptop Layout: show laptop background */}
            <source media="(min-width: 640px)" srcSet={bannerUrl} />
            {/* Mobile Layout: show mobile layout background */}
            <source media="(max-width: 639px)" srcSet={mobileBannerUrl} />
            <img
              src={mobileBannerUrl}
              alt="Konichiwa Mart - Japanese Beauty, Made for You"
              loading="eager"
              fetchPriority="high"
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                if (fallbackIndex < FALLBACK_BANNERS.length - 1) {
                  const nextIdx = fallbackIndex + 1;
                  setFallbackIndex(nextIdx);
                  setBannerUrl(FALLBACK_BANNERS[nextIdx]);
                } else {
                  setImageLoaded(false);
                }
              }}
              className="w-full h-auto min-h-[360px] sm:min-h-[500px] md:min-h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] object-cover object-center select-none block align-bottom transition-[filter,opacity] duration-500 brightness-[0.98] contrast-[1.01] dark:brightness-[0.75] dark:contrast-[1.05]"
            />
          </picture>

          {/* Ambient Dimmer Scrim Layer for smoother lighting in both light & dark mode */}
          <div className="absolute inset-0 bg-slate-900/[0.04] dark:bg-black/35 pointer-events-none transition-colors duration-500 z-10" />

          {/* EXACT POSITIONED CLICKABLE [SHOP NOW →] BUTTON OVERLAY */}
          {/* Centered on mobile for maximum visibility, docked left on tablet/desktop */}
          <div className="absolute left-1/2 -translate-x-1/2 sm:left-[8%] sm:translate-x-0 md:left-[10%] bottom-[8%] sm:bottom-[15%] md:bottom-[18%] z-20 w-auto text-center">
            <button
              id="hero-shop-now-button"
              onClick={handleShopNowClick}
              className="group relative inline-flex items-center justify-center gap-2 sm:gap-3 px-7 sm:px-9 py-3 sm:py-4 rounded-full bg-gradient-to-r from-[#C52857] via-[#B8224E] to-[#912B52] hover:from-[#A81E46] hover:to-[#7E2245] text-white font-bold text-xs sm:text-sm tracking-wider uppercase shadow-xl shadow-pink-950/35 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border border-white/50 ring-2 ring-pink-500/25 whitespace-nowrap"
            >
              <span>SHOP NOW</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1.5 transition-transform duration-200" />
            </button>
          </div>

          {/* Clean Scroll Cue for First Fold on Laptop */}
        </div>
      </div>
    </section>
  );
};
