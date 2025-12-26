import React, { useState } from 'react';
import { useFinancialSummary } from '../../hooks/queries/useFinancialSummary';
import { useCashSavingsQuery, useUpdateCashSavingsMutation } from '../../hooks/queries/useCashSavings';
import { useCurrency } from '../../context/CurrencyContext';
import { formatCurrency } from '../../utils/currency.utils';

type Props = {
  balanceSheetVisible?: boolean;
};

/**
 * Skeleton component for loading states
 */
const Skeleton: React.FC<{ width?: string; height?: string; className?: string }> = ({
  width = '100%',
  height = '1.2em',
  className = '',
}) => (
  <span
    className={`inline-block bg-white/10 rounded animate-pulse ${className}`}
    style={{ width, height, verticalAlign: 'middle' }}
    aria-hidden="true"
  />
);

const SummarySection: React.FC<Props> = ({
  balanceSheetVisible = false,
}) => {
  const { currency } = useCurrency();
  
  // Use the new React Query hooks
  const {
    totalIncome,
    totalExpenses,
    cashflow,
    netWorth,
    totalAssets,
    totalLiabilities,
    passiveAndPortfolioIncome,
    progressPercent,
    cashSavings,
    isLoading,
    isError,
    error,
  } = useFinancialSummary();

  // Cash savings query and mutation for editing
  const { isLoading: cashSavingsLoading } = useCashSavingsQuery();
  const updateCashSavingsMutation = useUpdateCashSavingsMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string>('0');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleEditClick = () => {
    setIsEditing(true);
    setEditValue(cashSavings.toString());
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditValue(cashSavings.toString());
    setLocalError(null);
  };

  const handleSaveClick = async () => {
    const numValue = parseFloat(editValue);
    
    if (isNaN(numValue) || numValue < 0) {
      setLocalError('Please enter a valid positive number');
      return;
    }

    try {
      setLocalError(null);
      await updateCashSavingsMutation.mutateAsync({ amount: numValue });
      setIsEditing(false);
    } catch (err: unknown) {
      setLocalError('Failed to update cash savings');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
    setLocalError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveClick();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };
  
  // Computed display values
  const shouldShowNetWorth = balanceSheetVisible && (totalAssets > 0 || totalLiabilities > 0);
  const displayError = localError || (isError && error instanceof Error ? error.message : null);
  const saving = updateCashSavingsMutation.isPending;

  return (
    <section className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Section Header */}
      <div 
        className="py-4 px-8 text-center font-bold text-white shrink-0"
        style={{
          background: 'linear-gradient(135deg, var(--color-purple) 0%, var(--color-purple-light) 100%)',
          borderRadius: '8px 8px 0 0',
          fontSize: 'clamp(1.25rem, 3vw + 0.5rem, 1.8rem)'
        }}
      >
        <h2 className="m-0">Summary</h2>
      </div>

      {/* Content */}
      <div 
        className="flex-1 p-8 min-h-0 overflow-y-auto"
        style={{ backgroundColor: 'var(--color-dark)' }}
      >
        {/* Progress block tracking passive + portfolio income */}
        <div className="w-full max-w-[820px] mx-auto mb-5 flex flex-col gap-2">
          <div className="flex justify-between items-center text-[#e8e8f0] text-[0.95rem] font-semibold">
            <span className="opacity-90">Passive + Portfolio Income</span>
            <span className="bg-white/5 py-1 px-2.5 rounded-full font-bold text-white text-[0.95rem]">
              {isLoading ? <Skeleton width="80px" /> : formatCurrency(passiveAndPortfolioIncome, currency)}
            </span>
          </div>

          <div
            className="rf-progress-track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercent}
            aria-label="Passive and portfolio income progress"
          >
            <div
              className="rf-progress-fill"
              style={{ width: `${isLoading ? 0 : progressPercent}%` }}
              aria-hidden="true"
            />
          </div>

          <div className="flex justify-between text-[0.85rem] items-center">
            <span className="font-bold text-white">
              {isLoading ? <Skeleton width="30px" /> : `${progressPercent}%`}
            </span>
            <span style={{ color: 'var(--color-gold)' }}>
              of {isLoading ? <Skeleton width="60px" /> : formatCurrency(totalExpenses, currency)} (Total Expenses)
            </span>
          </div>
        </div>

        {/* Bar chart showing Total Income, Total Expenses, and Cashflow */}
        <div className="rf-graph-card" aria-hidden={false}>
          <div className="flex flex-col gap-3 py-1">
            <div className="rf-hbar">
              <div className="rf-hbar-label">Total Income</div>
              <div
                className="rf-hbar-track"
                role="img"
                aria-label={`Total income ${totalIncome}`}
              >
                <div
                  className="rf-hbar-fill rf-hbar-fill-income"
                  style={{ width: `${totalIncome > 0 ? 100 : 0}%` }}
                  aria-hidden="true"
                />
              </div>
              <div className="rf-hbar-value">
                {isLoading ? <Skeleton width="70px" /> : formatCurrency(totalIncome, currency)}
              </div>
            </div>

            <div className="rf-hbar">
              <div className="rf-hbar-label">Total Expenses</div>
              <div
                className="rf-hbar-track"
                role="img"
                aria-label={`Total expenses ${totalExpenses}`}
              >
                <div
                  className="rf-hbar-fill rf-hbar-fill-expense"
                  style={{ width: `${totalExpenses > 0 ? Math.min(100, (totalExpenses / Math.max(totalIncome, totalExpenses, 1)) * 100) : 0}%` }}
                  aria-hidden="true"
                />
              </div>
              <div className="rf-hbar-value">
                {isLoading ? <Skeleton width="70px" /> : formatCurrency(totalExpenses, currency)}
              </div>
            </div>
          </div>

          {/* Cashflow row inside the same card */}
          <div
            className={`rf-total-row ${cashflow < 0 ? 'rf-total-negative' : 'rf-total-positive'}`}
          >
            <div className="rf-total-label">Cashflow</div>
            <div className="rf-total-amount">
              {isLoading ? (
                <Skeleton width="80px" />
              ) : (
                <>
                  {formatCurrency(Math.abs(cashflow), currency)}
                  {cashflow < 0 && ' (deficit)'}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Net Worth row - only shown when balance sheet is visible and there's data */}
        {shouldShowNetWorth && (
          <div className="rf-graph-card" aria-hidden={!shouldShowNetWorth}>
            {/* Horizontal bars for Assets / Liabilities to mirror Income/Expenses visuals */}
            <div className="flex flex-col gap-3 mb-3">
              <div className="rf-hbar">
                <div className="rf-hbar-label">Total Assets</div>
                <div
                  className="rf-hbar-track"
                  role="img"
                  aria-label={`Total assets ${totalAssets}`}
                >
                  <div
                    className="rf-hbar-fill rf-hbar-fill-asset h-full"
                    style={{ width: `${totalAssets > 0 ? Math.min(100, (totalAssets / Math.max(totalAssets, totalLiabilities, 1)) * 100) : 0}%` }}
                    aria-hidden="true"
                  />
                </div>
                <div className="rf-hbar-value">
                  {isLoading ? <Skeleton width="70px" /> : formatCurrency(totalAssets, currency)}
                </div>
              </div>

              <div className="rf-hbar">
                <div className="rf-hbar-label">Total Liabilities</div>
                <div
                  className="rf-hbar-track"
                  role="img"
                  aria-label={`Total liabilities ${totalLiabilities}`}
                >
                  <div
                    className="rf-hbar-fill rf-hbar-fill-liability h-full"
                    style={{ width: `${totalLiabilities > 0 ? Math.min(100, (totalLiabilities / Math.max(totalAssets, totalLiabilities, 1)) * 100) : 0}%` }}
                    aria-hidden="true"
                  />
                </div>
                <div className="rf-hbar-value">
                  {isLoading ? <Skeleton width="70px" /> : formatCurrency(totalLiabilities, currency)}
                </div>
              </div>
            </div>

            <div 
              className={`rf-total-row font-bold ${netWorth < 0 ? 'rf-total-negative' : 'rf-total-positive'}`}
              style={{
                border: '1px solid rgba(255,255,255,0.03)',
                padding: '12px 14px',
                background: 'linear-gradient(90deg, rgba(115,69,175,0.06), rgba(157,109,212,0.03))'
              }}
            >
              <div className="rf-total-label">
                Net Worth
              </div>
              <div className="rf-total-amount bg-white/5 py-1.5 px-3 rounded-md">
                {isLoading ? (
                  <Skeleton width="80px" />
                ) : (
                  <>
                    {formatCurrency(Math.abs(netWorth), currency)}
                    {netWorth < 0 && ' (negative)'}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom savings row - User-editable, not auto-calculated */}
      <div className="rf-savings-bar shrink-0 mt-auto">
        <span className="rf-savings-label">Cash / Savings</span>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <span className="rf-savings-amount">
                {cashSavingsLoading ? <Skeleton width="80px" /> : formatCurrency(cashSavings, currency)}
              </span>
              {!cashSavingsLoading && (
                <button 
                  className="bg-white/5 border border-white/10 text-[#c69df7] py-1.5 px-2 rounded cursor-pointer text-[0.9rem] transition-all duration-200 hover:bg-white/10 hover:scale-105" 
                  onClick={handleEditClick}
                  aria-label="Edit cash savings"
                >
                  Edit
                </button>
              )}
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                className="bg-white/8 border border-white/15 text-white py-1.5 px-2.5 rounded text-[0.95rem] font-bold w-[120px] outline-none transition-all duration-200 focus:bg-white/12 focus:border-(--color-purple) focus:shadow-[0_0_0_2px_rgba(115,69,175,0.2)] disabled:opacity-60 disabled:cursor-not-allowed"
                value={editValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="0"
                min="0"
                step="0.01"
                autoFocus
                disabled={saving}
              />
              <button 
                className="py-1.5 px-3 rounded cursor-pointer text-base font-bold transition-all duration-200 border text-white disabled:opacity-60 disabled:cursor-not-allowed hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, var(--color-purple) 0%, var(--color-purple-light) 100%)',
                  borderColor: 'rgba(115,69,175,0.6)',
                  boxShadow: '0 2px 8px rgba(115,69,175,0.2)'
                }}
                onClick={handleSaveClick}
                disabled={saving}
              >
                {saving ? '...' : '✓'}
              </button>
              <button 
                className="bg-white/5 border border-white/15 py-1.5 px-3 rounded cursor-pointer text-base font-bold transition-all duration-200 hover:bg-white/10 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ color: 'var(--color-gold)' }}
                onClick={handleCancelEdit}
                disabled={saving}
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>
      {displayError && (
        <div className="rf-error -mt-2">
          {displayError}
        </div>
      )}
    </section>
  );
};

export default SummarySection;
