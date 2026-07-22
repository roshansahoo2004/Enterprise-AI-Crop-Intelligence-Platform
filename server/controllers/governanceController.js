const governanceService = require('../services/governanceService');

/**
 * Phase-11 Step-7: Enterprise AI Governance & Compliance Center Controller
 *
 * Handles summary, audit logs, policies, violations, policy CRUD, and approve/reject endpoints.
 */

// GET /api/admin/governance/summary
exports.getSummary = async (req, res) => {
  try {
    const data = await governanceService.getGovernanceSummary();
    res.json({
      success: true,
      message: 'Governance summary retrieved successfully',
      data
    });
  } catch (error) {
    console.error('Governance Controller — Summary Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching governance summary',
      error: error.message
    });
  }
};

// GET /api/admin/governance/audit
exports.getAudit = async (req, res) => {
  try {
    const data = await governanceService.getAuditLogs();
    res.json({
      success: true,
      message: 'Governance audit logs retrieved successfully',
      data
    });
  } catch (error) {
    console.error('Governance Controller — Audit Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching audit logs',
      error: error.message
    });
  }
};

// GET /api/admin/governance/policies
exports.getPolicies = async (req, res) => {
  try {
    const data = await governanceService.getPolicies();
    res.json({
      success: true,
      message: 'Governance policies retrieved successfully',
      data
    });
  } catch (error) {
    console.error('Governance Controller — Policies Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching policies',
      error: error.message
    });
  }
};

// GET /api/admin/governance/violations
exports.getViolations = async (req, res) => {
  try {
    const data = await governanceService.getViolations();
    res.json({
      success: true,
      message: 'Governance violations retrieved successfully',
      data
    });
  } catch (error) {
    console.error('Governance Controller — Violations Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching violations',
      error: error.message
    });
  }
};

// POST /api/admin/governance/policy
exports.createPolicy = async (req, res) => {
  try {
    const createdBy = req.user?.email || 'Admin User';
    const data = await governanceService.createPolicy(req.body, createdBy);
    res.json({
      success: true,
      message: data.message,
      data
    });
  } catch (error) {
    console.error('Governance Controller — Create Policy Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create governance policy',
      error: error.message
    });
  }
};

// PUT /api/admin/governance/policy/:id
exports.updatePolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await governanceService.updatePolicy(id, req.body);
    res.json({
      success: true,
      message: data.message,
      data
    });
  } catch (error) {
    console.error('Governance Controller — Update Policy Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update governance policy',
      error: error.message
    });
  }
};

// POST /api/admin/governance/approve/:id
exports.approve = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const data = await governanceService.approveRequest(id, comment);
    res.json({
      success: true,
      message: data.message,
      data
    });
  } catch (error) {
    console.error('Governance Controller — Approve Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to approve request',
      error: error.message
    });
  }
};

// POST /api/admin/governance/reject/:id
exports.reject = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const data = await governanceService.rejectRequest(id, comment);
    res.json({
      success: true,
      message: data.message,
      data
    });
  } catch (error) {
    console.error('Governance Controller — Reject Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to reject request',
      error: error.message
    });
  }
};
