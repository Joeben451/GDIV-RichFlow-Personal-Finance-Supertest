export type IncomeTotals = {
  earned: number;
  portfolio: number;
  passive: number;
  total: number;
};

type Listener = () => void;

const clampNum = (n: any) => (typeof n === 'number' && !isNaN(n) ? n : 0);

let totals: IncomeTotals = { earned: 0, portfolio: 0, passive: 0, total: 0 };
const listeners = new Set<Listener>();

const recalcTotal = (t: Omit<IncomeTotals, 'total'>): IncomeTotals => ({
  ...t,
  total: clampNum(t.earned) + clampNum(t.portfolio) + clampNum(t.passive),
});

export const incomeTotalsStore = {
  get(): IncomeTotals {
    return totals;
  },
  set(partial: Partial<IncomeTotals>) {
    const next = { ...totals, ...partial } as IncomeTotals;
    totals = recalcTotal({ earned: clampNum(next.earned), portfolio: clampNum(next.portfolio), passive: clampNum(next.passive) });
    listeners.forEach((l) => l());
  },
  replace(newTotals: Omit<IncomeTotals, 'total'>) {
    totals = recalcTotal(newTotals);
    listeners.forEach((l) => l());
  },
  reset() {
    totals = { earned: 0, portfolio: 0, passive: 0, total: 0 };
    listeners.forEach((l) => l());
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

// Reset totals on auth change
if (typeof window !== 'undefined') {
  window.addEventListener('auth:changed', () => {
    incomeTotalsStore.reset();
  });
}
