const mongoose = require('mongoose');

/**
 * Phase-11 Step-5: Retraining Job Schema
 *
 * Stores scheduled model retraining jobs, CRON expressions, trigger rules,
 * status (Active/Paused/Running), next execution time, and historical run logs.
 */
const retrainingJobSchema = new mongoose.Schema({
  jobId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  jobName: {
    type: String,
    required: true,
    trim: true
  },
  cronExpression: {
    type: String,
    default: '0 2 * * 0', // Default: Every Sunday at 2 AM
    trim: true
  },
  frequency: {
    type: String,
    enum: ['Daily', 'Weekly', 'Monthly', 'Event-Driven', 'Manual'],
    default: 'Weekly'
  },
  dataset: {
    type: String,
    default: 'ds-v1.4',
    trim: true
  },
  modelVersion: {
    type: String,
    default: 'v1.2-candidate',
    trim: true
  },
  algorithm: {
    type: String,
    default: 'LightGBM'
  },
  triggerType: {
    type: String,
    enum: [
      'Manual',
      'Daily',
      'Weekly',
      'Monthly',
      'Drift Detection',
      'Confidence Drift',
      'Health Threshold',
      'Retraining Recommendation'
    ],
    default: 'Weekly',
    index: true
  },
  enabled: {
    type: Boolean,
    default: true,
    index: true
  },
  createdBy: {
    type: String,
    default: 'admin@system.com'
  },
  lastRun: {
    type: Date,
    default: Date.now
  },
  nextRun: {
    type: Date,
    default: () => new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 7 days from now
  },
  averageDuration: {
    type: String,
    default: '32m 15s'
  },
  status: {
    type: String,
    enum: ['Active', 'Paused', 'Running', 'Completed', 'Failed'],
    default: 'Active',
    index: true
  },
  notes: {
    type: String,
    default: 'Automated periodic model retraining pipeline'
  },
  executionHistory: [{
    executionId: String,
    triggeredAt: { type: Date, default: Date.now },
    completedAt: Date,
    duration: String,
    status: { type: String, enum: ['Success', 'Failed', 'Running'] },
    accuracy: Number,
    notes: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('RetrainingJob', retrainingJobSchema);
