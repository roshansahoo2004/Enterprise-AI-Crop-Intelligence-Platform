const express = require('express');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const pipelineWorkflowController = require('../controllers/pipelineWorkflowController');

const router = express.Router();

/**
 * Phase-11 Step-6: Enterprise Automated ML Pipeline Orchestrator Routes
 *
 * Base path: /api/admin/pipeline
 */

/**
 * GET /api/admin/pipeline/summary
 * Returns running workflows, completed, failed, queued, and average duration.
 */
router.get('/summary', auth, adminOnly, pipelineWorkflowController.getSummary);

/**
 * GET /api/admin/pipeline/workflows
 * Returns list of configured pipeline workflows.
 */
router.get('/workflows', auth, adminOnly, pipelineWorkflowController.getWorkflows);

/**
 * GET /api/admin/pipeline/history
 * Returns pipeline execution history log.
 */
router.get('/history', auth, adminOnly, pipelineWorkflowController.getHistory);

/**
 * POST /api/admin/pipeline/start
 * Body: { workflowName, triggerType, notes }
 * Starts a new automated ML pipeline execution.
 */
router.post('/start', auth, adminOnly, pipelineWorkflowController.startWorkflow);

/**
 * POST /api/admin/pipeline/cancel/:id
 * Cancels a running workflow execution.
 */
router.post('/cancel/:id', auth, adminOnly, pipelineWorkflowController.cancelWorkflow);

/**
 * POST /api/admin/pipeline/retry/:id
 * Retries a failed workflow execution.
 */
router.post('/retry/:id', auth, adminOnly, pipelineWorkflowController.retryWorkflow);

/**
 * GET /api/admin/pipeline/logs/:id
 * Returns real-time execution logs for a workflow.
 */
router.get('/logs/:id', auth, adminOnly, pipelineWorkflowController.getLogs);

module.exports = router;
