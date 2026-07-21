const express = require('express');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const modelComparisonController = require('../controllers/modelComparisonController');

const router = express.Router();

/**
 * Phase-11 Step-3: Enterprise Model Version Comparison Center Routes
 *
 * Base path: /api/admin/model-comparison
 */

/**
 * GET /api/admin/model-comparison/versions
 * Returns list of available model versions for selection.
 */
router.get('/versions', auth, adminOnly, modelComparisonController.getAvailableVersions);

/**
 * GET /api/admin/model-comparison/compare
 * Query: ?left=v1.0&right=v1.2-candidate
 * Returns side-by-side metric comparison, winner, deltas, and recommendation.
 */
router.get('/compare', auth, adminOnly, modelComparisonController.compareVersions);

/**
 * GET /api/admin/model-comparison/history
 * Returns historical comparison sessions log.
 */
router.get('/history', auth, adminOnly, modelComparisonController.getComparisonHistory);

module.exports = router;
