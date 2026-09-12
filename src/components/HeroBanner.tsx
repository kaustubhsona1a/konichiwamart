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
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  customBannerUrl
}) => {
  // Stored or served banner image
  const [internalBannerUrl, setInternalBannerUrl] = useState<string>(() => {
    return localStorage.getItem('km_hero_banner_data') || '/hero-banner.png';
  });

  const bannerUrl = customBannerUrl || internalBannerUrl;
  const setBannerUrl = setInternalBannerUrl;
  const [imageLoaded, setImageLoaded] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('km_hero_banner_data'));
  });
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if /hero-banner.png exists on server
  useEffect(() => {
    fetch('/api/banner-status')
      .then((res) => res.json())
      .then((data) => {
        if (data?.exists) {
          setBannerUrl('/hero-banner.png?v=' + Date.now());
          setImageLoaded(true);
        }
      })
      .catch(() => {});
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
      className="relative w-full overflow-hidden bg-[#FFF5F7] pt-[56px] sm:pt-[64px]"
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
      <div className="relative w-full max-w-[1920px] mx-auto min-h-[calc(100vh-56px)] sm:min-h-[calc(100vh-64px)] flex flex-col justify-center">
        {/* Banner image representation */}
        <div className="relative w-full h-full min-h-[calc(100vh-56px)] sm:min-h-[calc(100vh-64px)] overflow-hidden flex items-center justify-center">
          <img
            src={bannerUrl}
            alt="Konichiwa Mart - Japanese Beauty, Made for You"
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              if (bannerUrl !== '/hero-banner.png') {
                setImageLoaded(false);
              }
            }}
            className="w-full h-full min-h-[calc(100vh-56px)] sm:min-h-[calc(100vh-64px)] max-h-[calc(100vh-56px)] sm:max-h-[calc(100vh-64px)] object-cover object-center select-none block"
          />

          {/* EXACT POSITIONED CLICKABLE [SHOP NOW →] BUTTON OVERLAY */}
          {/* Positioned cleanly on the left under the headline/description, leaving Mt. Fuji & products fully visible on right */}
          <div className="absolute left-[5%] sm:left-[8%] md:left-[10%] bottom-[12%] sm:bottom-[15%] md:bottom-[18%] z-20">
            <button
              id="hero-shop-now-button"
              onClick={handleShopNowClick}
              className="group relative inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-9 py-3 sm:py-4 rounded-full bg-gradient-to-r from-[#C52857] via-[#B8224E] to-[#912B52] hover:from-[#A81E46] hover:to-[#7E2245] text-white font-bold text-xs sm:text-sm tracking-wider uppercase shadow-xl shadow-pink-950/30 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border border-white/40 ring-2 ring-pink-500/20"
            >
              <span>SHOP NOW</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1.5 transition-transform duration-200" />
            </button>
          </div>

          {/* Clean Scroll Cue for First Fold on Laptop */}
          <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 z-20 hidden md:flex flex-col items-center">
            <button
              onClick={handleShopNowClick}
              className="flex flex-col items-center text-slate-700/80 hover:text-pink-700 text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase transition-colors cursor-pointer gap-0.5 bg-white/70 hover:bg-white/95 px-3 py-1 rounded-full backdrop-blur-xs border border-white/60 shadow-xs"
            >
              <span>Explore Collection</span>
              <ChevronDown className="w-3.5 h-3.5 text-pink-600 animate-bounce" />
            </button>
          </div>
        </div>

        {/* Fallback Banner Prompt if image is not yet in public folder */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-[#FFEBF1] via-[#FFF0F5] to-[#FED7E2] flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-white/90 border-2 border-pink-300 flex items-center justify-center shadow-md">
              <ImageIcon className="w-8 h-8 text-pink-600" />
            </div>
            <div>
              <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#8B1D3D]">
                Japanese Beauty, Made for You
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mt-1">
                Drag & drop or select your laptop hero photo to save it directly into the public folder with the interactive Shop Now button.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#C52857] to-[#A53460] text-white text-xs font-bold shadow-md hover:scale-105 transition-transform flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Photo to /public</span>
              </button>
              <button
                onClick={handleShopNowClick}
                className="px-6 py-2.5 rounded-full bg-white text-pink-800 text-xs font-bold border border-pink-200 shadow-sm hover:bg-pink-50 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Browse Products</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
