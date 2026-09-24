/**
 * Client-side income-split helpers (mirrors PosterBE incomeSplitService).
 * All four allocations must be equal and sum to 100 (25% each by default).
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
  const values = [];
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
    values.push(val);
    sum += val;
  }
  sum = Math.round(sum * 100) / 100;
  const first = values[0];
  if (!values.every((v) => Math.abs(v - first) <= 0.01)) {
    return {
      valid: false,
      sum,
      message: 'All four allocations must be equal (e.g. 25% each)',
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
 * Even paise split across four equal buckets; leftover paise distributed round-robin.
 * @param {number} totalIncome
 * @param {Object} percentages
 * @returns {Object|null}
 */
export function computeAllocations(totalIncome, percentages) {
  const check = validatePercentages(percentages);
  if (!check.valid) return null;

  const totalPaise = Math.round(Number(totalIncome) * 100);
  const n = ALLOCATION_KEYS.length;
  const base = Math.floor(totalPaise / n);
  let remainder = totalPaise - base * n;
  const result = {};

  for (let i = 0; i < n; i++) {
    const extra = remainder > 0 ? 1 : 0;
    if (remainder > 0) remainder -= 1;
    result[ALLOCATION_KEYS[i]] = (base + extra) / 100;
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
