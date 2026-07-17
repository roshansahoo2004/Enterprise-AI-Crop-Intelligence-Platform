const express = require('express');
const { getWeather } = require('../services/weatherService');

const router = express.Router();

/**
 * GET /api/weather?lat=xx&lon=yy
 * Fetch current weather data from OpenWeather API
 */
router.get('/', async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required. Pass ?lat=xx&lon=yy'
      });
    }

    const weatherData = await getWeather(parseFloat(lat), parseFloat(lon));

    res.json({
      success: true,
      data: weatherData
    });
  } catch (error) {
    console.error('Weather API error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching weather data'
    });
  }
});

module.exports = router;
