const Prediction = require('../models/Prediction');

/**
 * Phase-10 Step-2: Enterprise Data Drift Detection Service
 *
 * Computes Population Stability Index (PSI) to detect data drift
 * between a historical baseline and recent production predictions.
 *
 * ─── PSI Formula ───────────────────────────────────────────────────────
 *   PSI = Σ (P_i - Q_i) × ln(P_i / Q_i)
 *
 *   Where:
 *     P_i = proportion of observations in bin i for the current dataset
 *     Q_i = proportion of observations in bin i for the baseline dataset
 *
 * ─── Severity Thresholds ───────────────────────────────────────────────
 *   PSI < 0.10      → Healthy (No significant drift)
 *   0.10 ≤ PSI ≤ 0.25 → Moderate Drift (Investigate)
 *   PSI > 0.25      → High Drift (Retraining recommended)
 *
 * ─── Monitored Features ────────────────────────────────────────────────
 *   Nitrogen, Phosphorus, Potassium, Temperature, Humidity, Rainfall, Soil pH
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
const EPSILON = 1e-6; // Prevent log(0)

// ─── Helper: Date cutoff ────────────────────────────────────────────────────
function getDateCutoff(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

// ─── Helper: Clamp ──────────────────────────────────────────────────────────
function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Determine severity from PSI score.
 */
function getSeverity(psi) {
  if (psi < 0.10) return { label: 'Healthy', color: 'green', level: 0 };
  if (psi <= 0.25) return { label: 'Moderate Drift', color: 'yellow', level: 1 };
  return { label: 'High Drift', color: 'red', level: 2 };
}

/**
 * Compute PSI between two arrays of bin proportions.
 * Each array should have NUM_BINS elements summing to ~1.
 */
function computePSI(baselineProportions, currentProportions) {
  let psi = 0;
  for (let i = 0; i < baselineProportions.length; i++) {
    const q = Math.max(baselineProportions[i], EPSILON);
    const p = Math.max(currentProportions[i], EPSILON);
    psi += (p - q) * Math.log(p / q);
  }
  return Math.max(0, psi);
}

/**
 * Bin raw values into NUM_BINS equal-width bins between min and max.
 * Returns an array of proportions (one per bin).
 */
function binValues(values, min, max) {
  const binWidth = (max - min) / NUM_BINS;
  const counts = new Array(NUM_BINS).fill(0);
  const total = values.length;

  if (total === 0) return counts.map(() => 1 / NUM_BINS); // uniform if empty

  for (const v of values) {
    let idx = Math.floor((v - min) / binWidth);
    idx = Math.max(0, Math.min(NUM_BINS - 1, idx));
    counts[idx]++;
  }

  return counts.map(c => c / total);
}

/**
 * Fetch raw feature values from Prediction collection for a date range.
 * Returns { featureKey: [values] }
 */
async function fetchFeatureValues(dateFilter) {
  const match = { predictionType: 'crop' };
  if (dateFilter) {
    match.createdAt = dateFilter;
  }

  // Build projection for all monitored features
  const projection = { _id: 0 };
  for (const f of MONITORED_FEATURES) {
    projection[f.key] = 1;
  }

  const docs = await Prediction.find(match).select(projection).lean();

  const result = {};
  for (const f of MONITORED_FEATURES) {
    result[f.key] = [];
  }

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
 * Compute aggregate statistics for a set of feature values.
 */
function computeStats(values) {
  if (values.length === 0) return { mean: 0, std: 0 };
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
  const std = Math.sqrt(variance);
  return { mean: parseFloat(mean.toFixed(2)), std: parseFloat(std.toFixed(2)) };
}

/**
 * GET /summary — Generate drift detection summary.
 *
 * Baseline: Predictions older than 14 days
 * Current:  Predictions from the last 14 days
 */
async function getDriftSummary() {
  const cutoff = getDateCutoff(14);

  // Fetch baseline (older than 14 days) and current (last 14 days) data
  const [baseline, current] = await Promise.all([
    fetchFeatureValues({ $lt: cutoff }),
    fetchFeatureValues({ $gte: cutoff })
  ]);

  // Compute per-feature PSI and stats
  const features = [];
  let totalPSI = 0;
  let driftedCount = 0;
  let healthyCount = 0;

  for (const f of MONITORED_FEATURES) {
    const baseVals = baseline.values[f.key];
    const currVals = current.values[f.key];

    const baseStats = computeStats(baseVals);
    const currStats = computeStats(currVals);

    const baseProportions = binValues(baseVals, f.min, f.max);
    const currProportions = binValues(currVals, f.min, f.max);

    const psi = computePSI(baseProportions, currProportions);
    const severity = getSeverity(psi);

    // Drift percentage: relative change in mean
    const driftPercent = baseStats.mean !== 0
      ? parseFloat((Math.abs(currStats.mean - baseStats.mean) / Math.abs(baseStats.mean) * 100).toFixed(1))
      : 0;

    if (severity.level > 0) driftedCount++;
    else healthyCount++;

    totalPSI += psi;

    features.push({
      feature: f.label,
      key: f.key,
      baselineMean: baseStats.mean,
      currentMean: currStats.mean,
      baselineStd: baseStats.std,
      currentStd: currStats.std,
      psi: parseFloat(psi.toFixed(4)),
      driftPercent,
      severity: severity.label,
      severityColor: severity.color,
      severityLevel: severity.level,
      status: severity.level === 0 ? 'Stable' : severity.level === 1 ? 'Warning' : 'Critical'
    });
  }

  const overallPSI = parseFloat((totalPSI / MONITORED_FEATURES.length).toFixed(4));
  const overallSeverity = getSeverity(overallPSI);
  const retraining = overallSeverity.level >= 2 || driftedCount >= 3;

  return {
    overallDriftScore: overallPSI,
    driftSeverity: overallSeverity.label,
    driftSeverityColor: overallSeverity.color,
    driftedFeatures: driftedCount,
    healthyFeatures: healthyCount,
    totalFeatures: MONITORED_FEATURES.length,
    lastDriftAnalysis: new Date().toISOString(),
    baselineDatasetSize: baseline.count,
    currentDatasetSize: current.count,
    retrainingRecommended: retraining,
    retrainingMessage: retraining
      ? '⚠ Retraining Recommended — Significant data drift detected in production features.'
      : '✓ Model is stable — No retraining required at this time.',
    features
  };
}

/**
 * GET /features — Return all monitored features with drift details.
 */
async function getDriftFeatures() {
  const summary = await getDriftSummary();
  return summary.features;
}

/**
 * GET /history — Return historical drift snapshots (daily for last 30 days).
 * Each day computes PSI against the overall baseline (data older than 30 days).
 */
async function getDriftHistory() {
  const historyCutoff = getDateCutoff(30);
  const baselineCutoff = getDateCutoff(60);

  // Baseline: 60 to 30 days ago
  const baseline = await fetchFeatureValues({
    $gte: baselineCutoff,
    $lt: historyCutoff
  });

  // Get daily aggregated data for the last 30 days
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
        avgNitrogen: { $avg: '$nitrogen' },
        avgPhosphorus: { $avg: '$phosphorus' },
        avgPotassium: { $avg: '$potassium' },
        avgTemperature: { $avg: '$temperature' },
        avgHumidity: { $avg: '$humidity' },
        avgRainfall: { $avg: '$rainfall' },
        avgPh: { $avg: '$ph' },
        nitrogens: { $push: '$nitrogen' },
        phosphoruses: { $push: '$phosphorus' },
        potassiums: { $push: '$potassium' },
        temperatures: { $push: '$temperature' },
        humidities: { $push: '$humidity' },
        rainfalls: { $push: '$rainfall' },
        phs: { $push: '$ph' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const featureKeyMap = {
    nitrogens: 'nitrogen',
    phosphoruses: 'phosphorus',
    potassiums: 'potassium',
    temperatures: 'temperature',
    humidities: 'humidity',
    rainfalls: 'rainfall',
    phs: 'ph'
  };

  const history = dailyDocs.map(day => {
    let dayTotalPSI = 0;
    let drifted = 0;

    for (const f of MONITORED_FEATURES) {
      const arrayKey = Object.keys(featureKeyMap).find(k => featureKeyMap[k] === f.key);
      const dayVals = (day[arrayKey] || []).filter(v => v != null && !isNaN(v));
      const baseVals = baseline.values[f.key];

      const baseProportions = binValues(baseVals, f.min, f.max);
      const currProportions = binValues(dayVals, f.min, f.max);

      const psi = computePSI(baseProportions, currProportions);
      dayTotalPSI += psi;
      if (psi >= 0.10) drifted++;
    }

    const avgPSI = parseFloat((dayTotalPSI / MONITORED_FEATURES.length).toFixed(4));
    const severity = getSeverity(avgPSI);

    return {
      date: day._id,
      label: new Date(day._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      overallPSI: avgPSI,
      driftedFeatures: drifted,
      healthyFeatures: MONITORED_FEATURES.length - drifted,
      predictions: day.count,
      severity: severity.label,
      severityColor: severity.color
    };
  });

  return history;
}

module.exports = {
  getDriftSummary,
  getDriftFeatures,
  getDriftHistory,
  computePSI,
  getSeverity,
  MONITORED_FEATURES
};
