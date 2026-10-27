export const DEFAULT_FREE_OFFER = {
  enabled: true,
  tiers: [
    { buyQty: 4, freeQty: 1 },
    { buyQty: 8, freeQty: 2 },
    { buyQty: 12, freeQty: 3 },
  ],
};

export const normalizeFreeOffer = (raw) => {
  const sourceTiers = Array.isArray(raw?.tiers) ? raw.tiers : [];
  const tiers = DEFAULT_FREE_OFFER.tiers.map((fallback, index) => {
    const tier = sourceTiers[index] || fallback;
    const buyQty = Math.max(1, Math.floor(Number(tier.buyQty) || fallback.buyQty));
    const freeQty = Math.max(1, Math.floor(Number(tier.freeQty) || fallback.freeQty));
    return { buyQty, freeQty };
  });

  return {
    enabled: raw?.enabled !== false,
    tiers,
  };
};

export const paidQtyOf = (item) =>
  Math.max(0, (Number(item?.qty) || 0) - (Number(item?.freeQty) || 0));

export const freeGroupKey = (item) => {
  const category = String(item?.product?.category || 'poster').toLowerCase();
  const size = String(item?.product?.size || 'standard');
  return `${category}|${size}`;
};
