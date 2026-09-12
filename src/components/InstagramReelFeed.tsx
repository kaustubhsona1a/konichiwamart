import React, { useState, useRef } from 'react';
import { 
  Play, 
  Volume2, 
  VolumeX, 
  Heart, 
  ShoppingBag, 
  Eye, 
  Sparkles, 
  Share2, 
  Check, 
  X,
  MessageCircle
} from 'lucide-react';
import { Product } from '../types';
import { PRODUCTS } from '../data/products';
import { formatINR } from '../data/pincodes';

interface InstagramReelFeedProps {
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  products?: Product[];
}

interface ReelItem {
  id: string;
  creatorHandle: string;
  creatorName: string;
  creatorAvatar: string;
  location: string;
  title: string;
  caption: string;
  views: string;
  likes: number;
  commentsCount: number;
  audioTrack: string;
  productId: string;
  videoThumb: string;
  videoUrl?: string;
  tags: string[];
}

const REELS: ReelItem[] = [
  {
    id: 'reel_01',
    creatorHandle: '@tokyo_daily_glow',
    creatorName: 'Hana Tanaka',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    location: 'Tokyo',
    title: 'The Viral Whipped Foam Method',
    caption: 'How to lather Senka Perfect Whip for that super-dense micro-foam pillow! ☁️ Zero friction on the skin and cleans pores so gently.',
    views: '1.8M',
    likes: 142800,
    commentsCount: 942,
    audioTrack: 'Gentle Lather ASMR - Tokyo Skincare',
    productId: 'senka-perfect-whip',
    videoThumb: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    tags: ['#SenkaPerfectWhip', '#JapaneseSkincare', '#FaceWash']
  },
  {
    id: 'reel_02',
    creatorHandle: '@glow_with_ria',
    creatorName: 'Ria Sengupta',
    creatorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    location: 'Mumbai',
    title: 'Dark Spot Fading with Vitamin C',
    caption: 'Testing the Rohto Melano CC Toner for 14 days. Look at the post-acne mark difference! 🍋 Active Vitamin C that actually absorbs quickly.',
    views: '2.1M',
    likes: 187400,
    commentsCount: 1120,
    audioTrack: 'Bright Morning - Acoustic Chill',
    productId: 'melano-cc-brightening-toner',
    videoThumb: 'https://images.unsplash.com/photo-1608248597359-009765369eb3?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    tags: ['#MelanoCC', '#VitaminCToner', '#DarkSpotCare']
  },
  {
    id: 'reel_03',
    creatorHandle: '@skincare_kenji',
    creatorName: 'Kenji Sato',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    location: 'Kyoto',
    title: 'Shiseido Fino Deep Nourish',
    caption: 'Why Fino Premium Touch Mask sells out across Shibuya pharmacies. Royal jelly essence that seals intense moisture within 5 minutes.',
    views: '3.4M',
    likes: 312000,
    commentsCount: 1850,
    audioTrack: 'Tokyo Evening Ambient',
    productId: 'fino-premium-touch-mask',
    videoThumb: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    tags: ['#FinoMask', '#JapaneseBeauty', '#FaceMask']
  },
  {
    id: 'reel_04',
    creatorHandle: '@delhi_skingirl',
    creatorName: 'Ananya Sharma',
    creatorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    location: 'Delhi NCR',
    title: 'Zero White Cast SPF in Indian Heat',
    caption: 'Bioré UV Aqua Rich tested under harsh 42°C Delhi sun! Watery essence that melts invisible into all skin tones. No sweat streaks!',
    views: '4.2M',
    likes: 421000,
    commentsCount: 2310,
    audioTrack: 'Summer Breeze Tokyo Beats',
    productId: 'biore-uv-aqua-rich-sunscreen',
    videoThumb: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    tags: ['#BioreUV', '#WateryEssence', '#NoWhiteCast']
  }
];

export const InstagramReelFeed: React.FC<InstagramReelFeedProps> = ({
  onSelectProduct,
  onAddToCart,
  products
}) => {
  const catalog = products && products.length > 0 ? products : PRODUCTS;
  const [activeReelModal, setActiveReelModal] = useState<ReelItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [likedReels, setLikedReels] = useState<Record<string, boolean>>({});
  const [addedItemNotice, setAddedItemNotice] = useState<string | null>(null);
  const [activeMobileIdx, setActiveMobileIdx] = useState(0);
  const [mobileViewMode, setMobileViewMode] = useState<'carousel' | 'grid'>('carousel');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const toggleLike = (id: string) => {
    setLikedReels(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleShopProduct = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product);
    setAddedItemNotice(product.title);
    setTimeout(() => setAddedItemNotice(null), 2500);
  };

  const openReelModal = (reel: ReelItem) => {
    setActiveReelModal(reel);
    setIsPlaying(true);
    setIsMuted(true);
  };

  const closeReelModal = () => {
    setActiveReelModal(null);
  };

  const handleMobileScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, clientWidth } = scrollContainerRef.current;
    if (clientWidth > 0) {
      const newIdx = Math.round(scrollLeft / (clientWidth * 0.78));
      setActiveMobileIdx(Math.min(Math.max(newIdx, 0), REELS.length - 1));
    }
  };

  const scrollToReel = (idx: number) => {
    if (!scrollContainerRef.current) return;
    const cardWidth = scrollContainerRef.current.clientWidth * 0.78;
    scrollContainerRef.current.scrollTo({
      left: idx * cardWidth,
      behavior: 'smooth'
    });
    setActiveMobileIdx(idx);
  };

  return (
    <section id="reels" className="relative py-8 sm:py-14 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
      
      {/* SECTION HEADER: Clean Skincare Palette, High Contrast */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 sm:mb-6 gap-3 sm:gap-4 text-left">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-pink-100 dark:bg-pink-950/60 border border-pink-200 dark:border-pink-800/60 text-pink-800 dark:text-pink-300 text-[10px] sm:text-xs font-semibold tracking-wide mb-1.5 sm:mb-2">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-pink-500 dark:text-pink-400" />
            <span>COMMUNITY REELS • 60-SEC REVIEWS</span>
          </div>

          <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            See Products in Real Motion
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-normal mt-0.5 sm:mt-1 max-w-xl leading-relaxed">
            Real routines and textures. Watch quick guides on how to apply each Japanese skincare essential.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          {/* Mobile Layout Switcher */}
          <div className="flex sm:hidden items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setMobileViewMode('carousel')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                mobileViewMode === 'carousel'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Swipe Reel
            </button>
            <button
              onClick={() => setMobileViewMode('grid')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                mobileViewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Grid
            </button>
          </div>

          {/* Instagram Follow Pill */}
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-xs transition-all cursor-pointer"
          >
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 flex items-center justify-center text-white text-[9px] sm:text-[10px] font-bold">
              IG
            </div>
            <span>Follow @konichiwa_mart</span>
            <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-normal">• 124K</span>
          </a>
        </div>
      </div>

      {/* REELS CONTAINER: Responsive Carousel on Mobile for generous screen occupation */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleMobileScroll}
        className={
          mobileViewMode === 'carousel'
            ? 'flex overflow-x-auto snap-x snap-mandatory gap-3 sm:gap-4 lg:gap-5 pb-3 pt-1 -mx-3 px-3 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible scrollbar-none'
            : 'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-5'
        }
      >
        {REELS.map((reel) => {
          const featuredProduct = catalog.find(p => p.id === reel.productId) || catalog[0];

          return (
            <div
              key={reel.id}
              onClick={() => openReelModal(reel)}
              className={`group relative rounded-2xl md:rounded-3xl overflow-hidden bg-pink-50/50 border border-pink-200/80 shadow-md shadow-pink-950/5 hover:border-pink-400 hover:shadow-xl hover:shadow-pink-400/20 transition-all duration-300 cursor-pointer flex flex-col justify-between p-3 sm:p-3.5 select-none ${
                mobileViewMode === 'carousel'
                  ? 'w-[78vw] max-w-[320px] flex-shrink-0 snap-center sm:w-auto aspect-[9/15] sm:aspect-[9/16]'
                  : 'w-full aspect-[9/14] sm:aspect-[9/16]'
              }`}
            >
              {/* Background Thumbnail Image with subtle hover zoom */}
              <img
                src={reel.videoThumb}
                alt={reel.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none"
                referrerPolicy="no-referrer"
              />

              {/* Gradient Scrim for text readability */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80 pointer-events-none" />

              {/* TOP REEL BAR: Creator info & Views */}
              <div className="relative z-10 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <img
                    src={reel.creatorAvatar}
                    alt={reel.creatorName}
                    className="w-7 h-7 sm:w-6 sm:h-6 rounded-full object-cover border border-white/80 shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-xs sm:text-[11px] font-medium tracking-wide truncate max-w-[120px] sm:max-w-[90px] drop-shadow-sm">
                    {reel.creatorHandle}
                  </span>
                </div>

                <div className="flex items-center gap-1 bg-white/30 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold text-white border border-white/40 shadow-2xs">
                  <Eye className="w-3 h-3 text-pink-200" />
                  <span>{reel.views}</span>
                </div>
              </div>

              {/* CENTER: Play Button Indicator */}
              <div className="relative z-10 my-auto flex items-center justify-center">
                <div className="w-12 h-12 sm:w-11 sm:h-11 rounded-full bg-white/35 backdrop-blur-md border border-white/60 flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110">
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                </div>
              </div>

              {/* BOTTOM: Title & Tagged Product Pill */}
              <div className="relative z-10 space-y-2 sm:space-y-2.5 text-white text-left">
                <p className="text-xs sm:text-xs font-semibold leading-snug line-clamp-2 drop-shadow-md text-white">
                  {reel.title}
                </p>

                {/* Tagged Product Chip - Crisp Light Baby Pink Surface */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectProduct(featuredProduct);
                  }}
                  className="bg-white/95 hover:bg-white text-slate-900 rounded-xl p-2 flex items-center justify-between gap-2 shadow-lg border border-pink-200/90 transition-all backdrop-blur-md"
                >
                  <div className="flex items-center gap-2 truncate min-w-0">
                    <img
                      src={featuredProduct.image}
                      alt={featuredProduct.title}
                      className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg object-contain bg-pink-50 flex-shrink-0 p-0.5 border border-pink-100"
                      referrerPolicy="no-referrer"
                    />
                    <div className="truncate min-w-0">
                      <div className="text-[11px] sm:text-[10px] font-semibold truncate text-slate-800">{featuredProduct.title}</div>
                      <div className="text-[11px] sm:text-[10px] text-pink-600 font-bold">{formatINR(featuredProduct.price)}</div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleShopProduct(featuredProduct, e)}
                    className="w-7 h-7 sm:w-6 sm:h-6 rounded-lg bg-pink-600 text-white flex items-center justify-center flex-shrink-0 hover:bg-pink-500 transition-colors cursor-pointer shadow-xs active:scale-90"
                    title="Add to Cart"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* MOBILE CAROUSEL DOT INDICATORS */}
      {mobileViewMode === 'carousel' && (
        <div className="flex sm:hidden items-center justify-center gap-1.5 pt-2">
          {REELS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollToReel(idx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                activeMobileIdx === idx
                  ? 'w-6 bg-pink-600'
                  : 'w-1.5 bg-slate-300 hover:bg-slate-400'
              }`}
              title={`Go to reel ${idx + 1}`}
            />
          ))}
        </div>
      )}


      {/* REEL FULLSCREEN VIEWER MODAL */}
      {activeReelModal && (
        <div className="fixed inset-0 z-50 bg-pink-950/45 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          
          {/* Close Backdrop Button */}
          <button
            onClick={closeReelModal}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center transition-all cursor-pointer z-50 border border-pink-200 shadow-md"
            title="Close Reel"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Reel Container (9:16 vertical frame) */}
          <div className="relative w-full max-w-[380px] h-[88vh] max-h-[720px] rounded-3xl overflow-hidden bg-slate-950 shadow-2xl border border-pink-300/30 flex flex-col justify-between">
            
            {/* Video Element */}
            <div 
              className="absolute inset-0 cursor-pointer"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {activeReelModal.videoUrl ? (
                <video
                  ref={videoRef}
                  src={activeReelModal.videoUrl}
                  poster={activeReelModal.videoThumb}
                  autoPlay={isPlaying}
                  loop
                  muted={isMuted}
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={activeReelModal.videoThumb}
                  alt={activeReelModal.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              )}

              {/* Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/90 pointer-events-none" />

              {/* Paused State Indicator Overlay */}
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="w-16 h-16 rounded-full bg-white/35 backdrop-blur-md border border-white/60 flex items-center justify-center text-white">
                    <Play className="w-8 h-8 fill-white ml-1" />
                  </div>
                </div>
              )}
            </div>

            {/* TOP BAR: Creator Details */}
            <div className="relative z-20 p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <img
                  src={activeReelModal.creatorAvatar}
                  alt={activeReelModal.creatorName}
                  className="w-9 h-9 rounded-full object-cover border-2 border-white/80"
                  referrerPolicy="no-referrer"
                />
                <div className="text-left">
                  <div className="text-xs font-semibold flex items-center gap-1.5">
                    <span>{activeReelModal.creatorHandle}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                  </div>
                  <div className="text-[10px] text-pink-100">{activeReelModal.location}</div>
                </div>
              </div>

              {/* Sound Toggle Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
                className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/60 transition-colors cursor-pointer"
                title={isMuted ? 'Unmute audio' : 'Mute audio'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            {/* RIGHT SIDE FLOATING SOCIAL INTERACTIONS */}
            <div className="relative z-20 self-end pr-4 pb-24 flex flex-col items-center gap-5 text-white">
              
              {/* Like Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLike(activeReelModal.id);
                }}
                className="flex flex-col items-center gap-1 group cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  likedReels[activeReelModal.id] 
                    ? 'bg-rose-600 text-white scale-110' 
                    : 'bg-black/40 backdrop-blur-md text-white border border-white/20 group-hover:bg-black/60'
                }`}>
                  <Heart className={`w-5 h-5 ${likedReels[activeReelModal.id] ? 'fill-white' : ''}`} />
                </div>
                <span className="text-[11px] font-medium">
                  {likedReels[activeReelModal.id] ? (activeReelModal.likes + 1).toLocaleString() : activeReelModal.likes.toLocaleString()}
                </span>
              </button>

              {/* Comments */}
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-medium">{activeReelModal.commentsCount}</span>
              </div>

              {/* Share */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard?.writeText(window.location.href);
                }}
                className="flex flex-col items-center gap-1 text-white cursor-pointer"
                title="Share Reel Link"
              >
                <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/60">
                  <Share2 className="w-5 h-5" />
                </div>
                <span className="text-[10px]">Share</span>
              </button>
            </div>

            {/* BOTTOM OVERLAY: Caption & Featured Product Card */}
            <div className="relative z-20 p-4 pt-0 space-y-3 text-white text-left">
              
              {/* Title & Caption */}
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white drop-shadow-md">
                  {activeReelModal.title}
                </h4>
                <p className="text-xs text-slate-100 font-light line-clamp-2 leading-relaxed">
                  {activeReelModal.caption}
                </p>
                <div className="text-[10px] text-pink-200 font-mono">
                  {activeReelModal.audioTrack}
                </div>
              </div>

              {/* SHOP FEATURED PRODUCT CARD - Crisp Light Baby Pink Style */}
              {(() => {
                const prod = catalog.find(p => p.id === activeReelModal.productId) || catalog[0];
                if (!prod) return null;
                return (
                  <div className="bg-white/95 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 border border-pink-200 dark:border-zinc-800 rounded-2xl p-2.5 flex items-center justify-between gap-3 shadow-2xl backdrop-blur-md">
                    <div 
                      onClick={() => {
                        closeReelModal();
                        onSelectProduct(prod);
                      }}
                      className="flex items-center gap-2.5 truncate cursor-pointer flex-1"
                    >
                      <img
                        src={prod.image}
                        alt={prod.title}
                        className="w-11 h-11 rounded-xl object-contain bg-pink-50 dark:bg-zinc-800 border border-pink-100 dark:border-zinc-700 p-1"
                        referrerPolicy="no-referrer"
                      />
                      <div className="truncate">
                        <div className="text-[10px] text-pink-600 dark:text-pink-400 uppercase tracking-wider font-bold">Featured Product</div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{prod.title}</div>
                        <div className="text-xs font-black text-pink-600 dark:text-pink-400">{formatINR(prod.price)}</div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleShopProduct(prod, e)}
                      className="py-2 px-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-pink-600/25 transition-all flex-shrink-0 cursor-pointer active:scale-95"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                );
              })()}

            </div>

          </div>

        </div>
      )}

      {/* Temporary Toast Notice */}
      {addedItemNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-pink-600 text-white border border-pink-400 text-xs font-semibold py-2.5 px-4 rounded-full shadow-2xl shadow-pink-600/30 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Added "{addedItemNotice}" to Cart!</span>
        </div>
      )}

    </section>
  );
};
