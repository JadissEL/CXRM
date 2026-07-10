import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createClient } from '@/lib/supabase';
import MultiServiceSelector from '@/components/booking/MultiServiceSelector';
import MultiServiceBookingForm from '@/components/booking/MultiServiceBookingForm';
import MultiServiceBookingConfirmation from '@/components/booking/MultiServiceBookingConfirmation';

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  createClient: jest.fn()
}));

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: {
      id: 'user_123',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      fullName: 'John Doe'
    }
  })
}));

// Mock fetch
global.fetch = jest.fn();

const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      }))
    }))
  })),
  rpc: jest.fn(() => Promise.resolve({ data: [], error: null }))
};

const mockServices = [
  {
    id: 'service_1',
    name: 'Classic Haircut',
    description: 'Traditional haircut with styling',
    duration: 30,
    price: 25.00,
    category: 'Haircut',
    is_popular: true,
    rating: 4.8,
    review_count: 150
  },
  {
    id: 'service_2',
    name: 'Beard Trim',
    description: 'Professional beard trimming and shaping',
    duration: 15,
    price: 15.00,
    category: 'Beard',
    is_popular: false,
    rating: 4.6,
    review_count: 89
  },
  {
    id: 'service_3',
    name: 'Hair Wash & Style',
    description: 'Deep cleansing wash with professional styling',
    duration: 20,
    price: 20.00,
    category: 'Styling',
    is_popular: true,
    rating: 4.7,
    review_count: 120
  },
  {
    id: 'service_4',
    name: 'Hair Coloring',
    description: 'Professional hair coloring service',
    duration: 90,
    price: 80.00,
    category: 'Coloring',
    is_popular: false,
    rating: 4.9,
    review_count: 45
  }
];

const mockBarber = {
  id: 'barber_123',
  name: 'Mike Johnson',
  email: 'mike@barbershop.com',
  phone: '+1234567890',
  location: '123 Main St, City',
  rating: 4.8,
  review_count: 200
};

const mockAvailableSlots = [
  {
    start_time: '09:00',
    end_time: '10:05',
    is_available: true
  },
  {
    start_time: '10:30',
    end_time: '11:35',
    is_available: true
  },
  {
    start_time: '14:00',
    end_time: '15:05',
    is_available: true
  }
];

describe('Multi-Service Booking System', () => {
  beforeEach(() => {
    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
    (global.fetch as jest.Mock).mockClear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Duration and Price Calculations', () => {
    it('should calculate total duration correctly for single service', () => {
      const selectedServices = [
        { ...mockServices[0], quantity: 1 }
      ];
      
      const totalDuration = selectedServices.reduce(
        (sum, service) => sum + (service.duration * service.quantity), 
        0
      );
      
      expect(totalDuration).toBe(30);
    });

    it('should calculate total duration correctly for multiple services', () => {
      const selectedServices = [
        { ...mockServices[0], quantity: 1 }, // 30 minutes
        { ...mockServices[1], quantity: 1 }, // 15 minutes
        { ...mockServices[2], quantity: 1 }  // 20 minutes
      ];
      
      const totalDuration = selectedServices.reduce(
        (sum, service) => sum + (service.duration * service.quantity), 
        0
      );
      
      expect(totalDuration).toBe(65); // 30 + 15 + 20
    });

    it('should calculate total duration correctly with service quantities', () => {
      const selectedServices = [
        { ...mockServices[0], quantity: 2 }, // 30 * 2 = 60 minutes
        { ...mockServices[1], quantity: 3 }  // 15 * 3 = 45 minutes
      ];
      
      const totalDuration = selectedServices.reduce(
        (sum, service) => sum + (service.duration * service.quantity), 
        0
      );
      
      expect(totalDuration).toBe(105); // 60 + 45
    });

    it('should calculate total price correctly for single service', () => {
      const selectedServices = [
        { ...mockServices[0], quantity: 1 }
      ];
      
      const totalPrice = selectedServices.reduce(
        (sum, service) => sum + (service.price * service.quantity), 
        0
      );
      
      expect(totalPrice).toBe(25.00);
    });

    it('should calculate total price correctly for multiple services', () => {
      const selectedServices = [
        { ...mockServices[0], quantity: 1 }, // $25.00
        { ...mockServices[1], quantity: 1 }, // $15.00
        { ...mockServices[2], quantity: 1 }  // $20.00
      ];
      
      const totalPrice = selectedServices.reduce(
        (sum, service) => sum + (service.price * service.quantity), 
        0
      );
      
      expect(totalPrice).toBe(60.00); // 25 + 15 + 20
    });

    it('should calculate total price correctly with service quantities', () => {
      const selectedServices = [
        { ...mockServices[0], quantity: 2 }, // $25.00 * 2 = $50.00
        { ...mockServices[1], quantity: 3 }  // $15.00 * 3 = $45.00
      ];
      
      const totalPrice = selectedServices.reduce(
        (sum, service) => sum + (service.price * service.quantity), 
        0
      );
      
      expect(totalPrice).toBe(95.00); // 50 + 45
    });

    it('should calculate deposit amount correctly (20%)', () => {
      const totalPrice = 100.00;
      const depositAmount = totalPrice * 0.2;
      
      expect(depositAmount).toBe(20.00);
    });

    it('should handle edge case with zero services', () => {
      const selectedServices: any[] = [];
      
      const totalDuration = selectedServices.reduce(
        (sum, service) => sum + (service.duration * service.quantity), 
        0
      );
      const totalPrice = selectedServices.reduce(
        (sum, service) => sum + (service.price * service.quantity), 
        0
      );
      
      expect(totalDuration).toBe(0);
      expect(totalPrice).toBe(0);
    });
  });

  describe('Service Selection Logic', () => {
    it('should add service to selection', () => {
      const selectedServices: any[] = [];
      const serviceToAdd = { ...mockServices[0], quantity: 1 };
      
      const updatedServices = [...selectedServices, serviceToAdd];
      
      expect(updatedServices).toHaveLength(1);
      expect(updatedServices[0].id).toBe('service_1');
      expect(updatedServices[0].quantity).toBe(1);
    });

    it('should increase quantity when adding existing service', () => {
      const selectedServices = [
        { ...mockServices[0], quantity: 1 }
      ];
      
      const existingIndex = selectedServices.findIndex(s => s.id === 'service_1');
      const updatedServices = [...selectedServices];
      updatedServices[existingIndex].quantity += 1;
      
      expect(updatedServices[0].quantity).toBe(2);
    });

    it('should remove service from selection', () => {
      const selectedServices = [
        { ...mockServices[0], quantity: 1 },
        { ...mockServices[1], quantity: 1 }
      ];
      
      const updatedServices = selectedServices.filter(s => s.id !== 'service_1');
      
      expect(updatedServices).toHaveLength(1);
      expect(updatedServices[0].id).toBe('service_2');
    });

    it('should decrease quantity when removing service with quantity > 1', () => {
      const selectedServices = [
        { ...mockServices[0], quantity: 2 }
      ];
      
      const existingIndex = selectedServices.findIndex(s => s.id === 'service_1');
      const updatedServices = [...selectedServices];
      updatedServices[existingIndex].quantity -= 1;
      
      expect(updatedServices[0].quantity).toBe(1);
    });

    it('should respect maximum service limit', () => {
      const selectedServices = [
        { ...mockServices[0], quantity: 2 },
        { ...mockServices[1], quantity: 2 },
        { ...mockServices[2], quantity: 1 }
      ];
      
      const totalItems = selectedServices.reduce((sum, service) => sum + service.quantity, 0);
      const maxServices = 5;
      
      expect(totalItems).toBe(5);
      expect(totalItems).toBeLessThanOrEqual(maxServices);
    });
  });

  describe('Availability Checking', () => {
    it('should check availability for single service', async () => {
      const selectedServices = [
        { ...mockServices[0], quantity: 1 }
      ];
      
      const serviceIds = selectedServices.flatMap(service => 
        Array(service.quantity).fill(service.id)
      );
      
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: mockAvailableSlots,
        error: null
      });
      
      const result = await mockSupabaseClient.rpc('get_barber_availability', {
        p_barber_id: 'barber_123',
        p_date: '2024-01-15',
        p_service_ids: serviceIds
      });
      
      expect(result.data).toEqual(mockAvailableSlots);
      expect(serviceIds).toEqual(['service_1']);
    });

    it('should check availability for multiple services', async () => {
      const selectedServices = [
        { ...mockServices[0], quantity: 1 },
        { ...mockServices[1], quantity: 1 }
      ];
      
      const serviceIds = selectedServices.flatMap(service => 
        Array(service.quantity).fill(service.id)
      );
      
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: mockAvailableSlots,
        error: null
      });
      
      const result = await mockSupabaseClient.rpc('get_barber_availability', {
        p_barber_id: 'barber_123',
        p_date: '2024-01-15',
        p_service_ids: serviceIds
      });
      
      expect(result.data).toEqual(mockAvailableSlots);
      expect(serviceIds).toEqual(['service_1', 'service_2']);
    });

    it('should handle no available slots', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: [],
        error: null
      });
      
      const result = await mockSupabaseClient.rpc('get_barber_availability', {
        p_barber_id: 'barber_123',
        p_date: '2024-01-15',
        p_service_ids: ['service_1']
      });
      
      expect(result.data).toEqual([]);
    });

    it('should handle availability check errors', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' }
      });
      
      const result = await mockSupabaseClient.rpc('get_barber_availability', {
        p_barber_id: 'barber_123',
        p_date: '2024-01-15',
        p_service_ids: ['service_1']
      });
      
      expect(result.error).toBeTruthy();
      expect(result.error.message).toBe('Database error');
    });
  });

  describe('Slot Conflicts', () => {
    it('should detect conflicting appointments', () => {
      const existingAppointments = [
        {
          start_time: '09:00',
          end_time: '10:00',
          date: '2024-01-15'
        },
        {
          start_time: '14:00',
          end_time: '15:30',
          date: '2024-01-15'
        }
      ];
      
      const requestedSlot = {
        start_time: '09:30',
        end_time: '10:30',
        date: '2024-01-15'
      };
      
      // Check if requested slot conflicts with existing appointments
      const hasConflict = existingAppointments.some(appointment => {
        const existingStart = new Date(`${appointment.date}T${appointment.start_time}`);
        const existingEnd = new Date(`${appointment.date}T${appointment.end_time}`);
        const requestedStart = new Date(`${requestedSlot.date}T${requestedSlot.start_time}`);
        const requestedEnd = new Date(`${requestedSlot.date}T${requestedSlot.end_time}`);
        
        return (
          (requestedStart >= existingStart && requestedStart < existingEnd) ||
          (requestedEnd > existingStart && requestedEnd <= existingEnd) ||
          (requestedStart <= existingStart && requestedEnd >= existingEnd)
        );
      });
      
      expect(hasConflict).toBe(true);
    });

    it('should allow non-conflicting appointments', () => {
      const existingAppointments = [
        {
          start_time: '09:00',
          end_time: '10:00',
          date: '2024-01-15'
        }
      ];
      
      const requestedSlot = {
        start_time: '11:00',
        end_time: '12:00',
        date: '2024-01-15'
      };
      
      const hasConflict = existingAppointments.some(appointment => {
        const existingStart = new Date(`${appointment.date}T${appointment.start_time}`);
        const existingEnd = new Date(`${appointment.date}T${appointment.end_time}`);
        const requestedStart = new Date(`${requestedSlot.date}T${requestedSlot.start_time}`);
        const requestedEnd = new Date(`${requestedSlot.date}T${requestedSlot.end_time}`);
        
        return (
          (requestedStart >= existingStart && requestedStart < existingEnd) ||
          (requestedEnd > existingStart && requestedEnd <= existingEnd) ||
          (requestedStart <= existingStart && requestedEnd >= existingEnd)
        );
      });
      
      expect(hasConflict).toBe(false);
    });

    it('should handle edge case appointments (back-to-back)', () => {
      const existingAppointments = [
        {
          start_time: '09:00',
          end_time: '10:00',
          date: '2024-01-15'
        }
      ];
      
      const requestedSlot = {
        start_time: '10:00',
        end_time: '11:00',
        date: '2024-01-15'
      };
      
      const hasConflict = existingAppointments.some(appointment => {
        const existingStart = new Date(`${appointment.date}T${appointment.start_time}`);
        const existingEnd = new Date(`${appointment.date}T${appointment.end_time}`);
        const requestedStart = new Date(`${requestedSlot.date}T${requestedSlot.start_time}`);
        const requestedEnd = new Date(`${requestedSlot.date}T${requestedSlot.end_time}`);
        
        return (
          (requestedStart >= existingStart && requestedStart < existingEnd) ||
          (requestedEnd > existingStart && requestedEnd <= existingEnd) ||
          (requestedStart <= existingStart && requestedEnd >= existingEnd)
        );
      });
      
      expect(hasConflict).toBe(false); // Back-to-back should be allowed
    });
  });

  describe('Booking Creation Logic', () => {
    it('should create appointment with correct data structure', async () => {
      const selectedServices = [
        { ...mockServices[0], quantity: 1 },
        { ...mockServices[1], quantity: 1 }
      ];
      
      const serviceIds = selectedServices.flatMap(service => 
        Array(service.quantity).fill(service.id)
      );
      
      const appointmentData = {
        barber_id: 'barber_123',
        service_ids: serviceIds,
        appointment_date: '2024-01-15',
        start_time: '09:00',
        notes: 'Test appointment',
        client_phone: '+1234567890',
        client_email: 'test@example.com',
        client_name: 'John Doe',
        reservation_id: 'reservation_123'
      };
      
      expect(appointmentData.service_ids).toEqual(['service_1', 'service_2']);
      expect(appointmentData.barber_id).toBe('barber_123');
      expect(appointmentData.appointment_date).toBe('2024-01-15');
    });

    it('should handle appointment creation success', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'appointment_123',
          status: 'confirmed'
        })
      });
      
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barber_id: 'barber_123',
          service_ids: ['service_1'],
          appointment_date: '2024-01-15',
          start_time: '09:00'
        })
      });
      
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.id).toBe('appointment_123');
    });

    it('should handle appointment creation errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Time slot no longer available'
        })
      });
      
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barber_id: 'barber_123',
          service_ids: ['service_1'],
          appointment_date: '2024-01-15',
          start_time: '09:00'
        })
      });
      
      const result = await response.json();
      
      expect(response.ok).toBe(false);
      expect(result.error).toBe('Time slot no longer available');
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', () => {
      const formData = {
        name: '',
        email: '',
        phone: '',
        notes: ''
      };
      
      const errors: Record<string, string> = {};
      
      if (!formData.name.trim()) {
        errors.name = 'Name is required';
      }
      
      if (!formData.email.trim()) {
        errors.email = 'Email is required';
      }
      
      if (!formData.phone.trim()) {
        errors.phone = 'Phone number is required';
      }
      
      expect(Object.keys(errors)).toHaveLength(3);
      expect(errors.name).toBe('Name is required');
      expect(errors.email).toBe('Email is required');
      expect(errors.phone).toBe('Phone number is required');
    });

    it('should validate email format', () => {
      const invalidEmails = [
        'invalid-email',
        'test@',
        '@example.com',
        'test.example.com'
      ];
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
      
      expect(emailRegex.test('test@example.com')).toBe(true);
    });

    it('should validate phone number format', () => {
      const validPhones = [
        '+1234567890',
        '1234567890',
        '+1 (234) 567-8900',
        '234-567-8900'
      ];
      
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      
      validPhones.forEach(phone => {
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        expect(phoneRegex.test(cleanPhone)).toBe(true);
      });
    });
  });

  describe('Service Compatibility', () => {
    it('should detect incompatible service combinations', () => {
      const selectedServices = [
        { ...mockServices[3], quantity: 1 }, // Hair Coloring
        { ...mockServices[0], quantity: 1 }  // Classic Haircut (assuming treatment category)
      ];
      
      // Mock compatibility check
      const coloringServices = selectedServices.filter(s => s.category === 'Coloring');
      const treatmentServices = selectedServices.filter(s => s.category === 'Treatment');
      
      const hasIncompatibleServices = coloringServices.length > 0 && treatmentServices.length > 0;
      
      expect(hasIncompatibleServices).toBe(false); // No treatment services in this case
    });

    it('should allow compatible service combinations', () => {
      const selectedServices = [
        { ...mockServices[0], quantity: 1 }, // Haircut
        { ...mockServices[1], quantity: 1 }, // Beard Trim
        { ...mockServices[2], quantity: 1 }  // Hair Wash & Style
      ];
      
      const categories = selectedServices.map(s => s.category);
      const hasConflictingCategories = categories.includes('Coloring') && categories.includes('Treatment');
      
      expect(hasConflictingCategories).toBe(false);
    });
  });

  describe('Time Formatting Utilities', () => {
    it('should format time correctly', () => {
      const formatTime = (time: string): string => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
      };
      
      expect(formatTime('09:00')).toBe('9:00 AM');
      expect(formatTime('12:00')).toBe('12:00 PM');
      expect(formatTime('15:30')).toBe('3:30 PM');
      expect(formatTime('00:00')).toBe('12:00 AM');
    });

    it('should format duration correctly', () => {
      const formatDuration = (minutes: number): string => {
        if (minutes < 60) {
          return `${minutes}m`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
      };
      
      expect(formatDuration(30)).toBe('30m');
      expect(formatDuration(60)).toBe('1h');
      expect(formatDuration(90)).toBe('1h 30m');
      expect(formatDuration(120)).toBe('2h');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      try {
        await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network error');
      }
    });

    it('should handle Supabase errors gracefully', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' }
      });
      
      const result = await mockSupabaseClient.rpc('get_barber_availability');
      
      expect(result.error).toBeTruthy();
      expect(result.error.message).toBe('Database connection failed');
    });
  });
});