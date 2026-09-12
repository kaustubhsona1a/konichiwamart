/**
 * Server-Side Order & Price Validation Service
 * Enforces canonical pricing, stock checks, and GST calculations
 * Prevents client-side price tampering
 */
import Razorpay from 'razorpay';
import { PRODUCTS, PROMO_CODES } from '../data/products';
import { calculateGSTSplit, SELLER_DETAILS } from './invoice';

export interface CheckoutItemRequest {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface CustomerDetails {
  fullName: string;
  email: string;
  phone: string;
}

export interface ShippingAddressInput {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface CreateOrderPayload {
  items: CheckoutItemRequest[];
  customer: CustomerDetails;
  shippingAddress: ShippingAddressInput;
  discountCode?: string;
  notes?: Record<string, string>;
}

export interface CanonicalOrderItem {
  productId: string;
  variantId?: string;
  title: string;
  shadeName?: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  weightGrams: number;
  hsn: string;
  image: string;
}

export interface ValidatedOrder {
  id: string;
  orderNumber: string;
  invoiceNumber: string;
  status: 'pending' | 'paid' | 'processing' | 'dispatched' | 'delivered' | 'cancelled';
  customer: CustomerDetails;
  shippingAddress: ShippingAddressInput;
  items: CanonicalOrderItem[];
  subtotal: number;
  discountAmount: number;
  discountCode?: string;
  cgst: number;
  sgst: number;
  igst: number;
  shippingFee: number;
  totalAmount: number;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  shiprocketOrderId?: string;
  awbNumber?: string;
  courierPartner?: string;
  createdAt: string;
  updatedAt: string;
}

// In-memory store for orders (supplements Supabase for instant local execution & fallback)
export const orderStore = new Map<string, ValidatedOrder>();

/**
 * Lazy helper for Razorpay instance with env check
 */
function getRazorpayClient(): Razorpay {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error('Razorpay credentials missing in environment variables (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET).');
  }

  return new Razorpay({ key_id, key_secret });
}

/**
 * Creates and validates an order entirely on the server
 */
export async function createValidatedOrder(payload: CreateOrderPayload) {
  const { items, customer, shippingAddress, discountCode } = payload;

  if (!items || items.length === 0) {
    throw new Error('Order must contain at least one item.');
  }

  if (!customer?.email || !customer?.fullName || !customer?.phone) {
    throw new Error('Customer full name, email, and 10-digit mobile number are required.');
  }

  if (!shippingAddress?.addressLine1 || !shippingAddress?.city || !shippingAddress?.state || !shippingAddress?.pincode) {
    throw new Error('Complete delivery address (Street, City, State, Pincode) is required.');
  }

  // 1. CANONICAL PRICE & INVENTORY VALIDATION (Never trusts client prices)
  const canonicalItems: CanonicalOrderItem[] = [];
  let calculatedSubtotal = 0;
  let totalWeightGrams = 0;

  for (const itemReq of items) {
    const canonicalProduct = PRODUCTS.find(p => p.id === itemReq.productId);
    if (!canonicalProduct) {
      throw new Error(`Product with ID "${itemReq.productId}" does not exist in store catalog.`);
    }

    if (itemReq.quantity <= 0) {
      throw new Error(`Invalid quantity for "${canonicalProduct.title}". Quantity must be at least 1.`);
    }

    if (canonicalProduct.stock < itemReq.quantity) {
      throw new Error(`Insufficient stock for "${canonicalProduct.title}". Only ${canonicalProduct.stock} units available.`);
    }

    // Resolve variant / shade if provided
    let shadeName: string | undefined;
    let itemSku = `${canonicalProduct.id.toUpperCase()}-STD`;
    let unitPrice = canonicalProduct.price;

    if (itemReq.variantId && canonicalProduct.shades) {
      const variant = canonicalProduct.shades.find(s => s.id === itemReq.variantId);
      if (variant) {
        shadeName = variant.name;
        itemSku = variant.sku || `${canonicalProduct.id.toUpperCase()}-${variant.id.toUpperCase()}`;
        if (variant.price) unitPrice = variant.price;
      }
    }

    const itemSubtotal = unitPrice * itemReq.quantity;
    calculatedSubtotal += itemSubtotal;
    totalWeightGrams += 150 * itemReq.quantity;

    canonicalItems.push({
      productId: canonicalProduct.id,
      variantId: itemReq.variantId,
      title: canonicalProduct.title,
      shadeName,
      sku: itemSku,
      unitPrice,
      quantity: itemReq.quantity,
      subtotal: itemSubtotal,
      weightGrams: 150 * itemReq.quantity,
      hsn: '3304',
      image: canonicalProduct.image
    });
  }

  // 2. SERVER-SIDE DISCOUNT VALIDATION
  let discountAmount = 0;
  let verifiedCode: string | undefined;

  if (discountCode) {
    const upperCode = discountCode.trim().toUpperCase();
    const promo = PROMO_CODES[upperCode];
    if (promo && calculatedSubtotal >= promo.minAmount) {
      discountAmount = Math.round((calculatedSubtotal * promo.discountPercent) / 100);
      verifiedCode = upperCode;
    }
  }

  // 3. SHIPPING FEE
  const effectiveSubtotal = calculatedSubtotal - discountAmount;
  const shippingFee = effectiveSubtotal >= 999 ? 0 : 99; // Free shipping above ₹999

  // 4. GST CALCULATION (Intrastate vs Interstate)
  const gstBreakdown = calculateGSTSplit(effectiveSubtotal, shippingAddress.state);

  const grandTotal = effectiveSubtotal + shippingFee;
  const totalInPaise = Math.round(grandTotal * 100);

  // 5. UNIQUE IDENTIFIERS
  const randomId = Math.floor(1000 + Math.random() * 9000);
  const orderNumber = `KM-ORD-2026-${randomId}`;
  const invoiceNumber = `KM-INV-2026-${randomId}`;

  // 6. INITIALIZE RAZORPAY ORDER
  let razorpayOrderId: string;
  try {
    const razorpay = getRazorpayClient();
    const rzpOrder = await razorpay.orders.create({
      amount: totalInPaise,
      currency: 'INR',
      receipt: orderNumber,
      notes: {
        orderNumber,
        invoiceNumber,
        customerName: customer.fullName,
        customerPhone: customer.phone,
        state: shippingAddress.state
      }
    });
    razorpayOrderId = rzpOrder.id;
  } catch (rzpErr: any) {
    // If Razorpay credentials are not yet set in .env, generate a test order ID for development
    console.warn('[Razorpay Order Creation] Falling back to test order ID:', rzpErr.message);
    razorpayOrderId = `order_test_${Date.now()}`;
  }

  // 7. SAVE ORDER TO STORE
  const newOrder: ValidatedOrder = {
    id: `ord_${Date.now()}`,
    orderNumber,
    invoiceNumber,
    status: 'pending',
    customer,
    shippingAddress,
    items: canonicalItems,
    subtotal: calculatedSubtotal,
    discountAmount,
    discountCode: verifiedCode,
    cgst: gstBreakdown.cgst,
    sgst: gstBreakdown.sgst,
    igst: gstBreakdown.igst,
    shippingFee,
    totalAmount: grandTotal,
    currency: 'INR',
    razorpayOrderId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  orderStore.set(orderNumber, newOrder);
  orderStore.set(razorpayOrderId, newOrder);

  return {
    success: true,
    orderId: newOrder.id,
    orderNumber,
    invoiceNumber,
    razorpayOrderId,
    amount: totalInPaise,
    grandTotal,
    currency: 'INR',
    taxBreakdown: gstBreakdown,
    items: canonicalItems,
    shippingFee
  };
}
