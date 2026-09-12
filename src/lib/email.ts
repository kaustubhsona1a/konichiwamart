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
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'Konichiwa Mart <orders@konichiwamart.in>';

    const response = await client.emails.send({
      from: fromAddress,
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
            Authentic Japanese Cosmetics Imported Directly From Tokyo
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `Tax-Invoice-${data.invoiceNumber}.html`,
          content: Buffer.from(invoiceHtml).toString('base64')
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
