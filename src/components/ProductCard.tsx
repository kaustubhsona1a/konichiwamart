import React, { useState } from 'react';
import { Heart, ShoppingBag, Check } from 'lucide-react';
import { Product, ProductShade } from '../types';
import { formatINR } from '../data/pincodes';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onAddToCart: (product: Product, shade?: ProductShade) => void;
  onToggleWishlist: (productId: string) => void;
  isWishlisted: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onAddToCart,
  onToggleWishlist,
  isWishlisted
}) => {
  const [selectedShade] = useState<ProductShade | undefined>(
    product.shades ? product.shades[0] : undefined
  );
  const [addedAnimation, setAddedAnimation] = useState(false);

  const isInStock = (product.stock ?? 0) > 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isInStock) return;
    onAddToCart(product, selectedShade);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1400);
  };

  return (
    <div
      onClick={() => onSelect(product)}
      className="group liquid-glass rounded-2xl p-2.5 sm:p-4 border border-white/90 dark:border-zinc-800/80 hover:border-pink-300 dark:hover:border-pink-500/50 shadow-xs hover:shadow-md dark:shadow-none flex flex-col justify-between cursor-pointer relative transition-all duration-300 text-left bg-white/80 dark:bg-zinc-900/80"
    >
      {/* Product Image Container with floating Wishlist Button */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-2 sm:mb-3 bg-white dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-center p-2.5 sm:p-4 group-hover:border-pink-200 dark:group-hover:border-pink-500/30 transition-colors shadow-2xs">
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(15,23,42,0.10)] transition-transform duration-300 group-hover:scale-105"
          referrerPolicy="no-referrer"
          loading="lazy"
        />

        {/* Wishlist Button - Touch optimized */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product.id);
          }}
          className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/95 dark:bg-zinc-800/95 hover:bg-white dark:hover:bg-zinc-700 flex items-center justify-center text-slate-500 dark:text-zinc-300 hover:text-rose-500 border border-slate-200/90 dark:border-zinc-700 transition-colors cursor-pointer shadow-xs z-10 active:scale-90"
          title="Save to Wishlist"
          aria-label="Save to Wishlist"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        {/* Volume / Category chip on image */}
        {product.volume && (
          <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xs text-[9px] sm:text-[10px] font-semibold text-slate-600 dark:text-zinc-300 border border-slate-200/70 dark:border-zinc-800 shadow-2xs">
            {product.volume}
          </span>
        )}
      </div>

      {/* Product Title */}
      <div className="flex-1 mb-2">
        <h3 className="font-bold text-[12.5px] sm:text-sm text-slate-900 dark:text-zinc-100 leading-snug group-hover:text-pink-700 dark:group-hover:text-pink-400 transition-colors line-clamp-2 min-h-[2.1rem] sm:min-h-[2.5rem]">
          {product.title}
        </h3>
      </div>

      {/* Price & Stock Status + Add to Cart Button */}
      <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 space-y-2">
        <div className="flex items-center justify-between gap-1">
          <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight">
            {formatINR(product.price)}
          </span>
          <span className={`text-[10px] sm:text-[11px] font-semibold px-1.5 py-0.5 rounded ${isInStock ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300' : 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300'}`}>
            {isInStock ? 'In Stock' : 'Sold Out'}
          </span>
        </div>

        {/* Add to Cart Button - Minimum 40px touch height */}
        <button
          onClick={handleQuickAdd}
          disabled={!isInStock}
          className={`w-full min-h-[38px] sm:min-h-[42px] py-2 sm:py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
            !isInStock
              ? 'bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed'
              : addedAnimation
                ? 'bg-emerald-600 text-white'
                : 'bg-pink-600 hover:bg-pink-500 text-white shadow-pink-600/20 hover:shadow-md'
          }`}
          title="Add to Cart"
        >
          {addedAnimation ? (
            <>
              <Check className="w-4 h-4" />
              <span>Added!</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{isInStock ? 'Add to Cart' : 'Out of Stock'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
