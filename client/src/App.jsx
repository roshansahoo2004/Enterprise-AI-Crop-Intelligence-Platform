import { useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { SkeletonCard, SkeletonTable } from './components/ui/LoadingSkeleton';

// ─── Lazy Loaded Major Page Components ──────────────────────────────────────
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Predict = lazy(() => import('./pages/Predict'));
const History = lazy(() => import('./pages/History'));
const Analytics = lazy(() => import('./pages/Analytics'));
const DiseaseDetection = lazy(() => import('./pages/DiseaseDetection'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminFeedback = lazy(() => import('./pages/AdminFeedback'));
const ModelDashboard = lazy(() => import('./pages/ModelDashboard'));

// Phase 12.8 AI Expansion Pack Lazy Components
const YieldPredictionPage = lazy(() => import('./pages/YieldPredictionPage'));
const FarmerAssistantPage = lazy(() => import('./pages/FarmerAssistantPage'));
const DiseaseHeatmapPage = lazy(() => import('./pages/DiseaseHeatmapPage'));
const CropCalendarPage = lazy(() => import('./pages/CropCalendarPage'));

// MLOps Center Lazy Components
const ModelRegistry = lazy(() => import('./pages/ModelRegistry'));
const ExplainabilityAnalytics = lazy(() => import('./pages/ExplainabilityAnalytics'));
const ExplainabilityPredictionExplorer = lazy(() => import('./pages/ExplainabilityPredictionExplorer'));
const ExplainabilityDetail = lazy(() => import('./pages/ExplainabilityDetail'));
const ExplainabilityReports = lazy(() => import('./pages/ExplainabilityReports'));
const ModelHealthDashboard = lazy(() => import('./pages/ModelHealthDashboard'));
const DataDriftDashboard = lazy(() => import('./pages/DataDriftDashboard'));
const FeatureDriftDashboard = lazy(() => import('./pages/FeatureDriftDashboard'));
const ConfidenceDriftDashboard = lazy(() => import('./pages/ConfidenceDriftDashboard'));
const RetrainingRecommendationDashboard = lazy(() => import('./pages/RetrainingRecommendationDashboard'));
const MLOpsMonitoringCenter = lazy(() => import('./pages/MLOpsMonitoringCenter'));
const AIOperationsDashboard = lazy(() => import('./pages/AIOperationsDashboard'));
const ModelDeploymentCenter = lazy(() => import('./pages/ModelDeploymentCenter'));
const ModelComparisonCenter = lazy(() => import('./pages/ModelComparisonCenter'));
const ExperimentTrackingCenter = lazy(() => import('./pages/ExperimentTrackingCenter'));
const RetrainingManager = lazy(() => import('./pages/RetrainingManager'));
const PipelineOrchestrator = lazy(() => import('./pages/PipelineOrchestrator'));
const GovernanceCenter = lazy(() => import('./pages/GovernanceCenter'));
const ObservabilityCenter = lazy(() => import('./pages/ObservabilityCenter'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));


// Page Fallback Loader
const PageFallback = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
    </div>
    <SkeletonTable rows={6} />
  </div>
);

// Layout wrapper for authenticated pages (declared outside render to prevent re-creation)
const AuthenticatedLayout = ({ children, isSidebarOpen, toggleSidebar, closeSidebar }) => (
  <div className="flex h-screen w-full overflow-hidden bg-surface-950 bg-mesh relative">
    {/* Decorative background blurs */}
    <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary-500/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

    <Sidebar isOpen={isSidebarOpen} closeSidebar={closeSidebar} />

    <div className="flex flex-1 flex-col h-full w-full overflow-hidden md:pl-0">
      <Navbar toggleSidebar={toggleSidebar} />

      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto h-full">
          <Suspense fallback={<PageFallback />}>
            {children}
          </Suspense>
        </div>
      </main>
    </div>
  </div>
);

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
        <p className="text-gray-400 font-mono text-sm animate-pulse">Initializing AI Crop Intelligence Engine...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Admin route wrapper
const AdminOnly = ({ children }) => {
  const { user } = useAuth();
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const layoutProps = { isSidebarOpen, toggleSidebar, closeSidebar };

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Suspense fallback={<PageFallback />}><Login /></Suspense>} />
      <Route path="/signup" element={<Suspense fallback={<PageFallback />}><Signup /></Suspense>} />

      {/* Protected Main User Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout {...layoutProps}>
              <Dashboard />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/predict"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout {...layoutProps}>
              <Predict />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/disease-detection"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout {...layoutProps}>
              <DiseaseDetection />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout {...layoutProps}>
              <History />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout {...layoutProps}>
              <Analytics />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />

      {/* Phase 12.8 Expansion Pack Routes */}
      <Route
        path="/yield-prediction"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout {...layoutProps}>
              <YieldPredictionPage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/assistant"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout {...layoutProps}>
              <FarmerAssistantPage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/disease-heatmap"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout {...layoutProps}>
              <DiseaseHeatmapPage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/crop-calendar"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout {...layoutProps}>
              <CropCalendarPage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />

      {/* Protected Admin MLOps Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminOnly>
              <AuthenticatedLayout {...layoutProps}>
                <AdminDashboard />
              </AuthenticatedLayout>
            </AdminOnly>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/operations"
        element={
          <ProtectedRoute>
            <AdminOnly>
              <AuthenticatedLayout {...layoutProps}>
                <AIOperationsDashboard />
              </AuthenticatedLayout>
            </AdminOnly>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/deployments"
        element={
          <ProtectedRoute>
            <AdminOnly>
              <AuthenticatedLayout {...layoutProps}>
                <ModelDeploymentCenter />
              </AuthenticatedLayout>
            </AdminOnly>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/model-registry"
        element={
          <ProtectedRoute>
            <AdminOnly>
              <AuthenticatedLayout {...layoutProps}>
                <ModelRegistry />
              </AuthenticatedLayout>
            </AdminOnly>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/model-comparison"
        element={
          <ProtectedRoute>
            <AdminOnly>
              <AuthenticatedLayout {...layoutProps}>
                <ModelComparisonCenter />
              </AuthenticatedLayout>
            </AdminOnly>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/experiments"
        element={
          <ProtectedRoute>
            <AdminOnly>
              <AuthenticatedLayout {...layoutProps}>
                <ExperimentTrackingCenter />
              </AuthenticatedLayout>
            </AdminOnly>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/retraining-manager"
        element={
          <ProtectedRoute>
            <AdminOnly>
              <AuthenticatedLayout {...layoutProps}>
                <RetrainingManager />
              </AuthenticatedLayout>
            </AdminOnly>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/pipeline-orchestrator"
        element={
          <ProtectedRoute>
            <AdminOnly>
              <AuthenticatedLayout {...layoutProps}>
                <PipelineOrchestrator />
              </AuthenticatedLayout>
            </AdminOnly>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/governance"
        element={
          <ProtectedRoute>
            <AdminOnly>
              <AuthenticatedLayout {...layoutProps}>
                <GovernanceCenter />
              </AuthenticatedLayout>
            </AdminOnly>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/observability"
        element={
          <ProtectedRoute>
            <AdminOnly>
              <AuthenticatedLayout {...layoutProps}>
                <ObservabilityCenter />
              </AuthenticatedLayout>
            </AdminOnly>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/system-monitoring"
        element={
          <ProtectedRoute>
            <AdminOnly>
              <AuthenticatedLayout {...layoutProps}>
                <ObservabilityCenter />
              </AuthenticatedLayout>
            </AdminOnly>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/model-dashboard"
        element={
          <ProtectedRoute>
            <AdminOnly>
              <AuthenticatedLayout {...layoutProps}>
                <ModelDashboard />
              </AuthenticatedLayout>
            </AdminOnly>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/explainability"
        element={
          <ProtectedRoute>
            <AdminOnly>
              <AuthenticatedLayout {...layoutProps}>
                <ExplainabilityAnalytics />
              </AuthenticatedLayout>
            </AdminOnly>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/explainability/predictions"
        element={
          <ProtectedRoute>
            <AdminOnly>
              <AuthenticatedLayout {...layoutProps}>
                <ExplainabilityPredictionExplorer />
              </AuthenticatedLayout>
            </AdminOnly>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/explainability/detail/:id"
        element={
          <ProtectedRoute>
            <AdminOnly>
              <AuthenticatedLayout {...layoutProps}>
                <ExplainabilityDetail />
              </AuthenticatedLayout>
            </AdminOnly>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/explainability/reports"
        element={
          <ProtectedRoute>
            <AdminOnly>
              <AuthenticatedLayout {...layoutProps}>
                <ExplainabilityReports />
              </AuthenticatedLayout>
            </AdminOnly>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/model-performance"
        element={
          <ProtectedRoute>
            <AdminOnly>
              <AuthenticatedLayout {...layoutProps}>
                <ExplainabilityAnalytics />
              </AuthenticatedLayout>
            </AdminOnly>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/model-health"
        element={
          <ProtectedRoute>
            <AdminOnly>
              <AuthenticatedLayout {...layoutProps}>
                <ModelHealthDashboard />
              </AuthenticatedLayout>
            </AdminOnly>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/data-drift"
        element={
          <ProtectedRoute>
            <AdminOnly>
              <AuthenticatedLayout {...layoutProps}>
                <DataDriftDashboard />
              </AuthenticatedLayout>
            </AdminOnly>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/feature-drift"
        element={
          <ProtectedRoute>
            <AdminOnly>
              <AuthenticatedLayout {...layoutProps}>
                <FeatureDriftDashboard />
              </AuthenticatedLayout>
            </AdminOnly>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/confidence-drift"
        element={
          <ProtectedRoute>
            <AdminOnly>
              <AuthenticatedLayout {...layoutProps}>
                <ConfidenceDriftDashboard />
              </AuthenticatedLayout>
            </AdminOnly>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/retraining"
        element={
          <ProtectedRoute>
            <AdminOnly>
              <AuthenticatedLayout {...layoutProps}>
                <RetrainingRecommendationDashboard />
              </AuthenticatedLayout>
            </AdminOnly>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/mlops-monitoring"
        element={
          <ProtectedRoute>
            <AdminOnly>
              <AuthenticatedLayout {...layoutProps}>
                <MLOpsMonitoringCenter />
              </AuthenticatedLayout>
            </AdminOnly>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/feedback"
        element={
          <ProtectedRoute>
            <AdminOnly>
              <AuthenticatedLayout {...layoutProps}>
                <AdminFeedback />
              </AuthenticatedLayout>
            </AdminOnly>
          </ProtectedRoute>
        }
      />

      {/* Profile & Settings Routes */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout {...layoutProps}>
              <ProfilePage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout {...layoutProps}>
              <SettingsPage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />

      {/* Root Redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
