import React, { useState, useRef } from 'react';
import { 
  X, 
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
  Trash2
} from 'lucide-react';
import { Order, Product, ProductCategory, SiteSettings } from '../types';
import { formatINR } from '../data/pincodes';
import { KonichiwaMartLogo } from './KonichiwaMartLogo';

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
  onViewInvoice: (order: Order) => void;
  products: Product[];
  onUpdateProductStock: (productId: string, inStock: boolean, stockCount?: number) => void;
  onUpdateProductPrice?: (productId: string, newPrice: number) => void;
  onAddProduct: (product: Product) => void;
  onRemoveProduct?: (productId: string) => void;
  onResetDefaultProducts?: () => void;
  onLogout: () => void;
  operatorEmail?: string;
  siteSettings: SiteSettings;
  onUpdateSiteSettings: (settings: Partial<SiteSettings>) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  isOpen,
  onClose,
  orders,
  onViewInvoice,
  products,
  onUpdateProductStock,
  onUpdateProductPrice,
  onAddProduct,
  onRemoveProduct,
  onResetDefaultProducts,
  onLogout,
  operatorEmail = 'dealer@konichiwamart.com',
  siteSettings,
  onUpdateSiteSettings
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'orders' | 'settings'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [savedFeedbackMap, setSavedFeedbackMap] = useState<Record<string, boolean>>({});

  // Product Deletion State
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [removeToastMessage, setRemoveToastMessage] = useState<string | null>(null);

  // Add Product Modal / State inside Portal
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newCategory, setNewCategory] = useState<ProductCategory>('Face Wash');
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
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

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

  // Banner Upload File Handler
  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBanner(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        // 1. Upload to server to persist permanently into public/hero-banner.png and dist/hero-banner.png
        const uploadRes = await fetch('/api/upload-banner', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 })
        });
        
        const timestamp = Date.now();
        const permanentUrl = `/hero-banner.png?v=${timestamp}`;

        // 2. Clean up any heavy base64 strings from localStorage to prevent quota overflow
        try {
          localStorage.removeItem('km_hero_banner_data');
        } catch {}

        // 3. Update application state with permanent file path
        onUpdateSiteSettings({ heroBannerUrl: permanentUrl });

        setSettingsSuccessMsg('Store background updated & saved to build successfully!');
        setTimeout(() => setSettingsSuccessMsg(null), 3500);
      } catch (err) {
        console.error('Error uploading banner:', err);
      } finally {
        setIsUploadingBanner(false);
      }
    };
    reader.readAsDataURL(file);
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
      const optimizedPromises = filesToProcess.map((f: File) => resizeAndOptimizeImage(f));
      const processed = await Promise.all(optimizedPromises);

      setNewPhotos((prev) => [...prev, ...processed].slice(0, 5));
    } catch (err) {
      console.error('Failed to process photos:', err);
      setPhotoUploadError('Failed to process one or more images. Please try valid PNG/JPG/WebP files.');
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

  // Handle Add Product submit
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrice) return;

    if (newPhotos.length === 0) {
      setPhotoUploadError('Please upload at least 1 photo of the product (recommended 4–5 photos).');
      return;
    }

    const parsedPrice = parseInt(newPrice, 10) || 600;
    const parsedOriginal = parseInt(newOriginalPrice, 10) || parsedPrice;
    const parsedStock = parseInt(newStock, 10) || 20;

    const mainCover = newPhotos[0];
    const secondary = newPhotos[1] || undefined;

    const newProduct: Product = {
      id: `km-${Date.now()}`,
      title: newTitle.trim(),
      subtitle: newSubtitle.trim() || `${newCategory} • Authentic Tokyo Skincare`,
      price: parsedPrice,
      originalPrice: parsedOriginal,
      rating: 4.9,
      reviewsCount: 1,
      category: newCategory,
      skinTypes: ['All'],
      skinConcerns: ['Hydration', 'Glow & Dullness'],
      routine: 'AM/PM',
      volume: newVolume || '100ml',
      badges: ['Tokyo Arrival', 'Authentic Import'],
      image: mainCover,
      secondaryImage: secondary,
      images: newPhotos,
      accentColor: '#C52857',
      bgGradient: 'from-pink-50 to-rose-100',
      stock: parsedStock,
      keyActives: [
        { name: 'Japanese Botanical Extract', purpose: 'Restores skin barrier & luminosity' }
      ],
      fullIngredients: 'Water, Glycerin, Butylene Glycol, Sodium Hyaluronate.',
      description: 'Official direct imported Japanese skincare formulation.',
      benefits: ['Deep hydration', 'Authentic import', 'Skin gentle'],
      usageHowTo: 'Apply onto cleansed skin. Gently pat with palms until absorbed.'
    };

    onAddProduct(newProduct);
    setProductFormMsg(`Product "${newTitle}" added with ${newPhotos.length} photo${newPhotos.length > 1 ? 's' : ''}!`);
    setNewTitle('');
    setNewSubtitle('');
    setNewPrice('750');
    setNewOriginalPrice('950');
    setNewStock('50');
    setNewPhotos([]);
    setPhotoUploadError(null);

    setTimeout(() => {
      setProductFormMsg(null);
      setShowAddProductModal(false);
      setActiveTab('inventory');
    }, 1200);
  };

  // Filtered Products for Inventory Table
  const filteredProducts = products.filter((p) => {
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex bg-[#FAF7F2] text-slate-800 overflow-hidden font-sans select-none animate-in fade-in duration-200">
      
      {/* ========================================================================= */}
      {/* 1. LEFT SIDEBAR NAVIGATION (Website theme aligned: light, crisp, pink accents) */}
      {/* ========================================================================= */}
      <aside className="w-64 sm:w-72 bg-white/95 border-r border-pink-100 flex flex-col justify-between flex-shrink-0 shadow-xs">
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
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all cursor-pointer text-left font-medium ${
                  activeTab === 'inventory'
                    ? 'bg-pink-50 text-pink-700 shadow-xs font-bold border-l-4 border-pink-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-stone-50'
                }`}
              >
                <Package className={`w-4 h-4 ${activeTab === 'inventory' ? 'text-pink-600' : 'text-slate-400'}`} />
                <span className="tracking-wide">INVENTORY</span>
              </button>

              {/* ORDERS TAB */}
              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all cursor-pointer text-left font-medium ${
                  activeTab === 'orders'
                    ? 'bg-pink-50 text-pink-700 shadow-xs font-bold border-l-4 border-pink-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-stone-50'
                }`}
              >
                <Truck className={`w-4 h-4 ${activeTab === 'orders' ? 'text-pink-600' : 'text-slate-400'}`} />
                <span className="tracking-wide">ORDERS & LEADS</span>
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
      {/* 2. MAIN CONTENT VIEWPORT */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#FAF7F2]">
        
        {/* TOP APP BAR (Search + Website link + Close) */}
        <header className="h-16 border-b border-pink-100 px-6 flex items-center justify-between flex-shrink-0 bg-white/90 backdrop-blur-md">
          {/* Search bar */}
          <div className="relative w-72 sm:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search products, orders, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
            />
          </div>

          {/* Right Action: Website button & Close */}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-stone-200 hover:border-pink-300 bg-white hover:bg-pink-50 text-slate-700 hover:text-pink-700 text-xs font-bold tracking-wider uppercase flex items-center gap-2 cursor-pointer transition-all shadow-xs"
            >
              <span>WEBSITE</span>
              <ExternalLink className="w-3.5 h-3.5 text-pink-600" />
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white hover:bg-rose-50 border border-stone-200 hover:border-rose-200 text-slate-500 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer shadow-xs"
              title="Close Portal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* VIEW BODY SCROLLABLE CONTAINER */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 md:p-10 space-y-8">
          
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
                      onClick={() => setShowAddProductModal(true)}
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
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="text-[10px] font-semibold text-slate-500 uppercase border-b border-stone-200 bg-stone-50/80">
                        <tr>
                          <th className="py-2.5 px-3">Order ID</th>
                          <th className="py-2.5 px-3">Customer</th>
                          <th className="py-2.5 px-3">Destination</th>
                          <th className="py-2.5 px-3">Amount</th>
                          <th className="py-2.5 px-3">Courier / AWB</th>
                          <th className="py-2.5 px-3 text-right">Invoice</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {orders.slice(0, 4).map((o) => (
                          <tr key={o.id} className="text-slate-700 hover:bg-pink-50/30 transition-colors">
                            <td className="py-3 px-3 font-mono font-bold text-slate-900">{o.orderNumber}</td>
                            <td className="py-3 px-3">
                              <div className="font-semibold text-slate-900">{o.customerName}</div>
                              <div className="text-[10px] text-slate-400">{o.customerPhone}</div>
                            </td>
                            <td className="py-3 px-3 text-slate-600">
                              {o.shippingAddress.city}, {o.shippingAddress.state}
                            </td>
                            <td className="py-3 px-3 font-bold text-slate-900">{formatINR(o.totalAmount)}</td>
                            <td className="py-3 px-3">
                              <div className="font-semibold text-slate-800">{o.courierPartner || 'Blue Dart'}</div>
                              <div className="text-[10px] text-slate-400 font-mono">AWB: {o.awbNumber || '88492019482'}</div>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => onViewInvoice(o)}
                                className="px-3 py-1.5 rounded-lg bg-white hover:bg-pink-50 text-slate-700 hover:text-pink-700 border border-stone-200 text-[11px] font-semibold cursor-pointer shadow-2xs transition-colors"
                              >
                                View GST Invoice
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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

                <div className="flex items-center gap-2">
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
                    onClick={() => setShowAddProductModal(true)}
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
                {['All', 'Face Wash', 'Face Mask', 'Toner', 'Sunscreen', 'Lips', 'Serum'].map((cat) => (
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

              {/* Table */}
              <div className="bg-white border border-pink-100 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50/90 text-slate-600 font-semibold uppercase tracking-wider text-[10px] border-b border-stone-200">
                      <tr>
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
                                  min="1"
                                  defaultValue={p.price}
                                  onBlur={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    if (val && onUpdateProductPrice) {
                                      onUpdateProductPrice(p.id, val);
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
                            <td className="p-3.5 text-right">
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
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 font-sans">
                  CUSTOMER ORDERS & LEADS
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live verification of customer transactions, payment logs, and courier dispatch receipts.
                </p>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-pink-100 shadow-xs">
                  <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h4 className="font-bold text-slate-800 text-sm">No Customer Orders Yet</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    When customers complete checkout via Razorpay or COD, their order details and tax invoice will appear here.
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-pink-100 rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50/90 text-slate-600 font-semibold uppercase tracking-wider text-[10px] border-b border-stone-200">
                        <tr>
                          <th className="p-3.5">Order ID</th>
                          <th className="p-3.5">Customer</th>
                          <th className="p-3.5">Shipping Address</th>
                          <th className="p-3.5">Amount</th>
                          <th className="p-3.5">Payment</th>
                          <th className="p-3.5">Courier / AWB</th>
                          <th className="p-3.5 text-right">Tax Invoice</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {orders.map((o) => (
                          <tr key={o.id} className="text-slate-700 hover:bg-pink-50/30 transition-colors">
                            <td className="p-3.5 font-mono font-bold text-slate-900">{o.orderNumber}</td>
                            <td className="p-3.5">
                              <div className="font-semibold text-slate-900">{o.customerName}</div>
                              <div className="text-[10px] text-slate-400">{o.customerPhone}</div>
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
                              <div className="font-semibold text-slate-800">{o.courierPartner || 'Blue Dart Express'}</div>
                              <div className="text-[10px] text-slate-400 font-mono">AWB: {o.awbNumber || '88492019482'}</div>
                            </td>
                            <td className="p-3.5 text-right">
                              <button
                                onClick={() => onViewInvoice(o)}
                                className="px-3 py-1.5 rounded-lg bg-white hover:bg-pink-50 text-slate-700 hover:text-pink-700 border border-stone-200 font-semibold text-xs cursor-pointer shadow-2xs transition-colors"
                              >
                                View GST Invoice
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
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

              {/* MODULE 1: STORE BACKGROUND & HERO BANNER */}
              <div className="bg-white border border-pink-100 rounded-2xl p-6 space-y-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-pink-50 border border-pink-200/80 flex items-center justify-center text-pink-600">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm tracking-wider uppercase text-slate-900">
                        STORE BACKGROUND / HERO BANNER
                      </h3>
                      <p className="text-xs text-slate-500">
                        Upload or replace the widescreen panoramic background. It stays visible as an ambient hint while scrolling through the site!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Banner Thumbnail Preview */}
                <div className="relative w-full h-44 rounded-xl overflow-hidden border border-pink-100 bg-stone-50 group shadow-2xs">
                  <img
                    src={siteSettings.heroBannerUrl}
                    alt="Current Store Banner"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      onClick={() => bannerInputRef.current?.click()}
                      disabled={isUploadingBanner}
                      className="px-4 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs uppercase tracking-wider cursor-pointer shadow-lg hover:bg-pink-50 transition-all"
                    >
                      {isUploadingBanner ? 'Uploading...' : 'Replace Banner Image'}
                    </button>
                  </div>
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={bannerInputRef}
                  onChange={handleBannerFileChange}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-2">
                  <div className="text-xs text-slate-500">
                    Supports 16:9 or 21:9 ultra-widescreen PNG, JPG, or WebP format.
                  </div>

                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={isUploadingBanner}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 border border-stone-200 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Upload from Computer</span>
                  </button>
                </div>

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
                        placeholder="e.g. Tokyo Skincare"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-pink-500"
                      />
                    </div>

                    <button
                      onClick={() => {
                        onUpdateSiteSettings({
                          storeName: tempStoreName.trim() || 'Konichiwa.Mart',
                          storeTagline: tempStoreTagline.trim() || 'Tokyo Skincare'
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

            </div>
          )}

        </div>
      </div>

      {/* ========================================================================= */}
      {/* ADD PRODUCT MODAL */}
      {/* ========================================================================= */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-60 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-pink-100 rounded-3xl w-full max-w-xl p-6 sm:p-7 shadow-2xl text-left space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider">
                  Add New Product to Store
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Listing will appear instantly in the customer storefront.
                </p>
              </div>
              <button
                onClick={() => setShowAddProductModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {productFormMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{productFormMsg}</span>
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
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ProductCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900 focus:bg-white focus:border-pink-500 focus:outline-none"
                  >
                    <option value="Face Wash">Face Wash</option>
                    <option value="Face Mask">Face Mask</option>
                    <option value="Toner">Toner</option>
                    <option value="Sunscreen">Sunscreen</option>
                    <option value="Lips">Lips</option>
                    <option value="Serum">Serum</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
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

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="750"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900 focus:bg-white focus:border-pink-500 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Original (₹)
                  </label>
                  <input
                    type="number"
                    value={newOriginalPrice}
                    onChange={(e) => setNewOriginalPrice(e.target.value)}
                    placeholder="950"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900 focus:bg-white focus:border-pink-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    required
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    placeholder="50"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-slate-900 focus:bg-white focus:border-pink-500 focus:outline-none font-bold"
                  />
                </div>
              </div>

              {/* Direct Photo Upload Area (4-5 Photos) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider text-xs">
                    Product Photos (Upload 4–5 Photos)
                  </label>
                  <span className={`text-[11px] font-semibold ${newPhotos.length >= 4 ? 'text-emerald-600 font-bold' : newPhotos.length > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                    {newPhotos.length} / 5 photos {newPhotos.length >= 4 ? '✓ Ready' : '(Min 1, Recommended 4–5)'}
                  </span>
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
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-md shadow-pink-600/20"
                >
                  Publish Item
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

    </div>
  );
};
