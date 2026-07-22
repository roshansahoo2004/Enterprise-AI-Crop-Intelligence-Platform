const { GovernanceAudit, GovernancePolicy } = require('../models/GovernanceAudit');

/**
 * Phase-11 Step-7: Enterprise AI Governance & Compliance Center Service
 *
 * Provides governance summary metrics, audit log feeds, policy management,
 * violation tracking, and administrative approval request processing.
 */

// ─── Ensure Seed Data ────────────────────────────────────────────────────────
async function ensureSeedGovernance() {
  const policyCount = await GovernancePolicy.countDocuments();
  if (policyCount === 0) {
    await GovernancePolicy.create([
      {
        policyId: 'POL-001',
        policyName: 'Minimum Production Accuracy Gate',
        category: 'Model Quality',
        description: 'All candidate models promoted to active serving must achieve minimum 90.0% validation accuracy',
        enabled: true,
        severity: 'Critical',
        conditions: 'accuracy >= 0.90',
        createdBy: 'compliance@company.com'
      },
      {
        policyId: 'POL-002',
        policyName: 'Explainability & SHAP Coverage Mandate',
        category: 'Explainability',
        description: 'Model predictions must include SHAP feature importance attribution for at least 80% of inference features',
        enabled: true,
        severity: 'High',
        conditions: 'shap_coverage >= 0.80',
        createdBy: 'compliance@company.com'
      },
      {
        policyId: 'POL-003',
        policyName: 'Data Drift PSI Threshold Guard',
        category: 'Security',
        description: 'Prevents automatic model deployment if population stability index (PSI) exceeds 0.25 on core features',
        enabled: true,
        severity: 'High',
        conditions: 'max_psi <= 0.25',
        createdBy: 'mlops-security@company.com'
      },
      {
        policyId: 'POL-004',
        policyName: 'GDPR Data Privacy Anonymization',
        category: 'Data Privacy',
        description: 'Ensures user geographical metadata is aggregated and anonymized prior to model retraining',
        enabled: true,
        severity: 'Medium',
        conditions: 'anonymization_enabled == true',
        createdBy: 'privacy-officer@company.com'
      },
      {
        policyId: 'POL-005',
        policyName: 'Demographic Bias & Fairness Audit',
        category: 'Bias & Fairness',
        description: 'Verifies sub-population accuracy disparity does not exceed 5% across crop region datasets',
        enabled: false,
        severity: 'Medium',
        conditions: 'bias_disparity <= 0.05',
        createdBy: 'ethics-board@company.com'
      }
    ]);
  }

  const auditCount = await GovernanceAudit.countDocuments();
  if (auditCount === 0) {
    const now = new Date();
    await GovernanceAudit.create([
      {
        auditId: 'AUD-2026-001',
        eventType: 'Model Deployment',
        resourceType: 'ModelVersion',
        resourceId: 'v1.2-candidate',
        performedBy: 'admin@system.com',
        role: 'MLOps Lead',
        action: 'Deploy Model to Active Serving',
        status: 'Approved',
        riskLevel: 'Low',
        approvalStatus: 'Approved',
        reason: 'Passed pre-flight health checks and accuracy gate',
        notes: 'Promoted candidate v1.2-candidate after 16-metric version comparison',
        ipAddress: '192.168.1.105',
        device: 'Windows 11 / Chrome',
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 2)
      },
      {
        auditId: 'AUD-2026-002',
        eventType: 'Pipeline Execution',
        resourceType: 'PipelineWorkflow',
        resourceId: 'WF-2026-001',
        performedBy: 'mlops-pipeline',
        role: 'Automated Service Account',
        action: 'Execute 8-Stage MLOps Pipeline',
        status: 'Passed',
        riskLevel: 'Low',
        approvalStatus: 'Approved',
        reason: 'Automated weekly pipeline run',
        notes: '8 stages completed successfully',
        ipAddress: '10.0.0.12',
        device: 'Linux / Docker Worker',
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 12)
      },
      {
        auditId: 'AUD-2026-003',
        eventType: 'Model Deployment',
        resourceType: 'ModelVersion',
        resourceId: 'v1.3-experimental',
        performedBy: 'researcher@system.com',
        role: 'Data Scientist',
        action: 'Promote Experimental Model to Production',
        status: 'Pending',
        riskLevel: 'High',
        approvalStatus: 'Pending',
        reason: 'Requires senior admin approval due to High risk classification',
        notes: 'Experimental neural net model requesting production deployment',
        ipAddress: '192.168.1.110',
        device: 'macOS / Safari',
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24)
      },
      {
        auditId: 'AUD-2026-004',
        eventType: 'Policy Modification',
        resourceType: 'GovernancePolicy',
        resourceId: 'POL-003',
        performedBy: 'compliance@company.com',
        role: 'Compliance Officer',
        action: 'Update PSI Threshold Condition',
        status: 'Approved',
        riskLevel: 'Medium',
        approvalStatus: 'Approved',
        reason: 'Updated drift sensitivity to match Phase-10 requirements',
        notes: 'Set PSI threshold to 0.25',
        ipAddress: '192.168.1.100',
        device: 'Windows 11 / Chrome',
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 48)
      }
    ]);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  GET /summary
// ═══════════════════════════════════════════════════════════════════════════
async function getGovernanceSummary() {
  await ensureSeedGovernance();

  const [policiesCount, activePolicies, auditsCount, pendingCount, highRiskCount] = await Promise.all([
    GovernancePolicy.countDocuments(),
    GovernancePolicy.countDocuments({ enabled: true }),
    GovernanceAudit.countDocuments(),
    GovernanceAudit.countDocuments({ approvalStatus: 'Pending' }),
    GovernanceAudit.countDocuments({ riskLevel: 'High' })
  ]);

  const violations = [
    {
      id: 'VIOL-001',
      policyName: 'Data Drift PSI Threshold Guard',
      severity: 'High',
      reason: 'Feature humidity_drift exceeded 0.25 PSI limit',
      status: 'Resolved',
      detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
    },
    {
      id: 'VIOL-002',
      policyName: 'Explainability & SHAP Coverage Mandate',
      severity: 'Medium',
      reason: 'SHAP coverage dropped to 78% during batch prediction test',
      status: 'Investigating',
      detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
    }
  ];

  return {
    complianceScore: 96, // 96%
    policies: activePolicies,
    totalPolicies: policiesCount,
    violationsCount: violations.length,
    pendingApprovals: pendingCount,
    criticalRisks: highRiskCount,
    auditEvents: auditsCount,
    lastAuditTimestamp: new Date().toISOString()
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  GET /audit
// ═══════════════════════════════════════════════════════════════════════════
async function getAuditLogs() {
  await ensureSeedGovernance();
  const logs = await GovernanceAudit.find().sort({ createdAt: -1 }).lean();
  return { logs };
}

// ═══════════════════════════════════════════════════════════════════════════
//  GET /policies
// ═══════════════════════════════════════════════════════════════════════════
async function getPolicies() {
  await ensureSeedGovernance();
  const policies = await GovernancePolicy.find().sort({ createdAt: -1 }).lean();
  return { policies };
}

// ═══════════════════════════════════════════════════════════════════════════
//  GET /violations
// ═══════════════════════════════════════════════════════════════════════════
async function getViolations() {
  const violations = [
    {
      id: 'VIOL-001',
      policyName: 'Data Drift PSI Threshold Guard',
      severity: 'High',
      reason: 'Feature humidity_drift exceeded 0.25 PSI limit during inference stream',
      status: 'Resolved',
      detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
    },
    {
      id: 'VIOL-002',
      policyName: 'Explainability & SHAP Coverage Mandate',
      severity: 'Medium',
      reason: 'SHAP coverage dropped to 78% during batch prediction test (threshold 80%)',
      status: 'Investigating',
      detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
    }
  ];
  return { violations };
}

// ═══════════════════════════════════════════════════════════════════════════
//  POST /policy (Create Policy)
// ═══════════════════════════════════════════════════════════════════════════
async function createPolicy(data, createdBy = 'Admin User') {
  const count = await GovernancePolicy.countDocuments();
  const policyId = `POL-${String(count + 1).padStart(3, '0')}`;

  const newPolicy = await GovernancePolicy.create({
    policyId,
    policyName: data.policyName || `Policy ${policyId}`,
    category: data.category || 'Model Quality',
    description: data.description || 'Custom governance enforcement policy',
    enabled: data.enabled !== undefined ? data.enabled : true,
    severity: data.severity || 'High',
    conditions: data.conditions || 'accuracy >= 0.90',
    createdBy
  });

  return {
    message: `Governance policy ${policyId} created successfully`,
    policy: newPolicy
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  PUT /policy/:id (Update / Toggle Policy)
// ═══════════════════════════════════════════════════════════════════════════
async function updatePolicy(id, updates) {
  const policy = await GovernancePolicy.findOne({
    $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { policyId: id }]
  });

  if (!policy) throw new Error(`Policy ${id} not found`);

  if (updates.policyName) policy.policyName = updates.policyName;
  if (updates.category) policy.category = updates.category;
  if (updates.description) policy.description = updates.description;
  if (updates.severity) policy.severity = updates.severity;
  if (updates.conditions) policy.conditions = updates.conditions;
  if (updates.enabled !== undefined) policy.enabled = updates.enabled;

  await policy.save();

  return {
    message: `Policy ${policy.policyId} updated successfully`,
    policy
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  POST /approve/:id
// ═══════════════════════════════════════════════════════════════════════════
async function approveRequest(id, comment = 'Approved by administrator') {
  const audit = await GovernanceAudit.findOne({
    $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { auditId: id }]
  });

  if (!audit) throw new Error(`Audit request ${id} not found`);

  audit.approvalStatus = 'Approved';
  audit.status = 'Approved';
  audit.notes = comment;
  await audit.save();

  return {
    message: `Governance request ${audit.auditId} approved successfully`,
    audit
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  POST /reject/:id
// ═══════════════════════════════════════════════════════════════════════════
async function rejectRequest(id, comment = 'Rejected by administrator') {
  const audit = await GovernanceAudit.findOne({
    $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { auditId: id }]
  });

  if (!audit) throw new Error(`Audit request ${id} not found`);

  audit.approvalStatus = 'Rejected';
  audit.status = 'Rejected';
  audit.notes = comment;
  await audit.save();

  return {
    message: `Governance request ${audit.auditId} rejected`,
    audit
  };
}

module.exports = {
  getGovernanceSummary,
  getAuditLogs,
  getPolicies,
  getViolations,
  createPolicy,
  updatePolicy,
  approveRequest,
  rejectRequest
};
