const express = require('express');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const DiseaseReport = require('../models/DiseaseReport');
const { predictDisease } = require('../services/diseaseBridge');

// ─── Phase-3 Step-4: Dynamic model version for prediction responses ───
const ModelVersion = require('../models/ModelVersion');

const router = express.Router();

// Multer config for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Images only (jpeg, jpg, png)!'));
        }
    }
});

/**
 * POST /api/disease/detect
 * Upload image and predict disease
 */
router.post('/detect', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    const imagePath = req.file.path;
    const imageUrl = `/uploads/${req.file.filename}`;

    // Call Python DL script
    const dlResult = await predictDisease(imagePath);

    if (dlResult.error) {
      return res.status(500).json({
        success: false,
        message: 'Disease detection failed',
        error: dlResult.error
      });
    }

    // Save to DB
    const report = new DiseaseReport({
      userId: req.user.id,
      imageUrl: imageUrl,
      disease: dlResult.disease,
      confidence: dlResult.confidence,
      severity: dlResult.severity,
      treatment: dlResult.treatment
    });

    await report.save();

    // ── Phase-3 Step-4: Fetch the latest active model version ──
    // Falls back to "v1.0" if no version document exists yet (first run).
    let currentModelVersion = 'v1.0';
    try {
      const activeVersion = await ModelVersion.findOne({ isActive: true });
      if (activeVersion) {
        currentModelVersion = activeVersion.version;
      }
    } catch (versionErr) {
      console.error('[Disease] Failed to fetch model version:', versionErr.message);
    }

    res.json({
      success: true,
      message: 'Analysis complete',
      data: {
        ...report.toObject(),
        modelVersion: currentModelVersion
      }
    });
  } catch (error) {
    console.error('Disease detection error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during analysis'
    });
  }
});

/**
 * GET /api/disease/history
 * Fetch previous disease reports
 */
router.get('/history', auth, async (req, res) => {
    try {
        const reports = await DiseaseReport.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50);
            
        res.json({
            success: true,
            data: reports
        });
    } catch (error) {
        console.error('Disease history error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching disease history'
        });
    }
});

module.exports = router;
