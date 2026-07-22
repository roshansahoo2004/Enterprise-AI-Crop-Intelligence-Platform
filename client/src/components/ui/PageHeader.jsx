import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

/**
 * Phase 12 - Step 2: PageHeader Component
 * Enterprise page header with back navigation, status badge, title, description, and action triggers.
 */
export const PageHeader = ({
  title,
  subtitle,
  icon: Icon,
  statusBadge,
  backPath,
  backText = 'Back',
  actions,
  className = ''
}) => {
  const navigate = useNavigate();

  return (
    <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${className}`}>
      <div>
        {backPath && (
          <button
            onClick={() => navigate(backPath)}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors mb-2 group font-mono"
          >
            <FiArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> {backText}
          </button>
        )}

        <div className="flex items-center gap-3 mb-1">
          {Icon && (
            <div className="w-8 h-8 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight flex items-center gap-3">
            {title}
          </h1>
          {statusBadge && (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
              {statusBadge}
            </span>
          )}
        </div>

        {subtitle && (
          <p className="text-gray-400 text-xs sm:text-sm max-w-3xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
