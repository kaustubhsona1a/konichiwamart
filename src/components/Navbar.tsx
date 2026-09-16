import React, { useState, useRef, useEffect } from 'react';
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
  Moon,
  ShieldCheck,
  ChevronDown,
  UserPlus,
  LogIn
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
  isCustomerLoggedIn?: boolean;
  customerName?: string;
  onOpenCustomerAuth?: (tab?: 'signin' | 'register') => void;
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
  storeTagline = 'Japanese Skincare',
  logoUrl,
  instagramUrl = 'https://www.instagram.com/konichiwa_mart?stkn=MTRrM3I1a21la2cwOQ%3D%3D&utm_source=qr',
  instagramHandle = '@konichiwa_mart',
  activePage = 'store',
  isDarkMode = false,
  onToggleTheme,
  onOpenAdmin,
  onOpenSecurityGuide,
  isCustomerLoggedIn = false,
  customerName,
  onOpenCustomerAuth
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleProductsClick = () => {
    setDropdownOpen(false);
    if (onNavigateToProducts) {
      onNavigateToProducts();
    } else {
      onSelectCategory('All');
      const el = document.getElementById('collection');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAboutClick = () => {
    setDropdownOpen(false);
    if (onOpenAbout) onOpenAbout();
  };

  const handleContactClick = () => {
    setDropdownOpen(false);
    if (onOpenContact) onOpenContact();
  };

  const handleWishlistClick = () => {
    setDropdownOpen(false);
    onOpenWishlist();
  };

  const handleAccountClick = () => {
    setDropdownOpen(false);
    if (isCustomerLoggedIn) {
      onOpenAccount();
    } else if (onOpenCustomerAuth) {
      onOpenCustomerAuth('signin');
    } else {
      onOpenAccount();
    }
  };

  const logoTapCountRef = useRef(0);
  const logoTapTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogoClick = () => {
    logoTapCountRef.current += 1;
    if (logoTapTimerRef.current) {
      clearTimeout(logoTapTimerRef.current);
    }

    if (logoTapCountRef.current >= 3) {
      logoTapCountRef.current = 0;
      if (onOpenAdmin) {
        onOpenAdmin();
        return;
      }
    } else {
      logoTapTimerRef.current = setTimeout(() => {
        logoTapCountRef.current = 0;
      }, 700);
    }

    setDropdownOpen(false);
    onSelectCategory('All');
    if (onNavigateToProducts) {
      onNavigateToProducts();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 w-full bg-white/90 dark:bg-[#09090b]/95 backdrop-blur-md border-b border-pink-200/50 dark:border-zinc-800/80 shadow-xs supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-[#09090b]/85 transition-all duration-300">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2">
        
        {/* Left: Logo & Branding */}
        <div className="flex items-center min-w-0 flex-shrink">
          <button 
            id="header-brand-logo-btn"
            onClick={handleLogoClick} 
            className="group text-left cursor-pointer flex items-center gap-2 sm:gap-2.5 min-w-0"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 flex items-center justify-center drop-shadow-xs overflow-hidden rounded-full bg-white dark:bg-zinc-900 border border-pink-100 dark:border-zinc-800">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt={storeName} 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <KonichiwaMartLogo size={38} />
              )}
            </div>
            <div className="truncate">
              <span className="font-serif tracking-tight text-base sm:text-xl text-slate-900 dark:text-white font-bold block leading-tight truncate group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                {storeName.includes('.') ? (
                  <>
                    {storeName.split('.')[0]}<span className="text-pink-600 dark:text-pink-400">.{storeName.split('.')[1]}</span>
                  </>
                ) : (
                  storeName
                )}
              </span>
              <span className="font-sans text-[9px] sm:text-[10px] text-slate-500 dark:text-zinc-400 tracking-wider block font-medium uppercase truncate">
                {storeTagline}
              </span>
            </div>
          </button>
        </div>

        {/* Right Action Area: Instagram logo, Cart, and Dropdown Menu button */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          
          {/* Instagram Logo Button */}
          <a
            id="header-instagram-btn"
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-50/90 via-pink-50/90 to-purple-50/90 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 hover:from-amber-100 hover:via-pink-100 hover:to-purple-100 border border-pink-200/70 dark:border-zinc-800 flex items-center justify-center text-pink-600 dark:text-pink-400 hover:text-purple-700 dark:hover:text-purple-300 transition-all cursor-pointer active:scale-95 shadow-2xs group"
            title={`Follow on Instagram (${instagramHandle})`}
            aria-label="Instagram Profile"
          >
            <Instagram className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </a>

          {/* Cart Button */}
          <button
            id="header-cart-btn"
            onClick={onOpenCart}
            className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-xs shadow-pink-600/25"
            title="Shopping Cart"
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 ? (
              <span className="text-xs font-bold font-mono px-1.5 py-0.5 rounded-full bg-white text-pink-600 leading-none shadow-2xs">
                {cartCount}
              </span>
            ) : (
              <span className="hidden sm:inline text-xs font-semibold">Cart</span>
            )}
          </button>

          {/* Master Dropdown Menu (Contains Wishlist, Account, Products, About, Contact, Theme Toggle, Staff Portal) */}
          <div className="relative" ref={dropdownRef}>
            <button
              id="header-dropdown-menu-toggle"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl border flex items-center gap-1.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-95 ${
                dropdownOpen
                  ? 'bg-pink-100 dark:bg-zinc-800 border-pink-300 dark:border-zinc-700 text-pink-700 dark:text-pink-300'
                  : 'bg-pink-50/70 dark:bg-zinc-900 hover:bg-pink-100/80 dark:hover:bg-zinc-800 border-pink-200/60 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 hover:text-pink-600 dark:hover:text-pink-400 shadow-2xs'
              }`}
              aria-label="Menu and Options"
              aria-expanded={dropdownOpen}
            >
              <Menu className="w-4 h-4" />
              <span className="hidden sm:inline">Menu</span>
              {wishlistCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title={`${wishlistCount} items in wishlist`} />
              )}
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Card / Menu Overlay */}
            {dropdownOpen && (
              <div
                id="header-options-dropdown"
                className="absolute right-0 mt-2 w-64 sm:w-72 rounded-2xl bg-white/98 dark:bg-[#121215]/98 backdrop-blur-xl border border-pink-200/60 dark:border-zinc-800 shadow-xl shadow-stone-900/10 p-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1 text-left"
              >
                {/* 1. Account & Wishlist Quick Actions */}
                <div className="grid grid-cols-2 gap-1.5 pb-1">
                  <button
                    id="dropdown-account-btn"
                    onClick={handleAccountClick}
                    className="h-9 px-3 rounded-xl bg-stone-50 dark:bg-zinc-850 hover:bg-pink-50 dark:hover:bg-zinc-800 border border-stone-200/60 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 flex items-center justify-center gap-2 transition-colors cursor-pointer text-xs font-semibold"
                  >
                    <User className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
                    <span className="truncate max-w-[85px]">
                      {isCustomerLoggedIn && customerName ? customerName.split(' ')[0] : 'Sign In'}
                    </span>
                  </button>

                  <button
                    id="dropdown-wishlist-btn"
                    onClick={handleWishlistClick}
                    className="h-9 px-3 rounded-xl bg-stone-50 dark:bg-zinc-850 hover:bg-rose-50 dark:hover:bg-zinc-800 border border-stone-200/60 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs font-semibold"
                  >
                    <Heart className={`w-3.5 h-3.5 ${wishlistCount > 0 ? 'fill-rose-500 text-rose-500' : 'text-slate-500 dark:text-zinc-400'}`} />
                    <span>Wishlist</span>
                    {wishlistCount > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500 text-white leading-none">
                        {wishlistCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Optional Customer Register Shortcut if not logged in */}
                {!isCustomerLoggedIn && (
                  <button
                    id="dropdown-customer-register-btn"
                    onClick={() => {
                      setDropdownOpen(false);
                      if (onOpenCustomerAuth) {
                        onOpenCustomerAuth('register');
                      } else {
                        onOpenAccount();
                      }
                    }}
                    className="w-full mb-1 py-1.5 px-2.5 rounded-xl bg-rose-50/70 hover:bg-rose-100/90 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 border border-rose-200/70 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-between text-xs font-semibold transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <UserPlus className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      <span>New Customer?</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-200/70 dark:bg-rose-900/80 px-1.5 py-0.5 rounded text-rose-800 dark:text-rose-200">
                      Register
                    </span>
                  </button>
                )}

                {/* 2. Core Navigation */}
                <div className="pt-1 border-t border-stone-100 dark:border-zinc-800/80 space-y-0.5">
                  <button
                    id="dropdown-nav-products"
                    onClick={handleProductsClick}
                    className={`w-full h-8.5 px-2.5 rounded-xl text-xs font-medium flex items-center justify-between cursor-pointer transition-colors ${
                      activePage === 'store'
                        ? 'bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300 font-semibold'
                        : 'text-slate-700 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-850'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Package className={`w-4 h-4 ${activePage === 'store' ? 'text-pink-600 dark:text-pink-400' : 'text-slate-400 dark:text-zinc-500'}`} />
                      <span>Products & Catalog</span>
                    </div>
                    {activePage === 'store' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                    )}
                  </button>

                  <button
                    id="dropdown-nav-about"
                    onClick={handleAboutClick}
                    className={`w-full h-8.5 px-2.5 rounded-xl text-xs font-medium flex items-center justify-between cursor-pointer transition-colors ${
                      activePage === 'about'
                        ? 'bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300 font-semibold'
                        : 'text-slate-700 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-850'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Info className={`w-4 h-4 ${activePage === 'about' ? 'text-pink-600 dark:text-pink-400' : 'text-slate-400 dark:text-zinc-500'}`} />
                      <span>About Us</span>
                    </div>
                    {activePage === 'about' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                    )}
                  </button>

                  <button
                    id="dropdown-nav-contact"
                    onClick={handleContactClick}
                    className="w-full h-8.5 px-2.5 rounded-xl text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-850 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <PhoneCall className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
                      <span>Contact & Support</span>
                    </div>
                  </button>
                </div>

                {/* 3. Appearance & Security */}
                <div className="pt-1 border-t border-stone-100 dark:border-zinc-800/80 space-y-0.5">
                  {onToggleTheme && (
                    <div className="w-full h-8.5 px-2.5 rounded-xl text-xs font-medium text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        {isDarkMode ? (
                          <Moon className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <Sun className="w-4 h-4 text-amber-500" />
                        )}
                        <span>Dark Mode</span>
                      </div>
                      <button
                        id="dropdown-theme-toggle-btn"
                        type="button"
                        onClick={onToggleTheme}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                          isDarkMode ? 'bg-pink-600' : 'bg-stone-300 dark:bg-zinc-700'
                        }`}
                        aria-label="Toggle dark mode"
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            isDarkMode ? 'translate-x-4.5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  )}

                  {onOpenSecurityGuide && (
                    <button
                      id="dropdown-security-guide-btn"
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenSecurityGuide();
                      }}
                      className="w-full h-8.5 px-2.5 rounded-xl text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-850 flex items-center justify-between cursor-pointer transition-colors text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <span>Genuine Guarantee</span>
                      </div>
                    </button>
                  )}

                  <a
                    id="dropdown-whatsapp-btn"
                    href="https://wa.me/919820012345"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-8.5 px-2.5 rounded-xl text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400">
                      <MessageCircle className="w-4 h-4 text-emerald-500" />
                      <span>WhatsApp Support</span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-emerald-500 opacity-60" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
