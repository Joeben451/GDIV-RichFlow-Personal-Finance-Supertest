import React, { useState } from "react";
import { useUnifiedFinancialData, AssetItem } from "../../hooks/useFinancialData";
import { useCurrency } from "../../context/CurrencyContext";
import { formatCurrency } from "../../utils/currency.utils";

const AssetsSection: React.FC = () => {
  const { currency } = useCurrency();
  
  // Use the unified financial data hook
  const {
    assets,
    loading,
    error,
    initialized,
    addAsset,
    updateAsset,
    deleteAsset,
  } = useUnifiedFinancialData();

  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  // handle add asset
  const handleAddAsset = async (name: string, amount: string) => {
    if (!name.trim() || !amount.trim() || isAdding) return;

    try {
      setIsAdding(true);
      setLocalError(null);
      await addAsset(name, parseFloat(amount));
    } catch (err: unknown) {
      setLocalError("Failed to add asset");
    } finally {
      setIsAdding(false);
    }
  };

  // handle edit asset
  const handleEdit = (id: number, name: string, value: number) => {
    setEditingId(id);
    setAssetName(name);
    setAssetAmount(value.toString());
  };

  // handle update asset
  const handleUpdate = async () => {
    if (!editingId || !assetName.trim() || !assetAmount.trim() || isUpdating !== null) return;

    try {
      setIsUpdating(editingId);
      setLocalError(null);
      await updateAsset(editingId, assetName, parseFloat(assetAmount));
      setEditingId(null);
      setAssetName("");
      setAssetAmount("");
    } catch (err: unknown) {
      setLocalError("Failed to update asset");
    } finally {
      setIsUpdating(null);
    }
  };

  // handle cancel edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setAssetName("");
    setAssetAmount("");
  };

  // handle delete asset
  const handleDelete = async (id: number) => {
    if (isDeleting !== null) return;

    try {
      setIsDeleting(id);
      setLocalError(null);
      await deleteAsset(id);
    } catch (err: unknown) {
      setLocalError("Failed to delete asset");
    } finally {
      setIsDeleting(null);
    }
  };

  const [assetName, setAssetName] = useState("");
  const [assetAmount, setAssetAmount] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId !== null) {
      await handleUpdate();
    } else {
      await handleAddAsset(assetName, assetAmount);
      setAssetName("");
      setAssetAmount("");
    }
  };

  if (loading && !initialized) {
    return <div className="rf-card">Loading...</div>;
  }

  const displayError = localError || error;

  return (
    <div className="rf-card text-white">
      <div className="rf-section-header">Assets</div>

      {displayError && <p className="rf-error">{displayError}</p>}

      {assets.length === 0 ? (
        <p className="rf-empty">No assets added yet.</p>
      ) : (
        <div className="rf-scroll-list">
          {assets.map((item) => (
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
          placeholder="Asset name"
          value={assetName}
          onChange={(e) => setAssetName(e.target.value)}
          disabled={isAdding}
        />
        <input
          className="rf-input flex-1 min-w-[120px]"
          type="number"
          placeholder="Total Value"
          step="0.01"
          value={assetAmount}
          onChange={(e) => setAssetAmount(e.target.value)}
          disabled={isAdding || isUpdating !== null}
        />
        {editingId !== null ? (
          <div className="rf-edit-actions w-full">
            <button 
              type="button" 
              className="rf-btn-save"
              onClick={handleUpdate}
              disabled={isUpdating !== null || !assetName.trim() || !assetAmount.trim()}
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
            {isAdding ? "Adding..." : "Add Asset"}
          </button>
        )}
      </form>
    </div>
  );
};

export default AssetsSection;