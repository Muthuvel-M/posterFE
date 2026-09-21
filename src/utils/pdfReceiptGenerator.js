import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Generates a high-resolution PDF Blob and File from a DOM receipt element
 */
export const generateReceiptPDF = async (elementId, filename = 'Receipt.pdf') => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Receipt element #${elementId} not found`);
  }

  // Render element to canvas at 2.5x resolution for ultra-sharp typography
  const canvas = await html2canvas(element, {
    scale: 2.5,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  const imgData = canvas.toDataURL('image/png', 1.0);
  const imgWidth = 80; // 80mm receipt width standard or proportional
  const pageHeight = (canvas.height * imgWidth) / canvas.width;

  // Create PDF with exact content dimensions (single-page receipt)
  const pdf = new jsPDF({
    orientation: pageHeight > imgWidth ? 'portrait' : 'portrait',
    unit: 'mm',
    format: [imgWidth, pageHeight + 4], // tight fit without extra blank pages
  });

  pdf.addImage(imgData, 'PNG', 0, 2, imgWidth, pageHeight);

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
};

/**
 * Shares the PDF Receipt directly via Web Share API or downloads + opens WhatsApp
 */
export const shareReceiptOnWhatsApp = async ({
  elementId,
  orderNumber = 'INV-001',
  customerPhone = '',
  customerName = 'Valued Customer',
  isCustom = false,
  showToast = () => {},
}) => {
  try {
    showToast('Generating high-res PDF receipt...', 'info');

    const filename = `AuraFrame26_Receipt_${orderNumber.replace(/[^a-zA-Z0-9_-]/g, '')}.pdf`;
    const { pdf, pdfFile, pdfBlob } = await generateReceiptPDF(elementId, filename);

    // Clean customer phone
    const cleanPhone = String(customerPhone).replace(/[^0-9]/g, '');
    let targetPhone = '';
    if (cleanPhone.length === 10) {
      targetPhone = `91${cleanPhone}`;
    } else if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      targetPhone = cleanPhone;
    } else if (cleanPhone.length > 5) {
      targetPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone.slice(-10)}`;
    }

    const shareTitle = `Receipt #${orderNumber} - AuraFrame26`;
    const shareText = `Thank you, ${customerName}! 💛 Here is your AuraFrame26 receipt (#${orderNumber}) attached. ✨`;

    // 1. Try Native Web Share with PDF File (Mobile Chrome, Safari, Android, iOS)
    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          files: [pdfFile],
        });
        showToast('Receipt PDF shared successfully!', 'success');
        return;
      } catch (shareErr) {
        if (shareErr.name === 'AbortError') return; // User cancelled share sheet
        console.warn('Native share failed, falling back to download & WhatsApp:', shareErr);
      }
    }

    // 2. Desktop Fallback: Automatically download PDF bill and open WhatsApp with target phone
    pdf.save(filename);

    const waMsg = encodeURIComponent(
      `Thank you, ${customerName}! 💛\nYour AuraFrame26 receipt #${orderNumber} has been generated and attached.\n\nHope your walls glow with your new posters! ✨\nTag us @aura.frame26 📸`
    );

    const waUrl = targetPhone
      ? `https://wa.me/${targetPhone}?text=${waMsg}`
      : `https://wa.me/?text=${waMsg}`;

    window.open(waUrl, '_blank');
    showToast('PDF Receipt downloaded! Ready to send on WhatsApp.', 'success');
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
        document.body.removeChild(iframe);
        URL.revokeObjectURL(pdfBlobUrl);
      }, 3000);
    };
  } catch (err) {
    console.warn('Iframe print failed, falling back to standard print:', err);
    window.print();
  }
};
