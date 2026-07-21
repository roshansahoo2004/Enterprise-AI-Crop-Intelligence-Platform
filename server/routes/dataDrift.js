const express = require('express');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const dataDriftController = require('../controllers/dataDriftController');

const router = express.Router();

/**
 * Phase-10 Step-2: Enterprise Data Drift Detection Routes
 *
 * Base path: /api/admin/mlops/data-drift
 */

/**
 * GET /api/admin/mlops/data-drift/summary
 * Returns overall drift score, severity, and retraining recommendation.
 */
router.get('/summary', auth, adminOnly, dataDriftController.getDriftSummary);

/**
 * GET /api/admin/mlops/data-drift/features
 * Returns per-feature drift analysis with PSI scores.
 */
router.get('/features', auth, adminOnly, dataDriftController.getDriftFeatures);

/**
 * GET /api/admin/mlops/data-drift/history
 * Returns daily drift snapshots for the last 30 days.
 */
router.get('/history', auth, adminOnly, dataDriftController.getDriftHistory);

module.exports = router;
