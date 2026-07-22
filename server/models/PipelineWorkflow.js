const mongoose = require('mongoose');

/**
 * Phase-11 Step-6: Enterprise Automated ML Pipeline Orchestrator Schema
 *
 * Tracks 8-stage automated ML workflows (Dataset Validation -> Monitoring Activation),
 * stage logs, execution durations, trigger types, and status history.
 */
const pipelineWorkflowSchema = new mongoose.Schema({
  workflowId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  workflowName: {
    type: String,
    required: true,
    trim: true
  },
  triggerType: {
    type: String,
    enum: [
      'Manual',
      'Schedule',
      'Data Drift',
      'Feature Drift',
      'Confidence Drift',
      'Health Alert',
      'Performance Drop',
      'Monitoring Alert'
    ],
    default: 'Manual',
    index: true
  },
  status: {
    type: String,
    enum: ['Running', 'Completed', 'Failed', 'Queued', 'Cancelled'],
    default: 'Running',
    index: true
  },
  createdBy: {
    type: String,
    default: 'admin@system.com'
  },
  stages: [{
    name: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['Completed', 'Running', 'Pending', 'Failed', 'Skipped'],
      default: 'Pending'
    },
    startedAt: Date,
    completedAt: Date,
    durationMs: Number,
    logs: [{
      timestamp: { type: Date, default: Date.now },
      level: { type: String, enum: ['INFO', 'WARNING', 'SUCCESS', 'ERROR'], default: 'INFO' },
      message: String
    }]
  }],
  executionHistory: [{
    executedAt: { type: Date, default: Date.now },
    status: String,
    durationMs: Number,
    triggeredBy: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('PipelineWorkflow', pipelineWorkflowSchema);
