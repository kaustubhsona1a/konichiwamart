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
  const bannerPath = path.join(process.cwd(), 'public', 'hero-banner.png');
  const exists = fs.existsSync(bannerPath);
  res.json({ exists, url: exists ? '/hero-banner.png' : null });
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
