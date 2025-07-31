// Error handling utility for user-friendly messages
export const getErrorMessage = (error) => {
  // Handle different types of errors
  if (typeof error === 'string') {
    return error;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.message) {
    return error.message;
  }

  // Network errors
  if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network Error')) {
    return 'Network connection error. Please check your internet connection and try again.';
  }

  // HTTP status errors
  if (error?.response?.status) {
    const status = error.response.status;
    switch (status) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Your session has expired. Please log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This resource already exists. Please try a different option.';
      case 422:
        return 'Invalid data provided. Please check your input and try again.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Please try again later.';
      case 502:
        return 'Service temporarily unavailable. Please try again later.';
      case 503:
        return 'Service is under maintenance. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  // File upload errors
  if (error?.message?.includes('file')) {
    return 'File upload failed. Please check the file size and format, then try again.';
  }

  // Validation errors
  if (error?.message?.includes('validation')) {
    return 'Please check your input and ensure all required fields are filled correctly.';
  }

  // Authentication errors
  if (error?.message?.includes('auth') || error?.message?.includes('login')) {
    return 'Authentication failed. Please check your credentials and try again.';
  }

  // Default error message
  return 'Something went wrong. Please try again.';
};

// Success messages for different actions
export const getSuccessMessage = (action) => {
  const messages = {
    login: 'Successfully logged in!',
    logout: 'Successfully logged out.',
    signup: 'Account created successfully! Please check your email for verification.',
    passwordReset: 'Password reset email sent. Please check your inbox.',
    passwordChange: 'Password changed successfully!',
    profileUpdate: 'Profile updated successfully!',
    altarSave: 'Altar saved successfully!',
    altarDelete: 'Altar deleted successfully!',
    imageUpload: 'Image uploaded successfully!',
    subscriptionUpdate: 'Subscription updated successfully!',
    paymentSuccess: 'Payment processed successfully!',
    emailSent: 'Email sent successfully!',
    dataSaved: 'Data saved successfully!',
    settingsUpdated: 'Settings updated successfully!'
  };

  return messages[action] || 'Action completed successfully!';
};

// Warning messages
export const getWarningMessage = (action) => {
  const messages = {
    sessionExpiring: 'Your session will expire soon. Please save your work.',
    unsavedChanges: 'You have unsaved changes. Please save before leaving.',
    largeFile: 'Large file detected. Upload may take a few moments.',
    slowConnection: 'Slow connection detected. Please be patient.',
    browserCompatibility: 'Some features may not work optimally in your browser.',
    storageLimit: 'You are approaching your storage limit.',
    subscriptionExpiring: 'Your subscription will expire soon. Please renew to continue.',
    maintenanceMode: 'System maintenance in progress. Some features may be temporarily unavailable.'
  };

  return messages[action] || 'Please note this important information.';
};

// Info messages
export const getInfoMessage = (action) => {
  const messages = {
    loading: 'Loading... Please wait.',
    processing: 'Processing your request...',
    uploading: 'Uploading file...',
    saving: 'Saving changes...',
    connecting: 'Connecting to server...',
    syncing: 'Syncing data...',
    checking: 'Checking for updates...',
    initializing: 'Initializing application...'
  };

  return messages[action] || 'Please wait while we process your request.';
};

// Error categories for better handling
export const categorizeError = (error) => {
  if (error?.response?.status === 401) {
    return 'AUTHENTICATION';
  }
  
  if (error?.response?.status >= 500) {
    return 'SERVER';
  }
  
  if (error?.response?.status >= 400) {
    return 'CLIENT';
  }
  
  if (error?.message?.includes('Network')) {
    return 'NETWORK';
  }
  
  return 'UNKNOWN';
}; 