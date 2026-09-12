import { createValidatedOrder } from '@/lib/orderService';

/**
 * Next.js App Router Route Handler: POST /api/checkout/create-order
 * Enforces server-side price validation, stock validation, and 18% GST split
 * Compatible with standard Web Request/Response API in Next.js App Router
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await createValidatedOrder(body);

    return Response.json(result, { status: 200 });
  } catch (error: any) {
    console.error('[API Checkout Create Order Error]:', error);
    return Response.json(
      { success: false, error: error.message || 'Failed to create order.' },
      { status: 400 }
    );
  }
}
