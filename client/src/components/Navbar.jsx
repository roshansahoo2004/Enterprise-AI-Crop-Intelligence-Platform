import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { FiMenu, FiBell, FiUser, FiLogOut, FiCheck, FiCheckCircle, FiTrash2, FiCloud, FiActivity, FiTrendingUp, FiMessageSquare, FiShield, FiInbox } from 'react-icons/fi';

// ─── Notification type icon/color mapping ─────────────────────────────────
const NOTIF_TYPE_MAP = {
  weather:   { icon: FiCloud,         color: 'text-sky-400',     bg: 'bg-sky-500/10',     border: 'border-sky-500/20' },
  disease:   { icon: FiActivity,      color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/20' },
  yield:     { icon: FiTrendingUp,    color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  assistant: { icon: FiMessageSquare, color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20' },
  admin:     { icon: FiShield,        color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
};

const getNotifMeta = (type) => NOTIF_TYPE_MAP[type] || NOTIF_TYPE_MAP.assistant;

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();

  // ─── Notification dropdown state ──────────────────────────────────────
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  // ─── Profile dropdown state ─────────────────────────────────────────
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setNotifOpen(false);
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

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
        {/* ─── Notification Bell ──────────────────────────────────────── */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((prev) => !prev)}
            className="relative rounded-full p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Notifications"
          >
            <FiBell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-[10px] font-bold text-white shadow-lg shadow-rose-500/30 ring-2 ring-surface-900">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* ─── Notification Dropdown Panel ─────────────────────────── */}
          {notifOpen && (
            <div className="absolute right-0 top-full mt-3 w-96 max-w-[calc(100vw-2rem)] rounded-2xl border border-white/10 bg-surface-900/95 shadow-2xl shadow-black/40 backdrop-blur-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <FiBell className="h-4 w-4 text-primary-400" />
                  <h3 className="text-sm font-bold font-display text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-primary-500/15 border border-primary-500/25 px-2 py-0.5 text-[10px] font-mono font-bold text-primary-400">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-gray-400 transition-colors hover:bg-white/5 hover:text-primary-400"
                      title="Mark all as read"
                    >
                      <FiCheckCircle className="h-3 w-3" /> Mark all
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
                      title="Clear all notifications"
                    >
                      <FiTrash2 className="h-3 w-3" /> Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Notification List */}
              <div className="max-h-80 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  // ─── Empty State ─────────────────────────────────────
                  <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
                      <FiInbox className="h-7 w-7 text-gray-500" />
                    </div>
                    <p className="text-sm font-semibold text-gray-400">All caught up!</p>
                    <p className="mt-1 text-xs text-gray-500 font-mono">No notifications at this time.</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const meta = getNotifMeta(notif.type);
                    const IconComp = meta.icon;
                    return (
                      <div
                        key={notif.id}
                        onClick={() => !notif.read && markAsRead(notif.id)}
                        className={`flex cursor-pointer items-start gap-3.5 border-b border-white/5 px-5 py-4 transition-all hover:bg-white/[0.03] ${
                          !notif.read ? 'bg-primary-500/[0.03]' : ''
                        }`}
                      >
                        {/* Type Icon */}
                        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.bg} border ${meta.border}`}>
                          <IconComp className={`h-4 w-4 ${meta.color}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-xs font-semibold truncate ${!notif.read ? 'text-white' : 'text-gray-300'}`}>
                              {notif.title}
                            </p>
                            {!notif.read && (
                              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary-400 shadow-lg shadow-primary-400/30" />
                            )}
                          </div>
                          <p className="mt-0.5 text-[11px] leading-relaxed text-gray-400 line-clamp-2">
                            {notif.message}
                          </p>
                          <p className="mt-1.5 text-[10px] font-mono text-gray-500">{notif.time}</p>
                        </div>

                        {/* Mark as read button */}
                        {!notif.read && (
                          <button
                            onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                            className="mt-1 shrink-0 rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-white/5 hover:text-primary-400"
                            title="Mark as read"
                          >
                            <FiCheck className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="h-8 w-px bg-white/10"></div>
        
        <div className="relative flex items-center gap-3" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex items-center gap-3 rounded-xl p-1 transition-colors hover:bg-white/5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-500/20">
              <span className="font-bold text-white">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
            </div>
            <div className="hidden flex-col sm:flex text-left">
              <span className="text-sm font-semibold text-white">{user?.name || 'User'}</span>
              <span className="text-xs text-gray-400">Farmer</span>
            </div>
          </button>
          
          {/* Profile Dropdown */}
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-white/10 bg-surface-900/95 p-2 shadow-xl backdrop-blur-xl z-50">
              <div className="mb-2 border-b border-white/10 px-4 py-2 pb-3">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="truncate text-xs text-gray-400">{user?.email}</p>
              </div>
              <button
                onClick={() => { setProfileOpen(false); navigate('/profile'); }}
                className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <FiUser className="h-4 w-4" /> Profile
              </button>
              <button 
                onClick={() => { setProfileOpen(false); logout(); }}
                className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
              >
                <FiLogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
