const mongoose = require('mongoose');

/**
 * Phase-11 Step-2: Deployment Log Schema
 *
 * Tracks model deployment events, rollbacks, duration, status, and notes.
 */
const deploymentLogSchema = new mongoose.Schema({
  modelVersion: {
    type: String,
    required: true,
    trim: true
  },
  previousVersion: {
    type: String,
    default: 'v1.0',
    trim: true
  },
  deployedBy: {
    type: String,
    default: 'System Administrator',
    trim: true
  },
  durationMs: {
    type: Number,
    default: 3500
  },
  duration: {
    type: String,
    default: '3.5s'
  },
  status: {
    type: String,
    enum: ['Active', 'Success', 'Rolling Back', 'Rolled Back', 'Failed'],
    default: 'Success'
  },
  rollbackStatus: {
    type: String,
    enum: ['Ready', 'In Progress', 'Completed', 'N/A'],
    default: 'Ready'
  },
  deploymentType: {
    type: String,
    enum: ['Manual Deployment', 'Rollback Trigger', 'Automated Promotion'],
    default: 'Manual Deployment'
  },
  notes: {
    type: String,
    default: 'Production deployment'
  },
  deployedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DeploymentLog', deploymentLogSchema);
