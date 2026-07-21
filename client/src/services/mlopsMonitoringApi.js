import api from './api';

/**
 * Phase-10 Step-6: Enterprise MLOps Monitoring Center API Service
 */
export const mlopsMonitoringApi = {
  /**
   * Fetch monitoring overview with system status, scores, open/critical alert counts.
   * GET /api/admin/mlops/monitoring/overview
   */
  getOverview: () => api.get('/admin/mlops/monitoring/overview'),

  /**
   * Fetch smart alerts with optional filters.
   * GET /api/admin/mlops/monitoring/alerts
   * @param {Object} params - { module, severity, resolved }
   */
  getAlerts: (params = {}) => api.get('/admin/mlops/monitoring/alerts', { params }),

  /**
   * Fetch historical monitoring snapshots over time.
   * GET /api/admin/mlops/monitoring/history
   * @param {number} days - Time window (default 30)
   */
  getHistory: (days) => api.get('/admin/mlops/monitoring/history', { params: { days } }),

  /**
   * Fetch chronological monitoring events feed.
   * GET /api/admin/mlops/monitoring/timeline
   * @param {number} days - Time window (default 7)
   */
  getTimeline: (days) => api.get('/admin/mlops/monitoring/timeline', { params: { days } }),
};

export default mlopsMonitoringApi;
