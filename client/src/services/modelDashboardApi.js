/**
 * Phase-7 Step-1 & Step-2: Model Performance Dashboard API Service
 *
 * Provides endpoints for model performance monitoring, training history, trend analysis,
 * and system health monitoring alerts. Uses the authenticated Axios instance.
 */
import api from './api';

export const modelDashboardAPI = {
  /**
   * Fetch active model summary statistics.
   * GET /api/admin/model-dashboard/summary
   */
  getSummary: () => api.get('/admin/model-dashboard/summary'),

  /**
   * Fetch chronological model registry entries for trend visualization.
   * GET /api/admin/model-dashboard/trends
   */
  getTrends: () => api.get('/admin/model-dashboard/trends'),

  /**
   * Fetch training run history sorted by date descending.
   * GET /api/admin/model-dashboard/history
   */
  getHistory: () => api.get('/admin/model-dashboard/history'),

  /**
   * Fetch serving layer integrity and system health checks.
   * GET /api/admin/model-dashboard/health
   */
  getHealth: () => api.get('/admin/model-dashboard/health')
};

export default modelDashboardAPI;
