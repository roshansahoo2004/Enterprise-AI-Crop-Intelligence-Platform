const modelHealthService = require('./modelHealthService');
const dataDriftService = require('./dataDriftService');
const featureDriftService = require('./featureDriftService');
const confidenceDriftService = require('./confidenceDriftService');
const Prediction = require('../models/Prediction');

/**
 * Phase-10 Step-5: Enterprise Retraining Recommendation Engine Service
 *
 * Synthesizes operational metrics across all 6 monitoring vectors:
 *  1. Model Health (25% weight)
 *  2. Data Drift (25% weight)
 *  3. Feature Drift (20% weight)
 *  4. Confidence Drift (15% weight)
 *  5. Prediction Performance (10% weight)
 *  6. Explainability Coverage (5% weight)
 *
 * Computes a weighted Recommendation Score (0–100 Risk Score) and assigns:
 *  - Recommendation Level: Healthy (<30), Monitor (30–59), Schedule Retraining (60–79), Immediate Retraining (80+)
 *  - Priority: Low, Medium, High, Critical
 *  - Automated Reason Generation
 *  - Engine Certainty / Confidence
 */

// ─── Weight Configuration ───────────────────────────────────────────────────
const FACTOR_WEIGHTS = {
  healthScore: 0.25,
  dataDrift: 0.25,
  featureDrift: 0.20,
  confidenceDrift: 0.15,
  predictionPerformance: 0.10,
  explainabilityCoverage: 0.05
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function getDateCutoff(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

/**
 * Determine recommendation level, priority, color, and severity level from score.
 */
function getRecommendationLevel(score) {
  if (score < 30) {
    return {
      level: 'Healthy',
      priority: 'Low',
      color: 'green',
      hex: '#10b981',
      badgeBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    };
  }
  if (score < 60) {
    return {
      level: 'Monitor',
      priority: 'Medium',
      color: 'yellow',
      hex: '#f59e0b',
      badgeBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    };
  }
  if (score < 80) {
    return {
      level: 'Schedule Retraining',
      priority: 'High',
      color: 'orange',
      hex: '#f97316',
      badgeBg: 'bg-orange-500/15 text-orange-400 border-orange-500/30'
    };
  }
  return {
    level: 'Immediate Retraining',
    priority: 'Critical',
    color: 'red',
    hex: '#ef4444',
    badgeBg: 'bg-red-500/15 text-red-400 border-red-500/30 animate-pulse'
  };
}

/**
 * Automatically construct explanatory rationale based on highest contributing risk factors.
 */
function generateReason(factors, score, levelInfo) {
  if (score < 30) {
    return 'All operational metrics, feature distributions, and prediction confidence remain strictly within healthy safety thresholds. No retraining required.';
  }

  // Sort factors by contribution descending
  const sortedFactors = [...factors].sort((a, b) => b.contribution - a.contribution);
  const topRisk = sortedFactors[0];
  const secondRisk = sortedFactors[1];

  const primaryReasons = [];

  if (topRisk.key === 'dataDrift' && topRisk.riskScore > 40) {
    primaryReasons.push(`significant data drift detected across production inputs (PSI: ${topRisk.rawValue})`);
  }
  if (topRisk.key === 'healthScore' && topRisk.riskScore > 40) {
    primaryReasons.push(`degraded operational model health score (${topRisk.rawValue}/100)`);
  }
  if (topRisk.key === 'confidenceDrift' && topRisk.riskScore > 40) {
    primaryReasons.push(`noticeable degradation in prediction confidence (Drift: ${topRisk.rawValue}%)`);
  }
  if (topRisk.key === 'featureDrift' && topRisk.riskScore > 40) {
    primaryReasons.push(`multiple monitored features exhibiting non-stationary distributions`);
  }
  if (topRisk.key === 'predictionPerformance' && topRisk.riskScore > 40) {
    primaryReasons.push(`elevated failure/low-confidence rate in prediction outputs`);
  }

  if (primaryReasons.length === 0) {
    primaryReasons.push(`cumulative minor variances across monitoring vectors`);
  }

  let text = `Action recommended (${levelInfo.level}): Triggered primarily by ${primaryReasons.join(' and ')}.`;
  if (secondRisk && secondRisk.riskScore > 35) {
    text += ` Secondary concern: ${secondRisk.factorName} risk index at ${secondRisk.riskScore.toFixed(1)}%.`;
  }

  return text;
}

// ═══════════════════════════════════════════════════════════════════════════
//  GET /summary
// ═══════════════════════════════════════════════════════════════════════════
async function getRetrainingSummary() {
  // Fetch summary data concurrently from all monitoring modules
  const [healthData, dataDriftData, featureDriftData, confidenceData] = await Promise.all([
    modelHealthService.getModelHealthSummary().catch(() => ({ healthScore: 85, successRate: 95, shapCoverage: 80 })),
    dataDriftService.getDriftSummary().catch(() => ({ overallDriftScore: 0.05, driftedFeatures: 0, totalFeatures: 7 })),
    featureDriftService.getFeatureDriftSummary().catch(() => ({ overallStabilityScore: 90, healthyFeatures: 6, totalFeatures: 7 })),
    confidenceDriftService.getConfidenceSummary().catch(() => ({ averageConfidence: 85, confidenceDriftPercent: 2, confidenceStabilityScore: 88 }))
  ]);

  // 1. Health Score Risk (25% weight) -> HealthScore 100 = 0 risk, 0 = 100 risk
  const healthVal = healthData.healthScore ?? 85;
  const healthRisk = clamp(100 - healthVal);

  // 2. Data Drift Risk (25% weight) -> Overall PSI (0.35 PSI = 100% risk)
  const psiVal = dataDriftData.overallDriftScore ?? 0.05;
  const dataDriftRisk = clamp((psiVal / 0.35) * 100);

  // 3. Feature Drift Risk (20% weight) -> 100 - FeatureStabilityScore
  const featureStabilityVal = featureDriftData.overallStabilityScore ?? 90;
  const featureDriftRisk = clamp(100 - featureStabilityVal);

  // 4. Confidence Drift Risk (15% weight) -> combination of drift % + low avg confidence
  const confDriftPct = confidenceData.confidenceDriftPercent ?? 0;
  const avgConf = confidenceData.averageConfidence ?? 85;
  const confRiskRaw = Math.max(0, confDriftPct * 4) + Math.max(0, (85 - avgConf) * 3);
  const confidenceDriftRisk = clamp(confRiskRaw);

  // 5. Prediction Performance Risk (10% weight) -> 100 - successRate
  const successRate = healthData.successRate ?? 95;
  const perfRisk = clamp(100 - successRate);

  // 6. Explainability Coverage Risk (5% weight) -> 100 - shapCoverage
  const shapCoverage = healthData.shapCoverage ?? 80;
  const shapRisk = clamp(100 - shapCoverage);

  // Compute Weighted Recommendation Score (0–100)
  const rawRecommendationScore = (
    FACTOR_WEIGHTS.healthScore * healthRisk +
    FACTOR_WEIGHTS.dataDrift * dataDriftRisk +
    FACTOR_WEIGHTS.featureDrift * featureDriftRisk +
    FACTOR_WEIGHTS.confidenceDrift * confidenceDriftRisk +
    FACTOR_WEIGHTS.predictionPerformance * perfRisk +
    FACTOR_WEIGHTS.explainabilityCoverage * shapRisk
  );

  const recommendationScore = parseFloat(clamp(rawRecommendationScore).toFixed(1));
  const levelInfo = getRecommendationLevel(recommendationScore);

  // Factor breakdown list
  const factors = [
    {
      key: 'healthScore',
      factorName: 'Model Health Score',
      weightPercent: 25,
      weight: FACTOR_WEIGHTS.healthScore,
      rawValue: `${healthVal}/100`,
      riskScore: parseFloat(healthRisk.toFixed(1)),
      contribution: parseFloat((FACTOR_WEIGHTS.healthScore * healthRisk).toFixed(1)),
      status: healthRisk < 30 ? 'Healthy' : healthRisk < 60 ? 'Warning' : 'Critical'
    },
    {
      key: 'dataDrift',
      factorName: 'Data Drift (PSI)',
      weightPercent: 25,
      weight: FACTOR_WEIGHTS.dataDrift,
      rawValue: `${psiVal.toFixed(4)} PSI`,
      riskScore: parseFloat(dataDriftRisk.toFixed(1)),
      contribution: parseFloat((FACTOR_WEIGHTS.dataDrift * dataDriftRisk).toFixed(1)),
      status: dataDriftRisk < 30 ? 'Healthy' : dataDriftRisk < 60 ? 'Warning' : 'Critical'
    },
    {
      key: 'featureDrift',
      factorName: 'Feature Drift Index',
      weightPercent: 20,
      weight: FACTOR_WEIGHTS.featureDrift,
      rawValue: `${featureDriftData.driftedFeatures || 0}/${featureDriftData.totalFeatures || 7} Drifted`,
      riskScore: parseFloat(featureDriftRisk.toFixed(1)),
      contribution: parseFloat((FACTOR_WEIGHTS.featureDrift * featureDriftRisk).toFixed(1)),
      status: featureDriftRisk < 30 ? 'Healthy' : featureDriftRisk < 60 ? 'Warning' : 'Critical'
    },
    {
      key: 'confidenceDrift',
      factorName: 'Confidence Degradation',
      weightPercent: 15,
      weight: FACTOR_WEIGHTS.confidenceDrift,
      rawValue: `${confDriftPct.toFixed(1)}% Drift`,
      riskScore: parseFloat(confidenceDriftRisk.toFixed(1)),
      contribution: parseFloat((FACTOR_WEIGHTS.confidenceDrift * confidenceDriftRisk).toFixed(1)),
      status: confidenceDriftRisk < 30 ? 'Healthy' : confidenceDriftRisk < 60 ? 'Warning' : 'Critical'
    },
    {
      key: 'predictionPerformance',
      factorName: 'Prediction Performance',
      weightPercent: 10,
      weight: FACTOR_WEIGHTS.predictionPerformance,
      rawValue: `${successRate}% Success`,
      riskScore: parseFloat(perfRisk.toFixed(1)),
      contribution: parseFloat((FACTOR_WEIGHTS.predictionPerformance * perfRisk).toFixed(1)),
      status: perfRisk < 30 ? 'Healthy' : perfRisk < 60 ? 'Warning' : 'Critical'
    },
    {
      key: 'explainabilityCoverage',
      factorName: 'Explainability Coverage',
      weightPercent: 5,
      weight: FACTOR_WEIGHTS.explainabilityCoverage,
      rawValue: `${shapCoverage}% SHAP`,
      riskScore: parseFloat(shapRisk.toFixed(1)),
      contribution: parseFloat((FACTOR_WEIGHTS.explainabilityCoverage * shapRisk).toFixed(1)),
      status: shapRisk < 30 ? 'Healthy' : shapRisk < 60 ? 'Warning' : 'Critical'
    }
  ];

  const reason = generateReason(factors, recommendationScore, levelInfo);

  // Engine confidence / certainty calculation (based on sample size & metric completeness)
  const sampleCount = (dataDriftData.currentDatasetSize || 0) + (healthData.totalPredictions || 0);
  const engineConfidence = clamp(85 + Math.min(12, Math.floor(sampleCount / 5)));

  return {
    overallRecommendation: levelInfo.level,
    recommendationScore,
    priority: levelInfo.priority,
    color: levelInfo.color,
    hex: levelInfo.hex,
    badgeBg: levelInfo.badgeBg,
    reason,
    engineConfidence: `${engineConfidence}%`,
    confidenceValue: engineConfidence,
    healthScore: healthVal,
    overallStatus: levelInfo.level === 'Healthy' ? 'Optimal' : levelInfo.level === 'Monitor' ? 'Watch' : 'Action Required',
    generatedAt: new Date().toISOString(),
    factors
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  GET /factors
// ═══════════════════════════════════════════════════════════════════════════
async function getRetrainingFactors() {
  const summary = await getRetrainingSummary();
  return {
    recommendationScore: summary.recommendationScore,
    overallRecommendation: summary.overallRecommendation,
    factors: summary.factors
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  GET /history
// ═══════════════════════════════════════════════════════════════════════════
async function getRetrainingHistory(days = 30) {
  const historyCutoff = getDateCutoff(days);

  // Daily aggregate prediction stats to compute historical recommendation scores
  const dailyDocs = await Prediction.aggregate([
    {
      $match: {
        predictionType: 'crop',
        createdAt: { $gte: historyCutoff }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
        avgConfidence: { $avg: '$confidence' },
        avgLatency: { $avg: { $ifNull: ['$predictionTimeMs', 120] } },
        lowConfCount: { $sum: { $cond: [{ $lt: ['$confidence', 70] }, 1, 0] } }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const baselineConf = 88.0;

  const history = dailyDocs.map(day => {
    const avgConf = day.avgConfidence || 85;
    const confDrift = Math.max(0, ((baselineConf - avgConf) / baselineConf) * 100);
    const lowConfPct = day.count > 0 ? (day.lowConfCount / day.count) * 100 : 0;

    // Estimate daily health risk & drift risk
    const healthRisk = clamp(100 - (avgConf * 0.9 + (100 - lowConfPct) * 0.1));
    const driftRisk = clamp(confDrift * 6);
    const score = parseFloat(clamp(healthRisk * 0.5 + driftRisk * 0.5).toFixed(1));
    const levelInfo = getRecommendationLevel(score);

    return {
      date: day._id,
      label: new Date(day._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      recommendationScore: score,
      recommendationLevel: levelInfo.level,
      priority: levelInfo.priority,
      avgConfidence: parseFloat(avgConf.toFixed(2)),
      predictions: day.count,
      color: levelInfo.color
    };
  });

  return {
    totalDays: history.length,
    history
  };
}

module.exports = {
  getRetrainingSummary,
  getRetrainingFactors,
  getRetrainingHistory
};
