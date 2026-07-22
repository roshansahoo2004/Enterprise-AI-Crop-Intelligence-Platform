import api from './api';

export const expansionApi = {
  predictYield: (data) => api.post('/yield/predict', data),
  getYieldHistory: () => api.get('/yield/history'),

  sendMessage: (text, location) => api.post('/assistant/chat', { text, ...(location || {}) }),
  getChatHistory: () => api.get('/assistant/history'),
  getSuggestedPrompts: () => api.get('/assistant/prompts'),
  getFarmReportData: () => api.get('/assistant/farm-report'),

  getHeatmapRegions: () => api.get('/disease-heatmap/regions'),
  getHeatmapTrends: () => api.get('/disease-heatmap/trends'),

  getCropSchedule: (crop) => api.get('/crop-calendar/schedule', { params: { crop } })
};

export default expansionApi;
