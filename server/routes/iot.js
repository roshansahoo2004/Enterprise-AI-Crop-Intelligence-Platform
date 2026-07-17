const express = require('express');
const { generateSensorData } = require('../services/iotSimulator');

const router = express.Router();

/**
 * GET /api/iot-data
 * Return simulated IoT sensor readings
 */
router.get('/', (req, res) => {
  try {
    const sensorData = generateSensorData();

    res.json({
      success: true,
      data: sensorData
    });
  } catch (error) {
    console.error('IoT data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating sensor data'
    });
  }
});

module.exports = router;
