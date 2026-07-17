/**
 * Phase-5 Step-3: Versioned Model Storage
 *   After each successful training, copies the trained disease_model.h5
 *   into models/model_versions/v{X.Y}.h5 so older versions are preserved.
 *   Stores the filePath in the ModelVersion document.
 *   Copy failures are logged but NEVER fail the training result.
 *
 * Phase-3 Step-1, Step-3, Step-4, Step-5 & Phase-5 Step-1: Retraining Bridge Service
 *
 * A reusable service that spawns the Python training script
 * (deep-learning/train_disease_model.py) as a child process.
 *
 * Features:
 *  - Uses child_process.spawn() (NOT exec()) for streaming output.
 *  - Auto-selects "python" on Windows, "python3" on Linux/macOS.
 *  - Captures stdout, stderr, and exit code.
 *  - Prevents concurrent retraining via an in-memory boolean flag.
 *  - Returns a Promise that resolves/rejects when the process exits.
 *  - Always resets isTraining when the process exits, even on failure.
 *  - GPU support via LD_LIBRARY_PATH setup in WSL
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ─── Phase-3 Step-3: Feedback model for post-training update ───
const Feedback = require('../models/Feedback');

// ─── Phase-3 Step-4: ModelVersion for automatic version increment ───
const ModelVersion = require('../models/ModelVersion');

// ─── Phase-3 Step-5: TrainingHistory for logging every retraining run ───
const TrainingHistory = require('../models/TrainingHistory');

// ─── Phase-6 Step-1: ModelRegistry for production model tracking ───
const ModelRegistry = require('../models/ModelRegistry');

// ─── In-memory concurrency guard ───
let isTraining = false;

// ─── Path to the Python training script ───
const TRAIN_SCRIPT_PATH = path.join(
  __dirname, '..', '..', 'deep-learning', 'train_disease_model.py'
);

// ─── Working directory for the training process ───
const TRAIN_CWD = path.join(__dirname, '..', '..', 'deep-learning');

// ─── Phase-5 Step-1: Path to metrics.json written by the training script ───
const METRICS_JSON_PATH = path.join(
  __dirname, '..', '..', 'deep-learning', 'models', 'metrics.json'
);

// ─── Phase-5 Step-3: Versioned Model Storage paths ───
const TRAINED_MODEL_PATH = path.join(
  __dirname, '..', '..', 'deep-learning', 'models', 'disease_model.h5'
);
const MODEL_VERSIONS_DIR = path.join(
  __dirname, '..', '..', 'deep-learning', 'models', 'model_versions'
);

// ─── Phase-6 Step-1: Path to disease_classes.json for architecture detection ───
const DISEASE_CLASSES_PATH = path.join(
  __dirname, '..', '..', 'deep-learning', 'models', 'disease_classes.json'
);

// ─── Auto-select Python command based on OS ───
const USE_WSL = true;

const PYTHON_CMD =
  process.platform === "win32" && USE_WSL
    ? "wsl"
    : process.platform === "win32"
      ? "python"
      : "python3";

const MODEL_ARCHITECTURE = "efficientnetb0";

/**
 * Converts Windows path to WSL path
 * e.g. D:\ML-Full Stack Project → /mnt/d/ML-Full Stack Project
 */
function toWSLPath(winPath) {
  return winPath
    .replace(/\\/g, '/')
    .replace(/^([A-Za-z]):/, (_, drive) => `/mnt/${drive.toLowerCase()}`);
}

/**
 * Check whether a retraining job is currently in progress.
 */
function getIsTraining() {
  return isTraining;
}

/**
 * Starts the retraining process by spawning the Python training script.
 * GPU is enabled via LD_LIBRARY_PATH setup for WSL.
 */
function startRetraining() {
  return new Promise((resolve, reject) => {
    // ── Safety: prevent concurrent runs ──
    if (isTraining) {
      return reject(new Error('Retraining already in progress.'));
    }

    isTraining = true;

    // Convert Windows path to WSL path
    const TRAIN_CWD_WSL = toWSLPath(TRAIN_CWD);

    console.log('[RetrainBridge] 🚀 Starting retraining with GPU support...');
    console.log(`[RetrainBridge] Python command: ${PYTHON_CMD}`);
    console.log(`[RetrainBridge] WSL directory: ${TRAIN_CWD_WSL}`);

    const startedAt = new Date();

    // ── KEY FIX: GPU setup command ──
    // Sets LD_LIBRARY_PATH so TensorFlow can find CUDA libraries
    // Activates the tf-gpu virtual environment
    // Then runs the training script
    const GPU_SETUP_CMD = `
      export LD_LIBRARY_PATH=$(find ~/tf-gpu/lib/python3.12/site-packages/nvidia -type d -name lib 2>/dev/null | tr '\\n' ':')$LD_LIBRARY_PATH &&
      source ~/tf-gpu/bin/activate &&
      cd "${TRAIN_CWD_WSL}" &&
      python3 train_disease_model.py --model ${MODEL_ARCHITECTURE} --epochs 25 --fine_tune
    `;

    const args =
      PYTHON_CMD === "wsl"
        ? ["bash", "-lc", GPU_SETUP_CMD]
        : [
          TRAIN_SCRIPT_PATH,
          "--model",
          MODEL_ARCHITECTURE,
          "--epochs",
          "25",
          "--fine_tune"
        ];

    const child = spawn(PYTHON_CMD, args, {
      env: { ...process.env }
    });

    let stdoutLogs = '';
    let stderrLogs = '';
    let newVersionString = null;

    child.stdout.on('data', (data) => {
      const text = data.toString();
      stdoutLogs += text;

      if (stdoutLogs.length > 200000)
        stdoutLogs = stdoutLogs.slice(-200000);
      process.stdout.write(`[RetrainBridge:stdout] ${text}`);
    });

    child.stderr.on('data', (data) => {
      const text = data.toString();
      stderrLogs += text;

      if (stderrLogs.length > 50000)
        stderrLogs = stderrLogs.slice(-50000);
      process.stderr.write(`[RetrainBridge:stderr] ${text}`);
    });

    child.on('close', (exitCode) => {
      isTraining = false;

      const combinedLogs = stdoutLogs + (stderrLogs ? '\n--- STDERR ---\n' + stderrLogs : '');

      // Check if GPU was actually used
      if (combinedLogs.includes('GeForce') || combinedLogs.includes('GPU:0')) {
        console.log('[RetrainBridge] ✅ GPU detected and used for training!');
      } else {
        console.warn('[RetrainBridge] ⚠️ GPU may not have been used - check CUDA setup');
      }

      if (exitCode === 0) {
        console.log('[RetrainBridge] ✅ Retraining completed successfully.');

        (async () => {
          // ── Phase-3 Step-3: Mark feedback as retrained ──
          let feedbackCount = 0;
          try {
            const result = await Feedback.updateMany(
              { verified: true, retrained: false },
              { $set: { retrained: true } }
            );
            feedbackCount = result.modifiedCount || 0;
            console.log(`[Retrain] Updated ${feedbackCount} feedback documents.`);
          } catch (err) {
            console.error('[Retrain] ❌ Failed to mark feedback as retrained:', err.message);
          }

          // ── Phase-5 Step-1: Read metrics.json ──
          let trainingMetrics = null;
          try {
            if (fs.existsSync(METRICS_JSON_PATH)) {
              const raw = fs.readFileSync(METRICS_JSON_PATH, 'utf-8');
              trainingMetrics = JSON.parse(raw);
              console.log('[Metrics] ✅ Read metrics.json:', JSON.stringify(trainingMetrics));
              fs.unlinkSync(METRICS_JSON_PATH);
            } else {
              console.log('[Metrics] ⚠️ metrics.json not found');
            }
          } catch (metricsErr) {
            console.error('[Metrics] ❌ Failed to read metrics.json:', metricsErr.message);
          }

          // ── Phase-3 Step-4: Model Version Increment ──
          let versionedFilePath = null;
          let trainingHistoryId = null;
          try {
            let currentVersion = await ModelVersion.findOne({ isActive: true });

            if (!currentVersion) {
              newVersionString = 'v1.0';
            } else {
              const versionParts = currentVersion.version.replace('v', '').split('.');
              const major = parseInt(versionParts[0], 10);
              const minor = parseInt(versionParts[1], 10);
              newVersionString = `v${major}.${minor + 1}`;
              currentVersion.isActive = false;
              await currentVersion.save();
            }

            // ── Phase-5 Step-3: Copy versioned model ──
            try {
              if (!fs.existsSync(MODEL_VERSIONS_DIR)) {
                fs.mkdirSync(MODEL_VERSIONS_DIR, { recursive: true });
              }
              const versionedFileName = `${newVersionString}.h5`;
              const versionedFullPath = path.join(MODEL_VERSIONS_DIR, versionedFileName);
              if (fs.existsSync(TRAINED_MODEL_PATH)) {
                fs.copyFileSync(TRAINED_MODEL_PATH, versionedFullPath);
                versionedFilePath = `models/model_versions/${versionedFileName}`;
                console.log(`[Model Storage] ✅ Saved versioned model: ${versionedFilePath}`);
              }
            } catch (copyErr) {
              console.error('[Model Storage] ❌ Failed to copy versioned model:', copyErr.message);
            }

            await ModelVersion.create({
              version: newVersionString,
              isActive: true,
              accuracy: trainingMetrics?.accuracy ?? null,
              loss: trainingMetrics?.loss ?? null,
              precision: trainingMetrics?.precision ?? null,
              recall: trainingMetrics?.recall ?? null,
              f1Score: trainingMetrics?.f1Score ?? null,
              epochs: trainingMetrics?.epochs ?? null,
              trainingImages: trainingMetrics?.trainingImages ?? null,
              validationImages: trainingMetrics?.validationImages ?? null,
              feedbackUsed: feedbackCount,
              trainedAt: new Date(),
              filePath: versionedFilePath
            });

            console.log(`[Model Version] New: ${newVersionString} activated`);
          } catch (versionErr) {
            console.error('[Model Version] ❌ Failed to update version:', versionErr.message);
          }

          // ── Phase-3 Step-5: Save training history ──
          const completedAt = new Date();
          const durationSeconds = Math.round((completedAt - startedAt) / 1000);

          try {
            const savedHistory = await TrainingHistory.create({
              modelVersion: newVersionString || null,
              status: 'SUCCESS',
              feedbackUsed: feedbackCount,
              accuracy: trainingMetrics?.accuracy ?? null,
              loss: trainingMetrics?.loss ?? null,
              epochs: trainingMetrics?.epochs ?? null,
              metrics: {
                accuracy: trainingMetrics?.accuracy ?? null,
                loss: trainingMetrics?.loss ?? null,
                precision: trainingMetrics?.precision ?? null,
                recall: trainingMetrics?.recall ?? null,
                f1Score: trainingMetrics?.f1Score ?? null
              },
              trainingImages: trainingMetrics?.trainingImages ?? null,
              validationImages: trainingMetrics?.validationImages ?? null,
              durationSeconds: durationSeconds,
              logs: `
Exit Code : ${exitCode}
GPU Used  : ${combinedLogs.includes("GPU")}

Accuracy : ${trainingMetrics?.accuracy}
Loss     : ${trainingMetrics?.loss}
Epochs   : ${trainingMetrics?.epochs}
`,
              exitCode: exitCode,
              startedAt: startedAt,
              completedAt: completedAt
            });
            console.log('[Training History] Saved successfully');

            // Store the TrainingHistory _id for the registry entry below
            trainingHistoryId = savedHistory._id;
          } catch (historyErr) {
            console.error('[Training History] Failed to save:', historyErr.message);
          }

          // ── Phase-6 Step-1: Create Model Registry Entry ──
          // Archives the previous ACTIVE entry and creates a new one.
          // Failures are logged but NEVER fail the training result.
          try {
            // Detect architecture from disease_classes.json
            const architecture = MODEL_ARCHITECTURE;

            // Detect GPU usage from training logs
            const gpuUsed = combinedLogs.includes('GPU') || combinedLogs.includes('CUDA');

            // Get model file size in MB
            let modelSizeMB = null;
            try {
              if (fs.existsSync(TRAINED_MODEL_PATH)) {
                const stats = fs.statSync(TRAINED_MODEL_PATH);
                modelSizeMB = parseFloat((stats.size / (1024 * 1024)).toFixed(2));
              }
            } catch (sizeErr) {
              console.warn('[Model Registry] Could not read model file size:', sizeErr.message);
            }

            // Archive any currently ACTIVE registry entries
            await ModelRegistry.updateMany(
              { status: 'ACTIVE' },
              { $set: { status: 'ARCHIVED' } }
            );

            // Create the new registry entry as ACTIVE
            await ModelRegistry.create({
              version: newVersionString,
              architecture: architecture,
              accuracy: trainingMetrics?.accuracy ?? null,
              precision: trainingMetrics?.precision ?? null,
              recall: trainingMetrics?.recall ?? null,
              f1Score: trainingMetrics?.f1Score ?? null,
              loss: trainingMetrics?.loss ?? null,
              epochs: trainingMetrics?.epochs ?? null,
              trainingImages: trainingMetrics?.trainingImages ?? null,
              validationImages: trainingMetrics?.validationImages ?? null,
              gpuUsed: gpuUsed,
              trainingDuration: durationSeconds,
              modelSizeMB: modelSizeMB,
              status: 'ACTIVE',
              filePath: versionedFilePath,
              trainedAt: completedAt,
              trainingHistory: trainingHistoryId || null
            });

            console.log(`[Model Registry] ✅ Registered ${newVersionString} (${architecture}, ${modelSizeMB || '?'}MB)`);
          } catch (registryErr) {
            // Do NOT fail retraining — training was successful.
            console.error('[Model Registry] ❌ Failed to create registry entry:', registryErr.message);
          }

          resolve({ exitCode, metrics: trainingMetrics, version: newVersionString });
        })();
      } else {
        console.error(`[RetrainBridge] ❌ Retraining failed with exit code ${exitCode}.`);

        const completedAt = new Date();
        const durationSeconds = Math.round((completedAt - startedAt) / 1000);

        (async () => {
          try {
            await TrainingHistory.create({
              modelVersion: null,
              status: 'FAILED',
              feedbackUsed: 0,
              accuracy: null,
              loss: null,
              epochs: null,
              durationSeconds: durationSeconds,
              logs: `
Exit Code : ${exitCode}

Training Failed

See server console for complete logs.
`,
              exitCode: exitCode,
              startedAt: startedAt,
              completedAt: completedAt
            });
            console.log('[Training History] Saved successfully');
          } catch (historyErr) {
            console.error('[Training History] Failed to save:', historyErr.message);
          }
        })();

        const error = new Error(`Retraining process exited with code ${exitCode}`);
        error.logs = combinedLogs.slice(-10000);
        error.exitCode = exitCode;
        reject(error);
      }
    });

    child.on('error', (err) => {
      isTraining = false;
      console.error('[RetrainBridge] ❌ Failed to spawn training process:', err.message);
      const error = new Error(`Failed to start retraining: ${err.message}`);
      error.logs = '';
      error.exitCode = -1;
      reject(error);
    });
  });
}

module.exports = {
  startRetraining,
  getIsTraining
};