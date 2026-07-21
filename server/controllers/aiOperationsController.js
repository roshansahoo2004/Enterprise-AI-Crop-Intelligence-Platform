const aiOperationsService = require('../services/aiOperationsService');

/**
 * Phase-11 Step-1: Enterprise AI Operations Command Center Controller
 *
 * Handles overview, recent events, and quick actions endpoints.
 */

// GET /api/admin/operations/overview
exports.getOverview = async (req, res) => {
  try {
    const data = await aiOperationsService.getOperationsOverview();
    res.json({
      success: true,
      message: 'AI Operations overview generated successfully',
      data
    });
  } catch (error) {
    console.error('AI Operations Controller — Overview Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating AI Operations overview',
      error: error.message
    });
  }
};

// GET /api/admin/operations/recent-events
exports.getRecentEvents = async (req, res) => {
  try {
    const data = await aiOperationsService.getRecentEvents();
    res.json({
      success: true,
      message: 'Recent platform events retrieved successfully',
      data
    });
  } catch (error) {
    console.error('AI Operations Controller — Recent Events Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching recent events',
      error: error.message
    });
  }
};

// GET /api/admin/operations/quick-actions
exports.getQuickActions = async (req, res) => {
  try {
    const data = await aiOperationsService.getQuickActions();
    res.json({
      success: true,
      message: 'Quick actions retrieved successfully',
      data
    });
  } catch (error) {
    console.error('AI Operations Controller — Quick Actions Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching quick actions',
      error: error.message
    });
  }
};
