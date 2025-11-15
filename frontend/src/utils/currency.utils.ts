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
  
  // Format the number with locale-appropriate formatting
  const formattedAmount = amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  
  return `${symbol}${formattedAmount}`;
};

/**
 * Get the currency symbol only
 * @param currency - The currency object
 * @returns Currency symbol (e.g., "$", "€", "£")
 */
export const getCurrencySymbol = (currency?: Currency | null): string => {
  return currency?.cur_symbol || '$';
};
