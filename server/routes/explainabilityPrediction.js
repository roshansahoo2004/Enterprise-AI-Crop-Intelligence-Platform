const express = require('express');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const explainabilityPredictionController = require('../controllers/explainabilityPredictionController');

const router = express.Router();

/**
 * GET /api/admin/explainability/predictions
 * List and filter predictions with search and server-side pagination.
 */
router.get('/', auth, adminOnly, explainabilityPredictionController.getPredictionsList);

/**
 * GET /api/admin/explainability/predictions/:id
 * Retrieve detailed crop prediction data with SHAP values.
 */
router.get('/:id', auth, adminOnly, explainabilityPredictionController.getPredictionDetail);

module.exports = router;
