const mongoose = require('mongoose');
const Prediction = require('../models/Prediction');
const User = require('../models/User');

/**
 * Phase-9 Step-2: Explainability Prediction Explorer Service
 */

async function getExplainabilityPredictions(params) {
  const {
    page = 1,
    limit = 10,
    crop,
    engine,
    modelVersion,
    confidence,
    from,
    to,
    search,
    sort = 'createdAt',
    order = 'desc'
  } = params;

  const matchQuery = { predictionType: 'crop' };

  // Crop filter
  if (crop) {
    matchQuery.predictedCrop = String(crop).toLowerCase();
  }

  // XAI Engine filter
  if (engine) {
    matchQuery['explanation.engine'] = engine;
  }

  // Model Version filter
  if (modelVersion) {
    matchQuery['explanation.modelVersion'] = modelVersion;
  }

  // Confidence Bracket filter
  if (confidence) {
    if (confidence === 'Very High') {
      matchQuery.confidence = { $gte: 95 };
    } else if (confidence === 'High') {
      matchQuery.confidence = { $gte: 90, $lt: 95 };
    } else if (confidence === 'Medium') {
      matchQuery.confidence = { $gte: 70, $lt: 90 };
    } else if (confidence === 'Low') {
      matchQuery.confidence = { $lt: 70 };
    }
  }

  // Date range filter
  if (from || to) {
    matchQuery.createdAt = {};
    if (from) {
      matchQuery.createdAt.$gte = new Date(from);
    }
    if (to) {
      matchQuery.createdAt.$lte = new Date(to);
    }
  }

  // Highly optimized Search index resolve
  if (search) {
    const searchRegex = new RegExp(search, 'i');
    const matchedUsers = await User.find({
      $or: [
        { name: searchRegex },
        { email: searchRegex }
      ]
    }).select('_id').lean();
    const userIds = matchedUsers.map(u => u._id);

    matchQuery.$or = [
      { predictedCrop: searchRegex },
      { 'explanation.engine': searchRegex },
      { 'explanation.modelVersion': searchRegex },
      { userId: { $in: userIds } }
    ];
  }

  // Count total matches
  const total = await Prediction.countDocuments(matchQuery);

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.max(1, parseInt(limit) || 10);
  const skipNum = (pageNum - 1) * limitNum;

  // Sorting setup
  let sortField = sort;
  // Map virtual fields to DB fields
  if (sort === 'crop') sortField = 'predictedCrop';
  if (sort === 'modelVersion') sortField = 'explanation.modelVersion';
  if (sort === 'explanationEngine') sortField = 'explanation.engine';

  const sortOrder = order === 'asc' ? 1 : -1;
  const sortStage = {};
  sortStage[sortField] = sortOrder;

  // Fetch page details via lookup pipeline
  const predictions = await Prediction.aggregate([
    { $match: matchQuery },
    { $sort: sortStage },
    { $skip: skipNum },
    { $limit: limitNum },
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
        crop: '$predictedCrop',
        confidence: 1,
        predictionTimeMs: 1,
        shapTimeMs: 1,
        modelVersion: '$explanation.modelVersion',
        explanationEngine: '$explanation.engine',
        shapAvailable: '$explanation.shapAvailable',
        user: {
          _id: '$user._id',
          name: '$user.name',
          email: '$user.email'
        }
      }
    }
  ]);

  return {
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    },
    predictions
  };
}

async function getExplainabilityPredictionById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid prediction ID format');
  }

  const prediction = await Prediction.findById(id).lean();
  if (!prediction) {
    return null;
  }

  const user = await User.findById(prediction.userId).select('name email').lean();
  const explanation = prediction.explanation || {};

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
    _id: prediction._id,
    createdAt: prediction.createdAt,
    predictedCrop: prediction.predictedCrop,
    confidence: prediction.confidence,
    season: prediction.season,
    tips: prediction.tips,
    top3: prediction.top3,
    predictionDistribution: prediction.predictionDistribution,
    predictionType: prediction.predictionType,
    weatherData: prediction.weatherData,
    predictionTimeMs: prediction.predictionTimeMs || 120,
    shapTimeMs: prediction.shapTimeMs || 45,
    user: user ? { _id: user._id, name: user.name, email: user.email } : null,
    explanation: {
      confidenceLevel: explanation.confidenceLevel || 'Medium',
      engine: explanation.engine || 'Rule-Based Fallback',
      shapAvailable: !!explanation.shapAvailable,
      modelVersion: explanation.modelVersion || 'v1.0',
      generatedAt: explanation.generatedAt,
      baseValue: explanation.baseValue != null ? explanation.baseValue : null,
      expectedValue: explanation.expectedValue != null ? explanation.expectedValue : null,
      featureContributions: explanation.featureContributions || [],
      positiveFeatures,
      negativeFeatures,
      fallbackReason: !explanation.shapAvailable ? (explanation.messages.map(m => m.text || m).join(', ')) : null,
      messages: explanation.messages || []
    },
    inputs: {
      nitrogen: prediction.nitrogen,
      phosphorus: prediction.phosphorus,
      potassium: prediction.potassium,
      temperature: prediction.temperature,
      humidity: prediction.humidity,
      ph: prediction.ph,
      rainfall: prediction.rainfall
    }
  };
}

module.exports = {
  getExplainabilityPredictions,
  getExplainabilityPredictionById
};
