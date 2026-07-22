# 🏗️ Codebase Project Structure

## Overview

The repository follows a clean, decoupled architecture separating the Client UI (`client/`) from the Backend Service (`server/`).

---

## 💻 Frontend Client Structure (`client/src/`)

```text
client/src/
├── components/
│   ├── ui/                           # Global Reusable Design System Primitives
│   │   ├── ActionButton.jsx          # Button with loading spinner & variants
│   │   ├── ConfirmModal.jsx          # Dark glass action confirmation modal
│   │   ├── DataTable.jsx             # Standardized table with skeleton fallback
│   │   ├── EmptyState.jsx            # Zero data fallback container
│   │   ├── ErrorState.jsx            # Error alert card with retry handler
│   │   ├── FilterBar.jsx             # SearchBar & Filter bar inputs
│   │   ├── LoadingSkeleton.jsx       # Shimmer skeletons (Card, Table, Chart)
│   │   ├── PageContainer.jsx         # Framer Motion entrance wrapper
│   │   ├── PageHeader.jsx            # Enterprise page header with back button
│   │   ├── SectionCard.jsx           # Glassmorphic card section wrapper
│   │   ├── StatCard.jsx              # Glowing KPI summary card
│   │   ├── StatusStates.jsx          # NoSearchResults, NetworkError, AccessDenied
│   │   └── index.js                  # Centralized UI component export barrel
│   ├── AdminOnly.jsx                 # Role authorization wrapper component
│   ├── ExplanationCard.jsx           # Explainable AI SHAP summary card
│   ├── FeatureImportanceChart.jsx    # Feature weight chart component
│   ├── HistoryTable.jsx              # Prediction history data table
│   ├── Navbar.jsx                    # Header bar with user profile & logout
│   ├── ProtectedRoute.jsx            # Auth route guard
│   ├── Sidebar.jsx                   # Navigation menu with 16 MLOps links
│   └── WeatherCard.jsx               # Live weather widget
│
├── pages/                            # Application Page Views (Lazy Loaded)
│   ├── AIOperationsDashboard.jsx     # Command Center landing page
│   ├── Analytics.jsx                 # Yield & IoT sensor analytics
│   ├── Dashboard.jsx                 # Main User Dashboard
│   ├── DiseaseDetection.jsx          # Pathology image diagnostic page
│   ├── ExperimentTrackingCenter.jsx  # MLflow-style experiment tracking console
│   ├── ExplainabilityAnalytics.jsx   # Explainable AI suite page
│   ├── GovernanceCenter.jsx          # AI Policy enforcement & audit log console
│   ├── MLOpsMonitoringCenter.jsx     # Centralized monitoring alert dashboard
│   ├── ModelComparisonCenter.jsx     # Version matrix comparison tool
│   ├── ModelDeploymentCenter.jsx     # Zero-downtime deployment manager
│   ├── ModelRegistry.jsx             # Model version repository
│   ├── PipelineOrchestrator.jsx      # 8-Stage ML workflow engine
│   └── RetrainingManager.jsx         # Automated retraining scheduler
│
├── services/                         # Axios API Clients
│   ├── experimentTrackingApi.js      # Experiment API wrapper
│   ├── governanceApi.js              # Governance API wrapper
│   ├── mlopsMonitoringApi.js         # MLOps Monitoring API wrapper
│   ├── modelDeploymentApi.js         # Model Deployment API wrapper
│   └── pipelineWorkflowApi.js        # Pipeline Workflow API wrapper
│
└── utils/                            # Helper utilities
    ├── cropData.js                   # Crop metadata, colors, and emojis
    └── toast.js                      # Custom notify toast notification utility
```

---

## ⚙️ Backend Server Structure (`server/`)

```text
server/
├── config/
│   ├── db.js                         # MongoDB connection initializer
│   └── envValidation.js              # Startup environment variable validator
│
├── controllers/                      # Request handling business logic
│   ├── experimentTrackingController.js
│   ├── governanceController.js
│   ├── mlopsMonitoringController.js
│   ├── modelDeploymentController.js
│   ├── pipelineWorkflowController.js
│   └── retrainingSchedulerController.js
│
├── middleware/
│   ├── auth.js                       # JWT authentication middleware
│   ├── adminOnly.js                  # Admin role guard middleware
│   └── errorHandler.js               # Centralized JSON error handler
│
├── models/                           # Mongoose database schemas
│   ├── ExperimentRun.js              # Experiment execution schema
│   ├── GovernanceAudit.js            # Policy & Audit log schema
│   ├── ModelVersion.js               # Model registry schema
│   ├── PipelineWorkflow.js           # 8-Stage workflow schema
│   └── RetrainingJob.js              # Retraining scheduler schema
│
├── routes/                           # Express REST route endpoints
│   ├── auth.js                       # Login / Register routes
│   ├── experimentTracking.js         # Experiment tracking routes
│   ├── governance.js                 # Governance & Compliance routes
│   ├── health.js                     # /health & /ready probes
│   ├── modelDeployment.js            # Deployment & Rollback routes
│   └── pipelineWorkflow.js           # ML Pipeline Orchestrator routes
│
├── services/                         # Core domain services
│   ├── experimentTrackingService.js  # Experiment data processing
│   ├── governanceService.js          # Governance & Audit logic
│   ├── mlopsMonitoringService.js     # Monitoring alert aggregation
│   ├── modelDeploymentService.js     # Deployment & Rollback logic
│   └── pipelineWorkflowService.js    # 8-Stage workflow runner
│
└── server.js                         # Application entrypoint & shutdown signals
```
