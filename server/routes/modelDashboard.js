const express = require('express');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const {
  getSummary,
  getTrends,
  getHistory,
  getHealth
} = require('../controllers/modelDashboardController');

/**
 * Phase-7 Step-1 & Step-2: Model Performance Dashboard Routes
 *
 * Secure endpoints for monitoring model health, deployment statistics,
 * performance trends, and serving alerts. Mounted at /api/admin/model-dashboard in server.js.
 */
const router = express.Router();

// GET /api/admin/model-dashboard/summary — Summary statistics
router.get('/summary', auth, adminOnly, getSummary);

// GET /api/admin/model-dashboard/trends — Chronological registry entries for trendlines
router.get('/trends', auth, adminOnly, getTrends);

// GET /api/admin/model-dashboard/history — List of training history runs
router.get('/history', auth, adminOnly, getHistory);

// GET /api/admin/model-dashboard/health — Serving layer integrity and consistency checks
router.get('/health', auth, adminOnly, getHealth);

module.exports = router;
