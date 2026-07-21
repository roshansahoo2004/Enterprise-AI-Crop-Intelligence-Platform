import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { NavLink, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiCrosshair,
  FiClock,
  FiPieChart,
  FiSettings,
  FiX,
  FiShield,
  FiCpu,
  FiDatabase,
  FiTrendingUp,
  FiZap,
  FiSearch,
  FiChevronDown,
  FiBarChart2,
  FiFileText,
  FiHeart,
  FiActivity,
  FiGrid,
  FiPercent,
  FiSliders,
  FiRadio,
  FiTv,
  FiSend,
  FiRepeat
} from 'react-icons/fi';

const Sidebar = ({ isOpen, closeSidebar }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [explainabilityOpen, setExplainabilityOpen] = useState(
    location.pathname.startsWith('/admin/explainability')
  );

  // ─── Phase-4 Step-2: Only show admin nav item if user is admin ───
  const navItems = [
    { name: 'Dashboard', path: '/', icon: <FiHome className="h-5 w-5" /> },
    { name: 'Predict Crop', path: '/predict', icon: <FiCrosshair className="h-5 w-5" /> },
    { name: 'Disease Detection', path: '/disease-detection', icon: <FiCrosshair className="h-5 w-5" /> },
    { name: 'History', path: '/history', icon: <FiClock className="h-5 w-5" /> },
    { name: 'Analytics', path: '/analytics', icon: <FiPieChart className="h-5 w-5" /> },
    // ─── Phase-4 Step-2: Admin section ───
    ...(user?.role === "admin"
      ? [
        // ─── Phase-11 Step-1: AI Operations Command Center ───
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
        // ─── Phase-9 Step-4: Explainability submenu placeholder (rendered separately) ───
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

  // ─── Phase-9 Step-4: Explainability sub-navigation items ───
  const explainabilitySubItems = [
    {
      name: 'Analytics',
      path: '/admin/explainability',
      icon: <FiBarChart2 className="h-4 w-4" />
    },
    {
      name: 'Prediction Explorer',
      path: '/admin/explainability/predictions',
      icon: <FiSearch className="h-4 w-4" />
    },
    {
      name: 'Reports',
      path: '/admin/explainability/reports',
      icon: <FiFileText className="h-4 w-4" />
    }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-72 flex-col glass-card m-4 transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full md:m-0 md:rounded-none md:border-y-0 md:border-l-0 md:bg-transparent md:backdrop-blur-none'
          } ${!isOpen ? 'md:border-r md:border-white/10 md:bg-surface-950/50 md:m-0' : ''}`}
        style={!isOpen ? { margin: 0, borderRadius: 0 } : {}}
      >
        <div className={`flex-1 overflow-y-auto p-6 ${!isOpen ? 'md:p-6' : ''}`}>
          <div className="flex items-center justify-between mb-8 md:mb-12">
            <h2 className="text-2xl font-display font-bold">
              <span className="text-primary-400">Agri</span>Sense
            </h2>
            <button onClick={closeSidebar} className="text-gray-400 hover:text-white md:hidden">
              <FiX className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              // ─── Phase-9 Step-4: Render Explainability submenu ───
              if (item.isSubmenu) {
                const isAnySubActive = location.pathname.startsWith('/admin/explainability');
                return (
                  <div key="explainability-submenu">
                    <button
                      onClick={() => setExplainabilityOpen(!explainabilityOpen)}
                      className={`w-full flex items-center justify-between gap-4 rounded-xl px-4 py-3 transition-all duration-300 ${isAnySubActive
                        ? 'bg-gradient-to-r from-primary-500/20 to-transparent text-primary-400 shadow-[inset_2px_0_0_0_#10b981]'
                        : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                        }`}
                    >
                      <div className="flex items-center gap-4">
                        <FiZap className="h-5 w-5" />
                        <span className="font-medium">Explainability</span>
                      </div>
                      <FiChevronDown className={`h-4 w-4 transition-transform duration-300 ${explainabilityOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ${explainabilityOpen ? 'max-h-48 mt-1' : 'max-h-0'}`}>
                      <div className="ml-4 pl-4 border-l border-white/10 flex flex-col gap-1">
                        {explainabilitySubItems.map((sub) => (
                          <NavLink
                            key={sub.name}
                            to={sub.path}
                            end={sub.path === '/admin/explainability'}
                            onClick={closeSidebar}
                            className={({ isActive }) =>
                              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-300 ${isActive
                                ? 'text-primary-400 bg-primary-500/10'
                                : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
                              }`
                            }
                          >
                            {sub.icon}
                            <span className="font-medium">{sub.name}</span>
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={closeSidebar}
                  className={({ isActive }) =>
                    `flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-300 ${isActive
                      ? 'bg-gradient-to-r from-primary-500/20 to-transparent text-primary-400 shadow-[inset_2px_0_0_0_#10b981]'
                      : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                    }`
                  }
                >
                  {item.icon}
                  <span className="font-medium">{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className={`mt-auto p-6 ${!isOpen ? 'md:p-6' : ''}`}>
          <div className="rounded-xl border border-white/5 bg-white/5 p-4 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary-500/20 rounded-full blur-2xl group-hover:bg-primary-500/30 transition-all"></div>
            <h3 className="font-medium text-white mb-1 relative z-10">Pro Plan</h3>
            <p className="text-xs text-gray-400 mb-3 relative z-10">Get unlimited predictions</p>
            <button className="w-full rounded-lg bg-primary-500/20 py-2 text-xs font-semibold text-primary-400 transition-colors hover:bg-primary-500/30 relative z-10">
              Upgrade Now
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
