# 📜 Release Changelog

All notable changes to the **Enterprise AI Crop Intelligence Platform** project are documented below.

---

## [14.0.0] — 2026-07-23 (Phase 14: Enterprise Production Optimization — Release Candidate v1.0)

### Optimized
- **Database Connection Pooling**: Configured `maxPoolSize`, `minPoolSize`, `serverSelectionTimeoutMS`, and `socketTimeoutMS` options in MongoDB initializer. Added error & disconnect life-cycle event listeners.
- **Analytical Compound Indexes**: Implemented compound indexes `{ predictionType: 1, createdAt: -1 }` and `{ disease: 1, createdAt: -1 }` on `Prediction` model for instant telemetry aggregations.
- **Client Bundle Isolation**: Enhanced Vite Rolldown build configuration with `vendor-icons`, `vendor-utils`, `vendor-motion`, `vendor-react`, and `vendor-charts` chunks. Enabled CSS code splitting (`cssCodeSplit: true`) and disabled production sourcemaps. Reduced index JS bundle to **68.9 kB**.
- **Rate Limiter Memory Garbage Collection**: Implemented background periodic cleanup interval (every 30 mins) for `authRateLimitMap` in `security.js` to purge expired IP entries and eliminate memory leaks.
- **Input Sanitizer Hardening**: Added circular reference protection (`WeakSet`) and null checks to `sanitizeParams` to prevent script execution, stack overflows, and NoSQL parameter injection.
- **Global Error Boundary**: Ensured React `ErrorBoundary` wraps component tree to catch unhandled rendering exceptions gracefully.

---

## [12.0.0] — 2026-07-22 (Phase 12: Enterprise Production Polish & Hardening)


### Added
- **Global Enterprise UI Design System**: Built 12 reusable UI primitives (`PageContainer`, `PageHeader`, `StatCard`, `SectionCard`, `ActionButton`, `DataTable`, `EmptyState`, `ErrorState`, `ConfirmModal`, `SearchBar`, `FilterBar`, `LoadingSkeleton`) in `client/src/components/ui/`.
- **Enterprise Notifications**: Integrated custom `notify` utility wrapper over `react-hot-toast` (`notify.success`, `notify.error`, `notify.warning`, `notify.info`, `notify.loading`).
- **Destructive Action Confirm Modal**: Replaced native browser `confirm()` popups with styled dark glass `ConfirmModal`.
- **Health & Readiness Probes**: Implemented `GET /health` and `GET /ready` endpoints with live database state and process uptime metrics.
- **Environment Startup Validator**: Startup validation checks required environment variables (`MONGO_URI`, `JWT_SECRET`) on server initialization.
- **Graceful Shutdown Handlers**: Process signal listeners (`SIGINT`/`SIGTERM`) to close HTTP listeners and MongoDB connections cleanly.
- **Comprehensive Documentation**: Added `README.md`, `API_DOCUMENTATION.md`, `PROJECT_STRUCTURE.md`, `CONTRIBUTING.md`, `DEPLOYMENT_GUIDE.md`, `.env.example`.

### Optimized
- **Route Code Splitting**: Converted all 28 application pages to load on-demand via `React.lazy()` and `Suspense`.
- **Vite Rolldown Chunking**: Configured `manualChunks` function separating `vendor-react`, `vendor-charts`, and `vendor-motion`. Reduced initial load time to **1.18 seconds**.

---

## [11.0.0] — 2026-07-21 (Phase 11: Enterprise AI Command & Orchestration Center)

### Added
- **AI Operations Command Center**: Executive operational dashboard landing page (`/admin/operations`).
- **Model Deployment Center**: Deployment monitoring, zero-downtime traffic allocation, and rollback engine (`/admin/deployments`).
- **Model Version Comparison Center**: Side-by-side metric comparison matrix (`/admin/model-comparison`).
- **Experiment Tracking Center**: MLflow-style hyperparameter logging and artifact storage (`/admin/experiments`).
- **Scheduled Retraining Manager**: Automated cron and drift trigger retraining manager (`/admin/retraining-manager`).
- **Automated ML Pipeline Orchestrator**: 8-stage automated pipeline execution engine (`/admin/pipeline-orchestrator`).
- **AI Governance & Compliance Center**: Policy enforcement, audit logging, and human-in-the-loop approval console (`/admin/governance`).

### Fixed
- Fixed Mongoose array schema definition error in `ExperimentRun.js` (`artifacts.0` cast error).

---

## [10.0.0] — 2026-07-20 (Phase 10: MLOps Health & Drift Analytics Suite)

### Added
- Enterprise Model Health Dashboard (`/admin/model-health`).
- Data Drift Detection (`/admin/data-drift`).
- Feature Drift Analytics (`/admin/feature-drift`).
- Confidence Drift Monitoring (`/admin/confidence-drift`).
- Retraining Recommendation Engine (`/admin/retraining`).
- MLOps Monitoring Center (`/admin/mlops-monitoring`).

---

## [9.0.0] — 2026-07-19 (Phase 9: Explainability Suite & SHAP Analytics)

### Added
- Feature Importance Analytics (`/admin/explainability`).
- Prediction Explorer (`/admin/explainability/predictions`).
- Inspection Details (`/admin/explainability/details`).
- PDF & Markdown Export Center (`/admin/explainability/reports`).
