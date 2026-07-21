import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiRefreshCw, FiRadio, FiActivity, FiShield,
  FiAlertTriangle, FiAlertCircle, FiCheckCircle, FiTrendingUp,
  FiDatabase, FiCpu, FiLayers, FiList, FiClock, FiCheck, FiFilter, FiPieChart
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import mlopsMonitoringApi from '../services/mlopsMonitoringApi';

// ─── Constants ──────────────────────────────────────────────────────────────
const MODULE_OPTIONS = [
  { value: '', label: 'All Modules' },
  { value: 'Model Health', label: 'Model Health' },
  { value: 'Data Drift', label: 'Data Drift' },
  { value: 'Feature Drift', label: 'Feature Drift' },
  { value: 'Confidence Drift', label: 'Confidence Drift' },
  { value: 'Retraining', label: 'Retraining' },
  { value: 'Explainability', label: 'Explainability' },
  { value: 'Prediction Performance', label: 'Prediction Performance' }
];

const SEVERITY_OPTIONS = [
  { value: '', label: 'All Severities' },
  { value: 'Info', label: 'Info' },
  { value: 'Warning', label: 'Warning' },
  { value: 'High', label: 'High' },
  { value: 'Critical', label: 'Critical' }
];

const SEVERITY_COLORS = {
  Info: '#3b82f6',
  Warning: '#f59e0b',
  High: '#f97316',
  Critical: '#ef4444'
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
      {[...Array(6)].map((_, i) => (
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

// ─── Severity Badge ─────────────────────────────────────────────────────────
const SeverityBadge = ({ severity }) => {
  const styles = {
    Info: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    Warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    High: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    Critical: 'bg-red-500/15 text-red-400 border-red-500/30 animate-pulse'
  };
  const icons = {
    Info: <FiActivity className="w-3 h-3" />,
    Warning: <FiAlertTriangle className="w-3 h-3" />,
    High: <FiAlertCircle className="w-3 h-3" />,
    Critical: <FiAlertCircle className="w-3 h-3" />
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${styles[severity] || 'bg-gray-500/15 text-gray-400 border-gray-500/30'}`}>
      {icons[severity] || null}
      {severity}
    </span>
  );
};

// ─── System Health Indicator Pulse ──────────────────────────────────────────
const HealthPulse = ({ status }) => {
  const isOptimal = status === 'Optimal';
  const isWarning = status === 'Warning';

  const dotColor = isOptimal ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-red-500';
  const textColor = isOptimal ? 'text-emerald-400' : isWarning ? 'text-amber-400' : 'text-red-400';
  const bgBorder = isOptimal ? 'bg-emerald-500/10 border-emerald-500/20' : isWarning ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20';

  return (
    <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2.5 ${bgBorder}`}>
      <span className="relative flex h-3 w-3">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`}></span>
        <span className={`relative inline-flex rounded-full h-3 w-3 ${dotColor}`}></span>
      </span>
      <span className={`text-xs font-bold uppercase tracking-wider ${textColor}`}>
        System {status}
      </span>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
const MLOpsMonitoringCenter = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overview, setOverview] = useState(null);
  const [alertsData, setAlertsData] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [timelineData, setTimelineData] = useState(null);

  // Filters
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [selectedResolved, setSelectedResolved] = useState('');
  const [activeTab, setActiveTab] = useState('alerts'); // 'alerts' | 'history' | 'timeline'

  // Fetch all monitoring data
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [overviewRes, alertsRes, historyRes, timelineRes] = await Promise.all([
        mlopsMonitoringApi.getOverview(),
        mlopsMonitoringApi.getAlerts({ module: selectedModule, severity: selectedSeverity, resolved: selectedResolved }),
        mlopsMonitoringApi.getHistory(30),
        mlopsMonitoringApi.getTimeline(7)
      ]);

      if (overviewRes.data?.success) setOverview(overviewRes.data.data);
      if (alertsRes.data?.success) setAlertsData(alertsRes.data.data);
      if (historyRes.data?.success) setHistoryData(historyRes.data.data);
      if (timelineRes.data?.success) setTimelineData(timelineRes.data.data);

      if (!silent) toast.success('Monitoring center refreshed');
    } catch (err) {
      console.error('[MLOps Monitoring] Fetch Error:', err);
      const msg = err.response?.data?.message || 'Failed to load monitoring overview';
      setError(msg);
      if (!silent) toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedModule, selectedSeverity, selectedResolved]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Toggle resolve status locally for demo responsiveness
  const handleToggleResolve = (alertId) => {
    if (!alertsData) return;
    const updatedAlerts = alertsData.alerts.map(a => {
      if (a.id === alertId) {
        const nextResolved = !a.resolved;
        toast.success(`Alert ${alertId} marked as ${nextResolved ? 'Resolved' : 'Active'}`);
        return { ...a, resolved: nextResolved };
      }
      return a;
    });
    setAlertsData({ ...alertsData, alerts: updatedAlerts });
  };

  // ─── Error State ──────────────────────────────────────────────────────────
  if (error && !overview) {
    return (
      <div className="space-y-8 animate-fade-in pb-12">
        <div>
          <button onClick={() => navigate('/admin/dashboard')} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors mb-2">
            <FiArrowLeft className="w-3.5 h-3.5" /> Back to MLOps Dashboard
          </button>
          <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <FiRadio className="text-primary-400" /> MLOps Operations & Monitoring Center
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

  const o = overview || {};
  const alertsList = alertsData?.alerts || [];
  const historyList = historyData?.history || [];
  const timelineList = timelineData?.events || [];
  const moduleScores = o.moduleScores || [];
  const severityCounts = alertsData?.severityCounts || { Info: 0, Warning: 0, High: 0, Critical: 0 };

  // Pie chart data for severity distribution
  const pieSeverityData = Object.entries(severityCounts)
    .filter(([, val]) => val > 0)
    .map(([name, value]) => ({ name, value, color: SEVERITY_COLORS[name] || '#64748b' }));

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button onClick={() => navigate('/admin/dashboard')} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors mb-2">
            <FiArrowLeft className="w-3.5 h-3.5" /> Back to MLOps Dashboard
          </button>
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
              <FiRadio className="text-primary-400 animate-pulse" /> MLOps Operations & Monitoring Center
            </h1>
            <HealthPulse status={o.overallSystemStatus || 'Optimal'} />
          </div>
          <p className="text-gray-400 text-sm mt-1">
            Centralized monitoring hub — synthesizing smart alerts, drift trajectories, module health, and event feeds
          </p>
          {o.lastAnalysisTime && (
            <p className="text-xs text-gray-600 mt-1">Last Analysis: {new Date(o.lastAnalysisTime).toLocaleString()}</p>
          )}
        </div>

        <button onClick={() => fetchData(false)} disabled={loading}
          className="px-4 py-2 bg-surface-800 border border-white/5 rounded-xl hover:bg-surface-700 text-gray-300 flex items-center gap-2 text-sm font-semibold transition-all duration-300 disabled:opacity-50">
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* ─── Summary Cards (6) ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Overall Status */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center border border-primary-500/20 shrink-0">
            <FiRadio className="text-primary-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Overall Status</p>
            <h3 className={`text-base font-bold mt-0.5 ${o.overallSystemStatus === 'Optimal' ? 'text-emerald-400' : o.overallSystemStatus === 'Warning' ? 'text-amber-400' : 'text-red-400'}`}>
              {o.overallSystemStatus || 'Optimal'}
            </h3>
          </div>
        </div>

        {/* Open Alerts */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
            <FiAlertTriangle className="text-amber-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Open Alerts</p>
            <h3 className="text-xl font-bold text-amber-400 mt-0.5 font-mono">{o.openAlertsCount || 0}</h3>
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 shrink-0">
            <FiAlertCircle className="text-red-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Critical Alerts</p>
            <h3 className="text-xl font-bold text-red-400 mt-0.5 font-mono">{o.criticalAlertsCount || 0}</h3>
          </div>
        </div>

        {/* Health Score */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
            <FiCpu className="text-emerald-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Health Score</p>
            <h3 className="text-xl font-bold text-emerald-400 mt-0.5 font-mono">{o.healthScore || 85}</h3>
          </div>
        </div>

        {/* Last Analysis */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
            <FiClock className="text-blue-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Last Analysis</p>
            <h3 className="text-xs font-bold text-blue-400 mt-1 truncate">
              {o.lastAnalysisTime ? new Date(o.lastAnalysisTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}
            </h3>
          </div>
        </div>

        {/* Recommendation */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shrink-0">
            <FiShield className="text-purple-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Retraining</p>
            <h3 className="text-xs font-bold text-purple-400 mt-1 truncate">{o.retrainingRecommendation || 'Healthy'}</h3>
          </div>
        </div>
      </div>

      {/* ─── Charts Row 1: Alert Trend & Severity Distribution ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Alert Trend */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiTrendingUp className="text-primary-400" /> Open Alerts Trajectory (30 Days)
          </h3>
          <div className="h-72 w-full">
            {historyList.length === 0 ? (
              <EmptyState message="No alert trend available" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyList} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="alertGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="openAlerts" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#alertGrad)" name="Open Alerts" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Severity Distribution Pie */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiPieChart className="text-amber-400" /> Alert Severity Distribution
          </h3>
          <div className="h-72 w-full flex items-center justify-center">
            {pieSeverityData.length === 0 ? (
              <EmptyState message="No alerts severity distribution" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieSeverityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieSeverityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ─── Charts Row 2: Module Health Comparison & Timeline Overview ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Module Health Comparison Bar Chart */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiLayers className="text-cyan-400" /> Module Health & Stability Scores
          </h3>
          <div className="h-72 w-full">
            {moduleScores.length === 0 ? (
              <EmptyState message="No module scores available" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moduleScores} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="module" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={50} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip suffix="/100" />} />
                  <Bar dataKey="score" fill="#10b981" radius={[4, 4, 0, 0]} barSize={22} name="Score">
                    {moduleScores.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.score >= 80 ? '#10b981' : entry.score >= 60 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Monitoring Timeline Bar */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiActivity className="text-purple-400" /> Daily Health Score Trajectory
          </h3>
          <div className="h-72 w-full">
            {historyList.length === 0 ? (
              <EmptyState message="No health trajectory" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyList} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[50, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip suffix="/100" />} />
                  <Line type="monotone" dataKey="healthScore" stroke="#8b5cf6" strokeWidth={2.5} dot={{ fill: '#8b5cf6', strokeWidth: 1 }} name="Health Score" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ─── Tab Navigation (Smart Alerts / History / Events Feed) ───────────── */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'alerts' ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'text-gray-400 hover:text-white'}`}
            >
              <FiAlertTriangle className="w-3.5 h-3.5" /> Smart Alerts ({alertsList.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'text-gray-400 hover:text-white'}`}
            >
              <FiDatabase className="w-3.5 h-3.5" /> History Snapshots ({historyList.length})
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'timeline' ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'text-gray-400 hover:text-white'}`}
            >
              <FiList className="w-3.5 h-3.5" /> Events Feed ({timelineList.length})
            </button>
          </div>

          {/* Filters for Smart Alerts tab */}
          {activeTab === 'alerts' && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold mr-1">
                <FiFilter className="w-3.5 h-3.5" /> Filters:
              </div>
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="bg-surface-800 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none"
              >
                {MODULE_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="bg-surface-800 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none"
              >
                {SEVERITY_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <select
                value={selectedResolved}
                onChange={(e) => setSelectedResolved(e.target.value)}
                className="bg-surface-800 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="false">Active Only</option>
                <option value="true">Resolved Only</option>
              </select>
            </div>
          )}
        </div>

        {/* ─── TAB 1: Smart Alerts Table ─────────────────────────────────────── */}
        {activeTab === 'alerts' && (
          <div>
            {alertsList.length === 0 ? (
              <EmptyState message="No matching alerts found" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Alert</th>
                      <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Source Module</th>
                      <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Description & Recommendation</th>
                      <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-center">Severity</th>
                      <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-center">Status</th>
                      <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alertsList.map((a, idx) => (
                      <tr key={a.id} className={`border-b border-white/5 transition-colors hover:bg-white/[0.02] ${idx % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                        <td className="px-4 py-3.5">
                          <span className="text-sm font-semibold text-white block">{a.title}</span>
                          <span className="text-[10px] text-gray-500 font-mono">{a.id} • {new Date(a.createdAt).toLocaleTimeString()}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white/5 text-gray-300 border border-white/5">
                            {a.source}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 max-w-md">
                          <p className="text-xs text-gray-300 leading-relaxed">{a.description}</p>
                          {a.recommendation && (
                            <p className="text-[11px] text-primary-400 mt-1 font-mono">💡 {a.recommendation}</p>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <SeverityBadge severity={a.severity} />
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${a.resolved ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                            {a.resolved ? 'Resolved' : 'Active'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => handleToggleResolve(a.id)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${a.resolved ? 'bg-surface-800 text-gray-400 border-white/5 hover:text-white' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'}`}
                          >
                            {a.resolved ? 'Reopen' : 'Resolve'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: History Table ─────────────────────────────────────────── */}
        {activeTab === 'history' && (
          <div>
            {historyList.length === 0 ? (
              <EmptyState message="No history snapshots" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-right">Health Score</th>
                      <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-right">Avg Confidence</th>
                      <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-right">Avg Latency</th>
                      <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-right">Predictions</th>
                      <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-right">Open Alerts</th>
                      <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyList.slice().reverse().map((h, idx) => (
                      <tr key={h.date} className={`border-b border-white/5 transition-colors hover:bg-white/[0.02] ${idx % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                        <td className="px-4 py-3.5">
                          <span className="text-sm font-semibold text-white">{h.label}</span>
                          <span className="text-[10px] text-gray-500 block">{h.date}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-400">{h.healthScore}/100</td>
                        <td className="px-4 py-3.5 text-right font-mono text-gray-300">{h.avgConfidence}%</td>
                        <td className="px-4 py-3.5 text-right font-mono text-gray-300">{h.avgLatency} ms</td>
                        <td className="px-4 py-3.5 text-right font-mono text-white">{h.predictions}</td>
                        <td className="px-4 py-3.5 text-right font-mono text-amber-400">{h.openAlerts}</td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${h.status === 'Optimal' ? 'bg-emerald-500/10 text-emerald-400' : h.status === 'Warning' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>
                            {h.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: Chronological Events Feed ──────────────────────────────── */}
        {activeTab === 'timeline' && (
          <div className="space-y-4">
            {timelineList.length === 0 ? (
              <EmptyState message="No timeline events feed" />
            ) : (
              <div className="relative border-l-2 border-white/10 ml-4 pl-6 space-y-6">
                {timelineList.map(e => (
                  <div key={e.id} className="relative group">
                    {/* Event Dot */}
                    <div className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-surface-950 ${e.severity === 'Critical' ? 'bg-red-500 animate-pulse' : e.severity === 'High' ? 'bg-orange-500' : e.severity === 'Warning' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>

                    <div className="glass-card-hover p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono font-semibold text-gray-400">{new Date(e.timestamp).toLocaleString()}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-gray-300 font-mono">{e.source}</span>
                          <SeverityBadge severity={e.severity} />
                        </div>
                        <h4 className="text-sm font-bold text-white">{e.title}</h4>
                        <p className="text-xs text-gray-400 mt-0.5">{e.message}</p>
                      </div>
                      <span className="text-[10px] font-bold font-mono px-2 py-1 rounded bg-white/5 text-gray-400 uppercase">
                        {e.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MLOpsMonitoringCenter;
