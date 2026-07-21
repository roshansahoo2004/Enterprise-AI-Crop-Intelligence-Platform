const dataDriftService = require('../services/dataDriftService');

/**
 * Phase-10 Step-2: Enterprise Data Drift Detection Controller
 *
 * Handles drift summary, feature details, and history endpoints.
 */

// GET /api/admin/mlops/data-drift/summary
exports.getDriftSummary = async (req, res) => {
  try {
    const data = await dataDriftService.getDriftSummary();
    res.json({
      success: true,
      message: 'Data drift summary generated successfully',
      data
    });
  } catch (error) {
    console.error('Data Drift Controller — Summary Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating data drift summary',
      error: error.message
    });
  }
};

// GET /api/admin/mlops/data-drift/features
exports.getDriftFeatures = async (req, res) => {
  try {
    const data = await dataDriftService.getDriftFeatures();
    res.json({
      success: true,
      message: 'Data drift features retrieved successfully',
      data
    });
  } catch (error) {
    console.error('Data Drift Controller — Features Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching data drift features',
      error: error.message
    });
  }
};

// GET /api/admin/mlops/data-drift/history
exports.getDriftHistory = async (req, res) => {
  try {
    const data = await dataDriftService.getDriftHistory();
    res.json({
      success: true,
      message: 'Data drift history retrieved successfully',
      data
    });
  } catch (error) {
    console.error('Data Drift Controller — History Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching data drift history',
      error: error.message
    });
  }
};
