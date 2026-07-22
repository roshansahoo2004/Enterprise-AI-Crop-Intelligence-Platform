const express = require('express');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const governanceController = require('../controllers/governanceController');

const router = express.Router();

/**
 * Phase-11 Step-7: Enterprise AI Governance & Compliance Center Routes
 *
 * Base path: /api/admin/governance
 */

/**
 * GET /api/admin/governance/summary
 * Returns compliance score, policies count, violations, pending approvals, critical risks, and audit events.
 */
router.get('/summary', auth, adminOnly, governanceController.getSummary);

/**
 * GET /api/admin/governance/audit
 * Returns compliance audit logs.
 */
router.get('/audit', auth, adminOnly, governanceController.getAudit);

/**
 * GET /api/admin/governance/policies
 * Returns list of configured governance policies.
 */
router.get('/policies', auth, adminOnly, governanceController.getPolicies);

/**
 * GET /api/admin/governance/violations
 * Returns tracked policy violations list.
 */
router.get('/violations', auth, adminOnly, governanceController.getViolations);

/**
 * POST /api/admin/governance/policy
 * Body: { policyName, category, description, severity, conditions, enabled }
 * Creates a new governance policy.
 */
router.post('/policy', auth, adminOnly, governanceController.createPolicy);

/**
 * PUT /api/admin/governance/policy/:id
 * Updates or toggles an existing governance policy.
 */
router.put('/policy/:id', auth, adminOnly, governanceController.updatePolicy);

/**
 * POST /api/admin/governance/approve/:id
 * Body: { comment }
 * Approves a pending governance approval request.
 */
router.post('/approve/:id', auth, adminOnly, governanceController.approve);

/**
 * POST /api/admin/governance/reject/:id
 * Body: { comment }
 * Rejects a pending governance approval request.
 */
router.post('/reject/:id', auth, adminOnly, governanceController.reject);

module.exports = router;
