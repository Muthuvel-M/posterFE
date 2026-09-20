/**
 * Formats a number into Indian Rupee Currency string
 * Example: formatCurrency(1250) => ₹1,250
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '₹0';
  }
  const numeric = typeof amount === 'number' ? amount : Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(numeric);
};

/**
 * Formats date into readable format
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return '-';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Formats datetime into readable format with time
 */
export const formatDateTime = (dateInput) => {
  if (!dateInput) return '-';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Builds standard UPI Payment Link
 * upi://pay?pa=<upiId>&pn=<name>&am=<total>&cu=INR&tn=<saleId>
 */
export const generateUPIUrl = ({ upiId, upiName, amount, saleNumber }) => {
  const cleanUpiId = (upiId || '').trim();
  const cleanName = (upiName || 'AuraFrame POS').trim();
  const amt = Number(amount || 0).toFixed(2);
  const note = saleNumber || 'Poster Sale';

  return `upi://pay?pa=${encodeURIComponent(cleanUpiId)}&pn=${encodeURIComponent(cleanName)}&am=${amt}&cu=INR&tn=${encodeURIComponent(note)}`;
};

/**
 * Formats WhatsApp Share Receipt message URL with custom store template
 */
export const generateWhatsAppReceiptUrl = (sale, settings) => {
  if (!sale) return '';
  const customerName =
    sale.customerSnapshot?.name || sale.customer?.name || sale.customerName || 'Friend';
  const rawPhone =
    sale.customerSnapshot?.phone || sale.customer?.phone || sale.phone || sale.customerPhone || '';

  const cleanPhone = String(rawPhone).replace(/[^0-9]/g, '');
  let targetPhone = '';
  if (cleanPhone.length === 10) {
    targetPhone = `91${cleanPhone}`;
  } else if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
    targetPhone = cleanPhone;
  } else if (cleanPhone.length > 5) {
    targetPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone.slice(-10)}`;
  }

  let msg = `Thank you, ${customerName}! 💛\n`;
  msg += `Your AuraFrame order is confirmed, and your receipt is attached. 🧾\n`;
  msg += `Hope your walls glow with your new posters! ✨\n`;
  msg += `Tag us @aura.frame26 when you put them up 📸\n\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `🧾 *RECEIPT #${sale.saleNumber || 'INV-001'}*\n`;
  msg += `📅 *Date:* ${formatDateTime(sale.createdAt || new Date())}\n`;
  msg += `🛍️ *Order Items:*\n`;

  (sale.items || []).forEach((item) => {
    msg += `• ${item.name} (${item.size || 'Standard'}) × ${item.qty} — ₹${item.qty * item.sellPrice}\n`;
  });

  msg += `─────────────────────\n`;
  msg += `Subtotal: ₹${sale.subtotal}\n`;
  if (sale.discount > 0) {
    msg += `Discount Applied: -₹${sale.discount}\n`;
  }
  msg += `*Total Paid: ₹${sale.total}*\n`;
  msg += `Payment Mode: ${(sale.paymentMethod || 'UPI').toUpperCase()}\n`;
  msg += `Status: PAID ✓\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `Instagram: @aura.frame26`;

  const encodedText = encodeURIComponent(msg);
  if (targetPhone) {
    return `https://wa.me/${targetPhone}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
};

/**
 * Formats WhatsApp Custom Order Receipt URL with itemized poster and frame details
 */
export const generateCustomOrderWhatsAppReceiptUrl = (order, settings) => {
  if (!order) return '';
  const customerName =
    order.customerSnapshot?.name || order.customer?.name || order.customerName || 'Friend';
  const rawPhone =
    order.customerSnapshot?.phone || order.customer?.phone || order.phone || '';

  const cleanPhone = String(rawPhone).replace(/[^0-9]/g, '');
  let targetPhone = '';
  if (cleanPhone.length === 10) {
    targetPhone = `91${cleanPhone}`;
  } else if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
    targetPhone = cleanPhone;
  } else if (cleanPhone.length > 5) {
    targetPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone.slice(-10)}`;
  }

  const orderNum = order.orderNumber || 'AF-CUST';
  const orderTitle = order.title || 'Custom Order';
  const placedDate = order.orderDate ? formatDate(order.orderDate) : formatDate(order.createdAt || new Date());
  const deliveryDate = order.deliveryDate ? formatDate(order.deliveryDate) : formatDate(order.dueDate);

  let msg = `Thank you, ${customerName}! 💛\n`;
  msg += `Your AuraFrame custom order is confirmed, and your receipt is attached. 🧾\n`;
  msg += `Hope your walls glow with your new posters! ✨\n`;
  msg += `Tag us @aura.frame26 when you put them up 📸\n\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `🧾 *CUSTOM ORDER #${orderNum}*\n`;
  msg += `📦 *Order:* ${orderTitle}\n`;
  msg += `📅 *Placed Date:* ${placedDate}\n`;
  if (deliveryDate && deliveryDate !== '-') {
    msg += `🚚 *Expected Delivery:* ${deliveryDate}\n`;
  }
  msg += `\n`;

  // Posters
  const posterTiers = Array.isArray(order.posterTiers) && order.posterTiers.length > 0
    ? order.posterTiers
    : (Array.isArray(order.sizeTiers) ? order.sizeTiers.filter((st) => st.type === 'poster' || (st.posterPrice && Number(st.posterPrice) > 0)) : []);

  if (posterTiers.length > 0) {
    msg += `🎨 *Poster Sizes:*\n`;
    posterTiers.forEach((pt) => {
      const count = Number(pt.count) || 1;
      const price = Number(pt.price) || Number(pt.posterPrice) || 0;
      msg += `• ${count}× ${pt.size || 'A4'} — ₹${count * price}\n`;
    });
    msg += `\n`;
  }

  // Frames
  const frameTiers = Array.isArray(order.frameTiers) && order.frameTiers.length > 0
    ? order.frameTiers
    : (Array.isArray(order.sizeTiers) ? order.sizeTiers.filter((st) => st.type === 'frame' || (st.framePrice && Number(st.framePrice) > 0)) : []);

  if (frameTiers.length > 0) {
    msg += `🔲 *Frame Sizes:*\n`;
    frameTiers.forEach((ft) => {
      const count = Number(ft.count) || 1;
      const price = Number(ft.price) || Number(ft.framePrice) || 0;
      msg += `• ${count}× ${ft.size || 'A4'} — ₹${count * price}\n`;
    });
    msg += `\n`;
  }

  const totalPrice = Number(order.pricing?.totalPrice) || 0;
  const advancePaid = Number(order.pricing?.advancePaid) || 0;
  const balanceDue = Number(order.pricing?.balanceDue) || Math.max(0, totalPrice - advancePaid);

  msg += `─────────────────────\n`;
  msg += `*Total Quoted: ₹${totalPrice}*\n`;
  msg += `Advance Paid: ₹${advancePaid}\n`;
  msg += `*Balance Due: ₹${balanceDue}*\n`;
  msg += `Payment Status: ${(order.paymentStatus || 'pending').toUpperCase()}\n`;
  msg += `Order Status: ${(order.orderStatus || 'received').toUpperCase()}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `Instagram: @aura.frame26`;

  const encodedText = encodeURIComponent(msg);
  if (targetPhone) {
    return `https://wa.me/${targetPhone}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
};

/**
 * Generates clean, standalone minimal HTML receipt for PDF export or iframe printing
 */
export const generateReceiptHTML = (sale, settings) => {
  if (!sale) return '';
  const customerName = sale.customerSnapshot?.name || sale.customer?.name || 'Valued Customer';
  const saleNumber = sale.saleNumber || 'INV-0001';
  const businessName = settings?.businessName || 'AuraFrame';
  
  const saleDate = sale.createdAt ? new Date(sale.createdAt) : new Date();
  const dateStr = saleDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = saleDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).toLowerCase();

  const itemsHtml = (sale.items || [])
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 0; text-align: left; vertical-align: top;">
          <div style="font-weight: 700; font-size: 13px; color: #0f172a;">${item.name}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Size: ${item.size || 'Standard'} &times; ${item.qty}</div>
        </td>
        <td style="padding: 10px 0; text-align: right; vertical-align: top; font-weight: 700; font-size: 13px; color: #0f172a; font-family: monospace;">
          &#8377;${item.qty * item.sellPrice}
        </td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Receipt #${saleNumber} - ${businessName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #ffffff;
      color: #0f172a;
      display: flex;
      justify-content: center;
      padding: 24px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .receipt-card {
      width: 100%;
      max-width: 420px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 28px 24px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.04);
    }
    .header { text-align: center; margin-bottom: 20px; }
    .brand-title { font-size: 20px; font-weight: 800; letter-spacing: -0.02em; color: #0f172a; }
    .brand-sub { font-size: 11px; color: #64748b; margin-top: 2px; }
    .divider { border: 0; border-top: 1px dashed #cbd5e1; margin: 16px 0; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; font-size: 11px; margin-bottom: 16px; }
    .meta-col { }
    .meta-label { color: #94a3b8; font-size: 10px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em; }
    .meta-val { font-weight: 700; color: #0f172a; font-size: 12px; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    .total-box {
      background: #f8fafc;
      border-radius: 14px;
      padding: 14px;
      margin-top: 12px;
      margin-bottom: 16px;
    }
    .total-row { display: flex; justify-content: space-between; font-size: 12px; color: #64748b; margin-bottom: 6px; }
    .grand-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
    }
    .status-pill {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #059669;
      padding: 8px 12px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 700;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .footer-msg {
      text-align: center;
      background: #fffbeb;
      border: 1px solid #fef3c7;
      border-radius: 14px;
      padding: 12px;
      font-size: 11.5px;
      color: #92400e;
      line-height: 1.5;
    }
    .footer-tag {
      font-weight: 700;
      color: #b45309;
      margin-top: 4px;
      display: block;
    }
    @media print {
      body { padding: 0; }
      .receipt-card { border: none; box-shadow: none; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="receipt-card">
    <div class="header">
      <div class="brand-title">AuraFrame</div>
      <div class="brand-sub">Posters &middot; Framing &middot; Art Decor</div>
    </div>

    <hr class="divider" />

    <div class="meta-grid">
      <div class="meta-col">
        <div class="meta-label">Receipt</div>
        <div class="meta-val">#${saleNumber}</div>
      </div>
      <div class="meta-col" style="text-align: center;">
        <div class="meta-label">Date</div>
        <div class="meta-val">${dateStr}</div>
      </div>
      <div class="meta-col" style="text-align: right;">
        <div class="meta-label">Customer</div>
        <div class="meta-val">${customerName}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <th style="padding-bottom: 6px; text-align: left; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Item & Size</th>
          <th style="padding-bottom: 6px; text-align: right; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="total-box">
      <div class="total-row">
        <span>Subtotal</span>
        <span style="font-family: monospace;">&#8377;${sale.subtotal}</span>
      </div>
      ${
        sale.discount > 0
          ? `<div class="total-row" style="color: #059669;">
              <span>Discount</span>
              <span style="font-family: monospace;">-&#8377;${sale.discount}</span>
            </div>`
          : ''
      }
      <div class="grand-total">
        <span>Total Paid</span>
        <span style="font-family: monospace; font-size: 18px; color: #0f172a;">&#8377;${sale.total}</span>
      </div>
    </div>

    <div class="status-pill">
      <span>&#10003; Paid via ${(sale.paymentMethod || 'UPI').toUpperCase()}</span>
      <span>${timeStr}</span>
    </div>

    <div class="footer-msg">
      <div>Thank you, <strong>${customerName}</strong>! &#128155;</div>
      <div>Hope your walls glow with your new posters! &#10024;</div>
      <span class="footer-tag">Tag us @aura.frame26 when you put them up &#128248;</span>
    </div>
  </div>
</body>
</html>`;
};


