import api from './api';

/**
 * Phase-11 Step-5: Enterprise Scheduled Retraining Manager API Service
 */
export const retrainingSchedulerApi = {
  /**
   * Fetch scheduler summary metrics.
   * GET /api/admin/retraining-manager/summary
   */
  getSummary: () => api.get('/admin/retraining-manager/summary'),

  /**
   * Fetch list of all scheduled retraining jobs.
   * GET /api/admin/retraining-manager/jobs
   */
  getJobs: () => api.get('/admin/retraining-manager/jobs'),

  /**
   * Fetch execution history log.
   * GET /api/admin/retraining-manager/history
   */
  getHistory: () => api.get('/admin/retraining-manager/history'),

  /**
   * Create a new scheduled retraining job.
   * POST /api/admin/retraining-manager/create
   * @param {Object} data - { jobName, cronExpression, frequency, dataset, modelVersion, algorithm, triggerType, notes }
   */
  createJob: (data) => api.post('/admin/retraining-manager/create', data),

  /**
   * Pause a scheduled retraining job.
   * PUT /api/admin/retraining-manager/pause/:id
   * @param {string} id - Job ID or Mongo ID
   */
  pauseJob: (id) => api.put(`/admin/retraining-manager/pause/${id}`),

  /**
   * Resume a paused scheduled retraining job.
   * PUT /api/admin/retraining-manager/resume/:id
   * @param {string} id - Job ID or Mongo ID
   */
  resumeJob: (id) => api.put(`/admin/retraining-manager/resume/${id}`),

  /**
   * Trigger immediate execution for a job.
   * POST /api/admin/retraining-manager/run-now/:id
   * @param {string} id - Job ID or Mongo ID
   */
  triggerRunNow: (id) => api.post(`/admin/retraining-manager/run-now/${id}`),

  /**
   * Delete a scheduled retraining job.
   * DELETE /api/admin/retraining-manager/delete/:id
   * @param {string} id - Job ID or Mongo ID
   */
  deleteJob: (id) => api.delete(`/admin/retraining-manager/delete/${id}`),
};

export default retrainingSchedulerApi;
