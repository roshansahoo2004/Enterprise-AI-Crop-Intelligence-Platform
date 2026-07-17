const express = require('express');
const auth = require('../middleware/auth');
const Prediction = require('../models/Prediction');
const { predictCrop } = require('../services/mlBridge');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { performance } = require('perf_hooks');

// ─── Phase-8 Step-1: Explainable AI Service ───
const { generateExplanation } = require('../services/explanationService');
const ModelVersion = require('../models/ModelVersion');

const router = express.Router();

// ─── Path to the crop prediction Python script ───
const CROP_PREDICT_SCRIPT = path.join(__dirname, '..', '..', 'ml', 'predict.py');

// Multer storage configuration for saving disease images in uploads/
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    // Ensure uploads directory exists dynamically
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename to support concurrent requests without collisions
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure Multer limits and file filters (accepting only JPEG/PNG images)
// Made optional: if no file is sent, multer passes through without error
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png) are allowed!'));
    }
  }
});

/**
 * Spawns the Python crop prediction script and returns the parsed JSON result.
 *
 * @param {Object} inputData - { nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall }
 * @returns {Promise<Object>} - Prediction result from Python (crop, confidence, season, tips, top3)
 */
function runCropPrediction(inputData) {
  return new Promise((resolve, reject) => {
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    const { nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall } = inputData;

    const args = [
      CROP_PREDICT_SCRIPT,
      String(nitrogen),
      String(phosphorus),
      String(potassium),
      String(temperature),
      String(humidity),
      String(ph),
      String(rainfall)
    ];

    const python = spawn(pythonCmd, args, { timeout: 30000 });

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        console.error(`[Crop Prediction] Python process exited with code ${code}`);
        console.error(`[Crop Prediction] stderr: ${stderr}`);
        resolve({
          error: `ML model error (exit code ${code}): ${stderr.trim() || 'Unknown error'}`
        });
        return;
      }

      try {
        const result = JSON.parse(stdout.trim());
        resolve(result);
      } catch (parseError) {
        console.error('[Crop Prediction] Failed to parse output:', stdout);
        resolve({ error: 'Failed to parse ML model output as JSON' });
      }
    });

    python.on('error', (error) => {
      console.error('[Crop Prediction] Failed to spawn Python process:', error);
      resolve({
        error: `Failed to start ML model: ${error.message}. Ensure Python is installed.`
      });
    });
  });
}

/**
 * POST /api/predict
 *
 * Unified prediction endpoint that handles TWO flows:
 *
 * 1. CROP PREDICTION (JSON body):
 *    - Receives soil/weather data as JSON
 *    - Spawns Python ml/predict.py
 *    - Phase-8: Generates explanation via explanationService
 *    - Returns { prediction, confidence, explanation, ... }
 *
 * 2. DISEASE PREDICTION (multipart/form-data with image):
 *    - Receives plant leaf image
 *    - Spawns Python predict_disease.py via mlBridge
 *    - Returns disease prediction result
 *    - (Existing flow — preserved exactly as before)
 */
router.post('/', auth, upload.single('image'), async (req, res) => {
  // ══════════════════════════════════════════════════════════════════════════
  //  Route 1: IMAGE UPLOADED → Disease Prediction (existing flow, unchanged)
  // ══════════════════════════════════════════════════════════════════════════
  if (req.file) {
    let imagePath = req.file.path;

    try {
      // Execute prediction script asynchronously (handles spawning predict_disease.py)
      const mlResult = await predictCrop(imagePath);

      // Check if the script encountered an execution error or model failure
      if (mlResult.error) {
        return res.status(500).json({
          success: false,
          message: 'ML disease prediction model failed',
          error: mlResult.error
        });
      }

      // Save prediction history to MongoDB using Prediction model
      const prediction = new Prediction({
        userId: req.user.id,
        disease: mlResult.disease,
        confidence: mlResult.confidence,
        severity: mlResult.severity || 'Unknown',
        treatment: mlResult.treatment || [],
        predictionType: 'disease'
      });

      await prediction.save();

      // Send successful JSON response back to React
      res.json({
        success: true,
        message: 'Disease prediction successful',
        data: {
          prediction: {
            id: prediction._id,
            disease: prediction.disease,
            confidence: prediction.confidence,
            severity: prediction.severity,
            treatment: prediction.treatment,
            predictionType: prediction.predictionType,
            createdAt: prediction.createdAt
          }
        }
      });

    } catch (error) {
      console.error('Disease prediction route error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during disease prediction',
        error: error.message
      });
    } finally {
      // Clean up: delete the uploaded image file asynchronously after prediction
      if (imagePath && fs.existsSync(imagePath)) {
        try {
          await fs.promises.unlink(imagePath);
        } catch (unlinkError) {
          console.error(`Failed to delete temporary upload file at ${imagePath}:`, unlinkError);
        }
      }
    }
    return;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  Route 2: JSON BODY → Crop Prediction + Phase-8 Explanation
  // ══════════════════════════════════════════════════════════════════════════
  try {
    const startTime = performance.now();
    const { nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall, weatherData } = req.body;

    // Validate required fields
    if (
      nitrogen == null || phosphorus == null || potassium == null ||
      temperature == null || humidity == null || ph == null || rainfall == null
    ) {
      return res.status(400).json({
        success: false,
        message: 'All 7 input fields are required: nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall'
      });
    }

    const inputData = {
      nitrogen: parseFloat(nitrogen),
      phosphorus: parseFloat(phosphorus),
      potassium: parseFloat(potassium),
      temperature: parseFloat(temperature),
      humidity: parseFloat(humidity),
      ph: parseFloat(ph),
      rainfall: parseFloat(rainfall)
    };

    // ── Spawn Python crop prediction model ──
    const mlResult = await runCropPrediction(inputData);

    if (mlResult.error) {
      return res.status(500).json({
        success: false,
        message: 'Crop prediction model failed',
        error: mlResult.error
      });
    }

    // Fetch active model version
    let currentModelVersion = 'v1.0';
    try {
      const activeVersion = await ModelVersion.findOne({ isActive: true });
      if (activeVersion) {
        currentModelVersion = activeVersion.version;
      }
    } catch (versionErr) {
      console.error('[Crop Prediction] Failed to fetch active model version:', versionErr.message);
    }

    // ── Phase-8 Step-1: Generate Explanation ──
    const shapStartTime = performance.now();
    const explanation = await generateExplanation(inputData, mlResult.crop, mlResult.confidence, currentModelVersion);
    const shapEndTime = performance.now();
    
    const endTime = performance.now();
    const totalTimeMs = Math.round(endTime - startTime);
    const shapTimeMs = Math.round(shapEndTime - shapStartTime);

    // ── Save to MongoDB ──
    // Phase-8 Step-2: Build prediction distribution from model output
    // Use top5 if available (extended predict.py), fall back to top3
    const predictionDistribution = mlResult.top5 || mlResult.top3 || [];

    const prediction = new Prediction({
      userId: req.user.id,
      nitrogen: inputData.nitrogen,
      phosphorus: inputData.phosphorus,
      potassium: inputData.potassium,
      temperature: inputData.temperature,
      humidity: inputData.humidity,
      ph: inputData.ph,
      rainfall: inputData.rainfall,
      predictedCrop: mlResult.crop,
      confidence: mlResult.confidence,
      season: mlResult.season,
      tips: mlResult.tips || [],
      top3: mlResult.top3 || [],
      predictionType: 'crop',
      weatherData: weatherData || undefined,
      // Phase-8: Persist explanation and distribution
      explanation: explanation,
      predictionDistribution: predictionDistribution,
      predictionTimeMs: totalTimeMs,
      shapTimeMs: shapTimeMs
    });

    await prediction.save();

    // ── Return response with explanation ──
    res.json({
      success: true,
      message: 'Crop prediction successful',
      data: {
        prediction: {
          id: prediction._id,
          crop: prediction.predictedCrop,
          confidence: prediction.confidence,
          season: prediction.season,
          tips: prediction.tips,
          top3: prediction.top3,
          predictionType: prediction.predictionType,
          weatherData: prediction.weatherData,
          createdAt: prediction.createdAt,
          // Phase-8: Include explanation and distribution in response
          explanation: prediction.explanation,
          predictionDistribution: prediction.predictionDistribution
        }
      }
    });

  } catch (error) {
    console.error('Crop prediction route error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during crop prediction',
      error: error.message
    });
  }
});

module.exports = router;
