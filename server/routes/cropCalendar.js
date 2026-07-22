const express = require('express');
const router = express.Router();
const { getCropSchedule } = require('../controllers/cropCalendarController');
const auth = require('../middleware/auth');

router.get('/schedule', auth, getCropSchedule);

module.exports = router;
