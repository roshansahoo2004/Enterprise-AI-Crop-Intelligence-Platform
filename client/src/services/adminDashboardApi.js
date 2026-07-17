/**
 * Phase-4 Step-3: Admin Dashboard API Service
 *
 * Provides endpoints for fetching MLOps dashboard metrics and triggering
 * manual model retraining. Uses the authenticated axios instance.
 */
import api from './api';

export const adminDashboardAPI = {
  /**
   * Fetch real-time MLOps statistics and training run records.
   * GET /api/admin/dashboard
   */
  getDashboardStats: () => api.get('/admin/dashboard'),

  /**
   * Trigger manual model retraining pipeline.
   * POST /api/admin/retrain
   */
  triggerRetraining: () => api.post('/admin/retrain'),

  /**
   * Phase-5 Step-2: Fetch all model versions for comparison dashboard.
   * GET /api/admin/model-comparison
   */
  getModelComparison: () => api.get('/admin/model-comparison'),

  /**
   * Phase-5 Step-5: Activate a specific model version (one-click rollback).
   * POST /api/admin/model-version/:id/activate
   */
  activateModelVersion: (id) => api.post(`/admin/model-version/${id}/activate`),
};

export default adminDashboardAPI;
