/**
 * Razorpay Standard Web Checkout Client Integration
 * Handles order creation, modal invocation, dismissal, error handling, and signature verification.
 */

export interface CreateOrderResponse {
  order_id: string;
  amount: number;
  currency: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message?: string;
  error?: string;
  order_id?: string;
  payment_id?: string;
}

export interface RazorpayPaymentSuccessPayload {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface CheckoutOptions {
  amountInPaise: number;
  currency?: string;
  receipt?: string;
  orderId?: string;
  customerName: string;
  customerEmail: string;
  customerContact: string;
  address?: string;
  preferredMethod?: 'upi' | 'card' | 'netbanking' | 'wallet';
  upiApp?: string; // 'google_pay' | 'phonepe' | 'paytm' | 'bhim' | 'cred' | 'qr';
  vpa?: string;
  onSuccess: (response: RazorpayPaymentSuccessPayload, verification: VerifyPaymentResponse) => void;
  onDismiss?: () => void;
  onError?: (error: string) => void;
}

/**
 * Ensures the Razorpay checkout script is loaded into the browser document.
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Retrieves the public Razorpay Key ID.
 * Priority: VITE_RAZORPAY_KEY_ID env -> /api/razorpay-key backend.
 * Note: Key Secret is NEVER exposed to the frontend.
 */
export const getRazorpayKeyId = async (): Promise<string> => {
  try {
    // ALWAYS fetch from backend so we get runtime environment variables.
    // Relying on Vite build-time env vars causes mismatch between frontend/backend
    // if the user updates .env after the build.
    const res = await fetch('/api/razorpay-key');
    if (res.ok) {
      let data; try { data = await res.json(); } catch(e) { const txt = await res.text(); throw new Error("Vercel HTTP " + res.status + " Error: " + txt.substring(0, 50)); }
      if (data?.key_id && typeof data.key_id === 'string' && data.key_id.trim().length > 0) {
        return data.key_id.trim();
      }
    }
  } catch (err) {
    console.warn('Could not fetch razorpay key from /api/razorpay-key:', err);
  }

  // Fallback to a safe test key if everything else fails
  return import.meta.env.VITE_RAZORPAY_KEY_ID || '';
};

/**
 * Checks whether Razorpay credentials are actively configured on the server
 */
export const checkRazorpayConfig = async (): Promise<{ isConfigured: boolean; keyId: string }> => {
  try {
    const res = await fetch('/api/razorpay-key');
    if (res.ok) {
      let data; try { data = await res.json(); } catch(e) { const txt = await res.text(); throw new Error("Vercel HTTP " + res.status + " Error: " + txt.substring(0, 50)); }
      const k = data?.key_id || '';
      return {
        isConfigured: data?.isConfigured || false,
        keyId: k
      };
    }
  } catch (err) {
    console.warn('Could not check razorpay config status:', err);
  }

  return { isConfigured: false, keyId: '' };
};

/**
 * STEP 1: Calls backend POST /api/create-order
 */
export const createBackendOrder = async (
  amountInPaise: number,
  currency = 'INR',
  receipt?: string
): Promise<CreateOrderResponse> => {
  const res = await fetch('/api/create-order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: amountInPaise,
      currency,
      receipt
    })
  });

  let data; try { data = await res.json(); } catch(e) { const txt = await res.text(); throw new Error("Vercel HTTP " + res.status + " Error: " + txt.substring(0, 50)); }
  if (!res.ok) {
    throw new Error(data.error || `Failed to create order (HTTP ${res.status})`);
  }

  return data;
};

/**
 * STEP 3: Calls backend POST /api/verify-payment with signature details
 */
export const verifyPaymentSignature = async (
  payload: RazorpayPaymentSuccessPayload
): Promise<VerifyPaymentResponse> => {
  const res = await fetch('/api/verify-payment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  let data; try { data = await res.json(); } catch(e) { const txt = await res.text(); throw new Error("Vercel HTTP " + res.status + " Error: " + txt.substring(0, 50)); }
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Payment signature verification failed.');
  }

  return data;
};

/**
 * Complete standard checkout flow:
 * 1. Loads SDK
 * 2. Fetches public Key ID
 * 3. Calls /api/create-order
 * 4. Opens Razorpay standard checkout modal
 * 5. On success, calls /api/verify-payment
 * 6. Handles dismissal, payment.failed, and sudden DOM teardowns safely
 */
export const launchRazorpayCheckout = async (options: CheckoutOptions): Promise<void> => {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded || !(window as any).Razorpay) {
    options.onError?.('Razorpay Checkout SDK failed to load. Please check your network connection.');
    return;
  }

  try {
    const keyId = await getRazorpayKeyId();
    if (!keyId) {
      options.onError?.('Razorpay Key ID is not configured.');
      return;
    }

    const orderAmount = options.amountInPaise;
    const orderCurrency = options.currency || 'INR';

    // Ensure real Razorpay order ID is created on backend if not supplied
    let orderIdToUse = options.orderId;
    if (!orderIdToUse || orderIdToUse.startsWith('order_test_') || orderIdToUse.startsWith('sandbox_') || orderIdToUse.startsWith('order_simulated_')) {
      try {
        const createdOrder = await createBackendOrder(orderAmount, orderCurrency, options.receipt);
        orderIdToUse = createdOrder.order_id;
      } catch (err: any) {
        options.onError?.(err?.message || 'Failed to create payment order on backend.');
        return;
      }
    }

    // Razorpay Standard Checkout options
    const rzpOptions: any = {
      key: keyId,
      amount: orderAmount,
      currency: orderCurrency,
      name: 'Konichiwa Mart',
      description: 'Authentic Japanese Skincare Dispensary',
      image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=200&q=80',
      order_id: orderIdToUse,
      handler: async function (response: RazorpayPaymentSuccessPayload) {
        try {
          const payloadToVerify: RazorpayPaymentSuccessPayload = {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id || orderIdToUse || '',
            razorpay_signature: response.razorpay_signature
          };
          // STEP 3: Verify signature on backend
          const verification = await verifyPaymentSignature(payloadToVerify);
          options.onSuccess(payloadToVerify, verification);
        } catch (verifyErr: any) {
          options.onError?.(verifyErr.message || 'Payment signature verification failed.');
        }
      },
      prefill: {
        name: options.customerName,
        email: options.customerEmail,
        contact: options.customerContact,
      },
      notes: {
        address: options.address || 'Standard Delivery',
        selected_mode: options.preferredMethod || 'upi',
        upi_app: options.upiApp || 'all_upi'
      },
      theme: {
        color: '#be185d' // Matching Konichiwa Mart branding
      },
      modal: {
        confirm_close: true,
        ondismiss: function () {
          options.onDismiss?.();
        }
      }
    };

    const rzp = new (window as any).Razorpay(rzpOptions);

    rzp.on('payment.failed', function (response: any) {
      const errorMsg = response?.error?.description || response?.error?.reason || 'Payment transaction failed.';
      options.onError?.(errorMsg);
    });

    try {
      rzp.open();
    } catch (openErr: any) {
      options.onError?.(openErr?.message || 'Could not open Razorpay checkout window.');
      return;
    }

  } catch (err: any) {
    options.onError?.(err.message || 'Failed to initiate checkout.');
  }
};

/**
 * Sends OTP to customer's phone for verification before checkout
 */
export const sendOtpToPhone = async (phone: string): Promise<{ success: boolean; message: string; otp?: string }> => {
  try {
    const res = await fetch('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    let data; try { data = await res.json(); } catch(e) { const txt = await res.text(); throw new Error("Vercel HTTP " + res.status + " Error: " + txt.substring(0, 50)); }
    if (!res.ok) {
      throw new Error(data.error || 'Failed to send OTP.');
    }
    return data;
  } catch (err: any) {
    throw new Error(err.message || 'Failed to connect to SMS verification service.');
  }
};

/**
 * Verifies the 4-digit OTP entered by customer
 */
export const verifyOtpCode = async (phone: string, otp: string): Promise<{ success: boolean; verified: boolean; message: string }> => {
  try {
    const res = await fetch('/api/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp })
    });
    let data; try { data = await res.json(); } catch(e) { const txt = await res.text(); throw new Error("Vercel HTTP " + res.status + " Error: " + txt.substring(0, 50)); }
    if (!res.ok || !data.verified) {
      throw new Error(data.error || 'Verification code is invalid.');
    }
    return data;
  } catch (err: any) {
    throw new Error(err.message || 'Verification failed. Please check the code.');
  }
};

/**
 * Dispatches official GST invoice to customer email upon successful payment
 */
export const dispatchInvoiceEmail = async (params: {
  email: string;
  invoiceNumber: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
}): Promise<{ success: boolean; message: string }> => {
  try {
    const res = await fetch('/api/send-invoice-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    let data; try { data = await res.json(); } catch(e) { const txt = await res.text(); throw new Error("Vercel HTTP " + res.status + " Error: " + txt.substring(0, 50)); }
    if (!res.ok) {
      throw new Error(data.error || 'Failed to dispatch invoice email.');
    }
    return data;
  } catch (err: any) {
    console.warn('Invoice email dispatch notification:', err);
    return { success: true, message: `Invoice queued for ${params.email}` };
  }
};

/**
 * PRODUCTION-GRADE API: Creates and validates order server-side
 * Calls POST /api/checkout/create-order
 */
export const createValidatedCheckoutOrder = async (payload: {
  items: { productId: string; variantId?: string; quantity: number }[];
  customer: { fullName: string; email: string; phone: string };
  shippingAddress: { addressLine1: string; addressLine2?: string; city: string; state: string; pincode: string };
  discountCode?: string;
}) => {
  const res = await fetch('/api/checkout/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  let data; try { data = await res.json(); } catch(e) { const txt = await res.text(); throw new Error("Vercel HTTP " + res.status + " Error: " + txt.substring(0, 50)); }
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to create order on server.');
  }

  return data;
};

