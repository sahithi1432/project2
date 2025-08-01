import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import Alert from '../components/Alert';
import { getAlertDuration } from '../config/environment.js';

const AlertContext = createContext();

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);

  const showAlert = useCallback(({ type = 'info', message, duration = getAlertDuration() }) => {
    const id = Date.now() + Math.random();
    const newAlert = { id, type, message, duration };
    
    setAlerts(prev => [...prev, newAlert]);
    
    return id;
  }, []);

  const hideAlert = useCallback((id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  }, []);

  const showSuccess = useCallback((message, duration) => {
    return showAlert({ type: 'success', message, duration });
  }, [showAlert]);

  const showError = useCallback((message, duration) => {
    return showAlert({ type: 'error', message, duration });
  }, [showAlert]);

  const showWarning = useCallback((message, duration) => {
    return showAlert({ type: 'warning', message, duration });
  }, [showAlert]);

  const showInfo = useCallback((message, duration) => {
    return showAlert({ type: 'info', message, duration });
  }, [showAlert]);

  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Listen for custom showAlert events (used by API service for auth errors)
  useEffect(() => {
    const handleShowAlert = (event) => {
      const { type, message, duration } = event.detail;
      showAlert({ type, message, duration });
    };

    document.addEventListener('showAlert', handleShowAlert);

    return () => {
      document.removeEventListener('showAlert', handleShowAlert);
    };
  }, [showAlert]);

  const value = {
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideAlert,
    clearAllAlerts,
    alerts
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
      <div className="alert-container">
        {alerts.map((alert) => (
          <Alert
            key={alert.id}
            type={alert.type}
            message={alert.message}
            duration={alert.duration}
            onClose={() => hideAlert(alert.id)}
          />
        ))}
      </div>
    </AlertContext.Provider>
  );
}; 