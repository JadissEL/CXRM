// Service Types
export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
  image_url?: string;
  is_popular?: boolean;
  rating?: number;
  review_count?: number;
}

export interface SelectedService extends Service {
  quantity: number;
}

// Barber Types
export interface Barber {
  id: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  avatar_url?: string;
  image_url?: string;
  rating?: number;
  review_count?: number;
  location?: string;
  barber_profiles?: {
    business_name?: string;
    rating?: number;
    total_reviews?: number;
    phone?: string;
    // Add other fields as needed
  };
}

// Time Slot Types
export interface TimeSlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
  price: number;
  duration: number;
  travel_time_before?: number;
}

// Contact Information
export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
}

// Booking Data
export interface BookingData {
  barber_id: string;
  service_ids: string[];
  date: string;
  start_time: string;
  end_time: string;
  location_type: 'shop' | 'home' | 'mobile';
  service_address?: string;
  coordinates?: Coordinates;
  notes?: string;
  contact_info: ContactInfo;
}

// Coordinates
export interface Coordinates {
  lat: number;
  lng: number;
}

// Location Type
export type LocationType = 'shop' | 'home';

// Enhanced Booking Form Props
export interface EnhancedBookingFormProps {
  barber: Barber;
  selectedDate: Date;
  onBookingComplete: (appointmentId: string) => void;
  onBack: () => void;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AppointmentResponse {
  appointment_id: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  total_price: number;
  deposit_amount: number;
  remaining_balance: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
} 