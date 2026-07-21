const express = require('express');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const modelHealthController = require('../controllers/modelHealthController');

const router = express.Router();

/**
 * Phase-10 Step-1: Model Health Dashboard Routes
 *
 * Base path: /api/admin/mlops/model-health
 */

/**
 * GET /api/admin/mlops/model-health/summary
 * Returns current model health score and operational metrics.
 */
router.get('/summary', auth, adminOnly, modelHealthController.getModelHealthSummary);

/**
 * GET /api/admin/mlops/model-health/history
 * Returns daily health snapshots for the last 30 days.
 */
router.get('/history', auth, adminOnly, modelHealthController.getModelHealthHistory);

module.exports = router;
