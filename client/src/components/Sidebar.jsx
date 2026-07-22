import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiHome,
  FiZap,
  FiClock,
  FiPieChart,
  FiShield,
  FiX,
  FiSun,
  FiDatabase,
  FiCrosshair,
  FiTrendingUp,
  FiEye,
  FiChevronDown,
  FiChevronRight,
  FiFileText,
  FiHeart,
  FiActivity,
  FiGrid,
  FiPercent,
  FiSliders,
  FiRadio,
  FiTv,
  FiSend,
  FiRepeat,
  FiGitBranch,
  FiCpu,
  FiMessageSquare,
  FiCalendar
} from 'react-icons/fi';

const Sidebar = ({ isOpen, closeSidebar }) => {
  const { user } = useAuth();
  const [explainabilityOpen, setExplainabilityOpen] = useState(false);

  const navigation = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <FiHome className="h-5 w-5" />
    },
    {
      name: 'Crop Prediction',
      path: '/predict',
      icon: <FiZap className="h-5 w-5" />
    },
    {
      name: 'Disease Detection',
      path: '/disease-detection',
      icon: <FiCrosshair className="h-5 w-5" />
    },
    {
      name: 'AI Yield Prediction',
      path: '/yield-prediction',
      icon: <FiTrendingUp className="h-5 w-5" />
    },
    {
      name: 'AI Assistant',
      path: '/assistant',
      icon: <FiMessageSquare className="h-5 w-5" />
    },
    {
      name: 'Disease Heatmap',
      path: '/disease-heatmap',
      icon: <FiCrosshair className="h-5 w-5" />
    },
    {
      name: 'Smart Crop Calendar',
      path: '/crop-calendar',
      icon: <FiCalendar className="h-5 w-5" />
    },
    {
      name: 'Prediction History',
      path: '/history',
      icon: <FiClock className="h-5 w-5" />
    },
    {
      name: 'Analytics',
      path: '/analytics',
      icon: <FiPieChart className="h-5 w-5" />
    },
    ...(user?.role === 'admin'
      ? [
        // ─── Phase-11 Step-1: Enterprise AI Operations Dashboard ───
        {
          name: 'AI Operations',
          path: '/admin/operations',
          icon: <FiTv className="h-5 w-5" />
        },
        // ─── Phase-11 Step-2: Enterprise Model Deployment Center ───
        {
          name: 'Model Deployment',
          path: '/admin/deployments',
          icon: <FiSend className="h-5 w-5" />
        },
        // ─── Phase-6 Step-1: Model Registry ───
        {
          name: 'Model Registry',
          path: '/admin/model-registry',
          icon: <FiDatabase className="h-5 w-5" />
        },
        // ─── Phase-11 Step-3: Enterprise Model Version Comparison Center ───
        {
          name: 'Model Comparison',
          path: '/admin/model-comparison',
          icon: <FiSliders className="h-5 w-5" />
        },
        // ─── Phase-11 Step-4: Enterprise Experiment Tracking Center ───
        {
          name: 'Experiment Tracking',
          path: '/admin/experiments',
          icon: <FiActivity className="h-5 w-5" />
        },
        // ─── Phase-11 Step-5: Enterprise Scheduled Retraining Manager ───
        {
          name: 'Retraining Manager',
          path: '/admin/retraining-manager',
          icon: <FiRepeat className="h-5 w-5" />
        },
        // ─── Phase-11 Step-6: Enterprise Automated ML Pipeline Orchestrator ───
        {
          name: 'Pipeline Orchestrator',
          path: '/admin/pipeline-orchestrator',
          icon: <FiGitBranch className="h-5 w-5" />
        },
        // ─── Phase-11 Step-7: Enterprise AI Governance & Compliance Center ───
        {
          name: 'Governance',
          path: '/admin/governance',
          icon: <FiShield className="h-5 w-5" />
        },
        // ─── Phase-12 Step-7: Enterprise Observability & Monitoring Center ───
        {
          name: 'Observability',
          path: '/admin/observability',
          icon: <FiCpu className="h-5 w-5" />
        },
        // ─── Phase-7 Step-1: Model Performance Dashboard ───
        {
          name: 'Model Performance',
          path: '/admin/model-performance',
          icon: <FiTrendingUp className="h-5 w-5" />
        },
        // ─── Phase-10 Step-1: Model Health Dashboard ───
        {
          name: 'Model Health',
          path: '/admin/model-health',
          icon: <FiHeart className="h-5 w-5" />
        },
        // ─── Phase-10 Step-2: Data Drift Detection ───
        {
          name: 'Data Drift',
          path: '/admin/data-drift',
          icon: <FiActivity className="h-5 w-5" />
        },
        // ─── Phase-10 Step-3: Feature Drift Analytics ───
        {
          name: 'Feature Drift',
          path: '/admin/feature-drift',
          icon: <FiGrid className="h-5 w-5" />
        },
        // ─── Phase-10 Step-4: Confidence Drift Monitoring ───
        {
          name: 'Confidence Drift',
          path: '/admin/confidence-drift',
          icon: <FiPercent className="h-5 w-5" />
        },
        // ─── Phase-10 Step-5: Retraining Recommendation Engine ───
        {
          name: 'Retraining Recommendation',
          path: '/admin/retraining',
          icon: <FiSliders className="h-5 w-5" />
        },
        // ─── Phase-10 Step-6: Monitoring Center ───
        {
          name: 'Monitoring Center',
          path: '/admin/mlops-monitoring',
          icon: <FiRadio className="h-5 w-5" />
        },
        // ─── Phase-9 Step-4: Explainability submenu placeholder ───
        {
          name: '__EXPLAINABILITY_SUBMENU__',
          isSubmenu: true
        },
        {
          name: 'Admin Review',
          path: '/admin/feedback',
          icon: <FiShield className="h-5 w-5" />
        }
      ]
      : [])
  ];

  const explainabilityItems = [
    {
      name: 'Analytics Overview',
      path: '/admin/explainability',
      icon: <FiTrendingUp className="h-4 w-4" />
    },
    {
      name: 'Prediction Explorer',
      path: '/admin/explainability/predictions',
      icon: <FiEye className="h-4 w-4" />
    },
    {
      name: 'Export Reports',
      path: '/admin/explainability/reports',
      icon: <FiFileText className="h-4 w-4" />
    }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 transform bg-surface-900 border-r border-white/5 p-4 transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col justify-between">
          <div>
            {/* Logo */}
            <div className="flex items-center justify-between mb-8 px-2 pt-2">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary-600 to-primary-400 text-slate-950 shadow-glow">
                  <FiSun className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-lg font-bold font-display text-white tracking-wide">
                    Crop AI
                  </h1>
                  <p className="text-[10px] text-primary-400 font-mono tracking-widest uppercase">
                    Platform
                  </p>
                </div>
              </div>

              {/* Close button for mobile */}
              <button
                onClick={closeSidebar}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-white/5 hover:text-white md:hidden"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation links */}
            <nav className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-200px)] custom-scrollbar pr-1">
              {navigation.map((item, index) => {
                if (item.isSubmenu) {
                  return (
                    <div key={`submenu-${index}`} className="space-y-1">
                      <button
                        onClick={() => setExplainabilityOpen(!explainabilityOpen)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-all"
                      >
                        <div className="flex items-center space-x-3">
                          <FiEye className="h-5 w-5 text-secondary-400" />
                          <span>Explainability</span>
                        </div>
                        {explainabilityOpen ? (
                          <FiChevronDown className="h-4 w-4" />
                        ) : (
                          <FiChevronRight className="h-4 w-4" />
                        )}
                      </button>

                      {explainabilityOpen && (
                        <div className="pl-6 space-y-1 mt-1">
                          {explainabilityItems.map((subItem) => (
                            <NavLink
                              key={subItem.path}
                              to={subItem.path}
                              onClick={closeSidebar}
                              className={({ isActive }) =>
                                `flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                  isActive
                                    ? 'bg-secondary-500/10 text-secondary-400 border border-secondary-500/20'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`
                              }
                            >
                              {subItem.icon}
                              <span>{subItem.name}</span>
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={closeSidebar}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-primary-500/20 to-primary-500/5 text-primary-400 border border-primary-500/30 font-semibold shadow-glow-sm'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span className="truncate">{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* User badge at bottom */}
          <div className="border-t border-white/5 pt-4 px-2">
            <div className="flex items-center space-x-3 rounded-xl bg-white/[0.02] p-2 border border-white/5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-800 text-gray-300 font-bold border border-white/10 font-mono text-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-semibold text-white truncate">
                  {user?.name || 'User'}
                </p>
                <div className="flex items-center space-x-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  <p className="text-[10px] text-gray-400 capitalize font-mono">
                    {user?.role || 'Farmer'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
