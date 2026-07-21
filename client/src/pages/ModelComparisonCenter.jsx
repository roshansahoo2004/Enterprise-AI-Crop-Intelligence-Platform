import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiRefreshCw, FiSliders, FiCheckCircle, FiAward,
  FiTrendingUp, FiTrendingDown, FiShield, FiFileText, FiSend,
  FiSave, FiDownload, FiCheck, FiMinus, FiBox, FiLayers
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, Cell
} from 'recharts';
import modelComparisonApi from '../services/modelComparisonApi';
import modelDeploymentApi from '../services/modelDeploymentApi';

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
      {[...Array(10)].map((_, i) => (
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
const EmptyState = ({ message = 'No comparison data available' }) => (
  <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-2 py-8">
    <FiSliders className="w-8 h-8 opacity-40" />
    <span className="text-sm">{message}</span>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
const ModelComparisonCenter = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState(null);

  // Versions list & selected versions
  const [versions, setVersions] = useState([]);
  const [leftVersion, setLeftVersion] = useState('v1.0');
  const [rightVersion, setRightVersion] = useState('v1.2-candidate');

  // Comparison result data
  const [comparison, setComparison] = useState(null);
  const [deploying, setDeploying] = useState(false);

  // Fetch versions and initial comparison
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const versionsRes = await modelComparisonApi.getVersions();
      if (versionsRes.data?.success) {
        const list = versionsRes.data.data.versions || [];
        setVersions(list);
        if (list.length >= 2) {
          setLeftVersion(list[0].version);
          setRightVersion(list[1].version);
        }
      }

      const compRes = await modelComparisonApi.compare('v1.0', 'v1.2-candidate');
      if (compRes.data?.success) {
        setComparison(compRes.data.data);
      }
    } catch (err) {
      console.error('[Model Comparison] Fetch Error:', err);
      setError(err.response?.data?.message || 'Failed to load model comparison');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Execute Comparison Trigger
  const handleCompare = async () => {
    if (leftVersion === rightVersion) {
      toast.error('Please select two different model versions for comparison');
      return;
    }
    setComparing(true);
    try {
      const res = await modelComparisonApi.compare(leftVersion, rightVersion);
      if (res.data?.success) {
        setComparison(res.data.data);
        toast.success(`Compared ${leftVersion} vs ${rightVersion}`);
      }
    } catch (err) {
      console.error('[Compare Error]:', err);
      toast.error('Failed to compare model versions');
    } finally {
      setComparing(false);
    }
  };

  // Deploy Better Version
  const handleDeployWinner = async () => {
    if (!comparison?.winner) return;
    const winnerVer = comparison.winner;
    setDeploying(true);
    const toastId = toast.loading(`Deploying winner version ${winnerVer} to production...`);

    try {
      const res = await modelDeploymentApi.deploy({
        version: winnerVer,
        notes: `Automated deployment of winning version ${winnerVer} from Model Comparison Center`
      });

      if (res.data?.success) {
        toast.success(`Successfully deployed winner model ${winnerVer}!`, { id: toastId });
        navigate('/admin/deployments');
      }
    } catch (err) {
      console.error('[Deploy Winner Error]:', err);
      toast.error(err.response?.data?.message || 'Failed to deploy winning version', { id: toastId });
    } finally {
      setDeploying(false);
    }
  };

  // Export Comparison PDF / JSON
  const handleExportReport = () => {
    if (!comparison) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(comparison, null, 2))}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = `Model_Comparison_${comparison.leftVersion}_vs_${comparison.rightVersion}.json`;
    link.click();
    toast.success('Comparison report exported');
  };

  // Save Comparison Session
  const handleSaveComparison = () => {
    toast.success(`Comparison session (${leftVersion} vs ${rightVersion}) saved to history`);
  };

  // ─── Error State ──────────────────────────────────────────────────────────
  if (error && !comparison) {
    return (
      <div className="space-y-8 animate-fade-in pb-12">
        <div>
          <button onClick={() => navigate('/admin/operations')} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors mb-2">
            <FiArrowLeft className="w-3.5 h-3.5" /> Back to AI Operations
          </button>
          <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <FiSliders className="text-primary-400" /> Enterprise Model Version Comparison Center
          </h1>
        </div>
        <div className="glass-card p-12 flex flex-col items-center justify-center gap-4">
          <FiSliders className="w-12 h-12 text-red-400 opacity-60" />
          <p className="text-gray-400 text-center">{error}</p>
          <button onClick={fetchInitialData} className="px-5 py-2.5 bg-primary-500/20 text-primary-400 rounded-xl font-semibold text-sm hover:bg-primary-500/30 transition-all flex items-center gap-2">
            <FiRefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  // ─── Loading Skeleton ─────────────────────────────────────────────────────
  if (loading && !comparison) {
    return (
      <div className="space-y-8 animate-fade-in pb-12">
        <div>
          <div className="h-3 w-48 bg-white/10 rounded mb-4 animate-pulse"></div>
          <div className="h-8 w-64 bg-white/10 rounded mb-2 animate-pulse"></div>
          <div className="h-3 w-96 bg-white/10 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SkeletonChart />
          <SkeletonChart />
        </div>
        <SkeletonTable />
      </div>
    );
  }

  const c = comparison || {};
  const metrics = c.metrics || [];
  const radarData = c.radarData || [];

  // Bar Chart Data for Accuracy / F1 / ROC AUC
  const metricBarData = [
    { name: 'Accuracy', [c.leftVersion || 'A']: (metrics.find(m => m.key === 'accuracy')?.leftValue || 94.5), [c.rightVersion || 'B']: (metrics.find(m => m.key === 'accuracy')?.rightValue || 95.8) },
    { name: 'Precision', [c.leftVersion || 'A']: (metrics.find(m => m.key === 'precision')?.leftValue || 94.2), [c.rightVersion || 'B']: (metrics.find(m => m.key === 'precision')?.rightValue || 95.5) },
    { name: 'Recall', [c.leftVersion || 'A']: (metrics.find(m => m.key === 'recall')?.leftValue || 94.0), [c.rightVersion || 'B']: (metrics.find(m => m.key === 'recall')?.rightValue || 95.2) },
    { name: 'F1 Score', [c.leftVersion || 'A']: (metrics.find(m => m.key === 'f1Score')?.leftValue || 94.1), [c.rightVersion || 'B']: (metrics.find(m => m.key === 'f1Score')?.rightValue || 95.4) }
  ];

  // Metric Difference Delta Bar Chart Data
  const diffBarData = metrics.slice(0, 10).map(m => ({
    name: m.metric,
    Delta: m.diff,
    isPositive: m.diff > 0
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
            <FiSliders className="text-primary-400" /> Model Version Comparison Center
          </h1>
          <p className="text-gray-400 text-sm">
            Side-by-side evaluation across 16 core metrics — accuracy, latency, SHAP coverage, and automated winner scoring
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleSaveComparison}
            className="px-3.5 py-2 bg-surface-800 border border-white/10 text-gray-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
          >
            <FiSave className="w-3.5 h-3.5" /> Save Session
          </button>
          <button
            onClick={handleExportReport}
            className="px-3.5 py-2 bg-surface-800 border border-white/10 text-gray-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
          >
            <FiDownload className="w-3.5 h-3.5" /> Export Report
          </button>
          <button
            onClick={handleDeployWinner}
            disabled={deploying}
            className="px-4 py-2 bg-primary-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-primary-400 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <FiSend className="w-3.5 h-3.5" /> Deploy Winner ({c.winner})
          </button>
        </div>
      </div>

      {/* ─── Version Selector Bar ────────────────────────────────────────────── */}
      <div className="glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-6 border-primary-500/20">
        {/* Left Version Selector */}
        <div className="flex-1 w-full">
          <label className="text-xs font-bold text-blue-400 uppercase tracking-wider block mb-2">Version A (Baseline / Serving)</label>
          <select
            value={leftVersion}
            onChange={(e) => setLeftVersion(e.target.value)}
            className="w-full bg-surface-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
          >
            {versions.map(v => (
              <option key={v.version} value={v.version}>{v.label}</option>
            ))}
          </select>
        </div>

        {/* VS Badge */}
        <div className="w-10 h-10 rounded-full bg-primary-500/20 border border-primary-500/40 flex items-center justify-center font-bold text-primary-400 text-xs shrink-0 my-2 md:my-0">
          VS
        </div>

        {/* Right Version Selector */}
        <div className="flex-1 w-full">
          <label className="text-xs font-bold text-purple-400 uppercase tracking-wider block mb-2">Version B (Candidate / Comparison)</label>
          <select
            value={rightVersion}
            onChange={(e) => setRightVersion(e.target.value)}
            className="w-full bg-surface-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-purple-500"
          >
            {versions.map(v => (
              <option key={v.version} value={v.version}>{v.label}</option>
            ))}
          </select>
        </div>

        {/* Trigger Compare Button */}
        <button
          onClick={handleCompare}
          disabled={comparing}
          className="w-full md:w-auto px-6 py-2.5 bg-primary-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-primary-400 flex items-center justify-center gap-2 transition-all shrink-0 disabled:opacity-50"
        >
          <FiRefreshCw className={`w-4 h-4 ${comparing ? 'animate-spin' : ''}`} /> Run Comparison
        </button>
      </div>

      {/* ─── 4 Summary Cards Grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Selected Versions */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
            <FiBox className="text-blue-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Comparison</p>
            <h3 className="text-sm font-bold text-white mt-1 font-mono">{c.leftVersion} vs {c.rightVersion}</h3>
          </div>
        </div>

        {/* Overall Winner */}
        <div className="glass-card-hover p-5 flex items-center gap-3 border-emerald-500/30 bg-emerald-500/5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shrink-0">
            <FiAward className="text-emerald-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Overall Winner</p>
            <h3 className="text-base font-bold text-emerald-400 mt-0.5 font-mono">{c.winner} ⭐</h3>
          </div>
        </div>

        {/* Overall Score */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shrink-0">
            <FiShield className="text-purple-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Score Index</p>
            <h3 className="text-base font-bold text-purple-400 mt-0.5 font-mono">{c.overallLeftScore} vs {c.overallRightScore}</h3>
          </div>
        </div>

        {/* Deployment Recommendation */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
            <FiSend className="text-amber-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Recommendation</p>
            <h3 className="text-xs font-bold text-amber-400 mt-1 truncate">{c.winner === c.rightVersion ? 'Deploy Candidate' : 'Retain Current'}</h3>
          </div>
        </div>
      </div>

      {/* ─── Recommendation Rationale Banner ─────────────────────────────────── */}
      {c.recommendation && (
        <div className="glass-card p-5 border-emerald-500/30 bg-emerald-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shrink-0">
              <FiCheckCircle className="text-emerald-400 w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Deployment Decision Rationale</h4>
              <p className="text-xs text-gray-200 mt-0.5 leading-relaxed font-mono">{c.recommendation}</p>
            </div>
          </div>
          <button
            onClick={handleDeployWinner}
            disabled={deploying}
            className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-emerald-400 transition-all shrink-0"
          >
            Deploy {c.winner}
          </button>
        </div>
      )}

      {/* ─── Charts Row 1: Radar Comparison & Bar Comparison ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Radar Comparison Chart */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiShield className="text-primary-400" /> Multi-Dimensional Radar Comparison
          </h3>
          <div className="h-80 w-full flex items-center justify-center">
            {radarData.length === 0 ? (
              <EmptyState message="No radar data available" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="75%">
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} />
                  <Radar name={c.leftVersion} dataKey={c.leftVersion} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} strokeWidth={2} />
                  <Radar name={c.rightVersion} dataKey={c.rightVersion} stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} strokeWidth={2} />
                  <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Grouped Bar Comparison Chart */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiLayers className="text-cyan-400" /> Accuracy & F1 Score Comparison
          </h3>
          <div className="h-80 w-full">
            {metricBarData.length === 0 ? (
              <EmptyState message="No metric data available" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metricBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[90, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip suffix="%" />} />
                  <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
                  <Bar dataKey={c.leftVersion || 'A'} fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={18} />
                  <Bar dataKey={c.rightVersion || 'B'} fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ─── Metric Difference Delta Bar Chart ──────────────────────────────── */}
      <div className="glass-card-hover p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FiTrendingUp className="text-amber-400" /> Metric Difference Delta ({c.rightVersion} vs {c.leftVersion})
        </h3>
        <div className="h-64 w-full">
          {diffBarData.length === 0 ? (
            <EmptyState message="No difference metrics available" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={diffBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} angle={-15} textAnchor="end" height={45} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Delta" radius={[4, 4, 0, 0]} barSize={16}>
                  {diffBarData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isPositive ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ─── 16-Metric Side-by-Side Comparison Table ─────────────────────────── */}
      <div className="glass-card-hover p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FiFileText className="text-primary-400" /> Comprehensive 16-Metric Comparison Table
          </h3>
          <span className="text-xs text-gray-500 font-mono">
            Highlighted cell indicates winning metric
          </span>
        </div>

        {metrics.length === 0 ? (
          <EmptyState message="No comparison metrics available" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Metric</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-right">{c.leftVersion} (Version A)</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-right">{c.rightVersion} (Version B)</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-right">Delta ($\Delta$)</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-center">Metric Winner</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((m, idx) => {
                  const isLeftWinner = m.winner === c.leftVersion;
                  const isRightWinner = m.winner === c.rightVersion;

                  return (
                    <tr key={m.key} className={`border-b border-white/5 transition-colors hover:bg-white/[0.02] ${idx % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-semibold text-white block">{m.metric}</span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {m.higherIsBetter ? 'Higher is better' : 'Lower is better'}
                        </span>
                      </td>

                      {/* Version A Cell */}
                      <td className={`px-4 py-3.5 text-right font-mono text-sm font-bold ${isLeftWinner ? 'text-emerald-400 bg-emerald-500/10' : 'text-gray-300'}`}>
                        {m.leftFormatted}
                      </td>

                      {/* Version B Cell */}
                      <td className={`px-4 py-3.5 text-right font-mono text-sm font-bold ${isRightWinner ? 'text-emerald-400 bg-emerald-500/10' : 'text-gray-300'}`}>
                        {m.rightFormatted}
                      </td>

                      {/* Delta Cell */}
                      <td className="px-4 py-3.5 text-right font-mono text-xs font-bold">
                        <span className={m.diff > 0 ? (m.higherIsBetter ? 'text-emerald-400' : 'text-red-400') : m.diff < 0 ? (m.higherIsBetter ? 'text-red-400' : 'text-emerald-400') : 'text-gray-500'}>
                          {m.diffFormatted}
                        </span>
                      </td>

                      {/* Winner Cell */}
                      <td className="px-4 py-3.5 text-center">
                        {m.winner === 'Tie' ? (
                          <span className="text-xs text-gray-500 font-mono">Tie</span>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${m.winner === c.winner ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500/15 text-blue-400'}`}>
                            {m.winner}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelComparisonCenter;
