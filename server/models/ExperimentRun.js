const mongoose = require('mongoose');

/**
 * Phase-11 Step-4: Experiment Run Schema (MLflow Style)
 *
 * Tracks every model training experiment run, including hyperparameters,
 * training & validation metrics, status, duration, dataset versions, and artifacts.
 */

const artifactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, default: 'Artifact' },
  path: { type: String, required: true },
  sizeKb: { type: Number, default: 0 }
}, { _id: false });

const experimentRunSchema = new mongoose.Schema({
  experimentId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  runName: {
    type: String,
    required: true,
    trim: true
  },
  datasetVersion: {
    type: String,
    default: 'ds-v1.0',
    trim: true
  },
  datasetSize: {
    type: Number,
    default: 2500
  },
  modelVersion: {
    type: String,
    default: 'v1.0',
    trim: true
  },
  algorithm: {
    type: String,
    enum: ['RandomForest', 'XGBoost', 'LightGBM', 'NeuralNetwork', 'SVM', 'Ensemble'],
    default: 'RandomForest'
  },
  framework: {
    type: String,
    default: 'Scikit-Learn'
  },
  trainingStarted: {
    type: Date,
    default: Date.now
  },
  trainingCompleted: {
    type: Date,
    default: Date.now
  },
  trainingDurationMs: {
    type: Number,
    default: 2500000 // in ms (~41 mins)
  },
  trainingDuration: {
    type: String,
    default: '41m 40s'
  },

  // ── Hyperparameters ──
  epochs: {
    type: Number,
    default: 100
  },
  learningRate: {
    type: Number,
    default: 0.01
  },
  batchSize: {
    type: Number,
    default: 64
  },
  optimizer: {
    type: String,
    default: 'Adam'
  },

  // ── Training & Validation Metrics ──
  loss: {
    type: Number,
    default: 0.12
  },
  validationLoss: {
    type: Number,
    default: 0.15
  },
  accuracy: {
    type: Number,
    default: 0.955
  },
  validationAccuracy: {
    type: Number,
    default: 0.948
  },
  precision: {
    type: Number,
    default: 0.951
  },
  recall: {
    type: Number,
    default: 0.946
  },
  f1Score: {
    type: Number,
    default: 0.948
  },
  rocAuc: {
    type: Number,
    default: 0.982
  },
  inferenceTimeMs: {
    type: Number,
    default: 12
  },
  modelSizeMb: {
    type: Number,
    default: 14.5
  },

  checkpointPath: {
    type: String,
    default: 'models/checkpoints/exp_latest.h5'
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILED', 'RUNNING'],
    default: 'SUCCESS',
    index: true
  },
  createdBy: {
    type: String,
    default: 'admin@system.com'
  },
  notes: {
    type: String,
    default: 'Hyperparameter tuning experiment'
  },
  artifacts: [artifactSchema]
}, {
  timestamps: true
});

module.exports = mongoose.models.ExperimentRun || mongoose.model('ExperimentRun', experimentRunSchema);
