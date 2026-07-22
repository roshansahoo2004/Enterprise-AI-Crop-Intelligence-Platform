/**
 * Phase 12 - Step 2: SectionCard Component (DashboardCard)
 * Reusable glassmorphic container for dashboard sections, charts, and tables.
 */
export const SectionCard = ({
  title,
  subtitle,
  icon: Icon,
  actions,
  children,
  className = '',
  hoverEffect = false,
  padding = 'p-6'
}) => {
  const cardStyle = hoverEffect ? 'glass-card-hover' : 'glass-card';

  return (
    <div className={`${cardStyle} ${padding} border-white/5 relative overflow-hidden ${className}`}>
      {(title || Icon || actions) && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 border-b border-white/5 pb-4">
          <div>
            <div className="flex items-center gap-2">
              {Icon && <Icon className="text-primary-400 w-4 h-4" />}
              {title && <h3 className="text-base font-semibold text-white tracking-tight">{title}</h3>}
            </div>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>

          {actions && (
            <div className="flex items-center gap-2 shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}

      {children}
    </div>
  );
};

export default SectionCard;
