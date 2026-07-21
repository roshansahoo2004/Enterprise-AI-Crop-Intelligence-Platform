const confidenceDriftService = require('../services/confidenceDriftService');

/**
 * Phase-10 Step-4: Enterprise Confidence Drift Monitoring Controller
 *
 * Handles summary, distribution, and historical confidence drift endpoints.
 */

// GET /api/admin/mlops/confidence-drift/summary
exports.getConfidenceSummary = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 14;
    const data = await confidenceDriftService.getConfidenceSummary(days);
    res.json({
      success: true,
      message: 'Confidence drift summary generated successfully',
      data
    });
  } catch (error) {
    console.error('Confidence Drift Controller — Summary Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating confidence drift summary',
      error: error.message
    });
  }
};

// GET /api/admin/mlops/confidence-drift/distribution
exports.getConfidenceDistribution = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 14;
    const data = await confidenceDriftService.getConfidenceDistribution(days);
    res.json({
      success: true,
      message: 'Confidence distribution retrieved successfully',
      data
    });
  } catch (error) {
    console.error('Confidence Drift Controller — Distribution Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching confidence distribution',
      error: error.message
    });
  }
};

// GET /api/admin/mlops/confidence-drift/history
exports.getConfidenceHistory = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 90;
    const data = await confidenceDriftService.getConfidenceHistory(days);
    res.json({
      success: true,
      message: 'Confidence drift history retrieved successfully',
      data
    });
  } catch (error) {
    console.error('Confidence Drift Controller — History Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching confidence drift history',
      error: error.message
    });
  }
};
