import api from './api';

/**
 * Phase-11 Step-1: Enterprise AI Operations Command Center API Service
 */
export const aiOperationsApi = {
  /**
   * Fetch executive command center overview (8 KPIs, active model, health score, drift summary).
   * GET /api/admin/operations/overview
   */
  getOverview: () => api.get('/admin/operations/overview'),

  /**
   * Fetch recent platform events (latest predictions, deployments, alerts, retraining).
   * GET /api/admin/operations/recent-events
   */
  getRecentEvents: () => api.get('/admin/operations/recent-events'),

  /**
   * Fetch admin quick actions.
   * GET /api/admin/operations/quick-actions
   */
  getQuickActions: () => api.get('/admin/operations/quick-actions'),
};

export default aiOperationsApi;
