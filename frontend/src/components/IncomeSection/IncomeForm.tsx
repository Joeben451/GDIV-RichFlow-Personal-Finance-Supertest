import React, { useState, useEffect } from 'react';
import { IncomeLine } from '../../types/income.types';

interface Props {
  income?: IncomeLine | null;
  onSubmit: (name: string, amount: number, type: 'Earned' | 'Portfolio' | 'Passive') => void;
  onCancel: () => void;
}

const IncomeForm: React.FC<Props> = ({ income, onSubmit, onCancel }) => {
  const [name, setName] = useState(income?.name || '');
  const [amount, setAmount] = useState(income?.amount.toString() || '');
  const [type, setType] = useState<'Earned' | 'Portfolio' | 'Passive'>(income?.type || 'Earned');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (income) {
      setName(income.name);
      setAmount(income.amount.toString());
      setType(income.type);
    }
  }, [income]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate input
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      setError('Please enter a valid positive number');
      return;
    }

    onSubmit(name.trim(), numAmount, type);
  };

  return (
    <form className="income-form" onSubmit={handleSubmit}>
      <h3>{income ? 'Edit Income' : 'Add Income'}</h3>

      <div className="form-group">
        <label htmlFor="name">Name:</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Salary, Dividends, Rental Income"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="amount">Amount ($):</label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          min="0"
          step="0.01"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="type">Type:</label>
        <select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value as 'Earned' | 'Portfolio' | 'Passive')}
          required
        >
          <option value="Earned">Earned Income</option>
          <option value="Portfolio">Portfolio Income</option>
          <option value="Passive">Passive Income</option>
        </select>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="form-buttons">
        <button type="submit" className="submit-button">
          {income ? 'Update' : 'Add'}
        </button>
        <button type="button" className="cancel-button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default IncomeForm;