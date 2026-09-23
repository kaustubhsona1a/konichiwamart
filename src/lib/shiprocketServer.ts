import { Order } from '../types';

let shiprocketToken = '';
let tokenExpiry = 0;

export async function getShiprocketToken(): Promise<string | null> {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  
  if (!email || !password) return null;

  if (shiprocketToken && Date.now() < tokenExpiry) {
    return shiprocketToken;
  }

  try {
    const res = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data && data.token) {
      shiprocketToken = data.token;
      tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000; // Token valid for 10 days, cache for 9
      return shiprocketToken;
    }
  } catch (err) {
    console.error('Shiprocket Auth Error:', err);
  }
  return null;
}

export async function createShiprocketOrder(order: Order): Promise<{ order_id: number; shipment_id: number; awb_code: string; courier_name: string } | null> {
  const token = await getShiprocketToken();
  if (!token) return null; // Fallback to mock if not configured

  try {
    const orderItems = order.items.map(item => ({
      name: item.title,
      sku: item.productId,
      units: item.quantity,
      selling_price: item.price,
      hsn: "3304"
    }));

    const date = new Date(order.date);
    const orderDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

    const pickupLocation = (process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary Warehouse').trim();

    const payload = {
      order_id: order.orderNumber,
      order_date: orderDateStr,
      pickup_location: pickupLocation,
      channel_id: "",
      comment: "Konichiwa Mart Order",
      billing_customer_name: order.shippingAddress?.fullName || 'Customer',
      billing_last_name: "",
      billing_address: order.shippingAddress?.addressLine1 || '',
      billing_address_2: order.shippingAddress?.addressLine2 || '',
      billing_city: order.shippingAddress?.city || '',
      billing_pincode: order.shippingAddress?.pincode || '',
      billing_state: order.shippingAddress?.state || '',
      billing_country: "India",
      billing_email: order.customerEmail || 'customer@example.com',
      billing_phone: order.shippingAddress?.phone || '',
      shipping_is_billing: true,
      order_items: orderItems,
      payment_method: order.paymentMethod.includes('Prepaid') || order.paymentMethod.includes('RAZORPAY') ? "Prepaid" : "COD",
      shipping_charges: 0,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: order.discountAmount || 0,
      sub_total: order.subtotal,
      length: 15,
      breadth: 15,
      height: 10,
      weight: 0.5
    };

    const res = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    if (data && data.order_id) {
      // Optional: Auto-generate AWB if supported directly or just return order_id
      return {
        order_id: data.order_id,
        shipment_id: data.shipment_id,
        awb_code: data.awb_code || '',
        courier_name: data.courier_name || ''
      };
    }
  } catch (err) {
    console.error('Shiprocket Create Order Error:', err);
  }
  return null;
}
