/**
 * Phase 12 - Step 3: LoadingSkeleton Components
 * Reusable pulsing shimmer skeleton placeholders for cards, tables, charts, and text lines.
 */
export const SkeletonCard = ({ className = '' }) => (
  <div className={`glass-card p-6 animate-pulse border-white/10 ${className}`}>
    <div className="flex justify-between items-center mb-4">
      <div className="h-3 w-28 bg-white/10 rounded"></div>
      <div className="w-8 h-8 bg-white/10 rounded-xl"></div>
    </div>
    <div className="h-8 w-20 bg-white/10 rounded mb-2"></div>
    <div className="h-3 w-36 bg-white/5 rounded"></div>
  </div>
);

export const SkeletonTable = ({ rows = 8, className = '' }) => (
  <div className={`glass-card p-6 animate-pulse border-white/10 ${className}`}>
    <div className="h-4 w-48 bg-white/10 rounded mb-6"></div>
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="h-12 bg-white/5 rounded-xl"></div>
      ))}
    </div>
  </div>
);

export const SkeletonChart = ({ className = '' }) => (
  <div className={`glass-card p-6 animate-pulse border-white/10 min-h-[300px] ${className}`}>
    <div className="h-4 w-40 bg-white/10 rounded mb-6"></div>
    <div className="h-52 bg-white/5 rounded-xl"></div>
  </div>
);

export const SkeletonText = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 animate-pulse ${className}`}>
    {[...Array(lines)].map((_, i) => (
      <div
        key={i}
        className="h-3 bg-white/10 rounded"
        style={{ width: i === lines - 1 ? '60%' : '100%' }}
      ></div>
    ))}
  </div>
);

// Aliases for Step 3 naming conventions
export const CardSkeleton = SkeletonCard;
export const TableSkeleton = SkeletonTable;
export const ChartSkeleton = SkeletonChart;
export const LoadingSkeleton = SkeletonCard;

export default {
  SkeletonCard,
  SkeletonTable,
  SkeletonChart,
  SkeletonText,
  CardSkeleton,
  TableSkeleton,
  ChartSkeleton,
  LoadingSkeleton
};
