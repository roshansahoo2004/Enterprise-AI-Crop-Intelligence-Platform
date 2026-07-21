import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiRefreshCw, FiCheckCircle, FiAlertTriangle,
  FiAlertCircle, FiDatabase, FiShield, FiTrendingUp,
  FiTrendingDown, FiLayers, FiGrid, FiMinus
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  LineChart, Line, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import featureDriftApi from '../services/featureDriftApi';

// ─── Constants ──────────────────────────────────────────────────────────────
const FEATURE_OPTIONS = [
  { key: 'nitrogen', label: 'Nitrogen' },
  { key: 'phosphorus', label: 'Phosphorus' },
  { key: 'potassium', label: 'Potassium' },
  { key: 'temperature', label: 'Temperature' },
  { key: 'humidity', label: 'Humidity' },
  { key: 'rainfall', label: 'Rainfall' },
  { key: 'ph', label: 'Soil pH' }
];

const TIME_RANGES = [
  { value: 7, label: '7 Days' },
  { value: 30, label: '30 Days' },
  { value: 90, label: '90 Days' }
];

const SEVERITY_COLORS = {
  Healthy: '#10b981',
  'Moderate Drift': '#f59e0b',
  'High Drift': '#ef4444'
};

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
  const colors = {
    Healthy: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    'Moderate Drift': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    'High Drift': 'bg-red-500/15 text-red-400 border-red-500/30'
  };
  const icons = {
    Healthy: <FiCheckCircle className="w-3 h-3" />,
    'Moderate Drift': <FiAlertTriangle className="w-3 h-3" />,
    'High Drift': <FiAlertCircle className="w-3 h-3" />
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${colors[severity] || 'bg-gray-500/15 text-gray-400 border-gray-500/30'} ${animated && severity !== 'Healthy' ? 'animate-pulse' : ''}`}>
      {icons[severity] || null}
      {severity}
    </span>
  );
};

// ─── Trend Arrow ────────────────────────────────────────────────────────────
const TrendArrow = ({ direction }) => {
  if (direction === 'increasing') {
    return <span className="inline-flex items-center gap-1 text-amber-400 text-xs font-bold"><FiTrendingUp className="w-3.5 h-3.5" />↑</span>;
  }
  if (direction === 'decreasing') {
    return <span className="inline-flex items-center gap-1 text-blue-400 text-xs font-bold"><FiTrendingDown className="w-3.5 h-3.5" />↓</span>;
  }
  return <span className="inline-flex items-center gap-1 text-gray-500 text-xs font-bold"><FiMinus className="w-3.5 h-3.5" />→</span>;
};

// ─── Stability Gauge ────────────────────────────────────────────────────────
const StabilityGauge = ({ score }) => {
  const getColor = (s) => {
    if (s >= 80) return { stroke: '#10b981', glow: 'rgba(16,185,129,0.3)', text: 'text-emerald-400' };
    if (s >= 50) return { stroke: '#f59e0b', glow: 'rgba(245,158,11,0.3)', text: 'text-amber-400' };
    return { stroke: '#ef4444', glow: 'rgba(239,68,68,0.3)', text: 'text-red-400' };
  };
  const colors = getColor(score);
  const circumference = 2 * Math.PI * 88;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-44 h-44">
        <div className="absolute inset-0 rounded-full blur-2xl opacity-40" style={{ backgroundColor: colors.glow }}></div>
        <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
          <circle cx="100" cy="100" r="88" fill="none" stroke={colors.stroke} strokeWidth="12"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset}
            className="transition-all duration-1000 ease-out"
            style={{ filter: `drop-shadow(0 0 8px ${colors.glow})` }} />
          <circle cx="100" cy="100" r="76" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold font-mono ${colors.text} transition-all duration-700`}>{score}</span>
          <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mt-1">Stability</span>
        </div>
      </div>
    </div>
  );
};

// ─── PSI Heatmap Cell ───────────────────────────────────────────────────────
const HeatmapCell = ({ feature, psi }) => {
  const bg = psi < 0.10 ? 'bg-emerald-500/20 border-emerald-500/30'
    : psi <= 0.25 ? 'bg-amber-500/20 border-amber-500/30'
      : 'bg-red-500/20 border-red-500/30';
  const text = psi < 0.10 ? 'text-emerald-400'
    : psi <= 0.25 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className={`rounded-xl border p-4 flex flex-col items-center justify-center gap-1 ${bg} transition-all duration-500 hover:scale-105`}>
      <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{feature}</span>
      <span className={`text-lg font-bold font-mono ${text}`}>{psi.toFixed(4)}</span>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
const FeatureDriftDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [featureHistory, setFeatureHistory] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState('nitrogen');
  const [timeRange, setTimeRange] = useState(30);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ─── Fetch summary + comparison ─────────────────────────────────────────
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [summaryRes, compareRes] = await Promise.all([
        featureDriftApi.getSummary(),
        featureDriftApi.getCompare()
      ]);
      if (summaryRes.data?.success) setSummary(summaryRes.data.data);
      if (compareRes.data?.success) setComparison(compareRes.data.data);
      if (!silent) toast.success('Feature drift analysis refreshed');
    } catch (err) {
      console.error('[Feature Drift] Fetch Error:', err);
      const msg = err.response?.data?.message || 'Failed to load feature drift analysis';
      setError(msg);
      if (!silent) toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Fetch per-feature history ──────────────────────────────────────────
  const fetchHistory = useCallback(async (feature, days) => {
    setHistoryLoading(true);
    try {
      const res = await featureDriftApi.getHistory(feature, days);
      if (res.data?.success) setFeatureHistory(res.data.data);
    } catch (err) {
      console.error('[Feature Drift] History Error:', err);
      toast.error('Failed to load feature history');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchHistory(selectedFeature, timeRange); }, [selectedFeature, timeRange, fetchHistory]);

  // ─── Error State ──────────────────────────────────────────────────────────
  if (error && !summary) {
    return (
      <div className="space-y-8 animate-fade-in pb-12">
        <div>
          <button onClick={() => navigate('/admin/dashboard')} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors mb-2">
            <FiArrowLeft className="w-3.5 h-3.5" /> Back to MLOps Dashboard
          </button>
          <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <FiGrid className="text-primary-400" /> Feature Drift Analytics
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SkeletonChart />
          <SkeletonChart />
        </div>
        <SkeletonTable />
      </div>
    );
  }

  const s = summary || {};
  const features = s.features || [];
  const compFeatures = comparison?.features || [];

  // ─── Radar chart data ─────────────────────────────────────────────────────
  const radarData = features.map(f => ({
    feature: f.feature,
    stability: Math.max(0, 100 - f.psi * 400), // Scale PSI to 0-100 inverse stability
    fullMark: 100
  }));

  // ─── Feature comparison bar data ──────────────────────────────────────────
  const featureBarData = features.map(f => ({
    name: f.feature,
    'Baseline Mean': f.baselineMean,
    'Current Mean': f.currentMean
  }));

  // ─── PSI heatmap data ─────────────────────────────────────────────────────
  const heatmapData = features.map(f => ({ feature: f.feature, psi: f.psi }));

  // ─── History line data ────────────────────────────────────────────────────
  const historyData = featureHistory?.history || [];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button onClick={() => navigate('/admin/dashboard')} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors mb-2">
            <FiArrowLeft className="w-3.5 h-3.5" /> Back to MLOps Dashboard
          </button>
          <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <FiGrid className="text-primary-400" /> Feature Drift Analytics
          </h1>
          <p className="text-gray-400 text-sm">
            Deep historical analysis of monitored feature distributions — stability scoring, trend detection, and PSI heatmaps
          </p>
          {s.lastAnalysis && (
            <p className="text-xs text-gray-600 mt-1">Last analysis: {new Date(s.lastAnalysis).toLocaleString()}</p>
          )}
        </div>
        <button onClick={() => fetchData(false)} disabled={loading}
          className="px-4 py-2 bg-surface-800 border border-white/5 rounded-xl hover:bg-surface-700 text-gray-300 flex items-center gap-2 text-sm font-semibold transition-all duration-300 disabled:opacity-50">
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* ─── Unstable Features Alert ──────────────────────────────────────────── */}
      {(s.highDrift > 0 || s.moderateDrift > 0) && (
        <div className={`glass-card p-5 flex items-center gap-4 ${s.highDrift > 0 ? 'border-red-500/30 bg-red-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${s.highDrift > 0 ? 'bg-red-500/20 border-red-500/30' : 'bg-amber-500/20 border-amber-500/30'}`}>
            <FiAlertTriangle className={`w-6 h-6 ${s.highDrift > 0 ? 'text-red-400' : 'text-amber-400'}`} />
          </div>
          <div>
            <h3 className={`font-bold text-sm ${s.highDrift > 0 ? 'text-red-400' : 'text-amber-400'}`}>
              {s.highDrift > 0 ? '⚠ Unstable Features Detected' : '⚡ Feature Drift Detected'}
            </h3>
            <p className={`text-xs mt-0.5 ${s.highDrift > 0 ? 'text-red-300/70' : 'text-amber-300/70'}`}>
              {s.highDrift > 0 && `${s.highDrift} feature(s) show high drift. `}
              {s.moderateDrift > 0 && `${s.moderateDrift} feature(s) show moderate drift. `}
              Investigate distribution changes and consider retraining.
            </p>
          </div>
        </div>
      )}

      {/* ─── Summary Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Overall Stability */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center border border-primary-500/20 shrink-0">
            <FiShield className="text-primary-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Stability</p>
            <h3 className="text-xl font-bold text-primary-400 mt-0.5 font-mono">{s.overallStabilityScore || 0}</h3>
          </div>
        </div>

        {/* Healthy */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
            <FiCheckCircle className="text-emerald-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Healthy</p>
            <h3 className="text-xl font-bold text-emerald-400 mt-0.5 font-mono">{s.healthyFeatures || 0}<span className="text-sm text-gray-500">/{s.totalFeatures || 7}</span></h3>
          </div>
        </div>

        {/* Moderate */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
            <FiAlertTriangle className="text-amber-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Moderate</p>
            <h3 className="text-xl font-bold text-amber-400 mt-0.5 font-mono">{s.moderateDrift || 0}</h3>
          </div>
        </div>

        {/* High Drift */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 shrink-0">
            <FiAlertCircle className="text-red-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">High Drift</p>
            <h3 className="text-xl font-bold text-red-400 mt-0.5 font-mono">{s.highDrift || 0}</h3>
          </div>
        </div>

        {/* Average PSI */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
            <FiLayers className="text-blue-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Avg PSI</p>
            <h3 className="text-lg font-bold text-blue-400 mt-0.5 font-mono">{(s.averagePSI || 0).toFixed(4)}</h3>
          </div>
        </div>

        {/* Average Drift */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shrink-0">
            <FiTrendingUp className="text-purple-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Avg Drift</p>
            <h3 className="text-xl font-bold text-purple-400 mt-0.5 font-mono">{s.averageDriftPercent || 0}%</h3>
          </div>
        </div>
      </div>

      {/* ─── Charts Row 1: Stability Radar + Feature Comparison Bar ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Feature Stability Radar */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiShield className="text-primary-400" /> Feature Stability Radar
          </h3>
          <div className="h-80 w-full flex items-center justify-center">
            {radarData.length === 0 ? (
              <EmptyState message="No stability data" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="75%">
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="feature" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} />
                  <Radar name="Stability" dataKey="stability" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} dot={{ r: 4, fill: '#10b981' }} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Feature Comparison Bar */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiDatabase className="text-cyan-400" /> Feature Comparison
          </h3>
          <div className="h-80 w-full">
            {featureBarData.length === 0 ? (
              <EmptyState message="No comparison data" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={featureBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} angle={-25} textAnchor="end" height={60} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
                  <Bar dataKey="Baseline Mean" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={14} />
                  <Bar dataKey="Current Mean" fill="#10b981" radius={[4, 4, 0, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ─── PSI Heatmap ──────────────────────────────────────────────────────── */}
      <div className="glass-card-hover p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FiGrid className="text-amber-400" /> PSI Heatmap
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {heatmapData.map(h => (
            <HeatmapCell key={h.feature} feature={h.feature} psi={h.psi} />
          ))}
        </div>
      </div>

      {/* ─── Historical Drift Line + Filters ──────────────────────────────────── */}
      <div className="glass-card-hover p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FiTrendingUp className="text-primary-400" /> Historical Drift — {FEATURE_OPTIONS.find(f => f.key === selectedFeature)?.label}
          </h3>
          <div className="flex items-center gap-3">
            {/* Feature Selector */}
            <select
              value={selectedFeature}
              onChange={(e) => setSelectedFeature(e.target.value)}
              className="bg-surface-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-primary-500/50 transition-colors appearance-none cursor-pointer"
            >
              {FEATURE_OPTIONS.map(f => (
                <option key={f.key} value={f.key}>{f.label}</option>
              ))}
            </select>

            {/* Time Range */}
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
          </div>
        </div>

        <div className="h-72 w-full relative">
          {historyLoading && (
            <div className="absolute inset-0 bg-surface-950/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
              <FiRefreshCw className="w-6 h-6 text-primary-400 animate-spin" />
            </div>
          )}
          {historyData.length === 0 && !historyLoading ? (
            <EmptyState message="No historical data for this feature" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="histPsiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="psi" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#histPsiGrad)" name="PSI" />
                <Line type="monotone" dataKey="mean" stroke="#06b6d4" strokeWidth={2} dot={false} strokeDasharray="5 5" name="Mean" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Baseline reference for the selected feature */}
        {featureHistory?.baselineStats && (
          <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { label: 'Baseline Mean', value: featureHistory.baselineStats.mean },
              { label: 'Baseline Median', value: featureHistory.baselineStats.median },
              { label: 'Baseline Std', value: featureHistory.baselineStats.std },
              { label: 'Baseline Var', value: featureHistory.baselineStats.variance },
              { label: 'Baseline Min', value: featureHistory.baselineStats.min },
              { label: 'Baseline Max', value: featureHistory.baselineStats.max }
            ].map(s => (
              <div key={s.label} className="flex flex-col">
                <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">{s.label}</span>
                <span className="text-sm text-gray-300 font-mono font-bold mt-0.5">{s.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Distribution Comparison ──────────────────────────────────────────── */}
      {compFeatures.length > 0 && (
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiLayers className="text-cyan-400" /> Distribution Comparison
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compFeatures.map(f => ({
                name: f.feature,
                'Baseline Std': f.baseline.std,
                'Current Std': f.current.std,
                'Baseline Var': f.baseline.variance,
                'Current Var': f.current.variance
              }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} angle={-25} textAnchor="end" height={60} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
                <Bar dataKey="Baseline Std" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar dataKey="Current Std" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ─── Feature Drift Table ─────────────────────────────────────────────── */}
      <div className="glass-card-hover p-6">
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <FiDatabase className="text-primary-400" /> Feature Drift Details
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
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-right">Variance</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-right">PSI</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-center">Trend</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-center">Severity</th>
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
                      <span className="text-sm text-gray-300 font-mono">{f.currentVariance}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className={`text-sm font-bold font-mono ${f.severity === 'Healthy' ? 'text-emerald-400' : f.severity === 'Moderate Drift' ? 'text-amber-400' : 'text-red-400'}`}>
                        {f.psi.toFixed(4)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <TrendArrow direction={f.trend} />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <SeverityBadge severity={f.severity} />
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

export default FeatureDriftDashboard;
