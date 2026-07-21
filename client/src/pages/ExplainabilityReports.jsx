import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiRefreshCw, FiFileText, FiDownload, FiDownloadCloud,
  FiActivity, FiZap, FiPercent, FiClock, FiCpu, FiTrendingUp,
  FiPieChart, FiBarChart2, FiList, FiDatabase, FiLayers, FiAlertCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend
} from 'recharts';
import explainabilityReportApi from '../services/explainabilityReportApi';

// ─── Color Palettes ─────────────────────────────────────────────────────────
const COLORS_CONFIDENCE = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
const COLORS_ENGINE = ['#10b981', '#64748b'];
const COLORS_CROPS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1'];

// ─── Skeleton Loader ────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="glass-card p-6 animate-pulse">
    <div className="h-3 w-24 bg-white/10 rounded mb-3"></div>
    <div className="h-7 w-16 bg-white/10 rounded"></div>
  </div>
);

const SkeletonChart = ({ height = 'h-72' }) => (
  <div className="glass-card p-6 animate-pulse">
    <div className="h-4 w-40 bg-white/10 rounded mb-4"></div>
    <div className={`${height} w-full bg-white/5 rounded-xl`}></div>
  </div>
);

const SkeletonTable = () => (
  <div className="glass-card p-6 animate-pulse">
    <div className="h-4 w-48 bg-white/10 rounded mb-4"></div>
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-8 w-full bg-white/5 rounded mb-2"></div>
    ))}
  </div>
);

// ─── Custom Tooltip ─────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, suffix = '' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-900/90 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-md">
        {label && <p className="text-xs text-gray-400 font-semibold mb-1">{label}</p>}
        {payload.map((p, idx) => (
          <p key={idx} className="text-sm font-bold" style={{ color: p.color || p.fill }}>
            {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}{suffix}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Empty State ────────────────────────────────────────────────────────────
const EmptyState = ({ message = 'No data available' }) => (
  <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-2 py-8">
    <FiAlertCircle className="w-8 h-8 opacity-40" />
    <span className="text-sm">{message}</span>
  </div>
);

const ExplainabilityReports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [exporting, setExporting] = useState({ json: false, csv: false, pdf: false });

  // ─── Fetch Report Summary ───────────────────────────────────────────────
  const fetchReport = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await explainabilityReportApi.getSummary();
      if (res.data?.success) {
        setData(res.data.data);
        if (!silent) toast.success('Report data refreshed successfully');
      } else {
        throw new Error('Failed to load report data');
      }
    } catch (err) {
      console.error('[Reports] Fetch Error:', err);
      const msg = err.response?.data?.message || 'Failed to load report data';
      setError(msg);
      if (!silent) toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // ─── Download helper ──────────────────────────────────────────────────────
  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  // ─── Export Handlers ──────────────────────────────────────────────────────
  const handleExportJSON = async () => {
    setExporting(prev => ({ ...prev, json: true }));
    try {
      const res = await explainabilityReportApi.exportJSON();
      const blob = new Blob([res.data], { type: 'application/json' });
      downloadBlob(blob, `explainability-report-${new Date().toISOString().split('T')[0]}.json`);
      toast.success('JSON report downloaded');
    } catch (err) {
      console.error('[Reports] JSON Export Error:', err);
      toast.error('Failed to export JSON report');
    } finally {
      setExporting(prev => ({ ...prev, json: false }));
    }
  };

  const handleExportCSV = async () => {
    setExporting(prev => ({ ...prev, csv: true }));
    try {
      const res = await explainabilityReportApi.exportCSV();
      const blob = new Blob([res.data], { type: 'text/csv' });
      downloadBlob(blob, `explainability-report-${new Date().toISOString().split('T')[0]}.csv`);
      toast.success('CSV report downloaded');
    } catch (err) {
      console.error('[Reports] CSV Export Error:', err);
      toast.error('Failed to export CSV report');
    } finally {
      setExporting(prev => ({ ...prev, csv: false }));
    }
  };

  const handleExportPDF = async () => {
    setExporting(prev => ({ ...prev, pdf: true }));
    try {
      const res = await explainabilityReportApi.exportPDF();
      const blob = new Blob([res.data], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const pdfWindow = window.open(url, '_blank');
      if (pdfWindow) {
        pdfWindow.onload = () => {
          setTimeout(() => pdfWindow.print(), 500);
        };
      }
      toast.success('PDF report opened — use Print to save as PDF');
    } catch (err) {
      console.error('[Reports] PDF Export Error:', err);
      toast.error('Failed to export PDF report');
    } finally {
      setExporting(prev => ({ ...prev, pdf: false }));
    }
  };

  // ─── Derived Data ─────────────────────────────────────────────────────────
  const summary = data?.summary || {};
  const topCrops = data?.topCrops || [];
  const topFeatures = data?.topFeatures || [];
  const confidenceDistribution = data?.confidenceDistribution || [];
  const cropDistribution = data?.cropDistribution || [];
  const dailyTrend = data?.dailyTrend || [];
  const latencyTrend = data?.latencyTrend || [];
  const modelUsage = data?.modelUsage || [];

  // Engine usage for pie chart
  const engineUsage = [
    { name: 'SHAP', value: summary.shapPredictions || 0 },
    { name: 'Rule-Based', value: summary.ruleBasedPredictions || 0 }
  ].filter(item => item.value > 0);
  if (engineUsage.length === 0) {
    engineUsage.push({ name: 'Rule-Based', value: 1 });
  }

  // Fallback % calculation
  const fallbackPct = summary.totalPredictions > 0
    ? parseFloat(((summary.ruleBasedPredictions / summary.totalPredictions) * 100).toFixed(1))
    : 0;

  // ─── Error State ──────────────────────────────────────────────────────────
  if (error && !data) {
    return (
      <div className="space-y-8 animate-fade-in pb-12">
        <div>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors mb-2"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            Back to MLOps Dashboard
          </button>
          <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <FiFileText className="text-primary-400" /> Explainability Reports
          </h1>
        </div>
        <div className="glass-card p-12 flex flex-col items-center justify-center gap-4">
          <FiAlertCircle className="w-12 h-12 text-red-400 opacity-60" />
          <p className="text-gray-400 text-center">{error}</p>
          <button
            onClick={() => fetchReport(false)}
            className="px-5 py-2.5 bg-primary-500/20 text-primary-400 rounded-xl font-semibold text-sm hover:bg-primary-500/30 transition-all flex items-center gap-2"
          >
            <FiRefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  // ─── Loading Skeleton ─────────────────────────────────────────────────────
  if (loading && !data) {
    return (
      <div className="space-y-8 animate-fade-in pb-12">
        <div>
          <div className="h-3 w-48 bg-white/10 rounded mb-4 animate-pulse"></div>
          <div className="h-8 w-64 bg-white/10 rounded mb-2 animate-pulse"></div>
          <div className="h-3 w-96 bg-white/10 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SkeletonChart />
          <SkeletonChart />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <SkeletonChart height="h-56" />
          <SkeletonChart height="h-56" />
          <SkeletonChart height="h-56" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SkeletonTable />
          <SkeletonTable />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors mb-2"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            Back to MLOps Dashboard
          </button>
          <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <FiFileText className="text-primary-400" /> Explainability Reports
          </h1>
          <p className="text-gray-400 text-sm">
            Enterprise reporting center — generate, visualize, and export comprehensive explainability metrics.
          </p>
          {data?.generatedAt && (
            <p className="text-xs text-gray-600 mt-1">
              Last generated: {new Date(data.generatedAt).toLocaleString()}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => fetchReport(false)}
            disabled={loading}
            className="px-4 py-2 bg-surface-800 border border-white/5 rounded-xl hover:bg-surface-700 text-gray-300 flex items-center gap-2 text-sm font-semibold transition-all duration-300 disabled:opacity-50"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExportJSON}
            disabled={exporting.json}
            className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 text-blue-400 flex items-center gap-2 text-sm font-semibold transition-all duration-300 disabled:opacity-50"
          >
            <FiDownload className={`w-4 h-4 ${exporting.json ? 'animate-bounce' : ''}`} />
            JSON
          </button>
          <button
            onClick={handleExportCSV}
            disabled={exporting.csv}
            className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 text-emerald-400 flex items-center gap-2 text-sm font-semibold transition-all duration-300 disabled:opacity-50"
          >
            <FiDownloadCloud className={`w-4 h-4 ${exporting.csv ? 'animate-bounce' : ''}`} />
            CSV
          </button>
          <button
            onClick={handleExportPDF}
            disabled={exporting.pdf}
            className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl hover:bg-purple-500/20 text-purple-400 flex items-center gap-2 text-sm font-semibold transition-all duration-300 disabled:opacity-50"
          >
            <FiFileText className={`w-4 h-4 ${exporting.pdf ? 'animate-bounce' : ''}`} />
            PDF
          </button>
        </div>
      </div>

      {/* ─── Summary Cards Row 1 ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Predictions */}
        <div className="glass-card-hover p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center border border-primary-500/20 shrink-0">
            <FiActivity className="text-primary-400 w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Predictions</p>
            <h3 className="text-2xl font-bold text-white mt-1 font-mono">{summary.totalPredictions || 0}</h3>
          </div>
        </div>

        {/* Avg Confidence */}
        <div className="glass-card-hover p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
            <FiPercent className="text-blue-400 w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Avg Confidence</p>
            <h3 className="text-2xl font-bold text-blue-400 mt-1 font-mono">{summary.avgConfidence || 0}%</h3>
          </div>
        </div>

        {/* SHAP Coverage */}
        <div className="glass-card-hover p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
            <FiZap className="text-emerald-400 w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">SHAP Coverage</p>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1 font-mono">{summary.shapCoverage || 0}%</h3>
          </div>
        </div>

        {/* Fallback % */}
        <div className="glass-card-hover p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
            <FiDatabase className="text-amber-400 w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Fallback %</p>
            <h3 className="text-2xl font-bold text-amber-400 mt-1 font-mono">{fallbackPct}%</h3>
          </div>
        </div>
      </div>

      {/* ─── Summary Cards Row 2 ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Avg Prediction Time */}
        <div className="glass-card-hover p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shrink-0">
            <FiClock className="text-cyan-400 w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Avg Prediction Time</p>
            <h3 className="text-2xl font-bold text-cyan-400 mt-1 font-mono">{summary.avgPredictionTime || 0} ms</h3>
          </div>
        </div>

        {/* Avg SHAP Time */}
        <div className="glass-card-hover p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shrink-0">
            <FiClock className="text-purple-400 w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Avg SHAP Time</p>
            <h3 className="text-2xl font-bold text-purple-400 mt-1 font-mono">{summary.avgShapTime || 0} ms</h3>
          </div>
        </div>

        {/* Top Model Version */}
        <div className="glass-card-hover p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center border border-primary-500/20 shrink-0">
            <FiCpu className="text-primary-400 w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Top Model Version</p>
            <h3 className="text-2xl font-bold text-white mt-1 font-mono">{summary.mostUsedModelVersion || 'v1.0'}</h3>
          </div>
        </div>

        {/* Active Engine */}
        <div className="glass-card-hover p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
            <FiZap className="text-emerald-400 w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Active XAI Engine</p>
            <h3 className="text-sm font-bold text-white mt-2 truncate w-44">{summary.activeEngine || 'Rule-Based'}</h3>
          </div>
        </div>
      </div>

      {/* ─── Charts Row 1: Prediction Trend + Latency Trend ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Prediction Trend (30 days) */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiTrendingUp className="text-primary-400" /> Prediction Trend (30 Days)
          </h3>
          <div className="h-72 w-full">
            {dailyTrend.length === 0 ? (
              <EmptyState message="No trend data available" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="reportAreaColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="predictions" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#reportAreaColor)" name="Predictions" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Latency Trend */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiClock className="text-cyan-400" /> Latency Trend (30 Days)
          </h3>
          <div className="h-72 w-full">
            {latencyTrend.length === 0 ? (
              <EmptyState message="No latency data available" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={latencyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis unit="ms" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip suffix="ms" />} />
                  <Line type="monotone" dataKey="avgLatency" stroke="#06b6d4" strokeWidth={2.5} dot={{ fill: '#06b6d4', strokeWidth: 1 }} activeDot={{ r: 6 }} name="Avg Latency" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ─── Charts Row 2: Distribution Charts ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Crop Distribution */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <FiList className="text-primary-400" /> Crop Distribution
          </h3>
          <p className="text-xs text-gray-500 mb-4">Top recommended crops by volume</p>
          <div className="h-64 w-full">
            {cropDistribution.length === 0 ? (
              <EmptyState message="No crop data" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cropDistribution} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis dataKey="crop" type="category" width={80} axisLine={false} tickLine={false} tick={{ fill: '#cbd5e1', fontSize: 11, fontWeight: 500 }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={14} name="Predictions">
                    {cropDistribution.map((_, idx) => (
                      <Cell key={`crop-${idx}`} fill={COLORS_CROPS[idx % COLORS_CROPS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Feature Importance */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <FiBarChart2 className="text-secondary-400" /> Feature Importance
          </h3>
          <p className="text-xs text-gray-500 mb-4">Average SHAP importance scores</p>
          <div className="h-64 w-full">
            {topFeatures.length === 0 ? (
              <EmptyState message="No feature data" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topFeatures} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="feature" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis unit="%" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip suffix="%" />} />
                  <Bar dataKey="importance" radius={[4, 4, 0, 0]} fill="#10b981" barSize={28} name="Importance" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* SHAP vs Rule-Based Pie */}
        <div className="glass-card-hover p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <FiZap className="text-emerald-400" /> SHAP vs Rule-Based
            </h3>
            <p className="text-xs text-gray-500 mb-4">Engine usage distribution</p>
          </div>
          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={engineUsage}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {engineUsage.map((_, index) => (
                    <Cell key={`engine-${index}`} fill={COLORS_ENGINE[index % COLORS_ENGINE.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-semibold text-gray-400">
            {engineUsage.map((entry, idx) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS_ENGINE[idx] }}></span>
                <span>{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Charts Row 3: Confidence Distribution ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Confidence Distribution Pie */}
        <div className="glass-card-hover p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <FiPieChart className="text-blue-400" /> Confidence Distribution
            </h3>
            <p className="text-xs text-gray-500 mb-4">Predictions grouped by confidence bracket</p>
          </div>
          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={confidenceDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {confidenceDistribution.map((_, index) => (
                    <Cell key={`conf-${index}`} fill={COLORS_CONFIDENCE[index % COLORS_CONFIDENCE.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-semibold text-gray-400">
            {confidenceDistribution.map((entry, idx) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS_CONFIDENCE[idx] }}></span>
                <span>{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Confidence Trend from Daily Data */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiActivity className="text-secondary-400" /> Confidence Trend (30 Days)
          </h3>
          <div className="h-72 w-full">
            {dailyTrend.length === 0 ? (
              <EmptyState message="No confidence trend data" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[50, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip suffix="%" />} />
                  <Line type="monotone" dataKey="avgConfidence" stroke="#fb923c" strokeWidth={2.5} dot={{ fill: '#fb923c', strokeWidth: 1 }} activeDot={{ r: 6 }} name="Avg Confidence" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ─── Tables Section ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top Features Table */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiBarChart2 className="text-emerald-400" /> Top Features
          </h3>
          {topFeatures.length === 0 ? (
            <EmptyState message="No feature data" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-xs text-gray-500 font-semibold uppercase tracking-wider pb-3 pr-4">#</th>
                    <th className="text-left text-xs text-gray-500 font-semibold uppercase tracking-wider pb-3 pr-4">Feature</th>
                    <th className="text-right text-xs text-gray-500 font-semibold uppercase tracking-wider pb-3">Importance</th>
                  </tr>
                </thead>
                <tbody>
                  {topFeatures.map((f, idx) => (
                    <tr key={f.feature} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 pr-4 text-gray-500 font-mono text-xs">{idx + 1}</td>
                      <td className="py-2.5 pr-4 text-gray-200 font-medium">{f.feature}</td>
                      <td className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-400 rounded-full transition-all duration-700"
                              style={{ width: `${Math.min(f.importance * 3, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-emerald-400 font-mono text-xs font-bold w-10 text-right">{f.importance}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Recommended Crops Table */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiLayers className="text-blue-400" /> Top Crops
          </h3>
          {topCrops.length === 0 ? (
            <EmptyState message="No crop data" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-xs text-gray-500 font-semibold uppercase tracking-wider pb-3 pr-4">#</th>
                    <th className="text-left text-xs text-gray-500 font-semibold uppercase tracking-wider pb-3 pr-4">Crop</th>
                    <th className="text-right text-xs text-gray-500 font-semibold uppercase tracking-wider pb-3">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {topCrops.map((c, idx) => (
                    <tr key={c.crop} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 pr-4 text-gray-500 font-mono text-xs">{idx + 1}</td>
                      <td className="py-2.5 pr-4 text-gray-200 font-medium capitalize">{c.crop}</td>
                      <td className="py-2.5 text-right">
                        <span className="inline-block px-2.5 py-0.5 bg-blue-500/10 text-blue-400 rounded-lg font-mono text-xs font-bold">
                          {c.count}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Model Usage Table */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiCpu className="text-purple-400" /> Model Usage
          </h3>
          {modelUsage.length === 0 ? (
            <EmptyState message="No model data" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-xs text-gray-500 font-semibold uppercase tracking-wider pb-3 pr-4">Version</th>
                    <th className="text-right text-xs text-gray-500 font-semibold uppercase tracking-wider pb-3 pr-4">Predictions</th>
                    <th className="text-right text-xs text-gray-500 font-semibold uppercase tracking-wider pb-3">Usage</th>
                  </tr>
                </thead>
                <tbody>
                  {modelUsage.map((m) => (
                    <tr key={m.version} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 pr-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-primary-500/10 text-primary-400 rounded-lg font-mono text-xs font-bold">
                          <FiCpu className="w-3 h-3" />
                          {m.version}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-right text-gray-200 font-mono text-sm">{m.predictions}</td>
                      <td className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-14 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-400 rounded-full transition-all duration-700"
                              style={{ width: `${m.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-purple-400 font-mono text-xs font-bold w-12 text-right">{m.percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExplainabilityReports;
