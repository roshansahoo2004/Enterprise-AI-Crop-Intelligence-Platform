const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');

// Load & Validate Environment Variables
dotenv.config();
const validateEnv = require('./config/envValidation');
validateEnv();

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const { authRateLimiter, sanitizeParams } = require('./middleware/security');

// Import routes
const authRoutes = require('./routes/auth');
const predictRoutes = require('./routes/predict');
const historyRoutes = require('./routes/history');
const weatherRoutes = require('./routes/weather');
const iotRoutes = require('./routes/iot');
const diseaseRoutes = require('./routes/disease');
const feedbackRoutes = require('./routes/feedback');
const adminRoutes = require('./routes/admin');
const healthRoutes = require('./routes/health');

// Expansion Pack Routes
const yieldRoutes = require('./routes/yield');
const assistantRoutes = require('./routes/assistant');
const diseaseHeatmapRoutes = require('./routes/diseaseHeatmap');
const cropCalendarRoutes = require('./routes/cropCalendar');

// MLOps & Observability Routes
const modelRegistryRoutes = require('./routes/modelRegistry');
const modelServiceRoutes = require('./routes/modelService');
const modelDashboardRoutes = require('./routes/modelDashboard');
const explainabilityRoutes = require('./routes/explainability');
const explainabilityPredictionRoutes = require('./routes/explainabilityPrediction');
const explainabilityDetailRoutes = require('./routes/explainabilityDetail');
const explainabilityReportRoutes = require('./routes/explainabilityReport');
const modelHealthRoutes = require('./routes/modelHealth');
const dataDriftRoutes = require('./routes/dataDrift');
const featureDriftRoutes = require('./routes/featureDrift');
const confidenceDriftRoutes = require('./routes/confidenceDrift');
const retrainingRecommendationRoutes = require('./routes/retrainingRecommendation');
const mlopsMonitoringRoutes = require('./routes/mlopsMonitoring');
const aiOperationsRoutes = require('./routes/aiOperations');
const modelDeploymentRoutes = require('./routes/modelDeployment');
const modelComparisonRoutes = require('./routes/modelComparison');
const experimentTrackingRoutes = require('./routes/experimentTracking');
const retrainingSchedulerRoutes = require('./routes/retrainingScheduler');
const pipelineWorkflowRoutes = require('./routes/pipelineWorkflow');
const governanceRoutes = require('./routes/governance');
const observabilityRoutes = require('./routes/observability');

// Initialize Express app
const app = express();

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/feedback-images', express.static(path.join(__dirname, 'feedback-images')));

// ─── Security & Parsing Middleware ──────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(sanitizeParams);

// Request logging
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.path}`);
    next();
  });
}

// Health & Readiness Probes
app.use('/', healthRoutes);
app.use('/api', healthRoutes);

// ─── Core & Admin API Routes ────────────────────────────────────────────────
app.use('/api/auth', authRateLimiter, authRoutes);
app.use('/api/predict', predictRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/iot-data', iotRoutes);
app.use('/api/disease', diseaseRoutes);
app.use('/api/feedback', feedbackRoutes);

// Expansion Pack Endpoints
app.use('/api/yield', yieldRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/disease-heatmap', diseaseHeatmapRoutes);
app.use('/api/crop-calendar', cropCalendarRoutes);

app.use('/api/admin', adminRoutes);
app.use('/api/admin/model-registry', modelRegistryRoutes);
app.use('/api/admin/model-service', modelServiceRoutes);
app.use('/api/admin/model-dashboard', modelDashboardRoutes);
app.use('/api/admin/explainability', explainabilityRoutes);
app.use('/api/admin/explainability/predictions', explainabilityPredictionRoutes);
app.use('/api/admin/explainability/details', explainabilityDetailRoutes);
app.use('/api/admin/explainability/reports', explainabilityReportRoutes);
app.use('/api/admin/mlops/model-health', modelHealthRoutes);
app.use('/api/admin/mlops/data-drift', dataDriftRoutes);
app.use('/api/admin/mlops/feature-drift', featureDriftRoutes);
app.use('/api/admin/mlops/confidence-drift', confidenceDriftRoutes);
app.use('/api/admin/mlops/retraining', retrainingRecommendationRoutes);
app.use('/api/admin/mlops/monitoring', mlopsMonitoringRoutes);
app.use('/api/admin/operations', aiOperationsRoutes);
app.use('/api/admin/deployments', modelDeploymentRoutes);
app.use('/api/admin/model-comparison', modelComparisonRoutes);
app.use('/api/admin/experiments', experimentTrackingRoutes);
app.use('/api/admin/retraining-manager', retrainingSchedulerRoutes);
app.use('/api/admin/pipeline', pipelineWorkflowRoutes);
app.use('/api/admin/governance', governanceRoutes);
app.use('/api/admin/observability', observabilityRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// ─── Server Startup & Graceful Shutdown ─────────────────────────────────────
const PORT = process.env.PORT || 5000;
let server;

const startServer = async () => {
  try {
    await connectDB();

    // Initialize Model Serving Layer after DB is connected
    try {
      const modelService = require('./services/modelService');
      await modelService.loadActiveModel();
    } catch (modelLoadError) {
      logger.error('[Model Service Startup] Failed to load active model', { error: modelLoadError.message });
    }

    server = app.listen(PORT, () => {
      logger.info(`🚀 Release Candidate v1.0 Server listening on port ${PORT}`);
      logger.info(`📡 API Base: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    logger.error('Failed to start server:', { error: error.message });
    process.exit(1);
  }
};

// Graceful Shutdown
const handleGracefulShutdown = (signal) => {
  logger.info(`[Server Shutdown] ${signal} signal received. Closing connections...`);
  if (server) {
    server.close(async () => {
      logger.info('[Server Shutdown] HTTP server closed.');
      try {
        await mongoose.connection.close();
        logger.info('[Server Shutdown] MongoDB connection closed.');
        process.exit(0);
      } catch (err) {
        logger.error('[Server Shutdown Error]', { error: err.message });
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));

startServer();
