const modelService = require('../services/modelService');

/**
 * Phase-6 Step-3: Model Service Controller
 *
 * Exposes endpoints to monitor the active model status and trigger manual reloads.
 * All endpoints require admin authentication.
 */

/**
 * GET /api/admin/model-service
 *
 * Returns the currently served active model metadata and operational metrics.
 */
const getServiceStatus = async (req, res) => {
  try {
    const statusData = modelService.getStatus();
    res.json({
      success: true,
      data: statusData
    });
  } catch (error) {
    console.error('[Model Service Controller] Failed to retrieve status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving model service status.'
    });
  }
};

/**
 * POST /api/admin/model-service/reload
 *
 * Manually reloads the ACTIVE model version from the ModelRegistry into memory.
 */
const reloadService = async (req, res) => {
  try {
    await modelService.reloadActiveModel();
    const statusData = modelService.getStatus();
    res.json({
      success: true,
      message: 'Model service successfully reloaded.',
      data: statusData
    });
  } catch (error) {
    console.error('[Model Service Controller] Failed to reload model service:', error);
    res.status(500).json({
      success: false,
      message: 'Server error reloading model service.'
    });
  }
};

module.exports = {
  getServiceStatus,
  reloadService
};
