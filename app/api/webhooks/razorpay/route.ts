import { processRazorpayWebhook } from '@/lib/webhookHandler';

/**
 * Next.js App Router Route Handler: POST /api/webhooks/razorpay
 * Validates HMAC-SHA256 signature, enforces idempotency, triggers Shiprocket and Resend
 * Compatible with standard Web Request/Response API in Next.js App Router
 */
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || undefined;

    const result = await processRazorpayWebhook(rawBody, signature);

    return Response.json(
      { message: result.message, orderNumber: result.orderNumber, isDuplicate: result.isDuplicate },
      { status: result.statusCode }
    );
  } catch (error: any) {
    console.error('[API Webhook Razorpay Error]:', error);
    return Response.json(
      { error: error.message || 'Internal webhook error.' },
      { status: 500 }
    );
  }
}
