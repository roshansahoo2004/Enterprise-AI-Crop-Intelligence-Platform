import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useWeather from '../hooks/useWeather';
import useIoT from '../hooks/useIoT';
import { historyAPI, diseaseAPI } from '../services/api';
import WeatherCard from '../components/WeatherCard';
import SensorPanel from '../components/SensorPanel';
import HistoryTable from '../components/HistoryTable';
import { getCropData } from '../utils/cropData';
import { FiArrowRight, FiActivity, FiMapPin, FiTrendingUp, FiCrosshair, FiPieChart } from 'react-icons/fi';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const { weather, loading: weatherLoading, error: weatherError, detectAndFetchWeather } = useWeather();
  const { sensorData, loading: iotLoading, error: iotError, stopAutoRefresh, fetchSensorData } = useIoT(true, 3000);
  
  const [recentHistory, setRecentHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [diseaseHistory, setDiseaseHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Use a ref to track if we should auto-refresh IoT data
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(true);

  const toggleAutoRefresh = () => {
    if (isAutoRefreshing) {
      stopAutoRefresh();
      setIsAutoRefreshing(false);
    } else {
      fetchSensorData();
      // We can't restart the interval easily without refactoring the hook to expose a start method,
      // but for this UI, we can just fetch once when toggled on.
      setIsAutoRefreshing(true);
    }
  };

  useEffect(() => {
    // Initial weather fetch
    detectAndFetchWeather();

    // Fetch history
    const fetchDashboardData = async () => {
      try {
        const [historyRes, statsRes, diseaseRes] = await Promise.all([
          historyAPI.getHistory({ limit: 5 }),
          historyAPI.getStats(),
          diseaseAPI.getHistory()
        ]);
        setRecentHistory(historyRes.data.data.predictions);
        setStats(statsRes.data.data);
        setDiseaseHistory(diseaseRes.data.data);
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchDashboardData();
  }, [detectAndFetchWeather]);

  // Welcome message based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // Calculate most common crop
  const mostPredicted = stats?.cropDistribution?.[0];
  const topCropInfo = mostPredicted ? getCropData(mostPredicted._id) : null;

  // Disease Stats
  const totalDiseaseScans = diseaseHistory.length;
  const healthyCount = diseaseHistory.filter(d => d.disease === 'Healthy').length;
  const infectedCount = totalDiseaseScans - healthyCount;

  const healthData = [
    { name: 'Healthy', value: healthyCount, color: '#10b981' },
    { name: 'Infected', value: infectedCount, color: '#ef4444' }
  ];

  // Group diseases for chart
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-1">
            {greeting}, <span className="gradient-text">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-gray-400">Here's your agricultural overview for today.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/disease-detection" className="btn-secondary py-2.5 px-5 flex items-center gap-2 shrink-0">
            <FiCrosshair /> Disease Scan
          </Link>
          <Link to="/predict" className="btn-primary py-2.5 px-5 flex items-center gap-2 shrink-0">
            <FiActivity /> New Prediction
          </Link>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 flex flex-col justify-center">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-gray-400 font-medium text-sm">Crop Predictions</h3>
            <span className="p-2 bg-primary-500/10 text-primary-400 rounded-lg"><FiActivity /></span>
          </div>
          <p className="text-3xl font-display font-bold text-white">
            {stats?.totalPredictions || 0}
          </p>
        </div>

        <div className="glass-card p-6 flex flex-col justify-center">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-gray-400 font-medium text-sm">Avg Confidence</h3>
            <span className="p-2 bg-secondary-500/10 text-secondary-400 rounded-lg"><FiTrendingUp /></span>
          </div>
          <p className="text-3xl font-display font-bold text-white">
            {stats?.avgConfidence || 0}<span className="text-xl text-gray-400 ml-1">%</span>
          </p>
        </div>

        <div className="glass-card p-6 flex flex-col justify-center relative overflow-hidden group">
          {topCropInfo && (
            <div className="absolute -right-4 -bottom-4 w-32 h-32 rounded-full blur-2xl opacity-20 transition-opacity group-hover:opacity-40" style={{ backgroundColor: topCropInfo.color }}></div>
          )}
          <div className="flex justify-between items-start mb-2 relative z-10">
            <h3 className="text-gray-400 font-medium text-sm">Top Crop</h3>
            <span className="p-2 bg-white/5 text-gray-300 rounded-lg"><FiMapPin /></span>
          </div>
          <div className="flex items-end gap-3 relative z-10">
            <p className="text-2xl font-display font-bold text-white capitalize truncate">
              {mostPredicted?._id || 'None'}
            </p>
            {topCropInfo && <span className="text-2xl mb-0.5">{topCropInfo.emoji}</span>}
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col justify-center">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-gray-400 font-medium text-sm">Disease Scans</h3>
            <span className="p-2 bg-orange-500/10 text-orange-400 rounded-lg"><FiCrosshair /></span>
          </div>
          <div className="flex items-end gap-3">
            <p className="text-3xl font-display font-bold text-white">
              {totalDiseaseScans}
            </p>
            {totalDiseaseScans > 0 && (
                <span className={`text-sm mb-1 font-medium ${infectedCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {infectedCount} issues
                </span>
            )}
          </div>
        </div>
      </div>

      {/* Disease Charts Section */}
      {totalDiseaseScans > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="glass-card p-6 flex flex-col min-h-[300px] lg:col-span-1">
                <div className="flex items-center gap-2 mb-4">
                    <FiPieChart className="text-primary-400" />
                    <h3 className="text-white font-semibold">Plant Health Ratio</h3>
                </div>
                <div className="flex-1 min-h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={healthData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {healthData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <RechartsTooltip 
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '0.5rem' }}
                                itemStyle={{ color: '#fff' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 text-sm mt-2">
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                        <span className="text-gray-300">Healthy ({healthyCount})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-red-500"></span>
                        <span className="text-gray-300">Infected ({infectedCount})</span>
                    </div>
                </div>
            </div>

            <div className="glass-card p-6 flex flex-col min-h-[300px] lg:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                    <FiTrendingUp className="text-secondary-400" />
                    <h3 className="text-white font-semibold">Top Detected Diseases</h3>
                </div>
                {diseaseChartData.length > 0 ? (
                    <div className="flex-1 min-h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={diseaseChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} width={120} />
                                <RechartsTooltip 
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '0.5rem' }}
                                />
                                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                        No infections detected yet.
                    </div>
                )}
            </div>
        </div>
      )}

      {/* Weather and IoT Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
      </div>

      {/* Recent History */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-display font-semibold text-white">Recent Crop Predictions</h2>
          <Link to="/history" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors">
            View All <FiArrowRight />
          </Link>
        </div>
        <HistoryTable history={recentHistory} loading={historyLoading} />
      </div>
    </div>
  );
};

export default Dashboard;
