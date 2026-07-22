const express = require('express');
const router = express.Router();
const { getRegionData, getDiseaseTrends } = require('../controllers/diseaseHeatmapController');
const auth = require('../middleware/auth');

router.get('/regions', auth, getRegionData);
router.get('/trends', auth, getDiseaseTrends);

module.exports = router;
