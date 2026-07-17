const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Crop recommendation fields (made optional to support disease predictions)
  nitrogen: {
    type: Number,
    min: 0,
    max: 200
  },
  phosphorus: {
    type: Number,
    min: 0,
    max: 200
  },
  potassium: {
    type: Number,
    min: 0,
    max: 300
  },
  temperature: {
    type: Number,
    min: -10,
    max: 60
  },
  humidity: {
    type: Number,
    min: 0,
    max: 100
  },
  ph: {
    type: Number,
    min: 0,
    max: 14
  },
  rainfall: {
    type: Number,
    min: 0,
    max: 500
  },
  predictedCrop: {
    type: String,
    trim: true
  },
  
  // Disease prediction fields
  disease: {
    type: String,
    trim: true
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
  predictionType: {
    type: String,
    enum: ['crop', 'disease'],
    default: 'disease',
    required: true
  },

  // Shared prediction confidence
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  season: {
    type: String,
    trim: true
  },
  tips: {
    type: [String],
    default: []
  },
  top3: [{
    crop: String,
    confidence: Number
  }],

  // ─── Phase-8 Step-2: Prediction Distribution (Top 5) ───
  predictionDistribution: [{
    crop: String,
    confidence: Number
  }],
  weatherData: {
    condition: String,
    icon: String,
    location: String
  },

  // ─── Phase-8 Step-1: Explainable AI — Explanation Data ───
  // Stores structured explanation for crop predictions.
  // Optional field: existing documents without it remain valid.
  explanation: {
    confidenceLevel: {
      type: String,
      enum: ['Very High', 'High', 'Medium', 'Low']
    },
    messages: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    },
    topFactors: [{
      feature: String,
      impact: Number,
      direction: {
        type: String,
        enum: ['positive', 'neutral', 'negative']
      }
    }],
    generatedAt: {
      type: Date
    },
    modelVersion: {
      type: String,
      default: 'v1.0'
    },
    engine: {
      type: String,
      default: 'Rule-Based XAI'
    },
    shapAvailable: {
      type: Boolean,
      default: false
    },
    baseValue: {
      type: Number
    },
    expectedValue: {
      type: Number
    },
    featureContributions: [{
      feature: String,
      shapValue: Number,
      direction: String,
      importance: Number
    }]
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  predictionTimeMs: {
    type: Number,
    default: null
  },
  shapTimeMs: {
    type: Number,
    default: null
  }
});

// Index for efficient querying by user and date
predictionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Prediction', predictionSchema);
