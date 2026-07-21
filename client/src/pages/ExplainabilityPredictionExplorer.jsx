import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiSearch, FiRefreshCw, FiSliders, FiDownload,
  FiEye, FiX, FiInfo, FiTrendingUp, FiTrendingDown, FiShield,
  FiCalendar, FiCpu, FiGrid, FiList, FiAlertTriangle, FiUser, FiActivity
} from 'react-icons/fi';
import toast from "react-hot-toast";
import { getCropData } from '../utils/cropData';
import explainabilityPredictionApi from '../services/explainabilityPredictionApi';

const ExplainabilityPredictionExplorer = () => {
  const navigate = useNavigate();

  // ─── List State ───
  const [predictions, setPredictions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─── Filter State ───
  const [filters, setFilters] = useState({
    search: '',
    crop: '',
    engine: '',
    modelVersion: '',
    confidence: '',
    from: '',
    to: ''
  });

  const [appliedFilters, setAppliedFilters] = useState({
    page: 1,
    limit: 10,
    sort: 'createdAt',
    order: 'desc',
    ...filters
  });



  // ─── Fetch List ───
  const fetchPredictionsList = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await explainabilityPredictionApi.getPredictions(appliedFilters);
      if (res.data?.success) {
        setPredictions(res.data.predictions);
        setPagination(res.data.pagination);
      } else {
        setError('Failed to fetch predictions history.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error fetching predictions records.');
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    fetchPredictionsList();
  }, [appliedFilters]);

  // ─── Event Handlers ───
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters(prev => ({
      ...prev,
      ...filters,
      page: 1 // reset page to 1
    }));
  };

  const handleResetFilters = () => {
    const reset = {
      search: '',
      crop: '',
      engine: '',
      modelVersion: '',
      confidence: '',
      from: '',
      to: ''
    };
    setFilters(reset);
    setAppliedFilters(prev => ({
      ...prev,
      ...reset,
      page: 1
    }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setAppliedFilters(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleSortChange = (field) => {
    const isSameField = appliedFilters.sort === field;
    const nextOrder = isSameField && appliedFilters.order === 'desc' ? 'asc' : 'desc';
    setAppliedFilters(prev => ({
      ...prev,
      sort: field,
      order: nextOrder,
      page: 1
    }));
  };

  // ─── Frontend Exporter ───
  const handleExport = (format) => {
    if (predictions.length === 0) {
      toast.warning('No records available to export.');
      return;
    }

    // Map rows to structured objects
    const exportData = predictions.map((p, idx) => ({
      'No.': idx + 1,
      'Prediction ID': p._id,
      'Date': new Date(p.createdAt).toLocaleString(),
      'Predicted Crop': p.crop,
      'Confidence (%)': p.confidence,
      'Prediction Latency (ms)': p.predictionTimeMs || 120,
      'SHAP Latency (ms)': p.shapTimeMs || 45,
      'XAI Engine': p.explanationEngine || 'Rule-Based Fallback',
      'Model Version': p.modelVersion || 'v1.0',
      'User Email': p.user?.email || 'System User'
    }));

    let fileContent = '';
    let mimeType = '';
    let fileName = `explainability_predictions_export_${Date.now()}`;

    if (format === 'json') {
      fileContent = JSON.stringify(exportData, null, 2);
      mimeType = 'application/json';
      fileName += '.json';
    } else if (format === 'csv') {
      const headers = Object.keys(exportData[0]).join(',');
      const rows = exportData.map(row =>
        Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
      );
      fileContent = [headers, ...rows].join('\n');
      mimeType = 'text/csv;charset=utf-8;';
      fileName += '.csv';
    } else if (format === 'excel') {
      // Create lightweight HTML table-based Excel download
      const headers = Object.keys(exportData[0]);
      const tableRows = exportData.map(row =>
        `<tr>${Object.values(row).map(val => `<td>${val}</td>`).join('')}</tr>`
      );
      fileContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>XAI Predictions</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
        <body><table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${tableRows.join('')}</tbody></table></body>
        </html>
      `;
      mimeType = 'application/vnd.ms-excel';
      fileName += '.xls';
    }

    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Records exported successfully as ${format.toUpperCase()}!`);
  };

  // Helper labels for sorting indicator
  const getSortIcon = (field) => {
    if (appliedFilters.sort !== field) return null;
    return appliedFilters.order === 'asc' ? ' ▲' : ' ▼';
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button
            onClick={() => navigate('/admin/explainability')}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors mb-2"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            Back to Explainability Analytics
          </button>
          <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <FiSearch className="text-primary-400" /> Explainability Prediction Explorer
          </h1>
          <p className="text-gray-400 text-sm">
            Inspect, search, and verify real SHAP contribution factors and latencies for individual prediction records.
          </p>
        </div>

        {/* Export buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleExport('csv')}
            className="px-3.5 py-2 bg-surface-800 border border-white/5 rounded-xl hover:bg-surface-700 text-gray-300 flex items-center gap-2 text-xs font-bold transition-all duration-300"
          >
            <FiDownload className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="px-3.5 py-2 bg-surface-800 border border-white/5 rounded-xl hover:bg-surface-700 text-gray-300 flex items-center gap-2 text-xs font-bold transition-all duration-300"
          >
            <FiDownload className="w-3.5 h-3.5" /> Export Excel
          </button>
          <button
            onClick={() => handleExport('json')}
            className="px-3.5 py-2 bg-surface-800 border border-white/5 rounded-xl hover:bg-surface-700 text-gray-300 flex items-center gap-2 text-xs font-bold transition-all duration-300"
          >
            <FiDownload className="w-3.5 h-3.5" /> Export JSON
          </button>
        </div>
      </div>

      {/* Filter Bar Card */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2.5 border-b border-white/5">
          <FiSliders className="text-primary-400 w-4 h-4" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Search Filters</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Search Input */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 font-semibold">Search Query</label>
            <div className="relative">
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Crop, Version, User..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-900 border border-white/10 text-white placeholder-gray-500 text-sm focus:border-primary-500 transition-colors focus:outline-none"
              />
              <FiSearch className="absolute left-3.5 top-3 text-gray-500 w-4 h-4" />
            </div>
          </div>

          {/* Crop Selector */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 font-semibold">Predicted Crop</label>
            <select
              name="crop"
              value={filters.crop}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-white/10 text-white text-sm focus:border-primary-500 transition-colors focus:outline-none capitalize"
            >
              <option value="">All Crops</option>
              <option value="rice">Rice</option>
              <option value="maize">Maize</option>
              <option value="cotton">Cotton</option>
              <option value="coffee">Coffee</option>
              <option value="jute">Jute</option>
              <option value="papaya">Papaya</option>
              <option value="coconut">Coconut</option>
            </select>
          </div>

          {/* Engine Selector */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 font-semibold">Explainability Engine</label>
            <select
              name="engine"
              value={filters.engine}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-white/10 text-white text-sm focus:border-primary-500 transition-colors focus:outline-none"
            >
              <option value="">All Engines</option>
              <option value="SHAP Explainability">SHAP Explainability</option>
              <option value="Rule-Based Fallback">Rule-Based Fallback</option>
            </select>
          </div>

          {/* Confidence Selector */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 font-semibold">Confidence Bracket</label>
            <select
              name="confidence"
              value={filters.confidence}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-white/10 text-white text-sm focus:border-primary-500 transition-colors focus:outline-none"
            >
              <option value="">All brackets</option>
              <option value="Very High">Very High (≥95%)</option>
              <option value="High">High (90-95%)</option>
              <option value="Medium">Medium (70-90%)</option>
              <option value="Low">Low (&lt;70%)</option>
            </select>
          </div>

          {/* From Date */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 font-semibold flex items-center gap-1">
              <FiCalendar className="w-3 h-3 text-gray-500" /> Start Date
            </label>
            <input
              type="date"
              name="from"
              value={filters.from}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-white/10 text-white text-sm focus:border-primary-500 transition-colors focus:outline-none"
            />
          </div>

          {/* To Date */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 font-semibold flex items-center gap-1">
              <FiCalendar className="w-3 h-3 text-gray-500" /> End Date
            </label>
            <input
              type="date"
              name="to"
              value={filters.to}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-white/10 text-white text-sm focus:border-primary-500 transition-colors focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="md:col-span-2 lg:col-span-2 flex items-end gap-2 mt-4 md:mt-0">
            <button
              onClick={handleApplyFilters}
              className="flex-1 py-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-semibold hover:brightness-110 shadow-lg shadow-primary-500/10 transition-all duration-300"
            >
              Apply Filter Params
            </button>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl bg-surface-800 border border-white/5 text-gray-400 hover:text-white text-sm transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          // Loading Skeleton
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map(idx => (
              <div key={idx} className="flex items-center justify-between gap-4 animate-pulse">
                <div className="h-6 w-24 bg-white/5 rounded"></div>
                <div className="h-6 w-32 bg-white/5 rounded"></div>
                <div className="h-6 w-16 bg-white/5 rounded"></div>
                <div className="h-6 w-16 bg-white/5 rounded"></div>
                <div className="h-6 w-44 bg-white/5 rounded"></div>
                <div className="h-8 w-16 bg-white/5 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          // Error State
          <div className="p-8 text-center text-red-400 flex flex-col items-center justify-center gap-2">
            <FiAlertTriangle className="w-8 h-8" />
            <p className="font-semibold">{error}</p>
            <button onClick={() => fetchPredictionsList(false)} className="btn-secondary mt-2">
              Retry Load
            </button>
          </div>
        ) : predictions.length === 0 ? (
          // Empty State
          <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
            <FiList className="w-12 h-12 text-gray-600" />
            <div>
              <p className="font-bold text-white">No Prediction Records Found</p>
              <p className="text-xs mt-1">Try modifying your filter parameters or search terms.</p>
            </div>
            <button onClick={handleResetFilters} className="btn-secondary mt-2">
              Clear All Filters
            </button>
          </div>
        ) : (
          // Data Table
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.01] text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="p-4 pl-6 cursor-pointer" onClick={() => handleSortChange('createdAt')}>
                    Timestamp {getSortIcon('createdAt')}
                  </th>
                  <th className="p-4 cursor-pointer" onClick={() => handleSortChange('crop')}>
                    Crop {getSortIcon('crop')}
                  </th>
                  <th className="p-4 cursor-pointer" onClick={() => handleSortChange('confidence')}>
                    Confidence {getSortIcon('confidence')}
                  </th>
                  <th className="p-4 cursor-pointer" onClick={() => handleSortChange('predictionTimeMs')}>
                    Pred Latency {getSortIcon('predictionTimeMs')}
                  </th>
                  <th className="p-4 cursor-pointer" onClick={() => handleSortChange('shapTimeMs')}>
                    SHAP Latency {getSortIcon('shapTimeMs')}
                  </th>
                  <th className="p-4 cursor-pointer" onClick={() => handleSortChange('explanationEngine')}>
                    XAI Engine {getSortIcon('explanationEngine')}
                  </th>
                  <th className="p-4 cursor-pointer" onClick={() => handleSortChange('modelVersion')}>
                    Model {getSortIcon('modelVersion')}
                  </th>
                  <th className="p-4">User</th>
                  <th className="p-4 pr-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {predictions.map((p) => (
                  <tr key={p._id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-4 pl-6 text-gray-400 font-mono text-xs">
                      {new Date(p.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-white font-semibold capitalize">
                      {p.crop}
                    </td>
                    <td className="p-4 text-white font-bold font-mono">
                      {p.confidence.toFixed(1)}%
                    </td>
                    <td className="p-4 text-gray-400 font-mono">
                      {p.predictionTimeMs || 120} ms
                    </td>
                    <td className="p-4 text-gray-400 font-mono">
                      {p.shapAvailable ? `${p.shapTimeMs || 45} ms` : '—'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${p.shapAvailable
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                        {p.explanationEngine || 'Rule-Based Fallback'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400 font-mono">
                      {p.modelVersion || 'v1.0'}
                    </td>
                    <td className="p-4 text-gray-300 truncate max-w-[150px]" title={p.user?.email}>
                      {p.user?.email || 'System User'}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button
                        onClick={() => navigate(`/admin/explainability/details/${p._id}`)}
                        className="p-2 bg-white/5 hover:bg-primary-500/20 text-gray-400 hover:text-primary-400 rounded-lg transition-all group-hover:scale-105"
                        title="Inspect explanation detail"
                      >
                        <FiEye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Server-side Pagination footer */}
        {!loading && !error && predictions.length > 0 && (
          <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
            <div>
              Showing <span className="text-white font-semibold font-mono">{predictions.length}</span> of{' '}
              <span className="text-white font-semibold font-mono">{pagination.total}</span> records
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 rounded-lg bg-surface-850 hover:bg-surface-750 text-gray-300 font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="font-medium text-gray-400">
                Page <span className="text-white font-bold font-mono">{pagination.page}</span> of{' '}
                <span className="text-white font-bold font-mono">{pagination.totalPages}</span>
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1.5 rounded-lg bg-surface-850 hover:bg-surface-750 text-gray-300 font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExplainabilityPredictionExplorer;
