import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Generates a high-resolution, unclipped PDF Blob and File from a DOM receipt element
 */
export const generateReceiptPDF = async (elementId, filename = 'Receipt.pdf') => {
  const original = document.getElementById(elementId);
  if (!original) {
    throw new Error(`Receipt element #${elementId} not found`);
  }

  // Clone into an isolated offscreen container to avoid modal scroll clipping and layout shifts
  const clone = original.cloneNode(true);
  clone.id = 'receipt-pdf-render-clone';
  clone.style.width = '420px';
  clone.style.maxWidth = '420px';
  clone.style.minWidth = '420px';
  clone.style.height = 'auto';
  clone.style.maxHeight = 'none';
  clone.style.overflow = 'visible';
  clone.style.padding = '24px 20px 28px 20px';
  clone.style.boxSizing = 'border-box';
  clone.style.position = 'fixed';
  clone.style.left = '-9999px';
  clone.style.top = '0';
  clone.style.zIndex = '-9999';
  clone.style.background = '#ffffff';
  clone.style.color = '#18181b';

  // Ensure all scroll containers inside clone are completely unconstrained
  const scrollContainers = clone.querySelectorAll('.overflow-y-auto, .overflow-x-auto, .overflow-hidden, .no-scrollbar');
  scrollContainers.forEach((el) => {
    el.style.overflow = 'visible';
    el.style.maxHeight = 'none';
    el.style.height = 'auto';
  });

  document.body.appendChild(clone);

  try {
    // Wait brief render tick to allow fonts & layout calculation
    await new Promise((r) => setTimeout(r, 60));

    const canvas = await html2canvas(clone, {
      scale: 3, // High-res 300+ DPI
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: clone.offsetWidth,
      height: clone.offsetHeight,
      windowWidth: clone.offsetWidth,
      windowHeight: clone.offsetHeight,
      scrollX: 0,
      scrollY: 0,
    });

    const imgWidthMm = 80; // Standard 80mm POS receipt width
    const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width;

    // Single-page custom size PDF fitting the entire receipt exactly with 3mm margin
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [imgWidthMm, imgHeightMm + 6],
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    pdf.addImage(imgData, 'PNG', 0, 3, imgWidthMm, imgHeightMm, '', 'FAST');

    const pdfBlob = pdf.output('blob');
    const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    const pdfFile = new File([pdfBlob], cleanFilename, { type: 'application/pdf' });

    return {
      pdf,
      pdfBlob,
      pdfFile,
      canvas,
      imgData,
    };
  } finally {
    if (clone && clone.parentNode) {
      clone.parentNode.removeChild(clone);
    }
  }
};

/**
 * Builds formatted text bill for WhatsApp
 */
export const buildWhatsAppBillMessage = ({
  orderNumber = 'AF-1001',
  customerName = 'Walk-in Customer',
  customerPhone = '',
  customerInstagram = '',
  dateStr = '',
  timeStr = '',
  items = [],
  sizeTiers = [],
  subtotal = 0,
  discount = 0,
  total = 0,
  advancePaid = 0,
  balanceDue = 0,
  paymentMethod = 'UPI',
  isCustom = false,
  deliveryDate = null,
  customNotes = '',
}) => {
  let text = '';

  if (isCustom) {
    text += `🎨 *AuraFrame26 - Custom Order Receipt*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `*Order ID:* #${orderNumber}\n`;
    if (dateStr) text += `*Placed Date:* ${dateStr}\n`;
    text += `*Customer:* ${customerName}\n`;
    if (customerPhone) text += `*Phone:* ${customerPhone}\n`;
    if (customerInstagram) text += `*Instagram:* @${customerInstagram.replace('@', '')}\n`;
    if (deliveryDate) text += `*Expected Delivery:* 🚚 ${deliveryDate}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `*ORDER SPECIFICATIONS:*\n`;

    if (Array.isArray(sizeTiers) && sizeTiers.length > 0) {
      sizeTiers.forEach((tier) => {
        const count = tier.count || 1;
        const price = tier.price || tier.unitPrice || tier.posterPrice || tier.framePrice || 0;
        const typeLabel = tier.type === 'frame' || tier.framePrice ? 'Custom Frame' : 'Poster Print';
        text += `• *${tier.size || 'A4'} ${typeLabel}* x${count} - ₹${count * price}\n`;
      });
    } else if (Array.isArray(items) && items.length > 0) {
      items.forEach((item) => {
        text += `• *${item.name}* (${item.size || 'A4'}) x${item.qty || 1} - ₹${(item.qty || 1) * (item.sellPrice || item.price || 0)}\n`;
      });
    }

    if (customNotes) {
      text += `\n*Notes:* _"${customNotes}"_\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `*Total Quoted:* ₹${total}\n`;
    text += `*Advance Paid:* ₹${advancePaid} (${paymentMethod.toUpperCase()})\n`;
    if (balanceDue > 0) {
      text += `*Balance Due on Delivery:* 🔴 ₹${balanceDue}\n`;
    } else {
      text += `*Status:* 🟢 Fully Paid ✓\n`;
    }
  } else {
    text += `🧾 *AuraFrame26 - Official Receipt*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `*Receipt:* #${orderNumber}\n`;
    if (dateStr) text += `*Date:* ${dateStr} ${timeStr ? `(${timeStr})` : ''}\n`;
    text += `*Customer:* ${customerName}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `*ITEMS:*\n`;

    (items || []).forEach((item) => {
      text += `• *${item.name}* (${item.size || 'Standard'}) x${item.qty} = ₹${item.qty * item.sellPrice}\n`;
    });

    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `*Subtotal:* ₹${subtotal}\n`;
    if (discount > 0) {
      text += `*Discount Applied:* -₹${discount}\n`;
    }
    text += `*Total Paid:* ₹${total}\n`;
    text += `*Payment:* 🟢 Paid via ${paymentMethod.toUpperCase()}\n`;
  }

  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `💛 *Thank you, ${customerName}!*\n`;
  text += `Hope your walls glow with your new posters! ✨\n`;
  text += `📸 Tag us *@aura.frame26* on Instagram`;

  return text;
};

/**
 * Directly opens customer's WhatsApp chat with the full receipt and downloads the PDF bill
 */
export const shareReceiptOnWhatsApp = async ({
  elementId,
  orderNumber = 'INV-001',
  customerPhone = '',
  customerName = 'Walk-in Customer',
  customerInstagram = '',
  dateStr = '',
  timeStr = '',
  items = [],
  sizeTiers = [],
  subtotal = 0,
  discount = 0,
  total = 0,
  advancePaid = 0,
  balanceDue = 0,
  paymentMethod = 'UPI',
  isCustom = false,
  deliveryDate = null,
  customNotes = '',
  showToast = () => {},
}) => {
  try {
    showToast('Generating high-res PDF bill...', 'info');

    const cleanOrderNum = String(orderNumber).replace(/[^a-zA-Z0-9_-]/g, '');
    const filename = `AuraFrame26_Receipt_${cleanOrderNum}.pdf`;

    // 1. Generate & download crisp unclipped PDF
    const { pdf, canvas } = await generateReceiptPDF(elementId, filename);
    pdf.save(filename);

    // 2. Try copying image to clipboard for instant pasting
    try {
      if (canvas && navigator.clipboard && window.ClipboardItem) {
        canvas.toBlob((blob) => {
          if (blob) {
            navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).catch(() => {});
          }
        }, 'image/png');
      }
    } catch (_) {
      // Clipboard write optional
    }

    // 3. Resolve customer phone number
    let rawPhone = String(customerPhone || '').replace(/[^0-9]/g, '');

    // If phone number is missing, prompt cashier directly
    if (!rawPhone || rawPhone.length < 10) {
      const inputPhone = window.prompt(
        `Enter customer's 10-digit WhatsApp number (or leave blank to pick contact):`,
        ''
      );
      if (inputPhone) {
        rawPhone = String(inputPhone).replace(/[^0-9]/g, '');
      }
    }

    let targetPhone = '';
    if (rawPhone.length === 10) {
      targetPhone = `91${rawPhone}`;
    } else if (rawPhone.length === 12 && rawPhone.startsWith('91')) {
      targetPhone = rawPhone;
    } else if (rawPhone.length > 5) {
      targetPhone = rawPhone.startsWith('91') ? rawPhone : `91${rawPhone.slice(-10)}`;
    }

    // 4. Build message
    const waMsgText = buildWhatsAppBillMessage({
      orderNumber,
      customerName,
      customerPhone: rawPhone,
      customerInstagram,
      dateStr,
      timeStr,
      items,
      sizeTiers,
      subtotal,
      discount,
      total,
      advancePaid,
      balanceDue,
      paymentMethod,
      isCustom,
      deliveryDate,
      customNotes,
    });

    const encodedMsg = encodeURIComponent(waMsgText);

    // 5. Directly open WhatsApp customer chat
    const waUrl = targetPhone
      ? `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodedMsg}`
      : `https://api.whatsapp.com/send?text=${encodedMsg}`;

    const link = document.createElement('a');
    link.href = waUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(
      targetPhone
        ? `PDF saved! Direct WhatsApp chat opened for ${customerName}.`
        : `PDF saved! WhatsApp chat opened.`,
      'success'
    );
  } catch (error) {
    console.error('Failed to share PDF receipt:', error);
    showToast(error.message || 'Failed to generate PDF receipt', 'error');
  }
};

/**
 * Direct Print PDF without background leak
 */
export const directPrintReceipt = async (elementId, showToast = () => {}) => {
  try {
    showToast('Preparing print receipt...', 'info');
    const { pdf } = await generateReceiptPDF(elementId, 'receipt.pdf');
    pdf.autoPrint();
    const pdfBlobUrl = pdf.output('bloburl');

    // Open in hidden iframe for 100% clean print isolated from main app background
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = pdfBlobUrl;

    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        if (iframe && iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
        URL.revokeObjectURL(pdfBlobUrl);
      }, 3000);
    };
  } catch (err) {
    console.warn('Iframe print fallback to window.print:', err);
    window.print();
  }
};
