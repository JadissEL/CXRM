import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { createMocks } from 'node-mocks-http';
import { GET, POST } from '@/app/api/services/list/route';
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

describe('/api/services/list', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockReturnValue(mockSupabase as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/services/list', () => {
    it('should return services with default pagination', async () => {
      const mockServices = [
        {
          id: '1',
          name: 'Classic Haircut',
          description: 'Traditional haircut with styling',
          price: 25,
          duration: 30,
          category: 'haircut',
          image_url: 'https://example.com/image1.jpg',
          is_active: true,
          rating: 4.5,
          review_count: 10,
          barber_profiles: {
            id: 'barber1',
            business_name: 'John\'s Barbershop',
            avatar_url: 'https://example.com/avatar1.jpg',
            verified: true,
          },
          service_categories: {
            id: 'cat1',
            name: 'Haircuts',
          },
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockServices,
          error: null,
          count: 1,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/services/list',
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.services).toEqual(mockServices);
      expect(data.pagination).toEqual({
        page: 1,
        limit: 12,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
    });

    it('should filter services by search query', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/services/list?search=haircut',
      });

      await GET(req as any);

      expect(mockQuery.ilike).toHaveBeenCalledWith('name', '%haircut%');
    });

    it('should filter services by category', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/services/list?category=haircut,beard',
      });

      await GET(req as any);

      expect(mockQuery.in).toHaveBeenCalledWith('category', ['haircut', 'beard']);
    });

    it('should filter services by price range', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/services/list?minPrice=20&maxPrice=50',
      });

      await GET(req as any);

      expect(mockQuery.gte).toHaveBeenCalledWith('price', 20);
      expect(mockQuery.lte).toHaveBeenCalledWith('price', 50);
    });

    it('should handle database errors gracefully', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' },
          count: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/services/list',
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch services');
    });
  });

  describe('POST /api/services/list', () => {
    it('should create a new service for authenticated barber', async () => {
      mockAuth.mockReturnValue({
        userId: 'user123',
        user: { id: 'user123' },
      } as any);

      const mockBarberProfile = {
        id: 'barber123',
        user_id: 'user123',
      };

      const mockNewService = {
        id: 'service123',
        name: 'New Haircut',
        description: 'A fresh new haircut style',
        price: 30,
        duration: 45,
        category: 'haircut',
        barber_id: 'barber123',
        is_active: true,
      };

      const mockBarberQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockBarberProfile,
          error: null,
        }),
      };

      const mockServiceQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockNewService,
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockBarberQuery) // First call for barber profile
        .mockReturnValueOnce(mockServiceQuery); // Second call for service creation

      const { req } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: {
          name: 'New Haircut',
          description: 'A fresh new haircut style',
          price: 30,
          duration: 45,
          category: 'haircut',
        },
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.service).toEqual(mockNewService);
    });

    it('should return 401 for unauthenticated users', async () => {
      mockAuth.mockReturnValue({ userId: null } as any);

      const { req } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: {
          name: 'New Haircut',
          description: 'A fresh new haircut style',
          price: 30,
          duration: 45,
          category: 'haircut',
        },
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 for non-barber users', async () => {
      mockAuth.mockReturnValue({
        userId: 'user123',
        user: { id: 'user123' },
      } as any);

      const mockBarberQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }, // Not found
        }),
      };

      mockSupabase.from.mockReturnValue(mockBarberQuery);

      const { req } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: {
          name: 'New Haircut',
          description: 'A fresh new haircut style',
          price: 30,
          duration: 45,
          category: 'haircut',
        },
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Only barbers can create services');
    });

    it('should validate required fields', async () => {
      mockAuth.mockReturnValue({
        userId: 'user123',
        user: { id: 'user123' },
      } as any);

      const { req } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: {
          name: '', // Invalid: empty name
          price: -10, // Invalid: negative price
          duration: 0, // Invalid: zero duration
        },
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid service data');
      expect(data.details).toContain('Name is required');
      expect(data.details).toContain('Price must be greater than 0');
      expect(data.details).toContain('Duration must be greater than 0');
    });
  });
});