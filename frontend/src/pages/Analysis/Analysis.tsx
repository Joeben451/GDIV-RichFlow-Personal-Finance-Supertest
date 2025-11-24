import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Header from '../../components/Header/Header';
import { useAuth } from '../../context/AuthContext';
import { analysisAPI } from '../../utils/api';
import { formatCurrency as formatCurrencyValue } from '../../utils/currency.utils';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  AreaChart, Area, LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, ComposedChart, ReferenceDot
} from 'recharts';

type SnapshotData = {
  date: string;
  balanceSheet: {
    totalCashBalance: number;
    totalCash: number;
    totalInvestedAssets: number;
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
    EMPLOYEE: { amount: number; pct: number };
    SELF_EMPLOYED: { amount: number; pct: number };
    BUSINESS_OWNER: { amount: number; pct: number };
    INVESTOR: { amount: number; pct: number };
    total: number;
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

type TrajectoryPoint = {
  date: string;
  netWorth: number;
  netWorthDelta: number; // change vs previous point
  passiveIncome: number;
  portfolioIncome: number;
  totalExpenses: number;
  freedomGap: number;
  wealthVelocity: number; // percent form
  assetEfficiency: number;
  netCashflow: number;
  totalIncome: number;
  incomeQuadrant: {
    EMPLOYEE: number;
    SELF_EMPLOYED: number;
    BUSINESS_OWNER: number;
    INVESTOR: number;
  };
  currency: string; // symbol for change markers
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

  // Trajectory state for velocity and freedom gap visualization
  const [trajectoryStart, setTrajectoryStart] = useState('');
  const [trajectoryEnd, setTrajectoryEnd] = useState('');
  const [trajectoryInterval, setTrajectoryInterval] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [trajectoryLoading, setTrajectoryLoading] = useState(false);
  const [trajectoryData, setTrajectoryData] = useState<TrajectoryPoint[]>([]);

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
      { name: 'Employee', value: incomeQuadrant.EMPLOYEE.amount, color: QUADRANT_COLORS.EMPLOYEE },
      { name: 'Self-Employed', value: incomeQuadrant.SELF_EMPLOYED.amount, color: QUADRANT_COLORS.SELF_EMPLOYED },
      { name: 'Business Owner', value: incomeQuadrant.BUSINESS_OWNER.amount, color: QUADRANT_COLORS.BUSINESS_OWNER },
      { name: 'Investor', value: incomeQuadrant.INVESTOR.amount, color: QUADRANT_COLORS.INVESTOR },
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

  const fetchTrajectoryData = async () => {
    if (!trajectoryStart || !trajectoryEnd) return;
    setTrajectoryLoading(true);
    try {
      const data = await analysisAPI.getFinancialTrajectory(
        trajectoryStart,
        trajectoryEnd,
        trajectoryInterval
      );
      setTrajectoryData(data);
    } catch (e) {
      console.error('Failed to fetch trajectory data:', e);
    } finally {
      setTrajectoryLoading(false);
    }
  };

  // Default load last 12 months trajectory on mount
  useEffect(() => {
    const today = new Date();
    const endStr = today.toISOString().split('T')[0];
    const start = new Date(today); start.setFullYear(today.getFullYear() - 1);
    const startStr = start.toISOString().split('T')[0];
    setTrajectoryStart(startStr);
    setTrajectoryEnd(endStr);
  }, []);
  useEffect(() => {
    if (trajectoryStart && trajectoryEnd) fetchTrajectoryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trajectoryStart, trajectoryEnd, trajectoryInterval]);

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
      (iq.EMPLOYEE?.amount || 0) + (iq.SELF_EMPLOYED?.amount || 0) + (iq.BUSINESS_OWNER?.amount || 0) + (iq.INVESTOR?.amount || 0);
    const iqStart = start.incomeQuadrant;
    const iqEnd = end.incomeQuadrant;
    const totalStart = sumVals(iqStart) || 1;
    const totalEnd = sumVals(iqEnd) || 1;
    const cats: Array<keyof Omit<SnapshotData['incomeQuadrant'], 'total'>> = ['EMPLOYEE', 'SELF_EMPLOYED', 'BUSINESS_OWNER', 'INVESTOR'];
    const iqShift = cats.map((k) => {
      const sAmt = iqStart[k].amount || 0;
      const eAmt = iqEnd[k].amount || 0;
      const sPct = (sAmt / totalStart) * 100;
      const ePct = (eAmt / totalEnd) * 100;
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

  // Trajectory metrics - compute key insights for Freedom Gap visualization
  const processedTrajectory = useMemo(() => {
    if (!trajectoryData || trajectoryData.length === 0) return [];
    // Add percent quadrant evolution & currency change detection
    return trajectoryData.map((p, idx) => {
      const totalIQ = p.incomeQuadrant.EMPLOYEE + p.incomeQuadrant.SELF_EMPLOYED + p.incomeQuadrant.BUSINESS_OWNER + p.incomeQuadrant.INVESTOR || 1;
      const prev = trajectoryData[idx - 1];
      const currencyChanged = prev ? prev.currency !== p.currency : false;
      return {
        ...p,
        quadrantPct: {
          EMPLOYEE: (p.incomeQuadrant.EMPLOYEE / totalIQ) * 100,
          SELF_EMPLOYED: (p.incomeQuadrant.SELF_EMPLOYED / totalIQ) * 100,
          BUSINESS_OWNER: (p.incomeQuadrant.BUSINESS_OWNER / totalIQ) * 100,
          INVESTOR: (p.incomeQuadrant.INVESTOR / totalIQ) * 100,
        },
        currencyChanged,
        gapArea: p.totalExpenses > p.passiveIncome ? (p.totalExpenses - p.passiveIncome) : 0,
        surplusArea: p.passiveIncome > p.totalExpenses ? (p.passiveIncome - p.totalExpenses) : 0
      };
    });
  }, [trajectoryData]);

  // Trajectory high-level metrics
  const trajectoryMetrics = useMemo(() => {
    if (!trajectoryData || trajectoryData.length === 0) return null;
    const first = trajectoryData[0];
    const last = trajectoryData[trajectoryData.length - 1];
    const freedomGapChange = last.freedomGap - first.freedomGap;
    const freedomGapTrend = first.freedomGap !== 0 ? (freedomGapChange / Math.abs(first.freedomGap)) * 100 : 0;
    const velocityChange = last.wealthVelocity - first.wealthVelocity;
    const netWorthChange = last.netWorth - first.netWorth;
    const netWorthGrowthRate = first.netWorth !== 0 ? (netWorthChange / Math.abs(first.netWorth)) * 100 : 0;
    const passiveIncomeChange = last.passiveIncome - first.passiveIncome;
    const passiveIncomeGrowthRate = first.passiveIncome !== 0 ? (passiveIncomeChange / Math.abs(first.passiveIncome)) * 100 : 0;
    const freedomCrossoverPoint = trajectoryData.find((p, idx) => idx > 0 && p.freedomGap <= 0 && trajectoryData[idx - 1].freedomGap > 0);
    return {
      startDate: first.date,
      endDate: last.date,
      dataPoints: trajectoryData.length,
      freedomGap: { start: first.freedomGap, end: last.freedomGap, change: freedomGapChange, trendPercent: freedomGapTrend, crossoverDate: freedomCrossoverPoint?.date || null },
      wealthVelocity: { start: first.wealthVelocity, end: last.wealthVelocity, change: velocityChange },
      netWorth: { start: first.netWorth, end: last.netWorth, change: netWorthChange, growthRate: netWorthGrowthRate },
      passiveIncome: { start: first.passiveIncome, end: last.passiveIncome, change: passiveIncomeChange, growthRate: passiveIncomeGrowthRate }
    };
  }, [trajectoryData]);

  // Timeline controller (date picker)
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
        <button onClick={() => { setSelectedDate(''); fetchSnapshot(); }} className="ml-2 text-xs text-[#FFD700] hover:text-[#FFD700]/80 transition-colors">Reset</button>
      )}
    </div>
  );

  // Header right content (timeline + compare toggle)
  const headerRight = (
    <div className="flex items-center gap-3">
      {timelineController}
      <button
        onClick={() => setShowCompare(s => !s)}
        aria-pressed={showCompare}
        className={`px-3 py-1.5 rounded-full border text-sm transition-all ${showCompare ? 'bg-zinc-900/80 border-[#9d6dd4]/50 text-white shadow-[0_0_0_2px_rgba(157,109,212,0.25),0_0_18px_rgba(157,109,212,0.55)] hover:shadow-[0_0_0_2px_rgba(157,109,212,0.35),0_0_24px_rgba(157,109,212,0.75)]' : 'bg-zinc-900/60 border-white/10 text-white hover:bg-zinc-900'}`}
        title="Compare two dates"
      >Compare</button>
    </div>
  );

  const handleJumpToSnapshot = (date: string) => {
    setSelectedDate(date);
  };

  const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    return (
      <div
        onClick={() => handleJumpToSnapshot(label)}
        className="rounded-md border border-zinc-700 bg-zinc-900/95 backdrop-blur-sm p-3 text-xs shadow-xl min-w-[180px] cursor-pointer hover:border-[#FFD700] transition-colors"
        style={{ zIndex: 1000, pointerEvents: 'auto' }}
        title="Click to view snapshot"
      >
        <div className="font-semibold text-white mb-1 flex items-center justify-between">
          <span>{new Date(label).toLocaleDateString()}</span>
          <span className="text-[#FFD700] text-[10px]">📸 SNAPSHOT</span>
        </div>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex justify-between gap-2">
            <span className="text-zinc-400">{p.name}</span>
            <span className="text-white">{typeof p.value === 'number' ? (p.dataKey.includes('Pct') || p.name?.includes('%') || p.dataKey === 'assetEfficiency' || p.dataKey === 'wealthVelocity' ? `${p.value.toFixed(2)}%` : formatCurrencyValue(p.value, user?.preferredCurrency)) : p.value}</span>
          </div>
        ))}
        <div className="mt-2 pt-2 border-t border-zinc-700 text-center text-[10px] text-zinc-500">
          Click to jump to this date
        </div>
      </div>
    );
  };

  if (loading && !snapshotData) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-white">
        <div className="animate-pulse text-[#FFD700]">Loading Financial Data...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-black text-white overflow-hidden  selection:bg-[#FFD700]/30">
      <Header title="Analysis" hideActions rightContent={headerRight} />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Background Ambient Glow */}
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#800080]/20 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#FFD700]/10 rounded-full blur-[120px] pointer-events-none" />
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                  }
                >
                  <div className="mt-4 h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-[#FFD700] to-[#800080]"
                      style={{ width: `${Math.min(Math.max((snapshotData.balanceSheet.netWorth / (snapshotData.balanceSheet.totalAssets || 1)) * 100, 5), 100)}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-zinc-500 flex justify-between">
                    <div className="flex gap-4 w-full justify-between">
                      <div className="text-xs">
                        <div className="text-zinc-400">Cash</div>
                        <div className="font-semibold text-[#FFD700]">{formatHistorical(snapshotData.balanceSheet.totalCash, snapshotData.currency)}</div>
                      </div>
                      <div className="text-xs">
                        <div className="text-zinc-400">Assets</div>
                        <div className="font-semibold">{formatHistorical(snapshotData.balanceSheet.totalInvestedAssets, snapshotData.currency)}</div>
                      </div>
                      <div className="text-xs">
                        <div className="text-zinc-400">Liabilities</div>
                        <div className="font-semibold">{formatHistorical(snapshotData.balanceSheet.totalLiabilities, snapshotData.currency)}</div>
                      </div>
                    </div>
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
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
                        className={`h-full ${snapshotData.richFlowMetrics.solvencyRatio < 30 ? 'bg-green-500' :
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
                    <div className="mt-2 text-sm">
                      <div className="flex justify-between items-center">
                        <div className="text-zinc-400">Total Income</div>
                        <div className="text-green-400 font-semibold">{formatHistorical(snapshotData.cashflow.totalIncome, snapshotData.currency)}</div>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <div className="text-zinc-400">Total Expenses</div>
                        <div className="text-red-400 font-semibold">{formatHistorical(snapshotData.cashflow.totalExpenses, snapshotData.currency)}</div>
                      </div>
                      <div className="my-2 h-px bg-white/5" />
                      <div className="text-xs text-zinc-500">
                        Savings Rate: <span className="text-white font-bold">{snapshotData.ratios.savingsRate}%</span>
                      </div>
                    </div>
                  </StatCard>
                </div>

                {/* Income Quadrant Chart */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 row-span-2 bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 flex flex-col">
                  <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-4">Income Quadrant</h3>

                  <div className="flex flex-col md:flex-row items-center gap-6 flex-1 min-h-0">
                    {/* Chart Container */}
                    <div className="flex-1 w-full h-[250px] relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={quadrantData.length > 0 ? quadrantData : [{ name: 'No Data', value: 1, color: '#27272a' }]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {quadrantData.length > 0 ? (
                              quadrantData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.5)" />
                              ))
                            ) : (
                              <Cell fill="#27272a" stroke="none" />
                            )}
                          </Pie>
                          {quadrantData.length > 0 && (
                            <RechartsTooltip
                              contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                              itemStyle={{ color: '#fff' }}
                              formatter={(value: number) => formatHistorical(value, snapshotData.currency)}
                            />
                          )}
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

                    {/* Detailed Breakdown */}
                    <div className="w-full md:w-auto md:min-w-60">
                      <div className="grid grid-cols-2 md:grid-cols-1 gap-3 text-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span style={{ width: 10, height: 10, background: QUADRANT_COLORS.EMPLOYEE, borderRadius: 999 }} />
                            <span className="text-zinc-400">Employee</span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{formatHistorical(snapshotData.incomeQuadrant.EMPLOYEE.amount, snapshotData.currency)}</div>
                            <div className="text-xs text-zinc-500">{snapshotData.incomeQuadrant.EMPLOYEE.pct.toFixed(1)}%</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span style={{ width: 10, height: 10, background: QUADRANT_COLORS.SELF_EMPLOYED, borderRadius: 999 }} />
                            <span className="text-zinc-400">Self-Employed</span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{formatHistorical(snapshotData.incomeQuadrant.SELF_EMPLOYED.amount, snapshotData.currency)}</div>
                            <div className="text-xs text-zinc-500">{snapshotData.incomeQuadrant.SELF_EMPLOYED.pct.toFixed(1)}%</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span style={{ width: 10, height: 10, background: QUADRANT_COLORS.BUSINESS_OWNER, borderRadius: 999 }} />
                            <span className="text-zinc-400">Business Owner</span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{formatHistorical(snapshotData.incomeQuadrant.BUSINESS_OWNER.amount, snapshotData.currency)}</div>
                            <div className="text-xs text-zinc-500">{snapshotData.incomeQuadrant.BUSINESS_OWNER.pct.toFixed(1)}%</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span style={{ width: 10, height: 10, background: QUADRANT_COLORS.INVESTOR, borderRadius: 999 }} />
                            <span className="text-zinc-400">Investor</span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{formatHistorical(snapshotData.incomeQuadrant.INVESTOR.amount, snapshotData.currency)}</div>
                            <div className="text-xs text-zinc-500">{snapshotData.incomeQuadrant.INVESTOR.pct.toFixed(1)}%</div>
                          </div>
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
                  title={snapshotData.richFlowMetrics.freedomGap > 0 ? "Freedom Gap" : "Financial Freedom"}
                  value={
                    snapshotData.richFlowMetrics.freedomGap <= 0 ? (
                      <span className="text-[#FFD700] font-bold">ACHIEVED 🎉</span>
                    ) : (
                      <span className="text-orange-400">
                        -{formatHistorical(Math.abs(snapshotData.richFlowMetrics.freedomGap), snapshotData.currency)}
                      </span>
                    )
                  }
                  subValue={snapshotData.richFlowMetrics.freedomGap > 0 ? "To Go" : "Passive Income Covers Expenses"}
                  className="col-span-1"
                  accentColor={snapshotData.richFlowMetrics.freedomGap > 0 ? 'default' : 'gold'}
                />

              </div>
            )}

            {trajectoryMetrics && snapshotData && (
              <div className="max-w-7xl mx-auto mb-6 rounded-2xl bg-linear-to-br from-zinc-900/80 to-zinc-900/60 border border-[#FFD700]/20 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-[#FFD700] flex items-center gap-2">
                      <span>Financial Velocity & Freedom Trajectory</span>
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Tracking your path to financial freedom: {trajectoryMetrics.startDate} → {trajectoryMetrics.endDate} ({trajectoryMetrics.dataPoints} data points)
                    </p>
                  </div>
                </div>

                {/* Key Trajectory Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <StatCard
                    title="Freedom Gap"
                    value={
                      <span className={trajectoryMetrics.freedomGap.end <= 0 ? 'text-green-400' : 'text-orange-400'}>
                        {trajectoryMetrics.freedomGap.end <= 0 ? 'Achieved! 🎉' : formatCurrencyValue(trajectoryMetrics.freedomGap.end, user?.preferredCurrency)}
                      </span>
                    }
                    subValue={
                      trajectoryMetrics.freedomGap.crossoverDate
                        ? `Freedom achieved on ${trajectoryMetrics.freedomGap.crossoverDate}`
                        : `${trajectoryMetrics.freedomGap.trendPercent >= 0 ? '📈' : '📉'} ${Math.abs(trajectoryMetrics.freedomGap.trendPercent).toFixed(1)}% ${trajectoryMetrics.freedomGap.trendPercent >= 0 ? 'increase' : 'decrease'}`
                    }
                    accentColor="gold"
                  />

                  <StatCard
                    title="Wealth Velocity"
                    value={`${trajectoryMetrics.wealthVelocity.end.toFixed(2)}%`}
                    subValue={`${trajectoryMetrics.wealthVelocity.change >= 0 ? '+' : ''}${trajectoryMetrics.wealthVelocity.change.toFixed(2)}% change`}
                    trend={trajectoryMetrics.wealthVelocity.change >= 0 ? 1 : -1}
                  />

                  <StatCard
                    title="Net Worth Growth"
                    value={formatCurrencyValue(trajectoryMetrics.netWorth.change, user?.preferredCurrency)}
                    subValue={`${trajectoryMetrics.netWorth.growthRate.toFixed(1)}% growth`}
                    trend={trajectoryMetrics.netWorth.change >= 0 ? 1 : -1}
                  />

                  <StatCard
                    title="Passive Income Growth"
                    value={formatCurrencyValue(trajectoryMetrics.passiveIncome.change, user?.preferredCurrency)}
                    subValue={`${trajectoryMetrics.passiveIncome.growthRate.toFixed(1)}% increase`}
                    trend={trajectoryMetrics.passiveIncome.change >= 0 ? 1 : -1}
                    accentColor="purple"
                  />
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* 1. The Rat Race Escape: Expenses vs Passive Income */}
                  <div className="p-6 rounded-xl bg-zinc-900/50 border border-white/5">
                    <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-400"></span>
                      The Rat Race Escape
                    </h3>
                    <div className="h-[300px] min-h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={processedTrajectory}>
                          <defs>
                            <linearGradient id="colorPassive" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                          <XAxis
                            dataKey="date"
                            stroke="#71717a"
                            tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis
                            stroke="#71717a"
                            tickFormatter={(val) => `$${val / 1000}k`}
                            tick={{ fontSize: 12 }}
                          />
                          <RechartsTooltip content={<ChartTooltip />} />
                          <Legend />
                          <Line type="monotone" dataKey="totalExpenses" name="Expenses" stroke="#f87171" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="passiveIncome" name="Passive Income" stroke="#4ade80" strokeWidth={2} dot={false} />
                          {/* Freedom Gap shaded area */}
                          <Area type="monotone" dataKey="gapArea" name="Freedom Gap" stroke="none" fill="url(#colorExpenses)" />
                          {/* Crossover Point */}
                          {processedTrajectory.map((p, idx) => {
                            const prev = processedTrajectory[idx - 1];
                            if (idx > 0 && p.passiveIncome >= p.totalExpenses && prev.passiveIncome < prev.totalExpenses) {
                              return (
                                <ReferenceDot key={p.date} x={p.date} y={p.passiveIncome} r={6} fill="#4ade80" stroke="#18181b" />
                              );
                            }
                            return null;
                          })}
                          {/* Currency change markers */}
                          {processedTrajectory.filter(p => p.currencyChanged).map(p => (
                            <ReferenceLine key={`cur-${p.date}`} x={p.date} stroke="#FFD700" strokeDasharray="4 2" label={{ value: p.currency, position: 'top', fill: '#FFD700', fontSize: 10 }} />
                          ))}
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* 2. Net Worth & Velocity */}
                  <div className="p-6 rounded-xl bg-zinc-900/50 border border-white/5">
                    <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#FFD700]"></span>
                      Net Worth & Velocity
                    </h3>
                    <div className="h-[300px] min-h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={processedTrajectory}>
                          <defs>
                            <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#FFD700" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#FFD700" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                          <XAxis
                            dataKey="date"
                            stroke="#71717a"
                            tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis
                            yAxisId="left"
                            stroke="#FFD700"
                            tickFormatter={(val) => `$${val / 1000}k`}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="#c084fc"
                            tickFormatter={(val) => `${val.toFixed(1)}%`}
                            tick={{ fontSize: 12 }}
                          />
                          <RechartsTooltip content={<ChartTooltip />} />
                          <Legend />
                          <Line yAxisId="left" type="monotone" dataKey="netWorth" name="Net Worth" stroke="#FFD700" strokeWidth={2} dot={false} />
                          <Bar yAxisId="right" dataKey="netWorthDelta" name="Wealth Velocity" fill="#c084fc" radius={[4, 4, 0, 0]} />
                          {processedTrajectory.filter(p => p.currencyChanged).map(p => (
                            <ReferenceLine key={`cur-nw-${p.date}`} x={p.date} stroke="#FFD700" strokeDasharray="4 2" />
                          ))}
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* 3. Asset Efficiency Trend */}
                  <div className="p-6 rounded-xl bg-zinc-900/50 border border-white/5">
                    <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                      Asset Efficiency (ROA)
                    </h3>
                    <div className="h-[300px] min-h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={processedTrajectory}>
                          <defs>
                            <linearGradient id="colorEfficiency" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                          <XAxis
                            dataKey="date"
                            stroke="#71717a"
                            tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis
                            stroke="#71717a"
                            tickFormatter={(val) => `${val}%`}
                            tick={{ fontSize: 12 }}
                          />
                          <RechartsTooltip content={<ChartTooltip />} />
                          <Legend />
                          <Line type="monotone" dataKey="assetEfficiency" name="Return on Assets" stroke="#60a5fa" strokeWidth={2} dot={false} />
                          {processedTrajectory.filter(p => p.currencyChanged).map(p => (
                            <ReferenceLine key={`cur-roa-${p.date}`} x={p.date} stroke="#FFD700" strokeDasharray="4 2" />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* 4. Quadrant Evolution */}
                  <div className="p-6 rounded-xl bg-zinc-900/50 border border-white/5">
                    <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                      Quadrant Evolution
                    </h3>
                    <div className="h-[300px] min-h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={processedTrajectory}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                          <XAxis
                            dataKey="date"
                            stroke="#71717a"
                            tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis
                            stroke="#71717a"
                            tickFormatter={(val) => `${val.toFixed(0)}%`}
                            tick={{ fontSize: 12 }}
                            domain={[0, 100]}
                          />
                          <RechartsTooltip content={<ChartTooltip />} />
                          <Legend />
                          <Area type="monotone" dataKey="quadrantPct.EMPLOYEE" name="Employee" stackId="1" stroke={QUADRANT_COLORS.EMPLOYEE} fill={QUADRANT_COLORS.EMPLOYEE} />
                          <Area type="monotone" dataKey="quadrantPct.SELF_EMPLOYED" name="Self-Employed" stackId="1" stroke={QUADRANT_COLORS.SELF_EMPLOYED} fill={QUADRANT_COLORS.SELF_EMPLOYED} />
                          <Area type="monotone" dataKey="quadrantPct.BUSINESS_OWNER" name="Business Owner" stackId="1" stroke={QUADRANT_COLORS.BUSINESS_OWNER} fill={QUADRANT_COLORS.BUSINESS_OWNER} />
                          <Area type="monotone" dataKey="quadrantPct.INVESTOR" name="Investor" stackId="1" stroke={QUADRANT_COLORS.INVESTOR} fill={QUADRANT_COLORS.INVESTOR} />
                          {processedTrajectory.filter(p => p.currencyChanged).map(p => (
                            <ReferenceLine key={`cur-iq-${p.date}`} x={p.date} stroke="#FFD700" strokeDasharray="4 2" />
                          ))}
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Analysis;