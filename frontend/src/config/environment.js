// Environment configuration for the frontend
export const config = {
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  
  // App Configuration
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Altar Creation App',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // Alert Configuration
  ALERT_DURATION: parseInt(import.meta.env.VITE_ALERT_DURATION) || 5000,
  
  // Development Configuration
  DEV_MODE: import.meta.env.VITE_DEV_MODE === 'true' || import.meta.env.DEV,
  
  // Feature Flags
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  ENABLE_NOTIFICATIONS: import.meta.env.VITE_ENABLE_NOTIFICATIONS !== 'false',
};

// Helper function to get API URL
export const getApiUrl = () => config.API_BASE_URL;

// Helper function to get alert duration
export const getAlertDuration = () => config.ALERT_DURATION;

// Helper function to check if in development mode
export const isDevelopment = () => config.DEV_MODE; 