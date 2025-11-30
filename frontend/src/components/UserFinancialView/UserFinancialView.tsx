import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';
import { Currency } from '../../types/currency.types';
import { formatCurrency } from '../../utils/currency.utils';
import './UserFinancialView.css';

interface UserFinancialViewProps {
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
  };
  balanceSheet: BalanceSheet | null;
  incomeStatement: IncomeStatement | null;
  cashSavings: CashSavings | null;
  income: Income[];
}

const UserFinancialView: React.FC<UserFinancialViewProps> = ({ userId, userName, onBack }) => {
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
        // Extract the data from the wrapped response
        const data = response.data || response;
        setFinancialData(data);
        // Set user's preferred currency
        if (data.user?.preferredCurrency) {
          setUserCurrency(data.user.preferredCurrency);
        }
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
      <div className="user-financial-view">
        <div className="user-info-header">
          <table className="user-info-table">
            <thead>
              <tr>
                <th colSpan={4}>
                  <button className="back-arrow" onClick={onBack} title="Back to Users">←</button>
                  Loading financial data...
                </th>
              </tr>
            </thead>
          </table>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-financial-view">
        <div className="user-info-header">
          <table className="user-info-table">
            <thead>
              <tr>
                <th colSpan={4}>
                  <button className="back-arrow" onClick={onBack} title="Back to Users">←</button>
                  Error
                </th>
              </tr>
            </thead>
          </table>
        </div>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (!financialData) {
    return (
      <div className="user-financial-view">
        <div className="user-info-header">
          <table className="user-info-table">
            <thead>
              <tr>
                <th colSpan={4}>
                  <button className="back-arrow" onClick={onBack} title="Back to Users">←</button>
                  No data available
                </th>
              </tr>
            </thead>
          </table>
        </div>
      </div>
    );
  }

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

  const cashSavings = financialData.cashSavings?.amount || 0;

  return (
    <div className="user-financial-view">
      {/* User info header table */}
      <div className="user-info-header">
        <table className="user-info-table">
          <thead>
            <tr>
              <th>
                <button className="back-arrow" onClick={onBack} title="Back to Users">←</button>
                Name
              </th>
              <th>Email</th>
              <th>Date of Creation</th>
              <th>Last Login</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{userName}</td>
              <td>{financialData.user.email}</td>
              <td>{new Date(financialData.user.createdAt).toLocaleDateString()}</td>
              <td>{financialData.user.lastLogin ? new Date(financialData.user.lastLogin).toLocaleDateString() : 'Never'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="financial-grid">
        {/* Income Section */}
        <div className="financial-section income-section">
          <h3>Income</h3>
          <div className="income-content">
            <div className="income-group">
              <h4>Earned Income</h4>
              {earnedIncome.length > 0 ? (
                <table className="financial-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnedIncome.map((income) => (
                      <tr key={income.id}>
                        <td>{income.name}</td>
                        <td>{formatCurrency(income.amount, userCurrency)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td><strong>Total</strong></td>
                      <td><strong>{formatCurrency(totalEarnedIncome, userCurrency)}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <p className="no-data">No earned income</p>
              )}
            </div>
            <div className="income-group">
              <h4>Portfolio Income</h4>
              {portfolioIncome.length > 0 ? (
                <table className="financial-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolioIncome.map((income) => (
                      <tr key={income.id}>
                        <td>{income.name}</td>
                        <td>{formatCurrency(income.amount, userCurrency)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td><strong>Total</strong></td>
                      <td><strong>{formatCurrency(totalPortfolioIncome, userCurrency)}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <p className="no-data">No portfolio income</p>
              )}
            </div>
            <div className="income-group">
              <h4>Passive Income</h4>
              {passiveIncome.length > 0 ? (
                <table className="financial-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {passiveIncome.map((income) => (
                      <tr key={income.id}>
                        <td>{income.name}</td>
                        <td>{formatCurrency(income.amount, userCurrency)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td><strong>Total</strong></td>
                      <td><strong>{formatCurrency(totalPassiveIncome, userCurrency)}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <p className="no-data">No passive income</p>
              )}
            </div>
            <div className="total-income">
              <strong>Total Income: {formatCurrency(totalIncome, userCurrency)}</strong>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="financial-section summary-section">
          <h3>Summary</h3>
          <div className="summary-content">
            {/* Progress bar for Passive + Portfolio Income */}
            <div className="progress-container">
              <div className="progress-header">
                <span className="progress-label">Passive + Portfolio Income</span>
                <span className="progress-amount">
                  {formatCurrency(totalPassiveIncome + totalPortfolioIncome, userCurrency)}
                </span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ 
                    width: `${totalExpenses > 0 ? Math.min(100, ((totalPassiveIncome + totalPortfolioIncome) / totalExpenses) * 100) : 0}%` 
                  }}
                />
              </div>
              <div className="progress-footer">
                <span className="progress-percent">
                  {totalExpenses > 0 ? Math.round(((totalPassiveIncome + totalPortfolioIncome) / totalExpenses) * 100) : 0}%
                </span>
                <span className="progress-target">
                  of {formatCurrency(totalExpenses, userCurrency)} (Total Expenses)
                </span>
              </div>
            </div>

            {/* Bar chart for Total Income and Expenses */}
            <div className="graph-card">
              <div className="horizontal-graph">
                <div className="hbar">
                  <div className="hbar-label">Total Income</div>
                  <div className="hbar-track">
                    <div
                      className="hbar-fill income"
                      style={{ width: `${totalIncome > 0 ? 100 : 0}%` }}
                    />
                  </div>
                  <div className="hbar-value">{formatCurrency(totalIncome, userCurrency)}</div>
                </div>
                <div className="hbar">
                  <div className="hbar-label">Total Expenses</div>
                  <div className="hbar-track">
                    <div
                      className="hbar-fill expenses"
                      style={{ 
                        width: `${totalExpenses > 0 ? Math.min(100, (totalExpenses / Math.max(totalIncome, totalExpenses, 1)) * 100) : 0}%` 
                      }}
                    />
                  </div>
                  <div className="hbar-value">{formatCurrency(totalExpenses, userCurrency)}</div>
                </div>
              </div>
              <div className={`cashflow-row ${(totalIncome - totalExpenses) < 0 ? 'negative' : 'positive'}`}>
                <div className="cashflow-label">Cashflow</div>
                <div className="cashflow-amount">
                  {formatCurrency(Math.abs(totalIncome - totalExpenses), userCurrency)}
                  {(totalIncome - totalExpenses) < 0 && ' (deficit)'}
                </div>
              </div>
            </div>

            {/* Net Worth card (when balance sheet exists) */}
            {financialData.balanceSheet && (
              <div className="graph-card net-worth-card">
                <div className="horizontal-graph">
                  <div className="hbar">
                    <div className="hbar-label">Total Assets</div>
                    <div className="hbar-track">
                      <div
                        className="hbar-fill assets"
                        style={{ 
                          width: `${totalAssets > 0 ? Math.min(100, (totalAssets / Math.max(totalAssets, totalLiabilities, 1)) * 100) : 0}%` 
                        }}
                      />
                    </div>
                    <div className="hbar-value">{formatCurrency(totalAssets, userCurrency)}</div>
                  </div>
                  <div className="hbar">
                    <div className="hbar-label">Total Liabilities</div>
                    <div className="hbar-track">
                      <div
                        className="hbar-fill liabilities"
                        style={{ 
                          width: `${totalLiabilities > 0 ? Math.min(100, (totalLiabilities / Math.max(totalAssets, totalLiabilities, 1)) * 100) : 0}%` 
                        }}
                      />
                    </div>
                    <div className="hbar-value">{formatCurrency(totalLiabilities, userCurrency)}</div>
                  </div>
                </div>
                <div className={`net-worth-row ${netWorth < 0 ? 'negative' : 'positive'}`}>
                  <div className="net-worth-label">Net Worth</div>
                  <div className="net-worth-amount">
                    {formatCurrency(Math.abs(netWorth), userCurrency)}
                    {netWorth < 0 && ' (negative)'}
                  </div>
                </div>
              </div>
            )}

            {/* Cash Savings */}
            <div className="savings-bar">
              <span className="savings-label">Cash / Savings</span>
              <span className="savings-amount">{formatCurrency(cashSavings, userCurrency)}</span>
            </div>
          </div>
        </div>

        {/* Expenses Section */}
        <div className="financial-section expenses-section">
          <h3>Expenses</h3>
          <div className="expenses-content">
            <div className="expense-group">
              {expenses.length > 0 ? (
                <table className="financial-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense) => (
                      <tr key={expense.id}>
                        <td>{expense.name}</td>
                        <td>{formatCurrency(expense.amount, userCurrency)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td><strong>Total</strong></td>
                      <td><strong>{formatCurrency(totalExpenses, userCurrency)}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <p className="no-data">No expenses</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Balance Sheet Section */}
      {financialData.balanceSheet && (
        <div className="balance-sheet-section">
          <h3>Balance Sheet</h3>
          <div className="balance-sheet-grid">
            <div className="financial-section assets-section">
              <h4>Assets</h4>
              {financialData.balanceSheet.assets.length > 0 ? (
                <table className="financial-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financialData.balanceSheet.assets.map((asset) => (
                      <tr key={asset.id}>
                        <td>{asset.name}</td>
                        <td>{formatCurrency(asset.value, userCurrency)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td><strong>Total Assets</strong></td>
                      <td><strong>{formatCurrency(totalAssets, userCurrency)}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <p className="no-data">No assets</p>
              )}
            </div>
            <div className="financial-section liabilities-section">
              <h4>Liabilities</h4>
              {financialData.balanceSheet.liabilities.length > 0 ? (
                <table className="financial-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financialData.balanceSheet.liabilities.map((liability) => (
                      <tr key={liability.id}>
                        <td>{liability.name}</td>
                        <td>{formatCurrency(liability.value, userCurrency)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td><strong>Total Liabilities</strong></td>
                      <td><strong>{formatCurrency(totalLiabilities, userCurrency)}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <p className="no-data">No liabilities</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserFinancialView;
