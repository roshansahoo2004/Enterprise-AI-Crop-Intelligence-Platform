const mlopsMonitoringService = require('../services/mlopsMonitoringService');

/**
 * Phase-10 Step-6: Enterprise MLOps Monitoring Center Controller
 *
 * Handles overview, alerts, history, and timeline endpoints.
 */

// GET /api/admin/mlops/monitoring/overview
exports.getOverview = async (req, res) => {
  try {
    const data = await mlopsMonitoringService.getMonitoringOverview();
    res.json({
      success: true,
      message: 'MLOps monitoring overview generated successfully',
      data
    });
  } catch (error) {
    console.error('MLOps Monitoring Controller — Overview Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating monitoring overview',
      error: error.message
    });
  }
};

// GET /api/admin/mlops/monitoring/alerts
exports.getAlerts = async (req, res) => {
  try {
    const filters = {
      module: req.query.module,
      severity: req.query.severity,
      resolved: req.query.resolved
    };
    const data = await mlopsMonitoringService.getSmartAlerts(filters);
    res.json({
      success: true,
      message: 'Smart alerts retrieved successfully',
      data
    });
  } catch (error) {
    console.error('MLOps Monitoring Controller — Alerts Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching smart alerts',
      error: error.message
    });
  }
};

// GET /api/admin/mlops/monitoring/history
exports.getHistory = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const data = await mlopsMonitoringService.getMonitoringHistory(days);
    res.json({
      success: true,
      message: 'Monitoring history retrieved successfully',
      data
    });
  } catch (error) {
    console.error('MLOps Monitoring Controller — History Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching monitoring history',
      error: error.message
    });
  }
};

// GET /api/admin/mlops/monitoring/timeline
exports.getTimeline = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const data = await mlopsMonitoringService.getMonitoringTimeline(days);
    res.json({
      success: true,
      message: 'Monitoring timeline retrieved successfully',
      data
    });
  } catch (error) {
    console.error('MLOps Monitoring Controller — Timeline Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching monitoring timeline',
      error: error.message
    });
  }
};
