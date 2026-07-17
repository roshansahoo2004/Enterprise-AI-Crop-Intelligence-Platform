import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiRefreshCw,
  FiZap,
  FiActivity,
  FiDatabase,
  FiClock,
  FiTrendingUp,
  FiCpu,
  FiPercent,
  FiList,
  FiPieChart,
  FiBarChart2
} from "react-icons/fi";
import toast from 'react-hot-toast';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend
} from 'recharts';
import explainabilityApi from '../services/explainabilityApi';

// ─── Constants & Color Palettes ─────────────────────────────────────────────
const COLORS_DIST = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']; // emerald, blue, amber, red
const COLORS_USAGE = ['#10b981', '#64748b']; // emerald, gray

const ExplainabilityAnalytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const fetchStats = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await explainabilityApi.getSummary();
      if (res.data?.success) {
        setData(res.data.data);
        if (!silent) toast.success('Explainability analytics refreshed!');
      } else {
        toast.error('Failed to load explainability analytics.');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error fetching analytics stats.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const stats = data?.stats || {
    totalPredictions: 0,
    shapPredictions: 0,
    fallbackPredictions: 0,
    avgConfidence: 0,
    avgPredictionTime: 0,
    avgShapTime: 0,
    activeModelVersion: 'v1.0',
    activeEngine: 'Rule-Based Fallback'
  };

  // Safe Fallback Chart Data
  const dailyTrends = data?.dailyTrends || [];
  const cropDistribution = data?.cropDistribution || [];
  const topFeatures = data?.topFeatures || [];
  const confidenceDistribution = data?.confidenceDistribution || [];

  // SHAP vs Fallback distribution calculation
  const usageDistribution = [
    { name: 'SHAP Explainability', value: stats.shapPredictions },
    { name: 'Rule-Based Fallback', value: stats.fallbackPredictions }
  ].filter(item => item.value > 0);

  // Fallback defaults if no usage data exists
  if (usageDistribution.length === 0) {
    usageDistribution.push({ name: 'Rule-Based Fallback', value: 1 });
  }

  // Custom tooltips
  const CustomTooltip = ({ active, payload, label, suffix = '' }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface-900/90 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-md">
          {label && <p className="text-xs text-gray-400 font-semibold mb-1">{label}</p>}
          {payload.map((p, idx) => (
            <p key={idx} className="text-sm font-bold" style={{ color: p.color || p.fill }}>
              {p.name}: {p.value.toFixed(1)}{suffix}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
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
            <FiZap className="text-primary-400" /> Explainability Analytics
          </h1>
          <p className="text-gray-400 text-sm">
            Explainable AI (XAI) serving layer metrics, real SHAP generation tracking, and rule engine fallback diagnostics.
          </p>
        </div>

        <button
          onClick={() => fetchStats(false)}
          disabled={loading}
          className="px-4 py-2 bg-surface-800 border border-white/5 rounded-xl hover:bg-surface-700 text-gray-300 flex items-center gap-2 text-sm font-semibold transition-all duration-300 disabled:opacity-50"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Predictions */}
        <div className="glass-card-hover p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center border border-primary-500/20 shrink-0">
            <FiActivity className="text-primary-400 w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Crop Predictions</p>
            <h3 className="text-2xl font-bold text-white mt-1 font-mono">{stats.totalPredictions}</h3>
          </div>
        </div>

        {/* SHAP Predictions */}
        <div className="glass-card-hover p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
            <FiZap className="text-emerald-400 w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">SHAP Explanations</p>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1 font-mono">{stats.shapPredictions}</h3>
          </div>
        </div>

        {/* Fallbacks */}
        <div className="glass-card-hover p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
            <FiDatabase className="text-amber-400 w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Rule-Based Fallbacks</p>
            <h3 className="text-2xl font-bold text-amber-400 mt-1 font-mono">{stats.fallbackPredictions}</h3>
          </div>
        </div>

        {/* Avg Confidence */}
        <div className="glass-card-hover p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
            <FiPercent className="text-blue-400 w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Avg Prediction Conf</p>
            <h3 className="text-2xl font-bold text-blue-400 mt-1 font-mono">{stats.avgConfidence}%</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Prediction Latency */}
        <div className="glass-card-hover p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shrink-0">
            <FiClock className="text-cyan-400 w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Avg Prediction Time</p>
            <h3 className="text-2xl font-bold text-cyan-400 mt-1 font-mono">{stats.avgPredictionTime} ms</h3>
          </div>
        </div>

        {/* SHAP Latency */}
        <div className="glass-card-hover p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shrink-0">
            <FiClock className="text-purple-400 w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Avg SHAP Gen Time</p>
            <h3 className="text-2xl font-bold text-purple-400 mt-1 font-mono">{stats.avgShapTime} ms</h3>
          </div>
        </div>

        {/* Model Version */}
        <div className="glass-card-hover p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center border border-primary-500/20 shrink-0">
            <FiCpu className="text-primary-400 w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Active Deployed Model</p>
            <h3 className="text-2xl font-bold text-white mt-1 font-mono">{stats.activeModelVersion}</h3>
          </div>
        </div>

        {/* Active Engine */}
        <div className="glass-card-hover p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
            <FiZap className="text-emerald-400 w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Active XAI Engine</p>
            <h3 className="text-sm font-bold text-white mt-2 truncate w-44">{stats.activeEngine}</h3>
          </div>
        </div>
      </div>

      {/* Main Charts Row 1: Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Prediction Trend */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiTrendingUp className="text-primary-400" /> Daily Prediction Trend
          </h3>
          <div className="h-72 w-full">
            {dailyTrends.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">No trend data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="predictions" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#areaColor)" name="Predictions" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Confidence Trend */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiActivity className="text-secondary-400" /> Confidence Trend
          </h3>
          <div className="h-72 w-full">
            {dailyTrends.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">No trend data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[50, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip suffix="%" />} />
                  <Line type="monotone" dataKey="confidence" stroke="#fb923c" strokeWidth={2.5} dot={{ fill: '#fb923c', strokeWidth: 1 }} activeDot={{ r: 6 }} name="Avg Confidence" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2: Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Confidence Distribution */}
        <div className="glass-card-hover p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <FiPieChart className="text-blue-400" /> Confidence Distribution
            </h3>
            <p className="text-xs text-gray-500 mb-4">Proportion of predictions by confidence bracket</p>
          </div>
          <div className="h-56 w-full flex items-center justify-center relative">
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
                  {confidenceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_DIST[index % COLORS_DIST.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend Grid */}
          <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-semibold text-gray-400">
            {confidenceDistribution.map((entry, idx) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS_DIST[idx] }}></span>
                <span>{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SHAP vs Rule-Based Usage */}
        <div className="glass-card-hover p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <FiZap className="text-emerald-400" /> Explainability Engine Usage
            </h3>
            <p className="text-xs text-gray-500 mb-4">Ratio of SHAP explainers vs Rule-Based fallbacks</p>
          </div>
          <div className="h-56 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={usageDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {usageDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_USAGE[index % COLORS_USAGE.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend Grid */}
          <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-semibold text-gray-400">
            {usageDistribution.map((entry, idx) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS_USAGE[idx] }}></span>
                <span>{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Crop Prediction Distribution */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <FiList className="text-primary-400" /> Top Crop Recommendations
          </h3>
          <p className="text-xs text-gray-500 mb-4">Volume count of top recommended crops</p>
          <div className="h-64 w-full">
            {cropDistribution.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">No predictions recorded</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cropDistribution} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis dataKey="crop" type="category" width={80} axisLine={false} tickLine={false} tick={{ fill: '#cbd5e1', fontSize: 11, fontWeight: 500 }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={14} fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Top Influential Features Section (SHAP weights) */}
      <div className="glass-card-hover p-6">
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          <FiBarChart2 className="text-secondary-400" /> Global Feature Contributions (SHAP)
        </h3>
        <p className="text-xs text-gray-500 mb-6">Average SHAP importance values across all registered predictions</p>
        <div className="h-72 w-full">
          {topFeatures.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-gray-500">No feature data recorded</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topFeatures} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="feature" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis unit="%" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip suffix="%" />} />
                <Bar dataKey="importance" radius={[4, 4, 0, 0]} fill="#10b981" barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExplainabilityAnalytics;
