const mongoose = require('mongoose');

/**
 * Phase-3 Step-4: Model Version Schema
 *
 * Tracks disease detection model versions. Each successful retraining
 * creates a new version document and deactivates the previous one.
 *
 * Only ONE document should have isActive = true at any time.
 * The prediction API reads the active version to tag its responses.
 */
const modelVersionSchema = new mongoose.Schema({
  // Semantic version string, e.g. "v1.0", "v1.1", "v1.2"
  version: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  // Only the latest version is active; all others are deactivated.
  isActive: {
    type: Boolean,
    default: false,
    index: true
  },
  // Training accuracy (populated from metrics.json after retraining).
  accuracy: {
    type: Number,
    default: null
  },
  // ── Phase-5 Step-1: Training Metrics Integration ──
  // Final validation loss from metrics.json.
  loss: {
    type: Number,
    default: null
  },
  // Weighted precision from metrics.json.
  precision: {
    type: Number,
    default: null
  },
  // Weighted recall from metrics.json.
  recall: {
    type: Number,
    default: null
  },
  // Weighted F1 score from metrics.json.
  f1Score: {
    type: Number,
    default: null
  },
  // Total epochs trained (across all phases).
  epochs: {
    type: Number,
    default: null
  },
  // Number of training images used.
  trainingImages: {
    type: Number,
    default: null
  },
  // Number of validation images used.
  validationImages: {
    type: Number,
    default: null
  },
  // Timestamp when the model was trained.
  trainedAt: {
    type: Date,
    default: null
  },
  // How many feedback documents were used for this training cycle.
  feedbackUsed: {
    type: Number,
    default: 0
  },
  // ── Phase-5 Step-3: Versioned Model Storage ──
  // Relative path to the versioned .h5 model artifact on disk.
  // Example: "models/model_versions/v1.4.h5"
  // Null for legacy versions that pre-date versioned storage.
  filePath: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ModelVersion', modelVersionSchema);
