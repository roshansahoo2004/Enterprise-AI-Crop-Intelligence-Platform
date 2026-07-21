const retrainingSchedulerService = require('../services/retrainingSchedulerService');

/**
 * Phase-11 Step-5: Enterprise Scheduled Retraining Manager Controller
 *
 * Handles summary, jobs, history, create, pause, resume, run-now, and delete endpoints.
 */

// GET /api/admin/retraining-manager/summary
exports.getSummary = async (req, res) => {
  try {
    const data = await retrainingSchedulerService.getSchedulerSummary();
    res.json({
      success: true,
      message: 'Retraining scheduler summary retrieved successfully',
      data
    });
  } catch (error) {
    console.error('Retraining Scheduler Controller — Summary Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching scheduler summary',
      error: error.message
    });
  }
};

// GET /api/admin/retraining-manager/jobs
exports.getJobs = async (req, res) => {
  try {
    const data = await retrainingSchedulerService.getScheduledJobs();
    res.json({
      success: true,
      message: 'Scheduled retraining jobs retrieved successfully',
      data
    });
  } catch (error) {
    console.error('Retraining Scheduler Controller — Jobs Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching scheduled jobs',
      error: error.message
    });
  }
};

// GET /api/admin/retraining-manager/history
exports.getHistory = async (req, res) => {
  try {
    const data = await retrainingSchedulerService.getExecutionHistory();
    res.json({
      success: true,
      message: 'Retraining execution history retrieved successfully',
      data
    });
  } catch (error) {
    console.error('Retraining Scheduler Controller — History Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching execution history',
      error: error.message
    });
  }
};

// POST /api/admin/retraining-manager/create
exports.createJob = async (req, res) => {
  try {
    const createdBy = req.user?.email || 'Admin User';
    const data = await retrainingSchedulerService.createJob(req.body, createdBy);
    res.json({
      success: true,
      message: data.message,
      data
    });
  } catch (error) {
    console.error('Retraining Scheduler Controller — Create Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create scheduled retraining job',
      error: error.message
    });
  }
};

// PUT /api/admin/retraining-manager/pause/:id
exports.pauseJob = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await retrainingSchedulerService.pauseJob(id);
    res.json({
      success: true,
      message: data.message,
      data
    });
  } catch (error) {
    console.error('Retraining Scheduler Controller — Pause Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to pause job',
      error: error.message
    });
  }
};

// PUT /api/admin/retraining-manager/resume/:id
exports.resumeJob = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await retrainingSchedulerService.resumeJob(id);
    res.json({
      success: true,
      message: data.message,
      data
    });
  } catch (error) {
    console.error('Retraining Scheduler Controller — Resume Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to resume job',
      error: error.message
    });
  }
};

// POST /api/admin/retraining-manager/run-now/:id
exports.triggerRunNow = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await retrainingSchedulerService.triggerRunNow(id);
    res.json({
      success: true,
      message: data.message,
      data
    });
  } catch (error) {
    console.error('Retraining Scheduler Controller — Trigger Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to trigger job execution',
      error: error.message
    });
  }
};

// DELETE /api/admin/retraining-manager/delete/:id
exports.deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await retrainingSchedulerService.deleteJob(id);
    res.json({
      success: true,
      message: data.message,
      data
    });
  } catch (error) {
    console.error('Retraining Scheduler Controller — Delete Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete job',
      error: error.message
    });
  }
};
