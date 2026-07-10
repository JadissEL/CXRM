/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

const API_BASE_URL = 'http://localhost:3001/api';

// Helper function to make API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur de requête');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Authentication API
export const authAPI = {
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    city?: string;
    address?: string;
    role: 'client' | 'barber' | 'admin';
  }) => apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),

  login: (credentials: { email: string; password: string }) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
};

// Services API
export const servicesAPI = {
  getAll: () => apiCall('/services'),
};

// Barbers API
export const barbersAPI = {
  getAll: (filters?: {
    services?: string[];
    location?: string;
    locationType?: 'home' | 'shop' | 'both';
  }) => {
    const params = new URLSearchParams();
    if (filters?.services) params.append('services', filters.services.join(','));
    if (filters?.location) params.append('location', filters.location);
    if (filters?.locationType) params.append('locationType', filters.locationType);
    
    return apiCall(`/barbers?${params.toString()}`);
  },

  getById: (id: number) => apiCall(`/barbers/${id}`),
};

// Appointments API
export const appointmentsAPI = {
  create: (appointmentData: {
    barberId: number;
    services: number[];
    date: string;
    time: string;
    locationType: 'shop' | 'home';
    address?: string;
    notes?: string;
  }) => apiCall('/appointments', {
    method: 'POST',
    body: JSON.stringify(appointmentData),
  }),

  getAll: () => apiCall('/appointments'),

  cancel: (id: number) => apiCall(`/appointments/${id}/cancel`, {
    method: 'PUT',
  }),
};

// Reviews API
export const reviewsAPI = {
  create: (reviewData: {
    appointmentId: number;
    barberId: number;
    rating: number;
    comment?: string;
  }) => apiCall('/reviews', {
    method: 'POST',
    body: JSON.stringify(reviewData),
  }),
};

// Favorites API
export const favoritesAPI = {
  add: (barberId: number) => apiCall('/favorites', {
    method: 'POST',
    body: JSON.stringify({ barberId }),
  }),

  remove: (barberId: number) => apiCall(`/favorites/${barberId}`, {
    method: 'DELETE',
  }),

  getAll: () => apiCall('/favorites'),
};

// Notifications API
export const notificationsAPI = {
  getAll: () => apiCall('/notifications'),

  markAsRead: (id: number) => apiCall(`/notifications/${id}/read`, {
    method: 'PUT',
  }),
};

// Profile API
export const profileAPI = {
  get: () => apiCall('/profile'),

  update: (profileData: {
    firstName: string;
    lastName: string;
    phone?: string;
    city?: string;
    address?: string;
  }) => apiCall('/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  }),
};

// Barber Profile API
export const barberProfileAPI = {
  create: (profileData: {
    name: string;
    salon_name: string;
    description: string;
    location: string;
    accepts_home: boolean;
    accepts_shop: boolean;
    services: Array<{
      serviceId: number;
      price: number;
    }>;
  }) => apiCall('/barber-profile', {
    method: 'POST',
    body: JSON.stringify(profileData),
  }),
};

// Settings API
export const settingsAPI = {
  // Client settings
  getClientSettings: () => apiCall('/settings'),
  
  updateClientSettings: (settings: {
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
      booking_reminders: boolean;
      promotional_emails: boolean;
    };
    privacy: {
      profile_visibility: 'public' | 'friends' | 'private';
      show_phone: boolean;
      show_email: boolean;
      allow_reviews: boolean;
      allow_contact: boolean;
    };
    app: {
      theme: 'dark' | 'light' | 'auto';
      language: 'fr' | 'en' | 'ar';
      timezone: string;
      currency: string;
      date_format: string;
      time_format: '12h' | '24h';
    };
  }) => apiCall('/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  }),

  // Barber settings
  getBarberSettings: () => apiCall('/barber-settings'),
  
  updateBarberSettings: (settings: {
    barberProfile?: {
      salonName: string;
      description: string;
      location: string;
      acceptsHome: boolean;
      acceptsShop: boolean;
    };
    business: {
      auto_accept_bookings: boolean;
      require_deposit: boolean;
      deposit_percentage: number;
      cancellation_policy: string;
      allow_walk_ins: boolean;
    };
    notifications: {
      booking_requests: boolean;
      booking_reminders: boolean;
      review_notifications: boolean;
      new_client_alerts: boolean;
    };
  }) => apiCall('/barber-settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  }),

  // Admin settings
  getAdminSettings: () => apiCall('/admin-settings'),
  
  updateAdminSettings: (settings: {
    system: {
      maintenance_mode: boolean;
      registration_enabled: boolean;
      email_verification: boolean;
      max_login_attempts: number;
      session_timeout: number;
    };
    security: {
      two_factor_auth: boolean;
      brute_force_protection: boolean;
      rate_limiting: boolean;
    };
    moderation: {
      auto_moderation: boolean;
      profanity_filter: boolean;
      review_threshold: number;
    };
  }) => apiCall('/admin-settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  }),

  // Change password
  changePassword: (passwords: {
    currentPassword: string;
    newPassword: string;
  }) => apiCall('/change-password', {
    method: 'PUT',
    body: JSON.stringify(passwords),
  }),
};

// Analytics API
export const analyticsAPI = {
  // Overview analytics
  getOverview: () => apiCall('/analytics/overview'),
  
  // Revenue analytics
  getRevenue: (period: 'monthly' | 'weekly' = 'monthly') => 
    apiCall(`/analytics/revenue?period=${period}`),
  
  // Appointment analytics
  getAppointments: (params?: {
    status?: string;
    period?: 'monthly' | 'daily';
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.period) searchParams.append('period', params.period);
    
    return apiCall(`/analytics/appointments?${searchParams.toString()}`);
  },
  
  // Performance analytics
  getPerformance: () => apiCall('/analytics/performance'),
};

// Utility functions
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
};

export const setAuthToken = (token: string, userId: number) => {
  localStorage.setItem('token', token);
  localStorage.setItem('userId', userId.toString());
};
