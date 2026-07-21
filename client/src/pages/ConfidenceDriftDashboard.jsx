import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiRefreshCw, FiPercent, FiTrendingUp, FiTrendingDown,
  FiShield, FiActivity, FiAlertTriangle, FiAlertCircle, FiCheckCircle,
  FiMinus, FiLayers, FiBarChart2, FiPieChart, FiClock
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import confidenceDriftApi from '../services/confidenceDriftApi';

// ─── Constants ──────────────────────────────────────────────────────────────
const TIME_RANGES = [
  { value: 7, label: '7 Days' },
  { value: 14, label: '14 Days' },
  { value: 30, label: '30 Days' },
  { value: 90, label: '90 Days' }
];

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
            {p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}{suffix}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Empty State ────────────────────────────────────────────────────────────
const EmptyState = ({ message = 'No confidence data available' }) => (
  <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-2 py-8">
    <FiAlertCircle className="w-8 h-8 opacity-40" />
    <span className="text-sm">{message}</span>
  </div>
);

// ─── Status Badge ───────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const styles = {
    Healthy: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Moderate: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    Degraded: 'bg-red-500/15 text-red-400 border-red-500/30 animate-pulse'
  };

  const icons = {
    Healthy: <FiCheckCircle className="w-3 h-3" />,
    Moderate: <FiAlertTriangle className="w-3 h-3" />,
    Degraded: <FiAlertCircle className="w-3 h-3" />
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${styles[status] || 'bg-gray-500/15 text-gray-400 border-gray-500/30'}`}>
      {icons[status] || null}
      {status}
    </span>
  );
};

// ─── Trend Arrow ────────────────────────────────────────────────────────────
const TrendArrow = ({ driftPercent }) => {
  if (driftPercent > 2) {
    return <span className="inline-flex items-center gap-1 text-red-400 text-xs font-bold"><FiTrendingDown className="w-3.5 h-3.5" />-{driftPercent.toFixed(1)}%</span>;
  }
  if (driftPercent < -2) {
    return <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-bold"><FiTrendingUp className="w-3.5 h-3.5" />+{(Math.abs(driftPercent)).toFixed(1)}%</span>;
  }
  return <span className="inline-flex items-center gap-1 text-gray-500 text-xs font-bold"><FiMinus className="w-3.5 h-3.5" />Stable</span>;
};

// ─── Animated Confidence Gauge Component ──────────────────────────────────
const ConfidenceGauge = ({ score, label = 'Avg Confidence' }) => {
  const getColor = (s) => {
    if (s >= 85) return { stroke: '#10b981', glow: 'rgba(16, 185, 129, 0.3)', text: 'text-emerald-400' };
    if (s >= 75) return { stroke: '#f59e0b', glow: 'rgba(245, 158, 11, 0.3)', text: 'text-amber-400' };
    return { stroke: '#ef4444', glow: 'rgba(239, 68, 68, 0.3)', text: 'text-red-400' };
  };

  const colors = getColor(score);
  const circumference = 2 * Math.PI * 88;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-48 h-48">
        {/* Glow background */}
        <div className="absolute inset-0 rounded-full blur-2xl opacity-40" style={{ backgroundColor: colors.glow }}></div>
        <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
          <circle cx="100" cy="100" r="88" fill="none" stroke={colors.stroke} strokeWidth="12"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset}
            className="transition-all duration-1000 ease-out"
            style={{ filter: `drop-shadow(0 0 8px ${colors.glow})` }} />
          <circle cx="100" cy="100" r="76" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold font-mono ${colors.text} transition-all duration-700`}>
            {score.toFixed(1)}%
          </span>
          <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mt-1">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
const ConfidenceDriftDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [distribution, setDistribution] = useState(null);
  const [history, setHistory] = useState(null);
  const [timeRange, setTimeRange] = useState(30);

  const fetchData = useCallback(async (days = timeRange, silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [summaryRes, distRes, historyRes] = await Promise.all([
        confidenceDriftApi.getSummary(days),
        confidenceDriftApi.getDistribution(days),
        confidenceDriftApi.getHistory(days)
      ]);

      if (summaryRes.data?.success) setSummary(summaryRes.data.data);
      if (distRes.data?.success) setDistribution(distRes.data.data);
      if (historyRes.data?.success) setHistory(historyRes.data.data);

      if (!silent) toast.success('Confidence drift analysis refreshed');
    } catch (err) {
      console.error('[Confidence Drift] Fetch Error:', err);
      const msg = err.response?.data?.message || 'Failed to load confidence drift analysis';
      setError(msg);
      if (!silent) toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchData(timeRange);
  }, [timeRange, fetchData]);

  // ─── Error State ──────────────────────────────────────────────────────────
  if (error && !summary) {
    return (
      <div className="space-y-8 animate-fade-in pb-12">
        <div>
          <button onClick={() => navigate('/admin/dashboard')} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors mb-2">
            <FiArrowLeft className="w-3.5 h-3.5" /> Back to MLOps Dashboard
          </button>
          <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <FiPercent className="text-primary-400" /> Confidence Drift Monitoring
          </h1>
        </div>
        <div className="glass-card p-12 flex flex-col items-center justify-center gap-4">
          <FiAlertCircle className="w-12 h-12 text-red-400 opacity-60" />
          <p className="text-gray-400 text-center">{error}</p>
          <button onClick={() => fetchData(timeRange, false)} className="px-5 py-2.5 bg-primary-500/20 text-primary-400 rounded-xl font-semibold text-sm hover:bg-primary-500/30 transition-all flex items-center gap-2">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SkeletonChart />
          <SkeletonChart />
        </div>
        <SkeletonTable />
      </div>
    );
  }

  const s = summary || {};
  const dist = distribution || {};
  const hist = history?.history || [];
  const histogramData = dist.histogram || [];
  const tierBreakdown = dist.tierBreakdown || [];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button onClick={() => navigate('/admin/dashboard')} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors mb-2">
            <FiArrowLeft className="w-3.5 h-3.5" /> Back to MLOps Dashboard
          </button>
          <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <FiPercent className="text-primary-400" /> Confidence Drift Monitoring
          </h1>
          <p className="text-gray-400 text-sm">
            Continuous model certainty tracking — rolling averages, tier breakdowns, and prediction confidence degradation alerts
          </p>
          {s.lastAnalysis && (
            <p className="text-xs text-gray-600 mt-1">Last analysis: {new Date(s.lastAnalysis).toLocaleString()}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex bg-surface-800 rounded-xl border border-white/10 overflow-hidden">
            {TIME_RANGES.map(t => (
              <button
                key={t.value}
                onClick={() => setTimeRange(t.value)}
                className={`px-3 py-2 text-xs font-semibold transition-all duration-300 ${timeRange === t.value
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                  }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button onClick={() => fetchData(timeRange, false)} disabled={loading}
            className="px-4 py-2 bg-surface-800 border border-white/5 rounded-xl hover:bg-surface-700 text-gray-300 flex items-center gap-2 text-sm font-semibold transition-all duration-300 disabled:opacity-50">
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* ─── Degradation Alert Banner ─────────────────────────────────────────── */}
      {s.isDegrading && (
        <div className="glass-card border-red-500/30 bg-red-500/5 p-5 flex items-center gap-4 animate-pulse">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center border border-red-500/30 shrink-0">
            <FiAlertTriangle className="text-red-400 w-6 h-6" />
          </div>
          <div>
            <h3 className="text-red-400 font-bold text-sm">⚠ Model Confidence Degrading</h3>
            <p className="text-red-300/70 text-xs mt-0.5">{s.recommendation}</p>
          </div>
        </div>
      )}

      {/* ─── Gauge + Summary Cards Row ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Confidence Gauge */}
        <div className="glass-card-hover p-8 flex flex-col items-center justify-center">
          <ConfidenceGauge score={s.averageConfidence || 0} label="Avg Confidence" />
          <div className="w-full mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-xs text-gray-400">Baseline Confidence</span>
            <span className="text-xs text-white font-bold font-mono">{(s.baselineConfidence || 0).toFixed(1)}%</span>
          </div>
          <div className="w-full mt-2 flex items-center justify-between">
            <span className="text-xs text-gray-400">Current Confidence</span>
            <span className="text-xs text-primary-400 font-bold font-mono">{(s.currentConfidence || 0).toFixed(1)}%</span>
          </div>
        </div>

        {/* 6 Summary Cards Grid */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {/* Average Confidence */}
          <div className="glass-card-hover p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center border border-primary-500/20 shrink-0">
              <FiPercent className="text-primary-400 w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Avg Confidence</p>
              <h3 className="text-xl font-bold text-primary-400 mt-0.5 font-mono">{(s.averageConfidence || 0).toFixed(1)}%</h3>
            </div>
          </div>

          {/* Confidence Stability */}
          <div className="glass-card-hover p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <FiShield className="text-emerald-400 w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Stability Score</p>
              <h3 className="text-xl font-bold text-emerald-400 mt-0.5 font-mono">{s.confidenceStabilityScore || 0}</h3>
            </div>
          </div>

          {/* High % */}
          <div className="glass-card-hover p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <FiCheckCircle className="text-emerald-400 w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">High (≥90%)</p>
              <h3 className="text-xl font-bold text-emerald-400 mt-0.5 font-mono">{s.highConfidencePercent || 0}%</h3>
            </div>
          </div>

          {/* Medium % */}
          <div className="glass-card-hover p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
              <FiAlertTriangle className="text-amber-400 w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Medium (70-89%)</p>
              <h3 className="text-xl font-bold text-amber-400 mt-0.5 font-mono">{s.mediumConfidencePercent || 0}%</h3>
            </div>
          </div>

          {/* Low % */}
          <div className="glass-card-hover p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 shrink-0">
              <FiAlertCircle className="text-red-400 w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Low (&lt;70%)</p>
              <h3 className="text-xl font-bold text-red-400 mt-0.5 font-mono">{s.lowConfidencePercent || 0}%</h3>
            </div>
          </div>

          {/* Confidence Drift % */}
          <div className="glass-card-hover p-5 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${s.confidenceDriftPercent > 0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
              {s.confidenceDriftPercent > 0 ? <FiTrendingDown className="text-amber-400 w-5 h-5" /> : <FiTrendingUp className="text-emerald-400 w-5 h-5" />}
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Confidence Drift</p>
              <h3 className={`text-xl font-bold mt-0.5 font-mono ${s.confidenceDriftPercent > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {s.confidenceDriftPercent > 0 ? `-${s.confidenceDriftPercent}%` : `${Math.abs(s.confidenceDriftPercent || 0)}%`}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Charts Row 1: Confidence Trend & Histogram ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Confidence Trend */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiActivity className="text-primary-400" /> Confidence Trend
          </h3>
          <div className="h-72 w-full">
            {hist.length === 0 ? (
              <EmptyState message="No history trend available" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hist} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[50, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip suffix="%" />} />
                  <Area type="monotone" dataKey="avgConfidence" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#confGrad)" name="Daily Avg Confidence" />
                  <Line type="monotone" dataKey="movingAverage" stroke="#3b82f6" strokeWidth={2} dot={false} name="7-Day Moving Avg" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Histogram */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiBarChart2 className="text-cyan-400" /> Confidence Histogram
          </h3>
          <div className="h-72 w-full">
            {histogramData.length === 0 ? (
              <EmptyState message="No distribution histogram" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogramData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="bin" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip suffix="%" />} />
                  <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
                  <Bar dataKey="baselinePercent" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={16} name="Baseline %" />
                  <Bar dataKey="currentPercent" fill="#06b6d4" radius={[4, 4, 0, 0]} barSize={16} name="Current %" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ─── Charts Row 2: Confidence Distribution & Moving Average & Drift Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tier Distribution Pie */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiPieChart className="text-emerald-400" /> Confidence Distribution
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            {tierBreakdown.length === 0 ? (
              <EmptyState message="No tier distribution" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tierBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${value}%`}
                  >
                    {tierBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip suffix="%" />} />
                  <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Moving Average */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiClock className="text-blue-400" /> Moving Average Analysis
          </h3>
          <div className="h-64 w-full">
            {hist.length === 0 ? (
              <EmptyState message="No moving average data" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hist} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[60, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip suffix="%" />} />
                  <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
                  <Line type="monotone" dataKey="movingAverage" stroke="#3b82f6" strokeWidth={2.5} dot={false} name="7-Day MA" />
                  <Line type="monotone" dataKey="rollingAverage" stroke="#8b5cf6" strokeWidth={2} dot={false} strokeDasharray="4 4" name="14-Day Rolling" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Drift Trend */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiTrendingDown className="text-amber-400" /> Confidence Drift Trend
          </h3>
          <div className="h-64 w-full">
            {hist.length === 0 ? (
              <EmptyState message="No drift trend data" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hist} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="driftGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip suffix="%" />} />
                  <Area type="monotone" dataKey="driftPercent" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#driftGrad)" name="Drift %" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ─── Historical Confidence Table ─────────────────────────────────────── */}
      <div className="glass-card-hover p-6">
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <FiLayers className="text-primary-400" /> Confidence History Log
        </h3>

        {hist.length === 0 ? (
          <EmptyState message="No confidence history log" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-right">Avg Confidence</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-right">Variance</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-right">Std Dev</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-right">Predictions</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-center">Drift %</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {hist.slice().reverse().map((row, idx) => (
                  <tr key={row.date} className={`border-b border-white/5 transition-colors hover:bg-white/[0.02] ${idx % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-semibold text-white">{row.label}</span>
                      <span className="text-[10px] text-gray-500 block">{row.date}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm text-primary-400 font-mono font-bold">{row.avgConfidence.toFixed(2)}%</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm text-gray-300 font-mono">{row.variance.toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm text-gray-300 font-mono">{row.stdDev.toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm text-white font-mono">{row.predictionCount}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <TrendArrow driftPercent={row.driftPercent} />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <StatusBadge status={row.status} />
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

export default ConfidenceDriftDashboard;
