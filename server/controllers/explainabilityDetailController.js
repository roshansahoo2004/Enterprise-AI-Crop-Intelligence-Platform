const explainabilityDetailService = require('../services/explainabilityDetailService');

/**
 * Phase-9 Step-3: Explainability Prediction Detail Inspector Controller
 */
exports.getPredictionDetailInspector = async (req, res) => {
  try {
    const detail = await explainabilityDetailService.getExplainabilityDetail(req.params.predictionId);
    if (!detail) {
      return res.status(404).json({
        success: false,
        message: 'Prediction detail record not found'
      });
    }

    res.json({
      success: true,
      message: 'Explainability prediction details successfully retrieved',
      detail
    });
  } catch (error) {
    console.error('Explainability Detail Controller Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching prediction explainability details',
      error: error.message
    });
  }
};
