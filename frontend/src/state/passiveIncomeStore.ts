type Listener = () => void;

let passiveTotal = 0;
const listeners = new Set<Listener>();

export const passiveIncomeStore = {
  get(): number {
    return passiveTotal;
  },
  set(value: number) {
    if (typeof value !== 'number' || isNaN(value)) value = 0;
    passiveTotal = value;
    listeners.forEach((l) => l());
  },
  reset() {
    passiveTotal = 0;
    listeners.forEach((l) => l());
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

// Reset on auth change so previous user's data isn't shown
if (typeof window !== 'undefined') {
  window.addEventListener('auth:changed', () => {
    passiveIncomeStore.reset();
  });
}
