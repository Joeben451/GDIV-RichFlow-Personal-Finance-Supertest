import React, { useState } from "react";
import { useUnifiedFinancialData, LiabilityItem } from "../../hooks/useFinancialData";
import { useCurrency } from "../../context/CurrencyContext";
import { formatCurrency } from "../../utils/currency.utils";

const LiabilitiesSection: React.FC = () => {
  const { currency } = useCurrency();
  
  // Use the unified financial data hook
  const {
    liabilities,
    loading,
    error,
    initialized,
    addLiability,
    updateLiability,
    deleteLiability,
  } = useUnifiedFinancialData();

  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  // handle add liability
  const handleAddLiability = async (name: string, amount: string) => {
    if (!name.trim() || !amount.trim() || isAdding) return;

    try {
      setIsAdding(true);
      setLocalError(null);
      await addLiability(name, parseFloat(amount));
    } catch (err: unknown) {
      setLocalError("Failed to add liability");
    } finally {
      setIsAdding(false);
    }
  };

  // handle edit liability
  const handleEdit = (id: number, name: string, value: number) => {
    setEditingId(id);
    setLiabilityName(name);
    setLiabilityAmount(value.toString());
  };

  // handle update liability
  const handleUpdate = async () => {
    if (!editingId || !liabilityName.trim() || !liabilityAmount.trim() || isUpdating !== null) return;

    try {
      setIsUpdating(editingId);
      setLocalError(null);
      await updateLiability(editingId, liabilityName, parseFloat(liabilityAmount));
      setEditingId(null);
      setLiabilityName("");
      setLiabilityAmount("");
    } catch (err: unknown) {
      setLocalError("Failed to update liability");
    } finally {
      setIsUpdating(null);
    }
  };

  // handle cancel edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setLiabilityName("");
    setLiabilityAmount("");
  };

  // handle delete liability
  const handleDelete = async (id: number) => {
    if (isDeleting !== null) return;

    try {
      setIsDeleting(id);
      setLocalError(null);
      await deleteLiability(id);
    } catch (err: unknown) {
      setLocalError("Failed to delete liability");
    } finally {
      setIsDeleting(null);
    }
  };

  const [liabilityName, setLiabilityName] = useState("");
  const [liabilityAmount, setLiabilityAmount] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId !== null) {
      await handleUpdate();
    } else {
      await handleAddLiability(liabilityName, liabilityAmount);
      setLiabilityName("");
      setLiabilityAmount("");
    }
  };

  if (loading && !initialized) {
    return <div className="rf-card">Loading...</div>;
  }

  const displayError = localError || error;

  return (
    <div className="rf-card text-white">
      <div className="rf-section-header">Liabilities</div>

      {displayError && <p className="rf-error">{displayError}</p>}

      {liabilities.length === 0 ? (
        <p className="rf-empty">No liabilities added yet.</p>
      ) : (
        <div className="rf-scroll-list">
          {liabilities.map((item) => (
            <div key={item.id} className="rf-list-item">
              <span className="rf-list-item-name">{item.name}</span>
              <span className="rf-list-item-amount">{formatCurrency(typeof item.value === "number" ? item.value : 0, currency)}</span>
              <div className="rf-list-item-actions">
                <button
                  className="rf-btn-edit"
                  onClick={() => handleEdit(item.id, item.name, item.value)}
                  disabled={editingId !== null || isDeleting !== null}
                  title="Edit"
                >
                  Edit
                </button>
                <button
                  className="rf-btn-delete"
                  onClick={() => handleDelete(item.id)}
                  disabled={isDeleting === item.id || editingId !== null}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-wrap gap-3">
        <input
          className="rf-input flex-1 min-w-[120px]"
          type="text"
          placeholder="Liability name"
          value={liabilityName}
          onChange={(e) => setLiabilityName(e.target.value)}
          disabled={isAdding}
        />
        <input
          className="rf-input flex-1 min-w-[120px]"
          type="number"
          placeholder="Total Cost"
          step="0.01"
          value={liabilityAmount}
          onChange={(e) => setLiabilityAmount(e.target.value)}
          disabled={isAdding || isUpdating !== null}
        />
        {editingId !== null ? (
          <div className="rf-edit-actions w-full">
            <button 
              type="button" 
              className="rf-btn-save"
              onClick={handleUpdate}
              disabled={isUpdating !== null || !liabilityName.trim() || !liabilityAmount.trim()}
            >
              {isUpdating === editingId ? "Saving..." : "Save"}
            </button>
            <button 
              type="button" 
              className="rf-btn-cancel"
              onClick={handleCancelEdit}
              disabled={isUpdating !== null}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button 
            className="rf-btn-primary w-full" 
            type="submit" 
            disabled={isAdding}
          >
            {isAdding ? "Adding..." : "Add Liability"}
          </button>
        )}
      </form>
    </div>
  );
};

export default LiabilitiesSection;