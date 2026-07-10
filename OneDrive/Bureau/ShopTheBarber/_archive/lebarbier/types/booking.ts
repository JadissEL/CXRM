/**
 * Booking-related type definitions for the barbershop application
 */

export interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  category: string;
  description?: string;
}

export interface SelectedService extends Service {
  quantity: number;
}

export interface Barber {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  barber_profiles: {
    business_name: string;
    phone?: string;
    bio?: string;
    specialties?: string[];
    rating?: number;
    total_reviews?: number;
    offers_home_visits?: boolean;
  };
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
  travel_time_before?: number;
  travel_time_after?: number;
}

export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
}

export interface BookingData {
  barberId: string;
  serviceIds: string[];
  date: string;
  startTime: string;
  endTime: string;
  locationType: 'shop' | 'home';
  serviceAddress?: string;
  serviceLatitude?: number;
  serviceLongitude?: number;
  notes?: string;
  contactInfo: ContactInfo;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export type LocationType = 'shop' | 'home';

export interface EnhancedBookingFormProps {
  barber: Barber;
  selectedDate: string;
  onBookingComplete: (appointmentId: string) => void;
  onBack: () => void;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AppointmentResponse {
  appointment: {
    id: string;
    barber_id: string;
    client_id: string;
    service_ids: string[];
    appointment_date: string;
    start_time: string;
    end_time: string;
    location_type: LocationType;
    service_address?: string;
    service_latitude?: number;
    service_longitude?: number;
    notes?: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    total_price: number;
    deposit_amount: number;
    travel_fee?: number;
    created_at: string;
    updated_at: string;
  };
}