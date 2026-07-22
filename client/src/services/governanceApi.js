import api from './api';

/**
 * Phase-11 Step-7: Enterprise AI Governance & Compliance Center API Service
 */
export const governanceApi = {
  /**
   * Fetch governance summary metrics (compliance score, policies, violations, pending approvals, critical risks, audit events).
   * GET /api/admin/governance/summary
   */
  getSummary: () => api.get('/admin/governance/summary'),

  /**
   * Fetch compliance audit logs list.
   * GET /api/admin/governance/audit
   */
  getAudit: () => api.get('/admin/governance/audit'),

  /**
   * Fetch list of configured governance policies.
   * GET /api/admin/governance/policies
   */
  getPolicies: () => api.get('/admin/governance/policies'),

  /**
   * Fetch tracked policy violations list.
   * GET /api/admin/governance/violations
   */
  getViolations: () => api.get('/admin/governance/violations'),

  /**
   * Create a new governance policy.
   * POST /api/admin/governance/policy
   * @param {Object} data - { policyName, category, description, severity, conditions, enabled }
   */
  createPolicy: (data) => api.post('/admin/governance/policy', data),

  /**
   * Update or toggle an existing governance policy.
   * PUT /api/admin/governance/policy/:id
   * @param {string} id - Policy ID or Mongo ID
   * @param {Object} updates
   */
  updatePolicy: (id, updates) => api.put(`/admin/governance/policy/${id}`, updates),

  /**
   * Approve a pending governance request.
   * POST /api/admin/governance/approve/:id
   * @param {string} id - Audit ID or Mongo ID
   * @param {Object} body - { comment }
   */
  approve: (id, body = {}) => api.post(`/admin/governance/approve/${id}`, body),

  /**
   * Reject a pending governance request.
   * POST /api/admin/governance/reject/:id
   * @param {string} id - Audit ID or Mongo ID
   * @param {Object} body - { comment }
   */
  reject: (id, body = {}) => api.post(`/admin/governance/reject/${id}`, body),
};

export default governanceApi;
