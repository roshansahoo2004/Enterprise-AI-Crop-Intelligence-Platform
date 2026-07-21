import api from './api';

/**
 * Phase-11 Step-2: Enterprise Model Deployment Center API Service
 */
export const modelDeploymentApi = {
  /**
   * Fetch active deployment status, duration, previous version, and health score.
   * GET /api/admin/deployments/active
   */
  getActive: () => api.get('/admin/deployments/active'),

  /**
   * Fetch deployment history log list.
   * GET /api/admin/deployments/history
   * @param {number} limit - Max records (default 20)
   */
  getHistory: (limit) => api.get('/admin/deployments/history', { params: { limit } }),

  /**
   * Fetch deployable model versions.
   * GET /api/admin/deployments/versions
   */
  getVersions: () => api.get('/admin/deployments/versions'),

  /**
   * Deploy selected model version.
   * POST /api/admin/deployments/deploy
   * @param {Object} data - { version, notes }
   */
  deploy: (data) => api.post('/admin/deployments/deploy', data),

  /**
   * Rollback active serving model to previous version.
   * POST /api/admin/deployments/rollback
   * @param {Object} data - { notes }
   */
  rollback: (data) => api.post('/admin/deployments/rollback', data),

  /**
   * Fetch detailed deployment logs stream.
   * GET /api/admin/deployments/logs
   */
  getLogs: () => api.get('/admin/deployments/logs'),
};

export default modelDeploymentApi;
