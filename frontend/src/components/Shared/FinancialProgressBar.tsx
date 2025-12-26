import React from 'react';

/**
 * Props for the FinancialProgressBar component
 */
export interface FinancialProgressBarProps {
  /** Label describing what the progress bar represents */
  label: string;
  /** Current value (numerator) */
  currentValue: number;
  /** Total/target value (denominator) */
  totalValue: number;
  /** Currency symbol to display (e.g., "$", "€", "₱") */
  currencySymbol?: string;
  /** Optional formatted current value string (if you want custom formatting) */
  formattedCurrentValue?: string;
  /** Optional formatted total value string (if you want custom formatting) */
  formattedTotalValue?: string;
  /** Optional label for the target (e.g., "of Total Expenses") */
  targetLabel?: string;
  /** Optional custom class name */
  className?: string;
  /** Color variant for the progress fill */
  variant?: 'gold' | 'purple' | 'green' | 'red';
  /** Whether to show the percentage text */
  showPercentage?: boolean;
  /** Whether to show the current value */
  showCurrentValue?: boolean;
  /** Whether to show the target value */
  showTargetValue?: boolean;
}

/**
 * A reusable progress bar component for financial metrics.
 * 
 * Features:
 * - Calculates percentage automatically (capped at 100%)
 * - Gold/black aesthetic matching the application theme
 * - Customizable labels and formatting
 * - Multiple color variants
 * 
 * @example
 * ```tsx
 * <FinancialProgressBar
 *   label="Passive Income"
 *   currentValue={5000}
 *   totalValue={10000}
 *   currencySymbol="$"
 *   targetLabel="of Total Expenses"
 * />
 * ```
 */
const FinancialProgressBar: React.FC<FinancialProgressBarProps> = ({
  label,
  currentValue,
  totalValue,
  currencySymbol = '$',
  formattedCurrentValue,
  formattedTotalValue,
  targetLabel = 'of target',
  className = '',
  variant = 'gold',
  showPercentage = true,
  showCurrentValue = true,
  showTargetValue = true,
}) => {
  // Calculate percentage (0-100), handle division by zero
  const percentage = totalValue > 0 
    ? Math.min(100, Math.round((currentValue / totalValue) * 100)) 
    : 0;

  // Format values if not provided
  const displayCurrentValue = formattedCurrentValue ?? `${currencySymbol}${currentValue.toLocaleString()}`;
  const displayTotalValue = formattedTotalValue ?? `${currencySymbol}${totalValue.toLocaleString()}`;

  // Get fill color based on variant
  const getFillColor = (): string => {
    switch (variant) {
      case 'purple':
        return 'var(--color-purple)';
      case 'green':
        return '#4ade80';
      case 'red':
        return '#f87171';
      case 'gold':
      default:
        return 'var(--color-gold)';
    }
  };

  // Get track background gradient based on variant
  const getTrackBackground = (): string => {
    switch (variant) {
      case 'purple':
        return 'rgba(115, 69, 175, 0.2)';
      case 'green':
        return 'rgba(74, 222, 128, 0.2)';
      case 'red':
        return 'rgba(248, 113, 113, 0.2)';
      case 'gold':
      default:
        return 'rgba(237, 202, 105, 0.2)';
    }
  };

  return (
    <div className={`financial-progress-bar ${className}`.trim()}>
      {/* Header: Label and Current Value */}
      <div 
        className="flex justify-between items-center mb-2"
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '0.5rem'
        }}
      >
        <span 
          className="text-sm font-medium"
          style={{ 
            color: 'var(--color-text-dim)', 
            fontSize: '0.875rem',
            fontWeight: 500 
          }}
        >
          {label}
        </span>
        {showCurrentValue && (
          <span 
            className="text-sm font-semibold"
            style={{ 
              color: getFillColor(), 
              fontSize: '0.875rem',
              fontWeight: 600 
            }}
          >
            {displayCurrentValue}
          </span>
        )}
      </div>

      {/* Progress Track */}
      <div 
        className="progress-track"
        style={{
          width: '100%',
          height: '12px',
          borderRadius: '6px',
          backgroundColor: getTrackBackground(),
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Progress Fill */}
        <div
          className="progress-fill"
          style={{
            width: `${percentage}%`,
            height: '100%',
            borderRadius: '6px',
            backgroundColor: getFillColor(),
            transition: 'width 0.5s ease-out',
            boxShadow: `0 0 8px ${getFillColor()}40`,
          }}
        />
      </div>

      {/* Footer: Percentage and Target */}
      <div 
        className="flex justify-between items-center mt-2"
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginTop: '0.5rem'
        }}
      >
        {showPercentage && (
          <span 
            className="text-xs font-bold"
            style={{ 
              color: getFillColor(), 
              fontSize: '0.75rem',
              fontWeight: 700 
            }}
          >
            {percentage}%
          </span>
        )}
        {showTargetValue && (
          <span 
            className="text-xs"
            style={{ 
              color: 'var(--color-text-dim)', 
              fontSize: '0.75rem' 
            }}
          >
            {targetLabel} {displayTotalValue}
          </span>
        )}
      </div>
    </div>
  );
};

export default FinancialProgressBar;
