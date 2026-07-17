const mongoose = require('mongoose');

const diseaseReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  disease: {
    type: String,
    required: true,
    trim: true
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  severity: {
    type: String,
    enum: ['None', 'Low', 'Medium', 'High', 'Critical', 'Unknown'],
    default: 'Unknown'
  },
  treatment: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

diseaseReportSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('DiseaseReport', diseaseReportSchema);
