import fs from 'fs';
import path from 'path';
import { getValidSupabaseServerClient } from './shiprocketServer';

export interface TrackingNotificationEntry {
  orderNumber: string;
  customerEmail: string;
  lastNotifiedStatus: string;
  lastNotifiedAwb: string;
  lastNotifiedScan?: string;
  notifiedAt: string;
  history: Array<{
    status: string;
    awb: string;
    scan?: string;
    sentAt: string;
    messageId?: string;
  }>;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const NOTIFICATIONS_FILE = path.join(DATA_DIR, 'tracking_notifications.json');

function getSupabaseClient() {
  return getValidSupabaseServerClient();
}

// In-memory cache for fast lookups
let notificationsCache: Record<string, TrackingNotificationEntry> | null = null;

export function loadTrackingNotifications(): Record<string, TrackingNotificationEntry> {
  if (notificationsCache) {
    return notificationsCache;
  }

  try {
    if (fs.existsSync(NOTIFICATIONS_FILE)) {
      const raw = fs.readFileSync(NOTIFICATIONS_FILE, 'utf-8');
      notificationsCache = JSON.parse(raw);
      return notificationsCache || {};
    }
  } catch (err) {
    console.warn('[TrackingNotificationService] Error reading local notifications file:', err);
  }

  notificationsCache = {};
  return notificationsCache;
}

export async function saveTrackingNotifications(data: Record<string, TrackingNotificationEntry>): Promise<void> {
  notificationsCache = data;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[TrackingNotificationService] Error writing local notifications file:', err);
  }

  // Backup to Supabase categories table with slug '_app_tracking_notifications'
  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      const summaryString = JSON.stringify(data);
      await supabase.from('categories').upsert({
        name: 'Tracking Notification State',
        slug: '_app_tracking_notifications',
        description: summaryString,
        display_order: 998
      }, { onConflict: 'slug' });
    }
  } catch (sbErr) {
    console.warn('[TrackingNotificationService] Error saving to Supabase fallback:', sbErr);
  }
}

/**
 * Determines whether a customer needs a tracking update email.
 * Returns true if:
 * 1. forceEmail is true
 * 2. An AWB has been newly assigned (e.g. from none to a valid code)
 * 3. The normalized status has transitioned (e.g. CONFIRMED -> DISPATCHED -> IN_TRANSIT -> OUT_FOR_DELIVERY -> DELIVERED)
 * 4. A new courier scan / location activity has arrived that hasn't been emailed yet
 */
export function shouldNotifyCustomer(
  orderNumber: string,
  currentStatus: string,
  currentAwb?: string,
  currentScan?: string,
  forceEmail = false
): { shouldNotify: boolean; reason: string } {
  if (forceEmail) {
    return { shouldNotify: true, reason: 'Manual or forced dispatch triggered' };
  }

  if (!currentAwb || currentAwb === 'PENDING' || currentAwb.startsWith('SR-EXP')) {
    return { shouldNotify: false, reason: 'No valid carrier AWB generated yet' };
  }

  const allRecords = loadTrackingNotifications();
  const record = allRecords[orderNumber];

  if (!record) {
    // First time we see this AWB for this order
    return { shouldNotify: true, reason: 'Initial AWB and dispatch details notification' };
  }

  const normCurrentStatus = currentStatus.toUpperCase();
  const normLastStatus = (record.lastNotifiedStatus || '').toUpperCase();

  // Status changed
  if (normCurrentStatus !== normLastStatus) {
    return { 
      shouldNotify: true, 
      reason: `Status transition from ${normLastStatus || 'UNRECORDED'} to ${normCurrentStatus}` 
    };
  }

  // AWB changed
  if (currentAwb && currentAwb !== record.lastNotifiedAwb) {
    return { 
      shouldNotify: true, 
      reason: `AWB updated from ${record.lastNotifiedAwb || 'NONE'} to ${currentAwb}` 
    };
  }

  // New scan activity note
  const cleanCurrentScan = (currentScan || '').trim();
  const cleanLastScan = (record.lastNotifiedScan || '').trim();
  if (cleanCurrentScan && cleanCurrentScan !== cleanLastScan && cleanCurrentScan !== 'Shipment in progress') {
    return { 
      shouldNotify: true, 
      reason: `New carrier tracking scan: "${cleanCurrentScan}"` 
    };
  }

  return { shouldNotify: false, reason: 'No new tracking updates since last notification' };
}

/**
 * Records that a tracking notification email was successfully dispatched for an order
 */
export async function recordCustomerNotification(
  orderNumber: string,
  customerEmail: string,
  status: string,
  awb: string,
  scan?: string,
  messageId?: string
): Promise<void> {
  const allRecords = loadTrackingNotifications();
  const existing = allRecords[orderNumber] || {
    orderNumber,
    customerEmail,
    lastNotifiedStatus: '',
    lastNotifiedAwb: '',
    notifiedAt: '',
    history: []
  };

  const nowIso = new Date().toISOString();
  existing.customerEmail = customerEmail;
  existing.lastNotifiedStatus = status.toUpperCase();
  existing.lastNotifiedAwb = awb;
  if (scan) existing.lastNotifiedScan = scan;
  existing.notifiedAt = nowIso;

  if (!Array.isArray(existing.history)) {
    existing.history = [];
  }

  existing.history.push({
    status: status.toUpperCase(),
    awb,
    scan,
    sentAt: nowIso,
    messageId
  });

  allRecords[orderNumber] = existing;
  await saveTrackingNotifications(allRecords);
}

export function getTrackingNotificationHistory(orderNumber: string): TrackingNotificationEntry | null {
  const allRecords = loadTrackingNotifications();
  return allRecords[orderNumber] || null;
}
