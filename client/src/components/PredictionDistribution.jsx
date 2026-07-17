import React, { useState, useEffect } from 'react';
import { getCropData } from '../utils/cropData';
import { FiList } from 'react-icons/fi';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 *  Phase-8 Step-2: PredictionDistribution
 * ══════════════════════════════════════════════════════════════════════════════
 *
 *  Displays the complete ranked model confidence distribution of crops.
 *  Uses animated progress bars color-coded by rank:
 *    - Rank 1: Green
 *    - Rank 2: Blue
 *    - Rank 3: Orange
 *    - Others: Gray
 *
 *  Props:
 *    distribution: Array<{ crop: string, confidence: number }>
 */
const PredictionDistribution = ({ distribution }) => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Trigger progress bar animations after mounting
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!distribution || distribution.length === 0) return null;

  // Filter out crops with confidence <= 0.5% and sort descending
  const filteredDist = [...distribution]
    .filter(item => item.confidence > 0.5)
    .sort((a, b) => b.confidence - a.confidence);

  if (filteredDist.length === 0) return null;

  const getRankIcon = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold text-gray-400">
        #{index + 1}
      </span>
    );
  };

  const getRankColor = (index) => {
    switch (index) {
      case 0:
        return 'bg-green-500 shadow-green-500/20';
      case 1:
        return 'bg-blue-500 shadow-blue-500/20';
      case 2:
        return 'bg-orange-500 shadow-orange-500/20';
      default:
        return 'bg-surface-500 shadow-surface-500/20';
    }
  };

  return (
    <div className="glass-card-hover overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center">
          <FiList className="text-primary-400 w-4 h-4" />
        </div>
        <div>
          <h3 className="text-base font-display font-bold text-white">
            Prediction Distribution
          </h3>
          <p className="text-xs text-gray-500">Complete model confidence ranking</p>
        </div>
      </div>

      {/* Distribution List */}
      <div className="p-6 space-y-5 pb-5">
        {filteredDist.map((item, index) => {
          const cropInfo = getCropData(item.crop);
          const rankIcon = getRankIcon(index);
          const barColor = getRankColor(index);
          const barWidth = animate ? `${item.confidence}%` : '0%';

          return (
            <div key={item.crop} className="space-y-1.5 group">
              {/* Labels */}
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-lg flex items-center justify-center">{rankIcon}</span>
                  <span className="w-6 h-6 rounded bg-surface-800 flex items-center justify-center text-xs shadow-inner">
                    {cropInfo.emoji}
                  </span>
                  <span className="font-semibold text-white capitalize group-hover:text-primary-300 transition-colors">
                    {item.crop}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white font-mono text-sm">
                    {item.confidence.toFixed(1)}%
                  </span>
                  {index === 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-500/20 text-green-400 border border-green-500/30 tracking-wide uppercase">
                      Selected
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="h-2.5 w-full bg-white/[0.03] border border-white/[0.05] rounded-full overflow-hidden relative shadow-inner">
                {/* Active progress fill */}
                <div
                  className={`h-full rounded-full shadow-lg ${barColor}`}
                  style={{ 
                    width: barWidth,
                    transition: 'width 700ms ease-out'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Professional Footer */}
      <div className="px-6 py-3.5 bg-white/[0.01] border-t border-white/5 text-center text-xs text-gray-500 font-medium">
        Showing Top 5 model predictions. Remaining probability mass is distributed across other crop classes.
      </div>
    </div>
  );
};

export default PredictionDistribution;
