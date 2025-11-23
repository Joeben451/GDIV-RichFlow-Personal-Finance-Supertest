import React, { useEffect, useMemo, useState } from 'react';
import './EventLog.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { incomeAPI, assetsAPI, liabilitiesAPI, expensesAPI } from '../../utils/api';

type EventType = 'Income' | 'Expense' | 'Asset' | 'Liability' | 'Removed';

interface FinancialEvent {
  id: string;
  timestamp: string;
  type: EventType;
  description: string;
  valueChange: number;
}

// Helpers for snapshot + removed events persistence (per user)
type Snapshot = {
  incomes: Record<string, { subtype: 'Earned' | 'Portfolio' | 'Passive'; amount: number }>;
  expenses: Record<string, { amount: number }>;
  liabilities: Record<string, { value: number }>;
};

const parseNum = (v: any) => (typeof v === 'number' ? v : parseFloat(v));

const usePerUserKeys = (user: any) => {
  const uid = (user && (user.id || user.userId || user.uid)) || 'anon';
  return {
    removedKey: `eventlog:removed:user:${uid}`,
    snapKey: `eventlog:snapshot:user:${uid}`,
    deletedKey: `eventlog:deleted:user:${uid}`, // added
  };
};

const loadRemovedEvents = (key: string): FinancialEvent[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

const saveRemovedEvents = (key: string, events: FinancialEvent[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(events));
  } catch {}
};

// Added deleted events helpers
const loadDeletedIds = (key: string): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(key);
    const arr: string[] = raw ? JSON.parse(raw) : [];
    return new Set(arr);
  } catch {
    return new Set();
  }
};

const saveDeletedIds = (key: string, ids: Set<string>) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(ids)));
  } catch {}
};

const loadSnapshot = (key: string): Snapshot | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Snapshot) : null;
  } catch {
    return null;
  }
};

const saveSnapshot = (key: string, snap: Snapshot) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(snap));
  } catch {}
};

const EventLog: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState<FinancialEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<EventType | 'All'>('All');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  const { removedKey, snapKey, deletedKey } = usePerUserKeys(user);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  // Delete handler
  const handleDeleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    setDeletedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      saveDeletedIds(deletedKey, next);
      // If it was a persisted removed event, purge from that storage too
      const persistedRemoved = loadRemovedEvents(removedKey);
      if (persistedRemoved.some(ev => ev.id === id)) {
        const remaining = persistedRemoved.filter(ev => ev.id !== id);
        saveRemovedEvents(removedKey, remaining);
      }
      return next;
    });
  };

  useEffect(() => {
    // Initialize deleted IDs on mount
    setDeletedIds(loadDeletedIds(deletedKey));
  }, [deletedKey]);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      setError(null);
      try {
        // Parallel fetch of financial data
        const [incomeLinesRaw, assetsRaw, liabilitiesRaw, expensesRaw] = await Promise.all([
          incomeAPI.getIncomeLines().catch(() => []),
          assetsAPI.getAssets().catch(() => []),
          liabilitiesAPI.getLiabilities().catch(() => []),
          expensesAPI.getExpenses().catch(() => []),
        ]);

        const incomeLines = Array.isArray(incomeLinesRaw) ? incomeLinesRaw : [];
        const assets = Array.isArray(assetsRaw) ? assetsRaw : [];
        const liabilities = Array.isArray(liabilitiesRaw) ? liabilitiesRaw : [];
        const expenses = Array.isArray(expensesRaw) ? expensesRaw : [];

        const buildTimestamp = (item: any): string => {
          // Prefer createdAt or updatedAt if present; fallback to now
          return item?.createdAt || item?.updatedAt || new Date().toISOString();
        };

        const synthesized: FinancialEvent[] = [];

        // Fixed first event: user registration
        const registrationTs =
          (user as any)?.createdAt || (user as any)?.created_at || (user as any)?.created || new Date().toISOString();
        synthesized.push({
          id: 'start',
          timestamp: registrationTs,
          type: 'Asset',
          description: 'Starting Balance',
          valueChange: 0,
        });

        // Income (Earned, Portfolio, Passive) all treated as type 'Income'
        for (const line of incomeLines) {
          const amount = parseNum(line?.amount);
          if (isNaN(amount)) continue;
          const prefix =
            line.type === 'Earned'
              ? 'Added Income'
              : line.type === 'Portfolio'
              ? 'Added Portfolio'
              : line.type === 'Passive'
              ? 'Added Passive'
              : 'Added Income';
          synthesized.push({
            id: `income-${line.id}`,
            timestamp: buildTimestamp(line),
            type: 'Income',
            description: `${prefix}: ${line.name}`,
            valueChange: Math.abs(amount), // positive
          });
        }

        // Assets
        for (const a of assets) {
          const value = parseNum(a?.value);
          if (isNaN(value)) continue;
          synthesized.push({
            id: `asset-${a.id}`,
            timestamp: buildTimestamp(a),
            type: 'Asset',
            description: `Added Asset: ${a.name}`,
            valueChange: Math.abs(value), // positive
          });
        }

        // Liabilities (negative)
        for (const l of liabilities) {
          const value = parseNum(l?.value);
          if (isNaN(value)) continue;
          synthesized.push({
            id: `liability-${l.id}`,
            timestamp: buildTimestamp(l),
            type: 'Liability',
            description: `Logged Liability: ${l.name}`,
            valueChange: -Math.abs(value), // negative
          });
        }

        // Expenses (negative)
        for (const e of expenses) {
          const amount = parseNum(e?.amount);
          if (isNaN(amount)) continue;
          synthesized.push({
            id: `expense-${e.id}`,
            timestamp: buildTimestamp(e),
            type: 'Expense',
            description: `Logged Expense: ${e.name}`,
            valueChange: -Math.abs(amount), // negative
          });
        }

        // Build current snapshot (only for categories requested)
        const curSnap: Snapshot = {
          incomes: {},
          expenses: {},
          liabilities: {},
        };

        for (const line of incomeLines) {
          const amt = parseNum(line?.amount);
          if (isNaN(amt)) continue;
          const subtype =
            line.type === 'Earned' ? 'Earned' : line.type === 'Portfolio' ? 'Portfolio' : 'Passive';
          curSnap.incomes[String(line.id)] = { subtype, amount: Math.abs(amt) };
        }
        for (const l of liabilities) {
          const val = parseNum(l?.value);
          if (isNaN(val)) continue;
          curSnap.liabilities[String(l.id)] = { value: Math.abs(val) };
        }
        for (const e of expenses) {
          const amt = parseNum(e?.amount);
          if (isNaN(amt)) continue;
          curSnap.expenses[String(e.id)] = { amount: Math.abs(amt) };
        }

        // Detect removals vs previous snapshot and persist "Removed" events (never delete those rows)
        const prevSnap = loadSnapshot(snapKey);
        const existingRemoved = loadRemovedEvents(removedKey);

        const removedToAdd: FinancialEvent[] = [];
        if (prevSnap) {
          // Incomes (subtypes have different dashboard label and sign rule)
          for (const id of Object.keys(prevSnap.incomes)) {
            if (!curSnap.incomes[id]) {
              const prev = prevSnap.incomes[id];
              const dash =
                prev.subtype === 'Earned' ? 'Income' : prev.subtype === 'Portfolio' ? 'Portfolio' : 'Passive';
              const evId = `removed-income-${prev.subtype.toLowerCase()}-${id}`;
              // Negative for incomes (Income/Portfolio/Passive)
              removedToAdd.push({
                id: evId,
                timestamp: new Date().toISOString(),
                type: 'Removed',
                description: `Removed: ${dash}`,
                valueChange: -Math.abs(prev.amount),
              });
            }
          }
          // Expenses (positive when removed)
          for (const id of Object.keys(prevSnap.expenses)) {
            if (!curSnap.expenses[id]) {
              const prev = prevSnap.expenses[id];
              const evId = `removed-expense-${id}`;
              removedToAdd.push({
                id: evId,
                timestamp: new Date().toISOString(),
                type: 'Removed',
                description: 'Removed: Expense',
                valueChange: +Math.abs(prev.amount),
              });
            }
          }
          // Liabilities (positive when removed)
          for (const id of Object.keys(prevSnap.liabilities)) {
            if (!curSnap.liabilities[id]) {
              const prev = prevSnap.liabilities[id];
              const evId = `removed-liability-${id}`;
              removedToAdd.push({
                id: evId,
                timestamp: new Date().toISOString(),
                type: 'Removed',
                description: 'Removed: Liability',
                valueChange: +Math.abs(prev.value),
              });
            }
          }
        }

        // Merge/dedupe removed events (by id) and persist
        const dedupMap = new Map<string, FinancialEvent>();
        [...existingRemoved, ...removedToAdd].forEach(ev => {
          if (!dedupMap.has(ev.id)) dedupMap.set(ev.id, ev);
        });
        const mergedRemoved = Array.from(dedupMap.values());
        saveRemovedEvents(removedKey, mergedRemoved);
        saveSnapshot(snapKey, curSnap);

        // Combine
        let all = [...synthesized, ...mergedRemoved];
        // Filter out deleted IDs
        const localDeleted = loadDeletedIds(deletedKey);
        all = all.filter(ev => !localDeleted.has(ev.id));

        all.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setEvents(all);
      } catch (err: any) {
        setError(err?.message || 'Failed to build event log');
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [user, removedKey, snapKey, deletedKey]);

  const filtered = useMemo(() => {
    return events
      .filter(ev => {
        // Exclude Starting Balance from type-filtered views unless "All"
        if (ev.id === 'start' && typeFilter !== 'All') return false;
        if (typeFilter !== 'All' && ev.type !== typeFilter) return false;
        if (startDate && new Date(ev.timestamp) < new Date(startDate)) return false;
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (new Date(ev.timestamp) > end) return false;
        }
        if (search) {
          const s = search.toLowerCase();
          return (ev.description + ' ' + ev.type).toLowerCase().includes(s);
        }
        return true;
      });
  }, [events, typeFilter, startDate, endDate, search]);

  const highlight = (text: string) => {
    if (!search) return text;
    const lc = text.toLowerCase();
    const s = search.toLowerCase();
    const parts: React.ReactNode[] = [];
    let idx = 0;
    while (true) {
      const found = lc.indexOf(s, idx);
      if (found === -1) {
        parts.push(text.slice(idx));
        break;
      }
      if (found > idx) parts.push(text.slice(idx, found));
      parts.push(
        <span key={found} className="ev-highlight">
          {text.slice(found, found + s.length)}
        </span>
      );
      idx = found + s.length;
    }
    return <>{parts}</>;
  };

  const clearFilters = () => {
    setTypeFilter('All');
    setStartDate('');
    setEndDate('');
    setSearch('');
  };

  return (
    <div className="event-log-page">
      <div className="event-log-header">
        <button
          type="button"
          className="event-log-back-btn"
          onClick={() => navigate('/dashboard')}
          aria-label="Back to Dashboard"
        >
          Back to Dashboard
        </button>
        <h1 className="event-log-title">Financial Event Log</h1>
        <div className="event-log-filters">
          <div className="filter-group">
            <label>Type</label>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}>
              <option value="All">All</option>
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
              <option value="Asset">Asset</option>
              <option value="Liability">Liability</option>
              <option value="Removed">Removed</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="filter-group">
            <label>End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <div className="filter-group search-group">
            <label>Search</label>
            <div className="search-row">
              <input
                type="text"
                placeholder="Search description or type..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <button
                className="clear-btn"
                onClick={clearFilters}
                disabled={!search && !startDate && !endDate && typeFilter === 'All'}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="event-log-body">
        {loading && <div className="status-msg">Loading events...</div>}
        {!loading && error && <div className="status-msg">{error}</div>}
        {!loading && !error && filtered.length === 0 && (
          <div className="status-empty">No matching events.</div>
        )}
        {!loading && !error && filtered.length > 0 && (
          <table className="event-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Type</th>
                <th>Description</th>
                <th className="col-change">Change</th>
                <th> </th> {/* action column */}
              </tr>
            </thead>
            <tbody>
              {filtered.map(ev => {
                const ts = new Date(ev.timestamp);
                const changeFmt =
                  ev.id === 'start'
                    ? Math.abs(ev.valueChange).toLocaleString()
                    : (ev.valueChange >= 0 ? '+' : '-') + Math.abs(ev.valueChange).toLocaleString();
                return (
                  <tr key={ev.id} className={`row-${ev.type.toLowerCase()}`}>
                    <td>
                      <div className="ts-main">{ts.toLocaleString()}</div>
                      <div className="ts-sub">{ts.toISOString()}</div>
                    </td>
                    <td className="type-cell">
                      {/* Hide type badge for Starting Balance row */}
                      {ev.id === 'start' ? null : ev.type === 'Removed' ? (
                        <span>removed</span>
                      ) : (
                        <span className={`badge badge-${ev.type.toLowerCase()}`}>{ev.type}</span>
                      )}
                    </td>
                    <td className="desc-cell">{highlight(ev.description)}</td>
                    <td className={`change-cell ${ev.valueChange >= 0 ? 'pos' : 'neg'}`}>{changeFmt}</td>
                    <td>
                      {ev.id !== 'start' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteEvent(ev.id)}
                          className="clear-btn"
                          style={{ padding: '0.3rem 0.6rem' }}
                          title="Delete log"
                        >
                          ×
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default EventLog;
