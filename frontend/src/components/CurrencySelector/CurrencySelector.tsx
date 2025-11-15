import React, { useState, useEffect, useRef } from 'react';
import { currencyAPI } from '../../utils/api';
import './CurrencySelector.css';

interface Currency {
  id: number;
  cur_symbol: string;
  cur_name: string;
}

interface CurrencySelectorProps {
  onCurrencyChange?: (currency: Currency) => void;
}

const CurrencySelector: React.FC<CurrencySelectorProps> = ({ onCurrencyChange }) => {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch all currencies and user's preferred currency
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all currencies first (public endpoint - no auth required)
        const currenciesData = await currencyAPI.getCurrencies();
        console.log('Currencies fetched successfully:', currenciesData);
        setCurrencies(currenciesData);
        
        // Try to fetch user's preferred currency (requires auth, may fail if not logged in)
        try {
          const userCurrencyData = await currencyAPI.getUserCurrency();
          console.log('User currency fetched:', userCurrencyData);
          setSelectedCurrency(userCurrencyData);
        } catch (userCurrencyErr) {
          console.log('User currency not available (not authenticated), using default USD');
          // If user is not authenticated, default to USD (id: 1)
          const defaultCurrency = currenciesData.find((c: Currency) => c.id === 1);
          if (defaultCurrency) {
            setSelectedCurrency(defaultCurrency);
          }
        }
      } catch (err) {
        console.error('Failed to fetch currency data:', err);
        // Don't show error to user for currency loading - just use a default
        // Set USD as fallback
        setSelectedCurrency({ id: 1, cur_symbol: '$', cur_name: 'US Dollar' });
        setError(null); // Clear error since we have a fallback
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCurrencySelect = async (currency: Currency) => {
    try {
      setLoading(true);
      await currencyAPI.updateUserCurrency(currency.id);
      setSelectedCurrency(currency);
      setIsOpen(false);
      
      // Notify parent component if callback provided
      if (onCurrencyChange) {
        onCurrencyChange(currency);
      }
      
      // Reload page to reflect currency changes across the app
      window.location.reload();
    } catch (err) {
      console.error('Failed to update currency:', err);
      setError('Failed to update currency preference');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !selectedCurrency) {
    return <div className="currency-selector-loading">Loading currencies...</div>;
  }

  if (error && !selectedCurrency) {
    return <div className="currency-selector-error">{error}</div>;
  }

  return (
    <div className="currency-selector" ref={dropdownRef}>
      <button
        className="currency-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
      >
        <span className="currency-symbol">
          {selectedCurrency?.cur_symbol || '$'}
        </span>
        <span className="currency-name">
          {selectedCurrency?.cur_name || 'US Dollar'}
        </span>
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="currency-dropdown">
          <div className="currency-dropdown-header">Select Currency</div>
          <div className="currency-list">
            {currencies.map((currency) => (
              <button
                key={currency.id}
                className={`currency-option ${
                  selectedCurrency?.id === currency.id ? 'selected' : ''
                }`}
                onClick={() => handleCurrencySelect(currency)}
                disabled={loading}
              >
                <span className="currency-symbol">{currency.cur_symbol}</span>
                <span className="currency-info">
                  <span className="currency-name">{currency.cur_name}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && selectedCurrency && (
        <div className="currency-selector-error-toast">{error}</div>
      )}
    </div>
  );
};

export default CurrencySelector;
