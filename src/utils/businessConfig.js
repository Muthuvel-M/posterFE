import crochetImg from '../assets/crochet.jpeg';
import defaultLogoImg from '../assets/2.png';
import charutaahLogoImg from '../assets/charutaah_logo.jpg';

export const CHARUTAAH_EMAIL = 'bhuvaneswaripragallapati@gmail.com';

export const isCharutaahEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return email.trim().toLowerCase() === CHARUTAAH_EMAIL;
};

export const CHARUTAAH_CATEGORIES = [
  { id: 'crochet', label: '🧶 Crochet', name: 'Crochet' },
  { id: 'keychains', label: '🔑 Keychains', name: 'Keychains' },
  { id: 'charms', label: '✨ Charms', name: 'Charms' },
  { id: 'clips', label: '📎 Clips', name: 'Clips' },
  { id: 'flowers', label: '🌸 Flowers', name: 'Flowers' },
];

export const STANDARD_CATEGORIES = [
  { id: 'poster', label: '🖼️ Poster', name: 'Poster' },
  { id: 'frame', label: '🔲 Frame', name: 'Frame' },
  { id: 'sticker', label: '✨ Sticker', name: 'Sticker' },
];

export const NO_SIZE_CATEGORIES = [
  'crochet',
  'chrochet',
  'keychains',
  'keychain',
  'charms',
  'charm',
  'clips',
  'clip',
  'flowers',
  'flower',
];

export const isSizeHidden = (category = '', email = '') => {
  if (isCharutaahEmail(email)) return true;
  const normalized = String(category).toLowerCase().trim();
  return NO_SIZE_CATEGORIES.some((c) => normalized.includes(c));
};

export const getBusinessBranding = (email, settings = {}) => {
  const isCharutaah = isCharutaahEmail(email);

  if (isCharutaah) {
    const rawName = settings?.businessName?.trim();
    const businessName =
      rawName && !rawName.includes('Aura') && !rawName.includes('Muthuvel')
        ? rawName
        : 'Charutaah';

    const rawTagline = settings?.tagline?.trim();
    const tagline =
      rawTagline && !rawTagline.toLowerCase().includes('poster')
        ? rawTagline
        : 'Handmade Crochet Creations';

    return {
      isCharutaah: true,
      businessName,
      tagline,
      logo: crochetImg,
      charutaahLogo: charutaahLogoImg,
      receiptImage: crochetImg,
      phone: settings?.phone || '',
      upiId: settings?.upiId || '',
      secondaryUpiId: settings?.secondaryUpiId || '',
      instagramUrl: settings?.instagramUrl || '',
      receiptFooterNote: settings?.receiptFooterNote || 'Thank you for shopping with Charutaah!',
    };
  }

  const rawName = settings?.businessName?.trim();
  const businessName =
    rawName && !rawName.includes('Muthuvel') ? rawName : 'AuraFrame26';

  return {
    isCharutaah: false,
    businessName,
    tagline: settings?.tagline || 'Posters & Custom Framing',
    logo: defaultLogoImg,
    charutaahLogo: null,
    receiptImage: defaultLogoImg,
    phone: settings?.phone || '+91 9876543210',
    upiId: settings?.upiId || 'mmuthuvel126@ibl',
    secondaryUpiId: settings?.secondaryUpiId || '',
    instagramUrl: settings?.instagramUrl || 'https://www.instagram.com/aura.frame26/',
    receiptFooterNote: settings?.receiptFooterNote || 'Thank you for shopping!',
  };
};

