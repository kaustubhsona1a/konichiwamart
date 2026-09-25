/**
 * Resend Email Integration Service
 * Dispatches automated order confirmations with GST Tax Invoices
 */
import { Resend } from 'resend';
import { InvoiceData, generateGSTInvoiceHtml, SELLER_DETAILS } from './invoice';

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export interface EmailDispatchResult {
  success: boolean;
  messageId?: string;
  isSimulated?: boolean;
  error?: string;
}

/**
 * Sends order confirmation email with GST Tax Invoice details to the customer
 */
export async function sendOrderInvoiceEmail(data: InvoiceData): Promise<EmailDispatchResult> {
  const client = getResendClient();

  // If RESEND_API_KEY is not configured, run safely in mock/development logging mode
  if (!client) {
    console.log(`[Resend Email] (Development Mode) Invoice ${data.invoiceNumber} prepared for ${data.customerEmail}. Set RESEND_API_KEY to send real emails.`);
    return {
      success: true,
      messageId: `sim_msg_${Date.now()}`,
      isSimulated: true
    };
  }

  try {
    const invoiceHtml = generateGSTInvoiceHtml(data);
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'Konichiwa Mart <info@konichiwamart.com>';

    const response = await client.emails.send({
      from: fromAddress,
      replyTo: 'info@konichiwamart.com',
      to: [data.customerEmail],
      bcc: ['info@konichiwamart.com'],
      subject: `Order Confirmed: #${data.orderNumber} - Your Tax Invoice from Konichiwa Mart`,
      html: `
        <div style="font-family: sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #e11d48; margin-bottom: 8px;">Arigatou Gozaimasu, ${data.customerName}! 🌸</h2>
          <p style="font-size: 14px; line-height: 1.5;">
            Your order <strong>#${data.orderNumber}</strong> has been successfully confirmed and verified. 
            We are preparing your authentic Japanese beauty essentials for dispatch from our Mumbai hub.
          </p>

          <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0 0 6px 0; font-size: 13px;"><strong>Delivery Address:</strong></p>
            <p style="margin: 0; font-size: 13px; color: #475569;">
              ${data.customerName}<br>
              ${data.addressLine1}${data.addressLine2 ? ', ' + data.addressLine2 : ''}<br>
              ${data.city}, ${data.state} - ${data.pincode}
            </p>
            <p style="margin: 12px 0 0 0; font-size: 13px;">
              <strong>Courier Partner:</strong> ${data.courierPartner || 'Shiprocket Express'}<br>
              <strong>AWB Tracking:</strong> ${data.awbNumber || 'Generating...'}
            </p>
          </div>

          <div style="margin: 24px 0;">
            <h3 style="font-size: 15px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Order Summary</h3>
            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
              ${data.items.map(item => `
                <tr>
                  <td style="padding: 6px 0; border-bottom: 1px solid #f1f5f9;">${item.name} (x${item.quantity})</td>
                  <td style="padding: 6px 0; text-align: right; border-bottom: 1px solid #f1f5f9;">₹${item.totalPrice.toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr>
                <td style="padding: 6px 0; font-weight: bold;">Grand Total (Price inclusive of all taxes):</td>
                <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #e11d48;">₹${data.totalAmount.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 12px; color: #64748b;">
            Your official GST Tax Invoice (Invoice #${data.invoiceNumber}) is attached below and stored in your account.
          </p>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          <p style="font-size: 11px; color: #94a3b8; text-align: center;">
            ${SELLER_DETAILS.tradeName} • ${SELLER_DETAILS.supportEmail}<br>
            Authentic Japanese Cosmetics Imported Directly From Japan
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `Tax-Invoice-${data.invoiceNumber}.html`,
          content: Buffer.from(invoiceHtml)
        }
      ]
    });

    if (response.error) {
      console.error('[Resend Email] API Error:', response.error);
      return {
        success: false,
        error: response.error.message
      };
    }

    return {
      success: true,
      messageId: response.data?.id
    };
  } catch (err: any) {
    console.error('[Resend Email] Network exception sending invoice:', err);
    return {
      success: false,
      error: err.message || 'Failed to send email.'
    };
  }
}

/**
 * Sends an immediate, high-priority New Order notification email to the store owner & admin team
 */
export async function sendNewOrderOwnerNotification(data: InvoiceData): Promise<EmailDispatchResult> {
  const client = getResendClient();
  if (!client) {
    console.log(`[Resend Email] (Development Mode) Owner notification for order #${data.orderNumber} prepared.`);
    return { success: true, messageId: `sim_msg_${Date.now()}`, isSimulated: true };
  }

  try {
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'Konichiwa Mart <info@konichiwamart.com>';
    
    // Store owner and admin notification recipients (exclusive of customer accounts)
    const ownerRecipients = Array.from(new Set([
      'info@konichiwamart.com',
      process.env.ADMIN_NOTIFICATION_EMAIL,
      process.env.STORE_OWNER_EMAIL
    ].filter(Boolean)))
      .filter((addr): addr is string => typeof addr === 'string' && addr.trim().toLowerCase() !== 'kaustubhsona1a@gmail.com');

    const response = await client.emails.send({
      from: fromAddress,
      replyTo: data.customerEmail,
      to: ownerRecipients,
      subject: `🚨 New Order Confirmed! #${data.orderNumber} – ₹${data.totalAmount.toLocaleString('en-IN')} (${data.customerName})`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; max-width: 620px; margin: 0 auto; padding: 24px; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);">
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #be123c 0%, #e11d48 100%); border-radius: 12px; padding: 20px; text-align: center; color: #ffffff; margin-bottom: 24px;">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 800; opacity: 0.9; margin-bottom: 4px;">Konichiwa Mart Merchant Alert</div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">🛍️ New Order Received!</h1>
            <div style="font-size: 14px; font-weight: 600; margin-top: 6px; opacity: 0.95;">Order #${data.orderNumber} • ₹${data.totalAmount.toLocaleString('en-IN')} (Paid)</div>
          </div>

          <!-- Quick Summary Card -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; width: 140px;">Order Amount:</td>
                <td style="padding: 6px 0; font-weight: 800; color: #0f172a; font-size: 16px;">₹${data.totalAmount.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Payment Method:</td>
                <td style="padding: 6px 0; font-weight: 700; color: #059669;">${data.paymentMethod || 'Razorpay Prepaid'} (ID: ${data.paymentId || 'Prepaid'})</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Order Date:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #334155;">${data.date}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">GST Invoice No:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #334155;">${data.invoiceNumber}</td>
              </tr>
            </table>
          </div>

          <!-- Customer & Delivery Details -->
          <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #9f1239; text-transform: uppercase; letter-spacing: 0.05em;">Customer & Delivery Details</h3>
            <div style="font-size: 13px; line-height: 1.6; color: #334155;">
              <p style="margin: 0 0 6px 0;"><strong>Name:</strong> ${data.customerName}</p>
              <p style="margin: 0 0 6px 0;"><strong>Phone:</strong> <a href="tel:${data.customerPhone || ''}" style="color: #be123c; font-weight: 700; text-decoration: none;">${data.customerPhone || 'Not provided'}</a></p>
              <p style="margin: 0 0 8px 0;"><strong>Email:</strong> <a href="mailto:${data.customerEmail}" style="color: #be123c; text-decoration: underline;">${data.customerEmail}</a></p>
              <hr style="border: none; border-top: 1px solid #fbcfe8; margin: 10px 0;">
              <p style="margin: 0;"><strong>Shipping Address:</strong><br>
                ${data.customerName}<br>
                ${data.addressLine1}${data.addressLine2 ? ', ' + data.addressLine2 : ''}<br>
                ${data.city}, ${data.state} - <strong>${data.pincode}</strong>, India
              </p>
            </div>
          </div>

          <!-- Logistics & Shiprocket Info -->
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.05em;">📦 Shiprocket Logistics</h3>
            <p style="margin: 0; font-size: 13px; color: #15803d; line-height: 1.5;">
              <strong>Courier Partner:</strong> ${data.courierPartner || 'Shiprocket Express'}<br>
              <strong>AWB Number:</strong> ${data.awbNumber || 'Auto-Generating...'}<br>
              ${data.awbNumber ? `<a href="https://shiprocket.co/tracking/${data.awbNumber}" target="_blank" style="color: #15803d; font-weight: 700; text-decoration: underline; font-size: 12px;">Track on Shiprocket &rarr;</a>` : ''}
            </p>
          </div>

          <!-- Items Ordered -->
          <div style="margin-bottom: 24px;">
            <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px;">Items to Pack & Dispatch</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <thead>
                <tr style="background: #f8fafc; color: #64748b; text-align: left;">
                  <th style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">Item</th>
                  <th style="padding: 8px 10px; text-align: center; border-bottom: 1px solid #e2e8f0;">Qty</th>
                  <th style="padding: 8px 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">Price</th>
                  <th style="padding: 8px 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${data.items.map(item => `
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #1e293b;">
                      ${item.name}
                      ${(item as any).shade ? `<div style="font-size: 11px; color: #e11d48; font-weight: normal;">Shade: ${(item as any).shade}</div>` : ''}
                    </td>
                    <td style="padding: 10px; text-align: center; border-bottom: 1px solid #f1f5f9; font-weight: 700; color: #0f172a;">x${item.quantity}</td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #f1f5f9; color: #64748b;">₹${item.unitPrice.toFixed(2)}</td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #f1f5f9; font-weight: 700; color: #0f172a;">₹${item.totalPrice.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="padding: 8px 10px; text-align: right; color: #64748b;">Subtotal:</td>
                  <td style="padding: 8px 10px; text-align: right; font-weight: 600;">₹${data.subtotal.toFixed(2)}</td>
                </tr>
                ${data.discountAmount > 0 ? `
                  <tr>
                    <td colspan="3" style="padding: 6px 10px; text-align: right; color: #16a34a;">Discount Applied:</td>
                    <td style="padding: 6px 10px; text-align: right; color: #16a34a; font-weight: 600;">-₹${data.discountAmount.toFixed(2)}</td>
                  </tr>
                ` : ''}
                <tr>
                  <td colspan="3" style="padding: 6px 10px; text-align: right; color: #64748b;">Shipping Fee:</td>
                  <td style="padding: 6px 10px; text-align: right; font-weight: 600;">₹${data.shippingFee.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="3" style="padding: 10px; text-align: right; font-weight: 800; font-size: 14px; border-top: 2px solid #e2e8f0;">Total Order Value:</td>
                  <td style="padding: 10px; text-align: right; font-weight: 800; font-size: 16px; color: #be123c; border-top: 2px solid #e2e8f0;">₹${data.totalAmount.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Call to Action -->
          <div style="text-align: center; margin: 28px 0 16px 0;">
            <a href="https://www.konichiwamart.com/?admin=orders" target="_blank" style="background-color: #be123c; color: #ffffff; padding: 14px 32px; border-radius: 9999px; text-decoration: none; font-size: 14px; font-weight: 700; display: inline-block; box-shadow: 0 4px 14px rgba(190, 18, 60, 0.35);">
              Open Orders in Store Admin Portal &rarr;
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0 16px 0;">
          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
            ${SELLER_DETAILS.tradeName} Merchant Operations • Direct Notification System<br>
            Sent automatically when a customer completes checkout.
          </p>
        </div>
      `
    });

    if (response.error) {
      console.warn('[Resend Owner Alert Error]:', response.error.message);
      return { success: false, error: response.error.message };
    }

    console.log(`[Resend SUCCESS] New order owner notification sent to ${ownerRecipients.join(', ')} for #${data.orderNumber}`);
    return { success: true, messageId: response.data?.id };
  } catch (err: any) {
    console.error('[Resend Owner Alert Exception]:', err);
    return { success: false, error: err.message || 'Failed to dispatch owner notification.' };
  }
}

/**
 * Sends a live test email to verify domain & API key setup
 */
export async function sendTestEmail(toEmail: string): Promise<EmailDispatchResult> {
  const client = getResendClient();
  if (!client) {
    return {
      success: false,
      error: 'RESEND_API_KEY environment variable is not configured. Please add it in project Settings.'
    };
  }

  try {
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'Konichiwa Mart <info@konichiwamart.com>';
    const response = await client.emails.send({
      from: fromAddress,
      to: [toEmail],
      subject: '🌸 Resend Setup Verified - Konichiwa Mart Japan',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; max-width: 540px; margin: 0 auto; padding: 30px 20px; background: #ffffff; border-radius: 12px; border: 1px solid #f1f5f9;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 36px;">🌸</span>
            <h1 style="color: #be185d; margin: 8px 0 4px 0; font-size: 22px; font-weight: 700;">Konichiwa Mart</h1>
            <p style="color: #64748b; font-size: 13px; margin: 0;">Direct-From-Japan Luxury Cosmetics</p>
          </div>
          <div style="background: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 8px; padding: 18px; margin-bottom: 20px;">
            <h3 style="color: #9d174d; margin: 0 0 8px 0; font-size: 15px; font-weight: 600;">✅ Resend Verification Successful!</h3>
            <p style="color: #475569; font-size: 13px; line-height: 1.6; margin: 0;">
              Your domain <strong>konichiwamart.com</strong> and Resend integration are connected. All customer order confirmations, GST tax invoices, and dispatch tracking emails will now be automatically dispatched.
            </p>
          </div>
          <div style="font-size: 12px; color: #64748b; line-height: 1.5;">
            <strong>Sender:</strong> ${fromAddress}<br>
            <strong>Timestamp:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
          </div>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
            ${SELLER_DETAILS.tradeName} • Japan to India Direct Logistics
          </p>
        </div>
      `
    });

    if (response.error) {
      return { success: false, error: response.error.message };
    }

    return { success: true, messageId: response.data?.id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to send test email.' };
  }
}

/**
 * Sends a custom branded Password Reset email to the customer using Resend from info@konichiwamart.com
 */
export async function sendPasswordResetEmail(
  toEmail: string, 
  resetLink: string, 
  otpCode?: string
): Promise<EmailDispatchResult> {
  const client = getResendClient();
  if (!client) {
    return {
      success: false,
      error: 'RESEND_API_KEY environment variable is not configured.'
    };
  }

  try {
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'Konichiwa Mart <info@konichiwamart.com>';
    const response = await client.emails.send({
      from: fromAddress,
      replyTo: 'info@konichiwamart.com',
      to: [toEmail],
      subject: '🔒 Reset Your Konichiwa Mart Account Password',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; max-width: 540px; margin: 0 auto; padding: 28px; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 12px; background: #fff1f2; font-size: 26px;">🌸</div>
            <h2 style="color: #be123c; margin: 12px 0 4px 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">Konichiwa Mart</h2>
            <p style="color: #64748b; font-size: 13px; margin: 0; font-weight: 500;">Direct-From-Japan Luxury Cosmetics</p>
          </div>
          
          <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
            <h3 style="color: #0f172a; margin: 0 0 8px 0; font-size: 16px; font-weight: 700;">Password Reset Request</h3>
            <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0;">
              Hello,<br>
              We received a request to reset your password for your Konichiwa Mart account (<strong>${toEmail}</strong>).
            </p>
          </div>

          ${otpCode ? `
          <div style="background: #fff1f2; border: 2px dashed #fda4af; border-radius: 12px; padding: 18px; text-align: center; margin: 20px 0;">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #9f1239; margin-bottom: 6px; font-weight: 800;">Your Security / OTP Verification Code</div>
            <div style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #be123c; font-family: ui-monospace, Menlo, Monaco, Consolas, monospace;">${otpCode}</div>
            <div style="font-size: 11px; color: #9f1239; margin-top: 6px;">Enter this 8-digit code on the reset password screen.</div>
          </div>
          ` : ''}

          <div style="text-align: center; margin: 24px 0;">
            <a href="${resetLink}" target="_blank" style="background-color: #e11d48; color: #ffffff; padding: 14px 32px; border-radius: 9999px; text-decoration: none; font-size: 14px; font-weight: 700; display: inline-block; box-shadow: 0 4px 14px rgba(225, 29, 72, 0.35);">
              Reset Password
            </a>
          </div>

          <p style="font-size: 12px; line-height: 1.6; color: #64748b;">
            If the button doesn't open, copy and paste this link into your browser:<br>
            <a href="${resetLink}" style="color: #be123c; word-break: break-all; text-decoration: underline;">${resetLink}</a>
          </p>

          <div style="background: #f1f5f9; border-radius: 8px; padding: 12px 16px; margin: 24px 0;">
            <p style="font-size: 11px; color: #64748b; margin: 0; line-height: 1.5;">
              🔒 <strong>Security Notice:</strong> If you did not request a password reset, please ignore this email. Your account password remains completely safe and unchanged.
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;">
          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
            ${SELLER_DETAILS.tradeName} • Direct Logistics<br>
            Sent from: <a href="mailto:info@konichiwamart.com" style="color: #be123c;">info@konichiwamart.com</a>
          </p>
        </div>
      `
    });

    if (response.error) {
      console.error('[Resend Password Reset Error]:', response.error);
      return { success: false, error: response.error.message };
    }

    return { success: true, messageId: response.data?.id };
  } catch (err: any) {
    console.error('[Resend Password Reset Exception]:', err);
    return { success: false, error: err.message || 'Failed to send reset email.' };
  }
}

/**
 * Sends a custom branded Welcome Email to newly registered customers using Resend from info@konichiwamart.com
 */
export async function sendCustomerWelcomeEmail(toEmail: string, fullName: string): Promise<EmailDispatchResult> {
  const client = getResendClient();
  if (!client) {
    return { success: false, error: 'RESEND_API_KEY environment variable is not configured.' };
  }

  try {
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'Konichiwa Mart <info@konichiwamart.com>';
    const response = await client.emails.send({
      from: fromAddress,
      replyTo: 'info@konichiwamart.com',
      to: [toEmail],
      subject: '🌸 Welcome to Konichiwa Mart – 100% Authentic Japanese Cosmetics',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; max-width: 540px; margin: 0 auto; padding: 28px; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 12px; background: #fff1f2; font-size: 26px;">🌸</div>
            <h2 style="color: #be123c; margin: 12px 0 4px 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">Welcome to Konichiwa Mart!</h2>
            <p style="color: #64748b; font-size: 13px; margin: 0;">Direct-From-Japan Luxury Cosmetics & Skincare</p>
          </div>
          
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            Konnichiwa, <strong>${fullName || 'valued customer'}</strong>!
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #475569;">
            Thank you for creating an account with Konichiwa Mart. You can now save multiple shipping addresses, track your orders in real-time with Shiprocket logistics, and receive GST tax invoices directly to your email.
          </p>

          <div style="background: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 12px; padding: 18px; margin: 20px 0;">
            <div style="font-size: 13px; font-weight: 700; color: #9d174d; margin-bottom: 6px;">✨ What Makes Konichiwa Mart Special:</div>
            <ul style="font-size: 12px; color: #701a75; line-height: 1.7; margin: 0; padding-left: 20px;">
              <li>100% Authentic Direct Import from Japan</li>
              <li>GST Compliant with Official HSN 3304 Tax Invoices</li>
              <li>Insured Express Dispatch across India</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <a href="https://konichiwamart.com" target="_blank" style="background-color: #e11d48; color: #ffffff; padding: 12px 30px; border-radius: 9999px; text-decoration: none; font-size: 14px; font-weight: 700; display: inline-block;">
              Browse Japanese Catalog
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;">
          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
            ${SELLER_DETAILS.tradeName} • Support: <a href="mailto:info@konichiwamart.com" style="color: #be123c;">info@konichiwamart.com</a>
          </p>
        </div>
      `
    });

    if (response.error) {
      console.warn('[Resend Welcome Email Notice]:', response.error.message);
      return { success: false, error: response.error.message };
    }

    return { success: true, messageId: response.data?.id };
  } catch (err: any) {
    console.warn('[Resend Welcome Email Exception]:', err);
    return { success: false, error: err.message || 'Failed to send welcome email.' };
  }
}
