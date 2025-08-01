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
        return 'You have been logged out due to inactivity. Please log in again to continue.';
      case 403:
        return 'Your session has expired. Please log in again to continue.';
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

  // Authentication errors - check for specific authentication-related messages
  if (error?.message?.includes('auth') || 
      error?.message?.includes('login') || 
      error?.message?.includes('token') ||
      error?.message?.includes('expired') ||
      error?.message?.includes('inactivity')) {
    return 'You have been logged out due to inactivity. Please log in again to continue.';
  }

  // Default error message
  return 'Something went wrong. Please try again.';
};



 