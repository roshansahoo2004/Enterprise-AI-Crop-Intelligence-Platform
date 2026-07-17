const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const auth = require('../middleware/auth');
const Feedback = require('../models/Feedback');

const router = express.Router();

/**
 * GET /api/feedback/classes
 * Fetch all available disease classes from disease_classes.json
 */
router.get('/classes', auth, async (req, res) => {
  try {
    const filePath = path.join(__dirname, '..', '..', 'deep-learning', 'models', 'disease_classes.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);

    if (!data.classes) {
      return res.status(500).json({
        success: false,
        message: 'Disease classes format is invalid'
      });
    }

    // Map and clean up raw class names to be human readable (replace underscores with spaces)
    const classes = Object.values(data.classes).map(className => {
      return className
        .replace(/_+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    });

    // Remove duplicates and sort alphabetically
    const uniqueSortedClasses = [...new Set(classes)].sort();

    res.json({
      success: true,
      data: uniqueSortedClasses
    });
  } catch (error) {
    console.error('Fetch classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving disease classes'
    });
  }
});

/**
 * POST /api/feedback
 * Submit prediction feedback for active learning
 */
router.post('/', auth, async (req, res) => {
  try {
    const { imageUrl, predictedDisease, actualDisease, confidence, correct } = req.body;

    // Basic validation
    if (!imageUrl || !predictedDisease || !actualDisease || confidence === undefined || correct === undefined) {
      return res.status(400).json({
        success: false,
        message: 'All fields (imageUrl, predictedDisease, actualDisease, confidence, correct) are required'
      });
    }

    // Check duplicate submission
    const existingFeedback = await Feedback.findOne({
      userId: req.user.id,
      imageUrl: imageUrl,
      predictedDisease: predictedDisease
    });

    if (existingFeedback) {
      return res.status(409).json({
        success: false,
        message: 'Feedback has already been submitted for this prediction'
      });
    }

    let feedbackImage = null;
    const filename = path.basename(imageUrl);
    const sourcePath = path.join(__dirname, '..', 'uploads', filename);

    // Archive image logic for Active Learning feedback
    try {
      // Check if temporary uploaded image exists on disk
      await fs.access(sourcePath);

      // Define target directory and create it automatically if it does not exist
      const targetDir = path.join(__dirname, '..', 'feedback-images');
      await fs.mkdir(targetDir, { recursive: true });

      // Generate a unique filename using timestamp + random suffix
      const ext = path.extname(filename);
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const uniqueFilename = `feedback-${uniqueSuffix}${ext}`;
      const destPath = path.join(targetDir, uniqueFilename);

      // Copy (do not move) the uploaded image from uploads/ into feedback-images/
      await fs.copyFile(sourcePath, destPath);

      // Save the relative web path
      feedbackImage = `/feedback-images/${uniqueFilename}`;
    } catch (fsErr) {
      console.error(`Feedback archive image copy failed from ${sourcePath}. Error:`, fsErr);
      return res.status(400).json({
        success: false,
        message: `Prediction image file could not be found or processed: ${fsErr.message}`
      });
    }

    // Save new feedback
    const feedback = new Feedback({
      userId: req.user.id,
      imageUrl,
      predictedDisease,
      actualDisease,
      confidence,
      correct,
      feedbackImage,
      modelVersion: "v1.0",
      verified: false,
      retrained: false
    });

    await feedback.save();

    res.status(201).json({
      success: true,
      message: 'Feedback saved successfully',
      data: feedback
    });

  } catch (error) {
    console.error('Save feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while saving feedback'
    });
  }
});

module.exports = router;
