import React from 'react';
import { getCropData, getConfidenceLevel } from '../utils/cropData';
import { FiCheckCircle, FiInfo, FiCalendar, FiTrendingUp } from 'react-icons/fi';

// ─── Phase-8 Step-1: Explainable AI Components ───
import ExplanationCard from './ExplanationCard';
import FeatureImportanceChart from './FeatureImportanceChart';
import PredictionDistribution from './PredictionDistribution';

const PredictionResult = ({ result, onReset }) => {
  if (!result) return null;

  const cropInfo = getCropData(result.crop);
  const confidenceLevel = getConfidenceLevel(result.confidence);

  // SVG Gauge calculation
  const gaugePercent = result.confidence;
  const circumference = 2 * Math.PI * 45; // r=45
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (gaugePercent / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* ─── Existing Prediction Result Card (unchanged) ─── */}
      <div className="glass-card overflow-hidden animate-slide-up">
        <div className="bg-gradient-to-br from-primary-900/30 to-surface-900 p-8 border-b border-white/5 relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3"></div>
          
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            
            {/* Confidence Gauge */}
            <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                {/* Progress circle */}
                <circle 
                  cx="50" cy="50" r="45" 
                  fill="none" 
                  stroke={cropInfo.color} 
                  strokeWidth="8" 
                  strokeLinecap="round"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-display font-bold text-white">{result.confidence}<span className="text-lg">%</span></span>
                <span className={`text-[10px] uppercase tracking-wider font-bold ${confidenceLevel.color}`}>
                  {confidenceLevel.label}
                </span>
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap gap-2 mb-3 justify-center md:justify-start">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300">
                  <FiCheckCircle className="text-primary-400" /> Model Confidence
                </div>
                {result.explanation && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    AI Explainability Enabled
                  </div>
                )}
              </div>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-2 capitalize">
                {result.crop} <span className="text-3xl">{cropInfo.emoji}</span>
              </h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
                <div className="flex items-center gap-2 text-sm text-gray-300 bg-surface-800 px-3 py-1.5 rounded-lg border border-white/5">
                  <FiCalendar className="text-secondary-400" />
                  <span>{result.season}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FiInfo className="text-primary-400" /> Expert Care Tips
            </h3>
            <ul className="space-y-3">
              {result.tips?.map((tip, index) => (
                <li key={index} className="flex gap-3 text-gray-300 text-sm">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-primary-500/10 text-primary-400 flex items-center justify-center text-xs font-bold mt-0.5">
                    {index + 1}
                  </span>
                  <span className="leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FiTrendingUp className="text-secondary-400" /> Top Alternatives
            </h3>
            <div className="space-y-3">
              {result.top3?.filter(t => t.crop !== result.crop).map((alt, index) => {
                const altInfo = getCropData(alt.crop);
                return (
                  <div key={index} className="bg-surface-800/50 rounded-xl p-3 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: altInfo.bg }}>
                        {altInfo.emoji}
                      </div>
                      <span className="font-medium text-white capitalize">{alt.crop}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-surface-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${alt.confidence}%`, backgroundColor: altInfo.color }}></div>
                      </div>
                      <span className="text-sm font-bold text-white w-10 text-right">{alt.confidence}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-6 bg-surface-900 border-t border-white/5 flex justify-end">
          <button onClick={onReset} className="btn-secondary">
            Make Another Prediction
          </button>
        </div>
      </div>

      {/* ─── Phase-8 Step-2: Prediction Distribution ─── */}
      {(result.predictionDistribution || result.top3) && (
        <PredictionDistribution distribution={result.predictionDistribution || result.top3} />
      )}

      {/* ─── Phase-8 Step-1: Explainable AI Section ─── */}
      {/* Only renders when explanation data is present (crop predictions) */}
      {result.explanation && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ExplanationCard explanation={result.explanation} />
          <FeatureImportanceChart topFactors={result.explanation.topFactors} />
        </div>
      )}
    </div>
  );
};

export default PredictionResult;
