const express = require('express');
const router = express.Router();
const { predictYield, getYieldHistory } = require('../controllers/yieldController');
const auth = require('../middleware/auth');

router.post('/predict', auth, predictYield);
router.get('/history', auth, getYieldHistory);

module.exports = router;
