import React, { useState } from "react";
import { useUnifiedFinancialData, IncomeItem, IncomeQuadrant } from "../../hooks/useFinancialData";
import { useCurrency } from "../../context/CurrencyContext";
import { formatCurrency } from "../../utils/currency.utils";

const quadrantBySection: Record<'earned' | 'portfolio' | 'passive', IncomeQuadrant> = {
  earned: 'EMPLOYEE',
  portfolio: 'INVESTOR',
  passive: 'BUSINESS_OWNER'
};

const IncomeSection: React.FC = () => {
  const { currency } = useCurrency();
  
  // Use the unified financial data hook - replaces local state and store subscriptions
  const {
    income,
    loading,
    error,
    initialized,
    addIncome,
    updateIncome,
    deleteIncome,
  } = useUnifiedFinancialData();

  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<IncomeItem | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  // Handle add income
  const handleAddIncome = async (
    section: "earned" | "portfolio" | "passive",
    name: string,
    amount: string,
    quadrantOverride?: IncomeQuadrant
  ) => {
    if (!name.trim() || !amount.trim() || isAdding) return;
    
    try {
      setIsAdding(true);
      setLocalError(null);
      const type = section.charAt(0).toUpperCase() + section.slice(1) as 'Earned' | 'Portfolio' | 'Passive';
      const fallbackQuadrant = quadrantBySection[section];
      const resolvedQuadrant = section === 'earned'
        ? (quadrantOverride || fallbackQuadrant)
        : fallbackQuadrant;
      
      await addIncome(name, parseFloat(amount), type, resolvedQuadrant);
    } catch (err: unknown) {
      setLocalError('Failed to add income');
    } finally {
      setIsAdding(false);
    }
  };

  // Handle update income
  const handleUpdateIncome = async (
    id: number,
    name: string,
    amount: number,
    type: 'Earned' | 'Portfolio' | 'Passive',
    quadrantOverride?: IncomeQuadrant
  ) => {
    if (isUpdating !== null) return;
    
    try {
      setIsUpdating(id);
      setLocalError(null);
      await updateIncome(id, name, amount, type, quadrantOverride);
      setEditingItem(null);
    } catch (err: unknown) {
      setLocalError('Failed to update income');
    } finally {
      setIsUpdating(null);
    }
  };

  // Handle delete income
  const handleDelete = async (section: "earned" | "portfolio" | "passive", id: number) => {
    if (isDeleting !== null) return;
    
    try {
      setIsDeleting(id);
      setLocalError(null);
      const type = section.charAt(0).toUpperCase() + section.slice(1) as 'Earned' | 'Portfolio' | 'Passive';
      await deleteIncome(id, type);
    } catch (err: unknown) {
      setLocalError('Failed to delete income');
    } finally {
      setIsDeleting(null);
    }
  };

  // reusable income card
  const IncomeCard = ({
    title,
    items,
    section,
  }: {
    title: string;
    items: IncomeItem[];
    section: "earned" | "portfolio" | "passive";
  }) => {
    const [source, setSource] = useState("");
    const [amount, setAmount] = useState("");
    const [quadrantSelection, setQuadrantSelection] = useState<IncomeQuadrant>('EMPLOYEE');
    const isEarnedSection = section === 'earned';
    const sectionType = (section.charAt(0).toUpperCase() + section.slice(1)) as 'Earned' | 'Portfolio' | 'Passive';

    const handleEdit = (item: IncomeItem) => {
      setEditingItem(item);
      setSource(item.name);
      setAmount(item.amount.toString());
      if (isEarnedSection) {
        setQuadrantSelection(item.quadrant || 'EMPLOYEE');
      }
    };

    const handleSaveEdit = () => {
      if (editingItem && source.trim() && amount.trim()) {
        const quadrantForEdit = isEarnedSection ? quadrantSelection : editingItem.quadrant;
        handleUpdateIncome(editingItem.id, source, parseFloat(amount), editingItem.type, quadrantForEdit);
        setSource("");
        setAmount("");
      }
    };

    const handleCancelEdit = () => {
      setEditingItem(null);
      setSource("");
      setAmount("");
    };

    const handleAddClick = () => {
      handleAddIncome(section, source, amount, isEarnedSection ? quadrantSelection : undefined);
      setSource("");
      setAmount("");
    };

    const isEditingCurrentSection = Boolean(
      editingItem && editingItem.type === sectionType
    );

    return (
      <div className="rf-card">
        <div className="rf-section-header-sm">{title}</div>

        {items.length === 0 ? (
          <p className="rf-empty">No {title.toLowerCase()} added yet.</p>
        ) : (
          <div className="rf-scroll-list">
            {items.map((item) => (
              <div key={item.id} className="rf-list-item">
                <span className="rf-list-item-name">{item.name}</span>
                <span className="rf-list-item-amount">
                  {formatCurrency(typeof item.amount === 'number' ? item.amount : 0, currency)}
                </span>
                <div className="rf-list-item-actions">
                  <button
                    className="rf-btn-edit"
                    onClick={() => handleEdit(item)}
                    disabled={isUpdating !== null || isDeleting !== null || editingItem !== null}
                    title="Edit"
                  >
                    Edit
                  </button>
                  <button
                    className="rf-btn-delete"
                    onClick={() => handleDelete(section, item.id)}
                    disabled={isDeleting === item.id || editingItem !== null}
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
            placeholder="Source name"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
          <input
            className="rf-input"
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          {isEarnedSection && (
            <select
              className="rf-select"
              value={quadrantSelection}
              onChange={(e) => setQuadrantSelection(e.target.value as IncomeQuadrant)}
              disabled={editingItem !== null && !isEditingCurrentSection}
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="SELF_EMPLOYED">Self-Employed</option>
            </select>
          )}
        </div>

        {isEarnedSection && (
          <p className="rf-hint">
            Choose the quadrant to control whether this source shows as Employee or Self-Employed in the snapshot.
          </p>
        )}

        {isEditingCurrentSection ? (
          <div className="rf-edit-actions">
            <button
              className="rf-btn-save"
              onClick={handleSaveEdit}
              disabled={isUpdating !== null || !source.trim() || !amount.trim()}
            >
              {isUpdating === editingItem?.id ? 'Saving...' : 'Save'}
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
            onClick={handleAddClick}
            disabled={isAdding || !source.trim() || !amount.trim() || editingItem !== null}
          >
            {isAdding ? 'Adding...' : `+ Add ${title}`}
          </button>
        )}
      </div>
    );
  };

  // Show loading state
  if (loading && !initialized) {
    return (
      <div className="bg-transparent text-white h-full flex flex-col font-sans">
        <div className="rf-section-header">Income</div>
        <div className="flex flex-col gap-6 flex-1 overflow-y-auto pr-2">
          <p className="text-center text-[#d4af37] p-5">Loading income data...</p>
        </div>
      </div>
    );
  }

  // Display error from hook or local error
  const displayError = localError || error;

  return (
    <div className="bg-transparent text-white h-full flex flex-col font-sans">
      <div className="rf-section-header">Income</div>
      
      {displayError && (
        <div className="rf-error">
          {displayError}
        </div>
      )}

      <div className="flex flex-col gap-6 flex-1 overflow-y-auto pr-2">
        <IncomeCard title="Earned Income" items={income.earned} section="earned" />
        <IncomeCard title="Portfolio Income" items={income.portfolio} section="portfolio" />
        <IncomeCard title="Passive Income" items={income.passive} section="passive" />
      </div>
    </div>
  );
};

export default IncomeSection;
