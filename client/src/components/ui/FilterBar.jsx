import { FiSearch, FiX, FiRefreshCw } from 'react-icons/fi';

/**
 * Phase 12 - Step 2: SearchBar Component
 */
export const SearchBar = ({
  value,
  onChange,
  onClear,
  placeholder = 'Search telemetry records...',
  className = ''
}) => {
  return (
    <div className={`relative flex items-center ${className}`}>
      <FiSearch className="absolute left-3 text-gray-400 w-4 h-4 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 bg-surface-800 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/60 transition-colors font-mono"
      />
      {value && (
        <button
          onClick={onClear}
          className="absolute right-2.5 text-gray-500 hover:text-white transition-colors"
          title="Clear search"
        >
          <FiX className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

/**
 * Phase 12 - Step 2: FilterBar Component
 * Search input, filter dropdowns, and refresh triggers in a glass container.
 */
export const FilterBar = ({
  searchValue,
  onSearchChange,
  onSearchClear,
  searchPlaceholder,
  filters = [],
  onRefresh,
  refreshLoading = false,
  totalCount,
  className = ''
}) => {
  return (
    <div className={`glass-card p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-white/5 ${className}`}>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto flex-1">
        {onSearchChange !== undefined && (
          <div className="w-full sm:w-64">
            <SearchBar
              value={searchValue}
              onChange={onSearchChange}
              onClear={onSearchClear}
              placeholder={searchPlaceholder}
            />
          </div>
        )}

        {filters.map((f, idx) => (
          <select
            key={idx}
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            className="bg-surface-800 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-gray-200 focus:outline-none focus:border-primary-500/60 transition-colors cursor-pointer"
          >
            {f.options.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ))}
      </div>

      <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
        {totalCount !== undefined && (
          <span className="text-xs text-gray-400 font-mono">
            Total: <strong className="text-white">{totalCount}</strong>
          </span>
        )}

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshLoading}
            className="px-3 py-2 bg-surface-800 border border-white/10 hover:bg-surface-700 text-gray-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
            title="Refresh dataset"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${refreshLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
