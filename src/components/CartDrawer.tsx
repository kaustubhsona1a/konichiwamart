import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Truck, 
  ShieldCheck, 
  ArrowRight, 
  Tag, 
  Check,
  MapPin,
  Sparkles
} from 'lucide-react';
import { CartItem } from '../types';
import { PROMO_CODES } from '../data/products';
import { formatINR } from '../data/pincodes';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number, shadeId?: string) => void;
  onRemoveItem: (productId: string, shadeId?: string) => void;
  onProceedToCheckout: (appliedPromo?: string, discountAmount?: number) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout
}) => {
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState('');

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const freeShippingThreshold = 1500;
  const progressToFree = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const amountNeededForFree = Math.max(0, freeShippingThreshold - subtotal);
  const shippingFee = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 99;

  // Promo Calculation
  let discountAmount = 0;
  if (appliedPromo && PROMO_CODES[appliedPromo]) {
    const promo = PROMO_CODES[appliedPromo];
    if (subtotal >= promo.minAmount) {
      discountAmount = Math.round((subtotal * promo.discountPercent) / 100);
    }
  }

  const taxableSubtotal = subtotal - discountAmount;
  const cgst = Math.round((taxableSubtotal * 0.09));
  const sgst = Math.round((taxableSubtotal * 0.09));
  const finalTotal = Math.max(0, taxableSubtotal + shippingFee);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoInput.trim().toUpperCase();
    if (PROMO_CODES[code]) {
      if (subtotal >= PROMO_CODES[code].minAmount) {
        setAppliedPromo(code);
        setPromoError('');
        setPromoInput('');
      } else {
        setPromoError(`Minimum order amount of ${formatINR(PROMO_CODES[code].minAmount)} required for ${code}.`);
      }
    } else {
      setPromoError('No active discount codes are available at this time.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dimmed backdrop */}
      <div 
        className="absolute inset-0 bg-pink-950/35 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col justify-between text-left">
          
          {/* Drawer Header */}
          <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-pink-100 dark:bg-pink-950/80 text-pink-700 dark:text-pink-300 flex items-center justify-center border border-pink-200 dark:border-pink-800/60 shadow-xs">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Your Cart
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {items.reduce((sum, i) => sum + i.quantity, 0)} items selected
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Free Delivery Milestone Progress */}
          <div className="px-4 py-2.5 bg-pink-50/70 dark:bg-pink-950/20 border-b border-pink-100 dark:border-pink-950/40 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5 font-medium">
                <Truck className="w-3.5 h-3.5 text-pink-500" />
                {amountNeededForFree === 0 ? (
                  <strong className="text-emerald-700 dark:text-emerald-400">Unlocked: Free Delivery!</strong>
                ) : (
                  <span>Add <strong>{formatINR(amountNeededForFree)}</strong> more for Free Delivery</span>
                )}
              </span>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{Math.round(progressToFree)}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div 
                className="h-full rounded-full bg-pink-600 transition-all duration-300 shadow-xs"
                style={{ width: `${progressToFree}%` }}
              />
            </div>
          </div>

          {/* Scrollable Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mx-auto flex items-center justify-center text-slate-400">
                  <ShoppingBag className="w-8 h-8 stroke-1" />
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Your cart is empty</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  Add items from our curated Japanese skincare routine to get started.
                </p>
              </div>
            ) : (
              items.map((item) => {
                const shadeId = item.selectedShade?.id;
                return (
                  <div
                    key={`${item.product.id}-${shadeId || 'def'}`}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-[#111524] border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-xs"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.title}
                      className="w-14 h-14 object-contain rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 flex-shrink-0"
                      referrerPolicy="no-referrer"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {item.product.title}
                      </h4>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {item.product.volume} • {item.product.category}
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        {/* Quantity controller */}
                        <div className="flex items-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1 py-0.5 shadow-xs">
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, -1, shadeId)}
                            className="w-5 h-5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-slate-900 dark:text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, 1, shadeId)}
                            className="w-5 h-5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="font-bold text-sm text-pink-700 dark:text-pink-400">
                          {formatINR(item.product.price * item.quantity)}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.product.id, shadeId)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 transition-colors cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}

            {/* Delivery Estimation */}
            {items.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 flex items-center gap-2.5 text-xs text-slate-700 dark:text-zinc-300">
                <Truck className="w-4 h-4 text-pink-600 dark:text-pink-400 shrink-0" />
                <span className="font-medium text-slate-800 dark:text-zinc-200">3-5 day pan India delivery</span>
              </div>
            )}

            {/* Coupon Code Section */}
            {items.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111524] border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-pink-500" />
                    <span>Discount Coupon</span>
                  </span>
                  {appliedPromo && (
                    <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md font-semibold">
                      Applied: {appliedPromo}
                    </span>
                  )}
                </div>

                <form onSubmit={handleApplyPromo} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 uppercase font-medium tracking-wide outline-none focus:border-pink-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                  >
                    Apply
                  </button>
                </form>

                {promoError && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400">{promoError}</p>
                )}
              </div>
            )}

          </div>

          {/* Drawer Footer & Checkout Action */}
          {items.length > 0 && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111524] space-y-2.5">
              
              {/* Itemized Price Summary */}
              <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-slate-900 dark:text-white font-medium">{formatINR(subtotal)}</span>
                </div>
                
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-medium">
                    <span>Discount Savings ({appliedPromo})</span>
                    <span>-{formatINR(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>GST (18% Included)</span>
                  <span>{formatINR(cgst + sgst)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <span>Shipping</span>
                    <span className="block text-[10px] text-slate-500 dark:text-zinc-400">Pan-India shipping within 3-5 days after ordering</span>
                  </div>
                  <span>{shippingFee === 0 ? <strong className="text-emerald-700 dark:text-emerald-400">FREE</strong> : formatINR(shippingFee)}</span>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline text-sm font-semibold text-slate-900 dark:text-white">
                  <span className="font-bold">Total (INR)</span>
                  <span className="text-lg font-bold text-pink-700 dark:text-pink-400">
                    {formatINR(finalTotal)}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => {
                  onProceedToCheckout(appliedPromo || undefined, discountAmount);
                }}
                className="w-full py-3 px-5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-pink-600/25 transition-all cursor-pointer active:scale-98"
              >
                <span>Proceed to Secure Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                <span>100% Authentic Japanese Formulations</span>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
