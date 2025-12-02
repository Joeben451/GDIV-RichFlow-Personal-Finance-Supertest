import React, { useState, useEffect } from 'react';
import { currencyAPI } from '../../utils/api';
import { useCurrency } from '../../context/CurrencyContext';
import { Currency } from '../../types/currency.types';

interface CurrencySelectorProps {
  onCurrencyChange?: (currency: Currency) => void;
}

const CurrencySelector: React.FC<CurrencySelectorProps> = ({ onCurrencyChange }) => {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const { currency: selectedCurrency, setCurrency: setSelectedCurrency, loading: currencyLoading } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all currencies
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        setLoading(true);
        const currenciesData = await currencyAPI.getCurrencies();
        if (Array.isArray(currenciesData) && currenciesData.length > 0) {
          setCurrencies(currenciesData);
        } else {
          throw new Error('No currencies received from API');
        }
      } catch (err) {
        console.error('❌ Failed to fetch currencies from API:', err);
        const fallbackCurrencies: Currency[] = [
          { id: 1, cur_symbol: '$', cur_name: 'US Dollar' },
          { id: 2, cur_symbol: '€', cur_name: 'Euro' },
          { id: 3, cur_symbol: '£', cur_name: 'British Pound' },
        ];
        setCurrencies(fallbackCurrencies);
        setError('Using default currencies - server may be offline');
      } finally {
        setLoading(false);
      }
    };

    fetchCurrencies();
  }, []);

  const handleCurrencySelect = async (currency: Currency) => {
    setSelectedCurrency(currency);
    if (onCurrencyChange) {
      onCurrencyChange(currency);
    }
  };

  if (currencyLoading || loading) {
    return (
      <div className="rf-currency-loading">
        <span>Loading currencies...</span>
      </div>
    );
  }

  if (error && currencies.length === 0) {
    return <div className="rf-settings-error">{error}</div>;
  }

  return (
    <div className="rf-currency-list-container">
      {error && (
        <div className="rf-currency-warning">{error}</div>
      )}
      <div className="rf-currency-grid">
        {currencies.map((currency) => (
          <button
            key={currency.id}
            className={`rf-currency-card ${selectedCurrency?.id === currency.id ? 'selected' : ''}`}
            onClick={() => handleCurrencySelect(currency)}
            disabled={loading}
          >
            <span className="rf-currency-card-symbol">{currency.cur_symbol}</span>
            <span className="rf-currency-card-name">{currency.cur_name}</span>
            {selectedCurrency?.id === currency.id && (
              <span className="rf-currency-card-check">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CurrencySelector;
