import prisma from '../config/database.config.js';
import { createEmptyQuadrantTotals, determineIncomeQuadrant } from '../utils/incomeQuadrant.utils.js';
import { getEventsByUser } from './event.service.js';
import { EntityType, ActionType, Event } from '../types/event.types.js';

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
 * Helper to hydrate FinancialState from JSON snapshot
 * Handles Map reconstruction
 */
function hydrateStateFromSnapshot(snapshotData: any): FinancialState {
  return {
    assets: new Map(snapshotData.assets),
    liabilities: new Map(snapshotData.liabilities),
    incomeLines: new Map(snapshotData.incomeLines),
    expenses: new Map(snapshotData.expenses),
    cashSavings: Number(snapshotData.cashSavings),
    currency: snapshotData.currency
  };
}

/**
 * Helper to serialize FinancialState to JSON-compatible object
 * Handles Map serialization
 */
function serializeStateForSnapshot(state: FinancialState): any {
  return {
    assets: Array.from(state.assets.entries()),
    liabilities: Array.from(state.liabilities.entries()),
    incomeLines: Array.from(state.incomeLines.entries()),
    expenses: Array.from(state.expenses.entries()),
    cashSavings: state.cashSavings,
    currency: state.currency
  };
}

/**
 * Get the first day of a month for a given date
 */
function getFirstOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
}

/**
 * Check if two dates represent the same month (year + month)
 */
function isSameMonth(date1: Date, date2: Date): boolean {
  return date1.getUTCFullYear() === date2.getUTCFullYear() &&
    date1.getUTCMonth() === date2.getUTCMonth();
}

/**
 * Ensure monthly checkpoints exist for a user from account creation to now
 * This is a self-healing mechanism that fills gaps in snapshot history
 * to limit event replay depth for long-term users (5+ years of data)
 */
export async function ensureMonthlyCheckpoints(userId: number): Promise<void> {
  // 1. Get user creation date and currency
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { PreferredCurrency: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const userCreatedAt = user.createdAt;
  const now = new Date();

  // 2. Find the latest existing snapshot to use as cursor (optimization)
  const latestSnapshot = await prisma.financialSnapshot.findFirst({
    where: { userId },
    orderBy: { date: 'desc' }
  });

  // Determine the starting point for checkpoint creation
  // Use the month AFTER the latest snapshot, or user creation month if no snapshots
  let cursorDate: Date;
  if (latestSnapshot) {
    const snapshotDate = new Date(latestSnapshot.date);
    // Move to the first of the NEXT month after the snapshot
    cursorDate = new Date(Date.UTC(snapshotDate.getUTCFullYear(), snapshotDate.getUTCMonth() + 1, 1, 0, 0, 0, 0));
  } else {
    // Start from the first of the month of user creation
    cursorDate = getFirstOfMonth(userCreatedAt);
  }

  // 3. Get all existing snapshot dates for this user to avoid duplicates
  const existingSnapshots = await prisma.financialSnapshot.findMany({
    where: { userId },
    select: { date: true }
  });

  const existingSnapshotMonths = new Set(
    existingSnapshots.map((s: any) => {
      const d = new Date(s.date);
      return `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
    })
  );

  // 4. Calculate the first of the current month as the end boundary
  const currentMonthFirst = getFirstOfMonth(now);

  // If cursor is already past or at current month, no checkpoints needed
  if (cursorDate >= currentMonthFirst) {
    return;
  }

  // 5. Collect missing months
  const missingMonths: Date[] = [];
  let checkDate = new Date(cursorDate);

  while (checkDate < currentMonthFirst) {
    const monthKey = `${checkDate.getUTCFullYear()}-${checkDate.getUTCMonth()}`;
    if (!existingSnapshotMonths.has(monthKey)) {
      missingMonths.push(new Date(checkDate));
    }
    // Move to next month
    checkDate = new Date(Date.UTC(checkDate.getUTCFullYear(), checkDate.getUTCMonth() + 1, 1, 0, 0, 0, 0));
  }

  // If no missing months, return early
  if (missingMonths.length === 0) {
    return;
  }

  // 6. Fetch all events for this user (needed for reconstruction)
  const events = await getEventsByUser({ userId, limit: 100000 });
  const typedEvents = events as unknown as Event[];

  // Sort events chronologically
  typedEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Determine initial currency
  let initialCurrency = {
    symbol: user.PreferredCurrency?.cur_symbol || '$',
    name: user.PreferredCurrency?.cur_name || 'USD'
  };

  // Check for first currency update event to get original currency
  const firstCurrencyEvent = typedEvents.find(e =>
    e.entityType === EntityType.USER &&
    e.actionType === ActionType.UPDATE &&
    e.beforeValue &&
    (typeof e.beforeValue === 'string' ? JSON.parse(e.beforeValue).currencyCode : (e.beforeValue as any).currencyCode)
  );

  if (firstCurrencyEvent && firstCurrencyEvent.beforeValue) {
    const before = typeof firstCurrencyEvent.beforeValue === 'string'
      ? JSON.parse(firstCurrencyEvent.beforeValue)
      : firstCurrencyEvent.beforeValue;

    if (before.currencyCode) {
      initialCurrency = {
        symbol: before.currencyCode,
        name: before.currencyName || before.currencyCode
      };
    }
  }

  // 7. Use incremental reconstruction for efficiency
  // Find the best starting point (latest snapshot before first missing month)
  let state: FinancialState;
  let eventIndex = 0;

  const baseSnapshot = await prisma.financialSnapshot.findFirst({
    where: {
      userId,
      date: { lt: missingMonths[0]! }
    },
    orderBy: { date: 'desc' }
  });

  if (baseSnapshot) {
    state = hydrateStateFromSnapshot(baseSnapshot.data);
    const snapshotDate = new Date(baseSnapshot.date);

    // Find first event after the base snapshot
    eventIndex = typedEvents.findIndex(e => new Date(e.timestamp) > snapshotDate);
    if (eventIndex === -1) eventIndex = typedEvents.length;
  } else {
    // Start from scratch
    state = {
      assets: new Map(),
      liabilities: new Map(),
      incomeLines: new Map(),
      expenses: new Map(),
      cashSavings: 0,
      currency: { ...initialCurrency }
    };
  }

  // 8. Iterate through missing months and create snapshots
  const snapshotsToCreate: { userId: number; date: Date; data: any }[] = [];

  for (const targetDate of missingMonths) {
    // Apply events up to this target date
    while (eventIndex < typedEvents.length && new Date(typedEvents[eventIndex]!.timestamp) <= targetDate) {
      state = rootReducer(state, typedEvents[eventIndex]!);
      eventIndex++;
    }

    // Serialize and queue for creation
    snapshotsToCreate.push({
      userId,
      date: targetDate,
      data: serializeStateForSnapshot(state)
    });
  }

  // 9. Batch insert all missing snapshots
  if (snapshotsToCreate.length > 0) {
    await prisma.financialSnapshot.createMany({
      data: snapshotsToCreate,
      skipDuplicates: true
    });
  }
}

// --- Pure Reducers ---

const assetReducer = (state: FinancialState, event: Event): FinancialState => {
  const newState = { ...state, assets: new Map(state.assets) };
  const { actionType, entityId, afterValue } = event;

  switch (actionType) {
    case ActionType.CREATE:
    case ActionType.UPDATE:
      if (afterValue) {
        newState.assets.set(entityId, {
          id: entityId,
          name: afterValue.name,
          value: Number(afterValue.value)
        });
      }
      break;
    case ActionType.DELETE:
      newState.assets.delete(entityId);
      break;
  }
  return newState;
};

const liabilityReducer = (state: FinancialState, event: Event): FinancialState => {
  const newState = { ...state, liabilities: new Map(state.liabilities) };
  const { actionType, entityId, afterValue } = event;

  switch (actionType) {
    case ActionType.CREATE:
    case ActionType.UPDATE:
      if (afterValue) {
        newState.liabilities.set(entityId, {
          id: entityId,
          name: afterValue.name,
          value: Number(afterValue.value)
        });
      }
      break;
    case ActionType.DELETE:
      newState.liabilities.delete(entityId);
      break;
  }
  return newState;
};

const incomeReducer = (state: FinancialState, event: Event): FinancialState => {
  if (event.entitySubtype === 'INCOME_STATEMENT') return state;

  const newState = { ...state, incomeLines: new Map(state.incomeLines) };
  const { actionType, entityId, afterValue } = event;

  switch (actionType) {
    case ActionType.CREATE:
    case ActionType.UPDATE:
      if (afterValue) {
        newState.incomeLines.set(entityId, {
          id: entityId,
          name: afterValue.name,
          amount: Number(afterValue.amount),
          type: afterValue.type,
          quadrant: afterValue.quadrant || null
        });
      }
      break;
    case ActionType.DELETE:
      newState.incomeLines.delete(entityId);
      break;
  }
  return newState;
};

const expenseReducer = (state: FinancialState, event: Event): FinancialState => {
  const newState = { ...state, expenses: new Map(state.expenses) };
  const { actionType, entityId, afterValue } = event;

  switch (actionType) {
    case ActionType.CREATE:
    case ActionType.UPDATE:
      if (afterValue) {
        newState.expenses.set(entityId, {
          id: entityId,
          name: afterValue.name,
          amount: Number(afterValue.amount)
        });
      }
      break;
    case ActionType.DELETE:
      newState.expenses.delete(entityId);
      break;
  }
  return newState;
};

const cashSavingsReducer = (state: FinancialState, event: Event): FinancialState => {
  const { actionType, afterValue } = event;

  if ((actionType === ActionType.CREATE || actionType === ActionType.UPDATE) && afterValue && afterValue.amount !== undefined) {
    return { ...state, cashSavings: Number(afterValue.amount) };
  }
  return state;
};

const userReducer = (state: FinancialState, event: Event): FinancialState => {
  const { actionType, afterValue } = event;

  if (actionType === ActionType.UPDATE && afterValue && afterValue.currencyCode) {
    return {
      ...state,
      currency: {
        symbol: afterValue.currencyCode,
        name: afterValue.currencyName || afterValue.currencyCode
      }
    };
  }
  return state;
};

/**
 * Root Reducer: Dispatches to specific reducers based on entity type
 */
const rootReducer = (state: FinancialState, event: Event): FinancialState => {
  switch (event.entityType) {
    case EntityType.ASSET:
      return assetReducer(state, event);
    case EntityType.LIABILITY:
      return liabilityReducer(state, event);
    case EntityType.INCOME:
      return incomeReducer(state, event);
    case EntityType.EXPENSE:
      return expenseReducer(state, event);
    case EntityType.CASH_SAVINGS:
      return cashSavingsReducer(state, event);
    case EntityType.USER:
      return userReducer(state, event);
    default:
      return state;
  }
};

/**
 * Reconstruct financial state from a list of events up to a target date
 * Uses the pure reducer pattern
 */
function reconstructStateFromEvents(
  events: Event[],
  targetDate: Date,
  initialCurrency: { symbol: string; name: string }
): FinancialState {
  const initialState: FinancialState = {
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

  // Apply reducer pipeline
  return relevantEvents.reduce(rootReducer, initialState);
}

// --- Metrics Calculation (Pure Functions) ---

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
  // Note: Combined passive + portfolio income is used for financial freedom calculations
  // since portfolio income (from investments) also generates money without active work
  const currentCombinedPassiveIncome = currentPassiveIncome + currentPortfolioIncome;
  let freedomDate: string | null = null;

  if (currentCombinedPassiveIncome >= currentExpenses) {
    freedomDate = "Achieved";
  } else if (currentCombinedPassiveIncome > 0) {
    // We have some passive/portfolio income, let's try to project
    if (sixMonthAgoState) {
      const sixMonthPassive = Array.from(sixMonthAgoState.incomeLines.values())
        .filter(i => i.type.toUpperCase() === 'PASSIVE')
        .reduce((sum, i) => sum + i.amount, 0);
      const sixMonthPortfolio = Array.from(sixMonthAgoState.incomeLines.values())
        .filter(i => i.type.toUpperCase() === 'PORTFOLIO')
        .reduce((sum, i) => sum + i.amount, 0);
      const sixMonthCombinedPassive = sixMonthPassive + sixMonthPortfolio;

      // Case 1: Growth from non-zero base (Compound Growth)
      if (sixMonthCombinedPassive > 0) {
        if (currentCombinedPassiveIncome > sixMonthCombinedPassive) {
          // Calculate monthly growth rate (CAGR over 6 months)
          const growthFactor = Math.pow(currentCombinedPassiveIncome / sixMonthCombinedPassive, 1 / 6);
          const r = growthFactor - 1;

          if (r > 0) {
            const monthsToFreedom = Math.log(currentExpenses / currentCombinedPassiveIncome) / Math.log(1 + r);

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
        const monthlyGrowthAmount = currentCombinedPassiveIncome / 6;
        const gapToCover = currentExpenses - currentCombinedPassiveIncome;

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

  // Combined passive income (passive + portfolio) for freedom calculations
  // Portfolio income from investments also generates money without active work
  const combinedPassiveIncome = passiveIncome + portfolioIncome;

  // Calculate ratios
  // Passive coverage now includes portfolio income since it also contributes to financial freedom
  const passiveCoverageRatio = totalExpenses > 0 ? (combinedPassiveIncome / totalExpenses) * 100 : 0;
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

  // 3. Freedom Gap (Expenses - Combined Passive Income)
  // Portfolio income is included since it also generates income without active work
  const freedomGap = totalExpenses - combinedPassiveIncome;

  // Income quadrant distribution
  const quadrantTotals = createEmptyQuadrantTotals();
  incomeLines.forEach(line => {
    const bucket = determineIncomeQuadrant(line.type, line.quadrant);
    quadrantTotals[bucket] += line.amount;
  });

  const qEmployee = Number(quadrantTotals.EMPLOYEE);
  const qSelf = Number(quadrantTotals.SELF_EMPLOYED);
  const qBus = Number(quadrantTotals.BUSINESS_OWNER);
  const qInv = Number(quadrantTotals.INVESTOR);

  const incomeQuadrantData = {
    EMPLOYEE: { amount: qEmployee, pct: totalIncome > 0 ? (qEmployee / totalIncome) * 100 : 0 },
    SELF_EMPLOYED: { amount: qSelf, pct: totalIncome > 0 ? (qSelf / totalIncome) * 100 : 0 },
    BUSINESS_OWNER: { amount: qBus, pct: totalIncome > 0 ? (qBus / totalIncome) * 100 : 0 },
    INVESTOR: { amount: qInv, pct: totalIncome > 0 ? (qInv / totalIncome) * 100 : 0 },
    total: totalIncome
  };

  return {
    date: targetDate.toISOString().substring(0, 10),
    currency: state.currency,
    balanceSheet: {
      totalCashBalance: Number(totalCashBalance),
      // Expose liquid cash separately for solvency analysis
      totalCash: Number(totalCashBalance),
      // Invested / illiquid assets (excludes cash)
      totalInvestedAssets: Number(totalAssets),
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
    // Income quadrant with amounts and percentage contribution
    incomeQuadrant: incomeQuadrantData,
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
    assets: new Map(balanceSheet?.Asset.map((a: any) => [a.id, { id: a.id, name: a.name, value: a.value }]) || []),
    liabilities: new Map(balanceSheet?.Liability.map((l: any) => [l.id, { id: l.id, name: l.name, value: l.value }]) || []),
    incomeLines: new Map(incomeStatement?.IncomeLine.map((i: any) => [i.id, { id: i.id, name: i.name, amount: i.amount, type: i.type, quadrant: i.quadrant }]) || []),
    expenses: new Map(incomeStatement?.Expense.map((e: any) => [e.id, { id: e.id, name: e.name, amount: e.amount }]) || []),
    cashSavings: cashSavings?.amount || 0,
    currency
  };

  // Fetch events to reconstruct past states for trends
  const events = await getEventsByUser({ userId, limit: 100000 });
  const now = new Date();
  const oneMonthAgo = new Date(now); oneMonthAgo.setMonth(now.getMonth() - 1);
  const sixMonthsAgo = new Date(now); sixMonthsAgo.setMonth(now.getMonth() - 6);

  // Cast events to Event[] since we know they match our type
  const typedEvents = events as unknown as Event[];

  const prevMonthState = reconstructStateFromEvents(typedEvents, oneMonthAgo, currency);
  const sixMonthAgoState = reconstructStateFromEvents(typedEvents, sixMonthsAgo, currency);

  const financialHealth = calculateFinancialHealth(currentState, prevMonthState, sixMonthAgoState);

  // Calculate balance sheet totals
  const totalAssets = balanceSheet?.Asset.reduce((sum: number, asset: any) => sum + Number(asset.value), 0) || 0;
  const totalLiabilities = balanceSheet?.Liability.reduce((sum: number, liability: any) => sum + Number(liability.value), 0) || 0;
  const totalCashBalance = Number(cashSavings?.amount) || 0;
  const netWorth = totalAssets - totalLiabilities + totalCashBalance;

  // Income by type (case-insensitive matching)
  const earnedIncome = incomeStatement?.IncomeLine.filter((i: any) => i.type.toUpperCase() === 'EARNED').reduce((sum: number, i: any) => sum + Number(i.amount), 0) || 0;
  const passiveIncome = incomeStatement?.IncomeLine.filter((i: any) => i.type.toUpperCase() === 'PASSIVE').reduce((sum: number, i: any) => sum + Number(i.amount), 0) || 0;
  const portfolioIncome = incomeStatement?.IncomeLine.filter((i: any) => i.type.toUpperCase() === 'PORTFOLIO').reduce((sum: number, i: any) => sum + Number(i.amount), 0) || 0;
  const totalIncome = earnedIncome + passiveIncome + portfolioIncome;

  const totalExpenses = incomeStatement?.Expense.reduce((sum: number, expense: any) => sum + Number(expense.amount), 0) || 0;
  const netCashflow = totalIncome - totalExpenses;

  // Combined passive income (passive + portfolio) for freedom calculations
  // Portfolio income from investments also generates money without active work
  const combinedPassiveIncome = passiveIncome + portfolioIncome;

  // Calculate ratios
  // Passive coverage now includes portfolio income since it also contributes to financial freedom
  const passiveCoverageRatio = totalExpenses > 0 ? (combinedPassiveIncome / totalExpenses) * 100 : 0;
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

  // 3. Freedom Gap (Expenses - Combined Passive Income)
  // Portfolio income is included since it also generates income without active work
  const freedomGap = totalExpenses - combinedPassiveIncome;

  // Income quadrant distribution
  const quadrantTotals = createEmptyQuadrantTotals();
  incomeStatement?.IncomeLine?.forEach((line: any) => {
    const bucket = determineIncomeQuadrant(line.type, line.quadrant);
    quadrantTotals[bucket] += Number(line.amount);
  });

  const qEmployee = Number(quadrantTotals.EMPLOYEE);
  const qSelf = Number(quadrantTotals.SELF_EMPLOYED);
  const qBus = Number(quadrantTotals.BUSINESS_OWNER);
  const qInv = Number(quadrantTotals.INVESTOR);

  const incomeQuadrantData = {
    EMPLOYEE: { amount: qEmployee, pct: totalIncome > 0 ? (qEmployee / totalIncome) * 100 : 0 },
    SELF_EMPLOYED: { amount: qSelf, pct: totalIncome > 0 ? (qSelf / totalIncome) * 100 : 0 },
    BUSINESS_OWNER: { amount: qBus, pct: totalIncome > 0 ? (qBus / totalIncome) * 100 : 0 },
    INVESTOR: { amount: qInv, pct: totalIncome > 0 ? (qInv / totalIncome) * 100 : 0 },
    total: totalIncome
  };

  return {
    date: new Date().toISOString().substring(0, 10),
    currency,
    balanceSheet: {
      totalCashBalance: Number(totalCashBalance),
      totalCash: Number(totalCashBalance),
      totalInvestedAssets: Number(totalAssets),
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
    incomeQuadrant: incomeQuadrantData,
    financialHealth
  };
}

/**
 * Create a financial snapshot for the user at the current time
 * This serves as a checkpoint for faster future calculations
 */
export async function createSnapshot(userId: number): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { PreferredCurrency: true }
  });

  if (!user) throw new Error('User not found');

  const events = await getEventsByUser({ userId, limit: 100000 });
  const typedEvents = events as unknown as Event[];

  // Sort events
  typedEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Determine initial currency
  let initialCurrency = {
    symbol: user.PreferredCurrency?.cur_symbol || '$',
    name: user.PreferredCurrency?.cur_name || 'USD'
  };

  // Check for currency update events
  const firstCurrencyEvent = typedEvents.find(e =>
    e.entityType === EntityType.USER &&
    e.actionType === ActionType.UPDATE &&
    (e.beforeValue && (typeof e.beforeValue === 'string' ? JSON.parse(e.beforeValue).currencyCode : e.beforeValue.currencyCode))
  );

  if (firstCurrencyEvent && firstCurrencyEvent.beforeValue) {
    const before = typeof firstCurrencyEvent.beforeValue === 'string'
      ? JSON.parse(firstCurrencyEvent.beforeValue)
      : firstCurrencyEvent.beforeValue;

    if (before.currencyCode) {
      initialCurrency = {
        symbol: before.currencyCode,
        name: before.currencyName || before.currencyCode
      };
    }
  }

  const now = new Date();
  const state = reconstructStateFromEvents(typedEvents, now, initialCurrency);

  // Serialize state
  const snapshotData = serializeStateForSnapshot(state);

  // Save to DB
  await prisma.financialSnapshot.create({
    data: {
      userId,
      date: now,
      data: snapshotData
    }
  });
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
  const typedEvents = events as unknown as Event[];

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
    // Check if beforeValue is object or string (handle both for safety)
    const before = typeof firstCurrencyEvent.beforeValue === 'string'
      ? JSON.parse(firstCurrencyEvent.beforeValue)
      : firstCurrencyEvent.beforeValue;

    if (before && before.currencyCode) {
      initialCurrency = {
        symbol: before.currencyCode,
        name: before.currencyName || before.currencyCode
      };
    }
  }

  // OPTIMIZATION: Check for snapshots
  // Find the latest snapshot before or on the target date
  const latestSnapshot = await prisma.financialSnapshot.findFirst({
    where: {
      userId,
      date: { lte: targetDate }
    },
    orderBy: { date: 'desc' }
  });

  let state: FinancialState;

  if (latestSnapshot) {
    // Hydrate state from snapshot
    state = hydrateStateFromSnapshot(latestSnapshot.data);

    // Filter events that happened AFTER the snapshot but BEFORE/ON targetDate
    const snapshotDate = new Date(latestSnapshot.date);
    const relevantEvents = typedEvents
      .filter(e => {
        const eventDate = new Date(e.timestamp);
        return eventDate > snapshotDate && eventDate <= targetDate;
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Apply remaining events
    state = relevantEvents.reduce(rootReducer, state);
  } else {
    // Fallback to full replay
    state = reconstructStateFromEvents(typedEvents, targetDate, initialCurrency);
  }

  // Reconstruct past states for trends
  const oneMonthAgo = new Date(targetDate); oneMonthAgo.setMonth(targetDate.getMonth() - 1);
  const sixMonthsAgo = new Date(targetDate); sixMonthsAgo.setMonth(targetDate.getMonth() - 6);

  const prevMonthState = reconstructStateFromEvents(typedEvents, oneMonthAgo, initialCurrency);
  const sixMonthAgoState = reconstructStateFromEvents(typedEvents, sixMonthsAgo, initialCurrency);

  const financialHealth = calculateFinancialHealth(state, prevMonthState, sixMonthAgoState);

  return calculateSnapshotFromState(state, targetDate, financialHealth, prevMonthState);
};

/**
 * Get financial trajectory over time - returns historical snapshots for velocity and freedom tracking
 * This enables visualization of the "Freedom Gap" over time
 */
export const getFinancialTrajectory = async (
  userId: number,
  startDate: string,
  endDate: string,
  interval: 'daily' | 'weekly' | 'monthly' = 'monthly'
): Promise<any[]> => {
  // Self-healing: Ensure monthly checkpoints exist before generating trajectory
  // This limits event replay depth for long-term users (5+ years of data)
  await ensureMonthlyCheckpoints(userId);

  const start = new Date(startDate);
  const end = new Date(endDate);
  const trajectoryPoints: any[] = [];

  // Calculate date intervals based on interval type
  const incrementDate = (date: Date): Date => {
    const newDate = new Date(date);
    switch (interval) {
      case 'daily':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'weekly':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'monthly':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
    }
    return newDate;
  };

  // Fetch ALL events from beginning to ensure correct state reconstruction
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { PreferredCurrency: true }
  });

  const queryParams: any = {
    userId,
    endDate: end,
    limit: 100000
  };

  if (user?.createdAt) {
    queryParams.startDate = user.createdAt;
  }

  const events = await getEventsByUser(queryParams);
  const typedEvents = events as unknown as Event[];

  // Ensure events are sorted chronologically
  typedEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const initialCurrency = (() => {
    // Default to current if no history
    let currency = user?.PreferredCurrency
      ? { symbol: user.PreferredCurrency.cur_symbol, name: user.PreferredCurrency.cur_name }
      : { symbol: '$', name: 'USD' };

    // Try to find the first currency update to get the original currency
    const firstCurrencyEvent = typedEvents.find(e =>
      e.entityType === EntityType.USER &&
      e.actionType === ActionType.UPDATE &&
      e.beforeValue &&
      (typeof e.beforeValue === 'string' ? JSON.parse(e.beforeValue).currencyCode : e.beforeValue.currencyCode)
    );

    if (firstCurrencyEvent && firstCurrencyEvent.beforeValue) {
      const before = typeof firstCurrencyEvent.beforeValue === 'string'
        ? JSON.parse(firstCurrencyEvent.beforeValue)
        : firstCurrencyEvent.beforeValue;

      if (before.currencyCode) {
        currency = {
          symbol: before.currencyCode,
          name: before.currencyName || before.currencyCode
        };
      }
    }
    return currency;
  })();

  // Initialize state
  let state: FinancialState = {
    assets: new Map(),
    liabilities: new Map(),
    incomeLines: new Map(),
    expenses: new Map(),
    cashSavings: 0,
    currency: { ...initialCurrency }
  };

  let currentDate = new Date(start);
  let eventIndex = 0;

  // OPTIMIZATION: Check for snapshots
  // Find the latest snapshot before the start date
  const latestSnapshot = await prisma.financialSnapshot.findFirst({
    where: {
      userId,
      date: { lte: start }
    },
    orderBy: { date: 'desc' }
  });

  if (latestSnapshot) {
    state = hydrateStateFromSnapshot(latestSnapshot.data);
    const snapshotDate = new Date(latestSnapshot.date);

    // Find the index of the first event after the snapshot
    eventIndex = typedEvents.findIndex(e => new Date(e.timestamp) > snapshotDate);
    if (eventIndex === -1) eventIndex = typedEvents.length; // No events after snapshot
  }

  // Incremental state reconstruction
  while (currentDate <= end) {
    // Apply new events since last check
    while (eventIndex < typedEvents.length && new Date(typedEvents[eventIndex]!.timestamp) <= currentDate) {
      // Use rootReducer for incremental updates
      state = rootReducer(state, typedEvents[eventIndex]!);
      eventIndex++;
    }

    // Calculate metrics from current state
    const totalAssets = Array.from(state.assets.values()).reduce((sum, asset) => sum + asset.value, 0);
    const totalLiabilities = Array.from(state.liabilities.values()).reduce((sum, liability) => sum + liability.value, 0);
    const totalCash = state.cashSavings;
    const netWorth = totalAssets - totalLiabilities + totalCash;

    const incomeLines = Array.from(state.incomeLines.values());
    const passiveIncome = incomeLines
      .filter(i => i.type.toUpperCase() === 'PASSIVE')
      .reduce((sum, i) => sum + i.amount, 0);
    const portfolioIncome = incomeLines
      .filter(i => i.type.toUpperCase() === 'PORTFOLIO')
      .reduce((sum, i) => sum + i.amount, 0);
    const totalIncome = incomeLines.reduce((sum, i) => sum + i.amount, 0);

    // Combined passive income (passive + portfolio) for freedom calculations
    // Portfolio income from investments also generates money without active work
    const combinedPassiveIncome = passiveIncome + portfolioIncome;

    const totalExpenses = Array.from(state.expenses.values()).reduce((sum, expense) => sum + expense.amount, 0);
    const netCashflow = totalIncome - totalExpenses;

    // Freedom Gap = Monthly Expenses - Combined Passive Income
    // Portfolio income is included since it also generates income without active work
    const freedomGap = totalExpenses - combinedPassiveIncome;

    // Wealth Velocity = Net Cashflow / Net Worth (if positive net worth)
    const wealthVelocity = netWorth > 0 ? (netCashflow / netWorth) : 0;

    // Asset Efficiency = (Passive + Portfolio) / Total Invested Assets
    const assetEfficiency = totalAssets > 0
      ? ((passiveIncome + portfolioIncome) / totalAssets) * 100
      : 0;

    // Income Quadrant Breakdown
    const quadrantTotals = createEmptyQuadrantTotals();
    incomeLines.forEach(line => {
      const bucket = determineIncomeQuadrant(line.type, line.quadrant);
      quadrantTotals[bucket] += line.amount;
    });

    // Derive net worth delta
    let netWorthDelta = 0;
    if (trajectoryPoints.length > 0) {
      const prev = trajectoryPoints[trajectoryPoints.length - 1];
      netWorthDelta = netWorth - prev.netWorth;
    }

    trajectoryPoints.push({
      date: currentDate.toISOString().split('T')[0],
      netWorth,
      netWorthDelta,
      passiveIncome,
      portfolioIncome,
      totalExpenses,
      freedomGap,
      wealthVelocity: wealthVelocity * 100,
      assetEfficiency,
      netCashflow,
      totalIncome,
      incomeQuadrant: quadrantTotals,
      currency: state.currency.symbol
    });

    currentDate = incrementDate(currentDate);
  }

  return trajectoryPoints;
};