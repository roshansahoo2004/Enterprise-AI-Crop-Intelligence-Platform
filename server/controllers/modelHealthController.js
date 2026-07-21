const modelHealthService = require('../services/modelHealthService');

/**
 * Phase-10 Step-1: Model Health Dashboard Controller
 *
 * Handles health summary and history endpoints.
 */

// GET /api/admin/mlops/model-health/summary
exports.getModelHealthSummary = async (req, res) => {
  try {
    const data = await modelHealthService.getModelHealthSummary();
    res.json({
      success: true,
      message: 'Model health summary generated successfully',
      data
    });
  } catch (error) {
    console.error('Model Health Controller — Summary Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating model health summary',
      error: error.message
    });
  }
};

// GET /api/admin/mlops/model-health/history
exports.getModelHealthHistory = async (req, res) => {
  try {
    const history = await modelHealthService.getModelHealthHistory();
    res.json({
      success: true,
      message: 'Model health history retrieved successfully',
      data: history
    });
  } catch (error) {
    console.error('Model Health Controller — History Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching model health history',
      error: error.message
    });
  }
};
