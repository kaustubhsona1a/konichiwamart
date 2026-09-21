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
  customVideoUrl,
  customMobileVideoUrl,
  heroMediaType = 'video'
}) => {
  // Desktop Fallback image sources served directly by website server (No external GitHub dependency)
  const FALLBACK_BANNERS = [
    '/konichiwalaptopbackground.png',
    '/products/konichiwalaptopbackground.png',
    '/products/konichiwalaptopbg.png',
    '/hero-banner.png'
  ];

  // Mobile Fallback image sources served directly by website server
  const FALLBACK_MOBILE_BANNERS = [
    '/products/konichiwamobilebg.png',
    '/konichiwamobilebg.png',
    '/products/konichiwalaptopbg.png'
  ];

  // Stored or served banner image
  const [internalBannerUrl, setInternalBannerUrl] = useState<string>(() => {
    return localStorage.getItem('km_hero_banner_data') || FALLBACK_BANNERS[0];
  });

  const [internalMobileBannerUrl, setInternalMobileBannerUrl] = useState<string>(() => {
    return localStorage.getItem('km_hero_mobile_banner_data') || FALLBACK_MOBILE_BANNERS[0];
  });

  // Stored or custom hero video URL (never use dummy video, purge any legacy flower.mp4)
  const [internalVideoUrl, setInternalVideoUrl] = useState<string>(() => {
    const stored = localStorage.getItem('km_hero_video_url');
    if (stored && (stored.includes('flower.mp4') || stored.includes('interactive-examples'))) {
      try { localStorage.removeItem('km_hero_video_url'); } catch {}
      return '';
    }
    return stored || '';
  });

  const [internalMobileVideoUrl, setInternalMobileVideoUrl] = useState<string>(() => {
    const stored = localStorage.getItem('km_hero_mobile_video_url');
    if (stored && (stored.includes('flower.mp4') || stored.includes('interactive-examples'))) {
      try { localStorage.removeItem('km_hero_mobile_video_url'); } catch {}
      return '';
    }
    return stored || '';
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

  const rawVideoUrl = customVideoUrl !== undefined ? customVideoUrl : internalVideoUrl;
  const rawMobileVideoUrl = customMobileVideoUrl !== undefined ? customMobileVideoUrl : internalMobileVideoUrl;

  // Never use dummy video URL
  const activeVideoUrl = (rawVideoUrl && !rawVideoUrl.includes('flower.mp4') && !rawVideoUrl.includes('interactive-examples')) ? rawVideoUrl : '';
  const activeMobileVideoUrl = (rawMobileVideoUrl && !rawMobileVideoUrl.includes('flower.mp4') && !rawMobileVideoUrl.includes('interactive-examples')) ? rawMobileVideoUrl : '';

  // For laptop layout: ONLY show video if user explicitly uploaded/configured a video, otherwise show the photo
  const effectiveVideoUrl = isMobileScreen
    ? (activeMobileVideoUrl || activeVideoUrl || '')
    : (activeVideoUrl || '');
  const effectivePoster = isMobileScreen ? (mobileBannerUrl || bannerUrl) : bannerUrl;

  // Video playback & state
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroSectionRef = useRef<HTMLElement>(null);
  const [videoError, setVideoError] = useState<boolean>(false);
  const [, setVideoLoaded] = useState<boolean>(false);

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine if video should be rendered: NEVER show dummy video, only show video if real video exists
  const shouldRenderVideo = Boolean(effectiveVideoUrl) && !videoError;

  // Keep video playing continuously whenever someone is in the hero section
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldRenderVideo) return;

    const ensurePlay = () => {
      if (video && video.paused) {
        video.muted = true;
        video.play().catch((err) => {
          console.warn('Hero video continuous play notice:', err?.message);
        });
      }
    };

    // Immediate playback attempt on mount or video source change
    ensurePlay();

    // Observe hero section visibility - keep playing whenever someone is in the hero section
    let observer: IntersectionObserver | null = null;
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window && heroSectionRef.current) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            ensurePlay();
          }
        });
      }, { threshold: [0, 0.2, 0.5] });
      observer.observe(heroSectionRef.current);
    }

    // Play whenever browser tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        ensurePlay();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Ensure immediate playback on first interaction if mobile browser restricted autoplay
    const handleFirstGesture = () => {
      ensurePlay();
    };
    window.addEventListener('touchstart', handleFirstGesture, { passive: true, once: true });
    window.addEventListener('scroll', handleFirstGesture, { passive: true, once: true });
    window.addEventListener('click', handleFirstGesture, { passive: true, once: true });

    return () => {
      if (observer) observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('scroll', handleFirstGesture);
      window.removeEventListener('click', handleFirstGesture);
    };
  }, [effectiveVideoUrl, shouldRenderVideo]);

  const handleShopNowClick = () => {
    const el = document.getElementById('collection');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Upload file helper for direct banner/video drop
  const processUploadedFile = (file: File) => {
    if (!file) return;

    // Handle video file upload
    if (file.type.startsWith('video/')) {
      setIsUploading(true);
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      const objUrl = URL.createObjectURL(file);
      tempVideo.src = objUrl;

      const performUpload = (target: 'desktop' | 'mobile') => {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result as string;
          try {
            const res = await fetch('/api/upload-hero-video', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ videoBase64: base64, target })
            });
            const data = await res.json();
            if (data?.success && data?.url) {
              if (target === 'mobile') {
                setInternalMobileVideoUrl(data.url);
                localStorage.setItem('km_hero_mobile_video_url', data.url);
              } else {
                setInternalVideoUrl(data.url);
                localStorage.setItem('km_hero_video_url', data.url);
              }
              setVideoError(false);
            }
          } catch (err) {
            console.error('Failed to upload hero video:', err);
          } finally {
            setIsUploading(false);
          }
        };
        reader.readAsDataURL(file);
      };

      tempVideo.onloadedmetadata = () => {
        const isPortrait = tempVideo.videoHeight > tempVideo.videoWidth;
        const target = (isMobileScreen || isPortrait) ? 'mobile' : 'desktop';
        URL.revokeObjectURL(objUrl);
        performUpload(target);
      };

      tempVideo.onerror = () => {
        URL.revokeObjectURL(objUrl);
        const target = isMobileScreen ? 'mobile' : 'desktop';
        performUpload(target);
      };
      return;
    }

    // Handle image banner file upload
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
      className="relative w-full overflow-hidden bg-[#FAF0F2] dark:bg-[#09090b] h-[calc(100dvh-var(--navbar-height,56px))] min-h-[calc(100dvh-var(--navbar-height,56px))] sm:h-auto sm:min-h-0 flex flex-col"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden file input for direct video or image file upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="video/mp4,video/webm,image/*"
        className="hidden"
      />

      {/* Drag Over Active Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-40 bg-[#C52857]/25 backdrop-blur-sm border-4 border-dashed border-[#C52857] flex flex-col items-center justify-center pointer-events-none">
          <div className="bg-white/95 px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 text-[#912B52] font-semibold text-sm animate-pulse">
            <Upload className="w-6 h-6 text-[#C52857]" />
            <span>Drop video (.mp4) or photo here to set as hero background</span>
          </div>
        </div>
      )}

      {/* FULL-VIEWPORT LAPTOP & DESKTOP HERO CONTAINER */}
      <div className="relative w-full max-w-[1920px] mx-auto overflow-hidden h-full flex-1 flex flex-col">
        <div className="relative w-full h-full flex-1 overflow-hidden flex items-center justify-center bg-stone-900">
          
          {shouldRenderVideo ? (
            /* CINEMATIC LOOPING BACKGROUND VIDEO (CONTINUOUS AMBIENT PLAYBACK - NO CONTROLS) */
            <div className="relative w-full h-full flex-1 overflow-hidden flex items-center justify-center">
              <video
                ref={videoRef}
                key={effectiveVideoUrl}
                src={effectiveVideoUrl}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                poster={effectivePoster}
                controls={false}
                onLoadedData={() => {
                  setVideoLoaded(true);
                  setVideoError(false);
                  videoRef.current?.play().catch(() => {});
                }}
                onEnded={() => {
                  videoRef.current?.play().catch(() => {});
                }}
                onError={() => {
                  console.warn('Hero video failed to stream, falling back to banner image.');
                  setVideoError(true);
                }}
                className="w-full h-full sm:h-auto sm:min-h-[420px] md:min-h-[500px] lg:min-h-[580px] sm:max-h-[85vh] object-cover object-center block select-none pointer-events-none align-bottom transition-[filter,opacity] duration-700 brightness-[0.96] contrast-[1.02] dark:brightness-[0.78] dark:contrast-[1.05]"
              >
                <source src={effectiveVideoUrl} type="video/mp4" />
                <source src={effectiveVideoUrl} type="video/webm" />
                {/* Fallback image */}
                <img
                  src={effectivePoster}
                  alt="Konichiwa Mart - Japanese Beauty"
                  className="w-full h-full object-cover object-center block select-none"
                />
              </video>
            </div>
          ) : (
            /* STATIC ART-DIRECTED IMAGE BANNER */
            <picture className="w-full h-full sm:h-auto flex-1 block align-bottom">
              {/* Desktop / Laptop Layout: show laptop background */}
              <source media="(min-width: 640px)" srcSet={bannerUrl} />
              {/* Mobile Layout: show mobile layout background */}
              <source media="(max-width: 639px)" srcSet={mobileBannerUrl} />
              <img
                src={mobileBannerUrl}
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
                className="w-full h-full sm:h-auto sm:max-h-[85vh] object-cover object-center block select-none align-bottom transition-[filter,opacity] duration-500 brightness-[0.98] contrast-[1.01] dark:brightness-[0.75] dark:contrast-[1.05]"
              />
            </picture>
          )}

          {/* Ambient Dimmer Scrim Layer for smoother lighting in both light & dark mode */}
          <div className="absolute inset-0 bg-slate-900/[0.08] dark:bg-black/35 pointer-events-none transition-colors duration-500 z-10" />

          {/* EXACT POSITIONED CLICKABLE [SHOP NOW →] BUTTON OVERLAY */}
          {/* Centered on mobile for maximum visibility, docked left on tablet/desktop */}
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
      </div>
    </section>
  );
};
