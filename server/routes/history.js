const express = require('express');
const auth = require('../middleware/auth');
const Prediction = require('../models/Prediction');

const router = express.Router();

/**
 * GET /api/history
 * Get all predictions for the authenticated user
 * Query params: ?limit=20&page=1&crop=rice
 */
router.get('/', auth, async (req, res) => {
  try {
    const { limit = 20, page = 1, crop } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    const query = { userId: req.user.id };
    if (crop) {
      query.predictedCrop = new RegExp(crop, 'i');
    }

    // Fetch predictions
    const [predictions, total] = await Promise.all([
      Prediction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Prediction.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        predictions,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching prediction history'
    });
  }
});

/**
 * GET /api/history/stats
 * Get aggregated statistics for the user's predictions
 */
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const mongoose = require('mongoose');

    const stats = await Prediction.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$predictedCrop',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$confidence' },
          avgNitrogen: { $avg: '$nitrogen' },
          avgPhosphorus: { $avg: '$phosphorus' },
          avgPotassium: { $avg: '$potassium' },
          avgTemperature: { $avg: '$temperature' },
          avgHumidity: { $avg: '$humidity' },
          avgPh: { $avg: '$ph' },
          avgRainfall: { $avg: '$rainfall' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const totalPredictions = stats.reduce((sum, s) => sum + s.count, 0);
    const avgConfidence = totalPredictions > 0
      ? stats.reduce((sum, s) => sum + s.avgConfidence * s.count, 0) / totalPredictions
      : 0;

    res.json({
      success: true,
      data: {
        totalPredictions,
        avgConfidence: Math.round(avgConfidence * 100) / 100,
        cropDistribution: stats
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching statistics'
    });
  }
});

module.exports = router;
