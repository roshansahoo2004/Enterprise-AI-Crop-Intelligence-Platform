const ModelRegistry = require('../models/ModelRegistry');
const ModelVersion = require('../models/ModelVersion');
const modelService = require('../services/modelService');

/**
 * Phase-6 Step-1 & Step-2 & Step-3: Model Registry Controller
 *
 * Handles API logic for listing, viewing, and deploying model registry entries.
 * All endpoints require admin authentication.
 */

/**
 * GET /api/admin/model-registry
 *
 * Returns paginated list of model registry entries (newest first).
 *
 * Query params:
 *   page          - Page number (default: 1)
 *   limit         - Items per page (default: 20, max: 100)
 *   search        - Filter by version (partial match, case-insensitive)
 *   status        - Filter by status (ACTIVE, ARCHIVED, CANDIDATE)
 *   architecture  - Filter by architecture (e.g. efficientnetb0, resnet50)
 */
const getRegistryList = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    // Build filter query
    const filter = {};

    // Search by version (partial, case-insensitive)
    if (req.query.search && req.query.search.trim()) {
      filter.version = { $regex: req.query.search.trim(), $options: 'i' };
    }

    // Filter by status
    if (req.query.status && ['ACTIVE', 'ARCHIVED', 'CANDIDATE'].includes(req.query.status.toUpperCase())) {
      filter.status = req.query.status.toUpperCase();
    }

    // Filter by architecture
    if (req.query.architecture && req.query.architecture.trim()) {
      filter.architecture = { $regex: req.query.architecture.trim(), $options: 'i' };
    }

    // Execute query with pagination
    const [entries, totalCount] = await Promise.all([
      ModelRegistry.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ModelRegistry.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      data: entries,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('[Model Registry] Failed to fetch registry list:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving model registry.'
    });
  }
};

/**
 * GET /api/admin/model-registry/:id
 *
 * Returns complete details for a single registry entry.
 * Populates the linked TrainingHistory document.
 */
const getRegistryDetail = async (req, res) => {
  try {
    const entry = await ModelRegistry.findById(req.params.id)
      .populate('trainingHistory')
      .lean();

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Registry entry not found.'
      });
    }

    res.json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error('[Model Registry] Failed to fetch registry detail:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving registry entry.'
    });
  }
};

/**
 * POST /api/admin/model-registry/:id/deploy
 *
 * Deploys the selected model registry entry.
 * - Archives all currently ACTIVE registry entries.
 * - Sets the selected registry entry status to ACTIVE.
 * - Keeps all other entries ARCHIVED.
 * - Never allows more than one ACTIVE model in ModelRegistry.
 * - Synchronizes with the ModelVersion collection to make it ACTIVE for predictions.
 * - Hot-reloads the active model in modelService memory so it takes effect immediately.
 */
const deployModel = async (req, res) => {
  try {
    const modelId = req.params.id;

    // 1. Find the selected registry entry
    const selectedModel = await ModelRegistry.findById(modelId);
    if (!selectedModel) {
      return res.status(404).json({
        success: false,
        message: 'Model registry entry not found.'
      });
    }

    // 2. Archive every currently ACTIVE registry entry
    await ModelRegistry.updateMany(
      { status: 'ACTIVE' },
      { $set: { status: 'ARCHIVED' } }
    );

    // 3. Set the selected registry entry status to ACTIVE
    selectedModel.status = 'ACTIVE';
    await selectedModel.save();

    // 4. Synchronize with ModelVersion for dynamic model loading in predictions
    await ModelVersion.updateMany(
      { isActive: true },
      {
        $set: { isActive: false }
      }
    );
    const result = await ModelVersion.updateOne(
      { version: selectedModel.version },
      { $set: { isActive: true } }
    );

    if (result.matchedCount === 0) {
      throw new Error("Matching ModelVersion not found.");
    }

    // 5. Phase-6 Step-3: Automatically reload the model serving layer cache
    await modelService.reloadActiveModel();

    console.log(`[Rollback/Deploy] Model ${selectedModel.version} successfully deployed and reloaded in serving cache.`);

    // 6. Return the deployed model details
    res.json({
      success: true,
      message: `Model version ${selectedModel.version} successfully deployed.`,
      data: selectedModel
    });
  } catch (error) {
    console.error('[Model Registry] Failed to deploy model:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deploying model version.'
    });
  }
};

module.exports = {
  getRegistryList,
  getRegistryDetail,
  deployModel
};
