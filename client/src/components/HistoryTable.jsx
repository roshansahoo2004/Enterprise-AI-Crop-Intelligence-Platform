import React from 'react';
import { getCropData, getConfidenceLevel } from '../utils/cropData';
import { FiCalendar, FiMapPin, FiDroplet, FiThermometer } from 'react-icons/fi';

const HistoryTable = ({ history, loading }) => {
  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-surface-800 rounded w-full"></div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-surface-800/50 rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="glass-card flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-surface-800 flex items-center justify-center mb-4 text-gray-500">
          <FiCalendar className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">No predictions yet</h3>
        <p className="text-sm text-gray-400 max-w-sm">
          Run your first crop prediction using soil and weather data to see it appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-surface-900 border-b border-white/10 text-xs uppercase tracking-wider text-gray-400 font-semibold">
              <th className="p-4 pl-6">Date</th>
              <th className="p-4">Predicted Crop</th>
              <th className="p-4">Confidence</th>
              <th className="p-4">Soil N-P-K</th>
              <th className="p-4">Environment</th>
              <th className="p-4 pr-6 text-right">Location</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {history.map((item) => {
              const cropInfo = getCropData(item.predictedCrop);
              const confLevel = getConfidenceLevel(item.confidence);
              const date = new Date(item.createdAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
              });

              return (
                <tr key={item._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 pl-6 text-sm text-gray-300">
                    {date}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-surface-800 flex items-center justify-center text-lg shadow-inner">
                        {cropInfo.emoji}
                      </div>
                      <span className="font-semibold text-white capitalize">{item.predictedCrop}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-surface-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${item.confidence}%`, backgroundColor: cropInfo.color }}></div>
                      </div>
                      <span className={`text-xs font-bold ${confLevel.color}`}>{item.confidence}%</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-300">
                    <span className="font-mono bg-surface-900 px-2 py-1 rounded text-xs border border-white/5">
                      {item.nitrogen}-{item.phosphorus}-{item.potassium}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1" title="Temperature"><FiThermometer className="text-red-400" /> {item.temperature}°C</span>
                      <span className="flex items-center gap-1" title="Humidity"><FiDroplet className="text-blue-400" /> {item.humidity}%</span>
                    </div>
                  </td>
                  <td className="p-4 pr-6 text-right text-sm text-gray-400">
                    {item.weatherData?.location ? (
                      <span className="flex items-center justify-end gap-1">
                        <FiMapPin className="text-primary-400" /> {item.weatherData.location}
                      </span>
                    ) : (
                      <span className="text-gray-600 italic">Manual Input</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoryTable;
