import api from './api';

/**
 * Phase-9 Step-4: Explainability Reporting & Export API Service
 */
export const explainabilityReportApi = {
  /**
   * Fetch aggregated explainability report summary.
   * GET /api/admin/explainability/reports/summary
   */
  getSummary: () => api.get('/admin/explainability/reports/summary'),

  /**
   * Download report as JSON file.
   * GET /api/admin/explainability/reports/export/json
   */
  exportJSON: () => api.get('/admin/explainability/reports/export/json', {
    responseType: 'blob'
  }),

  /**
   * Download report as CSV file.
   * GET /api/admin/explainability/reports/export/csv
   */
  exportCSV: () => api.get('/admin/explainability/reports/export/csv', {
    responseType: 'blob'
  }),

  /**
   * Download report as PDF (HTML for print-to-PDF).
   * GET /api/admin/explainability/reports/export/pdf
   */
  exportPDF: () => api.get('/admin/explainability/reports/export/pdf', {
    responseType: 'blob'
  }),
};

export default explainabilityReportApi;
