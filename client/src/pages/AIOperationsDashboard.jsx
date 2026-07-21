import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiRefreshCw, FiTv, FiCpu, FiHeart, FiActivity,
  FiPercent, FiClock, FiShield, FiAlertTriangle, FiAlertCircle,
  FiCheckCircle, FiTrendingUp, FiDatabase, FiLayers, FiRadio,
  FiSliders, FiFileText, FiArrowRight, FiZap, FiBox
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell
} from 'recharts';
import aiOperationsApi from '../services/aiOperationsApi';
import mlopsMonitoringApi from '../services/mlopsMonitoringApi';

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

const SkeletonPanel = () => (
  <div className="glass-card p-6 animate-pulse">
    <div className="h-4 w-40 bg-white/10 rounded mb-4"></div>
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-12 bg-white/5 rounded-xl"></div>
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
            {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}{suffix}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Empty State ────────────────────────────────────────────────────────────
const EmptyState = ({ message = 'No operational data' }) => (
  <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-2 py-8">
    <FiAlertCircle className="w-8 h-8 opacity-40" />
    <span className="text-sm">{message}</span>
  </div>
);

// ─── Live Pulse Indicator ───────────────────────────────────────────────────
const LivePulseBadge = ({ status }) => {
  const isOperational = status === 'Operational';
  const isWarning = status === 'Warning';

  const dotColor = isOperational ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-red-500';
  const textColor = isOperational ? 'text-emerald-400' : isWarning ? 'text-amber-400' : 'text-red-400';
  const bgBorder = isOperational ? 'bg-emerald-500/10 border-emerald-500/20' : isWarning ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20';

  return (
    <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2.5 ${bgBorder}`}>
      <span className="relative flex h-3 w-3">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`}></span>
        <span className={`relative inline-flex rounded-full h-3 w-3 ${dotColor}`}></span>
      </span>
      <span className={`text-xs font-bold uppercase tracking-wider ${textColor}`}>
        {status || 'Operational'}
      </span>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
const AIOperationsDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overview, setOverview] = useState(null);
  const [events, setEvents] = useState(null);
  const [quickActions, setQuickActions] = useState([]);
  const [historyList, setHistoryList] = useState([]);

  // Fetch command center telemetry
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [overviewRes, eventsRes, actionsRes, historyRes] = await Promise.all([
        aiOperationsApi.getOverview(),
        aiOperationsApi.getRecentEvents(),
        aiOperationsApi.getQuickActions(),
        mlopsMonitoringApi.getHistory(30).catch(() => ({ data: { data: { history: [] } } }))
      ]);

      if (overviewRes.data?.success) setOverview(overviewRes.data.data);
      if (eventsRes.data?.success) setEvents(eventsRes.data.data);
      if (actionsRes.data?.success) setQuickActions(actionsRes.data.data.actions || []);
      if (historyRes.data?.success) setHistoryList(historyRes.data.data.history || []);

      if (!silent) toast.success('AI Command Center updated');
    } catch (err) {
      console.error('[AI Operations] Fetch Error:', err);
      const msg = err.response?.data?.message || 'Failed to load AI Command Center telemetry';
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
  if (error && !overview) {
    return (
      <div className="space-y-8 animate-fade-in pb-12">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <FiTv className="text-primary-400" /> AI Operations Command Center
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
  if (loading && !overview) {
    return (
      <div className="space-y-8 animate-fade-in pb-12">
        <div>
          <div className="h-8 w-72 bg-white/10 rounded mb-2 animate-pulse"></div>
          <div className="h-3 w-96 bg-white/10 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SkeletonChart />
          <SkeletonChart />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <SkeletonPanel key={i} />)}
        </div>
      </div>
    );
  }

  const o = overview || {};
  const e = events || {};
  const predictions = e.predictions || [];
  const deployments = e.deployments || [];
  const alerts = e.alerts || [];
  const retrainingEvents = e.retrainingEvents || [];

  // Chart Data Preparation
  const predictionTrendData = historyList.map(h => ({
    label: h.label,
    Predictions: h.predictions,
    Confidence: h.avgConfidence
  }));

  const healthTrendData = historyList.map(h => ({
    label: h.label,
    'Health Score': h.healthScore
  }));

  const alertTimelineData = historyList.map(h => ({
    label: h.label,
    'Open Alerts': h.openAlerts
  }));

  const driftSummaryData = [
    { metric: 'Data Drift (PSI)', value: (o.driftSummary?.overallPSI || 0.04) * 200, display: `${(o.driftSummary?.overallPSI || 0.04).toFixed(3)} PSI` },
    { metric: 'Conf Drift %', value: (o.driftSummary?.confidenceDriftPercent || 1.5) * 10, display: `${(o.driftSummary?.confidenceDriftPercent || 1.5)}%` },
    { metric: 'Shap Coverage', value: o.shapCoverage || 82, display: `${o.shapCoverage || 82}%` },
    { metric: 'Health Index', value: o.healthScore || 88, display: `${o.healthScore || 88}/100` }
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
              <FiTv className="text-primary-400" /> AI Operations Command Center
            </h1>
            <LivePulseBadge status={o.overallAIStatus} />
          </div>
          <p className="text-gray-400 text-sm mt-1">
            Executive landing page — real-time platform telemetry, model active serving status, drift alerts & quick actions
          </p>
          {o.lastUpdated && (
            <p className="text-xs text-gray-600 mt-1">Telemetry Live: {new Date(o.lastUpdated).toLocaleString()}</p>
          )}
        </div>

        <button onClick={() => fetchData(false)} disabled={loading}
          className="px-4 py-2 bg-surface-800 border border-white/5 rounded-xl hover:bg-surface-700 text-gray-300 flex items-center gap-2 text-sm font-semibold transition-all duration-300 disabled:opacity-50">
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* ─── 8 Summary Cards Grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
        {/* Overall AI Status */}
        <div className="glass-card-hover p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">AI Status</span>
            <FiTv className="text-primary-400 w-4 h-4" />
          </div>
          <h3 className={`text-base font-bold mt-2 ${o.overallAIStatus === 'Operational' ? 'text-emerald-400' : o.overallAIStatus === 'Warning' ? 'text-amber-400' : 'text-red-400'}`}>
            {o.overallAIStatus || 'Operational'}
          </h3>
        </div>

        {/* Health Score */}
        <div className="glass-card-hover p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Health</span>
            <FiCpu className="text-emerald-400 w-4 h-4" />
          </div>
          <h3 className="text-xl font-bold text-emerald-400 mt-2 font-mono">{o.healthScore || 88}</h3>
        </div>

        {/* Current Model */}
        <div className="glass-card-hover p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Active Model</span>
            <FiBox className="text-blue-400 w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-blue-400 mt-2 font-mono truncate">{o.currentModel || 'v1.0'}</h3>
        </div>

        {/* Prediction Volume */}
        <div className="glass-card-hover p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Predictions</span>
            <FiActivity className="text-primary-400 w-4 h-4" />
          </div>
          <h3 className="text-xl font-bold text-white mt-2 font-mono">{o.predictionCount || 0}</h3>
        </div>

        {/* Average Confidence */}
        <div className="glass-card-hover p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Avg Conf</span>
            <FiPercent className="text-cyan-400 w-4 h-4" />
          </div>
          <h3 className="text-xl font-bold text-cyan-400 mt-2 font-mono">{(o.averageConfidence || 86.5).toFixed(1)}%</h3>
        </div>

        {/* Latency */}
        <div className="glass-card-hover p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Latency</span>
            <FiClock className="text-purple-400 w-4 h-4" />
          </div>
          <h3 className="text-xl font-bold text-purple-400 mt-2 font-mono">{o.averageLatency || 120} ms</h3>
        </div>

        {/* Open Alerts */}
        <div className="glass-card-hover p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Open Alerts</span>
            <FiAlertTriangle className="text-amber-400 w-4 h-4" />
          </div>
          <h3 className="text-xl font-bold text-amber-400 mt-2 font-mono">{o.openAlerts || 0}</h3>
        </div>

        {/* System Uptime */}
        <div className="glass-card-hover p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Uptime</span>
            <FiShield className="text-emerald-400 w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-emerald-400 mt-2 font-mono truncate">{o.systemUptime || '99.99%'}</h3>
        </div>
      </div>

      {/* ─── Quick Actions Bar ──────────────────────────────────────────────── */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <FiZap className="text-primary-400" /> Executive Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <button
            onClick={() => navigate('/admin/model-registry')}
            className="glass-card-hover p-4 text-left border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all flex flex-col justify-between group"
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 inline-block mb-2">Model Registry</span>
              <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">Deploy Model</h4>
              <p className="text-[11px] text-gray-400 mt-1">Promote candidate model to serving layer</p>
            </div>
            <div className="mt-3 flex items-center justify-end text-emerald-400">
              <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button
            onClick={() => navigate('/admin/model-registry')}
            className="glass-card-hover p-4 text-left border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-all flex flex-col justify-between group"
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 inline-block mb-2">Registry</span>
              <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">View Registry</h4>
              <p className="text-[11px] text-gray-400 mt-1">Inspect versions, metrics & lineage</p>
            </div>
            <div className="mt-3 flex items-center justify-end text-blue-400">
              <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button
            onClick={() => navigate('/admin/mlops-monitoring')}
            className="glass-card-hover p-4 text-left border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 transition-all flex flex-col justify-between group"
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 inline-block mb-2">Alerts & Events</span>
              <h4 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">Open Monitoring</h4>
              <p className="text-[11px] text-gray-400 mt-1">Live smart alerts & event stream</p>
            </div>
            <div className="mt-3 flex items-center justify-end text-purple-400">
              <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button
            onClick={() => navigate('/admin/retraining')}
            className="glass-card-hover p-4 text-left border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-all flex flex-col justify-between group"
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 inline-block mb-2">Decision Engine</span>
              <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">Trigger Retraining</h4>
              <p className="text-[11px] text-gray-400 mt-1">Evaluate multi-vector risk engine</p>
            </div>
            <div className="mt-3 flex items-center justify-end text-amber-400">
              <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button
            onClick={() => navigate('/admin/explainability/reports')}
            className="glass-card-hover p-4 text-left border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 transition-all flex flex-col justify-between group"
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 inline-block mb-2">Reports</span>
              <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">Health Report</h4>
              <p className="text-[11px] text-gray-400 mt-1">Export PDF / JSON explainability report</p>
            </div>
            <div className="mt-3 flex items-center justify-end text-cyan-400">
              <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>

      {/* ─── Charts Row 1: Prediction Trend & System Health Trend ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Prediction Volume & Confidence Trend */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiActivity className="text-primary-400" /> Prediction Volume & Confidence Trajectory
          </h3>
          <div className="h-72 w-full">
            {predictionTrendData.length === 0 ? (
              <EmptyState message="No prediction trend data" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={predictionTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="opPredGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
                  <Area type="monotone" dataKey="Predictions" fill="url(#opPredGrad)" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="Confidence" stroke="#06b6d4" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* System Health Score Trend */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiHeart className="text-emerald-400" /> System Health Score Trajectory
          </h3>
          <div className="h-72 w-full">
            {healthTrendData.length === 0 ? (
              <EmptyState message="No health trend data" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={healthTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[50, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip suffix="/100" />} />
                  <Line type="monotone" dataKey="Health Score" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', strokeWidth: 1 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ─── Charts Row 2: Alert Timeline & Drift Summary ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Alert Timeline Bar Chart */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiAlertTriangle className="text-amber-400" /> Open Alerts Timeline
          </h3>
          <div className="h-72 w-full">
            {alertTimelineData.length === 0 ? (
              <EmptyState message="No alert timeline data" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={alertTimelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Open Alerts" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Drift & Stability Metric Index */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiLayers className="text-cyan-400" /> Platform Stability & Drift Index
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={driftSummaryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip suffix=" index" />} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={24} name="Index Score">
                  {driftSummaryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : index === 1 ? '#f59e0b' : index === 2 ? '#10b981' : '#8b5cf6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ─── 4 Live Telemetry Panels ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Panel 1: Recent Alerts */}
        <div className="glass-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <FiAlertTriangle className="text-amber-400" /> Live Smart Alerts
            </h4>
            <span className="text-[10px] font-mono text-gray-500">Live</span>
          </div>

          <div className="space-y-3 flex-1">
            {alerts.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">No active alerts</p>
            ) : (
              alerts.slice(0, 4).map(a => (
                <div key={a.id} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${a.severity === 'Critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {a.severity}
                    </span>
                    <span className="text-[10px] text-gray-500">{new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <h5 className="text-xs font-semibold text-white mt-1 truncate">{a.title}</h5>
                  <p className="text-[11px] text-gray-400 truncate mt-0.5">{a.source}</p>
                </div>
              ))
            )}
          </div>
          <button onClick={() => navigate('/admin/mlops-monitoring')} className="w-full mt-4 text-center text-xs text-primary-400 hover:underline font-semibold">
            View All Monitoring Alerts →
          </button>
        </div>

        {/* Panel 2: Recent Predictions */}
        <div className="glass-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <FiActivity className="text-primary-400" /> Recent Predictions
            </h4>
            <span className="text-[10px] font-mono text-gray-500">Realtime</span>
          </div>

          <div className="space-y-3 flex-1">
            {predictions.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">No recent predictions</p>
            ) : (
              predictions.slice(0, 4).map(p => (
                <div key={p.id} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-white">{p.crop}</h5>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">{p.inputs}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-emerald-400 block">{p.confidence}</span>
                    <span className="text-[10px] text-gray-500 font-mono">{p.latency}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          <button onClick={() => navigate('/admin/explainability/predictions')} className="w-full mt-4 text-center text-xs text-primary-400 hover:underline font-semibold">
            Inspect Prediction Feed →
          </button>
        </div>

        {/* Panel 3: Recent Deployments */}
        <div className="glass-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <FiBox className="text-blue-400" /> Recent Deployments
            </h4>
            <span className="text-[10px] font-mono text-gray-500">Registry</span>
          </div>

          <div className="space-y-3 flex-1">
            {deployments.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">No deployments logged</p>
            ) : (
              deployments.slice(0, 4).map(d => (
                <div key={d.id} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-400 font-mono">{d.version}</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                      {d.status}
                    </span>
                  </div>
                  <h5 className="text-xs font-semibold text-white mt-1 truncate">{d.name}</h5>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">Acc: {d.accuracy} • F1: {d.f1Score}</p>
                </div>
              ))
            )}
          </div>
          <button onClick={() => navigate('/admin/model-registry')} className="w-full mt-4 text-center text-xs text-primary-400 hover:underline font-semibold">
            Open Model Registry →
          </button>
        </div>

        {/* Panel 4: Retraining Events */}
        <div className="glass-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <FiSliders className="text-purple-400" /> Retraining Events
            </h4>
            <span className="text-[10px] font-mono text-gray-500">Engine</span>
          </div>

          <div className="space-y-3 flex-1">
            {retrainingEvents.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">No retraining events</p>
            ) : (
              retrainingEvents.slice(0, 4).map(r => (
                <div key={r.id} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-400 font-mono">{r.id}</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300">
                      {r.status}
                    </span>
                  </div>
                  <h5 className="text-xs font-semibold text-white mt-1 truncate">{r.trigger}</h5>
                  <p className="text-[10px] text-emerald-400 font-mono mt-0.5">Target: {r.modelTarget} ({r.accuracyGain})</p>
                </div>
              ))
            )}
          </div>
          <button onClick={() => navigate('/admin/retraining')} className="w-full mt-4 text-center text-xs text-primary-400 hover:underline font-semibold">
            Retraining Recommendation Engine →
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIOperationsDashboard;
