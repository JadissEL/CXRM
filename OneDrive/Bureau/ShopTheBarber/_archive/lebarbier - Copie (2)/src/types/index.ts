// Core Types
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar_url?: string;
  role: 'customer' | 'barber' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar_url?: string;
  preferences?: UserPreferences;
  privacy_settings?: PrivacySettings;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  language: string;
  timezone: string;
  theme: 'light' | 'dark' | 'system';
}

export interface PrivacySettings {
  profile_visibility: 'public' | 'private' | 'friends';
  show_phone: boolean;
  show_email: boolean;
  allow_messages: boolean;
}

// Barber Types
export interface Barber {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  review_count: number;
  services: string[];
  availability: Availability;
  description?: string;
  images?: string[];
  social_links?: SocialLinks;
  created_at: string;
  updated_at: string;
}

export interface Availability {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

export interface TimeSlot {
  start: string; // HH:mm format
  end: string; // HH:mm format
  available: boolean;
}

export interface SocialLinks {
  website?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
}

// Service Types
export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // minutes
  category: string;
  barber_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
  services: Service[];
}

// Appointment Types
export interface Appointment {
  id: string;
  user_id: string;
  barber_id: string;
  service_id: string;
  date: string; // YYYY-MM-DD format
  time: string; // HH:mm format
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  notes?: string;
  total_price: number;
  created_at: string;
  updated_at: string;
  
  // Relations
  user?: User;
  barber?: Barber;
  service?: Service;
}

export interface AppointmentRequest {
  barber_id: string;
  service_id: string;
  date: string;
  time: string;
  notes?: string;
}

// Search Types
export interface SearchFilters {
  location?: string;
  radius?: number; // km
  services?: string[];
  price_range?: {
    min: number;
    max: number;
  };
  rating?: number;
  availability?: {
    date: string;
    time: string;
  };
  sort_by?: 'distance' | 'rating' | 'price' | 'name';
  sort_order?: 'asc' | 'desc';
}

export interface SearchResult {
  barbers: Barber[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// API Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

// Form Types
export interface BookingFormData {
  barber_id: string;
  service_id: string;
  date: string;
  time: string;
  notes?: string;
}

export interface ProfileFormData {
  name: string;
  email: string;
  phone?: string;
  avatar?: File;
}

export interface SearchFormData {
  location: string;
  service?: string;
  date?: string;
  time?: string;
}

// Notification Types
export interface Notification {
  id: string;
  user_id: string;
  type: 'appointment_reminder' | 'booking_confirmation' | 'cancellation' | 'system';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  status?: number;
}

// Utility Types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Component Props Types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export interface CardProps extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

// Map Types
export interface MapLocation {
  lat: number;
  lng: number;
  address: string;
}

export interface MapMarker {
  id: string;
  position: MapLocation;
  title: string;
  info?: string;
}

// File Upload Types
export interface FileUpload {
  file: File;
  preview?: string;
  progress?: number;
  error?: string;
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Cache Types
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Analytics Types
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

// Feature Flags
export interface FeatureFlags {
  enableNotifications: boolean;
  enableAdvancedSearch: boolean;
  enableMultiServiceBooking: boolean;
  enableReviews: boolean;
  enablePayments: boolean;
} 