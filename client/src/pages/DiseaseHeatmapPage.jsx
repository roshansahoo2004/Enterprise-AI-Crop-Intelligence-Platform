import { useState, useEffect, useCallback } from 'react';
import {
  FiMapPin, FiShield, FiCrosshair,
  FiFilter
} from 'react-icons/fi';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip
} from 'recharts';
import expansionApi from '../services/expansionApi';
import {
  PageContainer, PageHeader, StatCard, SectionCard,
  DataTable
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

const DiseaseHeatmapPage = () => {
  const [regions, setRegions] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('All');

  const fetchHeatmapData = useCallback(async () => {
    setLoading(true);
    try {
      const [regRes, trdRes] = await Promise.all([
        expansionApi.getHeatmapRegions(),
        expansionApi.getHeatmapTrends()
      ]);
      setRegions(regRes.data.data);
      setTrends(trdRes.data.data);
    } catch (err) {
      console.error('[Heatmap Fetch Error]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(() => {
      if (mounted) fetchHeatmapData();
    }, 0);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [fetchHeatmapData]);

  const filteredRegions = selectedFilter === 'All'
    ? regions
    : regions.filter(r => r.riskLevel === selectedFilter);

  const columns = [
    {
      header: 'Agricultural Zone / Region',
      key: 'region',
      render: (row) => (
        <div className="flex items-center gap-2">
          <FiMapPin className="text-primary-400 shrink-0" />
          <span className="font-bold text-white font-mono">{row.region}</span>
        </div>
      )
    },
    {
      header: 'State Jurisdiction',
      key: 'state',
      render: (row) => <span className="text-gray-300 font-mono">{row.state}</span>
    },
    {
      header: 'Primary Leaf Disease',
      key: 'primaryDisease',
      render: (row) => <span className="font-mono text-amber-400 font-bold">{row.primaryDisease}</span>
    },
    {
      header: 'Active Outbreaks',
      key: 'activeOutbreaks',
      render: (row) => <span className="font-mono text-white font-bold">{row.activeOutbreaks} Areas</span>
    },
    {
      header: 'Risk Level',
      key: 'riskLevel',
      align: 'right',
      render: (row) => (
        <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border ${
          row.riskLevel === 'Critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
          row.riskLevel === 'High' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
          row.riskLevel === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        }`}>
          {row.riskLevel}
        </span>
      )
    }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="National Crop Disease Pathology Heatmap"
        subtitle="Interactive regional disease outbreak mapping, severity risk levels, and weekly pathology surge trends across agricultural zones."
        icon={FiCrosshair}
        statusBadge="● Real-Time Epidemic Surveillance"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Active Outbreak Clusters"
          value={loading ? '...' : '139'}
          unit="Zones"
          icon={FiCrosshair}
          trend="8 Regions Tracked"
          trendType="up"
          subtitle="Monitored agricultural zones"
          color="red"
        />

        <StatCard
          label="Dominant Pathology"
          value="Leaf Blight"
          icon={FiShield}
          trend="42% Frequency"
          trendType="up"
          subtitle="Most widespread pathogen"
          color="amber"
        />

        <StatCard
          label="Highest Risk Zone"
          value="West Bengal"
          icon={FiMapPin}
          trend="Critical Status"
          trendType="down"
          subtitle="Jute & Rice cultivation region"
          color="orange"
        />

        <StatCard
          label="Surveillance Coverage"
          value="100%"
          icon={FiShield}
          trend="Active Scanning"
          trendType="up"
          subtitle="ResNet50 Deep Diagnostic Stream"
          color="emerald"
        />
      </div>

      {/* Regional Visual Map Representation & Filter Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Visual Heatmap Grid */}
        <SectionCard
          title="Regional Outbreak Severity Matrix"
          subtitle="Live risk level mapping across zones"
          icon={FiMapPin}
          className="lg:col-span-2"
          action={
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-400 w-3.5 h-3.5" />
              <select
                value={selectedFilter}
                onChange={e => setSelectedFilter(e.target.value)}
                className="bg-surface-900 border border-white/10 rounded-lg text-xs font-mono text-white p-1"
              >
                <option value="All">All Risk Levels</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredRegions.map((r, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border flex flex-col justify-between ${
                  r.riskLevel === 'Critical' ? 'bg-red-500/10 border-red-500/30' :
                  r.riskLevel === 'High' ? 'bg-orange-500/10 border-orange-500/30' :
                  r.riskLevel === 'Medium' ? 'bg-amber-500/10 border-amber-500/30' :
                  'bg-emerald-500/10 border-emerald-500/30'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-xs font-bold text-white font-mono">{r.region}</h4>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    r.riskLevel === 'Critical' ? 'bg-red-500/20 text-red-300 border-red-500/40' :
                    r.riskLevel === 'High' ? 'bg-orange-500/20 text-orange-300 border-orange-500/40' :
                    r.riskLevel === 'Medium' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                    'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}>
                    {r.riskLevel}
                  </span>
                </div>
                <p className="text-xs text-gray-300 font-mono mb-2">Primary: {r.primaryDisease}</p>
                <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono pt-2 border-t border-white/5">
                  <span>Outbreaks: <strong>{r.activeOutbreaks}</strong></span>
                  <span>Lat: {r.lat}° N</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Weekly Disease Trend Chart */}
        <SectionCard
          title="4-Week Pathology Surge Trend"
          subtitle="Infection incidence counts by week"
          icon={FiShield}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar dataKey="leafBlight" name="Leaf Blight" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="stemRot" name="Stem Rot" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      {/* Regional Table */}
      <SectionCard
        title="Regional Surveillance Outbreak Registry"
        subtitle="Detailed agricultural zone disease metrics"
        icon={FiCrosshair}
      >
        <DataTable
          columns={columns}
          data={regions}
          loading={loading}
          emptyTitle="No Heatmap Data Loaded"
          emptyDescription="Regional surveillance metrics will display here."
          keyField="region"
        />
      </SectionCard>
    </PageContainer>
  );
};

export default DiseaseHeatmapPage;
