const express = require('express');
const auth = require('../middleware/auth');
const Feedback = require('../models/Feedback');

// ─── Phase-4 Step-1: Real RBAC middleware (replaces placeholder) ───
// Fetches user from MongoDB and verifies role === "admin".
const adminOnly = require('../middleware/adminOnly');

// ─── Phase-4 Step-3: Import models for Admin Dashboard ───
const ModelVersion = require('../models/ModelVersion');
const TrainingHistory = require('../models/TrainingHistory');

// ─── Phase-2 Step-5: Automatic Dataset Builder ───
// fs.promises for async file operations; path for cross-platform path resolution.
const fs = require('fs').promises;
const path = require('path');

// ─── Phase-3 Step-1: Retraining Bridge ───
// Service that spawns the Python training script and manages concurrency.
const { startRetraining, getIsTraining } = require('../services/retrainBridge');


const router = express.Router();

// ─── Phase-2 Step-5: Dataset Builder Paths ───
// Source: where feedback images are archived after user submission.
const FEEDBACK_IMAGES_DIR = path.join(__dirname, '..', 'feedback-images');
// Destination: the retraining dataset consumed by the TensorFlow model.
const DATASET_DIR = path.join(__dirname, '..', '..', 'deep-learning', 'dataset');

// ─── Phase-3 Step-2: Automatic Retraining Threshold ───
// Minimum number of admin-approved (verified=true, retrained=false) feedbacks
// required before automatic retraining is triggered.
// Change this value to adjust how often the model retrains.
const RETRAIN_THRESHOLD = 20;

/**
 * Phase-2 Step-5: PlantVillage Naming Convention Converter
 *
 * Converts a human-readable actualDisease string into the folder naming
 * convention used by the existing PlantVillage training dataset.
 *
 * Rules:
 *  - First word (crop name) remains unchanged.
 *  - Triple underscore (___) separates crop from disease.
 *  - Spaces within the disease portion become single underscores.
 *  - Capitalization is preserved exactly as present in the input.
 *
 * Examples:
 *  "Apple Black Rot"     → "Apple___Black_Rot"
 *  "Potato Early blight" → "Potato___Early_blight"
 *  "Tomato Leaf Mold"    → "Tomato___Leaf_Mold"
 *
 * @param {string} actualDisease - The human-readable disease name.
 * @returns {string} The PlantVillage-convention folder name.
 */
function toPlantVillageName(actualDisease) {
  // Split into words; first word is always the crop name
  const words = actualDisease.trim().split(/\s+/);
  const cropName = words[0];
  // Remaining words form the disease name, joined by single underscores
  const diseasePart = words.slice(1).join('_');
  // Combine with triple-underscore separator
  return cropName + '___' + diseasePart;
}

/**
 * Phase-2 Step-5: Automatic Dataset Builder
 *
 * After a feedback is successfully approved, this function copies the
 * archived feedback image into the retraining dataset under a folder
 * matching the PlantVillage naming convention.
 *
 * Design decisions:
 *  - Uses copyFile (never move) so the feedback-images archive stays intact.
 *  - Generates a unique filename via Date.now() prefix to avoid collisions.
 *  - Creates disease folders on-the-fly with { recursive: true }.
 *  - Converts actualDisease to PlantVillage convention via toPlantVillageName()
 *    so images land in existing dataset folders, not duplicates.
 *  - NEVER rolls back the approval or returns an error on copy failure;
 *    failures are logged and silently swallowed so the approval response
 *    remains unchanged, preserving complete backward compatibility.
 *
 * @param {Object} feedback - The approved Mongoose feedback document.
 */
async function buildDatasetEntry(feedback) {
  try {
    // ── Guard: skip if no feedback image was archived ──
    if (!feedback.feedbackImage) {
      console.log('[Dataset Builder] No feedbackImage on this feedback, skipping dataset copy.');
      return;
    }

    // ── Guard: skip if no actual disease label exists ──
    if (!feedback.actualDisease) {
      console.log('[Dataset Builder] No actualDisease label on this feedback, skipping dataset copy.');
      return;
    }

    // ── Resolve the source image path ──
    // feedback.feedbackImage stores just the filename, e.g. "feedback-172839.jpg"
    const sourceImagePath = path.join(FEEDBACK_IMAGES_DIR, feedback.feedbackImage);

    // ── Convert actualDisease to PlantVillage naming convention ──
    // e.g. "Apple Black Rot" → "Apple___Black_Rot" to match existing dataset folders
    const plantVillageFolderName = toPlantVillageName(feedback.actualDisease);
    const diseaseFolderPath = path.join(DATASET_DIR, plantVillageFolderName);

    // ── Create the disease folder if it does not exist ──
    await fs.mkdir(diseaseFolderPath, { recursive: true });

    // ── Generate a unique filename to avoid collisions ──
    // Format: <timestamp>-<original filename>  e.g. "1728392837400-feedback-172839.jpg"
    const originalFilename = path.basename(feedback.feedbackImage);
    const uniqueFilename = Date.now() + '-' + originalFilename;

    // ── Resolve the full destination path ──
    const destinationPath = path.join(diseaseFolderPath, uniqueFilename);

    // ── Copy the image (never move) into the dataset ──
    await fs.copyFile(sourceImagePath, destinationPath);

    console.log(`[Dataset Builder] ✅ Copied "${originalFilename}" → "${feedback.actualDisease}/${uniqueFilename}"`);
  } catch (error) {
    // ── On failure: log and continue — NEVER rollback the approval ──
    console.error('[Dataset Builder] ❌ Failed to copy feedback image to dataset:', error.message);
  }
}

/**
 * GET /api/admin/feedback/pending
 * Retrieve all pending feedbacks (verified = false) sorted by newest first.
 * Populates user details (userId).
 */
router.get('/feedback/pending', auth, adminOnly, async (req, res) => {
  try {
    const pendingFeedback = await Feedback.find({ verified: false })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: pendingFeedback
    });
  } catch (error) {
    console.error('Fetch pending feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving pending feedback'
    });
  }
});

/**
 * PATCH /api/admin/feedback/:id/approve
 * Approves a feedback submission. Sets verified=true, updates verification metadata.
 *
 * Phase-2 Step-5 Extension:
 * After successful approval, automatically copies the feedback image into
 * the retraining dataset (deep-learning/dataset/<actualDisease>/).
 * Dataset copy failures are logged but never affect the approval response.
 *
 * Phase-3 Step-2 Extension:
 * After dataset building, counts approved-but-unretrained feedback.
 * If count >= RETRAIN_THRESHOLD and no training is running,
 * automatically starts retraining in the background (fire-and-forget).
 * The admin response is returned immediately without waiting.
 */
router.patch('/feedback/:id/approve', auth, adminOnly, async (req, res) => {
  try {
    const feedbackId = req.params.id;

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    if (feedback.verified) {
      return res.status(400).json({
        success: false,
        message: 'Feedback is already verified'
      });
    }

    // ── Existing approval logic (unchanged) ──
    feedback.verified = true;
    feedback.verifiedAt = new Date();
    feedback.verifiedBy = req.user.id;

    await feedback.save();

    // ── Phase-2 Step-5: Automatic Dataset Builder ──
    // After successful approval, copy the feedback image to the retraining dataset.
    // This runs asynchronously but is awaited so the log output appears before response.
    // Any failure inside buildDatasetEntry is caught internally and will NOT affect
    // the approval response below.
    await buildDatasetEntry(feedback);

    // ── Phase-3 Step-2: Automatic Retraining Queue ──
    // Count how many feedbacks are approved but not yet used for retraining.
    // If the threshold is reached and no training is running, fire retraining
    // in the background. The admin response is returned immediately.
    try {
      const pendingCount = await Feedback.countDocuments({
        verified: true,
        retrained: false
      });

      console.log(`[Auto Retrain] Pending approved feedback: ${pendingCount}/${RETRAIN_THRESHOLD}`);

      if (pendingCount >= RETRAIN_THRESHOLD) {
        // Check if retraining is already running (reuse existing lock)
        if (getIsTraining()) {
          console.log('[Auto Retrain] Threshold reached but retraining is already in progress. Skipping.');
        } else {
          console.log('[Auto Retrain] ✅ Threshold reached. Starting automatic retraining...');

          // Fire-and-forget: start retraining in the background.
          // Do NOT await — the admin should not wait for training to finish.
          startRetraining()
            .then((result) => {
              console.log(`[Auto Retrain] ✅ Retraining completed. Exit code: ${result.exitCode}`);
            })
            .catch((error) => {
              console.error('[Auto Retrain] ❌ Retraining failed:', error.message);
            });
        }
      }
    } catch (queueError) {
      // If the queue check itself fails, log and continue — never affect approval.
      console.error('[Auto Retrain] ❌ Failed to check retraining queue:', queueError.message);
    }

    // ── Return the same response as before — backward compatible ──
    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error('Approve feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error approving feedback'
    });
  }
});

/**
 * PATCH /api/admin/feedback/:id/reject
 * Rejects a feedback by deleting it completely from the database.
 */
router.patch('/feedback/:id/reject', auth, adminOnly, async (req, res) => {
  try {
    const feedbackId = req.params.id;

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Completely delete rejected feedback from MongoDB
    await Feedback.findByIdAndDelete(feedbackId);

    res.json({
      success: true,
      message: 'Feedback rejected and deleted successfully'
    });
  } catch (error) {
    console.error('Reject feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error rejecting feedback'
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
//  Phase-3 Step-1: Automatic Retraining Endpoint
// ══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/admin/retrain
 *
 * Triggers retraining of the disease detection model by spawning
 * the Python training script (deep-learning/train_disease_model.py).
 *
 * Concurrency:
 *  - Only one retraining job can run at a time.
 *  - Returns 409 Conflict if a job is already in progress.
 *
 * On success: returns { success: true, message, data: { logs, exitCode } }
 * On failure: returns { success: false, message, error }
 */
router.post('/retrain', auth, adminOnly, async (req, res) => {
  // ── Concurrency guard: reject if already training ──
  if (getIsTraining()) {
    return res.status(409).json({
      success: false,
      message: 'Retraining already in progress.'
    });
  }

  try {
    console.log(`[Admin] Retraining triggered by user: ${req.user.id}`);

    // ── Start retraining and wait for completion ──
    const result = await startRetraining();

    // ── Return success response ──
    res.json({
      success: true,
      message: 'Retraining completed.',
      data: {
        logs: result.logs,
        exitCode: result.exitCode
      }
    });
  } catch (error) {
    console.error('[Admin] Retraining failed:', error.message);

    // ── Return failure response ──
    // The retrainBridge attaches logs and exitCode to the error object.
    res.status(500).json({
      success: false,
      message: 'Retraining failed.',
      error: error.logs || error.message
    });
  }
});

/**
 * GET /api/admin/training/:id/logs
 *
 * Returns complete logs for a specific training run.
 */
router.get('/training/:id/logs', auth, adminOnly, async (req, res) => {
  try {
    const trainingId = req.params.id;

    // Find the requested training run
    const trainingRun = await TrainingHistory.findById(trainingId);

    if (!trainingRun) {
      return res.status(404).json({
        success: false,
        message: 'Training run not found'
      });
    }

    // Return only the data needed for the log viewer
    res.json({
      success: true,
      data: {
        id: trainingRun._id,
        modelVersion: trainingRun.modelVersion,
        status: trainingRun.status,
        startedAt: trainingRun.startedAt,
        completedAt: trainingRun.completedAt,
        durationSeconds: trainingRun.durationSeconds,
        exitCode: trainingRun.exitCode,
        logs: trainingRun.logs
      }
    });

  } catch (error) {
    console.error('Fetch training logs error:', error);

    res.status(500).json({
      success: false,
      message: 'Server error retrieving training logs'
    });
  }
});

/**
 * GET /api/admin/dashboard
 *
 * Compiles real-time MLOps statistics for the Admin Dashboard, including
 * feedback counts, model versions, retraining pipeline status, and logs.
 */
router.get('/dashboard', auth, adminOnly, async (req, res) => {
  try {
    const [
      pendingFeedback,
      verifiedFeedback,
      feedbackWaitingRetrain,
      failedRuns,
      successfulRuns,
      totalTrainingRuns,
      totalFeedback,
      activeVersionDoc,
      trainingRuns,
      recentFeedback
    ] = await Promise.all([
      Feedback.countDocuments({ verified: false }),

      Feedback.countDocuments({ verified: true }),

      Feedback.countDocuments({
        verified: true,
        retrained: false
      }),

      TrainingHistory.countDocuments({
        status: 'FAILED'
      }),

      TrainingHistory.countDocuments({
        status: 'SUCCESS'
      }),

      TrainingHistory.countDocuments(),

      Feedback.countDocuments(),

      ModelVersion.findOne({
        isActive: true
      }).lean(),

      TrainingHistory.find()
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),

      Feedback.find()
        .populate('userId', 'name email')
        .sort({
          createdAt: -1
        })
        .limit(10)
        .select(
          'predictedDisease actualDisease confidence correct verified feedbackImage createdAt userId'
        )
        .lean(),
    ]);

    // Also include a slice of latest 10 training history runs for visual display
    const lastRun = trainingRuns[0] || null;

    const currentModelVersion =
      activeVersionDoc?.version || 'v1.0';

    const training = {
      status:
        getIsTraining()
          ? 'TRAINING'
          : 'IDLE',

      lastTraining:
        lastRun?.completedAt || null,

      totalRuns:
        totalTrainingRuns,

      successfulRuns,

      failedRuns
    };

    // Also include latest 10 training runs
    const trainingHistoryList = trainingRuns.slice(0, 10);

    res.json({
      success: true,
      data: {
        pendingFeedback,
        verifiedFeedback,
        feedbackWaitingRetrain,
        failedRuns,
        totalFeedback,

        latestTrainingDuration:
          lastRun?.durationSeconds ?? null,

        latestModelAccuracy:
          activeVersionDoc?.accuracy ?? null,

        // ── Phase-5 Step-1: Full model metrics from active version ──
        latestModelMetrics: activeVersionDoc
          ? {
              accuracy: activeVersionDoc.accuracy ?? null,
              loss: activeVersionDoc.loss ?? null,
              precision: activeVersionDoc.precision ?? null,
              recall: activeVersionDoc.recall ?? null,
              f1Score: activeVersionDoc.f1Score ?? null,
              epochs: activeVersionDoc.epochs ?? null,
              trainingImages: activeVersionDoc.trainingImages ?? null,
              validationImages: activeVersionDoc.validationImages ?? null
            }
          : null,

        currentModelVersion,
        training,
        latestTraining:
          lastRun
            ?
            {
              _id: lastRun._id,
              modelVersion: lastRun.modelVersion,
              status: lastRun.status,
              feedbackUsed: lastRun.feedbackUsed,
              durationSeconds: lastRun.durationSeconds,
              exitCode: lastRun.exitCode,
              startedAt: lastRun.startedAt,
              completedAt: lastRun.completedAt,
              createdAt: lastRun.createdAt,
              logsPreview: lastRun.logs
                ? lastRun.logs.substring(0, 300)
                : ''
            }
            : null,
        recentFeedback,
        trainingHistoryList
      }
    });
  } catch (error) {
    console.error('Fetch admin dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving dashboard statistics'
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
//  Phase-5 Step-2: Model Comparison Endpoint
// ══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/model-comparison
 *
 * Returns every model version sorted newest-first for the comparison dashboard.
 * Each document includes training metrics (accuracy, loss, precision, recall,
 * f1Score, epochs, trainingImages, validationImages) and deployment status.
 */
router.get('/model-comparison', auth, adminOnly, async (req, res) => {
  try {
    const modelVersions = await ModelVersion.find()
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: modelVersions.map((mv) => ({
        _id: mv._id,
        version: mv.version,
        accuracy: mv.accuracy ?? null,
        loss: mv.loss ?? null,
        precision: mv.precision ?? null,
        recall: mv.recall ?? null,
        f1Score: mv.f1Score ?? null,
        epochs: mv.epochs ?? null,
        trainingImages: mv.trainingImages ?? null,
        validationImages: mv.validationImages ?? null,
        createdAt: mv.createdAt,
        isActive: mv.isActive
      }))
    });
  } catch (error) {
    console.error('Fetch model comparison error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving model comparison data'
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
//  Phase-5 Step-5: One-Click Model Rollback / Activation
// ══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/admin/model-version/:id/activate
 *
 * Activates a specific model version by its MongoDB _id.
 * Deactivates all other versions so only one is active at a time.
 * After activation, prediction automatically uses this model via
 * the dynamic model loading pipeline (Phase-5 Step-4).
 *
 * Idempotent: if the model is already active, returns 200 with a message.
 *
 * @param {string} req.params.id - MongoDB ObjectId of the ModelVersion to activate.
 */
router.post('/model-version/:id/activate', auth, adminOnly, async (req, res) => {
  try {
    const modelId = req.params.id;

    // ── 1. Find the requested model version ──
    const selectedModel = await ModelVersion.findById(modelId);

    if (!selectedModel) {
      return res.status(404).json({
        success: false,
        message: 'Model version not found.'
      });
    }

    // ── 2. If already active, return early (idempotent) ──
    if (selectedModel.isActive) {
      return res.json({
        success: true,
        message: 'Model already active.',
        data: {
          version: selectedModel.version,
          filePath: selectedModel.filePath || null,
          isActive: selectedModel.isActive
        }
      });
    }

    // ── 3. Deactivate every model version ──
    await ModelVersion.updateMany({}, { isActive: false });

    // ── 4. Activate the selected model ──
    selectedModel.isActive = true;
    await selectedModel.save();

    console.log(`[Rollback] Activated model ${selectedModel.version}`);

    // ── 5. Return success response ──
    res.json({
      success: true,
      message: 'Model activated successfully.',
      data: {
        version: selectedModel.version,
        filePath: selectedModel.filePath || null,
        isActive: selectedModel.isActive
      }
    });
  } catch (error) {
    console.error('[Rollback] Failed to activate model:', error);
    res.status(500).json({
      success: false,
      message: 'Server error activating model version.'
    });
  }
});

module.exports = router;
