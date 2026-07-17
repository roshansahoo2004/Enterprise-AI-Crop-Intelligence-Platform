const express = require('express');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const explainabilityController = require('../controllers/explainabilityController');

const router = express.Router();

/**
 * GET /api/admin/explainability/summary
 * Fetch aggregated Explainable AI statistics for admins.
 */
router.get('/summary', auth, adminOnly, explainabilityController.getExplainabilitySummary);

module.exports = router;
