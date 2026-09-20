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
                <td style="padding: 6px 0; font-weight: bold;">Grand Total (incl. 18% GST):</td>
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
 * Sends a custom branded Password Reset email to the customer using Resend
 */
export async function sendPasswordResetEmail(toEmail: string, resetLink: string): Promise<EmailDispatchResult> {
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
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; max-width: 520px; margin: 0 auto; padding: 24px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 36px;">🌸</span>
            <h2 style="color: #e11d48; margin: 8px 0 4px 0; font-size: 20px; font-weight: 700;">Konichiwa Mart</h2>
            <p style="color: #64748b; font-size: 13px; margin: 0;">Password Reset Request</p>
          </div>
          
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            Hello,
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            We received a request to reset the password for your Konichiwa Mart account (<strong>${toEmail}</strong>).
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" target="_blank" style="background-color: #e11d48; color: #ffffff; padding: 12px 28px; border-radius: 9999px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block; box-shadow: 0 4px 12px rgba(225, 29, 72, 0.25);">
              Reset Password
            </a>
          </div>

          <p style="font-size: 12px; line-height: 1.5; color: #64748b;">
            If the button above does not work, copy and paste this link into your browser:<br>
            <a href="${resetLink}" style="color: #e11d48; word-break: break-all;">${resetLink}</a>
          </p>

          <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">
            If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
          </p>

          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;">
          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
            ${SELLER_DETAILS.tradeName} • ${SELLER_DETAILS.supportEmail}
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
