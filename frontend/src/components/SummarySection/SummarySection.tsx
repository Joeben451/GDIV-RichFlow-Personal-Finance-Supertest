import React from 'react';
import './SummarySection.css';

type Props = {
  passiveIncome?: number;
  totalExpenses?: number;
  cashSavings?: number;
};

const SummarySection: React.FC<Props> = ({
  passiveIncome = 1200,
  totalExpenses = 5000,
  cashSavings = 10000,
}) => {
  // compute percentage (clamp between 0 and 100)
  const percent = Math.min(
    100,
    Math.max(0, Math.round((passiveIncome / totalExpenses) * 100))
  );

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
