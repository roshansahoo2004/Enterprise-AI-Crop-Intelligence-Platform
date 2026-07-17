const express = require('express');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const {
  getServiceStatus,
  reloadService
} = require('../controllers/modelServiceController');

/**
 * Phase-6 Step-3: Model Service Routes
 *
 * Secure admin-only endpoints to manage dynamic model serving.
 * Mounted at /api/admin/model-service in server.js.
 */
const router = express.Router();

// GET /api/admin/model-service — View active model details, loadedAt, and predictions served
router.get('/', auth, adminOnly, getServiceStatus);

// POST /api/admin/model-service/reload — Manually trigger hot reload of active model
router.post('/reload', auth, adminOnly, reloadService);

module.exports = router;
