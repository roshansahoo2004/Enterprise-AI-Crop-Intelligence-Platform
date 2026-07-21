const explainabilityReportService = require('../services/explainabilityReportService');

/**
 * Phase-9 Step-4: Explainability Reporting & Export Controller
 *
 * Handles report summary retrieval and JSON/CSV/PDF export endpoints.
 */

// GET /api/admin/explainability/reports/summary
exports.getReportSummary = async (req, res) => {
  try {
    const report = await explainabilityReportService.getReportSummary();
    res.json({
      success: true,
      message: 'Explainability report summary generated successfully',
      data: report
    });
  } catch (error) {
    console.error('Explainability Report Controller — Summary Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating explainability report summary',
      error: error.message
    });
  }
};

// GET /api/admin/explainability/reports/export/json
exports.exportJSON = async (req, res) => {
  try {
    const report = await explainabilityReportService.getReportSummary();
    const filename = `explainability-report-${new Date().toISOString().split('T')[0]}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json({
      success: true,
      reportTitle: 'AgriSense AI — Enterprise Explainability Report',
      ...report
    });
  } catch (error) {
    console.error('Explainability Report Controller — JSON Export Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while exporting JSON report',
      error: error.message
    });
  }
};

// GET /api/admin/explainability/reports/export/csv
exports.exportCSV = async (req, res) => {
  try {
    const report = await explainabilityReportService.getReportSummary();
    const csv = explainabilityReportService.generateCSV(report);
    const filename = `explainability-report-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    console.error('Explainability Report Controller — CSV Export Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while exporting CSV report',
      error: error.message
    });
  }
};

// GET /api/admin/explainability/reports/export/pdf
exports.exportPDF = async (req, res) => {
  try {
    const report = await explainabilityReportService.getReportSummary();
    const html = explainabilityReportService.generatePDFHTML(report);
    const filename = `explainability-report-${new Date().toISOString().split('T')[0]}.html`;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(html);
  } catch (error) {
    console.error('Explainability Report Controller — PDF Export Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while exporting PDF report',
      error: error.message
    });
  }
};
