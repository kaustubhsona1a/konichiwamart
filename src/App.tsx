import React, { useState, useMemo, useEffect } from 'react';
import { 
  Sparkles, 
  Droplet, 
  ShieldCheck, 
  Truck, 
  Layers, 
  Star, 
  Filter, 
  Search, 
  Heart, 
  ShoppingBag,
  SlidersHorizontal,
  ChevronRight,
  ArrowUpRight,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { 
  Product, 
  ProductCategory, 
  SkinConcern, 
  SkinType, 
  CartItem, 
  UserProfile, 
  Order, 
  ProductShade,
  UserAddress,
  SiteSettings
} from './types';
import { PRODUCTS, CATEGORIES } from './data/products';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { RazorpayModal } from './components/RazorpayModal';
import { InvoiceModal } from './components/InvoiceModal';
import { AccountPortal } from './components/AccountPortal';
import { AdminPortal } from './components/AdminPortal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { SecurityGuideModal } from './components/SecurityGuideModal';
import { Footer } from './components/Footer';
import { InstagramReelFeed } from './components/InstagramReelFeed';
import { ReviewsSection } from './components/ReviewsSection';
import { saveOrderToSupabase } from './lib/supabase';
import { FallingPetalsBackground } from './components/FallingPetalsBackground';
import { formatINR } from './data/pincodes';
import { getStoredOperatorSession, operatorLogout, OperatorSession } from './lib/supabase';

// Initial dummy user with realistic Indian context & past order
const INITIAL_PROFILE: UserProfile = {
  id: 'usr_priya_01',
  name: 'Priya Sharma',
  email: 'priya.sharma@example.com',
  phone: '+91 98201 98421',
  addresses: [
    {
      id: 'addr_01',
      fullName: 'Priya Sharma',
      phone: '+91 98201 98421',
      addressLine1: 'Flat 402, Lotus Grand Residences, 14th Road',
      addressLine2: 'Off Linking Road, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      tag: 'Home',
      isDefault: true
    },
    {
      id: 'addr_02',
      fullName: 'Priya Sharma (Office)',
      phone: '+91 98201 98421',
      addressLine1: 'Tech Nexus Hub, Level 5, Embassy GolfLinks',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560071',
      tag: 'Office',
      isDefault: false
    }
  ],
  wishlistIds: ['fino-premium-touch-mask', 'biore-uv-aqua-rich-sunscreen'],
  orders: [
    {
      id: 'ord_demo_101',
      orderNumber: 'KM-89210',
      invoiceNumber: 'INV-2026-4819',
      date: '28 Aug 2026, 04:30 PM',
      items: [
        {
          productId: 'senka-perfect-whip',
          title: 'Senka Perfect Whip Cleanser',
          volume: '120g',
          price: 650,
          quantity: 1,
          image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80'
        },
        {
          productId: 'biore-uv-aqua-rich-sunscreen',
          title: 'Bioré UV Aqua Rich Watery Essence SPF 50+',
          volume: '50g',
          price: 1250,
          quantity: 1,
          image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80'
        }
      ],
      subtotal: 1900,
      cgst: 145,
      sgst: 145,
      shippingFee: 0,
      discountAmount: 285,
      discountCode: 'GLOW15',
      totalAmount: 1615,
      paymentMethod: 'UPI',
      paymentId: 'pay_RPZ_98421094',
      signature: 'sig_hmac_sha256_9b83f120e8',
      status: 'IN_TRANSIT',
      shippingAddress: {
        id: 'addr_01',
        fullName: 'Priya Sharma',
        phone: '+91 98201 98421',
        addressLine1: 'Flat 402, Lotus Grand Residences, 14th Road',
        addressLine2: 'Off Linking Road, Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400050',
        tag: 'Home',
        isDefault: true
      },
      awbNumber: 'AWB-SR984210948',
      courierPartner: 'Blue Dart Air Express',
      estimatedDeliveryDate: 'Tomorrow by 4 PM',
      trackingHistory: [
        { time: '28 Aug 2026, 05:00 PM', location: 'AURA Labs, Mumbai', activity: 'Package Picked up by Blue Dart' },
        { time: '29 Aug 2026, 09:30 AM', location: 'Mumbai Western Hub', activity: 'Departed Facility in Transit to Local Center' }
      ]
    }
  ]
};

export default function App() {
  // Storefront Dynamic Products State (persists operator changes in localStorage)
  const [productsList, setProductsList] = useState<Product[]>(() => {
    try {
      const deletedJson = localStorage.getItem('km_deleted_product_ids');
      const deletedIds = new Set<string>(deletedJson ? JSON.parse(deletedJson) : []);
      const saved = localStorage.getItem('km_custom_products');
      if (saved) {
        const parsed: Product[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((p) => !deletedIds.has(p.id));
        }
      } else if (deletedIds.size > 0) {
        return PRODUCTS.filter((p) => !deletedIds.has(p.id));
      }
    } catch {}
    return PRODUCTS;
  });

  // Products & Filtering State
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('All');
  const [selectedConcern, setSelectedConcern] = useState<string>('All');
  const [selectedSkinType, setSelectedSkinType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart & Wishlist State
  const [cart, setCart] = useState<CartItem[]>([
    {
      product: PRODUCTS[0],
      quantity: 1
    },
    {
      product: PRODUCTS[3],
      quantity: 1
    }
  ]);
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_PROFILE);

  // Modals Visibility
  const [inspectProduct, setInspectProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [operatorSession, setOperatorSession] = useState<OperatorSession | null>(() => getStoredOperatorSession());
  const [isSecurityGuideOpen, setIsSecurityGuideOpen] = useState(false);
  const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<Order | null>(null);

  // Site Settings (Store background, Logo, Flower drift controls)
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
    try {
      const saved = localStorage.getItem('km_site_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          backgroundHintOpacity: 'balanced',
          ...parsed
        };
      }
    } catch {}
    return {
      storeName: 'Konichiwa.Mart',
      storeTagline: 'Tokyo Skincare',
      heroBannerUrl: localStorage.getItem('km_hero_banner_data') || '/hero-banner.png',
      backgroundHintOpacity: 'balanced',
      flowerDriftEnabled: true,
      flowerDriftSpeed: 'gentle',
      flowerDriftDensity: 'medium'
    };
  });

  const handleUpdateSiteSettings = (newSettings: Partial<SiteSettings>) => {
    setSiteSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('km_site_settings', JSON.stringify(updated));
      return updated;
    });
  };

  // Hidden Operator Access Handler
  const handleRequestAdminAccess = () => {
    const session = getStoredOperatorSession();
    if (session) {
      setOperatorSession(session);
      setIsAdminOpen(true);
    } else {
      setIsAdminLoginOpen(true);
    }
  };

  // Keyboard shortcut (Ctrl+Shift+A / Cmd+Shift+A) & Secret URL (?admin=true / #admin) trigger
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        handleRequestAdminAccess();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'true' || window.location.hash === '#admin') {
      handleRequestAdminAccess();
    }

    // Verify if custom hero banner exists on the server and ensure latest version is loaded
    fetch('/api/banner-status')
      .then(res => res.json())
      .then(data => {
        if (data?.exists) {
          const freshBannerUrl = `/hero-banner.png?v=${Date.now()}`;
          setSiteSettings(prev => ({
            ...prev,
            heroBannerUrl: freshBannerUrl
          }));
        }
      })
      .catch(() => {});

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Inventory & Stock Controls
  const handleUpdateProductStock = (productId: string, inStock: boolean, stockCount?: number) => {
    setProductsList((prev) => {
      const updated = prev.map((p) => {
        if (p.id === productId) {
          const finalStock = stockCount !== undefined 
            ? Math.max(0, stockCount) 
            : (inStock ? (p.stock > 0 ? p.stock : 50) : 0);
          return {
            ...p,
            stock: finalStock
          };
        }
        return p;
      });
      localStorage.setItem('km_custom_products', JSON.stringify(updated));
      return updated;
    });
  };

  const handleUpdateProductPrice = (productId: string, newPrice: number) => {
    setProductsList((prev) => {
      const updated = prev.map((p) => {
        if (p.id === productId) {
          return {
            ...p,
            price: Math.max(1, newPrice)
          };
        }
        return p;
      });
      localStorage.setItem('km_custom_products', JSON.stringify(updated));
      return updated;
    });
  };

  // New Product Upload Handler
  const handleAddProduct = (newProduct: Product) => {
    setProductsList((prev) => {
      const updated = [newProduct, ...prev];
      localStorage.setItem('km_custom_products', JSON.stringify(updated));
      return updated;
    });
  };

  // Remove Product Handler
  const handleRemoveProduct = (productId: string) => {
    setProductsList((prev) => {
      const updated = prev.filter((p) => p.id !== productId);
      localStorage.setItem('km_custom_products', JSON.stringify(updated));
      return updated;
    });

    try {
      const deletedJson = localStorage.getItem('km_deleted_product_ids');
      const deletedIds: string[] = deletedJson ? JSON.parse(deletedJson) : [];
      if (!deletedIds.includes(productId)) {
        deletedIds.push(productId);
        localStorage.setItem('km_deleted_product_ids', JSON.stringify(deletedIds));
      }
    } catch {}

    // Also remove from cart if present
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    if (inspectProduct?.id === productId) {
      setInspectProduct(null);
    }
  };

  // Restore Original Catalog Handler
  const handleResetDefaultProducts = () => {
    localStorage.removeItem('km_deleted_product_ids');
    localStorage.removeItem('km_custom_products');
    setProductsList(PRODUCTS);
  };

  // Active Promo applied from Cart
  const [checkoutDiscount, setCheckoutDiscount] = useState<{ promoCode?: string; discountAmount: number }>({
    promoCode: 'GLOW15',
    discountAmount: 0
  });

  // Filtered Products Logic
  const filteredProducts = useMemo(() => {
    return productsList.filter((p) => {
      // Category filter
      if (selectedCategory !== 'All' && p.category !== selectedCategory) {
        return false;
      }
      // Concern filter
      if (selectedConcern !== 'All' && !p.skinConcerns.includes(selectedConcern as SkinConcern)) {
        return false;
      }
      // Skin type filter
      if (selectedSkinType !== 'All' && !p.skinTypes.includes('All') && !p.skinTypes.includes(selectedSkinType as SkinType)) {
        return false;
      }
      // Search text query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesSubtitle = p.subtitle.toLowerCase().includes(q);
        const matchesCategory = p.category.toLowerCase().includes(q);
        const matchesActives = p.keyActives.some(a => a.name.toLowerCase().includes(q));
        if (!matchesTitle && !matchesSubtitle && !matchesCategory && !matchesActives) {
          return false;
        }
      }
      return true;
    });
  }, [productsList, selectedCategory, selectedConcern, selectedSkinType, searchQuery]);

  // Cart operations
  const handleAddToCart = (product: Product, quantity = 1, shade?: ProductShade) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.product.id === product.id && item.selectedShade?.id === shade?.id
      );

      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantity;
        return updated;
      }

      return [
        ...prev,
        {
          product,
          quantity,
          selectedShade: shade || (product.shades ? product.shades[0] : undefined)
        }
      ];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number, shadeId?: string) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId && item.selectedShade?.id === shadeId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveItem = (productId: string, shadeId?: string) => {
    setCart((prev) => prev.filter(i => !(i.product.id === productId && i.selectedShade?.id === shadeId)));
  };

  // Wishlist toggle
  const handleToggleWishlist = (productId: string) => {
    setUserProfile((prev) => {
      const exists = prev.wishlistIds.includes(productId);
      return {
        ...prev,
        wishlistIds: exists
          ? prev.wishlistIds.filter(id => id !== productId)
          : [...prev.wishlistIds, productId]
      };
    });
  };

  const isWishlisted = (productId: string) => userProfile.wishlistIds.includes(productId);

  // Proceed from Cart to Razorpay
  const handleProceedToCheckout = (appliedPromo?: string, discountAmount = 0) => {
    setCheckoutDiscount({
      promoCode: appliedPromo,
      discountAmount
    });
    setIsCartOpen(false);
    setIsRazorpayOpen(true);
  };

  // On Razorpay Payment Success
  const handlePaymentSuccess = async (newOrder: Order) => {
    setIsRazorpayOpen(false);
    setUserProfile((prev) => ({
      ...prev,
      orders: [newOrder, ...prev.orders]
    }));
    setCart([]); // Clear cart
    setActiveInvoiceOrder(newOrder); // Automatically open official GST invoice

    // Persist to Supabase orders and order_items tables
    try {
      await saveOrderToSupabase(newOrder, userProfile?.id);
    } catch (syncErr) {
      console.warn('[Supabase Sync Warning]:', syncErr);
    }
  };

  // Update order status in admin portal
  const handleUpdateOrderStatus = (orderId: string, status: Order['status']) => {
    setUserProfile((prev) => ({
      ...prev,
      orders: prev.orders.map(o => o.id === orderId ? { ...o, status } : o)
    }));
  };

  const totalCartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartSubtotal = cart.reduce((sum, i) => sum + (i.product.price * i.quantity), 0);
  const shippingFee = cartSubtotal >= 999 || cartSubtotal === 0 ? 0 : 99;
  const defaultAddress: UserAddress = userProfile.addresses.find(a => a.isDefault) || userProfile.addresses[0];

  return (
    <div className="min-h-screen bg-[#FFF0F3] text-[#1E293B] font-sans selection:bg-pink-200 selection:text-pink-900 relative">
      
      {/* PERSISTENT AMBIENT BACKGROUND LAYER (Visible as an artistic hint upon scrolling across the store) */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        {/* Fixed background image with smooth parallax hint */}
        <div 
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700 ${
            siteSettings.backgroundHintOpacity === 'subtle'
              ? 'opacity-[0.16]'
              : siteSettings.backgroundHintOpacity === 'pronounced'
              ? 'opacity-[0.35]'
              : 'opacity-[0.24]'
          }`}
          style={{
            backgroundImage: `url(${siteSettings.backgroundImageUrl || siteSettings.heroBannerUrl || '/hero-banner.png'})`,
            backgroundAttachment: 'fixed',
          }}
        />
        {/* Soft Japanese paper warmth / gentle gradient overlay so all text and product cards remain crisp and legible */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FFF0F3]/60 via-[#FFF5F7]/75 to-[#FFF0F3]/85" />
        
        {/* Delicate Sakura Blossom Dot Pattern Texture */}
        <div className="absolute inset-0 bg-[radial-gradient(#f472b6_0.8px,transparent_0.8px)] [background-size:28px_28px] opacity-15" />
      </div>
      
      {/* Floating Header Navigation */}
      <Navbar
        cartCount={totalCartCount}
        wishlistCount={userProfile.wishlistIds.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsAccountOpen(true)}
        onOpenAccount={() => setIsAccountOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenSecurityGuide={() => setIsSecurityGuideOpen(true)}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        storeName={siteSettings.storeName}
        storeTagline={siteSettings.storeTagline}
        logoUrl={siteSettings.logoUrl}
      />

      {/* RESTORED SPRING EFFECT: Falling Petals Canvas Controlled from Site Settings */}
      <FallingPetalsBackground 
        isActive={siteSettings.flowerDriftEnabled}
        breezeMode={siteSettings.flowerDriftSpeed}
        density={siteSettings.flowerDriftDensity}
      />

      {/* 1. HERO SECTION: CINEMATIC PANORAMIC JAPANESE BEAUTY BANNER */}
      <HeroBanner
        onSelectProduct={setInspectProduct}
        onAddToCart={handleAddToCart}
        onToggleWishlist={handleToggleWishlist}
        isWishlisted={isWishlisted}
        onApplyCoupon={() => setIsCartOpen(true)}
        customBannerUrl={siteSettings.heroBannerUrl}
      />

      {/* 2. MAIN PRODUCT CATALOG */}
      <main id="collection" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-12 sm:pt-16 md:pt-20 pb-12 sm:pb-20">
        
        {/* Simplified Section Header */}
        <div className="mb-4 sm:mb-6 text-left">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
            Our Collection
          </h2>
        </div>

        {/* Clean Category Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2.5 sm:pb-4 mb-3 sm:mb-6 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as ProductCategory)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs transition-all whitespace-nowrap cursor-pointer border ${
                selectedCategory === cat.id
                  ? 'bg-pink-600 hover:bg-pink-500 text-white border-pink-500 shadow-md shadow-pink-600/30 font-semibold'
                  : 'bg-white hover:bg-pink-50/40 text-slate-700 border-slate-200 font-medium shadow-xs'
              }`}
            >
              {cat.name}
            </button>
          ))}
          {selectedCategory !== 'All' && (
            <button
              onClick={() => setSelectedCategory('All')}
              className="text-xs text-pink-600 hover:underline px-2 cursor-pointer font-medium"
            >
              Clear Filter
            </button>
          )}
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white border border-pink-100 rounded-2xl p-8 sm:p-12 text-center space-y-3 shadow-md">
            <div className="w-12 h-12 rounded-full bg-pink-50 mx-auto flex items-center justify-center text-pink-600">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">No products match this query</h3>
            <p className="text-xs text-slate-600">
              Try resetting your category or concern filters to view all products.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedConcern('All');
                setSearchQuery('');
              }}
              className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold cursor-pointer shadow-md"
            >
              Show All Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={setInspectProduct}
                onAddToCart={handleAddToCart}
                onToggleWishlist={handleToggleWishlist}
                isWishlisted={isWishlisted(product.id)}
              />
            ))}
          </div>
        )}

      </main>

      {/* 3. CUSTOMER REVIEWS SECTION */}
      <ReviewsSection
        onSelectProduct={setInspectProduct}
      />

      {/* 4. INSTAGRAM REEL FEED SECTION: Video reviews & community as social proof */}
      <InstagramReelFeed
        onSelectProduct={setInspectProduct}
        onAddToCart={handleAddToCart}
      />

      {/* FOOTER */}
      <Footer
        onOpenSecurityGuide={() => setIsSecurityGuideOpen(true)}
        onOpenAdmin={handleRequestAdminAccess}
      />

      {/* MODALS */}
      {/* 1. Product Detail Modal */}
      {inspectProduct && (
        <ProductModal
          product={inspectProduct}
          onClose={() => setInspectProduct(null)}
          onAddToCart={handleAddToCart}
          onToggleWishlist={handleToggleWishlist}
          isWishlisted={isWishlisted(inspectProduct.id)}
        />
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onProceedToCheckout={handleProceedToCheckout}
      />

      {/* 4. Razorpay Checkout & Order Verification */}
      <RazorpayModal
        isOpen={isRazorpayOpen}
        onClose={() => setIsRazorpayOpen(false)}
        items={cart}
        subtotal={cartSubtotal}
        discountAmount={checkoutDiscount.discountAmount}
        discountCode={checkoutDiscount.promoCode}
        shippingFee={shippingFee}
        shippingAddress={defaultAddress}
        userProfile={userProfile}
        onUpdateProfile={setUserProfile}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* 5. Official Indian GST Tax Invoice Modal */}
      <InvoiceModal
        order={activeInvoiceOrder}
        isOpen={!!activeInvoiceOrder}
        onClose={() => setActiveInvoiceOrder(null)}
        onTrackOrder={(order) => {
          setIsAccountOpen(true);
        }}
      />

      {/* 6. Customer Account & Order History Portal */}
      <AccountPortal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        profile={userProfile}
        onUpdateProfile={setUserProfile}
        onViewInvoice={(order) => setActiveInvoiceOrder(order)}
        onAddToCart={handleAddToCart}
        onRemoveWishlist={handleToggleWishlist}
      />

      {/* 7. Operator Login Gate (Supabase Auth / Secret Operator Gateway) */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={(session) => {
          setOperatorSession(session);
          setIsAdminLoginOpen(false);
          setIsAdminOpen(true);
        }}
      />

      {/* 8. Store Owner Operations & Admin Portal */}
      <AdminPortal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        orders={userProfile.orders}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onViewInvoice={(order) => setActiveInvoiceOrder(order)}
        products={productsList}
        onUpdateProductStock={handleUpdateProductStock}
        onUpdateProductPrice={handleUpdateProductPrice}
        onAddProduct={handleAddProduct}
        onRemoveProduct={handleRemoveProduct}
        onResetDefaultProducts={handleResetDefaultProducts}
        onLogout={() => {
          operatorLogout();
          setOperatorSession(null);
          setIsAdminOpen(false);
        }}
        operatorEmail={operatorSession?.email}
        siteSettings={siteSettings}
        onUpdateSiteSettings={handleUpdateSiteSettings}
      />

      {/* 9. Architecture & Security Blueprint Modal */}
      <SecurityGuideModal
        isOpen={isSecurityGuideOpen}
        onClose={() => setIsSecurityGuideOpen(false)}
      />

    </div>
  );
}
