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
  SiteSettings,
  ReelItem
} from './types';
import { PRODUCTS, CATEGORIES } from './data/products';
import { 
  getStoredReels, 
  saveStoredReels, 
  fetchServerReels,
  KONICHIWA_INSTAGRAM_URL, 
  KONICHIWA_INSTAGRAM_HANDLE 
} from './data/reels';
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
import { CustomerAuthModal } from './components/CustomerAuthModal';
import { SecurityGuideModal } from './components/SecurityGuideModal';
import { Footer } from './components/Footer';
import { InstagramReelFeed } from './components/InstagramReelFeed';
import { ReviewsSection } from './components/ReviewsSection';
import { AboutUsModal } from './components/AboutUsModal';
import { AboutUsPage } from './components/AboutUsPage';
import { ContactUsModal } from './components/ContactUsModal';
import { ResetPasswordModal } from './components/ResetPasswordModal';
import { 
  saveOrderToSupabase, 
  getStoredOperatorSession, 
  operatorLogout, 
  OperatorSession,
  getSupabaseClient,
  fetchProductsFromStore,
  deleteProductFromStore,
  updateProductInStore,
  addProductToStore,
  resetProductsInStore,
  getActiveCustomerSession,
  customerSignOut,
  fetchCustomerAddressesFromSupabase,
  fetchCustomerOrdersFromSupabase,
  fetchAllOrdersFromSupabase,
  updateOrderStatusInSupabase,
  saveAddressToSupabase
} from './lib/supabase';
import { FallingPetalsBackground } from './components/FallingPetalsBackground';
import { formatINR } from './data/pincodes';

// Clean initial customer profile with zero dummy data
const EMPTY_PROFILE: UserProfile = {
  id: '',
  name: '',
  email: '',
  phone: '',
  addresses: [],
  wishlistIds: [],
  orders: []
};

// Purge any lingering legacy dummy data (Priya Sharma / demo test records)
const cleanLegacyData = (addresses: UserAddress[] = [], orders: Order[] = []) => {
  const cleanAddrs = (addresses || []).filter(a =>
    !a.fullName?.toLowerCase().includes('priya sharma') &&
    !a.addressLine1?.toLowerCase().includes('lotus grand') &&
    !a.addressLine1?.toLowerCase().includes('tech nexus hub')
  );
  const cleanOrds = (orders || []).filter(o =>
    o.orderNumber !== 'KM-89210' &&
    o.id !== 'ord_demo_101'
  );
  return { cleanAddrs, cleanOrds };
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

  // Store-wide orders (for admin portal & store management)
  const [storeOrders, setStoreOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('km_store_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  // Customer Profile (isolated strictly to active customer session)
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const session = getActiveCustomerSession();
    if (session) {
      const email = session.email.toLowerCase();
      let savedAddrs: UserAddress[] = [];
      let savedOrds: Order[] = [];
      let savedWish: string[] = [];
      try {
        const rawA = localStorage.getItem(`km_customer_addresses_${email}`);
        if (rawA) savedAddrs = JSON.parse(rawA);
        if (savedAddrs.length === 0) {
          const lastA = localStorage.getItem(`km_customer_last_addr_${email}`) || localStorage.getItem('km_last_delivery_address');
          if (lastA) {
            const parsed = JSON.parse(lastA);
            if (parsed && parsed.addressLine1) savedAddrs = [parsed];
          }
        }
        const rawO = localStorage.getItem(`km_customer_orders_${email}`);
        if (rawO) savedOrds = JSON.parse(rawO);
        const rawW = localStorage.getItem(`km_customer_wishlist_${email}`);
        if (rawW) savedWish = JSON.parse(rawW);
      } catch {}
      const { cleanAddrs, cleanOrds } = cleanLegacyData(savedAddrs, savedOrds);
      return {
        id: session.id,
        name: session.name || email.split('@')[0],
        email: session.email,
        phone: session.phone || (cleanAddrs[0]?.phone ? cleanAddrs[0].phone : ''),
        addresses: cleanAddrs,
        orders: cleanOrds,
        wishlistIds: savedWish
      };
    }

    // Guest / returning customer profile fallback
    let fallbackAddrs: UserAddress[] = [];
    try {
      const last = localStorage.getItem('km_last_delivery_address');
      if (last) {
        const parsed = JSON.parse(last);
        if (parsed && parsed.addressLine1) fallbackAddrs = [parsed];
      }
    } catch {}
    const storedPhone = localStorage.getItem('km_customer_phone') || '';
    const storedEmail = localStorage.getItem('km_customer_email') || '';
    return {
      id: '',
      name: fallbackAddrs[0]?.fullName || '',
      email: storedEmail,
      phone: storedPhone || fallbackAddrs[0]?.phone || '',
      addresses: fallbackAddrs,
      orders: [],
      wishlistIds: []
    };
  });

  // Cart State (clean, starts empty or restores real added items)
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('km_user_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  // Keep cart in localStorage
  
  useEffect(() => {
    // Check if URL has a Supabase password reset hash
    const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
    if (hashParams.get('type') === 'recovery' && hashParams.get('access_token')) {
      window.location.hash = ''; // Clear hash
      const newPassword = prompt('Password Recovery: Please enter your new password.');
      if (newPassword && newPassword.length >= 6) {
        // We will call the backend or supabase directly to update it.
        const client = getSupabaseClient();
        if (client) {
          client.auth.updateUser({ password: newPassword })
            .then(({ error }) => {
              if (error) {
                alert('Failed to update password: ' + error.message);
              } else {
                alert('Password updated successfully! You can now sign in.');
                setIsCustomerAuthOpen(true);
                setCustomerAuthTab('signin');
              }
            });
        }
      } else if (newPassword) {
        alert('Password must be at least 6 characters.');
      }
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('km_user_cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  // Modals Visibility
  const [inspectProduct, setInspectProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Hydrate store orders from Supabase on load and whenever Operator Portal is opened
  useEffect(() => {
    fetchAllOrdersFromSupabase().then(fetched => {
      if (Array.isArray(fetched)) {
        setStoreOrders(fetched);
        try {
          localStorage.setItem('km_store_orders', JSON.stringify(fetched));
        } catch {}
      }
    });
  }, [isAdminOpen]);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [operatorSession, setOperatorSession] = useState<OperatorSession | null>(() => getStoredOperatorSession());
  const [customerSession, setCustomerSession] = useState<{ id: string; email: string; name: string; phone?: string } | null>(() => getActiveCustomerSession());
  const [isCustomerAuthOpen, setIsCustomerAuthOpen] = useState(false);
  const [customerAuthTab, setCustomerAuthTab] = useState<'signin' | 'register'>('signin');
  const [isSecurityGuideOpen, setIsSecurityGuideOpen] = useState(false);
  const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<Order | null>(null);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);

  // Check URL parameters on mount for recovery link redirect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      if (hash.includes('type=recovery') || hash.includes('access_token=') || search.includes('action=reset-password')) {
        setIsResetPasswordOpen(true);
      }
    }
  }, []);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('km_theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      // By default keep app in light mode
      return false;
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (isDarkMode) {
      root.classList.add('dark');
      body.classList.add('dark');
      localStorage.setItem('km_theme', 'dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
      localStorage.setItem('km_theme', 'light');
    }
  }, [isDarkMode]);

  // Synchronize live Supabase Auth session for store operator
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) return;

    // Check existing live Supabase session
    client.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        const userRole = data.session.user.user_metadata?.role;
        // Only treat as operator if role is explicitly operator or admin
        if (userRole === 'operator' || userRole === 'admin') {
          const liveSession: OperatorSession = {
            email: data.session.user.email || '',
            role: userRole,
            authenticatedAt: new Date().toISOString(),
            source: 'supabase',
            accessToken: data.session.access_token,
            userId: data.session.user.id
          };
          setOperatorSession(liveSession);
        }
      }
    }).catch(err => {
      console.warn('[Supabase Auth] Session verification notice:', err);
    });

    // Listen for real-time auth changes (sign in, sign out, token refresh, password recovery)
    const { data: authSubscription } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResetPasswordOpen(true);
      } else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        const userRole = session.user.user_metadata?.role;
        if (userRole === 'operator' || userRole === 'admin') {
          const liveSession: OperatorSession = {
            email: session.user.email || '',
            role: userRole,
            authenticatedAt: new Date().toISOString(),
            source: 'supabase',
            accessToken: session.access_token,
            userId: session.user.id
          };
          setOperatorSession(liveSession);
        }
      } else if (event === 'SIGNED_OUT') {
        setOperatorSession(null);
      }
    });

    return () => {
      authSubscription?.subscription?.unsubscribe();
    };
  }, []);

  // Synchronize customer profile & Supabase orders when customer session exists
  useEffect(() => {
    if (customerSession) {
      const email = customerSession.email.toLowerCase();
      let localAddrs: UserAddress[] = [];
      let localOrds: Order[] = [];
      let localWish: string[] = [];
      try {
        const rawA = localStorage.getItem(`km_customer_addresses_${email}`);
        if (rawA) localAddrs = JSON.parse(rawA);
        if (localAddrs.length === 0) {
          const lastA = localStorage.getItem(`km_customer_last_addr_${email}`) || localStorage.getItem('km_last_delivery_address');
          if (lastA) {
            const parsed = JSON.parse(lastA);
            if (parsed && parsed.addressLine1) localAddrs = [parsed];
          }
        }
        const rawO = localStorage.getItem(`km_customer_orders_${email}`);
        if (rawO) localOrds = JSON.parse(rawO);
        const rawW = localStorage.getItem(`km_customer_wishlist_${email}`);
        if (rawW) localWish = JSON.parse(rawW);
      } catch {}

      const { cleanAddrs, cleanOrds } = cleanLegacyData(localAddrs, localOrds);

      setUserProfile({
        id: customerSession.id,
        name: customerSession.name || email.split('@')[0],
        email: customerSession.email,
        phone: customerSession.phone || '',
        addresses: cleanAddrs,
        orders: cleanOrds,
        wishlistIds: localWish
      });

      // Pull customer orders and saved addresses from Supabase
      Promise.all([
        fetchCustomerOrdersFromSupabase(customerSession.id, customerSession.email),
        fetchCustomerAddressesFromSupabase(customerSession.id, customerSession.email)
      ]).then(([dbOrders, dbAddresses]) => {
        setUserProfile(prev => {
          const remoteOrds = Array.isArray(dbOrders) ? (dbOrders as any) : [];
          const remoteAddrs = Array.isArray(dbAddresses) ? (dbAddresses as any) : [];
          const cleaned = cleanLegacyData(remoteAddrs, remoteOrds);

          // Merge addresses: remote first, then any local addresses not already present
          const addrMap = new Map<string, UserAddress>();
          cleaned.cleanAddrs.forEach(a => {
            const sig = `${(a.addressLine1 || '').trim()}_${(a.pincode || '').trim()}`.toLowerCase();
            if (sig !== '_') addrMap.set(sig, a);
          });
          (prev.addresses || []).forEach(a => {
            const sig = `${(a.addressLine1 || '').trim()}_${(a.pincode || '').trim()}`.toLowerCase();
            if (sig !== '_' && !addrMap.has(sig)) addrMap.set(sig, a);
          });
          const mergedAddrs = Array.from(addrMap.values());

          try {
            localStorage.setItem(`km_customer_addresses_${email}`, JSON.stringify(mergedAddrs));
            localStorage.setItem(`km_customer_orders_${email}`, JSON.stringify(cleaned.cleanOrds));
          } catch {}

          return {
            ...prev,
            orders: cleaned.cleanOrds.length > 0 ? cleaned.cleanOrds : prev.orders,
            addresses: mergedAddrs
          };
        });
      }).catch(err => {
        console.warn('Customer data sync note:', err);
      });
    } else {
      setUserProfile(EMPTY_PROFILE);
    }
  }, [customerSession]);

  const handleCustomerLoginSuccess = (customer: { id: string; email: string; name: string; phone?: string }) => {
    setCustomerSession(customer);
    const email = customer.email.toLowerCase();
    let localAddrs: UserAddress[] = [];
    let localOrds: Order[] = [];
    let localWish: string[] = [];
    try {
      const rawA = localStorage.getItem(`km_customer_addresses_${email}`);
      if (rawA) localAddrs = JSON.parse(rawA);
      const rawO = localStorage.getItem(`km_customer_orders_${email}`);
      if (rawO) localOrds = JSON.parse(rawO);
      const rawW = localStorage.getItem(`km_customer_wishlist_${email}`);
      if (rawW) localWish = JSON.parse(rawW);
    } catch {}

    const { cleanAddrs, cleanOrds } = cleanLegacyData(localAddrs, localOrds);

    setUserProfile({
      id: customer.id,
      name: customer.name || email.split('@')[0],
      email: customer.email,
      phone: customer.phone || '',
      addresses: cleanAddrs,
      orders: cleanOrds,
      wishlistIds: localWish
    });

    // Fetch immediately from Supabase for fresh data
    Promise.all([
      fetchCustomerOrdersFromSupabase(customer.id, customer.email),
      fetchCustomerAddressesFromSupabase(customer.id, customer.email)
    ]).then(([dbOrders, dbAddresses]) => {
      const remoteOrds = Array.isArray(dbOrders) ? (dbOrders as any) : [];
      const remoteAddrs = Array.isArray(dbAddresses) ? (dbAddresses as any) : [];
      const cleaned = cleanLegacyData(remoteAddrs, remoteOrds);

      setUserProfile(prev => {
        const addrMap = new Map<string, UserAddress>();
        cleaned.cleanAddrs.forEach(a => {
          const sig = `${(a.addressLine1 || '').trim()}_${(a.pincode || '').trim()}`.toLowerCase();
          if (sig !== '_') addrMap.set(sig, a);
        });
        (prev.addresses || []).forEach(a => {
          const sig = `${(a.addressLine1 || '').trim()}_${(a.pincode || '').trim()}`.toLowerCase();
          if (sig !== '_' && !addrMap.has(sig)) addrMap.set(sig, a);
        });
        const mergedAddrs = Array.from(addrMap.values());

        try {
          localStorage.setItem(`km_customer_addresses_${email}`, JSON.stringify(mergedAddrs));
          localStorage.setItem(`km_customer_orders_${email}`, JSON.stringify(cleaned.cleanOrds));
        } catch {}

        return {
          ...prev,
          orders: cleaned.cleanOrds.length > 0 ? cleaned.cleanOrds : prev.orders,
          addresses: mergedAddrs
        };
      });
    }).catch(() => {});

    setIsCustomerAuthOpen(false);
    setIsAccountOpen(true);
  };

  const handleCustomerLogout = async () => {
    await customerSignOut();
    setCustomerSession(null);
    setUserProfile(EMPTY_PROFILE);
    setIsAccountOpen(false);
  };

  const handleUpdateProfile = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    if (newProfile.email) {
      const email = newProfile.email.toLowerCase();
      try {
        localStorage.setItem(`km_customer_addresses_${email}`, JSON.stringify(newProfile.addresses));
        localStorage.setItem(`km_customer_wishlist_${email}`, JSON.stringify(newProfile.wishlistIds));
        localStorage.setItem(`km_customer_orders_${email}`, JSON.stringify(newProfile.orders));
      } catch {}
    }
  };

  const handleOpenAccount = () => {
    if (customerSession) {
      setIsAccountOpen(true);
    } else {
      setCustomerAuthTab('signin');
      setIsCustomerAuthOpen(true);
    }
  };

  const handleOpenCustomerAuth = (tab: 'signin' | 'register' = 'signin') => {
    setCustomerAuthTab(tab);
    setIsCustomerAuthOpen(true);
  };

  const [currentPage, setCurrentPage] = useState<'store' | 'about'>('store');

  useEffect(() => {
    // Ensure the website always opens on the store/home view first
    if (typeof window !== 'undefined' && window.location.hash === '#about') {
      try {
        history.replaceState(null, '', window.location.pathname);
      } catch {
        window.location.hash = '';
      }
    }

    const handleHash = () => {
      if (window.location.hash === '#about') {
        setCurrentPage('about');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (window.location.hash === '#products' || window.location.hash === '#collection' || !window.location.hash) {
        setCurrentPage('store');
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleNavigateToProducts = () => {
    setCurrentPage('store');
    setSelectedCategory('All');
    if (window.location.hash === '#about') {
      try {
        history.replaceState(null, '', window.location.pathname);
      } catch {
        window.location.hash = '';
      }
    }
    setTimeout(() => {
      const el = document.getElementById('collection');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  };

  const handleOpenAboutPage = () => {
    setCurrentPage('about');
    window.location.hash = '#about';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Site Settings (Store background, Logo, Flower drift controls)
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
    const explicitlyTurnedOff = localStorage.getItem('km_flower_drift_user_enabled') === 'false';
    const storedDesktop = localStorage.getItem('km_hero_banner_data');
    const storedMobile = localStorage.getItem('km_hero_mobile_banner_data');

    try {
      const saved = localStorage.getItem('km_site_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        const tagline = (!parsed.storeTagline || parsed.storeTagline === 'Japan Skincare' || parsed.storeTagline === 'Tokyo Skincare' || parsed.storeTagline === 'Japanese')
          ? 'Japanese Skincare'
          : parsed.storeTagline;

        const activeHero = parsed.heroBannerUrl && !parsed.heroBannerUrl.includes('konichiwalaptopbg.png')
          ? parsed.heroBannerUrl
          : (storedDesktop || parsed.heroBannerUrl || '/konichiwalaptopbackground.png');

        const activeMobileHero = parsed.mobileHeroBannerUrl && !parsed.mobileHeroBannerUrl.includes('konichiwamobilebg.png')
          ? parsed.mobileHeroBannerUrl
          : (storedMobile || parsed.mobileHeroBannerUrl || '/konichiwamobilebg.png');

        return {
          backgroundHintOpacity: 'balanced',
          flowerDriftSpeed: 'gentle',
          flowerDriftDensity: 'low',
          ...parsed,
          heroBannerUrl: activeHero,
          mobileHeroBannerUrl: activeMobileHero,
          backgroundImageUrl: activeHero,
          mobileBackgroundImageUrl: activeMobileHero,
          storeTagline: tagline,
          flowerDriftEnabled: explicitlyTurnedOff ? false : (parsed.flowerDriftEnabled !== undefined ? parsed.flowerDriftEnabled : true)
        };
      }
    } catch {}
    return {
      storeName: 'Konichiwa.Mart',
      storeTagline: 'Japanese Skincare',
      heroBannerUrl: storedDesktop || '/konichiwalaptopbackground.png',
      mobileHeroBannerUrl: storedMobile || '/konichiwamobilebg.png',
      backgroundImageUrl: storedDesktop || '/konichiwalaptopbackground.png',
      mobileBackgroundImageUrl: storedMobile || '/konichiwamobilebg.png',
      backgroundHintOpacity: 'balanced',
      flowerDriftEnabled: explicitlyTurnedOff ? false : true,
      flowerDriftSpeed: 'gentle',
      flowerDriftDensity: 'low'
    };
  });

  const handleUpdateSiteSettings = (newSettings: Partial<SiteSettings>) => {
    setSiteSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (newSettings.flowerDriftEnabled !== undefined) {
        if (newSettings.flowerDriftEnabled) {
          localStorage.setItem('km_flower_drift_user_enabled', 'true');
        } else {
          localStorage.setItem('km_flower_drift_user_enabled', 'false');
        }
      }
      localStorage.setItem('km_site_settings', JSON.stringify(updated));
      if (updated.heroBannerUrl) {
        try { localStorage.setItem('km_hero_banner_data', updated.heroBannerUrl); } catch {}
      }
      if (updated.mobileHeroBannerUrl) {
        try { localStorage.setItem('km_hero_mobile_banner_data', updated.mobileHeroBannerUrl); } catch {}
      }

      // Sync settings to server/Supabase
      fetch('/api/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updated })
      }).catch(err => console.warn('Failed to sync site settings to server:', err));

      return updated;
    });
  };

  // Fetch site settings from server/Supabase on mount
  useEffect(() => {
    fetch('/api/site-settings')
      .then(r => r.json())
      .then(data => {
        if (data?.success && data?.settings && typeof data.settings === 'object') {
          const s = data.settings;
          setSiteSettings(prev => {
            const merged = { ...prev, ...s };
            localStorage.setItem('km_site_settings', JSON.stringify(merged));
            if (s.heroBannerUrl) {
              try { localStorage.setItem('km_hero_banner_data', s.heroBannerUrl); } catch {}
            }
            if (s.mobileHeroBannerUrl) {
              try { localStorage.setItem('km_hero_mobile_banner_data', s.mobileHeroBannerUrl); } catch {}
            }
            return merged;
          });
        }
      })
      .catch(err => console.warn('Failed to fetch server site settings:', err));
  }, []);

  // Community Reels State with Local Storage Persistence & Server Sync
  const [reels, setReels] = useState<ReelItem[]>(() => getStoredReels());
  const [adminInitialTab, setAdminInitialTab] = useState<'dashboard' | 'inventory' | 'orders' | 'settings' | 'reels'>('dashboard');

  // Fetch persistent reels from server on mount
  useEffect(() => {
    fetchServerReels().then(serverReels => {
      if (serverReels && serverReels.length > 0) {
        setReels(serverReels);
      }
    }).catch(err => console.warn('Failed to load server reels:', err));
  }, []);

  const handleUpdateReels = (updatedReels: ReelItem[]) => {
    setReels(updatedReels);
    saveStoredReels(updatedReels);
  };

  // Hidden Operator Access Handler (Supports opening directly to a specific tab like 'reels')
  const handleRequestAdminAccess = (tab?: any) => {
    const validTab: 'dashboard' | 'inventory' | 'orders' | 'settings' | 'reels' = 
      (typeof tab === 'string' && ['dashboard', 'inventory', 'orders', 'settings', 'reels'].includes(tab))
        ? (tab as any)
        : 'dashboard';
    setAdminInitialTab(validTab);

    // Close other overlays to avoid stacking conflicts
    setIsCustomerAuthOpen(false);
    setIsAccountOpen(false);
    setIsCartOpen(false);
    setIsRazorpayOpen(false);

    const session = getStoredOperatorSession();
    if (session) {
      setOperatorSession(session);
      setIsAdminLoginOpen(false);
      setIsAdminOpen(true);
    } else {
      setIsAdminOpen(false);
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
        if (data?.exists && data?.url) {
          const freshBannerUrl = `${data.url}?v=${Date.now()}`;
          setSiteSettings(prev => ({
            ...prev,
            heroBannerUrl: freshBannerUrl
          }));
        }
      })
      .catch(() => {});

    // Fetch products from server / Supabase on initial load
    fetchProductsFromStore().then((freshList) => {
      if (Array.isArray(freshList) && freshList.length > 0) {
        setProductsList(freshList);
      }
    });

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Inventory & Stock Controls
  const handleUpdateProductStock = (productId: string, inStock: boolean, stockCount?: number) => {
    const finalStock = stockCount !== undefined 
      ? Math.max(0, stockCount) 
      : (inStock ? 50 : 0);

    setProductsList((prev) => {
      const updated = prev.map((p) => {
        if (p.id === productId) {
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

    updateProductInStore(productId, { stock: finalStock });
  };

  const handleUpdateProductPrice = (productId: string, newPrice: number) => {
    const validPrice = Math.max(1, newPrice);
    setProductsList((prev) => {
      const updated = prev.map((p) => {
        if (p.id === productId) {
          return {
            ...p,
            price: validPrice
          };
        }
        return p;
      });
      localStorage.setItem('km_custom_products', JSON.stringify(updated));
      return updated;
    });

    updateProductInStore(productId, { price: validPrice });
  };

  // New Product Upload Handler
  const handleAddProduct = (newProduct: Product) => {
    setProductsList((prev) => {
      const updated = [newProduct, ...prev];
      localStorage.setItem('km_custom_products', JSON.stringify(updated));
      return updated;
    });

    addProductToStore(newProduct);
  };

  const handleEditProduct = (updatedProduct: Product) => {
    setProductsList((prev) => {
      const updated = prev.map(p => p.id === updatedProduct.id ? updatedProduct : p);
      localStorage.setItem('km_custom_products', JSON.stringify(updated));
      return updated;
    });
    updateProductInStore(updatedProduct.id, updatedProduct);
  };

  // Remove Product Handler (Permanently deletes from Supabase, Server Storage, and Local state)
  const handleRemoveProduct = (productId: string) => {
    setProductsList((prev) => {
      const updated = prev.filter((p) => p.id !== productId);
      localStorage.setItem('km_custom_products', JSON.stringify(updated));
      return updated;
    });

    // Sync deletion across Supabase and persistent backend storage
    deleteProductFromStore(productId);

    // Also remove from cart if present
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    if (inspectProduct?.id === productId) {
      setInspectProduct(null);
    }
  };

  // Restore Original Catalog Handler
  const handleResetDefaultProducts = async () => {
    await resetProductsInStore();
    const fresh = await fetchProductsFromStore();
    setProductsList(fresh);
  };

  // Active Promo applied from Cart
  const [checkoutDiscount, setCheckoutDiscount] = useState<{ promoCode?: string; discountAmount: number }>({
    promoCode: undefined,
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

    // 1. Record in store orders (for admin portal)
    setStoreOrders(prev => {
      const updated = [newOrder, ...prev.filter(o => o.id !== newOrder.id)];
      try {
        localStorage.setItem('km_store_orders', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 2. Record in customer orders and automatically save delivery address to their address book
    setUserProfile((prev) => {
      const alreadyHasAddr = prev.addresses.some(
        a => a.addressLine1.toLowerCase().trim() === newOrder.shippingAddress.addressLine1.toLowerCase().trim() &&
             a.pincode === newOrder.shippingAddress.pincode
      );

      const updatedAddresses = alreadyHasAddr 
        ? prev.addresses 
        : [
            ...prev.addresses, 
            {
              ...newOrder.shippingAddress,
              isDefault: prev.addresses.length === 0
            }
          ];

      const updatedOrders = [newOrder, ...prev.orders.filter(o => o.id !== newOrder.id)];

      const email = (newOrder.customerEmail || prev.email || '').toLowerCase();
      if (email) {
        try {
          localStorage.setItem(`km_customer_orders_${email}`, JSON.stringify(updatedOrders));
          localStorage.setItem(`km_customer_addresses_${email}`, JSON.stringify(updatedAddresses));
        } catch {}
      }

      return {
        ...prev,
        addresses: updatedAddresses,
        orders: updatedOrders
      };
    });

    setCart([]); // Clear cart
    try {
      localStorage.removeItem('km_user_cart');
    } catch {}

    setActiveInvoiceOrder(newOrder); // Automatically open official GST invoice

    // 3. Persist to Supabase orders and order_items tables
    try {
      await saveOrderToSupabase(newOrder, userProfile?.id || customerSession?.id);
      // Immediately pull fresh synchronized orders from Supabase
      const custId = userProfile?.id || customerSession?.id;
      const custEmail = newOrder.customerEmail || userProfile?.email || customerSession?.email;
      if (custEmail || custId) {
        const freshOrders = await fetchCustomerOrdersFromSupabase(custId, custEmail);
        if (Array.isArray(freshOrders) && freshOrders.length > 0) {
          const { cleanOrds } = cleanLegacyData([], freshOrders as Order[]);
          setUserProfile(prev => ({
            ...prev,
            orders: cleanOrds
          }));
          if (custEmail) {
            try {
              localStorage.setItem(`km_customer_orders_${custEmail.toLowerCase()}`, JSON.stringify(cleanOrds));
            } catch {}
          }
        }
      }
    } catch (syncErr) {
      console.warn('[Supabase Sync Warning]:', syncErr);
    }
  };

  // Update order status in admin portal
  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    setStoreOrders(prev => {
      const updated = prev.map(o => o.id === orderId ? { ...o, status } : o);
      try {
        localStorage.setItem('km_store_orders', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setUserProfile((prev) => {
      const updatedOrders = prev.orders.map(o => o.id === orderId ? { ...o, status } : o);
      if (prev.email) {
        try {
          localStorage.setItem(`km_customer_orders_${prev.email.toLowerCase()}`, JSON.stringify(updatedOrders));
        } catch {}
      }
      return {
        ...prev,
        orders: updatedOrders
      };
    });

    try {
      await updateOrderStatusInSupabase(orderId, status);
    } catch (err) {
      console.warn('[Update Status Error]:', err);
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    setStoreOrders(prev => {
      const updated = prev.filter(o => o.id !== orderId);
      try {
        localStorage.setItem('km_store_orders', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleModifyOrder = (orderId: string, updates: Partial<Order>) => {
    setStoreOrders(prev => {
      const updated = prev.map(o => o.id === orderId ? { ...o, ...updates } : o);
      try {
        localStorage.setItem('km_store_orders', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };


  const totalCartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartSubtotal = cart.reduce((sum, i) => sum + (i.product.price * i.quantity), 0);
  const shippingFee = cartSubtotal >= 1500 || cartSubtotal === 0 ? 0 : 99;
  const defaultAddress: UserAddress = userProfile.addresses.find(a => a.isDefault) || userProfile.addresses[0];

  return (
    <div className="min-h-screen bg-[#FAF0F2] dark:bg-[#09090b] text-[#1E293B] dark:text-[#f4f4f5] font-sans selection:bg-pink-200 dark:selection:bg-pink-900/50 dark:selection:text-pink-100 relative transition-colors duration-300">
      
      {/* PERSISTENT AMBIENT BACKGROUND LAYER (Visible as an artistic hint upon scrolling across the store) */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        {/* Fixed background image with smooth parallax hint - visible & atmospheric in both light and dark mode */}
        {/* Desktop / Laptop Background */}
        <div 
          className={`hidden sm:block absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 brightness-[0.94] contrast-[0.98] ${
            siteSettings.backgroundHintOpacity === 'subtle'
              ? 'opacity-[0.16] dark:opacity-[0.24] dark:brightness-[0.82] dark:contrast-[1.10]'
              : siteSettings.backgroundHintOpacity === 'pronounced'
              ? 'opacity-[0.35] dark:opacity-[0.48] dark:brightness-[0.88] dark:contrast-[1.12]'
              : 'opacity-[0.24] dark:opacity-[0.36] dark:brightness-[0.85] dark:contrast-[1.10]'
          }`}
          style={{
            backgroundImage: `url(${siteSettings.backgroundImageUrl || siteSettings.heroBannerUrl || '/konichiwalaptopbackground.png'})`,
          }}
        />
        {/* Mobile Background Layout */}
        <div 
          className={`block sm:hidden absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 brightness-[0.94] contrast-[0.98] ${
            siteSettings.backgroundHintOpacity === 'subtle'
              ? 'opacity-[0.16] dark:opacity-[0.24] dark:brightness-[0.82] dark:contrast-[1.10]'
              : siteSettings.backgroundHintOpacity === 'pronounced'
              ? 'opacity-[0.35] dark:opacity-[0.48] dark:brightness-[0.88] dark:contrast-[1.12]'
              : 'opacity-[0.24] dark:opacity-[0.36] dark:brightness-[0.85] dark:contrast-[1.10]'
          }`}
          style={{
            backgroundImage: `url(${siteSettings.mobileBackgroundImageUrl || siteSettings.mobileHeroBannerUrl || '/konichiwamobilebg.png'})`,
          }}
        />
        {/* Soft Japanese paper tone in light mode / subtle velvet black tint in dark mode */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAF0F2]/65 via-[#F7ECEF]/78 to-[#FAF0F2]/88 dark:from-[#09090b]/30 dark:via-[#09090b]/48 dark:to-[#09090b]/65 transition-colors duration-500" />
        
        {/* Delicate Sakura Blossom Dot Pattern Texture */}
        <div className="absolute inset-0 bg-[radial-gradient(#f472b6_0.8px,transparent_0.8px)] [background-size:28px_28px] opacity-15 dark:opacity-10" />
      </div>
      
      {/* Floating Header Navigation */}
      <Navbar
        cartCount={totalCartCount}
        wishlistCount={userProfile.wishlistIds.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => {
          if (customerSession) {
            setIsAccountOpen(true);
          } else {
            handleOpenCustomerAuth('signin');
          }
        }}
        onOpenAccount={handleOpenAccount}
        isCustomerLoggedIn={!!customerSession}
        customerName={customerSession?.name || userProfile.name}
        onOpenCustomerAuth={handleOpenCustomerAuth}
        onOpenAbout={handleOpenAboutPage}
        onOpenContact={() => setIsContactOpen(true)}
        onNavigateToProducts={handleNavigateToProducts}
        onOpenAdmin={() => handleRequestAdminAccess('dashboard')}
        onOpenSecurityGuide={() => setIsSecurityGuideOpen(true)}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          if (currentPage !== 'store') {
            setCurrentPage('store');
          }
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        storeName={siteSettings.storeName}
        storeTagline={siteSettings.storeTagline}
        logoUrl={siteSettings.logoUrl}
        instagramUrl={KONICHIWA_INSTAGRAM_URL}
        instagramHandle={KONICHIWA_INSTAGRAM_HANDLE}
        activePage={currentPage}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(prev => !prev)}
      />

      {/* RESTORED SPRING EFFECT: Falling Petals Canvas Controlled from Site Settings */}
      <FallingPetalsBackground 
        isActive={siteSettings.flowerDriftEnabled}
        breezeMode={siteSettings.flowerDriftSpeed}
        density={siteSettings.flowerDriftDensity}
      />

      {/* CONTENT CONDITIONAL: DEDICATED ABOUT US PAGE OR STORE CATALOG */}
      {currentPage === 'about' ? (
        <AboutUsPage
          onNavigateToProducts={handleNavigateToProducts}
          onOpenContact={() => setIsContactOpen(true)}
        />
      ) : (
        <>
          {/* 1. HERO SECTION: CINEMATIC PANORAMIC JAPANESE BEAUTY BANNER */}
          <HeroBanner
            onSelectProduct={setInspectProduct}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            isWishlisted={isWishlisted}
            onApplyCoupon={() => setIsCartOpen(true)}
            customBannerUrl={siteSettings.heroBannerUrl}
            customMobileBannerUrl={siteSettings.mobileHeroBannerUrl || '/konichiwamobilebg.png'}
          />

          {/* 2. MAIN PRODUCT CATALOG */}
          <main id="collection" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-12 sm:pt-16 md:pt-20 pb-12 sm:pb-20">
            
            {/* Simplified Section Header */}
            <div className="mb-4 sm:mb-6 text-left">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
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
                      : 'bg-white dark:bg-zinc-900/90 hover:bg-pink-50/40 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-800 font-medium shadow-xs'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
              {selectedCategory !== 'All' && (
                <button
                  onClick={() => setSelectedCategory('All')}
                  className="text-xs text-pink-600 dark:text-pink-400 hover:underline px-2 cursor-pointer font-medium"
                >
                  Clear Filter
                </button>
              )}
            </div>

            {/* Product Grid */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900/90 border border-pink-100 dark:border-zinc-800 rounded-2xl p-8 sm:p-12 text-center space-y-3 shadow-md">
                <div className="w-12 h-12 rounded-full bg-pink-50 dark:bg-zinc-800 mx-auto flex items-center justify-center text-pink-600 dark:text-pink-400">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100">No products match this query</h3>
                <p className="text-xs text-slate-600 dark:text-zinc-400">
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
            products={productsList}
            reels={reels}
            onOpenReelsManager={() => handleRequestAdminAccess('reels')}
          />
        </>
      )}

      {/* FOOTER */}
      <Footer
        onOpenSecurityGuide={() => setIsSecurityGuideOpen(true)}
        onOpenAdmin={handleRequestAdminAccess}
        onOpenAbout={handleOpenAboutPage}
        onOpenContact={() => setIsContactOpen(true)}
        onNavigateToProducts={handleNavigateToProducts}
        instagramUrl={KONICHIWA_INSTAGRAM_URL}
        instagramHandle={KONICHIWA_INSTAGRAM_HANDLE}
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
        onUpdateProfile={handleUpdateProfile}
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
        onUpdateProfile={handleUpdateProfile}
        onViewInvoice={(order) => setActiveInvoiceOrder(order)}
        onAddToCart={handleAddToCart}
        onRemoveWishlist={handleToggleWishlist}
        onSignOut={handleCustomerLogout}
      />

      {/* 6b. Customer Sign-In & Registration Modal (Supabase Customer Auth) */}
      <CustomerAuthModal
        isOpen={isCustomerAuthOpen}
        onClose={() => setIsCustomerAuthOpen(false)}
        initialTab={customerAuthTab}
        onSuccess={handleCustomerLoginSuccess}
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
        orders={storeOrders}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onDeleteOrder={handleDeleteOrder}
        onModifyOrder={handleModifyOrder}
        onViewInvoice={(order) => setActiveInvoiceOrder(order)}
        products={productsList}
        onUpdateProductStock={handleUpdateProductStock}
        onUpdateProductPrice={handleUpdateProductPrice}
        onAddProduct={handleAddProduct}
        onEditProduct={handleEditProduct}
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
        reels={reels}
        onUpdateReels={handleUpdateReels}
        initialTab={adminInitialTab}
      />

      {/* 9. Architecture & Security Blueprint Modal */}
      <SecurityGuideModal
        isOpen={isSecurityGuideOpen}
        onClose={() => setIsSecurityGuideOpen(false)}
      />

      {/* 10. About Us Modal */}
      <AboutUsModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        onExploreProducts={handleNavigateToProducts}
      />

      {/* 11. Contact Us Modal */}
      <ContactUsModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        instagramHandle={KONICHIWA_INSTAGRAM_HANDLE}
        instagramUrl={KONICHIWA_INSTAGRAM_URL}
      />

      {/* 12. Password Reset Modal */}
      <ResetPasswordModal
        isOpen={isResetPasswordOpen}
        onClose={() => {
          setIsResetPasswordOpen(false);
          if (typeof window !== 'undefined' && window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }}
        onPasswordUpdated={(email) => {
          setIsResetPasswordOpen(false);
          if (typeof window !== 'undefined' && window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname);
          }
          if (email) {
            const current = getActiveCustomerSession();
            if (current) setCustomerSession(current);
          }
        }}
      />

    </div>
  );
}
