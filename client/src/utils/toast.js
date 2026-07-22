import toast from 'react-hot-toast';

/**
 * Phase 12 - Step 4: Enterprise Toast Notification Utility
 * Wrapper over react-hot-toast providing success, error, warning, info, and loading toasts.
 */
export const notify = {
  success: (message, options = {}) => {
    return toast.success(message, {
      duration: 3500,
      style: {
        background: 'rgba(15, 23, 42, 0.95)',
        color: '#f8fafc',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        backdropFilter: 'blur(12px)',
        fontFamily: 'monospace',
        fontSize: '12px'
      },
      ...options
    });
  },

  error: (message, options = {}) => {
    return toast.error(message, {
      duration: 4500,
      style: {
        background: 'rgba(15, 23, 42, 0.95)',
        color: '#f8fafc',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        backdropFilter: 'blur(12px)',
        fontFamily: 'monospace',
        fontSize: '12px'
      },
      ...options
    });
  },

  warning: (message, options = {}) => {
    return toast(message, {
      duration: 4000,
      icon: '⚠️',
      style: {
        background: 'rgba(15, 23, 42, 0.95)',
        color: '#f8fafc',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        backdropFilter: 'blur(12px)',
        fontFamily: 'monospace',
        fontSize: '12px'
      },
      ...options
    });
  },

  info: (message, options = {}) => {
    return toast(message, {
      duration: 3500,
      icon: 'ℹ️',
      style: {
        background: 'rgba(15, 23, 42, 0.95)',
        color: '#f8fafc',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        backdropFilter: 'blur(12px)',
        fontFamily: 'monospace',
        fontSize: '12px'
      },
      ...options
    });
  },

  loading: (message, options = {}) => {
    return toast.loading(message, {
      style: {
        background: 'rgba(15, 23, 42, 0.95)',
        color: '#f8fafc',
        border: '1px solid rgba(147, 51, 234, 0.3)',
        backdropFilter: 'blur(12px)',
        fontFamily: 'monospace',
        fontSize: '12px'
      },
      ...options
    });
  },

  dismiss: (toastId) => {
    toast.dismiss(toastId);
  }
};

export default notify;
