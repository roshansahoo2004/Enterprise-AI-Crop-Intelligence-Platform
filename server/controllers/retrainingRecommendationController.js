const retrainingRecommendationService = require('../services/retrainingRecommendationService');

/**
 * Phase-10 Step-5: Enterprise Retraining Recommendation Engine Controller
 *
 * Handles summary, contributing factors, and history endpoints.
 */

// GET /api/admin/mlops/retraining/summary
exports.getRetrainingSummary = async (req, res) => {
  try {
    const data = await retrainingRecommendationService.getRetrainingSummary();
    res.json({
      success: true,
      message: 'Retraining recommendation summary generated successfully',
      data
    });
  } catch (error) {
    console.error('Retraining Controller — Summary Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating retraining recommendation summary',
      error: error.message
    });
  }
};

// GET /api/admin/mlops/retraining/factors
exports.getRetrainingFactors = async (req, res) => {
  try {
    const data = await retrainingRecommendationService.getRetrainingFactors();
    res.json({
      success: true,
      message: 'Retraining factors retrieved successfully',
      data
    });
  } catch (error) {
    console.error('Retraining Controller — Factors Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching retraining factors',
      error: error.message
    });
  }
};

// GET /api/admin/mlops/retraining/history
exports.getRetrainingHistory = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const data = await retrainingRecommendationService.getRetrainingHistory(days);
    res.json({
      success: true,
      message: 'Retraining recommendation history retrieved successfully',
      data
    });
  } catch (error) {
    console.error('Retraining Controller — History Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching retraining recommendation history',
      error: error.message
    });
  }
};
