import React from 'react';
import { 
  ShoppingBag, 
  Heart, 
  User
} from 'lucide-react';
import { ProductCategory } from '../types';
import { KonichiwaMartLogo } from './KonichiwaMartLogo';

interface NavbarProps {
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenAccount: () => void;
  onOpenAdmin?: () => void;
  onOpenSecurityGuide?: () => void;
  selectedCategory?: ProductCategory;
  onSelectCategory: (category: ProductCategory) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  storeName?: string;
  storeTagline?: string;
  logoUrl?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  wishlistCount,
  onOpenCart,
  onOpenWishlist,
  onOpenAccount,
  onSelectCategory,
  storeName = 'Konichiwa.Mart',
  storeTagline = 'Tokyo Skincare',
  logoUrl
}) => {
  return (
    <header className="fixed top-0 inset-x-0 z-50 w-full bg-white/70 backdrop-blur-md border-b border-pink-200/50 shadow-xs supports-[backdrop-filter]:bg-white/60 transition-all duration-300">
      <div className="w-full px-4 sm:px-8 md:px-12 py-2.5 sm:py-3 flex items-center justify-between">
        
        {/* Logo & Branding */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onSelectCategory('All')} 
            className="group text-left cursor-pointer flex items-center gap-2.5 sm:gap-3"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 flex-shrink-0 flex items-center justify-center drop-shadow-xs overflow-hidden">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt={storeName} 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <KonichiwaMartLogo size={44} />
              )}
            </div>
            <div>
              <span className="font-serif tracking-tight text-lg sm:text-2xl md:text-3xl text-slate-900 font-bold block leading-none group-hover:text-pink-600 transition-colors">
                {storeName.includes('.') ? (
                  <>
                    {storeName.split('.')[0]}<span className="text-pink-600">.{storeName.split('.')[1]}</span>
                  </>
                ) : (
                  storeName
                )}
              </span>
              <span className="font-sans text-[9px] sm:text-[11px] md:text-[12px] text-slate-500 tracking-wider block mt-0.5 font-medium uppercase">
                {storeTagline}
              </span>
            </div>
          </button>
        </div>

        {/* Right Action Icons: Wishlist, Cart, and Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Wishlist Button */}
          <button
            onClick={onOpenWishlist}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-pink-50/70 hover:bg-pink-100/80 border border-pink-200/60 flex items-center justify-center text-slate-700 hover:text-rose-600 transition-all cursor-pointer active:scale-95 shadow-2xs"
            title="Saved Wishlist"
            aria-label="Wishlist"
          >
            <Heart className={`w-4 h-4 ${wishlistCount > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>

          {/* Cart Button with darker pink styling */}
          <button
            onClick={onOpenCart}
            className="h-8 sm:h-9 px-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-xs shadow-pink-600/25"
            title="Shopping Cart"
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="text-xs font-bold font-mono px-1.5 rounded-full bg-white text-pink-600 leading-none py-0.5 shadow-2xs">
                {cartCount}
              </span>
            )}
          </button>

          {/* Account Profile */}
          <button
            onClick={onOpenAccount}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-pink-50/70 hover:bg-pink-100/80 border border-pink-200/60 flex items-center justify-center text-slate-700 hover:text-pink-600 transition-all cursor-pointer active:scale-95 shadow-2xs"
            title="Account & Orders"
            aria-label="Profile and Orders"
          >
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
