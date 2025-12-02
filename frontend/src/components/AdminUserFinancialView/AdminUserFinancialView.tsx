import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';
import { Currency } from '../../types/currency.types';
import { formatCurrency } from '../../utils/currency.utils';

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
      <div className="w-full p-5 pb-16 min-h-screen bg-black text-white">
        <div className="mb-8">
          <button className="inline-flex items-center gap-2 mb-4 py-2 px-4 rounded-lg cursor-pointer transition-all border-none bg-linear-to-br from-(--color-purple) to-[#9d6dd4] text-white text-sm font-semibold hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(115,69,175,0.4)]" onClick={onBack}>← Back to Users</button>
          <h2 className="text-xl font-bold text-(--color-gold)">Loading financial data...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-5 pb-16 min-h-screen bg-black text-white">
        <div className="mb-8">
          <button className="inline-flex items-center gap-2 mb-4 py-2 px-4 rounded-lg cursor-pointer transition-all border-none bg-linear-to-br from-(--color-purple) to-[#9d6dd4] text-white text-sm font-semibold hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(115,69,175,0.4)]" onClick={onBack}>← Back to Users</button>
          <h2 className="text-xl font-bold text-(--color-gold)">Error Loading Data</h2>
        </div>
        <div className="bg-red-900/30 border border-red-500 text-red-300 p-4 rounded-lg">{error}</div>
      </div>
    );
  }

  if (!financialData) {
    return (
      <div className="w-full p-5 pb-16 min-h-screen bg-black text-white">
        <div className="mb-8">
          <button className="inline-flex items-center gap-2 mb-4 py-2 px-4 rounded-lg cursor-pointer transition-all border-none bg-linear-to-br from-(--color-purple) to-[#9d6dd4] text-white text-sm font-semibold hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(115,69,175,0.4)]" onClick={onBack}>← Back to Users</button>
          <h2 className="text-xl font-bold text-(--color-gold)">No Data Available</h2>
        </div>
      </div>
    );
  }

  // Calculate totals
  const totalAssets = financialData.balanceSheet?.assets.reduce((sum, asset) => sum + asset.value, 0) || 0;
  const totalLiabilities = financialData.balanceSheet?.liabilities.reduce((sum, liability) => sum + liability.value, 0) || 0;
  const netWorth = totalAssets - totalLiabilities;

  const earnedIncome = financialData.income?.filter(i => i.type === 'Earned') || [];
  const portfolioIncome = financialData.income?.filter(i => i.type === 'Portfolio') || [];
  const passiveIncome = financialData.income?.filter(i => i.type === 'Passive') || [];
  
  const totalEarnedIncome = earnedIncome.reduce((sum, i) => sum + i.amount, 0);
  const totalPortfolioIncome = portfolioIncome.reduce((sum, i) => sum + i.amount, 0);
  const totalPassiveIncome = passiveIncome.reduce((sum, i) => sum + i.amount, 0);
  const totalIncome = totalEarnedIncome + totalPortfolioIncome + totalPassiveIncome;

  const expenses = financialData.incomeStatement?.expenses || [];
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const cashflow = totalIncome - totalExpenses;

  const cashSavings = financialData.cashSavings?.amount || 0;

  return (
    <div className="w-full p-5 pb-16 min-h-screen bg-black text-white">
      {/* Header with back button and user info */}
      <div className="mb-8">
        <button className="inline-flex items-center gap-2 mb-4 py-2 px-4 rounded-lg cursor-pointer transition-all border-none bg-linear-to-br from-(--color-purple) to-[#9d6dd4] text-white text-sm font-semibold hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(115,69,175,0.4)]" onClick={onBack}>← Back to Users</button>
        <div className="flex flex-wrap gap-6 p-4 bg-(--color-card) rounded-lg border border-(--color-border)">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-400 uppercase tracking-wider">Name</span>
            <span className="text-base font-semibold text-(--color-gold)">{userName}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-400 uppercase tracking-wider">Email</span>
            <span className="text-base font-semibold text-white">{financialData.user.email}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-400 uppercase tracking-wider">Created</span>
            <span className="text-base font-semibold text-white">{new Date(financialData.user.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-400 uppercase tracking-wider">Last Login</span>
            <span className="text-base font-semibold text-white">
              {financialData.user.lastLogin ? new Date(financialData.user.lastLogin).toLocaleDateString() : 'Never'}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-(--color-card) border border-(--color-border) rounded-xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(115,69,175,0.2)]">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Total Income</div>
          <div className="text-xl font-bold text-green-400">{formatCurrency(totalIncome, userCurrency)}</div>
        </div>
        <div className="bg-(--color-card) border border-(--color-border) rounded-xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(115,69,175,0.2)]">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Total Expenses</div>
          <div className="text-xl font-bold text-red-400">{formatCurrency(totalExpenses, userCurrency)}</div>
        </div>
        <div className="bg-(--color-card) border border-(--color-border) rounded-xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(115,69,175,0.2)]">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Cashflow</div>
          <div className={`text-xl font-bold ${cashflow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(Math.abs(cashflow), userCurrency)}
            {cashflow < 0 && ' (deficit)'}
          </div>
        </div>
        <div className="bg-(--color-card) border border-(--color-border) rounded-xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(115,69,175,0.2)]">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Cash/Savings</div>
          <div className="text-xl font-bold text-(--color-gold)">{formatCurrency(cashSavings, userCurrency)}</div>
        </div>
        {financialData.balanceSheet && (
          <>
            <div className="bg-(--color-card) border border-(--color-border) rounded-xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(115,69,175,0.2)]">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Total Assets</div>
              <div className="text-xl font-bold text-(--color-purple)">{formatCurrency(totalAssets, userCurrency)}</div>
            </div>
            <div className="bg-(--color-card) border border-(--color-border) rounded-xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(115,69,175,0.2)]">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Total Liabilities</div>
              <div className="text-xl font-bold text-orange-400">{formatCurrency(totalLiabilities, userCurrency)}</div>
            </div>
            <div className="bg-(--color-card) border border-(--color-border) rounded-xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(115,69,175,0.2)]">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Net Worth</div>
              <div className={`text-xl font-bold ${netWorth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(Math.abs(netWorth), userCurrency)}
                {netWorth < 0 && ' (negative)'}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Data Tables */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-(--color-gold) mb-4 pb-2 border-b border-(--color-border)">Income Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-(--color-card) border border-(--color-border) rounded-xl p-4">
            <h4 className="text-base font-semibold text-(--color-purple) mb-3">Earned Income</h4>
            {earnedIncome.length > 0 ? (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-(--color-border)">
                    <th className="py-2 px-3 text-left text-xs text-gray-400 uppercase">Name</th>
                    <th className="py-2 px-3 text-right text-xs text-gray-400 uppercase">Amount</th>
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
                    <td className="py-2 px-3 text-sm font-semibold text-(--color-gold) text-right">{formatCurrency(totalEarnedIncome, userCurrency)}</td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <p className="text-sm text-gray-500 italic">No earned income recorded</p>
            )}
          </div>

          <div className="bg-(--color-card) border border-(--color-border) rounded-xl p-4">
            <h4 className="text-base font-semibold text-(--color-purple) mb-3">Portfolio Income</h4>
            {portfolioIncome.length > 0 ? (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-(--color-border)">
                    <th className="py-2 px-3 text-left text-xs text-gray-400 uppercase">Name</th>
                    <th className="py-2 px-3 text-right text-xs text-gray-400 uppercase">Amount</th>
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
                    <td className="py-2 px-3 text-sm font-semibold text-(--color-gold) text-right">{formatCurrency(totalPortfolioIncome, userCurrency)}</td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <p className="text-sm text-gray-500 italic">No portfolio income recorded</p>
            )}
          </div>

          <div className="bg-(--color-card) border border-(--color-border) rounded-xl p-4">
            <h4 className="text-base font-semibold text-(--color-purple) mb-3">Passive Income</h4>
            {passiveIncome.length > 0 ? (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-(--color-border)">
                    <th className="py-2 px-3 text-left text-xs text-gray-400 uppercase">Name</th>
                    <th className="py-2 px-3 text-right text-xs text-gray-400 uppercase">Amount</th>
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
                    <td className="py-2 px-3 text-sm font-semibold text-(--color-gold) text-right">{formatCurrency(totalPassiveIncome, userCurrency)}</td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <p className="text-sm text-gray-500 italic">No passive income recorded</p>
            )}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-bold text-(--color-gold) mb-4 pb-2 border-b border-(--color-border)">Expenses</h3>
        <div className="bg-(--color-card) border border-(--color-border) rounded-xl p-4">
          {expenses.length > 0 ? (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-(--color-border)">
                  <th className="py-2 px-3 text-left text-xs text-gray-400 uppercase">Name</th>
                  <th className="py-2 px-3 text-right text-xs text-gray-400 uppercase">Amount</th>
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
                  <td className="py-2 px-3 text-sm font-semibold text-(--color-gold) text-right">{formatCurrency(totalExpenses, userCurrency)}</td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <p className="text-sm text-gray-500 italic">No expenses recorded</p>
          )}
        </div>
      </div>

      {/* Balance Sheet Section */}
      {financialData.balanceSheet ? (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-(--color-gold) mb-4 pb-2 border-b border-(--color-border)">Balance Sheet</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-(--color-card) border border-(--color-border) rounded-xl p-4">
              <h4 className="text-base font-semibold text-(--color-purple) mb-3">Assets</h4>
              {financialData.balanceSheet.assets.length > 0 ? (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-(--color-border)">
                      <th className="py-2 px-3 text-left text-xs text-gray-400 uppercase">Name</th>
                      <th className="py-2 px-3 text-right text-xs text-gray-400 uppercase">Value</th>
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
                      <td className="py-2 px-3 text-sm font-semibold text-(--color-gold) text-right">{formatCurrency(totalAssets, userCurrency)}</td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <p className="text-sm text-gray-500 italic">No assets recorded</p>
              )}
            </div>

            <div className="bg-(--color-card) border border-(--color-border) rounded-xl p-4">
              <h4 className="text-base font-semibold text-(--color-purple) mb-3">Liabilities</h4>
              {financialData.balanceSheet.liabilities.length > 0 ? (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-(--color-border)">
                      <th className="py-2 px-3 text-left text-xs text-gray-400 uppercase">Name</th>
                      <th className="py-2 px-3 text-right text-xs text-gray-400 uppercase">Value</th>
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
                      <td className="py-2 px-3 text-sm font-semibold text-(--color-gold) text-right">{formatCurrency(totalLiabilities, userCurrency)}</td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <p className="text-sm text-gray-500 italic">No liabilities recorded</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-(--color-gold) mb-4 pb-2 border-b border-(--color-border)">Balance Sheet</h3>
          <div className="bg-(--color-card) border border-(--color-border) rounded-xl p-6 text-center">
            <p className="text-gray-400">This user has not created a balance sheet yet.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserFinancialView;
