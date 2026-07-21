const modelDeploymentService = require('../services/modelDeploymentService');

/**
 * Phase-11 Step-2: Enterprise Model Deployment Center Controller
 *
 * Handles active deployment, history, deployable versions, deploy action,
 * rollback action, and deployment logs endpoints.
 */

// GET /api/admin/deployments/active
exports.getActiveDeployment = async (req, res) => {
  try {
    const data = await modelDeploymentService.getActiveDeployment();
    res.json({
      success: true,
      message: 'Active deployment status retrieved successfully',
      data
    });
  } catch (error) {
    console.error('Model Deployment Controller — Active Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching active deployment status',
      error: error.message
    });
  }
};

// GET /api/admin/deployments/history
exports.getDeploymentHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const data = await modelDeploymentService.getDeploymentHistory(limit);
    res.json({
      success: true,
      message: 'Deployment history retrieved successfully',
      data
    });
  } catch (error) {
    console.error('Model Deployment Controller — History Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching deployment history',
      error: error.message
    });
  }
};

// GET /api/admin/deployments/versions
exports.getDeployableVersions = async (req, res) => {
  try {
    const data = await modelDeploymentService.getDeployableVersions();
    res.json({
      success: true,
      message: 'Deployable model versions retrieved successfully',
      data
    });
  } catch (error) {
    console.error('Model Deployment Controller — Versions Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching deployable model versions',
      error: error.message
    });
  }
};

// POST /api/admin/deployments/deploy
exports.deployVersion = async (req, res) => {
  try {
    const { version, notes } = req.body;
    const deployedBy = req.user?.email || 'Admin User';
    const data = await modelDeploymentService.deployVersion({ version, deployedBy, notes });
    res.json({
      success: true,
      message: data.message,
      data
    });
  } catch (error) {
    console.error('Model Deployment Controller — Deploy Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to deploy model version',
      error: error.message
    });
  }
};

// POST /api/admin/deployments/rollback
exports.rollbackDeployment = async (req, res) => {
  try {
    const { notes } = req.body;
    const deployedBy = req.user?.email || 'Admin User';
    const data = await modelDeploymentService.rollbackDeployment({ deployedBy, notes });
    res.json({
      success: true,
      message: data.message,
      data
    });
  } catch (error) {
    console.error('Model Deployment Controller — Rollback Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to execute rollback',
      error: error.message
    });
  }
};

// GET /api/admin/deployments/logs
exports.getDeploymentLogs = async (req, res) => {
  try {
    const data = await modelDeploymentService.getDeploymentLogs();
    res.json({
      success: true,
      message: 'Deployment logs retrieved successfully',
      data
    });
  } catch (error) {
    console.error('Model Deployment Controller — Logs Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching deployment logs',
      error: error.message
    });
  }
};
