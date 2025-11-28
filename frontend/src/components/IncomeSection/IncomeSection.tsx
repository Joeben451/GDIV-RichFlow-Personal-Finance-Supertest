import React, { useState, useEffect } from "react";
import { incomeAPI } from "../../utils/api";
import "./IncomeSection.css";
import { passiveIncomeStore } from "../../state/passiveIncomeStore";
import { incomeTotalsStore } from "../../state/incomeTotalsStore";
import { useFinancialData } from "../../context/FinancialDataContext";
import { useAuth } from "../../context/AuthContext";
import { useCurrency } from "../../context/CurrencyContext";
import { formatCurrency } from "../../utils/currency.utils";

type IncomeQuadrant = 'EMPLOYEE' | 'SELF_EMPLOYED' | 'BUSINESS_OWNER' | 'INVESTOR';

interface IncomeItem {
  id: number;
  name: string;
  amount: number;
  type: 'Earned' | 'Portfolio' | 'Passive';
  quadrant?: IncomeQuadrant;
}

const quadrantBySection: Record<'earned' | 'portfolio' | 'passive', IncomeQuadrant> = {
  earned: 'EMPLOYEE',
  portfolio: 'INVESTOR',
  passive: 'BUSINESS_OWNER'
};

const typeQuadrantFallback: Record<'Earned' | 'Portfolio' | 'Passive', IncomeQuadrant> = {
  Earned: 'EMPLOYEE',
  Portfolio: 'INVESTOR',
  Passive: 'BUSINESS_OWNER'
};

const normalizeQuadrant = (value: any, fallback: IncomeQuadrant): IncomeQuadrant => {
  if (typeof value === 'string') {
    const normalized = value.trim().toUpperCase();
    if (['EMPLOYEE', 'SELF_EMPLOYED', 'BUSINESS_OWNER', 'INVESTOR'].includes(normalized)) {
      return normalized as IncomeQuadrant;
    }
  }
  return fallback;
};

const formatQuadrantLabel = (quadrant?: IncomeQuadrant) => {
  switch (quadrant) {
    case 'SELF_EMPLOYED':
      return 'Self-Employed';
    case 'BUSINESS_OWNER':
      return 'Business Owner';
    case 'INVESTOR':
      return 'Investor';
    case 'EMPLOYEE':
    default:
      return 'Employee';
  }
};

const IncomeSection: React.FC = () => {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const [earnedIncome, setEarnedIncome] = useState<IncomeItem[]>([]);
  const [portfolioIncome, setPortfolioIncome] = useState<IncomeItem[]>([]);
  const [passiveIncome, setPassiveIncome] = useState<IncomeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<IncomeItem | null>(null);
  const { triggerDataUpdate } = useFinancialData();

  // Fetch income data on component mount
  useEffect(() => {
    fetchIncomeData();
  }, []);

  const fetchIncomeData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await incomeAPI.getIncomeLines();
      
      // Ensure response is an array
      const incomeLines = Array.isArray(response) ? response : [];
      
      // Group income by type with proper typing (case-insensitive comparison)
      const earned = incomeLines.filter((item: any) => item.type?.toUpperCase() === 'EARNED').map((item: any) => ({
        id: item.id,
        name: item.name,
        amount: typeof item.amount === 'number' ? item.amount : parseFloat(item.amount),
        type: 'Earned' as 'Earned',
        quadrant: normalizeQuadrant(item.quadrant, typeQuadrantFallback.Earned)
      }));
      
      const portfolio = incomeLines.filter((item: any) => item.type?.toUpperCase() === 'PORTFOLIO').map((item: any) => ({
        id: item.id,
        name: item.name,
        amount: typeof item.amount === 'number' ? item.amount : parseFloat(item.amount),
        type: 'Portfolio' as 'Portfolio',
        quadrant: normalizeQuadrant(item.quadrant, typeQuadrantFallback.Portfolio)
      }));
      
      const passive = incomeLines.filter((item: any) => item.type?.toUpperCase() === 'PASSIVE').map((item: any) => ({
        id: item.id,
        name: item.name,
        amount: typeof item.amount === 'number' ? item.amount : parseFloat(item.amount),
        type: 'Passive' as 'Passive',
        quadrant: normalizeQuadrant(item.quadrant, typeQuadrantFallback.Passive)
      }));
      
      setEarnedIncome(earned);
      setPortfolioIncome(portfolio);
      setPassiveIncome(passive);
      // Update shared passive income total
      const passiveTotal = passive.reduce((sum, item) => sum + item.amount, 0);
      passiveIncomeStore.set(passiveTotal);
      // Update income totals store
      const earnedTotal = earned.reduce((sum, item) => sum + item.amount, 0);
      const portfolioTotal = portfolio.reduce((sum, item) => sum + item.amount, 0);
      incomeTotalsStore.replace({ earned: earnedTotal, portfolio: portfolioTotal, passive: passiveTotal });
    } catch (err: any) {
      setError('Failed to load income data');
      // Set empty arrays on error
      setEarnedIncome([]);
      setPortfolioIncome([]);
      setPassiveIncome([]);
      passiveIncomeStore.set(0);
      incomeTotalsStore.replace({ earned: 0, portfolio: 0, passive: 0 });
    } finally {
      setLoading(false);
    }
  };

  // handle add income
  const handleAddIncome = async (
    section: "earned" | "portfolio" | "passive",
    name: string,
    amount: string,
    quadrantOverride?: IncomeQuadrant
  ) => {
    if (!name.trim() || !amount.trim() || isAdding) return;
    
    try {
      setIsAdding(true);
      setError(null);
      const type = section.charAt(0).toUpperCase() + section.slice(1) as 'Earned' | 'Portfolio' | 'Passive';
      const fallbackQuadrant = quadrantBySection[section];
      const resolvedQuadrant = section === 'earned'
        ? (quadrantOverride || fallbackQuadrant)
        : fallbackQuadrant;
      const response = await incomeAPI.addIncomeLine(name, parseFloat(amount), type, resolvedQuadrant);
      
      // Backend returns { message, incomeLine }, so extract the incomeLine
      const incomeLineData = response.incomeLine || response;
      const newItem: IncomeItem = {
        id: incomeLineData.id,
        name: incomeLineData.name,
        amount: incomeLineData.amount,
        type,
        quadrant: normalizeQuadrant(incomeLineData.quadrant, resolvedQuadrant)
      };

      if (section === "earned") {
        const next = [...earnedIncome, newItem];
        setEarnedIncome(next);
        const earnedTotal = next.reduce((s, i) => s + i.amount, 0);
        incomeTotalsStore.set({ earned: earnedTotal });
      }
      if (section === "portfolio") {
        const next = [...portfolioIncome, newItem];
        setPortfolioIncome(next);
        const portfolioTotal = next.reduce((s, i) => s + i.amount, 0);
        incomeTotalsStore.set({ portfolio: portfolioTotal });
      }
      if (section === "passive") {
        const next = [...passiveIncome, newItem];
        setPassiveIncome(next);
        // Update shared passive income total
        const passiveTotal = next.reduce((sum, item) => sum + item.amount, 0);
        passiveIncomeStore.set(passiveTotal);
        incomeTotalsStore.set({ passive: passiveTotal });
      }
      
      // Trigger financial data update for AI insights
      triggerDataUpdate();
    } catch (err: any) {
      setError('Failed to add income');
    } finally {
      setIsAdding(false);
    }
  };

  // handle update income
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
      setError(null);
      const fallbackQuadrant = typeQuadrantFallback[type];
      const resolvedQuadrant = quadrantOverride || fallbackQuadrant;
      const response = await incomeAPI.updateIncomeLine(id, name, amount, type, resolvedQuadrant);
      const updatedItemResponse = response.incomeLine || response;
      const updatedItem: IncomeItem = {
        id: updatedItemResponse.id,
        name: updatedItemResponse.name,
        amount: updatedItemResponse.amount,
        type: updatedItemResponse.type,
        quadrant: normalizeQuadrant(updatedItemResponse.quadrant, resolvedQuadrant)
      };
      
      const section = type.toLowerCase() as "earned" | "portfolio" | "passive";
      
      if (section === "earned") {
        const next = earnedIncome.map((i) => i.id === id ? updatedItem : i);
        setEarnedIncome(next);
        const earnedTotal = next.reduce((s, i) => s + i.amount, 0);
        incomeTotalsStore.set({ earned: earnedTotal });
      }
      if (section === "portfolio") {
        const next = portfolioIncome.map((i) => i.id === id ? updatedItem : i);
        setPortfolioIncome(next);
        const portfolioTotal = next.reduce((s, i) => s + i.amount, 0);
        incomeTotalsStore.set({ portfolio: portfolioTotal });
      }
      if (section === "passive") {
        const next = passiveIncome.map((i) => i.id === id ? updatedItem : i);
        setPassiveIncome(next);
        const passiveTotal = next.reduce((sum, item) => sum + item.amount, 0);
        passiveIncomeStore.set(passiveTotal);
        incomeTotalsStore.set({ passive: passiveTotal });
      }
      
      setEditingItem(null);
      triggerDataUpdate();
    } catch (err: any) {
      setError('Failed to update income');
    } finally {
      setIsUpdating(null);
    }
  };

  // handle delete income
  const handleDelete = async (section: "earned" | "portfolio" | "passive", id: number) => {
    if (isDeleting !== null) return; // Prevent multiple simultaneous deletes
    
    try {
      setIsDeleting(id);
      setError(null);
      await incomeAPI.deleteIncomeLine(id);
      
      if (section === "earned") {
        const next = earnedIncome.filter((i) => i.id !== id);
        setEarnedIncome(next);
        const earnedTotal = next.reduce((s, i) => s + i.amount, 0);
        incomeTotalsStore.set({ earned: earnedTotal });
      }
      if (section === "portfolio") {
        const next = portfolioIncome.filter((i) => i.id !== id);
        setPortfolioIncome(next);
        const portfolioTotal = next.reduce((s, i) => s + i.amount, 0);
        incomeTotalsStore.set({ portfolio: portfolioTotal });
      }
      if (section === "passive") {
        const next = passiveIncome.filter((i) => i.id !== id);
        setPassiveIncome(next);
        // Update shared passive income total
        const passiveTotal = next.reduce((sum, item) => sum + item.amount, 0);
        passiveIncomeStore.set(passiveTotal);
        incomeTotalsStore.set({ passive: passiveTotal });
      }
      
      // Trigger financial data update for AI insights
      triggerDataUpdate();
    } catch (err: any) {
      setError('Failed to delete income');
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
      <div className="income-card">
        <div className="income-card-header">{title}</div>

        {items.length === 0 ? (
          <p className="income-empty">No {title.toLowerCase()} added yet.</p>
        ) : (
          <div className="income-list">
            {items.map((item) => (
              <div key={item.id} className="income-item">
                <span>{item.name}</span>
                <span className="income-item-amount">
                  {formatCurrency(typeof item.amount === 'number' ? item.amount : 0, currency)}
                  
                </span>
                <div className="income-item-actions">
                  <button
                    className="edit-btn"
                    onClick={() => handleEdit(item)}
                    disabled={isUpdating !== null || isDeleting !== null || editingItem !== null}
                    title="Edit"
                  >
                    Edit
                  </button>
                  <button
                    className="delete-btn"
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

        <div className="income-inputs">
          <input
            type="text"
            placeholder="Source name"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          {isEarnedSection && (
            <select
              className="income-select"
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
          <p className="income-hint">
            Choose the quadrant to control whether this source shows as Employee or Self-Employed in the snapshot.
          </p>
        )}

        {isEditingCurrentSection ? (
          <div className="income-edit-actions">
            <button
              className="save-btn"
              onClick={handleSaveEdit}
              disabled={isUpdating !== null || !source.trim() || !amount.trim()}
            >
              {isUpdating === editingItem?.id ? 'Saving...' : 'Save'}
            </button>
            <button
              className="cancel-btn"
              onClick={handleCancelEdit}
              disabled={isUpdating !== null}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            className="add-btn"
            onClick={handleAddClick}
            disabled={isAdding || !source.trim() || !amount.trim() || editingItem !== null}
          >
            {isAdding ? 'Adding...' : `+ Add ${title}`}
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="income-container">
        <div className="income-header">Income</div>
        <div className="income-sections">
          <p style={{ textAlign: 'center', color: '#d4af37', padding: '20px' }}>Loading income data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="income-container">
      <div className="income-header">Income</div>
      
      {error && (
        <div style={{ 
          color: '#ff6b6b', 
          textAlign: 'center', 
          padding: '10px', 
          backgroundColor: 'rgba(255, 107, 107, 0.1)',
          borderRadius: '4px',
          margin: '10px 0'
        }}>
          {error}
        </div>
      )}

      <div className="income-sections">
        <IncomeCard title="Earned Income" items={earnedIncome} section="earned" />
        <IncomeCard title="Portfolio Income" items={portfolioIncome} section="portfolio" />
        <IncomeCard title="Passive Income" items={passiveIncome} section="passive" />
      </div>
    </div>
  );
};

export default IncomeSection;
