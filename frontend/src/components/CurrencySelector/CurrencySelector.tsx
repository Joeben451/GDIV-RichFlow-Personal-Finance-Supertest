import React, { useState, useEffect, useRef } from 'react';
import { currencyAPI } from '../../utils/api';
import { useCurrency } from '../../context/CurrencyContext';
import { Currency } from '../../types/currency.types';
import './CurrencySelector.css';

interface CurrencySelectorProps {
  onCurrencyChange?: (currency: Currency) => void;
}

const CurrencySelector: React.FC<CurrencySelectorProps> = ({ onCurrencyChange }) => {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const { currency: selectedCurrency, setCurrency: setSelectedCurrency, loading: currencyLoading } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    setSelectedCurrency(currency);
    setIsOpen(false);
    if (onCurrencyChange) {
      onCurrencyChange(currency);
    }
  };

  if (currencyLoading) {
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
