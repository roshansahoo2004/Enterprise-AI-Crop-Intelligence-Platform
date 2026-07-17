import React from 'react';
import { FiThermometer, FiDroplet, FiCloudRain, FiWind, FiMapPin } from 'react-icons/fi';

const WeatherCard = ({ weather, loading, error, onDetect }) => {
  if (loading) {
    return (
      <div className="glass-card flex h-48 items-center justify-center p-6 shimmer relative overflow-hidden">
        <p className="text-gray-400 z-10 font-medium tracking-wide">Fetching weather data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card flex h-48 flex-col items-center justify-center gap-3 p-6">
        <p className="text-red-400 text-center">{error}</p>
        <button onClick={onDetect} className="text-sm text-primary-400 hover:underline">
          Try Again
        </button>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="glass-card flex h-48 flex-col items-center justify-center gap-4 p-6 bg-gradient-to-br from-surface-800 to-surface-900 border border-white/5">
        <div className="w-16 h-16 rounded-full bg-surface-700 flex items-center justify-center text-primary-400 shadow-neon">
          <FiCloudRain className="w-8 h-8" />
        </div>
        <button 
          onClick={onDetect} 
          className="btn-primary py-2 px-6 shadow-glow"
        >
          Detect Location
        </button>
      </div>
    );
  }

  const iconUrl = weather.icon 
    ? `http://openweathermap.org/img/wn/${weather.icon}@2x.png` 
    : null;

  return (
    <div className="glass-card-hover p-6 relative overflow-hidden group h-full flex flex-col justify-between">
      {/* Background decoration */}
      <div className="absolute -right-8 -top-8 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-500"></div>

      <div className="flex justify-between items-start relative z-10">
        <div>
          <h3 className="text-gray-400 text-sm font-medium flex items-center gap-1.5 mb-1">
            <FiMapPin className="text-primary-400" />
            {weather.location}, {weather.country}
            {weather.simulated && <span className="ml-2 text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full border border-yellow-500/30">Simulated</span>}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            {iconUrl && <img src={iconUrl} alt={weather.condition} className="w-12 h-12 -ml-2 filter drop-shadow-md" />}
            <div>
              <p className="text-3xl font-display font-bold text-white tracking-tight">
                {weather.temperature}°<span className="text-xl text-gray-400 font-normal">C</span>
              </p>
              <p className="text-sm text-gray-300 capitalize font-medium">{weather.description}</p>
            </div>
          </div>
        </div>
        <button 
          onClick={onDetect}
          className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 transition-colors flex items-center gap-1 text-gray-300"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-6 relative z-10">
        <div className="bg-surface-800/50 rounded-xl p-3 border border-white/5 flex flex-col items-center justify-center gap-1">
          <FiDroplet className="text-blue-400 mb-1" />
          <p className="text-xs text-gray-400">Humidity</p>
          <p className="font-semibold text-white">{weather.humidity}%</p>
        </div>
        <div className="bg-surface-800/50 rounded-xl p-3 border border-white/5 flex flex-col items-center justify-center gap-1">
          <FiCloudRain className="text-indigo-400 mb-1" />
          <p className="text-xs text-gray-400">Rainfall</p>
          <p className="font-semibold text-white">{weather.rainfall}mm</p>
        </div>
        <div className="bg-surface-800/50 rounded-xl p-3 border border-white/5 flex flex-col items-center justify-center gap-1">
          <FiWind className="text-teal-400 mb-1" />
          <p className="text-xs text-gray-400">Wind</p>
          <p className="font-semibold text-white">{weather.windSpeed}m/s</p>
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;
