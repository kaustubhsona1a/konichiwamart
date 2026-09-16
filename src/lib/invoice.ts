/**
 * GST Tax Invoice Generator Service
 * Conforms to Central Goods and Services Tax Rules, 2017 (India)
 * Applicable HSN Code: 3304 (Beauty, cosmetics, and skincare preparations)
 */

export interface InvoiceItem {
  name: string;
  sku: string;
  hsn: string;
  quantity: number;
  unitPrice: number; // inclusive or exclusive
  totalPrice: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  orderNumber: string;
  date: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  items: InvoiceItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentId: string;
  awbNumber?: string;
  courierPartner?: string;
}

export const SELLER_DETAILS = {
  companyName: 'Konichiwa Mart Retail Pvt. Ltd.',
  tradeName: 'Konichiwa Mart - Boutique Japanese Beauty & Cosmetics',
  addressLine1: 'Unit 402, Trade World B-Wing, Kamala Mills Compound',
  addressLine2: 'Lower Parel West, Mumbai',
  city: 'Mumbai',
  state: 'Maharashtra',
  stateCode: '27',
  pincode: '400013',
  country: 'India',
  supportEmail: 'care@konichiwamart.in',
  supportPhone: '+91 (022) 4890 2341'
};

/**
 * Checks whether the transaction is Intrastate (CGST 9% + SGST 9%)
 * or Interstate (IGST 18%) based on customer delivery state
 */
export function calculateGSTSplit(subtotal: number, deliveryState: string) {
  const isIntrastate = (deliveryState || '').trim().toLowerCase() === 'maharashtra';
  const taxRate = 0.18; // 18% standard GST for beauty & cosmetics HSN 3304

  // Taxable amount assuming prices include 18% GST (Standard Indian B2C E-commerce pricing)
  const taxableValue = Number((subtotal / (1 + taxRate)).toFixed(2));
  const totalGst = Number((subtotal - taxableValue).toFixed(2));

  if (isIntrastate) {
    const cgst = Number((totalGst / 2).toFixed(2));
    const sgst = Number((totalGst - cgst).toFixed(2));
    return {
      isIntrastate: true,
      taxableValue,
      cgst,
      sgst,
      igst: 0,
      totalGst
    };
  } else {
    return {
      isIntrastate: false,
      taxableValue,
      cgst: 0,
      sgst: 0,
      igst: totalGst,
      totalGst
    };
  }
}

/**
 * Converts a number to Indian Rupee Words (e.g. 2450 -> Two Thousand Four Hundred Fifty Rupees Only)
 */
export function numberToINRWords(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded === 0) return 'Zero Rupees Only';

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function numToWords(n: number): string {
    if (n < 20) return units[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + units[n % 10] : '');
    if (n < 1000) return units[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + numToWords(n % 100) : '');
    if (n < 100000) return numToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + numToWords(n % 1000) : '');
    if (n < 10000000) return numToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + numToWords(n % 100000) : '');
    return numToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + numToWords(n % 10000000) : '');
  }

  return `${numToWords(rounded)} Rupees Only`;
}

/**
 * Generates an in-memory, HTML/Printable GST Tax Invoice
 * Ready for viewing or piping to headless PDF generators
 */
export function generateGSTInvoiceHtml(data: InvoiceData): string {
  const isIntrastate = data.igst === 0;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>GST Tax Invoice - ${data.invoiceNumber}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 11px; line-height: 1.4; color: #1e293b; margin: 0; padding: 24px; }
    .invoice-card { max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 24px; border-radius: 8px; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e11d48; padding-bottom: 12px; margin-bottom: 16px; }
    .logo-brand { font-size: 18px; font-weight: bold; color: #e11d48; }
    .invoice-title { font-size: 16px; font-weight: bold; text-align: right; color: #0f172a; }
    .grid-2 { display: flex; justify-content: space-between; margin-bottom: 16px; }
    .col { width: 48%; }
    .col-title { font-weight: bold; font-size: 11px; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 10.5px; }
    th { background: #f8fafc; border: 1px solid #cbd5e1; padding: 6px; text-align: left; }
    td { border: 1px solid #e2e8f0; padding: 6px; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .summary-table { width: 300px; margin-left: auto; margin-top: 12px; }
    .badge { display: inline-block; padding: 2px 6px; background: #dcfce7; color: #166534; font-weight: bold; border-radius: 4px; font-size: 9.5px; }
    .footer { margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 9.5px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div>
        <div class="logo-brand">${SELLER_DETAILS.tradeName}</div>
        <div>${SELLER_DETAILS.addressLine1}</div>
        <div>${SELLER_DETAILS.addressLine2}, ${SELLER_DETAILS.city} - ${SELLER_DETAILS.pincode}</div>
        <div><strong>State:</strong> Maharashtra (Code: 27)</div>
      </div>
      <div>
        <div class="invoice-title">TAX INVOICE</div>
        <div><strong>Invoice No:</strong> ${data.invoiceNumber}</div>
        <div><strong>Order No:</strong> ${data.orderNumber}</div>
        <div><strong>Date:</strong> ${data.date}</div>
        <div><span class="badge">PAID • VERIFIED</span></div>
      </div>
    </div>

    <div class="grid-2">
      <div class="col">
        <div class="col-title">Billed & Shipped To:</div>
        <div><strong>${data.customerName}</strong></div>
        <div>${data.addressLine1}</div>
        ${data.addressLine2 ? `<div>${data.addressLine2}</div>` : ''}
        <div>${data.city}, ${data.state} - ${data.pincode}</div>
        <div><strong>Phone:</strong> ${data.customerPhone}</div>
        <div><strong>Email:</strong> ${data.customerEmail}</div>
      </div>
      <div class="col">
        <div class="col-title">Logistics & Dispatch:</div>
        <div><strong>Courier Partner:</strong> ${data.courierPartner || 'Shiprocket Express'}</div>
        <div><strong>AWB Tracking:</strong> ${data.awbNumber || 'Assigned on Pickup'}</div>
        <div><strong>Payment Mode:</strong> ${data.paymentMethod} (ID: ${data.paymentId})</div>
        <div><strong>Reverse Charge Applicable:</strong> No</div>
        <div><strong>Place of Supply:</strong> ${data.state}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Description of Goods</th>
          <th class="text-center">HSN</th>
          <th class="text-center">Qty</th>
          <th class="text-right">Rate (₹)</th>
          <th class="text-right">Total (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${data.items.map((item, i) => `
          <tr>
            <td class="text-center">${i + 1}</td>
            <td><strong>${item.name}</strong><br><span style="color: #64748b; font-size: 9px;">SKU: ${item.sku}</span></td>
            <td class="text-center">${item.hsn || '3304'}</td>
            <td class="text-center">${item.quantity}</td>
            <td class="text-right">${item.unitPrice.toFixed(2)}</td>
            <td class="text-right">${item.totalPrice.toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <table class="summary-table">
      <tr>
        <td>Subtotal:</td>
        <td class="text-right">₹${data.subtotal.toFixed(2)}</td>
      </tr>
      ${data.discountAmount > 0 ? `
      <tr style="color: #e11d48;">
        <td>Discount:</td>
        <td class="text-right">-₹${data.discountAmount.toFixed(2)}</td>
      </tr>` : ''}
      ${isIntrastate ? `
      <tr>
        <td>CGST (9%):</td>
        <td class="text-right">₹${data.cgst.toFixed(2)}</td>
      </tr>
      <tr>
        <td>SGST (9%):</td>
        <td class="text-right">₹${data.sgst.toFixed(2)}</td>
      </tr>
      ` : `
      <tr>
        <td>IGST (18%):</td>
        <td class="text-right">₹${data.igst.toFixed(2)}</td>
      </tr>
      `}
      <tr>
        <td>Shipping Charges:</td>
        <td class="text-right">${data.shippingFee === 0 ? 'FREE' : '₹' + data.shippingFee.toFixed(2)}</td>
      </tr>
      <tr style="font-weight: bold; font-size: 13px; border-top: 2px solid #0f172a;">
        <td>Grand Total:</td>
        <td class="text-right">₹${data.totalAmount.toFixed(2)}</td>
      </tr>
    </table>

    <div style="margin-top: 12px; font-size: 10px;">
      <strong>Amount in Words:</strong> ${numberToINRWords(data.totalAmount)}
    </div>

    <div class="footer">
      This is a computer-generated tax invoice issued under Rule 46 of the CGST Rules, 2017. No signature required.<br>
      Imported Japanese Cosmetics • Authenticity Guaranteed • Questions? Contact ${SELLER_DETAILS.supportEmail}
    </div>
  </div>
</body>
</html>
  `.trim();
}
