const { getObservabilityMetrics } = require('../services/observabilityService');

/**
 * GET /api/admin/observability/metrics
 * Controller for retrieving system observability and health telemetry.
 */
const getMetrics = async (req, res) => {
  try {
    const metrics = await getObservabilityMetrics();
    res.json({
      success: true,
      message: 'Observability telemetry retrieved successfully',
      data: metrics
    });
  } catch (error) {
    console.error('[Observability Controller Error]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve observability telemetry metrics'
    });
  }
};

module.exports = { getMetrics };
