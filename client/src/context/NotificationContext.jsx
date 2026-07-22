import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

const INITIAL_NOTIFICATIONS = [
  {
    id: 'n1',
    type: 'weather',
    title: 'High Heatwave Warning',
    message: 'Temperatures expected to exceed 38°C in North Zone. Increase irrigation frequency.',
    time: '10 mins ago',
    read: false
  },
  {
    id: 'n2',
    type: 'disease',
    title: 'Disease Diagnostic Ready',
    message: 'Tomato Early Blight scan complete. Recommended treatment strategy available.',
    time: '45 mins ago',
    read: false
  },
  {
    id: 'n3',
    type: 'yield',
    title: 'Yield Prediction Updated',
    message: 'Wheat crop yield forecast computed: 4.8 tons/hectare (+12% vs baseline).',
    time: '2 hours ago',
    read: false
  },
  {
    id: 'n4',
    type: 'assistant',
    title: 'Groq AI Advisor Tip',
    message: 'Optimal nitrogen fertilizer application window opens tomorrow for Maize fields.',
    time: '5 hours ago',
    read: true
  },
  {
    id: 'n5',
    type: 'admin',
    title: 'Model Registry Deployment',
    message: 'EfficientNet-v2 model deployed to active production environment (v2.4.1).',
    time: '1 day ago',
    read: true
  }
];

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('app_notifications');
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('app_notifications', JSON.stringify(notifications));
    } catch {
      // ignore quota storage errors
    }
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const addNotification = (item) => {
    const newNotif = {
      id: 'n_' + Date.now(),
      time: 'Just now',
      read: false,
      ...item
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearAll,
        addNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
