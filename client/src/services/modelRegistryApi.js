/**
 * Phase-6 Step-1 & Step-2: Model Registry API Service
 *
 * Provides endpoints for the production Model Registry page.
 * Uses the authenticated axios instance.
 */
import api from './api';

export const modelRegistryAPI = {
  /**
   * Fetch paginated model registry entries.
   * GET /api/admin/model-registry
   *
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 20)
   * @param {string} params.search - Version search filter
   * @param {string} params.status - Status filter (ACTIVE, ARCHIVED, CANDIDATE)
   * @param {string} params.architecture - Architecture filter
   */
  getRegistryList: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);
    if (params.search) query.set('search', params.search);
    if (params.status) query.set('status', params.status);
    if (params.architecture) query.set('architecture', params.architecture);

    const queryString = query.toString();
    return api.get(`/admin/model-registry${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Fetch complete details for a single registry entry.
   * GET /api/admin/model-registry/:id
   */
  getRegistryDetail: (id) => api.get(`/admin/model-registry/${id}`),

  /**
   * Phase-6 Step-2: Deploy a specific model version from the registry.
   * POST /api/admin/model-registry/:id/deploy
   */
  deployModel: (id) => api.post(`/admin/model-registry/${id}/deploy`)
};

export default modelRegistryAPI;
