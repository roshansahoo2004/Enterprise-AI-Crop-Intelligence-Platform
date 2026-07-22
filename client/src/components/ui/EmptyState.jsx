import { FiInbox } from 'react-icons/fi';
import ActionButton from './ActionButton';

/**
 * Phase 12 - Step 2: EmptyState Component
 * Reusable container for zero data / empty list states.
 */
export const EmptyState = ({
  icon: Icon = FiInbox,
  title = 'No Data Available',
  description = 'There are no records matching your current filter criteria or dataset.',
  actionLabel,
  onAction,
  actionIcon,
  className = ''
}) => {
  return (
    <div className={`glass-card p-12 text-center flex flex-col items-center justify-center gap-3 border-white/5 ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 mb-1">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
      <p className="text-xs text-gray-400 max-w-sm leading-relaxed">{description}</p>

      {actionLabel && onAction && (
        <div className="pt-2">
          <ActionButton onClick={onAction} icon={actionIcon} size="sm">
            {actionLabel}
          </ActionButton>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
