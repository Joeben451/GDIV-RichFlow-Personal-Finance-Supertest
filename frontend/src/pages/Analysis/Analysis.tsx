import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Header from '../../components/Header/Header';
import { useAuth } from '../../context/AuthContext';
import { analysisAPI } from '../../utils/api';
import { formatCurrency as formatCurrencyValue } from '../../utils/currency.utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

type SnapshotData = {
  date: string;
  balanceSheet: {
    totalCashBalance: number;
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
  };
  cashflow: {
    earnedIncome: number;
    passiveIncome: number;
    portfolioIncome: number;
    totalIncome: number;
    totalExpenses: number;
    netCashflow: number;
    direction: string;
  };
  ratios: {
    passiveCoverageRatio: string;
    savingsRate: string;
  };
  richFlowMetrics: {
    wealthVelocity: number;
    wealthVelocityPct: number;
    solvencyRatio: number;
    freedomGap: number;
  };
  incomeQuadrant: {
    EMPLOYEE: number;
    SELF_EMPLOYED: number;
    BUSINESS_OWNER: number;
    INVESTOR: number;
  };
  financialHealth: {
    runway: number;
    freedomDate: string | null;
    assetEfficiency: number;
    trends: {
      netWorth: number;
      cashflow: number;
    };
  };
  currency: { symbol: string; name: string };
};

type SavedSnapshot = {
  id: string;
  date: string;
  data: SnapshotData;
};


const QUADRANT_COLORS = {
  EMPLOYEE: '#60a5fa', // Blue
  SELF_EMPLOYED: '#c084fc', // Purple
  BUSINESS_OWNER: '#fbbf24', // Gold
  INVESTOR: '#4ade80' // Green
};

const StatCard: React.FC<{
  title: string;
  value: React.ReactNode;
  subValue?: React.ReactNode;
  trend?: number;
  className?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  accentColor?: 'gold' | 'purple' | 'default';
}> = ({ title, value, subValue, trend, className = '', icon, children, accentColor = 'default' }) => {
  const borderColor = accentColor === 'gold' ? 'group-hover:border-[#FFD700]/30' : 
                      accentColor === 'purple' ? 'group-hover:border-[#800080]/30' : 
                      'group-hover:border-white/10';
  
  return (
    <div className={`group relative overflow-hidden rounded-2xl bg-zinc-900/50 backdrop-blur-md border border-white/5 p-6 transition-all duration-300 hover:bg-zinc-900/70 ${borderColor} ${className}`}>
      <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <div className="relative z-10 h-full flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider">{title}</h3>
          {icon && <div className="text-zinc-500 group-hover:text-white transition-colors">{icon}</div>}
        </div>
        
        <div className="mt-auto">
          <div className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            {value}
            {trend !== undefined && trend !== null && (
              <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${trend >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
              </span>
            )}
          </div>
          {subValue && <div className="mt-1 text-sm text-zinc-500">{subValue}</div>}
        </div>
        {children}
      </div>
    </div>
  );
};

const Analysis: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [snapshotData, setSnapshotData] = useState<SnapshotData | null>(null);

  // Compare state
  const [showCompare, setShowCompare] = useState(false);
  const [compareStart, setCompareStart] = useState('');
  const [compareEnd, setCompareEnd] = useState('');
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareResult, setCompareResult] = useState<{ start: SnapshotData; end: SnapshotData } | null>(null);

  // Mini calendar refs and opener
  const startRef = React.useRef<HTMLInputElement>(null);
  const endRef = React.useRef<HTMLInputElement>(null);
  const openNativePicker = (el: HTMLInputElement | null) => {
    if (!el) return;
    // Prefer the native mini calendar if supported
    const anyEl = el as any;
    if (typeof anyEl.showPicker === 'function') {
      anyEl.showPicker();
    } else {
      // Fallback for browsers without showPicker
      el.focus();
      el.click();
    }
  };

  // Historical currency formatter
  const formatHistorical = React.useCallback(
    (value: number, currency: { symbol: string; name: string }) => {
      return formatCurrencyValue(value, {
        cur_symbol: currency.symbol,
        cur_name: currency.name
      } as any);
    },
    []
  );

  const fetchSnapshot = async (date?: string) => {
    try {
      setLoading(true);
      const data = await analysisAPI.getFinancialSnapshot(date);
      setSnapshotData(data);
      if (!date) setSelectedDate('');
    } catch (error) {
      console.error('Failed to fetch snapshot:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshot();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchSnapshot(selectedDate);
    }
  }, [selectedDate]);

  const quadrantData = useMemo(() => {
    if (!snapshotData) return [];
    const { incomeQuadrant } = snapshotData;
    return [
      { name: 'Employee', value: incomeQuadrant.EMPLOYEE, color: QUADRANT_COLORS.EMPLOYEE },
      { name: 'Self-Employed', value: incomeQuadrant.SELF_EMPLOYED, color: QUADRANT_COLORS.SELF_EMPLOYED },
      { name: 'Business Owner', value: incomeQuadrant.BUSINESS_OWNER, color: QUADRANT_COLORS.BUSINESS_OWNER },
      { name: 'Investor', value: incomeQuadrant.INVESTOR, color: QUADRANT_COLORS.INVESTOR },
    ].filter(item => item.value > 0);
  }, [snapshotData]);

  // Helpers for comparison
  const safeDate = (d: string) => new Date(d);
  const isValidDate = (d: any) => d instanceof Date && !isNaN(d.getTime());
  const daysBetween = (a: string, b: string) => {
    const da = safeDate(a), db = safeDate(b);
    if (!isValidDate(da) || !isValidDate(db)) return 0;
    return Math.max(0, Math.round((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24)));
  };
  const monthsBetween = (a: string, b: string) => {
    const da = safeDate(a), db = safeDate(b);
    if (!isValidDate(da) || !isValidDate(db)) return 0;
    return (db.getFullYear() - da.getFullYear()) * 12 + (db.getMonth() - da.getMonth());
  };

  const fetchCompareReport = async () => {
    if (!compareStart || !compareEnd) return;
    setCompareLoading(true);
    try {
      const [startSnap, endSnap] = await Promise.all([
        analysisAPI.getFinancialSnapshot(compareStart),
        analysisAPI.getFinancialSnapshot(compareEnd),
      ]);
      setCompareResult({ start: startSnap, end: endSnap });
    } catch (e) {
      console.error('Failed to fetch comparison report:', e);
    } finally {
      setCompareLoading(false);
    }
  };

  const compareMetrics = useMemo(() => {
    if (!compareResult) return null;
    const { start, end } = compareResult;

    const periodDays = Math.max(1, daysBetween(compareStart, compareEnd));

    // Net worth & velocity
    const nwStart = start.balanceSheet.netWorth || 0;
    const nwEnd = end.balanceSheet.netWorth || 0;
    const nwDelta = nwEnd - nwStart;
    const nwPct = nwStart !== 0 ? (nwDelta / Math.abs(nwStart)) * 100 : null;
    const nwVelocityPerMonth = (nwDelta / periodDays) * 30; // approx. monthly velocity

    // Financial health evolution
    const runwayStart = start.financialHealth.runway || 0;
    const runwayEnd = end.financialHealth.runway || 0;
    const runwayDelta = runwayEnd - runwayStart;

    const freedomStart = start.financialHealth.freedomDate;
    const freedomEnd = end.financialHealth.freedomDate;
    let freedomChangeText = 'No projection';
    if (freedomStart === 'Achieved' && freedomEnd === 'Achieved') {
      freedomChangeText = 'Achieved → Achieved';
    } else if (freedomStart === 'Achieved' && freedomEnd !== 'Achieved') {
      freedomChangeText = 'Achieved → Not achieved';
    } else if (freedomStart !== 'Achieved' && freedomEnd === 'Achieved') {
      freedomChangeText = 'Not achieved → Achieved';
    } else if (freedomStart && freedomEnd) {
      const m = monthsBetween(freedomStart, freedomEnd);
      freedomChangeText = `${freedomStart} → ${freedomEnd} (${m === 0 ? 'no change' : `${m > 0 ? '+' : ''}${m} mo`})`;
    }

    const effStart = start.financialHealth.assetEfficiency || 0;
    const effEnd = end.financialHealth.assetEfficiency || 0;
    const effDelta = effEnd - effStart;

    // Balance sheet
    const cashStart = start.balanceSheet.totalCashBalance || 0;
    const cashEnd = end.balanceSheet.totalCashBalance || 0;
    const cashDelta = cashEnd - cashStart;

    const invStart = (start.balanceSheet.totalAssets || 0) - cashStart;
    const invEnd = (end.balanceSheet.totalAssets || 0) - cashEnd;
    const invDelta = invEnd - invStart;

    const debtStart = start.balanceSheet.totalLiabilities || 0;
    const debtEnd = end.balanceSheet.totalLiabilities || 0;
    const debtDelta = debtEnd - debtStart;

    // Cashflow
    const cf = (s: SnapshotData) => ({
      earned: s.cashflow.earnedIncome || 0,
      passive: s.cashflow.passiveIncome || 0,
      portfolio: s.cashflow.portfolioIncome || 0,
      totalIncome: s.cashflow.totalIncome || 0,
      expenses: s.cashflow.totalExpenses || 0,
      net: s.cashflow.netCashflow || 0,
    });
    const cfStart = cf(start);
    const cfEnd = cf(end);
    const cfDelta = {
      earned: cfEnd.earned - cfStart.earned,
      passive: cfEnd.passive - cfStart.passive,
      portfolio: cfEnd.portfolio - cfStart.portfolio,
      totalIncome: cfEnd.totalIncome - cfStart.totalIncome,
      expenses: cfEnd.expenses - cfStart.expenses,
      net: cfEnd.net - cfStart.net,
    };

    // Ratios
    const srStart = parseFloat(start.ratios.savingsRate || '0') || 0;
    const srEnd = parseFloat(end.ratios.savingsRate || '0') || 0;
    const srDelta = srEnd - srStart;

    const pcStart = parseFloat(start.ratios.passiveCoverageRatio || '0') || 0;
    const pcEnd = parseFloat(end.ratios.passiveCoverageRatio || '0') || 0;
    const pcDelta = pcEnd - pcStart;

    // Income quadrant shift
    const sumVals = (iq: SnapshotData['incomeQuadrant']) =>
      (iq.EMPLOYEE || 0) + (iq.SELF_EMPLOYED || 0) + (iq.BUSINESS_OWNER || 0) + (iq.INVESTOR || 0);
    const iqStart = start.incomeQuadrant;
    const iqEnd = end.incomeQuadrant;
    const totalStart = sumVals(iqStart) || 1;
    const totalEnd = sumVals(iqEnd) || 1;
    const cats: Array<keyof SnapshotData['incomeQuadrant']> = ['EMPLOYEE', 'SELF_EMPLOYED', 'BUSINESS_OWNER', 'INVESTOR'];
    const iqShift = cats.map((k) => {
      const sPct = (iqStart[k] / totalStart) * 100;
      const ePct = (iqEnd[k] / totalEnd) * 100;
      return { key: k, startPct: sPct, endPct: ePct, deltaPct: ePct - sPct };
    });

    return {
      periodDays,
      netWorth: { start: nwStart, end: nwEnd, delta: nwDelta, pct: nwPct, velocityPerMonth: nwVelocityPerMonth },
      health: { runway: { start: runwayStart, end: runwayEnd, delta: runwayDelta }, freedomChangeText, efficiency: { start: effStart, end: effEnd, delta: effDelta } },
      balance: { cash: { start: cashStart, end: cashEnd, delta: cashDelta }, invested: { start: invStart, end: invEnd, delta: invDelta }, liabilities: { start: debtStart, end: debtEnd, delta: debtDelta } },
      cashflow: { start: cfStart, end: cfEnd, delta: cfDelta },
      ratios: { savingsRate: { start: srStart, end: srEnd, delta: srDelta }, passiveCoverage: { start: pcStart, end: pcEnd, delta: pcDelta } },
      iqShift,
      startCurrency: start.currency,
      endCurrency: end.currency,
    };
  }, [compareResult, compareStart, compareEnd]);

  const timelineController = (
    <div className="flex items-center gap-3 bg-zinc-900/80 border border-white/10 rounded-full px-4 py-1.5 backdrop-blur-sm">
      <span className="text-zinc-400 text-xs uppercase tracking-wider font-medium">Time Machine</span>
      <div className="h-4 w-px bg-white/10" />
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        max={new Date().toISOString().split('T')[0]}
        className="bg-transparent border-none text-white text-sm focus:ring-0 p-0 cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
      />
      {selectedDate && (
        <button
          onClick={() => { setSelectedDate(''); fetchSnapshot(); }}
          className="ml-2 text-xs text-[#FFD700] hover:text-[#FFD700]/80 transition-colors"
        >
          Reset
        </button>
      )}
    </div>
  );

  const headerRight = (
    <div className="flex items-center gap-3">
      {timelineController}
      <button
        onClick={() => setShowCompare((s) => !s)}
        aria-pressed={showCompare}
        className={`px-3 py-1.5 rounded-full border text-sm transition-all ${
          showCompare
            ? 'bg-zinc-900/80 border-[#9d6dd4]/50 text-white shadow-[0_0_0_2px_rgba(157,109,212,0.25),0_0_18px_rgba(157,109,212,0.55)] hover:shadow-[0_0_0_2px_rgba(157,109,212,0.35),0_0_24px_rgba(157,109,212,0.75)]'
            : 'bg-zinc-900/60 border-white/10 text-white hover:bg-zinc-900'
        }`}
        title="Compare two dates"
      >
        Compare
      </button>
    </div>
  );

  if (loading && !snapshotData) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-white">
        <div className="animate-pulse text-[#FFD700]">Loading Financial Data...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-black text-white overflow-hidden font-sans selection:bg-[#FFD700]/30">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Background Ambient Glow */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#800080]/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#FFD700]/10 rounded-full blur-[120px] pointer-events-none" />

        <Header title="Analysis" hideActions rightContent={headerRight} />

        {showCompare && (
          <div className="px-6 md:px-8">
            <div className="max-w-7xl mx-auto mt-4 mb-2 rounded-2xl bg-zinc-900/50 border border-white/5 p-4 flex flex-col md:flex-row items-center gap-3">
              <span className="text-zinc-400 text-xs uppercase tracking-wider">Compare Period</span>
              <div className="flex items-center gap-2">
                <div className="relative flex items-center gap-1">
                  <input
                    ref={startRef}
                    type="date"
                    value={compareStart}
                    onChange={(e) => { setCompareStart(e.target.value); setCompareResult(null); }}
                    max={compareEnd || new Date().toISOString().split('T')[0]}
                    className="bg-transparent border border-white/10 rounded-lg px-3 py-1.5 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => openNativePicker(startRef.current)}
                    className="p-1.5 rounded-md border border-white/10 text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
                    aria-label="Open start date calendar"
                    title="Open calendar"
                  >
                    {/* calendar icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <path d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                  </button>
                </div>

                <span className="text-zinc-500">→</span>

                <div className="relative flex items-center gap-1">
                  <input
                    ref={endRef}
                    type="date"
                    value={compareEnd}
                    onChange={(e) => { setCompareEnd(e.target.value); setCompareResult(null); }}
                    min={compareStart || undefined}
                    max={new Date().toISOString().split('T')[0]}
                    className="bg-transparent border border-white/10 rounded-lg px-3 py-1.5 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => openNativePicker(endRef.current)}
                    className="p-1.5 rounded-md border border-white/10 text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
                    aria-label="Open end date calendar"
                    title="Open calendar"
                  >
                    {/* calendar icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <path d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                {compareStart && compareEnd && safeDate(compareEnd) >= safeDate(compareStart) && (
                  <button
                    onClick={fetchCompareReport}
                    disabled={compareLoading}
                    className="px-3 py-1.5 rounded-lg bg-[#FFD700] text-black text-sm font-semibold hover:bg-[#e6c300] disabled:opacity-50"
                  >
                    {compareLoading ? 'Generating…' : 'Generate Report'}
                  </button>
                )}
                {!!compareResult && (
                  <button
                    onClick={() => setCompareResult(null)}
                    className="px-3 py-1.5 rounded-lg border border-white/10 text-sm text-zinc-300 hover:bg-zinc-800"
                  >
                    Clear report
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {compareMetrics && (
            <div className="max-w-7xl mx-auto mb-6 rounded-2xl bg-zinc-900/60 border border-white/5 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Comparison Report</h2>
                <div className="text-xs text-zinc-400">
                  {compareStart} → {compareEnd} • {compareMetrics.periodDays} days
                </div>
              </div>

              {/* Financial Health Evolution */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-zinc-900/70 border border-white/5">
                  <div className="text-xs text-zinc-400 uppercase mb-1">Wealth Runway</div>
                  <div className="text-sm">
                    {compareMetrics.health.runway.start} → {compareMetrics.health.runway.end} months{' '}
                    <span className={`${compareMetrics.health.runway.delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ({compareMetrics.health.runway.delta >= 0 ? '+' : ''}{compareMetrics.health.runway.delta})
                    </span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-zinc-900/70 border border-white/5">
                  <div className="text-xs text-zinc-400 uppercase mb-1">Freedom Date</div>
                  <div className="text-sm">{compareMetrics.health.freedomChangeText}</div>
                </div>
                <div className="p-4 rounded-xl bg-zinc-900/70 border border-white/5">
                  <div className="text-xs text-zinc-400 uppercase mb-1">Asset Efficiency (ROA)</div>
                  <div className="text-sm">
                    {compareMetrics.health.efficiency.start}% → {compareMetrics.health.efficiency.end}%{' '}
                    <span className={`${compareMetrics.health.efficiency.delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ({compareMetrics.health.efficiency.delta >= 0 ? '+' : ''}{compareMetrics.health.efficiency.delta} pts)
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Worth & Velocity */}
              <div className="p-4 rounded-xl bg-zinc-900/70 border border-white/5 mb-6">
                <div className="text-xs text-zinc-400 uppercase mb-2">Net Worth & Velocity</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-zinc-400">Start</div>
                    <div className="font-semibold">
                      {formatHistorical(compareMetrics.netWorth.start, compareMetrics.startCurrency)}
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-400">End</div>
                    <div className="font-semibold">
                      {formatHistorical(compareMetrics.netWorth.end, compareMetrics.endCurrency)}
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-400">Change</div>
                    <div className={`${compareMetrics.netWorth.delta >= 0 ? 'text-green-400' : 'text-red-400'} font-semibold`}>
                      {compareMetrics.netWorth.delta >= 0 ? '+' : ''}
                      {formatHistorical(Math.abs(compareMetrics.netWorth.delta), compareMetrics.endCurrency)}
                      {typeof compareMetrics.netWorth.pct === 'number' && (
                        <span className="text-zinc-400"> ({compareMetrics.netWorth.pct.toFixed(2)}%)</span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">
                      Velocity ≈ {formatHistorical(compareMetrics.netWorth.velocityPerMonth, compareMetrics.endCurrency)}/mo
                    </div>
                  </div>
                </div>
              </div>

              {/* Balance Sheet Comparison */}
              <div className="p-4 rounded-xl bg-zinc-900/70 border border-white/5 mb-6">
                <div className="text-xs text-zinc-400 uppercase mb-2">Balance Sheet</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {[
                    { label: 'Cash', k: 'cash' as const },
                    { label: 'Invested Assets', k: 'invested' as const },
                    { label: 'Total Liabilities', k: 'liabilities' as const },
                  ].map(({ label, k }) => (
                    <div key={k}>
                      <div className="text-zinc-400">{label}</div>
                      <div className="flex items-center gap-2">
                        <span>{formatHistorical(compareMetrics.balance[k].start, compareMetrics.startCurrency)}</span>
                        <span className="text-zinc-500">→</span>
                        <span>{formatHistorical(compareMetrics.balance[k].end, compareMetrics.endCurrency)}</span>
                      </div>
                      <div className={`${compareMetrics.balance[k].delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {compareMetrics.balance[k].delta >= 0 ? '+' : ''}
                        {formatHistorical(Math.abs(compareMetrics.balance[k].delta), compareMetrics.endCurrency)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Period Cashflow Aggregates */}
              <div className="p-4 rounded-xl bg-zinc-900/70 border border-white/5 mb-6">
                <div className="text-xs text-zinc-400 uppercase mb-2">Period Cashflow Aggregates</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {[
                    { label: 'Earned Income', k: 'earned' as const },
                    { label: 'Passive Income', k: 'passive' as const },
                    { label: 'Portfolio Income', k: 'portfolio' as const },
                    { label: 'Total Expenses', k: 'expenses' as const },
                    { label: 'Total Income', k: 'totalIncome' as const },
                    { label: 'Net Cashflow', k: 'net' as const },
                  ].map(({ label, k }) => (
                    <div key={k}>
                      <div className="text-zinc-400">{label}</div>
                      <div className="flex items-center gap-2">
                        <span>{formatHistorical(compareMetrics.cashflow.start[k], compareMetrics.startCurrency)}</span>
                        <span className="text-zinc-500">→</span>
                        <span>{formatHistorical(compareMetrics.cashflow.end[k], compareMetrics.endCurrency)}</span>
                      </div>
                      <div className={`${compareMetrics.cashflow.delta[k] >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {compareMetrics.cashflow.delta[k] >= 0 ? '+' : ''}
                        {formatHistorical(Math.abs(compareMetrics.cashflow.delta[k]), compareMetrics.endCurrency)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ratio Performance */}
              <div className="p-4 rounded-xl bg-zinc-900/70 border border-white/5 mb-6">
                <div className="text-xs text-zinc-400 uppercase mb-2">Ratio Performance</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {[
                    { label: 'Savings Rate', obj: compareMetrics.ratios.savingsRate },
                    { label: 'Passive Coverage Ratio', obj: compareMetrics.ratios.passiveCoverage },
                  ].map(({ label, obj }) => (
                    <div key={label}>
                      <div className="text-zinc-400">{label}</div>
                      <div>
                        {obj.start}% → {obj.end}%{' '}
                        <span className={`${obj.delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ({obj.delta >= 0 ? '+' : ''}{obj.delta} pts)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Income Quadrant Shift */}
              <div className="p-4 rounded-xl bg-zinc-900/70 border border-white/5">
                <div className="text-xs text-zinc-400 uppercase mb-2">Income Quadrant Shift</div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  {compareMetrics.iqShift.map((row) => (
                    <div key={row.key}>
                      <div className="text-zinc-400">
                        {row.key === 'EMPLOYEE' ? 'Employee' :
                         row.key === 'SELF_EMPLOYED' ? 'Self-Employed' :
                         row.key === 'BUSINESS_OWNER' ? 'Business Owner' : 'Investor'}
                      </div>
                      <div>
                        {row.startPct.toFixed(1)}% → {row.endPct.toFixed(1)}%{' '}
                        <span className={`${row.deltaPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ({row.deltaPct >= 0 ? '+' : ''}{row.deltaPct.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {snapshotData && (
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-10">
              
              {/* Hero: Net Worth */}
              <StatCard
                title="Net Worth"
                value={formatHistorical(snapshotData.balanceSheet.netWorth, snapshotData.currency)}
                trend={snapshotData.financialHealth.trends.netWorth}
                className="col-span-1 md:col-span-2 lg:col-span-2 min-h-[180px]"
                accentColor="gold"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                }
              >
                <div className="mt-4 h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-linear-to-r from-[#FFD700] to-[#800080]" 
                    style={{ width: `${Math.min(Math.max((snapshotData.balanceSheet.netWorth / (snapshotData.balanceSheet.totalAssets || 1)) * 100, 5), 100)}%` }} 
                  />
                </div>
                <div className="mt-2 text-xs text-zinc-500 flex justify-between">
                  <span>Assets: {formatHistorical(snapshotData.balanceSheet.totalAssets, snapshotData.currency)}</span>
                  <span>Liabilities: {formatHistorical(snapshotData.balanceSheet.totalLiabilities, snapshotData.currency)}</span>
                </div>
              </StatCard>

              {/* Hero: Freedom Date */}
              <StatCard
                title="Financial Freedom"
                value={
                  snapshotData.financialHealth.freedomDate === 'Achieved' ? 
                  <span className="text-[#FFD700]">ACHIEVED</span> : 
                  (snapshotData.financialHealth.freedomDate || 'Not Projected')
                }
                subValue={
                  snapshotData.financialHealth.freedomDate !== 'Achieved' && snapshotData.financialHealth.freedomDate ? 
                  "Estimated date based on current trajectory" : "Keep building your assets"
                }
                className="col-span-1 md:col-span-2 lg:col-span-2 min-h-[180px]"
                accentColor="purple"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                }
              >
                 {/* Progress Bar / Gauge for "On Track" */}
                 <div className="mt-4 flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${snapshotData.financialHealth.freedomDate ? 'bg-green-500' : 'bg-zinc-700'}`}
                        style={{ width: `${Math.min(parseFloat(snapshotData.ratios.passiveCoverageRatio), 100)}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold ${snapshotData.financialHealth.freedomDate ? 'text-green-400' : 'text-zinc-600'}`}>
                      {snapshotData.financialHealth.freedomDate ? 'ON TRACK' : 'NEEDS DATA'}
                    </span>
                 </div>
              </StatCard>

              {/* Cashflow Section */}
              <div className="col-span-1 md:col-span-2 lg:col-span-2 row-span-2 grid grid-cols-2 gap-4">
                <StatCard
                  title="Wealth Velocity"
                  value={
                    <span className={snapshotData.richFlowMetrics.wealthVelocity >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {snapshotData.richFlowMetrics.wealthVelocity >= 0 ? '+' : ''}
                      {formatHistorical(snapshotData.richFlowMetrics.wealthVelocity, snapshotData.currency)}
                    </span>
                  }
                  trend={snapshotData.richFlowMetrics.wealthVelocityPct}
                  className="col-span-2 md:col-span-1"
                >
                  <div className="mt-1 text-xs text-zinc-500">Monthly Net Worth Change</div>
                </StatCard>
                
                <StatCard
                  title="Solvency Ratio"
                  value={`${snapshotData.richFlowMetrics.solvencyRatio}%`}
                  className="col-span-2 md:col-span-1"
                >
                  <div className="mt-2 h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        snapshotData.richFlowMetrics.solvencyRatio < 30 ? 'bg-green-500' : 
                        snapshotData.richFlowMetrics.solvencyRatio < 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(snapshotData.richFlowMetrics.solvencyRatio, 100)}%` }} 
                    />
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {snapshotData.richFlowMetrics.solvencyRatio < 30 ? 'Safe (<30%)' : 
                     snapshotData.richFlowMetrics.solvencyRatio < 60 ? 'Caution (30-60%)' : 'High Risk (>60%)'}
                  </div>
                </StatCard>

                <StatCard
                  title="Net Cashflow"
                  value={formatHistorical(snapshotData.cashflow.netCashflow, snapshotData.currency)}
                  trend={snapshotData.financialHealth.trends.cashflow}
                  className="col-span-2 bg-zinc-900/80"
                  accentColor={snapshotData.cashflow.netCashflow >= 0 ? 'gold' : 'default'}
                >
                   <div className="mt-2 text-xs text-zinc-500">
                      Savings Rate: <span className="text-white font-bold">{snapshotData.ratios.savingsRate}%</span>
                   </div>
                </StatCard>
              </div>

              {/* Income Quadrant Chart */}
              <div className="col-span-1 md:col-span-2 lg:col-span-2 row-span-2 bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 flex flex-col">
                <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-4">Income Quadrant</h3>
                <div className="flex-1 min-h-[250px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={quadrantData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {quadrantData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.5)" />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value: number) => formatHistorical(value, snapshotData.currency)}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <div className="text-xs text-zinc-500">Total</div>
                      <div className="text-sm font-bold text-white">
                        {formatHistorical(snapshotData.cashflow.totalIncome, snapshotData.currency)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Health Metrics */}
              <StatCard
                title="Runway"
                value={`${snapshotData.financialHealth.runway >= 999 ? '∞' : snapshotData.financialHealth.runway} Months`}
                className="col-span-1"
              />
              <StatCard
                title="Asset Efficiency"
                value={`${snapshotData.financialHealth.assetEfficiency}%`}
                className="col-span-1"
              />
              <StatCard
                title="Passive Coverage"
                value={`${snapshotData.ratios.passiveCoverageRatio}%`}
                className="col-span-1"
              />
              <StatCard
                title={snapshotData.richFlowMetrics.freedomGap > 0 ? "Freedom Gap" : "Freedom Surplus"}
                value={
                  <span className={snapshotData.richFlowMetrics.freedomGap > 0 ? "text-orange-400" : "text-green-400"}>
                    {snapshotData.richFlowMetrics.freedomGap > 0 ? '-' : '+'}
                    {formatHistorical(Math.abs(snapshotData.richFlowMetrics.freedomGap), snapshotData.currency)}
                  </span>
                }
                subValue={snapshotData.richFlowMetrics.freedomGap > 0 ? "To Go" : "Surplus"}
                className="col-span-1"
                accentColor={snapshotData.richFlowMetrics.freedomGap > 0 ? 'default' : 'gold'}
              />

            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Analysis;

