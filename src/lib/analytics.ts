import { Product, CartItem, Order } from '../types';
import { getProductCanonicalSlug, slugify } from './seo';

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}

export const GA_MEASUREMENT_ID = 'G-NHQG4M6DKH';
export const META_PIXEL_ID = '3680396085441217';

// Track whether the very first PageView (already fired by inline index.html snippet) has been recorded
let initialMetaPageViewHandled = false;

/**
 * Resolves the canonical catalog ID for a product (matches <g:id> in /google-merchant-feed.xml)
 */
function getMetaCatalogProductId(product: { id: string; slug?: string; title?: string }): string {
  return getProductCanonicalSlug(product) || product.id;
}

/**
 * Safe helper to trigger GA4 gtag calls
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
 * Safe helper to trigger Standard Meta Pixel events: fbq('track', eventName, params, options)
 */
export function sendMetaPixelEvent(
  eventName: string,
  eventParams: Record<string, any> = {},
  options?: { eventID?: string }
) {
  try {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      if (options && options.eventID) {
        window.fbq('track', eventName, eventParams, options);
      } else {
        window.fbq('track', eventName, eventParams);
      }
    }
  } catch (err) {
    console.debug('Meta Pixel Event dispatch error:', err);
  }
}

/**
 * Safe helper to trigger Custom Meta Pixel events: fbq('trackCustom', eventName, params)
 */
export function sendMetaPixelCustomEvent(eventName: string, eventParams: Record<string, any> = {}) {
  try {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('trackCustom', eventName, eventParams);
    }
  } catch (err) {
    console.debug('Meta Pixel Custom Event dispatch error:', err);
  }
}

/**
 * Configure identified customer in Google Analytics 4 & Meta Pixel Advanced Matching
 */
export function setGAUser(
  userId: string | null,
  userProperties: { email?: string; phone?: string; name?: string; [key: string]: any } = {}
) {
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

    // Re-init Meta Pixel with Advanced Matching parameters when customer identity is known
    if (typeof window !== 'undefined' && typeof window.fbq === 'function' && userId) {
      const advancedMatch: Record<string, string> = { external_id: userId };
      if (userProperties.email) {
        advancedMatch.em = userProperties.email.trim().toLowerCase();
      }
      if (userProperties.phone) {
        const digits = userProperties.phone.replace(/\D/g, '');
        if (digits) advancedMatch.ph = digits.startsWith('91') ? digits : `91${digits}`;
      }
      if (userProperties.name) {
        const parts = userProperties.name.trim().toLowerCase().split(/\s+/);
        if (parts[0]) advancedMatch.fn = parts[0];
        if (parts.length > 1) advancedMatch.ln = parts.slice(1).join(' ');
      }
      window.fbq('init', META_PIXEL_ID, advancedMatch);
    }
  } catch (err) {
    console.debug('Analytics set user error:', err);
  }
}

/**
 * Track SPA Virtual Page Views with full URL, path and title across GA4 & Meta Pixel
 */
export function trackPageView(pageTitle?: string, pagePath?: string) {
  try {
    if (typeof window === 'undefined') return;
    const path = pagePath || window.location.pathname + window.location.search;
    const title = pageTitle || document.title;
    const location = window.location.origin + path;

    if (typeof window.gtag === 'function') {
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_title: title,
        page_path: path,
        page_location: location,
      });

      window.gtag('event', 'page_view', {
        page_title: title,
        page_path: path,
        page_location: location,
      });
    }

    // Meta Pixel PageView: skip duplicate firing on initial mount since index.html already fires the initial PageView
    if (!initialMetaPageViewHandled) {
      initialMetaPageViewHandled = true;
    } else {
      sendMetaPixelEvent('PageView');
    }

    // Detailed SPA Route / Section Metric for Meta Ads Custom Conversions
    sendMetaPixelCustomEvent('WebsitePageOpen', {
      page_title: title,
      page_path: path,
      page_url: location,
      route_type: path.startsWith('/products/')
        ? 'product_detail'
        : path.startsWith('/collections/')
          ? 'category_collection'
          : path.startsWith('/brands/')
            ? 'brand_page'
            : path.startsWith('/guides/')
              ? 'skincare_guide'
              : path === '/about'
                ? 'about_us'
                : path === '/return-policy'
                  ? 'return_policy'
                  : 'storefront_home',
    });
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
 * Track GA4 view_item_list & Meta Pixel ViewCategory / Catalog Impression
 */
export function trackViewItemList(products: Product[], listName = 'Storefront Catalog', listId?: string) {
  if (!products || products.length === 0) return;
  const topProducts = products.slice(0, 20);
  const items = topProducts.map((p, idx) => mapProductToGA4Item(p, idx));

  sendGAEvent('view_item_list', {
    item_list_name: listName,
    item_list_id: listId || listName.toLowerCase().replace(/\s+/g, '_'),
    items,
  });

  sendMetaPixelCustomEvent('ViewCategory', {
    content_category: listName,
    content_list_id: listId || listName.toLowerCase().replace(/\s+/g, '_'),
    content_ids: topProducts.slice(0, 10).map(p => getMetaCatalogProductId(p)),
    content_type: 'product_group',
    num_items: products.length,
    currency: 'INR',
  });
}

/**
 * Track GA4 select_item & Meta Pixel ProductCardClick
 */
export function trackSelectItem(product: Product, listName = 'Storefront Catalog', index?: number) {
  sendGAEvent('select_item', {
    item_list_name: listName,
    items: [mapProductToGA4Item(product, index)],
  });

  const catalogId = getMetaCatalogProductId(product);
  sendMetaPixelCustomEvent('ProductClick', {
    content_name: product.title,
    content_category: product.category || 'Skincare',
    content_ids: [catalogId],
    content_type: 'product',
    brand: product.brand || 'Konichiwa Mart',
    value: product.price,
    currency: 'INR',
    list_name: listName,
  });
}

/**
 * Track GA4 view_item & Meta Pixel Standard ViewContent (Product details modal or /products/:slug page)
 */
export function trackViewItem(product: Product) {
  sendGAEvent('view_item', {
    currency: 'INR',
    value: product.price,
    items: [mapProductToGA4Item(product)],
  });

  const catalogId = getMetaCatalogProductId(product);
  sendMetaPixelEvent('ViewContent', {
    content_name: product.title,
    content_category: product.category || 'Japanese Skincare',
    content_ids: [catalogId],
    content_type: 'product',
    contents: [
      {
        id: catalogId,
        quantity: 1,
        item_price: product.price,
      },
    ],
    brand: product.brand || 'Konichiwa Mart',
    value: product.price,
    currency: 'INR',
  });
}

/**
 * Track GA4 add_to_cart & Meta Pixel Standard AddToCart
 */
export function trackAddToCart(product: Product, quantity = 1, shadeName?: string) {
  const lineValue = product.price * quantity;

  sendGAEvent('add_to_cart', {
    currency: 'INR',
    value: lineValue,
    items: [mapProductToGA4Item(product, undefined, quantity, shadeName)],
  });

  const catalogId = getMetaCatalogProductId(product);
  sendMetaPixelEvent('AddToCart', {
    content_name: product.title,
    content_category: product.category || 'Japanese Skincare',
    content_ids: [catalogId],
    content_type: 'product',
    contents: [
      {
        id: catalogId,
        quantity,
        item_price: product.price,
      },
    ],
    brand: product.brand || 'Konichiwa Mart',
    variant: shadeName || undefined,
    value: lineValue,
    num_items: quantity,
    currency: 'INR',
  });
}

/**
 * Track GA4 remove_from_cart & Meta Pixel Custom RemoveFromCart
 */
export function trackRemoveFromCart(product: Product, quantity = 1, shadeName?: string) {
  const lineValue = product.price * quantity;

  sendGAEvent('remove_from_cart', {
    currency: 'INR',
    value: lineValue,
    items: [mapProductToGA4Item(product, undefined, quantity, shadeName)],
  });

  const catalogId = getMetaCatalogProductId(product);
  sendMetaPixelCustomEvent('RemoveFromCart', {
    content_name: product.title,
    content_category: product.category || 'Japanese Skincare',
    content_ids: [catalogId],
    content_type: 'product',
    contents: [
      {
        id: catalogId,
        quantity,
        item_price: product.price,
      },
    ],
    value: lineValue,
    num_items: quantity,
    currency: 'INR',
  });
}

/**
 * Track real-time Cart Count & Cart Value metrics in Meta Pixel whenever cart items change
 */
export function trackCartStateMetrics(items: CartItem[], action: 'add' | 'increment' | 'decrement' | 'remove' | 'clear') {
  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotalValue = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const shippingFee = subtotalValue >= 1500 || subtotalValue === 0 ? 0 : 150;

  sendMetaPixelCustomEvent('CartUpdated', {
    cart_action: action,
    cart_count: totalCount,
    num_items: totalCount,
    cart_subtotal: subtotalValue,
    shipping_fee: shippingFee,
    cart_total_value: subtotalValue + shippingFee,
    qualifies_for_free_shipping: subtotalValue >= 1500,
    currency: 'INR',
    content_ids: items.map(i => getMetaCatalogProductId(i.product)),
    contents: items.map(i => ({
      id: getMetaCatalogProductId(i.product),
      quantity: i.quantity,
      item_price: i.product.price,
    })),
  });
}

/**
 * Track GA4 view_cart & Meta Pixel Custom ViewCart (Cart drawer opened)
 */
export function trackViewCart(items: CartItem[], totalAmount: number) {
  sendGAEvent('view_cart', {
    currency: 'INR',
    value: totalAmount,
    items: items.map((i, idx) => mapProductToGA4Item(i.product, idx, i.quantity, i.selectedShade?.name)),
  });

  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);
  sendMetaPixelCustomEvent('ViewCart', {
    content_ids: items.map(i => getMetaCatalogProductId(i.product)),
    contents: items.map(i => ({
      id: getMetaCatalogProductId(i.product),
      quantity: i.quantity,
      item_price: i.product.price,
    })),
    content_type: 'product',
    cart_count: totalCount,
    num_items: totalCount,
    value: totalAmount,
    currency: 'INR',
  });
}

/**
 * Track GA4 begin_checkout & Meta Pixel Standard InitiateCheckout
 */
export function trackBeginCheckout(items: CartItem[], totalAmount: number, coupon?: string) {
  const payload: Record<string, any> = {
    currency: 'INR',
    value: totalAmount,
    items: items.map((i, idx) => mapProductToGA4Item(i.product, idx, i.quantity, i.selectedShade?.name)),
  };
  if (coupon) payload.coupon = coupon;

  sendGAEvent('begin_checkout', payload);

  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);
  sendMetaPixelEvent('InitiateCheckout', {
    content_ids: items.map(i => getMetaCatalogProductId(i.product)),
    contents: items.map(i => ({
      id: getMetaCatalogProductId(i.product),
      quantity: i.quantity,
      item_price: i.product.price,
    })),
    content_type: 'product',
    content_category: 'Japanese Skincare Checkout',
    num_items: totalCount,
    cart_count: totalCount,
    value: totalAmount,
    currency: 'INR',
    coupon: coupon || undefined,
  });
}

/**
 * Track GA4 add_shipping_info & Meta Pixel Custom AddShippingInfo
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

  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);
  sendMetaPixelCustomEvent('AddShippingInfo', {
    content_ids: items.map(i => getMetaCatalogProductId(i.product)),
    contents: items.map(i => ({
      id: getMetaCatalogProductId(i.product),
      quantity: i.quantity,
      item_price: i.product.price,
    })),
    content_type: 'product',
    shipping_tier: shippingTier,
    num_items: totalCount,
    value: totalAmount,
    currency: 'INR',
    coupon: coupon || undefined,
  });
}

/**
 * Track GA4 add_payment_info & Meta Pixel Standard AddPaymentInfo
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

  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);
  sendMetaPixelEvent('AddPaymentInfo', {
    content_ids: items.map(i => getMetaCatalogProductId(i.product)),
    contents: items.map(i => ({
      id: getMetaCatalogProductId(i.product),
      quantity: i.quantity,
      item_price: i.product.price,
    })),
    content_type: 'product',
    payment_type: paymentType,
    num_items: totalCount,
    value: totalAmount,
    currency: 'INR',
    coupon: coupon || undefined,
  });
}

/**
 * Track GA4 purchase & Meta Pixel Standard Purchase (Completed transaction with Order ID deduplication)
 */
export function trackPurchase(order: Order) {
  const orderId = order.orderNumber || order.id;
  const totalItems = order.items.reduce((sum, i) => sum + i.quantity, 0);

  sendGAEvent('purchase', {
    transaction_id: orderId,
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

  // Update Advanced Matching with buyer's email/phone/name right before Purchase event
  if (order.customerEmail || order.shippingAddress?.phone) {
    setGAUser(order.customerEmail || orderId, {
      email: order.customerEmail,
      phone: order.shippingAddress?.phone,
      name: order.customerName || order.shippingAddress?.fullName,
    });
  }

  const contentIds = order.items.map(i => slugify(i.title || i.productId || ''));
  sendMetaPixelEvent(
    'Purchase',
    {
      content_ids: contentIds,
      contents: order.items.map(i => ({
        id: slugify(i.title || i.productId || ''),
        quantity: i.quantity,
        item_price: i.price,
      })),
      content_name: order.items.map(i => i.title).join(', '),
      content_type: 'product',
      value: order.totalAmount,
      num_items: totalItems,
      currency: 'INR',
      order_id: orderId,
      shipping: order.shippingFee || 0,
      tax: (order.cgst || 0) + (order.sgst || 0),
      coupon: order.discountCode || undefined,
    },
    { eventID: orderId }
  );
}

/**
 * Track GA4 add_to_wishlist & Meta Pixel Standard AddToWishlist
 */
export function trackAddToWishlist(product: Product) {
  sendGAEvent('add_to_wishlist', {
    currency: 'INR',
    value: product.price,
    items: [mapProductToGA4Item(product)],
  });

  const catalogId = getMetaCatalogProductId(product);
  sendMetaPixelEvent('AddToWishlist', {
    content_name: product.title,
    content_category: product.category || 'Japanese Skincare',
    content_ids: [catalogId],
    content_type: 'product',
    contents: [
      {
        id: catalogId,
        quantity: 1,
        item_price: product.price,
      },
    ],
    value: product.price,
    currency: 'INR',
  });
}

/**
 * Track GA4 search & Meta Pixel Standard Search
 */
export function trackSearch(searchTerm: string) {
  if (!searchTerm || !searchTerm.trim()) return;
  const cleanTerm = searchTerm.trim();

  sendGAEvent('search', {
    search_term: cleanTerm,
  });

  sendMetaPixelEvent('Search', {
    search_string: cleanTerm,
    content_category: 'Japanese Skincare',
  });
}

/**
 * Track GA4 customer login & Meta Pixel Custom CustomerLogin
 */
export function trackLogin(method = 'email_password') {
  sendGAEvent('login', {
    method,
  });

  sendMetaPixelCustomEvent('CustomerLogin', {
    method,
  });
}

/**
 * Track GA4 customer sign_up & Meta Pixel Standard CompleteRegistration
 */
export function trackSignUp(method = 'email_password') {
  sendGAEvent('sign_up', {
    method,
  });

  sendMetaPixelEvent('CompleteRegistration', {
    content_name: 'Konichiwa Mart Customer Registration',
    status: true,
    registration_method: method,
    value: 0,
    currency: 'INR',
  });
}

/**
 * Track GA4 contact / lead submission & Meta Pixel Standard Contact + Lead
 */
export function trackContactFormSubmission(topic = 'general_inquiry') {
  sendGAEvent('generate_lead', {
    lead_type: 'contact_form',
    inquiry_topic: topic,
  });

  sendMetaPixelEvent('Contact', {
    content_category: topic,
  });

  sendMetaPixelEvent('Lead', {
    content_name: 'Customer Support / Inquiry',
    content_category: topic,
    currency: 'INR',
    value: 0,
  });
}

/**
 * Track GA4 product review submission & Meta Pixel Custom SubmitReview
 */
export function trackReviewSubmission(productId: string, rating: number) {
  sendGAEvent('submit_review', {
    item_id: productId,
    rating,
  });

  sendMetaPixelCustomEvent('SubmitReview', {
    content_ids: [productId],
    rating,
  });
}

/**
 * Track GA4 select_content & Meta Pixel Custom ContentEngagement (Guide, Brand, Category, Reel, TrackOrder)
 */
export function trackSelectContent(contentType: string, itemId: string, itemName?: string) {
  sendGAEvent('select_content', {
    content_type: contentType,
    item_id: itemId,
    item_name: itemName,
  });

  sendMetaPixelCustomEvent('SelectContent', {
    content_type: contentType,
    content_id: itemId,
    content_name: itemName || itemId,
  });
}
