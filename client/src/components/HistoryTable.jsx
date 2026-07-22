import { getCropData, getConfidenceLevel } from '../utils/cropData';
import { FiCalendar, FiMapPin, FiDroplet, FiThermometer } from 'react-icons/fi';
import { DataTable } from './ui';

const HistoryTable = ({ history, loading }) => {
  const columns = [
    {
      header: 'Date',
      key: 'date',
      render: (item) => (
        <span className="text-gray-300">
          {new Date(item.createdAt).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
          })}
        </span>
      )
    },
    {
      header: 'Predicted Crop',
      key: 'crop',
      render: (item) => {
        const cropInfo = getCropData(item.predictedCrop);
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-surface-800 flex items-center justify-center text-lg shadow-inner">
              {cropInfo.emoji}
            </div>
            <span className="font-semibold text-white capitalize">{item.predictedCrop}</span>
          </div>
        );
      }
    },
    {
      header: 'Confidence',
      key: 'confidence',
      render: (item) => {
        const cropInfo = getCropData(item.predictedCrop);
        const confLevel = getConfidenceLevel(item.confidence);
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 bg-surface-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${item.confidence}%`, backgroundColor: cropInfo.color }}></div>
            </div>
            <span className={`text-xs font-bold ${confLevel.color}`}>{item.confidence}%</span>
          </div>
        );
      }
    },
    {
      header: 'Soil N-P-K',
      key: 'npk',
      render: (item) => (
        <span className="font-mono bg-surface-900 px-2 py-1 rounded text-xs border border-white/5">
          {item.nitrogen}-{item.phosphorus}-{item.potassium}
        </span>
      )
    },
    {
      header: 'Environment',
      key: 'env',
      render: (item) => (
        <div className="flex gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1" title="Temperature"><FiThermometer className="text-red-400" /> {item.temperature}°C</span>
          <span className="flex items-center gap-1" title="Humidity"><FiDroplet className="text-blue-400" /> {item.humidity}%</span>
        </div>
      )
    },
    {
      header: 'Location',
      key: 'location',
      align: 'right',
      render: (item) => item.weatherData?.location ? (
        <span className="flex items-center justify-end gap-1 text-gray-400">
          <FiMapPin className="text-primary-400" /> {item.weatherData.location}
        </span>
      ) : (
        <span className="text-gray-600 italic">Manual Input</span>
      )
    }
  ];

  return (
    <DataTable
      columns={columns}
      data={history}
      loading={loading}
      emptyTitle="No Predictions Found"
      emptyDescription="Run your first crop prediction using soil and weather parameters to see it recorded here."
      keyField="_id"
    />
  );
};

export default HistoryTable;
