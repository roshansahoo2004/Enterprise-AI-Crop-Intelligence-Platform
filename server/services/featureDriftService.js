const Prediction = require('../models/Prediction');

/**
 * Phase-10 Step-3: Enterprise Feature Drift Analytics Service
 *
 * Provides deep per-feature historical analysis, computing extended
 * statistics (mean, median, std, variance, PSI, drift %, trend) and
 * per-feature historical snapshots up to 90 days.
 *
 * Re-uses the PSI computation approach from dataDriftService but adds:
 *  - Median computation
 *  - Variance exposure
 *  - Per-feature daily history (GET /history/:feature)
 *  - Baseline vs Production comparison (GET /compare)
 *  - Overall Feature Stability Score (0–100)
 *  - Configurable time windows (7 / 30 / 90 days)
 */

// ─── Configuration ──────────────────────────────────────────────────────────
const MONITORED_FEATURES = [
  { key: 'nitrogen',    label: 'Nitrogen',    min: 0, max: 200 },
  { key: 'phosphorus',  label: 'Phosphorus',  min: 0, max: 200 },
  { key: 'potassium',   label: 'Potassium',   min: 0, max: 300 },
  { key: 'temperature', label: 'Temperature', min: -10, max: 60 },
  { key: 'humidity',    label: 'Humidity',     min: 0, max: 100 },
  { key: 'rainfall',    label: 'Rainfall',    min: 0, max: 500 },
  { key: 'ph',          label: 'Soil pH',     min: 0, max: 14 }
];

const NUM_BINS = 10;
const EPSILON = 1e-6;

// ─── Helpers ────────────────────────────────────────────────────────────────
function getDateCutoff(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function getSeverity(psi) {
  if (psi < 0.10) return { label: 'Healthy', color: 'green', level: 0 };
  if (psi <= 0.25) return { label: 'Moderate Drift', color: 'yellow', level: 1 };
  return { label: 'High Drift', color: 'red', level: 2 };
}

function computePSI(baselineProportions, currentProportions) {
  let psi = 0;
  for (let i = 0; i < baselineProportions.length; i++) {
    const q = Math.max(baselineProportions[i], EPSILON);
    const p = Math.max(currentProportions[i], EPSILON);
    psi += (p - q) * Math.log(p / q);
  }
  return Math.max(0, psi);
}

function binValues(values, min, max) {
  const binWidth = (max - min) / NUM_BINS;
  const counts = new Array(NUM_BINS).fill(0);
  const total = values.length;
  if (total === 0) return counts.map(() => 1 / NUM_BINS);
  for (const v of values) {
    let idx = Math.floor((v - min) / binWidth);
    idx = Math.max(0, Math.min(NUM_BINS - 1, idx));
    counts[idx]++;
  }
  return counts.map(c => c / total);
}

/**
 * Extended statistics: mean, median, std, variance.
 */
function computeExtendedStats(values) {
  if (values.length === 0) return { mean: 0, median: 0, std: 0, variance: 0, count: 0, min: 0, max: 0 };
  const n = values.length;
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const median = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)];
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
  const std = Math.sqrt(variance);
  return {
    mean: parseFloat(mean.toFixed(2)),
    median: parseFloat(median.toFixed(2)),
    std: parseFloat(std.toFixed(2)),
    variance: parseFloat(variance.toFixed(2)),
    count: n,
    min: parseFloat(sorted[0].toFixed(2)),
    max: parseFloat(sorted[n - 1].toFixed(2))
  };
}

/**
 * Fetch raw feature values for a date range.
 */
async function fetchFeatureValues(dateFilter) {
  const match = { predictionType: 'crop' };
  if (dateFilter) match.createdAt = dateFilter;

  const projection = { _id: 0 };
  for (const f of MONITORED_FEATURES) projection[f.key] = 1;

  const docs = await Prediction.find(match).select(projection).lean();

  const result = {};
  for (const f of MONITORED_FEATURES) result[f.key] = [];

  for (const doc of docs) {
    for (const f of MONITORED_FEATURES) {
      if (doc[f.key] != null && !isNaN(doc[f.key])) {
        result[f.key].push(doc[f.key]);
      }
    }
  }
  return { values: result, count: docs.length };
}

/**
 * Determine trend direction from baseline mean → current mean.
 */
function getTrend(baselineMean, currentMean) {
  const diff = currentMean - baselineMean;
  const threshold = Math.abs(baselineMean) * 0.02; // 2% threshold
  if (Math.abs(diff) <= threshold) return { direction: 'stable', arrow: '→' };
  return diff > 0
    ? { direction: 'increasing', arrow: '↑' }
    : { direction: 'decreasing', arrow: '↓' };
}

// ═══════════════════════════════════════════════════════════════════════════
//  GET /summary
// ═══════════════════════════════════════════════════════════════════════════
async function getFeatureDriftSummary(days = 14) {
  const cutoff = getDateCutoff(days);

  const [baseline, current] = await Promise.all([
    fetchFeatureValues({ $lt: cutoff }),
    fetchFeatureValues({ $gte: cutoff })
  ]);

  let totalPSI = 0;
  let totalDriftPercent = 0;
  let healthyCount = 0;
  let moderateCount = 0;
  let highCount = 0;
  const featureDetails = [];

  for (const f of MONITORED_FEATURES) {
    const baseVals = baseline.values[f.key];
    const currVals = current.values[f.key];

    const baseStats = computeExtendedStats(baseVals);
    const currStats = computeExtendedStats(currVals);

    const baseProportions = binValues(baseVals, f.min, f.max);
    const currProportions = binValues(currVals, f.min, f.max);

    const psi = computePSI(baseProportions, currProportions);
    const severity = getSeverity(psi);
    const trend = getTrend(baseStats.mean, currStats.mean);

    const driftPercent = baseStats.mean !== 0
      ? parseFloat((Math.abs(currStats.mean - baseStats.mean) / Math.abs(baseStats.mean) * 100).toFixed(1))
      : 0;

    if (severity.level === 0) healthyCount++;
    else if (severity.level === 1) moderateCount++;
    else highCount++;

    totalPSI += psi;
    totalDriftPercent += driftPercent;

    featureDetails.push({
      feature: f.label,
      key: f.key,
      baselineMean: baseStats.mean,
      currentMean: currStats.mean,
      baselineMedian: baseStats.median,
      currentMedian: currStats.median,
      baselineStd: baseStats.std,
      currentStd: currStats.std,
      baselineVariance: baseStats.variance,
      currentVariance: currStats.variance,
      psi: parseFloat(psi.toFixed(4)),
      driftPercent,
      severity: severity.label,
      severityColor: severity.color,
      severityLevel: severity.level,
      trend: trend.direction,
      trendArrow: trend.arrow,
      status: severity.level === 0 ? 'Stable' : severity.level === 1 ? 'Warning' : 'Critical'
    });
  }

  const totalFeatures = MONITORED_FEATURES.length;
  const avgPSI = parseFloat((totalPSI / totalFeatures).toFixed(4));
  const avgDriftPercent = parseFloat((totalDriftPercent / totalFeatures).toFixed(1));

  // Stability score: 100 = all features healthy, 0 = all features high-drift
  // Each healthy feature contributes 100/n, moderate 50/n, high 0/n
  const stabilityScore = parseFloat(clamp(
    ((healthyCount * 100 + moderateCount * 50) / totalFeatures)
  ).toFixed(1));

  return {
    totalFeatures,
    healthyFeatures: healthyCount,
    moderateDrift: moderateCount,
    highDrift: highCount,
    overallStabilityScore: stabilityScore,
    averagePSI: avgPSI,
    averageDriftPercent: avgDriftPercent,
    lastAnalysis: new Date().toISOString(),
    features: featureDetails
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  GET /history/:feature
// ═══════════════════════════════════════════════════════════════════════════
async function getFeatureHistory(featureKey, days = 90) {
  const featureConfig = MONITORED_FEATURES.find(f => f.key === featureKey);
  if (!featureConfig) {
    throw new Error(`Unknown feature: ${featureKey}. Valid: ${MONITORED_FEATURES.map(f => f.key).join(', ')}`);
  }

  const historyCutoff = getDateCutoff(days);
  const baselineCutoff = getDateCutoff(days + 30);

  // Baseline: data from (days+30) to (days) ago
  const baseline = await fetchFeatureValues({
    $gte: baselineCutoff,
    $lt: historyCutoff
  });
  const baseVals = baseline.values[featureKey];
  const baseStats = computeExtendedStats(baseVals);
  const baseProportions = binValues(baseVals, featureConfig.min, featureConfig.max);

  // Daily aggregation for the specified window
  const dailyDocs = await Prediction.aggregate([
    {
      $match: {
        predictionType: 'crop',
        createdAt: { $gte: historyCutoff },
        [featureKey]: { $ne: null }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
        mean: { $avg: `$${featureKey}` },
        min: { $min: `$${featureKey}` },
        max: { $max: `$${featureKey}` },
        values: { $push: `$${featureKey}` }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const history = dailyDocs.map(day => {
    const dayVals = (day.values || []).filter(v => v != null && !isNaN(v));
    const dayStats = computeExtendedStats(dayVals);
    const dayProportions = binValues(dayVals, featureConfig.min, featureConfig.max);
    const psi = computePSI(baseProportions, dayProportions);
    const severity = getSeverity(psi);
    const trend = getTrend(baseStats.mean, dayStats.mean);

    const driftPercent = baseStats.mean !== 0
      ? parseFloat((Math.abs(dayStats.mean - baseStats.mean) / Math.abs(baseStats.mean) * 100).toFixed(1))
      : 0;

    return {
      date: day._id,
      label: new Date(day._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: day.count,
      mean: dayStats.mean,
      median: dayStats.median,
      std: dayStats.std,
      variance: dayStats.variance,
      min: dayStats.min,
      max: dayStats.max,
      psi: parseFloat(psi.toFixed(4)),
      driftPercent,
      severity: severity.label,
      severityColor: severity.color,
      trend: trend.direction,
      trendArrow: trend.arrow
    };
  });

  return {
    feature: featureConfig.label,
    key: featureConfig.key,
    baselineStats: baseStats,
    baselineSamples: baseVals.length,
    totalSnapshots: history.length,
    history
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  GET /compare
// ═══════════════════════════════════════════════════════════════════════════
async function getFeatureComparison(days = 14) {
  const cutoff = getDateCutoff(days);

  const [baseline, current] = await Promise.all([
    fetchFeatureValues({ $lt: cutoff }),
    fetchFeatureValues({ $gte: cutoff })
  ]);

  const comparison = MONITORED_FEATURES.map(f => {
    const baseVals = baseline.values[f.key];
    const currVals = current.values[f.key];

    const baseStats = computeExtendedStats(baseVals);
    const currStats = computeExtendedStats(currVals);

    const baseProportions = binValues(baseVals, f.min, f.max);
    const currProportions = binValues(currVals, f.min, f.max);

    const psi = computePSI(baseProportions, currProportions);
    const severity = getSeverity(psi);
    const trend = getTrend(baseStats.mean, currStats.mean);

    const driftPercent = baseStats.mean !== 0
      ? parseFloat((Math.abs(currStats.mean - baseStats.mean) / Math.abs(baseStats.mean) * 100).toFixed(1))
      : 0;

    return {
      feature: f.label,
      key: f.key,
      baseline: {
        mean: baseStats.mean,
        median: baseStats.median,
        std: baseStats.std,
        variance: baseStats.variance,
        count: baseStats.count,
        min: baseStats.min,
        max: baseStats.max
      },
      current: {
        mean: currStats.mean,
        median: currStats.median,
        std: currStats.std,
        variance: currStats.variance,
        count: currStats.count,
        min: currStats.min,
        max: currStats.max
      },
      psi: parseFloat(psi.toFixed(4)),
      driftPercent,
      severity: severity.label,
      severityColor: severity.color,
      severityLevel: severity.level,
      trend: trend.direction,
      trendArrow: trend.arrow,
      status: severity.level === 0 ? 'Stable' : severity.level === 1 ? 'Warning' : 'Critical'
    };
  });

  return {
    baselineSamples: baseline.count,
    currentSamples: current.count,
    features: comparison,
    analysisDate: new Date().toISOString()
  };
}

module.exports = {
  getFeatureDriftSummary,
  getFeatureHistory,
  getFeatureComparison,
  MONITORED_FEATURES
};
