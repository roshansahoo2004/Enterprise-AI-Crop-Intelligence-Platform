import { FiWifi, FiBattery, FiRefreshCcw, FiPause } from 'react-icons/fi';

const SensorItem = ({ label, value, unit, status }) => {
  const statusStyles = {
    optimal: 'border-primary-500/30 bg-primary-500/10 text-primary-400',
    high: 'border-secondary-500/30 bg-secondary-500/10 text-secondary-400',
    low: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
    acidic: 'border-orange-500/30 bg-orange-500/10 text-orange-400',
    alkaline: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400',
    hot: 'border-red-500/30 bg-red-500/10 text-red-400',
    cold: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
  };

  const currentStyle = statusStyles[status] || statusStyles.optimal;

  return (
    <div className={`rounded-xl border ${currentStyle} p-3 transition-all duration-300`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono font-medium uppercase tracking-wider opacity-80">{label}</span>
        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-white/10 uppercase">{status}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold font-mono">{value}</span>
        <span className="text-xs font-mono opacity-80">{unit}</span>
      </div>
    </div>
  );
};

const SensorPanel = ({ sensorData, loading, error, isAutoRefreshing, toggleAutoRefresh }) => {
  if (loading && !sensorData) {
    return (
      <div className="glass-card flex h-[340px] items-center justify-center p-6 shimmer relative overflow-hidden">
        <p className="text-gray-400 z-10 font-mono text-xs">Connecting to IoT sensor telemetry stream...</p>
      </div>
    );
  }

  if (error && !sensorData) {
    return (
      <div className="glass-card flex h-[340px] flex-col items-center justify-center gap-3 p-6 border-red-500/20 bg-red-500/5">
        <p className="text-red-400 text-xs font-mono text-center">{error}</p>
      </div>
    );
  }

  if (!sensorData) return null;

  const { sensors, deviceInfo } = sensorData;

  return (
    <div className="glass-card flex flex-col h-full overflow-hidden border-white/10">
      <div className="border-b border-white/5 bg-white/[0.02] p-4 flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="relative flex h-3 w-3 items-center justify-center">
            {isAutoRefreshing && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75"></span>}
            <span className={`relative inline-flex h-2 w-2 rounded-full ${isAutoRefreshing ? 'bg-primary-500' : 'bg-gray-500'}`}></span>
          </div>
          <h3 className="font-semibold text-white tracking-wide text-sm">Live Sensor Feed</h3>
          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-mono font-bold">
            Demo Sensor Feed
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-surface-900/50 px-2 py-1 rounded border border-white/5 font-mono">
            <FiWifi className={deviceInfo.signalStrength > -60 ? "text-green-400" : "text-yellow-400"} />
            <span>{deviceInfo.signalStrength}dBm</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-surface-900/50 px-2 py-1 rounded border border-white/5 font-mono">
            <FiBattery className={deviceInfo.battery > 20 ? "text-primary-400" : "text-red-400"} />
            <span>{deviceInfo.battery}%</span>
          </div>
          <button
            onClick={toggleAutoRefresh}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors border border-transparent hover:border-white/10 ml-1"
            title={isAutoRefreshing ? "Pause feed" : "Resume feed"}
          >
            {isAutoRefreshing ? <FiPause className="h-4 w-4" /> : <FiRefreshCcw className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="p-5 flex-1 bg-surface-900/30">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <SensorItem
            label="Nitrogen"
            value={sensors.nitrogen.value}
            unit="mg/kg"
            status={sensors.nitrogen.status}
          />
          <SensorItem
            label="Phosphorus"
            value={sensors.phosphorus.value}
            unit="mg/kg"
            status={sensors.phosphorus.status}
          />
          <SensorItem
            label="Potassium"
            value={sensors.potassium.value}
            unit="mg/kg"
            status={sensors.potassium.status}
          />
          <SensorItem
            label="Soil Moist."
            value={sensors.soilMoisture.value}
            unit="%"
            status={sensors.soilMoisture.status}
          />
          <SensorItem
            label="Soil Temp"
            value={sensors.temperature.value}
            unit="°C"
            status={sensors.temperature.status}
          />
          <SensorItem
            label="Soil pH"
            value={sensors.ph.value}
            unit="pH"
            status={sensors.ph.status}
          />
        </div>
      </div>

      <div className="bg-surface-950 p-2 text-center text-[10px] text-gray-500 uppercase font-mono tracking-widest border-t border-white/5 flex justify-between px-4">
        <span>Device ID: {deviceInfo.deviceId}</span>
        <span>FW: {deviceInfo.firmware}</span>
        <span className="text-blue-400/80 font-bold">ESP32 / MQTT Ready</span>
      </div>
    </div>
  );
};

export default SensorPanel;
