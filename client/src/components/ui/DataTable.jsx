import { EmptyState } from './EmptyState';
import { SkeletonTable } from './LoadingSkeleton';

/**
 * Phase 12 - Step 2: DataTable Component
 * Enterprise standardized data table container supporting columns, custom rendering, loading, and empty fallbacks.
 */
export const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  emptyTitle = 'No Records Found',
  emptyDescription = 'There are no items to display at this time.',
  keyField = '_id',
  className = ''
}) => {
  if (loading) {
    return <SkeletonTable rows={5} className={className} />;
  }

  if (!data || data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} className={className} />;
  }

  return (
    <div className={`glass-card p-6 border-white/5 ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              {columns.map((col, idx) => (
                <th
                  key={col.key || idx}
                  className={`px-4 py-3.5 text-xs text-gray-400 font-mono font-bold uppercase tracking-wider ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'} ${col.headerClassName || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => (
              <tr
                key={row[keyField] || rowIdx}
                className={`border-b border-white/5 transition-colors hover:bg-white/[0.02] ${rowIdx % 2 === 0 ? 'bg-white/[0.01]' : ''}`}
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={col.key || colIdx}
                    className={`px-4 py-3.5 text-xs text-gray-200 ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'} ${col.className || ''}`}
                  >
                    {col.render ? col.render(row, rowIdx) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
