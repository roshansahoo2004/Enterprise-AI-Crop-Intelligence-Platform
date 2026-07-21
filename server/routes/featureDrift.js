const express = require('express');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const featureDriftController = require('../controllers/featureDriftController');

const router = express.Router();

/**
 * Phase-10 Step-3: Enterprise Feature Drift Analytics Routes
 *
 * Base path: /api/admin/mlops/feature-drift
 */

/**
 * GET /api/admin/mlops/feature-drift/summary
 * Returns overall feature stability score with per-feature drift analysis.
 * Query: ?days=14 (optional, default 14)
 */
router.get('/summary', auth, adminOnly, featureDriftController.getFeatureDriftSummary);

/**
 * GET /api/admin/mlops/feature-drift/history/:feature
 * Returns daily historical snapshots for a specific feature.
 * Params: feature (nitrogen|phosphorus|potassium|temperature|humidity|rainfall|ph)
 * Query: ?days=90 (optional, default 90)
 */
router.get('/history/:feature', auth, adminOnly, featureDriftController.getFeatureHistory);

/**
 * GET /api/admin/mlops/feature-drift/compare
 * Returns baseline vs production comparison for all features.
 * Query: ?days=14 (optional, default 14)
 */
router.get('/compare', auth, adminOnly, featureDriftController.getFeatureComparison);

module.exports = router;
