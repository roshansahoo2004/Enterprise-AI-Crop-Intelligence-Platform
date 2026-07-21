import api from './api';

/**
 * Phase-11 Step-3: Enterprise Model Version Comparison Center API Service
 */
export const modelComparisonApi = {
  /**
   * Fetch all available model versions.
   * GET /api/admin/model-comparison/versions
   */
  getVersions: () => api.get('/admin/model-comparison/versions'),

  /**
   * Compare two model versions side-by-side.
   * GET /api/admin/model-comparison/compare?left=v1.0&right=v1.2-candidate
   * @param {string} left - Version A
   * @param {string} right - Version B
   */
  compare: (left, right) => api.get('/admin/model-comparison/compare', { params: { left, right } }),

  /**
   * Fetch historical comparison sessions.
   * GET /api/admin/model-comparison/history
   */
  getHistory: () => api.get('/admin/model-comparison/history'),
};

export default modelComparisonApi;
