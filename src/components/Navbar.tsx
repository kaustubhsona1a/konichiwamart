import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Heart, 
  User, 
  Instagram, 
  Menu, 
  X, 
  Package, 
  Info, 
  PhoneCall, 
  MessageCircle,
  Sparkles,
  ExternalLink,
  Sun,
  Moon
} from 'lucide-react';
import { ProductCategory } from '../types';
import { KonichiwaMartLogo } from './KonichiwaMartLogo';

interface NavbarProps {
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenAccount: () => void;
  onOpenAbout?: () => void;
  onOpenContact?: () => void;
  onNavigateToProducts?: () => void;
  onOpenAdmin?: () => void;
  onOpenSecurityGuide?: () => void;
  selectedCategory?: ProductCategory;
  onSelectCategory: (category: ProductCategory) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  storeName?: string;
  storeTagline?: string;
  logoUrl?: string;
  instagramUrl?: string;
  instagramHandle?: string;
  activePage?: 'store' | 'about';
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  wishlistCount,
  onOpenCart,
  onOpenWishlist,
  onOpenAccount,
  onOpenAbout,
  onOpenContact,
  onNavigateToProducts,
  onSelectCategory,
  storeName = 'Konichiwa.Mart',
  storeTagline = 'Tokyo Skincare',
  logoUrl,
  instagramUrl = 'https://www.instagram.com',
  instagramHandle = '@konichiwa.mart',
  activePage = 'store',
  isDarkMode = false,
  onToggleTheme
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleProductsClick = () => {
    setMobileMenuOpen(false);
    if (onNavigateToProducts) {
      onNavigateToProducts();
    } else {
      onSelectCategory('All');
      const el = document.getElementById('collection');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAboutClick = () => {
    setMobileMenuOpen(false);
    if (onOpenAbout) onOpenAbout();
  };

  const handleContactClick = () => {
    setMobileMenuOpen(false);
    if (onOpenContact) onOpenContact();
  };

  const handleLogoClick = () => {
    setMobileMenuOpen(false);
    onSelectCategory('All');
    if (onNavigateToProducts) {
      onNavigateToProducts();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 w-full bg-white/85 dark:bg-[#09090b]/90 backdrop-blur-md border-b border-pink-200/50 dark:border-zinc-800/80 shadow-xs supports-[backdrop-filter]:bg-white/75 dark:supports-[backdrop-filter]:bg-[#09090b]/80 transition-all duration-300">
      <div className="w-full px-3.5 sm:px-6 md:px-10 lg:px-12 py-2.5 sm:py-3 flex items-center justify-between">
        
        {/* Left: Logo & Branding */}
        <div className="flex items-center gap-2">
          <button 
            onClick={handleLogoClick} 
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
              <span className="font-serif tracking-tight text-lg sm:text-2xl md:text-3xl text-slate-900 dark:text-white font-bold block leading-none group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                {storeName.includes('.') ? (
                  <>
                    {storeName.split('.')[0]}<span className="text-pink-600 dark:text-pink-400">.{storeName.split('.')[1]}</span>
                  </>
                ) : (
                  storeName
                )}
              </span>
              <span className="font-sans text-[9px] sm:text-[11px] md:text-[12px] text-slate-500 dark:text-zinc-400 tracking-wider block mt-0.5 font-medium uppercase">
                {storeTagline}
              </span>
            </div>
          </button>
        </div>

        {/* Center: Desktop Quick Links */}
        <nav 
          id="header-quick-links"
          className="hidden md:flex items-center gap-1 lg:gap-2 px-2.5 py-1 rounded-2xl bg-pink-50/40 dark:bg-zinc-900/80 border border-pink-100/60 dark:border-zinc-800"
        >
          {/* Products Quick Link */}
          <button
            id="nav-quick-link-products"
            onClick={handleProductsClick}
            className={`px-3 py-1.5 rounded-xl text-xs lg:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
              activePage === 'store'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-zinc-200 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-white/80 dark:hover:bg-zinc-800'
            }`}
          >
            <Package className={`w-3.5 h-3.5 ${activePage === 'store' ? 'text-white' : 'text-pink-500'}`} />
            <span>Products</span>
          </button>

          {/* About Us Quick Link */}
          <button
            id="nav-quick-link-about"
            onClick={handleAboutClick}
            className={`px-3 py-1.5 rounded-xl text-xs lg:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
              activePage === 'about'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-zinc-200 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-white/80 dark:hover:bg-zinc-800'
            }`}
          >
            <Info className={`w-3.5 h-3.5 ${activePage === 'about' ? 'text-white' : 'text-pink-500'}`} />
            <span>About Us</span>
          </button>

          {/* Contact Us Quick Link */}
          <button
            id="nav-quick-link-contact"
            onClick={handleContactClick}
            className="px-3 py-1.5 rounded-xl text-xs lg:text-sm font-semibold text-slate-700 dark:text-zinc-200 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-white/80 dark:hover:bg-zinc-800 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <PhoneCall className="w-3.5 h-3.5 text-pink-500" />
            <span>Contact Us</span>
          </button>

          {/* Instagram Link in Nav */}
          <a
            id="nav-quick-link-instagram"
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl text-xs lg:text-sm font-semibold text-slate-700 dark:text-zinc-200 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-white/80 dark:hover:bg-zinc-800 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 group"
            title={`Follow ${instagramHandle} on Instagram`}
          >
            <div className="w-4 h-4 rounded-md bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center p-0.5 shadow-2xs group-hover:scale-110 transition-transform">
              <Instagram className="w-3 h-3" />
            </div>
            <span>Instagram</span>
          </a>
        </nav>

        {/* Right: Action Icons (Theme Toggle, Instagram, Wishlist, Cart, Profile, Mobile Menu) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          {/* Theme Switcher Toggle */}
          {onToggleTheme && (
            <button
              id="header-theme-toggle-btn"
              onClick={onToggleTheme}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-pink-50/70 dark:bg-zinc-900 hover:bg-pink-100/80 dark:hover:bg-zinc-800 border border-pink-200/60 dark:border-zinc-800 flex items-center justify-center text-slate-700 dark:text-amber-400 hover:text-pink-600 dark:hover:text-amber-300 transition-all cursor-pointer active:scale-95 shadow-2xs group"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 group-hover:rotate-45" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700 transition-transform duration-300 group-hover:-rotate-12" />
              )}
            </button>
          )}

          {/* Direct Instagram Icon Button (visible on mobile & desktop) */}
          <a
            id="header-instagram-btn"
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-50/90 via-pink-50/90 to-purple-50/90 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 hover:from-amber-100 hover:via-pink-100 hover:to-purple-100 border border-pink-200/70 dark:border-zinc-800 flex items-center justify-center text-pink-600 dark:text-pink-300 hover:text-purple-700 dark:hover:text-purple-300 transition-all cursor-pointer active:scale-95 shadow-2xs group"
            title={`Follow on Instagram (${instagramHandle})`}
            aria-label="Instagram Profile"
          >
            <Instagram className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </a>

          {/* Wishlist Button */}
          <button
            id="header-wishlist-btn"
            onClick={onOpenWishlist}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-pink-50/70 dark:bg-zinc-900 hover:bg-pink-100/80 dark:hover:bg-zinc-800 border border-pink-200/60 dark:border-zinc-800 flex items-center justify-center text-slate-700 dark:text-zinc-200 hover:text-rose-600 dark:hover:text-rose-400 transition-all cursor-pointer active:scale-95 shadow-2xs"
            title="Saved Wishlist"
            aria-label="Wishlist"
          >
            <Heart className={`w-4 h-4 ${wishlistCount > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>

          {/* Cart Button with brand pink styling */}
          <button
            id="header-cart-btn"
            onClick={onOpenCart}
            className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-xs shadow-pink-600/25"
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
            id="header-account-btn"
            onClick={onOpenAccount}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-pink-50/70 dark:bg-zinc-900 hover:bg-pink-100/80 dark:hover:bg-zinc-800 border border-pink-200/60 dark:border-zinc-800 flex items-center justify-center text-slate-700 dark:text-zinc-200 hover:text-pink-600 dark:hover:text-pink-400 transition-all cursor-pointer active:scale-95 shadow-2xs"
            title="Account & Orders"
            aria-label="Profile and Orders"
          >
            <User className="w-4 h-4" />
          </button>

          {/* Mobile Menu Hamburger (Visible on small screens) */}
          <button
            id="header-mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-900 hover:bg-pink-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:text-pink-600 dark:hover:text-pink-400 flex items-center justify-center transition-colors cursor-pointer border border-transparent dark:border-zinc-800"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Quick Menu */}
      {mobileMenuOpen && (
        <div 
          id="mobile-quick-menu"
          className="md:hidden border-t border-pink-100 dark:border-zinc-800 bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-xl px-4 py-3.5 space-y-2 shadow-xl animate-in slide-in-from-top-2 duration-200"
        >
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleProductsClick}
              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors text-left ${
                activePage === 'store'
                  ? 'bg-pink-600 text-white border-pink-500 shadow-xs'
                  : 'bg-pink-50/60 dark:bg-zinc-900/90 hover:bg-pink-100/70 dark:hover:bg-zinc-800 border-pink-100 dark:border-zinc-800 text-slate-800 dark:text-zinc-200'
              }`}
            >
              <Package className={`w-4 h-4 ${activePage === 'store' ? 'text-white' : 'text-pink-600'}`} />
              <span>Products</span>
            </button>

            <button
              onClick={handleAboutClick}
              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors text-left ${
                activePage === 'about'
                  ? 'bg-pink-600 text-white border-pink-500 shadow-xs'
                  : 'bg-pink-50/60 dark:bg-zinc-900/90 hover:bg-pink-100/70 dark:hover:bg-zinc-800 border-pink-100 dark:border-zinc-800 text-slate-800 dark:text-zinc-200'
              }`}
            >
              <Info className={`w-4 h-4 ${activePage === 'about' ? 'text-white' : 'text-pink-600'}`} />
              <span>About Us</span>
            </button>

            <button
              onClick={handleContactClick}
              className="p-2.5 rounded-xl bg-pink-50/60 dark:bg-zinc-900/90 hover:bg-pink-100/70 dark:hover:bg-zinc-800 border border-pink-100 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors text-left"
            >
              <PhoneCall className="w-4 h-4 text-pink-600" />
              <span>Contact Us</span>
            </button>

            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl bg-purple-50/60 dark:bg-zinc-900/90 hover:bg-purple-100/70 dark:hover:bg-zinc-800 border border-purple-100 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 text-xs font-bold flex items-center justify-between cursor-pointer transition-colors text-left group"
            >
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-md bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center p-0.5">
                  <Instagram className="w-3 h-3" />
                </div>
                <span>Instagram</span>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-purple-600" />
            </a>
          </div>

          {/* Mobile Theme Toggle Row */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="w-full p-2.5 rounded-xl bg-pink-50/60 dark:bg-zinc-900/90 hover:bg-pink-100/70 dark:hover:bg-zinc-800 border border-pink-100 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 text-xs font-bold flex items-center justify-between cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                {isDarkMode ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-600" />
                )}
                <span>Appearance Mode</span>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200">
                {isDarkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}
              </span>
            </button>
          )}

          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
            <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-zinc-300">
              <Sparkles className="w-3 h-3 text-pink-500" />
              Direct Tokyo Skincare
            </span>
            <a
              href="https://wa.me/919820012345"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
            >
              <MessageCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              WhatsApp Help
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
