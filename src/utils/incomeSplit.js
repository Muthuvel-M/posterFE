/**
 * Client-side income-split helpers (mirrors PosterBE incomeSplitService rounding).
 * Used for Settings validation and live allocation previews; backend remains source of truth.
 */

export const ALLOCATION_KEYS = ['reinvestment', 'ps5Fund', 'savings', 'expenses'];

export const ALLOCATION_LABELS = {
  reinvestment: 'Reinvestment',
  ps5Fund: 'PS5 Fund',
  savings: 'Savings',
  expenses: 'Expenses',
};

export const DEFAULT_INCOME_SPLIT = {
  reinvestment: 40,
  ps5Fund: 20,
  savings: 20,
  expenses: 20,
};

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
  // Round to 2 decimals for floating display inputs
  sum = Math.round(sum * 100) / 100;
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
 * Computes currency allocations; remainder goes to expenses so sum === totalIncome.
 * @param {number} totalIncome
 * @param {Object} percentages
 * @returns {Object|null}
 */
export function computeAllocations(totalIncome, percentages) {
  const check = validatePercentages(percentages);
  if (!check.valid) return null;

  const totalPaise = Math.round(Number(totalIncome) * 100);
  const result = {};
  let assigned = 0;

  for (let i = 0; i < ALLOCATION_KEYS.length; i++) {
    const key = ALLOCATION_KEYS[i];
    if (i === ALLOCATION_KEYS.length - 1) {
      result[key] = (totalPaise - assigned) / 100;
    } else {
      const paise = Math.floor((totalPaise * Number(percentages[key])) / 100);
      result[key] = paise / 100;
      assigned += paise;
    }
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
