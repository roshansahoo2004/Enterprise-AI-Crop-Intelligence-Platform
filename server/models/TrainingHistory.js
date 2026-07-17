const mongoose = require('mongoose');

/**
 * Phase-3 Step-5: Training History Schema
 *
 * Stores a complete record of every retraining run (success or failure).
 * Used for analytics, admin dashboard, training timeline, model comparison,
 * and audit logs.
 *
 * Fields marked as "Future Ready" (accuracy, loss, epochs) are placeholders
 * that will be populated once train_disease_model.py exports a metrics.json
 * file after each training run.
 */
const trainingHistorySchema = new mongoose.Schema({
  // Model version created by this training run (e.g. "v1.3").
  // For failed runs, this will be the version that WOULD have been created,
  // or null if version increment was skipped.
  modelVersion: {
    type: String,
    default: null,
    trim: true
  },
  // "SUCCESS" or "FAILED"
  status: {
    type: String,
    required: true,
    enum: ['SUCCESS', 'FAILED'],
    index: true
  },
  // Number of feedback documents used for this training cycle.
  feedbackUsed: {
    type: Number,
    default: 0
  },
  // ── Future Ready: Will be populated when train_disease_model.py
  //    exports metrics.json with final evaluation results. ──
  accuracy: {
    type: Number,
    default: null
  },
  // ── Future Ready: Final training loss from metrics.json. ──
  loss: {
    type: Number,
    default: null
  },
  // ── Future Ready: Total epochs trained from metrics.json. ──
  epochs: {
    type: Number,
    default: null
  },
  // ── Phase-5 Step-1: Structured metrics sub-object ──
  // Populated from metrics.json after successful training runs.
  metrics: {
    accuracy:  { type: Number, default: null },
    loss:      { type: Number, default: null },
    precision: { type: Number, default: null },
    recall:    { type: Number, default: null },
    f1Score:   { type: Number, default: null }
  },
  // Number of training images used in this run.
  trainingImages: {
    type: Number,
    default: null
  },
  // Number of validation images used in this run.
  validationImages: {
    type: Number,
    default: null
  },
  // Wall-clock duration of the training process in seconds.
  durationSeconds: {
    type: Number,
    default: 0
  },
  // Full stdout + stderr captured from the Python training process.
  logs: {
    type: String,
    default: ''
  },
  // Process exit code (0 = success, non-zero = failure).
  exitCode: {
    type: Number,
    default: null
  },
  // When the training process was started.
  startedAt: {
    type: Date,
    default: null
  },
  // When the training process finished.
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TrainingHistory', trainingHistorySchema);
