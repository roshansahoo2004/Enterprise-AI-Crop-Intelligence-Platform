const express = require('express');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const explainabilityReportController = require('../controllers/explainabilityReportController');

const router = express.Router();

/**
 * Phase-9 Step-4: Explainability Reporting & Export Routes
 *
 * Base path: /api/admin/explainability/reports
 */

/**
 * GET /api/admin/explainability/reports/summary
 * Generate aggregated explainability report summary.
 */
router.get('/summary', auth, adminOnly, explainabilityReportController.getReportSummary);

/**
 * GET /api/admin/explainability/reports/export/json
 * Download complete report as JSON.
 */
router.get('/export/json', auth, adminOnly, explainabilityReportController.exportJSON);

/**
 * GET /api/admin/explainability/reports/export/csv
 * Download complete report as CSV.
 */
router.get('/export/csv', auth, adminOnly, explainabilityReportController.exportCSV);

/**
 * GET /api/admin/explainability/reports/export/pdf
 * Download enterprise PDF report (HTML for print-to-PDF).
 */
router.get('/export/pdf', auth, adminOnly, explainabilityReportController.exportPDF);

module.exports = router;
