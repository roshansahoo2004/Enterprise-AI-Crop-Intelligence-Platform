/**
 * Phase-4 Step-2: Admin API Service
 *
 * Reusable API methods for the Admin Feedback Review Dashboard.
 * Uses the existing axios instance (with JWT interceptors) from api.js.
 */
import api from './api';

// ─── Admin Feedback API ───────────────────────────────────────────────────
export const adminAPI = {
  /**
   * Fetch all pending (unverified) feedback submissions.
   * GET /api/admin/feedback/pending
   */
  getPendingFeedback: () => api.get('/admin/feedback/pending'),

  /**
   * Approve a feedback submission.
   * PATCH /api/admin/feedback/:id/approve
   * @param {string} id - Feedback document ID
   */
  approveFeedback: (id) => api.patch(`/admin/feedback/${id}/approve`),

  /**
   * Reject (and permanently delete) a feedback submission.
   * PATCH /api/admin/feedback/:id/reject
   * @param {string} id - Feedback document ID
   */
  rejectFeedback: (id) => api.patch(`/admin/feedback/${id}/reject`),
};

export default adminAPI;
