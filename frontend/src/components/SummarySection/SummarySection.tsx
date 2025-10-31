import React from 'react';
import './SummarySection.css';

type Props = {
  passiveIncome?: number;
  totalExpenses?: number;
  cashSavings?: number;
  totalIncome?: number; // new prop for display
};

const SummarySection: React.FC<Props> = ({
  passiveIncome = 1200,
  totalExpenses = 5000,
  cashSavings = 10000,
  totalIncome = 8000, // default placeholder, backend will replace
}) => {
  // compute percentage (clamp between 0 and 100)
  const percent = Math.min(
    100,
    Math.max(0, Math.round((passiveIncome / totalExpenses) * 100))
  );

  // New: compute cashflow and values for bar graph
  const cashFlow = totalIncome - totalExpenses;
  const absCashFlow = Math.abs(cashFlow);

  // Determine max for scaling bars (use income vs passive income)
  const barMax = Math.max(totalIncome, passiveIncome, 1);

  const toBarPercent = (value: number) =>
    Math.round((value / barMax) * 100);

  const incomeBarPercent = toBarPercent(totalIncome);
  const passiveBarPercent = toBarPercent(passiveIncome);

  return (
    <section className="summary-section">
      <div className="section-header">
        <h2 className="section-title">Summary</h2>
      </div>

      <div className="summary-content">
        {/* Progress block tracking passive income */}
        <div className="progress-container">
          <div className="progress-header">
            <span className="progress-label">Passive income</span>
            <span className="progress-amount">
              ${passiveIncome.toLocaleString()}
            </span>
          </div>

          <div
            className="progress-track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-label="Passive income progress"
          >
            <div
              className="progress-fill"
              style={{ width: `${percent}%` }}
              aria-hidden="true"
            />
          </div>

          <div className="progress-footer">
            <span className="progress-percent">{percent}%</span>
            <span className="progress-target">
              of ${totalExpenses.toLocaleString()} Total Expenses
            </span>
          </div>
        </div>

        {/* New: Horizontal bar graph for Total Income and Passive Income */}
        {/* Grouped inside a darker, square-ish card */}
        <div className="graph-card" aria-hidden={false}>
          <div className="horizontal-graph">
            <div className="hbar">
              <div className="hbar-label">Total Income</div>
              <div
                className="hbar-track"
                role="img"
                aria-label={`Total income ${totalIncome}`}
              >
                <div
                  className="hbar-fill income"
                  style={{ width: `${incomeBarPercent}%` }}
                  aria-hidden="true"
                />
              </div>
              <div className="hbar-value">${totalIncome.toLocaleString()}</div>
            </div>

            <div className="hbar">
              <div className="hbar-label">Passive Income</div>
              <div
                className="hbar-track"
                role="img"
                aria-label={`Passive income ${passiveIncome}`}
              >
                <div
                  className="hbar-fill passive"
                  style={{ width: `${passiveBarPercent}%` }}
                  aria-hidden="true"
                />
              </div>
              <div className="hbar-value">${passiveIncome.toLocaleString()}</div>
            </div>
          </div>

          {/* Total cashflow row inside the same card */}
          <div
            className={`cashflow-row ${cashFlow < 0 ? 'negative' : 'positive'}`}
          >
            <div className="cashflow-label">Total Cashflow</div>
            <div className="cashflow-amount">${cashFlow.toLocaleString()}</div>
          </div>
        </div>

        {/* Existing content placeholder */}
        {/* Content will be added when data integration begins */}
      </div>

      {/* Bottom savings row */}
      <div className="savings-bar">
        <span className="savings-label">Cash / Savings</span>
        <span className="savings-amount">${cashSavings.toLocaleString()}</span>
      </div>
    </section>
  );
};

export default SummarySection;
