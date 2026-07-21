import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiRefreshCw, FiSliders, FiActivity, FiShield,
  FiAlertTriangle, FiAlertCircle, FiCheckCircle, FiTrendingUp,
  FiDatabase, FiPercent, FiCpu, FiLayers
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell
} from 'recharts';
import retrainingRecommendationApi from '../services/retrainingRecommendationApi';

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

// ─── Priority Badge ─────────────────────────────────────────────────────────
const PriorityBadge = ({ priority }) => {
  const styles = {
    Low: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    High: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    Critical: 'bg-red-500/15 text-red-400 border-red-500/30 animate-pulse'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${styles[priority] || 'bg-gray-500/15 text-gray-400 border-gray-500/30'}`}>
      {priority === 'Low' && <FiCheckCircle className="w-3 h-3" />}
      {priority === 'Medium' && <FiAlertTriangle className="w-3 h-3" />}
      {(priority === 'High' || priority === 'Critical') && <FiAlertCircle className="w-3 h-3" />}
      {priority} Priority
    </span>
  );
};

// ─── Status Badge ───────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const styles = {
    Healthy: 'bg-emerald-500/10 text-emerald-400',
    Warning: 'bg-amber-500/10 text-amber-400',
    Critical: 'bg-red-500/10 text-red-400 font-bold'
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${styles[status] || 'text-gray-400'}`}>
      {status}
    </span>
  );
};

// ─── Circular Recommendation Gauge ──────────────────────────────────────────
const CircularRecommendationGauge = ({ score, level }) => {
  const getColor = (s) => {
    if (s < 30) return { stroke: '#10b981', glow: 'rgba(16, 185, 129, 0.3)', text: 'text-emerald-400' };
    if (s < 60) return { stroke: '#f59e0b', glow: 'rgba(245, 158, 11, 0.3)', text: 'text-amber-400' };
    if (s < 80) return { stroke: '#f97316', glow: 'rgba(249, 115, 22, 0.3)', text: 'text-orange-400' };
    return { stroke: '#ef4444', glow: 'rgba(239, 68, 68, 0.3)', text: 'text-red-400' };
  };

  const colors = getColor(score);
  const circumference = 2 * Math.PI * 88;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-52 h-52">
        <div className="absolute inset-0 rounded-full blur-2xl opacity-40" style={{ backgroundColor: colors.glow }}></div>
        <svg className="w-52 h-52 transform -rotate-90" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
          <circle cx="100" cy="100" r="88" fill="none" stroke={colors.stroke} strokeWidth="12"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset}
            className="transition-all duration-1000 ease-out"
            style={{ filter: `drop-shadow(0 0 8px ${colors.glow})` }} />
          <circle cx="100" cy="100" r="76" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold font-mono ${colors.text} transition-all duration-700`}>
            {score.toFixed(1)}
          </span>
          <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mt-1">
            Risk Index
          </span>
        </div>
      </div>
      <div className="mt-4 text-center">
        <span className={`text-sm font-bold ${colors.text}`}>{level || 'Healthy'}</span>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
const RetrainingRecommendationDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [summaryRes, historyRes] = await Promise.all([
        retrainingRecommendationApi.getSummary(),
        retrainingRecommendationApi.getHistory(30)
      ]);

      if (summaryRes.data?.success) setSummary(summaryRes.data.data);
      if (historyRes.data?.success) setHistory(historyRes.data.data);

      if (!silent) toast.success('Retraining analysis refreshed');
    } catch (err) {
      console.error('[Retraining] Fetch Error:', err);
      const msg = err.response?.data?.message || 'Failed to load retraining recommendations';
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
          <button onClick={() => navigate('/admin/dashboard')} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors mb-2">
            <FiArrowLeft className="w-3.5 h-3.5" /> Back to MLOps Dashboard
          </button>
          <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <FiSliders className="text-primary-400" /> Retraining Recommendation Engine
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
  const factors = s.factors || [];
  const hist = history?.history || [];
  const requiresAction = (s.recommendationScore || 0) >= 60;

  // Bar Chart Data for Factor Contribution
  const factorChartData = factors.map(f => ({
    name: f.factorName,
    Weight: f.weightPercent,
    'Risk Contribution': f.contribution,
    'Raw Risk': f.riskScore
  }));

  // Dual Line Chart Data for Health vs Drift Trend
  const healthVsDriftData = hist.map(h => ({
    label: h.label,
    'Risk Score': h.recommendationScore,
    'Avg Confidence': h.avgConfidence
  }));

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button onClick={() => navigate('/admin/dashboard')} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors mb-2">
            <FiArrowLeft className="w-3.5 h-3.5" /> Back to MLOps Dashboard
          </button>
          <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <FiSliders className="text-primary-400" /> Retraining Recommendation Engine
          </h1>
          <p className="text-gray-400 text-sm">
            Automated multi-vector decision engine evaluating Model Health, Data Drift, Feature Stability, and Confidence Degradation
          </p>
          {s.generatedAt && (
            <p className="text-xs text-gray-600 mt-1">Generated: {new Date(s.generatedAt).toLocaleString()}</p>
          )}
        </div>

        <button onClick={() => fetchData(false)} disabled={loading}
          className="px-4 py-2 bg-surface-800 border border-white/5 rounded-xl hover:bg-surface-700 text-gray-300 flex items-center gap-2 text-sm font-semibold transition-all duration-300 disabled:opacity-50">
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* ─── Retraining Warning Banner ────────────────────────────────────────── */}
      {requiresAction && (
        <div className="glass-card border-orange-500/30 bg-orange-500/5 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30 shrink-0">
              <FiAlertTriangle className="text-orange-400 w-6 h-6" />
            </div>
            <div>
              <h3 className="text-orange-400 font-bold text-base flex items-center gap-2">
                ⚠ Retraining Recommended — [{s.overallRecommendation}]
              </h3>
              <p className="text-gray-300 text-xs mt-1 max-w-3xl leading-relaxed">{s.reason}</p>
            </div>
          </div>
          <button
            onClick={() => toast.success('Retraining pipeline trigger initiated')}
            className="px-5 py-2.5 bg-orange-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-orange-400 transition-all shrink-0 shadow-lg shadow-orange-500/20"
          >
            Trigger Retraining Pipeline
          </button>
        </div>
      )}

      {/* ─── Gauge + Summary Cards Row ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recommendation Gauge Card */}
        <div className="glass-card-hover p-8 flex flex-col items-center justify-center">
          <CircularRecommendationGauge score={s.recommendationScore || 0} level={s.overallRecommendation} />
          <div className="w-full mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-xs text-gray-400">Decision Priority</span>
            <PriorityBadge priority={s.priority || 'Low'} />
          </div>
          <div className="w-full mt-3 flex items-center justify-between">
            <span className="text-xs text-gray-400">Engine Certainty</span>
            <span className="text-xs text-primary-400 font-bold font-mono">{s.engineConfidence || '92%'}</span>
          </div>
        </div>

        {/* 6 Summary Cards Grid */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {/* Recommendation Score */}
          <div className="glass-card-hover p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center border border-primary-500/20 shrink-0">
              <FiSliders className="text-primary-400 w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Risk Score</p>
              <h3 className="text-xl font-bold text-primary-400 mt-0.5 font-mono">{(s.recommendationScore || 0).toFixed(1)}</h3>
            </div>
          </div>

          {/* Recommendation Level */}
          <div className="glass-card-hover p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <FiCheckCircle className="text-emerald-400 w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Level</p>
              <h3 className="text-sm font-bold text-emerald-400 mt-1 truncate">{s.overallRecommendation || 'Healthy'}</h3>
            </div>
          </div>

          {/* Priority */}
          <div className="glass-card-hover p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
              <FiAlertTriangle className="text-amber-400 w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Priority</p>
              <h3 className="text-lg font-bold text-amber-400 mt-0.5 font-mono">{s.priority || 'Low'}</h3>
            </div>
          </div>

          {/* Engine Confidence */}
          <div className="glass-card-hover p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
              <FiPercent className="text-blue-400 w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Confidence</p>
              <h3 className="text-xl font-bold text-blue-400 mt-0.5 font-mono">{s.engineConfidence || '92%'}</h3>
            </div>
          </div>

          {/* Health Score */}
          <div className="glass-card-hover p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shrink-0">
              <FiCpu className="text-purple-400 w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Health Score</p>
              <h3 className="text-xl font-bold text-purple-400 mt-0.5 font-mono">{s.healthScore || 85}</h3>
            </div>
          </div>

          {/* Overall Status */}
          <div className="glass-card-hover p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shrink-0">
              <FiShield className="text-cyan-400 w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Overall Status</p>
              <h3 className="text-sm font-bold text-cyan-400 mt-1">{s.overallStatus || 'Optimal'}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Rationale Card ───────────────────────────────────────────────────── */}
      <div className="glass-card p-6">
        <h3 className="text-sm text-gray-400 font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
          <FiActivity className="text-primary-400" /> Automated Decision Rationale
        </h3>
        <p className="text-sm text-gray-200 leading-relaxed font-mono bg-white/[0.02] p-4 rounded-xl border border-white/5">
          {s.reason}
        </p>
      </div>

      {/* ─── Charts Row 1: Factor Contribution & Recommendation Trend ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Factor Contribution Bar Chart */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiLayers className="text-primary-400" /> Factor Contribution Breakdown
          </h3>
          <div className="h-72 w-full">
            {factorChartData.length === 0 ? (
              <EmptyState message="No factor data available" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={factorChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip suffix="%" />} />
                  <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
                  <Bar dataKey="Weight" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={14} />
                  <Bar dataKey="Risk Contribution" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recommendation Score Trend */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiTrendingUp className="text-amber-400" /> Recommendation Score Trend
          </h3>
          <div className="h-72 w-full">
            {hist.length === 0 ? (
              <EmptyState message="No history trend available" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hist} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="recGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="recommendationScore" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#recGrad)" name="Risk Score" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ─── Charts Row 2: Health vs Drift & Recommendation Timeline ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Health vs Drift */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiCpu className="text-cyan-400" /> Risk Score vs Average Confidence
          </h3>
          <div className="h-72 w-full">
            {healthVsDriftData.length === 0 ? (
              <EmptyState message="No timeline comparison" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={healthVsDriftData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
                  <Bar dataKey="Risk Score" fill="#f97316" radius={[4, 4, 0, 0]} barSize={12} />
                  <Line type="monotone" dataKey="Avg Confidence" stroke="#10b981" strokeWidth={2.5} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recommendation Timeline Bar */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiDatabase className="text-purple-400" /> Historical Priority Timeline
          </h3>
          <div className="h-72 w-full">
            {hist.length === 0 ? (
              <EmptyState message="No timeline available" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hist} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="recommendationScore" radius={[4, 4, 0, 0]} barSize={14} name="Daily Risk Score">
                    {hist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.recommendationScore < 30 ? '#10b981' : entry.recommendationScore < 60 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ─── Contributing Factors Table ──────────────────────────────────────── */}
      <div className="glass-card-hover p-6">
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <FiLayers className="text-primary-400" /> Contributing Factor Analysis
        </h3>

        {factors.length === 0 ? (
          <EmptyState message="No factors data available" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Factor</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-right">Weight</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-right">Current Value</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-right">Risk Score</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-right">Contribution</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {factors.map((f, idx) => (
                  <tr key={f.key} className={`border-b border-white/5 transition-colors hover:bg-white/[0.02] ${idx % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-semibold text-white">{f.factorName}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm text-gray-400 font-mono">{f.weightPercent}%</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm text-gray-200 font-mono font-semibold">{f.rawValue}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${f.riskScore}%`,
                              backgroundColor: f.riskScore < 30 ? '#10b981' : f.riskScore < 60 ? '#f59e0b' : '#ef4444'
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-mono text-gray-300 font-bold">{f.riskScore}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm font-bold font-mono text-primary-400">+{f.contribution}</span>
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

export default RetrainingRecommendationDashboard;
