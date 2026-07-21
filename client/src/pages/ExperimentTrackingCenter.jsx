import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiRefreshCw, FiDatabase, FiCheckCircle, FiAlertTriangle,
  FiAlertCircle, FiClock, FiCpu, FiSearch, FiFilter, FiDownload,
  FiFileText, FiLayers, FiSend, FiX, FiEye, FiCopy, FiCheck, FiSliders, FiPieChart
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ComposedChart
} from 'recharts';
import experimentTrackingApi from '../services/experimentTrackingApi';
import modelDeploymentApi from '../services/modelDeploymentApi';

// ─── Constants ──────────────────────────────────────────────────────────────
const ALGORITHM_OPTIONS = [
  { value: '', label: 'All Algorithms' },
  { value: 'RandomForest', label: 'Random Forest' },
  { value: 'XGBoost', label: 'XGBoost' },
  { value: 'LightGBM', label: 'LightGBM' },
  { value: 'NeuralNetwork', label: 'Neural Network' },
  { value: 'SVM', label: 'SVM' }
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'SUCCESS', label: 'SUCCESS' },
  { value: 'FAILED', label: 'FAILED' },
  { value: 'RUNNING', label: 'RUNNING' }
];

const ALGO_COLORS = {
  RandomForest: '#10b981',
  XGBoost: '#3b82f6',
  LightGBM: '#8b5cf6',
  NeuralNetwork: '#ef4444',
  SVM: '#f59e0b'
};

// ─── Skeleton Components ────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="glass-card p-6 animate-pulse">
    <div className="h-3 w-24 bg-white/10 rounded mb-3"></div>
    <div className="h-7 w-16 bg-white/10 rounded"></div>
  </div>
);

const SkeletonTable = () => (
  <div className="glass-card p-6 animate-pulse">
    <div className="h-4 w-48 bg-white/10 rounded mb-4"></div>
    <div className="space-y-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-12 bg-white/5 rounded-xl"></div>
      ))}
    </div>
  </div>
);

// ─── Custom Tooltip ─────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, suffix = '' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-900/90 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-md font-mono text-xs">
        {label && <p className="text-gray-400 font-semibold mb-1">{label}</p>}
        {payload.map((p, idx) => (
          <p key={idx} className="font-bold" style={{ color: p.color || p.fill }}>
            {p.name}: {typeof p.value === 'number' ? p.value.toFixed(3) : p.value}{suffix}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Empty State ────────────────────────────────────────────────────────────
const EmptyState = ({ message = 'No experiment runs found' }) => (
  <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-2 py-12">
    <FiDatabase className="w-8 h-8 opacity-40" />
    <span className="text-sm">{message}</span>
  </div>
);

// ─── Status Badge ───────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const styles = {
    SUCCESS: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    FAILED: 'bg-red-500/15 text-red-400 border-red-500/30',
    RUNNING: 'bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse'
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono border ${styles[status] || 'bg-gray-500/15 text-gray-400'}`}>
      {status}
    </span>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
const ExperimentTrackingCenter = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [runsList, setRunsList] = useState([]);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlgo, setSelectedAlgo] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Selected runs for comparison
  const [selectedRunIds, setSelectedRunIds] = useState([]);

  // Drawer & Modal States
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRunDetail, setSelectedRunDetail] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState('summary');

  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [comparisonData, setComparisonData] = useState(null);

  // Fetch Summary & Runs
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [summaryRes, runsRes] = await Promise.all([
        experimentTrackingApi.getSummary(),
        experimentTrackingApi.getRuns({
          search: searchTerm,
          algorithm: selectedAlgo,
          status: selectedStatus
        })
      ]);

      if (summaryRes.data?.success) setSummary(summaryRes.data.data);
      if (runsRes.data?.success) setRunsList(runsRes.data.data.runs || []);

      if (!silent) toast.success('Experiment tracking telemetry updated');
    } catch (err) {
      console.error('[Experiment Tracking] Fetch Error:', err);
      const msg = err.response?.data?.message || 'Failed to load experiment tracking telemetry';
      setError(msg);
      if (!silent) toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedAlgo, selectedStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open Detail Drawer
  const handleOpenDetail = async (runId) => {
    try {
      const res = await experimentTrackingApi.getDetails(runId);
      if (res.data?.success) {
        setSelectedRunDetail(res.data.data.run);
        setDetailModalOpen(true);
      }
    } catch (err) {
      toast.error('Failed to load run details');
    }
  };

  // Open Compare Panel
  const handleOpenCompare = async (targetRunIds) => {
    const idsToCompare = targetRunIds || selectedRunIds;
    if (idsToCompare.length < 2 && !targetRunIds) {
      toast.error('Please select at least 2 experiment runs to compare');
      return;
    }
    const toastId = toast.loading('Comparing experiment runs...');
    try {
      const res = await experimentTrackingApi.compareRuns(idsToCompare.join(','));
      if (res.data?.success) {
        setComparisonData(res.data.data);
        setCompareModalOpen(true);
        toast.dismiss(toastId);
      }
    } catch (err) {
      toast.error('Failed to compare experiment runs', { id: toastId });
    }
  };

  // Checkbox selection toggle
  const toggleSelectRun = (experimentId) => {
    if (selectedRunIds.includes(experimentId)) {
      setSelectedRunIds(selectedRunIds.filter(id => id !== experimentId));
    } else {
      if (selectedRunIds.length >= 3) {
        toast.error('Maximum 3 runs can be selected for side-by-side comparison');
        return;
      }
      setSelectedRunIds([...selectedRunIds, experimentId]);
    }
  };

  // Deploy Best Model Action
  const handleDeployBestModel = async (modelVersion) => {
    const toastId = toast.loading(`Deploying model ${modelVersion}...`);
    try {
      const res = await modelDeploymentApi.deploy({
        version: modelVersion,
        notes: `Promoted from Experiment Tracking Center (${modelVersion})`
      });
      if (res.data?.success) {
        toast.success(`Model version ${modelVersion} deployed!`, { id: toastId });
        navigate('/admin/deployments');
      }
    } catch (err) {
      toast.error('Failed to deploy model version', { id: toastId });
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (runsList.length === 0) return;
    const headers = ['Experiment ID', 'Run Name', 'Algorithm', 'Accuracy', 'F1 Score', 'Status', 'Duration', 'Dataset'];
    const csvRows = runsList.map(r => [
      r.experimentId,
      r.runName,
      r.algorithm,
      r.accuracyPct,
      r.f1ScorePct,
      r.status,
      r.trainingDuration,
      r.datasetVersion
    ].join(','));

    const csvContent = `data:text/csv;charset=utf-8,${[headers.join(','), ...csvRows].join('\n')}`;
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `Experiment_Runs_Export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    toast.success('Exported experiment runs CSV');
  };

  // ─── Error State ──────────────────────────────────────────────────────────
  if (error && !summary) {
    return (
      <div className="space-y-8 animate-fade-in pb-12">
        <div>
          <button onClick={() => navigate('/admin/operations')} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors mb-2">
            <FiArrowLeft className="w-3.5 h-3.5" /> Back to AI Operations
          </button>
          <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <FiDatabase className="text-primary-400" /> Enterprise Experiment Tracking Center
          </h1>
        </div>
        <div className="glass-card p-12 flex flex-col items-center justify-center gap-4">
          <FiAlertCircle className="w-12 h-12 text-red-400 opacity-60" />
          <p className="text-gray-400 text-center">{error}</p>
          <button onClick={() => fetchData(false)} className="px-5 py-2.5 bg-primary-500/20 text-primary-400 rounded-xl font-semibold text-sm hover:bg-primary-500/30 transition-all flex items-center gap-2">
            <FiRefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  // ─── Loading Skeleton ─────────────────────────────────────────────────────
  if (loading && !summary) {
    return (
      <div className="space-y-8 animate-fade-in pb-12">
        <div>
          <div className="h-3 w-48 bg-white/10 rounded mb-4 animate-pulse"></div>
          <div className="h-8 w-64 bg-white/10 rounded mb-2 animate-pulse"></div>
          <div className="h-3 w-96 bg-white/10 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <SkeletonTable />
      </div>
    );
  }

  const s = summary || {};

  // Algorithm Distribution Pie Chart Data
  const algoCount = {};
  runsList.forEach(r => {
    algoCount[r.algorithm] = (algoCount[r.algorithm] || 0) + 1;
  });
  const algoPieData = Object.entries(algoCount).map(([name, value]) => ({
    name,
    value,
    color: ALGO_COLORS[name] || '#64748b'
  }));

  // Accuracy Trend Chart Data
  const accuracyTrendData = [...runsList].reverse().map(r => ({
    name: r.runName.length > 15 ? r.runName.slice(0, 15) + '...' : r.runName,
    'Training Accuracy': (r.accuracy || 0.94) * 100,
    'Validation Accuracy': (r.validationAccuracy || 0.93) * 100
  }));

  // Loss Trend Chart Data
  const lossTrendData = [...runsList].reverse().map(r => ({
    name: r.runName.length > 15 ? r.runName.slice(0, 15) + '...' : r.runName,
    'Training Loss': r.loss || 0.12,
    'Validation Loss': r.validationLoss || 0.15
  }));

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button onClick={() => navigate('/admin/operations')} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors mb-2">
            <FiArrowLeft className="w-3.5 h-3.5" /> Back to AI Operations
          </button>
          <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <FiDatabase className="text-primary-400" /> Enterprise Experiment Tracking Center
          </h1>
          <p className="text-gray-400 text-sm">
            MLflow-style experiment registry — hyperparameter tracking, model metrics, artifact logs, and side-by-side run comparisons
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {selectedRunIds.length >= 2 && (
            <button
              onClick={() => handleOpenCompare(selectedRunIds)}
              className="px-4 py-2 bg-primary-500/20 text-primary-400 border border-primary-500/30 rounded-xl font-bold text-xs flex items-center gap-2 transition-all hover:bg-primary-500/30"
            >
              <FiSliders className="w-4 h-4" /> Compare Selected ({selectedRunIds.length})
            </button>
          )}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-surface-800 border border-white/10 text-gray-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
          >
            <FiDownload className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button onClick={() => fetchData(false)} disabled={loading}
            className="px-4 py-2 bg-surface-800 border border-white/5 rounded-xl hover:bg-surface-700 text-gray-300 flex items-center gap-2 text-xs font-semibold transition-all duration-300 disabled:opacity-50">
            <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* ─── 6 Summary Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Runs */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center border border-primary-500/20 shrink-0">
            <FiDatabase className="text-primary-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Total Runs</p>
            <h3 className="text-xl font-bold text-primary-400 mt-0.5 font-mono">{s.totalRuns || 0}</h3>
          </div>
        </div>

        {/* Successful Runs */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
            <FiCheckCircle className="text-emerald-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Successful</p>
            <h3 className="text-xl font-bold text-emerald-400 mt-0.5 font-mono">{s.successfulRuns || 0}</h3>
          </div>
        </div>

        {/* Failed Runs */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 shrink-0">
            <FiAlertCircle className="text-red-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Failed</p>
            <h3 className="text-xl font-bold text-red-400 mt-0.5 font-mono">{s.failedRuns || 0}</h3>
          </div>
        </div>

        {/* Running */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
            <FiClock className="text-amber-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Running</p>
            <h3 className="text-xl font-bold text-amber-400 mt-0.5 font-mono">{s.runningExperiments || 0}</h3>
          </div>
        </div>

        {/* Best Accuracy */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shrink-0">
            <FiCpu className="text-cyan-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Best Accuracy</p>
            <h3 className="text-xl font-bold text-cyan-400 mt-0.5 font-mono">{s.bestAccuracy || '95.8%'}</h3>
          </div>
        </div>

        {/* Average Training Time */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shrink-0">
            <FiClock className="text-purple-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Avg Duration</p>
            <h3 className="text-sm font-bold text-purple-400 mt-1 font-mono truncate">{s.averageTrainingTime || '35 mins'}</h3>
          </div>
        </div>
      </div>

      {/* ─── Search & Filters Bar ────────────────────────────────────────────── */}
      <div className="glass-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-3.5 top-3 text-gray-500 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search run name or ID..."
            className="w-full bg-surface-800 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold">
            <FiFilter className="w-3.5 h-3.5" /> Filter:
          </div>

          <select
            value={selectedAlgo}
            onChange={(e) => setSelectedAlgo(e.target.value)}
            className="bg-surface-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none"
          >
            {ALGORITHM_OPTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-surface-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none"
          >
            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* ─── Charts Row 1: Accuracy Trend & Loss Trend ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Accuracy Trend */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiCpu className="text-primary-400" /> Training vs Validation Accuracy (%)
          </h3>
          <div className="h-72 w-full">
            {accuracyTrendData.length === 0 ? (
              <EmptyState message="No accuracy trend data" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={accuracyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="expAccGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[85, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip suffix="%" />} />
                  <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
                  <Area type="monotone" dataKey="Training Accuracy" stroke="#10b981" fill="url(#expAccGrad)" strokeWidth={2} />
                  <Line type="monotone" dataKey="Validation Accuracy" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4' }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Loss Trend */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiTrendingDown className="text-amber-400" /> Training vs Validation Loss
          </h3>
          <div className="h-72 w-full">
            {lossTrendData.length === 0 ? (
              <EmptyState message="No loss trend data" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lossTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
                  <Line type="monotone" dataKey="Training Loss" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                  <Line type="monotone" dataKey="Validation Loss" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444' }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ─── Experiment Runs Table ───────────────────────────────────────────── */}
      <div className="glass-card-hover p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FiLayers className="text-primary-400" /> Experiment Runs Log
          </h3>
          <span className="text-xs text-gray-500 font-mono">
            Select checkboxes to compare up to 3 runs
          </span>
        </div>

        {runsList.length === 0 ? (
          <EmptyState message="No experiment runs match filters" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-3 py-3 w-8"></th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Experiment ID</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Run Name</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Algorithm</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-right">Accuracy</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-right">Val Acc</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-right">Duration</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-center">Status</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {runsList.map((r, idx) => {
                  const isSelected = selectedRunIds.includes(r.experimentId);
                  return (
                    <tr key={r.experimentId} className={`border-b border-white/5 transition-colors hover:bg-white/[0.02] ${isSelected ? 'bg-primary-500/[0.03]' : idx % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                      <td className="px-3 py-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRun(r.experimentId)}
                          className="rounded bg-surface-800 border-white/20 text-primary-500 focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3.5 font-mono font-bold text-xs text-primary-400">
                        {r.experimentId}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-semibold text-white block">{r.runName}</span>
                        <span className="text-[10px] text-gray-500 font-mono">{r.datasetVersion} • {r.modelVersion}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/5">
                          {r.algorithm}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-400 text-sm">
                        {r.accuracyPct}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-gray-300 text-sm">
                        {r.validationAccuracyPct}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-xs text-purple-400">
                        {r.trainingDuration}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenDetail(r.experimentId)}
                            className="p-1.5 bg-surface-800 text-gray-300 border border-white/10 rounded-lg hover:text-white hover:bg-surface-700 transition-all"
                            title="View Details"
                          >
                            <FiEye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeployBestModel(r.modelVersion)}
                            className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold hover:bg-emerald-500/30 transition-all flex items-center gap-1"
                            title="Deploy Model Version"
                          >
                            <FiSend className="w-3 h-3" /> Deploy
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── DETAIL DRAWER MODAL ────────────────────────────────────────────── */}
      {detailModalOpen && selectedRunDetail && (
        <div className="fixed inset-0 bg-surface-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-2xl w-full p-6 border-primary-500/30 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
              <div>
                <span className="text-[10px] text-primary-400 font-mono font-bold uppercase tracking-wider">{selectedRunDetail.experimentId}</span>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">{selectedRunDetail.runName}</h3>
              </div>
              <button onClick={() => setDetailModalOpen(false)} className="text-gray-400 hover:text-white"><FiX className="w-5 h-5" /></button>
            </div>

            {/* Detail Modal Tabs */}
            <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
              {['summary', 'hyperparameters', 'metrics', 'artifacts'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveDetailTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${activeDetailTab === tab ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'text-gray-400 hover:text-white'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab 1: Summary */}
            {activeDetailTab === 'summary' && (
              <div className="space-y-4 text-xs font-mono">
                <div className="grid grid-cols-2 gap-3 p-3 bg-white/5 rounded-xl">
                  <p><span className="text-gray-400">Algorithm:</span> <span className="text-white font-bold">{selectedRunDetail.algorithm}</span></p>
                  <p><span className="text-gray-400">Framework:</span> <span className="text-white">{selectedRunDetail.framework}</span></p>
                  <p><span className="text-gray-400">Dataset:</span> <span className="text-white">{selectedRunDetail.datasetVersion} ({selectedRunDetail.datasetSize} samples)</span></p>
                  <p><span className="text-gray-400">Model Version:</span> <span className="text-emerald-400 font-bold">{selectedRunDetail.modelVersion}</span></p>
                  <p><span className="text-gray-400">Status:</span> <StatusBadge status={selectedRunDetail.status} /></p>
                  <p><span className="text-gray-400">Duration:</span> <span className="text-purple-400">{selectedRunDetail.trainingDuration}</span></p>
                </div>
                <div>
                  <span className="text-gray-400 block mb-1">Checkpoint Path:</span>
                  <div className="p-2.5 bg-surface-950 rounded-lg text-gray-300">{selectedRunDetail.checkpointPath}</div>
                </div>
                <div>
                  <span className="text-gray-400 block mb-1">Notes:</span>
                  <div className="p-2.5 bg-surface-950 rounded-lg text-gray-300">{selectedRunDetail.notes}</div>
                </div>
              </div>
            )}

            {/* Tab 2: Hyperparameters */}
            {activeDetailTab === 'hyperparameters' && (
              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-4 bg-white/5 rounded-xl">
                  <span className="text-gray-400 text-[10px] block mb-1">Epochs</span>
                  <span className="text-lg font-bold text-white">{selectedRunDetail.epochs}</span>
                </div>
                <div className="p-4 bg-white/5 rounded-xl">
                  <span className="text-gray-400 text-[10px] block mb-1">Learning Rate</span>
                  <span className="text-lg font-bold text-cyan-400">{selectedRunDetail.learningRate}</span>
                </div>
                <div className="p-4 bg-white/5 rounded-xl">
                  <span className="text-gray-400 text-[10px] block mb-1">Batch Size</span>
                  <span className="text-lg font-bold text-white">{selectedRunDetail.batchSize}</span>
                </div>
                <div className="p-4 bg-white/5 rounded-xl">
                  <span className="text-gray-400 text-[10px] block mb-1">Optimizer</span>
                  <span className="text-lg font-bold text-purple-400">{selectedRunDetail.optimizer}</span>
                </div>
              </div>
            )}

            {/* Tab 3: Metrics */}
            {activeDetailTab === 'metrics' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 bg-white/5 rounded-xl">
                  <span className="text-gray-400 text-[10px] block">Accuracy</span>
                  <span className="text-base font-bold text-emerald-400">{selectedRunDetail.accuracyPct}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl">
                  <span className="text-gray-400 text-[10px] block">Validation Acc</span>
                  <span className="text-base font-bold text-emerald-400">{selectedRunDetail.validationAccuracyPct}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl">
                  <span className="text-gray-400 text-[10px] block">F1 Score</span>
                  <span className="text-base font-bold text-white">{selectedRunDetail.f1ScorePct}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl">
                  <span className="text-gray-400 text-[10px] block">Loss</span>
                  <span className="text-base font-bold text-amber-400">{selectedRunDetail.loss}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl">
                  <span className="text-gray-400 text-[10px] block">Validation Loss</span>
                  <span className="text-base font-bold text-red-400">{selectedRunDetail.validationLoss}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl">
                  <span className="text-gray-400 text-[10px] block">Inference Time</span>
                  <span className="text-base font-bold text-cyan-400">{selectedRunDetail.inferenceTimeMs} ms</span>
                </div>
              </div>
            )}

            {/* Tab 4: Artifacts */}
            {activeDetailTab === 'artifacts' && (
              <div className="space-y-3 font-mono text-xs">
                {(selectedRunDetail.artifacts || []).map((art, idx) => (
                  <div key={idx} className="p-3 bg-surface-950 border border-white/5 rounded-xl flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-white">{art.name}</h5>
                      <span className="text-[10px] text-gray-400">{art.type} • {art.path}</span>
                    </div>
                    <span className="text-xs text-primary-400 font-bold">{(art.sizeKb / 1024).toFixed(2)} MB</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
              <button onClick={() => setDetailModalOpen(false)} className="px-4 py-2 bg-surface-800 text-gray-300 rounded-xl text-xs font-bold hover:text-white">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── COMPARE PANEL MODAL ────────────────────────────────────────────── */}
      {compareModalOpen && comparisonData && (
        <div className="fixed inset-0 bg-surface-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-2xl w-full p-6 border-primary-500/30 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FiSliders className="text-primary-400" /> Side-by-Side Run Comparison
              </h3>
              <button onClick={() => setCompareModalOpen(false)} className="text-gray-400 hover:text-white"><FiX className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-2 gap-4 my-4 font-mono text-xs">
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <span className="text-[10px] text-blue-400 font-bold block mb-1">RUN A</span>
                <h4 className="text-sm font-bold text-white">{comparisonData.runA.runName}</h4>
                <p className="text-gray-400 mt-1">Accuracy: <span className="text-emerald-400 font-bold">{((comparisonData.runA.accuracy || 0.94) * 100).toFixed(1)}%</span></p>
                <p className="text-gray-400">Algo: {comparisonData.runA.algorithm}</p>
              </div>

              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <span className="text-[10px] text-purple-400 font-bold block mb-1">RUN B</span>
                <h4 className="text-sm font-bold text-white">{comparisonData.runB.runName}</h4>
                <p className="text-gray-400 mt-1">Accuracy: <span className="text-emerald-400 font-bold">{((comparisonData.runB.accuracy || 0.95) * 100).toFixed(1)}%</span></p>
                <p className="text-gray-400">Algo: {comparisonData.runB.algorithm}</p>
              </div>
            </div>

            {/* Metric Differences Table */}
            <div className="overflow-x-auto my-4">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-gray-500">
                    <th className="py-2">Metric</th>
                    <th className="py-2 text-right">Run A</th>
                    <th className="py-2 text-right">Run B</th>
                    <th className="py-2 text-right">Delta</th>
                    <th className="py-2 text-center">Winner</th>
                  </tr>
                </thead>
                <tbody>
                  {(comparisonData.metricDifferences || []).map((m, idx) => (
                    <tr key={idx} className="border-b border-white/5">
                      <td className="py-2 text-gray-300 font-bold">{m.metric}</td>
                      <td className="py-2 text-right text-gray-400">{m.runAVal}</td>
                      <td className="py-2 text-right text-gray-400">{m.runBVal}</td>
                      <td className="py-2 text-right text-emerald-400 font-bold">{m.diff}</td>
                      <td className="py-2 text-center">
                        <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded text-[10px] font-bold">
                          {m.winner}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 font-mono">
              💡 {comparisonData.recommendation}
            </div>

            <div className="flex justify-end pt-4">
              <button onClick={() => setCompareModalOpen(false)} className="px-4 py-2 bg-surface-800 text-gray-300 rounded-xl text-xs font-bold hover:text-white">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExperimentTrackingCenter;
