// App Configuration
export const APP_CONFIG = {
  name: 'ShopTheBarber',
  description: 'Find Your Perfect Barber',
  version: '1.0.0',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
} as const;

// API Configuration
export const API_CONFIG = {
  baseUrl: '/api',
  timeout: 10000,
  retries: 3,
} as const;

// Database Configuration
export const DB_CONFIG = {
  tables: {
    profiles: 'profiles',
    barbers: 'barbers',
    appointments: 'appointments',
    services: 'services',
  },
} as const;

// Authentication Configuration
export const AUTH_CONFIG = {
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  refreshThreshold: 5 * 60 * 1000, // 5 minutes
} as const;

// Booking Configuration
export const BOOKING_CONFIG = {
  maxAdvanceDays: 30,
  minAdvanceHours: 2,
  slotDuration: 30, // minutes
  maxServicesPerBooking: 5,
} as const;

// Search Configuration
export const SEARCH_CONFIG = {
  maxDistance: 50, // km
  defaultRadius: 10, // km
  maxResults: 50,
} as const;

// Notification Configuration
export const NOTIFICATION_CONFIG = {
  reminderHours: [24, 2], // hours before appointment
  maxRetries: 3,
} as const;

// File Upload Configuration
export const UPLOAD_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxFiles: 1,
} as const;

// Pagination Configuration
export const PAGINATION_CONFIG = {
  defaultPageSize: 10,
  maxPageSize: 100,
  defaultPage: 1,
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
  ttl: 5 * 60, // 5 minutes
  maxSize: 100,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  generic: 'Something went wrong. Please try again.',
  network: 'Network error. Please check your connection.',
  unauthorized: 'You are not authorized to perform this action.',
  notFound: 'The requested resource was not found.',
  validation: 'Please check your input and try again.',
  server: 'Server error. Please try again later.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  profileUpdated: 'Profile updated successfully.',
  appointmentBooked: 'Appointment booked successfully.',
  appointmentCancelled: 'Appointment cancelled successfully.',
  dataExported: 'Data exported successfully.',
  accountDeleted: 'Account deleted successfully.',
} as const;

// Status Codes
export const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Appointment Status
export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  NO_SHOW: 'no_show',
} as const;

// Service Categories
export const SERVICE_CATEGORIES = {
  HAIRCUT: 'haircut',
  SHAVE: 'shave',
  STYLING: 'styling',
  COLORING: 'coloring',
  TREATMENT: 'treatment',
  OTHER: 'other',
} as const;

// User Roles
export const USER_ROLES = {
  CUSTOMER: 'customer',
  BARBER: 'barber',
  ADMIN: 'admin',
} as const;

// Privacy Settings
export const PRIVACY_SETTINGS = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  FRIENDS: 'friends',
} as const; 