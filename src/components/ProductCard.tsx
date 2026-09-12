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
      className="group liquid-glass rounded-2xl p-3 sm:p-4 border border-white/90 hover:border-pink-300 shadow-md hover:shadow-xl flex flex-col justify-between cursor-pointer relative transition-all duration-300 text-left"
    >
      {/* Product Image Container with floating Wishlist Button */}
      <div className="relative aspect-[4/3] sm:aspect-square w-full rounded-xl overflow-hidden mb-2.5 sm:mb-3 bg-white/70 border border-slate-200/70 flex items-center justify-center p-2 sm:p-4 group-hover:border-pink-200 transition-colors">
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(15,23,42,0.12)] transition-transform duration-300 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product.id);
          }}
          className="absolute top-2 right-2 w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-lg bg-white/90 hover:bg-white flex items-center justify-center text-slate-500 hover:text-rose-500 border border-slate-200/80 transition-colors cursor-pointer shadow-xs z-10"
          title="Save to Wishlist"
          aria-label="Save to Wishlist"
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>
      </div>

      {/* Product Name */}
      <div className="flex-1 mb-2">
        <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug group-hover:text-pink-700 transition-colors line-clamp-2">
          {product.title}
        </h3>
      </div>

      {/* Price & Stock Status + Add to Cart Button */}
      <div className="pt-2 border-t border-slate-200/70 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm sm:text-base font-bold text-slate-900">
            {formatINR(product.price)}
          </span>
          <span className={`text-[10px] sm:text-xs font-semibold ${isInStock ? 'text-emerald-700' : 'text-rose-600'}`}>
            {isInStock ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleQuickAdd}
          disabled={!isInStock}
          className={`w-full py-1.5 sm:py-2.5 px-2.5 sm:px-3 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
            !isInStock
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : addedAnimation
                ? 'bg-emerald-500 text-white'
                : 'bg-pink-600 hover:bg-pink-500 text-white shadow-pink-600/25'
          }`}
          title="Add to Cart"
        >
          {addedAnimation ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Added</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{isInStock ? 'Add to Cart' : 'Out of Stock'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
