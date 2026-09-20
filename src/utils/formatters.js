/**
 * Formats a number into Indian Rupee Currency string
 * Example: formatCurrency(1250) => ₹1,250
 */
export const formatCurrency = (amount) => {
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
 * Formats WhatsApp Share Receipt message URL
 */
export const generateWhatsAppReceiptUrl = (sale, settings) => {
  if (!sale) return '';
  const businessName = settings?.businessName || 'AuraFrame Posters & Frames';
  const customerName = sale.customerSnapshot?.name || sale.customer?.name || 'Valued Customer';
  const phone = sale.customerSnapshot?.phone || sale.customer?.phone || '';
  
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  let msg = `✨ *Thank you for your purchase, ${customerName}!* ✨\n\n`;
  msg += `*${businessName}*\n`;
  msg += `*Receipt No:* ${sale.saleNumber}\n`;
  msg += `*Date:* ${formatDateTime(sale.createdAt || new Date())}\n`;
  msg += `─────────────────────────\n`;

  (sale.items || []).forEach((item, idx) => {
    msg += `${idx + 1}. *${item.name}* (${item.size || 'Standard'})\n`;
    msg += `   ${item.qty} × ₹${item.sellPrice} = ₹${item.qty * item.sellPrice}\n`;
  });

  msg += `─────────────────────────\n`;
  msg += `Subtotal: ₹${sale.subtotal}\n`;
  if (sale.discount > 0) {
    msg += `Discount: -₹${sale.discount}\n`;
  }
  msg += `*Total Paid: ₹${sale.total}*\n`;
  msg += `Payment Mode: ${(sale.paymentMethod || 'UPI').toUpperCase()} (${(sale.paymentStatus || 'PAID').toUpperCase()})\n\n`;
  
  if (settings?.instagramUrl) {
    msg += `📸 Follow us on Instagram: ${settings.instagramUrl}\n`;
  }
  msg += `Thank you for supporting our craft!`;

  const encodedText = encodeURIComponent(msg);
  if (targetPhone) {
    return `https://wa.me/${targetPhone}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
};

