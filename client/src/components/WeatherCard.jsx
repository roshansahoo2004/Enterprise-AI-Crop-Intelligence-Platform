import { FiThermometer, FiDroplet, FiCloudRain, FiWind, FiMapPin, FiRefreshCw, FiCheckCircle } from 'react-icons/fi';

const WeatherCard = ({ weather, loading, error, onDetect }) => {
  if (loading && !weather) {
    return (
      <div className="glass-card flex h-48 items-center justify-center p-6 shimmer relative overflow-hidden">
        <div className="flex items-center gap-2 text-gray-400 z-10 font-mono text-xs">
          <FiRefreshCw className="animate-spin text-primary-400" /> Fetching real-time atmospheric telemetry...
        </div>
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div className="glass-card flex h-48 flex-col items-center justify-center gap-3 p-6 border-red-500/20 bg-red-500/5">
        <p className="text-red-400 text-xs font-mono text-center">{error}</p>
        <button
          onClick={() => onDetect && onDetect(true)}
          className="px-3 py-1.5 bg-red-500/20 text-red-300 rounded-lg text-xs font-mono border border-red-500/30 hover:bg-red-500/30 transition-all flex items-center gap-1.5"
        >
          <FiRefreshCw /> Retry Geolocation
        </button>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="glass-card flex h-48 flex-col items-center justify-center gap-4 p-6 bg-gradient-to-br from-surface-800 to-surface-900 border border-white/5">
        <div className="w-12 h-12 rounded-2xl bg-surface-700 flex items-center justify-center text-primary-400">
          <FiCloudRain className="w-6 h-6" />
        </div>
        <button
          onClick={() => onDetect && onDetect(true)}
          className="btn-primary py-2 px-6 text-xs font-bold font-mono shadow-glow flex items-center gap-2"
        >
          <FiMapPin /> Detect Live Location
        </button>
      </div>
    );
  }

  const formattedTime = weather.timestamp
    ? new Date(weather.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Just Now';

  return (
    <div className="glass-card-hover p-6 relative overflow-hidden group h-full flex flex-col justify-between border-white/10">
      {/* Background decoration */}
      <div className="absolute -right-8 -top-8 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-500"></div>

      <div className="flex justify-between items-start relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-gray-300 text-sm font-semibold flex items-center gap-1.5 font-sans">
              <FiMapPin className="text-primary-400 shrink-0" />
              {weather.location}{weather.country ? `, ${weather.country}` : ''}
            </h3>
            {weather.isLive ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                <FiCheckCircle className="w-2.5 h-2.5" /> Live API
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 text-[10px] font-mono font-bold">
                Demo Location
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-2">
            <div>
              <p className="text-3xl font-display font-bold text-white tracking-tight font-mono">
                {weather.temperature}°<span className="text-xl text-gray-400 font-normal">C</span>
              </p>
              <p className="text-xs text-gray-400 capitalize font-mono mt-0.5">{weather.description}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <button
            onClick={() => onDetect && onDetect(true)}
            disabled={loading}
            className="text-xs bg-surface-800 hover:bg-surface-700 text-gray-300 px-3 py-1.5 rounded-xl border border-white/10 transition-colors flex items-center gap-1.5 font-mono disabled:opacity-50"
            title="Refresh weather data"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <span className="text-[10px] text-gray-500 font-mono">Updated: {formattedTime}</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-6 relative z-10">
        <div className="bg-surface-900/60 rounded-xl p-2.5 border border-white/5 flex flex-col items-center justify-center text-center">
          <FiDroplet className="text-blue-400 mb-1 w-3.5 h-3.5" />
          <p className="text-[10px] text-gray-400 font-mono">Humidity</p>
          <p className="text-xs font-bold text-white font-mono mt-0.5">{weather.humidity}%</p>
        </div>

        <div className="bg-surface-900/60 rounded-xl p-2.5 border border-white/5 flex flex-col items-center justify-center text-center">
          <FiCloudRain className="text-indigo-400 mb-1 w-3.5 h-3.5" />
          <p className="text-[10px] text-gray-400 font-mono">Rainfall</p>
          <p className="text-xs font-bold text-white font-mono mt-0.5">{weather.rainfall}mm</p>
        </div>

        <div className="bg-surface-900/60 rounded-xl p-2.5 border border-white/5 flex flex-col items-center justify-center text-center">
          <FiThermometer className="text-amber-400 mb-1 w-3.5 h-3.5" />
          <p className="text-[10px] text-gray-400 font-mono">Rain Prob.</p>
          <p className="text-xs font-bold text-white font-mono mt-0.5">{weather.rainProbability || 20}%</p>
        </div>

        <div className="bg-surface-900/60 rounded-xl p-2.5 border border-white/5 flex flex-col items-center justify-center text-center">
          <FiWind className="text-teal-400 mb-1 w-3.5 h-3.5" />
          <p className="text-[10px] text-gray-400 font-mono">Wind</p>
          <p className="text-xs font-bold text-white font-mono mt-0.5">{weather.windSpeed}m/s</p>
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;
