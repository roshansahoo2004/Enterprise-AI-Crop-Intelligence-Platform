import { useState, useEffect, useCallback } from 'react';
import {
  FiCalendar, FiCheckCircle, FiClock,
  FiDroplet, FiShield, FiTrendingUp
} from 'react-icons/fi';
import expansionApi from '../services/expansionApi';
import { PageContainer, PageHeader, SectionCard, StatCard } from '../components/ui';

const CropCalendarPage = () => {
  const [selectedCrop, setSelectedCrop] = useState('Rice');
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedule = useCallback(async (crop) => {
    setLoading(true);
    try {
      const res = await expansionApi.getCropSchedule(crop);
      setSchedule(res.data.data);
    } catch (err) {
      console.error('[Crop Calendar Fetch Error]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(() => {
      if (mounted) fetchSchedule(selectedCrop);
    }, 0);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [fetchSchedule, selectedCrop]);

  return (
    <PageContainer>
      <PageHeader
        title="Smart Crop Lifecycle & Agronomic Calendar"
        subtitle="Automated 6-stage crop growth timeline with weather-aware irrigation schedules, N-P-K fertilizer top dressing dates, and disease inspection alerts."
        icon={FiCalendar}
        statusBadge="● Automated Schedule Active"
      />

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Active Growth Phase"
          value="Phase 2"
          icon={FiCalendar}
          trend="Day 22 / 120"
          trendType="up"
          subtitle="Seedling Transplanting Stage"
          color="emerald"
        />

        <StatCard
          label="Next Irrigation Window"
          value="In 2 Days"
          icon={FiDroplet}
          trend="45 Mins Duration"
          trendType="up"
          subtitle="Based on 65% soil moisture"
          color="cyan"
        />

        <StatCard
          label="Next Disease Inspection"
          value="In 5 Days"
          icon={FiShield}
          trend="Leaf Blast Check"
          trendType="up"
          subtitle="Pathology leaf scan due"
          color="amber"
        />

        <StatCard
          label="Est. Days to Harvest"
          value="98 Days"
          icon={FiTrendingUp}
          trend="Target: Oct 28"
          trendType="up"
          subtitle="Estimated harvest readiness"
          color="primary"
        />
      </div>

      {/* Crop Selector Header Bar */}
      <div className="glass-card p-5 border-white/10 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h3 className="text-base font-bold text-white font-mono">Select Target Crop Lifecycle</h3>
          <p className="text-xs text-gray-400 font-mono mt-0.5">Switch crop species to view specialized agronomic timelines</p>
        </div>

        <div className="flex items-center gap-2">
          {['Rice', 'Maize'].map((crop) => (
            <button
              key={crop}
              onClick={() => setSelectedCrop(crop)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                selectedCrop === crop
                  ? 'bg-primary-500 text-slate-950 shadow-glow'
                  : 'bg-surface-800 text-gray-300 hover:bg-surface-700 border border-white/10'
              }`}
            >
              {crop} Lifecycle
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Timeline */}
      <SectionCard
        title={`${selectedCrop} Agronomic Lifecycle Timeline`}
        subtitle="Chronological phases with recommended farming actions"
        icon={FiClock}
      >
        {loading ? (
          <div className="p-8 text-center text-gray-400 font-mono text-xs animate-pulse">Loading lifecycle schedule...</div>
        ) : (
          <div className="space-y-6 relative before:absolute before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-white/10">
            {schedule.map((item, idx) => (
              <div key={idx} className="flex items-start gap-4 relative z-10">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 border shadow-lg ${
                    item.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
                    item.status === 'Active' ? 'bg-primary-500/20 text-primary-400 border-primary-500/40 ring-4 ring-primary-500/20 animate-pulse' :
                    'bg-surface-800 text-gray-400 border-white/10'
                  }`}
                >
                  {item.icon}
                </div>

                <div className="flex-1 glass-card p-5 border-white/5 space-y-2">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <h4 className="text-sm font-bold text-white font-mono">{item.phase}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-400 bg-surface-900 px-2.5 py-1 rounded border border-white/5">
                        {item.duration}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        item.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        item.status === 'Active' ? 'bg-primary-500/10 text-primary-400 border-primary-500/20' :
                        'bg-gray-500/10 text-gray-400 border-gray-500/20'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed font-sans">{item.action}</p>

                  <div className="pt-2 flex items-center gap-4 text-[11px] text-gray-400 font-mono border-t border-white/5">
                    <span className="flex items-center gap-1"><FiCheckCircle className="text-emerald-400" /> Agronomic Directive</span>
                    <span className="flex items-center gap-1"><FiDroplet className="text-cyan-400" /> Weather-Aware</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </PageContainer>
  );
};

export default CropCalendarPage;
