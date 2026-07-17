import React from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiZap, FiAlertTriangle } from 'react-icons/fi';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 *  Phase-8 Step-2: ExplanationCard
 * ══════════════════════════════════════════════════════════════════════════════
 *
 *  Displays the "Why this crop?" explanation panel with:
 *    - Confidence level badge
 *    - List of human-readable explanation messages (supports structured positive/neutral/caution)
 *    - Detailed metadata footer (Generated date, Model Version, Engine type)
 *
 *  Props:
 *    explanation: {
 *      confidenceLevel: string,
 *      messages: Array<string | { text: string, type: string }>,
 *      generatedAt: Date,
 *      modelVersion: string,
 *      engine: string
 *    }
 */
const ExplanationCard = ({ explanation }) => {
  if (!explanation || !explanation.messages?.length) return null;

  const confidenceConfig = {
    'Very High': { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: <FiCheckCircle /> },
    High:        { color: 'text-primary-400', bg: 'bg-primary-500/10', border: 'border-primary-500/20', icon: <FiCheckCircle /> },
    Medium:      { color: 'text-secondary-400', bg: 'bg-secondary-500/10', border: 'border-secondary-500/20', icon: <FiAlertCircle /> },
    Low:         { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: <FiAlertCircle /> },
  };

  const levelStyle = confidenceConfig[explanation.confidenceLevel] || confidenceConfig.Medium;

  const renderMessage = (msg, index) => {
    // Graceful fallback for legacy predictions that stored raw strings
    const isLegacy = typeof msg === 'string';
    const text = isLegacy ? msg : msg.text;
    const type = isLegacy ? 'positive' : msg.type;

    let iconBg = 'bg-green-500/10';
    let icon = <FiCheckCircle className="w-3.5 h-3.5 text-green-400" />;

    if (type === 'warning' || type === 'caution') {
      iconBg = 'bg-yellow-500/10';
      icon = <FiAlertTriangle className="w-3.5 h-3.5 text-yellow-400" />;
    } else if (type === 'neutral') {
      iconBg = 'bg-blue-500/10';
      icon = <FiInfo className="w-3.5 h-3.5 text-blue-400" />;
    }

    return (
      <li key={index} className="flex items-start gap-3 group">
        <span className={`shrink-0 mt-0.5 w-6 h-6 rounded-full ${iconBg} flex items-center justify-center transition-all duration-300 group-hover:scale-110`}>
          {icon}
        </span>
        <span className="text-sm text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors">
          {text}
        </span>
      </li>
    );
  };

  return (
    <div className="glass-card-hover overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center">
            <FiZap className="text-primary-400 w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-display font-bold text-white">
              Why this crop?
            </h3>
            <p className="text-xs text-gray-500">AI Explanation</p>
          </div>
        </div>

        {/* Confidence badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${levelStyle.bg} ${levelStyle.border} ${levelStyle.color}`}>
          {levelStyle.icon}
          {explanation.confidenceLevel} Confidence
        </div>
      </div>

      {/* Explanation Messages */}
      <div className="p-6">
        <ul className="space-y-4">
          {explanation.messages.map((message, index) => renderMessage(message, index))}
        </ul>

        {/* Premium Metadata Footer */}
        <div className="mt-6 pt-4 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-gray-500">
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-gray-600 font-semibold mb-0.5">Generated</span>
            <span className="text-gray-400 font-medium">
              {explanation.generatedAt ? new Date(explanation.generatedAt).toLocaleString() : 'N/A'}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-gray-600 font-semibold mb-0.5">Model Version</span>
            <span className="text-gray-400 font-medium font-mono">{explanation.modelVersion || 'v1.0'}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-gray-600 font-semibold mb-0.5">Explanation Engine</span>
            <span className="text-gray-400 font-medium">{explanation.engine || 'Rule-Based XAI'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExplanationCard;
