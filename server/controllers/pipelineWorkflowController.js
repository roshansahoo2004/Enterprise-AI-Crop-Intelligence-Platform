const pipelineWorkflowService = require('../services/pipelineWorkflowService');

/**
 * Phase-11 Step-6: Enterprise Automated ML Pipeline Orchestrator Controller
 *
 * Handles summary, workflows, history, start, cancel, retry, and logs endpoints.
 */

// GET /api/admin/pipeline/summary
exports.getSummary = async (req, res) => {
  try {
    const data = await pipelineWorkflowService.getPipelineSummary();
    res.json({
      success: true,
      message: 'Pipeline summary retrieved successfully',
      data
    });
  } catch (error) {
    console.error('Pipeline Controller — Summary Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pipeline summary',
      error: error.message
    });
  }
};

// GET /api/admin/pipeline/workflows
exports.getWorkflows = async (req, res) => {
  try {
    const data = await pipelineWorkflowService.getWorkflows();
    res.json({
      success: true,
      message: 'Pipeline workflows retrieved successfully',
      data
    });
  } catch (error) {
    console.error('Pipeline Controller — Workflows Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching workflows',
      error: error.message
    });
  }
};

// GET /api/admin/pipeline/history
exports.getHistory = async (req, res) => {
  try {
    const data = await pipelineWorkflowService.getHistory();
    res.json({
      success: true,
      message: 'Pipeline execution history retrieved successfully',
      data
    });
  } catch (error) {
    console.error('Pipeline Controller — History Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pipeline history',
      error: error.message
    });
  }
};

// POST /api/admin/pipeline/start
exports.startWorkflow = async (req, res) => {
  try {
    const createdBy = req.user?.email || 'Admin User';
    const data = await pipelineWorkflowService.startWorkflow(req.body, createdBy);
    res.json({
      success: true,
      message: data.message,
      data
    });
  } catch (error) {
    console.error('Pipeline Controller — Start Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to start pipeline workflow',
      error: error.message
    });
  }
};

// POST /api/admin/pipeline/cancel/:id
exports.cancelWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await pipelineWorkflowService.cancelWorkflow(id);
    res.json({
      success: true,
      message: data.message,
      data
    });
  } catch (error) {
    console.error('Pipeline Controller — Cancel Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to cancel pipeline workflow',
      error: error.message
    });
  }
};

// POST /api/admin/pipeline/retry/:id
exports.retryWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await pipelineWorkflowService.retryWorkflow(id);
    res.json({
      success: true,
      message: data.message,
      data
    });
  } catch (error) {
    console.error('Pipeline Controller — Retry Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to retry pipeline workflow',
      error: error.message
    });
  }
};

// GET /api/admin/pipeline/logs/:id
exports.getLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await pipelineWorkflowService.getWorkflowLogs(id);
    res.json({
      success: true,
      message: 'Pipeline execution logs retrieved successfully',
      data
    });
  } catch (error) {
    console.error('Pipeline Controller — Logs Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pipeline logs',
      error: error.message
    });
  }
};
