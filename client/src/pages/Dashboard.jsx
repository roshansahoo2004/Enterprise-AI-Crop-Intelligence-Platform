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

    const runFetch = async () => {
      try {
        const [historyRes, statsRes, diseaseRes] = await Promise.all([
          historyAPI.getHistory({ limit: 5 }),
          historyAPI.getStats(),
          diseaseAPI.getHistory()
        ]);
        if (isMounted) {
          setRecentHistory(historyRes.data?.data?.predictions || []);
          setStats(statsRes.data?.data || null);
          setDiseaseHistory(diseaseRes.data?.data || []);
          setHistoryLoading(false);
        }
      } catch (error) {
        console.error('[Dashboard] Failed to load telemetry:', error);
        if (isMounted) {
          setApiError('Failed to synchronize dashboard telemetry. Please try again.');
          setHistoryLoading(false);
        }
      }
    };

    runFetch();
    return () => { isMounted = false; };
  }, [detectAndFetchWeather]);

  // Greeting by Time of Day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // Compute stats
  const mostPredicted = stats?.cropDistribution?.[0];
  const topCropInfo = mostPredicted ? getCropData(mostPredicted._id) : null;

  const totalDiseaseScans = diseaseHistory.length;
  const healthyCount = diseaseHistory.filter(d => d.disease === 'Healthy').length;
  const infectedCount = totalDiseaseScans - healthyCount;

  const healthData = [
    { name: 'Healthy', value: healthyCount, color: '#10b981' },
    { name: 'Infected', value: infectedCount, color: '#ef4444' }
  ];

  const diseaseCounts = {};
  diseaseHistory.forEach(d => {
    if (d.disease !== 'Healthy') {
      diseaseCounts[d.disease] = (diseaseCounts[d.disease] || 0) + 1;
    }
  });
  const diseaseChartData = Object.entries(diseaseCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Framer Motion Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 pb-12"
    >
      {/* ─── 1. ENTERPRISE HERO SECTION ───────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="relative overflow-hidden glass-card p-8 border-primary-500/20 bg-gradient-to-r from-surface-900/90 via-surface-950/95 to-primary-950/40">
        <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-16 -top-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                AI Platform Operational
              </span>
              <span className="px-3 py-1 rounded-full bg-surface-800 text-gray-400 border border-white/10 text-xs font-mono">
                {user?.role === 'admin' ? '🛡️ Administrator Access' : '🌱 Agricultural Specialist'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">
              {greeting}, <span className="gradient-text">{user?.name?.split(' ')[0] || 'User'}</span>
            </h1>

            <p className="text-gray-400 text-sm max-w-2xl leading-relaxed">
              Real-time agricultural intelligence overview — monitoring IoT soil telemetry, ML crop recommendation engine, plant pathology scans, and system health status.
            </p>
          </div>

          {/* Quick Action Triggers */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/disease-detection"
              className="px-4 py-2.5 bg-surface-800 border border-white/10 hover:bg-surface-700 text-gray-200 rounded-xl font-semibold text-xs transition-all flex items-center gap-2 shadow-lg hover:border-primary-500/40"
            >
              <FiCrosshair className="text-secondary-400" /> Disease Scan
            </Link>
            <Link
              to="/predict"
              className="px-5 py-2.5 bg-primary-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-primary-400 transition-all flex items-center gap-2 shadow-lg shadow-primary-500/20 hover:scale-105"
            >
              <FiZap /> Recommend Crop
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ─── ERROR STATE DISPLAY ────────────────────────────────────────────── */}
      {apiError && (
        <motion.div variants={itemVariants} className="glass-card p-6 border-red-500/30 bg-red-500/5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FiAlertCircle className="text-red-400 w-6 h-6 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-white">Telemetry Synchronization Notice</h4>
              <p className="text-xs text-gray-400">{apiError}</p>
            </div>
          </div>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold hover:bg-red-500/30 transition-all flex items-center gap-2"
          >
            <FiRefreshCw className="w-3.5 h-3.5" /> Retry Sync
          </button>
        </motion.div>
      )}

      {/* ─── 2. UPGRADED KPI SUMMARY CARDS ──────────────────────────────────── */}
      {historyLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <SkeletonKPICard key={i} />)}
        </div>
      ) : (
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* KPI 1: Crop Predictions */}
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
                +12% Total
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-2 font-mono">Total inference predictions generated</p>
          </motion.div>

          {/* KPI 2: Avg Confidence */}
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
            <div className="w-8 h-8 rounded-lg bg-secondary-500/10 text-secondary-400 flex items-center justify-center group-hover:bg-secondary-500 group-hover:text-slate-950 transition-colors">
              <FiCrosshair className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-gray-200 group-hover:text-white">Disease Scan</span>
          </Link>

          <Link
            to="/analytics"
            className="glass-card-hover p-3 rounded-xl border border-white/5 text-center flex flex-col items-center gap-2 group transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
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

      {/* ─── 4. DISEASE CHARTS SECTION ────────────────────────────────────────── */}
      {totalDiseaseScans > 0 && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Plant Health Ratio */}
          <div className="glass-card p-6 flex flex-col min-h-[320px] lg:col-span-1 border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <FiPieChart className="text-primary-400" />
              <h3 className="text-white font-semibold text-sm">Plant Health Ratio</h3>
            </div>
            <div className="flex-1 min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={healthData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {healthData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 text-xs font-mono mt-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-gray-300">Healthy ({healthyCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                <span className="text-gray-300">Infected ({infectedCount})</span>
              </div>
            </div>
          </div>

          {/* Top Detected Diseases */}
          <div className="glass-card p-6 flex flex-col min-h-[320px] lg:col-span-2 border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <FiTrendingUp className="text-secondary-400" />
              <h3 className="text-white font-semibold text-sm">Top Detected Pathology Infections</h3>
            </div>
            {diseaseChartData.length > 0 ? (
              <div className="flex-1 min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={diseaseChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={130} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 text-xs font-mono py-8">
                <FiCheckCircle className="w-8 h-8 text-emerald-400/50 mb-2" />
                No plant infections detected in recent scans.
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ─── 5. WEATHER & IOT SENSOR SECTION ─────────────────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <WeatherCard
            weather={weather}
            loading={weatherLoading}
            error={weatherError}
            onDetect={detectAndFetchWeather}
          />
        </div>
        <div className="lg:col-span-2">
          <SensorPanel
            sensorData={sensorData}
            loading={iotLoading}
            error={iotError}
            isAutoRefreshing={isAutoRefreshing}
            toggleAutoRefresh={toggleAutoRefresh}
          />
        </div>
      </motion.div>

      {/* ─── 6. RECENT CROP PREDICTIONS TABLE ────────────────────────────────── */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
              <FiClock className="text-primary-400" /> Recent Crop Predictions
            </h2>
            <p className="text-xs text-gray-400">Historical inference record of generated crop recommendations</p>
          </div>
          <Link to="/history" className="text-xs font-semibold text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors">
            View Full History <FiArrowRight />
          </Link>
        </div>

        {historyLoading ? (
          <div className="glass-card p-6 animate-pulse">
            <div className="h-4 w-48 bg-white/10 rounded mb-4"></div>
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-white/5 rounded-xl"></div>
              ))}
            </div>
          </div>
        ) : recentHistory.length === 0 ? (
          <div className="glass-card p-12 text-center flex flex-col items-center justify-center gap-3">
            <FiActivity className="w-10 h-10 text-gray-600" />
            <p className="text-gray-400 text-sm">No crop predictions recorded yet.</p>
            <Link to="/predict" className="px-4 py-2 bg-primary-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-primary-400 transition-all">
              Generate First Prediction
            </Link>
          </div>
        ) : (
          <HistoryTable history={recentHistory} loading={historyLoading} />
        )}
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
