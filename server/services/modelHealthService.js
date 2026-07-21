const Prediction = require('../models/Prediction');
const ModelVersion = require('../models/ModelVersion');

/**
 * Phase-10 Step-1: Enterprise Model Health Dashboard Service
 *
 * Continuously evaluates the deployed ML model's operational health
 * using optimized MongoDB aggregation pipelines. Computes a composite
 * health score (0–100) from multiple operational metrics.
 *
 * Health Score Formula:
 *   score = w1*confidenceScore + w2*latencyScore + w3*shapCoverageScore
 *           + w4*fallbackScore + w5*successRateScore
 *
 * Weights: confidence=30, latency=20, shapCoverage=20, fallback=15, successRate=15
 *
 * Each sub-score is normalized to 0–100:
 *   - confidenceScore: (avgConfidence / 100) * 100
 *   - latencyScore:    max(0, 100 - (avgLatency / 10)) — lower is better
 *   - shapCoverageScore: shapCoverage%
 *   - fallbackScore:   (1 - fallbackRate) * 100 — less fallback = better
 *   - successRateScore: successRate%
 */

// ─── Weights for health score calculation ───────────────────────────────────
const WEIGHTS = {
  confidence: 0.30,
  latency: 0.20,
  shapCoverage: 0.20,
  fallback: 0.15,
  successRate: 0.15
};

// ─── Helper: Date cutoff ────────────────────────────────────────────────────
function getDateCutoff(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

// ─── Helper: Clamp value between 0 and 100 ──────────────────────────────────
function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate health score from individual metrics.
 */
function calculateHealthScore({ avgConfidence, avgLatency, shapCoverage, fallbackRate, successRate }) {
  const confidenceScore = clamp((avgConfidence / 100) * 100);
  const latencyScore = clamp(100 - (avgLatency / 10)); // <1000ms = good, >1000ms = 0
  const shapCoverageScore = clamp(shapCoverage);
  const fallbackScore = clamp((1 - fallbackRate / 100) * 100);
  const successRateScore = clamp(successRate);

  const raw = (
    WEIGHTS.confidence * confidenceScore +
    WEIGHTS.latency * latencyScore +
    WEIGHTS.shapCoverage * shapCoverageScore +
    WEIGHTS.fallback * fallbackScore +
    WEIGHTS.successRate * successRateScore
  );

  return {
    score: parseFloat(clamp(raw).toFixed(1)),
    breakdown: {
      confidenceScore: parseFloat(confidenceScore.toFixed(1)),
      latencyScore: parseFloat(latencyScore.toFixed(1)),
      shapCoverageScore: parseFloat(shapCoverageScore.toFixed(1)),
      fallbackScore: parseFloat(fallbackScore.toFixed(1)),
      successRateScore: parseFloat(successRateScore.toFixed(1))
    }
  };
}

/**
 * Determine health status label and color from score.
 */
function getHealthStatus(score) {
  if (score >= 90) return { label: 'Excellent', color: 'green' };
  if (score >= 70) return { label: 'Good', color: 'yellow' };
  if (score >= 50) return { label: 'Fair', color: 'orange' };
  return { label: 'Critical', color: 'red' };
}

/**
 * GET /summary — Generate complete model health dashboard summary.
 */
async function getModelHealthSummary() {
  // ── 1. Resolve active model info ──────────────────────────────────────────
  let modelVersion = 'v1.0';
  let deploymentDate = null;

  try {
    const activeModel = await ModelVersion.findOne({ isActive: true }).lean();
    if (activeModel) {
      modelVersion = activeModel.version;
      deploymentDate = activeModel.createdAt || activeModel.updatedAt || null;
    }
  } catch (err) {
    console.error('[Model Health] Error resolving active model:', err.message);
  }

  // ── 2. Core prediction statistics ─────────────────────────────────────────
  const coreStats = await Prediction.aggregate([
    { $match: { predictionType: 'crop' } },
    {
      $group: {
        _id: null,
        totalPredictions: { $sum: 1 },
        avgConfidence: { $avg: '$confidence' },
        avgPredictionLatency: { $avg: { $ifNull: ['$predictionTimeMs', 120] } },
        avgShapLatency: { $avg: { $ifNull: ['$shapTimeMs', 45] } },
        shapPredictions: { $sum: { $cond: [{ $eq: ['$explanation.shapAvailable', true] }, 1, 0] } },
        fallbackPredictions: { $sum: { $cond: [{ $ne: ['$explanation.shapAvailable', true] }, 1, 0] } },
        lastPredictionTime: { $max: '$createdAt' }
      }
    }
  ]);

  const raw = coreStats[0] || {
    totalPredictions: 0,
    avgConfidence: 0,
    avgPredictionLatency: 120,
    avgShapLatency: 45,
    shapPredictions: 0,
    fallbackPredictions: 0,
    lastPredictionTime: null
  };

  const totalPredictions = raw.totalPredictions;
  const avgConfidence = parseFloat((raw.avgConfidence || 0).toFixed(1));
  const avgPredictionLatency = Math.round(raw.avgPredictionLatency || 120);
  const avgShapLatency = Math.round(raw.avgShapLatency || 45);

  const shapCoverage = totalPredictions > 0
    ? parseFloat(((raw.shapPredictions / totalPredictions) * 100).toFixed(1))
    : 0;
  const fallbackRate = totalPredictions > 0
    ? parseFloat(((raw.fallbackPredictions / totalPredictions) * 100).toFixed(1))
    : 0;

  // Success rate: predictions with confidence > 60 are considered "successful"
  const successStats = await Prediction.aggregate([
    { $match: { predictionType: 'crop' } },
    {
      $group: {
        _id: null,
        successCount: { $sum: { $cond: [{ $gte: ['$confidence', 60] }, 1, 0] } },
        failCount: { $sum: { $cond: [{ $lt: ['$confidence', 60] }, 1, 0] } },
        total: { $sum: 1 }
      }
    }
  ]);

  const successRaw = successStats[0] || { successCount: 0, failCount: 0, total: 0 };
  const successRate = successRaw.total > 0
    ? parseFloat(((successRaw.successCount / successRaw.total) * 100).toFixed(1))
    : 100;
  const failureRate = parseFloat((100 - successRate).toFixed(1));

  // ── 3. Calculate health score ─────────────────────────────────────────────
  const health = calculateHealthScore({
    avgConfidence,
    avgLatency: avgPredictionLatency,
    shapCoverage,
    fallbackRate,
    successRate
  });

  const status = getHealthStatus(health.score);

  return {
    modelVersion,
    deploymentDate,
    healthScore: health.score,
    healthStatus: status,
    healthBreakdown: health.breakdown,
    totalPredictions,
    avgConfidence,
    avgPredictionLatency,
    avgShapLatency,
    successRate,
    failureRate,
    fallbackRate,
    shapCoverage,
    lastPredictionTime: raw.lastPredictionTime,
    lastHealthUpdate: new Date().toISOString()
  };
}

/**
 * GET /history — Return historical health snapshots (daily for last 30 days).
 * Each day's snapshot contains health metrics computed from that day's predictions.
 */
async function getModelHealthHistory() {
  const cutoff = getDateCutoff(30);

  const dailyMetrics = await Prediction.aggregate([
    { $match: { predictionType: 'crop', createdAt: { $gte: cutoff } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        predictions: { $sum: 1 },
        avgConfidence: { $avg: '$confidence' },
        avgLatency: { $avg: { $ifNull: ['$predictionTimeMs', 120] } },
        avgShapLatency: { $avg: { $ifNull: ['$shapTimeMs', 45] } },
        shapCount: { $sum: { $cond: [{ $eq: ['$explanation.shapAvailable', true] }, 1, 0] } },
        fallbackCount: { $sum: { $cond: [{ $ne: ['$explanation.shapAvailable', true] }, 1, 0] } },
        successCount: { $sum: { $cond: [{ $gte: ['$confidence', 60] }, 1, 0] } }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const history = dailyMetrics.map(day => {
    const total = day.predictions;
    const shapCoverage = total > 0 ? (day.shapCount / total) * 100 : 0;
    const fallbackRate = total > 0 ? (day.fallbackCount / total) * 100 : 0;
    const successRate = total > 0 ? (day.successCount / total) * 100 : 100;
    const avgConf = day.avgConfidence || 0;
    const avgLat = day.avgLatency || 120;

    const health = calculateHealthScore({
      avgConfidence: avgConf,
      avgLatency: avgLat,
      shapCoverage,
      fallbackRate,
      successRate
    });

    return {
      date: day._id,
      label: new Date(day._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      healthScore: health.score,
      predictions: total,
      avgConfidence: parseFloat(avgConf.toFixed(1)),
      avgLatency: Math.round(avgLat),
      avgShapLatency: Math.round(day.avgShapLatency || 45),
      shapCoverage: parseFloat(shapCoverage.toFixed(1)),
      fallbackRate: parseFloat(fallbackRate.toFixed(1)),
      successRate: parseFloat(successRate.toFixed(1))
    };
  });

  return history;
}

module.exports = {
  getModelHealthSummary,
  getModelHealthHistory,
  calculateHealthScore,
  getHealthStatus
};
