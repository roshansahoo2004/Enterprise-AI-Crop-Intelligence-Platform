import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiRefreshCw, FiActivity, FiCheckCircle,
  FiAlertTriangle, FiAlertCircle, FiDatabase, FiShield,
  FiTrendingUp, FiTrendingDown, FiCpu, FiLayers
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import dataDriftApi from '../services/dataDriftApi';

// ─── Skeleton Components ────────────────────────────────────────────────────
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
    <div className="space-y-3">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="h-10 bg-white/5 rounded-lg"></div>
      ))}
    </div>
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
            {p.name}: {typeof p.value === 'number' ? p.value.toFixed(4) : p.value}{suffix}
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

// ─── Severity Badge ─────────────────────────────────────────────────────────
const SeverityBadge = ({ severity, animated = true }) => {
  const getColors = (sev) => {
    switch (sev) {
      case 'Healthy':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'Moderate Drift':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'High Drift':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/15 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${getColors(severity)} ${animated && severity !== 'Healthy' ? 'animate-pulse' : ''}`}>
      {severity === 'Healthy' && <FiCheckCircle className="w-3 h-3" />}
      {severity === 'Moderate Drift' && <FiAlertTriangle className="w-3 h-3" />}
      {severity === 'High Drift' && <FiAlertCircle className="w-3 h-3" />}
      {severity}
    </span>
  );
};

// ─── Status Badge ───────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const color = status === 'Stable'
    ? 'text-emerald-400 bg-emerald-500/10'
    : status === 'Warning'
      ? 'text-amber-400 bg-amber-500/10'
      : 'text-red-400 bg-red-500/10';

  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${color}`}>
      {status}
    </span>
  );
};

// ─── Drift Score Gauge ──────────────────────────────────────────────────────
const DriftGauge = ({ score, severity }) => {
  const getColor = (s) => {
    if (s < 0.10) return { stroke: '#10b981', glow: 'rgba(16, 185, 129, 0.3)', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
    if (s <= 0.25) return { stroke: '#f59e0b', glow: 'rgba(245, 158, 11, 0.3)', text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
    return { stroke: '#ef4444', glow: 'rgba(239, 68, 68, 0.3)', text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' };
  };

  const colors = getColor(score);
  const normalizedScore = Math.min(score / 0.5, 1); // Normalize to 0-1 range (0.5 as max display)
  const circumference = 2 * Math.PI * 88;
  const dashOffset = circumference - normalizedScore * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-52 h-52">
        {/* Glow effect */}
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-40"
          style={{ backgroundColor: colors.glow }}
        ></div>

        <svg className="w-52 h-52 transform -rotate-90" viewBox="0 0 200 200">
          {/* Background circle */}
          <circle
            cx="100" cy="100" r="88"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="12"
          />
          {/* Progress circle */}
          <circle
            cx="100" cy="100" r="88"
            fill="none"
            stroke={colors.stroke}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-1000 ease-out"
            style={{
              filter: `drop-shadow(0 0 8px ${colors.glow})`
            }}
          />
          {/* Inner decorative circle */}
          <circle
            cx="100" cy="100" r="76"
            fill="none"
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="1"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold font-mono ${colors.text} transition-all duration-700`}>
            {score.toFixed(4)}
          </span>
          <span className="text-xs text-gray-500 font-semibold uppercase tracking-widest mt-1">
            PSI Score
          </span>
        </div>
      </div>

      {/* Severity badge */}
      <div className={`mt-5 px-5 py-2 rounded-xl ${colors.bg} border ${colors.border} flex items-center gap-2`}>
        {score < 0.10 ? <FiCheckCircle className={`w-4 h-4 ${colors.text}`} /> :
          score <= 0.25 ? <FiAlertTriangle className={`w-4 h-4 ${colors.text}`} /> :
            <FiAlertCircle className={`w-4 h-4 ${colors.text}`} />}
        <span className={`text-sm font-bold ${colors.text}`}>
          {severity || 'Unknown'}
        </span>
      </div>
    </div>
  );
};

// ─── PIE CHART COLORS ───────────────────────────────────────────────────────
const SEVERITY_PIE_COLORS = {
  Healthy: '#10b981',
  'Moderate Drift': '#f59e0b',
  'High Drift': '#ef4444'
};

const DataDriftDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [features, setFeatures] = useState([]);
  const [history, setHistory] = useState([]);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [summaryRes, featuresRes, historyRes] = await Promise.all([
        dataDriftApi.getSummary(),
        dataDriftApi.getFeatures(),
        dataDriftApi.getHistory()
      ]);

      if (summaryRes.data?.success) setSummary(summaryRes.data.data);
      if (featuresRes.data?.success) setFeatures(featuresRes.data.data);
      if (historyRes.data?.success) setHistory(historyRes.data.data);
      if (!silent) toast.success('Data drift analysis refreshed');
    } catch (err) {
      console.error('[Data Drift] Fetch Error:', err);
      const msg = err.response?.data?.message || 'Failed to load data drift analysis';
      setError(msg);
      if (!silent) toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Error State ──────────────────────────────────────────────────────────
  if (error && !summary) {
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
            <FiActivity className="text-primary-400" /> Data Drift Detection
          </h1>
        </div>
        <div className="glass-card p-12 flex flex-col items-center justify-center gap-4">
          <FiAlertCircle className="w-12 h-12 text-red-400 opacity-60" />
          <p className="text-gray-400 text-center">{error}</p>
          <button
            onClick={() => fetchData(false)}
            className="px-5 py-2.5 bg-primary-500/20 text-primary-400 rounded-xl font-semibold text-sm hover:bg-primary-500/30 transition-all flex items-center gap-2"
          >
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="glass-card p-8 animate-pulse flex flex-col items-center justify-center">
            <div className="w-48 h-48 rounded-full bg-white/5 mb-4"></div>
            <div className="h-4 w-32 bg-white/10 rounded mb-2"></div>
          </div>
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SkeletonChart />
          <SkeletonChart />
        </div>
        <SkeletonTable />
      </div>
    );
  }

  const s = summary || {};

  // ─── Prepare severity pie data ────────────────────────────────────────────
  const severityCounts = { Healthy: 0, 'Moderate Drift': 0, 'High Drift': 0 };
  features.forEach(f => {
    if (severityCounts[f.severity] !== undefined) severityCounts[f.severity]++;
  });
  const severityPieData = Object.entries(severityCounts)
    .filter(([, count]) => count > 0)
    .map(([name, value]) => ({ name, value }));

  // ─── Feature comparison bar chart data ────────────────────────────────────
  const featureComparisonData = features.map(f => ({
    name: f.feature,
    PSI: parseFloat(f.psi.toFixed(4)),
    fill: f.severity === 'Healthy' ? '#10b981' : f.severity === 'Moderate Drift' ? '#f59e0b' : '#ef4444'
  }));

  // ─── PSI distribution data ────────────────────────────────────────────────
  const psiDistributionData = features.map(f => ({
    name: f.feature,
    psi: parseFloat(f.psi.toFixed(4)),
    baselineMean: f.baselineMean,
    currentMean: f.currentMean,
  }));

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
            <FiActivity className="text-primary-400" /> Data Drift Detection
          </h1>
          <p className="text-gray-400 text-sm">
            Population Stability Index (PSI) analysis — monitoring feature distribution shifts in production data
          </p>
          {s.lastDriftAnalysis && (
            <p className="text-xs text-gray-600 mt-1">
              Last analysis: {new Date(s.lastDriftAnalysis).toLocaleString()}
            </p>
          )}
        </div>

        <button
          onClick={() => fetchData(false)}
          disabled={loading}
          className="px-4 py-2 bg-surface-800 border border-white/5 rounded-xl hover:bg-surface-700 text-gray-300 flex items-center gap-2 text-sm font-semibold transition-all duration-300 disabled:opacity-50"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ─── Retraining Alert ────────────────────────────────────────────────── */}
      {s.retrainingRecommended && (
        <div className="glass-card border-red-500/30 bg-red-500/5 p-5 flex items-center gap-4 animate-pulse">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center border border-red-500/30 shrink-0">
            <FiAlertTriangle className="text-red-400 w-6 h-6" />
          </div>
          <div>
            <h3 className="text-red-400 font-bold text-sm">⚠ Retraining Recommended</h3>
            <p className="text-red-300/70 text-xs mt-0.5">{s.retrainingMessage}</p>
          </div>
        </div>
      )}

      {/* ─── Drift Gauge + Summary Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Drift Gauge */}
        <div className="glass-card-hover p-8 flex flex-col items-center justify-center">
          <DriftGauge score={s.overallDriftScore || 0} severity={s.driftSeverity} />

          {/* Threshold Reference */}
          <div className="w-full mt-8 space-y-2">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">PSI Thresholds</p>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-xs text-gray-400 flex-1">PSI &lt; 0.10</span>
              <span className="text-xs text-emerald-400 font-bold">Healthy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-xs text-gray-400 flex-1">0.10 – 0.25</span>
              <span className="text-xs text-amber-400 font-bold">Moderate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-xs text-gray-400 flex-1">PSI &gt; 0.25</span>
              <span className="text-xs text-red-400 font-bold">High Drift</span>
            </div>
          </div>

          {/* Overall severity */}
          <div className="w-full mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiCpu className="w-4 h-4 text-primary-400" />
              <span className="text-xs text-gray-400 font-medium">Overall</span>
            </div>
            <SeverityBadge severity={s.driftSeverity || 'Unknown'} animated={false} />
          </div>
        </div>

        {/* Summary Cards Grid */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {/* Overall Drift Score */}
          <div className="glass-card-hover p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
              <FiActivity className="text-blue-400 w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Drift Score</p>
              <h3 className="text-xl font-bold text-blue-400 mt-0.5 font-mono">{(s.overallDriftScore || 0).toFixed(4)}</h3>
            </div>
          </div>

          {/* Healthy Features */}
          <div className="glass-card-hover p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <FiCheckCircle className="text-emerald-400 w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Healthy Features</p>
              <h3 className="text-xl font-bold text-emerald-400 mt-0.5 font-mono">{s.healthyFeatures || 0}<span className="text-sm text-gray-500">/{s.totalFeatures || 7}</span></h3>
            </div>
          </div>

          {/* Drifted Features */}
          <div className="glass-card-hover p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
              <FiAlertTriangle className="text-amber-400 w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Drifted Features</p>
              <h3 className="text-xl font-bold text-amber-400 mt-0.5 font-mono">{s.driftedFeatures || 0}</h3>
            </div>
          </div>

          {/* Retraining Status */}
          <div className="glass-card-hover p-5 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${s.retrainingRecommended ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
              <FiShield className={`w-5 h-5 ${s.retrainingRecommended ? 'text-red-400' : 'text-emerald-400'}`} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Retraining</p>
              <h3 className={`text-sm font-bold mt-0.5 ${s.retrainingRecommended ? 'text-red-400' : 'text-emerald-400'}`}>
                {s.retrainingRecommended ? 'Recommended' : 'Not Needed'}
              </h3>
            </div>
          </div>

          {/* Baseline Samples */}
          <div className="glass-card-hover p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shrink-0">
              <FiDatabase className="text-purple-400 w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Baseline Samples</p>
              <h3 className="text-xl font-bold text-purple-400 mt-0.5 font-mono">{s.baselineDatasetSize || 0}</h3>
            </div>
          </div>

          {/* Production Samples */}
          <div className="glass-card-hover p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shrink-0">
              <FiLayers className="text-cyan-400 w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Production Samples</p>
              <h3 className="text-xl font-bold text-cyan-400 mt-0.5 font-mono">{s.currentDatasetSize || 0}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Charts Row 1: Drift Trend + Feature Comparison ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Overall Drift Trend */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiTrendingUp className="text-primary-400" /> Overall Drift Trend
          </h3>
          <div className="h-72 w-full">
            {history.length === 0 ? (
              <EmptyState message="No drift history available" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="driftTrendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="overallPSI" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#driftTrendGrad)" name="Overall PSI" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Feature Drift Comparison */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiTrendingDown className="text-amber-400" /> Feature Drift Comparison
          </h3>
          <div className="h-72 w-full">
            {featureComparisonData.length === 0 ? (
              <EmptyState message="No feature data available" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={featureComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} angle={-25} textAnchor="end" height={60} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="PSI" radius={[6, 6, 0, 0]} barSize={28} name="PSI Score">
                    {featureComparisonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ─── Charts Row 2: PSI Distribution + Severity Pie ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* PSI Distribution (baseline vs current means) */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiLayers className="text-cyan-400" /> PSI Distribution
          </h3>
          <div className="h-72 w-full">
            {psiDistributionData.length === 0 ? (
              <EmptyState message="No PSI data available" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={psiDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} angle={-25} textAnchor="end" height={60} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="baselineMean" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', strokeWidth: 1 }} activeDot={{ r: 6 }} name="Baseline Mean" />
                  <Line type="monotone" dataKey="currentMean" stroke="#ef4444" strokeWidth={2.5} dot={{ fill: '#ef4444', strokeWidth: 1 }} activeDot={{ r: 6 }} name="Current Mean" strokeDasharray="5 5" />
                  <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Severity Pie Chart */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiShield className="text-purple-400" /> Severity Distribution
          </h3>
          <div className="h-72 w-full flex items-center justify-center">
            {severityPieData.length === 0 ? (
              <EmptyState message="No severity data available" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={{ stroke: '#64748b' }}
                  >
                    {severityPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SEVERITY_PIE_COLORS[entry.name] || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      backdropFilter: 'blur(10px)',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ─── Feature Drift Table ─────────────────────────────────────────────── */}
      <div className="glass-card-hover p-6">
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <FiDatabase className="text-primary-400" /> Feature Drift Analysis
        </h3>

        {features.length === 0 ? (
          <EmptyState message="No feature data available" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Feature</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-right">Baseline Mean</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-right">Current Mean</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-right">PSI</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-right">Drift %</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-center">Severity</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {features.map((f, idx) => (
                  <tr key={f.key} className={`border-b border-white/5 transition-colors hover:bg-white/[0.02] ${idx % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full ${f.severity === 'Healthy' ? 'bg-emerald-400' : f.severity === 'Moderate Drift' ? 'bg-amber-400' : 'bg-red-400'}`}></div>
                        <span className="text-sm font-semibold text-white">{f.feature}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm text-gray-300 font-mono">{f.baselineMean}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm text-gray-300 font-mono">{f.currentMean}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className={`text-sm font-bold font-mono ${f.severity === 'Healthy' ? 'text-emerald-400' : f.severity === 'Moderate Drift' ? 'text-amber-400' : 'text-red-400'}`}>
                        {f.psi.toFixed(4)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm text-gray-300 font-mono">{f.driftPercent}%</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <SeverityBadge severity={f.severity} />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <StatusBadge status={f.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataDriftDashboard;
