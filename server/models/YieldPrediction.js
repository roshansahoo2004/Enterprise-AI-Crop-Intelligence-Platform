const mongoose = require('mongoose');

const yieldPredictionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  cropName: {
    type: String,
    required: true,
    trim: true
  },
  fieldAreaHectares: {
    type: Number,
    required: true,
    default: 1.0
  },
  soilMoisture: Number,
  nitrogen: Number,
  phosphorus: Number,
  potassium: Number,
  temperature: Number,
  predictedYieldTonsPerHectare: {
    type: Number,
    required: true
  },
  totalPredictedYieldTons: {
    type: Number,
    required: true
  },
  estimatedRevenueUsd: Number,
  estimatedProfitUsd: Number,
  confidence: {
    type: Number,
    default: 92.5
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.YieldPrediction || mongoose.model('YieldPrediction', yieldPredictionSchema);
