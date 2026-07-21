import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiDownload,
  FiPrinter,
  FiZap,
  FiActivity,
  FiDatabase,
  FiClock,
  FiTrendingUp,
  FiTrendingDown,
  FiShield,
  FiCalendar,
  FiCpu,
  FiUser,
  FiAlertTriangle,
  FiCheckCircle,
  FiInfo,
  FiChevronRight,
  FiRefreshCw
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import {
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie,
  ReferenceLine, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import explainabilityDetailApi from '../services/explainabilityDetailApi';

const ExplainabilityDetail = () => {
  const { predictionId } = useParams();
  const navigate = useNavigate();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await explainabilityDetailApi.getPredictionDetailInspector(predictionId);
      if (res.data?.success) {
        setDetail(res.data.detail);
      } else {
        setError('Failed to fetch explainability details.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error fetching prediction explainability details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [predictionId]);

  // ─── Actions ───
  const handleDownloadJSON = () => {
    if (!detail) return;
    const blob = new Blob([JSON.stringify(detail, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `explainability_prediction_detail_${predictionId}.json`;
    link.click();
    toast.success('JSON Report downloaded!');
  };

  const handlePrintPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        <div className="flex flex-col items-center gap-3">
          <FiRefreshCw className="w-8 h-8 animate-spin text-primary-400" />
          <p className="text-sm font-semibold">Loading explainability detail metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-card max-w-md p-6 text-center text-red-400 flex flex-col items-center justify-center gap-3">
          <FiAlertTriangle className="w-10 h-10" />
          <p className="font-semibold">{error || 'Prediction detail not found'}</p>
          <button onClick={() => navigate('/admin/explainability/predictions')} className="btn-secondary mt-2">
            Back to Prediction Explorer
          </button>
        </div>
      </div>
    );
  }

  // ─── Chart Data Parsers ───────────────────────────────────────────────────
  // 1. Confidence Gauge
  const gaugeData = [
    { name: 'Confidence', value: detail.confidence, fill: '#10b981' },
    { name: 'Remaining', value: 100 - detail.confidence, fill: 'rgba(255,255,255,0.05)' }
  ];

  // 2. Feature Contributions Diverging Chart (SHAP values)
  const shapChartData = detail.shapContributions
    .map(c => ({
      name: c.feature,
      value: c.direction === "negative"
        ? -(c.shapValue * 100)
        : c.shapValue * 100,
      abs: Math.abs(c.shapValue),
      direction: c.direction
    }))
    .sort((a, b) => b.abs - a.abs);

  // 3. Positive vs Negative Count
  const posCount = detail.positiveFeatureImpacts.length;
  const negCount = detail.negativeFeatureImpacts.length;
  const impactData = [
    { name: 'Positive Impact', value: posCount, fill: '#10b981' },
    { name: 'Negative Impact', value: negCount, fill: '#ef4444' }
  ].filter(item => item.value > 0);

  // Timings
  const modelTime = Math.max(1, detail.predictionLatency - detail.shapLatency);
  const shapTime = detail.shapLatency;

  return (
    <div className="space-y-8 animate-fade-in pb-12 print:bg-black print:text-white print:p-0 print:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <button
            onClick={() => navigate('/admin/explainability/predictions')}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors mb-2"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            Back to Prediction Explorer
          </button>
          <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <FiZap className="text-primary-400" /> Detail Inspector
          </h1>
          <p className="text-gray-400 text-sm">
            Model parameter inputs, SHAP mathematical force graphs, and latencies breakdown.
          </p>
        </div>

        {/* Action Panel */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownloadJSON}
            className="px-4 py-2 bg-surface-800 border border-white/5 rounded-xl hover:bg-surface-700 text-gray-300 flex items-center gap-2 text-sm font-semibold transition-all"
          >
            <FiDownload className="w-4 h-4" /> Download JSON
          </button>
          <button
            onClick={handlePrintPDF}
            className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl hover:brightness-110 flex items-center gap-2 text-sm font-semibold shadow-lg shadow-primary-500/10 transition-all"
          >
            <FiPrinter className="w-4 h-4" /> Print PDF Report
          </button>
        </div>
      </div>

      {/* Large Summary Card */}
      <div className="glass-card p-6 border-l-4 border-l-primary-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary-500/10 text-primary-400 border border-primary-500/20">
              Crop Recommendation
            </span>
            <h2 className="text-4xl font-display font-bold text-white capitalize">{detail.crop}</h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 font-medium">
              <span>Engine: <strong className="text-gray-200">{detail.explanationEngine}</strong></span>
              <span>Model: <strong className="text-gray-200">{detail.modelVersion}</strong></span>
              <span>Timestamp: <strong className="text-gray-200">{new Date(detail.timestamp).toLocaleString()}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-6 shrink-0">
            {/* Confidence Display */}
            <div className="text-right">
              <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider">Certainty Score</span>
              <span className="text-3xl font-bold text-white font-mono">{detail.confidence.toFixed(1)}%</span>
            </div>
            {/* Health / Engine Badge */}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${detail.shapAvailable
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
              {detail.shapAvailable ? <FiCheckCircle className="w-6 h-6" /> : <FiAlertTriangle className="w-6 h-6 animate-pulse" />}
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & Visualizations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Confidence Gauge */}
        <div className="glass-card p-6 flex flex-col justify-between items-center text-center">
          <div className="w-full text-left">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Confidence Gauge</h3>
            <p className="text-[10px] text-gray-500">Predicted crop match rating probability</p>
          </div>
          <div className="h-40 w-full flex items-center justify-center relative mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gaugeData}
                  cx="50%"
                  cy="90%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={65}
                  outerRadius={85}
                  dataKey="value"
                  stroke="none"
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute bottom-4 flex flex-col items-center">
              <span className="text-3xl font-bold text-white font-mono">{detail.confidence.toFixed(1)}%</span>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Confidence</span>
            </div>
          </div>
        </div>

        {/* Positive vs Negative Features count */}
        <div className="glass-card p-6 flex flex-col justify-between items-center text-center">
          <div className="w-full text-left">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">SHAP Force Balance</h3>
            <p className="text-[10px] text-gray-500">Balance of supportive vs opposing input parameters</p>
          </div>
          {impactData.length === 0 ? (
            <div className="text-xs text-gray-500 italic h-40 flex items-center">No SHAP parameters recorded</div>
          ) : (
            <div className="h-40 w-full flex items-center justify-center relative mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={impactData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {impactData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center">
                <span className="text-xl font-bold text-white font-mono">{posCount} : {negCount}</span>
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">Support : Oppose</span>
              </div>
            </div>
          )}
        </div>

        {/* Latencies Timeline */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Execution Pipeline</h3>
            <p className="text-[10px] text-gray-500">API latency profiles breakdown</p>
          </div>

          <div className="space-y-4 my-4">
            {/* Step 1 */}
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-5 h-5 rounded-full bg-primary-500/20 text-primary-400 border border-primary-500/30 flex items-center justify-center text-[10px] font-bold">1</div>
                <div className="w-0.5 h-8 bg-white/5"></div>
              </div>
              <div>
                <p className="text-xs font-bold text-white">Classification Model</p>
                <p className="text-[10px] text-gray-400 font-mono">{modelTime} ms latency</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold">2</div>
                <div className="w-0.5 h-8 bg-white/5"></div>
              </div>
              <div>
                <p className="text-xs font-bold text-white">SHAP Explainer Calculation</p>
                <p className="text-[10px] text-gray-400 font-mono">{detail.shapAvailable ? `${shapTime} ms latency` : 'Skipped (Rule Fallback)'}</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-[10px] font-bold">3</div>
              </div>
              <div>
                <p className="text-xs font-bold text-white">JSON Response Dispatched</p>
                <p className="text-[10px] text-gray-400 font-mono">Total latency: {detail.predictionLatency} ms</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SHAP Contributions Chart (Diverging horizontal chart) */}
      {detail.shapAvailable && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FiTrendingUp className="text-emerald-400" /> SHAP Feature Contributions Impact
          </h3>
          <p className="text-xs text-gray-500 mb-6">Negative percentages oppose crop match probability, positive percentages support prediction</p>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shapChartData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[-30, 30]}
                  tickFormatter={(value) => `${value}%`}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis dataKey="name" type="category" width={80} tick={{ fill: '#cbd5e1', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-surface-900/90 border border-white/10 p-2.5 rounded-lg shadow-xl backdrop-blur-md text-xs">
                          <p className="font-bold text-white">{data.name}</p>
                          <p className="text-gray-400 mt-1">
                            SHAP: <span className={data.value > 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                              {`${data.value > 0 ? '+' : ''}${data.value.toFixed(2)}%`}
                            </span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine x={0} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />
                <Bar dataKey="value" barSize={12}>
                  {shapChartData.map((entry, index) => {
                    const isPositive = entry.direction === 'positive';
                    return <Cell key={`cell-${index}`} fill={isPositive ? '#10b981' : '#ef4444'} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Fallback Warning Diagnostic Card */}
      {!detail.shapAvailable && (
        <div className="glass-card p-6 bg-amber-500/[0.01] border-amber-500/20">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0 text-amber-400">
              <FiAlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-white">Rule-Based Fallback Engine Triggered</h3>
              <p className="text-sm text-gray-400">
                The persistent subprocess was unavailable or the explainer calculation timed out. A heuristic analysis was automatically generated to guarantee crop prediction output.
              </p>
              {detail.fallbackReason && (
                <div className="mt-4 p-3 bg-surface-900 border border-white/5 rounded-lg text-xs font-mono text-amber-300">
                  Fallback Diagnostics: {detail.fallbackReason}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Input Features Table (IoT style) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <FiDatabase className="text-cyan-400" /> IoT Sensor Parameter Values
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-gray-500 uppercase tracking-wider font-semibold">
                  <th className="pb-3">Sensor parameter</th>
                  <th className="pb-3">Value</th>
                  <th className="pb-3">Scale representation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {Object.entries(detail.inputFeatures).map(([key, val]) => {
                  let progressPercent = Math.min(100, Math.max(5, (val / 300) * 100));
                  if (key === 'ph') progressPercent = (val / 14) * 100;
                  if (key === 'temperature') progressPercent = (val / 50) * 100;

                  return (
                    <tr key={key} className="hover:bg-white/[0.01]">
                      <td className="py-3.5 capitalize font-semibold text-gray-300">{key}</td>
                      <td className="py-3.5 font-bold font-mono text-white">{val}</td>
                      <td className="py-3.5 w-1/2">
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-500 rounded-full"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Weather snapshot & User Info side card */}
        <div className="space-y-6">
          {/* Weather Snapshot */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <FiCalendar className="text-blue-400" /> Weather Snapshot
            </h3>
            {detail.weatherSnapshot ? (
              <div className="flex items-center gap-4">
                {detail.weatherSnapshot.icon && (
                  <img
                    src={`https://openweathermap.org/img/wn/${detail.weatherSnapshot.icon}@2x.png`}
                    alt="Weather condition"
                    className="w-14 h-14 bg-surface-900 border border-white/5 rounded-xl"
                  />
                )}
                <div>
                  <h4 className="font-bold text-white capitalize">{detail.weatherSnapshot.condition}</h4>
                  <p className="text-xs text-gray-500">{detail.weatherSnapshot.location || 'Unknown'}</p>
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-500 italic">No weather snapshots captured.</div>
            )}
          </div>

          {/* User Account Info */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <FiUser className="text-purple-400" /> Requestor Account Context
            </h3>
            {detail.user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400">
                    <FiUser className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">{detail.user.name}</h4>
                    <p className="text-[10px] text-gray-500 font-mono">{detail.user.email}</p>
                  </div>
                </div>
                <div className="pt-2.5 border-t border-white/5 text-[9px] font-mono text-gray-600">
                  User ID: {detail.user._id}
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-500 italic">Anonymous Request or API key generated prediction.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExplainabilityDetail;
