import { useState, useEffect, useCallback } from 'react';
import {
  FiTrendingUp, FiDollarSign, FiPercent,
  FiZap, FiLayers, FiCalendar
} from 'react-icons/fi';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip
} from 'recharts';
import expansionApi from '../services/expansionApi';
import notify from '../utils/toast';
import {
  PageContainer, PageHeader, StatCard, SectionCard,
  ActionButton, DataTable
} from '../components/ui';

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

const YieldPredictionPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);

  const [formData, setFormData] = useState({
    cropName: 'Rice',
    fieldAreaHectares: 2.5,
    nitrogen: 80,
    phosphorus: 45,
    potassium: 50,
    soilMoisture: 65,
    temperature: 28
  });

  const [latestPrediction, setLatestPrediction] = useState(null);

  const fetchYieldHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await expansionApi.getYieldHistory();
      setHistory(res.data.data);
      if (res.data.data.length > 0) {
        setLatestPrediction(res.data.data[0]);
      }
    } catch (err) {
      console.error('[Yield History Error]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(() => {
      if (mounted) fetchYieldHistory();
    }, 0);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [fetchYieldHistory]);

  const handlePredict = async (e) => {
    e.preventDefault();
    setPredicting(true);

    try {
      const res = await expansionApi.predictYield(formData);
      setLatestPrediction(res.data.data);
      setHistory(prev => [res.data.data, ...prev]);
      notify.success(`Yield predicted: ${res.data.data.totalPredictedYieldTons} Tons (${res.data.data.confidence}% confidence)`);
    } catch (err) {
      console.error('[Predict Error]', err);
      notify.error(err.response?.data?.message || 'Failed to estimate yield');
    } finally {
      setPredicting(false);
    }
  };

  const columns = [
    {
      header: 'Date & Time',
      key: 'createdAt',
      render: (row) => <span className="font-mono text-gray-300">{new Date(row.createdAt).toLocaleDateString()}</span>
    },
    {
      header: 'Crop Target',
      key: 'cropName',
      render: (row) => <span className="font-bold text-white capitalize">{row.cropName}</span>
    },
    {
      header: 'Area (ha)',
      key: 'fieldAreaHectares',
      render: (row) => <span className="font-mono text-gray-300">{row.fieldAreaHectares} ha</span>
    },
    {
      header: 'Yield (Tons/ha)',
      key: 'predictedYieldTonsPerHectare',
      render: (row) => <span className="font-mono text-emerald-400 font-bold">{row.predictedYieldTonsPerHectare} T/ha</span>
    },
    {
      header: 'Est. Revenue ($)',
      key: 'estimatedRevenueUsd',
      render: (row) => <span className="font-mono text-primary-400 font-bold">${row.estimatedRevenueUsd?.toLocaleString()}</span>
    },
    {
      header: 'Net Profit ($)',
      key: 'estimatedProfitUsd',
      align: 'right',
      render: (row) => <span className="font-mono text-secondary-400 font-bold">${row.estimatedProfitUsd?.toLocaleString()}</span>
    }
  ];

  const chartData = history.slice(0, 7).reverse().map(h => ({
    name: h.cropName.toUpperCase(),
    yield: h.totalPredictedYieldTons,
    revenue: h.estimatedRevenueUsd
  }));

  return (
    <PageContainer>
      <PageHeader
        title="AI Yield & Profit Estimation Engine"
        subtitle="Machine learning crop harvest volume, gross revenue, and profit margin estimation based on soil N-P-K & weather telemetry."
        icon={FiTrendingUp}
        statusBadge="● ML Model Active"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Est. Total Harvest Yield"
          value={latestPrediction?.totalPredictedYieldTons || '11.2'}
          unit="Tons"
          icon={FiTrendingUp}
          trend={`${latestPrediction?.predictedYieldTonsPerHectare || 4.5} T/ha`}
          trendType="up"
          subtitle="Estimated tonnage yield"
          color="emerald"
        />

        <StatCard
          label="Estimated Gross Revenue"
          value={`$${latestPrediction?.estimatedRevenueUsd?.toLocaleString() || '3,580'}`}
          icon={FiDollarSign}
          trend="Market Rate"
          trendType="up"
          subtitle="Based on current market price"
          color="primary"
        />

        <StatCard
          label="Estimated Net Profit"
          value={`$${latestPrediction?.estimatedProfitUsd?.toLocaleString() || '2,450'}`}
          icon={FiDollarSign}
          trend="High Margin"
          trendType="up"
          subtitle="Net return after cultivation cost"
          color="secondary"
        />

        <StatCard
          label="Model Certainty Score"
          value={`${latestPrediction?.confidence || 93.4}%`}
          icon={FiPercent}
          trend="High Certainty"
          trendType="up"
          subtitle="Random Forest Confidence"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Yield Form */}
        <SectionCard
          title="Run Yield Inference"
          subtitle="Input field dimensions & soil parameters"
          icon={FiZap}
        >
          <form onSubmit={handlePredict} className="space-y-4">
            <div>
              <label className="text-xs font-mono text-gray-400 block mb-1">Crop Type</label>
              <select
                value={formData.cropName}
                onChange={e => setFormData({ ...formData, cropName: e.target.value })}
                className="w-full bg-surface-900 border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono focus:border-primary-500 outline-none"
              >
                <option value="Rice">Rice (Paddy)</option>
                <option value="Maize">Maize (Corn)</option>
                <option value="Wheat">Wheat</option>
                <option value="Cotton">Cotton</option>
                <option value="Sugarcane">Sugarcane</option>
                <option value="Chickpea">Chickpea</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-gray-400 block mb-1">Field Area (Hectares)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="50"
                value={formData.fieldAreaHectares}
                onChange={e => setFormData({ ...formData, fieldAreaHectares: parseFloat(e.target.value) || 1.0 })}
                className="w-full bg-surface-900 border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono focus:border-primary-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-mono text-gray-400 block mb-1">Nitrogen</label>
                <input
                  type="number"
                  value={formData.nitrogen}
                  onChange={e => setFormData({ ...formData, nitrogen: parseInt(e.target.value) || 0 })}
                  className="w-full bg-surface-900 border border-white/10 rounded-xl p-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-gray-400 block mb-1">Phosphorus</label>
                <input
                  type="number"
                  value={formData.phosphorus}
                  onChange={e => setFormData({ ...formData, phosphorus: parseInt(e.target.value) || 0 })}
                  className="w-full bg-surface-900 border border-white/10 rounded-xl p-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-gray-400 block mb-1">Potassium</label>
                <input
                  type="number"
                  value={formData.potassium}
                  onChange={e => setFormData({ ...formData, potassium: parseInt(e.target.value) || 0 })}
                  className="w-full bg-surface-900 border border-white/10 rounded-xl p-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            <ActionButton
              type="submit"
              variant="primary"
              size="md"
              icon={FiZap}
              loading={predicting}
              className="w-full justify-center"
            >
              Calculate Yield & Profit
            </ActionButton>
          </form>
        </SectionCard>

        {/* Yield History Bar Chart */}
        <SectionCard
          title="Recent Harvest Tonnage Analytics"
          subtitle="Tonnage yields recorded across recent runs"
          icon={FiLayers}
          className="lg:col-span-2"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} unit="T" />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar dataKey="yield" name="Total Yield (Tons)" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      {/* Yield History Table */}
      <SectionCard
        title="Yield & Revenue Estimation Log"
        subtitle="Historical ML prediction entries"
        icon={FiCalendar}
      >
        <DataTable
          columns={columns}
          data={history}
          loading={loading}
          emptyTitle="No Yield Predictions Logged"
          emptyDescription="Submit the yield form above to generate your first harvest tonnage estimate."
          keyField="_id"
        />
      </SectionCard>
    </PageContainer>
  );
};

export default YieldPredictionPage;
