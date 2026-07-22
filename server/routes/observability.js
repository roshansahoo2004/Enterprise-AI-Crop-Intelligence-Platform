const express = require('express');
const router = express.Router();
const { getMetrics } = require('../controllers/observabilityController');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

/**
 * GET /api/admin/observability/metrics
 * Protected route for system monitoring telemetry.
 */
router.get('/metrics', auth, adminOnly, getMetrics);

module.exports = router;
