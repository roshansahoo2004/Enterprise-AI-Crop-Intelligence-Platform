import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiRefreshCw, FiGitBranch, FiCheckCircle, FiAlertCircle,
  FiClock, FiPlay, FiXCircle, FiRotateCcw, FiFileText, FiPlus,
  FiLayers, FiX, FiCheck, FiPieChart, FiActivity, FiSend, FiShield
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import pipelineWorkflowApi from '../services/pipelineWorkflowApi';

// ─── Constants ──────────────────────────────────────────────────────────────
const STAGES_CONFIG = [
  '1. Dataset Validation',
  '2. Data Preprocessing',
  '3. Model Training',
  '4. Evaluation',
  '5. Explainability Validation',
  '6. Deployment Approval',
  '7. Production Deployment',
  '8. Monitoring Activation'
];

const TRIGGER_TYPES = [
  'Manual',
  'Schedule',
  'Data Drift',
  'Feature Drift',
  'Confidence Drift',
  'Health Alert',
  'Performance Drop',
  'Monitoring Alert'
];

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
    Completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Running: 'bg-blue-500/15 text-blue-400 border-blue-500/30 animate-pulse',
    Queued: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    Failed: 'bg-red-500/15 text-red-400 border-red-500/30',
    Cancelled: 'bg-gray-500/15 text-gray-400 border-gray-500/30'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-mono border font-bold ${styles[status] || 'bg-gray-500/15 text-gray-400'}`}>
      {status === 'Completed' ? <FiCheckCircle className="w-3 h-3 text-emerald-400" /> : null}
      {status === 'Failed' ? <FiAlertCircle className="w-3 h-3 text-red-400" /> : null}
      {status === 'Running' ? <FiActivity className="w-3 h-3 text-blue-400" /> : null}
      {status}
    </span>
  );
};

// ─── Vertical Execution Timeline Visualizer ─────────────────────────────────
const TimelineVisualizer = () => {
  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
        <FiGitBranch className="text-primary-400" /> 8-Stage Automated ML Orchestration Funnel
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 relative">
        {STAGES_CONFIG.map((stageName, idx) => (
          <div key={stageName} className="glass-card-hover p-3 rounded-xl border border-white/5 relative flex flex-col items-center text-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary-500/20 text-primary-400 border border-primary-500/30 flex items-center justify-center font-mono font-bold text-xs">
              {idx + 1}
            </div>
            <span className="text-[11px] font-bold text-white leading-tight">{stageName.replace(/^\d+\.\s*/, '')}</span>
            {idx < 7 && (
              <span className="hidden lg:block absolute -right-2.5 top-1/2 -translate-y-1/2 text-gray-600 font-mono text-xs z-10">↓</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
const PipelineOrchestrator = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [summary, setSummary] = useState(null);
  const [workflows, setWorkflows] = useState([]);
  const [history, setHistory] = useState([]);

  // Modals state
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [newWorkflowData, setNewWorkflowData] = useState({
    workflowName: '',
    triggerType: 'Manual',
    notes: ''
  });

  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [logsData, setLogsData] = useState(null);

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);

  // Fetch telemetry
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [sumRes, wfRes, histRes] = await Promise.all([
        pipelineWorkflowApi.getSummary(),
        pipelineWorkflowApi.getWorkflows(),
        pipelineWorkflowApi.getHistory()
      ]);

      if (sumRes.data?.success) setSummary(sumRes.data.data);
      if (wfRes.data?.success) setWorkflows(wfRes.data.data.workflows || []);
      if (histRes.data?.success) setHistory(histRes.data.data.history || []);

      if (!silent) toast.success('Pipeline orchestrator updated');
    } catch (err) {
      console.error('[Pipeline Orchestrator] Fetch Error:', err);
      const msg = err.response?.data?.message || 'Failed to load pipeline orchestrator telemetry';
      setError(msg);
      if (!silent) toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Start Pipeline Handler
  const handleStartWorkflow = async (e) => {
    e.preventDefault();
    if (!newWorkflowData.workflowName) {
      toast.error('Workflow name is required');
      return;
    }
    setActionLoading(true);
    try {
      const res = await pipelineWorkflowApi.startWorkflow(newWorkflowData);
      if (res.data?.success) {
        toast.success(`Pipeline ${newWorkflowData.workflowName} started!`);
        setStartModalOpen(false);
        setNewWorkflowData({ workflowName: '', triggerType: 'Manual', notes: '' });
        await fetchData(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start pipeline');
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel Workflow
  const handleCancelWorkflow = async (workflowId) => {
    try {
      const res = await pipelineWorkflowApi.cancelWorkflow(workflowId);
      if (res.data?.success) {
        toast.success(`Pipeline ${workflowId} cancelled`);
        await fetchData(true);
      }
    } catch (err) {
      toast.error('Failed to cancel pipeline');
    }
  };

  // Retry Workflow
  const handleRetryWorkflow = async (workflowId) => {
    const toastId = toast.loading(`Retrying pipeline ${workflowId}...`);
    try {
      const res = await pipelineWorkflowApi.retryWorkflow(workflowId);
      if (res.data?.success) {
        toast.success(`Pipeline ${workflowId} restarted!`, { id: toastId });
        await fetchData(true);
      }
    } catch (err) {
      toast.error('Failed to retry pipeline', { id: toastId });
    }
  };

  // Open Logs Viewer Modal
  const handleOpenLogs = async (workflowId) => {
    try {
      const res = await pipelineWorkflowApi.getLogs(workflowId);
      if (res.data?.success) {
        setLogsData(res.data.data);
        setLogsModalOpen(true);
      }
    } catch (err) {
      toast.error('Failed to fetch pipeline execution logs');
    }
  };

  // Open Details Modal
  const handleOpenDetails = (wf) => {
    setSelectedWorkflow(wf);
    setDetailsModalOpen(true);
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
            <FiGitBranch className="text-primary-400" /> Enterprise Automated ML Pipeline Orchestrator
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

  // Trigger Type Distribution Pie Data
  const triggerCounts = {};
  workflows.forEach(w => {
    triggerCounts[w.triggerType] = (triggerCounts[w.triggerType] || 0) + 1;
  });
  const triggerPieData = Object.entries(triggerCounts).map(([name, value]) => ({ name, value }));

  // Stage Completion Funnel Data
  const stageFunnelData = STAGES_CONFIG.map((stageName, idx) => {
    const count = workflows.filter(w => (w.stages || [])[idx]?.status === 'Completed').length;
    return { name: stageName.replace(/^\d+\.\s*/, ''), Completed: count };
  });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button onClick={() => navigate('/admin/operations')} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors mb-2">
            <FiArrowLeft className="w-3.5 h-3.5" /> Back to AI Operations
          </button>
          <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <FiGitBranch className="text-primary-400" /> Enterprise Automated ML Pipeline Orchestrator
          </h1>
          <p className="text-gray-400 text-sm">
            End-to-end 8-stage MLOps pipeline engine — dataset validation, model training, SHAP validation, deployment, and monitoring
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setStartModalOpen(true)}
            className="px-4 py-2 bg-primary-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-primary-400 flex items-center gap-2 transition-all"
          >
            <FiPlay className="w-4 h-4" /> Start ML Pipeline
          </button>
          <button onClick={() => fetchData(false)} disabled={loading}
            className="px-4 py-2 bg-surface-800 border border-white/5 rounded-xl hover:bg-surface-700 text-gray-300 flex items-center gap-2 text-xs font-semibold transition-all duration-300 disabled:opacity-50">
            <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* ─── 6 Summary Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Running Pipelines */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
            <FiActivity className="text-blue-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Running</p>
            <h3 className="text-xl font-bold text-blue-400 mt-0.5 font-mono">{s.runningPipelines || 0}</h3>
          </div>
        </div>

        {/* Queued Pipelines */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shrink-0">
            <FiClock className="text-purple-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Queued</p>
            <h3 className="text-xl font-bold text-purple-400 mt-0.5 font-mono">{s.queuedPipelines || 0}</h3>
          </div>
        </div>

        {/* Completed Today */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
            <FiCheckCircle className="text-emerald-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Completed</p>
            <h3 className="text-xl font-bold text-emerald-400 mt-0.5 font-mono">{s.completedToday || 0}</h3>
          </div>
        </div>

        {/* Failed */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 shrink-0">
            <FiAlertCircle className="text-red-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Failed</p>
            <h3 className="text-xl font-bold text-red-400 mt-0.5 font-mono">{s.failed || 0}</h3>
          </div>
        </div>

        {/* Average Runtime */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shrink-0">
            <FiClock className="text-cyan-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Avg Runtime</p>
            <h3 className="text-sm font-bold text-cyan-400 mt-1 font-mono truncate">{s.averageRuntime || '5m 20s'}</h3>
          </div>
        </div>

        {/* Success Rate */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
            <FiShield className="text-emerald-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Success Rate</p>
            <h3 className="text-xl font-bold text-emerald-400 mt-0.5 font-mono">{s.successRate || '100%'}</h3>
          </div>
        </div>
      </div>

      {/* ─── Timeline Visualizer ────────────────────────────────────────────── */}
      <TimelineVisualizer />

      {/* ─── Charts Row: Stage Funnel & Trigger Distribution ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Stage Completion Funnel */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiLayers className="text-primary-400" /> Stage Completion Funnel
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageFunnelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} angle={-15} textAnchor="end" height={40} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trigger Distribution */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiPieChart className="text-purple-400" /> Workflow Trigger Distribution
          </h3>
          <div className="h-72 w-full flex items-center justify-center">
            {triggerPieData.length === 0 ? (
              <div className="text-gray-500 text-sm">No trigger data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={triggerPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {triggerPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ─── Workflows Table ────────────────────────────────────────────────── */}
      <div className="glass-card-hover p-6">
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <FiGitBranch className="text-primary-400" /> Active & Historical Pipeline Workflows
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Workflow ID & Name</th>
                <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Trigger</th>
                <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Current Stage</th>
                <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-center">Progress</th>
                <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-center">Status</th>
                <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {workflows.map((w, idx) => (
                <tr key={w.workflowId} className={`border-b border-white/5 transition-colors hover:bg-white/[0.02] ${idx % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                  <td className="px-4 py-3.5">
                    <span className="font-mono font-bold text-xs text-primary-400 block">{w.workflowId}</span>
                    <span className="text-sm font-semibold text-white">{w.workflowName}</span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-300">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono font-semibold">
                      {w.triggerType}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-300 font-mono">
                    {w.currentStage}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="w-28 mx-auto bg-surface-950 rounded-full h-2 overflow-hidden border border-white/5">
                      <div
                        className={`h-full transition-all duration-500 ${w.status === 'Failed' ? 'bg-red-500' : 'bg-emerald-500'}`}
                        style={{ width: `${w.progressPct}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono block mt-1">{w.completedStagesCount}/8 ({w.progressPct}%)</span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <StatusPill status={w.status} />
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenDetails(w)}
                        className="px-2.5 py-1 bg-surface-800 text-gray-300 border border-white/10 rounded-lg text-xs font-semibold hover:bg-surface-700 hover:text-white transition-all"
                        title="View Stage Details"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleOpenLogs(w.workflowId)}
                        className="p-1.5 bg-surface-800 text-cyan-400 border border-white/10 rounded-lg hover:bg-surface-700 transition-all"
                        title="View Execution Logs"
                      >
                        <FiFileText className="w-3.5 h-3.5" />
                      </button>
                      {w.status === 'Running' ? (
                        <button
                          onClick={() => handleCancelWorkflow(w.workflowId)}
                          className="p-1.5 bg-red-500/15 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all"
                          title="Cancel Pipeline"
                        >
                          <FiXCircle className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRetryWorkflow(w.workflowId)}
                          className="p-1.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30 transition-all"
                          title="Retry Pipeline"
                        >
                          <FiRotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── START PIPELINE MODAL ───────────────────────────────────────────── */}
      {startModalOpen && (
        <div className="fixed inset-0 bg-surface-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 border-primary-500/30 animate-fade-in">
            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FiPlay className="text-primary-400" /> Start Automated ML Pipeline
              </h3>
              <button onClick={() => setStartModalOpen(false)} className="text-gray-400 hover:text-white"><FiX className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleStartWorkflow} className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-gray-400 block mb-1">Pipeline Workflow Name</label>
                <input
                  type="text"
                  required
                  value={newWorkflowData.workflowName}
                  onChange={(e) => setNewWorkflowData({ ...newWorkflowData, workflowName: e.target.value })}
                  placeholder="e.g. Automated End-to-End Retraining & Deployment"
                  className="w-full bg-surface-800 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Trigger Type</label>
                <select
                  value={newWorkflowData.triggerType}
                  onChange={(e) => setNewWorkflowData({ ...newWorkflowData, triggerType: e.target.value })}
                  className="w-full bg-surface-800 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  {TRIGGER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Notes / Rationale</label>
                <textarea
                  rows={2}
                  value={newWorkflowData.notes}
                  onChange={(e) => setNewWorkflowData({ ...newWorkflowData, notes: e.target.value })}
                  placeholder="Reason for triggering ML pipeline execution..."
                  className="w-full bg-surface-800 border border-white/10 rounded-xl p-2 text-white focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setStartModalOpen(false)} className="px-4 py-2 bg-surface-800 text-gray-400 rounded-xl text-xs font-bold hover:text-white">Cancel</button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-primary-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-primary-400 transition-all flex items-center gap-2"
                >
                  {actionLoading ? <FiRefreshCw className="animate-spin w-4 h-4" /> : <FiPlay className="w-4 h-4" />} Start Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── LOGS VIEWER MODAL ──────────────────────────────────────────────── */}
      {logsModalOpen && logsData && (
        <div className="fixed inset-0 bg-surface-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-2xl w-full p-6 border-cyan-500/30 animate-fade-in max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3 shrink-0">
              <div>
                <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-wider">{logsData.workflowId}</span>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FiFileText className="text-cyan-400" /> Pipeline Execution Logs ({logsData.workflowName})
                </h3>
              </div>
              <button onClick={() => setLogsModalOpen(false)} className="text-gray-400 hover:text-white"><FiX className="w-5 h-5" /></button>
            </div>

            {/* Scrollable Color-Coded Log Viewer */}
            <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs p-4 bg-surface-950 rounded-xl border border-white/5">
              {(logsData.logs || []).map((l, idx) => (
                <div key={idx} className="flex items-start gap-2 border-b border-white/[0.02] pb-1.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${l.level === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' : l.level === 'ERROR' ? 'bg-red-500/20 text-red-400' : l.level === 'WARNING' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {l.level}
                  </span>
                  <span className="text-gray-500 shrink-0 text-[11px]">{new Date(l.timestamp).toLocaleTimeString()}</span>
                  <span className="text-gray-300 leading-relaxed"><strong className="text-primary-400">[{l.stage}]</strong> {l.message}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 shrink-0">
              <button onClick={() => setLogsModalOpen(false)} className="px-4 py-2 bg-surface-800 text-gray-300 rounded-xl text-xs font-bold hover:text-white">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DETAILS MODAL ──────────────────────────────────────────────────── */}
      {detailsModalOpen && selectedWorkflow && (
        <div className="fixed inset-0 bg-surface-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-2xl w-full p-6 border-primary-500/30 animate-fade-in max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
              <div>
                <span className="text-[10px] text-primary-400 font-mono font-bold uppercase tracking-wider">{selectedWorkflow.workflowId}</span>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">{selectedWorkflow.workflowName}</h3>
              </div>
              <button onClick={() => setDetailsModalOpen(false)} className="text-gray-400 hover:text-white"><FiX className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {(selectedWorkflow.stages || []).map((s, idx) => (
                <div key={idx} className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] ${s.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : s.status === 'Running' ? 'bg-blue-500/20 text-blue-400 animate-pulse' : 'bg-gray-500/10 text-gray-500'}`}>
                      {idx + 1}
                    </span>
                    <span className="font-bold text-white text-xs">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill status={s.status} />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <button onClick={() => setDetailsModalOpen(false)} className="px-4 py-2 bg-surface-800 text-gray-300 rounded-xl text-xs font-bold hover:text-white">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PipelineOrchestrator;
