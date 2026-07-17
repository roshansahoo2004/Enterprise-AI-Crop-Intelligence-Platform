/**
 * Phase-5 Step-2: Model Comparison Section
 * Phase-5 Step-5: One-Click Model Rollback / Activation
 *
 * Renders inside AdminDashboard. Shows a comparison table of all model
 * versions with Accuracy and Loss line charts. Highlights the active model
 * (green ACTIVE badge) and the best accuracy row (🏆 Best Model).
 *
 * Phase-5 Step-5 additions:
 *  - "Action" column with Activate button for inactive models.
 *  - Confirmation modal before activation.
 *  - Loading spinner on the clicked button.
 *  - Success/error toasts.
 *  - Auto-refreshes comparison table + admin dashboard on activation.
 *
 * Data is fetched once and cached in component state.
 * Reuses existing Recharts library and Tailwind theme.
 */
import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { adminDashboardAPI } from '../services/adminDashboardApi';
import {
  FiCpu, FiRefreshCw, FiAlertTriangle, FiTrendingUp, FiLoader
} from 'react-icons/fi';
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceDot
} from 'recharts';

const ModelComparison = ({ onModelActivated }) => {
  const [models, setModels] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─── Phase-5 Step-5: Rollback state ───
  const [confirmModel, setConfirmModel] = useState(null);   // model to activate (modal target)
  const [activatingId, setActivatingId] = useState(null);     // _id of model being activated (spinner)

  // ─── Fetch data (once, cached in state) ───
  const fetchComparison = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminDashboardAPI.getModelComparison();
      setModels(res.data.data);
    } catch (err) {
      console.error('Failed to load model comparison:', err);
      const msg = err.response?.status === 403
        ? 'Admin access required.'
        : 'Failed to load model comparison data.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComparison();
  }, [fetchComparison]);

  // ─── Phase-5 Step-5: Activate model handler ───
  const handleActivateModel = async () => {
    if (!confirmModel) return;

    const { _id, version } = confirmModel;
    setConfirmModel(null);      // close modal immediately
    setActivatingId(_id);       // show spinner on the clicked row

    try {
      const res = await adminDashboardAPI.activateModelVersion(_id);
      toast.success(`Model ${res.data.data?.version || version} activated.`);

      // Refresh the comparison table
      await fetchComparison();

      // Notify parent (AdminDashboard) to refresh its stats
      if (onModelActivated) {
        onModelActivated();
      }
    } catch (err) {
      console.error('Failed to activate model:', err);
      const msg = err.response?.data?.message || 'Failed to activate model. Please retry.';
      toast.error(msg);
    } finally {
      setActivatingId(null);
    }
  };

  // ─── Helpers ───
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const pct = (val) => val != null ? `${(val * 100).toFixed(2)}%` : '—';
  const num = (val) => val != null ? val : '—';

  // ─── Loading skeleton ───
  if (loading && !models) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-6 w-56 bg-surface-800 rounded mb-6"></div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-surface-800 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Error state ───
  if (error) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <FiAlertTriangle className="w-7 h-7 text-red-400" />
        </div>
        <p className="text-gray-400 mb-4">{error}</p>
        <button
          onClick={fetchComparison}
          className="px-4 py-2 bg-surface-800 border border-white/5 rounded-xl hover:bg-surface-700 text-gray-300 text-sm font-semibold transition-all"
        >
          <FiRefreshCw className="inline w-4 h-4 mr-1.5" /> Retry
        </button>
      </div>
    );
  }

  // ─── Not enough models ───
  if (!models || models.length < 2) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-500/10 flex items-center justify-center">
          <FiCpu className="w-7 h-7 text-amber-400" />
        </div>
        <h3 className="text-lg font-display font-bold text-white mb-2">Not Enough Data</h3>
        <p className="text-gray-400 text-sm">
          Need at least two trained models to compare.
        </p>
        {models && models.length === 1 && (
          <p className="text-gray-500 text-xs mt-2">
            Current model: <span className="text-white font-bold">{models[0].version}</span>
          </p>
        )}
      </div>
    );
  }

  // ─── Compute best accuracy row ───
  const modelsWithAccuracy = models.filter((m) => m.accuracy != null);
  const bestAccuracyId = modelsWithAccuracy.length > 0
    ? modelsWithAccuracy.reduce((best, m) => m.accuracy > best.accuracy ? m : best)._id
    : null;

  // ─── Chart data (oldest → newest for correct axis ordering) ───
  const chartData = [...models]
    .reverse()
    .filter((m) => m.accuracy != null || m.loss != null)
    .map((m) => ({
      version: m.version,
      accuracy: m.accuracy != null ? +(m.accuracy * 100).toFixed(2) : null,
      loss: m.loss != null ? +m.loss.toFixed(4) : null,
      isActive: m.isActive
    }));

  const activeModel = chartData.find(point => point.isActive);

  // ─── Custom tooltip ───
  const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-surface-900 border border-white/10 rounded-xl p-3 shadow-xl text-xs">
        <p className="text-white font-bold mb-1">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color }} className="font-semibold">
            {entry.name}: {entry.value}{entry.name === 'Accuracy (%)' ? '%' : ''}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* ─── Section Header ─── */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <FiTrendingUp className="text-secondary-400" /> Model Comparison
        </h2>
        <button
          onClick={fetchComparison}
          disabled={loading}
          className="px-3 py-1.5 bg-surface-800 border border-white/5 rounded-lg hover:bg-surface-700 text-gray-400 text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ─── Charts Row ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accuracy vs Version */}
        <div className="glass-card p-6 flex flex-col min-h-[340px]">
          <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block"></span>
            Accuracy vs Version
          </h3>
          <div className="flex-1">
            {chartData.length < 2 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500 text-sm">Not enough data points for chart.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="version" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend formatter={(v) => <span className="text-gray-400 text-xs font-medium">{v}</span>} />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    name="Accuracy (%)"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                    activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#0a0a0a' }}
                    connectNulls
                  />
                  {activeModel && (
                    <ReferenceDot
                      x={activeModel.version}
                      y={activeModel.accuracy}
                      r={7}
                      fill="#22c55e"
                      stroke="#ffffff"
                      strokeWidth={2}
                      label={{
                        value: 'ACTIVE',
                        position: 'top',
                        fill: '#22c55e',
                        fontSize: 12
                      }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Loss vs Version */}
        <div className="glass-card p-6 flex flex-col min-h-[340px]">
          <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block"></span>
            Loss vs Version
          </h3>
          <div className="flex-1">
            {chartData.length < 2 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500 text-sm">Not enough data points for chart.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="version" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend formatter={(v) => <span className="text-gray-400 text-xs font-medium">{v}</span>} />
                  <Line
                    type="monotone"
                    dataKey="loss"
                    name="Val Loss"
                    stroke="#ef4444"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }}
                    activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2, fill: '#0a0a0a' }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ─── Comparison Table ─── */}
      <div className="glass-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-white/5 text-xs text-gray-500 font-semibold uppercase">
                <th className="pb-3">Version</th>
                <th className="pb-3">Accuracy</th>
                <th className="pb-3">Loss</th>
                <th className="pb-3">Precision</th>
                <th className="pb-3">Recall</th>
                <th className="pb-3">F1</th>
                <th className="pb-3">Epochs</th>
                <th className="pb-3">Train Imgs</th>
                <th className="pb-3">Val Imgs</th>
                <th className="pb-3">Created</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-gray-300">
              {models.map((m) => {
                const isBest = m._id === bestAccuracyId;
                const isActivating = activatingId === m._id;
                return (
                  <tr
                    key={m._id}
                    className={`transition-colors ${m.isActive
                      ? 'bg-green-500/[0.04] hover:bg-green-500/[0.07]'
                      : isBest
                        ? 'bg-amber-500/[0.03] hover:bg-amber-500/[0.06]'
                        : 'hover:bg-white/[0.02]'
                      }`}
                  >
                    <td className="py-3.5 font-bold text-white">
                      <div className="flex items-center gap-2">
                        {m.version}
                        {isBest && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
                            🏆 Best Model
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`py-3.5 font-semibold ${m.accuracy != null && m.accuracy >= 0.9 ? 'text-green-400' :
                      m.accuracy != null && m.accuracy >= 0.7 ? 'text-amber-400' :
                        m.accuracy != null ? 'text-red-400' : 'text-gray-500'
                      }`}>
                      {pct(m.accuracy)}
                    </td>
                    <td className="py-3.5 text-gray-400">{m.loss != null ? m.loss.toFixed(4) : '—'}</td>
                    <td className="py-3.5">{pct(m.precision)}</td>
                    <td className="py-3.5">{pct(m.recall)}</td>
                    <td className="py-3.5">{pct(m.f1Score)}</td>
                    <td className="py-3.5">{num(m.epochs)}</td>
                    <td className="py-3.5">{num(m.trainingImages)}</td>
                    <td className="py-3.5">{num(m.validationImages)}</td>
                    <td className="py-3.5 text-xs text-gray-500">{formatDate(m.createdAt)}</td>
                    <td className="py-3.5">
                      {m.isActive ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-gray-500/10 text-gray-400 border border-gray-500/20">
                          ARCHIVED
                        </span>
                      )}
                    </td>
                    {/* ── Phase-5 Step-5: Action Column ── */}
                    <td className="py-3.5 text-right">
                      {m.isActive ? (
                        <span className="inline-flex px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 bg-surface-800 border border-white/5 cursor-not-allowed opacity-50">
                          ACTIVE
                        </span>
                      ) : (
                        <button
                          onClick={() => setConfirmModel(m)}
                          disabled={activatingId !== null}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 bg-primary-500/10 text-primary-400 border border-primary-500/20 hover:bg-primary-500/20 hover:text-primary-300 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {isActivating ? (
                            <>
                              <FiLoader className="w-3.5 h-3.5 animate-spin" />
                              Activating…
                            </>
                          ) : (
                            'Activate'
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/*  Phase-5 Step-5: CONFIRM ACTIVATION MODAL                             */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {confirmModel && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => {
            if (activatingId === null)
              setConfirmModel(null);
          }}
        >
          <div
            className="glass-card p-8 max-w-sm w-full mx-4 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary-500/10 flex items-center justify-center">
              <FiCpu className="w-7 h-7 text-primary-400" />
            </div>

            <h3 className="text-lg font-display font-bold text-white text-center mb-2">
              Activate model {confirmModel.version}?
            </h3>
            <p className="text-gray-400 text-sm text-center mb-6">
              This will switch prediction to use <span className="text-white font-semibold">{confirmModel.version}</span>.
              The currently active model will be deactivated.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModel(null)}
                disabled={activatingId !== null}
                className="btn-secondary flex-1 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleActivateModel}
                disabled={activatingId !== null}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg hover:shadow-xl shadow-primary-500/25 hover:shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {activatingId !== null ? (
                  <>
                    <FiLoader className="inline w-4 h-4 mr-2 animate-spin" />
                    Activating...
                  </>
                ) : (
                  'Activate'
                )}
              </button>
            </div>
          </div>
        </div>
      )
      }
    </div >
  );
};

export default ModelComparison;
