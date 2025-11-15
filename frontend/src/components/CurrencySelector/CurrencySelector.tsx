import React, { useState, useEffect, useRef } from 'react';
import { currencyAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Currency } from '../../types/currency.types';
import './CurrencySelector.css';

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
  const { isAuthenticated, user } = useAuth();

  // Fetch all currencies and user's preferred currency
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all currencies (public endpoint - no auth required)
        try {
          const currenciesData = await currencyAPI.getCurrencies();
          console.log('✅ Currencies fetched successfully:', currenciesData.length, 'currencies');
          
          if (Array.isArray(currenciesData) && currenciesData.length > 0) {
            setCurrencies(currenciesData);
            
            // Fetch user's preferred currency if authenticated
            if (isAuthenticated) {
              try {
                const userCurrencyData = await currencyAPI.getUserCurrency();
                console.log('✅ User preferred currency:', userCurrencyData);
                if (userCurrencyData) {
                  setSelectedCurrency(userCurrencyData);
                } else {
                  // Default to USD if no preference set
                  const defaultCurrency = currenciesData.find((c: Currency) => c.id === 1);
                  setSelectedCurrency(defaultCurrency || currenciesData[0]);
                }
              } catch (userCurrencyErr) {
                console.warn('⚠️ Failed to fetch user currency preference:', userCurrencyErr);
                // Default to USD
                const defaultCurrency = currenciesData.find((c: Currency) => c.id === 1);
                setSelectedCurrency(defaultCurrency || currenciesData[0]);
              }
            } else {
              // Not authenticated - use default USD
              console.log('ℹ️ User not authenticated, using default USD');
              const defaultCurrency = currenciesData.find((c: Currency) => c.id === 1);
              setSelectedCurrency(defaultCurrency || currenciesData[0]);
            }
          } else {
            throw new Error('No currencies received from API');
          }
        } catch (currencyFetchErr) {
          console.error('❌ Failed to fetch currencies from API:', currencyFetchErr);
          // Use fallback currencies if API fails
          const fallbackCurrencies: Currency[] = [
            { id: 1, cur_symbol: '$', cur_name: 'US Dollar' },
            { id: 2, cur_symbol: '€', cur_name: 'Euro' },
            { id: 3, cur_symbol: '£', cur_name: 'British Pound' },
          ];
          setCurrencies(fallbackCurrencies);
          setSelectedCurrency(fallbackCurrencies[0]);
          setError('Using default currencies - server may be offline');
        }
      } catch (err) {
        console.error('❌ Critical error in currency selector:', err);
        // Final fallback
        setSelectedCurrency({ id: 1, cur_symbol: '$', cur_name: 'US Dollar' });
        setError('Failed to load currencies');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

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
    console.log('🔄 handleCurrencySelect called with:', currency);
    console.log('🔐 isAuthenticated:', isAuthenticated);
    console.log('👤 user:', user);
    
    // If user is not authenticated, just update locally (no DB update)
    if (!isAuthenticated) {
      console.log('ℹ️ User not authenticated, updating locally only');
      setSelectedCurrency(currency);
      setIsOpen(false);
      if (onCurrencyChange) {
        onCurrencyChange(currency);
      }
      return;
    }

    // User is authenticated - update in database
    try {
      setLoading(true);
      setError(null);
      
      console.log('📤 Sending currency update request to API...');
      const response = await currencyAPI.updateUserCurrency(currency.id);
      console.log('✅ Currency update API response:', response);
      
      // Update local state
      setSelectedCurrency(currency);
      setIsOpen(false);
      
      // Notify parent component
      if (onCurrencyChange) {
        onCurrencyChange(currency);
      }
      
      console.log('🔄 Reloading page to reflect changes...');
      // Reload to reflect changes throughout the app
      window.location.reload();
    } catch (err: any) {
      console.error('❌ Failed to update currency:', err);
      console.error('❌ Error details:', {
        message: err?.message,
        response: err?.response,
        stack: err?.stack
      });
      setError('Failed to update currency preference: ' + (err?.message || 'Unknown error'));
      // Keep dropdown open so user can try again
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
