const express = require('express');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const aiOperationsController = require('../controllers/aiOperationsController');

const router = express.Router();

/**
 * Phase-11 Step-1: Enterprise AI Operations Command Center Routes
 *
 * Base path: /api/admin/operations
 */

/**
 * GET /api/admin/operations/overview
 * Returns executive command center overview with 8 KPIs, active model, health score, and drift summary.
 */
router.get('/overview', auth, adminOnly, aiOperationsController.getOverview);

/**
 * GET /api/admin/operations/recent-events
 * Returns latest predictions, deployments, alerts, and retraining events.
 */
router.get('/recent-events', auth, adminOnly, aiOperationsController.getRecentEvents);

/**
 * GET /api/admin/operations/quick-actions
 * Returns available admin quick actions and paths.
 */
router.get('/quick-actions', auth, adminOnly, aiOperationsController.getQuickActions);

module.exports = router;
