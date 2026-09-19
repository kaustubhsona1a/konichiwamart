import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Sparkles, 
  Droplet, 
  ShoppingBag, 
  Eye, 
  Heart, 
  Check, 
  Star,
  ChevronDown,
  ShieldCheck,
  Award
} from 'lucide-react';
import { Product } from '../types';
import { PRODUCTS } from '../data/products';
import { formatINR } from '../data/pincodes';
import { BloomyArtworkDecor } from './BloomyArtworkDecor';

interface HeroScrollScrubProps {
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  onApplyCoupon?: (code: string) => void;
}

export const HeroScrollScrub: React.FC<HeroScrollScrubProps> = ({
  onSelectProduct,
  onAddToCart,
  onToggleWishlist,
  isWishlisted
}) => {
  const runwayRef = useRef<HTMLDivElement>(null);
  const bottleRef = useRef<HTMLDivElement>(null);
  const mobileBottleRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeStage, setActiveStage] = useState<0 | 1 | 2 | 3>(0);
  const [selectedHeroIndex, setSelectedHeroIndex] = useState(0);
  const [isAddedRecently, setIsAddedRecently] = useState(false);

  // Smooth LERP references
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);
  const animFrameIdRef = useRef<number | null>(null);

  // Exactly the 4 requested core products
  const flagshipProducts = PRODUCTS.slice(0, 4);

  // 4 clear, essential skincare steps with authentic Japanese typography watermarks
  // and contextual hotspot callouts directly integrated with the product vessel
  const STAGES = [
    {
      step: '01',
      tag: 'Cleanse',
      category: 'Face Wash',
      productIndex: 0,
      kanji: '洗顔専科',
      title: 'Micro-Dense Whipped Cleansing Foam',
      description: 'Produces a microscopic foam cushion that lifts sebum and impurities from pores without stripping natural hydration.',
      keyHighlight: 'Silk Essence + Double Hyaluronic Acid',
      badge: 'Japan #1 Cleanser',
      glowColor: 'rgba(244, 114, 182, 0.24)',
      callouts: [
        { label: 'Micro-Whip Foam', desc: 'Dense 0.1mm micro-cushion eliminates skin friction', pos: 'top-right' },
        { label: 'Silk Essence', desc: 'Preserves essential moisture during cleansing', pos: 'mid-left' },
        { label: 'Non-Stripping', desc: 'Zero tightness or dryness after rinse', pos: 'bottom-right' }
      ]
    },
    {
      step: '02',
      tag: 'Tone',
      category: 'Toner',
      productIndex: 2,
      kanji: 'メラノCC',
      title: 'Active Vitamin C Brightening Lotion Toner',
      description: 'Penetrates deep into the stratum corneum to fade dark spots, inhibit melanin production, and balance skin texture.',
      keyHighlight: 'Pure Active Vitamin C + Glycyrrhizate',
      badge: 'Dark Spot Essential',
      glowColor: 'rgba(245, 158, 11, 0.22)',
      callouts: [
        { label: 'Active Vitamin C', desc: 'Targeted formulation to fade pigmentation & acne marks', pos: 'top-right' },
        { label: 'Deep Penetration', desc: 'High-absorption watery lotion texture', pos: 'mid-left' },
        { label: 'Pore Clarifying', desc: 'Minimizes enlarged pores & evens skin tone', pos: 'bottom-right' }
      ]
    },
    {
      step: '03',
      tag: 'Repair',
      category: 'Face Mask',
      productIndex: 1,
      kanji: 'フィーノ',
      title: 'Deep Moisture & Conditioning Essence Mask',
      description: 'Delivers intensive beauty serum with Royal Jelly and PCA to restore damaged, dehydrated skin with velvety softness.',
      keyHighlight: 'Royal Jelly EX + Squalane + Trehalose',
      badge: 'Intensive Nourishment',
      glowColor: 'rgba(225, 29, 72, 0.20)',
      callouts: [
        { label: 'Royal Jelly EX', desc: 'Rich in amino acids for intense barrier hydration', pos: 'top-right' },
        { label: 'Velvet Veil', desc: 'Seals moisture inside for 48-hour suppleness', pos: 'mid-left' },
        { label: '5-Minute Treatment', desc: 'Quick intensive wash-off conditioning', pos: 'bottom-right' }
      ]
    },
    {
      step: '04',
      tag: 'Protect',
      category: 'Sunscreen',
      productIndex: 3,
      kanji: 'ビオレUV',
      title: 'Weightless Water-Light Daily Sunscreen',
      description: 'Provides maximum SPF 50+ PA++++ broad-spectrum defense with a sheer watery capsule texture that leaves zero cast or grease.',
      keyHighlight: 'Micro Defense UV Formula + Hyaluronic Acid',
      badge: 'SPF 50+ PA++++',
      glowColor: 'rgba(251, 146, 178, 0.24)',
      callouts: [
        { label: 'Zero White Cast', desc: 'Melts completely clear on all Indian skin tones', pos: 'top-right' },
        { label: 'Micro Defense', desc: 'Even coverage down to microscopic skin crevices', pos: 'mid-left' },
        { label: 'Watery Capsule', desc: 'Feels like fresh splash of water, never sticky', pos: 'bottom-right' }
      ]
    }
  ];

  const currentStageInfo = STAGES[activeStage];
  const heroProduct = flagshipProducts[selectedHeroIndex] || PRODUCTS[0];

  // Silky smooth LERP animation loop
  useEffect(() => {
    let lastReportedStage = -1;
    let lastReportedProgress = 0;

    const animateLoop = () => {
      const diff = targetProgressRef.current - currentProgressRef.current;
      currentProgressRef.current += diff * 0.09;
      const p = currentProgressRef.current;

      // Transform vessel with dynamic 3D perspective tilt
      if (bottleRef.current) {
        const transY = Math.sin(p * Math.PI) * -12;
        const rotY = (p - 0.5) * 20;
        const rotX = Math.sin(p * Math.PI * 2) * 4;
        const scale = 0.98 + Math.sin(p * Math.PI) * 0.04;

        bottleRef.current.style.transform = `
          perspective(1100px)
          translate3d(0, ${transY}px, 0)
          rotateX(${rotX}deg)
          rotateY(${rotY}deg)
          scale3d(${scale}, ${scale}, 1)
        `;
      }

      // Transform mobile vessel smoothly
      if (mobileBottleRef.current) {
        const transY = Math.sin(p * Math.PI) * -8;
        const rotY = (p - 0.5) * 14;
        const rotX = Math.sin(p * Math.PI * 2) * 3;
        const scale = 0.98 + Math.sin(p * Math.PI) * 0.03;

        mobileBottleRef.current.style.transform = `
          perspective(900px)
          translate3d(0, ${transY}px, 0)
          rotateX(${rotX}deg)
          rotateY(${rotY}deg)
          scale3d(${scale}, ${scale}, 1)
        `;
      }

      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${Math.max(5, p * 100)}%`;
      }

      if (Math.abs(p - lastReportedProgress) > 0.008) {
        lastReportedProgress = p;
        setScrollProgress(p);

        const stage = p < 0.28 ? 0 : p < 0.58 ? 1 : p < 0.82 ? 2 : 3;
        if (stage !== lastReportedStage) {
          lastReportedStage = stage;
          setActiveStage(stage as 0 | 1 | 2 | 3);
          setSelectedHeroIndex(STAGES[stage].productIndex);
        }
      }

      animFrameIdRef.current = requestAnimationFrame(animateLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(animateLoop);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, []);

  // Update target progress from window scroll
  const handleWindowScroll = useCallback(() => {
    if (!runwayRef.current) return;
    const rect = runwayRef.current.getBoundingClientRect();
    const runwayHeight = runwayRef.current.offsetHeight - window.innerHeight;

    if (runwayHeight > 0) {
      const currentScroll = -rect.top;
      const progress = Math.min(1, Math.max(0, currentScroll / runwayHeight));
      targetProgressRef.current = progress;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    handleWindowScroll();
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, [handleWindowScroll]);

  // Jump to stage cleanly by clicking routine pills
  const jumpToStage = (stageIdx: number) => {
    if (!runwayRef.current) return;
    const runwayHeight = runwayRef.current.offsetHeight - window.innerHeight;
    const stageProgressMap = [0.08, 0.38, 0.68, 0.94];
    const targetP = stageProgressMap[stageIdx];
    const targetScrollY = runwayRef.current.offsetTop + (targetP * runwayHeight);

    window.scrollTo({
      top: targetScrollY,
      behavior: 'smooth'
    });
  };

  const handleQuickAdd = () => {
    onAddToCart(heroProduct);
    setIsAddedRecently(true);
    setTimeout(() => setIsAddedRecently(false), 1600);
  };

  return (
    <section 
      ref={runwayRef}
      className="relative z-10 min-h-[220vh] md:min-h-[300vh] w-full bg-transparent text-[#1E293B] select-none"
    >
      {/* FULL-SCREEN STICKY THEATER: Seamless Integrated Canvas */}
      <div className="sticky top-0 h-[100dvh] w-full flex flex-col justify-between overflow-hidden relative">
        {/* Soft Ambient Dynamic Skincare Glow Behind Canvas */}
        <div 
          className="absolute inset-0 pointer-events-none transition-all duration-700 ease-out z-0"
          style={{
            background: `radial-gradient(ellipse 70% 60% at 65% 50%, ${currentStageInfo.glowColor} 0%, transparent 70%)`
          }}
        />

        {/* Soft Japanese Kanji Watermark Layered into the Stage (Desktop only to prevent mobile clutter) */}
        <div className="hidden lg:block absolute top-1/2 right-10 -translate-y-1/2 pointer-events-none select-none text-[12vw] font-serif font-black text-pink-900/[0.04] tracking-widest leading-none z-0">
          {currentStageInfo.kanji}
        </div>

        {/* LUSH SAKURA FLORAL CANOPY ARCH: Layered BEHIND the product showcase (z-[1]) */}
        <BloomyArtworkDecor className="absolute inset-0 pointer-events-none z-[1] overflow-hidden select-none" />

        {/* TOP INTEGRATED BAR: Routine Steps Navigation Pills */}
        <header className="relative z-20 pt-15 sm:pt-20 md:pt-22 px-3 sm:px-8 max-w-7xl mx-auto w-full">
          {/* Mobile: Sleek 4-Segment Routine Indicator */}
          <div className="flex lg:hidden items-center justify-between w-full bg-white/90 backdrop-blur-md rounded-xl p-1 border border-pink-100 shadow-2xs">
            {STAGES.map((s, idx) => (
              <button
                key={s.step}
                onClick={() => jumpToStage(idx)}
                className={`flex-1 py-1 px-1 rounded-lg text-[11px] transition-all text-center cursor-pointer ${
                  activeStage === idx
                    ? 'bg-pink-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-pink-600 font-medium'
                }`}
              >
                <span>{s.tag}</span>
              </button>
            ))}
          </div>

          {/* Desktop: Horizontal Pill Bar */}
          <div className="hidden lg:flex items-center gap-2 overflow-x-auto py-1 px-1 rounded-2xl liquid-glass border border-white/90 shadow-sm scrollbar-none w-fit">
            {STAGES.map((s, idx) => (
              <button
                key={s.tag}
                onClick={() => jumpToStage(idx)}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeStage === idx
                    ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${activeStage === idx ? 'bg-white animate-pulse' : 'bg-pink-600'}`} />
                <span>{s.tag}</span>
                <span className="text-[11px] opacity-75">({s.category})</span>
              </button>
            ))}
          </div>
        </header>

        {/* CENTER INTEGRATED STAGE: Product Vessel & Information Fused in One Stage */}
        <main className="relative z-10 max-w-7xl mx-auto w-full px-3 sm:px-8 flex-1 flex items-center my-auto py-1 sm:py-2">
          
          {/* MOBILE VIEW (Screens < lg): Full vertical immersion, simple, rich, uncluttered */}
          <div className="flex lg:hidden flex-col justify-between w-full h-[calc(100dvh-120px)] max-h-[660px] px-1 py-1 relative z-10 select-none">
            
            {/* Product Title & Subtitle - Clean & Clutter-Free */}
            <div className="space-y-0.5 pt-0.5 text-center">
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 tracking-tight leading-tight">
                {heroProduct.title}
              </h1>
              <p className="text-xs text-pink-800/80 font-medium">
                {heroProduct.subtitle}
              </p>
            </div>

            {/* Central Vessel: Prominent, occupying vertical space, tap to inspect */}
            <div 
              ref={mobileBottleRef}
              onClick={() => onSelectProduct(heroProduct)}
              className="relative flex-1 flex items-center justify-center my-auto cursor-pointer will-change-transform transition-[transform] duration-75 ease-out max-h-[44vh] py-1"
            >
              <img
                src={heroProduct.image}
                alt={heroProduct.title}
                className="h-full w-auto max-h-[260px] max-w-[220px] object-contain filter drop-shadow-[0_16px_28px_rgba(15,23,42,0.18)] transition-all duration-300 active:scale-98"
                referrerPolicy="no-referrer"
              />

              {/* Key Active Pill Gently Floated Under Bottle */}
              <div className="absolute bottom-0 inset-x-0 mx-auto max-w-[240px] bg-white/90 backdrop-blur-md border border-pink-100 shadow-xs rounded-full py-1 px-3 text-[10.5px] font-medium text-slate-700 pointer-events-none truncate flex items-center justify-center gap-1.5">
                <Droplet className="w-3 h-3 text-pink-500 flex-shrink-0" />
                <span className="truncate">{currentStageInfo.keyHighlight}</span>
              </div>
            </div>

            {/* Bottom Minimalist Action Card */}
            <div className="bg-white/90 backdrop-blur-xl border border-white/90 rounded-2xl p-2.5 shadow-lg shadow-pink-950/5 space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-bold text-slate-900">
                    {formatINR(heroProduct.price)}
                  </span>
                  {heroProduct.originalPrice > heroProduct.price && (
                    <span className="text-[11px] text-slate-400 line-through">
                      {formatINR(heroProduct.originalPrice)}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-500 font-normal ml-1">• {heroProduct.volume}</span>
                </div>

                <div className="flex items-center text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100 font-semibold gap-1">
                  <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                  <span>{heroProduct.rating}</span>
                  <span className="text-amber-800/60 font-normal">({heroProduct.reviewsCount})</span>
                </div>
              </div>

              {/* Action Buttons: Sleek, compact on mobile */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleQuickAdd}
                  className="flex-1 py-2 px-3 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-[11.5px] font-semibold flex items-center justify-center gap-1.5 shadow-sm shadow-pink-600/25 active:scale-95 transition-all cursor-pointer"
                >
                  {isAddedRecently ? (
                    <>
                      <Check className="w-3 h-3 text-white" />
                      <span>Added!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-3 h-3" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => onSelectProduct(heroProduct)}
                  className="py-2 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11.5px] font-medium flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                  title="View full specs"
                >
                  <Eye className="w-3 h-3 text-slate-600" />
                  <span>Details</span>
                </button>

                <button
                  onClick={() => onToggleWishlist(heroProduct.id)}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-rose-500 active:scale-95 transition-all cursor-pointer flex-shrink-0"
                  title="Save to Wishlist"
                >
                  <Heart className={`w-3.5 h-3.5 ${isWishlisted(heroProduct.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* DESKTOP VIEW (Screens >= lg): Full 12-column 3D interactive stage */}
          <div className="hidden lg:grid w-full liquid-glass rounded-3xl p-8 lg:p-10 border border-white/90 shadow-xl grid-cols-12 items-center gap-10 relative overflow-hidden">
            
            {/* Background Soft Accent Splash */}
            <div 
              className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-50 pointer-events-none transition-colors duration-700"
              style={{ backgroundColor: currentStageInfo.glowColor }}
            />

            {/* LEFT DETAILS: Clean, typography-driven product information */}
            <div className="col-span-7 text-left space-y-4 z-10">
              
              {/* Step Badge & Category Pill */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100/90 border border-pink-200 text-pink-900 text-xs font-semibold tracking-wide">
                  <Sparkles className="w-3 h-3 text-pink-600" />
                  <span>{currentStageInfo.tag.toUpperCase()} • {currentStageInfo.category.toUpperCase()}</span>
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                  <Award className="w-3 h-3 text-amber-600" />
                  <span>{currentStageInfo.badge}</span>
                </span>

                <div className="flex items-center text-xs text-amber-500 gap-1 ml-auto sm:ml-0">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="font-bold text-slate-800">{heroProduct.rating}</span>
                  <span className="text-slate-500">({heroProduct.reviewsCount})</span>
                </div>
              </div>

              {/* Product Title & Subtitle */}
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
                  {heroProduct.title}
                </h1>
                <p className="text-sm sm:text-base text-pink-700 font-medium mt-1">
                  {heroProduct.subtitle}
                </p>
              </div>

              {/* Benefit Statement */}
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
                {currentStageInfo.description}
              </p>

              {/* Integrated Specifications Strip */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div className="px-3 py-1.5 rounded-xl bg-white/90 border border-pink-100/80 text-xs text-slate-700 flex items-center gap-1.5 shadow-xs">
                  <Droplet className="w-3.5 h-3.5 text-pink-500" />
                  <span className="text-slate-500">Key Actives:</span>
                  <span className="text-slate-900 font-semibold">{currentStageInfo.keyHighlight}</span>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-white/90 border border-slate-200/80 text-xs text-slate-700 flex items-center gap-1.5 shadow-xs">
                  <span className="text-slate-500">Volume:</span>
                  <span className="text-slate-900 font-semibold">{heroProduct.volume}</span>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-white/90 border border-slate-200/80 text-xs text-slate-700 flex items-center gap-1.5 shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">100% Japan Import</span>
                </div>
              </div>

              {/* Pricing & Action Bar */}
              <div className="pt-3 flex flex-wrap items-center gap-3">
                
                {/* Price Display */}
                <div className="flex items-baseline gap-2 pr-2">
                  <span className="text-2xl font-bold text-slate-900">
                    {formatINR(heroProduct.price)}
                  </span>
                  {heroProduct.originalPrice > heroProduct.price && (
                    <span className="text-xs text-slate-400 line-through">
                      {formatINR(heroProduct.originalPrice)}
                    </span>
                  )}
                </div>

                {/* Primary Add to Cart */}
                <button
                  onClick={handleQuickAdd}
                  className="py-3 px-5 sm:px-6 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-pink-600/25 transition-all cursor-pointer active:scale-95 flex-1 sm:flex-initial"
                >
                  {isAddedRecently ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Added to Cart!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>

                {/* Quick View Details Button */}
                <button
                  onClick={() => onSelectProduct(heroProduct)}
                  className="py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold border border-slate-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                  title="View full product details"
                >
                  <Eye className="w-4 h-4 text-pink-600" />
                  <span>Details</span>
                </button>

                {/* Wishlist Toggle Button */}
                <button
                  onClick={() => onToggleWishlist(heroProduct.id)}
                  className="w-11 h-11 rounded-xl bg-white hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-rose-600 border border-slate-200 transition-all cursor-pointer shadow-xs active:scale-95"
                  title="Save to Wishlist"
                >
                  <Heart className={`w-4.5 h-4.5 ${isWishlisted(heroProduct.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>

              </div>

            </div>

            {/* RIGHT INTEGRATED DISPLAY: 3D Product Vessel with Contextual Hotspot Callouts */}
            <div className="col-span-5 flex items-center justify-center relative select-none">
              
              {/* Product Vessel Container with 3D LERP Scroll Scrub */}
              <div 
                ref={bottleRef}
                className="relative w-full max-w-[280px] sm:max-w-[340px] md:max-w-[380px] aspect-[3/4] flex items-center justify-center will-change-transform transition-[transform] duration-75 ease-out cursor-pointer"
                onClick={() => onSelectProduct(heroProduct)}
              >
                {/* Product Image */}
                <img
                  src={heroProduct.image}
                  alt={heroProduct.title}
                  className="w-full h-full object-contain filter drop-shadow-[0_18px_28px_rgba(15,23,42,0.18)] select-none"
                  referrerPolicy="no-referrer"
                />

                {/* Hotspot Callout 1 (Top / Texture) */}
                <div className="absolute top-6 -right-2 sm:-right-6 hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/95 border border-pink-100 shadow-md backdrop-blur-md text-left z-20 pointer-events-none transform translate-y-0 transition-all duration-300">
                  <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
                  <div>
                    <div className="text-[10px] font-bold text-slate-900">{currentStageInfo.callouts[0].label}</div>
                    <div className="text-[9px] text-slate-500">{currentStageInfo.callouts[0].desc}</div>
                  </div>
                </div>

                {/* Hotspot Callout 2 (Middle / Key Active) */}
                <div className="absolute top-1/2 -left-3 sm:-left-8 hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/95 border border-pink-100 shadow-md backdrop-blur-md text-left z-20 pointer-events-none transform -translate-y-1/2 transition-all duration-300">
                  <span className="w-2 h-2 rounded-full bg-pink-500" />
                  <div>
                    <div className="text-[10px] font-bold text-slate-900">{currentStageInfo.callouts[1].label}</div>
                    <div className="text-[9px] text-slate-500">{currentStageInfo.callouts[1].desc}</div>
                  </div>
                </div>

                {/* Hotspot Callout 3 (Bottom / Benefit) */}
                <div className="absolute bottom-6 -right-2 sm:-right-4 hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/95 border border-pink-100 shadow-md backdrop-blur-md text-left z-20 pointer-events-none transition-all duration-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <div>
                    <div className="text-[10px] font-bold text-slate-900">{currentStageInfo.callouts[2].label}</div>
                    <div className="text-[9px] text-slate-500">{currentStageInfo.callouts[2].desc}</div>
                  </div>
                </div>

                {/* Soft Ground Shadow */}
                <div className="absolute -bottom-4 w-3/4 h-6 bg-pink-950/10 blur-md rounded-full pointer-events-none" />
              </div>

            </div>

          </div>

        </main>

        {/* BOTTOM INTEGRATED HUD: Clean Scroll Prompt */}
        <footer className="relative z-20 pb-3 sm:pb-5 px-3 sm:px-8 max-w-7xl mx-auto w-full flex items-center justify-center border-t border-transparent sm:border-slate-200/70 pt-1.5 sm:pt-3">
          <div className="flex items-center gap-1.5 text-[10.5px] sm:text-xs text-slate-500 font-medium">
            <ChevronDown className="w-3.5 h-3.5 text-pink-500 animate-bounce flex-shrink-0" />
            <span>Scroll to explore</span>
          </div>
        </footer>

      </div>
    </section>
  );
};
