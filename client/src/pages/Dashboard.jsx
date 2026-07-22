import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import useWeather from '../hooks/useWeather';
import useIoT from '../hooks/useIoT';
import { historyAPI, diseaseAPI } from '../services/api';
import WeatherCard from '../components/WeatherCard';
import SensorPanel from '../components/SensorPanel';
import HistoryTable from '../components/HistoryTable';
import AIInsightsPanel from '../components/AIInsightsPanel';
import { getCropData } from '../utils/cropData';
import {
  FiArrowRight, FiActivity, FiMapPin, FiTrendingUp, FiCrosshair,
  FiPieChart, FiRefreshCw, FiZap, FiShield, FiAlertCircle,
  FiClock, FiTv, FiGitBranch, FiCheckCircle
} from 'react-icons/fi';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

// ─── Custom Tooltip Component ───────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-900/95 border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md font-mono text-xs text-white">
        {label && <p className="text-gray-400 font-semibold mb-1">{label}</p>}
        {payload.map((p, idx) => (
          <p key={idx} className="font-bold flex items-center gap-2" style={{ color: p.color || p.fill }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.fill }}></span>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Skeleton Loading Cards ──────────────────────────────────────────────────
const SkeletonKPICard = () => (
  <div className="glass-card p-6 animate-pulse border-white/10">
    <div className="flex justify-between items-center mb-4">
      <div className="h-3 w-24 bg-white/10 rounded"></div>
      <div className="w-9 h-9 bg-white/10 rounded-xl"></div>
    </div>
    <div className="h-8 w-20 bg-white/10 rounded mb-2"></div>
    <div className="h-3 w-32 bg-white/5 rounded"></div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
const Dashboard = () => {
  const { user } = useAuth();
  const { weather, loading: weatherLoading, error: weatherError, detectAndFetchWeather } = useWeather();
  const { sensorData, loading: iotLoading, error: iotError, stopAutoRefresh, fetchSensorData } = useIoT(true, 3000);

  const [recentHistory, setRecentHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [diseaseHistory, setDiseaseHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const [isAutoRefreshing, setIsAutoRefreshing] = useState(true);

  const toggleAutoRefresh = () => {
    if (isAutoRefreshing) {
      stopAutoRefresh();
      setIsAutoRefreshing(false);
    } else {
      fetchSensorData();
      setIsAutoRefreshing(true);
    }
  };

  // Fetch Dashboard Telemetry Data
  const loadDashboardData = async () => {
    setHistoryLoading(true);
    setApiError(null);
    try {
      const [historyRes, statsRes, diseaseRes] = await Promise.all([
        historyAPI.getHistory({ limit: 5 }),
        historyAPI.getStats(),
        diseaseAPI.getHistory()
      ]);
      setRecentHistory(historyRes.data?.data?.predictions || []);
      setStats(statsRes.data?.data || null);
      setDiseaseHistory(diseaseRes.data?.data || []);
    } catch (error) {
      console.error('[Dashboard] Failed to load telemetry:', error);
      setApiError('Failed to synchronize dashboard telemetry. Please try again.');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    detectAndFetchWeather();

    const timer = setTimeout(() => {
      if (isMounted) {
        loadDashboardData();
      }
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [detectAndFetchWeather]);

  // Derive most predicted crop
  const mostPredicted = stats?.topCrops?.[0] || null;
  const topCropInfo = mostPredicted ? getCropData(mostPredicted._id) : null;

  // Derive Pathology metrics
  const totalDiseaseScans = diseaseHistory.length;
  const infectedCount = diseaseHistory.filter(d => d.status === 'Infected' || d.confidence > 80).length;
  const healthyCount = Math.max(0, totalDiseaseScans - infectedCount);

  // Pie chart data for disease health ratio
  const pieData = [
    { name: 'Healthy Scans', value: healthyCount, color: '#10b981' },
    { name: 'Infected Scans', value: infectedCount, color: '#ef4444' }
  ];

  // Bar chart data for top diseases
  const diseaseCounts = diseaseHistory.reduce((acc, curr) => {
    const name = curr.diseaseName || 'Healthy';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  const barData = Object.keys(diseaseCounts)
    .map(name => ({ name, count: diseaseCounts[name] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } }
  };

  // Time of day greeting
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 pb-12"
    >
      {/* ─── 1. HERO SECTION ─────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="glass-card p-6 md:p-8 relative overflow-hidden border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-full bg-primary-500/10 text-primary-400 border border-primary-500/20 text-xs font-mono font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse"></span>
                AI Platform Operational
              </span>
              <span className="text-xs text-gray-400 font-mono">
                {user?.role === 'admin' ? '🛡️ Administrator Access' : '🌱 Agricultural Specialist'}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight">
              {greeting}, <span className="gradient-text">{user?.name || 'Farmer'}</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1 max-w-2xl">
              Real-time precision crop telemetry, deep learning pathology analytics, and MLOps operational intelligence.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={loadDashboardData}
              disabled={historyLoading}
              className="px-4 py-2.5 bg-surface-800 border border-white/10 hover:bg-surface-700 text-gray-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <FiRefreshCw className={`w-3.5 h-3.5 ${historyLoading ? 'animate-spin' : ''}`} />
              Sync Telemetry
            </button>
            <Link
              to="/predict"
              className="btn-primary py-2.5 px-5 text-xs font-bold font-mono shadow-glow flex items-center gap-2"
            >
              <FiZap className="w-4 h-4" /> Run AI Inference <FiArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </motion.div>

      {/* API Error Notification */}
      {apiError && (
        <motion.div variants={itemVariants} className="glass-card p-4 border-red-500/30 bg-red-500/10 flex justify-between items-center text-red-300 text-xs font-mono">
          <div className="flex items-center gap-2">
            <FiAlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{apiError}</span>
          </div>
          <button onClick={loadDashboardData} className="underline hover:text-white">Retry Sync</button>
        </motion.div>
      )}

      {/* ─── 2. KPI SUMMARY CARDS ─────────────────────────────────────────────── */}
      {historyLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <SkeletonKPICard />
          <SkeletonKPICard />
          <SkeletonKPICard />
          <SkeletonKPICard />
        </div>
      ) : (
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* KPI 1: Total Crop Predictions */}
          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            className="glass-card-hover p-6 border-primary-500/20 flex flex-col justify-between relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">Crop Predictions</span>
              <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center border border-primary-500/20">
                <FiActivity className="text-primary-400 w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <h3 className="text-3xl font-display font-bold text-white font-mono">
                {stats?.totalPredictions || 0}
              </h3>
              <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                +100% Inferences
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-2 font-mono">Total soil-climate predictions logged</p>
          </motion.div>

          {/* KPI 2: Average Confidence */}
          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            className="glass-card-hover p-6 border-secondary-500/20 flex flex-col justify-between relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">Avg Confidence</span>
              <div className="w-10 h-10 rounded-xl bg-secondary-500/10 flex items-center justify-center border border-secondary-500/20">
                <FiTrendingUp className="text-secondary-400 w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <h3 className="text-3xl font-display font-bold text-white font-mono">
                {stats?.avgConfidence || 0}<span className="text-xl text-gray-400 ml-1">%</span>
              </h3>
              <span className="text-[11px] font-mono text-secondary-400 font-bold bg-secondary-500/10 px-2 py-0.5 rounded-md border border-secondary-500/20">
                High Certainty
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-2 font-mono">Mean probability certainty metric</p>
          </motion.div>

          {/* KPI 3: Top Recommended Crop */}
          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            className="glass-card-hover p-6 border-emerald-500/20 flex flex-col justify-between relative overflow-hidden group"
          >
            {topCropInfo && (
              <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full blur-2xl opacity-20 transition-opacity group-hover:opacity-40" style={{ backgroundColor: topCropInfo.color }}></div>
            )}
            <div className="flex justify-between items-start mb-3 relative z-10">
              <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">Top Crop</span>
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                <FiMapPin className="text-emerald-400 w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-3 relative z-10">
              <h3 className="text-2xl font-display font-bold text-white capitalize truncate">
                {mostPredicted?._id || 'None'}
              </h3>
              {topCropInfo && <span className="text-2xl mb-0.5">{topCropInfo.emoji}</span>}
            </div>
            <p className="text-[11px] text-gray-500 mt-2 font-mono relative z-10">Most frequent recommendation</p>
          </motion.div>

          {/* KPI 4: Disease Scans */}
          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            className="glass-card-hover p-6 border-amber-500/20 flex flex-col justify-between relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">Disease Scans</span>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <FiCrosshair className="text-amber-400 w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <h3 className="text-3xl font-display font-bold text-white font-mono">
                {totalDiseaseScans}
              </h3>
              {totalDiseaseScans > 0 && (
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${infectedCount > 0 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                  {infectedCount} Infected
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500 mt-2 font-mono">Pathology scans evaluated</p>
          </motion.div>
        </motion.div>
      )}

      {/* ─── 3. QUICK ACTIONS COMMAND BAR ────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="glass-card p-6 border-white/5">
        <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <FiZap className="text-primary-400" /> Platform Quick Commands
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            to="/predict"
            className="glass-card-hover p-3 rounded-xl border border-white/5 text-center flex flex-col items-center gap-2 group transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-primary-500/10 text-primary-400 flex items-center justify-center group-hover:bg-primary-500 group-hover:text-slate-950 transition-colors">
              <FiZap className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-gray-200 group-hover:text-white">Predict Crop</span>
          </Link>

          <Link
            to="/disease-detection"
            className="glass-card-hover p-3 rounded-xl border border-white/5 text-center flex flex-col items-center gap-2 group transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
              <FiCrosshair className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-gray-200 group-hover:text-white">Disease Scan</span>
          </Link>

          <Link
            to="/analytics"
            className="glass-card-hover p-3 rounded-xl border border-white/5 text-center flex flex-col items-center gap-2 group transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-slate-950 transition-colors">
              <FiPieChart className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-gray-200 group-hover:text-white">Analytics</span>
          </Link>

          {user?.role === 'admin' && (
            <>
              <Link
                to="/admin/operations"
                className="glass-card-hover p-3 rounded-xl border border-white/5 text-center flex flex-col items-center gap-2 group transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-slate-950 transition-colors">
                  <FiTv className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-gray-200 group-hover:text-white">AI Operations</span>
              </Link>

              <Link
                to="/admin/pipeline-orchestrator"
                className="glass-card-hover p-3 rounded-xl border border-white/5 text-center flex flex-col items-center gap-2 group transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                  <FiGitBranch className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-gray-200 group-hover:text-white">Pipeline Engine</span>
              </Link>

              <Link
                to="/admin/governance"
                className="glass-card-hover p-3 rounded-xl border border-white/5 text-center flex flex-col items-center gap-2 group transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                  <FiShield className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-gray-200 group-hover:text-white">Governance</span>
              </Link>
            </>
          )}
        </div>
      </motion.div>

      {/* ─── 4. PHASE 12.6: AI DASHBOARD INTELLIGENCE PANEL ────────────────── */}
      <motion.div variants={itemVariants}>
        <AIInsightsPanel
          weather={weather}
          sensorData={sensorData}
          stats={stats}
          diseaseHistory={diseaseHistory}
          recentHistory={recentHistory}
        />
      </motion.div>

      {/* ─── 5. DISEASE CHARTS SECTION ────────────────────────────────────────── */}
      {totalDiseaseScans > 0 && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Plant Health Ratio */}
          <div className="glass-card p-6 border-white/5 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <FiPieChart className="text-emerald-400" /> Plant Pathology Health Ratio
              </h3>
              <span className="text-[10px] font-mono font-bold bg-white/5 text-gray-400 px-2 py-0.5 rounded">Ratio</span>
            </div>

            <div className="h-56 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold font-mono text-white">{healthyCount}/{totalDiseaseScans}</span>
                <span className="text-[10px] text-gray-400 font-mono">Healthy Scans</span>
              </div>
            </div>

            <div className="flex justify-center gap-6 pt-3 border-t border-white/5 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-gray-300">Healthy ({healthyCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                <span className="text-gray-300">Infected ({infectedCount})</span>
              </div>
            </div>
          </div>

          {/* Top Detected Pathology Infections */}
          <div className="glass-card p-6 border-white/5 lg:col-span-2 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <FiCrosshair className="text-amber-400" /> Top Detected Pathology Infections
              </h3>
              <span className="text-[10px] font-mono text-gray-400">Frequency Distribution</span>
            </div>

            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={100} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#f59e0b" radius={[0, 8, 8, 0]} name="Scans" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-3 border-t border-white/5 flex justify-between items-center text-xs text-gray-400 font-mono">
              <span>Deep Learning Diagnostic Model</span>
              <span className="text-primary-400 flex items-center gap-1"><FiCheckCircle /> ResNet50 Classifier</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── 6. WEATHER & IOT TELEMETRY SECTION ───────────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeatherCard
          weather={weather}
          loading={weatherLoading}
          error={weatherError}
          onDetect={detectAndFetchWeather}
        />
        <SensorPanel
          sensorData={sensorData}
          loading={iotLoading}
          error={iotError}
          isAutoRefreshing={isAutoRefreshing}
          toggleAutoRefresh={toggleAutoRefresh}
        />
      </motion.div>

      {/* ─── 7. RECENT PREDICTION HISTORY ────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-display font-bold text-white tracking-tight flex items-center gap-2">
              <FiClock className="text-primary-400" /> Recent Prediction Log
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Most recent AI crop recommendations</p>
          </div>
          <Link
            to="/history"
            className="text-xs font-mono font-bold text-primary-400 hover:text-primary-300 flex items-center gap-1 group"
          >
            View Full History <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <HistoryTable history={recentHistory} loading={historyLoading} />
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
