import { FiAlertTriangle, FiX, FiCheck, FiTrash2, FiAlertCircle } from 'react-icons/fi';
import ActionButton from './ActionButton';

/**
 * Phase 12 - Step 4: ConfirmModal Component
 * Enterprise confirmation dialog replacing native browser confirm() dialogs.
 */
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this action?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'info' | 'primary'
  loading = false
}) => {
  if (!isOpen) return null;

  const variantIcons = {
    danger: FiTrash2,
    warning: FiAlertTriangle,
    info: FiAlertCircle,
    primary: FiCheck
  };

  const IconComponent = variantIcons[variant] || FiAlertTriangle;

  const variantStyles = {
    danger: {
      border: 'border-red-500/30',
      iconBg: 'bg-red-500/20 text-red-400 border-red-500/30',
      confirmVariant: 'danger'
    },
    warning: {
      border: 'border-amber-500/30',
      iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      confirmVariant: 'primary'
    },
    info: {
      border: 'border-blue-500/30',
      iconBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      confirmVariant: 'secondary'
    },
    primary: {
      border: 'border-primary-500/30',
      iconBg: 'bg-primary-500/20 text-primary-400 border-primary-500/30',
      confirmVariant: 'primary'
    }
  };

  const selectedTheme = variantStyles[variant] || variantStyles.danger;

  return (
    <div className="fixed inset-0 bg-surface-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className={`glass-card max-w-md w-full p-6 ${selectedTheme.border} animate-fade-in shadow-2xl space-y-4`}>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${selectedTheme.iconBg} shrink-0`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{message}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
          <ActionButton
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </ActionButton>
          <ActionButton
            variant={selectedTheme.confirmVariant}
            size="sm"
            loading={loading}
            onClick={onConfirm}
          >
            {confirmText}
          </ActionButton>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
