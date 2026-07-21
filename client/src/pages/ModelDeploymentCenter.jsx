import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiRefreshCw, FiBox, FiCheckCircle, FiAlertTriangle,
  FiAlertCircle, FiClock, FiCpu, FiRotateCcw, FiSend, FiFileText,
  FiLayers, FiCheck, FiX, FiActivity, FiShield, FiSliders
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import modelDeploymentApi from '../services/modelDeploymentApi';

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

// ─── Status Badge Component ─────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const styles = {
    Active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-bold',
    Success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    'Active Serving': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-bold',
    'Deployable Candidate': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    'Candidate Ready': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    'Rolling Back': 'bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse',
    'Rolled Back': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    Failed: 'bg-red-500/15 text-red-400 border-red-500/30'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border ${styles[status] || 'bg-gray-500/15 text-gray-400 border-gray-500/30'}`}>
      {status === 'Active' || status === 'Active Serving' || status === 'Success' ? <FiCheckCircle className="w-3 h-3 text-emerald-400" /> : null}
      {status === 'Rolled Back' ? <FiRotateCcw className="w-3 h-3 text-purple-400" /> : null}
      {status === 'Failed' ? <FiAlertCircle className="w-3 h-3 text-red-400" /> : null}
      {status}
    </span>
  );
};

// ─── Deployment Pipeline Stepper ────────────────────────────────────────────
const PipelineStepper = ({ isDeploying }) => {
  const steps = [
    { num: 1, title: 'Artifact Validation', desc: 'SHA-256 Checksum', status: isDeploying ? 'active' : 'completed' },
    { num: 2, title: 'Pre-flight Checks', desc: 'Health & Memory', status: isDeploying ? 'active' : 'completed' },
    { num: 3, title: 'Traffic Routing', desc: 'Dynamic Switch', status: isDeploying ? 'active' : 'completed' },
    { num: 4, title: 'Active Serving', desc: '100% Traffic', status: isDeploying ? 'pending' : 'completed' }
  ];

  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
        <FiActivity className="text-primary-400" /> Deployment Pipeline Execution Engine
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
        {steps.map((s, idx) => (
          <div key={s.num} className="glass-card-hover p-4 rounded-xl border border-white/5 relative flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${s.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : s.status === 'active' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse' : 'bg-white/5 text-gray-500'}`}>
              {s.status === 'completed' ? <FiCheck className="w-4 h-4" /> : s.num}
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">{s.title}</h4>
              <p className="text-[10px] text-gray-400">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
const ModelDeploymentCenter = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeData, setActiveData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [versionsData, setVersionsData] = useState([]);
  const [logsData, setLogsData] = useState([]);

  // Modals state
  const [activeTab, setActiveTab] = useState('versions'); // 'versions' | 'history' | 'logs'
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [selectedDeployVersion, setSelectedDeployVersion] = useState(null);
  const [deployNotes, setDeployNotes] = useState('');
  const [rollbackModalOpen, setRollbackModalOpen] = useState(false);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [compareVersion, setCompareVersion] = useState(null);

  // Fetch data
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [activeRes, historyRes, versionsRes, logsRes] = await Promise.all([
        modelDeploymentApi.getActive(),
        modelDeploymentApi.getHistory(20),
        modelDeploymentApi.getVersions(),
        modelDeploymentApi.getLogs()
      ]);

      if (activeRes.data?.success) setActiveData(activeRes.data.data);
      if (historyRes.data?.success) setHistoryData(historyRes.data.data.history || []);
      if (versionsRes.data?.success) setVersionsData(versionsRes.data.data.versions || []);
      if (logsRes.data?.success) setLogsData(logsRes.data.data.logs || []);

      if (!silent) toast.success('Deployment center updated');
    } catch (err) {
      console.error('[Model Deployment] Fetch Error:', err);
      const msg = err.response?.data?.message || 'Failed to load deployment data';
      setError(msg);
      if (!silent) toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Execute Deploy Action
  const handleConfirmDeploy = async () => {
    if (!selectedDeployVersion) return;
    setIsDeploying(true);
    const toastId = toast.loading(`Deploying model ${selectedDeployVersion.version}...`);

    try {
      const res = await modelDeploymentApi.deploy({
        version: selectedDeployVersion.version,
        notes: deployNotes || `Manual deployment of ${selectedDeployVersion.version}`
      });

      if (res.data?.success) {
        toast.success(`Successfully deployed model version ${selectedDeployVersion.version}!`, { id: toastId });
        setDeployModalOpen(false);
        setDeployNotes('');
        await fetchData(true);
      }
    } catch (err) {
      console.error('[Deploy Error]:', err);
      toast.error(err.response?.data?.message || 'Failed to deploy version', { id: toastId });
    } finally {
      setIsDeploying(false);
    }
  };

  // Execute Rollback Action
  const handleConfirmRollback = async () => {
    setIsDeploying(true);
    const toastId = toast.loading('Initiating emergency model rollback...');

    try {
      const res = await modelDeploymentApi.rollback({
        notes: 'Emergency rollback triggered by administrator'
      });

      if (res.data?.success) {
        toast.success(`Rollback successful! Reverted serving model to ${active?.previousVersion}`, { id: toastId });
        setRollbackModalOpen(false);
        await fetchData(true);
      }
    } catch (err) {
      console.error('[Rollback Error]:', err);
      toast.error(err.response?.data?.message || 'Failed to execute rollback', { id: toastId });
    } finally {
      setIsDeploying(false);
    }
  };

  // ─── Error State ──────────────────────────────────────────────────────────
  if (error && !activeData) {
    return (
      <div className="space-y-8 animate-fade-in pb-12">
        <div>
          <button onClick={() => navigate('/admin/operations')} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors mb-2">
            <FiArrowLeft className="w-3.5 h-3.5" /> Back to AI Operations
          </button>
          <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <FiBox className="text-primary-400" /> Enterprise Model Deployment Center
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
  if (loading && !activeData) {
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

  const active = activeData || {};

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button onClick={() => navigate('/admin/operations')} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors mb-2">
            <FiArrowLeft className="w-3.5 h-3.5" /> Back to AI Operations
          </button>
          <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <FiBox className="text-primary-400" /> Enterprise Model Deployment Center
          </h1>
          <p className="text-gray-400 text-sm">
            Model serving deployment console — active version management, automated rollback triggers, and execution telemetry
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setRollbackModalOpen(true)}
            disabled={!active.rollbackReady || isDeploying}
            className="px-4 py-2 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 text-purple-300 rounded-xl font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-40"
          >
            <FiRotateCcw className="w-3.5 h-3.5" /> Rollback to {active.previousVersion || 'Previous'}
          </button>
          <button onClick={() => fetchData(false)} disabled={loading}
            className="px-4 py-2 bg-surface-800 border border-white/5 rounded-xl hover:bg-surface-700 text-gray-300 flex items-center gap-2 text-xs font-semibold transition-all duration-300 disabled:opacity-50">
            <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* ─── 6 Summary Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Current Version */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
            <FiBox className="text-emerald-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Current Version</p>
            <h3 className="text-lg font-bold text-emerald-400 mt-0.5 font-mono">{active.currentVersion || 'v1.0'}</h3>
          </div>
        </div>

        {/* Deployment Status */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
            <FiCheckCircle className="text-blue-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Status</p>
            <h3 className="text-sm font-bold text-blue-400 mt-1">{active.deploymentStatus || 'Active'}</h3>
          </div>
        </div>

        {/* Last Deployment */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shrink-0">
            <FiClock className="text-purple-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Last Deployment</p>
            <h3 className="text-xs font-bold text-purple-400 mt-1 truncate">
              {active.lastDeploymentTime ? new Date(active.lastDeploymentTime).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Recent'}
            </h3>
          </div>
        </div>

        {/* Average Deployment Time */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shrink-0">
            <FiActivity className="text-cyan-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Avg Deploy Time</p>
            <h3 className="text-lg font-bold text-cyan-400 mt-0.5 font-mono">{active.avgDeploymentTime || '3.8s'}</h3>
          </div>
        </div>

        {/* Rollback Ready */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
            <FiRotateCcw className="text-amber-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Rollback Ready</p>
            <h3 className={`text-sm font-bold mt-1 ${active.rollbackReady ? 'text-emerald-400' : 'text-gray-400'}`}>
              {active.rollbackReady ? `Ready (${active.previousVersion})` : 'N/A'}
            </h3>
          </div>
        </div>

        {/* Deployment Health */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
            <FiCpu className="text-emerald-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Health Score</p>
            <h3 className="text-lg font-bold text-emerald-400 mt-0.5 font-mono">{active.deploymentHealthScore || 92}/100</h3>
          </div>
        </div>
      </div>

      {/* ─── Deployment Pipeline Stepper ────────────────────────────────────── */}
      <PipelineStepper isDeploying={isDeploying} />

      {/* ─── Tab Navigation (Deployable Versions / History / Execution Logs) ── */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-6">
          <button
            onClick={() => setActiveTab('versions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'versions' ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'text-gray-400 hover:text-white'}`}
          >
            <FiBox className="w-3.5 h-3.5" /> Deployable Model Versions ({versionsData.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'text-gray-400 hover:text-white'}`}
          >
            <FiClock className="w-3.5 h-3.5" /> Deployment History Log ({historyData.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'logs' ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'text-gray-400 hover:text-white'}`}
          >
            <FiFileText className="w-3.5 h-3.5" /> Real-time Execution Logs ({logsData.length})
          </button>
        </div>

        {/* ─── TAB 1: Deployable Model Versions Table ────────────────────────── */}
        {activeTab === 'versions' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Version</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Serving Status</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-right">Accuracy</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-right">F1 Score</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-center">Trained Date</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {versionsData.map((v, idx) => (
                  <tr key={v.version} className={`border-b border-white/5 transition-colors hover:bg-white/[0.02] ${v.isActive ? 'bg-emerald-500/[0.02]' : idx % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                    <td className="px-4 py-3.5 font-mono font-bold text-white text-sm">
                      {v.version}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-400 text-sm">
                      {v.accuracy}%
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-gray-300 text-sm">
                      {v.f1Score}%
                    </td>
                    <td className="px-4 py-3.5 text-center text-xs text-gray-400">
                      {new Date(v.trainedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {v.deployable ? (
                          <button
                            onClick={() => { setSelectedDeployVersion(v); setDeployModalOpen(true); }}
                            className="px-3 py-1 bg-primary-500/20 text-primary-400 border border-primary-500/30 rounded-lg text-xs font-bold hover:bg-primary-500/30 transition-all flex items-center gap-1.5"
                          >
                            <FiSend className="w-3 h-3" /> Deploy to Prod
                          </button>
                        ) : (
                          <span className="text-xs font-mono text-emerald-400 font-semibold">Active Serving</span>
                        )}
                        <button
                          onClick={() => { setCompareVersion(v); setCompareModalOpen(true); }}
                          className="px-2.5 py-1 bg-surface-800 text-gray-300 border border-white/10 rounded-lg text-xs font-semibold hover:bg-surface-700 transition-all"
                        >
                          Compare
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── TAB 2: Deployment History Table ──────────────────────────────── */}
        {activeTab === 'history' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Version</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Deployed By</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-right">Duration</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-center">Status</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-center">Date</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody>
                {historyData.map((h, idx) => (
                  <tr key={h._id || idx} className={`border-b border-white/5 transition-colors hover:bg-white/[0.02] ${idx % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                    <td className="px-4 py-3.5 font-mono font-bold text-white text-sm">
                      {h.modelVersion} <span className="text-[10px] text-gray-500 font-normal block">from {h.previousVersion}</span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-300 font-mono">
                      {h.deployedBy}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-400">
                      {h.deploymentType}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-cyan-400 text-xs font-bold">
                      {h.duration}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <StatusBadge status={h.status} />
                    </td>
                    <td className="px-4 py-3.5 text-center text-xs text-gray-400">
                      {new Date(h.deployedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-400 max-w-xs truncate">
                      {h.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── TAB 3: Deployment Logs Stream ────────────────────────────────── */}
        {activeTab === 'logs' && (
          <div className="space-y-3 font-mono text-xs">
            {logsData.map(l => (
              <div key={l.step} className="p-3 rounded-xl bg-surface-950 border border-white/5 flex items-start gap-3">
                <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${l.level === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {l.level}
                </span>
                <span className="text-gray-500 shrink-0">{new Date(l.timestamp).toLocaleTimeString()}</span>
                <span className="text-gray-200">{l.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── DEPLOY MODAL ────────────────────────────────────────────────────── */}
      {deployModalOpen && selectedDeployVersion && (
        <div className="fixed inset-0 bg-surface-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 border-primary-500/30 animate-fade-in">
            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FiSend className="text-primary-400" /> Deploy {selectedDeployVersion.version} to Production
              </h3>
              <button onClick={() => setDeployModalOpen(false)} className="text-gray-400 hover:text-white"><FiX className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-white/5 rounded-xl text-xs space-y-1 font-mono">
                <p><span className="text-gray-400">Target Version:</span> <span className="text-emerald-400 font-bold">{selectedDeployVersion.version}</span></p>
                <p><span className="text-gray-400">Accuracy:</span> <span className="text-white font-bold">{selectedDeployVersion.accuracy}%</span></p>
                <p><span className="text-gray-400">Current Serving:</span> <span className="text-gray-300">{active.currentVersion}</span></p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1.5">Deployment Release Notes</label>
                <textarea
                  rows={3}
                  value={deployNotes}
                  onChange={(e) => setDeployNotes(e.target.value)}
                  placeholder="Enter deployment rationale or release notes..."
                  className="w-full bg-surface-800 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-primary-500/50"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setDeployModalOpen(false)} className="px-4 py-2 bg-surface-800 text-gray-400 rounded-xl text-xs font-bold hover:text-white">Cancel</button>
                <button
                  onClick={handleConfirmDeploy}
                  disabled={isDeploying}
                  className="px-4 py-2 bg-primary-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-primary-400 transition-all flex items-center gap-2"
                >
                  {isDeploying ? <FiRefreshCw className="animate-spin w-4 h-4" /> : <FiSend className="w-4 h-4" />} Confirm & Deploy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── ROLLBACK MODAL ──────────────────────────────────────────────────── */}
      {rollbackModalOpen && (
        <div className="fixed inset-0 bg-surface-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 border-red-500/30 animate-fade-in">
            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
              <h3 className="text-lg font-bold text-red-400 flex items-center gap-2">
                <FiRotateCcw className="text-red-400" /> Confirm Emergency Rollback
              </h3>
              <button onClick={() => setRollbackModalOpen(false)} className="text-gray-400 hover:text-white"><FiX className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-gray-300 leading-relaxed">
                Are you sure you want to revert active production model serving from <strong className="text-white font-mono">{active.currentVersion}</strong> back to <strong className="text-purple-400 font-mono">{active.previousVersion}</strong>?
              </p>
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300">
                ⚠ Traffic router will immediately switch 100% of inference requests to version {active.previousVersion}.
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setRollbackModalOpen(false)} className="px-4 py-2 bg-surface-800 text-gray-400 rounded-xl text-xs font-bold hover:text-white">Cancel</button>
                <button
                  onClick={handleConfirmRollback}
                  disabled={isDeploying}
                  className="px-4 py-2 bg-red-500 text-white font-bold rounded-xl text-xs hover:bg-red-600 transition-all flex items-center gap-2"
                >
                  {isDeploying ? <FiRefreshCw className="animate-spin w-4 h-4" /> : <FiRotateCcw className="w-4 h-4" />} Execute Rollback
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── COMPARE MODAL ───────────────────────────────────────────────────── */}
      {compareModalOpen && compareVersion && (
        <div className="fixed inset-0 bg-surface-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full p-6 border-blue-500/30 animate-fade-in">
            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FiSliders className="text-blue-400" /> Compare Model Versions
              </h3>
              <button onClick={() => setCompareModalOpen(false)} className="text-gray-400 hover:text-white"><FiX className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-2 gap-4 my-4 font-mono text-xs">
              {/* Active Version */}
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Active Serving</span>
                <h4 className="text-base font-bold text-white">{active.currentVersion}</h4>
                <p><span className="text-gray-400">Accuracy:</span> <span className="text-emerald-400 font-bold">{active.activeModelMetrics?.accuracy || '94.5%'}</span></p>
                <p><span className="text-gray-400">F1 Score:</span> <span className="text-white">{active.activeModelMetrics?.f1Score || '94.1%'}</span></p>
                <p><span className="text-gray-400">Status:</span> <span className="text-emerald-400 font-semibold">Active</span></p>
              </div>

              {/* Selected Candidate Version */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-2">
                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block">Candidate Version</span>
                <h4 className="text-base font-bold text-white">{compareVersion.version}</h4>
                <p><span className="text-gray-400">Accuracy:</span> <span className="text-blue-400 font-bold">{compareVersion.accuracy}%</span></p>
                <p><span className="text-gray-400">F1 Score:</span> <span className="text-white">{compareVersion.f1Score}%</span></p>
                <p><span className="text-gray-400">Status:</span> <span className="text-blue-400 font-semibold">{compareVersion.status}</span></p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setCompareModalOpen(false)} className="px-4 py-2 bg-surface-800 text-gray-300 rounded-xl text-xs font-bold hover:text-white">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelDeploymentCenter;
