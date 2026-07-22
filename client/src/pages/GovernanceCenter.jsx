import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiRefreshCw, FiShield, FiCheckCircle, FiAlertTriangle,
  FiAlertCircle, FiClock, FiCpu, FiPlus, FiFileText, FiX, FiCheck,
  FiPieChart, FiTrendingUp, FiActivity, FiEdit, FiToggleLeft, FiToggleRight,
  FiUserCheck, FiUserX, FiFilter, FiSliders
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import governanceApi from '../services/governanceApi';

// ─── Constants ──────────────────────────────────────────────────────────────
const CATEGORIES = ['Model Quality', 'Explainability', 'Security', 'Data Privacy', 'Bias & Fairness'];
const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

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

// ─── Severity Badge Component ───────────────────────────────────────────────
const SeverityBadge = ({ severity }) => {
  const styles = {
    Low: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    Medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    High: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    Critical: 'bg-red-500/15 text-red-400 border-red-500/30 animate-pulse'
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold border ${styles[severity] || 'bg-gray-500/15 text-gray-400'}`}>
      {severity}
    </span>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
const GovernanceCenter = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [summary, setSummary] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [audits, setAudits] = useState([]);
  const [violations, setViolations] = useState([]);

  const [activeTab, setActiveTab] = useState('policies'); // 'policies' | 'audit' | 'violations' | 'pending'

  // Modals State
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [policyFormData, setPolicyFormData] = useState({
    policyName: '',
    category: 'Model Quality',
    description: '',
    severity: 'High',
    conditions: '',
    enabled: true
  });

  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedAuditForApproval, setSelectedAuditForApproval] = useState(null);
  const [approvalComment, setApprovalComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch telemetry
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [sumRes, polRes, audRes, violRes] = await Promise.all([
        governanceApi.getSummary(),
        governanceApi.getPolicies(),
        governanceApi.getAudit(),
        governanceApi.getViolations()
      ]);

      if (sumRes.data?.success) setSummary(sumRes.data.data);
      if (polRes.data?.success) setPolicies(polRes.data.data.policies || []);
      if (audRes.data?.success) setAudits(audRes.data.data.logs || []);
      if (violRes.data?.success) setViolations(violRes.data.data.violations || []);

      if (!silent) toast.success('Governance telemetry updated');
    } catch (err) {
      console.error('[Governance Center] Fetch Error:', err);
      const msg = err.response?.data?.message || 'Failed to load governance telemetry';
      setError(msg);
      if (!silent) toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create / Edit Policy Submit
  const handleSavePolicy = async (e) => {
    e.preventDefault();
    if (!policyFormData.policyName) {
      toast.error('Policy name is required');
      return;
    }
    setActionLoading(true);
    try {
      if (editingPolicy) {
        await governanceApi.updatePolicy(editingPolicy.policyId, policyFormData);
        toast.success(`Policy ${editingPolicy.policyId} updated successfully`);
      } else {
        await governanceApi.createPolicy(policyFormData);
        toast.success(`New policy ${policyFormData.policyName} created`);
      }
      setPolicyModalOpen(false);
      setEditingPolicy(null);
      await fetchData(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save policy');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Policy Enabled State
  const handleTogglePolicy = async (policy) => {
    try {
      await governanceApi.updatePolicy(policy.policyId, { enabled: !policy.enabled });
      toast.success(`Policy ${policy.policyId} ${!policy.enabled ? 'enabled' : 'disabled'}`);
      await fetchData(true);
    } catch (err) {
      toast.error('Failed to toggle policy state');
    }
  };

  // Approve Request
  const handleApprove = async () => {
    if (!selectedAuditForApproval) return;
    setActionLoading(true);
    try {
      await governanceApi.approve(selectedAuditForApproval.auditId, { comment: approvalComment });
      toast.success(`Request ${selectedAuditForApproval.auditId} approved`);
      setApprovalModalOpen(false);
      setApprovalComment('');
      await fetchData(true);
    } catch (err) {
      toast.error('Failed to approve request');
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Request
  const handleReject = async () => {
    if (!selectedAuditForApproval) return;
    setActionLoading(true);
    try {
      await governanceApi.reject(selectedAuditForApproval.auditId, { comment: approvalComment });
      toast.success(`Request ${selectedAuditForApproval.auditId} rejected`);
      setApprovalModalOpen(false);
      setApprovalComment('');
      await fetchData(true);
    } catch (err) {
      toast.error('Failed to reject request');
    } finally {
      setActionLoading(false);
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
            <FiShield className="text-primary-400" /> Enterprise AI Governance & Compliance Center
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
  const pendingAudits = audits.filter(a => a.approvalStatus === 'Pending');

  // Policy Category Breakdown Pie Data
  const categoryCounts = {};
  policies.forEach(p => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  });
  const categoryPieData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));

  // Risk Distribution Bar Data
  const riskCounts = { Low: 0, Medium: 0, High: 0, Critical: 0 };
  audits.forEach(a => {
    if (riskCounts[a.riskLevel] !== undefined) riskCounts[a.riskLevel]++;
  });
  const riskBarData = Object.entries(riskCounts).map(([name, value]) => ({ name, value }));

  // Compliance Score Trajectory Data
  const complianceTrendData = [
    { date: 'Jul 15', Score: 92 },
    { date: 'Jul 17', Score: 94 },
    { date: 'Jul 19', Score: 93 },
    { date: 'Jul 21', Score: 96 }
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button onClick={() => navigate('/admin/operations')} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors mb-2">
            <FiArrowLeft className="w-3.5 h-3.5" /> Back to AI Operations
          </button>
          <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <FiShield className="text-primary-400" /> Enterprise AI Governance & Compliance Center
          </h1>
          <p className="text-gray-400 text-sm">
            AI compliance score monitoring — policy enforcement, risk distribution, audit trails, and human-in-the-loop approvals
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingPolicy(null);
              setPolicyFormData({ policyName: '', category: 'Model Quality', description: '', severity: 'High', conditions: '', enabled: true });
              setPolicyModalOpen(true);
            }}
            className="px-4 py-2 bg-primary-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-primary-400 flex items-center gap-2 transition-all"
          >
            <FiPlus className="w-4 h-4" /> Create Policy
          </button>
          <button onClick={() => fetchData(false)} disabled={loading}
            className="px-4 py-2 bg-surface-800 border border-white/5 rounded-xl hover:bg-surface-700 text-gray-300 flex items-center gap-2 text-xs font-semibold transition-all duration-300 disabled:opacity-50">
            <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* ─── 6 Summary Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Compliance Score */}
        <div className="glass-card-hover p-5 flex items-center gap-3 border-emerald-500/30 bg-emerald-500/5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shrink-0">
            <FiShield className="text-emerald-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Compliance Score</p>
            <h3 className="text-xl font-bold text-emerald-400 mt-0.5 font-mono">{s.complianceScore || 96}%</h3>
          </div>
        </div>

        {/* Active Policies */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
            <FiFileText className="text-blue-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Active Policies</p>
            <h3 className="text-xl font-bold text-blue-400 mt-0.5 font-mono">{s.policies || 0} / {s.totalPolicies || 0}</h3>
          </div>
        </div>

        {/* Violations */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
            <FiAlertTriangle className="text-amber-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Violations</p>
            <h3 className="text-xl font-bold text-amber-400 mt-0.5 font-mono">{s.violationsCount || 0}</h3>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shrink-0">
            <FiClock className="text-purple-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Pending Approvals</p>
            <h3 className="text-xl font-bold text-purple-400 mt-0.5 font-mono">{s.pendingApprovals || 0}</h3>
          </div>
        </div>

        {/* Critical Risks */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 shrink-0">
            <FiAlertCircle className="text-red-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Critical Risks</p>
            <h3 className="text-xl font-bold text-red-400 mt-0.5 font-mono">{s.criticalRisks || 0}</h3>
          </div>
        </div>

        {/* Audit Events */}
        <div className="glass-card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shrink-0">
            <FiActivity className="text-cyan-400 w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Audit Events</p>
            <h3 className="text-xl font-bold text-cyan-400 mt-0.5 font-mono">{s.auditEvents || 0}</h3>
          </div>
        </div>
      </div>

      {/* ─── Charts Row: Compliance Score Trend & Risk Distribution ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Compliance Score Trajectory */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiShield className="text-emerald-400" /> Platform Compliance Score Trajectory (%)
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={complianceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[80, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip suffix="%" />} />
                <Area type="monotone" dataKey="Score" stroke="#10b981" fill="url(#compGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Level Distribution */}
        <div className="glass-card-hover p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiAlertTriangle className="text-amber-400" /> Audit Log Risk Level Distribution
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={24} name="Count">
                  {riskBarData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#f59e0b', '#f97316', '#ef4444'][index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ─── 4 Tabbed Navigation (Policies / Audit / Violations / Pending) ───── */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-6">
          <button
            onClick={() => setActiveTab('policies')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'policies' ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'text-gray-400 hover:text-white'}`}
          >
            <FiFileText className="w-3.5 h-3.5" /> Governance Policies ({policies.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'audit' ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'text-gray-400 hover:text-white'}`}
          >
            <FiActivity className="w-3.5 h-3.5" /> Compliance Audit Logs ({audits.length})
          </button>
          <button
            onClick={() => setActiveTab('violations')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'violations' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-gray-400 hover:text-white'}`}
          >
            <FiAlertTriangle className="w-3.5 h-3.5" /> Policy Violations ({violations.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'pending' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-gray-400 hover:text-white'}`}
          >
            <FiClock className="w-3.5 h-3.5" /> Pending Approvals ({pendingAudits.length})
          </button>
        </div>

        {/* ─── TAB 1: Policies Table ─────────────────────────────────────────── */}
        {activeTab === 'policies' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Policy ID & Name</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Conditions</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-center">Severity</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-center">Enabled</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {policies.map((p, idx) => (
                  <tr key={p.policyId} className={`border-b border-white/5 transition-colors hover:bg-white/[0.02] ${idx % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-xs text-primary-400 block">{p.policyId}</span>
                      <span className="text-sm font-semibold text-white">{p.policyName}</span>
                      <span className="text-[10px] text-gray-500 block truncate max-w-xs">{p.description}</span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-300">
                      <span className="px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/5 font-mono">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-cyan-400">
                      {p.conditions}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <SeverityBadge severity={p.severity} />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleTogglePolicy(p)}
                        className={`text-lg transition-colors ${p.enabled ? 'text-emerald-400' : 'text-gray-600'}`}
                      >
                        {p.enabled ? <FiToggleRight className="w-6 h-6" /> : <FiToggleLeft className="w-6 h-6" />}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => {
                          setEditingPolicy(p);
                          setPolicyFormData({ ...p });
                          setPolicyModalOpen(true);
                        }}
                        className="p-1.5 bg-surface-800 text-gray-300 border border-white/10 rounded-lg hover:text-white hover:bg-surface-700 transition-all"
                      >
                        <FiEdit className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── TAB 2: Audit Logs Table ───────────────────────────────────────── */}
        {activeTab === 'audit' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Audit ID</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">User / Role</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Action & Resource</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-center">Risk Level</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-center">Status</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-center">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {audits.map((a, idx) => (
                  <tr key={a.auditId} className={`border-b border-white/5 transition-colors hover:bg-white/[0.02] ${idx % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                    <td className="px-4 py-3.5 font-mono font-bold text-xs text-primary-400">
                      {a.auditId}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-300">
                      <span className="font-semibold text-white block">{a.performedBy}</span>
                      <span className="text-[10px] text-gray-500 font-mono">{a.role}</span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-300">
                      <span className="font-semibold text-white block">{a.action}</span>
                      <span className="text-[10px] text-gray-500 font-mono">{a.resourceType}: {a.resourceId}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <SeverityBadge severity={a.riskLevel} />
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono text-xs font-bold text-emerald-400">
                      {a.status}
                    </td>
                    <td className="px-4 py-3.5 text-center text-xs text-gray-400 font-mono">
                      {new Date(a.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── TAB 3: Policy Violations Table ───────────────────────────────── */}
        {activeTab === 'violations' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Violation ID</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Policy Name</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Violation Reason</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-center">Severity</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {violations.map((v, idx) => (
                  <tr key={v.id} className="border-b border-white/5 bg-amber-500/[0.02]">
                    <td className="px-4 py-3.5 font-mono font-bold text-xs text-amber-400">
                      {v.id}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-white font-semibold">
                      {v.policyName}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-300 max-w-xs">
                      {v.reason}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <SeverityBadge severity={v.severity} />
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono text-xs font-bold text-amber-400">
                      {v.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── TAB 4: Pending Approvals Table ───────────────────────────────── */}
        {activeTab === 'pending' && (
          <div className="overflow-x-auto">
            {pendingAudits.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-sm">No pending approval requests</div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Audit ID</th>
                    <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Requested By</th>
                    <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Action</th>
                    <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-center">Risk</th>
                    <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingAudits.map((a, idx) => (
                    <tr key={a.auditId} className="border-b border-white/5 bg-purple-500/[0.02]">
                      <td className="px-4 py-3.5 font-mono font-bold text-xs text-purple-400">
                        {a.auditId}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-white font-semibold">
                        {a.performedBy} ({a.role})
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-300">
                        {a.action} ({a.resourceId})
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <SeverityBadge severity={a.riskLevel} />
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => { setSelectedAuditForApproval(a); setApprovalModalOpen(true); }}
                            className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold hover:bg-emerald-500/30 transition-all flex items-center gap-1"
                          >
                            <FiUserCheck className="w-3.5 h-3.5" /> Approve
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ─── CREATE / EDIT POLICY MODAL ─────────────────────────────────────── */}
      {policyModalOpen && (
        <div className="fixed inset-0 bg-surface-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 border-primary-500/30 animate-fade-in">
            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FiFileText className="text-primary-400" /> {editingPolicy ? 'Edit Policy' : 'Create Governance Policy'}
              </h3>
              <button onClick={() => setPolicyModalOpen(false)} className="text-gray-400 hover:text-white"><FiX className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSavePolicy} className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-gray-400 block mb-1">Policy Name</label>
                <input
                  type="text"
                  required
                  value={policyFormData.policyName}
                  onChange={(e) => setPolicyFormData({ ...policyFormData, policyName: e.target.value })}
                  placeholder="e.g. Minimum Production Accuracy Gate"
                  className="w-full bg-surface-800 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 block mb-1">Category</label>
                  <select
                    value={policyFormData.category}
                    onChange={(e) => setPolicyFormData({ ...policyFormData, category: e.target.value })}
                    className="w-full bg-surface-800 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Severity</label>
                  <select
                    value={policyFormData.severity}
                    onChange={(e) => setPolicyFormData({ ...policyFormData, severity: e.target.value })}
                    className="w-full bg-surface-800 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Policy Conditions Rule</label>
                <input
                  type="text"
                  value={policyFormData.conditions}
                  onChange={(e) => setPolicyFormData({ ...policyFormData, conditions: e.target.value })}
                  placeholder="e.g. accuracy >= 0.90 AND shap_coverage >= 0.80"
                  className="w-full bg-surface-800 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={policyFormData.description}
                  onChange={(e) => setPolicyFormData({ ...policyFormData, description: e.target.value })}
                  className="w-full bg-surface-800 border border-white/10 rounded-xl p-2 text-white focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setPolicyModalOpen(false)} className="px-4 py-2 bg-surface-800 text-gray-400 rounded-xl text-xs font-bold hover:text-white">Cancel</button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-primary-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-primary-400 transition-all flex items-center gap-2"
                >
                  {actionLoading ? <FiRefreshCw className="animate-spin w-4 h-4" /> : <FiCheck className="w-4 h-4" />} Save Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── APPROVAL / REJECTION MODAL ─────────────────────────────────────── */}
      {approvalModalOpen && selectedAuditForApproval && (
        <div className="fixed inset-0 bg-surface-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 border-purple-500/30 animate-fade-in">
            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FiUserCheck className="text-purple-400" /> Review Request {selectedAuditForApproval.auditId}
              </h3>
              <button onClick={() => setApprovalModalOpen(false)} className="text-gray-400 hover:text-white"><FiX className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="p-3 bg-white/5 rounded-xl space-y-1">
                <p><span className="text-gray-400">Requested By:</span> <span className="text-white font-bold">{selectedAuditForApproval.performedBy}</span></p>
                <p><span className="text-gray-400">Action:</span> <span className="text-purple-400 font-bold">{selectedAuditForApproval.action}</span></p>
                <p><span className="text-gray-400">Resource:</span> <span className="text-gray-300">{selectedAuditForApproval.resourceId}</span></p>
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Approval Comments / Decision Notes</label>
                <textarea
                  rows={3}
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  placeholder="Enter governance review notes..."
                  className="w-full bg-surface-800 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500/50"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold hover:bg-red-500/30 transition-all flex items-center gap-1.5"
                >
                  <FiUserX className="w-4 h-4" /> Reject
                </button>
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-emerald-400 transition-all flex items-center gap-1.5"
                >
                  <FiUserCheck className="w-4 h-4" /> Approve Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GovernanceCenter;
