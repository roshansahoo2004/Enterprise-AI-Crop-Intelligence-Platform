import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiRefreshCw, FiHeart, FiActivity, FiPercent,
  FiClock, FiZap, FiTrendingUp, FiTrendingDown, FiCheckCircle,
  FiAlertTriangle, FiAlertCircle, FiCpu, FiShield, FiDatabase
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import modelHealthApi from '../services/modelHealthApi';

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

const SkeletonGauge = () => (
  <div className="glass-card p-8 animate-pulse flex flex-col items-center justify-center">
    <div className="w-48 h-48 rounded-full bg-white/5 mb-4"></div>
    <div className="h-4 w-32 bg-white/10 rounded mb-2"></div>
    <div className="h-3 w-24 bg-white/10 rounded"></div>
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

// ─── Health Score Gauge Component ───────────────────────────────────────────
const HealthGauge = ({ score, status }) => {
  const getColor = (s) => {
    if (s >= 90) return { stroke: '#10b981', glow: 'rgba(16, 185, 129, 0.3)', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
    if (s >= 70) return { stroke: '#f59e0b', glow: 'rgba(245, 158, 11, 0.3)', text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
    return { stroke: '#ef4444', glow: 'rgba(239, 68, 68, 0.3)', text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' };
  };

  const colors = getColor(score);
  const circumference = 2 * Math.PI * 88;
  const dashOffset = circumference - (score / 100) * circumference;

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
          <span className={`text-5xl font-bold font-mono ${colors.text} transition-all duration-700`}>
            {score}
          </span>
          <span className="text-xs text-gray-500 font-semibold uppercase tracking-widest mt-1">
            Health Score
          </span>
        </div>
      </div>

      {/* Status badge */}
      <div className={`mt-5 px-5 py-2 rounded-xl ${colors.bg} border ${colors.border} flex items-center gap-2`}>
        {score >= 90 ? <FiCheckCircle className={`w-4 h-4 ${colors.text}`} /> :
          score >= 70 ? <FiAlertTriangle className={`w-4 h-4 ${colors.text}`} /> :
            <FiAlertCircle className={`w-4 h-4 ${colors.text}`} />}
        <span className={`text-sm font-bold ${colors.text}`}>
          {status?.label || 'Unknown'}
        </span>
      </div>
    </div>
  );
};

// ─── Health Breakdown Bar ───────────────────────────────────────────────────
const BreakdownBar = ({ label, value, color }) => (
  <div className="flex items-center gap-3">
    <span className="text-xs text-gray-500 font-semibold w-28 truncate">{label}</span>
    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-1000 ease-out"
        style={{ width: `${value}%`, backgroundColor: color }}
      ></div>
    </div>
    <span className="text-xs font-bold font-mono w-10 text-right" style={{ color }}>
      {value}
    </span>
  </div>
);

const ModelHealthDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [summaryRes, historyRes] = await Promise.all([
        modelHealthApi.getSummary(),
        modelHealthApi.getHistory()
      ]);

      if (summaryRes.data?.success) {
        setSummary(summaryRes.data.data);
      }
      if (historyRes.data?.success) {
        setHistory(historyRes.data.data);
      }
      if (!silent) toast.success('Model health data refreshed');
    } catch (err) {
      console.error('[Model Health] Fetch Error:', err);
      const msg = err.response?.data?.message || 'Failed to load model health data';
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
            <FiHeart className="text-primary-400" /> Model Health
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
          <SkeletonGauge />
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SkeletonChart />
          <SkeletonChart />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <SkeletonChart height="h-64" />
          <SkeletonChart height="h-64" />
          <SkeletonChart height="h-64" />
        </div>
      </div>
    );
  }

  const s = summary || {};
  const breakdown = s.healthBreakdown || {};

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
            <FiHeart className="text-primary-400" /> Model Health Dashboard
          </h1>
          <p className="text-gray-400 text-sm">
            Real-time operational health monitoring for the deployed ML model — {s.modelVersion || 'v1.0'}
          </p>
          {s.lastHealthUpdate && (
            <p className="text-xs text-gray-600 mt-1">
              Last updated: {new Date(s.lastHealthUpdate).toLocaleString()}
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

      {/* ─── Health Gauge + Summary Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Health Gauge */}
        <div className="glass-card-hover p-8 flex flex-col items-center justify-center">
          <HealthGauge score={s.healthScore || 0} status={s.healthStatus} />

          {/* Score Breakdown */}
          <div className="w-full mt-8 space-y-3">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Score Breakdown</p>
            <BreakdownBar label="Confidence" value={breakdown.confidenceScore || 0} color="#3b82f6" />
            <BreakdownBar label="Latency" value={breakdown.latencyScore || 0} color="#06b6d4" />
            <BreakdownBar label="SHAP Coverage" value={breakdown.shapCoverageScore || 0} color="#10b981" />
            <BreakdownBar label="Fallback" value={breakdown.fallbackScore || 0} color="#f59e0b" />
            <BreakdownBar label="Success Rate" value={breakdown.successRateScore || 0} color="#8b5cf6" />
          </div>

          {/* Model info */}
          <div className="w-full mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiCpu className="w-4 h-4 text-primary-400" />
              <span className="text-xs text-gray-400 font-medium">Model</span>
            </div>
            <span className="text-xs text-white font-bold font-mono">{s.modelVersion || 'v1.0'}</span>
          </div>
          {s.deploymentDate && (
            <div className="w-full mt-2 flex items-center justify-between">
              <span className="text-xs text-gray-500">Deployed</span>
              <span className="text-xs text-gray-300">{new Date(s.deploymentDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Summary Cards Grid */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {/* Prediction Success */}
          <div className="glass-card-hover p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <FiCheckCircle className="text-emerald-400 w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Success Rate</p>
              <h3 className="text-xl font-bold text-emerald-400 mt-0.5 font-mono">{s.successRate || 0}%</h3>
            </div>
          </div>

          {/* Failure Rate */}
          <div className="glass-card-hover p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 shrink-0">
              <FiTrendingDown className="text-red-400 w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Failure Rate</p>
              <h3 className="text-xl font-bold text-red-400 mt-0.5 font-mono">{s.failureRate || 0}%</h3>
            </div>
          </div>

          {/* Fallback Rate */}
          <div className="glass-card-hover p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
              <FiShield className="text-amber-400 w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Fallback Rate</p>
              <h3 className="text-xl font-bold text-amber-400 mt-0.5 font-mono">{s.fallbackRate || 0}%</h3>
            </div>
          </div>

          {/* Avg Confidence */}
          <div className="glass-card-hover p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
              <FiPercent className="text-blue-400 w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Avg Confidence</p>
              <h3 className="text-xl font-bold text-blue-400 mt-0.5 font-mono">{s.avgConfidence || 0}%</h3>
            </div>
          </div>

          {/* Avg Latency */}
          <div className="glass-card-hover p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shrink-0">
              <FiClock className="text-cyan-400 w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Avg Latency</p>
              <h3 className="text-xl font-bold text-cyan-400 mt-0.5 font-mono">{s.avgPredictionLatency || 0} ms</h3>
            </div>
          </div>

          {/* SHAP Coverage */}
          <div className="glass-card-hover p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <FiZap className="text-emerald-400 w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">SHAP Coverage</p>
              <h3 className="text-xl font-bold text-emerald-400 mt-0.5 font-mono">{s.shapCoverage || 0}%</h3>
            </div>
          </div>

          {/* Total Predictions */}
          <div className="glass-card-hover p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center border border-primary-500/20 shrink-0">
              <FiActivity className="text-primary-400 w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Total Predictions</p>
              <h3 className="text-xl font-bold text-white mt-0.5 font-mono">{s.totalPredictions || 0}</h3>
            </div>
          </div>

          {/* SHAP Latency */}
          <div className="glass-card-hover p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shrink-0">
              <FiClock className="text-purple-400 w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">SHAP Latency</p>
              <h3 className="text-xl font-bold text-purple-400 mt-0.5 font-mono">{s.avgShapLatency || 0} ms</h3>
            </div>
          </div>

          {/* Last Prediction */}
          <div className="glass-card-hover p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shrink-0">
              <FiDatabase className="text-indigo-400 w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Last Prediction</p>
              <h3 className="text-xs font-bold text-gray-300 mt-1">
                {s.lastPredictionTime
                  ? new Date(s.lastPredictionTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : 'N/A'}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Charts Row 1: Health Trend + Latency Trend ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Health Score Trend */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiHeart className="text-primary-400" /> Health Score Trend
          </h3>
          <div className="h-72 w-full">
            {history.length === 0 ? (
              <EmptyState message="No health history available" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="healthScore" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#healthGrad)" name="Health Score" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Latency Trend */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiClock className="text-cyan-400" /> Latency Trend
          </h3>
          <div className="h-72 w-full">
            {history.length === 0 ? (
              <EmptyState message="No latency data available" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis unit="ms" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip suffix="ms" />} />
                  <Line type="monotone" dataKey="avgLatency" stroke="#06b6d4" strokeWidth={2.5} dot={{ fill: '#06b6d4', strokeWidth: 1 }} activeDot={{ r: 6 }} name="Prediction Latency" />
                  <Line type="monotone" dataKey="avgShapLatency" stroke="#a855f7" strokeWidth={2} dot={false} strokeDasharray="5 5" name="SHAP Latency" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ─── Charts Row 2: Confidence, Volume, Fallback ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Confidence Trend */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiPercent className="text-blue-400" /> Confidence Trend
          </h3>
          <div className="h-64 w-full">
            {history.length === 0 ? (
              <EmptyState message="No confidence data" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[50, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip suffix="%" />} />
                  <Line type="monotone" dataKey="avgConfidence" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', strokeWidth: 1 }} activeDot={{ r: 5 }} name="Avg Confidence" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Prediction Volume */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiTrendingUp className="text-primary-400" /> Prediction Volume
          </h3>
          <div className="h-64 w-full">
            {history.length === 0 ? (
              <EmptyState message="No volume data" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="predictions" radius={[4, 4, 0, 0]} fill="#10b981" barSize={16} name="Predictions" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Fallback Trend */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiShield className="text-amber-400" /> Fallback Trend
          </h3>
          <div className="h-64 w-full">
            {history.length === 0 ? (
              <EmptyState message="No fallback data" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fallbackGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} unit="%" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip suffix="%" />} />
                  <Area type="monotone" dataKey="fallbackRate" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#fallbackGrad)" name="Fallback Rate" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelHealthDashboard;
