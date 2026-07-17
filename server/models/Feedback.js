const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
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
  predictedDisease: {
    type: String,
    required: true,
    trim: true
  },
  actualDisease: {
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
  correct: {
    type: Boolean,
    required: true
  },
  feedbackImage: {
    type: String
  },
  modelVersion: {
    type: String,
    default: "v1.0"
  },
  verified: {
    type: Boolean,
    default: false
  },
  retrained: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  verifiedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Feedback', feedbackSchema);
