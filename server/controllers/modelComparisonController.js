const modelComparisonService = require('../services/modelComparisonService');

/**
 * Phase-11 Step-3: Enterprise Model Version Comparison Center Controller
 *
 * Handles available versions, side-by-side comparison, and comparison history endpoints.
 */

// GET /api/admin/model-comparison/versions
exports.getAvailableVersions = async (req, res) => {
  try {
    const data = await modelComparisonService.getAvailableVersions();
    res.json({
      success: true,
      message: 'Available model versions retrieved successfully',
      data
    });
  } catch (error) {
    console.error('Model Comparison Controller — Versions Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching available versions',
      error: error.message
    });
  }
};

// GET /api/admin/model-comparison/compare?left=v1.0&right=v1.2
exports.compareVersions = async (req, res) => {
  try {
    const left = req.query.left || 'v1.0';
    const right = req.query.right || 'v1.2-candidate';
    const data = await modelComparisonService.compareVersions(left, right);
    res.json({
      success: true,
      message: `Model comparison between ${left} and ${right} generated successfully`,
      data
    });
  } catch (error) {
    console.error('Model Comparison Controller — Compare Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while comparing model versions',
      error: error.message
    });
  }
};

// GET /api/admin/model-comparison/history
exports.getComparisonHistory = async (req, res) => {
  try {
    const data = await modelComparisonService.getComparisonHistory();
    res.json({
      success: true,
      message: 'Comparison history retrieved successfully',
      data
    });
  } catch (error) {
    console.error('Model Comparison Controller — History Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching comparison history',
      error: error.message
    });
  }
};
