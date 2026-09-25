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
  CheckCircle2,
  ArrowUpDown
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
  ensureSupabaseClient,
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
  deleteOrderFromSupabase,
  modifyOrderInSupabase,
  saveAddressToSupabase,
  fetchCategoriesFromStore,
  applyProductOrderClient,
  saveProductOrderToStore
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

// Legacy mock IDs that were part of the initial template and must never be loaded
const LEGACY_MOCK_IDS = new Set([
  'dhc-lip-cream',
  'lululun-precious-moist',
  'lululun-precious-balance',
  'senka-perfect-whip-collagen',
  'biore-uv-aqua-rich',
  'rohto-melano-cc-toner',
  'derma-laser-retinol'
]);

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
          const cleaned = parsed.filter((p) => !deletedIds.has(p.id) && !LEGACY_MOCK_IDS.has(p.id));
          if (cleaned.length > 0) {
            return applyProductOrderClient(cleaned);
          }
        }
      } else if (deletedIds.size > 0) {
        return applyProductOrderClient(PRODUCTS.filter((p) => !deletedIds.has(p.id)));
      }
    } catch {}
    return applyProductOrderClient(PRODUCTS);
  });

  // Products & Filtering State
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('All');
  const [selectedConcern, setSelectedConcern] = useState<string>('All');
  const [selectedSkinType, setSelectedSkinType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Storefront Product Sort & Order Option
  type ProductSortOption = 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'bestseller' | 'newest' | 'title';
  const [productSortBy, setProductSortBy] = useState<ProductSortOption>(() => {
    try {
      const saved = localStorage.getItem('km_product_sort_by');
      if (saved) return saved as ProductSortOption;
    } catch {}
    return 'featured';
  });

  const handleSortChange = (newSort: ProductSortOption) => {
    setProductSortBy(newSort);
    try {
      localStorage.setItem('km_product_sort_by', newSort);
    } catch {}
  };

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

  // Dedicated helper to refresh orders from Supabase & backend API
  const handleRefreshOrders = async (): Promise<Order[]> => {
    try {
      const fetched = await fetchAllOrdersFromSupabase();
      if (Array.isArray(fetched) && fetched.length > 0) {
        setStoreOrders(fetched);
        try {
          localStorage.setItem('km_store_orders', JSON.stringify(fetched));
        } catch {}
      }
      return fetched || [];
    } catch (err) {
      console.warn('[Refresh Orders Error]:', err);
      return [];
    }
  };

  // Hydrate store orders from Supabase on load and whenever Operator Portal is opened
  useEffect(() => {
    handleRefreshOrders();
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

  // Dynamic categories synced from Supabase and Server
  const [dbCategories, setDbCategories] = useState<Array<{ id: string; name: string; slug: string; display_order?: number }>>([]);

  useEffect(() => {
    // Hydrate products directly from Supabase / live store on mount
    fetchProductsFromStore().then((prods) => {
      if (Array.isArray(prods) && prods.length > 0) {
        setProductsList(prods);
      }
    });

    fetchCategoriesFromStore().then((cats) => {
      if (Array.isArray(cats) && cats.length > 0) {
        setDbCategories(cats.map(c => ({
          id: c.id || c.name,
          name: c.name,
          slug: c.slug || c.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          display_order: c.display_order ?? 99
        })));
      }
    });

    let isCancelled = false;
    let activeChannel: any = null;

    ensureSupabaseClient().then(client => {
      if (!client || isCancelled) return;
      try {
        const channelName = `realtime_cat_prod_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const channel = client.channel(channelName);

        channel
          .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
            fetchCategoriesFromStore().then(cats => {
              if (Array.isArray(cats) && cats.length > 0) {
                setDbCategories(cats.map(c => ({
                  id: c.id || c.name,
                  name: c.name,
                  slug: c.slug || c.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                  display_order: c.display_order ?? 99
                })));
              }
            });
            fetchProductsFromStore().then(prods => {
              if (Array.isArray(prods) && prods.length > 0) {
                setProductsList(prods);
              }
            });
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
            fetchProductsFromStore().then(prods => {
              if (Array.isArray(prods) && prods.length > 0) {
                setProductsList(prods);
              }
            });
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
            handleRefreshOrders();
          });

        if (isCancelled) {
          client.removeChannel(channel);
          return;
        }

        channel.subscribe();
        activeChannel = channel;
      } catch (err) {
        console.warn('[Realtime Sync] Channel subscription error:', err);
      }
    });

    return () => {
      isCancelled = true;
      if (activeChannel) {
        ensureSupabaseClient().then(client => {
          if (client) client.removeChannel(activeChannel);
        });
      }
    };
  }, []);

  // Check URL parameters on mount for recovery link redirect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      if (
        hash.includes('type=recovery') || 
        hash.includes('access_token=') || 
        search.includes('action=reset-password') ||
        search.includes('token_hash=') ||
        search.includes('type=recovery')
      ) {
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
    const rawStoredVideo = localStorage.getItem('km_hero_video_url');
    const rawStoredMobileVideo = localStorage.getItem('km_hero_mobile_video_url');

    // Purge any dummy flower.mp4 from cache
    if (rawStoredVideo && (rawStoredVideo.includes('flower.mp4') || rawStoredVideo.includes('interactive-examples'))) {
      try { localStorage.removeItem('km_hero_video_url'); } catch {}
    }
    if (rawStoredMobileVideo && (rawStoredMobileVideo.includes('flower.mp4') || rawStoredMobileVideo.includes('interactive-examples'))) {
      try { localStorage.removeItem('km_hero_mobile_video_url'); } catch {}
    }

    const storedVideo = (rawStoredVideo && !rawStoredVideo.includes('flower.mp4') && !rawStoredVideo.includes('interactive-examples')) ? rawStoredVideo : '';
    const storedMobileVideo = (rawStoredMobileVideo && !rawStoredMobileVideo.includes('flower.mp4') && !rawStoredMobileVideo.includes('interactive-examples')) ? rawStoredMobileVideo : '';

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

        const validParsedVideo = (parsed.heroVideoUrl && !parsed.heroVideoUrl.includes('flower.mp4') && !parsed.heroVideoUrl.includes('interactive-examples'))
          ? parsed.heroVideoUrl
          : storedVideo;

        const validParsedMobileVideo = (parsed.heroMobileVideoUrl && !parsed.heroMobileVideoUrl.includes('flower.mp4') && !parsed.heroMobileVideoUrl.includes('interactive-examples'))
          ? parsed.heroMobileVideoUrl
          : storedMobileVideo;

        return {
          backgroundHintOpacity: 'balanced',
          flowerDriftSpeed: 'gentle',
          flowerDriftDensity: 'low',
          ...parsed,
          heroBannerUrl: activeHero,
          mobileHeroBannerUrl: activeMobileHero,
          heroVideoUrl: '',
          heroMobileVideoUrl: '',
          heroMediaType: 'image',
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
      heroVideoUrl: '',
      heroMobileVideoUrl: '',
      heroMediaType: 'image',
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
      if (updated.heroVideoUrl) {
        try { localStorage.setItem('km_hero_video_url', updated.heroVideoUrl); } catch {}
      }
      if (updated.heroMobileVideoUrl) {
        try { localStorage.setItem('km_hero_mobile_video_url', updated.heroMobileVideoUrl); } catch {}
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
    // Purge any lingering video settings from client storage
    try {
      localStorage.removeItem('km_hero_video_url');
      localStorage.removeItem('km_hero_mobile_video_url');
    } catch {}

    fetch('/api/site-settings')
      .then(r => r.json())
      .then(data => {
        if (data?.success && data?.settings && typeof data.settings === 'object') {
          const s = data.settings;
          s.heroMediaType = 'image';
          s.heroVideoUrl = '';
          s.heroMobileVideoUrl = '';

          setSiteSettings(prev => {
            const merged = { ...prev, ...s, heroMediaType: 'image', heroVideoUrl: '', heroMobileVideoUrl: '' };
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
      .catch(() => {});
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

    // Verify if custom hero banner and video exist on the server and ensure latest versions are loaded
    fetch('/api/banner-status')
      .then(res => res.json())
      .then(data => {
        if (data?.exists || data?.desktopVideoUrl || data?.mobileVideoUrl) {
          setSiteSettings(prev => {
            const next = { ...prev };
            if (data.url) next.heroBannerUrl = `${data.url}?v=${Date.now()}`;
            if (data.mobileUrl) next.mobileHeroBannerUrl = `${data.mobileUrl}?v=${Date.now()}`;
            if (data.desktopVideoUrl) {
              next.heroVideoUrl = data.desktopVideoUrl;
              localStorage.setItem('km_hero_video_url', data.desktopVideoUrl);
            }
            if (data.mobileVideoUrl) {
              next.heroMobileVideoUrl = data.mobileVideoUrl;
              localStorage.setItem('km_hero_mobile_video_url', data.mobileVideoUrl);
            }
            return next;
          });
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
  const handleUpdateProductStock = async (productId: string, inStock: boolean, stockCount?: number) => {
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

    const target = productsList.find(p => p.id === productId);
    const ok = await updateProductInStore(productId, { stock: finalStock, dbId: target?.dbId });
    const fresh = await fetchProductsFromStore();
    if (fresh && fresh.length > 0) {
      setProductsList(fresh);
    }
    return ok;
  };

  const handleUpdateProductPrice = async (productId: string, newPrice: number) => {
    const validPrice = Math.max(0, newPrice);
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

    const target = productsList.find(p => p.id === productId);
    const ok = await updateProductInStore(productId, { price: validPrice, dbId: target?.dbId });
    const fresh = await fetchProductsFromStore();
    if (fresh && fresh.length > 0) {
      setProductsList(fresh);
    }
    return ok;
  };

  // New Product Upload Handler
  const handleAddProduct = async (newProduct: Product) => {
    const targetRank = typeof newProduct.displayOrder === 'number' && newProduct.displayOrder > 0
      ? newProduct.displayOrder
      : 1;

    setProductsList((prev) => {
      const filtered = prev.filter(p => p.id !== newProduct.id);
      const insertIdx = Math.max(0, Math.min(filtered.length, targetRank - 1));
      filtered.splice(insertIdx, 0, newProduct);
      const withOrder = filtered.map((p, idx) => ({ ...p, displayOrder: idx + 1 }));
      try {
        localStorage.setItem('km_custom_products', JSON.stringify(withOrder));
        localStorage.setItem('km_product_order', JSON.stringify(withOrder.map(p => p.id)));
      } catch (err) {
        console.warn('LocalStorage save warning:', err);
      }
      return withOrder;
    });

    const ok = await addProductToStore(newProduct);
    const fresh = await fetchProductsFromStore();
    if (fresh && fresh.length > 0) {
      setProductsList(fresh);
    }
    return ok;
  };

  const handleEditProduct = async (updatedProduct: Product) => {
    setProductsList((prev) => {
      const updated = prev.map(p => p.id === updatedProduct.id ? updatedProduct : p);
      try {
        localStorage.setItem('km_custom_products', JSON.stringify(updated));
      } catch (err) {
        console.warn('LocalStorage save warning:', err);
      }
      return updated;
    });

    const ok = await updateProductInStore(updatedProduct.id, updatedProduct);
    const fresh = await fetchProductsFromStore();
    if (fresh && fresh.length > 0) {
      setProductsList(fresh.map(p => p.id === updatedProduct.id ? { ...p, ...updatedProduct } : p));
    }
    return ok;
  };

  // Remove Product Handler (Permanently deletes from Supabase, Server Storage, and Local state)
  const handleRemoveProduct = async (productId: string) => {
    const target = productsList.find(p => p.id === productId);
    setProductsList((prev) => {
      const updated = prev.filter((p) => p.id !== productId);
      localStorage.setItem('km_custom_products', JSON.stringify(updated));
      return updated;
    });

    // Also remove from cart if present
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    if (inspectProduct?.id === productId) {
      setInspectProduct(null);
    }

    // Sync deletion across Supabase and persistent backend storage
    const ok = await deleteProductFromStore(productId, target?.dbId);
    const fresh = await fetchProductsFromStore();
    if (fresh && fresh.length > 0) {
      setProductsList(fresh);
    }
    return ok;
  };

  // Restore Original Catalog Handler
  const handleResetDefaultProducts = async () => {
    await resetProductsInStore();
    const fresh = await fetchProductsFromStore();
    setProductsList(fresh);
  };

  // Reorder Products Handler (Persists custom website product sequence to Supabase, server, and local storage)
  const handleReorderProducts = async (reordered: Product[]) => {
    const withOrder = reordered.map((p, idx) => ({
      ...p,
      displayOrder: idx + 1
    }));
    setProductsList(withOrder);
    try {
      localStorage.setItem('km_custom_products', JSON.stringify(withOrder));
      localStorage.setItem('km_product_order', JSON.stringify(withOrder.map((p) => p.id)));
    } catch {}

    await saveProductOrderToStore(withOrder.map((p) => p.id));
    const fresh = await fetchProductsFromStore();
    if (fresh && fresh.length > 0) {
      setProductsList(fresh);
    }
  };

  // Active Promo applied from Cart
  const [checkoutDiscount, setCheckoutDiscount] = useState<{ promoCode?: string; discountAmount: number }>({
    promoCode: undefined,
    discountAmount: 0
  });

  // Helper: Normalize category string for comparison
  const normalizeCat = (str?: string) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  // Helper: Format category display name in clean Title Case (e.g., "hair care" -> "Hair Care")
  const formatCatName = (name: string): string => {
    if (!name) return '';
    return name
      .split(' ')
      .map((w) => {
        if (!w) return '';
        if (w === w.toLowerCase()) {
          return w.charAt(0).toUpperCase() + w.slice(1);
        }
        return w;
      })
      .join(' ');
  };

  // Helper: check if a product belongs to a given category
  const productBelongsToCategory = (p: Product, cat: { id?: string; name: string; slug?: string }) => {
    const pCatNorm = normalizeCat(p.category);
    const catNameNorm = normalizeCat(cat.name);
    const catSlugNorm = normalizeCat(cat.slug);
    const catIdNorm = normalizeCat(cat.id);

    if (pCatNorm && (pCatNorm === catNameNorm || pCatNorm === catSlugNorm || pCatNorm === catIdNorm)) {
      return true;
    }
    const pCatNameNorm = normalizeCat((p as any).categoryName);
    if (pCatNameNorm && (pCatNameNorm === catNameNorm || pCatNameNorm === catSlugNorm)) {
      return true;
    }
    if ((p as any).categoryId && (p as any).categoryId === cat.id) {
      return true;
    }
    return false;
  };

  // Dynamic categories: Only show categories whose products are currently listed in the store
  const displayCategories = useMemo(() => {
    const list: { id: string; name: string; slug: string; count: number }[] = [];
    const seen = new Set<string>();

    // 1. Always include 'All' first
    list.push({ id: 'All', name: 'All', slug: 'all', count: productsList.length });
    seen.add('all');

    // 2. Gather all candidate categories from Supabase (dbCategories), listed products, and presets
    const candidates: Array<{ id: string; name: string; slug: string; display_order?: number }> = [];

    // Supabase categories
    if (dbCategories.length > 0) {
      dbCategories.forEach((c) => {
        const norm = normalizeCat(c.name);
        if (norm && norm !== 'all' && !candidates.some((existing) => normalizeCat(existing.name) === norm)) {
          candidates.push(c);
        }
      });
    }

    // Categories present on active products
    productsList.forEach((p) => {
      if (p.category) {
        const norm = normalizeCat(p.category);
        if (norm && norm !== 'all' && !candidates.some((existing) => normalizeCat(existing.name) === norm)) {
          candidates.push({
            id: p.category,
            name: p.category,
            slug: norm.replace(/[^a-z0-9]/g, '-')
          });
        }
      }
    });

    // Preset categories
    CATEGORIES.forEach((c) => {
      const norm = normalizeCat(c.name);
      if (norm && norm !== 'all' && !candidates.some((existing) => normalizeCat(existing.name) === norm)) {
        candidates.push(c);
      }
    });

    // 3. For each candidate category, count matching products currently listed
    // RULE: Don't show categories whose products are currently not listed (count > 0)
    candidates.forEach((cand) => {
      const norm = normalizeCat(cand.name);
      if (!norm || seen.has(norm)) return;

      const matchingCount = productsList.filter((p) => productBelongsToCategory(p, cand)).length;

      // Only include categories that currently have at least 1 product listed!
      if (matchingCount > 0) {
        seen.add(norm);
        list.push({
          id: cand.name,
          name: formatCatName(cand.name),
          slug: cand.slug || norm.replace(/[^a-z0-9]/g, '-'),
          count: matchingCount
        });
      }
    });

    // RULE: Cleaner / Cleanser / Face Wash filter categories MUST be placed LAST on the website
    if (list.length > 1) {
      const allItem = list[0]; // 'All' category remains first
      const otherItems = list.slice(1);

      const isCleanerFilter = (cat: { id: string; name: string; slug: string }) => {
        const text = `${cat.name} ${cat.slug} ${cat.id}`.toLowerCase();
        return (
          text.includes('cleaner') ||
          text.includes('cleanser') ||
          text.includes('cleansing') ||
          text.includes('face wash') ||
          text.includes('facewash')
        );
      };

      const regularCategories = otherItems.filter((c) => !isCleanerFilter(c));
      const cleanerCategories = otherItems.filter((c) => isCleanerFilter(c));

      // Order cleaner categories so anything specifically named 'cleaner' is at the very end
      cleanerCategories.sort((a, b) => {
        const aExact = a.name.toLowerCase().includes('cleaner');
        const bExact = b.name.toLowerCase().includes('cleaner');
        if (aExact && !bExact) return 1;
        if (!aExact && bExact) return -1;
        return 0;
      });

      return [allItem, ...regularCategories, ...cleanerCategories];
    }

    return list;
  }, [dbCategories, productsList]);

  // Reset selected category to 'All' if selected category is hidden or has no products
  useEffect(() => {
    if (selectedCategory && selectedCategory !== 'All' && selectedCategory !== 'cat-all') {
      const norm = normalizeCat(selectedCategory.replace(/^cat-/, ''));
      const exists = displayCategories.some(
        c => c.name === selectedCategory ||
             normalizeCat(c.name) === norm ||
             normalizeCat(c.slug) === norm
      );
      if (!exists) {
        setSelectedCategory('All');
      }
    }
  }, [displayCategories, selectedCategory]);

  // Filtered & Sorted Products Logic
  const filteredProducts = useMemo(() => {
    const list = productsList.filter((p) => {
      // Category filter (handles display names, IDs, slugs, and case-insensitivity)
      if (selectedCategory && selectedCategory !== 'All' && selectedCategory !== 'cat-all') {
        const normSelected = normalizeCat(selectedCategory.replace(/^cat-/, ''));
        const normCat = normalizeCat(p.category);
        const matchesExact = p.category === selectedCategory;
        const matchesCaseInsensitive = p.category?.toLowerCase() === selectedCategory.toLowerCase();
        const matchesNorm = normCat === normSelected;
        const matchingCatObj = displayCategories.find(c => 
          c.id === selectedCategory || 
          c.slug === selectedCategory || 
          c.name.toLowerCase() === selectedCategory.toLowerCase() ||
          normalizeCat(c.name) === normSelected ||
          normalizeCat(c.slug) === normSelected
        );
        const matchesCatObj = matchingCatObj ? productBelongsToCategory(p, matchingCatObj) : false;

        if (!matchesExact && !matchesCaseInsensitive && !matchesNorm && !matchesCatObj) {
          return false;
        }
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

    // Apply Order in which products appear in the website
    return [...list].sort((a, b) => {
      if (productSortBy === 'price-asc') {
        return a.price - b.price;
      }
      if (productSortBy === 'price-desc') {
        return b.price - a.price;
      }
      if (productSortBy === 'rating') {
        return b.rating - a.rating;
      }
      if (productSortBy === 'bestseller') {
        const aScore = (a.isBestSeller ? 2 : 0) + (a.reviewsCount || 0);
        const bScore = (b.isBestSeller ? 2 : 0) + (b.reviewsCount || 0);
        return bScore - aScore;
      }
      if (productSortBy === 'newest') {
        const aScore = a.isNew ? 1 : 0;
        const bScore = b.isNew ? 1 : 0;
        return bScore - aScore;
      }
      if (productSortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      // 'featured' (Default sequence): Respects displayOrder / custom store sequence!
      const orderA = typeof a.displayOrder === 'number' ? a.displayOrder : 9999;
      const orderB = typeof b.displayOrder === 'number' ? b.displayOrder : 9999;
      return orderA - orderB;
    });
  }, [productsList, selectedCategory, selectedConcern, selectedSkinType, searchQuery, displayCategories, productSortBy]);

  // Cart operations
  const handleAddToCart = (product: Product, quantityOrShade?: number | ProductShade, possibleShade?: ProductShade) => {
    let quantity = 1;
    let shade: ProductShade | undefined = undefined;

    if (typeof quantityOrShade === 'number') {
      quantity = quantityOrShade;
      shade = possibleShade;
    } else if (quantityOrShade && typeof quantityOrShade === 'object') {
      shade = quantityOrShade;
      quantity = 1;
    }

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
    const existing = storeOrders.find(o => o.id === orderId || o.orderNumber === orderId);
    const orderNum = existing?.orderNumber;

    setStoreOrders(prev => {
      const updated = prev.map(o => (o.id === orderId || o.orderNumber === orderId || (orderNum && o.orderNumber === orderNum)) ? { ...o, status } : o);
      try {
        localStorage.setItem('km_store_orders', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setUserProfile((prev) => {
      const updatedOrders = prev.orders.map(o => (o.id === orderId || o.orderNumber === orderId || (orderNum && o.orderNumber === orderNum)) ? { ...o, status } : o);
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

    // Also update any customer order caches across localStorage
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('km_customer_orders_')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const list: Order[] = JSON.parse(raw);
            let hasMatch = false;
            const patched = list.map(o => {
              if (o.id === orderId || o.orderNumber === orderId || (orderNum && o.orderNumber === orderNum)) {
                hasMatch = true;
                return { ...o, status };
              }
              return o;
            });
            if (hasMatch) {
              localStorage.setItem(key, JSON.stringify(patched));
            }
          }
        }
      }
    } catch {}

    window.dispatchEvent(new CustomEvent('km_order_status_updated', { detail: { orderId, status, orderNumber: orderNum } }));

    try {
      await updateOrderStatusInSupabase(orderId, status, orderNum);
    } catch (err) {
      console.warn('[Update Status Error]:', err);
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    const existing = storeOrders.find(o => o.id === orderId || o.orderNumber === orderId);
    const orderNum = existing?.orderNumber;

    setStoreOrders(prev => {
      const updated = prev.filter(o => o.id !== orderId && o.orderNumber !== orderId && (!orderNum || o.orderNumber !== orderNum));
      try {
        localStorage.setItem('km_store_orders', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setUserProfile(prev => {
      const updatedOrders = prev.orders.filter(o => o.id !== orderId && o.orderNumber !== orderId && (!orderNum || o.orderNumber !== orderNum));
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

    // Also update any customer order caches
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('km_customer_orders_')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const list: Order[] = JSON.parse(raw);
            const filtered = list.filter(o => o.id !== orderId && o.orderNumber !== orderId && (!orderNum || o.orderNumber !== orderNum));
            if (filtered.length !== list.length) {
              localStorage.setItem(key, JSON.stringify(filtered));
            }
          }
        }
      }
    } catch {}

    window.dispatchEvent(new CustomEvent('km_order_status_updated', { detail: { orderId, action: 'delete' } }));

    deleteOrderFromSupabase(orderId, orderNum).catch(err => {
      console.warn('[Delete Order Error]:', err);
    });
  };

  const handleModifyOrder = (orderId: string, updates: Partial<Order>) => {
    const existing = storeOrders.find(o => o.id === orderId || o.orderNumber === orderId);
    const orderNum = existing?.orderNumber;

    setStoreOrders(prev => {
      const updated = prev.map(o => {
        if (o.id === orderId || o.orderNumber === orderId || (orderNum && o.orderNumber === orderNum)) {
          return {
            ...o,
            ...updates,
            shippingAddress: updates.shippingAddress ? { ...o.shippingAddress, ...updates.shippingAddress } : o.shippingAddress
          };
        }
        return o;
      });
      try {
        localStorage.setItem('km_store_orders', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setUserProfile(prev => {
      const updatedOrders = prev.orders.map(o => {
        if (o.id === orderId || o.orderNumber === orderId || (orderNum && o.orderNumber === orderNum)) {
          return {
            ...o,
            ...updates,
            shippingAddress: updates.shippingAddress ? { ...o.shippingAddress, ...updates.shippingAddress } : o.shippingAddress
          };
        }
        return o;
      });
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

    window.dispatchEvent(new CustomEvent('km_order_status_updated', { detail: { orderId, action: 'modify', updates } }));

    modifyOrderInSupabase(orderId, updates, orderNum).catch(err => {
      console.warn('[Modify Order Error]:', err);
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
          {/* 1. HERO SECTION: CINEMATIC PANORAMIC JAPANESE BEAUTY BANNER / VIDEO */}
          <HeroBanner
            onSelectProduct={setInspectProduct}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            isWishlisted={isWishlisted}
            onApplyCoupon={() => setIsCartOpen(true)}
            customBannerUrl={siteSettings.heroBannerUrl}
            customMobileBannerUrl={siteSettings.mobileHeroBannerUrl || '/konichiwamobilebg.png'}
            customVideoUrl={siteSettings.heroVideoUrl}
            customMobileVideoUrl={siteSettings.heroMobileVideoUrl}
            heroMediaType={siteSettings.heroMediaType || 'image'}
          />

          {/* 2. MAIN PRODUCT CATALOG */}
          <main id="collection" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-8 sm:pt-12 md:pt-16 pb-12 sm:pb-20">
            
            {/* Collection Section Header with Product Order / Sort Option */}
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Our Collection
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'} Available
                </p>
              </div>

              {/* Storefront Product Order / Sort Dropdown */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <label 
                  htmlFor="sort-products-select" 
                  className="text-xs font-semibold text-slate-600 dark:text-zinc-300 flex items-center gap-1.5 whitespace-nowrap"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" />
                  <span>Order:</span>
                </label>
                <select
                  id="sort-products-select"
                  value={productSortBy}
                  onChange={(e) => handleSortChange(e.target.value as ProductSortOption)}
                  className="text-xs font-semibold bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-pink-500/20 cursor-pointer shadow-2xs hover:border-pink-300 transition-colors"
                >
                  <option value="featured">✨ Default Sequence</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="bestseller">Bestsellers First</option>
                  <option value="newest">New Arrivals</option>
                  <option value="title">Alphabetical (A - Z)</option>
                </select>
              </div>
            </div>

            {/* Clean Category Pills */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2.5 sm:pb-4 mb-3 sm:mb-6 scrollbar-none">
              {displayCategories.map((cat) => {
                const isSelected =
                  selectedCategory === cat.name ||
                  selectedCategory === cat.id ||
                  (selectedCategory === 'All' && (cat.name === 'All' || cat.id === 'All' || cat.id === 'cat-all')) ||
                  (selectedCategory !== 'All' &&
                    selectedCategory.toLowerCase().replace(/^cat-/, '').replace(/[^a-z0-9]/g, '') ===
                      cat.name.toLowerCase().replace(/[^a-z0-9]/g, ''));
                return (
                  <button
                    key={cat.id || cat.name}
                    onClick={() => setSelectedCategory(cat.name as ProductCategory)}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs transition-all whitespace-nowrap cursor-pointer border ${
                      isSelected
                        ? 'bg-pink-600 hover:bg-pink-500 text-white border-pink-500 shadow-md shadow-pink-600/30 font-semibold'
                        : 'bg-white dark:bg-zinc-900/90 hover:bg-pink-50/40 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-800 font-medium shadow-xs'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
              {selectedCategory !== 'All' && selectedCategory !== 'cat-all' && (
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
            products={productsList}
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
        onRefreshOrders={handleRefreshOrders}
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
        onReorderProducts={handleReorderProducts}
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
