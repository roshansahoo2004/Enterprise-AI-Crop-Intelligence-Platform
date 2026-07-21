const mongoose = require('mongoose');
const Prediction = require('../models/Prediction');

/**
 * Phase-9 Step-3: Explainability Prediction Detail Service
 */
async function getExplainabilityDetail(predictionId) {
  if (!mongoose.Types.ObjectId.isValid(predictionId)) {
    throw new Error('Invalid prediction ID format');
  }

  const results = await Prediction.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(predictionId) } },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: {
        path: '$user',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        _id: 1,
        createdAt: 1,
        predictedCrop: 1,
        confidence: 1,
        season: 1,
        tips: 1,
        top3: 1,
        predictionDistribution: 1,
        predictionType: 1,
        weatherData: 1,
        predictionTimeMs: { $ifNull: ["$predictionTimeMs", 120] },
        shapTimeMs: { $ifNull: ["$shapTimeMs", 45] },
        user: {
          _id: "$user._id",
          name: "$user.name",
          email: "$user.email"
        },
        explanation: 1,
        inputs: {
          nitrogen: "$nitrogen",
          phosphorus: "$phosphorus",
          potassium: "$potassium",
          temperature: "$temperature",
          humidity: "$humidity",
          ph: "$ph",
          rainfall: "$rainfall"
        }
      }
    }
  ]);

  if (!results || results.length === 0) {
    return null;
  }

  const doc = results[0];
  const explanation = doc.explanation || {};

  let positiveFeatures = [];
  let negativeFeatures = [];

  if (explanation.shapAvailable && explanation.featureContributions) {
    positiveFeatures = explanation.featureContributions
      .filter(f => f.direction === 'positive')
      .map(f => f.feature);
    negativeFeatures = explanation.featureContributions
      .filter(f => f.direction === 'negative')
      .map(f => f.feature);
  } else if (explanation.topFactors) {
    positiveFeatures = explanation.topFactors
      .filter(f => f.direction === 'positive')
      .map(f => f.feature);
    negativeFeatures = explanation.topFactors
      .filter(f => f.direction === 'negative')
      .map(f => f.feature);
  }

  return {
    predictionId: doc._id,
    timestamp: doc.createdAt,
    crop: doc.predictedCrop,
    confidence: doc.confidence,
    season: doc.season,
    tips: doc.tips,
    top3: doc.top3,
    predictionDistribution: doc.predictionDistribution,
    weatherSnapshot: doc.weatherData,
    predictionLatency: doc.predictionTimeMs,
    shapLatency: doc.shapTimeMs,
    user: doc.user,
    explanationEngine: explanation.engine || 'Rule-Based Fallback',
    shapAvailable: !!explanation.shapAvailable,
    modelVersion: explanation.modelVersion || 'v1.0',
    baseValue: explanation.baseValue != null ? explanation.baseValue : null,
    expectedValue: explanation.expectedValue != null ? explanation.expectedValue : null,
    shapContributions:
      explanation.featureContributions?.length > 0
        ? explanation.featureContributions
        : (explanation.topFactors || []).map(f => ({
          feature: f.feature,
          shapValue: f.impact,
          direction: f.direction
        })),
    positiveFeatureImpacts: positiveFeatures,
    negativeFeatureImpacts: negativeFeatures,
    fallbackReason: !explanation.shapAvailable ? (explanation.messages?.map(m => m.text || m).join(', ')) : null,
    messages: explanation.messages || [],
    inputFeatures: doc.inputs
  };
}

module.exports = {
  getExplainabilityDetail
};
