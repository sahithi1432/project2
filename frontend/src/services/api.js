import { getApiUrl } from '../config/environment.js';

const API_BASE_URL = getApiUrl();

// Helper function to get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function to set auth headers
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: getAuthHeaders(),
    });

    // Check if response has content
    const text = await response.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      data = {};
    }

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Auth API functions
export const authAPI = {
  signup: async (userData) => {
    return apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  login: async (credentials) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  verifyPassword: async (password) => {
    return apiRequest('/auth/verify-password', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  },

  sendOtp: async (email) => {
    return apiRequest('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  verifyOtp: async (email, otp) => {
    return apiRequest('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  resetPassword: async (email, otp, newPassword) => {
    return apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword }),
    });
  },
};

// Wall Designs API functions
export const wallAPI = {
  saveDesign: async (designData) => {
    return apiRequest('/wall/save', {
      method: 'POST',
      body: JSON.stringify(designData),
    });
  },

  getUserDesigns: async (userId) => {
    return apiRequest(`/wall/user/${userId}`);
  },

  getDesign: async (designId) => {
    return apiRequest(`/wall/${designId}`);
  },

  updateDesign: async (designId, designData) => {
    return apiRequest(`/wall/${designId}`, {
      method: 'PUT',
      body: JSON.stringify(designData),
    });
  },

  deleteDesign: async (designId) => {
    return apiRequest(`/wall/${designId}`, {
      method: 'DELETE',
    });
  },

  getAllDesigns: async () => {
    return apiRequest('/wall');
  },

  generateShareToken: async (designId) => {
    return apiRequest(`/wall/${designId}/share`, {
      method: 'POST',
    });
  },
  getDesignByToken: async (token) => {
    const res = await fetch(`${getApiUrl()}/wall/shared/${token}`);
    if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch shared altar');
    return res.json();
  },
  setAltarPublic: async (altarId, isPublic) => {
    return apiRequest(`/wall/${altarId}/public`, {
      method: 'PUT',
      body: JSON.stringify({ public: isPublic })
    });
  },
  generateEditToken: async (designId) => {
    return apiRequest(`/wall/${designId}/edit-share`, {
      method: 'POST',
    });
  },
  getDesignByEditToken: async (editToken) => {
    const res = await fetch(`${getApiUrl()}/wall/edit/${editToken}`);
    if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch altar by edit token');
    return res.json();
  },
  updateDesignByEditToken: async (editToken, designData) => {
    const res = await fetch(`${getApiUrl()}/wall/edit/${editToken}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(designData)
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Failed to update altar by edit token');
    return res.json();
  },
};

// Health check
export const healthCheck = async () => {
  return apiRequest('/health');
};

export const userAPI = {
  updateProfile: async (userId, data) => {
    return apiRequest(`/auth/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  changePassword: async (currentPassword, newPassword) => {
    return apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  },
  updateProfilePhoto: async (userId, photo) => {
    return apiRequest(`/auth/users/${userId}/photo`, {
      method: 'PUT',
      body: JSON.stringify({ profile_photo: photo })
    });
  },
  getNotificationPreferences: async () => {
    return apiRequest('/auth/notification-preferences');
  },
  updateNotificationPreferences: async (notificationsEnabled) => {
    return apiRequest('/auth/notification-preferences', {
      method: 'PUT',
      body: JSON.stringify({ notificationsEnabled })
    });
  },
  getProfilePrivacy: async () => {
    return apiRequest('/auth/profile-privacy');
  },
  updateProfilePrivacy: async (profilePublic) => {
    return apiRequest('/auth/profile-privacy', {
      method: 'PUT',
      body: JSON.stringify({ profilePublic })
    });
  },
};

export const subscriptionAPI = {
  getSubscription: async () => {
    return apiRequest('/auth/subscription');
  },
  subscribe: async (plan) => {
    return apiRequest('/auth/subscribe', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    });
  },
  unsubscribe: async () => {
    return apiRequest('/auth/unsubscribe', {
      method: 'POST',
    });
  },
};

export const billingAPI = {
  getHistory: async () => {
    return apiRequest('/auth/billing-history');
  },
};

export const adminAPI = {
  getAllUsers: async () => {
    return apiRequest('/auth/users');
  },
  getAllBillingHistory: async () => {
    return apiRequest('/auth/all-billing-history');
  },
  grantFreeSubscription: async (userId, plan) => {
    // Call subscribe endpoint as the user, but with amount: 0
    return apiRequest('/auth/subscribe', {
      method: 'POST',
      body: JSON.stringify({ plan, amount: 0, userId }),
    });
  },
}; 