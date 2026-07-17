const ModelRegistry = require('../models/ModelRegistry');
const ModelVersion = require('../models/ModelVersion');
const TrainingHistory = require('../models/TrainingHistory');
const modelService = require('../services/modelService');
const fs = require('fs');
const path = require('path');

/**
 * Phase-7 Step-1 & Step-2: Model Performance Dashboard Controller
 *
 * Provides summary statistics, performance trends, training run history,
 * and system health monitoring alerts for admin inspection.
 */

/**
 * GET /api/admin/model-dashboard/summary
 *
 * Compiles a comprehensive real-time summary of the active model and serving layer metrics.
 */
const getSummary = async (req, res) => {
  try {
    const serviceStatus = modelService.getStatus();

    // Find the currently active model from the registry
    const activeRegistryModel = await ModelRegistry.findOne(
      { status: 'ACTIVE' },
      {
        version: 1,
        architecture: 1,
        status: 1,
        accuracy: 1,
        precision: 1,
        recall: 1,
        f1Score: 1,
        loss: 1,
        epochs: 1,
        trainingImages: 1,
        validationImages: 1,
        trainingDuration: 1,
        modelSizeMB: 1,
        gpuUsed: 1
      }
    ).lean();

    res.json({
      success: true,
      data: {
        activeModelVersion: activeRegistryModel ? activeRegistryModel.version : 'Fallback',
        architecture: activeRegistryModel ? activeRegistryModel.architecture : 'efficientnetb0',
        status: activeRegistryModel ? activeRegistryModel.status : 'UNKNOWN',
        accuracy: activeRegistryModel ? activeRegistryModel.accuracy : null,
        precision: activeRegistryModel ? activeRegistryModel.precision : null,
        recall: activeRegistryModel ? activeRegistryModel.recall : null,
        f1Score: activeRegistryModel ? activeRegistryModel.f1Score : null,
        loss: activeRegistryModel ? activeRegistryModel.loss : null,
        epochs: activeRegistryModel ? activeRegistryModel.epochs : null,
        trainingImages: activeRegistryModel ? activeRegistryModel.trainingImages : null,
        validationImages: activeRegistryModel ? activeRegistryModel.validationImages : null,
        trainingDuration: activeRegistryModel ? activeRegistryModel.trainingDuration : null,
        modelSizeMB: activeRegistryModel ? activeRegistryModel.modelSizeMB : null,
        gpuUsed: activeRegistryModel ? activeRegistryModel.gpuUsed : false,
        predictionsServed: serviceStatus.predictionsServed,
        loadedTime: serviceStatus.loadedAt,
        currentModelServiceStatus: serviceStatus.status
      }
    });
  } catch (error) {
    console.error('[Model Dashboard Controller] Summary fetch failed:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving model summary statistics.'
    });
  }
};

/**
 * GET /api/admin/model-dashboard/trends
 *
 * Retrieves all registered models sorted chronologically to build historical comparison trends.
 */
const getTrends = async (req, res) => {
  try {
    const models = await ModelRegistry.find()
      .sort({ trainedAt: 1 })
      .select('version architecture accuracy precision recall f1Score loss trainingDuration modelSizeMB gpuUsed status trainedAt')
      .lean();

    res.json({
      success: true,
      data: models
    });
  } catch (error) {
    console.error('[Model Dashboard Controller] Trends fetch failed:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving model trends.'
    });
  }
};

/**
 * GET /api/admin/model-dashboard/history
 *
 * Retrieves the complete list of training runs sorted by date descending.
 */
const getHistory = async (req, res) => {
  try {
    const history = await TrainingHistory.find()
      .sort({ completedAt: -1 })
      .select('modelVersion status accuracy loss epochs trainingImages validationImages durationSeconds feedbackUsed startedAt completedAt')
      .lean();

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('[Model Dashboard Controller] History fetch failed:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving training run history.'
    });
  }
};

/**
 * GET /api/admin/model-dashboard/health
 *
 * Runs consistency checks across database and disk storage to evaluate serving layer health status.
 */
const getHealth = async (req, res) => {
  try {
    const serviceStatus = modelService.getStatus();
    const DEEP_LEARNING_DIR = path.join(__dirname, '..', '..', 'deep-learning');

    // 1. Gather stats from collections
    const activeRegistry = await ModelRegistry.findOne({ status: 'ACTIVE' }).lean();
    const activeRegistryCount = await ModelRegistry.countDocuments({ status: 'ACTIVE' });
    const activeModelVersion = await ModelVersion.findOne({ isActive: true }).lean();
    const activeModelVersionCount = await ModelVersion.countDocuments({ isActive: true });
    const latestTraining = await TrainingHistory.findOne().sort({ completedAt: -1 }).lean();
    const totalFailedTrainings = await TrainingHistory.countDocuments({ status: 'FAILED' });

    // 2. Perform consistency validations
    let activeModelFileExists = false;
    if (activeRegistry && activeRegistry.filePath) {
      const absolutePath = path.join(DEEP_LEARNING_DIR, activeRegistry.filePath);
      activeModelFileExists = fs.existsSync(absolutePath);
    }

    const registryConsistency = activeRegistryCount === 1;
    const modelVersionConsistency = activeModelVersionCount === 1;
    const versionMismatch = activeRegistry && activeModelVersion && activeRegistry.version !== activeModelVersion.version;
    const lowAccuracy = activeRegistry && activeRegistry.accuracy != null && activeRegistry.accuracy < 0.9;
    const cacheLoaded = serviceStatus.status === 'LOADED';

    // 3. Compile warnings array
    const warnings = [];

    if (!activeRegistry) {
      warnings.push('No active model configuration exists in the Model Registry.');
    }
    if (activeRegistryCount > 1) {
      warnings.push(`Registry inconsistency: ${activeRegistryCount} models are marked ACTIVE.`);
    }
    if (activeModelVersionCount === 0) {
      warnings.push('No active version found in the ModelVersion collection.');
    } else if (activeModelVersionCount > 1) {
      warnings.push(`ModelVersion inconsistency: ${activeModelVersionCount} versions are marked active.`);
    }
    if (activeRegistry && !activeModelFileExists) {
      warnings.push(`Active model version ${activeRegistry.version} file is missing from disk: ${activeRegistry.filePath}`);
    }
    if (versionMismatch) {
      warnings.push(`Version mismatch: ModelRegistry active version is ${activeRegistry.version} but ModelVersion active version is ${activeModelVersion.version}.`);
    }
    if (lowAccuracy) {
      warnings.push(`Validation accuracy for active model ${activeRegistry.version} is low: ${(activeRegistry.accuracy * 100).toFixed(2)}% (< 90%).`);
    }
    if (serviceStatus.status !== 'LOADED') {
      warnings.push(`In-memory serving layer cache status is ${serviceStatus.status || 'UNLOADED'}.`);
    }
    if (latestTraining && latestTraining.status === 'FAILED') {
      warnings.push(`The latest pipeline run (${latestTraining.modelVersion || 'unknown version'}) failed.`);
    }

    // 4. Calculate overall status badge level
    let overallHealth = 'HEALTHY';
    const isCritical =
      !activeRegistry ||
      (activeRegistry && !activeModelFileExists) ||
      activeRegistryCount > 1 ||
      activeModelVersionCount > 1 ||
      (serviceStatus.status !== 'LOADED' && serviceStatus.status !== 'NO_ACTIVE_MODEL');

    if (isCritical) {
      overallHealth = 'CRITICAL';
    } else if (warnings.length > 0) {
      overallHealth = 'WARNING';
    }

    res.json({
      success: true,
      data: {
        overallHealth,
        activeModelExists: !!activeRegistry,
        modelServiceStatus: serviceStatus.status,
        cacheLoaded,
        latestTrainingStatus: latestTraining ? latestTraining.status : null,
        latestTrainingTime: latestTraining ? (latestTraining.completedAt || latestTraining.createdAt) : null,
        totalFailedTrainings,
        registryConsistency,
        modelVersionConsistency,
        warnings
      }
    });
  } catch (error) {
    console.error('[Model Dashboard Controller] Health check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Server error executing system health checks.'
    });
  }
};

module.exports = {
  getSummary,
  getTrends,
  getHistory,
  getHealth
};
