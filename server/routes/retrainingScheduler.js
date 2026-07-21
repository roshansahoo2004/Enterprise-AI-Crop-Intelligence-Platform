const express = require('express');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const retrainingSchedulerController = require('../controllers/retrainingSchedulerController');

const router = express.Router();

/**
 * Phase-11 Step-5: Enterprise Scheduled Retraining Manager Routes
 *
 * Base path: /api/admin/retraining-manager
 */

/**
 * GET /api/admin/retraining-manager/summary
 * Returns overall retraining job execution summary (scheduled, running, paused, completed, average runtime, success rate).
 */
router.get('/summary', auth, adminOnly, retrainingSchedulerController.getSummary);

/**
 * GET /api/admin/retraining-manager/jobs
 * Returns list of configured scheduled retraining jobs.
 */
router.get('/jobs', auth, adminOnly, retrainingSchedulerController.getJobs);

/**
 * GET /api/admin/retraining-manager/history
 * Returns execution history log across all retraining jobs.
 */
router.get('/history', auth, adminOnly, retrainingSchedulerController.getHistory);

/**
 * POST /api/admin/retraining-manager/create
 * Body: { jobName, cronExpression, frequency, dataset, modelVersion, algorithm, triggerType, notes }
 * Creates a new scheduled retraining job.
 */
router.post('/create', auth, adminOnly, retrainingSchedulerController.createJob);

/**
 * PUT /api/admin/retraining-manager/pause/:id
 * Pauses a scheduled retraining job.
 */
router.put('/pause/:id', auth, adminOnly, retrainingSchedulerController.pauseJob);

/**
 * PUT /api/admin/retraining-manager/resume/:id
 * Resumes a paused scheduled retraining job.
 */
router.put('/resume/:id', auth, adminOnly, retrainingSchedulerController.resumeJob);

/**
 * POST /api/admin/retraining-manager/run-now/:id
 * Immediately triggers an execution for a scheduled job.
 */
router.post('/run-now/:id', auth, adminOnly, retrainingSchedulerController.triggerRunNow);

/**
 * DELETE /api/admin/retraining-manager/delete/:id
 * Deletes a scheduled retraining job.
 */
router.delete('/delete/:id', auth, adminOnly, retrainingSchedulerController.deleteJob);

module.exports = router;
