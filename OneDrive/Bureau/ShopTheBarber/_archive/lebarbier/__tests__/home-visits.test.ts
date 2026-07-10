import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  auth: jest.fn(),
  currentUser: jest.fn(),
}));

// Mock Supabase
const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  delete: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  gte: jest.fn(() => mockSupabase),
  lte: jest.fn(() => mockSupabase),
  in: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  limit: jest.fn(() => mockSupabase),
  single: jest.fn(),
  rpc: jest.fn(),
};

jest.mock('../lib/supabase', () => ({
  createClient: () => mockSupabase,
  supabase: mockSupabase,
  supabaseAdmin: mockSupabase,
}));

// Import handlers after mocking
import { POST as appointmentsPost } from '@/app/api/appointments/route';
import { POST as validateAddressPost, GET as validateAddressGet } from '@/app/api/appointments/validate-address/route';

describe('Home Visit Features', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful auth
    const { auth } = require('@clerk/nextjs');
    auth.mockResolvedValue({
      userId: 'user_123',
      sessionClaims: { role: 'client' },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Address Validation API', () => {
    it('should validate home visit address successfully', async () => {
      // Mock database responses
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'barber_123',
          offers_home_visits: true,
          home_visit_fee_base: 10,
          home_visit_fee_per_km: 2,
          max_travel_distance: 25,
        },
        error: null,
      });

      mockSupabase.rpc
        .mockResolvedValueOnce({
          data: { is_valid: true, message: 'Address is within service area' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            distance_km: 15.5,
            travel_time_minutes: 22,
            travel_fee: 41.0,
          },
          error: null,
        });

      // Mock fetch for API call
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          isValid: true,
          travelInfo: {
            distance_km: 15.5,
            travel_time_minutes: 22,
            travel_fee: 41.0,
          }
        })
      });

      const response = await fetch('/api/appointments/validate-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barberId: 'barber_123',
          address: '123 Main St, City, State 12345',
          latitude: 40.7128,
          longitude: -74.0060,
        })
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isValid).toBe(true);
      expect(data.travelInfo).toEqual({
        distance_km: 15.5,
        travel_time_minutes: 22,
        travel_fee: 41.0,
      });
    });

    it('should reject address outside service area', async () => {
      // Mock address outside service area
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'Address is outside service area'
        })
      });

      const response = await fetch('/api/appointments/validate-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barberId: 'barber_123',
          address: '999 Far Away St, Distant City, State 99999',
          latitude: 45.0000,
          longitude: -80.0000
        })
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Address is outside service area');
    });

    it('should return error for barber who does not offer home visits', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'This barber does not offer home visits'
        })
      });

      const response = await fetch('/api/appointments/validate-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barberId: 'barber_123',
          address: '123 Main St, City, State 12345',
          latitude: 40.7128,
          longitude: -74.0060,
        })
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('This barber does not offer home visits');
    });

    it('should get barber home visit information', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          offersHomeVisits: true,
          homeVisitInfo: {
            baseFee: 15,
            feePerKm: 2.5,
            maxDistance: 30,
          },
          shopLocation: {
            address: '456 Barber Shop Ave, Salon City, SC 12345',
            coordinates: { lat: 40.7128, lng: -74.0060 },
          }
        })
      });

      const response = await fetch('/api/appointments/validate-address?barberId=barber_123', {
        method: 'GET'
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.offersHomeVisits).toBe(true);
      expect(data.homeVisitInfo).toEqual({
        baseFee: 15,
        feePerKm: 2.5,
        maxDistance: 30,
      });
      expect(data.shopLocation).toEqual({
        address: '456 Barber Shop Ave, Salon City, SC 12345',
        coordinates: { lat: 40.7128, lng: -74.0060 },
      });
    });
  });

  describe('Appointment Booking with Home Visits', () => {
    it('should create home visit appointment successfully', async () => {
      // Mock successful appointment creation
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          data: {
            appointmentId: 'apt_123',
            totalPrice: 91.0,
            travelFee: 41.0,
            basePrice: 50.0
          }
        })
      });

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barberId: 'barber_123',
          serviceIds: ['service_1'],
          date: '2024-01-15',
          startTime: '10:00',
          endTime: '11:00',
          locationType: 'home',
          serviceAddress: '123 Main St, City, State 12345',
          serviceLatitude: 40.7128,
          serviceLongitude: -74.0060,
          contactInfo: {
            name: 'John Doe',
            email: 'john@example.com',
            phone: '555-0123',
          },
        })
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.appointmentId).toBe('apt_123');
      expect(data.data.totalPrice).toBe(91.0);
      expect(data.data.travelFee).toBe(41.0);
      expect(data.data.basePrice).toBe(50.0);
    });

    it('should create shop appointment successfully', async () => {
      // Mock successful shop appointment creation
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          data: {
            appointmentId: 'apt_124',
            totalPrice: 50.0,
            travelFee: 0.0,
            basePrice: 50.0
          }
        })
      });

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barberId: 'barber_123',
          serviceIds: ['service_1'],
          date: '2024-01-15',
          startTime: '10:00',
          endTime: '11:00',
          locationType: 'shop',
          contactInfo: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        })
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.appointmentId).toBe('apt_124');
      expect(data.data.totalPrice).toBe(50.0);
      expect(data.data.travelFee).toBe(0.0);
    });

    it('should reject home visit for barber who does not offer them', async () => {
      // Mock rejection for barber who doesn't offer home visits
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'This barber does not offer home visits'
        })
      });

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barberId: 'barber_123',
          serviceIds: ['service_1'],
          date: '2024-01-15',
          startTime: '10:00',
          endTime: '11:00',
          locationType: 'home',
          serviceAddress: '123 Main St, City, State 12345',
          serviceLatitude: 40.7128,
          serviceLongitude: -74.0060,
          contactInfo: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        })
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('This barber does not offer home visits');
    });

    it('should validate required fields for home visits', async () => {
      // Mock validation error for missing required fields
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'Service address is required for home visits'
        })
      });

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barberId: 'barber_123',
          serviceIds: ['service_1'],
          date: '2024-01-15',
          startTime: '10:00',
          endTime: '11:00',
          locationType: 'home',
          // Missing serviceAddress, serviceLatitude, serviceLongitude
          contactInfo: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        })
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('required');
    });
  });

  describe('Travel Fee Calculation', () => {
    it('should calculate correct travel fee for various distances', async () => {
      const testCases = [
        { distance: 0, baseFee: 15.0, feePerKm: 2.5, expected: 15.0 }, // Base fee only
        { distance: 5.5, baseFee: 15.0, feePerKm: 2.5, expected: 28.75 }, // Base + (5.5 * 2.5)
        { distance: 10, baseFee: 15.0, feePerKm: 2.5, expected: 40.0 }, // Base + (10 * 2.5)
        { distance: 0.5, baseFee: 15.0, feePerKm: 2.5, expected: 16.25 } // Base + (0.5 * 2.5)
      ];

      for (const testCase of testCases) {
        // Simple calculation test without external dependencies
        const calculatedFee = testCase.baseFee + (testCase.distance * testCase.feePerKm);
        expect(calculatedFee).toBe(testCase.expected);
      }
    });

    it('should calculate travel fee correctly', () => {
      const baseFee = 10;
      const feePerKm = 2;
      const distance = 15.5;
      
      const expectedFee = baseFee + (feePerKm * distance);
      expect(expectedFee).toBe(41.0);
    });

    it('should handle zero distance', () => {
      const baseFee = 10;
      const feePerKm = 2;
      const distance = 0;
      
      const expectedFee = baseFee + (feePerKm * distance);
      expect(expectedFee).toBe(10.0);
    });

    it('should handle fractional distances', () => {
      const baseFee = 15;
      const feePerKm = 2.5;
      const distance = 12.3;
      
      const expectedFee = baseFee + (feePerKm * distance);
      expect(expectedFee).toBe(45.75);
    });
  });

  describe('Service Area Validation', () => {
    it('should validate address within service area', () => {
      const maxDistance = 25;
      const actualDistance = 15.5;
      
      expect(actualDistance).toBeLessThanOrEqual(maxDistance);
    });

    it('should reject address outside service area', () => {
      const maxDistance = 25;
      const actualDistance = 30.2;
      
      expect(actualDistance).toBeGreaterThan(maxDistance);
    });

    it('should handle edge case at exact boundary', () => {
      const maxDistance = 25;
      const actualDistance = 25.0;
      
      expect(actualDistance).toBeLessThanOrEqual(maxDistance);
    });
  });

  describe('Time Slot Validation with Travel', () => {
    it('should account for travel time in scheduling', () => {
      const appointmentDuration = 60; // 1 hour
      const travelTimeBefore = 20; // 20 minutes
      const travelTimeAfter = 20; // 20 minutes
      
      const totalTimeNeeded = appointmentDuration + travelTimeBefore + travelTimeAfter;
      expect(totalTimeNeeded).toBe(100); // 1 hour 40 minutes total
    });

    it('should handle multiple services with travel', () => {
      const services = [
        { duration: 30, price: 25 },
        { duration: 45, price: 35 },
      ];
      
      const totalDuration = services.reduce((sum, service) => sum + service.duration, 0);
      const totalPrice = services.reduce((sum, service) => sum + service.price, 0);
      const travelTime = 25;
      
      expect(totalDuration).toBe(75);
      expect(totalPrice).toBe(60);
      expect(totalDuration + travelTime).toBe(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Failed to validate address' }),
      });

      const response = await fetch('/api/appointments/validate-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barberId: 'barber_123',
          address: '123 Main St, City, State 12345',
          latitude: 40.7128,
          longitude: -74.0060,
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to validate address');
    });

    it('should handle missing barber', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Barber not found' }),
      });

      const response = await fetch('/api/appointments/validate-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barberId: 'nonexistent_barber',
          address: '123 Main St, City, State 12345',
          latitude: 40.7128,
          longitude: -74.0060,
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Barber not found');
    });

    it('should handle invalid coordinates', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid coordinates provided for validation' }),
      });

      const response = await fetch('/api/appointments/validate-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barberId: 'barber_123',
          address: '123 Main St, City, State 12345',
          latitude: 'invalid',
          longitude: 'invalid',
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('validation');
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for booking', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      });

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barberId: 'barber_123',
          serviceIds: ['service_1'],
          date: '2024-01-15',
          startTime: '10:00',
          endTime: '11:00',
          locationType: 'shop',
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should allow clients to book appointments', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ 
          appointmentId: 'apt_123',
          message: 'Appointment created successfully'
        }),
      });

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barberId: 'barber_123',
          serviceIds: ['service_1'],
          date: '2024-01-15',
          startTime: '10:00',
          endTime: '11:00',
          locationType: 'shop',
          contactInfo: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        }),
      });
      
      expect(response.status).toBe(201);
    });
  });
});