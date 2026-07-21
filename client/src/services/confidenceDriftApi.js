import api from './api';

/**
 * Phase-10 Step-4: Enterprise Confidence Drift Monitoring API Service
 */
export const confidenceDriftApi = {
  /**
   * Fetch confidence summary, drift %, stability score, and recommendation.
   * GET /api/admin/mlops/confidence-drift/summary
   * @param {number} days - Time window (default 14)
   */
  getSummary: (days) => api.get('/admin/mlops/confidence-drift/summary', { params: { days } }),

  /**
   * Fetch confidence distribution histogram and tier breakdown.
   * GET /api/admin/mlops/confidence-drift/distribution
   * @param {number} days - Time window (default 14)
   */
  getDistribution: (days) => api.get('/admin/mlops/confidence-drift/distribution', { params: { days } }),

  /**
   * Fetch 90-day confidence trend with moving averages, variance, and drift %.
   * GET /api/admin/mlops/confidence-drift/history
   * @param {number} days - Time window (default 90)
   */
  getHistory: (days) => api.get('/admin/mlops/confidence-drift/history', { params: { days } }),
};

export default confidenceDriftApi;
