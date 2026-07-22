import api from './api';

/**
 * Phase 12.7 – Enterprise Observability API Client
 */
export const observabilityApi = {
  getMetrics: () => api.get('/admin/observability/metrics')
};

export default observabilityApi;
