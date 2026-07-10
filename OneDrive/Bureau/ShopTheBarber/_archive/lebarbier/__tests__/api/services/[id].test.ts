import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { createMocks } from 'node-mocks-http';
import { GET, PUT, DELETE } from '@/app/api/services/[id]/route';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs';

// Mock dependencies
jest.mock('@supabase/supabase-js');
jest.mock('@clerk/nextjs');

const mockSupabase = {
  from: jest.fn(),
  storage: {
    from: jest.fn(),
  },
};

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('/api/services/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockReturnValue(mockSupabase as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/services/[id]', () => {
    it('should return service details with related data', async () => {
      const mockService = {
        id: 'service123',
        name: 'Classic Haircut',
        description: 'Traditional haircut with styling',
        price: 25,
        duration: 30,
        category: 'haircut',
        image_url: 'https://example.com/image1.jpg',
        video_url: 'https://example.com/video1.mp4',
        is_active: true,
        rating: 4.5,
        review_count: 10,
        booking_enabled: true,
        cancellation_policy: '24 hours notice required',
        barber_profiles: {
          id: 'barber1',
          business_name: 'John\'s Barbershop',
          avatar_url: 'https://example.com/avatar1.jpg',
          verified: true,
          bio: 'Professional barber with 10 years experience',
          phone: '+1234567890',
          email: 'john@barbershop.com',
        },
        service_categories: {
          id: 'cat1',
          name: 'Haircuts',
          description: 'Professional haircut services',
        },
      };

      const mockAddons = [
        {
          id: 'addon1',
          name: 'Beard Trim',
          price: 10,
          duration: 15,
        },
      ];

      const mockReviews = [
        {
          id: 'review1',
          rating: 5,
          comment: 'Excellent service!',
          created_at: '2024-01-01T00:00:00Z',
          users: {
            id: 'user1',
            first_name: 'John',
            last_name: 'Doe',
            avatar_url: 'https://example.com/user1.jpg',
          },
        },
      ];

      const mockAvailability = [
        {
          id: 'avail1',
          day_of_week: 1,
          start_time: '09:00',
          end_time: '17:00',
          is_available: true,
        },
      ];

      const mockRelatedServices = [
        {
          id: 'service2',
          name: 'Beard Styling',
          price: 20,
          duration: 25,
          image_url: 'https://example.com/image2.jpg',
          rating: 4.3,
          review_count: 8,
        },
      ];

      // Mock service query
      const mockServiceQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockService,
          error: null,
        }),
      };

      // Mock addons query
      const mockAddonsQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: mockAddons,
          error: null,
        }),
      };

      // Mock reviews query
      const mockReviewsQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: mockReviews,
          error: null,
        }),
      };

      // Mock availability query
      const mockAvailabilityQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockAvailability,
          error: null,
        }),
      };

      // Mock related services query
      const mockRelatedQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: mockRelatedServices,
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockServiceQuery)
        .mockReturnValueOnce(mockAddonsQuery)
        .mockReturnValueOnce(mockReviewsQuery)
        .mockReturnValueOnce(mockAvailabilityQuery)
        .mockReturnValueOnce(mockRelatedQuery);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/services/service123',
      });

      const response = await GET(req as any, { params: { id: 'service123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.service).toEqual(mockService);
      expect(data.addons).toEqual(mockAddons);
      expect(data.reviews).toEqual(mockReviews);
      expect(data.availability).toEqual(mockAvailability);
      expect(data.relatedServices).toEqual(mockRelatedServices);
    });

    it('should return 404 for non-existent service', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/services/nonexistent',
      });

      const response = await GET(req as any, { params: { id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Service not found');
    });

    it('should return 404 for inactive service', async () => {
      const mockInactiveService = {
        id: 'service123',
        name: 'Inactive Service',
        is_active: false,
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockInactiveService,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/services/service123',
      });

      const response = await GET(req as any, { params: { id: 'service123' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Service not found');
    });
  });

  describe('PUT /api/services/[id]', () => {
    it('should update service for authorized barber', async () => {
      mockAuth.mockReturnValue({
        userId: 'user123',
        user: { id: 'user123' },
      } as any);

      const mockService = {
        id: 'service123',
        barber_id: 'barber123',
        name: 'Updated Haircut',
        price: 35,
      };

      const mockBarberProfile = {
        id: 'barber123',
        user_id: 'user123',
      };

      const mockUpdatedService = {
        ...mockService,
        name: 'Updated Haircut',
        price: 35,
      };

      // Mock service query
      const mockServiceQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockService,
          error: null,
        }),
      };

      // Mock barber profile query
      const mockBarberQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockBarberProfile,
          error: null,
        }),
      };

      // Mock update query
      const mockUpdateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockUpdatedService,
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockServiceQuery)
        .mockReturnValueOnce(mockBarberQuery)
        .mockReturnValueOnce(mockUpdateQuery);

      const { req } = createMocks({
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
        },
        body: {
          name: 'Updated Haircut',
          price: 35,
        },
      });

      const response = await PUT(req as any, { params: { id: 'service123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.service).toEqual(mockUpdatedService);
    });

    it('should return 401 for unauthenticated users', async () => {
      mockAuth.mockReturnValue({ userId: null } as any);

      const { req } = createMocks({
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
        },
        body: {
          name: 'Updated Haircut',
          price: 35,
        },
      });

      const response = await PUT(req as any, { params: { id: 'service123' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 for unauthorized barber', async () => {
      mockAuth.mockReturnValue({
        userId: 'user123',
        user: { id: 'user123' },
      } as any);

      const mockService = {
        id: 'service123',
        barber_id: 'different_barber',
      };

      const mockBarberProfile = {
        id: 'barber123',
        user_id: 'user123',
      };

      const mockServiceQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockService,
          error: null,
        }),
      };

      const mockBarberQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockBarberProfile,
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockServiceQuery)
        .mockReturnValueOnce(mockBarberQuery);

      const { req } = createMocks({
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
        },
        body: {
          name: 'Updated Haircut',
          price: 35,
        },
      });

      const response = await PUT(req as any, { params: { id: 'service123' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('You can only update your own services');
    });
  });

  describe('DELETE /api/services/[id]', () => {
    it('should soft delete service for authorized barber', async () => {
      mockAuth.mockReturnValue({
        userId: 'user123',
        user: { id: 'user123' },
      } as any);

      const mockService = {
        id: 'service123',
        barber_id: 'barber123',
        is_active: true,
      };

      const mockBarberProfile = {
        id: 'barber123',
        user_id: 'user123',
      };

      const mockServiceQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockService,
          error: null,
        }),
      };

      const mockBarberQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockBarberProfile,
          error: null,
        }),
      };

      const mockUpdateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...mockService, is_active: false },
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockServiceQuery)
        .mockReturnValueOnce(mockBarberQuery)
        .mockReturnValueOnce(mockUpdateQuery);

      const { req } = createMocks({
        method: 'DELETE',
      });

      const response = await DELETE(req as any, { params: { id: 'service123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Service deleted successfully');
    });

    it('should return 401 for unauthenticated users', async () => {
      mockAuth.mockReturnValue({ userId: null } as any);

      const { req } = createMocks({
        method: 'DELETE',
      });

      const response = await DELETE(req as any, { params: { id: 'service123' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 for non-existent service', async () => {
      mockAuth.mockReturnValue({
        userId: 'user123',
        user: { id: 'user123' },
      } as any);

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const { req } = createMocks({
        method: 'DELETE',
      });

      const response = await DELETE(req as any, { params: { id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Service not found');
    });
  });
});