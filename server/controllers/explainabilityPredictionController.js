const explainabilityPredictionService = require('../services/explainabilityPredictionService');

/**
 * Phase-9 Step-2: Explainability Prediction Explorer Controller
 */

exports.getPredictionsList = async (req, res) => {
  try {
    const result = await explainabilityPredictionService.getExplainabilityPredictions(req.query);
    res.json({
      success: true,
      message: 'Explainability predictions successfully fetched',
      pagination: result.pagination,
      predictions: result.predictions
    });
  } catch (error) {
    console.error('Explainability Prediction Controller Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching explainability predictions',
      error: error.message
    });
  }
};

exports.getPredictionDetail = async (req, res) => {
  try {
    const prediction = await explainabilityPredictionService.getExplainabilityPredictionById(req.params.id);
    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction record not found'
      });
    }

    res.json({
      success: true,
      message: 'Prediction explainability details successfully fetched',
      prediction
    });
  } catch (error) {
    console.error('Explainability Prediction Detail Controller Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching prediction details',
      error: error.message
    });
  }
};
