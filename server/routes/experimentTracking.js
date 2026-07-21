const express = require('express');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const experimentTrackingController = require('../controllers/experimentTrackingController');

const router = express.Router();

/**
 * Phase-11 Step-4: Enterprise Experiment Tracking Center Routes
 *
 * Base path: /api/admin/experiments
 */

/**
 * GET /api/admin/experiments/summary
 * Returns overall experiment run summary (total, successful, failed, running, best accuracy, avg duration).
 */
router.get('/summary', auth, adminOnly, experimentTrackingController.getSummary);

/**
 * GET /api/admin/experiments/runs
 * Returns paginated experiment runs with search and filtering support.
 */
router.get('/runs', auth, adminOnly, experimentTrackingController.getRuns);

/**
 * GET /api/admin/experiments/compare
 * Compares multiple experiment runs.
 */
router.get('/compare', auth, adminOnly, experimentTrackingController.compareRuns);

/**
 * GET /api/admin/experiments/details/:id
 * Returns complete experiment run metadata, hyperparameters, metrics, and artifacts.
 */
router.get('/details/:id', auth, adminOnly, experimentTrackingController.getDetails);

/**
 * GET /api/admin/experiments/artifacts/:id
 * Returns saved artifact metadata for an experiment run.
 */
router.get('/artifacts/:id', auth, adminOnly, experimentTrackingController.getArtifacts);

module.exports = router;
