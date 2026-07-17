/**
 * Phase-7 Step-1: Model Performance Dashboard Page
 *
 * Production-grade performance, deployment, and operational metrics dashboard.
 * Visualizes model accuracy, loss, F1-score, and training duration trendlines using Recharts.
 * Lists all registered models and pipeline training histories.
 *
 * Dark theme matching AgriSense MLOps aesthetics.
 */
import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { modelDashboardAPI } from '../services/modelDashboardApi';
import {
  FiCpu, FiActivity, FiClock, FiHardDrive, FiZap,
  FiTrendingUp, FiAlertTriangle, FiRefreshCw, FiLayers,
  FiDatabase, FiCheckCircle, FiXCircle, FiPlay
} from 'react-icons/fi';
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

const ModelDashboard = () => {
  // ─── Component state ───
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─── Fetch all data ───
  const fetchDashboardData = useCallback(async (showToast = false) => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, trendsRes, historyRes] = await Promise.all([
        modelDashboardAPI.getSummary(),
        modelDashboardAPI.getTrends(),
        modelDashboardAPI.getHistory()
      ]);

      setSummary(summaryRes.data.data);
      setTrends(trendsRes.data.data);
      setHistory(historyRes.data.data);

      if (showToast) {
        toast.success('Dashboard metrics refreshed');
      }
    } catch (err) {
      console.error('Failed to fetch model dashboard data:', err);
      const msg = err.response?.status === 403
        ? 'Admin access required.'
        : 'Failed to retrieve model performance metrics.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ─── Helpers ───
  const pct = (val) => {
    if (val == null) return '—';
    return val <= 1 ? `${(val * 100).toFixed(2)}%` : `${val.toFixed(2)}%`;
  };

  const num = (val) => val != null ? val : '—';

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "—";

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h) return `${h}h ${m}m`;
    if (m) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'CANDIDATE':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  // ─── Custom tooltip for charts ───
  const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-surface-900 border border-white/10 rounded-xl p-3 shadow-xl text-xs">
        <p className="text-white font-bold mb-1">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color }} className="font-semibold">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  };

  // ─── Loading Skeletons ───
  if (loading && !summary) {
    return (
      <div className="space-y-8 animate-pulse pb-12">
        {/* Header */}
        <div className="h-16 w-1/3 bg-surface-800 rounded"></div>
        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card p-6 h-28 bg-surface-800"></div>
          ))}
        </div>
        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6 h-80 bg-surface-800"></div>
          <div className="glass-card p-6 h-80 bg-surface-800"></div>
        </div>
      </div>
    );
  }

  // ─── Error State ───
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="glass-card p-12 text-center max-w-md border-red-500/20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <FiAlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-display font-bold text-white mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => fetchDashboardData(true)}
            className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2"
          >
            <FiRefreshCw className="w-4 h-4" />
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // ─── Chart Data Mapping (oldest → newest) ───
  const chartData = trends.map((t) => ({
    version: t.version,
    Accuracy: t.accuracy ?? 0,
    Loss: t.loss ?? 0,
    "F1 Score": t.f1Score ?? 0,
    "Duration (s)": t.trainingDuration ?? 0
  }));

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* ─── Page Header ─── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <FiCpu className="text-primary-400" /> Model Performance
          </h1>
          <p className="text-gray-400">
            Real-time evaluation charts, registry status updates, and model serving indicators.
          </p>
        </div>
        <button
          onClick={() => fetchDashboardData(true)}
          disabled={loading}
          className="px-4 py-2 bg-surface-800 border border-white/5 rounded-xl hover:bg-surface-700 text-gray-300 flex items-center gap-2 text-sm font-semibold transition-all duration-300 disabled:opacity-50"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {/* ─── Top Summary Cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        {/* Active Model */}
        <div className="glass-card p-5 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary-500/10 rounded-full blur-xl group-hover:bg-primary-500/20 transition-all"></div>
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">Active Model</p>
          <div>
            <h2 className="text-2xl font-display font-extrabold text-white truncate">{summary?.activeModelVersion || '—'}</h2>
            <p className="text-xs text-primary-400 font-mono mt-0.5 truncate">{summary?.architecture || '—'}</p>
          </div>
        </div>

        {/* Accuracy */}
        <div className="glass-card p-5 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-green-500/10 rounded-full blur-xl group-hover:bg-green-500/20 transition-all"></div>
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">Accuracy</p>
          <div>
            <h2 className="text-2xl font-display font-extrabold text-green-400">{pct(summary?.accuracy)}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Top-1 Evaluation</p>
          </div>
        </div>

        {/* F1 Score */}
        <div className="glass-card p-5 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all"></div>
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">F1 Score</p>
          <div>
            <h2 className="text-2xl font-display font-extrabold text-amber-400">{pct(summary?.f1Score)}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Weighted Metric</p>
          </div>
        </div>

        {/* Predictions Served */}
        <div className="glass-card p-5 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all"></div>
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">Predictions Served</p>
          <div>
            <h2 className="text-2xl font-display font-extrabold text-blue-400">{num(summary?.predictionsServed)}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Serving Cache Hits</p>
          </div>
        </div>

        {/* Model Size */}
        <div className="glass-card p-5 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-all"></div>
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">Model Size</p>
          <div>
            <h2 className="text-2xl font-display font-extrabold text-purple-400">{summary?.modelSizeMB != null
              ? `${summary.modelSizeMB} MB`
              : '—'}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Keras H5 File</p>
          </div>
        </div>

        {/* Training Duration */}
        <div className="glass-card p-5 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-cyan-500/10 rounded-full blur-xl group-hover:bg-cyan-500/20 transition-all"></div>
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">Training Duration</p>
          <div>
            <h2 className="text-2xl font-display font-extrabold text-cyan-400">{formatDuration(summary?.trainingDuration)}</h2>
            <p className="text-xs text-cyan-500 font-semibold flex items-center gap-1 mt-0.5">
              <FiZap className="w-3 h-3" /> {summary?.gpuUsed ? 'GPU Enabled' : 'CPU Only'}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Trendline Charts ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accuracy Trend */}
        <div className="glass-card p-6 flex flex-col min-h-[340px]">
          <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block animate-pulse"></span>
            Accuracy Trend (%)
          </h3>
          <div className="flex-1">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">No trend data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="version" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10 }} />
                  <YAxis
                    stroke="rgba(255,255,255,0.4)"
                    tick={{ fontSize: 10 }}
                    domain={['auto', 'auto']}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend formatter={(v) => <span className="text-gray-400 text-xs font-semibold">{v}</span>} />
                  <Line
                    type="monotone"
                    dataKey="Accuracy"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#050505', stroke: '#10b981', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Loss Trend */}
        <div className="glass-card p-6 flex flex-col min-h-[340px]">
          <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block animate-pulse"></span>
            Validation Loss Trend
          </h3>
          <div className="flex-1">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">No trend data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="version" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10 }} />
                  <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend formatter={(v) => <span className="text-gray-400 text-xs font-semibold">{v}</span>} />
                  <Line
                    type="monotone"
                    dataKey="Loss"
                    stroke="#ef4444"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#050505', stroke: '#ef4444', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* F1 Score Trend */}
        <div className="glass-card p-6 flex flex-col min-h-[340px]">
          <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block animate-pulse"></span>
            F1 Score Trend (%)
          </h3>
          <div className="flex-1">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">No trend data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="version" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10 }} />
                  <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10 }} domain={['auto', 'auto']} tickFormatter={(value) => `${value}%`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend formatter={(v) => <span className="text-gray-400 text-xs font-semibold">{v}</span>} />
                  <Line
                    type="monotone"
                    dataKey="F1 Score"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#050505', stroke: '#f59e0b', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Training Duration Trend */}
        <div className="glass-card p-6 flex flex-col min-h-[340px]">
          <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block animate-pulse"></span>
            Training Duration (s)
          </h3>
          <div className="flex-1">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">No trend data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="version" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10 }} />
                  <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend formatter={(v) => <span className="text-gray-400 text-xs font-semibold">{v}</span>} />
                  <Line
                    type="monotone"
                    dataKey="Duration (s)"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#06b6d4', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#050505', stroke: '#06b6d4', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ─── Model Registry Summary Table ─── */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <FiDatabase className="text-primary-400" /> Model Summary Registry
        </h2>
        <div className="overflow-x-auto">
          {trends.length === 0 ? (
            <p className="text-gray-500 text-center py-6">No model registry records found.</p>
          ) : (
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-white/5 text-xs text-gray-500 font-semibold uppercase">
                  <th className="pb-3">Version</th>
                  <th className="pb-3">Architecture</th>
                  <th className="pb-3">Accuracy</th>
                  <th className="pb-3">Precision</th>
                  <th className="pb-3">Recall</th>
                  <th className="pb-3">F1</th>
                  <th className="pb-3">Loss</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Duration</th>
                  <th className="pb-3">GPU</th>
                  <th className="pb-3">Size</th>
                  <th className="pb-3">Trained At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                {[...trends].reverse().map((model) => (
                  <tr key={model._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 font-bold text-white">{model.version}</td>
                    <td className="py-3.5 font-mono text-xs">{model.architecture || '—'}</td>
                    <td className="py-3.5 font-semibold text-green-400">{pct(model.accuracy)}</td>
                    <td className="py-3.5">{pct(model.precision)}</td>
                    <td className="py-3.5">{pct(model.recall)}</td>
                    <td className="py-3.5 text-amber-400">{pct(model.f1Score)}</td>
                    <td className="py-3.5 font-mono text-xs text-red-400">{model.loss != null
                      ? model.loss.toFixed(4)
                      : '—'}</td>
                    <td className="py-3.5">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold border ${getStatusBadgeClass(model.status)}`}>
                        {model.status}
                      </span>
                    </td>
                    <td className="py-3.5">{model.trainingDuration != null
                      ? formatDuration(model.trainingDuration)
                      : '—'}</td>
                    <td className="py-3.5 text-xs text-gray-400">{model.gpuUsed ? 'Yes' : 'No'}</td>
                    <td className="py-3.5">{model.modelSizeMB ? `${model.modelSizeMB} MB` : '—'}</td>
                    <td className="py-3.5 text-xs text-gray-500">{formatDate(model.trainedAt || model.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ─── Training Run Pipeline History Table ─── */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <FiClock className="text-cyan-400" /> Pipeline Run Execution History
        </h2>
        <div className="overflow-x-auto">
          {history.length === 0 ? (
            <p className="text-gray-500 text-center py-6">No training history runs recorded yet.</p>
          ) : (
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-white/5 text-xs text-gray-500 font-semibold uppercase">
                  <th className="pb-3">Version</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Accuracy</th>
                  <th className="pb-3">Loss</th>
                  <th className="pb-3">Epochs</th>
                  <th className="pb-3">Feedback Used</th>
                  <th className="pb-3">Duration</th>
                  <th className="pb-3">Completed Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                {history.map((run) => (
                  <tr key={run._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 font-bold text-white">{run.modelVersion || 'FAILED RUN'}</td>
                    <td className="py-3.5">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold border ${run.status === 'SUCCESS'
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                        {run.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-green-400 font-semibold">{pct(run.accuracy)}</td>
                    <td className="py-3.5 font-mono text-xs text-red-400">{run.loss ? run.loss.toFixed(4) : '—'}</td>
                    <td className="py-3.5">{num(run.epochs)}</td>
                    <td className="py-3.5">{run.feedbackUsed} images</td>
                    <td className="py-3.5">{formatDuration(run.durationSeconds)}</td>
                    <td className="py-3.5 text-xs text-gray-500">{formatDate(run.completedAt || run.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModelDashboard;
