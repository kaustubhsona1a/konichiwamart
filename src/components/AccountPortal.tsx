import React, { useState } from 'react';
import { 
  X, 
  User, 
  Package, 
  MapPin, 
  Heart, 
  FileText, 
  Truck, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Check, 
  Sparkles,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  LogOut,
  RefreshCw
} from 'lucide-react';
import { UserProfile, UserAddress, Order, Product } from '../types';
import { PRODUCTS } from '../data/products';
import { formatINR, lookupPincode } from '../data/pincodes';
import { 
  saveAddressToSupabase, 
  deleteCustomerAddressFromSupabase, 
  setDefaultAddressInSupabase,
  fetchCustomerAddressesFromSupabase,
  fetchCustomerOrdersFromSupabase,
  normalizeOrder,
  normalizeOrderItem
} from '../lib/supabase';

const getStatusBadgeStyle = (status: string) => {
  const norm = (status || 'CONFIRMED').toUpperCase();
  switch (norm) {
    case 'DELIVERED':
      return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
    case 'IN_TRANSIT':
    case 'OUT_FOR_DELIVERY':
      return 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800';
    case 'DISPATCHED':
    case 'SHIPPED':
      return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    case 'CANCELLED':
      return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800';
    default:
      return 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800';
  }
};

const getStatusLabel = (status: string) => {
  const norm = (status || 'CONFIRMED').toUpperCase();
  switch (norm) {
    case 'DELIVERED':
      return 'Delivered';
    case 'IN_TRANSIT':
      return 'In Transit';
    case 'OUT_FOR_DELIVERY':
      return 'Out for Delivery';
    case 'DISPATCHED':
    case 'SHIPPED':
      return 'Packed & Dispatched';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return 'Order Confirmed';
  }
};

const getMilestoneDone = (milestoneIndex: number, status: string) => {
  const norm = (status || 'CONFIRMED').toUpperCase();
  if (norm === 'CANCELLED') return false;
  let currentIndex = 0; // 0 = CONFIRMED
  if (norm === 'DISPATCHED' || norm === 'SHIPPED') currentIndex = 1;
  else if (norm === 'IN_TRANSIT' || norm === 'OUT_FOR_DELIVERY') currentIndex = 2;
  else if (norm === 'DELIVERED') currentIndex = 3;

  return milestoneIndex <= currentIndex;
};

interface AccountPortalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onViewInvoice: (order: Order) => void;
  onAddToCart: (product: Product) => void;
  onRemoveWishlist: (productId: string) => void;
  onSignOut?: () => void;
}

export const AccountPortal: React.FC<AccountPortalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  onViewInvoice,
  onAddToCart,
  onRemoveWishlist,
  onSignOut
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'wishlist' | 'profile'>('orders');
  
  // New address form state
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [fullName, setFullName] = useState(profile.name || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [pincode, setPincode] = useState('400050');
  const [tag, setTag] = useState<'Home' | 'Office'>('Home');

  // Keep form synced with active profile
  const [isSyncingOrders, setIsSyncingOrders] = useState(false);

  const syncOrders = React.useCallback(async () => {
    if (!profile.email) return;
    setIsSyncingOrders(true);
    try {
      const fetchedOrders = await fetchCustomerOrdersFromSupabase(profile.id, profile.email);
      if (Array.isArray(fetchedOrders)) {
        const map = new Map<string, Order>();
        fetchedOrders.forEach(o => {
          const norm = normalizeOrder(o);
          const key = norm.orderNumber || norm.id;
          if (key) map.set(key, norm);
        });
        (profile.orders || []).forEach(o => {
          const norm = normalizeOrder(o);
          const key = norm.orderNumber || norm.id;
          if (key && !map.has(key)) map.set(key, norm);
        });
        const combined = Array.from(map.values()).sort(
          (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
        );
        onUpdateProfile({
          ...profile,
          orders: combined
        });
      }
    } catch (err) {
      console.warn('[AccountPortal Order Sync Warning]:', err);
    } finally {
      setIsSyncingOrders(false);
    }
  }, [profile, onUpdateProfile]);

  // Real-time synchronization when viewing orders: auto-poll and listen to window focus/custom events
  React.useEffect(() => {
    if (!isOpen || !profile.email) return;

    // 1. Refresh when window gains focus or tab becomes visible
    const handleFocus = () => {
      syncOrders();
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    // 2. Refresh on custom app order status event (e.g. status updated from admin in same window)
    const handleStatusEvent = () => {
      syncOrders();
    };
    window.addEventListener('km_order_status_updated', handleStatusEvent);

    // 3. Periodic polling every 8 seconds while modal is open on orders tab
    const interval = setInterval(() => {
      if (activeTab === 'orders') {
        syncOrders();
      }
    }, 8000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('km_order_status_updated', handleStatusEvent);
      clearInterval(interval);
    };
  }, [isOpen, activeTab, profile.email, syncOrders]);

  React.useEffect(() => {
    if (profile.name) setFullName(profile.name);
    if (profile.phone) setPhone(profile.phone);
    if (isOpen && profile.email) {
      // Sync addresses
      fetchCustomerAddressesFromSupabase(profile.id, profile.email).then((addrs) => {
        if (Array.isArray(addrs) && addrs.length > 0) {
          const map = new Map<string, UserAddress>();
          addrs.forEach(a => {
            const sig = `${(a.addressLine1 || '').trim()}_${(a.pincode || '').trim()}`.toLowerCase();
            if (sig !== '_') map.set(sig, a);
          });
          (profile.addresses || []).forEach(a => {
            const sig = `${(a.addressLine1 || '').trim()}_${(a.pincode || '').trim()}`.toLowerCase();
            if (sig !== '_' && !map.has(sig)) map.set(sig, a);
          });
          onUpdateProfile({
            ...profile,
            addresses: Array.from(map.values())
          });
        }
      }).catch(() => {});

      // Sync orders
      syncOrders();
    }
  }, [profile.name, profile.phone, isOpen]);

  if (!isOpen) return null;

  const wishlistedProducts = PRODUCTS.filter(p => profile.wishlistIds.includes(p.id));

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const pinInfo = lookupPincode(pincode);
    const newAddr: UserAddress = {
      id: `addr_${Date.now()}`,
      fullName: fullName.trim() || profile.name || 'Customer',
      phone: phone.trim() || profile.phone || '',
      addressLine1: line1.trim(),
      addressLine2: line2.trim(),
      city: pinInfo.city || 'Mumbai',
      state: pinInfo.state || 'Maharashtra',
      pincode: pincode.trim(),
      tag,
      isDefault: profile.addresses.length === 0
    };

    // Filter any pre-existing entry with the same line1 + pincode to prevent duplicates
    const filtered = (profile.addresses || []).filter(
      a => !(a.addressLine1.trim().toLowerCase() === newAddr.addressLine1.toLowerCase() && a.pincode.trim() === newAddr.pincode)
    );
    const updatedAddresses = [...filtered, newAddr];

    onUpdateProfile({
      ...profile,
      addresses: updatedAddresses
    });
    setIsAddingAddress(false);
    setLine1('');
    setLine2('');

    try {
      const saved = await saveAddressToSupabase(profile.id, newAddr, profile.email);
      if (saved && saved.id) {
        onUpdateProfile({
          ...profile,
          addresses: updatedAddresses.map(a => a.id === newAddr.id ? { ...a, id: saved.id } : a)
        });
      }
    } catch (err) {
      console.warn('[AccountPortal] Error persisting address to Supabase:', err);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    onUpdateProfile({
      ...profile,
      addresses: profile.addresses.filter(a => a.id !== id)
    });
    try {
      await deleteCustomerAddressFromSupabase(id, profile.email);
    } catch (err) {
      console.warn('[AccountPortal] Delete address error:', err);
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    onUpdateProfile({
      ...profile,
      addresses: profile.addresses.map(a => ({
        ...a,
        isDefault: a.id === id
      }))
    });
    try {
      await setDefaultAddressInSupabase(id, profile.id, profile.email);
    } catch (err) {
      console.warn('[AccountPortal] Set default address error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      
      {/* Account Modal Container */}
      <div 
        className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-3xl md:rounded-[2.5rem] border border-stone-200 dark:border-zinc-800 shadow-2xl p-6 md:p-8 text-left max-h-[92vh] overflow-y-auto select-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 flex items-center justify-center text-slate-600 dark:text-zinc-300 shadow-sm transition-all cursor-pointer border border-stone-200 dark:border-zinc-700"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* User Identity Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200 dark:border-zinc-800">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-300 to-rose-100 dark:from-pink-900/60 dark:to-rose-950/60 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full rounded-2xl bg-white dark:bg-zinc-800 flex items-center justify-center text-pink-700 dark:text-pink-300 font-display text-2xl font-bold">
                {profile.name ? profile.name.charAt(0).toUpperCase() : 'C'}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
                  {profile.name || 'Customer'}
                </h2>
                <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified Account</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                {profile.email} {profile.phone ? `• ${profile.phone}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="text-xs text-slate-600 dark:text-zinc-300 bg-stone-100 dark:bg-zinc-800/90 px-3.5 py-1.5 rounded-xl border border-stone-200 dark:border-zinc-700">
              Total Orders: <strong className="text-slate-900 dark:text-white">{profile.orders.length}</strong>
            </div>
            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="text-xs text-rose-700 dark:text-rose-300 hover:text-rose-800 dark:hover:text-rose-200 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                title="Sign out of customer account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="font-medium">Sign Out</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-200 dark:border-zinc-800 gap-6 pt-4 mb-6 text-xs font-serif overflow-x-auto">
          {[
            { id: 'orders' as const, label: 'Order History & Tracking', count: profile.orders.length, icon: Package },
            { id: 'addresses' as const, label: 'Delivery Address Book', count: profile.addresses.length, icon: MapPin },
            { id: 'wishlist' as const, label: 'Saved Wishlist', count: profile.wishlistIds.length, icon: Heart },
            { id: 'profile' as const, label: 'Security & Preferences', icon: User }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'text-pink-600 dark:text-pink-400 border-b-2 border-pink-600 dark:border-pink-400 font-semibold text-sm'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="text-[10px] bg-stone-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 px-1.5 py-0.2 rounded-full font-mono border border-stone-200 dark:border-zinc-700">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB CONTENT: ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1">
              <div>
                <h3 className="font-serif text-sm font-semibold text-slate-900 dark:text-white">Order History</h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">Past purchases and live tracking for {profile.email}</p>
              </div>
              <button
                type="button"
                onClick={syncOrders}
                disabled={isSyncingOrders}
                className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-700/60 text-slate-700 dark:text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-pink-600 dark:text-pink-400 ${isSyncingOrders ? 'animate-spin' : ''}`} />
                <span>{isSyncingOrders ? 'Refreshing...' : 'Refresh Orders'}</span>
              </button>
            </div>

            {profile.orders.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <Package className="w-12 h-12 text-slate-400 dark:text-zinc-500 mx-auto stroke-1" />
                <h4 className="font-serif text-lg text-slate-900 dark:text-white">No Past Orders Found</h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400">When you place an order, your official Tax Invoice will appear here.</p>
              </div>
            ) : (
              profile.orders.map((order) => {
                const normOrder = normalizeOrder(order);
                const isCancelled = (normOrder.status || '').toUpperCase() === 'CANCELLED';

                return (
                  <div key={normOrder.id} className="p-5 rounded-2xl bg-stone-50/70 dark:bg-zinc-950/60 border border-stone-200 dark:border-zinc-800 shadow-xs space-y-4">
                    
                    {/* Order Top Bar */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-stone-200 dark:border-zinc-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif text-base font-bold text-slate-900 dark:text-white">
                            Order #{normOrder.orderNumber}
                          </span>
                          <span className={`text-[11px] border px-2.5 py-0.5 rounded-full font-semibold ${getStatusBadgeStyle(normOrder.status)}`}>
                            {getStatusLabel(normOrder.status)}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 block">
                          Placed on {normOrder.date} • Paid via {normOrder.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onViewInvoice(normOrder)}
                          className="px-3.5 py-1.5 rounded-xl bg-pink-50 dark:bg-pink-950/50 hover:bg-pink-100 dark:hover:bg-pink-900/60 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Tax Invoice</span>
                        </button>
                      </div>
                    </div>

                    {/* Shiprocket Live Tracking Status Timeline */}
                    {!isCancelled ? (
                      <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 space-y-2 text-xs">
                        {/* Milestone progress dots */}
                        <div className="grid grid-cols-4 gap-2 text-[10px] text-center font-medium">
                          {[
                            { label: 'Order Confirmed', done: getMilestoneDone(0, normOrder.status) },
                            { label: 'Packed & Dispatched', done: getMilestoneDone(1, normOrder.status) },
                            { label: 'In Transit', done: getMilestoneDone(2, normOrder.status) },
                            { label: 'Delivered', done: getMilestoneDone(3, normOrder.status) }
                          ].map((st, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className={`h-1.5 rounded-full transition-colors ${st.done ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-stone-200 dark:bg-zinc-800'}`} />
                              <span className={st.done ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-slate-400 dark:text-zinc-500'}>{st.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 font-medium flex items-center gap-2">
                        <X className="w-4 h-4 text-rose-600" />
                        <span>This order was cancelled.</span>
                      </div>
                    )}

                    {/* Ordered Items List */}
                    <div className="divide-y divide-stone-200 dark:divide-zinc-800">
                      {normOrder.items.map((rawItem, i) => {
                        const item = normalizeOrderItem(rawItem);
                        const lineTotal = item.price > 0 ? item.price * item.quantity : 0;
                        return (
                          <div key={i} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2.5">
                              <div className="w-11 h-11 rounded-xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
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
                              <div>
                                <div className="font-serif font-semibold text-slate-900 dark:text-white leading-tight">{item.title}</div>
                                <div className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
                                  Qty: {item.quantity} {item.volume ? `• ${item.volume}` : ''} {item.shade ? `• Shade: ${item.shade}` : ''}
                                </div>
                              </div>
                            </div>
                            <div className="font-display font-bold text-slate-900 dark:text-white flex-shrink-0">
                              {lineTotal > 0 ? formatINR(lineTotal) : (normOrder.totalAmount ? formatINR(normOrder.totalAmount) : '—')}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Order Total */}
                    <div className="pt-2 flex justify-between items-center text-xs font-semibold text-slate-800 dark:text-zinc-200">
                      <span>Total Paid (Including 18% GST)</span>
                      <span className="font-display text-base text-pink-600 dark:text-pink-400 font-bold">
                        {formatINR(normOrder.totalAmount)}
                      </span>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB CONTENT: SAVED ADDRESSES */}
        {activeTab === 'addresses' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-zinc-400">
                Manage shipping destinations for fast, 1-click checkout.
              </span>
              <button
                onClick={() => setIsAddingAddress(!isAddingAddress)}
                className="px-3.5 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingAddress ? 'Cancel' : 'Add New Address'}</span>
              </button>
            </div>

            {/* Address Form */}
            {isAddingAddress && (
              <form onSubmit={handleSaveAddress} className="p-4 rounded-2xl bg-stone-50 dark:bg-zinc-950/80 border border-stone-200 dark:border-zinc-800 space-y-3 animate-in fade-in">
                <div className="font-serif text-sm font-semibold text-slate-900 dark:text-white">
                  Add Delivery Address (India)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">Full Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ananya Sharma"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 text-xs text-slate-900 dark:text-white border border-stone-300 dark:border-zinc-700 outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">Mobile Number</label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 text-xs text-slate-900 dark:text-white border border-stone-300 dark:border-zinc-700 outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">Flat, House No., Building, Street</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flat 402, Lotus Towers, 14th Road"
                    value={line1}
                    onChange={(e) => setLine1(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 text-xs text-slate-900 dark:text-white border border-stone-300 dark:border-zinc-700 outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">6-digit Pincode</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 text-xs font-mono text-slate-900 dark:text-white border border-stone-300 dark:border-zinc-700 outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">City</label>
                    <input
                      type="text"
                      readOnly
                      value={lookupPincode(pincode).city || 'Mumbai'}
                      className="w-full px-3 py-2 rounded-xl bg-stone-100 dark:bg-zinc-800 text-xs text-slate-700 dark:text-zinc-300 border border-stone-300 dark:border-zinc-700 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">Address Tag</label>
                    <select
                      value={tag}
                      onChange={(e) => setTag(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 text-xs text-slate-900 dark:text-white border border-stone-300 dark:border-zinc-700 outline-none focus:border-pink-500"
                    >
                      <option value="Home">Home</option>
                      <option value="Office">Office</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                >
                  Save Delivery Address
                </button>
              </form>
            )}

            {/* Empty Address State */}
            {profile.addresses.length === 0 && !isAddingAddress && (
              <div className="text-center py-10 space-y-2 rounded-2xl bg-stone-50 dark:bg-zinc-950/60 border border-stone-200 dark:border-zinc-800 p-6">
                <MapPin className="w-10 h-10 text-slate-400 dark:text-zinc-500 mx-auto stroke-1" />
                <h4 className="font-serif text-base text-slate-900 dark:text-white">No Saved Addresses</h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Add a delivery destination to speed up your checkout next time.</p>
                <button
                  type="button"
                  onClick={() => setIsAddingAddress(true)}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Delivery Address</span>
                </button>
              </div>
            )}

            {/* Address Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profile.addresses.map((addr) => (
                <div key={addr.id} className="p-4 rounded-2xl bg-stone-50/70 dark:bg-zinc-950/60 border border-stone-200 dark:border-zinc-800 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-pink-100 dark:bg-pink-950/60 text-pink-800 dark:text-pink-300 text-[10px] font-bold uppercase border border-pink-200 dark:border-pink-800">
                      {addr.tag}
                    </span>
                    {addr.isDefault && (
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Default
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold text-xs text-slate-900 dark:text-white">{addr.fullName}</h4>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed mt-0.5">
                      {addr.addressLine1}, {addr.city}, {addr.state} — <strong>{addr.pincode}</strong><br />
                      Phone: {addr.phone}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-stone-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                    {!addr.isDefault && (
                      <button
                        onClick={() => handleSetDefaultAddress(addr.id)}
                        className="text-pink-600 dark:text-pink-400 hover:underline text-[11px] cursor-pointer"
                      >
                        Set as Default
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 text-[11px] ml-auto cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB CONTENT: WISHLIST */}
        {activeTab === 'wishlist' && (
          <div className="space-y-4">
            {wishlistedProducts.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <Heart className="w-12 h-12 text-slate-400 dark:text-zinc-500 mx-auto stroke-1" />
                <h4 className="font-serif text-lg text-slate-900 dark:text-white">Your Wishlist is Empty</h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Click the heart icon on any product to save it for your next routine replenishment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {wishlistedProducts.map((prod) => (
                  <div key={prod.id} className="p-3 rounded-2xl bg-stone-50/70 dark:bg-zinc-950/60 border border-stone-200 dark:border-zinc-800 space-y-2">
                    <img
                      src={prod.image}
                      alt={prod.title}
                      className="w-full aspect-square object-contain rounded-xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 p-2 shadow-2xs"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="font-serif text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {prod.title}
                      </div>
                      <div className="font-display font-bold text-xs text-pink-600 dark:text-pink-400 mt-0.5">
                        {formatINR(prod.price)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        onClick={() => onAddToCart(prod)}
                        className="flex-1 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer shadow-xs transition-colors"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        <span>Move to Bag</span>
                      </button>
                      <button
                        onClick={() => onRemoveWishlist(prod.id)}
                        className="p-1.5 rounded-xl bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-slate-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 border border-stone-200 dark:border-zinc-700 cursor-pointer transition-colors"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: PROFILE & PREFERENCES */}
        {activeTab === 'profile' && (
          <div className="p-5 rounded-2xl bg-stone-50/70 dark:bg-zinc-950/60 border border-stone-200 dark:border-zinc-800 space-y-4 max-w-lg">
            <div className="font-serif text-base font-semibold text-slate-900 dark:text-white">
              Personal Account & Privacy
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 dark:text-zinc-300 font-semibold block mb-1">Registered Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => onUpdateProfile({ ...profile, name: e.target.value })}
                  placeholder="Your Name"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 text-slate-900 dark:text-white outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="text-slate-600 dark:text-zinc-300 font-semibold block mb-1">Email for Invoices & Tracking</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => onUpdateProfile({ ...profile, email: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 text-slate-900 dark:text-white outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="text-slate-600 dark:text-zinc-300 font-semibold block mb-1">Mobile Number (For Courier OTP & Delivery Updates)</label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => onUpdateProfile({ ...profile, phone: e.target.value })}
                  placeholder="9876543210"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 text-slate-900 dark:text-white outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 dark:border-zinc-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[11px] text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Protected by SSL encryption. PCI-DSS Level 1 compliant.</span>
                </div>
                {onSignOut && (
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-1.5 border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer shrink-0"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
