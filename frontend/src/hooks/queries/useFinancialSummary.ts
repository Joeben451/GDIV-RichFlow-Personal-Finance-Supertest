/**
 * Financial Summary Hook (Derived State Pattern)
 * 
 * This hook aggregates data from existing React Query hooks to provide
 * computed financial metrics without triggering additional network requests.
 * Relies on React Query's automatic deduplication and caching.
 */

import { useMemo } from 'react';
import { useIncomeTotals } from './useIncome';
import { useExpenseTotals } from './useExpenses';
import { useBalanceSheetQuery } from './useBalanceSheet';
import { useCashSavingsQuery } from './useCashSavings';

// ============================================================================
// Type Definitions
// ============================================================================

export interface FinancialSummary {
  // Core Metrics
  totalIncome: number;
  totalExpenses: number;
  cashflow: number;
  netWorth: number;
  savingsRate: number;
  
  // Income Breakdown
  earnedIncome: number;
  portfolioIncome: number;
  passiveIncome: number;
  passiveAndPortfolioIncome: number;
  
  // Balance Sheet
  totalAssets: number;
  totalLiabilities: number;
  
  // Cash Savings
  cashSavings: number;
  
  // Financial Freedom Progress
  progressPercent: number;
}

export interface FinancialSummaryResult extends FinancialSummary {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Composable hook that aggregates data from existing queries
 * to compute financial summary metrics.
 * 
 * Uses React Query's deduplication - calling this hook won't trigger
 * new network requests if the data is already cached.
 * 
 * @example
 * ```tsx
 * const { 
 *   cashflow, 
 *   netWorth, 
 *   totalIncome, 
 *   totalExpenses, 
 *   savingsRate,
 *   isLoading 
 * } = useFinancialSummary();
 * ```
 */
export const useFinancialSummary = (): FinancialSummaryResult => {
  // Fetch data from existing query hooks (deduped automatically)
  const { 
    data: incomeTotals, 
    isLoading: incomeLoading, 
    isError: incomeError,
    error: incomeErrorObj 
  } = useIncomeTotals();
  
  const { 
    data: expenseTotals, 
    isLoading: expensesLoading, 
    isError: expensesError,
    error: expensesErrorObj 
  } = useExpenseTotals();
  
  const { 
    totalAssets, 
    totalLiabilities, 
    netWorth: balanceSheetNetWorth,
    isLoading: balanceSheetLoading, 
    isError: balanceSheetError,
    error: balanceSheetErrorObj 
  } = useBalanceSheetQuery();
  
  const {
    data: cashSavingsData,
    isLoading: cashSavingsLoading,
    isError: cashSavingsError,
    error: cashSavingsErrorObj
  } = useCashSavingsQuery();

  // Compute derived values with memoization
  const summary = useMemo<FinancialSummary>(() => {
    // Extract raw values with defaults
    const earned = incomeTotals?.earned ?? 0;
    const portfolio = incomeTotals?.portfolio ?? 0;
    const passive = incomeTotals?.passive ?? 0;
    const totalIncome = incomeTotals?.total ?? 0;
    const passiveAndPortfolioIncome = incomeTotals?.passiveAndPortfolio ?? 0;
    
    const totalExpenses = expenseTotals?.total ?? 0;
    const cashSavings = cashSavingsData?.amount ?? 0;
    
    // Calculate core metrics
    const cashflow = totalIncome - totalExpenses;
    const netWorth = balanceSheetNetWorth ?? (totalAssets - totalLiabilities);
    
    // Calculate savings rate (what percentage of income is saved)
    const savingsRate = totalIncome > 0 
      ? Math.round((cashflow / totalIncome) * 100) 
      : 0;
    
    // Calculate financial freedom progress
    // Progress = (Passive + Portfolio Income) / Total Expenses * 100
    // At 100%, passive income covers all expenses (financial freedom)
    const progressPercent = totalExpenses > 0
      ? Math.min(100, Math.round((passiveAndPortfolioIncome / totalExpenses) * 100))
      : passiveAndPortfolioIncome > 0 ? 100 : 0;

    return {
      totalIncome,
      totalExpenses,
      cashflow,
      netWorth,
      savingsRate,
      earnedIncome: earned,
      portfolioIncome: portfolio,
      passiveIncome: passive,
      passiveAndPortfolioIncome,
      totalAssets,
      totalLiabilities,
      cashSavings,
      progressPercent,
    };
  }, [
    incomeTotals, 
    expenseTotals, 
    totalAssets, 
    totalLiabilities, 
    balanceSheetNetWorth,
    cashSavingsData
  ]);

  // Aggregate loading and error states
  const isLoading = incomeLoading || expensesLoading || balanceSheetLoading || cashSavingsLoading;
  const isError = incomeError || expensesError || balanceSheetError || cashSavingsError;
  const error = incomeErrorObj || expensesErrorObj || balanceSheetErrorObj || cashSavingsErrorObj;

  return {
    ...summary,
    isLoading,
    isError,
    error: error as Error | null,
  };
};

export default useFinancialSummary;
