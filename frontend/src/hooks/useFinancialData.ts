/**
 * Unified Financial Data Hook
 * 
 * This hook provides a centralized "pull" architecture for all financial data.
 * It replaces the fragmented singleton stores (incomeTotalsStore, passiveIncomeStore)
 * and eliminates duplicate API calls by fetching all data in parallel.
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  incomeAPI,
  expensesAPI,
  assetsAPI,
  liabilitiesAPI,
  cashSavingsAPI,
} from '../utils/api';

// ============================================================================
// Type Definitions
// ============================================================================

export type IncomeQuadrant = 'EMPLOYEE' | 'SELF_EMPLOYED' | 'BUSINESS_OWNER' | 'INVESTOR';

export interface IncomeItem {
  id: number;
  name: string;
  amount: number;
  type: 'Earned' | 'Portfolio' | 'Passive';
  quadrant: IncomeQuadrant;
}

export interface ExpenseItem {
  id: number;
  name: string;
  amount: number;
}

export interface AssetItem {
  id: number;
  name: string;
  value: number;
}

export interface LiabilityItem {
  id: number;
  name: string;
  value: number;
}

export interface IncomeTotals {
  earned: number;
  portfolio: number;
  passive: number;
  total: number;
}

export interface FinancialState {
  // Raw data arrays
  income: {
    earned: IncomeItem[];
    portfolio: IncomeItem[];
    passive: IncomeItem[];
  };
  expenses: ExpenseItem[];
  assets: AssetItem[];
  liabilities: LiabilityItem[];
  cashSavings: number;
}

export interface FinancialTotals {
  incomeTotals: IncomeTotals;
  totalExpenses: number;
  totalAssets: number;
  totalLiabilities: number;
  cashflow: number;
  netWorth: number;
  passiveAndPortfolioIncome: number;
  progressPercent: number;
}

export interface FinancialDataHook extends FinancialState, FinancialTotals {
  // Loading and error state
  loading: boolean;
  error: string | null;
  initialized: boolean;

  // Core actions
  refresh: () => Promise<void>;

  // Income CRUD
  addIncome: (
    name: string,
    amount: number,
    type: 'Earned' | 'Portfolio' | 'Passive',
    quadrant?: IncomeQuadrant
  ) => Promise<IncomeItem>;
  updateIncome: (
    id: number,
    name: string,
    amount: number,
    type: 'Earned' | 'Portfolio' | 'Passive',
    quadrant?: IncomeQuadrant
  ) => Promise<IncomeItem>;
  deleteIncome: (id: number, type: 'Earned' | 'Portfolio' | 'Passive') => Promise<void>;

  // Expense CRUD
  addExpense: (name: string, amount: number) => Promise<ExpenseItem>;
  updateExpense: (id: number, name: string, amount: number) => Promise<ExpenseItem>;
  deleteExpense: (id: number) => Promise<void>;

  // Asset CRUD
  addAsset: (name: string, value: number) => Promise<AssetItem>;
  updateAsset: (id: number, name: string, value: number) => Promise<AssetItem>;
  deleteAsset: (id: number) => Promise<void>;

  // Liability CRUD
  addLiability: (name: string, value: number) => Promise<LiabilityItem>;
  updateLiability: (id: number, name: string, value: number) => Promise<LiabilityItem>;
  deleteLiability: (id: number) => Promise<void>;

  // Cash Savings
  updateCashSavings: (amount: number) => Promise<void>;
}

// ============================================================================
// Store (Singleton Pattern)
// ============================================================================

interface StoreState extends FinancialState {
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const initialState: StoreState = {
  income: {
    earned: [],
    portfolio: [],
    passive: [],
  },
  expenses: [],
  assets: [],
  liabilities: [],
  cashSavings: 0,
  loading: false,
  error: null,
  initialized: false,
};

// Module-level singleton store
let store: StoreState = { ...initialState };
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((l) => l());

const setState = (partial: Partial<StoreState>) => {
  store = { ...store, ...partial };
  notify();
};

const resetStore = () => {
  store = { ...initialState };
  notify();
};

// Reset on auth change
if (typeof window !== 'undefined') {
  window.addEventListener('auth:changed', () => {
    resetStore();
  });
}

// ============================================================================
// Helper Functions
// ============================================================================

const typeQuadrantFallback: Record<'Earned' | 'Portfolio' | 'Passive', IncomeQuadrant> = {
  Earned: 'EMPLOYEE',
  Portfolio: 'INVESTOR',
  Passive: 'BUSINESS_OWNER',
};

const normalizeQuadrant = (value: unknown, fallback: IncomeQuadrant): IncomeQuadrant => {
  if (typeof value === 'string') {
    const normalized = value.trim().toUpperCase();
    if (['EMPLOYEE', 'SELF_EMPLOYED', 'BUSINESS_OWNER', 'INVESTOR'].includes(normalized)) {
      return normalized as IncomeQuadrant;
    }
  }
  return fallback;
};

const parseIncomeType = (type: string): 'Earned' | 'Portfolio' | 'Passive' => {
  const upper = type?.toUpperCase();
  if (upper === 'EARNED') return 'Earned';
  if (upper === 'PORTFOLIO') return 'Portfolio';
  if (upper === 'PASSIVE') return 'Passive';
  return 'Earned';
};

const normalizeIncome = (item: Record<string, unknown>): IncomeItem => {
  const type = parseIncomeType(item.type as string);
  return {
    id: item.id as number,
    name: item.name as string,
    amount: typeof item.amount === 'number' ? item.amount : parseFloat(item.amount as string),
    type,
    quadrant: normalizeQuadrant(item.quadrant, typeQuadrantFallback[type]),
  };
};

const normalizeExpense = (item: Record<string, unknown>): ExpenseItem => ({
  id: item.id as number,
  name: item.name as string,
  amount: typeof item.amount === 'number' ? item.amount : parseFloat(item.amount as string),
});

const normalizeAsset = (item: Record<string, unknown>): AssetItem => ({
  id: item.id as number,
  name: item.name as string,
  value: typeof item.value === 'number' ? item.value : parseFloat(item.value as string),
});

const normalizeLiability = (item: Record<string, unknown>): LiabilityItem => ({
  id: item.id as number,
  name: item.name as string,
  value: typeof item.value === 'number' ? item.value : parseFloat(item.value as string),
});

// ============================================================================
// Core Fetch Logic
// ============================================================================

const fetchAllData = async (): Promise<void> => {
  setState({ loading: true, error: null });

  try {
    // Fetch all data in parallel using Promise.all to eliminate waterfalls
    const [incomeRes, expensesRes, assetsRes, liabilitiesRes, cashSavingsRes] = await Promise.all([
      incomeAPI.getIncomeLines().catch(() => []),
      expensesAPI.getExpenses().catch(() => []),
      assetsAPI.getAssets().catch(() => []),
      liabilitiesAPI.getLiabilities().catch(() => []),
      cashSavingsAPI.getCashSavings().catch(() => ({ amount: 0 })),
    ]);

    // Normalize income by type
    const incomeLines = Array.isArray(incomeRes) ? incomeRes : [];
    const earned = incomeLines
      .filter((i: Record<string, unknown>) => (i.type as string)?.toUpperCase() === 'EARNED')
      .map(normalizeIncome);
    const portfolio = incomeLines
      .filter((i: Record<string, unknown>) => (i.type as string)?.toUpperCase() === 'PORTFOLIO')
      .map(normalizeIncome);
    const passive = incomeLines
      .filter((i: Record<string, unknown>) => (i.type as string)?.toUpperCase() === 'PASSIVE')
      .map(normalizeIncome);

    // Normalize expenses
    const expenses = Array.isArray(expensesRes)
      ? expensesRes.map(normalizeExpense)
      : [];

    // Normalize assets
    const assets = Array.isArray(assetsRes)
      ? assetsRes.map(normalizeAsset)
      : [];

    // Normalize liabilities
    const liabilities = Array.isArray(liabilitiesRes)
      ? liabilitiesRes.map(normalizeLiability)
      : [];

    // Cash savings
    const cashSavings = cashSavingsRes?.amount ?? 0;

    setState({
      income: { earned, portfolio, passive },
      expenses,
      assets,
      liabilities,
      cashSavings,
      loading: false,
      initialized: true,
      error: null,
    });
  } catch (err) {
    setState({
      loading: false,
      error: 'Failed to load financial data. Please try again.',
      initialized: true,
    });
  }
};

// ============================================================================
// CRUD Operations
// ============================================================================

// Income Operations
const addIncomeInternal = async (
  name: string,
  amount: number,
  type: 'Earned' | 'Portfolio' | 'Passive',
  quadrant?: IncomeQuadrant
): Promise<IncomeItem> => {
  const resolvedQuadrant = quadrant || typeQuadrantFallback[type];
  const response = await incomeAPI.addIncomeLine(name, amount, type, resolvedQuadrant);
  const incomeData = response.incomeLine || response;
  const newItem = normalizeIncome(incomeData);

  const section = type.toLowerCase() as 'earned' | 'portfolio' | 'passive';
  setState({
    income: {
      ...store.income,
      [section]: [...store.income[section], newItem],
    },
  });

  return newItem;
};

const updateIncomeInternal = async (
  id: number,
  name: string,
  amount: number,
  type: 'Earned' | 'Portfolio' | 'Passive',
  quadrant?: IncomeQuadrant
): Promise<IncomeItem> => {
  const resolvedQuadrant = quadrant || typeQuadrantFallback[type];
  const response = await incomeAPI.updateIncomeLine(id, name, amount, type, resolvedQuadrant);
  const incomeData = response.incomeLine || response;
  const updatedItem = normalizeIncome(incomeData);

  const section = type.toLowerCase() as 'earned' | 'portfolio' | 'passive';
  setState({
    income: {
      ...store.income,
      [section]: store.income[section].map((i) => (i.id === id ? updatedItem : i)),
    },
  });

  return updatedItem;
};

const deleteIncomeInternal = async (
  id: number,
  type: 'Earned' | 'Portfolio' | 'Passive'
): Promise<void> => {
  await incomeAPI.deleteIncomeLine(id);

  const section = type.toLowerCase() as 'earned' | 'portfolio' | 'passive';
  setState({
    income: {
      ...store.income,
      [section]: store.income[section].filter((i) => i.id !== id),
    },
  });
};

// Expense Operations
const addExpenseInternal = async (name: string, amount: number): Promise<ExpenseItem> => {
  const response = await expensesAPI.addExpense(name, amount);
  const expenseData = response.expense || response;
  const newItem = normalizeExpense(expenseData);

  setState({ expenses: [...store.expenses, newItem] });
  return newItem;
};

const updateExpenseInternal = async (
  id: number,
  name: string,
  amount: number
): Promise<ExpenseItem> => {
  const response = await expensesAPI.updateExpense(id, name, amount);
  const expenseData = response.expense || response;
  const updatedItem = normalizeExpense(expenseData);

  setState({ expenses: store.expenses.map((e) => (e.id === id ? updatedItem : e)) });
  return updatedItem;
};

const deleteExpenseInternal = async (id: number): Promise<void> => {
  await expensesAPI.deleteExpense(id);
  setState({ expenses: store.expenses.filter((e) => e.id !== id) });
};

// Asset Operations
const addAssetInternal = async (name: string, value: number): Promise<AssetItem> => {
  const response = await assetsAPI.addAsset(name, value);
  const assetData = response.asset || response;
  const newItem = normalizeAsset(assetData);

  setState({ assets: [...store.assets, newItem] });
  return newItem;
};

const updateAssetInternal = async (
  id: number,
  name: string,
  value: number
): Promise<AssetItem> => {
  const response = await assetsAPI.updateAsset(id, name, value);
  const assetData = response.asset || response;
  const updatedItem = normalizeAsset(assetData);

  setState({ assets: store.assets.map((a) => (a.id === id ? updatedItem : a)) });
  return updatedItem;
};

const deleteAssetInternal = async (id: number): Promise<void> => {
  await assetsAPI.deleteAsset(id);
  setState({ assets: store.assets.filter((a) => a.id !== id) });
};

// Liability Operations
const addLiabilityInternal = async (name: string, value: number): Promise<LiabilityItem> => {
  const response = await liabilitiesAPI.addLiability(name, value);
  const liabilityData = response.liability || response;
  const newItem = normalizeLiability(liabilityData);

  setState({ liabilities: [...store.liabilities, newItem] });
  return newItem;
};

const updateLiabilityInternal = async (
  id: number,
  name: string,
  value: number
): Promise<LiabilityItem> => {
  const response = await liabilitiesAPI.updateLiability(id, name, value);
  const liabilityData = response.liability || response;
  const updatedItem = normalizeLiability(liabilityData);

  setState({ liabilities: store.liabilities.map((l) => (l.id === id ? updatedItem : l)) });
  return updatedItem;
};

const deleteLiabilityInternal = async (id: number): Promise<void> => {
  await liabilitiesAPI.deleteLiability(id);
  setState({ liabilities: store.liabilities.filter((l) => l.id !== id) });
};

// Cash Savings
const updateCashSavingsInternal = async (amount: number): Promise<void> => {
  const response = await cashSavingsAPI.updateCashSavings(amount);
  const newAmount = response.cashSavings?.amount ?? amount;
  setState({ cashSavings: newAmount });
};

// ============================================================================
// Hook Implementation
// ============================================================================

export const useUnifiedFinancialData = (): FinancialDataHook => {
  // Local snapshot of the shared store
  const [localState, setLocalState] = useState<StoreState>(() => ({ ...store }));

  // Subscribe to store changes
  useEffect(() => {
    const onChange = () => {
      setLocalState({ ...store });
    };
    listeners.add(onChange);

    // Initial fetch if not yet initialized
    if (!store.initialized && !store.loading) {
      fetchAllData();
    }

    return () => {
      listeners.delete(onChange);
    };
  }, []);

  // Calculate derived totals with useMemo for performance
  const totals = useMemo<FinancialTotals>(() => {
    const earnedTotal = localState.income.earned.reduce((sum, i) => sum + i.amount, 0);
    const portfolioTotal = localState.income.portfolio.reduce((sum, i) => sum + i.amount, 0);
    const passiveTotal = localState.income.passive.reduce((sum, i) => sum + i.amount, 0);
    const totalIncome = earnedTotal + portfolioTotal + passiveTotal;

    const totalExpenses = localState.expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalAssets = localState.assets.reduce((sum, a) => sum + a.value, 0);
    const totalLiabilities = localState.liabilities.reduce((sum, l) => sum + l.value, 0);

    const cashflow = totalIncome - totalExpenses;
    const netWorth = totalAssets - totalLiabilities;
    const passiveAndPortfolioIncome = passiveTotal + portfolioTotal;

    // Progress percentage: (Passive + Portfolio) / Total Expenses
    const progressPercent =
      totalExpenses > 0
        ? Math.min(100, Math.max(0, Math.round((passiveAndPortfolioIncome / totalExpenses) * 100)))
        : 0;

    return {
      incomeTotals: {
        earned: earnedTotal,
        portfolio: portfolioTotal,
        passive: passiveTotal,
        total: totalIncome,
      },
      totalExpenses,
      totalAssets,
      totalLiabilities,
      cashflow,
      netWorth,
      passiveAndPortfolioIncome,
      progressPercent,
    };
  }, [localState.income, localState.expenses, localState.assets, localState.liabilities]);

  // Stable refresh function
  const refresh = useCallback(async () => {
    await fetchAllData();
  }, []);

  // CRUD operation wrappers (stable references)
  const addIncome = useCallback(
    async (
      name: string,
      amount: number,
      type: 'Earned' | 'Portfolio' | 'Passive',
      quadrant?: IncomeQuadrant
    ) => addIncomeInternal(name, amount, type, quadrant),
    []
  );

  const updateIncome = useCallback(
    async (
      id: number,
      name: string,
      amount: number,
      type: 'Earned' | 'Portfolio' | 'Passive',
      quadrant?: IncomeQuadrant
    ) => updateIncomeInternal(id, name, amount, type, quadrant),
    []
  );

  const deleteIncome = useCallback(
    async (id: number, type: 'Earned' | 'Portfolio' | 'Passive') =>
      deleteIncomeInternal(id, type),
    []
  );

  const addExpense = useCallback(
    async (name: string, amount: number) => addExpenseInternal(name, amount),
    []
  );

  const updateExpense = useCallback(
    async (id: number, name: string, amount: number) =>
      updateExpenseInternal(id, name, amount),
    []
  );

  const deleteExpense = useCallback(async (id: number) => deleteExpenseInternal(id), []);

  const addAsset = useCallback(
    async (name: string, value: number) => addAssetInternal(name, value),
    []
  );

  const updateAsset = useCallback(
    async (id: number, name: string, value: number) => updateAssetInternal(id, name, value),
    []
  );

  const deleteAsset = useCallback(async (id: number) => deleteAssetInternal(id), []);

  const addLiability = useCallback(
    async (name: string, value: number) => addLiabilityInternal(name, value),
    []
  );

  const updateLiability = useCallback(
    async (id: number, name: string, value: number) =>
      updateLiabilityInternal(id, name, value),
    []
  );

  const deleteLiability = useCallback(async (id: number) => deleteLiabilityInternal(id), []);

  const updateCashSavings = useCallback(
    async (amount: number) => updateCashSavingsInternal(amount),
    []
  );

  return {
    // State
    income: localState.income,
    expenses: localState.expenses,
    assets: localState.assets,
    liabilities: localState.liabilities,
    cashSavings: localState.cashSavings,
    loading: localState.loading,
    error: localState.error,
    initialized: localState.initialized,

    // Totals
    ...totals,

    // Actions
    refresh,
    addIncome,
    updateIncome,
    deleteIncome,
    addExpense,
    updateExpense,
    deleteExpense,
    addAsset,
    updateAsset,
    deleteAsset,
    addLiability,
    updateLiability,
    deleteLiability,
    updateCashSavings,
  };
};

// Export as default alias for easier import
export { useUnifiedFinancialData as useFinancialDataHook };
