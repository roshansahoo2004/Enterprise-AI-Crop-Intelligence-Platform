const express = require('express');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const modelDeploymentController = require('../controllers/modelDeploymentController');

const router = express.Router();

/**
 * Phase-11 Step-2: Enterprise Model Deployment Center Routes
 *
 * Base path: /api/admin/deployments
 */

/**
 * GET /api/admin/deployments/active
 * Returns current active deployment status, health score, and rollback readiness.
 */
router.get('/active', auth, adminOnly, modelDeploymentController.getActiveDeployment);

/**
 * GET /api/admin/deployments/history
 * Returns deployment history log.
 */
router.get('/history', auth, adminOnly, modelDeploymentController.getDeploymentHistory);

/**
 * GET /api/admin/deployments/versions
 * Returns list of deployable model versions.
 */
router.get('/versions', auth, adminOnly, modelDeploymentController.getDeployableVersions);

/**
 * POST /api/admin/deployments/deploy
 * Deploys selected model version to active production serving.
 */
router.post('/deploy', auth, adminOnly, modelDeploymentController.deployVersion);

/**
 * POST /api/admin/deployments/rollback
 * Rolls back active serving model to previous version.
 */
router.post('/rollback', auth, adminOnly, modelDeploymentController.rollbackDeployment);

/**
 * GET /api/admin/deployments/logs
 * Returns deployment execution log entries.
 */
router.get('/logs', auth, adminOnly, modelDeploymentController.getDeploymentLogs);

module.exports = router;
