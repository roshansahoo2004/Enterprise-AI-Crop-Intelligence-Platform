/**
 * Phase-9 Step-1: Explainability Analytics Dashboard API Service
 */
import api from './api';

export const explainabilityApi = {
  /**
   * Fetch explainability statistics and trend distributions.
   * GET /api/admin/explainability/summary
   */
  getSummary: () => api.get('/admin/explainability/summary'),
};

export default explainabilityApi;
