const mongoose = require('mongoose');

/**
 * Phase-11 Step-7: Governance Audit & Policy Schemas
 *
 * Tracks AI compliance audit logs, policy enforcement rules, risk levels,
 * security violations, and administrative approval requests.
 */
const governanceAuditSchema = new mongoose.Schema({
  auditId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  eventType: {
    type: String,
    enum: [
      'Model Deployment',
      'Pipeline Execution',
      'Policy Modification',
      'Access Control',
      'Retraining Trigger',
      'SHAP Validation'
    ],
    default: 'Model Deployment',
    index: true
  },
  resourceType: {
    type: String,
    default: 'Model'
  },
  resourceId: {
    type: String,
    default: 'v1.2-candidate'
  },
  performedBy: {
    type: String,
    default: 'admin@system.com'
  },
  role: {
    type: String,
    default: 'MLOps Lead'
  },
  action: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Approved', 'Pending', 'Rejected', 'Passed', 'Failed'],
    default: 'Passed',
    index: true
  },
  riskLevel: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Low',
    index: true
  },
  approvalStatus: {
    type: String,
    enum: ['Approved', 'Pending', 'Rejected', 'N/A'],
    default: 'Approved'
  },
  reason: {
    type: String,
    default: 'Standard compliance check'
  },
  notes: {
    type: String,
    default: 'System automated compliance evaluation'
  },
  ipAddress: {
    type: String,
    default: '192.168.1.100'
  },
  device: {
    type: String,
    default: 'Chrome OS / Windows 11'
  }
}, {
  timestamps: true
});

const governancePolicySchema = new mongoose.Schema({
  policyId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  policyName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['Security', 'Model Quality', 'Data Privacy', 'Bias & Fairness', 'Explainability'],
    default: 'Model Quality'
  },
  description: {
    type: String,
    default: 'Enforces minimum model quality and fairness thresholds'
  },
  enabled: {
    type: Boolean,
    default: true
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'High'
  },
  conditions: {
    type: String,
    default: 'Accuracy >= 90% AND SHAP Coverage >= 80%'
  },
  createdBy: {
    type: String,
    default: 'admin@system.com'
  }
}, {
  timestamps: true
});

const GovernanceAudit = mongoose.model('GovernanceAudit', governanceAuditSchema);
const GovernancePolicy = mongoose.model('GovernancePolicy', governancePolicySchema);

module.exports = {
  GovernanceAudit,
  GovernancePolicy
};
