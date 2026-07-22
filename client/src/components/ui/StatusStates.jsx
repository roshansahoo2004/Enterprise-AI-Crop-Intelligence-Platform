import { FiSearch, FiClock, FiLock, FiArrowLeft, FiWifiOff } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import ActionButton from './ActionButton';

/**
 * Phase 12 - Step 3: NoSearchResults Component
 */
export const NoSearchResults = ({
  query = '',
  onClear,
  className = ''
}) => (
  <div className={`glass-card p-12 text-center flex flex-col items-center justify-center gap-3 border-white/5 ${className}`}>
    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 mb-1">
      <FiSearch className="w-6 h-6" />
    </div>
    <h3 className="text-base font-bold text-white tracking-tight">No Matching Records Found</h3>
    <p className="text-xs text-gray-400 max-w-sm">
      {query ? `No records matched your search query "${query}".` : 'No items match your active filter selection.'}
    </p>
    {onClear && (
      <div className="pt-2">
        <ActionButton variant="secondary" size="sm" onClick={onClear}>
          Clear Filters
        </ActionButton>
      </div>
    )}
  </div>
);

/**
 * Phase 12 - Step 3: NetworkError Component
 */
export const NetworkError = ({
  message = 'Network request timed out or server unavailable. Please check your connection and retry.',
  onRetry,
  retryLoading = false,
  className = ''
}) => (
  <div className={`glass-card p-8 text-center flex flex-col items-center justify-center gap-3 border-red-500/30 bg-red-500/5 ${className}`}>
    <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-1">
      <FiWifiOff className="w-6 h-6" />
    </div>
    <h3 className="text-base font-bold text-white tracking-tight">Network Connection Disrupted</h3>
    <p className="text-xs text-gray-400 max-w-md">{message}</p>
    {onRetry && (
      <div className="pt-2">
        <ActionButton variant="danger" size="sm" loading={retryLoading} onClick={onRetry}>
          Retry Connection
        </ActionButton>
      </div>
    )}
  </div>
);

/**
 * Phase 12 - Step 3: ComingSoon Component
 */
export const ComingSoon = ({
  featureName = 'Advanced Module',
  description = 'This feature is currently under active engineering and will be deployed in an upcoming release.',
  className = ''
}) => (
  <div className={`glass-card p-12 text-center flex flex-col items-center justify-center gap-3 border-white/5 ${className}`}>
    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-1">
      <FiClock className="w-6 h-6 animate-pulse" />
    </div>
    <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
      Under Engineering
    </span>
    <h3 className="text-base font-bold text-white tracking-tight">{featureName} Coming Soon</h3>
    <p className="text-xs text-gray-400 max-w-md leading-relaxed">{description}</p>
  </div>
);

/**
 * Phase 12 - Step 3: AccessDenied Component
 */
export const AccessDenied = ({
  message = 'You do not have administrative permissions to view this resource.',
  backPath = '/',
  className = ''
}) => {
  const navigate = useNavigate();

  return (
    <div className={`glass-card p-12 text-center flex flex-col items-center justify-center gap-3 border-red-500/20 bg-red-500/5 ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-1">
        <FiLock className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-white tracking-tight">Access Restricted</h3>
      <p className="text-xs text-gray-400 max-w-md leading-relaxed">{message}</p>
      <div className="pt-2">
        <ActionButton
          variant="secondary"
          size="sm"
          icon={FiArrowLeft}
          onClick={() => navigate(backPath)}
        >
          Return to Dashboard
        </ActionButton>
      </div>
    </div>
  );
};

export default {
  NoSearchResults,
  NetworkError,
  ComingSoon,
  AccessDenied
};
