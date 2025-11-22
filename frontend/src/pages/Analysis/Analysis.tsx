import React from 'react';
import './Analysis.css';
import Sidebar from '../../components/Sidebar/Sidebar';
import '../../components/Header/Header.css';
import Header from '../../components/Header/Header';
import { useAuth } from '../../context/AuthContext';
import { analysisAPI } from '../../utils/api';
import { formatCurrency as formatCurrencyValue } from '../../utils/currency.utils';

type SnapshotData = {
  date: string;
  balanceSheet: {
    totalCashBalance: number;
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
  };
  cashflow: {
    earnedIncome: number;
    passiveIncome: number;
    portfolioIncome: number;
    totalIncome: number;
    totalExpenses: number;
    netCashflow: number;
    direction: string;
  };
  ratios: {
    passiveCoverageRatio: string;
    savingsRate: string;
  };
  incomeQuadrant: {
    EMPLOYEE: number;
    SELF_EMPLOYED: number;
    BUSINESS_OWNER: number;
    INVESTOR: number;
  };
};

type SavedSnapshot = {
  id: string;
  date: string;
  data: SnapshotData;
};

const Analysis: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [timelineOpen, setTimelineOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState('');
  const [comparisonEnabled, setComparisonEnabled] = React.useState(false);
  const [comparisonDate, setComparisonDate] = React.useState('');
  const [snapshotData, setSnapshotData] = React.useState<SnapshotData | null>(null);
  const [savedSnapshots, setSavedSnapshots] = React.useState<SavedSnapshot[]>([]);
  const [comparisonSnapshots, setComparisonSnapshots] = React.useState<SavedSnapshot[]>([]);
  const [isDragOverComparison, setIsDragOverComparison] = React.useState(false);

  // Fetch financial snapshot
  const fetchSnapshot = async (date?: string) => {
    try {
      setLoading(true);
      const data = await analysisAPI.getFinancialSnapshot(date);
      setSnapshotData(data);
    } catch (error) {
      console.error('Failed to fetch snapshot:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  React.useEffect(() => {
    fetchSnapshot();
  }, []);

  // Fetch when date changes
  React.useEffect(() => {
    if (selectedDate) {
      fetchSnapshot(selectedDate);
    }
  }, [selectedDate]);

  const handleSaveSnapshot = () => {
    if (!snapshotData) return;
    const id = `${Date.now()}`;
    setSavedSnapshots(prev => [
      { id, date: snapshotData.date, data: snapshotData },
      ...prev
    ]);
  };

  const handleRemoveSnapshot = (id: string) => {
    setSavedSnapshots(prev => prev.filter(s => s.id !== id));
  };

  const preferredCurrency = user?.preferredCurrency;
  const formatCurrency = React.useCallback(
    (value: number) => formatCurrencyValue(value, preferredCurrency),
    [preferredCurrency]
  );

  const formatPercentage = (value: string) => {
    return `${value}%`;
  };

  return (
    <div className="analysis-layout">
      {/* Full-width header like dashboard */}
      <Header title="Analysis" hideActions />
      <div className="analysis-body">
        <Sidebar />
        <main className="analysis-main" aria-labelledby="analysis-title">
          <div className="analysis-spacer" />

        {loading && (
          <div className="analysis-loading" role="status" aria-live="polite">
            <div className="spinner" aria-hidden="true" />
            <span>Loading financial history...</span>
          </div>
        )}

        {!loading && (
          <div className="analysis-grid">
            {/* Comparison (left) */}
            <section
              className={`analysis-section comparison ${isDragOverComparison ? 'drag-over' : ''}`}
              aria-label="Compare snapshots between dates"
              onDragOver={(e) => { e.preventDefault(); setIsDragOverComparison(true); }}
              onDragLeave={() => setIsDragOverComparison(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOverComparison(false);
                const id = e.dataTransfer.getData('text/snapshot-id');
                if (!id) return;
                setComparisonSnapshots(prev => {
                  if (prev.some(s => s.id === id)) return prev; // avoid duplicates
                  const snap = savedSnapshots.find(s => s.id === id);
                  return snap ? [...prev, snap] : prev;
                });
              }}
            >
              <div className="section-header">
                <h2 className="section-heading">Comparison</h2>
                <span className="section-note">Drag a snapshot note here</span>
              </div>
              <label className="compare-toggle">
                <input
                  type="checkbox"
                  checked={comparisonEnabled}
                  onChange={(e) => setComparisonEnabled(e.target.checked)}
                />
                <span>Enable Date Comparison</span>
              </label>
              {comparisonEnabled && (
                <div className="comparison-fields">
                  <input
                    type="date"
                    value={comparisonDate}
                    onChange={(e) => setComparisonDate(e.target.value)}
                  />
                  <button 
                    className="btn-primary" 
                    disabled={!comparisonDate}
                    onClick={async () => {
                      if (comparisonDate) {
                        const data = await analysisAPI.getFinancialSnapshot(comparisonDate);
                        const id = `${Date.now()}`;
                        setComparisonSnapshots(prev => [...prev, { id, date: data.date, data }]);
                      }
                    }}
                  >
                    Compare
                  </button>
                </div>
              )}
              <div className="comparison-result">
                {comparisonSnapshots.length === 0 && 'No comparison snapshots.'}
                {comparisonSnapshots.length > 0 && (
                  <div className="comparison-snapshots">
                    {comparisonSnapshots.map(cs => (
                      <div key={cs.id} className="comparison-snapshot">
                        <button
                          className="comparison-remove"
                          aria-label="Remove comparison snapshot"
                          onClick={() => setComparisonSnapshots(prev => prev.filter(p => p.id !== cs.id))}
                        >×</button>
                        <div className="comparison-date">{cs.date}</div>
                        <div className="snapshot-metrics">
                          <h4>Balance Sheet</h4>
                          <ul>
                            <li><span>Total Cash:</span> {formatCurrency(cs.data.balanceSheet.totalCashBalance)}</li>
                            <li><span>Total Assets:</span> {formatCurrency(cs.data.balanceSheet.totalAssets)}</li>
                            <li><span>Total Liabilities:</span> {formatCurrency(cs.data.balanceSheet.totalLiabilities)}</li>
                            <li><span>Net Worth:</span> {formatCurrency(cs.data.balanceSheet.netWorth)}</li>
                          </ul>
                          <h4>Cashflow</h4>
                          <ul>
                            <li><span>Earned Income:</span> {formatCurrency(cs.data.cashflow.earnedIncome)}</li>
                            <li><span>Passive Income:</span> {formatCurrency(cs.data.cashflow.passiveIncome)}</li>
                            <li><span>Portfolio Income:</span> {formatCurrency(cs.data.cashflow.portfolioIncome)}</li>
                            <li><span>Total Income:</span> {formatCurrency(cs.data.cashflow.totalIncome)}</li>
                            <li><span>Total Expenses:</span> {formatCurrency(cs.data.cashflow.totalExpenses)}</li>
                            <li><span>Net Cashflow:</span> {formatCurrency(cs.data.cashflow.netCashflow)}</li>
                          </ul>
                          <h4>Ratios</h4>
                          <ul>
                            <li><span>Passive Coverage:</span> {formatPercentage(cs.data.ratios.passiveCoverageRatio)}</li>
                            <li><span>Savings Rate:</span> {formatPercentage(cs.data.ratios.savingsRate)}</li>
                          </ul>
                          <h4>Income Quadrant</h4>
                          <ul>
                            <li><span>Employee:</span> {formatCurrency(cs.data.incomeQuadrant.EMPLOYEE)}</li>
                            <li><span>Self-Employed:</span> {formatCurrency(cs.data.incomeQuadrant.SELF_EMPLOYED)}</li>
                            <li><span>Business Owner:</span> {formatCurrency(cs.data.incomeQuadrant.BUSINESS_OWNER)}</li>
                            <li><span>Investor:</span> {formatCurrency(cs.data.incomeQuadrant.INVESTOR)}</li>
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Snapshot (right) with embedded timeline */}
            <section className="analysis-section snapshot" aria-label="Financial snapshot for selected date">
              <div className="section-header">
                <h2 className="section-heading">Snapshot</h2>
                <span className="section-note">Choose date & save sticky notes</span>
              </div>
              <div className="snapshot-timeline-controls">
                <button
                  className="chip"
                  onClick={() => setTimelineOpen(v => !v)}
                  aria-expanded={timelineOpen}
                >
                  <span className="calendar-icon" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7 2a1 1 0 0 0-1 1v1H5a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3h-1V3a1 1 0 1 0-2 0v1H9V3a1 1 0 0 0-1-1ZM5 8h14v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8Zm2 3a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm4-2a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm3 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />
                    </svg>
                  </span>
                  {timelineOpen ? 'Hide Calendar' : 'Timeline'}
                </button>
                {timelineOpen && (
                  <div className="timeline-picker">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Display current snapshot data */}
              {snapshotData && (
                <>
                  <div className="snapshot-content">
                    <div className="snapshot-section">
                      <h3>Balance Sheet</h3>
                      <div className="snapshot-grid">
                        <div className="snapshot-card">
                          <div className="snapshot-label">Total Cash Balance</div>
                          <div className="snapshot-value">{formatCurrency(snapshotData.balanceSheet.totalCashBalance)}</div>
                        </div>
                        <div className="snapshot-card">
                          <div className="snapshot-label">Total Assets</div>
                          <div className="snapshot-value">{formatCurrency(snapshotData.balanceSheet.totalAssets)}</div>
                        </div>
                        <div className="snapshot-card">
                          <div className="snapshot-label">Total Liabilities</div>
                          <div className="snapshot-value">{formatCurrency(snapshotData.balanceSheet.totalLiabilities)}</div>
                        </div>
                        <div className="snapshot-card">
                          <div className="snapshot-label">Net Worth</div>
                          <div className="snapshot-value">{formatCurrency(snapshotData.balanceSheet.netWorth)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="snapshot-section">
                      <h3>Cashflow</h3>
                      <div className="snapshot-grid">
                        <div className="snapshot-card">
                          <div className="snapshot-label">Earned Income</div>
                          <div className="snapshot-value">{formatCurrency(snapshotData.cashflow.earnedIncome)}</div>
                        </div>
                        <div className="snapshot-card">
                          <div className="snapshot-label">Passive Income</div>
                          <div className="snapshot-value">{formatCurrency(snapshotData.cashflow.passiveIncome)}</div>
                        </div>
                        <div className="snapshot-card">
                          <div className="snapshot-label">Portfolio Income</div>
                          <div className="snapshot-value">{formatCurrency(snapshotData.cashflow.portfolioIncome)}</div>
                        </div>
                        <div className="snapshot-card">
                          <div className="snapshot-label">Total Income</div>
                          <div className="snapshot-value">{formatCurrency(snapshotData.cashflow.totalIncome)}</div>
                        </div>
                        <div className="snapshot-card">
                          <div className="snapshot-label">Total Expenses</div>
                          <div className="snapshot-value">{formatCurrency(snapshotData.cashflow.totalExpenses)}</div>
                        </div>
                        <div className="snapshot-card">
                          <div className="snapshot-label">Net Cashflow</div>
                          <div className={`snapshot-value ${snapshotData.cashflow.direction}`}>
                            {formatCurrency(snapshotData.cashflow.netCashflow)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="snapshot-section">
                      <h3>Financial Ratios</h3>
                      <div className="snapshot-grid">
                        <div className="snapshot-card">
                          <div className="snapshot-label">Passive Coverage Ratio</div>
                          <div className="snapshot-value">{formatPercentage(snapshotData.ratios.passiveCoverageRatio)}</div>
                        </div>
                        <div className="snapshot-card">
                          <div className="snapshot-label">Savings Rate</div>
                          <div className="snapshot-value">{formatPercentage(snapshotData.ratios.savingsRate)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="snapshot-section">
                      <h3>Income Quadrant Distribution</h3>
                      <div className="snapshot-grid">
                        <div className="snapshot-card">
                          <div className="snapshot-label">Employee</div>
                          <div className="snapshot-value">{formatCurrency(snapshotData.incomeQuadrant.EMPLOYEE)}</div>
                        </div>
                        <div className="snapshot-card">
                          <div className="snapshot-label">Self-Employed</div>
                          <div className="snapshot-value">{formatCurrency(snapshotData.incomeQuadrant.SELF_EMPLOYED)}</div>
                        </div>
                        <div className="snapshot-card">
                          <div className="snapshot-label">Business Owner</div>
                          <div className="snapshot-value">{formatCurrency(snapshotData.incomeQuadrant.BUSINESS_OWNER)}</div>
                        </div>
                        <div className="snapshot-card">
                          <div className="snapshot-label">Investor</div>
                          <div className="snapshot-value">{formatCurrency(snapshotData.incomeQuadrant.INVESTOR)}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="snapshot-actions">
                    <button className="btn-primary" onClick={handleSaveSnapshot}>Save Snapshot</button>
                  </div>
                </>
              )}

              {savedSnapshots.length > 0 && (
                <div className="sticky-notes">
                  {savedSnapshots.map(note => (
                    <div
                      key={note.id}
                      className="sticky-note"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/snapshot-id', note.id);
                      }}
                    >
                      <button className="note-close" onClick={() => handleRemoveSnapshot(note.id)} aria-label="Remove snapshot">×</button>
                      <div className="note-date">{note.date}</div>
                      <div className="note-summary">
                        <p>Net Worth: {formatCurrency(note.data.balanceSheet.netWorth)}</p>
                        <p>Net Cashflow: {formatCurrency(note.data.cashflow.netCashflow)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
        </main>
      </div>
    </div>
  );
};

export default Analysis;
