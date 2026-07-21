const featureDriftService = require('../services/featureDriftService');

/**
 * Phase-10 Step-3: Enterprise Feature Drift Analytics Controller
 *
 * Handles feature drift summary, per-feature history, and comparison endpoints.
 */

// GET /api/admin/mlops/feature-drift/summary
exports.getFeatureDriftSummary = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 14;
    const data = await featureDriftService.getFeatureDriftSummary(days);
    res.json({
      success: true,
      message: 'Feature drift summary generated successfully',
      data
    });
  } catch (error) {
    console.error('Feature Drift Controller — Summary Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating feature drift summary',
      error: error.message
    });
  }
};

// GET /api/admin/mlops/feature-drift/history/:feature
exports.getFeatureHistory = async (req, res) => {
  try {
    const { feature } = req.params;
    const days = parseInt(req.query.days) || 90;
    const data = await featureDriftService.getFeatureHistory(feature, days);
    res.json({
      success: true,
      message: `Feature history for ${feature} retrieved successfully`,
      data
    });
  } catch (error) {
    console.error('Feature Drift Controller — History Error:', error);
    const status = error.message.includes('Unknown feature') ? 400 : 500;
    res.status(status).json({
      success: false,
      message: error.message || 'Server error while fetching feature history',
      error: error.message
    });
  }
};

// GET /api/admin/mlops/feature-drift/compare
exports.getFeatureComparison = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 14;
    const data = await featureDriftService.getFeatureComparison(days);
    res.json({
      success: true,
      message: 'Feature comparison generated successfully',
      data
    });
  } catch (error) {
    console.error('Feature Drift Controller — Compare Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating feature comparison',
      error: error.message
    });
  }
};
