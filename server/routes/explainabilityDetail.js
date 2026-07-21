const express = require('express');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const explainabilityDetailController = require('../controllers/explainabilityDetailController');

const router = express.Router();

/**
 * GET /api/admin/explainability/details/:predictionId
 * Fetch aggregated Explainable AI details for a specific crop recommendation.
 */
router.get('/:predictionId', auth, adminOnly, explainabilityDetailController.getPredictionDetailInspector);

module.exports = router;
