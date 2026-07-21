import api from './api';

/**
 * Phase-10 Step-1: Enterprise Model Health Dashboard API Service
 */
export const modelHealthApi = {
  /**
   * Fetch current model health summary and score.
   * GET /api/admin/mlops/model-health/summary
   */
  getSummary: () => api.get('/admin/mlops/model-health/summary'),

  /**
   * Fetch daily health history (last 30 days).
   * GET /api/admin/mlops/model-health/history
   */
  getHistory: () => api.get('/admin/mlops/model-health/history'),
};

export default modelHealthApi;
