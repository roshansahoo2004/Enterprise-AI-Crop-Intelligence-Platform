import { FiRefreshCw } from 'react-icons/fi';

/**
 * Phase 12 - Step 2: ActionButton Component
 * Standardized enterprise action button supporting variants, sizes, loading spinners, and icons.
 */
export const ActionButton = ({
  variant = 'primary', // 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost' | 'icon'
  size = 'md', // 'sm' | 'md' | 'lg'
  icon: Icon,
  loading = false,
  disabled = false,
  children,
  onClick,
  type = 'button',
  className = '',
  title
}) => {
  const baseStyle = 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-4 py-2.5 text-xs sm:text-sm rounded-xl',
    lg: 'px-6 py-3 text-sm sm:text-base rounded-xl'
  };

  const variantStyles = {
    primary: 'bg-primary-500 text-slate-950 font-bold hover:bg-primary-400 shadow-lg shadow-primary-500/20 active:scale-95',
    secondary: 'bg-surface-800 border border-white/10 text-gray-200 hover:bg-surface-700 hover:text-white hover:border-white/20 active:scale-95',
    danger: 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 active:scale-95',
    outline: 'bg-transparent border border-white/15 text-gray-300 hover:bg-white/5 hover:text-white hover:border-white/30 active:scale-95',
    ghost: 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5 active:scale-95',
    icon: 'p-2 bg-surface-800 text-gray-300 border border-white/10 rounded-xl hover:bg-surface-700 hover:text-white active:scale-95'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      className={`${baseStyle} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary} ${className}`}
    >
      {loading ? (
        <FiRefreshCw className="animate-spin w-4 h-4" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
};

export default ActionButton;
