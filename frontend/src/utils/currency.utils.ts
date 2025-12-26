import { Currency } from '../types/currency.types';

/**
 * Format a number as currency with the appropriate symbol
 * @param amount - The amount to format
 * @param currency - The currency object with symbol and name
 * @returns Formatted currency string (e.g., "$1,234.56" or "€1.234,56")
 */
export const formatCurrency = (amount: number, currency?: Currency | null): string => {
  // Default to USD if no currency provided
  const symbol = currency?.cur_symbol || '$';
  
  // Ensure the amount is a valid number
  const numAmount = Number(amount);
  if (isNaN(numAmount) || !isFinite(numAmount)) {
    return `${symbol}0`;
  }
  
  // Format the number with locale-appropriate formatting
  const formattedAmount = numAmount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  
  return `${symbol}${formattedAmount}`;
};

/**
 * Format a number as compact currency for very large numbers (billions+)
 * Numbers below 1 billion are formatted normally with full digits
 * Handles extremely large numbers that would otherwise show scientific notation
 * @param amount - The amount to format
 * @param currency - The currency object with symbol and name
 * @returns Formatted currency string (compact for billions+, full for smaller)
 */
export const formatCurrencyCompact = (amount: number, currency?: Currency | null): string => {
  const symbol = currency?.cur_symbol || '$';
  
  // Ensure the amount is a valid number
  const numAmount = Number(amount);
  if (isNaN(numAmount) || !isFinite(numAmount)) {
    return `${symbol}0`;
  }
  
  const absAmount = Math.abs(numAmount);
  const sign = numAmount < 0 ? '-' : '';
  
  // Handle extremely large numbers (quadrillions and beyond)
  // These would show scientific notation otherwise
  if (absAmount >= 1e15) {
    // For quadrillions+, show in trillions with more precision indicator
    const trillions = absAmount / 1e12;
    if (trillions >= 1e6) {
      // Quintillions+ - just show ">999,999T"
      return `${sign}${symbol}>999,999T`;
    }
    return `${sign}${symbol}${trillions.toLocaleString(undefined, { maximumFractionDigits: 0 })}T`;
  } else if (absAmount >= 1e12) {
    return `${sign}${symbol}${(absAmount / 1e12).toFixed(1)}T`;
  } else if (absAmount >= 1e9) {
    return `${sign}${symbol}${(absAmount / 1e9).toFixed(1)}B`;
  } else {
    // For millions and below, use regular formatting
    return formatCurrency(numAmount, currency);
  }
};

/**
 * Get the currency symbol only
 * @param currency - The currency object
 * @returns Currency symbol (e.g., "$", "€", "£")
 */
export const getCurrencySymbol = (currency?: Currency | null): string => {
  return currency?.cur_symbol || '$';
};
