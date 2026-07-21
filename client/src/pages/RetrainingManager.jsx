import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiRefreshCw, FiRepeat, FiCheckCircle, FiAlertTriangle,
  FiAlertCircle, FiClock, FiCpu, FiPlay, FiPause, FiTrash2, FiPlus,
  FiFileText, FiLayers, FiX, FiCheck, FiPieChart, FiTrendingUp, FiActivity
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import retrainingSchedulerApi from '../services/retrainingSchedulerApi';

// ─── Constants ──────────────────────────────────────────────────────────────
const TRIGGER_TYPES = [
  'Weekly',
  'Daily',
  'Monthly',
  'Manual',
  'Drift Detection',
  'Confidence Drift',
  'Health Threshold',
  'Retraining Recommendation'
];

const ALGORITHM_OPTIONS = ['LightGBM', 'XGBoost', 'RandomForest', 'NeuralNetwork', 'Ensemble'];

// ─── Skeleton Components ────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="glass-card p-6 animate-pulse">
    <div className="h-3 w-24 bg-white/10 rounded mb-3"></div>
    <div className="h-7 w-16 bg-white/10 rounded"></div>
  </div>
);

const SkeletonTable = () => (
  <div className="glass-card p-6 animate-pulse">
    <div className="h-4 w-48 bg-white/10 rounded mb-4"></div>
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-12 bg-white/5 rounded-xl"></div>
      ))}
    </div>
  </div>
);

// ─── Custom Tooltip ─────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, suffix = '' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-900/90 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-md font-mono text-xs">
        {label && <p className="text-gray-400 font-semibold mb-1">{label}</p>}
        {payload.map((p, idx) => (
          <p key={idx} className="font-bold" style={{ color: p.color || p.fill }}>
            {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}{suffix}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Status Pill Component ──────────────────────────────────────────────────
const StatusPill = ({ status }) => {
  const styles = {
    Active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Running: 'bg-blue-500/15 text-blue-400 border-blue-500/30 animate-pulse',
    Paused: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    Success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Failed: 'bg-red-500/15 text-red-400 border-red-500/30'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-mono border font-bold ${styles[status] || 'bg-gray-500/15 text-gray-400'}`}>
      {status === 'Active' || status === 'Success' ? <FiCheckCircle className="w-3 h-3 text-emerald-400" /> : null}
      {status === 'Paused' ? <FiPause className="w-3 h-3 text-amber-400" /> : null}
      {status === 'Failed' ? <FiAlertCircle className="w-3 h-3 text-red-400" /> : null}
      {status}
    </span>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
const RetrainingManager = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [summary, setSummary] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs' | 'history' | 'failed'

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newJobData, setNewJobData] = useState({
    jobName: '',
    cronExpression: '0 2 * * 0',
    frequency: 'Weekly',
    dataset: 'ds-v1.4',
    modelVersion: 'v1.2-candidate',
    algorithm: 'LightGBM',
    triggerType: 'Weekly',
    notes: ''
  });

  const [actionLoading, setActionLoading] = useState(false);

  // Fetch telemetry
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [sumRes, jobsRes, histRes] = await Promise.all([
        retrainingSchedulerApi.getSummary(),
        retrainingSchedulerApi.getJobs(),
        retrainingSchedulerApi.getHistory()
      ]);

      if (sumRes.data?.success) setSummary(sumRes.data.data);
      if (jobsRes.data?.success) setJobs(jobsRes.data.data.jobs || []);
      if (histRes.data?.success) setHistory(histRes.data.data.history || []);

      if (!silent) toast.success('Scheduled Retraining telemetry updated');
    } catch (err) {
      console.error('[Retraining Manager] Fetch Error:', err);
      const msg = err.response?.data?.message || 'Failed to load retraining manager telemetry';
      setError(msg);
      if (!silent) toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create Job Handler
  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!newJobData.jobName) {
      toast.error('Job name is required');
      return;
    }
    setActionLoading(true);
    try {
      const res = await retrainingSchedulerApi.createJob(newJobData);
      if (res.data?.success) {
        toast.success(`Job ${newJobData.jobName} created successfully!`);
        setCreateModalOpen(false);
        setNewJobData({
          jobName: '',
          cronExpression: '0 2 * * 0',
          frequency: 'Weekly',
          dataset: 'ds-v1.4',
          modelVersion: 'v1.2-candidate',
          algorithm: 'LightGBM',
          triggerType: 'Weekly',
          notes: ''
        });
        await fetchData(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create job');
    } finally {
      setActionLoading(false);
    }
  };

  // Run Now Trigger
  const handleRunNow = async (jobId) => {
    const toastId = toast.loading(`Triggering execution for ${jobId}...`);
    try {
      const res = await retrainingSchedulerApi.triggerRunNow(jobId);
      if (res.data?.success) {
        toast.success(`Job ${jobId} triggered successfully!`, { id: toastId });
        await fetchData(true);
      }
    } catch (err) {
      toast.error('Failed to trigger job execution', { id: toastId });
    }
  };

  // Pause Job
  const handlePauseJob = async (jobId) => {
    try {
      const res = await retrainingSchedulerApi.pauseJob(jobId);
      if (res.data?.success) {
        toast.success(`Job ${jobId} paused`);
        await fetchData(true);
      }
    } catch (err) {
      toast.error('Failed to pause job');
    }
  };

  // Resume Job
  const handleResumeJob = async (jobId) => {
    try {
      const res = await retrainingSchedulerApi.resumeJob(jobId);
      if (res.data?.success) {
        toast.success(`Job ${jobId} resumed`);
        await fetchData(true);
      }
    } catch (err) {
      toast.error('Failed to resume job');
    }
  };

  // Delete Job
  const handleDeleteJob = async (jobId) => {
    if (!window.confirm(`Are you sure you want to delete job ${jobId}?`)) return;
    try {
      const res = await retrainingSchedulerApi.deleteJob(jobId);
      if (res.data?.success) {
        toast.success(`Job ${jobId} deleted`);
        await fetchData(true);
      }
    } catch (err) {
      toast.error('Failed to delete job');
    }
  };

  // ─── Error State ──────────────────────────────────────────────────────────
  if (error && !summary) {
    return (
      <div className="space-y-8 animate-fade-in pb-12">
        <div>
          <button onClick={() => navigate('/admin/operations')} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors mb-2">
            <FiArrowLeft className="w-3.5 h-3.5" /> Back to AI Operations
          </button>
          <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <FiRepeat className="text-primary-400" /> Scheduled Retraining Manager
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
        <SkeletonTable />
      </div>
    );
  }

  const s = summary || {};
  const failedHistory = history.filter(h => h.status === 'Failed');

  // Trigger Type Distribution Pie Data
  const triggerCounts = {};
  jobs.forEach(j => {
    triggerCounts[j.triggerType] = (triggerCounts[j.triggerType] || 0) + 1;
  });
  const triggerPieData = Object.entries(triggerCounts).map(([name, value]) => ({ name, value }));

  // Execution History Line Data
  const executionTimelineData = [...history].reverse().map(h => ({
    date: new Date(h.triggeredAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    Accuracy: parseFloat((parseFloat(h.accuracy || 95.5)).toFixed(1))
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
            <FiRepeat className="text-primary-400" /> Enterprise Scheduled Retraining Manager
          </h1>
          <p className="text-gray-400 text-sm">
            Automated model retraining scheduler — CRON schedules, drift triggers, run telemetry, and execution logs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-primary-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-primary-400 flex items-center gap-2 transition-all"
          >
            <FiPlus className="w-4 h-4" /> Create Retraining Job
          </button>
          <button onClick={() => fetchData(false)} disabled={loading}
            className="px-4 py-2 bg-surface-800 border border-white/5 rounded-xl hover:bg-surface-700 text-gray-300 flex items-center gap-2 text-xs font-semibold transition-all duration-300 disabled:opacity-50">
            <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* ─── 6 Summary Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Scheduled Jobs */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center border border-primary-500/20 shrink-0">
            <FiRepeat className="text-primary-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Scheduled</p>
            <h3 className="text-xl font-bold text-primary-400 mt-0.5 font-mono">{s.scheduledJobs || 0}</h3>
          </div>
        </div>

        {/* Running Jobs */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
            <FiActivity className="text-blue-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Running</p>
            <h3 className="text-xl font-bold text-blue-400 mt-0.5 font-mono">{s.runningJobs || 0}</h3>
          </div>
        </div>

        {/* Paused Jobs */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
            <FiPause className="text-amber-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Paused</p>
            <h3 className="text-xl font-bold text-amber-400 mt-0.5 font-mono">{s.pausedJobs || 0}</h3>
          </div>
        </div>

        {/* Completed Executions */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
            <FiCheckCircle className="text-emerald-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Completed</p>
            <h3 className="text-xl font-bold text-emerald-400 mt-0.5 font-mono">{s.completedJobs || 0}</h3>
          </div>
        </div>

        {/* Average Runtime */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shrink-0">
            <FiClock className="text-purple-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Avg Runtime</p>
            <h3 className="text-sm font-bold text-purple-400 mt-1 font-mono truncate">{s.averageRuntime || '35 mins'}</h3>
          </div>
        </div>

        {/* Success Rate */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shrink-0">
            <FiTrendingUp className="text-cyan-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Success Rate</p>
            <h3 className="text-xl font-bold text-cyan-400 mt-0.5 font-mono">{s.successRate || '100%'}</h3>
          </div>
        </div>
      </div>

      {/* ─── Charts Row: Execution Timeline & Trigger Distribution ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Execution Timeline */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiActivity className="text-primary-400" /> Historical Execution Accuracy Trajectory
          </h3>
          <div className="h-72 w-full">
            {executionTimelineData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">No execution history</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={executionTimelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="execGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[90, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip suffix="%" />} />
                  <Area type="monotone" dataKey="Accuracy" stroke="#10b981" fill="url(#execGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Trigger Distribution */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiPieChart className="text-purple-400" /> Job Trigger Type Distribution
          </h3>
          <div className="h-72 w-full flex items-center justify-center">
            {triggerPieData.length === 0 ? (
              <div className="text-gray-500 text-sm">No trigger data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={triggerPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {triggerPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ─── Tab Navigation (Scheduled Jobs / History / Failed Jobs) ─────────── */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-6">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'jobs' ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'text-gray-400 hover:text-white'}`}
          >
            <FiRepeat className="w-3.5 h-3.5" /> Scheduled Jobs ({jobs.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'text-gray-400 hover:text-white'}`}
          >
            <FiClock className="w-3.5 h-3.5" /> Execution History ({history.length})
          </button>
          <button
            onClick={() => setActiveTab('failed')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'failed' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-gray-400 hover:text-white'}`}
          >
            <FiAlertCircle className="w-3.5 h-3.5" /> Failed Jobs ({failedHistory.length})
          </button>
        </div>

        {/* ─── TAB 1: Scheduled Jobs Table ───────────────────────────────────── */}
        {activeTab === 'jobs' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Job ID & Name</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Cron / Frequency</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Trigger Type</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Model / Algo</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-center">Status</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-center">Next Run</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j, idx) => (
                  <tr key={j.jobId} className={`border-b border-white/5 transition-colors hover:bg-white/[0.02] ${idx % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-xs text-primary-400 block">{j.jobId}</span>
                      <span className="text-sm font-semibold text-white">{j.jobName}</span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs">
                      <span className="px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/5 block w-fit mb-1">{j.cronExpression}</span>
                      <span className="text-gray-500 text-[10px]">{j.frequency}</span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-300">
                      <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold">
                        {j.triggerType}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-mono">
                      <span className="text-emerald-400 font-bold block">{j.modelVersion}</span>
                      <span className="text-gray-400">{j.algorithm}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <StatusPill status={j.status} />
                    </td>
                    <td className="px-4 py-3.5 text-center text-xs text-gray-400 font-mono">
                      {j.nextRun ? new Date(j.nextRun).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleRunNow(j.jobId)}
                          className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold hover:bg-emerald-500/30 transition-all flex items-center gap-1"
                          title="Run Immediately"
                        >
                          <FiPlay className="w-3 h-3" /> Run Now
                        </button>
                        {j.status === 'Active' ? (
                          <button
                            onClick={() => handlePauseJob(j.jobId)}
                            className="p-1.5 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/30 transition-all"
                            title="Pause Job"
                          >
                            <FiPause className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleResumeJob(j.jobId)}
                            className="p-1.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30 transition-all"
                            title="Resume Job"
                          >
                            <FiPlay className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteJob(j.jobId)}
                          className="p-1.5 bg-red-500/15 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all"
                          title="Delete Job"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── TAB 2: Execution History Log ─────────────────────────────────── */}
        {activeTab === 'history' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Execution ID</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Job Name</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Trigger</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-right">Duration</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-right">Accuracy</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-center">Status</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-center">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, idx) => (
                  <tr key={h.executionId + idx} className={`border-b border-white/5 transition-colors hover:bg-white/[0.02] ${idx % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                    <td className="px-4 py-3.5 font-mono font-bold text-xs text-primary-400">
                      {h.executionId}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-white font-semibold">
                      {h.jobName}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-400">
                      {h.triggerType}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-xs text-purple-400">
                      {h.duration}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-xs font-bold text-emerald-400">
                      {h.accuracy}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <StatusPill status={h.status} />
                    </td>
                    <td className="px-4 py-3.5 text-center text-xs text-gray-400 font-mono">
                      {new Date(h.triggeredAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── TAB 3: Failed Jobs Table ────────────────────────────────────── */}
        {activeTab === 'failed' && (
          <div className="overflow-x-auto">
            {failedHistory.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-sm">No failed execution records</div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Execution ID</th>
                    <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Job Name</th>
                    <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Failure Reason</th>
                    <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-center">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {failedHistory.map((f, idx) => (
                    <tr key={f.executionId + idx} className="border-b border-white/5 bg-red-500/[0.02]">
                      <td className="px-4 py-3.5 font-mono font-bold text-xs text-red-400">
                        {f.executionId}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-white font-semibold">
                        {f.jobName}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-red-300">
                        {f.notes || 'Training execution failed'}
                      </td>
                      <td className="px-4 py-3.5 text-center text-xs text-gray-400 font-mono">
                        {new Date(f.triggeredAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ─── CREATE JOB MODAL ────────────────────────────────────────────────── */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-surface-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 border-primary-500/30 animate-fade-in">
            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FiPlus className="text-primary-400" /> Schedule Retraining Job
              </h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-gray-400 hover:text-white"><FiX className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-gray-400 block mb-1">Job Name</label>
                <input
                  type="text"
                  required
                  value={newJobData.jobName}
                  onChange={(e) => setNewJobData({ ...newJobData, jobName: e.target.value })}
                  placeholder="e.g. Weekly Production Retraining"
                  className="w-full bg-surface-800 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 block mb-1">Trigger Type</label>
                  <select
                    value={newJobData.triggerType}
                    onChange={(e) => setNewJobData({ ...newJobData, triggerType: e.target.value })}
                    className="w-full bg-surface-800 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    {TRIGGER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Frequency</label>
                  <select
                    value={newJobData.frequency}
                    onChange={(e) => setNewJobData({ ...newJobData, frequency: e.target.value })}
                    className="w-full bg-surface-800 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="Weekly">Weekly</option>
                    <option value="Daily">Daily</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Event-Driven">Event-Driven</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-gray-400 block mb-1">CRON Expression</label>
                <input
                  type="text"
                  value={newJobData.cronExpression}
                  onChange={(e) => setNewJobData({ ...newJobData, cronExpression: e.target.value })}
                  placeholder="0 2 * * 0"
                  className="w-full bg-surface-800 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 block mb-1">Algorithm</label>
                  <select
                    value={newJobData.algorithm}
                    onChange={(e) => setNewJobData({ ...newJobData, algorithm: e.target.value })}
                    className="w-full bg-surface-800 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    {ALGORITHM_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Model Version</label>
                  <input
                    type="text"
                    value={newJobData.modelVersion}
                    onChange={(e) => setNewJobData({ ...newJobData, modelVersion: e.target.value })}
                    className="w-full bg-surface-800 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  value={newJobData.notes}
                  onChange={(e) => setNewJobData({ ...newJobData, notes: e.target.value })}
                  className="w-full bg-surface-800 border border-white/10 rounded-xl p-2 text-white focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setCreateModalOpen(false)} className="px-4 py-2 bg-surface-800 text-gray-400 rounded-xl text-xs font-bold hover:text-white">Cancel</button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-primary-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-primary-400 transition-all flex items-center gap-2"
                >
                  {actionLoading ? <FiRefreshCw className="animate-spin w-4 h-4" /> : <FiPlus className="w-4 h-4" />} Create Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetrainingManager;
