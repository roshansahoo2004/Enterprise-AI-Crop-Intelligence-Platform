import React, { useState, useEffect } from 'react';
import { historyAPI } from '../services/api';
import CropHistoryChart from '../components/charts/CropHistoryChart';
import NutrientChart from '../components/charts/NutrientChart';
import WeatherTrendChart from '../components/charts/WeatherTrendChart';
import ConfidenceChart from '../components/charts/ConfidenceChart';
import { FiPieChart, FiBarChart2, FiActivity, FiDroplet } from 'react-icons/fi';

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [recentHistory, setRecentHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [statsRes, historyRes] = await Promise.all([
          historyAPI.getStats(),
          historyAPI.getHistory({ limit: 30 }) // Get last 30 for trends
        ]);
        setStats(statsRes.data.data);
        setRecentHistory(historyRes.data.data.predictions);
      } catch (error) {
        console.error('Failed to fetch analytics', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 animate-spin rounded-full border-t-4 border-b-4 border-primary-500"></div>
          <p className="mt-4 text-gray-400">Compiling analytics...</p>
        </div>
      </div>
    );
  }

  const hasData = stats && stats.totalPredictions > 0;

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center">
        <div className="w-24 h-24 rounded-full bg-surface-800 flex items-center justify-center mb-6 text-gray-500 shadow-inner">
          <FiPieChart className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-display font-bold text-white mb-2">No Data Available</h2>
        <p className="text-gray-400 max-w-md">
          Make a few crop predictions first to unlock advanced analytics, charts, and historical trends.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
          <FiPieChart className="text-primary-400" /> Advanced Analytics
        </h1>
        <p className="text-gray-400">
          Visualize your agricultural data trends and model performance metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Crop Distribution */}
        <div className="glass-card p-6 flex flex-col min-h-[400px]">
          <div className="flex items-center gap-2 mb-6">
            <FiBarChart2 className="text-primary-400" />
            <h2 className="text-lg font-semibold text-white">Recommended Crops Distribution</h2>
          </div>
          <div className="flex-1">
            <CropHistoryChart data={stats.cropDistribution} />
          </div>
        </div>

        {/* Chart 2: Nutrient Radar */}
        <div className="glass-card p-6 flex flex-col min-h-[400px]">
          <div className="flex items-center gap-2 mb-6">
            <FiActivity className="text-green-400" />
            <h2 className="text-lg font-semibold text-white">Average Soil Nutrients Profile</h2>
          </div>
          <div className="flex-1">
            <NutrientChart data={stats.cropDistribution} />
          </div>
        </div>

        {/* Chart 3: Weather Trends */}
        <div className="glass-card p-6 flex flex-col min-h-[400px]">
          <div className="flex items-center gap-2 mb-6">
            <FiDroplet className="text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Environmental Trends (Last 30)</h2>
          </div>
          <div className="flex-1">
            <WeatherTrendChart data={recentHistory} />
          </div>
        </div>

        {/* Chart 4: Confidence Trend */}
        <div className="glass-card p-6 flex flex-col min-h-[400px]">
          <div className="flex items-center gap-2 mb-6">
            <svg className="w-4 h-4 text-secondary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
            <h2 className="text-lg font-semibold text-white">Model Confidence Tracking</h2>
          </div>
          <div className="flex-1">
            <ConfidenceChart data={recentHistory} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
