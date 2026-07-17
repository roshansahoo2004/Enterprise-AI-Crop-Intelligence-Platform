import React from 'react';
import { inputFields } from '../utils/cropData';
import { FiCpu, FiCloud, FiActivity } from 'react-icons/fi';

const PredictionForm = ({ 
  formData, 
  handleInputChange, 
  onSubmit, 
  loading, 
  onPopulateWeather, 
  onPopulateIoT,
  hasWeatherData,
  hasIotData
}) => {
  return (
    <div className="glass-card overflow-hidden">
      <div className="bg-gradient-to-r from-primary-900/40 to-surface-900 p-6 border-b border-white/5">
        <h2 className="text-xl font-display font-bold text-white mb-2 flex items-center gap-2">
          <FiCpu className="text-primary-400" /> Model Inputs
        </h2>
        <p className="text-sm text-gray-400">
          Enter soil nutrients and environmental data manually, or populate from connected sensors.
        </p>
        
        <div className="flex gap-3 mt-4">
          <button 
            type="button"
            onClick={onPopulateWeather}
            disabled={!hasWeatherData}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
              hasWeatherData 
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20' 
                : 'bg-surface-800 text-gray-500 border border-white/5 cursor-not-allowed'
            }`}
          >
            <FiCloud /> Use Weather Data
          </button>
          <button 
            type="button"
            onClick={onPopulateIoT}
            disabled={!hasIotData}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
              hasIotData 
                ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20 hover:bg-primary-500/20' 
                : 'bg-surface-800 text-gray-500 border border-white/5 cursor-not-allowed'
            }`}
          >
            <FiActivity /> Use IoT Sensors
          </button>
        </div>
      </div>

      <form onSubmit={onSubmit} className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {inputFields.map((field) => (
            <div key={field.name} className="space-y-2">
              <label className="flex justify-between items-center text-sm font-medium text-gray-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold bg-white/5 border border-white/10" style={{ color: field.color }}>
                    {field.icon}
                  </span>
                  {field.label}
                </span>
                <span className="text-xs text-gray-500">{field.unit}</span>
              </label>
              
              <div className="relative group">
                <input
                  type="number"
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleInputChange}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  required
                  className="input-field pl-4 pr-12 text-lg font-display"
                  placeholder={`e.g., ${Math.round((field.max - field.min) / 2)}`}
                />
                
                {/* Visual indicator bar under input */}
                <div className="absolute bottom-0 left-0 h-1 bg-surface-700 w-full rounded-b-xl overflow-hidden opacity-50 group-focus-within:opacity-100 transition-opacity">
                  <div 
                    className="h-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min(100, Math.max(0, ((formData[field.name] || 0) - field.min) / (field.max - field.min) * 100))}%`,
                      backgroundColor: field.color
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Powered by Random Forest & XGBoost Ensemble
          </p>
          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full md:w-auto md:min-w-[200px] flex justify-center items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>Run AI Prediction</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PredictionForm;
