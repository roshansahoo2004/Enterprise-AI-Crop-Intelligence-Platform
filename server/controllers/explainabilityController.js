const explainabilityService = require('../services/explainabilityService');

/**
 * Phase-9 Step-1: Explainability Analytics Dashboard Controller
 */
exports.getExplainabilitySummary = async (req, res) => {
  try {
    const data = await explainabilityService.getExplainabilityStats();
    res.json({
      success: true,
      message: 'Explainability dashboard statistics successfully fetched',
      data
    });
  } catch (error) {
    console.error('Explainability controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching explainability stats',
      error: error.message
    });
  }
};
