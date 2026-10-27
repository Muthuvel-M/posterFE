/**
 * Client-side income-split helpers (mirrors PosterBE incomeSplitService).
 * The four allocations can differ, but they must sum to 100.
 */

export const ALLOCATION_KEYS = ['reinvestment', 'ps5Fund', 'savings', 'expenses'];

export const ALLOCATION_LABELS = {
  reinvestment: 'Reinvestment',
  ps5Fund: 'PS5 Fund',
  savings: 'Savings',
  expenses: 'Expenses',
};

export const DEFAULT_INCOME_SPLIT = {
  reinvestment: 25,
  ps5Fund: 25,
  savings: 25,
  expenses: 25,
};

/**
 * Builds an equal split object where every category gets the same percentage.
 * @param {number} eachPercent
 * @returns {Object}
 */
export function buildEqualSplit(eachPercent = 25) {
  const value = Number(eachPercent) || 0;
  return {
    reinvestment: value,
    ps5Fund: value,
    savings: value,
    expenses: value,
  };
}

/**
 * @param {Object} percentages
 * @returns {{ valid: boolean, sum: number, message?: string }}
 */
export function validatePercentages(percentages) {
  if (!percentages || typeof percentages !== 'object') {
    return { valid: false, sum: 0, message: 'Percentages are required' };
  }
  let sum = 0;
  for (const key of ALLOCATION_KEYS) {
    const val = Number(percentages[key]);
    if (Number.isNaN(val) || val < 0 || val > 100) {
      return {
        valid: false,
        sum,
        message: `${ALLOCATION_LABELS[key] || key} must be between 0 and 100`,
      };
    }
    sum += val;
  }
  sum = Math.round(sum * 100) / 100;
  if (sum > 100.01) {
    return {
      valid: false,
      sum,
      message: `Percentages cannot be more than 100 (currently ${sum}%)`,
    };
  }
  if (Math.abs(sum - 100) > 0.01) {
    return {
      valid: false,
      sum,
      message: `Percentages must sum to 100 (currently ${sum}%)`,
    };
  }
  return { valid: true, sum };
}

/**
 * Splits income by each percentage. Leftover paise go to the largest fractional shares.
 * @param {number} totalIncome
 * @param {Object} percentages
 * @returns {Object|null}
 */
export function computeAllocations(totalIncome, percentages) {
  const check = validatePercentages(percentages);
  if (!check.valid) return null;

  const totalPaise = Math.round(Number(totalIncome) * 100);
  const shares = ALLOCATION_KEYS.map((key) => {
    const exact = totalPaise * (Number(percentages[key]) / 100);
    const floor = Math.floor(exact + 1e-9);
    return { key, floor, frac: exact - floor };
  });
  let remainder = totalPaise - shares.reduce((sum, share) => sum + share.floor, 0);
  const byFraction = [...shares].sort((a, b) => b.frac - a.frac);
  for (const share of byFraction) {
    if (remainder <= 0) break;
    share.floor += 1;
    remainder -= 1;
  }

  const result = {};
  for (const share of shares) {
    result[share.key] = share.floor / 100;
  }
  return result;
}

/**
 * Sum of percentage fields for live UI chip.
 * @param {Object} percentages
 * @returns {number}
 */
export function sumPercentages(percentages) {
  return ALLOCATION_KEYS.reduce((s, k) => s + (Number(percentages?.[k]) || 0), 0);
}
