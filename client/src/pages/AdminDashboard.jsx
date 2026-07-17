import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminDashboardAPI } from '../services/adminDashboardApi';
import { modelDashboardAPI } from '../services/modelDashboardApi';
import {
  FiCpu, FiClock, FiActivity, FiRefreshCw, FiPlay,
  FiArrowRight, FiShield, FiCheckCircle, FiXCircle,
  FiAlertTriangle, FiFileText, FiTrash, FiTrendingUp,
  FiSettings, FiArrowUpRight, FiCornerDownRight
} from 'react-icons/fi';
import {
  ResponsiveContainer, PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

// ─── Phase-5 Step-2: Model Comparison Section ───
import ModelComparison from '../components/ModelComparison';

const AdminDashboard = () => {
  const navigate = useNavigate();

  // ─── Component State ───
  const [data, setData] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [healthLoading, setHealthLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pipeline trigger status
  const [retrainingLoading, setRetrainingLoading] = useState(false);
  const [showConfirmRetrain, setShowConfirmRetrain] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState(null);

  // ─── Fetch data callback ───
  const fetchDashboardStats = useCallback(async (showToast = false) => {
    setLoading(true);
    setHealthLoading(true);
    setError(null);
    try {
      const [res, healthRes] = await Promise.all([
        adminDashboardAPI.getDashboardStats(),
        modelDashboardAPI.getHealth()
      ]);

      console.log("Dashboard Response:", res.data);

      setData(res.data.data);
      setHealth(healthRes.data.data);
      if (showToast) {
        toast.success('Dashboard metrics updated');
      }
    } catch (err) {
      console.error('Failed to load admin dashboard stats:', err);
      if (err.response?.status === 403) {
        setError('Admin access required.');
      } else {
        setError('Server error fetching dashboard statistics.');
      }
    } finally {
      setLoading(false);
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  // ─── Manual Retrain handler ───
  const handleManualRetrain = async () => {
    setShowConfirmRetrain(false);
    setRetrainingLoading(true);
    const loadingToastId = toast.loading('retraining process started. Spawning Python pipeline...');
    try {
      const res = await adminDashboardAPI.triggerRetraining();
      toast.success(res.data.message || 'Retraining finished successfully!', { id: loadingToastId });
      // Refresh statistics after successful retraining completes
      fetchDashboardStats();
    } catch (err) {
      console.error('Retraining execution failed:', err);
      const errMsg = err.response?.data?.error || err.response?.data?.message || 'Retraining pipeline failed.';
      toast.error(`Retraining failed: ${errMsg}`, { id: loadingToastId });
      fetchDashboardStats();
    } finally {
      setRetrainingLoading(false);
    }
  };

  // ─── Helpers ───
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ─── Loading state skeleton ───
  if (loading && !data) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="h-8 w-64 bg-surface-800 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-96 bg-surface-800 rounded animate-pulse"></div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-24 bg-surface-800 rounded animate-pulse"></div>
            <div className="h-10 w-32 bg-surface-800 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Card skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card p-6 h-32 animate-pulse flex flex-col justify-between">
              <div className="h-4 w-1/3 bg-surface-800 rounded"></div>
              <div className="h-8 w-2/3 bg-surface-800 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Error state ───
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="glass-card p-12 text-center max-w-md border-red-500/20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <FiAlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-display font-bold text-white mb-2">Access Denied / Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => fetchDashboardStats()}
            className="btn-primary w-full py-2.5 text-sm"
          >
            Retry Fetching Stats
          </button>
        </div>
      </div>
    );
  }

  // ─── Computed values (safe defaults) ───
  const training = data?.training || {};
  const rejectedFeedback = Math.max(0, (data?.totalFeedback || 0) - (data?.pendingFeedback || 0) - (data?.verifiedFeedback || 0));

  // ─── Recharts Data formatting ───
  const feedbackDistributionData = [
    { name: 'Pending', value: data?.pendingFeedback || 0, color: '#f59e0b' },
    { name: 'Verified', value: data?.verifiedFeedback || 0, color: '#10b981' },
    { name: 'Rejected', value: rejectedFeedback, color: '#ef4444' }
  ].filter(item => item.value > 0);

  const trainingSuccessData = [
    {
      name: 'Runs Summary',
      Success: training.successfulRuns || 0,
      Failed: training.failedRuns || 0
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* ─── Dashboard Header ─── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <FiCpu className="text-primary-400" /> MLOps Dashboard
          </h1>
          <p className="text-gray-400">
            Real-time pipeline metrics, automated retraining feedback loops, and deployment monitoring.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Refresh Button */}
          <button
            onClick={() => fetchDashboardStats(true)}
            disabled={loading}
            className="px-4 py-2 bg-surface-800 border border-white/5 rounded-xl hover:bg-surface-700 text-gray-300 flex items-center gap-2 text-sm font-semibold transition-all duration-300 disabled:opacity-50"
            title="Refresh dashboard stats"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {/* Go to feedback review page */}
          <button
            onClick={() => navigate('/admin/feedback')}
            className="px-4 py-2 bg-gradient-to-r from-primary-600/20 to-primary-500/10 border border-primary-500/20 rounded-xl hover:from-primary-600/30 text-primary-400 flex items-center gap-2 text-sm font-semibold transition-all duration-300"
          >
            <FiShield className="w-4 h-4" />
            Review Loop
          </button>

          {/* Manual Retrain trigger button */}
          <button
            onClick={() => setShowConfirmRetrain(true)}
            disabled={training.status === 'TRAINING' || retrainingLoading}
            className="px-4 py-2 bg-gradient-to-r from-secondary-600 to-secondary-500 text-white font-semibold rounded-xl shadow-lg shadow-secondary-500/20 hover:shadow-secondary-500/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center gap-2 text-sm transition-all duration-300"
          >
            <FiPlay className="w-4 h-4" />
            Manual Retrain
          </button>
        </div>
      </div>

      {/* ─── Phase-7 Step-2: System Health Alert Card ─── */}
      {health && (
        <div className={`glass-card p-6 border transition-all ${health.overallHealth === 'CRITICAL'
          ? 'border-red-500/25 bg-red-500/[0.02]'
          : health.overallHealth === 'WARNING'
            ? 'border-amber-500/25 bg-amber-500/[0.02]'
            : 'border-green-500/25 bg-green-500/[0.02]'
          }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${health.overallHealth === 'CRITICAL'
                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                : health.overallHealth === 'WARNING'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-green-500/10 text-green-400 border-green-500/20'
                }`}>
                {health.overallHealth === 'CRITICAL' ? (
                  <FiXCircle className="w-5 h-5" />
                ) : health.overallHealth === 'WARNING' ? (
                  <FiAlertTriangle className="w-5 h-5" />
                ) : (
                  <FiCheckCircle className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white">System Serving Status</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border uppercase ${health.overallHealth === 'CRITICAL'
                    ? 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse'
                    : health.overallHealth === 'WARNING'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-green-500/10 text-green-400 border-green-500/20'
                    }`}>
                    {health.overallHealth}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Active serving layer and deployment health checks. Last checked: {formatDate(new Date())}
                </p>
              </div>
            </div>

            <div className="flex gap-4 text-xs font-mono text-gray-500">
              <div>
                Registry: <span className={health.registryConsistency ? 'text-green-400' : 'text-red-400'}>
                  {health.registryConsistency ? 'CONSISTENT' : 'INCONSISTENT'}
                </span>
              </div>
              <div>
                Cache: <span className={health.cacheLoaded ? 'text-green-400' : 'text-red-400'}>
                  {health.modelServiceStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Warning List if present */}
          {health.warnings && health.warnings.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
              <p className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                <FiAlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Active Warnings ({health.warnings.length})
              </p>
              <ul className="list-inside space-y-1 text-xs text-gray-400 pl-1">
                {health.warnings.map((warn, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span>{warn}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ─── Metric Cards Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Active Model Version */}
        <div className="glass-card p-6 flex items-center gap-5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary-500/10 rounded-full blur-2xl group-hover:bg-primary-500/20 transition-all"></div>
          <div className="w-14 h-14 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-400 text-2xl font-bold border border-primary-500/20">
            <FiCpu className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-0.5">Active Model</p>
            <h2 className="text-3xl font-display font-extrabold text-white">{data.currentModelVersion}</h2>
            <div className="flex items-center gap-3 mt-1">
              {data.latestModelAccuracy != null ? (
                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${data.latestModelAccuracy >= 0.9
                  ? 'bg-green-500/10 text-green-400 border-green-500/20'
                  : data.latestModelAccuracy >= 0.7
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                  {(data.latestModelAccuracy * 100).toFixed(1)}% Accuracy
                </span>
              ) : (
                <span className="text-xs text-gray-500">Awaiting training metrics</span>
              )}
              <span className="text-primary-400 font-bold text-xs">Active</span>
            </div>
          </div>
        </div>

        {/* Card 2: Training Pipeline Status */}
        <div className="glass-card p-6 flex items-center gap-5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-secondary-500/10 rounded-full blur-2xl group-hover:bg-secondary-500/20 transition-all"></div>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-colors ${training.status === 'TRAINING'
            ? 'bg-secondary-500/10 border-secondary-500/20 animate-pulse text-secondary-400'
            : 'bg-surface-800 border-white/5 text-gray-400'
            }`}>
            <FiActivity className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-0.5">Pipeline Lock</p>
            <h2 className={`text-2xl font-display font-extrabold ${training.status === 'TRAINING' ? 'text-secondary-400' : 'text-white'
              }`}>
              {training.status === 'TRAINING' ? 'TRAINING' : 'IDLE'}
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {training.status === 'TRAINING' ? 'Retraining model in background...' : 'No lock detected. Ready to train.'}
            </p>
          </div>
        </div>

        {/* Card 3: Pending Feedback Loop */}
        <div className="glass-card p-6 flex items-center gap-5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
            <FiClock className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-0.5">Pending Feedback</p>
            <h2 className="text-3xl font-display font-extrabold text-white">{data.pendingFeedback}</h2>
            <p className="text-xs text-gray-400 mt-1">
              Waiting for admin verification.
            </p>
          </div>
        </div>

        {/* Card 4: Verified Feedback Loop */}
        <div className="glass-card p-6 flex items-center gap-5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-all"></div>
          <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-400 border border-green-500/20">
            <FiCheckCircle className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-0.5">Verified Feedback</p>
            <h2 className="text-3xl font-display font-extrabold text-white">{data.verifiedFeedback}</h2>
            <p className="text-xs text-gray-400 mt-1">
              Copied to dataset builder directory.
            </p>
          </div>
        </div>

        {/* Card 5: Rejected Feedback Loop */}
        <div className="glass-card p-6 flex items-center gap-5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all"></div>
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20">
            <FiXCircle className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-0.5">Rejected Feedback</p>
            <h2 className="text-3xl font-display font-extrabold text-white">{rejectedFeedback}</h2>
            <p className="text-xs text-gray-400 mt-1">
              Runs deleted / model validation rejects.
            </p>
          </div>
        </div>

        {/* Card 6: Last Retraining Completion */}
        <div className="glass-card p-6 flex items-center gap-5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
            <FiClock className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-0.5">Last Pipeline run</p>
            <h2 className="text-sm font-display font-bold text-white truncate max-w-[200px]" title={formatDate(training.lastTraining)}>
              {training.lastTraining ? formatDate(training.lastTraining) : 'Never Run'}
            </h2>
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              Total runs completed: <span className="text-white font-bold">{training.totalRuns || 0}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ─── Phase-5 Step-1: Model Performance Metrics Banner ─── */}
      {data.latestModelMetrics && data.latestModelMetrics.accuracy != null && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
            <FiTrendingUp className="text-primary-400 w-4 h-4" /> Model Performance Metrics
            <span className="text-xs text-gray-600 font-normal ml-1">({data.currentModelVersion})</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[
              { label: 'Accuracy', value: data.latestModelMetrics.accuracy, pct: true, color: 'text-green-400' },
              { label: 'Precision', value: data.latestModelMetrics.precision, pct: true, color: 'text-blue-400' },
              { label: 'Recall', value: data.latestModelMetrics.recall, pct: true, color: 'text-purple-400' },
              { label: 'F1 Score', value: data.latestModelMetrics.f1Score, pct: true, color: 'text-amber-400' },
              { label: 'Val Loss', value: data.latestModelMetrics.loss, pct: false, color: 'text-red-400' },
              { label: 'Epochs', value: data.latestModelMetrics.epochs, pct: false, color: 'text-cyan-400' },
              {
                label: 'Dataset', value: data.latestModelMetrics.trainingImages != null && data.latestModelMetrics.validationImages != null
                  ? `${data.latestModelMetrics.trainingImages + data.latestModelMetrics.validationImages}`
                  : null, pct: false, color: 'text-gray-300', suffix: ' imgs'
              },
            ].map((metric) => (
              <div key={metric.label} className="text-center">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">{metric.label}</p>
                <p className={`text-lg font-display font-extrabold ${metric.color}`}>
                  {metric.value != null
                    ? metric.pct
                      ? `${(metric.value * 100).toFixed(1)}%`
                      : `${metric.value}${metric.suffix || ''}`
                    : '—'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Charts section ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Feedback Distribution */}
        <div className="glass-card p-6 flex flex-col min-h-[380px]">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <FiTrendingUp className="text-primary-400" /> Active Learning Feedback Distribution
          </h2>
          <div className="flex-1 flex justify-center items-center">
            {feedbackDistributionData.length === 0 ? (
              <p className="text-gray-500">No feedback submissions on record yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={feedbackDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {feedbackDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-gray-400 text-sm font-medium">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Retraining Success rate */}
        <div className="glass-card p-6 flex flex-col min-h-[380px]">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <FiActivity className="text-secondary-400" /> Retraining Runs Success vs Failure
          </h2>
          <div className="flex-1">
            {(training.totalRuns || 0) === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500">No training runs on record yet.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={trainingSuccessData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" />
                  <YAxis stroke="rgba(255,255,255,0.4)" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                  <Legend />
                  <Bar dataKey="Success" fill="#10b981" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="Failed" fill="#ef4444" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ─── Recent Feedback Table ─── */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <FiShield className="text-primary-400" /> Recent Active Learning Feedback
          </h2>
          <button
            onClick={() => navigate('/admin/feedback')}
            className="text-xs font-semibold text-primary-400 flex items-center gap-1.5 hover:underline"
          >
            Review all pending <FiArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="overflow-x-auto">
          {(data?.recentFeedback?.length || 0) === 0 ? (
            <p className="text-gray-500 text-center py-6">No recent feedback records.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-xs text-gray-500 font-semibold uppercase">
                  <th className="pb-3">User</th>
                  <th className="pb-3">Predicted</th>
                  <th className="pb-3">Actual</th>
                  <th className="pb-3">Confidence</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                {(data?.recentFeedback || []).map((fb) => (
                  <tr key={fb._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5">
                      <p className="font-semibold text-white">{fb.userId?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{fb.userId?.email || 'N/A'}</p>
                    </td>
                    <td className="py-3.5 text-gray-400">{fb.predictedDisease}</td>
                    <td className="py-3.5 font-medium text-primary-300">{fb.actualDisease}</td>
                    <td className="py-3.5">{fb.confidence}%</td>
                    <td className="py-3.5">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${fb.verified
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                        {fb.verified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3.5 text-xs text-gray-500">{formatDate(fb.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ─── Training Runs Timeline Table ─── */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <FiClock className="text-purple-400" /> Pipeline Retraining History
        </h2>
        <div className="overflow-x-auto">
          {(data?.trainingHistoryList?.length || 0) === 0 ? (
            <p className="text-gray-500 text-center py-6">No retraining history runs on file.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-xs text-gray-500 font-semibold uppercase">
                  <th className="pb-3">Model Version</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Feedback Used</th>
                  <th className="pb-3">Duration</th>
                  <th className="pb-3">Completed At</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                {(data?.trainingHistoryList || []).map((run) => (
                  <tr key={run._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 font-bold text-white">{run.modelVersion || 'FAILED RUN'}</td>
                    <td className="py-3.5">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${run.status === 'SUCCESS'
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                        {run.status}
                      </span>
                    </td>
                    <td className="py-3.5 font-semibold">{run.feedbackUsed} images</td>
                    <td className="py-3.5 text-gray-400">{run.durationSeconds}s</td>
                    <td className="py-3.5 text-xs text-gray-500">{formatDate(run.completedAt || run.createdAt)}</td>
                    <td className="py-3.5 text-right">
                      {run.logs && (
                        <button
                          onClick={() => setSelectedLogs(run.logs)}
                          className="px-3 py-1.5 bg-surface-800 hover:bg-surface-700 text-gray-300 text-xs rounded-lg border border-white/5 font-semibold flex items-center gap-1.5 ml-auto transition-colors"
                        >
                          <FiFileText className="w-3.5 h-3.5" /> Show Logs
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ─── Phase-5 Step-2: Model Comparison Section ─── */}
      {/* Phase-5 Step-5: onModelActivated refreshes dashboard cards after rollback */}
      <ModelComparison onModelActivated={() => fetchDashboardStats()} />

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/*  CONFIRM RETRAIN MODAL                                                */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {showConfirmRetrain && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowConfirmRetrain(false)}
        >
          <div
            className="glass-card p-8 max-w-sm w-full mx-4 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-secondary-500/10 flex items-center justify-center">
              <FiPlay className="w-7 h-7 text-secondary-400" />
            </div>

            <h3 className="text-lg font-display font-bold text-white text-center mb-2">
              Trigger Model Retraining?
            </h3>
            <p className="text-gray-400 text-sm text-center mb-6">
              This will execute train_disease_model.py. Note that training may take a few minutes depending on hardware configuration.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmRetrain(false)}
                className="btn-secondary flex-1 py-2.5 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleManualRetrain}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 bg-gradient-to-r from-secondary-600 to-secondary-500 text-white shadow-lg hover:shadow-xl shadow-secondary-500/25 hover:shadow-secondary-500/30"
              >
                Start Training
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/*  PIPELINE RUN LOGS PREVIEW MODAL                                      */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {selectedLogs && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedLogs(null)}
        >
          <div
            className="glass-card max-w-4xl w-full mx-4 overflow-hidden flex flex-col max-h-[85vh] animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-surface-900/50">
              <div>
                <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                  <FiFileText className="text-primary-400" /> Pipeline Execution Logs
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Full standard stdout and stderr output.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedLogs);
                    toast.success('Logs copied to clipboard');
                  }}
                  className="px-3 py-1.5 bg-surface-800 hover:bg-surface-700 text-gray-300 text-xs rounded-lg border border-white/5 font-semibold transition-colors"
                >
                  Copy Logs
                </button>
                <button
                  onClick={() => setSelectedLogs(null)}
                  className="px-3 py-1.5 bg-red-500/10 text-red-400 text-xs rounded-lg hover:bg-red-500/20 font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Terminal logs container */}
            <div className="p-6 bg-black font-mono text-xs text-gray-300 overflow-y-auto flex-1 select-text custom-scrollbar max-h-[60vh] leading-relaxed whitespace-pre-wrap">
              {selectedLogs}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
