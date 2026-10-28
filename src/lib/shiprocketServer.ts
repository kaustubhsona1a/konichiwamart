import { Order } from '../types';
import { lookupPincode, resolveIndianStateAndCityFromPincode } from '../data/pincodes';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let shiprocketToken = '';
let tokenExpiry = 0;
let lastShiprocketAuthError = '';
let cachedPickupLocations: string[] = [];
let pickupCacheExpiry = 0;

export const FALLBACK_SUPABASE_URL = 'https://nhcgwxvfuupkflhixxmj.supabase.co';
export const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oY2d3eHZmdXVwa2ZsaGl4eG1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4ODAxNDUsImV4cCI6MjEwNDQ1NjE0NX0.ZQ-Y13BuS347Y1MJ-9YKbUm1r0J4UZ4Vs5NoNgIihmQ';

function cleanEnvValue(val: string | undefined): string {
  if (!val || typeof val !== 'string') return '';
  return val.replace(/^["']|["']$/g, '').replace(/\\n/g, '').trim();
}

/**
 * Verifies that a candidate Supabase API key is a valid JWT matching the target project ref.
 * Prevents a misconfigured or corrupted SUPABASE_SERVICE_ROLE_KEY in Vercel from throwing "Invalid API key".
 */
export function isValidSupabaseJwt(candidateKey: string | undefined, targetUrl?: string): boolean {
  const cleaned = cleanEnvValue(candidateKey);
  if (!cleaned || !cleaned.startsWith('eyJ')) return false;
  const parts = cleaned.split('.');
  if (parts.length !== 3) return false;

  try {
    const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson);
    if (payload.iss !== 'supabase') return false;

    const url = cleanEnvValue(targetUrl) || FALLBACK_SUPABASE_URL;
    const refMatch = url.match(/https?:\/\/([a-z0-9]+)\.supabase\.co/i);
    if (refMatch && refMatch[1] && payload.ref && payload.ref !== refMatch[1]) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function getValidSupabaseServerClient(): SupabaseClient {
  const rawUrl = cleanEnvValue(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
  const url = rawUrl && rawUrl.startsWith('http') ? rawUrl : FALLBACK_SUPABASE_URL;

  const candidates = [
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.SUPABASE_ANON_KEY,
    process.env.VITE_SUPABASE_ANON_KEY,
    FALLBACK_SUPABASE_ANON_KEY
  ];

  let chosenKey = FALLBACK_SUPABASE_ANON_KEY;
  for (const cand of candidates) {
    if (isValidSupabaseJwt(cand, url)) {
      chosenKey = cleanEnvValue(cand);
      break;
    }
  }

  return createClient(url, chosenKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}

export function getFallbackSupabaseServerClient(): SupabaseClient {
  const rawUrl = cleanEnvValue(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
  const url = rawUrl && rawUrl.startsWith('http') ? rawUrl : FALLBACK_SUPABASE_URL;

  const anonCandidates = [
    process.env.VITE_SUPABASE_ANON_KEY,
    process.env.SUPABASE_ANON_KEY,
    FALLBACK_SUPABASE_ANON_KEY
  ];

  let chosenKey = FALLBACK_SUPABASE_ANON_KEY;
  for (const cand of anonCandidates) {
    if (isValidSupabaseJwt(cand, url)) {
      chosenKey = cleanEnvValue(cand);
      break;
    }
  }

  return createClient(url, chosenKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}

function getSupabase(): SupabaseClient {
  return getValidSupabaseServerClient();
}

export function getLastShiprocketAuthError(): string {
  return lastShiprocketAuthError;
}

export function clearShiprocketTokenCache(): void {
  shiprocketToken = '';
  tokenExpiry = 0;
}

export function getEnvShiprocketCredentials(): { email: string; password: string; pickupLocation: string } | null {
  const email = cleanEnvValue(
    process.env.SHIPROCKET_EMAIL ||
    process.env.SHIPROCKET_API_USER_EMAIL ||
    process.env.SHIPROCKET_API_EMAIL ||
    process.env.SHIPROCKET_USER ||
    process.env.SHIPROCKET_USER_EMAIL ||
    process.env.SHIPROCKET_USERNAME ||
    process.env.VITE_SHIPROCKET_EMAIL
  );

  const password = cleanEnvValue(
    process.env.SHIPROCKET_PASSWORD ||
    process.env.SHIPROCKET_API_USER_PASSWORD ||
    process.env.SHIPROCKET_API_PASSWORD ||
    process.env.SHIPROCKET_PASS ||
    process.env.SHIPROCKET_USER_PASSWORD ||
    process.env.VITE_SHIPROCKET_PASSWORD
  );

  const pickupLocation = cleanEnvValue(
    process.env.SHIPROCKET_PICKUP_LOCATION ||
    process.env.SHIPROCKET_PICKUP ||
    process.env.SHIPROCKET_LOCATION ||
    process.env.VITE_SHIPROCKET_PICKUP_LOCATION
  ) || 'Primary Warehouse';

  if (email && password) {
    return { email, password, pickupLocation };
  }
  return null;
}

export async function getDbShiprocketCredentials(): Promise<{ email: string; password: string; pickupLocation: string } | null> {
  return null;
}

export async function saveDbShiprocketCredentials(_email: string, _password: string, _pickupLocation: string): Promise<void> {
  // Credentials are managed exclusively via Vercel Environment Variables
}

export async function getShiprocketCredentials(): Promise<{ email: string; password: string; pickupLocation: string; source: 'env' | 'db' } | null> {
  const envCreds = getEnvShiprocketCredentials();
  if (envCreds) {
    return { ...envCreds, source: 'env' };
  }
  return null;
}

async function attemptShiprocketLogin(email: string, pass: string, sourceLabel: string): Promise<string | null> {
  const cleanEmail = cleanEnvValue(email);
  const cleanPass = cleanEnvValue(pass);

  if (!cleanEmail || !cleanPass) return null;

  try {
    const res = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password: cleanPass })
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data && data.token) {
      lastShiprocketAuthError = '';
      return String(data.token);
    } else {
      const msg = data.message || `HTTP ${res.status} Invalid credentials`;
      lastShiprocketAuthError = `Shiprocket login rejected for ${cleanEmail} (${sourceLabel}): ${msg}`;
      console.warn(`[Shiprocket Auth Attempt Failed] Source: ${sourceLabel} | Email: ${cleanEmail} | Status: ${res.status} | Msg: ${msg}`);
    }
  } catch (err: any) {
    lastShiprocketAuthError = `Shiprocket network error (${sourceLabel}): ${err.message || 'Connection failed'}`;
    console.error('[Shiprocket Auth Exception]:', err);
  }
  return null;
}

export async function getShiprocketToken(): Promise<string | null> {
  if (shiprocketToken && Date.now() < tokenExpiry) {
    return shiprocketToken;
  }

  const envCreds = getEnvShiprocketCredentials();

  if (envCreds) {
    const token = await attemptShiprocketLogin(envCreds.email, envCreds.password, 'Vercel Env');
    if (token) {
      shiprocketToken = token;
      tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000;
      console.log(`[Shiprocket Auth SUCCESS] Authenticated via Vercel Environment Variables (${envCreds.email})`);
      return shiprocketToken;
    }
    console.warn('[Shiprocket Auth] Vercel environment credentials failed authentication.');
  } else {
    lastShiprocketAuthError = 'SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD are not set in Vercel Environment Variables.';
  }

  shiprocketToken = '';
  tokenExpiry = 0;
  return null;
}

/**
 * Queries the user's Shiprocket account for registered pickup locations (e.g. "home", "Primary", etc.)
 * and automatically resolves a valid pickup_location so Shiprocket never rejects an order due to pickup nickname mismatch.
 */
export async function resolveValidPickupLocation(token: string, preferredPickup: string): Promise<string> {
  const cleanPreferred = (preferredPickup || 'Primary Warehouse').trim();

  if (cachedPickupLocations.length > 0 && Date.now() < pickupCacheExpiry) {
    const exactMatch = cachedPickupLocations.find(loc => loc.toLowerCase() === cleanPreferred.toLowerCase());
    return exactMatch || cachedPickupLocations[0];
  }

  try {
    const res = await fetch('https://apiv2.shiprocket.in/v1/external/settings/company/pickup', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      const locations = data?.data?.shipping_address || [];
      if (Array.isArray(locations) && locations.length > 0) {
        // Sort primary location first
        const sorted = [...locations].sort((a: any, b: any) => (b.is_primary_location || 0) - (a.is_primary_location || 0));
        const nicknames = sorted
          .map((loc: any) => String(loc.pickup_location || '').trim())
          .filter(Boolean);

        if (nicknames.length > 0) {
          cachedPickupLocations = nicknames;
          pickupCacheExpiry = Date.now() + 10 * 60 * 1000;

          const exactMatch = nicknames.find(name => name.toLowerCase() === cleanPreferred.toLowerCase());
          if (exactMatch) {
            return exactMatch;
          }
          console.log(`[Shiprocket Pickup Auto-Resolve] Configured pickup "${cleanPreferred}" not in [${nicknames.join(', ')}]. Using "${nicknames[0]}".`);
          return nicknames[0];
        }
      }
    }
  } catch (err) {
    console.warn('[Shiprocket Pickup Lookup Warning]:', err);
  }

  return cleanPreferred;
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
    '3': 'DISPATCHED',     // Label Generated
    '4': 'DISPATCHED',     // Pickup Scheduled
    '5': 'DISPATCHED',     // Manifest Generated
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
    '19': 'DISPATCHED',    // Out For Pickup
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
  if (statusStr.includes('TRANSIT') || statusStr.includes('REACHED') || statusStr.includes('HUB') || statusStr.includes('DELAY')) return 'IN_TRANSIT';
  if (
    statusStr.includes('SHIP') || 
    statusStr.includes('PICKED') || 
    statusStr.includes('DISPATCH') || 
    statusStr.includes('HANDOVER') || 
    statusStr.includes('PICKUP SCHEDULED') || 
    statusStr.includes('PICKUP GENERATED') || 
    statusStr.includes('MANIFEST') || 
    statusStr.includes('LABEL GENERATED')
  ) {
    return 'DISPATCHED';
  }
  if (statusStr.includes('RTO') || statusStr.includes('CANCEL') || statusStr.includes('LOST') || statusStr.includes('RETURN')) return 'CANCELLED';
  if (statusStr.includes('AWB') || statusStr.includes('PAID') || statusStr.includes('CONFIRM') || statusStr.includes('NEW')) return 'CONFIRMED';

  return 'CONFIRMED';
}

/**
 * Searches Shiprocket orders by channel_order_id (the store's orderNumber)
 * to automatically link any order created directly or out-of-band.
 */
export async function searchShiprocketOrderByNumber(orderNumber: string): Promise<any | null> {
  const token = await getShiprocketToken();
  if (!token) return null;

  try {
    const cleanNumber = orderNumber.trim();
    const res = await fetch(`https://apiv2.shiprocket.in/v1/external/orders?search=${encodeURIComponent(cleanNumber)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      const list = data?.data || [];
      const match = list.find((o: any) => 
        String(o.channel_order_id || '').trim().toLowerCase() === cleanNumber.toLowerCase() ||
        String(o.id || '').trim() === cleanNumber
      );
      return match || (list.length > 0 ? list[0] : null);
    }
  } catch (err) {
    console.warn('[Shiprocket Search Error]:', err);
  }
  return null;
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
  pickupPincode: string = '400093'
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
      city: localFallback.city || 'Mumbai',
      state: localFallback.state || 'Maharashtra',
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
          city: localFallback.city || 'Mumbai',
          state: localFallback.state || 'Maharashtra',
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
    city: localFallback.city || 'Mumbai',
    state: localFallback.state || 'Maharashtra',
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
  trackingUrl?: string;
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

export interface ShiprocketOrderDetailsResult {
  success: boolean;
  orderId?: number;
  shipmentId?: number;
  channelOrderId?: string;
  rawStatus?: string;
  mappedStatus: 'CONFIRMED' | 'DISPATCHED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  awbNumber?: string;
  courierPartner?: string;
  pickupScheduledDate?: string;
  estimatedDeliveryDate?: string;
  invoiceLink?: string;
  trackingUrl?: string;
  error?: string;
}

/**
 * Fetches current shipment details, assigned courier, live AWB, and status
 * directly from Shiprocket for a given Shiprocket Order ID.
 */
export async function fetchShiprocketOrderDetails(shiprocketOrderId: number | string): Promise<ShiprocketOrderDetailsResult> {
  const token = await getShiprocketToken();
  if (!token) {
    return { success: false, mappedStatus: 'CONFIRMED', error: getLastShiprocketAuthError() || 'Shiprocket authentication failed' };
  }

  try {
    const res = await fetch(`https://apiv2.shiprocket.in/v1/external/orders/show/${shiprocketOrderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      return { success: false, mappedStatus: 'CONFIRMED', error: `Shiprocket API error HTTP ${res.status}` };
    }

    const json = await res.json();
    const data = json?.data || json;

    if (!data) {
      return { success: false, mappedStatus: 'CONFIRMED', error: 'Order not found in Shiprocket' };
    }

    const shipment = Array.isArray(data.shipments) ? data.shipments[0] : (data.shipments || {});
    const awbData = data.awb_data || {};

    const awb = String(awbData.awb || shipment.awb || data.awb_code || '').trim();
    const courier = String(shipment.courier || data.courier_name || data.courier_partner || 'Shiprocket Express').trim();
    const rawStatus = String(shipment.status || data.status || 'NEW').trim();
    const mappedStatus = normalizeShiprocketStatus(rawStatus) as any;
    const pickupScheduledDate = shipment.pickup_scheduled_date || data.pickup_scheduled_date || undefined;
    const etd = data.etd_date || shipment.etd || undefined;
    const invoiceLink = shipment.invoice_link || data.invoice_link || undefined;

    return {
      success: true,
      orderId: data.id || data.order_id,
      shipmentId: shipment.id || data.shipment_id,
      channelOrderId: data.channel_order_id,
      rawStatus,
      mappedStatus,
      awbNumber: awb || undefined,
      courierPartner: courier || undefined,
      pickupScheduledDate,
      estimatedDeliveryDate: etd,
      invoiceLink,
      trackingUrl: awb ? `https://shiprocket.co/tracking/${awb}` : undefined
    };
  } catch (err: any) {
    console.error('[Shiprocket Show Order Exception]:', err);
    return { success: false, mappedStatus: 'CONFIRMED', error: err.message };
  }
}

function sanitizeCityAndState(pincode: string, rawCity?: string, rawState?: string): { city: string; state: string } {
  const resolved = resolveIndianStateAndCityFromPincode(pincode);
  const cityStr = String(rawCity || '').trim();
  const stateStr = String(rawState || '').trim();

  const isInvalidState =
    !stateStr ||
    /region|hub|zone|india|unknown|n\/a/i.test(stateStr);

  const isInvalidCity =
    !cityStr ||
    /region|hub|zone|india|unknown|n\/a/i.test(cityStr);

  return {
    city: isInvalidCity ? resolved.city : cityStr,
    state: isInvalidState ? resolved.state : stateStr
  };
}

export async function createShiprocketOrderWithDetails(order: any): Promise<{
  success: boolean;
  data?: { order_id: number; shipment_id: number; awb_code: string; courier_name: string };
  error?: string;
  details?: any;
}> {
  const token = await getShiprocketToken();
  if (!token) {
    const authErr = getLastShiprocketAuthError() || 'Shiprocket authentication failed. Verify SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in Vercel.';
    console.warn('[Shiprocket] Token unavailable:', authErr);
    return {
      success: false,
      error: authErr
    };
  }

  const creds = await getShiprocketCredentials();
  const preferredPickup = (creds?.pickupLocation || 'Primary Warehouse').trim();
  const pickupLocation = await resolveValidPickupLocation(token, preferredPickup);

  try {
    const rawSubTotal = Number(order.subtotal || order.sub_total || order.totalAmount || order.total_amount || 999);
    const baseSubTotal = rawSubTotal > 0 ? rawSubTotal : 999;

    const rawItems = order.items || order.order_items || [];
    const totalUnits = Math.max(
      1,
      rawItems.reduce((acc: number, it: any) => acc + Math.max(1, Number(it.quantity || it.units || 1)), 0)
    );
    const defaultUnitPrice = Math.max(1, Math.round(baseSubTotal / totalUnits));

    let orderItems = rawItems.map((item: any, idx: number) => {
      const rawSku = String(item.sku || item.productId || item.product_id || '').trim();
      const cleanSku = rawSku && rawSku !== 'SKU-KM' ? rawSku : `SKU-KM-${idx + 1}`;
      const uniqueSku = rawItems.length > 1 ? `${cleanSku}-${idx + 1}` : cleanSku;
      const units = Math.max(1, Number(item.quantity || item.units || 1));
      const rawPrice = Number(item.price || item.unitPrice || item.selling_price || item.unit_price || 0);
      const sellingPrice = rawPrice > 0 ? rawPrice : defaultUnitPrice;

      return {
        name: String(item.title || item.name || 'Japanese Skincare Product').trim() || 'Japanese Skincare Product',
        sku: uniqueSku.slice(0, 45),
        units,
        selling_price: sellingPrice,
        hsn: String(item.hsn || item.hsn_code || '3304')
      };
    });

    if (orderItems.length === 0) {
      orderItems = [{
        name: 'Japanese Skincare Item',
        sku: 'SKU-KM-1',
        units: 1,
        selling_price: baseSubTotal,
        hsn: '3304'
      }];
    }

    const computedSubTotal = orderItems.reduce(
      (sum: number, it: any) => sum + Number(it.selling_price) * Number(it.units),
      0
    );

    let orderDateStr = '';
    try {
      const rawDate = order.date || order.created_at || order.createdAt;
      const d = rawDate ? new Date(rawDate) : new Date();
      const validDate = isNaN(d.getTime()) ? new Date() : d;
      orderDateStr = `${validDate.getFullYear()}-${String(validDate.getMonth() + 1).padStart(2, '0')}-${String(validDate.getDate()).padStart(2, '0')} ${String(validDate.getHours()).padStart(2, '0')}:${String(validDate.getMinutes()).padStart(2, '0')}`;
    } catch {
      const now = new Date();
      orderDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }

    const shippingAddr = order.shippingAddress || {
      fullName: order.customer_name || order.customerName,
      addressLine1: order.shipping_address_line1,
      addressLine2: order.shipping_address_line2,
      city: order.city,
      state: order.state,
      pincode: order.pincode,
      phone: order.customer_phone || order.customerPhone
    };

    const cleanPin = String(shippingAddr?.pincode || order.pincode || '400001').replace(/\D/g, '').slice(0, 6) || '400001';
    const { city: validCity, state: validState } = sanitizeCityAndState(
      cleanPin,
      shippingAddr?.city || order.city,
      shippingAddr?.state || order.state
    );

    const cleanEmail = String(order.customerEmail || order.customer_email || 'customer@konichiwamart.com').trim() || 'customer@konichiwamart.com';
    const rawPhone = String(order.customerPhone || order.customer_phone || shippingAddr?.phone || '').replace(/\D/g, '');
    const cleanPhone = rawPhone.length >= 10 ? rawPhone.slice(-10) : '9876543210';

    const rawAddress1 = String(shippingAddr?.addressLine1 || order.shipping_address_line1 || '').trim();
    const billingAddress1 = rawAddress1.length >= 3 ? rawAddress1 : `House 1, ${validCity}`;

    const fullName = String(shippingAddr?.fullName || order.customer_name || order.customerName || 'Customer').trim() || 'Customer';
    const nameParts = fullName.split(/\s+/);
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    const paymentMethodRaw = String(order.paymentMethod || order.payment_method || 'Prepaid').toUpperCase();
    const paymentMethod = paymentMethodRaw.includes('COD') ? 'COD' : 'Prepaid';

    const orderNumberStr = String(order.orderNumber || order.order_number || order.id).trim();

    const payload = {
      order_id: orderNumberStr,
      order_date: orderDateStr,
      pickup_location: pickupLocation,
      channel_id: '',
      comment: 'Konichiwa Mart Order',
      billing_customer_name: firstName,
      billing_last_name: lastName,
      billing_address: billingAddress1,
      billing_address_2: String(shippingAddr?.addressLine2 || order.shipping_address_line2 || '').trim(),
      billing_city: validCity,
      billing_pincode: cleanPin,
      billing_state: validState,
      billing_country: 'India',
      billing_email: cleanEmail,
      billing_phone: cleanPhone,
      shipping_is_billing: true,
      order_items: orderItems,
      payment_method: paymentMethod,
      shipping_charges: Number(order.shippingFee || order.shipping_fee || 0),
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: Number(order.discountAmount || order.discount_amount || 0),
      sub_total: computedSubTotal > 0 ? computedSubTotal : baseSubTotal,
      length: 15,
      breadth: 15,
      height: 10,
      weight: 0.5
    };

    console.log(`[Shiprocket API] Pushing adhoc order ${payload.order_id} to pickup "${pickupLocation}" (${validCity}, ${validState} - ${cleanPin})...`);

    const res = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));
    if (data && data.order_id) {
      console.log(`[Shiprocket Success] Order ${payload.order_id} pushed successfully! Order ID: ${data.order_id}, Shipment ID: ${data.shipment_id}`);
      return {
        success: true,
        data: {
          order_id: data.order_id,
          shipment_id: data.shipment_id,
          awb_code: data.awb_code || '',
          courier_name: data.courier_name || ''
        }
      };
    }

    // Check if the order already exists in Shiprocket
    const existing = await searchShiprocketOrderByNumber(orderNumberStr);
    if (existing && (existing.id || existing.order_id)) {
      const existingOrderId = Number(existing.id || existing.order_id);
      const existingShipment = Array.isArray(existing.shipments) ? existing.shipments[0] : (existing.shipments || {});
      const existingShipmentId = Number(existingShipment?.id || existing.shipment_id || 0);
      return {
        success: true,
        data: {
          order_id: existingOrderId,
          shipment_id: existingShipmentId,
          awb_code: String(existing.awb_code || existingShipment?.awb || ''),
          courier_name: String(existing.courier_name || existingShipment?.courier || '')
        }
      };
    }

    // Format detailed validation errors from Shiprocket if present
    let errorDetail = data?.message || `HTTP ${res.status} rejected by Shiprocket`;
    if (data?.errors && typeof data.errors === 'object') {
      const errList = Object.entries(data.errors)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
        .join('; ');
      if (errList) {
        errorDetail = `${errorDetail} (${errList})`;
      }
    }

    console.error(`[Shiprocket API Error] Order ${payload.order_id} rejected by Shiprocket:`, JSON.stringify(data));
    return {
      success: false,
      error: errorDetail,
      details: data
    };
  } catch (err: any) {
    console.error('Shiprocket Create Order Exception:', err);
    return {
      success: false,
      error: err.message || 'Exception while creating Shiprocket order'
    };
  }
}

export async function createShiprocketOrder(order: any): Promise<{ order_id: number; shipment_id: number; awb_code: string; courier_name: string } | null> {
  const result = await createShiprocketOrderWithDetails(order);
  return result.success && result.data ? result.data : null;
}
