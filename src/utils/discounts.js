export const PERCENT_DISCOUNTS = [
  { id: 5, label: '5%', percent: 5, minSubtotal: 200 },
  { id: 10, label: '10%', percent: 10, minSubtotal: 500 },
  { id: 15, label: '15%', percent: 15, minSubtotal: 1000 },
];

export const FLAT_DISCOUNTS = [
  { id: 30, label: '₹30', amount: 30, minSubtotal: 400 },
  { id: 50, label: '₹50', amount: 50, minSubtotal: 700 },
  { id: 70, label: '₹70', amount: 70, minSubtotal: 900 },
];

export const discountTiers = (mode) =>
  mode === 'percent' ? PERCENT_DISCOUNTS : FLAT_DISCOUNTS;

/**
 * Rupee discount for a chip. Eligible only when the quote is strictly above the chip minimum.
 * The result never exceeds the quote.
 */
export function discountAmount(mode, chip, subtotal) {
  const base = Math.max(0, Number(subtotal) || 0);
  if (!chip || base <= chip.minSubtotal) return 0;
  const raw =
    mode === 'percent'
      ? Math.round((base * chip.percent) / 100)
      : Number(chip.amount) || 0;
  return Math.min(base, Math.max(0, raw));
}
