const experimentTrackingService = require('../services/experimentTrackingService');

/**
 * Phase-11 Step-4: Enterprise Experiment Tracking Center Controller
 *
 * Handles summary, paginated runs, run details, comparisons, and artifacts endpoints.
 */

// GET /api/admin/experiments/summary
exports.getSummary = async (req, res) => {
  try {
    const data = await experimentTrackingService.getExperimentsSummary();
    res.json({
      success: true,
      message: 'Experiment tracking summary generated successfully',
      data
    });
  } catch (error) {
    console.error('Experiment Controller — Summary Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating experiment summary',
      error: error.message
    });
  }
};

// GET /api/admin/experiments/runs
exports.getRuns = async (req, res) => {
  try {
    const params = {
      search: req.query.search,
      algorithm: req.query.algorithm,
      datasetVersion: req.query.datasetVersion,
      modelVersion: req.query.modelVersion,
      status: req.query.status,
      page: req.query.page,
      limit: req.query.limit
    };
    const data = await experimentTrackingService.getExperimentRuns(params);
    res.json({
      success: true,
      message: 'Experiment runs retrieved successfully',
      data
    });
  } catch (error) {
    console.error('Experiment Controller — Runs Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching experiment runs',
      error: error.message
    });
  }
};

// GET /api/admin/experiments/details/:id
exports.getDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await experimentTrackingService.getExperimentDetails(id);
    res.json({
      success: true,
      message: 'Experiment run details retrieved successfully',
      data
    });
  } catch (error) {
    console.error('Experiment Controller — Details Error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Experiment run details not found',
      error: error.message
    });
  }
};

// GET /api/admin/experiments/compare
exports.compareRuns = async (req, res) => {
  try {
    const runIds = req.query.runIds || req.query.ids;
    const data = await experimentTrackingService.compareExperimentRuns(runIds);
    res.json({
      success: true,
      message: 'Experiment runs compared successfully',
      data
    });
  } catch (error) {
    console.error('Experiment Controller — Compare Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while comparing experiment runs',
      error: error.message
    });
  }
};

// GET /api/admin/experiments/artifacts/:id
exports.getArtifacts = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await experimentTrackingService.getExperimentArtifacts(id);
    res.json({
      success: true,
      message: 'Experiment artifacts retrieved successfully',
      data
    });
  } catch (error) {
    console.error('Experiment Controller — Artifacts Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching experiment artifacts',
      error: error.message
    });
  }
};
