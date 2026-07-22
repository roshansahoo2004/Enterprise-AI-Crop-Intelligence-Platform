import { motion } from 'framer-motion';

/**
 * Phase 12 - Step 2: StatCard Component
 * Enterprise KPI summary card with color themes, icon badge, trend pill, and subtitle.
 */
export const StatCard = ({
  label,
  value,
  unit = '',
  icon: Icon,
  trend,
  trendType = 'up', // 'up' | 'down' | 'neutral'
  subtitle,
  color = 'primary', // 'primary' | 'secondary' | 'emerald' | 'amber' | 'purple' | 'cyan' | 'red'
  className = ''
}) => {
  const colorMap = {
    primary: {
      border: 'border-primary-500/20',
      iconBg: 'bg-primary-500/10 text-primary-400 border-primary-500/20',
      glow: 'bg-primary-500/10'
    },
    secondary: {
      border: 'border-secondary-500/20',
      iconBg: 'bg-secondary-500/10 text-secondary-400 border-secondary-500/20',
      glow: 'bg-secondary-500/10'
    },
    emerald: {
      border: 'border-emerald-500/20',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      glow: 'bg-emerald-500/10'
    },
    amber: {
      border: 'border-amber-500/20',
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      glow: 'bg-amber-500/10'
    },
    purple: {
      border: 'border-purple-500/20',
      iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      glow: 'bg-purple-500/10'
    },
    cyan: {
      border: 'border-cyan-500/20',
      iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      glow: 'bg-cyan-500/10'
    },
    red: {
      border: 'border-red-500/20',
      iconBg: 'bg-red-500/10 text-red-400 border-red-500/20',
      glow: 'bg-red-500/10'
    }
  };

  const selectedTheme = colorMap[color] || colorMap.primary;

  const trendStyles = {
    up: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    down: 'bg-red-500/10 text-red-400 border-red-500/20',
    neutral: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  };

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      className={`glass-card-hover p-6 ${selectedTheme.border} flex flex-col justify-between relative overflow-hidden ${className}`}
    >
      <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none ${selectedTheme.glow}`}></div>

      <div>
        <div className="flex justify-between items-start mb-3">
          <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">{label}</span>
          {Icon && (
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${selectedTheme.iconBg}`}>
              <Icon className="w-5 h-5" />
            </div>
          )}
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-3xl font-display font-bold text-white font-mono">
            {value}{unit && <span className="text-xl text-gray-400 ml-1">{unit}</span>}
          </h3>

          {trend && (
            <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${trendStyles[trendType] || trendStyles.neutral}`}>
              {trend}
            </span>
          )}
        </div>
      </div>

      {subtitle && (
        <p className="text-[11px] text-gray-500 mt-3 font-mono">{subtitle}</p>
      )}
    </motion.div>
  );
};

export default StatCard;
