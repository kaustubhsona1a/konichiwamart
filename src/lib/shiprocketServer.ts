import { Order } from '../types';
import { lookupPincode } from '../data/pincodes';

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

/**
 * Normalizes Shiprocket status codes (numeric and string) into the standard
 * status enum used across Konichiwa Mart:
 * 'CONFIRMED' | 'DISPATCHED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED'
 */
export function normalizeShiprocketStatus(statusRaw: string | number | undefined | null): string {
  if (statusRaw === undefined || statusRaw === null) return 'CONFIRMED';
  
  const statusStr = String(statusRaw).trim().toUpperCase();

  // Numeric status code mappings per Shiprocket API documentation
  const numericMap: Record<string, string> = {
    '1': 'CONFIRMED',      // AWB Not Generated
    '2': 'CONFIRMED',      // AWB Assigned
    '3': 'CONFIRMED',      // Label Generated
    '4': 'CONFIRMED',      // Pickup Scheduled
    '5': 'CONFIRMED',      // Manifest Generated
    '6': 'DISPATCHED',     // Shipped / Picked up
    '7': 'DELIVERED',      // Delivered
    '8': 'IN_TRANSIT',     // In Transit
    '9': 'CANCELLED',      // RTO Initiated
    '10': 'CANCELLED',     // RTO Delivered
    '11': 'CONFIRMED',     // Pending
    '12': 'CANCELLED',     // Lost
    '13': 'CONFIRMED',     // Pickup Error
    '14': 'CANCELLED',     // RTO Acknowledged
    '15': 'CONFIRMED',     // Pickup Rescheduled
    '16': 'CANCELLED',     // Cancellation Requested
    '17': 'OUT_FOR_DELIVERY', // Out For Delivery
    '18': 'IN_TRANSIT',    // In Transit Hub
    '19': 'CONFIRMED',     // Out For Pickup
    '20': 'CONFIRMED',     // Pickup Exception
    '21': 'IN_TRANSIT',    // Undelivered Attempt
    '22': 'IN_TRANSIT',    // Delayed
    '38': 'IN_TRANSIT',    // Reached Destination Hub
    '42': 'DISPATCHED',    // Picked Up
    '52': 'DISPATCHED'     // Handover to Courier
  };

  if (numericMap[statusStr]) {
    return numericMap[statusStr];
  }

  // String matchers
  if (statusStr.includes('DELIVERED')) return 'DELIVERED';
  if (statusStr.includes('OUT FOR DELIVERY') || statusStr.includes('OUT_FOR_DELIVERY')) return 'OUT_FOR_DELIVERY';
  if (statusStr.includes('TRANSIT') || statusStr.includes('REACHED') || statusStr.includes('HUB')) return 'IN_TRANSIT';
  if (statusStr.includes('SHIP') || statusStr.includes('PICKED') || statusStr.includes('DISPATCH') || statusStr.includes('HANDOVER')) return 'DISPATCHED';
  if (statusStr.includes('RTO') || statusStr.includes('CANCEL') || statusStr.includes('LOST') || statusStr.includes('RETURN')) return 'CANCELLED';
  if (statusStr.includes('AWB') || statusStr.includes('PAID') || statusStr.includes('CONFIRM') || statusStr.includes('NEW')) return 'CONFIRMED';

  return 'CONFIRMED';
}

export interface CourierServiceabilityInfo {
  serviceable: boolean;
  city: string;
  state: string;
  estimatedDays: number;
  estimatedDeliveryDate: string;
  fastestCourier: string;
  couriers: Array<{
    id?: number;
    name: string;
    etd: string;
    estimatedDays: number;
    rate?: number;
    cod: boolean;
  }>;
  codAvailable: boolean;
  source: 'shiprocket_live' | 'pincode_zone_engine';
}

/**
 * Checks courier serviceability and estimated delivery timeline for any 6-digit Indian pincode.
 * Calls Shiprocket API if credentials are provided, or seamlessly falls back to our verified
 * regional pincode database without interruption.
 */
export async function checkShiprocketServiceability(
  deliveryPincode: string,
  weightKg: number = 0.5,
  isCod: boolean = true,
  pickupPincode: string = '400050'
): Promise<CourierServiceabilityInfo> {
  const cleanPin = (deliveryPincode || '').trim().replace(/\D/g, '');
  const localFallback = lookupPincode(cleanPin);

  // Compute fallback delivery date string (e.g. "Sep 28, 2026")
  const fallbackDays = localFallback.estimatedDays || 3;
  const targetDate = new Date(Date.now() + fallbackDays * 24 * 60 * 60 * 1000);
  const formattedFallbackDate = targetDate.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });

  const token = await getShiprocketToken();
  if (!token) {
    return {
      serviceable: localFallback.isServiceable,
      city: localFallback.city || 'Regional Hub',
      state: localFallback.state || 'India',
      estimatedDays: fallbackDays,
      estimatedDeliveryDate: formattedFallbackDate,
      fastestCourier: localFallback.couriers?.[0] || 'Blue Dart Air Express',
      couriers: (localFallback.couriers || ['Blue Dart Air Express', 'Delhivery Surface']).map((c, i) => ({
        name: c,
        etd: `${fallbackDays + i} Business Days`,
        estimatedDays: fallbackDays + i,
        cod: true
      })),
      codAvailable: true,
      source: 'pincode_zone_engine'
    };
  }

  try {
    const url = new URL('https://apiv2.shiprocket.in/v1/external/courier/serviceability/');
    url.searchParams.set('pickup_postcode', pickupPincode);
    url.searchParams.set('delivery_postcode', cleanPin);
    url.searchParams.set('weight', String(weightKg));
    url.searchParams.set('cod', isCod ? '1' : '0');

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      const courierList = data?.data?.available_courier_companies || [];
      
      if (Array.isArray(courierList) && courierList.length > 0) {
        // Sort couriers by estimated delivery days (fastest first)
        const sorted = [...courierList].sort((a, b) => {
          const daysA = parseInt(a.estimated_delivery_days || a.etd_hours / 24 || 99);
          const daysB = parseInt(b.estimated_delivery_days || b.etd_hours / 24 || 99);
          return daysA - daysB;
        });

        const best = sorted[0];
        const bestDays = parseInt(best.estimated_delivery_days || best.etd_hours / 24) || fallbackDays;
        const etdDate = best.etd || new Date(Date.now() + bestDays * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short'
        });

        return {
          serviceable: true,
          city: localFallback.city || 'Direct Service Point',
          state: localFallback.state || 'India',
          estimatedDays: bestDays,
          estimatedDeliveryDate: etdDate,
          fastestCourier: best.courier_name || 'Blue Dart Air Express',
          couriers: sorted.slice(0, 5).map((c: any) => ({
            id: c.courier_company_id,
            name: c.courier_name,
            etd: c.etd || `${c.estimated_delivery_days || 3} Days`,
            estimatedDays: parseInt(c.estimated_delivery_days) || 3,
            rate: Number(c.rate || 0),
            cod: Boolean(c.cod)
          })),
          codAvailable: sorted.some((c: any) => Boolean(c.cod)),
          source: 'shiprocket_live'
        };
      }
    }
  } catch (err) {
    console.warn('[Shiprocket Serviceability Warning]:', err);
  }

  // Graceful fallback to zone engine
  return {
    serviceable: localFallback.isServiceable,
    city: localFallback.city || 'Regional Hub',
    state: localFallback.state || 'India',
    estimatedDays: fallbackDays,
    estimatedDeliveryDate: formattedFallbackDate,
    fastestCourier: localFallback.couriers?.[0] || 'Blue Dart Air Express',
    couriers: (localFallback.couriers || ['Blue Dart Air Express', 'Delhivery Surface']).map((c, i) => ({
      name: c,
      etd: `${fallbackDays + i} Business Days`,
      estimatedDays: fallbackDays + i,
      cod: true
    })),
    codAvailable: true,
    source: 'pincode_zone_engine'
  };
}

/**
 * Queries live tracking scans and current status from Shiprocket API for a given AWB.
 */
export async function trackShiprocketAwb(awbNumber: string): Promise<{
  success: boolean;
  awbNumber: string;
  currentStatus: string;
  mappedStatus: string;
  courierPartner: string;
  estimatedDeliveryDate?: string;
  scans: Array<{ time: string; location: string; activity: string }>;
  error?: string;
}> {
  const cleanAwb = (awbNumber || '').trim();
  if (!cleanAwb) {
    return {
      success: false,
      awbNumber: '',
      currentStatus: 'UNKNOWN',
      mappedStatus: 'CONFIRMED',
      courierPartner: 'Pending Dispatch',
      scans: [],
      error: 'AWB number is required'
    };
  }

  const token = await getShiprocketToken();
  if (!token) {
    return {
      success: true,
      awbNumber: cleanAwb,
      currentStatus: 'CONFIRMED',
      mappedStatus: 'CONFIRMED',
      courierPartner: 'Blue Dart Air Express',
      scans: [
        {
          time: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
          location: 'Central Fulfillment, Mumbai',
          activity: `Air Waybill Assigned (${cleanAwb}). Package packed and awaiting courier pickup.`
        }
      ]
    };
  }

  try {
    const res = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/track/awb/${cleanAwb}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      const trackData = data?.tracking_data || {};
      const shipmentTrack = (trackData?.shipment_track || [])[0] || {};
      const scansList = trackData?.shipment_track_activities || [];

      const rawStatus = shipmentTrack.current_status || shipmentTrack.shipment_status || 'CONFIRMED';
      const mappedStatus = normalizeShiprocketStatus(rawStatus);

      const parsedScans = scansList.map((s: any) => ({
        time: s.date || s['sr-status-label'] || new Date().toISOString(),
        location: s.location || 'In Transit Hub',
        activity: s.activity || s['sr-status-label'] || 'Shipment in progress'
      }));

      return {
        success: true,
        awbNumber: cleanAwb,
        currentStatus: rawStatus,
        mappedStatus,
        courierPartner: shipmentTrack.courier_name || 'Shiprocket Express',
        estimatedDeliveryDate: shipmentTrack.edd || undefined,
        scans: parsedScans.length > 0 ? parsedScans : [
          {
            time: shipmentTrack.pickup_date || new Date().toISOString(),
            location: 'Central Fulfillment, Mumbai',
            activity: `Shipment status: ${rawStatus}`
          }
        ]
      };
    }
  } catch (err: any) {
    console.error('[Shiprocket Track AWB Exception]:', err);
  }

  return {
    success: false,
    awbNumber: cleanAwb,
    currentStatus: 'CONFIRMED',
    mappedStatus: 'CONFIRMED',
    courierPartner: 'Blue Dart Air Express',
    scans: [],
    error: 'Tracking details unavailable from carrier network'
  };
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
