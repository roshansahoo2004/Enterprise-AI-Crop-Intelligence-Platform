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
                  <AdminDashboard />
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

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;
