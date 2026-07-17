import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../services/adminApi';
import toast from 'react-hot-toast';
import {
  FiShield, FiCheck, FiX, FiAlertTriangle, FiImage,
  FiUser, FiMail, FiCalendar, FiTarget, FiActivity,
  FiCpu, FiLoader, FiInbox, FiZoomIn
} from 'react-icons/fi';

/**
 * Phase-4 Step-2: Admin Feedback Review Dashboard
 *
 * Displays all pending (unverified) feedback submissions in a card grid.
 * Admins can approve or reject each feedback with confirmation dialogs.
 * Approval triggers the existing backend pipeline (dataset builder, auto-retrain queue).
 */
const AdminFeedback = () => {
  // ─── State ───
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({}); // { [id]: 'approve' | 'reject' }
  const [confirmDialog, setConfirmDialog] = useState(null); // { id, type: 'approve'|'reject' }
  const [previewImage, setPreviewImage] = useState(null); // URL string for modal

  // ─── Fetch pending feedback on mount ───
  const fetchPendingFeedback = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminAPI.getPendingFeedback();
      setFeedbacks(res.data.data || []);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Admin access required.');
      } else if (err.response?.status === 401) {
        // 401 is auto-handled by the axios interceptor (redirect to /login)
        return;
      } else {
        setError('Failed to load pending feedback. Please try again.');
        toast.error('Server error loading feedback');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingFeedback();
  }, [fetchPendingFeedback]);

  // ─── Approve handler ───
  const handleApprove = async (id) => {
    setConfirmDialog(null);
    setActionLoading((prev) => ({ ...prev, [id]: 'approve' }));
    try {
      await adminAPI.approveFeedback(id);
      // Remove from UI immediately (no page refresh)
      setFeedbacks((prev) => prev.filter((f) => f._id !== id));
      toast.success('Feedback approved successfully');
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('Admin access required');
      } else {
        toast.error('Failed to approve feedback');
      }
    } finally {
      setActionLoading((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  // ─── Reject handler ───
  const handleReject = async (id) => {
    setConfirmDialog(null);
    setActionLoading((prev) => ({ ...prev, [id]: 'reject' }));
    try {
      await adminAPI.rejectFeedback(id);
      setFeedbacks((prev) => prev.filter((f) => f._id !== id));
      toast('Feedback rejected and deleted', { icon: '⚠️' });
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('Admin access required');
      } else {
        toast.error('Failed to reject feedback');
      }
    } finally {
      setActionLoading((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

// ─── Image URL builder ───
// In development, Vite proxies /uploads and /feedback-images to the Express server.
// In production, both are served from the same origin.
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return path.startsWith('/') ? path : `/${path}`;
};

  // ─── Format date ───
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ─── Confidence color ───
  const getConfidenceColor = (conf) => {
    if (conf >= 80) return 'text-primary-400';
    if (conf >= 50) return 'text-secondary-400';
    return 'text-red-400';
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── Loading state ───
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 animate-spin rounded-full border-t-4 border-b-4 border-primary-500"></div>
          <p className="text-gray-400 text-lg">Loading pending feedback...</p>
        </div>
      </div>
    );
  }

  // ─── Error state (403 etc.) ───
  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="glass-card p-12 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <FiAlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-display font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  // ─── Empty state ───
  if (feedbacks.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader count={0} />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="glass-card p-12 text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary-500/10 flex items-center justify-center">
              <FiInbox className="w-10 h-10 text-primary-400" />
            </div>
            <h2 className="text-xl font-display font-bold text-white mb-2">All Caught Up!</h2>
            <p className="text-gray-400">No feedback waiting for review. Check back later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader count={feedbacks.length} />

      {/* ─── Feedback cards grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {feedbacks.map((feedback) => (
          <div
            key={feedback._id}
            className="glass-card-hover overflow-hidden group"
          >
            {/* ── Image section ── */}
            <div className="flex gap-3 p-4 pb-0">
              {/* Prediction image (leaf) */}
              {feedback.imageUrl && (
                <div
                  className="relative w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden cursor-pointer border border-white/10 group/img"
                  onClick={() => setPreviewImage(getImageUrl(feedback.imageUrl))}
                >
                  <img
                    src={getImageUrl(feedback.imageUrl)}
                    alt="Leaf"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-110"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 transition-colors flex items-center justify-center">
                    <FiZoomIn className="text-white opacity-0 group-hover/img:opacity-100 transition-opacity w-5 h-5" />
                  </div>
                  <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-gray-300 px-1.5 py-0.5 rounded">
                    Prediction
                  </span>
                </div>
              )}

              {/* Feedback image (user-submitted) */}
              {feedback.feedbackImage && (
                <div
                  className="relative w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden cursor-pointer border border-white/10 group/img2"
                  onClick={() => setPreviewImage(getImageUrl(`/feedback-images/${feedback.feedbackImage}`))}
                >
                  <img
                    src={getImageUrl(`/feedback-images/${feedback.feedbackImage}`)}
                    alt="Feedback"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover/img2:scale-110"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover/img2:bg-black/30 transition-colors flex items-center justify-center">
                    <FiZoomIn className="text-white opacity-0 group-hover/img2:opacity-100 transition-opacity w-5 h-5" />
                  </div>
                  <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-gray-300 px-1.5 py-0.5 rounded">
                    Feedback
                  </span>
                </div>
              )}
            </div>

            {/* ── Details section ── */}
            <div className="p-4 space-y-3">
              {/* Disease info */}
              <div className="grid grid-cols-2 gap-3">
                <DetailItem
                  icon={<FiTarget className="text-red-400" />}
                  label="Predicted"
                  value={feedback.predictedDisease}
                />
                <DetailItem
                  icon={<FiActivity className="text-primary-400" />}
                  label="Actual"
                  value={feedback.actualDisease}
                  highlight
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <DetailItem
                  icon={<FiCpu className="text-blue-400" />}
                  label="Confidence"
                  value={
                    <span className={getConfidenceColor(feedback.confidence)}>
                      {feedback.confidence}%
                    </span>
                  }
                />
                <DetailItem
                  icon={<FiCpu className="text-purple-400" />}
                  label="Model"
                  value={feedback.modelVersion || 'v1.0'}
                />
              </div>

              {/* User info */}
              <div className="border-t border-white/5 pt-3 grid grid-cols-2 gap-3">
                <DetailItem
                  icon={<FiUser className="text-gray-400" />}
                  label="User"
                  value={feedback.userId?.name || 'Unknown'}
                />
                <DetailItem
                  icon={<FiMail className="text-gray-400" />}
                  label="Email"
                  value={feedback.userId?.email || 'N/A'}
                  small
                />
              </div>

              <DetailItem
                icon={<FiCalendar className="text-gray-400" />}
                label="Submitted"
                value={formatDate(feedback.createdAt)}
              />

              {/* ── Correct / Incorrect badge ── */}
              <div className="flex items-center gap-2 pt-1">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${
                    feedback.correct
                      ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}
                >
                  {feedback.correct ? (
                    <><FiCheck className="w-3.5 h-3.5" /> Prediction Correct</>
                  ) : (
                    <><FiX className="w-3.5 h-3.5" /> Prediction Incorrect</>
                  )}
                </span>
              </div>
            </div>

            {/* ── Action buttons ── */}
            <div className="flex border-t border-white/5">
              <button
                onClick={() => setConfirmDialog({ id: feedback._id, type: 'approve' })}
                disabled={!!actionLoading[feedback._id]}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold
                           text-primary-400 hover:bg-primary-500/10 transition-all duration-200
                           disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {actionLoading[feedback._id] === 'approve' ? (
                  <FiLoader className="w-4 h-4 animate-spin" />
                ) : (
                  <FiCheck className="w-4 h-4" />
                )}
                Approve
              </button>
              <div className="w-px bg-white/5" />
              <button
                onClick={() => setConfirmDialog({ id: feedback._id, type: 'reject' })}
                disabled={!!actionLoading[feedback._id]}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold
                           text-red-400 hover:bg-red-500/10 transition-all duration-200
                           disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {actionLoading[feedback._id] === 'reject' ? (
                  <FiLoader className="w-4 h-4 animate-spin" />
                ) : (
                  <FiX className="w-4 h-4" />
                )}
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/*  CONFIRMATION DIALOG MODAL                                           */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {confirmDialog && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setConfirmDialog(null)}
        >
          <div
            className="glass-card p-8 max-w-sm w-full mx-4 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
              confirmDialog.type === 'approve'
                ? 'bg-primary-500/10'
                : 'bg-red-500/10'
            }`}>
              {confirmDialog.type === 'approve' ? (
                <FiCheck className="w-7 h-7 text-primary-400" />
              ) : (
                <FiAlertTriangle className="w-7 h-7 text-red-400" />
              )}
            </div>

            <h3 className="text-lg font-display font-bold text-white text-center mb-2">
              {confirmDialog.type === 'approve' ? 'Approve Feedback?' : 'Reject Feedback?'}
            </h3>
            <p className="text-gray-400 text-sm text-center mb-6">
              {confirmDialog.type === 'approve'
                ? 'This will verify the feedback and add it to the retraining dataset.'
                : 'This will permanently delete this feedback. This action cannot be undone.'}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDialog(null)}
                className="btn-secondary flex-1 py-2.5 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  confirmDialog.type === 'approve'
                    ? handleApprove(confirmDialog.id)
                    : handleReject(confirmDialog.id)
                }
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                  confirmDialog.type === 'approve'
                    ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30'
                    : 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30'
                }`}
              >
                {confirmDialog.type === 'approve' ? 'Yes, Approve' : 'Yes, Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/*  IMAGE PREVIEW MODAL                                                 */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] mx-4 animate-scale-in">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-surface-800 border border-white/10
                         text-gray-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <FiX className="w-4 h-4" />
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════════════════
//  SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

/** Page header with title, description and badge count */
const PageHeader = ({ count }) => (
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
    <div>
      <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
        <FiShield className="text-primary-400" /> Feedback Review
      </h1>
      <p className="text-gray-400">
        Review, approve or reject user-submitted disease feedback.
      </p>
    </div>
    {count > 0 && (
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary-500/10 border border-secondary-500/20">
        <FiImage className="text-secondary-400 w-4 h-4" />
        <span className="text-secondary-400 font-semibold text-sm">
          {count} pending
        </span>
      </div>
    )}
  </div>
);

/** Small labeled detail row used inside feedback cards */
const DetailItem = ({ icon, label, value, highlight = false, small = false }) => (
  <div className="flex items-start gap-2">
    <span className="mt-0.5 flex-shrink-0">{icon}</span>
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wider text-gray-500">{label}</p>
      <p
        className={`${small ? 'text-xs' : 'text-sm'} ${
          highlight ? 'text-primary-300 font-semibold' : 'text-gray-200'
        } truncate`}
        title={typeof value === 'string' ? value : undefined}
      >
        {value || 'N/A'}
      </p>
    </div>
  </div>
);

export default AdminFeedback;
