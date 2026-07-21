const express = require('express');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const mlopsMonitoringController = require('../controllers/mlopsMonitoringController');

const router = express.Router();

/**
 * Phase-10 Step-6: Enterprise MLOps Monitoring Center Routes
 *
 * Base path: /api/admin/mlops/monitoring
 */

/**
 * GET /api/admin/mlops/monitoring/overview
 * Returns system status, health scores, open alerts, critical alerts, and module statuses.
 */
router.get('/overview', auth, adminOnly, mlopsMonitoringController.getOverview);

/**
 * GET /api/admin/mlops/monitoring/alerts
 * Returns smart alerts with support for module, severity, and resolved filters.
 */
router.get('/alerts', auth, adminOnly, mlopsMonitoringController.getAlerts);

/**
 * GET /api/admin/mlops/monitoring/history
 * Returns historical monitoring snapshots over time.
 */
router.get('/history', auth, adminOnly, mlopsMonitoringController.getHistory);

/**
 * GET /api/admin/mlops/monitoring/timeline
 * Returns chronological monitoring events feed.
 */
router.get('/timeline', auth, adminOnly, mlopsMonitoringController.getTimeline);

module.exports = router;
