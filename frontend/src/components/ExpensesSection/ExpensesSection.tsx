import React, { useState } from 'react';
import { useUnifiedFinancialData } from '../../hooks/useFinancialData';
import { useCurrency } from '../../context/CurrencyContext';
import { formatCurrency } from '../../utils/currency.utils';

const ExpenseSection: React.FC = () => {
  const { currency } = useCurrency();
  
  // Use the unified financial data hook
  const { 
    expenses, 
    loading, 
    error, 
    initialized,
    addExpense: addExpenseToHook, 
    deleteExpense: deleteExpenseFromHook, 
    updateExpense 
  } = useUnifiedFinancialData();
  
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleAddExpense = async () => {
    if (!name.trim() || !amount.trim() || isAdding) return;

    try {
      setIsAdding(true);
      setLocalError(null);
      await addExpenseToHook(name, parseFloat(amount));
      setName('');
      setAmount('');
    } catch (err: unknown) {
      setLocalError('Failed to add expense');
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditExpense = (id: number, expenseName: string, expenseAmount: number) => {
    setEditingId(id);
    setName(expenseName);
    setAmount(expenseAmount.toString());
  };

  const handleUpdateExpense = async () => {
    if (!editingId || !name.trim() || !amount.trim() || isUpdating !== null) return;

    try {
      setIsUpdating(editingId);
      setLocalError(null);
      await updateExpense(editingId, name, parseFloat(amount));
      setEditingId(null);
      setName('');
      setAmount('');
    } catch (err: unknown) {
      setLocalError('Failed to update expense');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setAmount('');
  };

  const handleDeleteExpense = async (id: number) => {
    if (isDeleting !== null) return;
    
    try {
      setIsDeleting(id);
      setLocalError(null);
      await deleteExpenseFromHook(id);
    } catch (err: unknown) {
      setLocalError('Failed to delete expense');
    } finally {
      setIsDeleting(null);
    }
  };

  const displayError = localError || error;

  return (
    <div className="bg-transparent h-full flex flex-col text-white font-sans">
      <h1 className="rf-section-header">Expenses</h1>

      <div className="rf-card flex-1 flex flex-col">
        {loading && !initialized ? (
          <p>Loading expenses...</p>
        ) : displayError ? (
          <p className="rf-error">{displayError}</p>
        ) : !Array.isArray(expenses) ? (
          <p className="rf-error">Error loading expenses</p>
        ) : expenses.length === 0 ? (
          <p className="rf-empty">No expenses added yet.</p>
        ) : (
          <div className="rf-scroll-list max-h-[250px]">
            {expenses.map((item) => (
              <div key={item.id} className="rf-list-item">
                <span className="rf-list-item-name text-white">{item.name}</span>
                <span className="rf-list-item-amount mx-3">
                  {formatCurrency(typeof item.amount === 'number' ? item.amount : 0, currency)}
                </span>
                <div className="rf-list-item-actions">
                  <button
                    className="rf-btn-edit"
                    onClick={() => handleEditExpense(item.id, item.name, item.amount)}
                    disabled={editingId !== null || isDeleting !== null}
                    title="Edit"
                  >
                    Edit
                  </button>
                  <button
                    className="rf-btn-delete"
                    onClick={() => handleDeleteExpense(item.id)}
                    disabled={isDeleting === item.id || editingId !== null}
                  >
                    {isDeleting === item.id ? '...' : '✕'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="rf-input-row">
          <input
            className="rf-input"
            type="text"
            placeholder="Expense name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="rf-input"
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {editingId !== null ? (
          <div className="rf-edit-actions">
            <button 
              className="rf-btn-save" 
              onClick={handleUpdateExpense}
              disabled={isUpdating !== null || !name.trim() || !amount.trim()}
            >
              {isUpdating === editingId ? 'Saving...' : 'Save'}
            </button>
            <button 
              className="rf-btn-cancel" 
              onClick={handleCancelEdit}
              disabled={isUpdating !== null}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button 
            className="rf-btn-primary" 
            onClick={handleAddExpense}
            disabled={isAdding || !name.trim() || !amount.trim()}
          >
            {isAdding ? 'Adding...' : '+ Add Expense'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ExpenseSection;
