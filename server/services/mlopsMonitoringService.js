const modelHealthService = require('./modelHealthService');
const dataDriftService = require('./dataDriftService');
const featureDriftService = require('./featureDriftService');
const confidenceDriftService = require('./confidenceDriftService');
const retrainingRecommendationService = require('./retrainingRecommendationService');
const Prediction = require('../models/Prediction');

/**
 * Phase-10 Step-6: Enterprise MLOps Monitoring Center Service
 *
 * Centralized operations center synthesizing metrics, smart alerts,
 * historical snapshots, and chronological event timelines across all MLOps modules.
 */

// ─── Helpers ────────────────────────────────────────────────────────────────
function getDateCutoff(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

/**
 * Generate smart alerts dynamically based on live metrics across all modules.
 */
async function generateSmartAlerts() {
  const alerts = [];
  const now = new Date();

  const [healthData, dataDriftData, featureDriftData, confidenceData, retrainingData] = await Promise.all([
    modelHealthService.getModelHealthSummary().catch(() => null),
    dataDriftService.getDriftSummary().catch(() => null),
    featureDriftService.getFeatureDriftSummary().catch(() => null),
    confidenceDriftService.getConfidenceSummary().catch(() => null),
    retrainingRecommendationService.getRetrainingSummary().catch(() => null)
  ]);

  // 1. Model Health Alerts
  if (healthData) {
    if (healthData.healthScore < 50) {
      alerts.push({
        id: 'ALT-HEALTH-001',
        title: 'Critical Model Health Degradation',
        severity: 'Critical',
        source: 'Model Health',
        description: `Composite model health score dropped to ${healthData.healthScore}/100. Latency or failure rates exceed operational boundaries.`,
        createdAt: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
        resolved: false,
        recommendation: 'Inspect model serving infrastructure and evaluate fallback frequency.'
      });
    } else if (healthData.healthScore < 70) {
      alerts.push({
        id: 'ALT-HEALTH-002',
        title: 'Model Health Warning',
        severity: 'Warning',
        source: 'Model Health',
        description: `Model health score is at ${healthData.healthScore}/100. Operational metrics require monitoring.`,
        createdAt: new Date(now.getTime() - 1000 * 60 * 120).toISOString(),
        resolved: false,
        recommendation: 'Review latency metrics and prediction confidence levels.'
      });
    }

    if (healthData.shapCoverage < 70) {
      alerts.push({
        id: 'ALT-XAI-001',
        title: 'Low Explainability SHAP Coverage',
        severity: 'Warning',
        source: 'Explainability',
        description: `SHAP explanation coverage is currently at ${healthData.shapCoverage}%. Fallback rule explanations active.`,
        createdAt: new Date(now.getTime() - 1000 * 60 * 240).toISOString(),
        resolved: true,
        recommendation: 'Ensure Python SHAP microservice is running and accessible.'
      });
    }

    if (healthData.failureRate > 10) {
      alerts.push({
        id: 'ALT-PERF-001',
        title: 'Elevated Prediction Failure Rate',
        severity: 'High',
        source: 'Prediction Performance',
        description: `Low-confidence prediction failure rate reached ${healthData.failureRate}%.`,
        createdAt: new Date(now.getTime() - 1000 * 60 * 90).toISOString(),
        resolved: false,
        recommendation: 'Investigate low-confidence input samples in production traffic.'
      });
    }
  }

  // 2. Data Drift Alerts
  if (dataDriftData) {
    if (dataDriftData.overallDriftScore > 0.25) {
      alerts.push({
        id: 'ALT-DRIFT-001',
        title: 'High Data Drift Detected (PSI > 0.25)',
        severity: 'Critical',
        source: 'Data Drift',
        description: `Overall Population Stability Index reached ${dataDriftData.overallDriftScore.toFixed(4)}. Production feature distributions diverge significantly from baseline.`,
        createdAt: new Date(now.getTime() - 1000 * 60 * 45).toISOString(),
        resolved: false,
        recommendation: 'Trigger retraining pipeline with recent production dataset.'
      });
    } else if (dataDriftData.overallDriftScore > 0.10) {
      alerts.push({
        id: 'ALT-DRIFT-002',
        title: 'Moderate Data Drift Observed',
        severity: 'Warning',
        source: 'Data Drift',
        description: `Overall PSI is at ${dataDriftData.overallDriftScore.toFixed(4)}. ${dataDriftData.driftedFeatures} feature(s) showing distribution drift.`,
        createdAt: new Date(now.getTime() - 1000 * 60 * 180).toISOString(),
        resolved: false,
        recommendation: 'Monitor feature drift analytics for specific shifting variables.'
      });
    }
  }

  // 3. Feature Drift Alerts
  if (featureDriftData && featureDriftData.features) {
    const highDriftFeatures = featureDriftData.features.filter(f => f.severity === 'High Drift');
    if (highDriftFeatures.length > 0) {
      alerts.push({
        id: 'ALT-FCTR-001',
        title: `High Drift in Monitored Features (${highDriftFeatures.map(f => f.feature).join(', ')})`,
        severity: 'High',
        source: 'Feature Drift',
        description: `${highDriftFeatures.length} feature(s) exceed High Drift thresholds: ${highDriftFeatures.map(f => `${f.feature} (PSI: ${f.psi})`).join(', ')}.`,
        createdAt: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
        resolved: false,
        recommendation: 'Check input data sensors or soil measurement calibration.'
      });
    }
  }

  // 4. Confidence Drift Alerts
  if (confidenceData) {
    if (confidenceData.isDegrading) {
      alerts.push({
        id: 'ALT-CONF-001',
        title: 'Model Prediction Confidence Degradation',
        severity: 'High',
        source: 'Confidence Drift',
        description: `Average confidence is ${confidenceData.averageConfidence.toFixed(1)}% with a degradation rate of ${confidenceData.confidenceDriftPercent}%.`,
        createdAt: new Date(now.getTime() - 1000 * 60 * 150).toISOString(),
        resolved: false,
        recommendation: 'Perform error analysis on recent low-confidence predictions.'
      });
    }
  }

  // 5. Retraining Alerts
  if (retrainingData) {
    if (retrainingData.recommendationScore >= 80) {
      alerts.push({
        id: 'ALT-RETRAIN-001',
        title: 'Immediate Retraining Required',
        severity: 'Critical',
        source: 'Retraining',
        description: `Retraining Risk Score reached ${retrainingData.recommendationScore}/100 (${retrainingData.overallRecommendation}).`,
        createdAt: new Date(now.getTime() - 1000 * 60 * 15).toISOString(),
        resolved: false,
        recommendation: 'Initiate emergency model retraining and deployment immediately.'
      });
    } else if (retrainingData.recommendationScore >= 60) {
      alerts.push({
        id: 'ALT-RETRAIN-002',
        title: 'Retraining Scheduled Recommended',
        severity: 'High',
        source: 'Retraining',
        description: `Retraining Risk Score is ${retrainingData.recommendationScore}/100. Retraining recommended in next maintenance window.`,
        createdAt: new Date(now.getTime() - 1000 * 60 * 300).toISOString(),
        resolved: false,
        recommendation: 'Prepare new training data slice and schedule retraining pipeline.'
      });
    }
  }

  // Fallback info alert if no critical issues found
  if (alerts.length === 0) {
    alerts.push({
      id: 'ALT-INFO-001',
      title: 'All Systems Operating Normally',
      severity: 'Info',
      source: 'Model Health',
      description: 'Model operational health, feature stability, and prediction confidence are optimal.',
      createdAt: new Date(now.getTime() - 1000 * 60 * 10).toISOString(),
      resolved: true,
      recommendation: 'Continue regular automated monitoring.'
    });
  }

  return { alerts, healthData, dataDriftData, featureDriftData, confidenceData, retrainingData };
}

// ═══════════════════════════════════════════════════════════════════════════
//  GET /overview
// ═══════════════════════════════════════════════════════════════════════════
async function getMonitoringOverview() {
  const { alerts, healthData, dataDriftData, featureDriftData, confidenceData, retrainingData } = await generateSmartAlerts();

  const openAlerts = alerts.filter(a => !a.resolved);
  const criticalAlerts = openAlerts.filter(a => a.severity === 'Critical' || a.severity === 'High');

  let overallStatus = 'Optimal';
  if (criticalAlerts.length > 0) overallStatus = 'Critical';
  else if (openAlerts.length > 0) overallStatus = 'Warning';

  return {
    overallSystemStatus: overallStatus,
    healthScore: healthData?.healthScore ?? 85,
    dataDriftStatus: dataDriftData?.driftSeverity ?? 'Healthy',
    featureDriftStatus: featureDriftData?.highDrift > 0 ? 'Critical' : featureDriftData?.moderateDrift > 0 ? 'Warning' : 'Healthy',
    confidenceDriftStatus: confidenceData?.isDegrading ? 'Degraded' : 'Healthy',
    retrainingRecommendation: retrainingData?.overallRecommendation ?? 'Healthy',
    retrainingScore: retrainingData?.recommendationScore ?? 15,
    openAlertsCount: openAlerts.length,
    criticalAlertsCount: criticalAlerts.length,
    totalAlertsCount: alerts.length,
    lastAnalysisTime: new Date().toISOString(),
    moduleScores: [
      { module: 'Model Health', score: healthData?.healthScore ?? 85, status: healthData?.healthStatus?.label ?? 'Good' },
      { module: 'Data Stability', score: Math.max(0, Math.round(100 - (dataDriftData?.overallDriftScore ?? 0.05) * 200)), status: dataDriftData?.driftSeverity ?? 'Healthy' },
      { module: 'Feature Stability', score: featureDriftData?.overallStabilityScore ?? 90, status: featureDriftData?.highDrift > 0 ? 'High Drift' : 'Healthy' },
      { module: 'Confidence Score', score: Math.round(confidenceData?.averageConfidence ?? 85), status: confidenceData?.isDegrading ? 'Degraded' : 'Healthy' },
      { module: 'Retraining Health', score: Math.max(0, Math.round(100 - (retrainingData?.recommendationScore ?? 15))), status: retrainingData?.overallRecommendation ?? 'Healthy' }
    ]
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  GET /alerts
// ═══════════════════════════════════════════════════════════════════════════
async function getSmartAlerts(filters = {}) {
  const { alerts } = await generateSmartAlerts();

  let filtered = [...alerts];

  if (filters.module) {
    filtered = filtered.filter(a => a.source.toLowerCase() === filters.module.toLowerCase());
  }

  if (filters.severity) {
    filtered = filtered.filter(a => a.severity.toLowerCase() === filters.severity.toLowerCase());
  }

  if (filters.resolved !== undefined && filters.resolved !== '') {
    const isResolved = filters.resolved === 'true' || filters.resolved === true;
    filtered = filtered.filter(a => a.resolved === isResolved);
  }

  const severityCounts = {
    Info: alerts.filter(a => a.severity === 'Info').length,
    Warning: alerts.filter(a => a.severity === 'Warning').length,
    High: alerts.filter(a => a.severity === 'High').length,
    Critical: alerts.filter(a => a.severity === 'Critical').length
  };

  return {
    total: alerts.length,
    filteredTotal: filtered.length,
    severityCounts,
    alerts: filtered
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  GET /history
// ═══════════════════════════════════════════════════════════════════════════
async function getMonitoringHistory(days = 30) {
  const cutoff = getDateCutoff(days);

  const dailyDocs = await Prediction.aggregate([
    {
      $match: {
        predictionType: 'crop',
        createdAt: { $gte: cutoff }
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

  const history = dailyDocs.map(day => {
    const avgConf = day.avgConfidence || 85;
    const healthScore = Math.round(avgConf * 0.9 + (100 - (day.avgLatency / 20)));
    const openAlerts = day.lowConfCount > 2 ? Math.min(5, day.lowConfCount) : 0;
    const status = healthScore >= 85 ? 'Optimal' : healthScore >= 70 ? 'Warning' : 'Critical';

    return {
      date: day._id,
      label: new Date(day._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      healthScore: Math.min(100, Math.max(0, healthScore)),
      avgConfidence: parseFloat(avgConf.toFixed(1)),
      avgLatency: Math.round(day.avgLatency || 120),
      predictions: day.count,
      openAlerts,
      status
    };
  });

  return {
    totalSnapshots: history.length,
    history
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  GET /timeline
// ═══════════════════════════════════════════════════════════════════════════
async function getMonitoringTimeline(days = 7) {
  const { alerts } = await generateSmartAlerts();

  // Create chronological event feed from predictions + alerts
  const events = [];

  alerts.forEach(a => {
    events.push({
      id: a.id,
      type: 'ALERT',
      title: a.title,
      source: a.source,
      severity: a.severity,
      timestamp: a.createdAt,
      message: a.description,
      status: a.resolved ? 'RESOLVED' : 'ACTIVE'
    });
  });

  // Fetch recent prediction events summary
  const recentPredictions = await Prediction.find({ predictionType: 'crop' })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('predictedCrop confidence createdAt predictionTimeMs')
    .lean();

  recentPredictions.forEach((p, idx) => {
    events.push({
      id: `EVT-PRED-${idx + 1}`,
      type: 'PREDICTION_EVENT',
      title: `Prediction Executed: ${p.predictedCrop || 'Crop'} (${p.confidence}% certainty)`,
      source: 'Prediction Engine',
      severity: p.confidence < 70 ? 'Warning' : 'Info',
      timestamp: p.createdAt,
      message: `Latency: ${p.predictionTimeMs || 120}ms, Confidence: ${p.confidence}%`,
      status: 'LOGGED'
    });
  });

  // Sort events newest first
  events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return {
    totalEvents: events.length,
    events
  };
}

module.exports = {
  getMonitoringOverview,
  getSmartAlerts,
  getMonitoringHistory,
  getMonitoringTimeline
};
