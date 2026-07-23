const ModelRegistry = require('../models/ModelRegistry');

/**
 * Phase-6 Step-3: Dynamic Model Serving & Hot Reload
 *
 * In-memory Model Serving Layer.
 * Caches the active model registry metadata to avoid database lookups
 * on every single prediction.
 */

let cachedModel = null;
let loadedAt = null;
let predictionsServed = 0;
let status = 'UNLOADED';

/**
 * Loads the currently ACTIVE model registry metadata into memory.
 */
async function loadActiveModel() {
  try {
    status = 'LOADING';
    const activeModel = await ModelRegistry.findOne({ status: 'ACTIVE' }).lean();
    if (activeModel) {
      cachedModel = activeModel;
      loadedAt = new Date();
      status = 'LOADED';
      console.log(`[Model Service] ✅ Active model version successfully loaded into memory: ${activeModel.version} (${activeModel.architecture})`);
    } else {
      cachedModel = null;
      loadedAt = null;
      status = 'NO_ACTIVE_MODEL';
      console.warn('[Model Service] ⚠️ No active model found in ModelRegistry. Fallback mode enabled.');
    }
  } catch (err) {
    status = 'ERROR';
    console.error('[Model Service] ❌ Failed to load active model from registry:', err.message);
    throw err;
  }
}

/**
 * Reloads the ACTIVE model from the registry manually or automatically after deployment.
 */
async function reloadActiveModel() {
  console.log('[Model Service] Reloading active model in memory...');
  await loadActiveModel();
}

/**
 * Returns the cached active model metadata and increments the predictions served counter.
 */
function getModel() {
  return cachedModel;
}

function incrementPredictionCount() {
  predictionsServed++;
}

/**
 * Returns the current status of the model serving layer.
 */
function getStatus() {
  return {
    version: cachedModel ? cachedModel.version : 'Fallback',
    architecture: cachedModel ? cachedModel.architecture : 'efficientnetb0',
    loadedAt: loadedAt ? loadedAt.toISOString() : null,
    predictionsServed,
    status
  };
}

module.exports = {
  loadActiveModel,
  reloadActiveModel,
  getModel,
  getStatus,
  incrementPredictionCount
};
