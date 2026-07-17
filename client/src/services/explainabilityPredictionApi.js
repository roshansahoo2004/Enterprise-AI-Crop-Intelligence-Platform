import api from './api';

/**
 * Phase-9 Step-2: Explainability Prediction Explorer API Service
 */
export const explainabilityPredictionApi = {
  /**
   * Fetch predictions list with filtering, sorting, search, and pagination.
   * GET /api/admin/explainability/predictions
   */
  getPredictions: (params) => {
    // Clean up empty params
    const cleanParams = {};
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        cleanParams[key] = val;
      }
    });
    
    const queryString = new URLSearchParams(cleanParams).toString();
    return api.get(`/admin/explainability/predictions${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Fetch detailed model inputs, SHAP outputs, and user info for a specific prediction.
   * GET /api/admin/explainability/predictions/:id
   */
  getPredictionDetail: (id) => api.get(`/admin/explainability/predictions/${id}`),
};

export default explainabilityPredictionApi;
