import api from './api';

/**
 * Phase-10 Step-3: Enterprise Feature Drift Analytics API Service
 */
export const featureDriftApi = {
  /**
   * Fetch overall feature drift summary with stability score.
   * GET /api/admin/mlops/feature-drift/summary
   * @param {number} days - Time window (default 14)
   */
  getSummary: (days) => api.get('/admin/mlops/feature-drift/summary', { params: { days } }),

  /**
   * Fetch daily historical snapshots for a specific feature.
   * GET /api/admin/mlops/feature-drift/history/:feature
   * @param {string} feature - Feature key (nitrogen, phosphorus, etc.)
   * @param {number} days - Time window (default 90)
   */
  getHistory: (feature, days) => api.get(`/admin/mlops/feature-drift/history/${feature}`, { params: { days } }),

  /**
   * Fetch baseline vs production comparison for all features.
   * GET /api/admin/mlops/feature-drift/compare
   * @param {number} days - Time window (default 14)
   */
  getCompare: (days) => api.get('/admin/mlops/feature-drift/compare', { params: { days } }),
};

export default featureDriftApi;
