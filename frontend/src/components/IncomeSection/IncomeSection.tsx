import React, { useState } from "react";
import { 
  useIncomeQuery, 
  useAddIncomeMutation, 
  useUpdateIncomeMutation,
  useDeleteIncomeMutation,
  IncomeItem,
  IncomeQuadrant,
  IncomeType
} from "../../hooks/queries/useIncome";
import { useCurrency } from "../../context/CurrencyContext";
import { formatCurrency } from "../../utils/currency.utils";
import FinancialTable, { ColumnDefinition } from "../Shared/FinancialTable";

const quadrantBySection: Record<'earned' | 'portfolio' | 'passive', IncomeQuadrant> = {
  earned: 'EMPLOYEE',
  portfolio: 'INVESTOR',
  passive: 'BUSINESS_OWNER'
};

const IncomeSection: React.FC = () => {
  const { currency } = useCurrency();
  
  // TanStack Query hooks
  const { data: income, isLoading, error: queryError } = useIncomeQuery();
  const addIncomeMutation = useAddIncomeMutation();
  const updateIncomeMutation = useUpdateIncomeMutation();
  const deleteIncomeMutation = useDeleteIncomeMutation();

  const [editingItem, setEditingItem] = useState<IncomeItem | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  // Handle add income
  const handleAddIncome = async (
    section: "earned" | "portfolio" | "passive",
    name: string,
    amount: string,
    quadrantOverride?: IncomeQuadrant
  ) => {
    if (!name.trim() || !amount.trim() || addIncomeMutation.isPending) return;
    
    try {
      setLocalError(null);
      const type = section.charAt(0).toUpperCase() + section.slice(1) as IncomeType;
      const fallbackQuadrant = quadrantBySection[section];
      const resolvedQuadrant = section === 'earned'
        ? (quadrantOverride || fallbackQuadrant)
        : fallbackQuadrant;
      
      await addIncomeMutation.mutateAsync({
        name,
        amount: parseFloat(amount),
        type,
        quadrant: resolvedQuadrant
      });
    } catch (err: unknown) {
      setLocalError('Failed to add income');
    }
  };

  // Handle update income
  const handleUpdateIncome = async (
    id: number,
    name: string,
    amount: number,
    type: IncomeType,
    quadrantOverride?: IncomeQuadrant
  ) => {
    if (updateIncomeMutation.isPending) return;
    
    try {
      setLocalError(null);
      await updateIncomeMutation.mutateAsync({
        id,
        name,
        amount,
        type,
        quadrant: quadrantOverride
      });
      setEditingItem(null);
    } catch (err: unknown) {
      setLocalError('Failed to update income');
    }
  };

  // Handle delete income
  const handleDelete = async (section: "earned" | "portfolio" | "passive", id: number) => {
    if (deleteIncomeMutation.isPending) return;
    
    try {
      setLocalError(null);
      const type = section.charAt(0).toUpperCase() + section.slice(1) as IncomeType;
      await deleteIncomeMutation.mutateAsync({ id, type });
    } catch (err: unknown) {
      setLocalError('Failed to delete income');
    }
  };

  // Reusable income card using FinancialTable
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
    const sectionType = (section.charAt(0).toUpperCase() + section.slice(1)) as IncomeType;

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

    const handleDeleteItem = (item: IncomeItem) => {
      handleDelete(section, item.id);
    };

    const isEditingCurrentSection = Boolean(
      editingItem && editingItem.type === sectionType
    );

    // Column definitions for FinancialTable
    const columns: ColumnDefinition<IncomeItem>[] = [
      { header: 'Source', accessor: 'name' },
      { 
        header: 'Amount', 
        accessor: (item) => formatCurrency(item.amount, currency),
        align: 'right'
      },
    ];

    // Calculate total for footer
    const total = items.reduce((sum, item) => sum + item.amount, 0);

    // Determine which item is being deleted (for loading state)
    const deletingId = deleteIncomeMutation.isPending && deleteIncomeMutation.variables?.id;

    return (
      <div className="rf-card">
        <div className="rf-section-header-sm">{title}</div>

        {/* Use FinancialTable for the list display */}
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
                    disabled={updateIncomeMutation.isPending || deleteIncomeMutation.isPending || editingItem !== null}
                    title="Edit"
                  >
                    Edit
                  </button>
                  <button
                    className="rf-btn-delete"
                    onClick={() => handleDeleteItem(item)}
                    disabled={deletingId === item.id || editingItem !== null}
                  >
                    {deletingId === item.id ? '...' : '✕'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Total display */}
        {items.length > 0 && (
          <div className="rf-list-item" style={{ borderBottom: 'none', marginTop: '0.5rem' }}>
            <span className="rf-list-item-name font-bold">Total</span>
            <span className="rf-list-item-amount font-bold">{formatCurrency(total, currency)}</span>
          </div>
        )}

        {/* Input row */}
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
              disabled={updateIncomeMutation.isPending || !source.trim() || !amount.trim()}
            >
              {updateIncomeMutation.isPending && updateIncomeMutation.variables?.id === editingItem?.id ? 'Saving...' : 'Save'}
            </button>
            <button
              className="rf-btn-cancel"
              onClick={handleCancelEdit}
              disabled={updateIncomeMutation.isPending}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            className="rf-btn-primary"
            onClick={handleAddClick}
            disabled={addIncomeMutation.isPending || !source.trim() || !amount.trim() || editingItem !== null}
          >
            {addIncomeMutation.isPending ? 'Adding...' : `+ Add ${title}`}
          </button>
        )}
      </div>
    );
  };

  // Show loading state
  if (isLoading) {
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
  const displayError = localError || (queryError instanceof Error ? queryError.message : queryError ? String(queryError) : null);

  // Default empty income structure if data is not yet available
  const incomeData = income ?? { earned: [], portfolio: [], passive: [], all: [] };

  return (
    <div className="bg-transparent text-white h-full flex flex-col font-sans">
      <div className="rf-section-header">Income</div>
      
      {displayError && (
        <div className="rf-error">
          {displayError}
        </div>
      )}

      <div className="flex flex-col gap-6 flex-1 overflow-y-auto pr-2">
        <IncomeCard title="Earned Income" items={incomeData.earned} section="earned" />
        <IncomeCard title="Portfolio Income" items={incomeData.portfolio} section="portfolio" />
        <IncomeCard title="Passive Income" items={incomeData.passive} section="passive" />
      </div>
    </div>
  );
};

export default IncomeSection;
