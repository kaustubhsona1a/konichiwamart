/**
 * Razorpay Webhook Handler with HMAC-SHA256 Verification & Idempotency
 * Prevents duplicate orders, duplicate shipments, and double-charges
 */
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { orderStore, ValidatedOrder } from './orderService';
import { createShiprocketOrder } from './shiprocket';
import { sendOrderInvoiceEmail, sendNewOrderOwnerNotification } from './email';
import { InvoiceData } from './invoice';

export interface WebhookProcessingResult {
  statusCode: number;
  message: string;
  orderNumber?: string;
  isDuplicate?: boolean;
}

function getSupabase(): any {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Validates Razorpay Webhook Signature:
 * HMAC-SHA256 of raw body string using RAZORPAY_WEBHOOK_SECRET
 */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | undefined): boolean {
  const webhookSecret = (process.env.RAZORPAY_WEBHOOK_SECRET || process.env.VITE_RAZORPAY_WEBHOOK_SECRET || '').replace(/['"\s]/g, '').trim();
  
  if (!webhookSecret) {
    console.error('[Webhook Security Alert] RAZORPAY_WEBHOOK_SECRET is not configured on server. Rejecting unverified webhook request.');
    return false;
  }

  if (!signatureHeader) {
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const signatureBuf = Buffer.from(signatureHeader.trim(), 'utf8');

    if (expectedBuf.length !== signatureBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
  } catch (err) {
    console.error('[Webhook Signature Verification Error]:', err);
    return false;
  }
}

/**
 * Main Webhook Event Processor with Idempotency Protection
 */
export async function processRazorpayWebhook(
  rawBody: string, 
  signatureHeader: string | undefined
): Promise<WebhookProcessingResult> {
  // 1. VERIFY SIGNATURE
  const isValidSignature = verifyWebhookSignature(rawBody, signatureHeader);
  if (!isValidSignature) {
    return {
      statusCode: 400,
      message: 'Invalid webhook signature.'
    };
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return { statusCode: 400, message: 'Invalid JSON payload.' };
  }

  // We are primarily interested in 'order.paid' or 'payment.captured'
  const eventType = event.event;
  if (eventType !== 'order.paid' && eventType !== 'payment.captured') {
    return {
      statusCode: 200,
      message: `Ignored unhandled event type: ${eventType}`
    };
  }

  // Extract payment and order entities
  const paymentEntity = event.payload?.payment?.entity;
  const orderEntity = event.payload?.order?.entity;

  const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
  const razorpayPaymentId = paymentEntity?.id;

  if (!razorpayOrderId) {
    return { statusCode: 400, message: 'Missing order_id in webhook payload.' };
  }

  // 2. IDEMPOTENCY CHECK
  // Fetch existing order from store or Supabase
  let existingOrder = orderStore.get(razorpayOrderId);
  
  const supabase = getSupabase();
  let supabaseOrder: any = null;
  if (supabase) {
    try {
      const receipt = event.payload?.order?.entity?.receipt || '';
      let q = supabase.from('orders').select('*');
      if (receipt) {
        q = q.or(`razorpay_order_id.eq.${razorpayOrderId},order_number.eq.${receipt}`);
      } else {
        q = q.eq('razorpay_order_id', razorpayOrderId);
      }
      const { data } = await q.maybeSingle();
      supabaseOrder = data;
    } catch (e) {
      console.warn('[Webhook] Supabase order query notice:', e);
    }
  }

  // If order is ALREADY marked as paid in either memory or Supabase, return 200 immediately!
  const isAlreadyPaid = (existingOrder && (existingOrder.status === 'paid' || existingOrder.status === 'processing' || existingOrder.status === 'dispatched')) ||
                        (supabaseOrder && (supabaseOrder.status === 'paid' || supabaseOrder.status === 'processing' || supabaseOrder.status === 'dispatched'));

  if (isAlreadyPaid) {
    const orderNum = existingOrder?.orderNumber || supabaseOrder?.order_number || razorpayOrderId;
    console.log(`[Webhook Idempotency] Order ${orderNum} is already marked as paid. Skipping duplicate triggers.`);
    return {
      statusCode: 200,
      message: 'Order already processed (Idempotent replay).',
      orderNumber: orderNum,
      isDuplicate: true
    };
  }

  // If order is not in memory and not in Supabase (e.g. Test Webhook Event from Razorpay dashboard)
  if (!existingOrder && !supabaseOrder) {
    console.log(`[Webhook] Event acknowledged for order ID: ${razorpayOrderId} (Dashboard Test Event).`);
    return {
      statusCode: 200,
      message: `Webhook event ${eventType} acknowledged successfully.`,
      orderNumber: razorpayOrderId
    };
  }

  // Update in Supabase if present
  if (supabaseOrder && supabase) {
    try {
      await supabase
        .from('orders')
        .update({
          status: 'paid',
          razorpay_payment_id: razorpayPaymentId || supabaseOrder.razorpay_payment_id
        })
        .eq('id', supabaseOrder.id);
      console.log(`[Webhook Success] Supabase order ${supabaseOrder.order_number} marked as PAID.`);
    } catch (sbUpdateErr) {
      console.warn('[Webhook] Supabase order update notice:', sbUpdateErr);
    }
  }

  // 3. ATOMICALLY UPDATE ORDER STATUS IN MEMORY STORE IF PRESENT
  if (existingOrder) {
    existingOrder.status = 'paid';
    existingOrder.razorpayPaymentId = razorpayPaymentId;
    existingOrder.updatedAt = new Date().toISOString();
    orderStore.set(existingOrder.orderNumber, existingOrder);
    orderStore.set(razorpayOrderId, existingOrder);

    console.log(`[Webhook Success] Order ${existingOrder.orderNumber} successfully marked as PAID.`);
  } else if (supabaseOrder) {
    existingOrder = {
      id: supabaseOrder.id,
      orderNumber: supabaseOrder.order_number,
      invoiceNumber: supabaseOrder.invoice_number || `KM-INV-${supabaseOrder.order_number}`,
      currency: supabaseOrder.currency || 'INR',
      razorpayOrderId: supabaseOrder.razorpay_order_id || razorpayOrderId,
      customer: {
        fullName: supabaseOrder.customer_name || 'Valued Customer',
        email: supabaseOrder.customer_email || paymentEntity?.email || '',
        phone: supabaseOrder.customer_phone || paymentEntity?.contact || ''
      },
      shippingAddress: {
        addressLine1: supabaseOrder.shipping_address_line1 || '',
        addressLine2: supabaseOrder.shipping_address_line2 || '',
        city: supabaseOrder.city || '',
        state: supabaseOrder.state || '',
        pincode: supabaseOrder.pincode || ''
      },
      items: [],
      subtotal: Number(supabaseOrder.subtotal || 0),
      cgst: Number(supabaseOrder.cgst || 0),
      sgst: Number(supabaseOrder.sgst || 0),
      igst: Number(supabaseOrder.igst || 0),
      shippingFee: Number(supabaseOrder.shipping_fee || 0),
      discountAmount: Number(supabaseOrder.discount_amount || 0),
      totalAmount: Number(supabaseOrder.total_amount || 0),
      status: 'paid',
      createdAt: supabaseOrder.created_at || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  if (!existingOrder) {
    return {
      statusCode: 200,
      message: `Webhook event ${eventType} acknowledged.`,
      orderNumber: razorpayOrderId
    };
  }

  // 4. ORCHESTRATE SHIPROCKET DISPATCH (Resilient external API call)
  try {
    const shiprocketResult = await createShiprocketOrder({
      orderNumber: existingOrder.orderNumber,
      customerName: existingOrder.customer.fullName,
      customerEmail: existingOrder.customer.email,
      customerPhone: existingOrder.customer.phone,
      shippingAddressLine1: existingOrder.shippingAddress.addressLine1,
      shippingAddressLine2: existingOrder.shippingAddress.addressLine2,
      city: existingOrder.shippingAddress.city,
      state: existingOrder.shippingAddress.state,
      pincode: existingOrder.shippingAddress.pincode,
      items: existingOrder.items.map(it => ({
        name: it.title + (it.shadeName ? ` (${it.shadeName})` : ''),
        sku: it.sku,
        units: it.quantity,
        selling_price: it.unitPrice,
        hsn: it.hsn
      })),
      subtotal: existingOrder.subtotal,
      totalAmount: existingOrder.totalAmount,
      isPrepaid: true
    });

    if (shiprocketResult.success) {
      existingOrder.shiprocketOrderId = String(shiprocketResult.orderId);
      existingOrder.awbNumber = shiprocketResult.awbCode;
      existingOrder.courierPartner = shiprocketResult.courierName;
      existingOrder.status = 'processing';
      console.log(`[Shiprocket Dispatch] Created shipment for ${existingOrder.orderNumber}: AWB ${existingOrder.awbNumber || 'PENDING'} via ${existingOrder.courierPartner}`);
    }
  } catch (shiprocketErr) {
    console.error('[Shiprocket Dispatch Error] Non-blocking logistics failure:', shiprocketErr);
  }

  // 5. DISPATCH TAX INVOICE EMAIL VIA RESEND (Resilient external API call)
  try {
    const invoiceData: InvoiceData = {
      invoiceNumber: existingOrder.invoiceNumber,
      orderNumber: existingOrder.orderNumber,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      customerName: existingOrder.customer.fullName,
      customerEmail: existingOrder.customer.email,
      customerPhone: existingOrder.customer.phone,
      addressLine1: existingOrder.shippingAddress.addressLine1,
      addressLine2: existingOrder.shippingAddress.addressLine2,
      city: existingOrder.shippingAddress.city,
      state: existingOrder.shippingAddress.state,
      pincode: existingOrder.shippingAddress.pincode,
      items: existingOrder.items.map(it => ({
        name: it.title + (it.shadeName ? ` - ${it.shadeName}` : ''),
        sku: it.sku,
        hsn: it.hsn,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        totalPrice: it.subtotal
      })),
      subtotal: existingOrder.subtotal,
      cgst: existingOrder.cgst,
      sgst: existingOrder.sgst,
      igst: existingOrder.igst,
      shippingFee: existingOrder.shippingFee,
      discountAmount: existingOrder.discountAmount,
      totalAmount: existingOrder.totalAmount,
      paymentMethod: 'Razorpay Prepaid',
      paymentId: razorpayPaymentId || 'Prepaid',
      awbNumber: existingOrder.awbNumber,
      courierPartner: existingOrder.courierPartner
    };

    await Promise.all([
      sendOrderInvoiceEmail(invoiceData).catch(err => console.error('[Webhook] Customer invoice email error:', err)),
      sendNewOrderOwnerNotification(invoiceData).catch(err => console.error('[Webhook] Owner alert email error:', err))
    ]);
  } catch (emailErr) {
    console.error('[Email Dispatch Error] Non-blocking email notifications failure:', emailErr);
  }

  return {
    statusCode: 200,
    message: 'Webhook processed successfully.',
    orderNumber: existingOrder.orderNumber,
    isDuplicate: false
  };
}
