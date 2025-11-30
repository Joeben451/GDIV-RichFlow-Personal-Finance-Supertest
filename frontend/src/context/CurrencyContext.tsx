import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Currency } from '../types/currency.types';
import { currencyAPI } from '../utils/api';
import { useAuth } from './AuthContext';

interface CurrencyContextType {
  currency: Currency | null;
  setCurrency: (currency: Currency) => void;
  loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const { isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    // Only fetch currency once auth is ready and we haven't initialized yet
    if (authLoading || hasInitialized) return;

    const fetchCurrency = async () => {
      setLoading(true);
      try {
        if (isAuthenticated) {
          const userCurrency = await currencyAPI.getUserCurrency();
          setCurrency(userCurrency);
        } else {
          // Default to USD for guests
          const currencies = await currencyAPI.getCurrencies();
          const usd = currencies.find((c: any) => c.cur_name === 'US Dollar');
          setCurrency(usd || currencies[0]);
        }
      } catch (error) {
        console.error("Failed to fetch currency", error);
        // Fallback currency
        setCurrency({ id: 1, cur_name: 'US Dollar', cur_symbol: '$' });
      } finally {
        setLoading(false);
        setHasInitialized(true);
      }
    };

    fetchCurrency();
  }, [isAuthenticated, authLoading, hasInitialized]);

  const handleSetCurrency = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    if (isAuthenticated) {
      currencyAPI.updateUserCurrency(newCurrency.id).catch(err => {
        console.error("Failed to update user currency preference", err);
        // Optionally revert currency change or notify user
      });
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency: handleSetCurrency, loading }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
