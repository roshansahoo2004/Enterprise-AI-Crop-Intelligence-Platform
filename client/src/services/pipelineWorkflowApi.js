import api from './api';

/**
 * Phase-11 Step-6: Enterprise Automated ML Pipeline Orchestrator API Service
 */
export const pipelineWorkflowApi = {
  /**
   * Fetch pipeline summary metrics (running, completed, failed, queued, avg duration).
   * GET /api/admin/pipeline/summary
   */
  getSummary: () => api.get('/admin/pipeline/summary'),

  /**
   * Fetch list of configured pipeline workflows.
   * GET /api/admin/pipeline/workflows
   */
  getWorkflows: () => api.get('/admin/pipeline/workflows'),

  /**
   * Fetch pipeline execution history.
   * GET /api/admin/pipeline/history
   */
  getHistory: () => api.get('/admin/pipeline/history'),

  /**
   * Start a new automated ML pipeline execution.
   * POST /api/admin/pipeline/start
   * @param {Object} data - { workflowName, triggerType, notes }
   */
  startWorkflow: (data) => api.post('/admin/pipeline/start', data),

  /**
   * Cancel a running workflow.
   * POST /api/admin/pipeline/cancel/:id
   * @param {string} id - Workflow ID or Mongo ID
   */
  cancelWorkflow: (id) => api.post(`/admin/pipeline/cancel/${id}`),

  /**
   * Retry a failed workflow.
   * POST /api/admin/pipeline/retry/:id
   * @param {string} id - Workflow ID or Mongo ID
   */
  retryWorkflow: (id) => api.post(`/admin/pipeline/retry/${id}`),

  /**
   * Fetch execution logs for a workflow.
   * GET /api/admin/pipeline/logs/:id
   * @param {string} id - Workflow ID or Mongo ID
   */
  getLogs: (id) => api.get(`/admin/pipeline/logs/${id}`),
};

export default pipelineWorkflowApi;
