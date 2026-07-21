import api from './api';

/**
 * Phase-11 Step-4: Enterprise Experiment Tracking Center API Service (MLflow Style)
 */
export const experimentTrackingApi = {
  /**
   * Fetch overall experiment runs summary (total, successful, failed, running, best accuracy, avg duration).
   * GET /api/admin/experiments/summary
   */
  getSummary: () => api.get('/admin/experiments/summary'),

  /**
   * Fetch paginated experiment runs list with filtering & search.
   * GET /api/admin/experiments/runs
   * @param {Object} params - { search, algorithm, datasetVersion, modelVersion, status, page, limit }
   */
  getRuns: (params = {}) => api.get('/admin/experiments/runs', { params }),

  /**
   * Fetch detailed experiment metadata, hyperparameters, metrics, and artifacts.
   * GET /api/admin/experiments/details/:id
   * @param {string} id - Experiment ID or Mongo ID
   */
  getDetails: (id) => api.get(`/admin/experiments/details/${id}`),

  /**
   * Compare multiple experiment runs side-by-side.
   * GET /api/admin/experiments/compare?runIds=EXP-001,EXP-002
   * @param {string} runIds - Comma separated experiment IDs
   */
  compareRuns: (runIds) => api.get('/admin/experiments/compare', { params: { runIds } }),

  /**
   * Fetch artifacts metadata for a specific experiment run.
   * GET /api/admin/experiments/artifacts/:id
   * @param {string} id - Experiment ID or Mongo ID
   */
  getArtifacts: (id) => api.get(`/admin/experiments/artifacts/${id}`),
};

export default experimentTrackingApi;
