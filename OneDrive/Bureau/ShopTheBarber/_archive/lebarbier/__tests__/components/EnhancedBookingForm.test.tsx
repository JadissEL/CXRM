import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, jest, beforeEach, afterEach, vi } from '@jest/globals';
import type { MockedFunction } from 'vitest';
import { format, parseISO } from 'date-fns';
import EnhancedBookingForm from '@/components/booking/EnhancedBookingForm';
import type { Barber, Service, TimeSlot } from '@/types/booking';

// Mock Clerk with enhanced user data
jest.mock('@clerk/nextjs', () => ({
  useUser: jest.fn(() => ({
    user: {
      id: 'user_123',
      fullName: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      emailAddresses: [{ 
        id: 'email_123',
        emailAddress: 'john@example.com',
        verification: { status: 'verified' }
      }],
      phoneNumbers: [{
        id: 'phone_123',
        phoneNumber: '+1234567890'
      }],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15')
    },
    isLoaded: true,
    isSignedIn: true
  })),
}));

// Mock date-fns with comprehensive formatting
jest.mock('date-fns', () => ({
  __esModule: true,
  format: jest.fn((date: Date | number | string, formatStr: string) => {
    const testDate = new Date('2024-01-15T10:00:00');
    switch (formatStr) {
      case 'EEEE, MMMM d, yyyy': return 'Monday, January 15, 2024';
      case 'h:mm a': return '10:00 AM';
      case 'yyyy-MM-dd': return '2024-01-15';
      case 'HH:mm': return '10:00';
      default: return '10:00 AM';
    }
  }),
  parseISO: jest.fn((dateStr: string) => new Date(dateStr)),
  isValid: jest.fn(() => true),
  addMinutes: jest.fn((date: Date, minutes: number) => new Date(date.getTime() + minutes * 60000)),
}));

// Mock components with enhanced functionality
jest.mock('@/components/booking/MultiServiceSelector', () => {
  return function MockMultiServiceSelector({ 
    onSelectionChange, 
    selectedServices = [],
    disabled = false 
  }: any) {
    return (
      <div data-testid="multi-service-selector" aria-label="Service Selection">
        <div data-testid="selected-services-count">
          Selected: {selectedServices.length} services
        </div>
        <button
          data-testid="select-haircut"
          onClick={() => onSelectionChange([
            { 
              id: 'service_1', 
              name: 'Haircut', 
              duration: 60, 
              price: 50, 
              category: 'Hair', 
              quantity: 1,
              description: 'Professional haircut and styling'
            }
          ])}
          disabled={disabled}
        >
          Select Haircut
        </button>
        <button
          data-testid="select-beard-trim"
          onClick={() => onSelectionChange([
            { 
              id: 'service_2', 
              name: 'Beard Trim', 
              duration: 30, 
              price: 25, 
              category: 'Beard', 
              quantity: 1,
              description: 'Beard trimming and shaping'
            }
          ])}
          disabled={disabled}
        >
          Select Beard Trim
        </button>
        <button
          data-testid="select-multiple-services"
          onClick={() => onSelectionChange([
            { id: 'service_1', name: 'Haircut', duration: 60, price: 50, category: 'Hair', quantity: 1 },
            { id: 'service_2', name: 'Beard Trim', duration: 30, price: 25, category: 'Beard', quantity: 1 }
          ])}
          disabled={disabled}
        >
          Select Multiple Services
        </button>
      </div>
    );
  };
});

jest.mock('@/components/booking/LocationSelector', () => {
  return function MockLocationSelector({ 
    onLocationChange, 
    onTravelFeeChange, 
    onValidationChange,
    onCoordinatesChange,
    onAddressChange,
    selectedLocation = 'shop',
    disabled = false
  }: any) {
    return (
      <div data-testid="location-selector" aria-label="Location Selection">
        <div data-testid="current-location">
          Current: {selectedLocation}
        </div>
        <button
          data-testid="select-home-visit"
          onClick={() => {
            onLocationChange('home');
            onAddressChange('123 Main St, City, State 12345');
            onCoordinatesChange({ lat: 40.7128, lng: -74.0060 });
            onTravelFeeChange(25);
            onValidationChange(true);
          }}
          disabled={disabled}
        >
          Select Home Visit
        </button>
        <button
          data-testid="select-shop-visit"
          onClick={() => {
            onLocationChange('shop');
            onAddressChange('');
            onCoordinatesChange(null);
            onTravelFeeChange(0);
            onValidationChange(true);
          }}
          disabled={disabled}
        >
          Select Shop Visit
        </button>
        <button
          data-testid="trigger-location-error"
          onClick={() => {
            onValidationChange(false);
          }}
          disabled={disabled}
        >
          Trigger Location Error
        </button>
      </div>
    );
  };
});

// Enhanced fetch mock with comprehensive API responses
interface MockApiResponse {
  ok: boolean;
  status: number;
  statusText: string;
  json: () => Promise<any>;
  text: () => Promise<string>;
  headers: Headers;
}

const createMockResponse = (data: any, options: { ok?: boolean; status?: number } = {}): MockApiResponse => ({
  ok: options.ok ?? true,
  status: options.status ?? 200,
  statusText: options.ok !== false ? 'OK' : 'Error',
  headers: new Headers({ 'Content-Type': 'application/json' }),
  json: async () => data,
  text: async () => JSON.stringify(data),
});

// Mock data for consistent testing
const mockServices: Service[] = [
  { 
    id: 'service_1', 
    name: 'Haircut', 
    duration: 60, 
    price: 50, 
    category: 'Hair',
    description: 'Professional haircut and styling'
  },
  { 
    id: 'service_2', 
    name: 'Beard Trim', 
    duration: 30, 
    price: 25, 
    category: 'Beard',
    description: 'Beard trimming and shaping'
  },
  { 
    id: 'service_3', 
    name: 'Hair Wash', 
    duration: 15, 
    price: 15, 
    category: 'Hair',
    description: 'Professional hair washing'
  },
];

const mockTimeSlots: TimeSlot[] = [
  { start_time: '09:00', end_time: '10:00', is_available: true },
  { start_time: '10:00', end_time: '11:00', is_available: true },
  { start_time: '11:00', end_time: '12:00', is_available: true },
  { start_time: '14:00', end_time: '15:00', is_available: true },
  { start_time: '15:00', end_time: '16:00', is_available: false },
  { start_time: '16:00', end_time: '17:00', is_available: true },
];

const mockFetch = jest.fn<Promise<MockApiResponse>, [RequestInfo | URL, RequestInit?]>();

// Set up default fetch behavior
const setupMockFetch = () => {
  mockFetch.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    const method = init?.method || 'GET';
    
    // Services API
    if (url.includes('/api/services')) {
      return createMockResponse({ services: mockServices });
    }
    
    // Availability API
    if (url.includes('/api/availability')) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      const locationType = urlParams.get('locationType') || 'shop';
      
      // Add travel time for home visits
      const slots = locationType === 'home' 
        ? mockTimeSlots.map(slot => ({ ...slot, travel_time_before: 15 }))
        : mockTimeSlots;
        
      return createMockResponse({ slots });
    }
    
    // Appointments API
    if (url.includes('/api/appointments') && method === 'POST') {
      const body = init?.body ? JSON.parse(init.body as string) : {};
      return createMockResponse({
        appointment: { 
          id: 'apt_123',
          barberId: body.barberId,
          date: body.date,
          startTime: body.startTime,
          endTime: body.endTime,
          status: 'confirmed'
        },
        totalPrice: body.locationType === 'home' ? 75 : 50,
        travelFee: body.locationType === 'home' ? 25 : 0,
        basePrice: 50,
        depositAmount: body.locationType === 'home' ? 15 : 10
      });
    }
    
    // Default fallback
    return createMockResponse({ error: 'Not found' }, { ok: false, status: 404 });
  });
};

global.fetch = mockFetch as unknown as typeof fetch;

describe('EnhancedBookingForm - Comprehensive Test Suite', () => {
  const mockBarber: Barber = {
    id: 'barber_123',
    name: 'John Smith',
    email: 'john.smith@example.com',
    avatar_url: 'https://example.com/avatar.jpg',
    barber_profiles: {
      business_name: 'John\'s Barbershop',
      phone: '555-0123',
      bio: 'Professional barber with 10 years experience',
      specialties: ['Haircuts', 'Beard Trimming', 'Styling'],
      rating: 4.8,
      total_reviews: 127,
      offers_home_visits: true,
    },
  };

  const defaultProps = {
    barber: mockBarber,
    selectedDate: '2024-01-15',
    onBookingComplete: jest.fn(),
    onBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setupMockFetch();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Helper functions for common test operations
  const selectService = async (user: ReturnType<typeof userEvent.setup>, serviceName: string = 'Haircut') => {
    const button = screen.getByTestId(`select-${serviceName.toLowerCase().replace(' ', '-')}`);
    await user.click(button);
  };

  const selectTimeSlot = async (user: ReturnType<typeof userEvent.setup>, time: string = '10:00 AM') => {
    await waitFor(() => {
      expect(screen.getByText(time)).toBeInTheDocument();
    });
    await user.click(screen.getByText(time));
  };

  const selectLocation = async (user: ReturnType<typeof userEvent.setup>, locationType: 'home' | 'shop' = 'shop') => {
    const button = screen.getByTestId(`select-${locationType}-visit`);
    await user.click(button);
  };

  const fillContactInfo = async (user: ReturnType<typeof userEvent.setup>, overrides: Partial<{ phone: string; notes: string }> = {}) => {
    if (overrides.phone) {
      const phoneInput = screen.getByLabelText('Phone Number');
      await user.clear(phoneInput);
      await user.type(phoneInput, overrides.phone);
    }
    if (overrides.notes) {
      const notesInput = screen.getByLabelText('Special Requests or Notes');
      await user.clear(notesInput);
      await user.type(notesInput, overrides.notes);
    }
  };

  const submitBooking = async (user: ReturnType<typeof userEvent.setup>) => {
    const submitButton = screen.getByRole('button', { name: /Book Appointment/i });
    await user.click(submitButton);
  };

  describe('Component Rendering', () => {
    it('should render all barber information and booking details', async () => {
      render(<EnhancedBookingForm {...defaultProps} />);

      // Header information
      expect(screen.getByText('Book Appointment')).toBeInTheDocument();
      expect(screen.getByText('John\'s Barbershop • Monday, January 15, 2024')).toBeInTheDocument();
      
      // Barber information card
      expect(screen.getByText('Your Barber')).toBeInTheDocument();
      expect(screen.getByText('John\'s Barbershop')).toBeInTheDocument();
      expect(screen.getByText('⭐ 4.8 (127 reviews)')).toBeInTheDocument();
      expect(screen.getByText('555-0123')).toBeInTheDocument();
      
      // Form sections
      expect(screen.getByTestId('multi-service-selector')).toBeInTheDocument();
      expect(screen.getByTestId('location-selector')).toBeInTheDocument();
      expect(screen.getByText('Contact Information')).toBeInTheDocument();
      expect(screen.getByText('Booking Summary')).toBeInTheDocument();
      
      // Navigation
      expect(screen.getByText('Back')).toBeInTheDocument();
    });

    it('should display contact information from user context', async () => {
      render(<EnhancedBookingForm {...defaultProps} />);
      
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
      
      // Phone should be empty initially
      const phoneInput = screen.getByLabelText('Phone Number');
      expect(phoneInput).toHaveValue('');
    });

    it('should show barber avatar when available', async () => {
      render(<EnhancedBookingForm {...defaultProps} />);
      
      const avatar = screen.getByAltText('John Smith');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });
  });

  describe('API Integration', () => {
    it('should fetch and display available services from API', async () => {
      render(<EnhancedBookingForm {...defaultProps} />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/services?barberId=barber_123');
      });

      expect(screen.getByTestId('multi-service-selector')).toBeInTheDocument();
    });

    it('should fetch availability when services are selected', async () => {
      const user = userEvent.setup();
      render(<EnhancedBookingForm {...defaultProps} />);

      await selectService(user, 'haircut');

      await waitFor(() => {
        expect(screen.getByText('Available Times')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/availability?barberId=barber_123&date=2024-01-15&duration=60&locationType=shop')
        );
      });
    });

    it('should handle API errors gracefully', async () => {
      // Mock API failure
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      render(<EnhancedBookingForm {...defaultProps} />);
      
      // Component should still render without crashing
      expect(screen.getByText('Book Appointment')).toBeInTheDocument();
    });
  });

  describe('Service Selection', () => {
    it('should update booking summary when services are selected', async () => {
      const user = userEvent.setup();
      render(<EnhancedBookingForm {...defaultProps} />);

      await selectService(user, 'haircut');

      await waitFor(() => {
        expect(screen.getByText('Services')).toBeInTheDocument();
        expect(screen.getByText('Haircut')).toBeInTheDocument();
        expect(screen.getByText('$50.00')).toBeInTheDocument();
      });
    });

    it('should handle multiple service selection', async () => {
      const user = userEvent.setup();
      render(<EnhancedBookingForm {...defaultProps} />);

      await user.click(screen.getByTestId('select-multiple-services'));

      await waitFor(() => {
        expect(screen.getByText('Haircut')).toBeInTheDocument();
        expect(screen.getByText('Beard Trim')).toBeInTheDocument();
        expect(screen.getByText('$75.00')).toBeInTheDocument(); // $50 + $25
      });
    });

    it('should show duration information for selected services', async () => {
      const user = userEvent.setup();
      render(<EnhancedBookingForm {...defaultProps} />);

      await selectService(user, 'haircut');

      await waitFor(() => {
        expect(screen.getByText('Duration: 1h')).toBeInTheDocument();
      });
    });
  });

  describe('Location Selection', () => {
    it('should handle home visit location selection and show travel fee', async () => {
      const user = userEvent.setup();
      render(<EnhancedBookingForm {...defaultProps} />);

      await selectService(user, 'haircut');
      await selectLocation(user, 'home');

      await waitFor(() => {
        expect(screen.getByText('Home Visit')).toBeInTheDocument();
        expect(screen.getByText('Travel Fee')).toBeInTheDocument();
        expect(screen.getByText('$25.00')).toBeInTheDocument();
        expect(screen.getByText('123 Main St, City, State 12345')).toBeInTheDocument();
      });
    });

    it('should handle shop visit selection', async () => {
      const user = userEvent.setup();
      render(<EnhancedBookingForm {...defaultProps} />);

      await selectService(user, 'haircut');
      await selectLocation(user, 'shop');

      await waitFor(() => {
        expect(screen.getByText('In Salon')).toBeInTheDocument();
        expect(screen.queryByText('Travel Fee')).not.toBeInTheDocument();
      });
    });

    it('should update availability when location type changes', async () => {
      const user = userEvent.setup();
      render(<EnhancedBookingForm {...defaultProps} />);

      await selectService(user, 'haircut');
      await selectLocation(user, 'home');

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('locationType=home')
        );
      });
    });

    it('should show travel time for home visits', async () => {
      const user = userEvent.setup();
      render(<EnhancedBookingForm {...defaultProps} />);

      await selectService(user, 'haircut');
      await selectLocation(user, 'home');

      await waitFor(() => {
        expect(screen.getByText('+15m travel')).toBeInTheDocument();
      });
    });
  });

  describe('Price Calculation', () => {
    it('should correctly calculate total price including travel fee', async () => {
      const user = userEvent.setup();
      render(<EnhancedBookingForm {...defaultProps} />);

      await selectService(user, 'haircut');
      await selectLocation(user, 'home');

      await waitFor(() => {
        expect(screen.getByText('Subtotal')).toBeInTheDocument();
        expect(screen.getByText('Travel Fee')).toBeInTheDocument();
        expect(screen.getByText('Total')).toBeInTheDocument();
        // $50 service + $25 travel = $75 total
        expect(screen.getByText('$75.00')).toBeInTheDocument();
        // 20% deposit = $15
        expect(screen.getByText('$15.00')).toBeInTheDocument();
      });
    });

    it('should calculate correct deposit amount', async () => {
      const user = userEvent.setup();
      render(<EnhancedBookingForm {...defaultProps} />);

      await selectService(user, 'haircut');

      await waitFor(() => {
        expect(screen.getByText('Deposit Required')).toBeInTheDocument();
        expect(screen.getByText('$10.00')).toBeInTheDocument(); // 20% of $50
      });
    });

    it('should show remaining balance information', async () => {
      const user = userEvent.setup();
      render(<EnhancedBookingForm {...defaultProps} />);

      await selectService(user, 'haircut');

      await waitFor(() => {
        expect(screen.getByText(/remaining \$40\.00 at your appointment/)).toBeInTheDocument();
      });
    });
  });

  describe('Time Slot Selection', () => {
    it('should display available time slots when services are selected', async () => {
      const user = userEvent.setup();
      render(<EnhancedBookingForm {...defaultProps} />);

      await selectService(user, 'haircut');

      await waitFor(() => {
        expect(screen.getByText('Available Times')).toBeInTheDocument();
        expect(screen.getByText('10:00 AM')).toBeInTheDocument();
        expect(screen.getByText('11:00 AM')).toBeInTheDocument();
        expect(screen.getByText('2:00 PM')).toBeInTheDocument();
      });
    });

    it('should handle time slot selection and update booking details', async () => {
      const user = userEvent.setup();
      render(<EnhancedBookingForm {...defaultProps} />);

      await selectService(user, 'haircut');
      await selectTimeSlot(user, '10:00 AM');

      await waitFor(() => {
        expect(screen.getByText('Date & Time')).toBeInTheDocument();
        expect(screen.getByText('Monday, January 15, 2024')).toBeInTheDocument();
        expect(screen.getByText('10:00 AM - 11:00 AM')).toBeInTheDocument();
      });
    });

    it('should show loading state while fetching time slots', async () => {
      const user = userEvent.setup();
      render(<EnhancedBookingForm {...defaultProps} />);

      await selectService(user, 'haircut');

      expect(screen.getByText('Loading available times...')).toBeInTheDocument();
    });

    it('should handle no available time slots', async () => {
      // Mock empty slots response
      mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('/api/services')) {
          return createMockResponse({ services: mockServices });
        }
        if (url.includes('/api/availability')) {
          return createMockResponse({ slots: [] });
        }
        return createMockResponse({ error: 'Not found' }, { ok: false, status: 404 });
      });

      const user = userEvent.setup();
      render(<EnhancedBookingForm {...defaultProps} />);

      await selectService(user, 'haircut');

      await waitFor(() => {
        expect(screen.getByText('No available time slots for the selected services and date')).toBeInTheDocument();
      });
    });
  });

  describe('Contact Information', () => {
    it('should validate and handle contact information input', async () => {
      const user = userEvent.setup();
      render(<EnhancedBookingForm {...defaultProps} />);

      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();

      // Test phone number input
      const phoneInput = screen.getByLabelText('Phone Number');
      await user.type(phoneInput, '555-0123');
      expect(phoneInput).toHaveValue('555-0123');

      // Test notes input
      const notesInput = screen.getByLabelText('Special Requests or Notes');
      await user.type(notesInput, 'Please use organic products');
      expect(notesInput).toHaveValue('Please use organic products');
    });
  });

  describe('Form Validation and Submission', () => {
    it('should successfully submit booking to API', async () => {
      const user = userEvent.setup();
      render(<EnhancedBookingForm {...defaultProps} />);

      // Complete the booking flow
      await user.click(screen.getByText('Select Haircut'));
      
      await waitFor(() => {
        expect(screen.getByText('10:00 AM')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('10:00 AM'));

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /Book Appointment/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/appointments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('"barberId":"barber_123"'),
        });
      });

      await waitFor(() => {
        expect(defaultProps.onBookingComplete).toHaveBeenCalledWith('apt_123');
      });
    });

    it('should submit home visit booking with address and coordinates', async () => {
      const user = userEvent.setup();
      render(<EnhancedBookingForm {...defaultProps} />);

      // Complete the booking flow with home visit
      await user.click(screen.getByText('Select Haircut'));
      await user.click(screen.getByText('Select Home Visit'));
      
      await waitFor(() => {
        expect(screen.getByText('10:00 AM')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('10:00 AM'));

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /Book Appointment/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/appointments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('"locationType":"home"'),
        });
      });

      const call = mockFetch.mock.calls.find(
        (call) => {
          const url = typeof call[0] === 'string' ? call[0] : call[0].toString();
          return url === '/api/appointments' && call[1]?.method === 'POST';
        }
      );
      const callBody = call ? JSON.parse(call[1]?.body as string || '{}') : {};

      expect(callBody).toMatchObject({
        locationType: 'home',
        serviceAddress: '123 Main St, City, State 12345',
        serviceLatitude: 40.7128,
        serviceLongitude: -74.0060,
      });
    });

    it('should display error message when booking fails', async () => {
      const user = userEvent.setup();
      
      // Mock failed booking
      mockFetch.mockImplementation((input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString();
        const response = createMockResponse();
        
        if (url.includes('/api/services')) {
          response.json = async () => ({ 
            services: [{ id: 'service_1', name: 'Haircut', duration: 60, price: 50, category: 'Hair' }] 
          });
          return Promise.resolve(response);
        }
        
        if (url && typeof url === 'string' && url.includes('/api/availability')) {
          const availabilityResponse = createMockResponse();
          availabilityResponse.json = async () => ({ 
            slots: [{ start_time: '10:00', end_time: '11:00', is_available: true }] 
          });
          return Promise.resolve(availabilityResponse);
        }
        
        if (url === '/api/appointments') {
          return Promise.resolve({
            ok: false,
            json: async () => ({ error: 'Time slot no longer available' }),
          });
        }
        
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<EnhancedBookingForm {...defaultProps} />);

      // Complete the booking flow
      await user.click(screen.getByText('Select Haircut'));
      
      await waitFor(() => {
        expect(screen.getByText('10:00 AM')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('10:00 AM'));

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /Book Appointment/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Time slot no longer available')).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock network error
      mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('/api/services')) {
          return createMockResponse({ services: mockServices });
        }
        if (url.includes('/api/availability')) {
          return createMockResponse({ slots: mockTimeSlots });
        }
        if (url.includes('/api/appointments')) {
          throw new Error('Network error');
        }
        return createMockResponse({ error: 'Not found' }, { ok: false, status: 404 });
      });

      render(<EnhancedBookingForm {...defaultProps} />);

      // Complete the booking flow
      await user.click(screen.getByText('Select Haircut'));
      
      await waitFor(() => {
        expect(screen.getByText('10:00 AM')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('10:00 AM'));

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /Book Appointment/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to book appointment/)).toBeInTheDocument();
      });
    });

    it('should disable submit button until all required fields are complete', async () => {
      const user = userEvent.setup();
      render(<EnhancedBookingForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /Book Appointment/i });
      expect(submitButton).toBeDisabled();

      // Select service
      await user.click(screen.getByText('Select Haircut'));
      expect(submitButton).toBeDisabled(); // Still disabled, no time slot

      // Select time slot
      await waitFor(() => {
        expect(screen.getByText('10:00 AM')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('10:00 AM'));
      
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should validate required phone number', async () => {
      const user = userEvent.setup();
      render(<EnhancedBookingForm {...defaultProps} />);

      await selectService(user, 'haircut');
      await selectTimeSlot(user, '10:00 AM');

      // Clear phone number
      const phoneInput = screen.getByLabelText('Phone Number');
      await user.clear(phoneInput);

      const submitButton = screen.getByRole('button', { name: /Book Appointment/i });
      expect(submitButton).toBeDisabled();

      // Add phone number
      await user.type(phoneInput, '555-0123');
      
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during form submission', async () => {
      const user = userEvent.setup();
      
      // Mock slow booking response
      mockFetch.mockImplementation(async (url: RequestInfo | URL) => {
        if (url && typeof url === 'string' && url.includes('/api/services')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ services: [{ id: 'service_1', name: 'Haircut', duration: 60, price: 50, category: 'Hair' }] }),
          });
        }
        
        if (url.includes('/api/availability')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ slots: [{ start_time: '10:00', end_time: '11:00', is_available: true }] }),
          });
        }
        
        if (url === '/api/appointments') {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: async () => ({ appointment: { id: 'apt_123' } }),
              });
            }, 1000);
          });
        }
        
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<EnhancedBookingForm {...defaultProps} />);

      // Complete the booking flow
      await user.click(screen.getByText('Select Haircut'));
      
      await waitFor(() => {
        expect(screen.getByText('10:00 AM')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('10:00 AM'));

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /Book Appointment/i });
      await user.click(submitButton);

      expect(screen.getByText('Creating Appointment...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('should show loading state while fetching services', async () => {
      // Mock slow services response
      mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('/api/services')) {
          await new Promise(resolve => setTimeout(resolve, 100));
          return createMockResponse({ services: mockServices });
        }
        return createMockResponse({ error: 'Not found' }, { ok: false, status: 404 });
      });

      render(<EnhancedBookingForm {...defaultProps} />);

      expect(screen.getByText('Loading services...')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should handle back button navigation', async () => {
      const user = userEvent.setup();
      render(<EnhancedBookingForm {...defaultProps} />);

      const backButton = screen.getByText('Back');
      await user.click(backButton);

      expect(defaultProps.onBack).toHaveBeenCalled();
    });
  });

  describe('Formatting', () => {
    it('should correctly format currency values', async () => {
      const user = userEvent.setup();
      render(<EnhancedBookingForm {...defaultProps} />);

      await user.click(screen.getByText('Select Haircut'));

      await waitFor(() => {
        // Check that prices are formatted as currency
        expect(screen.getByText('$50.00')).toBeInTheDocument();
      });
    });

    it('should correctly format duration values', async () => {
      const user = userEvent.setup();
      render(<EnhancedBookingForm {...defaultProps} />);

      await user.click(screen.getByText('Select Haircut'));

      await waitFor(() => {
        expect(screen.getByText('Duration: 1h')).toBeInTheDocument();
      });
    });
  });

  describe('Dynamic Updates', () => {
    it('should update availability when location type changes', async () => {
      const user = userEvent.setup();
      render(<EnhancedBookingForm {...defaultProps} />);

      // Select service
      await user.click(screen.getByText('Select Haircut'));

      // Change to home visit
      await user.click(screen.getByText('Select Home Visit'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('locationType=home')
        );
      });
    });

    it('should update total price when services change', async () => {
      const user = userEvent.setup();
      render(<EnhancedBookingForm {...defaultProps} />);

      // Select single service
      await user.click(screen.getByText('Select Haircut'));
      
      await waitFor(() => {
        expect(screen.getByText('$50.00')).toBeInTheDocument();
      });

      // Select multiple services
      await user.click(screen.getByText('Select Multiple Services'));
      
      await waitFor(() => {
        expect(screen.getByText('$75.00')).toBeInTheDocument();
      });
    });

    it('should clear time slots when services change', async () => {
      const user = userEvent.setup();
      render(<EnhancedBookingForm {...defaultProps} />);

      // Select service and time
      await user.click(screen.getByText('Select Haircut'));
      
      await waitFor(() => {
        expect(screen.getByText('10:00 AM')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('10:00 AM'));
      
      await waitFor(() => {
        expect(screen.getByText('10:00 AM - 11:00 AM')).toBeInTheDocument();
      });

      // Change services
      await user.click(screen.getByText('Select Beard Trim'));
      
      // Time slot should be cleared
      await waitFor(() => {
        expect(screen.queryByText('10:00 AM - 11:00 AM')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', async () => {
      render(<EnhancedBookingForm {...defaultProps} />);

      expect(screen.getByLabelText('Service Selection')).toBeInTheDocument();
      expect(screen.getByLabelText('Location Selection')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Book Appointment/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<EnhancedBookingForm {...defaultProps} />);

      // Tab through form elements
      await user.tab();
      expect(screen.getByTestId('select-haircut')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByTestId('select-beard-trim')).toHaveFocus();
    });
  });

  describe('Error Handling', () => {
    it('should handle location validation errors', async () => {
      const user = userEvent.setup();
      render(<EnhancedBookingForm {...defaultProps} />);

      await selectService(user, 'haircut');
      await user.click(screen.getByTestId('trigger-location-error'));

      const submitButton = screen.getByRole('button', { name: /Book Appointment/i });
      expect(submitButton).toBeDisabled();
    });

    it('should handle service loading errors', async () => {
      // Mock service loading error
      mockFetch.mockRejectedValueOnce(new Error('Failed to load services'));
      
      render(<EnhancedBookingForm {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Failed to load services/)).toBeInTheDocument();
      });
    });

    it('should handle availability loading errors', async () => {
      const user = userEvent.setup();
      
      // Mock availability error
      mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('/api/services')) {
          return createMockResponse({ services: mockServices });
        }
        if (url.includes('/api/availability')) {
          throw new Error('Failed to load availability');
        }
        return createMockResponse({ error: 'Not found' }, { ok: false, status: 404 });
      });
      
      render(<EnhancedBookingForm {...defaultProps} />);
      
      await selectService(user, 'haircut');
      
      await waitFor(() => {
        expect(screen.getByText(/Failed to load available times/)).toBeInTheDocument();
      });
    });
  });
});
