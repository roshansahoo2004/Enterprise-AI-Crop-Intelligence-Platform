const express = require('express');
const router = express.Router();
const { sendMessage, getChatHistory, getSuggestedPrompts, getFarmReportData } = require('../controllers/assistantController');
const auth = require('../middleware/auth');

router.post('/chat', auth, sendMessage);
router.get('/history', auth, getChatHistory);
router.get('/prompts', auth, getSuggestedPrompts);
router.get('/farm-report', auth, getFarmReportData);

module.exports = router;
