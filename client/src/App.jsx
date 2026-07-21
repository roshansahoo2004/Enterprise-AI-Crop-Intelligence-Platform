import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

// Layout components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminOnly from './components/AdminOnly';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Predict from './pages/Predict';
import History from './pages/History';
import Analytics from './pages/Analytics';
import DiseaseDetection from './pages/DiseaseDetection';
import AdminFeedback from './pages/AdminFeedback';
import AdminDashboard from './pages/AdminDashboard';

// ─── Phase-6 Step-1: Model Registry ───
import ModelRegistry from './pages/ModelRegistry';

// ─── Phase-7 Step-1: Model Performance Dashboard ───
import ModelDashboard from './pages/ModelDashboard';

// ─── Phase-9 Step-1: Explainability Analytics Dashboard ───
import ExplainabilityAnalytics from './pages/ExplainabilityAnalytics';

// ─── Phase-9 Step-2: Explainability Prediction Explorer ───
import ExplainabilityPredictionExplorer from './pages/ExplainabilityPredictionExplorer';

// ─── Phase-9 Step-3: Explainability Prediction Detail Inspector ───
import ExplainabilityDetail from './pages/ExplainabilityDetail';

// ─── Phase-9 Step-4: Explainability Reporting & Export Center ───
import ExplainabilityReports from './pages/ExplainabilityReports';

// ─── Phase-10 Step-1: Enterprise Model Health Dashboard ───
import ModelHealthDashboard from './pages/ModelHealthDashboard';

// ─── Phase-10 Step-2: Enterprise Data Drift Detection ───
import DataDriftDashboard from './pages/DataDriftDashboard';

// ─── Phase-10 Step-3: Enterprise Feature Drift Analytics ───
import FeatureDriftDashboard from './pages/FeatureDriftDashboard';

// ─── Phase-10 Step-4: Enterprise Confidence Drift Monitoring ───
import ConfidenceDriftDashboard from './pages/ConfidenceDriftDashboard';

// ─── Phase-10 Step-5: Enterprise Retraining Recommendation Engine ───
import RetrainingRecommendationDashboard from './pages/RetrainingRecommendationDashboard';

// ─── Phase-10 Step-6: Enterprise Drift History, Smart Alerts & Monitoring Center ───
import MLOpsMonitoringCenter from './pages/MLOpsMonitoringCenter';

// ─── Phase-11 Step-1: Enterprise AI Operations Command Center ───
import AIOperationsDashboard from './pages/AIOperationsDashboard';

// ─── Phase-11 Step-2: Enterprise Model Deployment Center ───
import ModelDeploymentCenter from './pages/ModelDeploymentCenter';

// ─── Phase-11 Step-3: Enterprise Model Version Comparison Center ───
import ModelComparisonCenter from './pages/ModelComparisonCenter';

// ─── Phase-11 Step-4: Enterprise Experiment Tracking Center ───
import ExperimentTrackingCenter from './pages/ExperimentTrackingCenter';

// ─── Phase-11 Step-5: Enterprise Scheduled Retraining Manager ───
import RetrainingManager from './pages/RetrainingManager';

const App = () => {
  const { isAuthenticated } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  // Layout wrapper for authenticated pages
  const AuthenticatedLayout = ({ children }) => (
    <div className="flex h-screen w-full overflow-hidden bg-surface-950 bg-mesh relative">
      {/* Decorative background blurs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary-500/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

      <Sidebar isOpen={isSidebarOpen} closeSidebar={closeSidebar} />

      <div className="flex flex-1 flex-col h-full w-full overflow-hidden md:pl-0">
        <Navbar toggleSidebar={toggleSidebar} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
        }}
      />

      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          path="/signup"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Signup />}
        />

        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Dashboard />
            </AuthenticatedLayout>
          </ProtectedRoute>
        } />
        <Route path="/predict" element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Predict />
            </AuthenticatedLayout>
          </ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <History />
            </AuthenticatedLayout>
          </ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Analytics />
            </AuthenticatedLayout>
          </ProtectedRoute>
        } />
        <Route path="/disease-detection" element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <DiseaseDetection />
            </AuthenticatedLayout>
          </ProtectedRoute>
        } />
        <Route
          path="/admin/feedback"
          element={
            <ProtectedRoute>
              <AdminOnly>
                <AuthenticatedLayout>
                  <AdminFeedback />
                </AuthenticatedLayout>
              </AdminOnly>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminOnly>
                <AuthenticatedLayout>
                  <AIOperationsDashboard />
                </AuthenticatedLayout>
              </AdminOnly>
            </ProtectedRoute>
          }
        />
        {/* Phase-6 Step-1: Model Registry */}
        <Route
          path="/admin/model-registry"
          element={
            <ProtectedRoute>
              <AdminOnly>
                <AuthenticatedLayout>
                  <ModelRegistry />
                </AuthenticatedLayout>
              </AdminOnly>
            </ProtectedRoute>
          }
        />
        {/* Phase-7 Step-1: Model Performance Dashboard */}
        <Route
          path="/admin/model-performance"
          element={
            <ProtectedRoute>
              <AdminOnly>
                <AuthenticatedLayout>
                  <ModelDashboard />
                </AuthenticatedLayout>
              </AdminOnly>
            </ProtectedRoute>
          }
        />

        {/* Phase-9 Step-1: Explainability Analytics Dashboard */}
        <Route
          path="/admin/explainability"
          element={
            <ProtectedRoute>
              <AdminOnly>
                <AuthenticatedLayout>
                  <ExplainabilityAnalytics />
                </AuthenticatedLayout>
              </AdminOnly>
            </ProtectedRoute>
          }
        />

        {/* Phase-9 Step-2: Explainability Prediction Explorer */}
        <Route
          path="/admin/explainability/predictions"
          element={
            <ProtectedRoute>
              <AdminOnly>
                <AuthenticatedLayout>
                  <ExplainabilityPredictionExplorer />
                </AuthenticatedLayout>
              </AdminOnly>
            </ProtectedRoute>
          }
        />

        {/* Phase-9 Step-3: Explainability Prediction Detail Inspector */}
        <Route
          path="/admin/explainability/details/:predictionId"
          element={
            <ProtectedRoute>
              <AdminOnly>
                <AuthenticatedLayout>
                  <ExplainabilityDetail />
                </AuthenticatedLayout>
              </AdminOnly>
            </ProtectedRoute>
          }
        />

        {/* Phase-9 Step-4: Explainability Reporting & Export Center */}
        <Route
          path="/admin/explainability/reports"
          element={
            <ProtectedRoute>
              <AdminOnly>
                <AuthenticatedLayout>
                  <ExplainabilityReports />
                </AuthenticatedLayout>
              </AdminOnly>
            </ProtectedRoute>
          }
        />

        {/* Phase-10 Step-1: Enterprise Model Health Dashboard */}
        <Route
          path="/admin/model-health"
          element={
            <ProtectedRoute>
              <AdminOnly>
                <AuthenticatedLayout>
                  <ModelHealthDashboard />
                </AuthenticatedLayout>
              </AdminOnly>
            </ProtectedRoute>
          }
        />

        {/* Phase-10 Step-2: Enterprise Data Drift Detection */}
        <Route
          path="/admin/data-drift"
          element={
            <ProtectedRoute>
              <AdminOnly>
                <AuthenticatedLayout>
                  <DataDriftDashboard />
                </AuthenticatedLayout>
              </AdminOnly>
            </ProtectedRoute>
          }
        />

        {/* Phase-10 Step-3: Enterprise Feature Drift Analytics */}
        <Route
          path="/admin/feature-drift"
          element={
            <ProtectedRoute>
              <AdminOnly>
                <AuthenticatedLayout>
                  <FeatureDriftDashboard />
                </AuthenticatedLayout>
              </AdminOnly>
            </ProtectedRoute>
          }
        />

        {/* Phase-10 Step-4: Enterprise Confidence Drift Monitoring */}
        <Route
          path="/admin/confidence-drift"
          element={
            <ProtectedRoute>
              <AdminOnly>
                <AuthenticatedLayout>
                  <ConfidenceDriftDashboard />
                </AuthenticatedLayout>
              </AdminOnly>
            </ProtectedRoute>
          }
        />

        {/* Phase-10 Step-5: Enterprise Retraining Recommendation Engine */}
        <Route
          path="/admin/retraining"
          element={
            <ProtectedRoute>
              <AdminOnly>
                <AuthenticatedLayout>
                  <RetrainingRecommendationDashboard />
                </AuthenticatedLayout>
              </AdminOnly>
            </ProtectedRoute>
          }
        />

        {/* Phase-10 Step-6: Enterprise Drift History, Smart Alerts & Monitoring Center */}
        <Route
          path="/admin/mlops-monitoring"
          element={
            <ProtectedRoute>
              <AdminOnly>
                <AuthenticatedLayout>
                  <MLOpsMonitoringCenter />
                </AuthenticatedLayout>
              </AdminOnly>
            </ProtectedRoute>
          }
        />

        {/* Phase-11 Step-1: Enterprise AI Operations Command Center */}
        <Route
          path="/admin/operations"
          element={
            <ProtectedRoute>
              <AdminOnly>
                <AuthenticatedLayout>
                  <AIOperationsDashboard />
                </AuthenticatedLayout>
              </AdminOnly>
            </ProtectedRoute>
          }
        />

        {/* Phase-11 Step-2: Enterprise Model Deployment Center */}
        <Route
          path="/admin/deployments"
          element={
            <ProtectedRoute>
              <AdminOnly>
                <AuthenticatedLayout>
                  <ModelDeploymentCenter />
                </AuthenticatedLayout>
              </AdminOnly>
            </ProtectedRoute>
          }
        />

        {/* Phase-11 Step-3: Enterprise Model Version Comparison Center */}
        <Route
          path="/admin/model-comparison"
          element={
            <ProtectedRoute>
              <AdminOnly>
                <AuthenticatedLayout>
                  <ModelComparisonCenter />
                </AuthenticatedLayout>
              </AdminOnly>
            </ProtectedRoute>
          }
        />

        {/* Phase-11 Step-4: Enterprise Experiment Tracking Center */}
        <Route
          path="/admin/experiments"
          element={
            <ProtectedRoute>
              <AdminOnly>
                <AuthenticatedLayout>
                  <ExperimentTrackingCenter />
                </AuthenticatedLayout>
              </AdminOnly>
            </ProtectedRoute>
          }
        />

        {/* Phase-11 Step-5: Enterprise Scheduled Retraining Manager */}
        <Route
          path="/admin/retraining-manager"
          element={
            <ProtectedRoute>
              <AdminOnly>
                <AuthenticatedLayout>
                  <RetrainingManager />
                </AuthenticatedLayout>
              </AdminOnly>
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;
