import api from './api';

/**
 * Phase-9 Step-3: Explainability Prediction Detail Inspector API Service
 */
export const explainabilityDetailApi = {
  /**
   * Fetch aggregated Explainable AI details for a specific prediction ID.
   * GET /api/admin/explainability/details/:predictionId
   */
  getPredictionDetailInspector: (predictionId) => api.get(`/admin/explainability/details/${predictionId}`),
};

export default explainabilityDetailApi;
