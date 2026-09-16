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

  React.useEffect(() => {
    setSelectedImageIndex(0);
  }, [product.id]);

  const handleAdd = () => {
    onAddToCart(product, quantity, selectedShade);
    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-pink-950/35 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div 
        className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl p-5 md:p-8 max-h-[92vh] overflow-y-auto text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors cursor-pointer z-20 border border-slate-200 dark:border-zinc-700 shadow-xs"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Left: Product Images Stage */}
          <div className="md:col-span-5 space-y-3">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-50 dark:bg-zinc-950 p-6 border border-slate-200 dark:border-zinc-800 flex items-center justify-center shadow-inner">
              <img
                src={galleryImages[selectedImageIndex] || product.image}
                alt={product.title}
                className="w-full h-full object-contain filter drop-shadow-[0_10px_20px_rgba(15,23,42,0.12)] transition-all duration-200"
                referrerPolicy="no-referrer"
              />
              
              <div className="absolute top-4 left-4 px-2.5 py-1 rounded-md bg-pink-100 dark:bg-pink-950/80 text-pink-800 dark:text-pink-300 text-xs font-semibold border border-pink-200 dark:border-pink-800/60 shadow-xs">
                {product.routine} Routine
              </div>

              <button
                onClick={() => onToggleWishlist(product.id)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            </div>

            {/* Product Photo Gallery Thumbnails (if multiple photos) */}
            {galleryImages.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-14 h-14 rounded-xl border-2 overflow-hidden flex-shrink-0 bg-white dark:bg-slate-800 p-1 transition-all cursor-pointer ${
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
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#111524] border border-slate-200 dark:border-slate-800">
                🇯🇵 100% Japan Import
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#111524] border border-slate-200 dark:border-slate-800">
                ✨ Tested Safe
              </div>
            </div>
          </div>

          {/* Right: Product Details & Purchase Engine */}
          <div className="md:col-span-7 space-y-4">
            
            {/* Header info */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-md bg-pink-100 dark:bg-pink-950/80 border border-pink-200 dark:border-pink-800/60 text-pink-800 dark:text-pink-300 text-xs font-semibold">
                  {product.category}
                </span>
                <div className="flex items-center text-xs text-amber-500 gap-1">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="font-bold text-slate-900 dark:text-white">{product.rating}</span>
                  <span className="text-slate-500 dark:text-slate-400">({product.reviewsCount} reviews)</span>
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl text-slate-900 dark:text-white font-bold leading-snug">
                {product.title}
              </h2>
              <p className="text-sm sm:text-base text-pink-700 dark:text-pink-400 font-medium mt-1">
                {product.subtitle}
              </p>
            </div>

            {/* Price section */}
            <div className="flex items-baseline gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">
                {formatINR(product.price)}
              </span>
              {product.originalPrice > product.price && (
                <span className="text-base text-slate-400 line-through">
                  {formatINR(product.originalPrice)}
                </span>
              )}
            </div>

            {/* Shade Selection (for cosmetics, lipsticks, foundations, blushes) */}
            {product.shades && product.shades.length > 0 && (
              <div className="p-3.5 rounded-xl bg-pink-50/50 dark:bg-pink-950/20 border border-pink-100 dark:border-pink-950/40 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Select Shade: <span className="text-pink-600 dark:text-pink-400 font-bold">{selectedShade?.name || 'Default'}</span>
                  </span>
                  {selectedShade?.sku && (
                    <span className="text-[10px] font-mono text-slate-400">SKU: {selectedShade.sku}</span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {product.shades.map((shade) => {
                    const isSelected = selectedShade?.id === shade.id;
                    return (
                      <button
                        key={shade.id}
                        type="button"
                        onClick={() => setSelectedShade(shade)}
                        className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white dark:bg-slate-800 border-pink-500 shadow-xs ring-2 ring-pink-500/20 text-slate-900 dark:text-white'
                            : 'bg-white/70 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 hover:border-pink-300 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-black/15 shadow-inner flex-shrink-0"
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
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 flex items-center gap-2.5 text-xs text-slate-700 dark:text-zinc-300">
              <Truck className="w-4 h-4 text-pink-600 dark:text-pink-400 shrink-0" />
              <span className="font-medium text-slate-800 dark:text-zinc-200">3-5 day pan India delivery</span>
            </div>

            {/* Tabs for Details */}
            <div className="space-y-2 pt-1">
              <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 text-xs">
                {(['benefits', 'ingredients', 'howTo', 'reviews'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-2 transition-all cursor-pointer font-semibold capitalize ${
                      activeTab === tab
                        ? 'text-pink-600 border-b-2 border-pink-600'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab === 'howTo' ? 'How to Use' : tab}
                  </button>
                ))}
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed min-h-[90px] pt-1">
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

            {/* Bottom Add to Cart with Quantity */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3">
              {/* Quantity selector */}
              <div className="flex items-center rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-7 h-7 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-sm cursor-pointer"
                >
                  -
                </button>
                <span className="w-8 text-center text-xs font-bold text-slate-900 dark:text-white">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-7 h-7 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-sm cursor-pointer"
                >
                  +
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAdd}
                className={`flex-1 py-2.5 sm:py-3.5 px-4 sm:px-6 rounded-lg sm:rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
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

          </div>

        </div>

      </div>

    </div>
  );
};
