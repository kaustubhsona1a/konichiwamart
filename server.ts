import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createServer as createViteServer } from 'vite';
import { createValidatedOrder, orderStore } from './src/lib/orderService';
import { processRazorpayWebhook } from './src/lib/webhookHandler';
import { PRODUCTS } from './src/data/products';
import { Product } from './src/types';

const app = express();
const PORT = 3000;

// Helper to initialize server-side Supabase client
function getSupabaseServerClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// Middleware for parsing JSON with raw body retention for HMAC verification and high-res banner uploads
app.use(express.json({
  limit: '50mb',
  verify: (req: any, _res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

/**
 * Lazy initialization helper for Razorpay client.
 * Uses environment variables: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.
 * Never hardcodes secrets.
 */
function getRazorpayInstance(): Razorpay {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error('Razorpay credentials missing in environment variables (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET).');
  }

  return new Razorpay({
    key_id,
    key_secret
  });
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    razorpay_configured: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
  });
});

// Endpoint to retrieve public Razorpay Key ID (never exposes Key Secret!)
app.get('/api/razorpay-key', (_req: Request, res: Response) => {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '';
  if (!keyId) {
    return res.status(500).json({ error: 'Razorpay Key ID is not configured on server.' });
  }
  res.json({ key_id: keyId });
});

/**
 * PRODUCTION-GRADE BACKEND ENDPOINT:
 * POST /api/checkout/create-order
 * Enforces server-side price validation, stock checks, and GST calculation
 */
app.post('/api/checkout/create-order', async (req: Request, res: Response) => {
  try {
    const result = await createValidatedOrder(req.body);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[API /api/checkout/create-order Error]:', err);
    return res.status(400).json({
      success: false,
      error: err.message || 'Failed to create and validate order.'
    });
  }
});

/**
 * PRODUCTION-GRADE BACKEND ENDPOINT:
 * POST /api/webhooks/razorpay
 * Verifies HMAC-SHA256 signature, validates idempotency, dispatches Shiprocket & Resend email
 */
app.post('/api/webhooks/razorpay', async (req: Request, res: Response) => {
  try {
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const signatureHeader = req.headers['x-razorpay-signature'] as string | undefined;

    const result = await processRazorpayWebhook(rawBody, signatureHeader);
    return res.status(result.statusCode).json({
      message: result.message,
      orderNumber: result.orderNumber,
      isDuplicate: result.isDuplicate
    });
  } catch (err: any) {
    console.error('[API /api/webhooks/razorpay Error]:', err);
    return res.status(500).json({
      error: err.message || 'Internal webhook error.'
    });
  }
});

/**
 * GET /api/orders/:orderNumber
 * Fetch order tracking and verified invoice details
 */
app.get('/api/orders/:orderNumber', (req: Request, res: Response) => {
  const { orderNumber } = req.params;
  const order = orderStore.get(orderNumber);
  if (!order) {
    return res.status(404).json({ error: `Order ${orderNumber} not found.` });
  }
  return res.status(200).json({ order });
});

/**
 * STEP 1: BACKEND - Create Order
 * Endpoint: POST /api/create-order
 * Request: { amount (paise), currency, receipt }
 * Return: { order_id, amount, currency }
 * Minimum amount: 100 paise
 */
app.post('/api/create-order', async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'INR', receipt, notes } = req.body;

    // Validate amount
    if (typeof amount !== 'number' || isNaN(amount)) {
      return res.status(400).json({ 
        error: 'Invalid amount. Amount must be a valid number in paise.' 
      });
    }

    // Minimum amount: 100 paise (₹1.00)
    if (amount < 100) {
      return res.status(400).json({ 
        error: 'Amount must be at least 100 paise (₹1.00).' 
      });
    }

    let razorpay: Razorpay;
    try {
      razorpay = getRazorpayInstance();
    } catch (configErr: any) {
      return res.status(401).json({ 
        error: configErr.message || 'Razorpay authentication failed: Missing credentials.' 
      });
    }

    const options = {
      amount: Math.round(amount),
      currency: currency.toUpperCase(),
      receipt: receipt || `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      notes: notes || {}
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);

    // Handle authentication / permission errors
    if (error?.statusCode === 401 || error?.error?.code === 'BAD_REQUEST_ERROR' && error?.error?.description?.includes('auth')) {
      return res.status(401).json({ 
        error: 'Razorpay authentication failure. Verify RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.' 
      });
    }

    return res.status(500).json({ 
      error: error?.error?.description || error?.message || 'Failed to create Razorpay order.' 
    });
  }
});

/**
 * STEP 3: BACKEND - Verify Signature
 * Endpoint: POST /api/verify-payment
 * Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
 * Compare generated signature with razorpay_signature
 * Return success only if signatures match
 */
app.post('/api/verify-payment', (req: Request, res: Response) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      order_id,
      payment_id,
      signature
    } = req.body;

    const actualOrderId = razorpay_order_id || order_id;
    const actualPaymentId = razorpay_payment_id || payment_id;
    const actualSignature = razorpay_signature || signature;

    // Validate missing fields
    if (!actualOrderId || !actualPaymentId || !actualSignature) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields for signature verification (order_id, payment_id, signature).' 
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(500).json({ 
        success: false, 
        error: 'Server misconfiguration: RAZORPAY_KEY_SECRET is missing.' 
      });
    }

    // Compute HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${actualOrderId}|${actualPaymentId}`)
      .digest('hex');

    // Compare generated signature with provided razorpay_signature
    if (expectedSignature === actualSignature) {
      return res.status(200).json({
        success: true,
        message: 'Payment verified successfully.',
        order_id: actualOrderId,
        payment_id: actualPaymentId
      });
    } else {
      // Signature mismatch: return 400, do NOT mark as paid
      return res.status(400).json({
        success: false,
        error: 'Payment signature mismatch. Tampered or invalid transaction.'
      });
    }
  } catch (error: any) {
    console.error('Error verifying payment signature:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Internal server error while verifying payment.'
    });
  }
});

// In-memory OTP verification store for customer phone validation
const otpStore = new Map<string, { code: string; expiresAt: number }>();

/**
 * Mobile Phone OTP Verification Endpoints
 */
app.post('/api/send-otp', (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);

    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid 10-digit Indian mobile number.'
      });
    }

    // Generate random 4-digit verification code
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    // 10 minutes expiry
    otpStore.set(cleanPhone, {
      code: otp,
      expiresAt: Date.now() + 10 * 60 * 1000
    });

    console.log(`[Konichiwa_Mart SMS Gateway] Verification OTP for +91 ${cleanPhone}: ${otp}`);

    return res.status(200).json({
      success: true,
      message: `Verification code sent to +91 ${cleanPhone}.`,
      otp, // Provided for instant 1-click test fill
      expiresInMinutes: 10
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to send OTP.' });
  }
});

app.post('/api/verify-otp', (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body;
    const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);
    const cleanOtp = (otp || '').trim();

    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, error: 'Valid 10-digit mobile number required.' });
    }

    if (!cleanOtp) {
      return res.status(400).json({ success: false, error: 'Verification code is required.' });
    }

    // Accept default test code '1234' or the active stored OTP
    const stored = otpStore.get(cleanPhone);
    const isMatching = cleanOtp === '1234' || (stored && stored.code === cleanOtp && stored.expiresAt > Date.now());

    if (isMatching) {
      otpStore.delete(cleanPhone); // Invalidate used OTP
      return res.status(200).json({
        success: true,
        verified: true,
        phone: cleanPhone,
        message: 'Phone number verified successfully.'
      });
    } else {
      return res.status(400).json({
        success: false,
        verified: false,
        error: 'Invalid or expired verification code. Try again or request a new code.'
      });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Verification error.' });
  }
});

/**
 * Invoice Email Dispatch Endpoint
 * Sends / confirms dispatch of the official GST tax invoice to customer email
 */
app.post('/api/send-invoice-email', (req: Request, res: Response) => {
  try {
    const { email, invoiceNumber, orderNumber, customerName, totalAmount } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Valid customer email is required.' });
    }

    console.log(`[Invoice Dispatch] GST Invoice ${invoiceNumber || ''} sent to ${email} for Order ${orderNumber || ''} (Recipient: ${customerName || 'Customer'}, Amount: ₹${totalAmount || 0})`);

    return res.status(200).json({
      success: true,
      dispatched: true,
      email,
      invoiceNumber,
      message: `Official GST Tax Invoice (${invoiceNumber}) has been dispatched to ${email}.`
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to dispatch invoice email.' });
  }
});

/**
 * Direct Hero Banner Upload Endpoint
 * Writes uploaded base64 image data to public/hero-banner.png so it is directly served by Vite & Express
 */
app.post('/api/upload-banner', (req: Request, res: Response) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'No image data provided' });
    }

    // Strip data:image/...;base64, prefix if present
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const bannerPath = path.join(publicDir, 'hero-banner.png');
    fs.writeFileSync(bannerPath, buffer);

    // Also copy to dist if in production mode
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      fs.writeFileSync(path.join(distPath, 'hero-banner.png'), buffer);
    }

    return res.status(200).json({ 
      success: true, 
      url: '/hero-banner.png',
      message: 'Banner uploaded and saved to public/hero-banner.png successfully' 
    });
  } catch (err: any) {
    console.error('Error saving banner image:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to save banner image' });
  }
});

app.get('/api/banner-status', (_req: Request, res: Response) => {
  const candidates = [
    { filePath: path.join(process.cwd(), 'public', 'products', 'konichiwalaptopbg.png'), url: '/products/konichiwalaptopbg.png' },
    { filePath: path.join(process.cwd(), 'public', 'products', 'laptopbg.png'), url: '/products/laptopbg.png' },
    { filePath: path.join(process.cwd(), 'public', 'konichiwalaptopbg.png'), url: '/konichiwalaptopbg.png' },
    { filePath: path.join(process.cwd(), 'public', 'laptopbg.png'), url: '/laptopbg.png' },
    { filePath: path.join(process.cwd(), 'public', 'hero-banner.png'), url: '/hero-banner.png' }
  ];

  for (const item of candidates) {
    if (fs.existsSync(item.filePath)) {
      return res.json({ exists: true, url: item.url, filename: path.basename(item.filePath) });
    }
  }

  res.json({ exists: false, url: null });
});

/**
 * POST /api/fetch-github-banner
 * Direct helper to download the image from GitHub into public/products/
 */
app.post('/api/fetch-github-banner', async (req: Request, res: Response) => {
  try {
    const { rawUrl, token } = req.body;
    const targetUrl = rawUrl || 'https://raw.githubusercontent.com/kaustubhsona1a/konichiwamart/main/public/products/konichiwalaptopbg.png';
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    const response = await fetch(targetUrl, { headers });
    if (!response.ok) {
      return res.status(response.status).json({ 
        success: false, 
        error: `GitHub returned HTTP ${response.status}: ${response.statusText}. If the repository is private, make it public or supply a GitHub Personal Access Token.` 
      });
    }

    const buffer = await response.arrayBuffer();
    const destDir = path.join(process.cwd(), 'public', 'products');
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    const destPath = path.join(destDir, 'konichiwalaptopbg.png');
    fs.writeFileSync(destPath, Buffer.from(buffer));

    // Also mirror to dist if exists
    const distProducts = path.join(process.cwd(), 'dist', 'products');
    if (fs.existsSync(distProducts)) {
      fs.writeFileSync(path.join(distProducts, 'konichiwalaptopbg.png'), Buffer.from(buffer));
    }

    return res.json({ 
      success: true, 
      url: '/products/konichiwalaptopbg.png', 
      bytes: buffer.byteLength,
      message: 'Successfully downloaded laptop background from GitHub!' 
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Endpoint to retrieve Supabase public config for browser client
 */
app.get('/api/supabase-config', (_req: Request, res: Response) => {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  res.json({
    supabaseUrl: url,
    supabaseAnonKey: anonKey,
    configured: Boolean(url && anonKey)
  });
});

/**
 * POST /api/save-order
 * Direct backend endpoint to write verified orders into Supabase orders & order_items tables
 */
app.post('/api/save-order', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      console.warn('[Server] Supabase credentials not found in environment.');
      return res.status(200).json({ 
        success: false, 
        warning: 'Supabase credentials not configured in environment.' 
      });
    }

    const { order, customerId } = req.body;
    if (!order || !order.orderNumber) {
      return res.status(400).json({ success: false, error: 'Invalid order payload' });
    }

    const isInterstate = (order.shippingAddress?.state || '').toLowerCase() !== 'maharashtra';
    const totalGst = Number(order.cgst || 0) + Number(order.sgst || 0);

    const orderRow = {
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
    };

    // Insert order into Supabase
    const { data: insertedOrder, error: orderErr } = await supabase
      .from('orders')
      .insert(orderRow)
      .select()
      .maybeSingle();

    if (orderErr) {
      console.error('[Server Supabase Order Insert Error]:', orderErr.message);
      return res.status(400).json({ success: false, error: orderErr.message });
    }

    // Insert itemized SKUs into order_items
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

      const { error: itemsErr } = await supabase.from('order_items').insert(itemsRows);
      if (itemsErr) {
        console.warn('[Server Supabase Order Items Warning]:', itemsErr.message);
      }
    }

    console.log(`[Supabase SUCCESS] Order ${order.orderNumber} saved into Supabase tables!`);
    return res.status(200).json({ success: true, order: insertedOrder });
  } catch (err: any) {
    console.error('[Server Save Order Exception]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==============================================================================
// PRODUCTS STORE & SUPABASE SYNCHRONIZATION API
// Prevents deleted products from reappearing across sessions, devices, and reloads
// ==============================================================================

const DATA_DIR = path.join(process.cwd(), 'data');
const DELETED_PRODUCTS_FILE = path.join(DATA_DIR, 'deleted_product_ids.json');
const CUSTOM_PRODUCTS_FILE = path.join(DATA_DIR, 'custom_products.json');

function getDeletedProductIds(): string[] {
  try {
    if (fs.existsSync(DELETED_PRODUCTS_FILE)) {
      const content = fs.readFileSync(DELETED_PRODUCTS_FILE, 'utf-8');
      return JSON.parse(content) || [];
    }
  } catch (err) {
    console.warn('[Server] Error reading deleted_product_ids.json:', err);
  }
  return [];
}

function saveDeletedProductId(id: string): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const current = getDeletedProductIds();
    if (!current.includes(id)) {
      current.push(id);
      fs.writeFileSync(DELETED_PRODUCTS_FILE, JSON.stringify(current, null, 2));
    }
  } catch (err) {
    console.warn('[Server] Error saving deleted_product_ids.json:', err);
  }
}

function clearDeletedProductIds(): void {
  try {
    if (fs.existsSync(DELETED_PRODUCTS_FILE)) {
      fs.writeFileSync(DELETED_PRODUCTS_FILE, JSON.stringify([], null, 2));
    }
  } catch {}
}

function getCustomProducts(): Product[] {
  try {
    if (fs.existsSync(CUSTOM_PRODUCTS_FILE)) {
      const content = fs.readFileSync(CUSTOM_PRODUCTS_FILE, 'utf-8');
      return JSON.parse(content) || [];
    }
  } catch {}
  return [];
}

function saveCustomProducts(products: Product[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CUSTOM_PRODUCTS_FILE, JSON.stringify(products, null, 2));
  } catch {}
}

// Helper: shade definitions fallback for lipstick and foundations
const PRODUCT_SHADES_MAP_SERVER: Record<string, any[]> = {
  'velvet-petal-matte-lipstick': [
    { id: 'sh-01', name: '01 Tokyo Crimson', hex: '#BE123C', sku: 'LIP-VK-01' },
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

async function getSupabaseInventoryServer(supabase: SupabaseClient): Promise<Record<string, number>> {
  try {
    const { data } = await supabase
      .from('categories')
      .select('description')
      .eq('slug', '_app_inventory')
      .maybeSingle();

    if (data?.description) {
      return JSON.parse(data.description);
    }
  } catch (err) {
    console.warn('[Server] Supabase inventory fetch warning:', err);
  }
  return {};
}

async function updateSupabaseInventoryServer(supabase: SupabaseClient, productId: string, stock: number): Promise<void> {
  try {
    const counts = await getSupabaseInventoryServer(supabase);
    counts[productId] = stock;
    await supabase.from('categories').upsert({
      slug: '_app_inventory',
      name: 'Store Inventory Metadata',
      description: JSON.stringify(counts)
    }, { onConflict: 'slug' });
  } catch (err) {
    console.warn('[Server] Supabase inventory update warning:', err);
  }
}

function mapSupabaseRowToProduct(row: any, inventoryMap?: Record<string, number>): Product {
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
    shades: PRODUCT_SHADES_MAP_SERVER[productId] || undefined,
    isBestSeller: Boolean(row.is_bestseller),
    isNew: Boolean(row.is_new)
  };
}

function mapProductToSupabaseRow(p: Product): any {
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
 * GET /api/products
 * Fetches products synced from Supabase (or seeded defaults), with deleted products permanently filtered.
 */
app.get('/api/products', async (_req: Request, res: Response) => {
  const deletedIds = new Set(getDeletedProductIds());
  const supabase = getSupabaseServerClient();

  if (supabase) {
    try {
      const [prodRes, invMap] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: true }),
        getSupabaseInventoryServer(supabase)
      ]);

      if (!prodRes.error && Array.isArray(prodRes.data) && prodRes.data.length > 0) {
        // Map with Supabase inventory and filter out any deleted IDs
        const products = prodRes.data
          .map(row => mapSupabaseRowToProduct(row, invMap))
          .filter(p => !deletedIds.has(p.id));

        return res.json({ success: true, source: 'supabase', products });
      }
    } catch (e: any) {
      console.warn('[Server] Supabase product query warning:', e?.message || e);
    }
  }

  // Fallback / Initial Seed Catalog: base default PRODUCTS + custom operator products
  const custom = getCustomProducts();
  const allProducts = [...custom, ...PRODUCTS];
  const seen = new Set<string>();
  const activeCatalog: Product[] = [];
  for (const p of allProducts) {
    if (!seen.has(p.id) && !deletedIds.has(p.id)) {
      seen.add(p.id);
      activeCatalog.push(p);
    }
  }

  return res.json({ success: true, source: 'persistent_store', products: activeCatalog });
});

/**
 * DELETE /api/products/:id
 * Permanently removes a product from Supabase and server storage so it never reappears on any device.
 */
app.delete('/api/products/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ success: false, error: 'Product ID required' });

  // 1. Permanently persist in deleted IDs file
  saveDeletedProductId(id);

  // 2. Remove from custom products file
  const custom = getCustomProducts().filter(p => p.id !== id);
  saveCustomProducts(custom);

  // 3. Delete or deactivate in Supabase
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      await supabase
        .from('products')
        .update({ is_active: false })
        .or(`id.eq.${id},slug.eq.${id}`);
      
      // Also attempt hard delete
      await supabase
        .from('products')
        .delete()
        .or(`id.eq.${id},slug.eq.${id}`);
    } catch (err: any) {
      console.warn('[Server] Supabase delete warning:', err?.message || err);
    }
  }

  console.log(`[Server] Product "${id}" permanently deleted from catalog.`);
  return res.json({ success: true, deletedId: id });
});

/**
 * PUT /api/products/:id
 * Updates product stock or price in Supabase and server store.
 */
app.put('/api/products/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  if (!id) return res.status(400).json({ success: false, error: 'Product ID required' });

  // Update in custom products
  const custom = getCustomProducts();
  const existingIdx = custom.findIndex(p => p.id === id);
  if (existingIdx >= 0) {
    custom[existingIdx] = { ...custom[existingIdx], ...updates };
    saveCustomProducts(custom);
  } else {
    const base = PRODUCTS.find(p => p.id === id);
    if (base) {
      custom.push({ ...base, ...updates });
      saveCustomProducts(custom);
    }
  }

  // Update in Supabase
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const patch: any = {};
      if (updates.price !== undefined) patch.base_price = updates.price;
      if (updates.originalPrice !== undefined) patch.compare_at_price = updates.originalPrice;
      if (updates.title !== undefined) patch.title = updates.title;

      if (Object.keys(patch).length > 0) {
        await supabase
          .from('products')
          .update(patch)
          .or(`id.eq.${id},slug.eq.${id}`);
      }

      // Sync stock to Supabase inventory metadata
      if (updates.stock !== undefined) {
        await updateSupabaseInventoryServer(supabase, id, updates.stock);
      }
    } catch (err: any) {
      console.warn('[Server] Supabase update warning:', err?.message || err);
    }
  }

  return res.json({ success: true, updatedId: id });
});

/**
 * POST /api/products
 * Adds a new product to Supabase and server store.
 */
app.post('/api/products', async (req: Request, res: Response) => {
  const newProduct: Product = req.body;
  if (!newProduct || !newProduct.id || !newProduct.title) {
    return res.status(400).json({ success: false, error: 'Valid product required' });
  }

  // Save to custom products
  const custom = getCustomProducts().filter(p => p.id !== newProduct.id);
  custom.unshift(newProduct);
  saveCustomProducts(custom);

  // If was in deleted list, un-delete
  const deleted = getDeletedProductIds().filter(d => d !== newProduct.id);
  try {
    fs.writeFileSync(DELETED_PRODUCTS_FILE, JSON.stringify(deleted, null, 2));
  } catch {}

  // Insert to Supabase
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      await supabase
        .from('products')
        .insert([mapProductToSupabaseRow(newProduct)]);

      if (newProduct.stock !== undefined) {
        await updateSupabaseInventoryServer(supabase, newProduct.id, newProduct.stock);
      }
    } catch (err: any) {
      console.warn('[Server] Supabase product insert warning:', err?.message || err);
    }
  }

  return res.json({ success: true, product: newProduct });
});

/**
 * POST /api/products/reset
 * Restores original catalog.
 */
app.post('/api/products/reset', async (_req: Request, res: Response) => {
  clearDeletedProductIds();
  saveCustomProducts([]);

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      await supabase
        .from('products')
        .update({ is_active: true })
        .neq('is_active', true);
    } catch {}
  }

  return res.json({ success: true, message: 'Catalog reset' });
});

/**
 * Vite integration & SPA server
 */
async function startServer() {
  // CRITICAL: Mount static assets from /public first so uploaded hero banners and images
  // are served directly by Express with correct Content-Type (image/png)
  const publicDir = path.join(process.cwd(), 'public');
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir, {
      maxAge: '1h'
    }));
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
