import React, { useState, useEffect } from 'react';
import { historyAPI } from '../services/api';
import HistoryTable from '../components/HistoryTable';
import { FiClock, FiFilter, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [filterCrop, setFilterCrop] = useState('');

  const fetchHistory = async (page = 1, limit = 10, crop = '') => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (crop) params.crop = crop;
      
      const res = await historyAPI.getHistory(params);
      setHistory(res.data.data.predictions);
      setPagination(res.data.data.pagination);
    } catch (error) {
      console.error('Failed to fetch history', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(pagination.page, pagination.limit, filterCrop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, filterCrop]);

  const handleFilterChange = (e) => {
    setFilterCrop(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <FiClock className="text-primary-400" /> Prediction History
          </h1>
          <p className="text-gray-400">
            View and analyze all your past AI crop recommendations.
          </p>
        </div>
        
        {/* Filter */}
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiFilter className="text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Filter by crop name..."
            value={filterCrop}
            onChange={handleFilterChange}
            className="input-field pl-10 py-2 w-full text-sm"
          />
        </div>
      </div>

      <div className="flex-1">
        <HistoryTable history={history} loading={loading} />
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-between items-center bg-surface-900 border border-white/5 p-4 rounded-xl">
          <p className="text-sm text-gray-400">
            Showing <span className="text-white font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="text-white font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="text-white font-medium">{pagination.total}</span> entries
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 rounded-lg bg-surface-800 text-gray-400 hover:text-white hover:bg-surface-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FiChevronLeft />
            </button>
            <div className="flex items-center gap-1 px-2">
              {[...Array(pagination.pages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => handlePageChange(i + 1)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    pagination.page === i + 1
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                      : 'text-gray-400 hover:bg-surface-700 hover:text-white'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="p-2 rounded-lg bg-surface-800 text-gray-400 hover:text-white hover:bg-surface-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FiChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
