import React from 'react';
import { useAuth } from '../context/AuthContext';
import { FiMenu, FiBell, FiUser, FiLogOut } from 'react-icons/fi';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();

  return (
    <nav className="glass-card sticky top-0 z-40 mx-4 mt-4 flex h-20 items-center justify-between px-6 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white md:hidden"
        >
          <FiMenu className="h-6 w-6" />
        </button>
        <div className="flex flex-col">
          <h1 className="text-xl font-display font-bold text-white hidden sm:block">
            AI Crop <span className="gradient-text">Planner</span>
          </h1>
          <span className="text-xs text-gray-400 hidden sm:block">Intelligent Agriculture System</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative rounded-full p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white">
          <FiBell className="h-5 w-5" />
          <span className="pulse-dot"></span>
        </button>
        
        <div className="h-8 w-px bg-white/10"></div>
        
        <div className="group relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-500/20">
            <span className="font-bold text-white">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
          </div>
          <div className="hidden flex-col sm:flex">
            <span className="text-sm font-semibold text-white">{user?.name || 'User'}</span>
            <span className="text-xs text-gray-400">Farmer</span>
          </div>
          
          {/* Dropdown on hover */}
          <div className="absolute right-0 top-full mt-2 hidden w-48 rounded-xl border border-white/10 bg-surface-900/95 p-2 shadow-xl backdrop-blur-xl group-hover:block">
            <div className="mb-2 border-b border-white/10 px-4 py-2 pb-3">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="truncate text-xs text-gray-400">{user?.email}</p>
            </div>
            <button className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
              <FiUser className="h-4 w-4" /> Profile
            </button>
            <button 
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <FiLogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
