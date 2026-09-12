/**
 * Razorpay Webhook Handler with HMAC-SHA256 Verification & Idempotency
 * Prevents duplicate orders, duplicate shipments, and double-charges
 */
import crypto from 'crypto';
import { orderStore, ValidatedOrder } from './orderService';
import { createShiprocketOrder } from './shiprocket';
import { sendOrderInvoiceEmail } from './email';
import { InvoiceData } from './invoice';

export interface WebhookProcessingResult {
  statusCode: number;
  message: string;
  orderNumber?: string;
  isDuplicate?: boolean;
}

/**
 * Validates Razorpay Webhook Signature:
 * HMAC-SHA256 of raw body string using RAZORPAY_WEBHOOK_SECRET
 */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | undefined): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.warn('[Webhook Security] RAZORPAY_WEBHOOK_SECRET is not set in environment. Skipping HMAC verification for local test mode.');
    return true; // Allow local testing if secret not configured
  }

  if (!signatureHeader) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'utf8'),
    Buffer.from(signatureHeader, 'utf8')
  );
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
  const existingOrder = orderStore.get(razorpayOrderId);
  if (!existingOrder) {
    console.warn(`[Webhook] Received payment for unrecognized order ID: ${razorpayOrderId}`);
    return {
      statusCode: 200,
      message: 'Order not found in memory store (might have been created outside current instance).'
    };
  }

  // If order is ALREADY marked as paid, return 200 immediately to prevent duplicate shipments!
  if (existingOrder.status === 'paid' || existingOrder.status === 'processing' || existingOrder.status === 'dispatched') {
    console.log(`[Webhook Idempotency] Order ${existingOrder.orderNumber} is already marked as ${existingOrder.status}. Skipping duplicate Shiprocket/email triggers.`);
    return {
      statusCode: 200,
      message: 'Order already processed (Idempotent replay).',
      orderNumber: existingOrder.orderNumber,
      isDuplicate: true
    };
  }

  // 3. ATOMICALLY UPDATE ORDER STATUS
  existingOrder.status = 'paid';
  existingOrder.razorpayPaymentId = razorpayPaymentId;
  existingOrder.updatedAt = new Date().toISOString();
  orderStore.set(existingOrder.orderNumber, existingOrder);
  orderStore.set(razorpayOrderId, existingOrder);

  console.log(`[Webhook Success] Order ${existingOrder.orderNumber} successfully marked as PAID.`);

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

    await sendOrderInvoiceEmail(invoiceData);
  } catch (emailErr) {
    console.error('[Email Dispatch Error] Non-blocking invoice email failure:', emailErr);
  }

  return {
    statusCode: 200,
    message: 'Webhook processed successfully.',
    orderNumber: existingOrder.orderNumber,
    isDuplicate: false
  };
}
