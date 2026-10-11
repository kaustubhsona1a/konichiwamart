import { Product, CartItem, Order } from '../types';

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

export const GA_MEASUREMENT_ID = 'G-NHQG4M6DKH';

/**
 * Safe helper to trigger gtag calls
 */
export function sendGAEvent(eventName: string, eventParams: Record<string, any> = {}) {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', eventName, eventParams);
    }
  } catch (err) {
    console.debug('GA4 Event dispatch error:', err);
  }
}

/**
 * Configure identified customer in Google Analytics 4
 */
export function setGAUser(userId: string | null, userProperties: Record<string, any> = {}) {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      if (userId) {
        window.gtag('set', 'user_properties', {
          user_id: userId,
          customer_type: 'registered',
          ...userProperties,
        });
        window.gtag('config', GA_MEASUREMENT_ID, {
          user_id: userId,
        });
      } else {
        window.gtag('set', 'user_properties', {
          customer_type: 'guest',
        });
      }
    }
  } catch (err) {
    console.debug('GA4 set user error:', err);
  }
}

/**
 * Track SPA Virtual Page Views with full URL, path and title
 */
export function trackPageView(pageTitle?: string, pagePath?: string) {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      const path = pagePath || window.location.pathname + window.location.search;
      const title = pageTitle || document.title;
      const location = window.location.origin + path;

      // 1. Update config for page location
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_title: title,
        page_path: path,
        page_location: location,
      });

      // 2. Dispatch page_view event for GA4 SPA report pipelines
      window.gtag('event', 'page_view', {
        page_title: title,
        page_path: path,
        page_location: location,
      });
    }
  } catch (_) {}
}

/**
 * Helper to map a Product to a GA4 standard item object
 */
export function mapProductToGA4Item(product: Product, index?: number, quantity = 1, shadeName?: string) {
  const item: Record<string, any> = {
    item_id: product.id,
    item_name: product.title,
    item_brand: product.brand || 'Konichiwa Mart',
    item_category: product.category || 'Skincare',
    price: product.price,
    quantity,
  };
  if (shadeName) item.item_variant = shadeName;
  if (typeof index === 'number') item.index = index;
  return item;
}

/**
 * Track GA4 view_item_list (Products shown in a list / collection / search)
 */
export function trackViewItemList(products: Product[], listName = 'Storefront Catalog', listId?: string) {
  if (!products || products.length === 0) return;
  const items = products.slice(0, 20).map((p, idx) => mapProductToGA4Item(p, idx));

  sendGAEvent('view_item_list', {
    item_list_name: listName,
    item_list_id: listId || listName.toLowerCase().replace(/\s+/g, '_'),
    items,
  });
}

/**
 * Track GA4 select_item (User clicked on product card from a list)
 */
export function trackSelectItem(product: Product, listName = 'Storefront Catalog', index?: number) {
  sendGAEvent('select_item', {
    item_list_name: listName,
    items: [mapProductToGA4Item(product, index)],
  });
}

/**
 * Track GA4 view_item (Product details modal or individual product page view)
 */
export function trackViewItem(product: Product) {
  sendGAEvent('view_item', {
    currency: 'INR',
    value: product.price,
    items: [mapProductToGA4Item(product)],
  });
}

/**
 * Track GA4 add_to_cart
 */
export function trackAddToCart(product: Product, quantity = 1, shadeName?: string) {
  sendGAEvent('add_to_cart', {
    currency: 'INR',
    value: product.price * quantity,
    items: [mapProductToGA4Item(product, undefined, quantity, shadeName)],
  });
}

/**
 * Track GA4 remove_from_cart
 */
export function trackRemoveFromCart(product: Product, quantity = 1, shadeName?: string) {
  sendGAEvent('remove_from_cart', {
    currency: 'INR',
    value: product.price * quantity,
    items: [mapProductToGA4Item(product, undefined, quantity, shadeName)],
  });
}

/**
 * Track GA4 view_cart (Cart drawer or modal opened)
 */
export function trackViewCart(items: CartItem[], totalAmount: number) {
  sendGAEvent('view_cart', {
    currency: 'INR',
    value: totalAmount,
    items: items.map((i, idx) => mapProductToGA4Item(i.product, idx, i.quantity, i.selectedShade?.name)),
  });
}

/**
 * Track GA4 begin_checkout
 */
export function trackBeginCheckout(items: CartItem[], totalAmount: number, coupon?: string) {
  const payload: Record<string, any> = {
    currency: 'INR',
    value: totalAmount,
    items: items.map((i, idx) => mapProductToGA4Item(i.product, idx, i.quantity, i.selectedShade?.name)),
  };
  if (coupon) payload.coupon = coupon;

  sendGAEvent('begin_checkout', payload);
}

/**
 * Track GA4 add_shipping_info
 */
export function trackAddShippingInfo(items: CartItem[], totalAmount: number, shippingTier = 'All-India Express', coupon?: string) {
  const payload: Record<string, any> = {
    currency: 'INR',
    value: totalAmount,
    shipping_tier: shippingTier,
    items: items.map((i, idx) => mapProductToGA4Item(i.product, idx, i.quantity, i.selectedShade?.name)),
  };
  if (coupon) payload.coupon = coupon;

  sendGAEvent('add_shipping_info', payload);
}

/**
 * Track GA4 add_payment_info
 */
export function trackAddPaymentInfo(items: CartItem[], totalAmount: number, paymentType = 'Razorpay_Online', coupon?: string) {
  const payload: Record<string, any> = {
    currency: 'INR',
    value: totalAmount,
    payment_type: paymentType,
    items: items.map((i, idx) => mapProductToGA4Item(i.product, idx, i.quantity, i.selectedShade?.name)),
  };
  if (coupon) payload.coupon = coupon;

  sendGAEvent('add_payment_info', payload);
}

/**
 * Track GA4 purchase (Completed transaction)
 */
export function trackPurchase(order: Order) {
  sendGAEvent('purchase', {
    transaction_id: order.orderNumber || order.id,
    value: order.totalAmount,
    tax: (order.cgst || 0) + (order.sgst || 0),
    shipping: order.shippingFee || 0,
    currency: 'INR',
    coupon: order.discountCode || undefined,
    items: order.items.map((i, idx) => ({
      item_id: i.productId,
      item_name: i.title,
      price: i.price,
      quantity: i.quantity,
      item_variant: i.shade || undefined,
      index: idx,
    })),
  });
}

/**
 * Track GA4 add_to_wishlist
 */
export function trackAddToWishlist(product: Product) {
  sendGAEvent('add_to_wishlist', {
    currency: 'INR',
    value: product.price,
    items: [mapProductToGA4Item(product)],
  });
}

/**
 * Track GA4 search
 */
export function trackSearch(searchTerm: string) {
  if (!searchTerm || !searchTerm.trim()) return;
  sendGAEvent('search', {
    search_term: searchTerm.trim(),
  });
}

/**
 * Track GA4 customer login
 */
export function trackLogin(method = 'email_password') {
  sendGAEvent('login', {
    method,
  });
}

/**
 * Track GA4 customer sign_up
 */
export function trackSignUp(method = 'email_password') {
  sendGAEvent('sign_up', {
    method,
  });
}

/**
 * Track GA4 contact / lead submission
 */
export function trackContactFormSubmission(topic = 'general_inquiry') {
  sendGAEvent('generate_lead', {
    lead_type: 'contact_form',
    inquiry_topic: topic,
  });
}

/**
 * Track GA4 product review submission
 */
export function trackReviewSubmission(productId: string, rating: number) {
  sendGAEvent('submit_review', {
    item_id: productId,
    rating,
  });
}

/**
 * Track GA4 select_content (e.g., Guide clicked, Brand viewed, Reel opened)
 */
export function trackSelectContent(contentType: string, itemId: string, itemName?: string) {
  sendGAEvent('select_content', {
    content_type: contentType,
    item_id: itemId,
    item_name: itemName,
  });
}
