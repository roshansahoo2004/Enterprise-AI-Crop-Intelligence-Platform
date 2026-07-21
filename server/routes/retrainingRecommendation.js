const express = require('express');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const retrainingRecommendationController = require('../controllers/retrainingRecommendationController');

const router = express.Router();

/**
 * Phase-10 Step-5: Enterprise Retraining Recommendation Engine Routes
 *
 * Base path: /api/admin/mlops/retraining
 */

/**
 * GET /api/admin/mlops/retraining/summary
 * Returns overall recommendation, score, priority, reason, confidence, and timestamp.
 */
router.get('/summary', auth, adminOnly, retrainingRecommendationController.getRetrainingSummary);

/**
 * GET /api/admin/mlops/retraining/factors
 * Returns contributing factor breakdown with weights, values, risk scores, and statuses.
 */
router.get('/factors', auth, adminOnly, retrainingRecommendationController.getRetrainingFactors);

/**
 * GET /api/admin/mlops/retraining/history
 * Returns historical recommendation snapshots over time.
 */
router.get('/history', auth, adminOnly, retrainingRecommendationController.getRetrainingHistory);

module.exports = router;
