import React, { useState, useRef } from 'react';
import { X, 
  Package, 
  Truck, 
  Plus, 
  LogOut, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Upload, 
  Settings, 
  LayoutDashboard, 
  ArrowRight, 
  ExternalLink, 
  Check, 
  Minus, 
  Wind, 
  Sparkles, 
  Image as ImageIcon, 
  RotateCcw,
  Store,
  Trash2,
  Menu,
  Video,
  Film,
  HelpCircle,
  Info,
  Play,
  Pause,
  FolderPlus,
  Loader2,
  RefreshCw,
  Mail, Edit3,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ListOrdered,
  Bell } from 'lucide-react';
import { Order, Product, ProductCategory, SiteSettings, ReelItem } from '../types';
import { formatINR } from '../data/pincodes';
import { KonichiwaMartLogo } from './KonichiwaMartLogo';
import { getSupabaseClient, ensureSupabaseClient, fetchCategoriesFromStore, saveCategoryToStore, normalizeOrderItem } from '../lib/supabase';
import { ReelsManager } from './admin/ReelsManager';

// Client-side image optimizer to compress direct photos into fast-loading web images
const resizeAndOptimizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Clean high quality JPEG output compressed to ~100-150KB
        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(optimizedDataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image file.'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
};

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  onDeleteOrder?: (orderId: string) => void;
  onModifyOrder?: (orderId: string, updates: Partial<Order>) => void;
  onViewInvoice: (order: Order) => void;
  products: Product[];
  onUpdateProductStock: (productId: string, inStock: boolean, stockCount?: number) => void | Promise<any>;
  onUpdateProductPrice?: (productId: string, newPrice: number) => void | Promise<any>;
  onAddProduct: (product: Product) => void | Promise<any>;
  onEditProduct?: (product: Product) => void | Promise<any>;
  onRemoveProduct?: (productId: string) => void | Promise<any>;
  onResetDefaultProducts?: () => void;
  onReorderProducts?: (reordered: Product[]) => void | Promise<any>;
  onLogout: () => void;
  operatorEmail?: string;
  siteSettings: SiteSettings;
  onUpdateSiteSettings: (settings: Partial<SiteSettings>) => void;
  reels?: ReelItem[];
  onUpdateReels?: (reels: ReelItem[]) => void;
  initialTab?: 'dashboard' | 'inventory' | 'orders' | 'settings' | 'reels';
  onRefreshOrders?: () => Promise<any> | any;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  isOpen,
  onClose,
  orders,
  onRefreshOrders,
  onUpdateOrderStatus,
  onDeleteOrder,
  onModifyOrder,
  onViewInvoice,
  products,
  onUpdateProductStock,
  onUpdateProductPrice,
  onAddProduct,
  onEditProduct,
  onRemoveProduct,
  onResetDefaultProducts,
  onReorderProducts,
  onLogout,
  operatorEmail = 'dealer@konichiwamart.com',
  siteSettings,
  onUpdateSiteSettings,
  reels = [],
  onUpdateReels,
  initialTab
}) => {
  const validInitialTab = (typeof initialTab === 'string' && ['dashboard', 'inventory', 'orders', 'settings', 'reels'].includes(initialTab))
    ? initialTab
    : 'dashboard';
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'orders' | 'settings' | 'reels'>(validInitialTab);
  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);

  const handleRefresh = async () => {
    if (isRefreshingOrders) return;
    setIsRefreshingOrders(true);
    try {
      if (onRefreshOrders) {
        await onRefreshOrders();
      }
    } catch (err) {
      console.warn('[AdminPortal] Error refreshing orders:', err);
    } finally {
      setTimeout(() => setIsRefreshingOrders(false), 400);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'orders' && orders.length === 0 && onRefreshOrders) {
      handleRefresh();
    }
  }, [activeTab]);

  React.useEffect(() => {
    if (typeof initialTab === 'string' && ['dashboard', 'inventory', 'orders', 'settings', 'reels'].includes(initialTab)) {
      setActiveTab(initialTab as any);
    }
  }, [initialTab]);

  // Real-time new order chime & instant alert banner for store owner
  const prevOrdersCountRef = useRef(orders.length);
  const [newOrderAlert, setNewOrderAlert] = useState<Order | null>(null);

  const playOrderChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Primary tone (A5 - 880Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Harmonizing chime (D6 - 1174.66Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1174.66, now + 0.15);
      gain2.gain.setValueAtTime(0.15, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.55);
    } catch {}
  };

  React.useEffect(() => {
    if (orders.length > prevOrdersCountRef.current && prevOrdersCountRef.current > 0) {
      const latestOrder = orders[0];
      if (latestOrder) {
        setNewOrderAlert(latestOrder);
        playOrderChime();
        const timer = setTimeout(() => setNewOrderAlert(null), 9000);
        return () => clearTimeout(timer);
      }
    }
    prevOrdersCountRef.current = orders.length;
  }, [orders.length]);

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [savedFeedbackMap, setSavedFeedbackMap] = useState<Record<string, boolean>>({});

  // Product Deletion State
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [removeToastMessage, setRemoveToastMessage] = useState<string | null>(null);

  // Resend Email Test State
  const [testEmailRecipient, setTestEmailRecipient] = useState('info@konichiwamart.com');
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleSendTestEmail = async () => {
    if (!testEmailRecipient.trim()) return;
    setIsSendingTestEmail(true);
    setTestEmailStatus(null);
    try {
      const res = await fetch('/api/send-test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmailRecipient.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestEmailStatus({ success: true, message: data.message || 'Test email dispatched successfully!' });
      } else {
        setTestEmailStatus({ success: false, message: data.error || 'Failed to send test email.' });
      }
    } catch (err: any) {
      setTestEmailStatus({ success: false, message: err.message || 'Network error sending test email.' });
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  // Shiprocket Test State
  const [isTestingShiprocket, setIsTestingShiprocket] = useState(false);
  const [shiprocketTestResult, setShiprocketTestResult] = useState<{
    success: boolean;
    message?: string;
    accountEmail?: string;
    tokenGenerated?: boolean;
    configuredPickupLocation?: string;
    pickupLocationFound?: boolean;
    availablePickupLocations?: string[];
    walletBalance?: string;
    error?: string;
  } | null>(null);

  const handleTestShiprocket = async () => {
    setIsTestingShiprocket(true);
    setShiprocketTestResult(null);
    try {
      const res = await fetch('/api/admin/test-shiprocket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      setShiprocketTestResult(data);
    } catch (err: any) {
      setShiprocketTestResult({
        success: false,
        error: err.message || 'Failed to reach server test endpoint'
      });
    } finally {
      setIsTestingShiprocket(false);
    }
  };

  // Add Product Modal / State inside Portal
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newCategory, setNewCategory] = useState<ProductCategory>('Face Mask');
  const [newIsComingSoon, setNewIsComingSoon] = useState(false);
  const [newDisplayOrder, setNewDisplayOrder] = useState<string>('1');
  
  const resetProductForm = () => {
    setEditingProduct(null);
    setNewTitle('');
    setNewSubtitle('');
    setNewCategory('Face Mask');
    setNewIsComingSoon(false);
    setNewPrice('750');
    setNewOriginalPrice('950');
    setNewStock('50');
    setNewVolume('150ml');
    setNewPhotos([]);
    setNewDisplayOrder('1');
    setPhotoUploadError(null);
    setProductFormMsg(null);
  };

  // Reorder Products Modal State
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [orderedList, setOrderedList] = useState<Product[]>([]);
  const [reorderSearchQuery, setReorderSearchQuery] = useState('');
  const [isSavingReorder, setIsSavingReorder] = useState(false);
  const [reorderFeedbackMsg, setReorderFeedbackMsg] = useState<string | null>(null);

  // Dedicated interactive modals for orders (replaces browser prompt/confirm)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCustomerEmail, setEditCustomerEmail] = useState('');
  const [editCustomerPhone, setEditCustomerPhone] = useState('');
  const [editStatus, setEditStatus] = useState<Order['status']>('CONFIRMED');
  const [editAddressLine, setEditAddressLine] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editPincode, setEditPincode] = useState('');
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [orderActionMsg, setOrderActionMsg] = useState<string | null>(null);

  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeletingOrder, setIsDeletingOrder] = useState(false);

  const handleOpenEditOrder = (order: Order) => {
    setEditingOrder(order);
    setEditCustomerName(order.customerName || '');
    setEditCustomerEmail(order.customerEmail || '');
    setEditCustomerPhone(order.customerPhone || '');
    setEditStatus(order.status || 'CONFIRMED');
    setEditAddressLine(order.shippingAddress?.addressLine1 || '');
    setEditCity(order.shippingAddress?.city || '');
    setEditState(order.shippingAddress?.state || '');
    setEditPincode(order.shippingAddress?.pincode || '');
  };

  const handleSaveOrderEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    setIsSavingOrder(true);
    try {
      const updates: Partial<Order> = {
        customerName: editCustomerName.trim(),
        customerEmail: editCustomerEmail.trim(),
        customerPhone: editCustomerPhone.trim(),
        status: editStatus,
        shippingAddress: {
          ...editingOrder.shippingAddress,
          fullName: editCustomerName.trim() || editingOrder.shippingAddress.fullName,
          phone: editCustomerPhone.trim() || editingOrder.shippingAddress.phone,
          addressLine1: editAddressLine.trim() || editingOrder.shippingAddress.addressLine1,
          city: editCity.trim() || editingOrder.shippingAddress.city,
          state: editState.trim() || editingOrder.shippingAddress.state,
          pincode: editPincode.trim() || editingOrder.shippingAddress.pincode
        }
      };

      if (onModifyOrder) {
        await onModifyOrder(editingOrder.id, updates);
      }
      if (onUpdateOrderStatus && editStatus !== editingOrder.status) {
        await onUpdateOrderStatus(editingOrder.id, editStatus);
      }

      setOrderActionMsg(`Order #${editingOrder.orderNumber} updated successfully!`);
      setTimeout(() => setOrderActionMsg(null), 3500);
      setEditingOrder(null);
    } catch (err: any) {
      setOrderActionMsg(`Failed to update order: ${err?.message || 'Error'}`);
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleConfirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    setIsDeletingOrder(true);
    try {
      if (onDeleteOrder) {
        await onDeleteOrder(orderToDelete.id);
      }
      setOrderActionMsg(`Order #${orderToDelete.orderNumber} deleted successfully.`);
      setTimeout(() => setOrderActionMsg(null), 3500);
      setOrderToDelete(null);
    } catch (err: any) {
      setOrderActionMsg(`Failed to delete order: ${err?.message || 'Error'}`);
    } finally {
      setIsDeletingOrder(false);
    }
  };
  // Helper to ensure Cleaner / Face Wash categories always appear LAST in category listings
  const sortCategoriesWithCleanerLast = (cats: string[]) => {
    const isCleaner = (c: string) => {
      const l = c.toLowerCase();
      return (
        l.includes('cleaner') ||
        l.includes('cleanser') ||
        l.includes('cleansing') ||
        l.includes('face wash') ||
        l.includes('facewash')
      );
    };
    const regular = cats.filter((c) => !isCleaner(c));
    const cleaners = cats.filter((c) => isCleaner(c));
    cleaners.sort((a, b) => {
      const aClean = a.toLowerCase().includes('cleaner');
      const bClean = b.toLowerCase().includes('cleaner');
      if (aClean && !bClean) return 1;
      if (!aClean && bClean) return -1;
      return 0;
    });
    return [...regular, ...cleaners];
  };

  const [categoriesList, setCategoriesList] = useState<string[]>([
    'Face Mask', 'Toner', 'Sunscreen', 'Lips', 'Serum', 'Cleansing Oil', 'Moisturizer', 'Skincare', 'Face Wash'
  ]);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCustomCategoryName, setNewCustomCategoryName] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [categorySaveMsg, setCategorySaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync available categories from Supabase on load
  React.useEffect(() => {
    fetchCategoriesFromStore()
      .then((cats) => {
        if (Array.isArray(cats) && cats.length > 0) {
          const names = cats.map((c: any) => c.name);
          setCategoriesList((prev) => sortCategoriesWithCleanerLast(Array.from(new Set([...prev, ...names]))));
        }
      })
      .catch((err) => {
        console.warn('[AdminPortal] Categories fetch notice:', err);
      });
  }, []);

  // Save new category directly into Supabase and local storage
  const handleSaveNewCategory = async () => {
    const trimmed = newCustomCategoryName.trim();
    if (!trimmed) {
      setCategorySaveMsg({ type: 'error', text: 'Please enter a category name.' });
      return;
    }
    setIsSavingCategory(true);
    setCategorySaveMsg(null);
    try {
      const saved = await saveCategoryToStore(trimmed);
      if (saved) {
        setCategoriesList((prev) => sortCategoriesWithCleanerLast(Array.from(new Set([...prev, trimmed]))));
        setNewCategory(trimmed);
        setCategorySaveMsg({ type: 'success', text: `Category "${trimmed}" saved to Supabase!` });
        setTimeout(() => {
          setIsCreatingCategory(false);
          setNewCustomCategoryName('');
          setCategorySaveMsg(null);
        }, 1200);
      } else {
        setCategorySaveMsg({ type: 'error', text: 'Failed to save category in Supabase.' });
      }
    } catch (err: any) {
      setCategorySaveMsg({ type: 'error', text: err?.message || 'Error connecting to server.' });
    } finally {
      setIsSavingCategory(false);
    }
  };
  const [newPrice, setNewPrice] = useState('750');
  const [newOriginalPrice, setNewOriginalPrice] = useState('950');
  const [newStock, setNewStock] = useState('50');
  const [newVolume, setNewVolume] = useState('150ml');
  const [newPhotos, setNewPhotos] = useState<string[]>([]);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [productFormMsg, setProductFormMsg] = useState<string | null>(null);

  // Settings State Form
  const [tempStoreName, setTempStoreName] = useState(siteSettings.storeName);
  const [tempStoreTagline, setTempStoreTagline] = useState(siteSettings.storeTagline);
  const [settingsSuccessMsg, setSettingsSuccessMsg] = useState<string | null>(null);

  // Banner & logo file upload ref
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const mobileBannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const mobileVideoInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingMobileBanner, setIsUploadingMobileBanner] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState(siteSettings.heroVideoUrl || '');
  const [mobileVideoUrlInput, setMobileVideoUrlInput] = useState(siteSettings.heroMobileVideoUrl || '');
  const [showVideoHostingGuide, setShowVideoHostingGuide] = useState(false);

  if (!isOpen) return null;

  // Key Dashboard Statistics
  const totalStockUnits = products.reduce((sum, p) => sum + (p.stock ?? 0), 0);

  // Quick Stock Adjustment
  const handleStockChange = (productId: string, newCount: number) => {
    const validCount = Math.max(0, Math.floor(newCount));
    onUpdateProductStock(productId, validCount > 0, validCount);

    setSavedFeedbackMap((prev) => ({ ...prev, [productId]: true }));
    setTimeout(() => {
      setSavedFeedbackMap((prev) => ({ ...prev, [productId]: false }));
    }, 1500);
  };

  const handleStockIncrement = (productId: string, currentStock: number, delta: number) => {
    handleStockChange(productId, currentStock + delta);
  };

  // Banner Upload File Handler (Desktop / Laptop)
  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBanner(true);
    try {
      // 1. Optimize image client-side to lightweight compressed JPEG
      const optimizedBase64 = await resizeAndOptimizeImage(file);
      let bannerUrlToUse = optimizedBase64;

      // 2. Try Supabase Storage upload for permanent CDN public URL
      const supabase = await ensureSupabaseClient() || getSupabaseClient();
      if (supabase) {
        try {
          const ext = file.name.split('.').pop() || 'jpg';
          const fileName = `hero_desktop_${Date.now()}.${ext}`;
          const { error: uploadErr } = await supabase.storage
            .from('product-images')
            .upload(fileName, file, { cacheControl: '3600', upsert: true });

          if (!uploadErr) {
            const { data: publicUrlData } = supabase.storage
              .from('product-images')
              .getPublicUrl(fileName);
            if (publicUrlData?.publicUrl) {
              bannerUrlToUse = publicUrlData.publicUrl;
            }
          }
        } catch (sErr) {
          console.warn('Supabase banner upload skipped, using optimized base64:', sErr);
        }
      }

      // 3. Save locally in localStorage so Vercel client persistent sessions immediately pick it up
      try {
        localStorage.setItem('km_hero_banner_data', bannerUrlToUse);
      } catch {}

      // 4. Update site settings state
      onUpdateSiteSettings({ heroBannerUrl: bannerUrlToUse, backgroundImageUrl: bannerUrlToUse });

      // 5. Best-effort server sync for container environments
      fetch('/api/upload-banner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: optimizedBase64, target: 'desktop' })
      }).catch(() => {});

      setSettingsSuccessMsg('Laptop & desktop background updated successfully!');
      setTimeout(() => setSettingsSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Error uploading banner:', err);
      setSettingsSuccessMsg('Failed to process image. Please try another image.');
    } finally {
      setIsUploadingBanner(false);
      if (e.target) e.target.value = '';
    }
  };

  // Mobile Layout Banner Upload File Handler
  const handleMobileBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMobileBanner(true);
    try {
      // 1. Optimize image client-side to lightweight compressed JPEG
      const optimizedBase64 = await resizeAndOptimizeImage(file);
      let bannerUrlToUse = optimizedBase64;

      // 2. Try Supabase Storage upload for permanent CDN public URL
      const supabase = await ensureSupabaseClient() || getSupabaseClient();
      if (supabase) {
        try {
          const ext = file.name.split('.').pop() || 'jpg';
          const fileName = `hero_mobile_${Date.now()}.${ext}`;
          const { error: uploadErr } = await supabase.storage
            .from('product-images')
            .upload(fileName, file, { cacheControl: '3600', upsert: true });

          if (!uploadErr) {
            const { data: publicUrlData } = supabase.storage
              .from('product-images')
              .getPublicUrl(fileName);
            if (publicUrlData?.publicUrl) {
              bannerUrlToUse = publicUrlData.publicUrl;
            }
          }
        } catch (sErr) {
          console.warn('Supabase mobile banner upload skipped, using optimized base64:', sErr);
        }
      }

      // 3. Save locally in localStorage so Vercel client persistent sessions immediately pick it up
      try {
        localStorage.setItem('km_hero_mobile_banner_data', bannerUrlToUse);
      } catch {}

      // 4. Update site settings state
      onUpdateSiteSettings({ mobileHeroBannerUrl: bannerUrlToUse, mobileBackgroundImageUrl: bannerUrlToUse });

      // 5. Best-effort server sync for container environments
      fetch('/api/upload-banner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: optimizedBase64, target: 'mobile' })
      }).catch(() => {});

      setSettingsSuccessMsg('Mobile layout background updated successfully!');
      setTimeout(() => setSettingsSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Error uploading mobile banner:', err);
      setSettingsSuccessMsg('Failed to process mobile image. Please try another image.');
    } finally {
      setIsUploadingMobileBanner(false);
      if (e.target) e.target.value = '';
    }
  };

  // Logo Upload File Handler
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      onUpdateSiteSettings({ logoUrl: base64 });
      setIsUploadingLogo(false);
      setSettingsSuccessMsg('Custom store logo uploaded & applied!');
      setTimeout(() => setSettingsSuccessMsg(null), 3000);
    };
    reader.readAsDataURL(file);
  };

  // Hero Video File Handler
  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>, target: 'desktop' | 'mobile' = 'desktop') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setSettingsSuccessMsg('Please select a valid video file (.mp4, .webm).');
      return;
    }

    if (file.size > 80 * 1024 * 1024) {
      setSettingsSuccessMsg('Video file is over 80MB. For optimal web playback, please compress to under 25MB or host on Cloudinary / Supabase Storage.');
      return;
    }

    setIsUploadingVideo(true);
    try {
      let finalUrl = '';

      // Try Supabase Storage upload first
      const supabase = await ensureSupabaseClient() || getSupabaseClient();
      if (supabase) {
        try {
          const ext = file.name.split('.').pop() || 'mp4';
          const fileName = `hero_video_${target}_${Date.now()}.${ext}`;
          const { error: uploadErr } = await supabase.storage
            .from('product-images')
            .upload(fileName, file, { cacheControl: '3600', upsert: true });

          if (!uploadErr) {
            const { data: publicUrlData } = supabase.storage
              .from('product-images')
              .getPublicUrl(fileName);
            if (publicUrlData?.publicUrl) {
              finalUrl = publicUrlData.publicUrl;
            }
          }
        } catch (sErr) {
          console.warn('Supabase video upload skipped, trying server endpoint:', sErr);
        }
      }

      // If Supabase wasn't available or errored, use server endpoint
      if (!finalUrl) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const res = await fetch('/api/upload-hero-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoBase64: base64, target })
        });
        const data = await res.json();
        if (data?.success && data?.url) {
          finalUrl = data.url;
        } else {
          throw new Error(data?.error || 'Failed to save video on server');
        }
      }

      if (finalUrl) {
        if (target === 'desktop') {
          setVideoUrlInput(finalUrl);
          localStorage.setItem('km_hero_video_url', finalUrl);
          onUpdateSiteSettings({ heroVideoUrl: finalUrl, heroMediaType: 'video' });
        } else {
          setMobileVideoUrlInput(finalUrl);
          localStorage.setItem('km_hero_mobile_video_url', finalUrl);
          onUpdateSiteSettings({ heroMobileVideoUrl: finalUrl, heroMediaType: 'video' });
        }
        setSettingsSuccessMsg(`${target === 'desktop' ? 'Desktop' : 'Mobile'} hero video saved & active!`);
        setTimeout(() => setSettingsSuccessMsg(null), 3500);
      }
    } catch (err: any) {
      console.error('Error uploading video:', err);
      setSettingsSuccessMsg(`Video upload error: ${err?.message || 'Check connection or file size'}`);
    } finally {
      setIsUploadingVideo(false);
      if (e.target) e.target.value = '';
    }
  };

  // Product Photos Multi-Upload Handler (4-5 direct photos)
  const handleProductPhotosChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingPhotos(true);
    setPhotoUploadError(null);

    try {
      const remainingSlots = 5 - newPhotos.length;
      if (remainingSlots <= 0) {
        setPhotoUploadError('Maximum 5 photos allowed. Remove a photo to replace it.');
        setIsProcessingPhotos(false);
        return;
      }

      const filesToProcess: File[] = (Array.from(files) as File[]).slice(0, remainingSlots);
      const supabase = await ensureSupabaseClient() || getSupabaseClient();
      
      const processedUrls: string[] = [];

      for (const file of filesToProcess) {
        // Optimize direct file into clean web JPEG
        const base64 = await resizeAndOptimizeImage(file);
        let uploadedUrl: string | null = null;
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `km_prod_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

        // Attempt 1: Direct Supabase Storage
        if (supabase) {
          try {
            const { data, error } = await supabase.storage
              .from('product-images')
              .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true
              });

            if (!error && data) {
              const { data: publicUrlData } = supabase.storage
                .from('product-images')
                .getPublicUrl(fileName);
              if (publicUrlData?.publicUrl) {
                uploadedUrl = publicUrlData.publicUrl;
              }
            }
          } catch (storageErr) {
            console.warn('Direct Supabase storage upload notice:', storageErr);
          }
        }

        // Attempt 2: Server-side proxy upload (bypasses RLS with service-role or writes to public directory)
        if (!uploadedUrl) {
          try {
            const res = await fetch('/api/upload-product-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ imageBase64: base64, fileName })
            });
            if (res.ok) {
              const json = await res.json();
              if (json?.success && json.url) {
                uploadedUrl = json.url;
              }
            }
          } catch (serverErr) {
            console.warn('Server upload-product-image notice:', serverErr);
          }
        }

        // Attempt 3: High quality optimized base64
        if (!uploadedUrl) {
          uploadedUrl = base64;
        }

        processedUrls.push(uploadedUrl);
      }

      setNewPhotos((prev) => [...prev, ...processedUrls].slice(0, 5));
    } catch (err) {
      console.error('Failed to process photos:', err);
      setPhotoUploadError('Failed to upload one or more images. Please check your connection or try again.');
    } finally {
      setIsProcessingPhotos(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    setNewPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoUploadError(null);
  };

  const handleSetCoverPhoto = (index: number) => {
    if (index === 0) return;
    setNewPhotos((prev) => {
      const target = prev[index];
      const rest = prev.filter((_, i) => i !== index);
      return [target, ...rest];
    });
  };

  // Handle Add / Edit Product submit
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || newPrice.trim() === '') return;

    // Use uploaded photos or graceful default Japanese skincare image
    const photosToUse = newPhotos.length > 0 ? newPhotos : ['/products/keana-rice-mask.png'];

    const rawPrice = parseInt(newPrice, 10);
    const parsedPrice = isNaN(rawPrice) ? 0 : Math.max(0, rawPrice);

    const rawOriginal = parseInt(newOriginalPrice, 10);
    const parsedOriginal = isNaN(rawOriginal) ? parsedPrice : Math.max(0, rawOriginal);

    const rawStock = parseInt(newStock, 10);
    const parsedStock = isNaN(rawStock) ? 0 : Math.max(0, rawStock);

    const mainCover = photosToUse[0] || '/products/keana-rice-mask.png';
    const secondary = photosToUse[1] || undefined;

    setIsSavingProduct(true);
    setPhotoUploadError(null);
    setProductFormMsg(null);

    try {
      if (editingProduct) {
        const currentBadges = (editingProduct.badges || []).filter(b => b !== 'Coming Soon');
        if (newIsComingSoon) {
          currentBadges.unshift('Coming Soon');
        }

        const updatedProduct: Product = {
          ...editingProduct,
          title: newTitle.trim(),
          subtitle: newSubtitle.trim() || `${newCategory} • Authentic Japan Skincare`,
          price: parsedPrice,
          originalPrice: parsedOriginal,
          category: newCategory,
          volume: newVolume || '100ml',
          image: mainCover,
          secondaryImage: secondary,
          images: photosToUse,
          stock: parsedStock,
          badges: currentBadges,
          isComingSoon: newIsComingSoon,
          displayOrder: parseInt(newDisplayOrder, 10) || editingProduct.displayOrder || products.length + 1
        };

        if (onEditProduct) {
          await onEditProduct(updatedProduct);
        }
        setProductFormMsg(`Product "${newTitle}" updated & synced to Supabase database!`);
      } else {
        const initialBadges = newIsComingSoon
          ? ['Coming Soon', 'Japan Arrival', 'Authentic Import']
          : ['Japan Arrival', 'Authentic Import'];

        const newProduct: Product = {
          id: `km-${Date.now()}`,
          title: newTitle.trim(),
          subtitle: newSubtitle.trim() || `${newCategory} • Authentic Japan Skincare`,
          price: parsedPrice,
          originalPrice: parsedOriginal,
          rating: 4.9,
          reviewsCount: 1,
          category: newCategory,
          skinTypes: ['All'],
          skinConcerns: ['Hydration', 'Glow & Dullness'],
          routine: 'AM/PM',
          volume: newVolume || '100ml',
          badges: initialBadges,
          isComingSoon: newIsComingSoon,
          image: mainCover,
          secondaryImage: secondary,
          images: photosToUse,
          accentColor: '#C52857',
          bgGradient: 'from-pink-50 to-rose-100',
          stock: parsedStock,
          displayOrder: parseInt(newDisplayOrder, 10) || products.length + 1,
          keyActives: [
            { name: 'Japanese Botanical Extract', purpose: 'Restores skin barrier & luminosity' }
          ],
          fullIngredients: 'Water, Glycerin, Butylene Glycol, Sodium Hyaluronate.',
          description: 'Official direct imported Japanese skincare formulation.',
          benefits: ['Deep hydration', 'Authentic import', 'Skin gentle'],
          usageHowTo: 'Apply onto cleansed skin. Gently pat with palms until absorbed.'
        };

        await onAddProduct(newProduct);
        setProductFormMsg(`Product "${newTitle}" saved & synced to Supabase database!`);
      }

      setTimeout(() => {
        resetProductForm();
        setShowAddProductModal(false);
        setActiveTab('inventory');
      }, 1000);
    } catch (err: any) {
      setPhotoUploadError(`Failed to save to database: ${err?.message || 'Connection error'}`);
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleOpenEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewTitle(product.title);
    setNewSubtitle(product.subtitle || '');
    setNewCategory(product.category);
    setNewPrice(product.price.toString());
    setNewOriginalPrice(product.originalPrice?.toString() || product.price.toString());
    setNewStock(product.stock.toString());
    setNewVolume(product.volume || '150ml');
    setNewPhotos(product.images || (product.image ? [product.image] : []));
    setNewIsComingSoon(Boolean(product.isComingSoon || (product.badges && product.badges.includes('Coming Soon'))));
    setNewDisplayOrder(
      product.displayOrder !== undefined
        ? String(product.displayOrder)
        : String(products.findIndex((p) => p.id === product.id) + 1)
    );
    setShowAddProductModal(true);
  };

  // Reorder & Sequence Management Handlers
  const handleQuickMove = async (productId: string, direction: -1 | 1) => {
    const currentIndex = products.findIndex((p) => p.id === productId);
    if (currentIndex === -1) return;
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= products.length) return;

    const copy = [...products];
    const [moved] = copy.splice(currentIndex, 1);
    copy.splice(targetIndex, 0, moved);

    if (onReorderProducts) {
      await onReorderProducts(copy);
      setRemoveToastMessage(`Moved "${moved.title}" to position #${targetIndex + 1} on website.`);
      setTimeout(() => setRemoveToastMessage(null), 3000);
    }
  };

  const handleOpenReorderModal = () => {
    setOrderedList([...products].sort((a, b) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999)));
    setReorderSearchQuery('');
    setReorderFeedbackMsg(null);
    setShowReorderModal(true);
  };

  const handleMoveInModal = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= orderedList.length) return;
    setOrderedList((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, item);
      return copy;
    });
  };

  const handleMoveToPosition = (fromIndex: number, targetRank: number) => {
    const targetIndex = Math.max(0, Math.min(orderedList.length - 1, targetRank - 1));
    if (targetIndex === fromIndex) return;
    handleMoveInModal(fromIndex, targetIndex);
  };

  const handleApplyPresetOrder = (preset: 'bestseller' | 'price-asc' | 'price-desc' | 'title' | 'reset') => {
    setOrderedList((prev) => {
      const copy = [...prev];
      if (preset === 'bestseller') {
        copy.sort((a, b) => {
          const aScore = (a.isBestSeller ? 2 : 0) + (a.reviewsCount || 0);
          const bScore = (b.isBestSeller ? 2 : 0) + (b.reviewsCount || 0);
          return bScore - aScore;
        });
      } else if (preset === 'price-asc') {
        copy.sort((a, b) => a.price - b.price);
      } else if (preset === 'price-desc') {
        copy.sort((a, b) => b.price - a.price);
      } else if (preset === 'title') {
        copy.sort((a, b) => a.title.localeCompare(b.title));
      } else if (preset === 'reset') {
        copy.sort((a, b) => a.id.localeCompare(b.id));
      }
      return copy;
    });
    setReorderFeedbackMsg(`Applied preset sequence. Click "Save Website Order" to publish.`);
  };

  const handleSaveModalReorder = async () => {
    if (!onReorderProducts) return;
    setIsSavingReorder(true);
    try {
      await onReorderProducts(orderedList);
      setReorderFeedbackMsg('Product sequence saved & updated across the website!');
      setTimeout(() => {
        setShowReorderModal(false);
        setReorderFeedbackMsg(null);
      }, 1000);
    } catch (err: any) {
      setReorderFeedbackMsg(`Error saving order: ${err?.message || 'Failed'}`);
    } finally {
      setIsSavingReorder(false);
    }
  };

  // Filtered Products for Inventory Table
  const filteredProducts = products.filter((p) => {
    const normFilter = categoryFilter.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normCat = (p.category || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter || normCat === normFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-[90] flex bg-[#FAF7F2] dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 overflow-hidden font-sans select-text animate-in fade-in duration-200 admin-portal-root">
      
      {/* ========================================================================= */}
      {/* 1. LEFT SIDEBAR NAVIGATION - DESKTOP */}
      {/* ========================================================================= */}
      <aside className="hidden md:flex md:w-64 lg:w-72 bg-white/95 border-r border-pink-100 flex-col justify-between flex-shrink-0 shadow-xs">
        <div>
          {/* Top Brand Header */}
          <div className="p-6 flex items-center gap-3 border-b border-pink-100">
            <div className="w-10 h-10 rounded-xl bg-pink-50 border border-pink-200/80 flex items-center justify-center p-1.5 shadow-2xs flex-shrink-0">
              {siteSettings.logoUrl ? (
                <img 
                  src={siteSettings.logoUrl} 
                  alt="Store Logo" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Store className="w-6 h-6 text-pink-600" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-sm tracking-wider uppercase text-slate-900 truncate">
                {siteSettings.storeName || 'KONICHIWA MART'}
              </h1>
              <span className="text-[10px] tracking-widest uppercase font-bold text-pink-600 block mt-0.5">
                OPERATOR PORTAL
              </span>
            </div>
          </div>

          {/* Menu Section */}
          <div className="px-4 py-6">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 mb-3">
              MENU
            </div>

            <nav className="space-y-1 text-xs">
              {/* DASHBOARD TAB */}
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all cursor-pointer text-left font-medium ${
                  activeTab === 'dashboard'
                    ? 'bg-pink-50 text-pink-700 shadow-xs font-bold border-l-4 border-pink-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-stone-50'
                }`}
              >
                <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-pink-600' : 'text-slate-400'}`} />
                <span className="tracking-wide">DASHBOARD</span>
              </button>

              {/* INVENTORY TAB */}
              <button
                onClick={() => setActiveTab('inventory')}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all cursor-pointer text-left font-medium ${
                  activeTab === 'inventory'
                    ? 'bg-pink-50 text-pink-700 shadow-xs font-bold border-l-4 border-pink-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Package className={`w-4 h-4 ${activeTab === 'inventory' ? 'text-pink-600' : 'text-slate-400'}`} />
                  <span className="tracking-wide">INVENTORY</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 font-bold">
                  {products.length}
                </span>
              </button>

              {/* ORDERS TAB */}
              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all cursor-pointer text-left font-medium ${
                  activeTab === 'orders'
                    ? 'bg-pink-50 text-pink-700 shadow-xs font-bold border-l-4 border-pink-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Truck className={`w-4 h-4 ${activeTab === 'orders' ? 'text-pink-600' : 'text-slate-400'}`} />
                  <span className="tracking-wide">ORDERS & LEADS</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 font-bold">
                  {orders.length}
                </span>
              </button>

              {/* COMMUNITY REELS TAB */}
              <button
                onClick={() => setActiveTab('reels')}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all cursor-pointer text-left font-medium ${
                  activeTab === 'reels'
                    ? 'bg-pink-50 text-pink-700 shadow-xs font-bold border-l-4 border-pink-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Video className={`w-4 h-4 ${activeTab === 'reels' ? 'text-pink-600' : 'text-slate-400'}`} />
                  <span className="tracking-wide">COMMUNITY REELS</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 font-bold">
                  {reels.length}
                </span>
              </button>

              {/* SITE SETTINGS TAB */}
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all cursor-pointer text-left font-medium ${
                  activeTab === 'settings'
                    ? 'bg-pink-50 text-pink-700 shadow-xs font-bold border-l-4 border-pink-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-stone-50'
                }`}
              >
                <Settings className={`w-4 h-4 ${activeTab === 'settings' ? 'text-pink-600' : 'text-slate-400'}`} />
                <span className="tracking-wide">SITE SETTINGS</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Bottom Operator Status */}
        <div className="p-4 border-t border-pink-100 bg-stone-50/70">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Operator</div>
          <div className="text-xs text-slate-700 font-semibold truncate mt-0.5">{operatorEmail}</div>
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full mt-3 py-2 px-3 rounded-xl bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-rose-200 shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MOBILE SLIDE-OUT DRAWER OVERLAY */}
      {/* ========================================================================= */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-150">
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs" 
            onClick={() => setMobileDrawerOpen(false)} 
          />
          <aside className="relative w-4/5 max-w-xs bg-white h-full flex flex-col justify-between shadow-2xl z-10 border-r border-pink-100 animate-in slide-in-from-left duration-200">
            <div>
              {/* Header */}
              <div className="p-4 sm:p-5 flex items-center justify-between border-b border-pink-100 bg-pink-50/40">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white border border-pink-200 flex items-center justify-center p-1 shadow-2xs">
                    {siteSettings.logoUrl ? (
                      <img src={siteSettings.logoUrl} alt="Store Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <Store className="w-5 h-5 text-pink-600" />
                    )}
                  </div>
                  <div>
                    <h1 className="font-bold text-xs tracking-wider uppercase text-slate-900 truncate">
                      {siteSettings.storeName || 'KONICHIWA MART'}
                    </h1>
                    <span className="text-[9px] tracking-widest uppercase font-bold text-pink-600 block">
                      OPERATOR PORTAL
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="w-8 h-8 rounded-lg bg-white hover:bg-stone-100 flex items-center justify-center text-slate-500 border border-stone-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Menu Navigation */}
              <div className="p-4 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 mb-2">
                  PORTAL NAVIGATION
                </div>

                <button
                  onClick={() => { setActiveTab('dashboard'); setMobileDrawerOpen(false); }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'dashboard'
                      ? 'bg-pink-50 text-pink-700 border-l-4 border-pink-600 shadow-2xs'
                      : 'text-slate-700 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-pink-600' : 'text-slate-400'}`} />
                    <span>Dashboard Overview</span>
                  </div>
                </button>

                <button
                  onClick={() => { setActiveTab('inventory'); setMobileDrawerOpen(false); }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'inventory'
                      ? 'bg-pink-50 text-pink-700 border-l-4 border-pink-600 shadow-2xs'
                      : 'text-slate-700 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Package className={`w-4 h-4 ${activeTab === 'inventory' ? 'text-pink-600' : 'text-slate-400'}`} />
                    <span>Product Catalog</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 font-bold">
                    {products.length}
                  </span>
                </button>

                <button
                  onClick={() => { setActiveTab('orders'); setMobileDrawerOpen(false); }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'orders'
                      ? 'bg-pink-50 text-pink-700 border-l-4 border-pink-600 shadow-2xs'
                      : 'text-slate-700 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Truck className={`w-4 h-4 ${activeTab === 'orders' ? 'text-pink-600' : 'text-slate-400'}`} />
                    <span>Orders & Leads</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 font-bold">
                    {orders.length}
                  </span>
                </button>

                <button
                  onClick={() => { setActiveTab('reels'); setMobileDrawerOpen(false); }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'reels'
                      ? 'bg-pink-50 text-pink-700 border-l-4 border-pink-600 shadow-2xs'
                      : 'text-slate-700 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Video className={`w-4 h-4 ${activeTab === 'reels' ? 'text-pink-600' : 'text-slate-400'}`} />
                    <span>Community Reels</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 font-bold">
                    {reels.length}
                  </span>
                </button>

                <button
                  onClick={() => { setActiveTab('settings'); setMobileDrawerOpen(false); }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'settings'
                      ? 'bg-pink-50 text-pink-700 border-l-4 border-pink-600 shadow-2xs'
                      : 'text-slate-700 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Settings className={`w-4 h-4 ${activeTab === 'settings' ? 'text-pink-600' : 'text-slate-400'}`} />
                    <span>Store Settings</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Bottom Operator Status in Drawer */}
            <div className="p-4 border-t border-pink-100 bg-stone-50/80">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Signed in as</div>
              <div className="text-xs text-slate-800 font-bold truncate mt-0.5">{operatorEmail}</div>
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full mt-3 py-2 px-3 rounded-xl bg-white hover:bg-rose-50 text-rose-600 text-xs font-semibold flex items-center justify-center gap-2 border border-rose-200 shadow-2xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MAIN CONTENT VIEWPORT */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#FAF7F2]">
        
        {/* Floating Real-Time New Order Alert */}
        {newOrderAlert && (
          <div className="fixed top-4 right-4 z-50 max-w-md bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 rounded-2xl shadow-2xl border border-white/20 animate-in fade-in slide-in-from-top-4 duration-300 flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 animate-pulse">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-sm flex items-center justify-between">
                <span>🎉 New Order Placed!</span>
                <button onClick={() => setNewOrderAlert(null)} className="text-white/80 hover:text-white text-xs cursor-pointer p-1">✕</button>
              </div>
              <p className="text-xs font-bold text-white mt-0.5 truncate">
                Order #{newOrderAlert.orderNumber} • {formatINR(newOrderAlert.totalAmount)}
              </p>
              <p className="text-[11px] text-emerald-100 mt-0.5 truncate">
                Customer: {newOrderAlert.customerName} {newOrderAlert.customerPhone ? `(${newOrderAlert.customerPhone})` : ''}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setActiveTab('orders'); setNewOrderAlert(null); }}
                  className="px-2.5 py-1 rounded-lg bg-white text-emerald-800 text-[11px] font-bold shadow-xs hover:bg-emerald-50 cursor-pointer"
                >
                  View Order Details &rarr;
                </button>
                <span className="text-[10px] text-emerald-200">Email alert sent to owner</span>
              </div>
            </div>
          </div>
        )}

        {/* TOP APP BAR (Search + Website link + Close + Mobile Drawer Toggle) */}
        <header className="h-14 sm:h-16 border-b border-pink-100 px-3 sm:px-6 flex items-center justify-between flex-shrink-0 bg-white/95 backdrop-blur-md gap-2">
          {/* Left: Mobile hamburger or brand indicator */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden w-9 h-9 rounded-xl bg-pink-50 hover:bg-pink-100 border border-pink-200 text-pink-700 flex items-center justify-center cursor-pointer transition-colors"
              aria-label="Open portal menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <span className="md:hidden text-xs font-bold text-slate-800 uppercase tracking-wider">
              {activeTab === 'dashboard' ? 'Dashboard' : activeTab === 'inventory' ? 'Inventory' : activeTab === 'orders' ? 'Orders' : 'Settings'}
            </span>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 max-w-xs sm:max-w-md">
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search products, orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-3 py-1.5 sm:py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
            />
          </div>

          {/* Right Action: Website button & Close */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              onClick={onClose}
              className="hidden sm:inline-flex px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-stone-200 hover:border-pink-300 bg-white hover:bg-pink-50 text-slate-700 hover:text-pink-700 text-xs font-bold tracking-wider uppercase items-center gap-2 cursor-pointer transition-all shadow-xs"
            >
              <span>WEBSITE</span>
              <ExternalLink className="w-3.5 h-3.5 text-pink-600" />
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white hover:bg-rose-50 border border-stone-200 hover:border-rose-200 text-slate-500 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer shadow-xs"
              title="Close Portal"
              aria-label="Close Portal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* VIEW BODY SCROLLABLE CONTAINER */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 space-y-6 sm:space-y-8 pb-24 md:pb-10">
          
          {/* ========================================================================= */}
          {/* TAB: DASHBOARD */}
          {/* ========================================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 max-w-6xl">
              {/* Dashboard Title & Subhead */}
              <div>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900 font-sans">
                  OPERATOR DASHBOARD
                </h2>
                <p className="text-[11px] sm:text-xs tracking-wider uppercase text-slate-500 font-semibold mt-1">
                  DIRECT MANAGEMENT OPTIONS FOR PRODUCT LISTINGS AND STORE SITE SETTINGS.
                </p>
              </div>

              {/* QUICK ACTIONS SECTION */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                  QUICK ACTIONS
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card 1: Add Product */}
                  <div className="bg-white border border-pink-100 rounded-2xl p-6 hover:border-pink-200 hover:shadow-md transition-all flex flex-col justify-between shadow-xs">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-pink-50 border border-pink-200/80 flex items-center justify-center text-pink-600 mb-4">
                        <Plus className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-sm tracking-wider uppercase text-slate-900">
                        UPLOAD PRODUCT
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed mt-2">
                        Add a new authentic Japanese item with specs, pricing, and high-res photos.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        resetProductForm();
                        setShowAddProductModal(true);
                      }}
                      className="mt-6 pt-4 border-t border-stone-100 flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-pink-600 uppercase tracking-wider cursor-pointer group"
                    >
                      <span>ADD PRODUCT</span>
                      <ArrowRight className="w-3.5 h-3.5 text-pink-600 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>

                  {/* Card 2: View Inventory */}
                  <div className="bg-white border border-pink-100 rounded-2xl p-6 hover:border-pink-200 hover:shadow-md transition-all flex flex-col justify-between shadow-xs">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-pink-50 border border-pink-200/80 flex items-center justify-center text-pink-600 mb-4">
                        <Package className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-sm tracking-wider uppercase text-slate-900">
                        VIEW INVENTORY
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed mt-2">
                        Browse, edit stock units, update status, or adjust prices across current products.
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveTab('inventory')}
                      className="mt-6 pt-4 border-t border-stone-100 flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-pink-600 uppercase tracking-wider cursor-pointer group"
                    >
                      <span>MANAGE LIST</span>
                      <ArrowRight className="w-3.5 h-3.5 text-pink-600 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>

                  {/* Card 3: Site Settings */}
                  <div className="bg-white border border-pink-100 rounded-2xl p-6 hover:border-pink-200 hover:shadow-md transition-all flex flex-col justify-between shadow-xs">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-pink-50 border border-pink-200/80 flex items-center justify-center text-pink-600 mb-4">
                        <Settings className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-sm tracking-wider uppercase text-slate-900">
                        SITE SETTINGS
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed mt-2">
                        Upload cover photos, custom store logo, & control flower drift breeze.
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveTab('settings')}
                      className="mt-6 pt-4 border-t border-stone-100 flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-pink-600 uppercase tracking-wider cursor-pointer group"
                    >
                      <span>EDIT SETTINGS</span>
                      <ArrowRight className="w-3.5 h-3.5 text-pink-600 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>

              {/* INVENTORY SUMMARY SECTION */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                  INVENTORY SUMMARY
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Summary Card 1 */}
                  <div className="bg-white border border-pink-100 rounded-2xl p-5 flex items-center gap-4 shadow-xs">
                    <div className="w-12 h-12 rounded-xl bg-pink-50 border border-pink-200/60 flex items-center justify-center text-pink-600 flex-shrink-0">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        ACTIVE PRODUCTS
                      </div>
                      <div className="text-2xl font-black text-slate-900 mt-0.5">
                        {products.length}
                      </div>
                    </div>
                  </div>

                  {/* Summary Card 2 */}
                  <div className="bg-white border border-pink-100 rounded-2xl p-5 flex items-center gap-4 shadow-xs">
                    <div className="w-12 h-12 rounded-xl bg-pink-50 border border-pink-200/60 flex items-center justify-center text-pink-600 flex-shrink-0">
                      <Truck className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        ORDERS PROCESSED
                      </div>
                      <div className="text-2xl font-black text-slate-900 mt-0.5">
                        {orders.length}
                      </div>
                    </div>
                  </div>

                  {/* Summary Card 3 */}
                  <div className="bg-white border border-pink-100 rounded-2xl p-5 flex items-center gap-4 shadow-xs">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 flex-shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        TOTAL CATALOG STOCK
                      </div>
                      <div className="text-2xl font-black text-slate-900 mt-0.5">
                        {totalStockUnits} Units
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RECENT ORDERS / LEADS SECTION */}
              <div className="bg-white border border-pink-100 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-sm tracking-wider uppercase text-slate-900">
                      RECENT ORDERS
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Customer transactions with live GST invoice and courier dispatches
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-bold text-slate-600 hover:text-pink-600 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span>VIEW ALL ({orders.length})</span>
                    <ArrowRight className="w-3.5 h-3.5 text-pink-600" />
                  </button>
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No orders placed yet. Customer orders will appear here automatically.
                  </div>
                ) : (
                  <>
                    {/* Mobile recent orders cards */}
                    <div className="block md:hidden space-y-2.5">
                      {orders.slice(0, 4).map((o) => (
                        <div key={o.id} className="p-3 bg-stone-50/80 rounded-xl border border-stone-200/80 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-slate-900 text-xs">{o.orderNumber}</span>
                            <span className="font-bold text-slate-900 text-xs">{formatINR(o.totalAmount)}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-600">
                            <span>{o.customerName} ({o.shippingAddress.city})</span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-100">
                              {o.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 pt-1 border-t border-stone-200/60">
                            <button
                              onClick={() => handleOpenEditOrder(o)}
                              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-stone-100 border border-stone-200 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="Edit Order"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => setOrderToDelete(o)}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="Delete Order"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                            <button
                              onClick={() => onViewInvoice(o)}
                              className="flex-1 py-1.5 rounded-lg bg-white hover:bg-pink-50 text-pink-700 font-semibold text-xs border border-pink-200 shadow-2xs cursor-pointer text-center whitespace-nowrap"
                            >
                              View Invoice
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop recent orders table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="text-[10px] font-semibold text-slate-500 uppercase border-b border-stone-200 bg-stone-50/80">
                          <tr>
                            <th className="py-2.5 px-3">Order ID</th>
                            <th className="py-2.5 px-3">Customer</th>
                            <th className="py-2.5 px-3">Ordered Items</th>
                            <th className="py-2.5 px-3">Destination</th>
                            <th className="py-2.5 px-3">Amount</th>
                            <th className="py-2.5 px-3">Delivery</th>
                            <th className="py-2.5 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {orders.slice(0, 4).map((o) => (
                            <tr key={o.id} className="text-slate-700 hover:bg-pink-50/30 transition-colors">
                              <td className="py-3 px-3 font-mono font-bold text-slate-900">{o.orderNumber}</td>
                              <td className="py-3 px-3 text-[10px] text-slate-500">
                                <div className="font-semibold text-slate-900 text-xs">{o.customerName}</div>
                                <div>{o.customerEmail}</div>
                                <div className="text-slate-400">{o.customerPhone}</div>
                              </td>
                              <td className="py-3 px-3 text-slate-600 max-w-[150px]">
                                <ul className="space-y-1 text-[10px]">
                                  {(o.items || []).map((item, idx) => (
                                    <li key={idx} className="truncate" title={item.title}>
                                      {item.quantity}x {item.title}
                                    </li>
                                  ))}
                                </ul>
                              </td>
                              <td className="py-3 px-3 text-slate-600">
                                {o.shippingAddress.city}, {o.shippingAddress.state}
                              </td>
                              <td className="py-3 px-3 font-bold text-slate-900">{formatINR(o.totalAmount)}</td>
                              <td className="py-3 px-3 text-[10px] text-slate-500">
                                <span className="inline-block px-2 py-0.5 rounded-md bg-stone-100 font-semibold text-slate-700 border border-stone-200">
                                  {o.status}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleOpenEditOrder(o)}
                                    className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-pink-50 hover:text-pink-700 border border-stone-200 text-slate-600 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                                    title="Edit Order"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setOrderToDelete(o)}
                                    className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 hover:text-rose-700 border border-rose-200 text-rose-600 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                                    title="Delete Order"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => onViewInvoice(o)}
                                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-pink-50 text-slate-700 hover:text-pink-700 border border-stone-200 text-[11px] font-semibold cursor-pointer shadow-2xs transition-colors whitespace-nowrap"
                                  >
                                    View GST Invoice
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: INVENTORY (Manage products & stock) */}
          {/* ========================================================================= */}
          {activeTab === 'inventory' && (
            <div className="space-y-6 max-w-6xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 font-sans">
                    INVENTORY MANAGEMENT
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live stock control, pricing adjustments, item removal, and catalog availability across {products.length} SKUs.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {onReorderProducts && (
                    <button
                      onClick={handleOpenReorderModal}
                      className="px-3.5 py-2.5 rounded-xl border border-pink-200 bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                      title="Set product display sequence on website"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5 text-pink-600" />
                      <span>Set Product Order</span>
                    </button>
                  )}

                  {onResetDefaultProducts && (
                    <button
                      onClick={() => {
                        onResetDefaultProducts();
                        setRemoveToastMessage('Restored all default catalog products.');
                        setTimeout(() => setRemoveToastMessage(null), 3000);
                      }}
                      className="px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-slate-700 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                      title="Restore all default catalog products"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      <span>Restore Catalog</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      resetProductForm();
                      setShowAddProductModal(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md shadow-pink-600/20 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Product</span>
                  </button>
                </div>
              </div>

              {/* Toast Feedback */}
              {removeToastMessage && (
                <div className="p-3.5 rounded-xl bg-pink-50 border border-pink-200/80 text-pink-900 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-pink-600 flex-shrink-0" />
                    <span>{removeToastMessage}</span>
                  </div>
                  <button
                    onClick={() => setRemoveToastMessage(null)}
                    className="text-pink-400 hover:text-pink-700 cursor-pointer p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs scrollbar-none">
                {['All', ...categoriesList].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3.5 py-1.5 rounded-xl font-semibold whitespace-nowrap cursor-pointer transition-all border ${
                      categoryFilter === cat
                        ? 'bg-pink-600 text-white border-pink-600 shadow-xs'
                        : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-pink-50/50 border-stone-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* ================================================================= */}
              {/* MOBILE INVENTORY PRODUCT CARDS (Optimized for small screens)      */}
              {/* ================================================================= */}
              <div className="block md:hidden space-y-3">
                {filteredProducts.map((p) => {
                  const currentStock = p.stock ?? 0;
                  const isSaved = savedFeedbackMap[p.id];

                  return (
                    <div key={p.id} className="bg-white border border-pink-100 rounded-2xl p-4 shadow-xs space-y-3">
                      {/* Top: Product image, titles, category, and delete button */}
                      <div className="flex items-start gap-3">
                        <div className="w-16 h-16 rounded-xl bg-stone-50 border border-stone-200 overflow-hidden flex-shrink-0 flex items-center justify-center p-1.5 shadow-2xs">
                          <img 
                            src={p.image} 
                            alt={p.title} 
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer" 
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-2 py-0.5 rounded-md bg-stone-100 text-slate-700 text-[10px] font-bold border border-stone-200">
                                {p.category}
                              </span>
                              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-pink-50 border border-pink-200 text-pink-700 text-[10px] font-bold">
                                <span>#{p.displayOrder ?? (products.findIndex((item) => item.id === p.id) + 1)}</span>
                                {onReorderProducts && (
                                  <div className="flex items-center ml-0.5">
                                    <button
                                      onClick={() => handleQuickMove(p.id, -1)}
                                      disabled={products.findIndex((item) => item.id === p.id) === 0}
                                      className="disabled:opacity-20 text-slate-500 hover:text-pink-600 p-0.5"
                                      title="Move Up"
                                    >
                                      <ArrowUp className="w-2.5 h-2.5" />
                                    </button>
                                    <button
                                      onClick={() => handleQuickMove(p.id, 1)}
                                      disabled={products.findIndex((item) => item.id === p.id) === products.length - 1}
                                      className="disabled:opacity-20 text-slate-500 hover:text-pink-600 p-0.5"
                                      title="Move Down"
                                    >
                                      <ArrowDown className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center">
                              <button
                                onClick={() => handleOpenEditProduct(p)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-pink-600 hover:bg-pink-50 border border-transparent hover:border-pink-200 transition-colors mr-1"
                                title={`Edit ${p.title}`}
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setProductToDelete(p)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                                title={`Delete ${p.title}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <h4 className="font-bold text-slate-900 text-xs mt-1 leading-snug line-clamp-2">
                            {p.title}
                          </h4>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                            {p.volume || 'Standard'} • SKU: {p.id.slice(-6)}
                          </div>
                        </div>
                      </div>

                      {/* Middle: Selling Price + Stock Status */}
                      <div className="flex items-center justify-between bg-stone-50/90 p-2.5 rounded-xl border border-stone-200/80">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-slate-500 uppercase">Price:</span>
                          <div className="flex items-center font-bold text-slate-900 text-sm">
                            <span>₹</span>
                            <input
                              type="number"
                              min="0"
                              defaultValue={p.price}
                              onBlur={(e) => {
                                const val = parseInt(e.target.value, 10);
                                if (!isNaN(val) && onUpdateProductPrice) {
                                  onUpdateProductPrice(p.id, Math.max(0, val));
                                }
                              }}
                              className="w-20 bg-white border border-stone-300 focus:border-pink-500 rounded-lg px-2 py-1 text-xs text-slate-900 font-bold ml-1 shadow-2xs"
                            />
                          </div>
                        </div>

                        {/* Stock status badge */}
                        <div>
                          {currentStock > 10 ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200 text-[10px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              In Stock ({currentStock})
                            </span>
                          ) : currentStock > 0 ? (
                            <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-bold border border-amber-200 text-[10px]">
                              <AlertTriangle className="w-3 h-3 text-amber-500" />
                              Low ({currentStock})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full font-bold border border-rose-200 text-[10px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Out of Stock
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bottom: Stock Stepper & Quick Restock */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-600">Stock Inventory Units:</span>
                          {isSaved && (
                            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 animate-in fade-in">
                              <Check className="w-3 h-3" />
                              Updated
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Stepper */}
                          <div className="flex items-center border border-stone-300 bg-white rounded-xl overflow-hidden shadow-2xs">
                            <button
                              onClick={() => handleStockIncrement(p.id, currentStock, -1)}
                              disabled={currentStock <= 0}
                              className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-stone-100 disabled:opacity-30 active:bg-stone-200 cursor-pointer"
                              title="Minus 1"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={currentStock}
                              onChange={(e) => handleStockChange(p.id, parseInt(e.target.value, 10) || 0)}
                              className="w-14 text-center font-extrabold text-slate-900 text-xs py-1.5 border-x border-stone-200 focus:outline-none"
                            />
                            <button
                              onClick={() => handleStockIncrement(p.id, currentStock, 1)}
                              className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-stone-100 active:bg-stone-200 cursor-pointer"
                              title="Plus 1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Quick Pills */}
                          <div className="flex items-center gap-1.5 flex-1 justify-end">
                            <button
                              onClick={() => handleStockIncrement(p.id, currentStock, 10)}
                              className="px-2.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 font-bold text-xs border border-stone-200 active:scale-95 cursor-pointer"
                            >
                              +10
                            </button>
                            <button
                              onClick={() => handleStockChange(p.id, currentStock + 25)}
                              className="px-2.5 py-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold text-xs border border-pink-200 active:scale-95 cursor-pointer"
                            >
                              +25
                            </button>
                            {currentStock > 0 ? (
                              <button
                                onClick={() => handleStockChange(p.id, 0)}
                                className="px-2 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs border border-rose-200 active:scale-95 cursor-pointer"
                                title="Set Out of Stock"
                              >
                                Zero
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStockChange(p.id, 50)}
                                className="px-2.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-2xs active:scale-95 cursor-pointer"
                              >
                                +50
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredProducts.length === 0 && (
                  <div className="text-center py-10 px-4 bg-white rounded-2xl border border-pink-100 shadow-xs">
                    <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700 text-xs">No products found</p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                      {searchQuery || categoryFilter !== 'All' 
                        ? 'No products match your current search or category filter.' 
                        : 'All catalog products have been removed.'}
                    </p>
                    {onResetDefaultProducts && (
                      <button
                        onClick={() => {
                          onResetDefaultProducts();
                          setRemoveToastMessage('Restored all default catalog products.');
                          setTimeout(() => setRemoveToastMessage(null), 3000);
                        }}
                        className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-pink-200 bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-semibold cursor-pointer transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restore Original Catalog</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* ================================================================= */}
              {/* DESKTOP INVENTORY TABLE                                           */}
              {/* ================================================================= */}
              <div className="hidden md:block bg-white border border-pink-100 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50/90 text-slate-600 font-semibold uppercase tracking-wider text-[10px] border-b border-stone-200">
                      <tr>
                        <th className="p-3.5 text-center w-24">Order</th>
                        <th className="p-3.5">Product</th>
                        <th className="p-3.5">Category</th>
                        <th className="p-3.5">Selling Price</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-center">Edit Stock Units</th>
                        <th className="p-3.5 text-center">Quick Restock</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredProducts.map((p) => {
                        const currentStock = p.stock ?? 0;
                        const isSaved = savedFeedbackMap[p.id];

                        return (
                          <tr key={p.id} className="hover:bg-pink-50/20 transition-colors">
                            {/* Product Rank / Order with Quick Shift */}
                            <td className="p-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <span className="w-7 h-7 rounded-lg bg-pink-50 border border-pink-200 text-pink-700 font-bold text-xs flex items-center justify-center">
                                  #{p.displayOrder ?? (products.findIndex((item) => item.id === p.id) + 1)}
                                </span>
                                {onReorderProducts && (
                                  <div className="flex flex-col gap-0.5">
                                    <button
                                      onClick={() => handleQuickMove(p.id, -1)}
                                      disabled={products.findIndex((item) => item.id === p.id) === 0}
                                      className="p-1 rounded hover:bg-stone-100 disabled:opacity-20 text-slate-500 hover:text-pink-600 transition-colors cursor-pointer"
                                      title="Move up in website catalog"
                                    >
                                      <ArrowUp className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleQuickMove(p.id, 1)}
                                      disabled={products.findIndex((item) => item.id === p.id) === products.length - 1}
                                      className="p-1 rounded hover:bg-stone-100 disabled:opacity-20 text-slate-500 hover:text-pink-600 transition-colors cursor-pointer"
                                      title="Move down in website catalog"
                                    >
                                      <ArrowDown className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Product Info */}
                            <td className="p-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-stone-50 border border-stone-200 overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                                  <img 
                                    src={p.image} 
                                    alt={p.title} 
                                    className="w-full h-full object-contain"
                                    referrerPolicy="no-referrer" 
                                  />
                                </div>
                                <div className="min-w-0 max-w-xs">
                                  <div className="font-semibold text-slate-900 truncate">{p.title}</div>
                                  <div className="text-[10px] text-slate-400 truncate">{p.volume}</div>
                                </div>
                              </div>
                            </td>

                            {/* Category */}
                            <td className="p-3.5">
                              <span className="px-2 py-0.5 rounded-md bg-stone-100 text-slate-700 text-[10px] font-semibold border border-stone-200">
                                {p.category}
                              </span>
                            </td>

                            {/* Price */}
                            <td className="p-3.5">
                              <div className="flex items-center gap-1 font-bold text-slate-900">
                                <span>₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  defaultValue={p.price}
                                  onBlur={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    if (!isNaN(val) && onUpdateProductPrice) {
                                      onUpdateProductPrice(p.id, Math.max(0, val));
                                    }
                                  }}
                                  className="w-16 bg-stone-50 border border-stone-200 focus:bg-white focus:border-pink-500 rounded px-1.5 py-0.5 text-xs text-slate-900 font-bold"
                                />
                              </div>
                            </td>

                            {/* Stock Status Badge */}
                            <td className="p-3.5">
                              {currentStock > 10 ? (
                                <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold border border-emerald-200 text-[11px]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  In Stock ({currentStock})
                                </span>
                              ) : currentStock > 0 ? (
                                <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full font-semibold border border-amber-200 text-[11px]">
                                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                                  Low Stock ({currentStock})
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full font-semibold border border-rose-200 text-[11px]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  Out of Stock (0)
                                </span>
                              )}
                            </td>

                            {/* EDIT STOCK INTERACTION */}
                            <td className="p-3.5">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleStockIncrement(p.id, currentStock, -1)}
                                  disabled={currentStock <= 0}
                                  className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 disabled:opacity-30 flex items-center justify-center text-slate-700 transition-colors cursor-pointer border border-stone-200"
                                  title="Decrease stock by 1"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>

                                <input
                                  type="number"
                                  min="0"
                                  value={currentStock}
                                  onChange={(e) => handleStockChange(p.id, parseInt(e.target.value, 10) || 0)}
                                  className="w-16 px-2 py-1 text-center font-bold text-slate-900 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:bg-white focus:border-pink-500 text-xs"
                                />

                                <button
                                  onClick={() => handleStockIncrement(p.id, currentStock, 1)}
                                  className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-slate-700 transition-colors cursor-pointer border border-stone-200"
                                  title="Increase stock by 1"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>

                                {isSaved && (
                                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 animate-in fade-in">
                                    <Check className="w-3 h-3" />
                                    Saved
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Quick Action Buttons */}
                            <td className="p-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {currentStock > 0 ? (
                                  <button
                                    onClick={() => handleStockChange(p.id, 0)}
                                    className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-semibold cursor-pointer transition-colors"
                                  >
                                    Set 0
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleStockChange(p.id, 25)}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold cursor-pointer transition-colors shadow-2xs"
                                  >
                                    Restock (+25)
                                  </button>
                                )}
                                <button
                                  onClick={() => handleStockIncrement(p.id, currentStock, 10)}
                                  className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-slate-700 border border-stone-200 text-[11px] font-semibold cursor-pointer transition-colors"
                                >
                                  +10
                                </button>
                              </div>
                            </td>

                            {/* Actions: Remove Product */}
                            <td className="p-3.5 text-right whitespace-nowrap">
                              <button
                                onClick={() => handleOpenEditProduct(p)}
                                className="p-2 rounded-lg bg-white hover:bg-pink-50 text-slate-400 hover:text-pink-600 border border-stone-200 hover:border-pink-200 transition-all cursor-pointer shadow-2xs group inline-flex items-center justify-center mr-2"
                                title={`Edit "${p.title}"`}
                                aria-label={`Edit ${p.title}`}
                              >
                                <Edit3 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                              </button>
                              <button
                                onClick={() => setProductToDelete(p)}
                                className="p-2 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-stone-200 hover:border-rose-200 transition-all cursor-pointer shadow-2xs group inline-flex items-center justify-center"
                                title={`Remove "${p.title}" from store`}
                                aria-label={`Remove ${p.title}`}
                              >
                                <Trash2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredProducts.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center py-12 px-4 text-slate-400">
                            <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="font-semibold text-slate-700 text-xs">No products found</p>
                            <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                              {searchQuery || categoryFilter !== 'All' 
                                ? 'No products match your current search or category filter.' 
                                : 'All catalog products have been removed. Click "Add Product" to create new items or "Restore Catalog" to restore default products.'}
                            </p>
                            {onResetDefaultProducts && (
                              <button
                                onClick={() => {
                                  onResetDefaultProducts();
                                  setRemoveToastMessage('Restored all default catalog products.');
                                  setTimeout(() => setRemoveToastMessage(null), 3000);
                                }}
                                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-pink-200 bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-semibold cursor-pointer transition-colors"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Restore Original Catalog</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: ORDERS & LEADS */}
          {/* ========================================================================= */}
          {activeTab === 'orders' && (
            <div className="space-y-6 max-w-6xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 font-sans">
                    CUSTOMER ORDERS & LEADS
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live verification of customer transactions, payment logs, and courier dispatch receipts.
                  </p>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshingOrders}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 active:scale-95 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer w-fit"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingOrders ? 'animate-spin' : ''}`} />
                  <span>{isRefreshingOrders ? 'Syncing...' : 'Refresh Orders'}</span>
                </button>
              </div>

              {/* STORE OWNER NOTIFICATION CHANNELS CARD */}
              <div className="bg-gradient-to-r from-stone-900 via-slate-900 to-stone-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-stone-800 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <h3 className="font-extrabold text-xs sm:text-sm tracking-wide text-white uppercase flex items-center gap-2">
                        <span>Store Owner Instant Order Notification Channels</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Active</span>
                      </h3>
                    </div>
                    <p className="text-xs text-stone-300">
                      The moment a customer completes checkout, the order is automatically delivered to you across all channels:
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs text-stone-200">
                      <Mail className="w-3.5 h-3.5 text-pink-400" />
                      <span>Email: <strong className="text-white">info@konichiwamart.com</strong></span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs text-stone-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Live Supabase WebSocket</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs text-stone-200">
                      <Truck className="w-3.5 h-3.5 text-sky-400" />
                      <span>Auto Shiprocket AWB</span>
                    </div>
                  </div>
                </div>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-pink-100 shadow-xs space-y-3">
                  <Truck className="w-12 h-12 text-slate-300 mx-auto mb-1" />
                  <h4 className="font-bold text-slate-800 text-sm">No Customer Orders Yet</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    When customers complete checkout via Razorpay or COD, their order details and tax invoice will appear here.
                  </p>
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshingOrders}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 text-xs font-bold transition-all cursor-pointer mt-2"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingOrders ? 'animate-spin' : ''}`} />
                    <span>{isRefreshingOrders ? 'Syncing Orders...' : 'Sync from Supabase'}</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* ================================================================= */}
                  {/* MOBILE ORDERS LIST (Optimized touch cards for mobile)            */}
                  {/* ================================================================= */}
                  <div className="block md:hidden space-y-3">
                    {orders.map((o) => (
                      <div key={o.id} className="bg-white border border-pink-100 rounded-2xl p-4 shadow-xs space-y-3">
                        {/* Header: Order ID & Amount */}
                        <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                          <div>
                            <span className="font-mono font-bold text-slate-900 text-xs">{o.orderNumber}</span>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-extrabold text-slate-900 text-sm">{formatINR(o.totalAmount)}</div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mt-0.5">
                              PAID ({o.paymentMethod})
                            </span>
                          </div>
                        </div>

                        {/* Customer & Address Details */}
                        <div className="text-xs space-y-1">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{o.customerName}</span>
                            <span className="text-[11px] text-slate-500">{o.customerEmail}</span>
                            <span className="text-[11px] text-slate-500">{o.customerPhone}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-snug">
                            {o.shippingAddress.addressLine1}, {o.shippingAddress.city}, {o.shippingAddress.state} ({o.shippingAddress.pincode})
                          </p>
                        </div>

                        {/* Ordered Items with Photos */}
                        <div className="pt-2 border-t border-stone-100">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Ordered Items</span>
                          <div className="space-y-2">
                            {(o.items || []).map((rawItem, idx) => {
                              const item = normalizeOrderItem(rawItem);
                              return (
                                <div key={idx} className="flex items-center justify-between gap-2 text-xs">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-stone-100 border border-stone-200 p-0.5 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                      <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-full h-full object-contain"
                                        referrerPolicy="no-referrer"
                                        onError={(e) => {
                                          const el = e.currentTarget;
                                          if (!el.src.includes('/products/keana-rice-mask.png')) {
                                            el.src = '/products/keana-rice-mask.png';
                                          }
                                        }}
                                      />
                                    </div>
                                    <div className="truncate">
                                      <span className="text-slate-800 font-medium block truncate" title={item.title}>
                                        {item.quantity}x {item.title}
                                      </span>
                                      {item.shade && <span className="text-[10px] text-slate-500">Shade: {item.shade}</span>}
                                    </div>
                                  </div>
                                  <span className="text-slate-900 font-semibold flex-shrink-0">{formatINR(item.price * item.quantity)}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Order Status & Courier Partner */}
                        <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/80 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Edit Order Status</span>
                            <select
                              value={o.status || 'CONFIRMED'}
                              onChange={(e) => onUpdateOrderStatus(o.id, e.target.value as Order['status'])}
                              className="bg-white border border-stone-300 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-800 focus:border-pink-500 focus:outline-none cursor-pointer"
                            >
                              <option value="CONFIRMED">CONFIRMED</option>
                              <option value="DISPATCHED">DISPATCHED</option>
                              <option value="IN_TRANSIT">IN TRANSIT</option>
                              <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                              <option value="DELIVERED">DELIVERED</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Courier / AWB</span>
                            <span className="font-semibold text-slate-800 text-[11px]">{o.courierPartner || 'Pending Dispatch'}</span>
                            {o.awbNumber && <div className="font-mono font-bold text-slate-600 text-[10px]">{o.awbNumber}</div>}
                          </div>
                        </div>

                        {/* Order Management Actions (Edit, Delete, Invoice) */}
                        <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                          <button
                            onClick={() => handleOpenEditOrder(o)}
                            className="px-3 py-2 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            title="Edit Order Details"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => setOrderToDelete(o)}
                            className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            title="Delete Order"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                          <button
                            onClick={() => onViewInvoice(o)}
                            className="flex-1 py-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs text-center"
                          >
                            <span>View GST Invoice</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ================================================================= */}
                  {/* DESKTOP ORDERS TABLE                                              */}
                  {/* ================================================================= */}
                  <div className="hidden md:block bg-white border border-pink-100 rounded-2xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-stone-50/90 text-slate-600 font-semibold uppercase tracking-wider text-[10px] border-b border-stone-200">
                          <tr>
                            <th className="p-3.5">Order ID</th>
                            <th className="p-3.5">Customer</th>
                            <th className="p-3.5">Ordered Items</th>
                            <th className="p-3.5">Shipping Address</th>
                            <th className="p-3.5">Amount</th>
                            <th className="p-3.5">Payment</th>
                            <th className="p-3.5">Delivery</th>
                            <th className="p-3.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {orders.map((o) => (
                            <tr key={o.id} className="text-slate-700 hover:bg-pink-50/30 transition-colors">
                              <td className="p-3.5 font-mono font-bold text-slate-900">{o.orderNumber}</td>
                              <td className="p-3.5">
                                <div className="font-semibold text-slate-900">{o.customerName}</div>
                                <div className="text-[10px] text-slate-500">{o.customerEmail}</div>
                                <div className="text-[10px] text-slate-400">{o.customerPhone}</div>
                              </td>
                              <td className="p-3.5 text-slate-600 max-w-[240px]">
                                <div className="space-y-1.5 text-[11px]">
                                  {(o.items || []).map((rawItem, idx) => {
                                    const item = normalizeOrderItem(rawItem);
                                    return (
                                      <div key={idx} className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-md bg-stone-100 border border-stone-200 p-0.5 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                          <img
                                            src={item.image}
                                            alt={item.title}
                                            className="w-full h-full object-contain"
                                            referrerPolicy="no-referrer"
                                            onError={(e) => {
                                              const el = e.currentTarget;
                                              if (!el.src.includes('/products/keana-rice-mask.png')) {
                                                el.src = '/products/keana-rice-mask.png';
                                              }
                                            }}
                                          />
                                        </div>
                                        <div className="truncate min-w-0">
                                          <span className="font-medium text-slate-800 truncate block" title={item.title}>
                                            {item.quantity}x {item.title}
                                          </span>
                                          {item.shade && <span className="text-[10px] text-slate-400 block">Shade: {item.shade}</span>}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </td>
                              <td className="p-3.5 text-slate-600">
                                {o.shippingAddress.addressLine1}, {o.shippingAddress.city}, {o.shippingAddress.state} ({o.shippingAddress.pincode})
                              </td>
                              <td className="p-3.5 font-bold text-slate-900">{formatINR(o.totalAmount)}</td>
                              <td className="p-3.5">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  PAID ({o.paymentMethod})
                                </span>
                              </td>
                              <td className="p-3.5">
                                <select
                                  value={o.status || 'CONFIRMED'}
                                  onChange={(e) => onUpdateOrderStatus(o.id, e.target.value as Order['status'])}
                                  className="bg-white border border-stone-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 shadow-2xs focus:border-pink-500 focus:outline-none cursor-pointer"
                                >
                                  <option value="CONFIRMED">CONFIRMED</option>
                                  <option value="DISPATCHED">DISPATCHED</option>
                                  <option value="IN_TRANSIT">IN TRANSIT</option>
                                  <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                                  <option value="DELIVERED">DELIVERED</option>
                                  <option value="CANCELLED">CANCELLED</option>
                                </select>
                              </td>
                              <td className="p-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleOpenEditOrder(o)}
                                    className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-pink-50 hover:text-pink-700 border border-stone-200 text-slate-600 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                                    title="Edit Order Details"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setOrderToDelete(o)}
                                    className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 hover:text-rose-700 border border-rose-200 text-rose-600 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                                    title="Delete Order"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => onViewInvoice(o)}
                                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-pink-50 text-slate-700 hover:text-pink-700 border border-stone-200 font-semibold text-xs cursor-pointer shadow-2xs transition-colors whitespace-nowrap"
                                  >
                                    View GST Invoice
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: SITE SETTINGS (Background, Logo, and Flower Drift) */}
          {/* ========================================================================= */}
          {activeTab === 'settings' && (
            <div className="space-y-8 max-w-4xl">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 font-sans">
                  STORE SITE SETTINGS
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure storefront background cover, scrolling ambient hint, brand logo & name, and control the sakura flower drift breeze.
                </p>
              </div>

              {settingsSuccessMsg && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{settingsSuccessMsg}</span>
                </div>
              )}

              {/* MODULE 1: HERO SECTION MEDIA (LOOPING VIDEO & IMAGE BANNER) */}
              <div className="bg-white border border-pink-100 rounded-2xl p-6 space-y-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center text-white shadow-xs">
                      {siteSettings.heroMediaType === 'image' ? (
                        <ImageIcon className="w-5 h-5" />
                      ) : (
                        <Film className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm tracking-wider uppercase text-slate-900 flex items-center gap-2">
                        <span>HERO SECTION MEDIA: VIDEO & BANNER</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 font-semibold border border-pink-200">
                          {siteSettings.heroMediaType === 'image' ? 'Static Image' : 'Continuous Video'}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Choose between a smooth looping video or static art-directed photos for desktop and mobile devices.
                      </p>
                    </div>
                  </div>

                  {/* Mode Toggle Pills */}
                  <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl border border-stone-200 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => onUpdateSiteSettings({ heroMediaType: 'video' })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        siteSettings.heroMediaType !== 'image'
                          ? 'bg-white text-pink-700 shadow-xs border border-pink-200/60'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Film className="w-3.5 h-3.5 text-pink-600" />
                      <span>Looping Video</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateSiteSettings({ heroMediaType: 'image' })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        siteSettings.heroMediaType === 'image'
                          ? 'bg-white text-pink-700 shadow-xs border border-pink-200/60'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-pink-600" />
                      <span>Image Banner</span>
                    </button>
                  </div>
                </div>

                {/* CONDITIONAL CONTENT: VIDEO SETTINGS OR IMAGE BANNER SETTINGS */}
                {siteSettings.heroMediaType !== 'image' ? (
                  /* ================= VIDEO MODE ================= */
                  <div className="space-y-5">
                    {/* Live Preview Box */}
                    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-stone-950 aspect-[16/8] sm:aspect-[21/9] max-h-72 shadow-md group">
                      {siteSettings.heroVideoUrl ? (
                        <video
                          key={siteSettings.heroVideoUrl}
                          src={siteSettings.heroVideoUrl}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover brightness-[0.95]"
                        />
                      ) : (
                        <img
                          src={siteSettings.heroBannerUrl || '/konichiwalaptopbackground.png'}
                          alt="Laptop Hero Banner"
                          className="w-full h-full object-cover brightness-[0.95]"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 pointer-events-none" />
                      
                      {/* Top Overlay Badge */}
                      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                        {siteSettings.heroVideoUrl ? (
                          <span className="px-2.5 py-1 rounded-full bg-pink-600/90 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            Live Hero Background Video
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-600/90 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            Laptop Photo Banner Active
                          </span>
                        )}
                      </div>

                      {/* Video Quick Controls / Info */}
                      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between text-white text-xs">
                        <span className="text-[11px] font-mono text-white/80 truncate max-w-[70%]">
                          {siteSettings.heroVideoUrl || 'konichiwalaptopbackground.png (Photo)'}
                        </span>
                        <div className="flex items-center gap-2">
                          {siteSettings.heroVideoUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setVideoUrlInput('');
                                try { localStorage.removeItem('km_hero_video_url'); } catch {}
                                onUpdateSiteSettings({ heroVideoUrl: '', heroMediaType: 'image' });
                                setSettingsSuccessMsg('Reverted laptop hero to photo banner!');
                                setTimeout(() => setSettingsSuccessMsg(null), 3000);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-700 text-stone-200 font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                            >
                              Use Photo Instead
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => videoInputRef.current?.click()}
                            disabled={isUploadingVideo}
                            className="px-3 py-1.5 rounded-lg bg-white/95 hover:bg-white text-slate-900 font-bold text-[11px] uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                          >
                            <Upload className="w-3 h-3 text-pink-600" />
                            <span>{isUploadingVideo ? 'Uploading...' : (siteSettings.heroVideoUrl ? 'Replace Video' : 'Upload Video')}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* "Where to Upload Your Video" Guide Accordion (Answers Private GitHub Problem) */}
                    <div className="rounded-xl border border-pink-200 bg-pink-50/40 p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <div className="w-6 h-6 rounded-md bg-pink-100 text-pink-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <HelpCircle className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-pink-950 uppercase tracking-wider">
                              Where should I upload my video? (Why private GitHub fails)
                            </h4>
                            <p className="text-xs text-pink-900/80 mt-0.5">
                              When a GitHub repository is private, raw URLs (<code className="bg-pink-100/80 px-1 py-0.5 rounded text-[11px]">raw.githubusercontent.com</code>) block public access without a login token. Here are the 3 best ways to host your video:
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowVideoHostingGuide(!showVideoHostingGuide)}
                          className="text-xs font-bold text-pink-700 hover:text-pink-900 underline flex-shrink-0 cursor-pointer"
                        >
                          {showVideoHostingGuide ? 'Hide details' : 'Show step-by-step'}
                        </button>
                      </div>

                      {showVideoHostingGuide && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-pink-200/60 text-xs">
                          {/* Method 1: Supabase Storage */}
                          <div className="p-3 rounded-lg bg-white border border-pink-100 space-y-1.5 shadow-2xs">
                            <span className="font-bold text-slate-900 flex items-center gap-1 text-[11px] uppercase tracking-wider text-pink-800">
                              ⭐ 1. Supabase Storage (Recommended)
                            </span>
                            <p className="text-slate-600 text-[11px] leading-relaxed">
                              You already have Supabase connected! In your Supabase project, go to <strong>Storage → product-images</strong>, click <strong>Upload File</strong>, and copy the <strong>Public URL</strong>. Paste it below.
                            </p>
                          </div>

                          {/* Method 2: Direct Admin Upload */}
                          <div className="p-3 rounded-lg bg-white border border-pink-100 space-y-1.5 shadow-2xs">
                            <span className="font-bold text-slate-900 flex items-center gap-1 text-[11px] uppercase tracking-wider text-pink-800">
                              ⚡ 2. Direct Admin Upload
                            </span>
                            <p className="text-slate-600 text-[11px] leading-relaxed">
                              Click <strong>"Upload Video (.mp4)"</strong> below. Our server will upload and serve it directly from this web server (e.g. <code className="bg-stone-100 px-1 py-0.5 rounded">/videos/hero.mp4</code>) without touching GitHub!
                            </p>
                          </div>

                          {/* Method 3: Cloudinary / S3 */}
                          <div className="p-3 rounded-lg bg-white border border-pink-100 space-y-1.5 shadow-2xs">
                            <span className="font-bold text-slate-900 flex items-center gap-1 text-[11px] uppercase tracking-wider text-pink-800">
                              ☁️ 3. Cloudinary or S3
                            </span>
                            <p className="text-slate-600 text-[11px] leading-relaxed">
                              Upload your video to a free video CDN like <strong>Cloudinary</strong> or AWS S3 and paste the direct <code className="bg-stone-100 px-1 py-0.5 rounded">.mp4</code> streaming link into the box below.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Desktop Video URL & Direct Upload Controls */}
                    <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          💻 Desktop / Laptop Background Video (.mp4 or .webm)
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">Recommended: 1080p, &lt; 20MB</span>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="url"
                          value={videoUrlInput}
                          onChange={(e) => setVideoUrlInput(e.target.value)}
                          placeholder="Paste direct .mp4 URL (Supabase, Cloudinary, or /videos/hero.mp4)"
                          className="flex-1 px-3 py-2 text-xs rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/30 text-slate-800"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (videoUrlInput.trim()) {
                                localStorage.setItem('km_hero_video_url', videoUrlInput.trim());
                                onUpdateSiteSettings({ heroVideoUrl: videoUrlInput.trim(), heroMediaType: 'video' });
                                setSettingsSuccessMsg('Desktop hero video URL updated & live!');
                                setTimeout(() => setSettingsSuccessMsg(null), 3500);
                              }
                            }}
                            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer transition-all whitespace-nowrap shadow-xs"
                          >
                            Apply URL
                          </button>
                          <button
                            type="button"
                            onClick={() => videoInputRef.current?.click()}
                            disabled={isUploadingVideo}
                            className="px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap shadow-xs"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>{isUploadingVideo ? 'Uploading...' : 'Upload .mp4 File'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Photo Default Indicator */}
                      <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
                        <span className="font-medium text-emerald-700">✓ Default:</span>
                        <span>Photo banner (<code className="bg-stone-100 px-1 py-0.5 rounded text-[10px]">konichiwalaptopbackground.png</code>) is displayed automatically on laptops until you upload or link a custom video.</span>
                      </div>
                    </div>

                    {/* Mobile Video (Optional) */}
                    <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          📱 Mobile Layout Video (9:16 Portrait)
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">Leave empty to use desktop video</span>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="url"
                          value={mobileVideoUrlInput}
                          onChange={(e) => setMobileVideoUrlInput(e.target.value)}
                          placeholder="Mobile vertical video URL (.mp4)"
                          className="flex-1 px-3 py-2 text-xs rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/30 text-slate-800"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              localStorage.setItem('km_hero_mobile_video_url', mobileVideoUrlInput.trim());
                              onUpdateSiteSettings({ heroMobileVideoUrl: mobileVideoUrlInput.trim() });
                              setSettingsSuccessMsg('Mobile hero video setting updated!');
                              setTimeout(() => setSettingsSuccessMsg(null), 3500);
                            }}
                            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer transition-all whitespace-nowrap shadow-xs"
                          >
                            Save Mobile URL
                          </button>
                          <button
                            type="button"
                            onClick={() => mobileVideoInputRef.current?.click()}
                            disabled={isUploadingVideo}
                            className="px-4 py-2 rounded-lg bg-white hover:bg-stone-100 text-slate-700 border border-stone-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap shadow-xs"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload Mobile .mp4</span>
                          </button>
                        </div>
                      </div>

                      {/* Live Mobile Video Preview */}
                      {(mobileVideoUrlInput || siteSettings.heroMobileVideoUrl) && (
                        <div className="mt-3 pt-3 border-t border-stone-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-24 rounded-lg overflow-hidden border border-stone-300 bg-black shrink-0 relative shadow-xs">
                              <video
                                src={mobileVideoUrlInput || siteSettings.heroMobileVideoUrl}
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Mobile Video Active & Looping
                              </p>
                              <p className="text-[11px] text-slate-500 max-w-xs truncate">
                                {mobileVideoUrlInput || siteSettings.heroMobileVideoUrl}
                              </p>
                              <p className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                                ✓ Always-playing is 100% free (cached by visitor browsers, 0 streaming fees)
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Hidden Video Inputs */}
                    <input
                      type="file"
                      ref={videoInputRef}
                      onChange={(e) => handleVideoFileChange(e, 'desktop')}
                      accept="video/mp4,video/webm"
                      className="hidden"
                    />
                    <input
                      type="file"
                      ref={mobileVideoInputRef}
                      onChange={(e) => handleVideoFileChange(e, 'mobile')}
                      accept="video/mp4,video/webm"
                      className="hidden"
                    />
                  </div>
                ) : (
                  /* ================= STATIC IMAGE BANNER MODE ================= */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Laptop / Desktop Background Card */}
                    <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          💻 Laptop & Desktop Layout
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">16:9 / 21:9 Widescreen</span>
                      </div>

                      <div className="relative w-full h-36 rounded-lg overflow-hidden border border-stone-200 bg-stone-100 group shadow-2xs">
                        <img
                          src={siteSettings.heroBannerUrl || '/konichiwalaptopbackground.png'}
                          alt="Current Laptop Banner"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={() => bannerInputRef.current?.click()}
                            disabled={isUploadingBanner}
                            className="px-3 py-1.5 rounded-lg bg-white text-slate-900 font-bold text-xs uppercase tracking-wider cursor-pointer shadow hover:bg-pink-50 transition-all"
                          >
                            {isUploadingBanner ? 'Uploading...' : 'Replace Laptop Image'}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => bannerInputRef.current?.click()}
                          disabled={isUploadingBanner}
                          className="w-full px-3 py-1.5 rounded-lg bg-white hover:bg-stone-50 text-slate-700 border border-stone-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                        >
                          <Upload className="w-3.5 h-3.5 text-slate-500" />
                          <span>{isUploadingBanner ? 'Uploading...' : 'Upload Laptop BG'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Mobile Background Card */}
                    <div className="p-3.5 rounded-xl border border-pink-200 bg-pink-50/30 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-pink-900">
                          📱 Mobile Layout Image
                        </span>
                        <span className="text-[10px] text-pink-600/80 font-medium">Vertical / 9:16 Portrait</span>
                      </div>

                      <div className="relative w-full h-36 rounded-lg overflow-hidden border border-pink-200 bg-pink-50 group shadow-2xs">
                        <img
                          src={siteSettings.mobileHeroBannerUrl || '/products/konichiwamobilebg.png'}
                          alt="Current Mobile Banner"
                          className="w-full h-full object-contain bg-slate-900/5"
                        />
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={() => mobileBannerInputRef.current?.click()}
                            disabled={isUploadingMobileBanner}
                            className="px-3 py-1.5 rounded-lg bg-white text-slate-900 font-bold text-xs uppercase tracking-wider cursor-pointer shadow hover:bg-pink-50 transition-all"
                          >
                            {isUploadingMobileBanner ? 'Uploading...' : 'Replace Mobile Image'}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => mobileBannerInputRef.current?.click()}
                          disabled={isUploadingMobileBanner}
                          className="w-full px-3 py-1.5 rounded-lg bg-white hover:bg-pink-50 text-pink-700 border border-pink-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                        >
                          <Upload className="w-3.5 h-3.5 text-pink-500" />
                          <span>{isUploadingMobileBanner ? 'Uploading...' : 'Upload Mobile BG'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hidden File Inputs for Images */}
                <input
                  type="file"
                  ref={bannerInputRef}
                  onChange={handleBannerFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <input
                  type="file"
                  ref={mobileBannerInputRef}
                  onChange={handleMobileBannerFileChange}
                  accept="image/*"
                  className="hidden"
                />

                {/* Ambient Scroll Hint Intensity */}
                <div className="pt-3 border-t border-stone-100">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Ambient Background Visibility on Scroll
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'subtle', label: 'Subtle (15%)', desc: 'Light artistic whisper' },
                      { id: 'balanced', label: 'Balanced (25%)', desc: 'Optimal depth & clarity' },
                      { id: 'pronounced', label: 'Pronounced (35%)', desc: 'Vibrant background presence' }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => onUpdateSiteSettings({ backgroundHintOpacity: mode.id as any })}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          (siteSettings.backgroundHintOpacity || 'balanced') === mode.id
                            ? 'border-pink-500 bg-pink-50 text-pink-800 shadow-xs font-semibold'
                            : 'border-stone-200 bg-stone-50/60 text-slate-600 hover:bg-stone-100'
                        }`}
                      >
                        <div className="font-bold text-xs">{mode.label}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{mode.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* MODULE 2: STORE LOGO & BRAND IDENTITY */}
              <div className="bg-white border border-pink-100 rounded-2xl p-6 space-y-5 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-pink-50 border border-pink-200/80 flex items-center justify-center text-pink-600">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm tracking-wider uppercase text-slate-900">
                      STORE LOGO & BRANDING
                    </h3>
                    <p className="text-xs text-slate-500">
                      Upload your brand logo and customize your store name in the navigation bar.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-start">
                  {/* Logo Preview Box */}
                  <div className="space-y-2 text-center">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Current Logo
                    </div>
                    <div className="w-28 h-28 mx-auto rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-center p-3 overflow-hidden shadow-inner">
                      {siteSettings.logoUrl ? (
                        <img 
                          src={siteSettings.logoUrl} 
                          alt="Store Logo" 
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <KonichiwaMartLogo size={56} />
                      )}
                    </div>

                    <input
                      type="file"
                      ref={logoInputRef}
                      onChange={handleLogoFileChange}
                      accept="image/*"
                      className="hidden"
                    />

                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        onClick={() => logoInputRef.current?.click()}
                        disabled={isUploadingLogo}
                        className="px-3 py-1.5 rounded-lg bg-white hover:bg-stone-50 text-slate-700 border border-stone-200 text-xs font-semibold cursor-pointer shadow-2xs"
                      >
                        {isUploadingLogo ? 'Saving...' : 'Change Logo'}
                      </button>

                      {siteSettings.logoUrl && (
                        <button
                          onClick={() => onUpdateSiteSettings({ logoUrl: undefined })}
                          className="px-2 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold cursor-pointer"
                          title="Reset to Default Sakura Emblem"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Store Name & Tagline Inputs */}
                  <div className="sm:col-span-2 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Store Name
                      </label>
                      <input
                        type="text"
                        value={tempStoreName}
                        onChange={(e) => setTempStoreName(e.target.value)}
                        placeholder="e.g. Konichiwa.Mart"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-pink-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Store Tagline / Subtitle
                      </label>
                      <input
                        type="text"
                        value={tempStoreTagline}
                        onChange={(e) => setTempStoreTagline(e.target.value)}
                        placeholder="e.g. Japanese Skincare"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-pink-500"
                      />
                    </div>

                    <button
                      onClick={() => {
                        onUpdateSiteSettings({
                          storeName: tempStoreName.trim() || 'Konichiwa.Mart',
                          storeTagline: tempStoreTagline.trim() || 'Japanese Skincare'
                        });
                        setSettingsSuccessMsg('Brand name and tagline saved!');
                        setTimeout(() => setSettingsSuccessMsg(null), 3000);
                      }}
                      className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-md shadow-pink-600/20"
                    >
                      Save Brand Details
                    </button>
                  </div>
                </div>
              </div>

              {/* MODULE 3: FLOWER DRIFT (SAKURA BLOSSOMS) CONTROLLER */}
              <div className="bg-white border border-pink-100 rounded-2xl p-6 space-y-6 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-pink-50 border border-pink-200/80 flex items-center justify-center text-pink-600">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm tracking-wider uppercase text-slate-900">
                        FLOWER DRIFT (SAKURA BLOSSOMS) CONTROLS
                      </h3>
                      <p className="text-xs text-slate-500">
                        Control floating sakura blossom animation, wind speed, and petal density across the website.
                      </p>
                    </div>
                  </div>

                  {/* MASTER TOGGLE SWITCH */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {siteSettings.flowerDriftEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateSiteSettings({
                          flowerDriftEnabled: !siteSettings.flowerDriftEnabled
                        });
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        siteSettings.flowerDriftEnabled ? 'bg-pink-600' : 'bg-stone-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          siteSettings.flowerDriftEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* BREEZE SPEED SELECTOR */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Breeze Wind Speed / Velocity
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'still', label: 'Still (Gentle)', desc: 'Slow meditative glide' },
                      { id: 'gentle', label: 'Gentle (Spring)', desc: 'Authentic natural breeze' },
                      { id: 'fresh', label: 'Fresh (Flowing)', desc: 'Faster playful gust' },
                      { id: 'vibrant', label: 'Vibrant (Dance)', desc: 'High energy blossom swirl' }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => onUpdateSiteSettings({ flowerDriftSpeed: mode.id as any })}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          siteSettings.flowerDriftSpeed === mode.id
                            ? 'border-pink-500 bg-pink-50 text-pink-800 shadow-xs font-semibold'
                            : 'border-stone-200 bg-stone-50/60 text-slate-600 hover:bg-stone-100'
                        }`}
                      >
                        <div className="font-bold text-xs">{mode.label}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{mode.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* PETAL DENSITY SELECTOR */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Petal & Flower Density
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'low', label: 'Low', desc: 'Minimalist & subtle (~20 petals)' },
                      { id: 'medium', label: 'Medium', desc: 'Balanced natural garden (~50 petals)' },
                      { id: 'high', label: 'High', desc: 'Rich blossom shower (~95 petals)' }
                    ].map((den) => (
                      <button
                        key={den.id}
                        onClick={() => onUpdateSiteSettings({ flowerDriftDensity: den.id as any })}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          siteSettings.flowerDriftDensity === den.id
                            ? 'border-pink-500 bg-pink-50 text-pink-800 shadow-xs font-semibold'
                            : 'border-stone-200 bg-stone-50/60 text-slate-600 hover:bg-stone-100'
                        }`}
                      >
                        <div className="font-bold text-xs">{den.label} Density</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{den.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* MODULE 4: RESEND EMAIL DISPATCH & LIVE TEST */}
              <div className="bg-white border border-pink-100 rounded-2xl p-6 space-y-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm tracking-wider uppercase text-slate-900">
                        RESEND EMAIL & ORDER NOTIFICATIONS
                      </h3>
                      <p className="text-xs text-slate-500">
                        Automated customer order confirmations, GST tax invoices, and shipment tracking dispatch.
                      </p>
                    </div>
                  </div>
                  <span className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Domain: konichiwamart.com (Ready)
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Sender Configuration
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">From Address</span>
                      <span className="font-mono font-medium text-slate-800">info@konichiwamart.com</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Verified Sending Domain</span>
                      <span className="font-mono font-medium text-slate-800">konichiwamart.com</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Send Live Test Email
                  </label>
                  <p className="text-xs text-slate-500">
                    Verify that your Resend API key and domain configuration can deliver emails directly to an inbox.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      value={testEmailRecipient}
                      onChange={(e) => setTestEmailRecipient(e.target.value)}
                      placeholder="Enter recipient email address..."
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-pink-500 font-sans"
                    />
                    <button
                      type="button"
                      onClick={handleSendTestEmail}
                      disabled={isSendingTestEmail}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                    >
                      {isSendingTestEmail ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <span>Send Test Email</span>
                      )}
                    </button>
                  </div>

                  {testEmailStatus && (
                    <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in ${
                      testEmailStatus.success 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}>
                      {testEmailStatus.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      )}
                      <span>{testEmailStatus.message}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* MODULE 5: SHIPROCKET LOGISTICS & AUTO-AWB DISPATCH */}
              <div className="bg-white border border-pink-100 rounded-2xl p-6 space-y-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm tracking-wider uppercase text-slate-900">
                        SHIPROCKET LOGISTICS & AUTO-AWB DISPATCH
                      </h3>
                      <p className="text-xs text-slate-500">
                        Automated courier assignment (Blue Dart, Delhivery, Shadowfax), live AWB tracking, and warehouse pickup.
                      </p>
                    </div>
                  </div>
                  <span className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-300">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                    KYC Verified / Ready
                  </span>
                </div>

                {/* Configuration Overview */}
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Logistics Setup & Warehouse Routing
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">API Integration</span>
                      <span className="font-mono font-medium text-slate-800">Shiprocket REST v2</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Default Pickup Nickname</span>
                      <span className="font-mono font-medium text-slate-800">Primary Warehouse</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Coverage</span>
                      <span className="font-mono font-medium text-slate-800">29,000+ Indian Pincodes</span>
                    </div>
                  </div>
                </div>

                {/* Test Connection Button & Result Card */}
                <div className="space-y-3 pt-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Live Connection & Wallet Verification
                      </label>
                      <p className="text-xs text-slate-500">
                        Verify your Shiprocket API credentials, check shipping wallet balance, and validate pickup locations.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleTestShiprocket}
                      disabled={isTestingShiprocket}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 flex-shrink-0"
                    >
                      {isTestingShiprocket ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Testing Connection...</span>
                        </>
                      ) : (
                        <>
                          <Truck className="w-3.5 h-3.5" />
                          <span>Test Shiprocket Connection</span>
                        </>
                      )}
                    </button>
                  </div>

                  {shiprocketTestResult && (
                    <div className={`p-4 rounded-xl border text-xs space-y-2.5 animate-in fade-in ${
                      shiprocketTestResult.success 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}>
                      <div className="flex items-center gap-2 font-bold">
                        {shiprocketTestResult.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                        )}
                        <span>{shiprocketTestResult.message || (shiprocketTestResult.success ? 'Connected!' : 'Connection issue')}</span>
                      </div>

                      {shiprocketTestResult.error && (
                        <div className="text-rose-700 font-medium">
                          {shiprocketTestResult.error}
                        </div>
                      )}

                      {shiprocketTestResult.success && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-emerald-200/60 text-[11px]">
                          <div>
                            <span className="font-semibold text-emerald-800">Account:</span>{' '}
                            <span className="font-mono">{shiprocketTestResult.accountEmail}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-emerald-800">Wallet Balance:</span>{' '}
                            <span className="font-bold">{shiprocketTestResult.walletBalance}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-emerald-800">Configured Pickup Location:</span>{' '}
                            <span className="font-mono">{shiprocketTestResult.configuredPickupLocation}</span>
                            {shiprocketTestResult.pickupLocationFound ? (
                              <span className="ml-1 text-emerald-700 font-bold">(Matched ✓)</span>
                            ) : (
                              <span className="ml-1 text-amber-600 font-bold">(Not found in Shiprocket addresses)</span>
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-emerald-800">Registered Addresses in Shiprocket:</span>{' '}
                            <span className="font-mono">
                              {shiprocketTestResult.availablePickupLocations && shiprocketTestResult.availablePickupLocations.length > 0
                                ? shiprocketTestResult.availablePickupLocations.join(', ')
                                : 'None registered yet'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Moving Forward Checklist */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>How We Move Forward (Next Steps):</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600 leading-relaxed text-[11px]">
                    <li>
                      <strong>Add Pickup Address</strong>: In your Shiprocket dashboard (<a href="https://app.shiprocket.in" target="_blank" rel="noreferrer" className="text-pink-600 underline">app.shiprocket.in</a>), go to <em>Settings &gt; Pickup Addresses</em> and add your warehouse address with nickname <code className="bg-stone-200 px-1 py-0.5 rounded text-slate-800 font-mono">Primary Warehouse</code>.
                    </li>
                    <li>
                      <strong>Recharge Shipping Wallet</strong>: Add a starter balance (₹500–₹1,000) so couriers can deduct freight fees when generating shipping labels and AWBs.
                    </li>
                    <li>
                      <strong>Set Environment Variables</strong>: Ensure <code className="bg-stone-200 px-1 py-0.5 rounded text-slate-800 font-mono">SHIPROCKET_EMAIL</code> and <code className="bg-stone-200 px-1 py-0.5 rounded text-slate-800 font-mono">SHIPROCKET_PASSWORD</code> are added to your hosting settings (Vercel / Cloud Run / .env).
                    </li>
                    <li>
                      <strong>Click &quot;Test Shiprocket Connection&quot; above</strong> to confirm your credentials and pickup location match with 100% certainty.
                    </li>
                  </ol>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: COMMUNITY REELS (Update Links, Thumbnails, and Products)              */}
          {/* ========================================================================= */}
          {activeTab === 'reels' && (
            <ReelsManager
              reels={reels}
              onUpdateReels={onUpdateReels || (() => {})}
              products={products}
            />
          )}

        </div>
      </div>

      {/* ========================================================================= */}
      {/* SET PRODUCT ORDER (REORDER MODAL) */}
      {/* ========================================================================= */}
      {showReorderModal && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-pink-100 rounded-2xl sm:rounded-3xl w-full max-w-2xl p-4 sm:p-6 shadow-2xl text-left space-y-4 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 flex-shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-pink-600" />
                  <span>Set Website Product Sequence</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Order in which products appear in the storefront. Position #1 is displayed first.
                </p>
              </div>
              <button
                onClick={() => setShowReorderModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Presets & Quick Reorder Controls */}
            <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs flex-shrink-0">
              <span className="font-semibold text-slate-500 mr-1">Quick Presets:</span>
              <button
                type="button"
                onClick={() => handleApplyPresetOrder('bestseller')}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-pink-50 border border-stone-200 text-slate-700 hover:text-pink-700 text-[11px] font-semibold cursor-pointer transition-colors shadow-2xs"
              >
                ⭐ Bestsellers First
              </button>
              <button
                type="button"
                onClick={() => handleApplyPresetOrder('price-asc')}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-pink-50 border border-stone-200 text-slate-700 hover:text-pink-700 text-[11px] font-semibold cursor-pointer transition-colors shadow-2xs"
              >
                ₹ Price: Low to High
              </button>
              <button
                type="button"
                onClick={() => handleApplyPresetOrder('price-desc')}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-pink-50 border border-stone-200 text-slate-700 hover:text-pink-700 text-[11px] font-semibold cursor-pointer transition-colors shadow-2xs"
              >
                ₹ Price: High to Low
              </button>
              <button
                type="button"
                onClick={() => handleApplyPresetOrder('title')}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-pink-50 border border-stone-200 text-slate-700 hover:text-pink-700 text-[11px] font-semibold cursor-pointer transition-colors shadow-2xs"
              >
                🔤 A - Z
              </button>
              <button
                type="button"
                onClick={() => handleApplyPresetOrder('reset')}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-stone-100 border border-stone-200 text-slate-600 text-[11px] font-medium cursor-pointer transition-colors"
              >
                Default
              </button>
            </div>

            {/* Search filter in modal */}
            <div className="relative flex-shrink-0">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={reorderSearchQuery}
                onChange={(e) => setReorderSearchQuery(e.target.value)}
                placeholder="Filter products to spot a specific item..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs focus:bg-white focus:border-pink-500 focus:outline-none"
              />
            </div>

            {/* Feedback Message */}
            {reorderFeedbackMsg && (
              <div className="p-2.5 rounded-xl bg-pink-50 border border-pink-200 text-pink-800 text-xs flex items-center gap-2 flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-pink-600 flex-shrink-0" />
                <span>{reorderFeedbackMsg}</span>
              </div>
            )}

            {/* Scrollable list of products */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 divide-y divide-stone-100">
              {orderedList
                .map((product, actualIndex) => ({ product, actualIndex }))
                .filter(({ product }) => {
                  if (!reorderSearchQuery.trim()) return true;
                  const q = reorderSearchQuery.toLowerCase();
                  return product.title.toLowerCase().includes(q) || product.category.toLowerCase().includes(q);
                })
                .map(({ product, actualIndex }) => {
                  const displayRank = actualIndex + 1;
                  return (
                    <div
                      key={product.id}
                      className="pt-2 flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-stone-50 transition-colors"
                    >
                      {/* Left: Rank & Image & Title */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-7 h-7 rounded-lg bg-pink-50 border border-pink-200 text-pink-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                          #{displayRank}
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-stone-100 border border-stone-200 overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                          <img
                            src={product.image}
                            alt={product.title}
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-slate-900 text-xs truncate">
                            {product.title}
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-2">
                            <span>{product.category}</span>
                            <span>•</span>
                            <span>₹{product.price}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Move & Rank Input controls */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <div className="flex items-center gap-1 mr-1">
                          <span className="text-[10px] text-slate-400 font-medium">Rank:</span>
                          <input
                            type="number"
                            min="1"
                            max={orderedList.length}
                            defaultValue={displayRank}
                            key={`rank-${product.id}-${displayRank}`}
                            onBlur={(e) => {
                              const targetVal = parseInt(e.target.value, 10);
                              if (!isNaN(targetVal)) {
                                handleMoveToPosition(actualIndex, targetVal);
                              }
                            }}
                            className="w-12 text-center py-1 px-1 rounded-lg border border-stone-200 text-xs font-bold text-slate-800 bg-white"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleMoveInModal(actualIndex, 0)}
                          disabled={actualIndex === 0}
                          className="px-1.5 py-1 rounded bg-stone-100 hover:bg-stone-200 disabled:opacity-20 text-slate-700 text-[10px] font-bold cursor-pointer transition-colors"
                          title="Move to Very Top (#1)"
                        >
                          Top
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveInModal(actualIndex, actualIndex - 1)}
                          disabled={actualIndex === 0}
                          className="p-1 rounded bg-stone-100 hover:bg-pink-100 hover:text-pink-700 disabled:opacity-20 text-slate-700 cursor-pointer transition-colors"
                          title="Move Up One Spot"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveInModal(actualIndex, actualIndex + 1)}
                          disabled={actualIndex === orderedList.length - 1}
                          className="p-1 rounded bg-stone-100 hover:bg-pink-100 hover:text-pink-700 disabled:opacity-20 text-slate-700 cursor-pointer transition-colors"
                          title="Move Down One Spot"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveInModal(actualIndex, orderedList.length - 1)}
                          disabled={actualIndex === orderedList.length - 1}
                          className="px-1.5 py-1 rounded bg-stone-100 hover:bg-stone-200 disabled:opacity-20 text-slate-700 text-[10px] font-bold cursor-pointer transition-colors"
                          title="Move to Bottom"
                        >
                          End
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-between border-t border-stone-100 pt-3 flex-shrink-0">
              <div className="text-[11px] text-slate-500">
                Total {orderedList.length} products
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowReorderModal(false)}
                  className="px-3 py-1.5 rounded-xl border border-stone-200 text-slate-600 hover:bg-stone-50 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveModalReorder}
                  disabled={isSavingReorder}
                  className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-md shadow-pink-600/20 disabled:opacity-50"
                >
                  {isSavingReorder ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Order...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Website Order</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD PRODUCT MODAL */}
      {/* ========================================================================= */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-60 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-pink-100 rounded-2xl sm:rounded-3xl w-full max-w-xl p-4 sm:p-7 shadow-2xl text-left space-y-4 sm:space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider">
                  {editingProduct ? 'Edit Product' : 'Add New Product to Store'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingProduct ? 'Update product details and photos.' : 'Listing will appear instantly in the customer storefront.'}
                </p>
              </div>
              <button
                onClick={() => {
                  resetProductForm();
                  setShowAddProductModal(false);
                }}
                className="w-8 h-8 rounded-full bg-stone-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {productFormMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{productFormMsg}</span>
              </div>
            )}

            {photoUploadError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{photoUploadError}</span>
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Product Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Hada Labo Gokujyun Premium Hyaluronic Lotion"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900 focus:bg-white focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Subtitle / Formulation Highlight
                </label>
                <input
                  type="text"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  placeholder="e.g. 7 Types of Hyaluronic Acid • Deep Moisture Barrier"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900 focus:bg-white focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                      Category
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingCategory(!isCreatingCategory);
                        setCategorySaveMsg(null);
                      }}
                      className="text-[11px] font-semibold text-pink-600 hover:text-pink-700 flex items-center gap-1 cursor-pointer"
                    >
                      <FolderPlus className="w-3 h-3" />
                      <span>{isCreatingCategory ? 'Cancel' : '+ New Category'}</span>
                    </button>
                  </div>

                  {isCreatingCategory ? (
                    <div className="p-3 rounded-xl bg-pink-50/70 border border-pink-200 space-y-2 animate-in fade-in">
                      <div className="text-[11px] font-bold text-pink-900">Add New Category to Supabase</div>
                      <input
                        type="text"
                        value={newCustomCategoryName}
                        onChange={(e) => setNewCustomCategoryName(e.target.value)}
                        placeholder="e.g. Cleansing Balm"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-pink-300 text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-pink-500"
                        autoFocus
                      />
                      {categorySaveMsg && (
                        <div className={`text-[11px] font-medium ${categorySaveMsg.type === 'success' ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {categorySaveMsg.text}
                        </div>
                      )}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleSaveNewCategory}
                          disabled={isSavingCategory || !newCustomCategoryName.trim()}
                          className="px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-semibold text-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                        >
                          {isSavingCategory ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Saving to Supabase...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Save to Supabase</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingCategory(false);
                            setCategorySaveMsg(null);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-stone-200 text-slate-600 hover:bg-stone-100 text-xs font-medium cursor-pointer"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  ) : (
                    <select
                      value={newCategory}
                      onChange={(e) => {
                        if (e.target.value === '__ADD_NEW__') {
                          setIsCreatingCategory(true);
                        } else {
                          setNewCategory(e.target.value as ProductCategory);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900 focus:bg-white focus:border-pink-500 focus:outline-none"
                    >
                      {categoriesList.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="__ADD_NEW__" className="text-pink-600 font-bold">
                        + Create & Save New Category...
                      </option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1 text-[11px]">
                    Volume / Size
                  </label>
                  <input
                    type="text"
                    value={newVolume}
                    onChange={(e) => setNewVolume(e.target.value)}
                    placeholder="170ml / 230g"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900 focus:bg-white focus:border-pink-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900 focus:bg-white focus:border-pink-500 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Original Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newOriginalPrice}
                    onChange={(e) => setNewOriginalPrice(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900 focus:bg-white focus:border-pink-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900 focus:bg-white focus:border-pink-500 focus:outline-none font-bold"
                  />
                </div>
              </div>

              {/* STOREFRONT DISPLAY POSITION (EXPLICIT TOP OF STOREFRONT CHOICE) */}
              <div className="p-3.5 bg-gradient-to-r from-pink-50/80 via-rose-50/40 to-white rounded-2xl border border-pink-200 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-pink-600" />
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Storefront Catalog Position
                    </label>
                  </div>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    newDisplayOrder === '1' || !newDisplayOrder
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-pink-100 text-pink-800 border border-pink-300'
                  }`}>
                    {newDisplayOrder === '1' || !newDisplayOrder ? '⭐️ Position #1 (Top of Storefront)' : `Position #${newDisplayOrder}`}
                  </span>
                </div>

                <p className="text-[11px] text-slate-600">
                  Choose where this product appears on the homepage and customer catalog:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewDisplayOrder('1')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col gap-0.5 ${
                      newDisplayOrder === '1' || !newDisplayOrder
                        ? 'bg-pink-600 text-white border-pink-600 shadow-xs ring-2 ring-pink-500/20'
                        : 'bg-white text-slate-700 border-stone-200 hover:border-pink-300 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">⭐️ Top of Storefront</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${newDisplayOrder === '1' || !newDisplayOrder ? 'bg-white/20 text-white' : 'bg-pink-50 text-pink-700'}`}>Rank #1</span>
                    </div>
                    <span className={`text-[10px] ${newDisplayOrder === '1' || !newDisplayOrder ? 'text-pink-100' : 'text-slate-500'}`}>
                      First item customers see (Recommended)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewDisplayOrder(String(products.length + 1))}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col gap-0.5 ${
                      newDisplayOrder === String(products.length + 1)
                        ? 'bg-pink-600 text-white border-pink-600 shadow-xs ring-2 ring-pink-500/20'
                        : 'bg-white text-slate-700 border-stone-200 hover:border-pink-300 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">📍 End of Storefront</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${newDisplayOrder === String(products.length + 1) ? 'bg-white/20 text-white' : 'bg-stone-100 text-slate-700'}`}>Rank #{products.length + 1}</span>
                    </div>
                    <span className={`text-[10px] ${newDisplayOrder === String(products.length + 1) ? 'text-pink-100' : 'text-slate-500'}`}>
                      Place after all current products
                    </span>
                  </button>

                  <div className="p-2.5 rounded-xl border bg-white border-stone-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-700">🔢 Custom Rank</span>
                      <span className="text-[10px] text-slate-400">1 to {products.length + 1}</span>
                    </div>
                    <input
                      type="number"
                      min="1"
                      max={products.length + 50}
                      value={newDisplayOrder}
                      onChange={(e) => setNewDisplayOrder(e.target.value)}
                      placeholder="1"
                      className="w-full px-2 py-1 text-xs font-bold rounded-lg bg-stone-50 border border-stone-200 text-slate-900 focus:bg-white focus:border-pink-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Coming Soon Pre-Launch Tag Option */}
              <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200/90 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <label htmlFor="isComingSoonCheckbox" className="text-xs font-bold text-slate-900 cursor-pointer">
                      Tag Product as "Coming Soon"
                    </label>
                    {newIsComingSoon && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-amber-500 text-white shadow-2xs animate-pulse">
                        Coming Soon Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Displays a prominent "COMING SOON" pre-launch badge across customer storefront, category filters, and product page.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    id="isComingSoonCheckbox"
                    type="checkbox"
                    checked={newIsComingSoon}
                    onChange={(e) => setNewIsComingSoon(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Direct Photo Upload Area (4-5 Photos) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider text-xs">
                    Product Photos (Upload 4–5 Photos)
                  </label>
                  <div className="flex items-center gap-2">
                    {newPhotos.length === 0 && (
                      <button
                        type="button"
                        onClick={() => setNewPhotos(['/products/keana-rice-mask.png'])}
                        className="text-[11px] font-semibold text-pink-600 hover:text-pink-700 cursor-pointer underline"
                      >
                        Use Sample Photo
                      </button>
                    )}
                    <span className={`text-[11px] font-semibold ${newPhotos.length >= 4 ? 'text-emerald-600 font-bold' : newPhotos.length > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                      {newPhotos.length} / 5 photos {newPhotos.length >= 4 ? '✓ Ready' : '(Min 1, Recommended 4–5)'}
                    </span>
                  </div>
                </div>

                {/* Hidden File Input */}
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/jpg"
                  multiple
                  onChange={handleProductPhotosChange}
                  className="hidden"
                />

                {/* Upload Drop/Click Area */}
                {newPhotos.length < 5 && (
                  <div
                    onClick={() => photoInputRef.current?.click()}
                    className="border-2 border-dashed border-pink-200 hover:border-pink-400 bg-pink-50/40 hover:bg-pink-50/80 rounded-2xl p-4 text-center cursor-pointer transition-all mb-3 group"
                  >
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                        {isProcessingPhotos ? (
                          <div className="w-5 h-5 border-2 border-pink-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Upload className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-pink-700">
                          {isProcessingPhotos ? 'Optimizing & uploading photos...' : 'Click to select product photos'}
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Select 4–5 photos (front, back/ingredients, texture, and packaging). PNG, JPG, or WebP.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Uploaded Photos Grid */}
                {newPhotos.length > 0 && (
                  <div className="grid grid-cols-5 gap-2">
                    {newPhotos.map((photo, idx) => (
                      <div
                        key={idx}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 bg-stone-50 p-1 group transition-all ${
                          idx === 0 ? 'border-pink-500 ring-2 ring-pink-100' : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <img
                          src={photo}
                          alt={`Product photo ${idx + 1}`}
                          className="w-full h-full object-contain"
                        />
                        
                        {/* Badge */}
                        <span className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold ${
                          idx === 0 ? 'bg-pink-600 text-white' : 'bg-slate-900/70 text-white'
                        }`}>
                          {idx === 0 ? '★ Cover' : `#${idx + 1}`}
                        </span>

                        {/* Action overlay on hover */}
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                          {idx !== 0 && (
                            <button
                              type="button"
                              onClick={() => handleSetCoverPhoto(idx)}
                              className="px-1 py-0.5 rounded bg-white text-slate-900 text-[8px] font-bold hover:bg-pink-50 hover:text-pink-600 transition-colors cursor-pointer w-full text-center"
                              title="Set as Main Cover Photo"
                            >
                              Make Cover
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(idx)}
                            className="p-1 rounded bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer"
                            title="Remove photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Quick Add More Slot Button if < 5 */}
                    {newPhotos.length < 5 && (
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="aspect-square rounded-xl border-2 border-dashed border-stone-200 hover:border-pink-400 bg-stone-50/50 hover:bg-pink-50/50 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-pink-600 transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="text-[9px] font-semibold">Add Photo</span>
                      </button>
                    )}
                  </div>
                )}

                {photoUploadError && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{photoUploadError}</span>
                  </p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    resetProductForm();
                    setShowAddProductModal(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct || isProcessingPhotos}
                  className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-md shadow-pink-600/20 flex items-center gap-2"
                >
                  {(isSavingProduct || isProcessingPhotos) && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>
                    {isProcessingPhotos
                      ? 'Uploading Photos...'
                      : isSavingProduct
                      ? 'Saving to Database...'
                      : (editingProduct ? 'Save Changes' : 'Publish Item')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Deletion Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-pink-100 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5 text-rose-600">
                <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600 flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900">
                    Remove Product
                  </h3>
                  <span className="text-[10px] text-slate-400 font-semibold">Store Catalog Action</span>
                </div>
              </div>
              <button
                onClick={() => setProductToDelete(null)}
                className="w-8 h-8 rounded-lg hover:bg-stone-100 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove <strong className="text-slate-900 font-bold">{productToDelete.title}</strong> from the store catalog?
            </p>

            {/* Product Mini Preview Card */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200/80">
              <div className="w-12 h-12 rounded-lg bg-white border border-stone-200 overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                <img
                  src={productToDelete.image}
                  alt={productToDelete.title}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs text-slate-900 truncate">{productToDelete.title}</div>
                <div className="text-[10px] text-slate-500">{productToDelete.category} • {formatINR(productToDelete.price)}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Current Stock: {productToDelete.stock ?? 0} units</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                This item will immediately be removed from the customer storefront, active cart items, and search filters.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onRemoveProduct) {
                    onRemoveProduct(productToDelete.id);
                  }
                  setRemoveToastMessage(`"${productToDelete.title}" was removed from the catalog.`);
                  setProductToDelete(null);
                  setTimeout(() => setRemoveToastMessage(null), 3500);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-600/20 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Product</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-pink-100 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5 text-pink-600">
                <div className="w-8 h-8 rounded-xl bg-pink-50 border border-pink-200/80 flex items-center justify-center text-pink-600 flex-shrink-0">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900">
                    Edit Order Details
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500 font-bold">
                    Order #{editingOrder.orderNumber}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="w-8 h-8 rounded-lg hover:bg-stone-100 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOrderEdit} className="space-y-4 text-xs">
              {/* Customer Information */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Customer Information
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">Full Name</span>
                    <input
                      type="text"
                      required
                      value={editCustomerName}
                      onChange={(e) => setEditCustomerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900 focus:bg-white focus:border-pink-500 focus:outline-none font-semibold text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">Phone Number</span>
                    <input
                      type="text"
                      value={editCustomerPhone}
                      onChange={(e) => setEditCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900 focus:bg-white focus:border-pink-500 focus:outline-none text-xs"
                    />
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Email Address</span>
                  <input
                    type="email"
                    value={editCustomerEmail}
                    onChange={(e) => setEditCustomerEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900 focus:bg-white focus:border-pink-500 focus:outline-none text-xs"
                  />
                </div>
              </div>

              {/* Order Status */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Fulfillment Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as Order['status'])}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900 font-bold focus:bg-white focus:border-pink-500 focus:outline-none text-xs cursor-pointer"
                >
                  <option value="CONFIRMED">CONFIRMED (Order Received)</option>
                  <option value="DISPATCHED">DISPATCHED (Packed & Assigned)</option>
                  <option value="IN_TRANSIT">IN TRANSIT (With Courier)</option>
                  <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY (Last Mile)</option>
                  <option value="DELIVERED">DELIVERED (Fulfilled)</option>
                  <option value="CANCELLED">CANCELLED (Void / Refunded)</option>
                </select>
              </div>

              {/* Shipping Address */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Shipping Address
                </label>
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Street Address</span>
                  <input
                    type="text"
                    value={editAddressLine}
                    onChange={(e) => setEditAddressLine(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900 focus:bg-white focus:border-pink-500 focus:outline-none text-xs"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">City</span>
                    <input
                      type="text"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900 focus:bg-white focus:border-pink-500 focus:outline-none text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">State</span>
                    <input
                      type="text"
                      value={editState}
                      onChange={(e) => setEditState(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900 focus:bg-white focus:border-pink-500 focus:outline-none text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">Pincode</span>
                    <input
                      type="text"
                      value={editPincode}
                      onChange={(e) => setEditPincode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900 focus:bg-white focus:border-pink-500 focus:outline-none text-xs font-mono font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Items Summary (Read Only) */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Items Ordered</span>
                  <span className="font-extrabold text-slate-900">{formatINR(editingOrder.totalAmount)}</span>
                </div>
                <ul className="space-y-1 max-h-24 overflow-y-auto">
                  {(editingOrder.items || []).map((item, idx) => (
                    <li key={idx} className="flex justify-between text-[11px] text-slate-600">
                      <span className="truncate max-w-[240px]">
                        {item.quantity}x {item.title} {item.shade ? `(${item.shade})` : ''}
                      </span>
                      <span className="font-medium text-slate-900">{formatINR(item.price * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingOrder}
                  className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-pink-600/20 transition-all"
                >
                  {isSavingOrder && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSavingOrder ? 'Saving Order...' : 'Save Order Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Order Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-pink-100 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5 text-rose-600">
                <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600 flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900">
                    Delete Order
                  </h3>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    Order #{orderToDelete.orderNumber}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="w-8 h-8 rounded-lg hover:bg-stone-100 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete order <strong className="text-slate-900 font-bold">#{orderToDelete.orderNumber}</strong> for <strong className="text-slate-900 font-bold">{orderToDelete.customerName}</strong>?
            </p>

            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Amount:</span>
                <strong className="text-slate-900">{formatINR(orderToDelete.totalAmount)}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Items Count:</span>
                <span className="font-semibold text-slate-800">{(orderToDelete.items || []).reduce((s, i) => s + i.quantity, 0)} items</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Destination:</span>
                <span className="text-slate-800">{orderToDelete.shippingAddress?.city}, {orderToDelete.shippingAddress?.state}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingOrder}
                onClick={handleConfirmDeleteOrder}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-600/20 transition-all"
              >
                {isDeletingOrder ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Toast for Order Operations */}
      {orderActionMsg && (
        <div className="fixed bottom-16 md:bottom-6 left-1/2 -translate-x-1/2 z-[80] bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{orderActionMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MOBILE BOTTOM TAB BAR (Quick touch navigation for operators)             */}
      {/* ========================================================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-pink-100 flex items-center justify-around px-2 py-1.5 shadow-lg">
        {/* Dashboard */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-colors cursor-pointer min-w-[64px] ${
            activeTab === 'dashboard' ? 'text-pink-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Overview</span>
        </button>

        {/* Inventory */}
        <button
          onClick={() => setActiveTab('inventory')}
          className={`relative flex flex-col items-center py-1 px-3 rounded-xl transition-colors cursor-pointer min-w-[64px] ${
            activeTab === 'inventory' ? 'text-pink-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="relative">
            <Package className="w-5 h-5 mb-0.5" />
            <span className="absolute -top-1 -right-2 text-[9px] bg-pink-100 text-pink-700 font-extrabold px-1 rounded-full border border-pink-200">
              {products.length}
            </span>
          </div>
          <span className="text-[10px] tracking-tight">Catalog</span>
        </button>

        {/* Orders */}
        <button
          onClick={() => setActiveTab('orders')}
          className={`relative flex flex-col items-center py-1 px-2.5 rounded-xl transition-colors cursor-pointer min-w-[58px] ${
            activeTab === 'orders' ? 'text-pink-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="relative">
            <Truck className="w-5 h-5 mb-0.5" />
            {orders.length > 0 && (
              <span className="absolute -top-1 -right-2 text-[9px] bg-pink-600 text-white font-extrabold px-1 rounded-full">
                {orders.length}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Orders</span>
        </button>

        {/* Reels */}
        <button
          onClick={() => setActiveTab('reels')}
          className={`relative flex flex-col items-center py-1 px-2.5 rounded-xl transition-colors cursor-pointer min-w-[58px] ${
            activeTab === 'reels' ? 'text-pink-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="relative">
            <Video className="w-5 h-5 mb-0.5" />
            <span className="absolute -top-1 -right-2 text-[9px] bg-pink-100 text-pink-700 font-extrabold px-1 rounded-full border border-pink-200">
              {reels.length}
            </span>
          </div>
          <span className="text-[10px] tracking-tight">Reels</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-colors cursor-pointer min-w-[64px] ${
            activeTab === 'settings' ? 'text-pink-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Settings className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Settings</span>
        </button>
      </nav>

    </div>
  );
};
