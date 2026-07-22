import {
  FiCheckCircle, FiAlertTriangle, FiArrowRight,
  FiDatabase, FiShield, FiPercent, FiHelpCircle
} from 'react-icons/fi';

const SOURCE_BADGES = {
  'Weather API': { color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', icon: FiDatabase },
  'Disease Detection': { color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: FiShield },
  'Yield Prediction': { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: FiCheckCircle },
  'Soil Analysis': { color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: FiDatabase },
  'Prediction History': { color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: FiDatabase },
  'Groq AI': { color: 'bg-primary-500/10 text-primary-400 border-primary-500/20', icon: FiPercent }
};

const AIResponseCard = ({ structuredData }) => {
  if (!structuredData) return null;

  const {
    summary,
    explanation,
    whyExplanation,
    recommendations = [],
    precautions = [],
    confidence = 'High (94%)',
    sources = ['Groq AI'],
    nextSteps = []
  } = structuredData;

  return (
    <div className="space-y-4 font-sans text-xs">
      
      {/* Summary Banner */}
      <div className="bg-surface-900/90 border border-primary-500/30 p-4 rounded-2xl shadow-lg">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse"></span>
            {summary}
          </h4>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {confidence}
          </span>
        </div>
        <p className="text-gray-300 leading-relaxed font-mono text-[11px]">{explanation}</p>
      </div>

      {/* AI Explainability Card ("Why this recommendation?") */}
      {whyExplanation && (
        <div className="bg-secondary-500/5 border border-secondary-500/20 p-3.5 rounded-xl">
          <div className="flex items-center gap-2 text-secondary-400 font-mono font-bold text-[11px] mb-1">
            <FiHelpCircle className="w-4 h-4 shrink-0" />
            <span>AI Explainability — Why this recommendation?</span>
          </div>
          <p className="text-gray-300 text-[11px] font-mono leading-relaxed">{whyExplanation}</p>
        </div>
      )}

      {/* Recommendations & Precautions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        
        {/* Actionable Recommendations */}
        {recommendations.length > 0 && (
          <div className="bg-surface-800/80 border border-white/10 p-3.5 rounded-xl space-y-2">
            <h5 className="font-mono font-bold text-emerald-400 text-[11px] flex items-center gap-1.5 uppercase tracking-wider">
              <FiCheckCircle className="w-3.5 h-3.5" /> Actionable Directives
            </h5>
            <ul className="space-y-1.5">
              {recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2 text-gray-300 text-[11px] font-mono leading-tight">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Safety Precautions */}
        {precautions.length > 0 && (
          <div className="bg-amber-500/5 border border-amber-500/20 p-3.5 rounded-xl space-y-2">
            <h5 className="font-mono font-bold text-amber-400 text-[11px] flex items-center gap-1.5 uppercase tracking-wider">
              <FiAlertTriangle className="w-3.5 h-3.5" /> Safety & Precautions
            </h5>
            <ul className="space-y-1.5">
              {precautions.map((prec, idx) => (
                <li key={idx} className="flex items-start gap-2 text-gray-300 text-[11px] font-mono leading-tight">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{prec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>

      {/* Next Steps Checklist */}
      {nextSteps.length > 0 && (
        <div className="bg-surface-900/60 border border-white/5 p-3 rounded-xl">
          <h5 className="font-mono font-bold text-gray-300 text-[10px] uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <FiArrowRight className="text-primary-400" /> Immediate Next Steps
          </h5>
          <div className="flex flex-wrap gap-2">
            {nextSteps.map((step, idx) => (
              <span key={idx} className="text-[10px] font-mono bg-surface-800 border border-white/10 text-gray-300 px-2.5 py-1 rounded-lg">
                ✓ {step}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Project Data Badges */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/5">
        <span className="text-[10px] font-mono text-gray-400 mr-1">Data Sources:</span>
        {sources.map((src, idx) => {
          const badgeConfig = SOURCE_BADGES[src] || { color: 'bg-gray-500/10 text-gray-400 border-gray-500/20', icon: FiDatabase };
          const IconComponent = badgeConfig.icon;
          return (
            <span key={idx} className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${badgeConfig.color}`}>
              <IconComponent className="w-3 h-3" />
              {src}
            </span>
          );
        })}
      </div>

    </div>
  );
};

export default AIResponseCard;
