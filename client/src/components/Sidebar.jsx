import React from 'react';
import { useAuth } from '../context/AuthContext';
import { NavLink } from 'react-router-dom';
import { FiHome, FiCrosshair, FiClock, FiPieChart, FiSettings, FiX, FiShield, FiCpu, FiDatabase, FiTrendingUp, FiZap, FiSearch } from 'react-icons/fi';

const Sidebar = ({ isOpen, closeSidebar }) => {
  const { user } = useAuth();

  // ─── Phase-4 Step-2: Only show admin nav item if user is admin ───
  const navItems = [
    { name: 'Dashboard', path: '/', icon: <FiHome className="h-5 w-5" /> },
    { name: 'Predict Crop', path: '/predict', icon: <FiCrosshair className="h-5 w-5" /> },
    { name: 'Disease Detection', path: '/disease-detection', icon: <FiCrosshair className="h-5 w-5" /> }, // Re-using Crosshair or we can add a new icon if imported. Let's use FiCrosshair. Wait, let's just add the route.
    { name: 'History', path: '/history', icon: <FiClock className="h-5 w-5" /> },
    { name: 'Analytics', path: '/analytics', icon: <FiPieChart className="h-5 w-5" /> },
    // ─── Phase-4 Step-2: Admin section ───
    ...(user?.role === "admin"
      ? [
        {
          name: 'MLOps Dashboard',
          path: '/admin/dashboard',
          icon: <FiCpu className="h-5 w-5" />
        },
        // ─── Phase-6 Step-1: Model Registry ───
        {
          name: 'Model Registry',
          path: '/admin/model-registry',
          icon: <FiDatabase className="h-5 w-5" />
        },
        // ─── Phase-7 Step-1: Model Performance Dashboard ───
        {
          name: 'Model Performance',
          path: '/admin/model-performance',
          icon: <FiTrendingUp className="h-5 w-5" />
        },
        // ─── Phase-9 Step-1: Explainability Analytics ───
        {
          name: 'Explainability',
          path: '/admin/explainability',
          icon: <FiZap className="h-5 w-5" />
        },
        // ─── Phase-9 Step-2: Explainability Prediction Explorer ───
        {
          name: 'Prediction Explorer',
          path: '/admin/explainability/predictions',
          icon: <FiSearch className="h-5 w-5" />
        },
        {
          name: 'Admin Review',
          path: '/admin/feedback',
          icon: <FiShield className="h-5 w-5" />
        }
      ]
      : [])
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
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col justify-between glass-card m-4 transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full md:m-0 md:rounded-none md:border-y-0 md:border-l-0 md:bg-transparent md:backdrop-blur-none'
          } ${!isOpen ? 'md:border-r md:border-white/10 md:bg-surface-950/50 md:m-0' : ''}`}
        style={!isOpen ? { margin: 0, borderRadius: 0 } : {}}
      >
        <div className={`p-6 ${!isOpen ? 'md:p-6' : ''}`}>
          <div className="flex items-center justify-between mb-8 md:mb-12">
            <h2 className="text-2xl font-display font-bold">
              <span className="text-primary-400">Agri</span>Sense
            </h2>
            <button onClick={closeSidebar} className="text-gray-400 hover:text-white md:hidden">
              <FiX className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
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
            ))}
          </nav>
        </div>

        <div className={`p-6 ${!isOpen ? 'md:p-6' : ''}`}>
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
