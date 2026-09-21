import React, { useState } from 'react';
import { 
  X, 
  Star, 
  Heart, 
  ShoppingBag, 
  Truck, 
  Sparkles, 
  CheckCircle2, 
  MapPin,
  Check
} from 'lucide-react';
import { Product, ProductShade } from '../types';
import { formatINR } from '../data/pincodes';

interface ProductModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, shade?: ProductShade) => void;
  onToggleWishlist: (productId: string) => void;
  isWishlisted: boolean;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onToggleWishlist,
  isWishlisted
}) => {
  const [selectedShade, setSelectedShade] = useState<ProductShade | undefined>(
    product.shades && product.shades.length > 0 ? product.shades[0] : undefined
  );
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'benefits' | 'ingredients' | 'howTo' | 'reviews'>('benefits');
  const [addedAnimation, setAddedAnimation] = useState(false);

  const galleryImages = React.useMemo(() => {
    if (product.images && product.images.length > 0) {
      return product.images;
    }
    const list = [product.image];
    if (product.secondaryImage && product.secondaryImage !== product.image) {
      list.push(product.secondaryImage);
    }
    return list;
  }, [product]);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const isComingSoon = Boolean(
    product.isComingSoon ||
    (product.badges || []).some(b => b.toLowerCase().includes('coming soon'))
  );

  React.useEffect(() => {
    setSelectedImageIndex(0);
  }, [product.id]);

  // Lock background body scroll and listen for ESC key
  React.useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleAdd = () => {
    onAddToCart(product, quantity, selectedShade);
    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      onClose();
    }, 700);
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto p-0 sm:p-4 md:p-6 flex justify-center items-end sm:items-center bg-black/60 sm:bg-pink-950/40 backdrop-blur-sm animate-in fade-in duration-200 overscroll-contain"
      onClick={onClose}
    >
      
      {/* Modal Container */}
      <div 
        className="relative w-full sm:max-w-4xl max-h-[92dvh] sm:max-h-[90vh] flex flex-col bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl text-left overflow-hidden sm:my-auto animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-2 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Handle Indicator */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center flex-shrink-0 bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800/50">
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-700" />
        </div>

        {/* Close Button - Sticky/Always visible at top-right */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 dark:bg-zinc-800/95 hover:bg-slate-100 dark:hover:bg-zinc-700 flex items-center justify-center text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-100 transition-all cursor-pointer z-30 border border-slate-200 dark:border-zinc-700 shadow-md active:scale-95"
          aria-label="Close product details"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:p-6 md:p-8 overscroll-contain">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-8 items-start">
            
            {/* Left: Product Images Stage */}
            <div className="md:col-span-5 space-y-3">
              <div className="relative aspect-square max-h-[260px] sm:max-h-[360px] md:max-h-none w-full mx-auto rounded-2xl overflow-hidden bg-slate-50 dark:bg-zinc-950 p-4 sm:p-6 border border-slate-200 dark:border-zinc-800 flex items-center justify-center shadow-inner">
                <img
                  src={galleryImages[selectedImageIndex] || product.image}
                  alt={product.title}
                  className="w-full h-full object-contain filter drop-shadow-[0_10px_20px_rgba(15,23,42,0.12)] transition-all duration-200"
                  referrerPolicy="no-referrer"
                />
                
                <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex flex-col gap-1.5 z-10">
                  {isComingSoon ? (
                    <div className="px-2.5 py-1 rounded-md bg-amber-500 text-white text-xs font-extrabold uppercase tracking-wider shadow-md flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Coming Soon</span>
                    </div>
                  ) : (
                    <div className="px-2.5 py-1 rounded-md bg-pink-100 dark:bg-pink-950/80 text-pink-800 dark:text-pink-300 text-xs font-semibold border border-pink-200 dark:border-pink-800/60 shadow-xs">
                      {product.routine} Routine
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onToggleWishlist(product.id)}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                  aria-label="Save to Wishlist"
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>
              </div>

              {/* Product Photo Gallery Thumbnails */}
              {galleryImages.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 overflow-hidden flex-shrink-0 bg-white dark:bg-slate-800 p-1 transition-all cursor-pointer ${
                        selectedImageIndex === idx
                          ? 'border-pink-600 ring-2 ring-pink-100 dark:ring-pink-950/60 scale-102'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 opacity-70 hover:opacity-100'
                      }`}
                      title={`View photo ${idx + 1}`}
                    >
                      <img
                        src={img}
                        alt={`${product.title} view ${idx + 1}`}
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-0 right-0 px-1 text-[8px] font-bold bg-slate-900/70 text-white rounded-tl">
                        {idx + 1}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Badges */}
              <div className="grid grid-cols-2 gap-2 text-center text-xs font-medium text-slate-600 dark:text-slate-300">
                <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-[#111524] border border-slate-200 dark:border-slate-800 text-[11px] sm:text-xs">
                  🇯🇵 100% Japan Import
                </div>
                <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-[#111524] border border-slate-200 dark:border-slate-800 text-[11px] sm:text-xs">
                  ✨ Tested Safe
                </div>
              </div>
            </div>

            {/* Right: Product Details */}
            <div className="md:col-span-7 space-y-3.5 sm:space-y-4">
              
              {/* Header info */}
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-md bg-pink-100 dark:bg-pink-950/80 border border-pink-200 dark:border-pink-800/60 text-pink-800 dark:text-pink-300 text-xs font-semibold">
                    {product.category}
                  </span>
                  {isComingSoon && (
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                      <Sparkles className="w-3 h-3" />
                      <span>Coming Soon</span>
                    </span>
                  )}
                  <div className="flex items-center text-xs text-amber-500 gap-1">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="font-bold text-slate-900 dark:text-white">{product.rating}</span>
                    <span className="text-slate-500 dark:text-slate-400">({product.reviewsCount} reviews)</span>
                  </div>
                </div>

                <h2 className="text-xl sm:text-2xl md:text-3xl text-slate-900 dark:text-white font-bold leading-snug">
                  {product.title}
                </h2>
                <p className="text-xs sm:text-sm md:text-base text-pink-700 dark:text-pink-400 font-medium mt-0.5 sm:mt-1">
                  {product.subtitle}
                </p>
              </div>

              {/* Price section */}
              <div className="flex items-baseline gap-2.5 pb-2.5 border-b border-slate-200 dark:border-slate-800">
                <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                  {formatINR(product.price)}
                </span>
                {product.originalPrice > product.price && (
                  <span className="text-sm sm:text-base text-slate-400 line-through">
                    {formatINR(product.originalPrice)}
                  </span>
                )}
                <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                  (Inclusive of all taxes)
                </span>
              </div>

              {/* Shade Selection (for cosmetics, lipsticks, foundations, blushes) */}
              {product.shades && product.shades.length > 0 && (
                <div className="p-3 rounded-xl bg-pink-50/50 dark:bg-pink-950/20 border border-pink-100 dark:border-pink-950/40 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Select Shade: <span className="text-pink-600 dark:text-pink-400 font-bold">{selectedShade?.name || 'Default'}</span>
                    </span>
                    {selectedShade?.sku && (
                      <span className="text-[10px] font-mono text-slate-400">SKU: {selectedShade.sku}</span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {product.shades.map((shade) => {
                      const isSelected = selectedShade?.id === shade.id;
                      return (
                        <button
                          key={shade.id}
                          type="button"
                          onClick={() => setSelectedShade(shade)}
                          className={`group relative flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-white dark:bg-slate-800 border-pink-500 shadow-xs ring-2 ring-pink-500/20 text-slate-900 dark:text-white'
                              : 'bg-white/70 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 hover:border-pink-300 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-black/15 shadow-inner flex-shrink-0"
                            style={{ backgroundColor: shade.hex }}
                          />
                          <span>{shade.name}</span>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-pink-600 ml-0.5 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Delivery Estimation */}
              <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 flex items-center gap-2.5 text-xs text-slate-700 dark:text-zinc-300">
                <Truck className="w-4 h-4 text-pink-600 dark:text-pink-400 shrink-0" />
                <span className="font-medium text-slate-800 dark:text-zinc-200">3-5 day pan India delivery</span>
              </div>

              {/* Tabs for Details */}
              <div className="space-y-2 pt-1">
                <div className="flex border-b border-slate-200 dark:border-slate-800 gap-3 sm:gap-4 text-xs overflow-x-auto scrollbar-none pb-0.5">
                  {(['benefits', 'ingredients', 'howTo', 'reviews'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`pb-2 transition-all cursor-pointer font-semibold capitalize whitespace-nowrap ${
                        activeTab === tab
                          ? 'text-pink-600 border-b-2 border-pink-600'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      {tab === 'howTo' ? 'How to Use' : tab}
                    </button>
                  ))}
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed min-h-[70px] pt-1">
                  {activeTab === 'benefits' && (
                    <ul className="space-y-1.5">
                      {product.benefits.map((b, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-pink-500 flex-shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {activeTab === 'ingredients' && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {product.keyActives.map((act, i) => (
                          <div key={i} className="p-2 rounded-lg bg-slate-50 dark:bg-[#111524] border border-slate-200 dark:border-slate-800">
                            <span className="font-semibold text-slate-900 dark:text-white">{act.name}</span>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{act.purpose}</p>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono leading-tight bg-slate-50 dark:bg-[#111524] p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                        Full Ingredients: {product.fullIngredients}
                      </p>
                    </div>
                  )}

                  {activeTab === 'howTo' && (
                    <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-[#111524] border border-slate-200 dark:border-slate-800">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">
                        Recommended Application:
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {product.usageHowTo}
                      </p>
                    </div>
                  )}

                  {activeTab === 'reviews' && (
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#111524] border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-900 dark:text-white">Ananya S. — Mumbai</span>
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">✓ Verified Buyer</span>
                        </div>
                        <div className="flex text-amber-500 text-xs my-0.5">★★★★★</div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">"Authentic Japanese skincare delivered safely. Skin feels clean and fresh without any tightness. Fast shipping."</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#111524] border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-900 dark:text-white">Rhea K. — Bangalore</span>
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">✓ Verified Buyer</span>
                        </div>
                        <div className="flex text-amber-500 text-xs my-0.5">★★★★★</div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">"Super gentle and effective. Happy that Konichiwa_Mart stocks real Japanese formulas in India."</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Bottom Pinned Action Bar - Always accessible on mobile and desktop */}
        <div className="flex-shrink-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-slate-200 dark:border-zinc-800 px-4 py-3 sm:px-6 sm:py-3.5 z-20">
          {isComingSoon ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="flex-1 p-2 sm:p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <div className="leading-tight">
                  <span className="font-bold">Launching Soon at Konichiwa Mart</span>
                  <span className="hidden sm:inline text-[11px] text-amber-700 dark:text-amber-300 ml-1.5">• Add to wishlist for restock alert!</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onToggleWishlist(product.id)}
                className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 cursor-pointer transition-colors whitespace-nowrap active:scale-95"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-white text-white' : ''}`} />
                <span>{isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Quantity selector */}
              <div className="flex items-center rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-1 py-0.5 sm:px-1.5 sm:py-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 flex items-center justify-center text-slate-700 dark:text-zinc-200 font-bold text-sm cursor-pointer active:scale-90"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="w-7 sm:w-8 text-center text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 flex items-center justify-center text-slate-700 dark:text-zinc-200 font-bold text-sm cursor-pointer active:scale-90"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                type="button"
                onClick={handleAdd}
                className={`flex-1 py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-[0.98] ${
                  addedAnimation
                    ? 'bg-emerald-600 text-white'
                    : 'bg-pink-600 hover:bg-pink-500 text-white shadow-pink-600/25'
                }`}
              >
                {addedAnimation ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Cart • {formatINR(product.price * quantity)}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
