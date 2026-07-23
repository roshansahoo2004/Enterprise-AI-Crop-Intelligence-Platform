const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ─── Phase-6 Step-3: Dynamic Model Serving Layer ───
const modelService = require('./modelService');

const PREDICT_SCRIPT = path.join(__dirname, '..', '..', 'deep-learning', 'predict_disease.py');

// ─── Phase-5 Step-4: Base directory for resolving relative model paths ───
const DEEP_LEARNING_DIR = path.join(__dirname, '..', '..', 'deep-learning');

// Default fallback model (backward compatibility)
const DEFAULT_MODEL_PATH = path.join(DEEP_LEARNING_DIR, 'models', 'disease_model.h5');

/**
 * Phase-6 Step-3: Resolves active model path using in-memory modelService cache.
 * Avoids direct database queries on every prediction request.
 *
 * @returns {Promise<string|null>} Absolute model path, or null to use default.
 */
async function resolveActiveModelPath() {
  try {
    const activeModel = modelService.getModel();

    if (!activeModel) {
      console.log('[Prediction] No active model cached in memory — using default model');
      return null;
    }

    if (!activeModel.filePath) {
      console.log(`[Prediction] Active version ${activeModel.version} has no filePath — using default model`);
      return null;
    }

    // Convert relative path (e.g. "models/model_versions/v1.3.h5") to absolute
    const absolutePath = path.join(DEEP_LEARNING_DIR, activeModel.filePath);

    if (!fs.existsSync(absolutePath)) {
      console.warn(`[Prediction] ⚠️ Model file not found in cache path: ${absolutePath} — falling back to default`);
      return null;
    }

    console.log(`[Prediction] Using in-memory cached model: ${activeModel.filePath} (${activeModel.version})`);
    return absolutePath;
  } catch (err) {
    console.error('[Prediction] ❌ Failed to resolve cached active model version:', err.message);
    return null;
  }
}

/**
 * Call the Python ML predict_disease script via child_process.spawn
 *
 * Phase-5 Step-4 & Phase-6 Step-3: Spawns python process with cached model path.
 *
 * @param {string} imagePath - Absolute path to the uploaded image
 * @returns {Promise<Object>} Prediction result
 */
const predictDisease = async (imagePath) => {
  // Phase-6 Step-3: Resolve the cached active model path
  const modelPath = await resolveActiveModelPath();

  return new Promise((resolve, reject) => {
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

    const args = [
      PREDICT_SCRIPT,
      imagePath
    ];

    // Pass model path as optional 2nd argument if resolved
    if (modelPath) {
      args.push(modelPath);
    }

    const python = spawn(pythonCmd, args, {
      timeout: 45000, // 45 second timeout (DL models take longer to load sometimes)
    });

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => {
      console.log("\n========== PYTHON STDOUT ==========");
      console.log(data.toString());
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      console.log("\n========== PYTHON STDERR ==========");
      console.log(data.toString());
      stderr += data.toString();
    });

    python.on('close', (code) => {
      console.log("\n========== PYTHON PROCESS CLOSED ==========");
      console.log("Exit Code:", code);
      console.log("Collected STDOUT:");
      console.log(stdout);
      console.log("Collected STDERR:");
      console.log(stderr);
      if (code !== 0) {
        console.error(`Python disease process exited with code ${code}`);
        console.error(`stderr: ${stderr}`);
        resolve({
          error: `DL model error (exit code ${code}): ${stderr || 'Unknown error'}`
        });
        return;
      }

      try {
        const result = JSON.parse(stdout.trim());
        modelService.incrementPredictionCount();
        resolve(result);
      } catch (parseError) {
        console.error("=========== JSON PARSE ERROR ===========");
        console.error(parseError);
        console.error("STDOUT RAW:");
        console.log(JSON.stringify(stdout));
        console.error("STDERR RAW:");
        console.log(JSON.stringify(stderr));

        resolve({
          error: parseError.message
        });
      }
    });

    python.on('error', (error) => {
      console.error('Failed to spawn Python process:', error);
      resolve({
        error: `Failed to start DL model: ${error.message}. Ensure Python is installed.`
      });
    });
  });
};

module.exports = { predictDisease };
