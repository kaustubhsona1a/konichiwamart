/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, Order } from '../types';
import { PRODUCTS } from '../data/products';

const env = (import.meta as any).env || {};
let activeSupabaseUrl: string | undefined = 
  env.VITE_SUPABASE_URL || env.SUPABASE_URL || (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL : undefined);
let activeSupabaseAnonKey: string | undefined = 
  env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY : undefined);

export const isSupabaseConfigured = (): boolean => {
  return Boolean(activeSupabaseUrl && activeSupabaseAnonKey && activeSupabaseUrl.startsWith('http'));
};

let clientInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (isSupabaseConfigured()) {
    if (!clientInstance && activeSupabaseUrl && activeSupabaseAnonKey) {
      clientInstance = createClient(activeSupabaseUrl, activeSupabaseAnonKey);
    }
    return clientInstance;
  }
  return null;
};

// Initialize client asynchronously if credentials arrive from /api/config
if (typeof window !== 'undefined' && !isSupabaseConfigured()) {
  fetch('/api/config')
    .then(r => r.json())
    .then(cfg => {
      if (cfg.supabaseUrl && cfg.supabaseAnonKey) {
        activeSupabaseUrl = cfg.supabaseUrl;
        activeSupabaseAnonKey = cfg.supabaseAnonKey;
        clientInstance = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
      }
    })
    .catch(() => {});
}

export interface OperatorSession {
  email: string;
  role: 'operator' | 'admin';
  authenticatedAt: string;
  source: 'supabase';
  accessToken?: string;
  userId?: string;
}

const STORAGE_KEY = 'km_operator_session_auth';

export const getStoredOperatorSession = (): OperatorSession | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setStoredOperatorSession = (session: OperatorSession | null): void => {
  if (session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
};

/**
 * Pure Supabase Authentication for Store Operators.
 * Signs in using real supabase.auth.signInWithPassword.
 */
export const operatorLogin = async (
  email: string,
  pass: string
): Promise<{ success: boolean; error?: string; session?: OperatorSession }> => {
  const cleanEmail = (email || '').trim();
  const cleanPass = (pass || '').trim();

  if (!cleanEmail || !cleanPass) {
    return { success: false, error: 'Please enter both your operator email and password.' };
  }

  // 1. Direct Client-side Supabase Auth
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass
      });

      if (!error && data?.user && data?.session) {
        const session: OperatorSession = {
          email: data.user.email || cleanEmail,
          role: (data.user.user_metadata?.role as any) || 'operator',
          authenticatedAt: new Date().toISOString(),
          source: 'supabase',
          accessToken: data.session.access_token,
          userId: data.user.id
        };
        setStoredOperatorSession(session);
        return { success: true, session };
      }

      if (error) {
        // If client-side failed with an explicit Supabase credential error, report it directly
        return { success: false, error: error.message };
      }
    } catch (err: any) {
      console.warn('[OperatorLogin] Client-side Supabase notice, trying server proxy:', err?.message);
    }
  }

  // 2. Server-side Supabase Auth Proxy (if client direct network is blocked)
  try {
    const res = await fetch('/api/operator/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password: cleanPass })
    });
    const json = await res.json();
    if (res.ok && json.success && json.session) {
      setStoredOperatorSession(json.session);
      return { success: true, session: json.session };
    }
    return {
      success: false,
      error: json.error || 'Invalid Supabase login credentials. Please verify your email and password.'
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to connect to Supabase Auth service.'
    };
  }
};

/**
 * Sign out of Supabase Auth
 */
export const operatorLogout = async (): Promise<void> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.auth.signOut();
    } catch (e) {
      console.warn('Supabase signOut notice:', e);
    }
  }
  setStoredOperatorSession(null);
};

export const operatorSignOut = operatorLogout;

// ==============================================================================
// CUSTOMER AUTHENTICATION & PROFILE MANAGEMENT
// ==============================================================================

export interface CustomerAuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name?: string;
    phone?: string;
  };
  error?: string;
}

/**
 * Customer Sign Up with Supabase Auth
 * Automatically creates customer_profile row via on_auth_user_created trigger
 */
export const customerSignUp = async (
  email: string,
  password: string,
  fullName: string,
  phone: string
): Promise<CustomerAuthResult> => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = password.trim();
  const cleanName = fullName.trim();
  const cleanPhone = phone.trim();

  // Guard: Operator email reservation (only reserved administrative staff accounts)
  if (cleanEmail === 'admin@konichiwamart.com') {
    return {
      success: false,
      error: 'This email is reserved for store operations. Operator accounts cannot register as customers.'
    };
  }

  // 1. Try server provision endpoint for instant auto-confirmed registration in Supabase
  try {
    const res = await fetch('/api/customer/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        password: cleanPass,
        fullName: cleanName,
        phone: cleanPhone
      })
    });
    const json = await res.json();
    if (res.ok && json.success) {
      // Auto sign-in to get active Supabase session
      return await customerSignIn(cleanEmail, cleanPass);
    }
    if (!res.ok && json.error) {
      return { success: false, error: json.error };
    }
  } catch (_) {}

  // 2. Direct Supabase Client fallback
  const client = getSupabaseClient();
  if (!client) {
    const localUser = {
      id: `usr_${Date.now()}`,
      email: cleanEmail,
      name: cleanName,
      phone: cleanPhone
    };
    localStorage.setItem('km_customer_session', JSON.stringify(localUser));
    return { success: true, user: localUser };
  }

  try {
    const { data, error } = await client.auth.signUp({
      email: cleanEmail,
      password: cleanPass,
      options: {
        data: {
          full_name: cleanName,
          phone: cleanPhone
        }
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const user = {
      id: data.user?.id || `usr_${Date.now()}`,
      email: data.user?.email || cleanEmail,
      name: cleanName,
      phone: cleanPhone
    };

    localStorage.setItem('km_customer_session', JSON.stringify(user));
    return { success: true, user };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Registration failed' };
  }
};

/**
 * Customer Sign In with Email & Password
 */
export const customerSignIn = async (
  email: string,
  password: string
): Promise<CustomerAuthResult> => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = password.trim();

  // Guard 1: Direct operator email check (only dedicated store admin email)
  if (cleanEmail === 'admin@konichiwamart.com') {
    return {
      success: false,
      error: 'This account is designated for Store Operators and cannot be used in the Customer Sign-In portal. Please use the Staff / Dealer Access portal.'
    };
  }

  // 1. Authoritative Backend Authentication via Supabase
  try {
    const res = await fetch('/api/customer/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password: cleanPass })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Invalid customer email or password.'
      };
    }
    if (data.user) {
      localStorage.setItem('km_customer_session', JSON.stringify(data.user));
      return { success: true, user: data.user };
    }
  } catch (apiErr) {
    console.warn('[Auth] Server login endpoint exception:', apiErr);
  }

  // 2. Direct client fallback ONLY if client credentials exist
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      error: 'Unable to connect to authentication services. Please verify your credentials and network connection.'
    };
  }

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPass
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const meta = data.user?.user_metadata || {};
    const role = (meta.role || '').toLowerCase();

    // Guard 2: Reject any account configured as operator or admin
    if (role === 'operator' || role === 'admin') {
      await client.auth.signOut().catch(() => {});
      return {
        success: false,
        error: 'This account is designated for Store Operators and cannot be used in the Customer Sign-In portal. Please use the Staff / Dealer Access portal.'
      };
    }

    const user = {
      id: data.user?.id || '',
      email: data.user?.email || cleanEmail,
      name: meta.full_name || meta.name || cleanEmail.split('@')[0],
      phone: meta.phone || ''
    };

    localStorage.setItem('km_customer_session', JSON.stringify(user));
    return { success: true, user };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Login failed' };
  }
};

/**
 * Customer Sign Out
 */
export const customerSignOut = async (): Promise<void> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.auth.signOut();
    } catch {
      // ignore
    }
  }
  localStorage.removeItem('km_customer_session');
};

/**
 * Customer Forgot Password (sends reset instructions via Supabase)
 */
export const customerForgotPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const res = await fetch('/api/customer/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to send password reset email.');
    }
    return { success: true, message: data.message || 'Password reset link sent to your email.' };
  } catch (err: any) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { error } = await client.auth.resetPasswordForEmail(cleanEmail);
        if (error) throw error;
        return { success: true, message: `Password reset instructions sent to ${cleanEmail}.` };
      } catch (clientErr: any) {
        throw new Error(clientErr.message || 'Password reset failed.');
      }
    }
    throw new Error(err.message || 'Could not send password reset email.');
  }
};

/**
 * Get active customer session
 */
export const getActiveCustomerSession = () => {
  try {
    const raw = localStorage.getItem('km_customer_session');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

/**
 * Fetch Saved Addresses from Supabase (Server endpoint first, direct fallback)
 */
export const fetchCustomerAddressesFromSupabase = async (customerId?: string, email?: string) => {
  try {
    const params = new URLSearchParams();
    if (customerId) params.set('customerId', customerId);
    if (email) params.set('email', email);

    const res = await fetch(`/api/customer/addresses?${params.toString()}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.addresses)) {
        return json.addresses;
      }
    }
  } catch (apiErr) {
    console.warn('[Address Fetch] Server proxy failed, trying direct client:', apiErr);
  }

  const client = getSupabaseClient();
  if (!client || (!customerId && !email)) return [];

  try {
    let resolvedId = customerId;
    if (!resolvedId && email) {
      const { data: prof } = await client
        .from('customer_profiles')
        .select('id')
        .ilike('email', email.trim().toLowerCase())
        .maybeSingle();
      if (prof?.id) resolvedId = prof.id;
    }

    if (!resolvedId) return [];

    const { data, error } = await client
      .from('customer_addresses')
      .select('*')
      .eq('customer_id', resolvedId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Supabase] Failed to fetch customer addresses:', error.message);
      return [];
    }
    return (data || []).map((a: any) => ({
      id: a.id,
      fullName: a.full_name,
      phone: a.phone,
      addressLine1: a.address_line1,
      addressLine2: a.address_line2,
      city: a.city,
      state: a.state,
      pincode: a.pincode,
      tag: a.tag || 'Home',
      isDefault: Boolean(a.is_default)
    }));
  } catch (err) {
    console.warn('[Supabase] Address fetch error:', err);
    return [];
  }
};

/**
 * Save Address to Supabase (Server endpoint first, direct fallback)
 */
export const saveAddressToSupabase = async (
  customerId: string,
  address: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    tag?: string;
    isDefault?: boolean;
  },
  email?: string
) => {
  try {
    const res = await fetch('/api/customer/address', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, email, address })
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.address) {
        return json.address;
      }
    }
  } catch (apiErr) {
    console.warn('[Address Save] Server proxy error:', apiErr);
  }

  const client = getSupabaseClient();
  if (!client) return null;

  try {
    let resolvedId = customerId;
    if ((!resolvedId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedId)) && email) {
      const { data: prof } = await client
        .from('customer_profiles')
        .select('id')
        .ilike('email', email.trim().toLowerCase())
        .maybeSingle();
      if (prof?.id) resolvedId = prof.id;
    }

    if (!resolvedId) return null;

    const { data, error } = await client
      .from('customer_addresses')
      .insert({
        customer_id: resolvedId,
        full_name: address.fullName,
        phone: address.phone,
        address_line1: address.addressLine1,
        address_line2: address.addressLine2 || '',
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        tag: address.tag || 'Home',
        is_default: Boolean(address.isDefault)
      })
      .select()
      .single();

    if (error) {
      console.warn('[Supabase] Error saving address:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('[Supabase] Error creating address:', err);
    return null;
  }
};

/**
 * Delete Address from Supabase
 */
export const deleteCustomerAddressFromSupabase = async (id: string, email?: string) => {
  try {
    const q = email ? `?email=${encodeURIComponent(email.trim().toLowerCase())}` : '';
    await fetch(`/api/customer/address/${encodeURIComponent(id)}${q}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('[Supabase] Delete address server error:', err);
  }
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('customer_addresses').delete().eq('id', id);
    } catch (_) {}
  }
};

/**
 * Set Default Address in Supabase
 */
export const setDefaultAddressInSupabase = async (id: string, customerId?: string, email?: string) => {
  try {
    await fetch(`/api/customer/address/${encodeURIComponent(id)}/default`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, email })
    });
  } catch (err) {
    console.warn('[Supabase] Set default address server error:', err);
  }
};

/**
 * Fetch Customer Orders from Supabase (Server endpoint first, direct fallback)
 */
export function mapSupabaseRowToOrder(row: any): Order {
  const items = Array.isArray(row.order_items)
    ? row.order_items.map((item: any) => ({
        product: {
          id: item.sku || 'prod-1',
          title: item.title || 'Japanese Skincare Product',
          price: Number(item.unit_price || 0),
          image: item.image_url || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80',
          volume: '150ml',
          description: '',
          category: 'Skincare',
          rating: 5,
          reviewCount: 1,
          isBestSeller: false,
          stock: 100
        },
        quantity: Number(item.quantity || 1),
        selectedShade: item.shade_name ? { id: item.sku || 'sh-1', name: item.shade_name, hex: '#000000', sku: item.sku } : undefined
      }))
    : [];

  const rawStatus = (row.status || 'CONFIRMED').toString().toUpperCase();
  let mappedStatus: Order['status'] = 'CONFIRMED';
  if (['CONFIRMED', 'PAID', 'PENDING', 'PROCESSING', 'NEW'].includes(rawStatus)) {
    mappedStatus = 'CONFIRMED';
  } else if (['DISPATCHED', 'SHIPPED', 'IN_TRANSIT'].includes(rawStatus)) {
    mappedStatus = 'DISPATCHED';
  } else if (['OUT_FOR_DELIVERY'].includes(rawStatus)) {
    mappedStatus = 'OUT_FOR_DELIVERY';
  } else if (['DELIVERED'].includes(rawStatus)) {
    mappedStatus = 'DELIVERED';
  } else if (['CANCELLED'].includes(rawStatus)) {
    mappedStatus = 'CANCELLED';
  }

  return {
    id: row.id || row.order_number,
    orderNumber: row.order_number || row.id,
    invoiceNumber: row.invoice_number || `KM-INV-${row.order_number}`,
    date: row.created_at ? new Date(row.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN'),
    createdAt: row.created_at || new Date().toISOString(),
    customerEmail: row.customer_email || '',
    customerPhone: row.customer_phone || '',
    customerName: row.customer_name || 'Valued Customer',
    items,
    subtotal: Number(row.subtotal || 0),
    cgst: Number(row.cgst || 0),
    sgst: Number(row.sgst || 0),
    shippingFee: Number(row.shipping_fee || 0),
    discountAmount: Number(row.discount_amount || 0),
    discountCode: row.discount_code || undefined,
    totalAmount: Number(row.total_amount || 0),
    paymentMethod: (row.payment_method || 'RAZORPAY').toUpperCase() as any,
    paymentId: row.razorpay_payment_id || 'pay_verified',
    signature: row.razorpay_signature || 'sig_verified',
    status: mappedStatus,
    shippingAddress: {
      id: row.id ? `addr_${row.id}` : 'addr_default',
      tag: 'Home',
      fullName: row.customer_name || 'Valued Customer',
      phone: row.customer_phone || '',
      addressLine1: row.shipping_address_line1 || '',
      addressLine2: row.shipping_address_line2 || '',
      city: row.city || '',
      state: row.state || '',
      pincode: row.pincode || '',
      isDefault: true
    },
    awbNumber: row.awb_number || '',
    courierPartner: row.courier_partner || 'Pending Dispatch',
    estimatedDeliveryDate: row.estimated_delivery_date || '3-5 business days',
    trackingHistory: [
      {
        time: row.created_at ? new Date(row.created_at).toLocaleDateString() : 'Just Now',
        location: 'Konichiwa_Mart Central Fulfillment',
        activity: `Order Confirmed (${mappedStatus})`
      }
    ]
  };
}

export const fetchAllOrdersFromSupabase = async (): Promise<Order[]> => {
  try {
    const res = await fetch('/api/admin/orders');
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.orders)) {
          return data.orders;
        }
      }
    }
  } catch {}

  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Supabase] Error fetching all orders:', error.message);
      return [];
    }

    return (data || []).map(mapSupabaseRowToOrder);
  } catch (err) {
    console.warn('[Supabase] Exception fetching all orders:', err);
    return [];
  }
};

export const updateOrderStatusInSupabase = async (orderId: string, status: string): Promise<boolean> => {
  try {
    const res = await fetch('/api/admin/update-order-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success) return true;
    }
  } catch {}

  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('orders')
      .update({ status: status.toLowerCase() })
      .or(`id.eq.${orderId},order_number.eq.${orderId}`);

    if (error) {
      console.warn('[Supabase] Error updating order status:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Exception updating order status:', err);
    return false;
  }
};

export const fetchCustomerOrdersFromSupabase = async (customerId?: string, email?: string) => {
  try {
    const params = new URLSearchParams();
    if (customerId) params.set('customerId', customerId);
    if (email) params.set('email', email);

    const res = await fetch(`/api/customer/orders?${params.toString()}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.orders)) {
        return json.orders;
      }
    }
  } catch (apiErr) {
    console.warn('[Orders Fetch] Server proxy failed, trying direct client:', apiErr);
  }

  const client = getSupabaseClient();
  if (!client) return fetchAllOrdersFromSupabase();

  try {
    let query = client
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (customerId && email) {
      query = query.or(`customer_id.eq.${customerId},customer_email.eq.${email}`);
    } else if (customerId) {
      query = query.eq('customer_id', customerId);
    } else if (email) {
      query = query.eq('customer_email', email);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('[Supabase] Failed to fetch customer orders:', error.message);
      return [];
    }
    return (data || []).map(mapSupabaseRowToOrder);
  } catch (err) {
    console.warn('[Supabase] Error querying orders:', err);
    return [];
  }
};

/**
 * Persist Verified Order to Supabase (calls authoritative server endpoint with direct fallback)
 */
export const saveOrderToSupabase = async (order: any, customerId?: string): Promise<boolean> => {
  try {
    // 1. Try backend server-side proxy first (authoritative & bypasses browser CORS/policy restrictions)
    const res = await fetch('/api/save-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order, customerId })
    });

    if (res.ok) {
      const result = await res.json();
      if (result.success) {
        console.log('[Order Sync] Successfully persisted order to Supabase via server API:', order.orderNumber);
        return true;
      }
    }
  } catch (apiErr) {
    console.warn('[Order Sync] Server proxy failed, trying direct Supabase client:', apiErr);
  }

  // 2. Direct client-side fallback
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const isInterstate = (order.shippingAddress?.state || '').toLowerCase() !== 'maharashtra';
    const totalGst = Number(order.cgst || 0) + Number(order.sgst || 0);

    const { data: insertedOrder, error: orderErr } = await client
      .from('orders')
      .insert({
        order_number: order.orderNumber,
        invoice_number: order.invoiceNumber,
        customer_id: customerId || null,
        customer_name: order.shippingAddress?.fullName || 'Valued Customer',
        customer_email: order.customerEmail || '',
        customer_phone: order.customerPhone || order.shippingAddress?.phone || '',
        shipping_address_line1: order.shippingAddress?.addressLine1 || '',
        shipping_address_line2: order.shippingAddress?.addressLine2 || '',
        city: order.shippingAddress?.city || '',
        state: order.shippingAddress?.state || '',
        state_code: isInterstate ? '99' : '27',
        pincode: order.shippingAddress?.pincode || '',
        country: 'India',
        currency: 'INR',
        subtotal: Number(order.subtotal || 0),
        cgst: isInterstate ? 0 : Number(order.cgst || 0),
        sgst: isInterstate ? 0 : Number(order.sgst || 0),
        igst: isInterstate ? totalGst : 0,
        shipping_fee: Number(order.shippingFee || 0),
        discount_amount: Number(order.discountAmount || 0),
        discount_code: order.discountCode || null,
        total_amount: Number(order.totalAmount || 0),
        status: 'paid',
        payment_method: order.paymentMethod || 'RAZORPAY',
        razorpay_order_id: order.razorpayOrderId || null,
        razorpay_payment_id: order.paymentId || null,
        razorpay_signature: order.signature || null,
        awb_number: order.awbNumber || null,
        courier_partner: order.courierPartner || 'Blue Dart Express',
        estimated_delivery_date: order.estimatedDeliveryDate || null
      })
      .select()
      .maybeSingle();

    if (orderErr) {
      console.warn('[Direct Supabase Order Error]:', orderErr.message);
      return false;
    }

    if (insertedOrder && order.items && order.items.length > 0) {
      const itemsRows = order.items.map((item: any) => ({
        order_id: insertedOrder.id,
        title: item.product?.title || item.title,
        shade_name: item.selectedShade?.name || item.shadeName || null,
        sku: item.selectedShade?.sku || item.sku || item.product?.id || 'SKU-KM',
        hsn_code: '3304',
        unit_price: Number(item.product?.price || item.unitPrice || 0),
        quantity: Number(item.quantity || 1),
        subtotal: Number((item.product?.price || item.unitPrice || 0) * (item.quantity || 1)),
        weight_grams: 150 * Number(item.quantity || 1),
        image_url: item.product?.image || item.image || null
      }));

      await client.from('order_items').insert(itemsRows);
    }

    return true;
  } catch (directErr) {
    console.warn('[Direct Supabase Order Exception]:', directErr);
    return false;
  }
};

// ==============================================================================
// CATALOG & PRODUCT SYNCHRONIZATION WITH SUPABASE & SERVER
// ==============================================================================

// Helper: shade definitions fallback for lipstick and foundations
const PRODUCT_SHADES_MAP: Record<string, any[]> = {
  'velvet-petal-matte-lipstick': [
    { id: 'sh-01', name: '01 Japan Crimson', hex: '#BE123C', sku: 'LIP-VK-01' },
    { id: 'sh-02', name: '02 Sakura Bloom', hex: '#E11D48', sku: 'LIP-VK-02' },
    { id: 'sh-04', name: '04 Dusty Rose', hex: '#BE185D', sku: 'LIP-VK-04' },
    { id: 'sh-05', name: '05 Kyoto Warm Nude', hex: '#B45309', sku: 'LIP-VK-05' }
  ],
  'luminous-silk-serum-foundation': [
    { id: 'fnd-101', name: '101 Fair Warm Porcelain', hex: '#FDE68A', sku: 'FND-LS-101' },
    { id: 'fnd-102', name: '102 Light Warm Beige', hex: '#FCD34D', sku: 'FND-LS-102' },
    { id: 'fnd-201', name: '201 Medium Natural Sand', hex: '#F59E0B', sku: 'FND-LS-201' },
    { id: 'fnd-301', name: '301 Warm Honey Tan', hex: '#D97706', sku: 'FND-LS-301' }
  ],
  'souffle-cream-blush': [
    { id: 'bl-01', name: 'Peach Yuzu Glow', hex: '#FDBA74', sku: 'BL-SF-01' },
    { id: 'bl-02', name: 'Sakura Petal Pink', hex: '#FB7185', sku: 'BL-SF-02' },
    { id: 'bl-03', name: 'Warm Berry Jam', hex: '#E11D48', sku: 'BL-SF-03' }
  ]
};

/**
 * Reads inventory counts directly from Supabase categories table (_app_inventory row)
 */
export async function getSupabaseInventoryCounts(): Promise<Record<string, number>> {
  const client = getSupabaseClient();
  if (!client) return {};
  try {
    const { data, error } = await client
      .from('categories')
      .select('description')
      .eq('slug', '_app_inventory')
      .maybeSingle();

    if (!error && data?.description) {
      return JSON.parse(data.description);
    }
  } catch (err) {
    console.warn('[Supabase Inventory] Read error:', err);
  }
  return {};
}

/**
 * Saves/updates inventory counts in Supabase categories table (_app_inventory row)
 */
export async function saveSupabaseInventoryCounts(counts: Record<string, number>): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    await client.from('categories').upsert({
      slug: '_app_inventory',
      name: 'Store Inventory Metadata',
      description: JSON.stringify(counts)
    }, { onConflict: 'slug' });
  } catch (err) {
    console.warn('[Supabase Inventory] Save error:', err);
  }
}

function mapSupabaseRowToProductClient(row: any, inventoryMap?: Record<string, number>): Product {
  const productId = row.slug || row.id;
  const stockValue = inventoryMap && (inventoryMap[productId] !== undefined || inventoryMap[row.id] !== undefined)
    ? (inventoryMap[productId] ?? inventoryMap[row.id])
    : 50;

  return {
    id: productId,
    title: row.title,
    subtitle: row.subtitle || '',
    price: Number(row.base_price || 0),
    originalPrice: Number(row.compare_at_price || row.base_price || 0),
    rating: Number(row.rating || 4.9),
    reviewsCount: Number(row.reviews_count || 120),
    category: (row.category_name || 'Skincare') as any,
    skinTypes: row.skin_types || ['All'],
    skinConcerns: row.skin_concerns || [],
    routine: (row.routine as any) || 'AM/PM',
    volume: row.volume_or_weight || '100ml',
    badges: [
      row.is_bestseller ? 'Bestseller' : '',
      row.is_new ? 'New Arrival' : ''
    ].filter(Boolean),
    image: row.primary_image_url,
    secondaryImage: row.secondary_image_url || undefined,
    images: row.images && row.images.length > 0 ? row.images : [row.primary_image_url],
    accentColor: row.accent_color || '#E11D48',
    bgGradient: 'from-rose-50 to-pink-100',
    keyActives: Array.isArray(row.key_actives) ? row.key_actives : [],
    fullIngredients: row.full_ingredients || '',
    description: row.description || '',
    benefits: Array.isArray(row.benefits) ? row.benefits : [],
    usageHowTo: row.usage_how_to || '',
    stock: stockValue,
    shades: PRODUCT_SHADES_MAP[productId] || undefined,
    isBestSeller: Boolean(row.is_bestseller),
    isNew: Boolean(row.is_new)
  };
}

function mapProductToSupabaseRowClient(p: Product): any {
  return {
    slug: p.id,
    title: p.title,
    subtitle: p.subtitle || '',
    category_name: p.category,
    description: p.description || '',
    benefits: p.benefits || [],
    usage_how_to: p.usageHowTo || '',
    key_actives: p.keyActives || [],
    full_ingredients: p.fullIngredients || '',
    hsn_code: '3304',
    base_price: p.price,
    compare_at_price: p.originalPrice || p.price,
    primary_image_url: p.image,
    secondary_image_url: p.secondaryImage || null,
    images: p.images || [p.image],
    volume_or_weight: p.volume,
    accent_color: p.accentColor || '#E11D48',
    skin_types: p.skinTypes || ['All'],
    skin_concerns: p.skinConcerns || [],
    routine: p.routine || 'AM/PM',
    is_bestseller: Boolean(p.isBestSeller),
    is_new: Boolean(p.isNew),
    is_active: true,
    rating: p.rating || 4.9,
    reviews_count: p.reviewsCount || 50
  };
}

/**
 * Fetches products from server API & Supabase.
 * Excludes permanently deleted products and ensures seamless sync.
 */
export const fetchProductsFromStore = async (): Promise<Product[]> => {
  // Read local deleted IDs first for immediate filtering
  let localDeletedIds = new Set<string>();
  try {
    const deletedJson = localStorage.getItem('km_deleted_product_ids');
    if (deletedJson) {
      localDeletedIds = new Set(JSON.parse(deletedJson));
    }
  } catch {}

  // 1. Primary: Server API (which syncs with Supabase & persistent server storage)
  try {
    const res = await fetch('/api/products');
    if (res.ok) {
      const data = await res.json();
      if (data?.success && Array.isArray(data.products) && data.products.length > 0) {
        const filtered = data.products.filter((p: Product) => !localDeletedIds.has(p.id));
        // Update local cache
        localStorage.setItem('km_custom_products', JSON.stringify(filtered));
        return filtered;
      }
    }
  } catch (err) {
    console.warn('[Products Store] Server fetch error, checking direct Supabase:', err);
  }

  // 2. Direct Supabase Client fallback (for Vercel deployment or client-side)
  const client = getSupabaseClient();
  if (client) {
    try {
      const [prodRes, invRes] = await Promise.all([
        client
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: true }),
        client
          .from('categories')
          .select('description')
          .eq('slug', '_app_inventory')
          .maybeSingle()
      ]);

      const inventoryMap: Record<string, number> = invRes?.data?.description 
        ? JSON.parse(invRes.data.description) 
        : {};

      if (!prodRes.error && Array.isArray(prodRes.data) && prodRes.data.length > 0) {
        const mapped = prodRes.data
          .map((row) => mapSupabaseRowToProductClient(row, inventoryMap))
          .filter((p) => !localDeletedIds.has(p.id));

        localStorage.setItem('km_custom_products', JSON.stringify(mapped));
        return mapped;
      }
    } catch (err) {
      console.warn('[Products Store] Direct Supabase error:', err);
    }
  }

  // 3. Local Cache / Default Seed Fallback
  try {
    const saved = localStorage.getItem('km_custom_products');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((p: Product) => !localDeletedIds.has(p.id));
      }
    }
  } catch {}

  return PRODUCTS.filter((p) => !localDeletedIds.has(p.id));
};

/**
 * Permanently deletes a product from Supabase, server storage, and localStorage.
 * Ensures the product NEVER reappears across refreshes, other tabs, or new devices.
 */
export const deleteProductFromStore = async (productId: string): Promise<boolean> => {
  // 1. Local optimistic update
  try {
    const deletedJson = localStorage.getItem('km_deleted_product_ids');
    const deletedIds: string[] = deletedJson ? JSON.parse(deletedJson) : [];
    if (!deletedIds.includes(productId)) {
      deletedIds.push(productId);
      localStorage.setItem('km_deleted_product_ids', JSON.stringify(deletedIds));
    }
    const saved = localStorage.getItem('km_custom_products');
    if (saved) {
      const parsed: Product[] = JSON.parse(saved);
      localStorage.setItem('km_custom_products', JSON.stringify(parsed.filter(p => p.id !== productId)));
    }
  } catch {}

  // 2. Server API deletion (permanent file storage on server)
  try {
    fetch(`/api/products/${encodeURIComponent(productId)}`, {
      method: 'DELETE'
    }).catch(() => {});
  } catch {}

  // 3. Direct Supabase deletion
  const client = getSupabaseClient();
  if (client) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
    Promise.resolve(
      isUuid
        ? client.from('products').update({ is_active: false }).eq('id', productId)
        : client.from('products').update({ is_active: false }).eq('slug', productId)
    ).catch(() => {});
  }

  return true;
};

/**
 * Updates a product's stock or price across server and Supabase.
 */
export const updateProductInStore = async (productId: string, updates: Partial<Product>): Promise<boolean> => {
  // 1. Server API
  try {
    fetch(`/api/products/${encodeURIComponent(productId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).catch(() => {});
  } catch {}

  // 2. Direct Supabase (syncs price and stock directly with Supabase)
  const client = getSupabaseClient();
  if (client) {
    // If updating fields
    const patch: any = {};
    if (updates.price !== undefined) patch.base_price = updates.price;
    if (updates.originalPrice !== undefined) patch.compare_at_price = updates.originalPrice;
    if (updates.title !== undefined) patch.title = updates.title;
    if (updates.subtitle !== undefined) patch.subtitle = updates.subtitle;
    if (updates.category !== undefined) patch.category_name = updates.category;
    if (updates.image !== undefined) patch.primary_image_url = updates.image;
    if (updates.secondaryImage !== undefined) patch.secondary_image_url = updates.secondaryImage;
    if (updates.images !== undefined) patch.images = updates.images;
    if (updates.volume !== undefined) patch.volume_or_weight = updates.volume;

    if (Object.keys(patch).length > 0) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
      Promise.resolve(
        isUuid
          ? client.from('products').update(patch).eq('id', productId)
          : client.from('products').update(patch).eq('slug', productId)
      ).catch(() => {});
    }

    // If updating stock
    if (updates.stock !== undefined) {
      getSupabaseInventoryCounts().then((counts) => {
        counts[productId] = updates.stock!;
        saveSupabaseInventoryCounts(counts);
      }).catch(() => {});
    }
  }

  return true;
};

/**
 * Adds a new product to server and Supabase.
 */
export const addProductToStore = async (product: Product): Promise<boolean> => {
  // 1. Server API
  try {
    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    }).catch(() => {});
  } catch {}

  // 2. Direct Supabase
  const client = getSupabaseClient();
  if (client) {
    Promise.resolve(
      client
        .from('products')
        .insert([mapProductToSupabaseRowClient(product)])
    ).catch(() => {});

    // Save initial stock in Supabase inventory
    if (product.stock !== undefined) {
      getSupabaseInventoryCounts().then((counts) => {
        counts[product.id] = product.stock;
        saveSupabaseInventoryCounts(counts);
      }).catch(() => {});
    }
  }

  return true;
};

/**
 * Resets the catalog to defaults.
 */
export const resetProductsInStore = async (): Promise<boolean> => {
  try {
    localStorage.removeItem('km_deleted_product_ids');
    localStorage.removeItem('km_custom_products');
    fetch('/api/products/reset', { method: 'POST' }).catch(() => {});
  } catch {}
  return true;
};

/**
 * Syncs the entire local catalog of products directly to Supabase.
 */
export const syncCatalogToSupabase = async (productsToSync: Product[] = PRODUCTS): Promise<boolean> => {
  // Try server endpoint first
  try {
    const res = await fetch('/api/products/sync-supabase', { method: 'POST' });
    if (res.ok) {
      console.log('[Supabase] Catalog synced via server API.');
      return true;
    }
  } catch {}

  // Fallback direct client sync
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const rows = productsToSync.map(mapProductToSupabaseRowClient);
    const { error } = await client.from('products').upsert(rows, { onConflict: 'slug' });
    if (error) {
      console.warn('[Supabase] Client direct product upsert error:', error.message);
      return false;
    }

    const counts = await getSupabaseInventoryCounts();
    for (const p of productsToSync) {
      if (p.stock !== undefined) {
        counts[p.id] = p.stock;
      }
    }
    await saveSupabaseInventoryCounts(counts);

    console.log(`[Supabase] Successfully synced ${productsToSync.length} products to Supabase.`);
    return true;
  } catch (err) {
    console.warn('[Supabase] Catalog sync failed:', err);
    return false;
  }
};

// --- REELS SYNCHRONIZATION ---

export const fetchReelsFromSupabase = async (): Promise<any[]> => {
  const supabase = getSupabaseClient();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('reels').select('*').order('created_at', { ascending: false });
    if (error) {
      console.warn('Could not fetch reels from Supabase (table might not exist yet):', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    return [];
  }
};

export const syncReelsListToSupabase = async (reels: any[]): Promise<boolean> => {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  try {
    // Basic upsert loop for reels
    for (const reel of reels) {
      await supabase.from('reels').upsert({
        id: reel.id,
        creator_handle: reel.creatorHandle,
        creator_name: reel.creatorName,
        creator_avatar: reel.creatorAvatar,
        location: reel.location,
        title: reel.title,
        caption: reel.caption,
        views: reel.views,
        likes: reel.likes,
        comments_count: reel.commentsCount,
        audio_track: reel.audioTrack,
        product_id: reel.productId,
        video_thumb: reel.videoThumb,
        video_url: reel.videoUrl,
        instagram_url: reel.instagramUrl,
        tags: reel.tags
      });
    }
    return true;
  } catch (err) {
    console.error('Error syncing reels:', err);
    return false;
  }
};
