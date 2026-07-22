import { useState } from 'react';
import { FiAlertCircle, FiRefreshCw, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import ActionButton from './ActionButton';

/**
 * Phase 12 - Step 2: ErrorState Component
 * Reusable error alert container with retry handler and technical details toggle.
 */
export const ErrorState = ({
  title = 'Telemetry Synchronization Error',
  message = 'Failed to fetch data from the server. Please verify network connection.',
  errorDetails,
  onRetry,
  retryLoading = false,
  className = ''
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className={`glass-card p-6 border-red-500/30 bg-red-500/5 space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30 shrink-0">
            <FiAlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">{title}</h4>
            <p className="text-xs text-gray-400 mt-0.5">{message}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {errorDetails && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1 font-mono transition-colors"
            >
              {showDetails ? 'Hide Details' : 'Details'} {showDetails ? <FiChevronUp /> : <FiChevronDown />}
            </button>
          )}
          {onRetry && (
            <ActionButton
              variant="danger"
              size="sm"
              icon={FiRefreshCw}
              loading={retryLoading}
              onClick={onRetry}
            >
              Retry
            </ActionButton>
          )}
        </div>
      </div>

      {showDetails && errorDetails && (
        <div className="p-3 bg-surface-950 rounded-xl border border-red-500/20 font-mono text-[11px] text-red-300 overflow-x-auto">
          {typeof errorDetails === 'string' ? errorDetails : JSON.stringify(errorDetails, null, 2)}
        </div>
      )}
    </div>
  );
};

export default ErrorState;
