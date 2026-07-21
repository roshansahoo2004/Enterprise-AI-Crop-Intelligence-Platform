const Prediction = require('../models/Prediction');

/**
 * Phase-10 Step-4: Enterprise Confidence Drift Monitoring Service
 *
 * Continuously evaluates prediction confidence over time and detects
 * degradation in model certainty using MongoDB aggregation pipelines.
 *
 * ─── Confidence Levels ──────────────────────────────────────────────────
 *   High   : ≥ 90%
 *   Medium : 70% – 89%
 *   Low    : < 70%
 *
 * ─── Metrics Computed ───────────────────────────────────────────────────
 *   - Average Confidence & Baseline Confidence
 *   - Confidence Drift % (relative degradation)
 *   - Confidence Stability Score (0–100)
 *   - Distribution across High / Medium / Low tiers
 *   - Rolling & Moving Averages (7-day MA)
 *   - Variance & Standard Deviation
 *   - Confidence Histogram (binned breakdown)
 */

// ─── Helpers ────────────────────────────────────────────────────────────────
function getDateCutoff(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function computeStats(values) {
  if (!values || values.length === 0) {
    return { mean: 0, std: 0, variance: 0, count: 0 };
  }
  const n = values.length;
  const mean = values.reduce((sum, v) => sum + v, 0) / n;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
  const std = Math.sqrt(variance);
  return {
    mean: parseFloat(mean.toFixed(2)),
    variance: parseFloat(variance.toFixed(2)),
    std: parseFloat(std.toFixed(2)),
    count: n
  };
}

/**
 * Categorize confidence scores into High (>=90), Medium (70-89), Low (<70).
 */
function categorizeConfidence(values) {
  if (!values || values.length === 0) {
    return { high: 0, medium: 0, low: 0, highPct: 0, mediumPct: 0, lowPct: 0, total: 0 };
  }
  let high = 0;
  let medium = 0;
  let low = 0;
  for (const v of values) {
    if (v >= 90) high++;
    else if (v >= 70) medium++;
    else low++;
  }
  const total = values.length;
  return {
    high,
    medium,
    low,
    highPct: parseFloat(((high / total) * 100).toFixed(1)),
    mediumPct: parseFloat(((medium / total) * 100).toFixed(1)),
    lowPct: parseFloat(((low / total) * 100).toFixed(1)),
    total
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  GET /summary
// ═══════════════════════════════════════════════════════════════════════════
async function getConfidenceSummary(days = 14) {
  const cutoff = getDateCutoff(days);

  // Baseline: predictions older than cutoff (or fallback to overall if small)
  const [baselineDocs, currentDocs] = await Promise.all([
    Prediction.find({ predictionType: 'crop', createdAt: { $lt: cutoff } }).select('confidence').lean(),
    Prediction.find({ predictionType: 'crop', createdAt: { $gte: cutoff } }).select('confidence').lean()
  ]);

  const baselineVals = baselineDocs.map(d => d.confidence).filter(v => v != null && !isNaN(v));
  const currentVals = currentDocs.map(d => d.confidence).filter(v => v != null && !isNaN(v));

  // If no baseline data older than cutoff, fallback to overall dataset as baseline
  const baseStats = baselineVals.length > 0 ? computeStats(baselineVals) : computeStats(currentVals);
  const currStats = currentVals.length > 0 ? computeStats(currentVals) : baseStats;

  const baselineConfidence = baseStats.mean;
  const currentConfidence = currStats.mean;

  // Drift % = relative change/degradation: ((Baseline - Current) / Baseline) * 100
  const driftPercent = baselineConfidence > 0
    ? parseFloat((((baselineConfidence - currentConfidence) / baselineConfidence) * 100).toFixed(2))
    : 0;

  const currentTiers = categorizeConfidence(currentVals.length > 0 ? currentVals : baselineVals);

  // Stability Score calculation (0–100)
  // Higher avg confidence + higher high-confidence tier + lower degradation = higher score
  const degradationPenalty = Math.max(0, driftPercent) * 2;
  const stabilityRaw = (currStats.mean * 0.5) + (currentTiers.highPct * 0.3) + (currentTiers.mediumPct * 0.2) - degradationPenalty;
  const stabilityScore = parseFloat(clamp(stabilityRaw).toFixed(1));

  // Recommendation logic
  const isDegrading = driftPercent > 5 || currentConfidence < 75 || currentTiers.lowPct > 20;
  const recommendation = isDegrading
    ? '⚠ Model confidence degrading — High proportion of low-confidence predictions detected. Recommend investigation or retraining.'
    : '✓ Model confidence is stable — Confidence levels are within acceptable operational thresholds.';

  return {
    averageConfidence: currentConfidence,
    baselineConfidence,
    currentConfidence,
    confidenceDriftPercent: driftPercent,
    confidenceStabilityScore: stabilityScore,
    highConfidencePercent: currentTiers.highPct,
    mediumConfidencePercent: currentTiers.mediumPct,
    lowConfidencePercent: currentTiers.lowPct,
    highCount: currentTiers.high,
    mediumCount: currentTiers.medium,
    lowCount: currentTiers.low,
    totalCurrentPredictions: currStats.count,
    totalBaselinePredictions: baseStats.count,
    confidenceVariance: currStats.variance,
    confidenceStdDev: currStats.std,
    isDegrading,
    recommendation,
    lastAnalysis: new Date().toISOString()
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  GET /distribution
// ═══════════════════════════════════════════════════════════════════════════
async function getConfidenceDistribution(days = 14) {
  const cutoff = getDateCutoff(days);

  const [baselineDocs, currentDocs] = await Promise.all([
    Prediction.find({ predictionType: 'crop', createdAt: { $lt: cutoff } }).select('confidence').lean(),
    Prediction.find({ predictionType: 'crop', createdAt: { $gte: cutoff } }).select('confidence').lean()
  ]);

  const bins = [
    { label: '0–50%', min: 0, max: 50 },
    { label: '50–60%', min: 50, max: 60 },
    { label: '60–70%', min: 60, max: 70 },
    { label: '70–80%', min: 70, max: 80 },
    { label: '80–90%', min: 80, max: 90 },
    { label: '90–100%', min: 90, max: 100 }
  ];

  const baseVals = baselineDocs.map(d => d.confidence).filter(v => v != null && !isNaN(v));
  const currVals = currentDocs.map(d => d.confidence).filter(v => v != null && !isNaN(v));

  const baseTotal = baseVals.length || 1;
  const currTotal = currVals.length || 1;

  const histogram = bins.map(bin => {
    const baseCount = baseVals.filter(v => (bin.max === 100 ? (v >= bin.min && v <= bin.max) : (v >= bin.min && v < bin.max))).length;
    const currCount = currVals.filter(v => (bin.max === 100 ? (v >= bin.min && v <= bin.max) : (v >= bin.min && v < bin.max))).length;

    return {
      bin: bin.label,
      baselineCount: baseCount,
      currentCount: currCount,
      baselinePercent: parseFloat(((baseCount / baseTotal) * 100).toFixed(1)),
      currentPercent: parseFloat(((currCount / currTotal) * 100).toFixed(1))
    };
  });

  const tiers = categorizeConfidence(currVals.length > 0 ? currVals : baseVals);

  return {
    histogram,
    tierBreakdown: [
      { name: 'High (≥90%)', value: tiers.highPct, count: tiers.high, color: '#10b981' },
      { name: 'Medium (70–89%)', value: tiers.mediumPct, count: tiers.medium, color: '#f59e0b' },
      { name: 'Low (<70%)', value: tiers.lowPct, count: tiers.low, color: '#ef4444' }
    ],
    totalCurrent: currTotal,
    totalBaseline: baseTotal
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  GET /history
// ═══════════════════════════════════════════════════════════════════════════
async function getConfidenceHistory(days = 90) {
  const historyCutoff = getDateCutoff(days);

  // Baseline average calculation (predictions prior to history period)
  const baselineAggregate = await Prediction.aggregate([
    { $match: { predictionType: 'crop', createdAt: { $lt: historyCutoff } } },
    { $group: { _id: null, avgConf: { $avg: '$confidence' } } }
  ]);
  const overallBaseline = baselineAggregate[0]?.avgConf || 85.0;

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
        confidences: { $push: '$confidence' },
        highCount: { $sum: { $cond: [{ $gte: ['$confidence', 90] }, 1, 0] } },
        mediumCount: {
          $sum: {
            $cond: [
              { $and: [{ $gte: ['$confidence', 70] }, { $lt: ['$confidence', 90] }] },
              1,
              0
            ]
          }
        },
        lowCount: { $sum: { $cond: [{ $lt: ['$confidence', 70] }, 1, 0] } }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Compute stats, moving averages, and rolling averages
  const rawHistory = dailyDocs.map(day => {
    const vals = (day.confidences || []).filter(v => v != null && !isNaN(v));
    const stats = computeStats(vals);
    const avgConf = stats.mean || parseFloat((day.avgConfidence || 0).toFixed(2));
    const count = day.count;

    const driftPct = overallBaseline > 0
      ? parseFloat((((overallBaseline - avgConf) / overallBaseline) * 100).toFixed(2))
      : 0;

    return {
      date: day._id,
      label: new Date(day._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      avgConfidence: avgConf,
      variance: stats.variance,
      stdDev: stats.std,
      predictionCount: count,
      highCount: day.highCount,
      mediumCount: day.mediumCount,
      lowCount: day.lowCount,
      driftPercent: driftPct,
      status: avgConf >= 85 ? 'Healthy' : avgConf >= 75 ? 'Moderate' : 'Degraded'
    };
  });

  // Calculate 7-day Moving Average and 14-day Rolling Average
  const history = rawHistory.map((item, idx, arr) => {
    // 7-day MA
    const maWindow = arr.slice(Math.max(0, idx - 6), idx + 1);
    const ma7 = maWindow.reduce((sum, d) => sum + d.avgConfidence, 0) / maWindow.length;

    // 14-day Rolling Avg
    const rollingWindow = arr.slice(Math.max(0, idx - 13), idx + 1);
    const rolling14 = rollingWindow.reduce((sum, d) => sum + d.avgConfidence, 0) / rollingWindow.length;

    return {
      ...item,
      movingAverage: parseFloat(ma7.toFixed(2)),
      rollingAverage: parseFloat(rolling14.toFixed(2))
    };
  });

  return {
    baselineConfidence: parseFloat(overallBaseline.toFixed(2)),
    totalSnapshots: history.length,
    history
  };
}

module.exports = {
  getConfidenceSummary,
  getConfidenceDistribution,
  getConfidenceHistory
};
