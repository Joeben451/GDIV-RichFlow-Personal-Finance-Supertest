import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';
import { Currency } from '../../types/currency.types';
import { formatCurrency, formatCurrencyCompact } from '../../utils/currency.utils';

interface AdminUserFinancialViewProps {
  userId: number;
  userName: string;
  onBack: () => void;
}

interface Asset {
  id: number;
  name: string;
  value: number;
}

interface Liability {
  id: number;
  name: string;
  value: number;
}

interface BalanceSheet {
  id: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  assets: Asset[];
  liabilities: Liability[];
}

interface Expense {
  id: number;
  name: string;
  amount: number;
}

interface IncomeStatement {
  id: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  expenses: Expense[];
}

interface CashSavings {
  id: number;
  userId: number;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

interface Income {
  id: number;
  name: string;
  amount: number;
  type: string;
}

interface FinancialData {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    createdAt: string;
    lastLogin: string | null;
    preferredCurrency: Currency | null;
  };
  balanceSheet: BalanceSheet | null;
  incomeStatement: IncomeStatement | null;
  cashSavings: CashSavings | null;
  income: Income[];
}

const AdminUserFinancialView: React.FC<AdminUserFinancialViewProps> = ({ userId, userName, onBack }) => {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userCurrency, setUserCurrency] = useState<Currency | null>(null);

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await adminAPI.getUserFinancials(userId);
        const data = response.data || response;
        setFinancialData(data);
        // Set user's preferred currency
        if (data.user?.preferredCurrency) {
          setUserCurrency(data.user.preferredCurrency);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch financial data');
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, [userId]);

  if (loading) {
    return (
      <div className="w-full pb-16 min-h-screen text-white">
        <div className="mb-8">
          <button className="rf-btn-primary w-auto px-4 py-2 mb-4" onClick={onBack}>← Back to Users</button>
          <h2 className="text-xl font-bold text-(--color-gold)">Loading financial data...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full pb-16 min-h-screen text-white">
        <div className="mb-8">
          <button className="rf-btn-primary w-auto px-4 py-2 mb-4" onClick={onBack}>← Back to Users</button>
          <h2 className="text-xl font-bold text-(--color-gold)">Error Loading Data</h2>
        </div>
        <div className="rf-error">{error}</div>
      </div>
    );
  }

  if (!financialData) {
    return (
      <div className="w-full pb-16 min-h-screen text-white">
        <div className="mb-8">
          <button className="rf-btn-primary w-auto px-4 py-2 mb-4" onClick={onBack}>← Back to Users</button>
          <h2 className="text-xl font-bold text-(--color-gold)">No Data Available</h2>
        </div>
      </div>
    );
  }

  // Calculate totals - ensure values are converted to numbers (API may return strings)
  const totalAssets = financialData.balanceSheet?.assets.reduce((sum, asset) => sum + Number(asset.value), 0) || 0;
  const totalLiabilities = financialData.balanceSheet?.liabilities.reduce((sum, liability) => sum + Number(liability.value), 0) || 0;
  const netWorth = totalAssets - totalLiabilities;

  const earnedIncome = financialData.income?.filter(i => i.type === 'Earned') || [];
  const portfolioIncome = financialData.income?.filter(i => i.type === 'Portfolio') || [];
  const passiveIncome = financialData.income?.filter(i => i.type === 'Passive') || [];
  
  const totalEarnedIncome = earnedIncome.reduce((sum, i) => sum + Number(i.amount), 0);
  const totalPortfolioIncome = portfolioIncome.reduce((sum, i) => sum + Number(i.amount), 0);
  const totalPassiveIncome = passiveIncome.reduce((sum, i) => sum + Number(i.amount), 0);
  const totalIncome = totalEarnedIncome + totalPortfolioIncome + totalPassiveIncome;

  const expenses = financialData.incomeStatement?.expenses || [];
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const cashflow = totalIncome - totalExpenses;

  const cashSavings = Number(financialData.cashSavings?.amount) || 0;

  return (
    <div className="w-full pb-16 min-h-screen text-white">
      {/* Header with back button and user info */}
      <div className="mb-6">
        <button 
          className="inline-flex items-center gap-2 text-sm text-(--color-text-muted) hover:text-(--color-gold) transition-colors mb-4" 
          onClick={onBack}
        >
          <span>←</span>
          <span>Back to Users</span>
        </button>
        
        <div className="rf-card">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-linear-to-br from-(--color-purple) to-(--color-purple-light) flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-lg">{userName.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-(--color-gold)">{userName}</h2>
              <p className="text-sm text-(--color-text-muted)">{financialData.user.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-(--color-border)">
            <div className="flex flex-col">
              <span className="text-[10px] text-(--color-text-dim) uppercase tracking-wider">User ID</span>
              <span className="text-sm font-medium text-white">#{financialData.user.id}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-(--color-text-dim) uppercase tracking-wider">Created</span>
              <span className="text-sm font-medium text-white">{new Date(financialData.user.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-(--color-text-dim) uppercase tracking-wider">Last Login</span>
              <span className="text-sm font-medium text-white">
                {financialData.user.lastLogin ? new Date(financialData.user.lastLogin).toLocaleDateString() : 'Never'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-(--color-text-dim) uppercase tracking-wider">Currency</span>
              <span className="text-sm font-medium text-white">{userCurrency?.cur_code || 'USD'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <div className="rf-card overflow-hidden">
          <div className="text-xs text-(--color-text-muted) uppercase tracking-wider mb-2">Total Income</div>
          <div className="text-lg font-bold text-(--color-success)" title={formatCurrency(totalIncome, userCurrency)}>{formatCurrencyCompact(totalIncome, userCurrency)}</div>
        </div>
        <div className="rf-card overflow-hidden">
          <div className="text-xs text-(--color-text-muted) uppercase tracking-wider mb-2">Total Expenses</div>
          <div className="text-lg font-bold text-(--color-error)" title={formatCurrency(totalExpenses, userCurrency)}>{formatCurrencyCompact(totalExpenses, userCurrency)}</div>
        </div>
        <div className="rf-card overflow-hidden">
          <div className="text-xs text-(--color-text-muted) uppercase tracking-wider mb-2">Cashflow</div>
          <div className={`text-lg font-bold ${cashflow >= 0 ? 'text-(--color-success)' : 'text-(--color-error)'}`} title={formatCurrency(cashflow, userCurrency)}>
            {formatCurrencyCompact(cashflow, userCurrency)}
            {cashflow < 0 && ' (deficit)'}
          </div>
        </div>
        <div className="rf-card overflow-hidden">
          <div className="text-xs text-(--color-text-muted) uppercase tracking-wider mb-2">Cash/Savings</div>
          <div className="text-lg font-bold text-(--color-gold)" title={formatCurrency(cashSavings, userCurrency)}>{formatCurrencyCompact(cashSavings, userCurrency)}</div>
        </div>
        {financialData.balanceSheet && (
          <>
            <div className="rf-card overflow-hidden">
              <div className="text-xs text-(--color-text-muted) uppercase tracking-wider mb-2">Total Assets</div>
              <div className="text-lg font-bold text-(--color-purple)" title={formatCurrency(totalAssets, userCurrency)}>{formatCurrencyCompact(totalAssets, userCurrency)}</div>
            </div>
            <div className="rf-card overflow-hidden">
              <div className="text-xs text-(--color-text-muted) uppercase tracking-wider mb-2">Total Liabilities</div>
              <div className="text-lg font-bold text-(--color-expense-red)" title={formatCurrency(totalLiabilities, userCurrency)}>{formatCurrencyCompact(totalLiabilities, userCurrency)}</div>
            </div>
            <div className="rf-card overflow-hidden">
              <div className="text-xs text-(--color-text-muted) uppercase tracking-wider mb-2">Net Worth</div>
              <div className={`text-lg font-bold ${netWorth >= 0 ? 'text-(--color-success)' : 'text-(--color-error)'}`} title={formatCurrency(netWorth, userCurrency)}>
                {formatCurrencyCompact(netWorth, userCurrency)}
                {netWorth < 0 && ' (negative)'}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Data Tables */}
      <div className="mb-8">
        <h3 className="rf-section-header-sm">Income Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rf-card">
            <h4 className="text-base font-semibold text-(--color-purple) mb-3">Earned Income</h4>
            {earnedIncome.length > 0 ? (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-(--color-border)">
                    <th className="py-2 px-3 text-left text-xs text-(--color-text-muted) uppercase">Name</th>
                    <th className="py-2 px-3 text-right text-xs text-(--color-text-muted) uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {earnedIncome.map((income) => (
                    <tr key={income.id} className="border-b border-(--color-border)/50">
                      <td className="py-2 px-3 text-sm text-white">{income.name}</td>
                      <td className="py-2 px-3 text-sm text-white text-right">{formatCurrency(income.amount, userCurrency)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-(--color-dark)">
                    <td className="py-2 px-3 text-sm font-semibold text-(--color-gold)">Total</td>
                    <td className="py-2 px-3 text-sm font-semibold text-(--color-gold) text-right">{formatCurrencyCompact(totalEarnedIncome, userCurrency)}</td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <p className="rf-empty">No earned income recorded</p>
            )}
          </div>

          <div className="rf-card">
            <h4 className="text-base font-semibold text-(--color-purple) mb-3">Portfolio Income</h4>
            {portfolioIncome.length > 0 ? (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-(--color-border)">
                    <th className="py-2 px-3 text-left text-xs text-(--color-text-muted) uppercase">Name</th>
                    <th className="py-2 px-3 text-right text-xs text-(--color-text-muted) uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolioIncome.map((income) => (
                    <tr key={income.id} className="border-b border-(--color-border)/50">
                      <td className="py-2 px-3 text-sm text-white">{income.name}</td>
                      <td className="py-2 px-3 text-sm text-white text-right">{formatCurrency(income.amount, userCurrency)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-(--color-dark)">
                    <td className="py-2 px-3 text-sm font-semibold text-(--color-gold)">Total</td>
                    <td className="py-2 px-3 text-sm font-semibold text-(--color-gold) text-right">{formatCurrencyCompact(totalPortfolioIncome, userCurrency)}</td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <p className="rf-empty">No portfolio income recorded</p>
            )}
          </div>

          <div className="rf-card">
            <h4 className="text-base font-semibold text-(--color-purple) mb-3">Passive Income</h4>
            {passiveIncome.length > 0 ? (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-(--color-border)">
                    <th className="py-2 px-3 text-left text-xs text-(--color-text-muted) uppercase">Name</th>
                    <th className="py-2 px-3 text-right text-xs text-(--color-text-muted) uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {passiveIncome.map((income) => (
                    <tr key={income.id} className="border-b border-(--color-border)/50">
                      <td className="py-2 px-3 text-sm text-white">{income.name}</td>
                      <td className="py-2 px-3 text-sm text-white text-right">{formatCurrency(income.amount, userCurrency)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-(--color-dark)">
                    <td className="py-2 px-3 text-sm font-semibold text-(--color-gold)">Total</td>
                    <td className="py-2 px-3 text-sm font-semibold text-(--color-gold) text-right">{formatCurrencyCompact(totalPassiveIncome, userCurrency)}</td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <p className="rf-empty">No passive income recorded</p>
            )}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="rf-section-header-sm">Expenses</h3>
        <div className="rf-card">
          {expenses.length > 0 ? (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-(--color-border)">
                  <th className="py-2 px-3 text-left text-xs text-(--color-text-muted) uppercase">Name</th>
                  <th className="py-2 px-3 text-right text-xs text-(--color-text-muted) uppercase">Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-(--color-border)/50">
                    <td className="py-2 px-3 text-sm text-white">{expense.name}</td>
                    <td className="py-2 px-3 text-sm text-white text-right">{formatCurrency(expense.amount, userCurrency)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-(--color-dark)">
                  <td className="py-2 px-3 text-sm font-semibold text-(--color-gold)">Total</td>
                  <td className="py-2 px-3 text-sm font-semibold text-(--color-gold) text-right">{formatCurrencyCompact(totalExpenses, userCurrency)}</td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <p className="rf-empty">No expenses recorded</p>
          )}
        </div>
      </div>

      {/* Balance Sheet Section */}
      {financialData.balanceSheet ? (
        <div className="mb-8">
          <h3 className="rf-section-header-sm">Balance Sheet</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rf-card">
              <h4 className="text-base font-semibold text-(--color-purple) mb-3">Assets</h4>
              {financialData.balanceSheet.assets.length > 0 ? (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-(--color-border)">
                      <th className="py-2 px-3 text-left text-xs text-(--color-text-muted) uppercase">Name</th>
                      <th className="py-2 px-3 text-right text-xs text-(--color-text-muted) uppercase">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financialData.balanceSheet.assets.map((asset) => (
                      <tr key={asset.id} className="border-b border-(--color-border)/50">
                        <td className="py-2 px-3 text-sm text-white">{asset.name}</td>
                        <td className="py-2 px-3 text-sm text-white text-right">{formatCurrency(asset.value, userCurrency)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-(--color-dark)">
                      <td className="py-2 px-3 text-sm font-semibold text-(--color-gold)">Total Assets</td>
                      <td className="py-2 px-3 text-sm font-semibold text-(--color-gold) text-right">{formatCurrencyCompact(totalAssets, userCurrency)}</td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <p className="rf-empty">No assets recorded</p>
              )}
            </div>

            <div className="rf-card">
              <h4 className="text-base font-semibold text-(--color-purple) mb-3">Liabilities</h4>
              {financialData.balanceSheet.liabilities.length > 0 ? (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-(--color-border)">
                      <th className="py-2 px-3 text-left text-xs text-(--color-text-muted) uppercase">Name</th>
                      <th className="py-2 px-3 text-right text-xs text-(--color-text-muted) uppercase">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financialData.balanceSheet.liabilities.map((liability) => (
                      <tr key={liability.id} className="border-b border-(--color-border)/50">
                        <td className="py-2 px-3 text-sm text-white">{liability.name}</td>
                        <td className="py-2 px-3 text-sm text-white text-right">{formatCurrency(liability.value, userCurrency)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-(--color-dark)">
                      <td className="py-2 px-3 text-sm font-semibold text-(--color-gold)">Total Liabilities</td>
                      <td className="py-2 px-3 text-sm font-semibold text-(--color-gold) text-right">{formatCurrencyCompact(totalLiabilities, userCurrency)}</td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <p className="rf-empty">No liabilities recorded</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8">
          <h3 className="rf-section-header-sm">Balance Sheet</h3>
          <div className="rf-card text-center">
            <p className="rf-empty">This user has not created a balance sheet yet.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserFinancialView;
