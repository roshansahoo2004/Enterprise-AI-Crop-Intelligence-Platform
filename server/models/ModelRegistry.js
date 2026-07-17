const mongoose = require('mongoose');

/**
 * Phase-6 Step-1: Model Registry Schema
 *
 * Production-style Model Registry that stores every trained model separately.
 * Each successful retraining automatically creates a registry entry.
 *
 * This is a NEW collection — the existing ModelVersion collection remains
 * untouched and both systems work in parallel.
 *
 * Status transitions:
 *   - New model → ACTIVE (previous ACTIVE → ARCHIVED automatically)
 *   - CANDIDATE is reserved for future A/B testing or canary deployments.
 */
const modelRegistrySchema = new mongoose.Schema({
  // Semantic version string, e.g. "v1.0", "v1.1", "v1.2"
  version: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  // Model architecture used for training (e.g. "efficientnetb0", "resnet50", "custom")
  architecture: {
    type: String,
    default: 'efficientnetb0',
    trim: true
  },
  // ── Training Metrics ──
  accuracy: {
    type: Number,
    default: null
  },
  precision: {
    type: Number,
    default: null
  },
  recall: {
    type: Number,
    default: null
  },
  f1Score: {
    type: Number,
    default: null
  },
  loss: {
    type: Number,
    default: null
  },
  epochs: {
    type: Number,
    default: null
  },
  trainingImages: {
    type: Number,
    default: null
  },
  validationImages: {
    type: Number,
    default: null
  },
  // Whether GPU was used during training (detected from training logs)
  gpuUsed: {
    type: Boolean,
    default: false
  },
  // Training wall-clock duration in seconds
  trainingDuration: {
    type: Number,
    default: null
  },
  // Model file size in MB
  modelSizeMB: {
    type: Number,
    default: null
  },
  // Deployment status of the model
  status: {
    type: String,
    enum: ['ACTIVE', 'ARCHIVED', 'CANDIDATE'],
    default: 'ACTIVE',
    index: true
  },
  // Relative path to the versioned .h5 model file
  // Example: "models/model_versions/v1.3.h5"
  filePath: {
    type: String,
    default: null
  },
  // When the model was trained
  trainedAt: {
    type: Date,
    default: null
  },
  // Reference to the corresponding TrainingHistory document
  trainingHistory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrainingHistory',
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ModelRegistry', modelRegistrySchema);
