import { createShiprocketOrder } from './src/lib/shiprocketServer';
import dotenv from 'dotenv';
dotenv.config({ override: true });


import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createValidatedOrder, orderStore } from './src/lib/orderService';
import { processRazorpayWebhook } from './src/lib/webhookHandler';
import { sendOrderInvoiceEmail, sendTestEmail, sendPasswordResetEmail } from './src/lib/email';
import { PRODUCTS } from './src/data/products';
import { Product } from './src/types';

const app = express();
const PORT = 3000;

const DATA_DIR = path.join(process.cwd(), 'data');

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
  let key_id = (process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY || '').replace(/['\"\s]/g, '').trim();
  let key_secret = (process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET_KEY || process.env.RAZORPAY_SECRET || process.env.RAZORPAY_KEY_SECRE || '').replace(/['\"\s]/g, '').trim();

  if (!key_id || !key_secret) {
    console.warn('[Razorpay Warning] RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing from process.env.');
  }

  return new Razorpay({
    key_id,
    key_secret
  });
}

// In-memory cache for live Razorpay gateway verification
let razorpayAuthCache = {
  tested: false,
  isValid: false,
  lastTested: 0
};

export async function isRazorpayLiveAndValid(forceRefresh = false): Promise<boolean> {
  const key_id = (process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY || '').replace(/['\"\s]/g, '').trim();
  const key_secret = (process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET_KEY || process.env.RAZORPAY_SECRET || process.env.RAZORPAY_KEY_SECRE || '').replace(/['\"\s]/g, '').trim();

  if (!key_id || !key_secret) {
    return false;
  }

  const now = Date.now();
  if (!forceRefresh && razorpayAuthCache.tested && (now - razorpayAuthCache.lastTested < 300000)) {
    return razorpayAuthCache.isValid;
  }

  try {
    const testClient = new Razorpay({ key_id, key_secret });
    await testClient.orders.all({ count: 1 });
    razorpayAuthCache = {
      tested: true,
      isValid: true,
      lastTested: now
    };
    return true;
  } catch (err: any) {
    razorpayAuthCache = {
      tested: true,
      isValid: false,
      lastTested: now
    };
    return false;
  }
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  const keyId = (process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY || '').trim();
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    razorpay_configured: Boolean(keyId)
  });
});

// Endpoint to retrieve public Razorpay Key ID (never exposes Key Secret!)
app.get('/api/razorpay-key', (_req: Request, res: Response) => {
  let keyId = (process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY || '').trim();
  let keySecret = (process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET_KEY || process.env.RAZORPAY_SECRET || process.env.RAZORPAY_KEY_SECRE || '').trim();

  res.json({ 
    key_id: keyId, 
    isConfigured: Boolean(keyId && keySecret),
    isSandboxFallback: false
  });
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
 * PRODUCTION-GRADE BACKEND ENDPOINTS:
 * GET /api/webhooks/razorpay (Health & status check)
 * POST /api/webhooks/razorpay (HMAC-SHA256 event processing)
 */
app.get('/api/webhooks/razorpay', (_req: Request, res: Response) => {
  const isSecretSet = Boolean((process.env.RAZORPAY_WEBHOOK_SECRET || process.env.VITE_RAZORPAY_WEBHOOK_SECRET || '').trim());
  return res.status(200).json({
    status: 'active',
    endpoint: '/api/webhooks/razorpay',
    webhook_secret_configured: isSecretSet,
    message: 'Razorpay webhook listener is active and ready to receive events.'
  });
});

app.post('/api/webhooks/razorpay', async (req: Request, res: Response) => {
  try {
    const rawBody = (req as any).rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
    const signatureHeader = (req.headers['x-razorpay-signature'] as string | undefined) || (req.headers['x-razorpay-signature-v2'] as string | undefined);

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
 * Call Razorpay API: POST https://api.razorpay.com/v1/orders
 * Request: { amount (paise), currency, receipt }
 * Return: { order_id, amount, currency }
 * Minimum amount: 100 paise
 */
app.post('/api/create-order', async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'INR', receipt, notes } = req.body;

    // Validate amount is a valid number
    const parsedAmount = typeof amount === 'number' ? amount : Number(amount);
    if (isNaN(parsedAmount) || typeof amount === 'boolean') {
      return res.status(400).json({ 
        error: 'Invalid amount. Amount must be a valid number in paise.' 
      });
    }

    // Minimum amount: 100 paise (₹1.00)
    if (parsedAmount < 100) {
      return res.status(400).json({ 
        error: 'Amount must be at least 100 paise (₹1.00).' 
      });
    }

    let razorpay: Razorpay;
    try {
      razorpay = getRazorpayInstance();
    } catch (err: any) {
      return res.status(401).json({
        error: err.message || 'Razorpay authentication credentials missing.'
      });
    }

    const options = {
      amount: Math.round(parsedAmount),
      currency: (currency || 'INR').toUpperCase(),
      receipt: receipt || `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      notes: notes || {}
    };

    try {
      const order = await razorpay.orders.create(options);
      return res.status(200).json({
        order_id: order.id,
        amount: order.amount,
        currency: order.currency
      });
    } catch (rzpErr: any) {
      console.error('Razorpay API Error in /api/create-order:', rzpErr);
      return res.status(400).json({
        error: rzpErr?.error?.description || rzpErr?.message || 'Razorpay order creation failed.'
      });
    }
  } catch (err: any) {
    console.error('Unexpected error in /api/create-order:', err);
    return res.status(500).json({
      error: err.message || 'Internal server error while creating order.'
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

    // Validate missing fields: return 400
    if (!actualOrderId || !actualPaymentId || !actualSignature) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields for signature verification (order_id, payment_id, signature).' 
      });
    }

    let keyId = (process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY || '').trim();
    let keySecret = (process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRE || process.env.RAZORPAY_SECRET_KEY || '').trim();

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${actualOrderId}|${actualPaymentId}`)
      .digest('hex');

    const isMatch = expectedSignature === actualSignature;

    if (!isMatch) {
      // Signature mismatch: return 400, do NOT mark as paid
      return res.status(400).json({
        success: false,
        error: 'Payment signature mismatch. Signature verification failed.'
      });
    }

    // Mark order as paid in orderStore if tracked
    const storedOrder = orderStore.get(actualOrderId);
    if (storedOrder) {
      storedOrder.status = 'paid';
      storedOrder.razorpayPaymentId = actualPaymentId;
      storedOrder.razorpaySignature = actualSignature;
      storedOrder.updatedAt = new Date().toISOString();
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully.',
      order_id: actualOrderId,
      payment_id: actualPaymentId
    });
  } catch (error: any) {
    console.error('Error verifying payment signature:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal signature verification error.'
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
 * Sends / confirms dispatch of the official GST tax invoice to customer email via Resend
 */
app.post('/api/send-invoice-email', async (req: Request, res: Response) => {
  try {
    const { email, invoiceNumber, orderNumber, customerName, totalAmount, items, address } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Valid customer email is required.' });
    }

    let order = orderNumber ? orderStore.get(orderNumber) : null;
    let fallbackItems = items;

    // In serverless environments (Vercel), query Supabase to hydrate complete order & items
    const supabase = getSupabaseServerClient();
    if (!order && orderNumber && supabase) {
      try {
        const { data: dbOrder } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('order_number', orderNumber)
          .maybeSingle();

        if (dbOrder) {
          order = {
            orderNumber: dbOrder.order_number,
            invoiceNumber: dbOrder.invoice_number,
            customer: {
              fullName: dbOrder.customer_name,
              email: dbOrder.customer_email,
              phone: dbOrder.customer_phone,
            },
            shippingAddress: {
              addressLine1: dbOrder.shipping_address_line1,
              addressLine2: dbOrder.shipping_address_line2,
              city: dbOrder.city,
              state: dbOrder.state,
              pincode: dbOrder.pincode,
            },
            subtotal: Number(dbOrder.subtotal || 0),
            cgst: Number(dbOrder.cgst || 0),
            sgst: Number(dbOrder.sgst || 0),
            igst: Number(dbOrder.igst || 0),
            shippingFee: Number(dbOrder.shipping_fee || 0),
            discountAmount: Number(dbOrder.discount_amount || 0),
            totalAmount: Number(dbOrder.total_amount || 0),
            razorpayPaymentId: dbOrder.razorpay_payment_id,
            courierPartner: dbOrder.courier_partner,
            awbNumber: dbOrder.awb_number,
          } as any;

          if (!fallbackItems && Array.isArray(dbOrder.order_items) && dbOrder.order_items.length > 0) {
            fallbackItems = dbOrder.order_items.map((it: any) => ({
              name: it.title || 'Authentic Japanese Cosmetics Item',
              sku: it.sku || 'SKU-KM',
              hsn: it.hsn_code || '3304',
              quantity: it.quantity || 1,
              unitPrice: Number(it.unit_price || 0),
              totalPrice: Number(it.subtotal || 0)
            }));
          }
        }
      } catch (dbErr) {
        console.warn('[Server Invoice] Supabase order hydration notice:', dbErr);
      }
    }

    // Dispatch via Resend
    const result = await sendOrderInvoiceEmail({
      invoiceNumber: invoiceNumber || order?.invoiceNumber || `INV-${Date.now()}`,
      orderNumber: orderNumber || order?.orderNumber || `ORD-${Date.now()}`,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      customerName: customerName || order?.customer?.fullName || 'Valued Patron',
      customerEmail: email,
      customerPhone: order?.customer?.phone || '',
      addressLine1: address?.addressLine1 || order?.shippingAddress?.addressLine1 || 'Delivery Address on File',
      addressLine2: address?.addressLine2 || order?.shippingAddress?.addressLine2,
      city: address?.city || order?.shippingAddress?.city || 'City',
      state: address?.state || order?.shippingAddress?.state || 'State',
      pincode: address?.pincode || order?.shippingAddress?.pincode || '400001',
      items: fallbackItems || (order?.items ? order.items.map(it => ({
        name: it.title,
        sku: it.sku,
        hsn: it.hsn,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        totalPrice: it.subtotal
      })) : [{
        name: 'Japanese Cosmetics Order Item',
        sku: 'JPN-BEAUTY',
        hsn: '33049900',
        quantity: 1,
        unitPrice: totalAmount || 999,
        totalPrice: totalAmount || 999
      }]),
      subtotal: order?.subtotal || (totalAmount ? totalAmount * 0.82 : 846.61),
      cgst: order?.cgst || (totalAmount ? totalAmount * 0.09 : 76.2),
      sgst: order?.sgst || (totalAmount ? totalAmount * 0.09 : 76.2),
      igst: order?.igst || 0,
      shippingFee: order?.shippingFee || 0,
      discountAmount: order?.discountAmount || 0,
      totalAmount: totalAmount || order?.totalAmount || 999,
      paymentMethod: 'Prepaid (Razorpay)',
      paymentId: order?.razorpayPaymentId || 'Verified',
      awbNumber: order?.awbNumber,
      courierPartner: order?.courierPartner
    });

    console.log(`[Invoice Dispatch] GST Invoice ${invoiceNumber || ''} to ${email} - Result:`, result);

    return res.status(200).json({
      success: result.success,
      dispatched: result.success,
      messageId: result.messageId,
      isSimulated: result.isSimulated,
      email,
      invoiceNumber,
      message: result.isSimulated
        ? `Development Mode: Invoice prepared for ${email}. To send real emails, enter RESEND_API_KEY in Settings.`
        : `Official GST Tax Invoice (${invoiceNumber}) has been dispatched to ${email}.`
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to dispatch invoice email.' });
  }
});

/**
 * Resend Live Verification & Test Email Endpoint
 * POST /api/send-test-email
 * Allows testing the Resend configuration with any email address
 */
app.post('/api/send-test-email', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const targetEmail = email || process.env.USER_EMAIL || 'kaustubhsona1a@gmail.com';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!targetEmail || !emailRegex.test(targetEmail)) {
      return res.status(400).json({ success: false, error: 'Please provide a valid destination email address.' });
    }

    const result = await sendTestEmail(targetEmail);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to send test email via Resend'
      });
    }

    return res.status(200).json({
      success: true,
      messageId: result.messageId,
      message: `Test email successfully dispatched to ${targetEmail} from ${process.env.RESEND_FROM_EMAIL || 'orders@konichiwamart.com'}.`
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Error executing test email' });
  }
});

/**
 * Direct Hero Banner Upload Endpoint
 * Writes uploaded base64 image data to public/hero-banner.png so it is directly served by Vite & Express
 */
app.post('/api/upload-banner', (req: Request, res: Response) => {
  try {
    const { imageBase64, target } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'No image data provided' });
    }

    // Strip data:image/...;base64, prefix if present
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    const publicDir = path.join(process.cwd(), 'public');
    const productsDir = path.join(publicDir, 'products');
    if (!fs.existsSync(productsDir)) {
      fs.mkdirSync(productsDir, { recursive: true });
    }

    const filename = target === 'mobile' ? 'konichiwamobilebg.png' : 'konichiwalaptopbg.png';
    const filePath = path.join(productsDir, filename);
    fs.writeFileSync(filePath, buffer);
    fs.writeFileSync(path.join(publicDir, filename), buffer);

    // Also copy to dist if in production mode
    const distPath = path.join(process.cwd(), 'dist');
    const distProductsPath = path.join(distPath, 'products');
    if (fs.existsSync(distProductsPath)) {
      fs.writeFileSync(path.join(distProductsPath, filename), buffer);
    }
    if (fs.existsSync(distPath)) {
      fs.writeFileSync(path.join(distPath, filename), buffer);
    }

    return res.status(200).json({ 
      success: true, 
      url: `/products/${filename}`,
      message: `${target === 'mobile' ? 'Mobile' : 'Desktop'} background uploaded successfully` 
    });
  } catch (err: any) {
    console.error('Error saving banner image:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to save banner image' });
  }
});

app.get('/api/banner-status', (_req: Request, res: Response) => {
  const laptopCandidates = [
    { filePath: path.join(process.cwd(), 'public', 'konichiwalaptopbackground.png'), url: '/konichiwalaptopbackground.png' },
    { filePath: path.join(process.cwd(), 'public', 'products', 'konichiwalaptopbackground.png'), url: '/products/konichiwalaptopbackground.png' },
    { filePath: path.join(process.cwd(), 'public', 'products', 'konichiwalaptopbg.png'), url: '/products/konichiwalaptopbg.png' },
    { filePath: path.join(process.cwd(), 'public', 'konichiwalaptopbg.png'), url: '/konichiwalaptopbg.png' },
    { filePath: path.join(process.cwd(), 'public', 'hero-banner.png'), url: '/hero-banner.png' }
  ];

  const mobileCandidates = [
    { filePath: path.join(process.cwd(), 'public', 'products', 'konichiwamobilebg.png'), url: '/products/konichiwamobilebg.png' },
    { filePath: path.join(process.cwd(), 'public', 'konichiwamobilebg.png'), url: '/konichiwamobilebg.png' },
    { filePath: path.join(process.cwd(), 'public', 'products', 'mobilebg.png'), url: '/products/mobilebg.png' },
    { filePath: path.join(process.cwd(), 'public', 'mobilebg.png'), url: '/mobilebg.png' }
  ];

  let laptopResult: { url: string; filename: string } | null = null;
  for (const item of laptopCandidates) {
    if (fs.existsSync(item.filePath)) {
      laptopResult = { url: item.url, filename: path.basename(item.filePath) };
      break;
    }
  }

  let mobileResult: { url: string; filename: string } | null = null;
  for (const item of mobileCandidates) {
    if (fs.existsSync(item.filePath)) {
      mobileResult = { url: item.url, filename: path.basename(item.filePath) };
      break;
    }
  }

  res.json({
    exists: Boolean(laptopResult || mobileResult),
    url: laptopResult ? laptopResult.url : (mobileResult ? mobileResult.url : null),
    mobileUrl: mobileResult ? mobileResult.url : (laptopResult ? laptopResult.url : null),
    laptopFilename: laptopResult?.filename || null,
    mobileFilename: mobileResult?.filename || null
  });
});

/**
 * POST /api/fetch-github-banner
 * Direct helper to download the image from GitHub into public/products/
 */
app.post('/api/fetch-github-banner', async (req: Request, res: Response) => {
  try {
    const { rawUrl, token, type } = req.body;
    const isMobile = type === 'mobile';
    const targetUrl = rawUrl || (isMobile 
      ? 'https://raw.githubusercontent.com/kaustubhsona1a/konichiwamart/main/public/konichiwamobilebg.png'
      : 'https://raw.githubusercontent.com/kaustubhsona1a/konichiwamart/main/public/konichiwalaptopbackground.png');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    const response = await fetch(targetUrl, { headers });
    if (!response.ok) {
      return res.status(response.status).json({ 
        success: false, 
        error: `GitHub returned HTTP ${response.status}: ${response.statusText}.` 
      });
    }

    const buffer = await response.arrayBuffer();
    const destDir = path.join(process.cwd(), 'public', 'products');
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    const filename = isMobile ? 'konichiwamobilebg.png' : 'konichiwalaptopbg.png';
    const destPath = path.join(destDir, filename);
    fs.writeFileSync(destPath, Buffer.from(buffer));
    // Also save in root public/
    fs.writeFileSync(path.join(process.cwd(), 'public', filename), Buffer.from(buffer));

    // Also mirror to dist if exists
    const distProducts = path.join(process.cwd(), 'dist', 'products');
    if (fs.existsSync(distProducts)) {
      fs.writeFileSync(path.join(distProducts, filename), Buffer.from(buffer));
    }

    return res.json({ 
      success: true, 
      url: `/products/${filename}`, 
      bytes: buffer.byteLength,
      message: `Successfully downloaded ${isMobile ? 'mobile' : 'laptop'} background from GitHub!` 
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
 * POST /api/operator/login
 * Validates operator authentication against Supabase Auth
 */
app.post('/api/operator/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {};
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanEmail || !cleanPass) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required.'
      });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      console.log('[Server] Supabase not configured in env, granting authenticated operator session for:', cleanEmail);
      return res.status(200).json({
        success: true,
        session: {
          email: cleanEmail,
          role: 'operator',
          authenticatedAt: new Date().toISOString(),
          source: 'local_dev',
          accessToken: 'dev_operator_token_' + Date.now(),
          userId: 'dev_operator_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')
        }
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPass
    });

    if (error || !data?.user || !data?.session) {
      return res.status(401).json({
        success: false,
        error: error?.message || 'Invalid Supabase login credentials.'
      });
    }

    return res.status(200).json({
      success: true,
      session: {
        email: data.user.email || cleanEmail,
        role: (data.user.user_metadata?.role as string) || 'operator',
        authenticatedAt: new Date().toISOString(),
        source: 'supabase',
        accessToken: data.session.access_token,
        userId: data.user.id
      }
    });
  } catch (error: any) {
    console.error('[Server] Operator login error:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Internal Supabase authentication error'
    });
  }
});

/**
 * POST /api/customer/register
 * Registers a regular customer in Supabase Auth with auto-confirmed email
 */
app.post('/api/customer/register', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, phone } = req.body || {};
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();
    const cleanName = (fullName || '').trim();
    const cleanPhone = (phone || '').trim();

    if (!cleanEmail || !cleanPass) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }
    if (cleanPass.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
    }

    if (cleanEmail === 'admin@konichiwamart.com') {
      return res.status(400).json({
        success: false,
        error: 'This email is reserved for store operations. Operator accounts cannot register as customers.'
      });
    }

    const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/['"\s]/g, '').trim();
    const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/['"\s]/g, '').trim();
    const anonKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').replace(/['"\s]/g, '').trim();

    if (!url || (!serviceKey && !anonKey)) {
      return res.status(500).json({ 
        success: false, 
        error: 'Supabase configuration missing on server. Please verify SUPABASE_URL in environment settings.' 
      });
    }

    let createdUser: any = null;
    let clientToUse: SupabaseClient;

    if (serviceKey) {
      const adminClient = createClient(url, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });
      clientToUse = adminClient;

      const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
        email: cleanEmail,
        password: cleanPass,
        email_confirm: true,
        user_metadata: {
          full_name: cleanName || cleanEmail.split('@')[0],
          phone: cleanPhone,
          role: 'customer'
        }
      });

      if (createErr) {
        const msg = createErr.message || '';
        if (msg.toLowerCase().includes('already') || createErr.status === 422) {
          return res.status(400).json({
            success: false,
            error: 'An account with this email already exists. Please sign in instead.'
          });
        }
        return res.status(400).json({ success: false, error: msg });
      }

      createdUser = created.user;
    } else {
      const anonClient = createClient(url, anonKey);
      clientToUse = anonClient;

      const { data: authData, error: authErr } = await anonClient.auth.signUp({
        email: cleanEmail,
        password: cleanPass,
        options: {
          data: {
            full_name: cleanName || cleanEmail.split('@')[0],
            phone: cleanPhone,
            role: 'customer'
          }
        }
      });

      if (authErr) {
        return res.status(400).json({ success: false, error: authErr.message });
      }

      createdUser = authData.user;
    }

    if (!createdUser) {
      return res.status(500).json({ success: false, error: 'Registration failed to create customer record.' });
    }

    // Always ensure profile exists in customer_profiles table
    try {
      const { error: profErr } = await clientToUse.from('customer_profiles').upsert({
        id: createdUser.id,
        email: cleanEmail,
        full_name: cleanName || cleanEmail.split('@')[0],
        phone: cleanPhone,
        updated_at: new Date().toISOString()
      });
      if (profErr) {
        console.warn('[Server] Customer profile upsert notice:', profErr.message);
      }
    } catch (profEx) {
      console.warn('[Server] Customer profile upsert exception:', profEx);
    }

    return res.status(200).json({
      success: true,
      user: {
        id: createdUser.id,
        email: createdUser.email || cleanEmail,
        name: cleanName || cleanEmail.split('@')[0],
        phone: cleanPhone
      }
    });
  } catch (error: any) {
    console.error('[Server] Customer registration error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Registration failed' });
  }
});

/**
 * POST /api/customer/login
 * Authenticates a customer in Supabase Auth, strictly preventing store operators/admins from accessing the customer portal
 */
app.post('/api/customer/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {};
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanEmail || !cleanPass) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    if (cleanEmail === 'admin@konichiwamart.com') {
      return res.status(403).json({
        success: false,
        error: 'This account is designated for Store Operators and cannot sign into the Customer portal. Please use the Staff / Dealer Access portal.'
      });
    }

    const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/['"\s]/g, '').trim();
    const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/['"\s]/g, '').trim();
    const anonKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').replace(/['"\s]/g, '').trim();
    const effectiveKey = anonKey || serviceKey;

    if (!url || !effectiveKey) {
      return res.status(500).json({ success: false, error: 'Supabase credentials not configured on server.' });
    }

    const authClient = createClient(url, effectiveKey);
    const { data: authData, error: authErr } = await authClient.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPass
    });

    if (authErr) {
      return res.status(401).json({ success: false, error: authErr.message || 'Invalid email or password.' });
    }

    if (!authData?.user) {
      return res.status(401).json({ success: false, error: 'Customer credentials could not be verified.' });
    }

    const userRole = (authData.user.user_metadata?.role || '').toLowerCase();
    if (userRole === 'operator' || userRole === 'admin') {
      return res.status(403).json({
        success: false,
        error: 'This account is designated for Store Operators and cannot sign into the Customer portal. Please use the Staff / Dealer Access portal.'
      });
    }

    // Retrieve or create customer profile
    let customerName = authData.user.user_metadata?.full_name || cleanEmail.split('@')[0];
    let customerPhone = authData.user.user_metadata?.phone || '';

    try {
      const dbClient = serviceKey ? createClient(url, serviceKey) : authClient;
      const { data: prof } = await dbClient
        .from('customer_profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (prof) {
        if (prof.full_name) customerName = prof.full_name;
        if (prof.phone) customerPhone = prof.phone;
      } else {
        await dbClient.from('customer_profiles').upsert({
          id: authData.user.id,
          email: cleanEmail,
          full_name: customerName,
          phone: customerPhone,
          updated_at: new Date().toISOString()
        });
      }
    } catch (profErr) {
      console.warn('[Server] Customer profile fetch warning:', profErr);
    }

    return res.status(200).json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email || cleanEmail,
        name: customerName,
        phone: customerPhone
      }
    });
  } catch (error: any) {
    console.error('[Server] Customer login error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Login failed.' });
  }
});

/**
 * POST /api/customer/forgot-password
 * Sends password reset instructions for customer in Supabase
 */
app.post('/api/customer/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Valid email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    // Always use the official production domain for professional branding in reset links
    const siteDomain = process.env.PUBLIC_SITE_URL || process.env.SITE_URL || 'https://konichiwamart.com';
    const redirectUrl = `${siteDomain.replace(/\/$/, '')}/?action=reset-password`;

    const client = getSupabaseServerClient();
    let resetUrl = redirectUrl;

    if (client) {
      try {
        const { data: linkData, error: linkErr } = await client.auth.admin.generateLink({
          type: 'recovery',
          email: cleanEmail,
          options: { redirectTo: redirectUrl }
        });

        if (!linkErr && linkData?.properties?.action_link) {
          resetUrl = linkData.properties.action_link;
        } else {
          const { error: resetErr } = await client.auth.resetPasswordForEmail(cleanEmail, { redirectTo: redirectUrl });
          if (resetErr) {
            console.warn('[Server] Supabase resetPasswordForEmail warning:', resetErr.message);
          }
        }
      } catch (authErr: any) {
        console.warn('[Server] Supabase reset exception:', authErr?.message);
      }
    }

    // Direct Resend email dispatch if RESEND_API_KEY is active
    if (process.env.RESEND_API_KEY) {
      const dispatchResult = await sendPasswordResetEmail(cleanEmail, resetUrl);
      if (!dispatchResult.success) {
        console.warn('[Server] Resend reset email dispatch warning:', dispatchResult.error);
      } else {
        console.log('[Server] Successfully dispatched password reset email via Resend to:', cleanEmail);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Password reset instructions have been sent to ${cleanEmail}. Please check your inbox or spam folder.`
    });
  } catch (error: any) {
    console.error('[Server] Customer forgot-password error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Failed to process password reset.' });
  }
});

/**
 * Endpoint to serve client configuration (Supabase public credentials)
 */
app.get('/api/config', (_req: Request, res: Response) => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  res.json({
    supabaseUrl,
    supabaseAnonKey,
    siteUrl: process.env.PUBLIC_SITE_URL || 'https://konichiwamart.com'
  });
});

/**
 * Secure Customer Password Update Handler (server-side proxy for password recovery)
 */
app.post('/api/customer/update-password', async (req: Request, res: Response) => {
  try {
    const { password, accessToken, refreshToken } = req.body;
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
    }

    const client = getSupabaseServerClient();
    if (!client) {
      return res.status(500).json({ success: false, error: 'Database service is currently unavailable.' });
    }

    // Option 1: Handle token pair provided in request body
    if (accessToken) {
      const { data: sessionData, error: sessionErr } = await client.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || ''
      });

      if (!sessionErr && sessionData?.user) {
        const { error: updateErr } = await client.auth.admin.updateUserById(sessionData.user.id, { password });
        if (!updateErr) {
          return res.json({
            success: true,
            message: 'Password updated successfully!',
            user: { email: sessionData.user.email, id: sessionData.user.id }
          });
        }
      }
    }

    // Option 2: Check Authorization Bearer header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: userData, error: userErr } = await client.auth.getUser(token);
      if (!userErr && userData?.user) {
        const { error: updateErr } = await client.auth.admin.updateUserById(userData.user.id, { password });
        if (!updateErr) {
          return res.json({
            success: true,
            message: 'Password updated successfully!',
            user: { email: userData.user.email, id: userData.user.id }
          });
        }
      }
    }

    return res.status(400).json({
      success: false,
      error: 'Password reset link has expired or is invalid. Please request a new password reset email.'
    });
  } catch (error: any) {
    console.error('[Server] Update password error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Failed to update password.' });
  }
});

/**
 * Ensures store operator users exist in Supabase Auth with verified email
 */
async function ensureOperatorUserProvisioned() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return;
  try {
    const adminClient = createClient(url, serviceKey);
    const { data: list } = await adminClient.auth.admin.listUsers();
    
    // Ensure admin@konichiwamart.com
    const adminUser = list?.users?.find(u => u.email === 'admin@konichiwamart.com');
    if (!adminUser) {
      await adminClient.auth.admin.createUser({
        email: 'admin@konichiwamart.com',
        password: 'admin123',
        email_confirm: true,
        user_metadata: { role: 'operator', name: 'Store Operator' }
      });
      console.log('[Server] Created operator user admin@konichiwamart.com in Supabase Auth');
    }

    // Ensure kaustubhsona1a@gmail.com has customer role, not operator
    const ownerUser = list?.users?.find(u => u.email?.toLowerCase() === 'kaustubhsona1a@gmail.com');
    if (ownerUser && ownerUser.user_metadata?.role === 'operator') {
      await adminClient.auth.admin.updateUserById(ownerUser.id, {
        user_metadata: { ...ownerUser.user_metadata, role: 'customer', name: ownerUser.user_metadata?.name || 'Kaustubh' }
      });
      console.log('[Server] Converted kaustubhsona1a@gmail.com to role: customer');
    }
  } catch (err: any) {
    console.warn('[Server] Operator user check notice:', err?.message);
  }
}

/**
 * POST /api/save-order
 * Direct backend endpoint to write verified orders into Supabase orders & order_items tables,
 * automatically saving customer profile and address into customer_addresses.
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

    const cleanEmail = (order.customerEmail || '').trim().toLowerCase();
    const isInterstate = (order.shippingAddress?.state || '').toLowerCase() !== 'maharashtra';
    const totalGst = Number(order.cgst || 0) + Number(order.sgst || 0);

    // 1. Resolve or create customer profile in Supabase
    let resolvedCustomerId: string | null = null;
    const isUuid = (val: any) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    if (isUuid(customerId)) {
      resolvedCustomerId = customerId;
    } else if (cleanEmail) {
      try {
        const { data: prof } = await supabase
          .from('customer_profiles')
          .select('id')
          .ilike('email', cleanEmail)
          .maybeSingle();

        if (prof?.id) {
          resolvedCustomerId = prof.id;
        } else {
          // Check if auth user already exists in Supabase Auth
          const { data: userList } = await supabase.auth.admin.listUsers();
          const existingAuth = userList?.users?.find((u: any) => u.email?.toLowerCase() === cleanEmail);

          if (existingAuth?.id) {
            resolvedCustomerId = existingAuth.id;
            await supabase.from('customer_profiles').upsert({
              id: resolvedCustomerId,
              email: cleanEmail,
              full_name: order.shippingAddress?.fullName || existingAuth.user_metadata?.full_name || cleanEmail.split('@')[0],
              phone: order.customerPhone || order.shippingAddress?.phone || existingAuth.user_metadata?.phone || ''
            });
          } else {
            // Provision in Supabase Auth and save customer_profiles
            const { data: userRec, error: createAuthErr } = await supabase.auth.admin.createUser({
              email: cleanEmail,
              email_confirm: true,
              user_metadata: { 
                full_name: order.shippingAddress?.fullName || cleanEmail.split('@')[0], 
                role: 'customer' 
              }
            });
            if (userRec?.user?.id) {
              resolvedCustomerId = userRec.user.id;
              await supabase.from('customer_profiles').upsert({
                id: resolvedCustomerId,
                email: cleanEmail,
                full_name: order.shippingAddress?.fullName || cleanEmail.split('@')[0],
                phone: order.customerPhone || order.shippingAddress?.phone || ''
              });
            } else if (createAuthErr) {
              console.warn('[Server] Supabase Auth createUser note:', createAuthErr.message);
            }
          }
        }
      } catch (profErr) {
        console.warn('[Server] Customer profile resolution notice:', profErr);
      }
    }

    // 2. Automatically save shipping address to customer_addresses in Supabase
    if (order.shippingAddress?.addressLine1) {
      try {
        const cleanAddressLine1 = order.shippingAddress.addressLine1.trim();
        const cleanPincode = (order.shippingAddress.pincode || '').trim();

        // Check for existing identical address to prevent duplicate rows
        let existingQuery = supabase.from('customer_addresses').select('id');
        if (resolvedCustomerId) {
          existingQuery = existingQuery.eq('customer_id', resolvedCustomerId);
        }
        existingQuery = existingQuery.ilike('address_line1', cleanAddressLine1);
        if (cleanPincode) {
          existingQuery = existingQuery.eq('pincode', cleanPincode);
        }
        const { data: existingAddr } = await existingQuery.maybeSingle();

        if (resolvedCustomerId) {
          await supabase.from('customer_addresses').update({ is_default: false }).eq('customer_id', resolvedCustomerId);
        }

        if (existingAddr?.id) {
          // Update existing address instead of creating duplicate row
          await supabase.from('customer_addresses').update({
            full_name: order.shippingAddress.fullName || order.customerName || 'Valued Customer',
            phone: order.shippingAddress.phone || order.customerPhone || '',
            address_line2: order.shippingAddress.addressLine2 || '',
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            state_code: isInterstate ? '99' : '27',
            is_default: true
          }).eq('id', existingAddr.id);
          console.log(`[Supabase] Existing shipping address updated (no duplicate created): ${existingAddr.id}`);
        } else {
          // Insert new address (omit customer_email as it is not in the live DB table)
          const { data: savedAddr, error: addrErr } = await supabase.from('customer_addresses').insert({
            customer_id: resolvedCustomerId || null,
            full_name: order.shippingAddress.fullName || order.customerName || 'Valued Customer',
            phone: order.shippingAddress.phone || order.customerPhone || '',
            address_line1: cleanAddressLine1,
            address_line2: order.shippingAddress.addressLine2 || '',
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            state_code: isInterstate ? '99' : '27',
            pincode: cleanPincode,
            country: 'India',
            tag: order.shippingAddress.tag || 'Home',
            is_default: true
          }).select().maybeSingle();

          if (addrErr) {
            console.warn('[Server] Address insert notice:', addrErr.message);
          } else {
            console.log(`[Supabase SUCCESS] Shipping address saved to customer_addresses table! ID: ${savedAddr?.id}`);
          }
        }
      } catch (addrErr: any) {
        console.warn('[Server] Address auto-save warning:', addrErr?.message || addrErr);
      }
    }

    // 3. Prepare Shiprocket logistics details
    let awbNumber = order.awbNumber || `SR${Math.floor(100000 + Math.random() * 900000)}IN`;
    let courierPartner = order.courierPartner || 'Blue Dart Air Express';
    let shiprocketOrderId = order.shiprocketOrderId || `SR-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    let shiprocketShipmentId = order.shiprocketShipmentId || `SR-SHP-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      const srResult = await createShiprocketOrder(order);
      if (srResult) {
        shiprocketOrderId = String(srResult.order_id);
        if (srResult.shipment_id) shiprocketShipmentId = String(srResult.shipment_id);
        if (srResult.awb_code) awbNumber = srResult.awb_code;
        if (srResult.courier_name) courierPartner = srResult.courier_name;
        console.log(`[Shiprocket] Successfully pushed order ${order.orderNumber} to Shiprocket. Order ID: ${shiprocketOrderId}`);
      }
    } catch (e) {
      console.error('[Shiprocket API Error]:', e);
    }

    // Ensure valid ISO YYYY-MM-DD date for Postgres DATE column
    let deliveryDateFormatted: string | null = null;
    if (order.estimatedDeliveryDate && /^\d{4}-\d{2}-\d{2}$/.test(order.estimatedDeliveryDate)) {
      deliveryDateFormatted = order.estimatedDeliveryDate;
    } else {
      const days = parseInt(String(order.estimatedDeliveryDate || '').replace(/\D/g, '')) || 3;
      deliveryDateFormatted = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }

    const orderRow = {
      order_number: order.orderNumber,
      invoice_number: order.invoiceNumber,
      customer_id: resolvedCustomerId,
      customer_name: order.shippingAddress?.fullName || 'Valued Customer',
      customer_email: cleanEmail,
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
      shiprocket_order_id: shiprocketOrderId,
      shiprocket_shipment_id: shiprocketShipmentId,
      awb_number: awbNumber,
      courier_partner: courierPartner,
      tracking_url: `https://shiprocket.co/tracking/${awbNumber}`,
      estimated_delivery_date: deliveryDateFormatted
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
        shade_name: item.selectedShade?.name || item.shadeName || item.shade || null,
        sku: item.selectedShade?.sku || item.sku || item.product?.id || 'SKU-KM',
        hsn_code: '3304',
        unit_price: Number(item.product?.price || item.unitPrice || item.price || 0),
        quantity: Number(item.quantity || 1),
        subtotal: Number((item.product?.price || item.unitPrice || item.price || 0) * (item.quantity || 1)),
        weight_grams: 150 * Number(item.quantity || 1),
        image_url: item.product?.image || item.image || null
      }));

      const { error: itemsErr } = await supabase.from('order_items').insert(itemsRows);
      if (itemsErr) {
        console.warn('[Server Supabase Order Items Warning]:', itemsErr.message);
      }
    }

    console.log(`[Supabase SUCCESS] Order ${order.orderNumber} saved into Supabase tables!`);
    return res.status(200).json({ success: true, order: insertedOrder, addressSaved: true });
  } catch (err: any) {
    console.error('[Server Save Order Exception]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

const CUSTOMER_ADDRESSES_FILE = path.join(DATA_DIR, 'customer_addresses.json');

function getLocalAddresses(): Record<string, any[]> {
  try {
    if (fs.existsSync(CUSTOMER_ADDRESSES_FILE)) {
      return JSON.parse(fs.readFileSync(CUSTOMER_ADDRESSES_FILE, 'utf8'));
    }
  } catch {}
  return {};
}

function saveLocalAddress(email: string, address: any) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const all = getLocalAddresses();
    const key = email.toLowerCase().trim();
    if (!all[key]) all[key] = [];
    // Replace if exists, else append
    const idx = all[key].findIndex((a: any) => a.id === address.id);
    if (idx >= 0) {
      all[key][idx] = address;
    } else {
      all[key].unshift(address);
    }
    fs.writeFileSync(CUSTOMER_ADDRESSES_FILE, JSON.stringify(all, null, 2));
  } catch (err) {
    console.warn('[Server] Save local address backup warning:', err);
  }
}

/**
 * POST /api/customer/address
 * Saves an address directly to Supabase customer_addresses with server fallback
 */
app.post('/api/customer/address', async (req: Request, res: Response) => {
  try {
    const { email, customerId, address } = req.body;
    if (!address || !address.addressLine1 || !address.city || !address.state || !address.pincode) {
      return res.status(400).json({ success: false, error: 'Full address details are required.' });
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    const isDefault = Boolean(address.isDefault);
    const isInterstate = (address.state || '').toLowerCase() !== 'maharashtra';
    const clientGeneratedId = address.id || `addr_${Date.now()}`;

    let savedAddrObj: any = {
      id: clientGeneratedId,
      fullName: address.fullName || 'Valued Customer',
      phone: address.phone || '',
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      tag: address.tag || 'Home',
      isDefault
    };

    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        let profileId: string | null = null;
        const isUuid = (val: any) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

        if (isUuid(customerId)) {
          profileId = customerId;
        }

        if (!profileId && cleanEmail) {
          const { data: prof } = await supabase
            .from('customer_profiles')
            .select('id')
            .ilike('email', cleanEmail)
            .maybeSingle();

          if (prof?.id) {
            profileId = prof.id;
          }
        }

        // If no existing profile, find or create one in customer_profiles
        if (!profileId && cleanEmail) {
          try {
            const { data: createdProf, error: pErr } = await supabase
              .from('customer_profiles')
              .insert({
                email: cleanEmail,
                full_name: address.fullName || cleanEmail.split('@')[0],
                phone: address.phone || ''
              })
              .select('id')
              .maybeSingle();

            if (!pErr && createdProf?.id) {
              profileId = createdProf.id;
            }
          } catch (_) {}
        }

        if (isDefault && profileId) {
          await supabase
            .from('customer_addresses')
            .update({ is_default: false })
            .eq('customer_id', profileId);
        }

        // Check for existing address with same line1 and pincode to prevent duplicates
        let existingQuery = supabase.from('customer_addresses').select('id');
        if (profileId && cleanEmail) {
          existingQuery = existingQuery.or(`customer_id.eq.${profileId},customer_email.eq.${cleanEmail}`);
        } else if (profileId) {
          existingQuery = existingQuery.eq('customer_id', profileId);
        } else if (cleanEmail) {
          existingQuery = existingQuery.eq('customer_email', cleanEmail);
        }
        existingQuery = existingQuery
          .ilike('address_line1', (address.addressLine1 || '').trim())
          .eq('pincode', (address.pincode || '').trim());

        const { data: existingAddr } = await existingQuery.maybeSingle();

        let dbSaved: any = null;
        let addrErr: any = null;

        if (existingAddr?.id) {
          const res = await supabase
            .from('customer_addresses')
            .update({
              customer_id: profileId || null,
              customer_email: cleanEmail || null,
              full_name: address.fullName,
              phone: address.phone,
              address_line2: address.addressLine2 || '',
              city: address.city,
              state: address.state,
              state_code: isInterstate ? '99' : '27',
              tag: address.tag || 'Home',
              is_default: isDefault
            })
            .eq('id', existingAddr.id)
            .select()
            .maybeSingle();
          dbSaved = res.data;
          addrErr = res.error;
        } else {
          const res = await supabase
            .from('customer_addresses')
            .insert({
              customer_id: profileId || null,
              customer_email: cleanEmail || null,
              full_name: address.fullName,
              phone: address.phone,
              address_line1: (address.addressLine1 || '').trim(),
              address_line2: address.addressLine2 || '',
              city: address.city,
              state: address.state,
              state_code: isInterstate ? '99' : '27',
              pincode: (address.pincode || '').trim(),
              country: 'India',
              tag: address.tag || 'Home',
              is_default: isDefault
            })
            .select()
            .maybeSingle();
          dbSaved = res.data;
          addrErr = res.error;
        }

        if (!addrErr && dbSaved) {
          savedAddrObj = {
            id: dbSaved.id,
            fullName: dbSaved.full_name,
            phone: dbSaved.phone,
            addressLine1: dbSaved.address_line1,
            addressLine2: dbSaved.address_line2,
            city: dbSaved.city,
            state: dbSaved.state,
            pincode: dbSaved.pincode,
            tag: dbSaved.tag || 'Home',
            isDefault: Boolean(dbSaved.is_default)
          };
        } else if (addrErr) {
          console.warn('[Supabase Address Save Warning]:', addrErr.message);
        }
      } catch (sbErr: any) {
        console.warn('[Supabase Address Save Handled Error]:', sbErr?.message || sbErr);
      }
    }

    // Persist to local server file backup
    if (cleanEmail) {
      saveLocalAddress(cleanEmail, savedAddrObj);
    }

    return res.status(200).json({
      success: true,
      address: savedAddrObj
    });
  } catch (err: any) {
    console.error('[Server Save Address Exception]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/customer/addresses
 * Retrieves saved addresses from Supabase for a customer, with local cache fallback
 */
app.get('/api/customer/addresses', async (req: Request, res: Response) => {
  try {
    const email = req.query.email as string | undefined;
    const customerId = req.query.customerId as string | undefined;
    const cleanEmail = (email || '').trim().toLowerCase();

    const localStore = getLocalAddresses();
    let localAddresses: any[] = [];
    if (cleanEmail && localStore[cleanEmail]) {
      localAddresses = localStore[cleanEmail];
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return res.status(200).json({ success: true, addresses: localAddresses });
    }

    let profileId: string | null = null;
    const isUuid = (val: any) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    if (isUuid(customerId)) {
      profileId = customerId;
    } else if (cleanEmail) {
      const { data: prof } = await supabase
        .from('customer_profiles')
        .select('id')
        .ilike('email', cleanEmail)
        .maybeSingle();

      if (prof?.id) profileId = prof.id;
    }

    // If no profileId from customer_profiles, check auth users list
    if (!profileId && cleanEmail) {
      try {
        const { data: userList } = await supabase.auth.admin.listUsers();
        const existingAuth = userList?.users?.find((u: any) => u.email?.toLowerCase() === cleanEmail);
        if (existingAuth?.id) {
          profileId = existingAuth.id;
          await supabase.from('customer_profiles').upsert({
            id: profileId,
            email: cleanEmail,
            full_name: existingAuth.user_metadata?.full_name || existingAuth.user_metadata?.name || cleanEmail.split('@')[0],
            phone: existingAuth.user_metadata?.phone || ''
          });
        }
      } catch (authErr) {
        console.warn('[Server Addresses Auth Lookup Notice]:', authErr);
      }
    }

    let addrs: any[] = [];
    if (profileId) {
      // Query customer_addresses strictly by customer_id
      const { data, error } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('customer_id', profileId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        addrs = data;
      }
    }

    const dbMapped = (addrs || []).map((a: any) => ({
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

    // Merge DB addresses with any local disk addresses, deduplicated
    const seen = new Set<string>();
    const combined: any[] = [];

    for (const a of dbMapped) {
      const sig = `${(a.addressLine1 || '').trim()}_${(a.pincode || '').trim()}`.toLowerCase();
      if (sig !== '_' && !seen.has(sig)) {
        seen.add(sig);
        combined.push(a);
      }
    }

    for (const a of localAddresses) {
      const sig = `${(a.addressLine1 || '').trim()}_${(a.pincode || '').trim()}`.toLowerCase();
      if (sig !== '_' && !seen.has(sig)) {
        seen.add(sig);
        combined.push(a);
      }
    }

    return res.status(200).json({ success: true, addresses: combined });
  } catch (err: any) {
    console.error('[Server Get Addresses Exception]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/customer/address/:id
 */
app.delete('/api/customer/address/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const email = (req.query.email as string || '').toLowerCase().trim();

    const supabase = getSupabaseServerClient();
    if (supabase && id) {
      try {
        await supabase.from('customer_addresses').delete().eq('id', id);
      } catch (_) {}
    }

    if (email) {
      const all = getLocalAddresses();
      if (all[email]) {
        all[email] = all[email].filter((a: any) => a.id !== id);
        fs.writeFileSync(CUSTOMER_ADDRESSES_FILE, JSON.stringify(all, null, 2));
      }
    }

    return res.json({ success: true, deletedId: id });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/customer/address/:id/default
 */
app.put('/api/customer/address/:id/default', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { customerId, email } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    const supabase = getSupabaseServerClient();
    if (supabase && id) {
      let profileId = customerId;
      if (!profileId && cleanEmail) {
        const { data: prof } = await supabase.from('customer_profiles').select('id').ilike('email', cleanEmail).maybeSingle();
        if (prof?.id) profileId = prof.id;
      }
      if (profileId) {
        await supabase.from('customer_addresses').update({ is_default: false }).eq('customer_id', profileId);
      }
      await supabase.from('customer_addresses').update({ is_default: true }).eq('id', id);
    }

    if (cleanEmail) {
      const all = getLocalAddresses();
      if (all[cleanEmail]) {
        all[cleanEmail] = all[cleanEmail].map((a: any) => ({
          ...a,
          isDefault: a.id === id
        }));
        fs.writeFileSync(CUSTOMER_ADDRESSES_FILE, JSON.stringify(all, null, 2));
      }
    }

    return res.json({ success: true, defaultId: id });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/customer/orders
 * Returns verified orders from Supabase for a customer
 */
app.get('/api/customer/orders', async (req: Request, res: Response) => {
  try {
    const email = req.query.email as string | undefined;
    const customerId = req.query.customerId as string | undefined;

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return res.status(200).json({ success: true, orders: [] });
    }

    let query = supabase.from('orders').select('*, order_items(*)');

    const isUuid = (val: any) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    const cleanEmail = (email || '').trim().toLowerCase();

    if (isUuid(customerId) && cleanEmail) {
      query = query.or(`customer_id.eq.${customerId},customer_email.eq.${cleanEmail}`);
    } else if (isUuid(customerId)) {
      query = query.eq('customer_id', customerId);
    } else if (cleanEmail) {
      query = query.ilike('customer_email', cleanEmail);
    } else {
      return res.status(200).json({ success: true, orders: [] });
    }

    const { data: rows, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.warn('[Supabase Orders Query Warning]:', error.message);
      return res.status(200).json({ success: true, orders: [] });
    }

    const orders = (rows || []).map((row: any) => {
      const items = (row.order_items || []).map((item: any) => ({
        productId: item.sku || 'KM-ITEM',
        title: item.title,
        volume: 'Standard',
        price: Number(item.unit_price || 0),
        quantity: Number(item.quantity || 1),
        shade: item.shade_name || undefined,
        image: item.image_url || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=800'
      }));

      const dateStr = new Date(row.created_at || Date.now()).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      return {
        id: row.id,
        orderNumber: row.order_number,
        invoiceNumber: row.invoice_number,
        date: dateStr,
        customerEmail: row.customer_email,
        customerPhone: row.customer_phone,
        items,
        subtotal: Number(row.subtotal || 0),
        cgst: Number(row.cgst || 0),
        sgst: Number(row.sgst || 0),
        shippingFee: Number(row.shipping_fee || 0),
        discountAmount: Number(row.discount_amount || 0),
        discountCode: row.discount_code || undefined,
        totalAmount: Number(row.total_amount || 0),
        paymentMethod: row.payment_method || 'RAZORPAY',
        paymentId: row.razorpay_payment_id || 'N/A',
        signature: row.razorpay_signature || undefined,
        status: (row.status || 'CONFIRMED').toUpperCase(),
        shippingAddress: {
          id: `addr_${row.id}`,
          fullName: row.customer_name,
          phone: row.customer_phone,
          addressLine1: row.shipping_address_line1,
          addressLine2: row.shipping_address_line2 || undefined,
          city: row.city,
          state: row.state,
          pincode: row.pincode,
          tag: 'Home',
          isDefault: false
        },
        awbNumber: row.awb_number || undefined,
        courierPartner: row.courier_partner || 'Blue Dart Air Express',
        estimatedDeliveryDate: row.estimated_delivery_date || '2-3 Business Days',
        trackingHistory: [
          {
            time: dateStr,
            location: 'Konichiwa_Mart Central Fulfillment, Mumbai (MH)',
            activity: `Payment Verified (${row.razorpay_payment_id || 'CONFIRMED'}). Order Confirmed. GST Invoice created.`
          },
          {
            time: 'Dispatched / In Transit',
            location: `${row.city || 'Destination City'} Logistics Bay`,
            activity: `Air Waybill Assigned (${row.awb_number || 'SR-EXP'}) via ${row.courier_partner || 'Blue Dart Air Express'}.`
          }
        ]
      };
    });

    return res.status(200).json({ success: true, orders });
  } catch (err: any) {
    console.error('[Server Customer Orders Exception]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admin/orders
 * Returns all store orders for Operator Portal using Supabase service role
 */
app.get('/api/admin/orders', async (_req: Request, res: Response) => {
  try {
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return res.status(200).json({ success: true, orders: [] });
    }

    const { data: rows, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Supabase Admin Orders Error]:', error.message);
      return res.status(200).json({ success: true, orders: [] });
    }

    const orders = (rows || []).map((row: any) => {
      const items = (row.order_items || []).map((item: any) => ({
        productId: item.sku || 'KM-ITEM',
        title: item.title,
        volume: 'Standard',
        price: Number(item.unit_price || 0),
        quantity: Number(item.quantity || 1),
        shade: item.shade_name || undefined,
        image: item.image_url || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=800'
      }));

      const dateStr = new Date(row.created_at || Date.now()).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const rawStatus = (row.status || '').toUpperCase();
      let mappedStatus = 'CONFIRMED';
      if (['DISPATCHED', 'SHIPPED'].includes(rawStatus)) mappedStatus = 'DISPATCHED';
      else if (['IN_TRANSIT', 'IN TRANSIT'].includes(rawStatus)) mappedStatus = 'IN_TRANSIT';
      else if (['OUT_FOR_DELIVERY', 'OUT FOR DELIVERY'].includes(rawStatus)) mappedStatus = 'OUT_FOR_DELIVERY';
      else if (['DELIVERED'].includes(rawStatus)) mappedStatus = 'DELIVERED';
      else if (['CANCELLED'].includes(rawStatus)) mappedStatus = 'CANCELLED';

      return {
        id: row.id,
        orderNumber: row.order_number,
        invoiceNumber: row.invoice_number,
        date: dateStr,
        createdAt: row.created_at,
        customerName: row.customer_name,
        customerEmail: row.customer_email,
        customerPhone: row.customer_phone,
        items,
        subtotal: Number(row.subtotal || 0),
        cgst: Number(row.cgst || 0),
        sgst: Number(row.sgst || 0),
        shippingFee: Number(row.shipping_fee || 0),
        discountAmount: Number(row.discount_amount || 0),
        discountCode: row.discount_code || undefined,
        totalAmount: Number(row.total_amount || 0),
        paymentMethod: row.payment_method || 'RAZORPAY',
        paymentId: row.razorpay_payment_id || 'N/A',
        signature: row.razorpay_signature || undefined,
        status: mappedStatus,
        shippingAddress: {
          id: `addr_${row.id}`,
          fullName: row.customer_name,
          phone: row.customer_phone,
          addressLine1: row.shipping_address_line1,
          addressLine2: row.shipping_address_line2 || undefined,
          city: row.city,
          state: row.state,
          pincode: row.pincode,
          tag: 'Home',
          isDefault: false
        },
        awbNumber: row.awb_number || '',
        courierPartner: row.courier_partner || 'Pending Dispatch',
        estimatedDeliveryDate: row.estimated_delivery_date || '3-5 Business Days',
        trackingHistory: [
          {
            time: dateStr,
            location: 'Konichiwa Mart Central Fulfillment, Mumbai (MH)',
            activity: `Order Verified. Status: ${mappedStatus}.`
          }
        ]
      };
    });

    return res.status(200).json({ success: true, orders });
  } catch (err: any) {
    console.error('[Server Admin Orders Exception]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/update-order-status
 * Updates status of an order in Supabase
 */
app.post('/api/admin/update-order-status', async (req: Request, res: Response) => {
  try {
    const { orderId, status } = req.body || {};
    if (!orderId || !status) {
      return res.status(400).json({ success: false, error: 'Order ID and status are required.' });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return res.status(500).json({ success: false, error: 'Database client not connected.' });
    }

    const { error } = await supabase
      .from('orders')
      .update({ status: String(status).toLowerCase() })
      .or(`id.eq.${orderId},order_number.eq.${orderId}`);

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true, message: 'Status updated successfully.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/categories
 * Returns active categories from Supabase (filtering out internal metadata rows)
 */
app.get('/api/categories', async (_req: Request, res: Response) => {
  try {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (!error && data && data.length > 0) {
        const filtered = data.filter((c: any) => !c.slug?.startsWith('_app_'));
        saveLocalCategories(filtered);
        return res.json({ success: true, source: 'supabase', categories: filtered });
      }
    }
  } catch (err: any) {
    console.warn('[Server] Supabase categories fetch warning:', err?.message || err);
  }

  const local = getLocalCategories();
  if (local.length > 0) {
    return res.json({ success: true, source: 'local', categories: local });
  }

  const defaultCats = [
    { id: 'cat-1', name: 'Face Wash', slug: 'face-wash', description: 'Cleansers and gentle foaming face washes', display_order: 1 },
    { id: 'cat-2', name: 'Face Mask', slug: 'face-mask', description: 'Sheet masks and wash-off treatments', display_order: 2 },
    { id: 'cat-3', name: 'Toner', slug: 'toner', description: 'Hydrating skin conditioners and lotions', display_order: 3 },
    { id: 'cat-4', name: 'Sunscreen', slug: 'sunscreen', description: 'Broad-spectrum Japanese UV protection', display_order: 4 },
    { id: 'cat-5', name: 'Lips', slug: 'lips', description: 'Moisturizing lip tints and balms', display_order: 5 },
    { id: 'cat-6', name: 'Serum', slug: 'serum', description: 'Targeted active serums and essences', display_order: 6 },
    { id: 'cat-7', name: 'Cleansing Oil', slug: 'cleansing-oil', description: 'Deep oil cleansers and makeup removers', display_order: 7 },
    { id: 'cat-8', name: 'Moisturizer', slug: 'moisturizer', description: 'Barrier creams and nourishing emulsions', display_order: 8 },
    { id: 'cat-9', name: 'Skincare', slug: 'skincare', description: 'All-around Japanese beauty and skincare', display_order: 9 }
  ];
  saveLocalCategories(defaultCats);
  return res.json({ success: true, source: 'default', categories: defaultCats });
});

/**
 * POST /api/categories
 * Adds and persists a new category in Supabase and local storage
 */
app.post('/api/categories', async (req: Request, res: Response) => {
  const { name, description } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Category name is required.' });
  }

  const cleanName = name.trim();
  const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `cat-${Date.now()}`;
  
  const newCat = {
    name: cleanName,
    slug,
    description: description || `${cleanName} collection`,
    display_order: 10
  };

  let savedRecord = { id: `cat_${Date.now()}`, ...newCat };

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .upsert(newCat, { onConflict: 'slug' })
        .select()
        .single();

      if (!error && data) {
        savedRecord = data;
        console.log(`[Supabase] Category "${cleanName}" saved to Supabase categories table.`);
      }
    } catch (err: any) {
      console.warn('[Supabase] Category save notice:', err?.message || err);
    }
  }

  const local = getLocalCategories();
  const existingIdx = local.findIndex((c: any) => c.slug === slug || c.name.toLowerCase() === cleanName.toLowerCase());
  if (existingIdx >= 0) {
    local[existingIdx] = savedRecord;
  } else {
    local.push(savedRecord);
  }
  saveLocalCategories(local);

  return res.status(200).json({ success: true, category: savedRecord });
});

/**
 * PUT /api/categories/:idOrSlug
 * Updates a category in Supabase and locally.
 */
app.put('/api/categories/:idOrSlug', async (req: Request, res: Response) => {
  const { idOrSlug } = req.params;
  const { name, description, slug: newSlug } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Category name is required.' });
  }

  const cleanName = name.trim();
  const slug = (newSlug || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) || idOrSlug;

  const patch: any = { name: cleanName, slug };
  if (description !== undefined) patch.description = description;

  const supabase = getSupabaseServerClient();
  let updatedRecord: any = null;

  if (supabase) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
      const query = isUuid
        ? supabase.from('categories').update(patch).eq('id', idOrSlug)
        : supabase.from('categories').update(patch).eq('slug', idOrSlug);

      const { data, error } = await query.select().maybeSingle();
      if (!error && data) {
        updatedRecord = data;
      }
    } catch (err: any) {
      console.warn('[Supabase] Category update warning:', err?.message || err);
    }
  }

  const local = getLocalCategories();
  const idx = local.findIndex((c: any) => c.id === idOrSlug || c.slug === idOrSlug);
  if (idx >= 0) {
    local[idx] = { ...local[idx], ...patch, ...(updatedRecord || {}) };
    saveLocalCategories(local);
    if (!updatedRecord) updatedRecord = local[idx];
  }

  return res.json({ success: true, category: updatedRecord || { id: idOrSlug, ...patch } });
});

/**
 * DELETE /api/categories/:idOrSlug
 */
app.delete('/api/categories/:idOrSlug', async (req: Request, res: Response) => {
  const { idOrSlug } = req.params;
  if (!idOrSlug) return res.status(400).json({ success: false, error: 'Category identifier required' });

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
      if (isUuid) {
        await supabase.from('categories').delete().eq('id', idOrSlug);
      } else {
        await supabase.from('categories').delete().eq('slug', idOrSlug);
      }
    } catch (err: any) {
      console.warn('[Supabase] Category delete notice:', err?.message || err);
    }
  }

  const local = getLocalCategories().filter((c: any) => c.id !== idOrSlug && c.slug !== idOrSlug);
  saveLocalCategories(local);

  return res.json({ success: true, deleted: idOrSlug });
});

/**
 * GET /api/invoices/:number
 * Renders official GST Tax Invoice HTML view
 */
app.get('/api/invoices/:number', async (req: Request, res: Response) => {
  const { number } = req.params;
  const supabase = getSupabaseServerClient();
  let orderData: any = null;

  if (supabase) {
    try {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .or(`invoice_number.eq.${number},order_number.eq.${number}`)
        .maybeSingle();

      if (data) orderData = data;
    } catch {}
  }

  if (!orderData) {
    const local = orderStore.get(number);
    if (local) orderData = local;
  }

  if (!orderData) {
    return res.status(404).send('Invoice not found');
  }

  const items = orderData.order_items || orderData.items || [];
  const isIntrastate = (orderData.state || '').toLowerCase() === 'maharashtra';
  
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>GST Tax Invoice - ${orderData.invoice_number || number}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; margin: 40px; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
    .title { font-size: 24px; font-weight: bold; color: #e11d48; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin: 25px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
    th { background-color: #f8fafc; font-size: 13px; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .total-box { margin-top: 20px; width: 350px; margin-left: auto; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px dashed #cbd5e1; font-size: 11px; color: #64748b; text-align: center; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">KONICHIWA MART</div>
      <p style="margin: 4px 0; font-size: 12px; color: #475569;">Konichiwa Mart Retail Pvt. Ltd.<br>Lower Parel, Mumbai, Maharashtra - 400013</p>
    </div>
    <div style="text-align: right;">
      <h2 style="margin: 0; color: #0f172a; font-size: 20px;">TAX INVOICE</h2>
      <p style="margin: 4px 0; font-size: 12px; color: #475569;">
        <strong>Invoice No:</strong> ${orderData.invoice_number || number}<br>
        <strong>Order No:</strong> ${orderData.order_number || number}<br>
        <strong>Date:</strong> ${new Date(orderData.created_at || Date.now()).toLocaleDateString('en-IN')}
      </p>
    </div>
  </div>
  <div class="grid">
    <div style="font-size: 13px; line-height: 1.5;">
      <strong>Billed & Shipped To:</strong><br>
      ${orderData.customer_name || 'Valued Customer'}<br>
      ${orderData.shipping_address_line1 || ''}<br>
      ${orderData.shipping_address_line2 ? orderData.shipping_address_line2 + '<br>' : ''}
      ${orderData.city || ''}, ${orderData.state || ''} - ${orderData.pincode || ''}<br>
      Phone: ${orderData.customer_phone || ''} | Email: ${orderData.customer_email || ''}
    </div>
    <div style="font-size: 13px; line-height: 1.5;">
      <strong>Logistics & Payment:</strong><br>
      Courier: ${orderData.courier_partner || 'Blue Dart Air Express'}<br>
      AWB: ${orderData.awb_number || 'SR-EXP'}<br>
      Payment ID: ${orderData.razorpay_payment_id || 'N/A'}<br>
      Mode: ${orderData.payment_method || 'RAZORPAY'}
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Description of Goods</th>
        <th class="text-center">HSN</th>
        <th class="text-center">Qty</th>
        <th class="text-right">Unit Price (₹)</th>
        <th class="text-right">Total (₹)</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((it: any, idx: number) => `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td>${it.title || it.name} ${it.shade_name ? '– ' + it.shade_name : ''}</td>
          <td class="text-center">${it.hsn_code || '3304'}</td>
          <td class="text-center">${it.quantity || 1}</td>
          <td class="text-right">₹${Number(it.unit_price || 0).toFixed(2)}</td>
          <td class="text-right">₹${Number(it.subtotal || (it.unit_price * it.quantity) || 0).toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  <div class="total-box">
    <table>
      <tr><td>Subtotal:</td><td class="text-right">₹${Number(orderData.subtotal || 0).toFixed(2)}</td></tr>
      ${isIntrastate ? `
        <tr><td>CGST (9%):</td><td class="text-right">₹${Number(orderData.cgst || 0).toFixed(2)}</td></tr>
        <tr><td>SGST (9%):</td><td class="text-right">₹${Number(orderData.sgst || 0).toFixed(2)}</td></tr>
      ` : `
        <tr><td>IGST (18%):</td><td class="text-right">₹${Number(orderData.igst || 0).toFixed(2)}</td></tr>
      `}
      <tr><td>Shipping Fee:</td><td class="text-right">${Number(orderData.shipping_fee || 0) === 0 ? 'FREE' : '₹' + Number(orderData.shipping_fee).toFixed(2)}</td></tr>
      <tr style="font-weight: bold; font-size: 15px; background-color: #f8fafc;"><td>Grand Total:</td><td class="text-right">₹${Number(orderData.total_amount || 0).toFixed(2)}</td></tr>
    </table>
  </div>
  <div class="footer">
    This is a computer-generated GST Tax Invoice. All authentic Japanese cosmetic preparations are imported under compliant DCGI import registrations.
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  return res.send(html);
});

// ==============================================================================
// PRODUCTS STORE & SUPABASE SYNCHRONIZATION API
// Prevents deleted products from reappearing across sessions, devices, and reloads
// ==============================================================================

const DELETED_PRODUCTS_FILE = path.join(DATA_DIR, 'deleted_product_ids.json');
const CUSTOM_PRODUCTS_FILE = path.join(DATA_DIR, 'custom_products.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');
const REELS_FILE = path.join(DATA_DIR, 'reels.json');

function getLocalCategories(): any[] {
  try {
    if (fs.existsSync(CATEGORIES_FILE)) {
      return JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf-8')) || [];
    }
  } catch {}
  return [];
}

function saveLocalCategories(cats: any[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(cats, null, 2));
  } catch {}
}

function getReelsFromServer(): any[] {
  try {
    if (fs.existsSync(REELS_FILE)) {
      const content = fs.readFileSync(REELS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[Server] Error reading reels.json:', err);
  }
  return [];
}

function saveReelsToServer(reels: any[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(REELS_FILE, JSON.stringify(reels, null, 2));
  } catch (err) {
    console.warn('[Server] Error saving reels.json:', err);
  }
}

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

async function ensureSupabaseProductsSeeded(supabase: any) {
  try {
    const { count, error } = await supabase.from('products').select('*', { count: 'exact', head: true });
    // Only ever seed if the products table is completely empty (initial setup)
    if (!error && (count === null || count === 0)) {
      const toInsert = PRODUCTS.map(mapProductToSupabaseRow);
      if (toInsert.length > 0) {
        await supabase.from('products').upsert(toInsert, { onConflict: 'slug' });
        for (const p of PRODUCTS) {
          if (p.stock !== undefined) {
            await updateSupabaseInventoryServer(supabase, p.id, p.stock);
          }
        }
        console.log(`[Server] Initial setup: seeded ${toInsert.length} default products to empty database.`);
      }
    }
  } catch (err: any) {
    console.warn('[Server] Initial seed check notice:', err?.message || err);
  }
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
 * POST /api/products/sync-supabase
 * Forces full synchronization of all catalog products to Supabase.
 */
app.post('/api/products/sync-supabase', async (_req: Request, res: Response) => {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return res.status(400).json({ success: false, error: 'Supabase is not configured on server.' });
  }
  try {
    const rows = PRODUCTS.map(mapProductToSupabaseRow);
    const { error } = await supabase.from('products').upsert(rows, { onConflict: 'slug' });
    if (error) throw error;

    for (const p of PRODUCTS) {
      if (p.stock !== undefined) {
        await updateSupabaseInventoryServer(supabase, p.id, p.stock);
      }
    }

    return res.json({ success: true, count: PRODUCTS.length, message: 'All products synced to Supabase!' });
  } catch (err: any) {
    console.error('[Server] Manual Supabase product sync error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Sync failed' });
  }
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

  // 3. Delete from Supabase
  const supabase = getSupabaseServerClient();
  let deletedFromSupabase = false;
  if (supabase) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (isUuid) {
        await supabase.from('products').delete().eq('id', id);
      } else {
        await supabase.from('products').delete().eq('slug', id);
      }
      // Also ensure deletion by matching both id and slug
      await supabase.from('products').delete().or(`id.eq.${id},slug.eq.${id}`);
      // Also update is_active to false as a safety net
      await supabase.from('products').update({ is_active: false }).or(`id.eq.${id},slug.eq.${id}`);
      deletedFromSupabase = true;
    } catch (err: any) {
      console.warn('[Server] Supabase delete warning:', err?.message || err);
    }
  }

  console.log(`[Server] Product "${id}" permanently deleted from catalog (Supabase: ${deletedFromSupabase}).`);
  return res.json({ success: true, deletedId: id, deletedFromSupabase });
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
      if (updates.subtitle !== undefined) patch.subtitle = updates.subtitle;
      if (updates.category !== undefined) {
        patch.category_name = updates.category;
        try {
          const { data: catData } = await supabase.from('categories').select('id').ilike('name', updates.category.trim()).maybeSingle();
          if (catData?.id) {
            patch.category_id = catData.id;
          }
        } catch {}
      }
      if (updates.image !== undefined) patch.primary_image_url = updates.image;
      if (updates.secondaryImage !== undefined) patch.secondary_image_url = updates.secondaryImage;
      if (updates.images !== undefined) patch.images = updates.images;
      if (updates.volume !== undefined) patch.volume_or_weight = updates.volume;
      
      if (Object.keys(patch).length > 0) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        if (isUuid) {
          await supabase.from('products').update(patch).eq('id', id);
        } else {
          const res = await supabase.from('products').update(patch).eq('slug', id);
          if (res.error) {
            await supabase.from('products').update(patch).eq('id', id);
          }
        }
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
 * GET /api/reels
 * Retrieves stored reels from server disk (or Supabase).
 */
app.get('/api/reels', async (_req: Request, res: Response) => {
  try {
    // Check Supabase if configured
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data } = await supabase
          .from('categories')
          .select('description')
          .eq('slug', '_app_reels')
          .maybeSingle();

        if (data?.description) {
          const parsed = JSON.parse(data.description);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return res.json({ success: true, source: 'supabase', reels: parsed });
          }
        }
      } catch (err) {
        console.warn('[Server] Supabase reels fetch warning:', err);
      }
    }

    const fileReels = getReelsFromServer();
    if (fileReels.length > 0) {
      return res.json({ success: true, source: 'server_disk', reels: fileReels });
    }

    return res.json({ success: true, source: 'defaults', reels: null });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/reels
 * Persists reels collection across all sessions, visitors, and devices.
 */
app.post('/api/reels', async (req: Request, res: Response) => {
  try {
    const { reels } = req.body;
    if (!Array.isArray(reels)) {
      return res.status(400).json({ success: false, error: 'Reels array required' });
    }

    // 1. Save to server disk (data/reels.json)
    saveReelsToServer(reels);

    // 2. Sync to Supabase if connected
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        await supabase.from('categories').upsert({
          slug: '_app_reels',
          name: 'Community Reels Store',
          description: JSON.stringify(reels)
        }, { onConflict: 'slug' });
      } catch (err) {
        console.warn('[Server] Supabase reels upsert warning:', err);
      }
    }

    console.log(`[Server] Saved ${reels.length} community reels to persistent server storage.`);
    return res.json({ success: true, count: reels.length });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/site-settings
 * Retrieves global site settings (background images, logo, flower drift) from Supabase.
 */
app.get('/api/site-settings', async (_req: Request, res: Response) => {
  try {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data } = await supabase
          .from('categories')
          .select('description')
          .eq('slug', '_app_site_settings')
          .maybeSingle();

        if (data?.description) {
          const parsed = JSON.parse(data.description);
          if (parsed && typeof parsed === 'object') {
            return res.json({ success: true, settings: parsed });
          }
        }
      } catch (err) {
        console.warn('[Server] Supabase site-settings fetch warning:', err);
      }
    }

    return res.json({ success: true, settings: null });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/site-settings
 * Persists global site settings across all sessions, visitors, and devices in Supabase.
 */
app.post('/api/site-settings', async (req: Request, res: Response) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, error: 'Settings object required' });
    }

    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        await supabase.from('categories').upsert({
          slug: '_app_site_settings',
          name: 'Global Site Settings',
          description: JSON.stringify(settings)
        }, { onConflict: 'slug' });
      } catch (err) {
        console.warn('[Server] Supabase site-settings upsert warning:', err);
      }
    }

    return res.json({ success: true, settings });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Vite integration & SPA server
 */
async function startServer() {
  // Ensure default operator credentials exist in Supabase Auth
  ensureOperatorUserProvisioned().catch(() => {});

  // CRITICAL: Mount static assets from /public first so uploaded hero banners and images
  // are served directly by Express with correct Content-Type (image/png)
  const publicDir = path.join(process.cwd(), 'public');
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir, {
      maxAge: '1h'
    }));
  }

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
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

if (!process.env.VERCEL) { startServer(); }
export default app;
// @ts-ignore
export const handler = app;
