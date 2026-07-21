import api from './api';

/**
 * Phase-10 Step-2: Enterprise Data Drift Detection API Service
 */
export const dataDriftApi = {
  /**
   * Fetch overall drift summary with PSI score and retraining recommendation.
   * GET /api/admin/mlops/data-drift/summary
   */
  getSummary: () => api.get('/admin/mlops/data-drift/summary'),

  /**
   * Fetch per-feature drift analysis.
   * GET /api/admin/mlops/data-drift/features
   */
  getFeatures: () => api.get('/admin/mlops/data-drift/features'),

  /**
   * Fetch daily drift history (last 30 days).
   * GET /api/admin/mlops/data-drift/history
   */
  getHistory: () => api.get('/admin/mlops/data-drift/history'),
};

export default dataDriftApi;
