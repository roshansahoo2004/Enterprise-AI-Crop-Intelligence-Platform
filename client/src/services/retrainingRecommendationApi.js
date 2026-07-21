import api from './api';

/**
 * Phase-10 Step-5: Enterprise Retraining Recommendation Engine API Service
 */
export const retrainingRecommendationApi = {
  /**
   * Fetch overall retraining recommendation, score, priority, reason, and confidence.
   * GET /api/admin/mlops/retraining/summary
   */
  getSummary: () => api.get('/admin/mlops/retraining/summary'),

  /**
   * Fetch contributing factor breakdown with weights, values, and status.
   * GET /api/admin/mlops/retraining/factors
   */
  getFactors: () => api.get('/admin/mlops/retraining/factors'),

  /**
   * Fetch historical recommendation snapshots over time.
   * GET /api/admin/mlops/retraining/history
   * @param {number} days - Time window (default 30)
   */
  getHistory: (days) => api.get('/admin/mlops/retraining/history', { params: { days } }),
};

export default retrainingRecommendationApi;
