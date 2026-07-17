const express = require('express');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const {
  getRegistryList,
  getRegistryDetail,
  deployModel
} = require('../controllers/modelRegistryController');

/**
 * Phase-6 Step-1 & Step-2: Model Registry Routes
 *
 * All endpoints are admin-only and require JWT authentication.
 * Mounted at /api/admin/model-registry in server.js.
 */
const router = express.Router();

// GET /api/admin/model-registry — Paginated list with search/filter
router.get('/', auth, adminOnly, getRegistryList);

// GET /api/admin/model-registry/:id — Single entry detail
router.get('/:id', auth, adminOnly, getRegistryDetail);

// POST /api/admin/model-registry/:id/deploy — Deploy selected model version
router.post('/:id/deploy', auth, adminOnly, deployModel);

module.exports = router;
