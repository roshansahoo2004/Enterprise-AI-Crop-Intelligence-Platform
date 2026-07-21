const express = require('express');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const confidenceDriftController = require('../controllers/confidenceDriftController');

const router = express.Router();

/**
 * Phase-10 Step-4: Enterprise Confidence Drift Monitoring Routes
 *
 * Base path: /api/admin/mlops/confidence-drift
 */

/**
 * GET /api/admin/mlops/confidence-drift/summary
 * Returns average confidence, drift %, stability score, and degradation alerts.
 */
router.get('/summary', auth, adminOnly, confidenceDriftController.getConfidenceSummary);

/**
 * GET /api/admin/mlops/confidence-drift/distribution
 * Returns confidence histogram and tier distribution.
 */
router.get('/distribution', auth, adminOnly, confidenceDriftController.getConfidenceDistribution);

/**
 * GET /api/admin/mlops/confidence-drift/history
 * Returns 90-day confidence trend with moving averages, variance, and drift.
 */
router.get('/history', auth, adminOnly, confidenceDriftController.getConfidenceHistory);

module.exports = router;
