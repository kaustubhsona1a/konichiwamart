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
  ShieldCheck
} from 'lucide-react';
import { UserProfile, UserAddress, Order, Product } from '../types';
import { PRODUCTS } from '../data/products';
import { formatINR, lookupPincode } from '../data/pincodes';

interface AccountPortalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onViewInvoice: (order: Order) => void;
  onAddToCart: (product: Product) => void;
  onRemoveWishlist: (productId: string) => void;
}

export const AccountPortal: React.FC<AccountPortalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  onViewInvoice,
  onAddToCart,
  onRemoveWishlist
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'wishlist' | 'profile'>('orders');
  
  // New address form state
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [fullName, setFullName] = useState(profile.name || 'Priya Sharma');
  const [phone, setPhone] = useState(profile.phone || '+91 98201 45892');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [pincode, setPincode] = useState('400050');
  const [tag, setTag] = useState<'Home' | 'Office'>('Home');

  if (!isOpen) return null;

  const wishlistedProducts = PRODUCTS.filter(p => profile.wishlistIds.includes(p.id));

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    const pinInfo = lookupPincode(pincode);
    const newAddr: UserAddress = {
      id: `addr_${Date.now()}`,
      fullName,
      phone,
      addressLine1: line1,
      addressLine2: line2,
      city: pinInfo.city || 'Mumbai',
      state: pinInfo.state || 'Maharashtra',
      pincode,
      tag,
      isDefault: profile.addresses.length === 0
    };

    onUpdateProfile({
      ...profile,
      addresses: [...profile.addresses, newAddr]
    });
    setIsAddingAddress(false);
    setLine1('');
    setLine2('');
  };

  const handleDeleteAddress = (id: string) => {
    onUpdateProfile({
      ...profile,
      addresses: profile.addresses.filter(a => a.id !== id)
    });
  };

  const handleSetDefaultAddress = (id: string) => {
    onUpdateProfile({
      ...profile,
      addresses: profile.addresses.map(a => ({
        ...a,
        isDefault: a.id === id
      }))
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#25151E]/40 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      
      {/* Account Modal Container */}
      <div 
        className="relative w-full max-w-4xl liquid-glass rounded-3xl md:rounded-[2.5rem] border border-white/90 shadow-2xl p-6 md:p-8 text-left max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full liquid-glass hover:bg-white flex items-center justify-center text-[#552739] shadow-sm transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* User Identity Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/80">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#F4B6C8] to-[#FCEAE5] p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full rounded-2xl bg-white/90 flex items-center justify-center text-[#972E56] font-display text-2xl font-bold">
                {profile.name.charAt(0)}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#291720]">
                  {profile.name}
                </h2>
                <span className="text-[10px] bg-[#E8F8F0] text-[#1E7E56] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified Connoisseur</span>
                </span>
              </div>
              <p className="text-xs text-[#7F5667]">
                {profile.email} • {profile.phone}
              </p>
            </div>
          </div>

          <div className="text-xs text-[#7D5667] bg-white/60 px-3.5 py-1.5 rounded-xl border border-white/80 self-start sm:self-auto">
            Total Orders: <strong>{profile.orders.length}</strong>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/80 gap-6 pt-4 mb-6 text-xs font-serif overflow-x-auto">
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
                    ? 'text-[#8C294D] border-b-2 border-[#C94774] font-semibold text-sm'
                    : 'text-[#876573] hover:text-[#42222E]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="text-[10px] bg-white/80 px-1.5 py-0.2 rounded-full font-mono">
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
            {profile.orders.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <Package className="w-12 h-12 text-[#9E6F81] mx-auto stroke-1" />
                <h4 className="font-serif text-lg text-[#321722]">No Past Orders Found</h4>
                <p className="text-xs text-[#785967]">When you place an order, your official GST Tax Invoice and Shiprocket AWB live tracking will appear here.</p>
              </div>
            ) : (
              profile.orders.map((order) => (
                <div key={order.id} className="p-5 rounded-2xl liquid-glass border border-white/80 shadow-sm space-y-4">
                  
                  {/* Order Top Bar */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-white/70">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-base font-bold text-[#2A1620]">
                          Order #{order.orderNumber}
                        </span>
                        <span className="text-[11px] bg-[#EAF8F0] text-[#1E7E56] px-2.5 py-0.5 rounded-full font-semibold">
                          {order.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#7A5666]">
                        Placed on {order.date} • Paid via {order.paymentMethod}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onViewInvoice(order)}
                        className="px-3.5 py-1.5 rounded-xl liquid-glass-rose hover:bg-white text-[#782845] text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>GST Tax Invoice</span>
                      </button>
                    </div>
                  </div>

                  {/* Shiprocket Live Tracking Status Timeline */}
                  <div className="p-3.5 rounded-xl liquid-glass-beige border border-white/80 space-y-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between text-[#683C25] gap-2">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Truck className="w-4 h-4 text-[#A55627]" />
                        <span>Courier: <strong>{order.courierPartner}</strong></span>
                      </div>
                      <div className="font-mono text-[11px]">
                        AWB: <strong className="text-[#0969DA]">{order.awbNumber}</strong>
                      </div>
                      <div>
                        Est. Delivery: <strong>{order.estimatedDeliveryDate}</strong>
                      </div>
                    </div>

                    {/* Milestone progress dots */}
                    <div className="grid grid-cols-4 gap-2 pt-2 text-[10px] text-center font-medium">
                      {[
                        { label: 'Order Confirmed', done: true },
                        { label: 'Packed & Dispatched', done: true },
                        { label: 'In Transit', done: order.status !== 'CONFIRMED' },
                        { label: 'Delivered', done: order.status === 'DELIVERED' }
                      ].map((st, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className={`h-1.5 rounded-full ${st.done ? 'bg-[#1E7E56]' : 'bg-[#EAD0DC]'}`} />
                          <span className={st.done ? 'text-[#1E7E56]' : 'text-[#9A7080]'}>{st.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ordered Items List */}
                  <div className="divide-y divide-white/60">
                    {order.items.map((item, i) => (
                      <div key={i} className="py-2 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-10 h-10 object-cover rounded-lg border border-white"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="font-serif font-semibold text-[#291720]">{item.title}</div>
                            <div className="text-[10px] text-[#7A5666]">
                              Qty: {item.quantity} • {item.volume} {item.shade && `• Shade: ${item.shade}`}
                            </div>
                          </div>
                        </div>
                        <div className="font-display font-bold text-[#351B25]">
                          {formatINR(item.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Total */}
                  <div className="pt-2 flex justify-between items-center text-xs font-semibold text-[#2A1620]">
                    <span>Total Paid (Including 18% GST)</span>
                    <span className="font-display text-base text-[#8C274E] font-bold">
                      {formatINR(order.totalAmount)}
                    </span>
                  </div>

                </div>
              ))
            )}
          </div>
        )}

        {/* TAB CONTENT: SAVED ADDRESSES */}
        {activeTab === 'addresses' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#7A5666]">
                Manage shipping destinations for fast, 1-click Razorpay checkout.
              </span>
              <button
                onClick={() => setIsAddingAddress(!isAddingAddress)}
                className="px-3.5 py-1.5 rounded-xl bg-[#A53460] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingAddress ? 'Cancel' : 'Add New Address'}</span>
              </button>
            </div>

            {/* Address Form */}
            {isAddingAddress && (
              <form onSubmit={handleSaveAddress} className="p-4 rounded-2xl liquid-glass-beige border border-white/90 space-y-3 animate-in fade-in">
                <div className="font-serif text-sm font-semibold text-[#4A2616]">
                  Add Delivery Address (India)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#69422E]">Full Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white text-xs border border-[#E8CEBD] outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#69422E]">Mobile Number</label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white text-xs border border-[#E8CEBD] outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-[#69422E]">Flat, House No., Building, Street</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flat 402, Lotus Towers, 14th Road"
                    value={line1}
                    onChange={(e) => setLine1(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white text-xs border border-[#E8CEBD] outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#69422E]">6-digit Pincode</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2 rounded-xl bg-white text-xs font-mono border border-[#E8CEBD] outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#69422E]">City</label>
                    <input
                      type="text"
                      readOnly
                      value={lookupPincode(pincode).city || 'Mumbai'}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 text-xs border border-[#E8CEBD] outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#69422E]">Address Tag</label>
                    <select
                      value={tag}
                      onChange={(e) => setTag(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-white text-xs border border-[#E8CEBD] outline-none"
                    >
                      <option value="Home">Home</option>
                      <option value="Office">Office</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#6E3C1B] text-white text-xs font-semibold cursor-pointer shadow-md"
                >
                  Save Delivery Address
                </button>
              </form>
            )}

            {/* Address Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profile.addresses.map((addr) => (
                <div key={addr.id} className="p-4 rounded-2xl liquid-glass border border-white/80 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-[#F2DCE5] text-[#782845] text-[10px] font-bold uppercase">
                      {addr.tag}
                    </span>
                    {addr.isDefault && (
                      <span className="text-[10px] text-[#1E7E56] font-semibold">
                        ✓ Default
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold text-xs text-[#2B1720]">{addr.fullName}</h4>
                    <p className="text-[11px] text-[#694B5A] leading-relaxed mt-0.5">
                      {addr.addressLine1}, {addr.city}, {addr.state} — <strong>{addr.pincode}</strong><br />
                      Phone: {addr.phone}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/70 flex items-center justify-between text-xs">
                    {!addr.isDefault && (
                      <button
                        onClick={() => handleSetDefaultAddress(addr.id)}
                        className="text-[#8C274E] hover:underline text-[11px]"
                      >
                        Set as Default
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="text-[#A24867] hover:text-[#C51B4B] text-[11px] ml-auto"
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
                <Heart className="w-12 h-12 text-[#9E6F81] mx-auto stroke-1" />
                <h4 className="font-serif text-lg text-[#321722]">Your Wishlist is Empty</h4>
                <p className="text-xs text-[#785967]">Click the heart icon on any product to save it for your next routine replenishment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {wishlistedProducts.map((prod) => (
                  <div key={prod.id} className="p-3 rounded-2xl liquid-glass border border-white/80 space-y-2">
                    <img
                      src={prod.image}
                      alt={prod.title}
                      className="w-full aspect-square object-cover rounded-xl border border-white shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="font-serif text-xs font-semibold text-[#291720] truncate">
                        {prod.title}
                      </div>
                      <div className="font-display font-bold text-xs text-[#8C274E]">
                        {formatINR(prod.price)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        onClick={() => onAddToCart(prod)}
                        className="flex-1 py-1.5 rounded-xl bg-[#A53460] text-white text-[11px] font-semibold flex items-center justify-center gap-1"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        <span>Move to Bag</span>
                      </button>
                      <button
                        onClick={() => onRemoveWishlist(prod.id)}
                        className="p-1.5 rounded-xl liquid-glass text-[#9A6275]"
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
          <div className="p-5 rounded-2xl liquid-glass border border-white/80 space-y-4 max-w-lg">
            <div className="font-serif text-base font-semibold text-[#2C1821]">
              Personal Account & Privacy
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#6D4958] block mb-1">Registered Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => onUpdateProfile({ ...profile, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#EAC4D3] text-[#29161F]"
                />
              </div>

              <div>
                <label className="text-[#6D4958] block mb-1">Email for Invoices & Tracking</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => onUpdateProfile({ ...profile, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#EAC4D3] text-[#29161F]"
                />
              </div>

              <div>
                <label className="text-[#6D4958] block mb-1">Mobile Number (For Courier OTP & WhatsApp Updates)</label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => onUpdateProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#EAC4D3] text-[#29161F]"
                />
              </div>

              <div className="pt-3 border-t border-white/80 flex items-center gap-2 text-[11px] text-[#1E7E56]">
                <ShieldCheck className="w-4 h-4 text-[#1B8055]" />
                <span>Protected by 256-bit AES encryption. PCI-DSS Level 1 compliant.</span>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
