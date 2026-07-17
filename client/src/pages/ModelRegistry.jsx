/**
 * Phase-6 Step-1: Model Registry Page
 * Phase-6 Step-2: Production Model Deployment & Rollback
 *
 * Production-style Model Registry admin page.
 * Displays a searchable, filterable, paginated table of all registered models.
 * Includes a detail modal for each model entry with full metrics and metadata.
 *
 * Phase-6 Step-2 additions:
 *  - Secure model deployment and rollback.
 *  - Add Deploy button for ARCHIVED/CANDIDATE models.
 *  - Disable Deploy button for ACTIVE model.
 *  - Show ACTIVE badge.
 *  - Auto-refresh table after deployment.
 *
 * Dark theme matching existing MLOps Dashboard aesthetic.
 */
import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { modelRegistryAPI } from '../services/modelRegistryApi';
import {
  FiDatabase, FiRefreshCw, FiAlertTriangle, FiSearch,
  FiFilter, FiChevronLeft, FiChevronRight, FiEye,
  FiX, FiCpu, FiClock, FiHardDrive, FiLayers,
  FiActivity, FiZap, FiImage, FiLink
} from 'react-icons/fi';

const ModelRegistry = () => {
  // ─── Data state ───
  const [entries, setEntries] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─── Filter state ───
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [architectureFilter, setArchitectureFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;

  // ─── Detail modal state ───
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ─── Phase-6 Step-2: Deployment state ───
  const [confirmDeploy, setConfirmDeploy] = useState(null);
  const [deployingId, setDeployingId] = useState(null);

  // ─── Fetch registry data ───
  const fetchRegistry = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await modelRegistryAPI.getRegistryList({
        page,
        limit,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        architecture: architectureFilter.trim() || undefined
      });
      setEntries(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to load model registry:', err);
      const msg = err.response?.status === 403
        ? 'Admin access required.'
        : 'Failed to load model registry.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, architectureFilter]);

  useEffect(() => {
    fetchRegistry();
  }, [fetchRegistry]);

  // ─── View Details handler ───
  const handleViewDetails = async (entry) => {
    setDetailLoading(true);
    setSelectedEntry(entry); // Show modal immediately with table data

    try {
      const res = await modelRegistryAPI.getRegistryDetail(entry._id);
      setSelectedEntry(res.data.data); // Replace with full data including trainingHistory
    } catch (err) {
      console.error('Failed to load registry detail:', err);
      toast.error('Failed to load model details.');
    } finally {
      setDetailLoading(false);
    }
  };

  // ─── Phase-6 Step-2: Model Deployment handler ───
  const handleDeployModel = async (entry) => {
    if (!entry) return;
    setConfirmDeploy(null);
    setDeployingId(entry._id);
    const toastId = toast.loading(`Deploying model ${entry.version} to production...`);

    try {
      const res = await modelRegistryAPI.deployModel(entry._id);

      toast.success(res.data.message || `Model ${entry.version} successfully deployed.`, {
        id: toastId
      });

      // Close detail modal if open
      setSelectedEntry(null);

      // Refresh registry automatically
      await fetchRegistry();
    } catch (err) {
      console.error('Failed to deploy model:', err);
      const errMsg = err.response?.data?.message || 'Failed to deploy model version.';
      toast.error(errMsg, { id: toastId });
    } finally {
      setDeployingId(null);
    }
  };

  // ─── Search with debounce effect ───
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ─── Helpers ───
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "—";

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h) return `${h}h ${m}m`;
    if (m) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const pct = (val) => {
    if (val == null) return "—";

    return val <= 1
      ? `${(val * 100).toFixed(2)}%`
      : `${val.toFixed(2)}%`;
  };

  const statusBadge = (status) => {
    const styles = {
      ACTIVE: 'bg-green-500/10 text-green-400 border-green-500/20',
      ARCHIVED: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
      CANDIDATE: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    };
    return (
      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold border ${styles[status] || styles.ARCHIVED}`}>
        {status}
      </span>
    );
  };

  // ─── Loading skeleton ───
  if (loading && entries.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="h-8 w-64 bg-surface-800 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-96 bg-surface-800 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="glass-card p-6 space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 bg-surface-800 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Error state ───
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="glass-card p-12 text-center max-w-md border-red-500/20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <FiAlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-display font-bold text-white mb-2">Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={fetchRegistry}
            className="btn-primary w-full py-2.5 text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* ─── Page Header ─── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <FiDatabase className="text-primary-400" /> Model Registry
          </h1>
          <p className="text-gray-400">
            Production model registry — track, compare, and audit every trained model artifact.
          </p>
        </div>
        <button
          onClick={fetchRegistry}
          disabled={loading}
          className="px-4 py-2 bg-surface-800 border border-white/5 rounded-xl hover:bg-surface-700 text-gray-300 flex items-center gap-2 text-sm font-semibold transition-all duration-300 disabled:opacity-50"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ─── Filters Row ─── */}
      <div className="glass-card p-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by version (e.g. v1.2)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-800 border border-white/5 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/30 focus:ring-1 focus:ring-primary-500/20 transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="pl-10 pr-8 py-2.5 bg-surface-800 border border-white/5 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-primary-500/30 appearance-none cursor-pointer transition-all min-w-[160px]"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
              <option value="CANDIDATE">Candidate</option>
            </select>
          </div>

          {/* Architecture Filter */}
          <div className="relative">
            <FiLayers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Architecture..."
              value={architectureFilter}
              onChange={(e) => { setArchitectureFilter(e.target.value); setPage(1); }}
              className="pl-10 pr-4 py-2.5 bg-surface-800 border border-white/5 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/30 focus:ring-1 focus:ring-primary-500/20 transition-all min-w-[180px]"
            />
          </div>
        </div>
      </div>

      {/* ─── Registry Table ─── */}
      <div className="glass-card p-6">
        {entries.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-surface-800 flex items-center justify-center">
              <FiDatabase className="w-7 h-7 text-gray-500" />
            </div>
            <h3 className="text-lg font-display font-bold text-white mb-2">No Models Found</h3>
            <p className="text-gray-400 text-sm">
              {search || statusFilter || architectureFilter
                ? 'No models match the current filters.'
                : 'Train your first model to see it here.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="border-b border-white/5 text-xs text-gray-500 font-semibold uppercase">
                    <th className="pb-3">Version</th>
                    <th className="pb-3">Architecture</th>
                    <th className="pb-3">Accuracy</th>
                    <th className="pb-3">Precision</th>
                    <th className="pb-3">Recall</th>
                    <th className="pb-3">F1</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Training Date</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                  {entries.map((entry) => (
                    <tr
                      key={entry._id}
                      className={`transition-colors ${entry.status === 'ACTIVE'
                        ? 'bg-green-500/[0.04] hover:bg-green-500/[0.07]'
                        : 'hover:bg-white/[0.02]'
                        }`}
                    >
                      <td className="py-3.5 font-bold text-white">{entry.version}</td>
                      <td className="py-3.5">
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-surface-800 text-gray-300 border border-white/5">
                          {entry.architecture || '—'}
                        </span>
                      </td>
                      <td className={`py-3.5 font-semibold ${entry.accuracy != null && entry.accuracy >= 0.9 ? 'text-green-400' :
                        entry.accuracy != null && entry.accuracy >= 0.7 ? 'text-amber-400' :
                          entry.accuracy != null ? 'text-red-400' : 'text-gray-500'
                        }`}>
                        {pct(entry.accuracy)}
                      </td>
                      <td className="py-3.5">{pct(entry.precision)}</td>
                      <td className="py-3.5">{pct(entry.recall)}</td>
                      <td className="py-3.5">{pct(entry.f1Score)}</td>
                      <td className="py-3.5">{statusBadge(entry.status)}</td>
                      <td className="py-3.5 text-xs text-gray-500">{formatDate(entry.trainedAt || entry.createdAt)}</td>
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewDetails(entry)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 bg-primary-500/10 text-primary-400 border border-primary-500/20 hover:bg-primary-500/20 hover:text-primary-300"
                          >
                            <FiEye className="w-3.5 h-3.5" />
                            View Details
                          </button>

                          {entry.status === 'ACTIVE' ? (
                            <button
                              disabled
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-500/10 text-gray-500 border border-gray-500/10 cursor-not-allowed opacity-50"
                              title="This model is currently deployed and active."
                            >
                              <FiZap className="w-3.5 h-3.5" />
                              Deployed
                            </button>
                          ) : (
                            <button
                              onClick={() => setConfirmDeploy(entry)}
                              disabled={deployingId !== null}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 hover:text-green-300 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {deployingId === entry._id ? (
                                <>
                                  <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  Deploying...
                                </>
                              ) : (
                                <>
                                  <FiZap className="w-3.5 h-3.5" />
                                  Deploy
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ─── Pagination ─── */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                <p className="text-xs text-gray-500">
                  Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount} models
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!pagination.hasPrev}
                    className="p-2 rounded-lg bg-surface-800 border border-white/5 text-gray-400 hover:bg-surface-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <FiChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-gray-400 font-semibold px-3">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={!pagination.hasNext}
                    className="p-2 rounded-lg bg-surface-800 border border-white/5 text-gray-400 hover:bg-surface-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/*  DETAIL MODAL                                                         */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {selectedEntry && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedEntry(null)}
        >
          <div
            className="glass-card max-w-2xl w-full mx-4 overflow-hidden flex flex-col max-h-[90vh] animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-surface-900/50">
              <div>
                <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                  <FiCpu className="text-primary-400" />
                  {selectedEntry.version} — Registry Detail
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Complete model artifact metadata and training details.
                </p>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
              {detailLoading && (
                <div className="flex justify-center py-4">
                  <FiRefreshCw className="w-5 h-5 text-primary-400 animate-spin" />
                </div>
              )}

              {/* Status & Version Banner */}
              <div className="flex items-center justify-between w-full flex-wrap gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-2xl font-display font-extrabold text-white">{selectedEntry.version}</span>
                  {statusBadge(selectedEntry.status)}
                  {selectedEntry.architecture && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-800 text-gray-300 border border-white/5">
                      <FiLayers className="w-3 h-3" /> {selectedEntry.architecture}
                    </span>
                  )}
                </div>

                {selectedEntry.status !== 'ACTIVE' && (
                  <button
                    onClick={() => {
                      setConfirmDeploy(selectedEntry);
                      setSelectedEntry(null); // Close detail modal to show confirmation modal
                    }}
                    disabled={deployingId !== null}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 hover:text-green-300 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <FiZap className="w-3.5 h-3.5" />
                    Deploy Model
                  </button>
                )}
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {[
                  { label: 'Accuracy', value: selectedEntry.accuracy, pctVal: true, icon: FiActivity, color: 'text-green-400' },
                  { label: 'Precision', value: selectedEntry.precision, pctVal: true, icon: FiActivity, color: 'text-blue-400' },
                  { label: 'Recall', value: selectedEntry.recall, pctVal: true, icon: FiActivity, color: 'text-purple-400' },
                  { label: 'F1 Score', value: selectedEntry.f1Score, pctVal: true, icon: FiActivity, color: 'text-amber-400' },
                  { label: 'Val Loss', value: selectedEntry.loss, pctVal: false, icon: FiActivity, color: 'text-red-400' },
                  { label: 'Epochs', value: selectedEntry.epochs, pctVal: false, icon: FiLayers, color: 'text-cyan-400' },
                  { label: 'Train Images', value: selectedEntry.trainingImages, pctVal: false, icon: FiImage, color: 'text-gray-300' },
                  { label: 'Val Images', value: selectedEntry.validationImages, pctVal: false, icon: FiImage, color: 'text-gray-300' }
                ].map((metric) => (
                  <div key={metric.label} className="bg-surface-800/50 rounded-xl p-3 border border-white/5">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">{metric.label}</p>
                    <p className={`text-lg font-display font-extrabold ${metric.color}`}>
                      {metric.value != null
                        ? metric.pctVal
                          ? pct(metric.value)
                          : metric.label === 'Val Loss'
                            ? metric.value.toFixed(4)
                            : metric.value
                        : '—'}
                    </p>
                  </div>
                ))}
              </div>

              {/* Infrastructure Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-surface-800/50 rounded-xl p-4 border border-white/5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <FiZap className={`w-5 h-5 ${selectedEntry.gpuUsed ? 'text-amber-400' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">GPU Used</p>
                    <p className="text-sm font-bold text-white">{selectedEntry.gpuUsed ? 'Yes (CUDA)' : 'No (CPU)'}</p>
                  </div>
                </div>

                <div className="bg-surface-800/50 rounded-xl p-4 border border-white/5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <FiClock className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Training Duration</p>
                    <p className="text-sm font-bold text-white">
                      {selectedEntry.trainingDuration != null ? formatDuration(selectedEntry.trainingDuration) : '—'}
                    </p>
                  </div>
                </div>

                <div className="bg-surface-800/50 rounded-xl p-4 border border-white/5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <FiHardDrive className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Model Size</p>
                    <p className="text-sm font-bold text-white">
                      {selectedEntry.modelSizeMB != null ? `${selectedEntry.modelSizeMB} MB` : '—'}
                    </p>
                  </div>
                </div>

                <div className="bg-surface-800/50 rounded-xl p-4 border border-white/5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <FiClock className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Training Date</p>
                    <p className="text-sm font-bold text-white">{formatDate(selectedEntry.trainedAt || selectedEntry.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Model Path */}
              {selectedEntry.filePath && (
                <div className="bg-surface-800/50 rounded-xl p-4 border border-white/5">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">Model Path</p>
                  <code className="text-xs text-primary-400 font-mono break-all">{selectedEntry.filePath}</code>
                </div>
              )}

              {/* Training History Link */}
              {selectedEntry.trainingHistory && (
                <div className="bg-surface-800/50 rounded-xl p-4 border border-white/5">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">Training History</p>
                  <div className="flex items-center gap-2 text-sm">
                    <FiLink className="w-3.5 h-3.5 text-primary-400" />
                    <span className="text-gray-300 font-mono text-xs">
                      ID: {typeof selectedEntry.trainingHistory === 'object'
                        ? selectedEntry.trainingHistory._id
                        : selectedEntry.trainingHistory}
                    </span>
                    {typeof selectedEntry.trainingHistory === 'object' && selectedEntry.trainingHistory.status && (
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold border ${selectedEntry.trainingHistory.status === 'SUCCESS'
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                        {selectedEntry.trainingHistory.status}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/*  DEPLOYMENT CONFIRMATION MODAL                                        */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {confirmDeploy && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setConfirmDeploy(null)}
        >
          <div
            className="glass-card p-8 max-w-sm w-full mx-4 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-green-500/10 flex items-center justify-center">
              <FiZap className="w-7 h-7 text-green-400 animate-pulse" />
            </div>

            <h3 className="text-lg font-display font-bold text-white text-center mb-2">
              Deploy Model {confirmDeploy.version}?
            </h3>
            <p className="text-gray-400 text-sm text-center mb-6">
              This will set this model version as active for live predictions and archive the currently active version.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeploy(null)}
                className="btn-secondary flex-1 py-2.5 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeployModel(confirmDeploy)}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg hover:shadow-xl shadow-green-500/25 hover:shadow-green-500/30"
              >
                Confirm Deploy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelRegistry;
