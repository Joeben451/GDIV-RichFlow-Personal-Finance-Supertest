import prisma from '../config/database.config';
import { createEmptyQuadrantTotals, determineIncomeQuadrant } from '../utils/incomeQuadrant.utils';
import { getEventsByUser } from './event.service';
import { EntityType, ActionType } from '../types/event.types';

/**
 * Represents the reconstructed financial state at a point in time
 */
interface FinancialState {
  assets: Map<number, { id: number; name: string; value: number }>;
  liabilities: Map<number, { id: number; name: string; value: number }>;
  incomeLines: Map<number, { id: number; name: string; amount: number; type: string; quadrant?: string | null }>;
  expenses: Map<number, { id: number; name: string; amount: number }>;
  cashSavings: number;
  currency: { symbol: string; name: string };
}

interface FinancialHealth {
  runway: number;
  freedomDate: string | null;
  assetEfficiency: number;
  trends: {
    netWorth: number;
    cashflow: number;
  };
}

/**
 * Reconstruct financial state from a list of events up to a target date
 */
function reconstructStateFromEvents(
  events: any[], 
  targetDate: Date, 
  initialCurrency: { symbol: string; name: string }
): FinancialState {
  // Start with empty state
  const state: FinancialState = {
    assets: new Map(),
    liabilities: new Map(),
    incomeLines: new Map(),
    expenses: new Map(),
    cashSavings: 0,
    currency: { ...initialCurrency }
  };

  // Filter events up to targetDate and sort chronologically
  const relevantEvents = events
    .filter(e => new Date(e.timestamp) <= targetDate)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Replay events
  for (const event of relevantEvents) {
    const afterValue = event.afterValue ? JSON.parse(event.afterValue) : null;
    const beforeValue = event.beforeValue ? JSON.parse(event.beforeValue) : null;

    switch (event.entityType) {
      case EntityType.ASSET:
        handleAssetEvent(state, event.actionType as ActionType, event.entityId, afterValue, beforeValue);
        break;
      case EntityType.LIABILITY:
        handleLiabilityEvent(state, event.actionType as ActionType, event.entityId, afterValue, beforeValue);
        break;
      case EntityType.INCOME:
        if (event.entitySubtype === 'INCOME_STATEMENT') break;
        handleIncomeEvent(state, event.actionType as ActionType, event.entityId, afterValue, beforeValue);
        break;
      case EntityType.EXPENSE:
        handleExpenseEvent(state, event.actionType as ActionType, event.entityId, afterValue, beforeValue);
        break;
      case EntityType.CASH_SAVINGS:
        handleCashSavingsEvent(state, event.actionType as ActionType, afterValue, beforeValue);
        break;
      case EntityType.USER:
        handleUserEvent(state, event.actionType as ActionType, afterValue);
        break;
    }
  }

  return state;
}

/**
 * Handle asset events (CREATE, UPDATE, DELETE)
 */
function handleAssetEvent(
  state: FinancialState,
  actionType: ActionType,
  entityId: number,
  afterValue: any,
  beforeValue: any
) {
  switch (actionType) {
    case ActionType.CREATE:
      if (afterValue) {
        state.assets.set(entityId, {
          id: entityId,
          name: afterValue.name,
          value: Number(afterValue.value)
        });
      }
      break;

    case ActionType.UPDATE:
      if (afterValue) {
        state.assets.set(entityId, {
          id: entityId,
          name: afterValue.name,
          value: Number(afterValue.value)
        });
      }
      break;

    case ActionType.DELETE:
      state.assets.delete(entityId);
      break;
  }
}

/**
 * Handle liability events (CREATE, UPDATE, DELETE)
 */
function handleLiabilityEvent(
  state: FinancialState,
  actionType: ActionType,
  entityId: number,
  afterValue: any,
  beforeValue: any
) {
  switch (actionType) {
    case ActionType.CREATE:
      if (afterValue) {
        state.liabilities.set(entityId, {
          id: entityId,
          name: afterValue.name,
          value: Number(afterValue.value)
        });
      }
      break;

    case ActionType.UPDATE:
      if (afterValue) {
        state.liabilities.set(entityId, {
          id: entityId,
          name: afterValue.name,
          value: Number(afterValue.value)
        });
      }
      break;

    case ActionType.DELETE:
      state.liabilities.delete(entityId);
      break;
  }
}

/**
 * Handle income line events (CREATE, UPDATE, DELETE)
 */
function handleIncomeEvent(
  state: FinancialState,
  actionType: ActionType,
  entityId: number,
  afterValue: any,
  beforeValue: any
) {
  switch (actionType) {
    case ActionType.CREATE:
      if (afterValue) {
        state.incomeLines.set(entityId, {
          id: entityId,
          name: afterValue.name,
          amount: Number(afterValue.amount),
          type: afterValue.type,
          quadrant: afterValue.quadrant || null
        });
      }
      break;

    case ActionType.UPDATE:
      if (afterValue) {
        state.incomeLines.set(entityId, {
          id: entityId,
          name: afterValue.name,
          amount: Number(afterValue.amount),
          type: afterValue.type,
          quadrant: afterValue.quadrant || null
        });
      }
      break;

    case ActionType.DELETE:
      state.incomeLines.delete(entityId);
      break;
  }
}

/**
 * Handle expense events (CREATE, UPDATE, DELETE)
 */
function handleExpenseEvent(
  state: FinancialState,
  actionType: ActionType,
  entityId: number,
  afterValue: any,
  beforeValue: any
) {
  switch (actionType) {
    case ActionType.CREATE:
      if (afterValue) {
        state.expenses.set(entityId, {
          id: entityId,
          name: afterValue.name,
          amount: Number(afterValue.amount)
        });
      }
      break;

    case ActionType.UPDATE:
      if (afterValue) {
        state.expenses.set(entityId, {
          id: entityId,
          name: afterValue.name,
          amount: Number(afterValue.amount)
        });
      }
      break;

    case ActionType.DELETE:
      state.expenses.delete(entityId);
      break;
  }
}

/**
 * Handle cash savings events (CREATE, UPDATE)
 */
function handleCashSavingsEvent(
  state: FinancialState,
  actionType: ActionType,
  afterValue: any,
  beforeValue: any
) {
  if (actionType === ActionType.CREATE || actionType === ActionType.UPDATE) {
    if (afterValue && afterValue.amount !== undefined) {
      state.cashSavings = Number(afterValue.amount);
    }
  }
}

/**
 * Handle user events (UPDATE)
 */
function handleUserEvent(
  state: FinancialState,
  actionType: ActionType,
  afterValue: any
) {
  if (actionType === ActionType.UPDATE && afterValue) {
    if (afterValue.currencyCode) {
      state.currency = {
        symbol: afterValue.currencyCode,
        name: afterValue.currencyName || afterValue.currencyCode
      };
    }
  }
}

/**
 * Calculate financial health metrics
 */
function calculateFinancialHealth(
  currentState: FinancialState,
  prevMonthState: FinancialState | null,
  sixMonthAgoState: FinancialState | null
): FinancialHealth {
  // Calculate totals for current state
  const currentTotalAssets = Array.from(currentState.assets.values()).reduce((sum, a) => sum + a.value, 0);
  const currentTotalLiabilities = Array.from(currentState.liabilities.values()).reduce((sum, l) => sum + l.value, 0);
  const currentCash = currentState.cashSavings;
  const currentNetWorth = currentTotalAssets - currentTotalLiabilities + currentCash;
  
  const currentIncomeLines = Array.from(currentState.incomeLines.values());
  const currentPassiveIncome = currentIncomeLines
    .filter(i => i.type.toUpperCase() === 'PASSIVE')
    .reduce((sum, i) => sum + i.amount, 0);
  const currentPortfolioIncome = currentIncomeLines
    .filter(i => i.type.toUpperCase() === 'PORTFOLIO')
    .reduce((sum, i) => sum + i.amount, 0);
  const currentTotalIncome = currentIncomeLines.reduce((sum, i) => sum + i.amount, 0);
  
  const currentExpenses = Array.from(currentState.expenses.values()).reduce((sum, e) => sum + e.amount, 0);
  const currentNetCashflow = currentTotalIncome - currentExpenses;

  // 1. Runway: (Cash + Liquid Assets) / Monthly Expenses
  const runway = currentExpenses > 0 ? currentCash / currentExpenses : (currentCash > 0 ? 999 : 0);

  // 2. Asset Efficiency: (Passive + Portfolio) / (Total Assets - Cash)
  // Note: In our state model, totalAssets excludes cash.
  const assetEfficiency = currentTotalAssets > 0 
    ? ((currentPassiveIncome + currentPortfolioIncome) / currentTotalAssets) * 100 
    : 0;

  // 3. Trends
  let netWorthTrend = 0;
  let cashflowTrend = 0;

  if (prevMonthState) {
    const prevAssets = Array.from(prevMonthState.assets.values()).reduce((sum, a) => sum + a.value, 0);
    const prevLiabilities = Array.from(prevMonthState.liabilities.values()).reduce((sum, l) => sum + l.value, 0);
    const prevCash = prevMonthState.cashSavings;
    const prevNetWorth = prevAssets - prevLiabilities + prevCash;

    const prevIncome = Array.from(prevMonthState.incomeLines.values()).reduce((sum, i) => sum + i.amount, 0);
    const prevExpenses = Array.from(prevMonthState.expenses.values()).reduce((sum, e) => sum + e.amount, 0);
    const prevNetCashflow = prevIncome - prevExpenses;

    if (prevNetWorth !== 0) {
      netWorthTrend = ((currentNetWorth - prevNetWorth) / Math.abs(prevNetWorth)) * 100;
    } else if (currentNetWorth !== 0) {
      netWorthTrend = currentNetWorth > 0 ? 100 : -100;
    }
    
    if (prevNetCashflow !== 0) {
      cashflowTrend = ((currentNetCashflow - prevNetCashflow) / Math.abs(prevNetCashflow)) * 100;
    } else if (currentNetCashflow !== 0) {
      cashflowTrend = currentNetCashflow > 0 ? 100 : -100;
    }
  }

  // 4. Freedom Date
  let freedomDate: string | null = null;
  
  if (currentPassiveIncome >= currentExpenses) {
    freedomDate = "Achieved";
  } else if (currentPassiveIncome > 0) {
    // We have some passive income, let's try to project
    if (sixMonthAgoState) {
      const sixMonthPassive = Array.from(sixMonthAgoState.incomeLines.values())
        .filter(i => i.type.toUpperCase() === 'PASSIVE')
        .reduce((sum, i) => sum + i.amount, 0);
      
      // Case 1: Growth from non-zero base (Compound Growth)
      if (sixMonthPassive > 0) {
        if (currentPassiveIncome > sixMonthPassive) {
          // Calculate monthly growth rate (CAGR over 6 months)
          const growthFactor = Math.pow(currentPassiveIncome / sixMonthPassive, 1/6);
          const r = growthFactor - 1;

          if (r > 0) {
            const monthsToFreedom = Math.log(currentExpenses / currentPassiveIncome) / Math.log(1 + r);
            
            if (monthsToFreedom > 0 && monthsToFreedom < 600) { // Cap at 50 years
              const freedom = new Date();
              freedom.setMonth(freedom.getMonth() + Math.round(monthsToFreedom));
              freedomDate = freedom.toISOString().substring(0, 10);
            } else {
              freedomDate = "> 50 Years";
            }
          }
        } else {
          freedomDate = "Stagnant/Declining";
        }
      }
      // Case 2: Growth from zero base (Linear Projection)
      else {
        // Assume linear growth over the last 6 months
        // Average monthly addition = current / 6
        const monthlyGrowthAmount = currentPassiveIncome / 6;
        const gapToCover = currentExpenses - currentPassiveIncome;
        
        if (monthlyGrowthAmount > 0) {
          const monthsToFreedom = gapToCover / monthlyGrowthAmount;
          
          if (monthsToFreedom > 0 && monthsToFreedom < 600) {
            const freedom = new Date();
            freedom.setMonth(freedom.getMonth() + Math.round(monthsToFreedom));
            freedomDate = freedom.toISOString().substring(0, 10);
          } else {
            freedomDate = "> 50 Years";
          }
        }
      }
    } else {
      // No history available (e.g. new account), assume linear growth from 0
      // Treat as if we started 1 month ago for rough projection? 
      // Or just say "Insufficient Data"
      freedomDate = "Insufficient Data";
    }
  } else {
    freedomDate = "No Passive Income";
  }

  return {
    runway: Number(runway.toFixed(1)),
    freedomDate,
    assetEfficiency: Number(assetEfficiency.toFixed(2)),
    trends: {
      netWorth: Number(netWorthTrend.toFixed(2)),
      cashflow: Number(cashflowTrend.toFixed(2))
    }
  };
}

/**
 * Calculate financial snapshot from reconstructed state
 */
function calculateSnapshotFromState(
  state: FinancialState, 
  targetDate: Date,
  financialHealth: FinancialHealth,
  prevMonthState: FinancialState | null
) {
  // Calculate balance sheet totals
  const totalAssets = Array.from(state.assets.values()).reduce((sum, asset) => sum + asset.value, 0);
  const totalLiabilities = Array.from(state.liabilities.values()).reduce((sum, liability) => sum + liability.value, 0);
  const totalCashBalance = state.cashSavings;
  const netWorth = totalAssets - totalLiabilities + totalCashBalance;

  // Calculate income by type
  const incomeLines = Array.from(state.incomeLines.values());
  const earnedIncome = incomeLines
    .filter(i => i.type.toUpperCase() === 'EARNED')
    .reduce((sum, i) => sum + i.amount, 0);
  const passiveIncome = incomeLines
    .filter(i => i.type.toUpperCase() === 'PASSIVE')
    .reduce((sum, i) => sum + i.amount, 0);
  const portfolioIncome = incomeLines
    .filter(i => i.type.toUpperCase() === 'PORTFOLIO')
    .reduce((sum, i) => sum + i.amount, 0);
  const totalIncome = earnedIncome + passiveIncome + portfolioIncome;

  // Calculate expenses
  const totalExpenses = Array.from(state.expenses.values()).reduce((sum, expense) => sum + expense.amount, 0);
  const netCashflow = totalIncome - totalExpenses;

  // Calculate ratios
  const passiveCoverageRatio = totalExpenses > 0 ? (passiveIncome / totalExpenses) * 100 : 0;
  const savingsRate = totalIncome > 0 ? (netCashflow / totalIncome) * 100 : 0;

  // --- RichFlow Metrics ---
  
  // 1. Wealth Velocity (Net Worth Change vs Previous Month)
  let wealthVelocity = 0;
  let wealthVelocityPct = 0;
  
  if (prevMonthState) {
    const prevAssets = Array.from(prevMonthState.assets.values()).reduce((sum, a) => sum + a.value, 0);
    const prevLiabilities = Array.from(prevMonthState.liabilities.values()).reduce((sum, l) => sum + l.value, 0);
    const prevCash = prevMonthState.cashSavings;
    const prevNetWorth = prevAssets - prevLiabilities + prevCash;
    
    wealthVelocity = netWorth - prevNetWorth;
    if (prevNetWorth !== 0) {
      wealthVelocityPct = (wealthVelocity / Math.abs(prevNetWorth)) * 100;
    } else if (netWorth !== 0) {
      wealthVelocityPct = netWorth > 0 ? 100 : -100;
    }
  }

  // 2. Solvency Ratio (Liabilities / Assets)
  // Note: totalAssets in our state excludes cash, but for solvency we should include liquid assets (cash)
  const totalAssetsWithCash = totalAssets + totalCashBalance;
  const solvencyRatio = totalAssetsWithCash > 0 ? (totalLiabilities / totalAssetsWithCash) * 100 : 0;

  // 3. Freedom Gap (Expenses - Passive Income)
  const freedomGap = totalExpenses - passiveIncome;

  // Income quadrant distribution
  const quadrantTotals = createEmptyQuadrantTotals();
  incomeLines.forEach(line => {
    const bucket = determineIncomeQuadrant(line.type, line.quadrant);
    quadrantTotals[bucket] += line.amount;
  });

  const incomeQuadrant = {
    EMPLOYEE: Number(quadrantTotals.EMPLOYEE),
    SELF_EMPLOYED: Number(quadrantTotals.SELF_EMPLOYED),
    BUSINESS_OWNER: Number(quadrantTotals.BUSINESS_OWNER),
    INVESTOR: Number(quadrantTotals.INVESTOR)
  };

  return {
    date: targetDate.toISOString().substring(0, 10),
    currency: state.currency,
    balanceSheet: {
      totalCashBalance: Number(totalCashBalance),
      totalAssets: Number(totalAssets),
      totalLiabilities: Number(totalLiabilities),
      netWorth: Number(netWorth)
    },
    cashflow: {
      earnedIncome: Number(earnedIncome),
      passiveIncome: Number(passiveIncome),
      portfolioIncome: Number(portfolioIncome),
      totalIncome: Number(totalIncome),
      totalExpenses: Number(totalExpenses),
      netCashflow: Number(netCashflow),
      direction: netCashflow >= 0 ? 'positive' : 'negative'
    },
    ratios: {
      passiveCoverageRatio: passiveCoverageRatio.toFixed(2),
      savingsRate: savingsRate.toFixed(2)
    },
    richFlowMetrics: {
      wealthVelocity: Number(wealthVelocity),
      wealthVelocityPct: Number(wealthVelocityPct.toFixed(2)),
      solvencyRatio: Number(solvencyRatio.toFixed(2)),
      freedomGap: Number(freedomGap)
    },
    incomeQuadrant,
    financialHealth
  };
}

/**
 * Get current financial snapshot from database (no event replay)
 */
async function getCurrentFinancialSnapshot(userId: number) {
  // Get user's preferred currency
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { PreferredCurrency: true }
  });

  const currency = {
    symbol: user?.PreferredCurrency?.cur_symbol || '$',
    name: user?.PreferredCurrency?.cur_name || 'USD'
  };

  // Get balance sheet data (current state)
  const balanceSheet = await prisma.balanceSheet.findFirst({
    where: { userId },
    include: {
      Asset: true,
      Liability: true
    }
  });

  // Get cash savings (current state)
  const cashSavings = await prisma.cashSavings.findFirst({
    where: { userId }
  });

  // Get income statement data (current state)
  const incomeStatement = await prisma.incomeStatement.findFirst({
    where: { userId },
    include: {
      Expense: true,
      IncomeLine: true
    }
  });

  // Construct Current FinancialState object for Health Calculation
  const currentState: FinancialState = {
    assets: new Map(balanceSheet?.Asset.map(a => [a.id, { id: a.id, name: a.name, value: a.value }]) || []),
    liabilities: new Map(balanceSheet?.Liability.map(l => [l.id, { id: l.id, name: l.name, value: l.value }]) || []),
    incomeLines: new Map(incomeStatement?.IncomeLine.map(i => [i.id, { id: i.id, name: i.name, amount: i.amount, type: i.type, quadrant: i.quadrant }]) || []),
    expenses: new Map(incomeStatement?.Expense.map(e => [e.id, { id: e.id, name: e.name, amount: e.amount }]) || []),
    cashSavings: cashSavings?.amount || 0,
    currency
  };

  // Fetch events to reconstruct past states for trends
  const events = await getEventsByUser({ userId, limit: 100000 });
  const now = new Date();
  const oneMonthAgo = new Date(now); oneMonthAgo.setMonth(now.getMonth() - 1);
  const sixMonthsAgo = new Date(now); sixMonthsAgo.setMonth(now.getMonth() - 6);

  const prevMonthState = reconstructStateFromEvents(events, oneMonthAgo, currency);
  const sixMonthAgoState = reconstructStateFromEvents(events, sixMonthsAgo, currency);

  const financialHealth = calculateFinancialHealth(currentState, prevMonthState, sixMonthAgoState);

  // Calculate balance sheet totals
  const totalAssets = balanceSheet?.Asset.reduce((sum, asset) => sum + Number(asset.value), 0) || 0;
  const totalLiabilities = balanceSheet?.Liability.reduce((sum, liability) => sum + Number(liability.value), 0) || 0;
  const totalCashBalance = Number(cashSavings?.amount) || 0;
  const netWorth = totalAssets - totalLiabilities + totalCashBalance;

  // Income by type (case-insensitive matching)
  const earnedIncome = incomeStatement?.IncomeLine.filter(i => i.type.toUpperCase() === 'EARNED').reduce((sum, i) => sum + Number(i.amount), 0) || 0;
  const passiveIncome = incomeStatement?.IncomeLine.filter(i => i.type.toUpperCase() === 'PASSIVE').reduce((sum, i) => sum + Number(i.amount), 0) || 0;
  const portfolioIncome = incomeStatement?.IncomeLine.filter(i => i.type.toUpperCase() === 'PORTFOLIO').reduce((sum, i) => sum + Number(i.amount), 0) || 0;
  const totalIncome = earnedIncome + passiveIncome + portfolioIncome;

  const totalExpenses = incomeStatement?.Expense.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;
  const netCashflow = totalIncome - totalExpenses;

  // Calculate ratios
  const passiveCoverageRatio = totalExpenses > 0 ? (passiveIncome / totalExpenses) * 100 : 0;
  const savingsRate = totalIncome > 0 ? (netCashflow / totalIncome) * 100 : 0;

  // --- RichFlow Metrics ---
  
  // 1. Wealth Velocity (Net Worth Change vs Previous Month)
  let wealthVelocity = 0;
  let wealthVelocityPct = 0;
  
  if (prevMonthState) {
    const prevAssets = Array.from(prevMonthState.assets.values()).reduce((sum, a) => sum + a.value, 0);
    const prevLiabilities = Array.from(prevMonthState.liabilities.values()).reduce((sum, l) => sum + l.value, 0);
    const prevCash = prevMonthState.cashSavings;
    const prevNetWorth = prevAssets - prevLiabilities + prevCash;
    
    wealthVelocity = netWorth - prevNetWorth;
    if (prevNetWorth !== 0) {
      wealthVelocityPct = (wealthVelocity / Math.abs(prevNetWorth)) * 100;
    } else if (netWorth !== 0) {
      wealthVelocityPct = netWorth > 0 ? 100 : -100;
    }
  }

  // 2. Solvency Ratio (Liabilities / Assets)
  const totalAssetsWithCash = totalAssets + totalCashBalance;
  const solvencyRatio = totalAssetsWithCash > 0 ? (totalLiabilities / totalAssetsWithCash) * 100 : 0;

  // 3. Freedom Gap (Expenses - Passive Income)
  const freedomGap = totalExpenses - passiveIncome;

  // Income quadrant distribution
  const quadrantTotals = createEmptyQuadrantTotals();
  incomeStatement?.IncomeLine?.forEach(line => {
    const bucket = determineIncomeQuadrant(line.type, line.quadrant);
    quadrantTotals[bucket] += Number(line.amount);
  });

  const incomeQuadrant = {
    EMPLOYEE: Number(quadrantTotals.EMPLOYEE),
    SELF_EMPLOYED: Number(quadrantTotals.SELF_EMPLOYED),
    BUSINESS_OWNER: Number(quadrantTotals.BUSINESS_OWNER),
    INVESTOR: Number(quadrantTotals.INVESTOR)
  };

  return {
    date: new Date().toISOString().substring(0, 10),
    currency,
    balanceSheet: {
      totalCashBalance: Number(totalCashBalance),
      totalAssets: Number(totalAssets),
      totalLiabilities: Number(totalLiabilities),
      netWorth: Number(netWorth)
    },
    cashflow: {
      earnedIncome: Number(earnedIncome),
      passiveIncome: Number(passiveIncome),
      portfolioIncome: Number(portfolioIncome),
      totalIncome: Number(totalIncome),
      totalExpenses: Number(totalExpenses),
      netCashflow: Number(netCashflow),
      direction: netCashflow >= 0 ? 'positive' : 'negative'
    },
    ratios: {
      passiveCoverageRatio: passiveCoverageRatio.toFixed(2),
      savingsRate: savingsRate.toFixed(2)
    },
    richFlowMetrics: {
      wealthVelocity: Number(wealthVelocity),
      wealthVelocityPct: Number(wealthVelocityPct.toFixed(2)),
      solvencyRatio: Number(solvencyRatio.toFixed(2)),
      freedomGap: Number(freedomGap)
    },
    incomeQuadrant,
    financialHealth
  };
}

/**
 * Get financial snapshot - either current state or reconstructed point-in-time state
 */
export const getFinancialSnapshot = async (userId: number, date?: string) => {
  // If no date specified, return current state from database
  if (!date) {
    return await getCurrentFinancialSnapshot(userId);
  }

  // Parse target date as end-of-day UTC for the provided YYYY-MM-DD
  const targetDate = (() => {
    // If date includes time, use native Date parsing
    if (date.length > 10) return new Date(date);
    const [y, m, d] = date.split('-').map(Number);
    if (!y || !m || !d) return new Date(date);
    return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
  })();
  const now = new Date();

  // If target date is in the future or today, return current state
  if (targetDate >= now) {
    return await getCurrentFinancialSnapshot(userId);
  }

  // For historical dates, reconstruct state from events
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true, PreferredCurrency: true }
  });

  // Get all events from account creation up to the target date (inclusive)
  const queryParams: any = {
    userId,
    endDate: targetDate,
    limit: 100000
  };
  if (user?.createdAt) {
    queryParams.startDate = user.createdAt;
  }
  const events = await getEventsByUser(queryParams);

  // Determine initial currency
  const firstCurrencyEvent = await prisma.event.findFirst({
    where: {
      userId,
      entityType: EntityType.USER,
      actionType: ActionType.UPDATE
    },
    orderBy: { timestamp: 'asc' }
  });

  let initialCurrency = {
    symbol: user?.PreferredCurrency?.cur_symbol || '$',
    name: user?.PreferredCurrency?.cur_name || 'USD'
  };

  if (firstCurrencyEvent && firstCurrencyEvent.beforeValue) {
    const before = JSON.parse(firstCurrencyEvent.beforeValue);
    if (before.currencyCode) {
      initialCurrency = {
        symbol: before.currencyCode,
        name: before.currencyName || before.currencyCode
      };
    }
  }

  const state = reconstructStateFromEvents(events, targetDate, initialCurrency);
  
  // Reconstruct past states for trends
  const oneMonthAgo = new Date(targetDate); oneMonthAgo.setMonth(targetDate.getMonth() - 1);
  const sixMonthsAgo = new Date(targetDate); sixMonthsAgo.setMonth(targetDate.getMonth() - 6);
  
  const prevMonthState = reconstructStateFromEvents(events, oneMonthAgo, initialCurrency);
  const sixMonthAgoState = reconstructStateFromEvents(events, sixMonthsAgo, initialCurrency);

  const financialHealth = calculateFinancialHealth(state, prevMonthState, sixMonthAgoState);

  return calculateSnapshotFromState(state, targetDate, financialHealth, prevMonthState);
};
