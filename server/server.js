const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const predictRoutes = require('./routes/predict');
const historyRoutes = require('./routes/history');
const weatherRoutes = require('./routes/weather');
const iotRoutes = require('./routes/iot');
const diseaseRoutes = require('./routes/disease');
const feedbackRoutes = require('./routes/feedback');
const adminRoutes = require('./routes/admin');

// ─── Phase-6 Step-1: Model Registry ───
const modelRegistryRoutes = require('./routes/modelRegistry');

// ─── Phase-6 Step-3: Dynamic Model Serving ───
const modelServiceRoutes = require('./routes/modelService');

// ─── Phase-7 Step-1: Model Performance Dashboard ───
const modelDashboardRoutes = require('./routes/modelDashboard');

// ─── Phase-9 Step-1: Explainability Analytics Dashboard ───
const explainabilityRoutes = require('./routes/explainability');

// ─── Phase-9 Step-2: Explainability Prediction Explorer ───
const explainabilityPredictionRoutes = require('./routes/explainabilityPrediction');

// ─── Phase-9 Step-3: Explainability Prediction Detail Inspector ───
const explainabilityDetailRoutes = require('./routes/explainabilityDetail');

// ─── Phase-9 Step-4: Explainability Reporting & Export Center ───
const explainabilityReportRoutes = require('./routes/explainabilityReport');

// ─── Phase-10 Step-1: Enterprise Model Health Dashboard ───
const modelHealthRoutes = require('./routes/modelHealth');

// ─── Phase-10 Step-2: Enterprise Data Drift Detection ───
const dataDriftRoutes = require('./routes/dataDrift');

// ─── Phase-10 Step-3: Enterprise Feature Drift Analytics ───
const featureDriftRoutes = require('./routes/featureDrift');

// ─── Phase-10 Step-4: Enterprise Confidence Drift Monitoring ───
const confidenceDriftRoutes = require('./routes/confidenceDrift');

// ─── Phase-10 Step-5: Enterprise Retraining Recommendation Engine ───
const retrainingRecommendationRoutes = require('./routes/retrainingRecommendation');

// ─── Phase-10 Step-6: Enterprise Drift History, Smart Alerts & Monitoring Center ───
const mlopsMonitoringRoutes = require('./routes/mlopsMonitoring');

// ─── Phase-11 Step-1: Enterprise AI Operations Command Center ───
const aiOperationsRoutes = require('./routes/aiOperations');

// ─── Phase-11 Step-2: Enterprise Model Deployment Center ───
const modelDeploymentRoutes = require('./routes/modelDeployment');

// ─── Phase-11 Step-3: Enterprise Model Version Comparison Center ───
const modelComparisonRoutes = require('./routes/modelComparison');

// ─── Phase-11 Step-4: Enterprise Experiment Tracking Center ───
const experimentTrackingRoutes = require('./routes/experimentTracking');

// ─── Phase-11 Step-5: Enterprise Scheduled Retraining Manager ───
const retrainingSchedulerRoutes = require('./routes/retrainingScheduler');

// ─── Phase-11 Step-6: Enterprise Automated ML Pipeline Orchestrator ───
const pipelineWorkflowRoutes = require('./routes/pipelineWorkflow');

// ─── Phase-11 Step-7: Enterprise AI Governance & Compliance Center ───
const governanceRoutes = require('./routes/governance');

// Initialize Express app
const app = express();

// Serve static files for uploads
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/feedback-images', express.static(path.join(__dirname, 'feedback-images')));

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging (development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/predict', predictRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/iot-data', iotRoutes);
app.use('/api/disease', diseaseRoutes);
app.use('/api/feedback', feedbackRoutes);
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'AI Crop Planning System API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// ─── Start Server ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // ─── Phase-6 Step-3: Initialize Model Serving Layer after DB is connected ───
    try {
      const modelService = require('./services/modelService');
      await modelService.loadActiveModel();
    } catch (modelLoadError) {
      console.error('[Model Service Startup] ❌ Failed to run initial active model load:', modelLoadError.message);
    }

    app.listen(PORT, () => {
      console.log('');
      console.log('═══════════════════════════════════════════════════');
      console.log('  🌾 AI Crop Planning System — Server');
      console.log('═══════════════════════════════════════════════════');
      console.log(`  🚀 Server running on port ${PORT}`);
      console.log(`  📡 API Base: http://localhost:${PORT}/api`);
      console.log(`  🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('═══════════════════════════════════════════════════');
      console.log('');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
