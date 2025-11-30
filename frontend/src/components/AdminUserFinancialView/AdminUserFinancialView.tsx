import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';
import { Currency } from '../../types/currency.types';
import { formatCurrency } from '../../utils/currency.utils';
import './AdminUserFinancialView.css';

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
      <div className="admin-financial-view">
        <div className="admin-financial-header">
          <button className="back-button" onClick={onBack}>← Back to Users</button>
          <h2>Loading financial data...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-financial-view">
        <div className="admin-financial-header">
          <button className="back-button" onClick={onBack}>← Back to Users</button>
          <h2>Error Loading Data</h2>
        </div>
        <div className="error-box">{error}</div>
      </div>
    );
  }

  if (!financialData) {
    return (
      <div className="admin-financial-view">
        <div className="admin-financial-header">
          <button className="back-button" onClick={onBack}>← Back to Users</button>
          <h2>No Data Available</h2>
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
    <div className="admin-financial-view">
      {/* Header with back button and user info */}
      <div className="admin-financial-header">
        <button className="back-button" onClick={onBack}>← Back to Users</button>
        <div className="user-info-row">
          <div className="user-info-item">
            <span className="info-label">Name:</span>
            <span className="info-value">{userName}</span>
          </div>
          <div className="user-info-item">
            <span className="info-label">Email:</span>
            <span className="info-value">{financialData.user.email}</span>
          </div>
          <div className="user-info-item">
            <span className="info-label">Created:</span>
            <span className="info-value">{new Date(financialData.user.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="user-info-item">
            <span className="info-label">Last Login:</span>
            <span className="info-value">
              {financialData.user.lastLogin ? new Date(financialData.user.lastLogin).toLocaleDateString() : 'Never'}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-label">Total Income</div>
          <div className="card-value income-value">{formatCurrency(totalIncome, userCurrency)}</div>
        </div>
        <div className="summary-card">
          <div className="card-label">Total Expenses</div>
          <div className="card-value expense-value">{formatCurrency(totalExpenses, userCurrency)}</div>
        </div>
        <div className="summary-card">
          <div className="card-label">Cashflow</div>
          <div className={`card-value ${cashflow >= 0 ? 'positive-value' : 'negative-value'}`}>
            {formatCurrency(Math.abs(cashflow), userCurrency)}
            {cashflow < 0 && ' (deficit)'}
          </div>
        </div>
        <div className="summary-card">
          <div className="card-label">Cash/Savings</div>
          <div className="card-value">{formatCurrency(cashSavings, userCurrency)}</div>
        </div>
        {financialData.balanceSheet && (
          <>
            <div className="summary-card">
              <div className="card-label">Total Assets</div>
              <div className="card-value asset-value">{formatCurrency(totalAssets, userCurrency)}</div>
            </div>
            <div className="summary-card">
              <div className="card-label">Total Liabilities</div>
              <div className="card-value liability-value">{formatCurrency(totalLiabilities, userCurrency)}</div>
            </div>
            <div className="summary-card">
              <div className="card-label">Net Worth</div>
              <div className={`card-value ${netWorth >= 0 ? 'positive-value' : 'negative-value'}`}>
                {formatCurrency(Math.abs(netWorth), userCurrency)}
                {netWorth < 0 && ' (negative)'}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Data Tables */}
      <div className="data-section">
        <h3>Income Breakdown</h3>
        <div className="table-grid">
          <div className="data-table-container">
            <h4>Earned Income</h4>
            {earnedIncome.length > 0 ? (
              <table className="data-table">
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
                    <td>Total</td>
                    <td>{formatCurrency(totalEarnedIncome, userCurrency)}</td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <p className="no-data-text">No earned income recorded</p>
            )}
          </div>

          <div className="data-table-container">
            <h4>Portfolio Income</h4>
            {portfolioIncome.length > 0 ? (
              <table className="data-table">
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
                    <td>Total</td>
                    <td>{formatCurrency(totalPortfolioIncome, userCurrency)}</td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <p className="no-data-text">No portfolio income recorded</p>
            )}
          </div>

          <div className="data-table-container">
            <h4>Passive Income</h4>
            {passiveIncome.length > 0 ? (
              <table className="data-table">
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
                    <td>Total</td>
                    <td>{formatCurrency(totalPassiveIncome, userCurrency)}</td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <p className="no-data-text">No passive income recorded</p>
            )}
          </div>
        </div>
      </div>

      <div className="data-section">
        <h3>Expenses</h3>
        <div className="full-width-table">
          {expenses.length > 0 ? (
            <table className="data-table">
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
                  <td>Total</td>
                  <td>{formatCurrency(totalExpenses, userCurrency)}</td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <p className="no-data-text">No expenses recorded</p>
          )}
        </div>
      </div>

      {/* Balance Sheet Section */}
      {financialData.balanceSheet ? (
        <div className="data-section">
          <h3>Balance Sheet</h3>
          <div className="table-grid-two">
            <div className="data-table-container">
              <h4>Assets</h4>
              {financialData.balanceSheet.assets.length > 0 ? (
                <table className="data-table">
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
                      <td>Total Assets</td>
                      <td>{formatCurrency(totalAssets, userCurrency)}</td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <p className="no-data-text">No assets recorded</p>
              )}
            </div>

            <div className="data-table-container">
              <h4>Liabilities</h4>
              {financialData.balanceSheet.liabilities.length > 0 ? (
                <table className="data-table">
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
                      <td>Total Liabilities</td>
                      <td>{formatCurrency(totalLiabilities, userCurrency)}</td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <p className="no-data-text">No liabilities recorded</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="data-section">
          <h3>Balance Sheet</h3>
          <div className="no-balance-sheet-notice">
            <p>This user has not created a balance sheet yet.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserFinancialView;
