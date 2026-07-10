import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/barbers/search/route';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs';

// Mock dependencies
jest.mock('@supabase/supabase-js');
jest.mock('@clerk/nextjs');

const mockSupabase = {
  from: jest.fn(),
  rpc: jest.fn(),
  auth: {
    getUser: jest.fn()
  }
};

const mockQuery = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
  contains: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis()
};

const mockBarberData = [
  {
    id: 'barber_1',
    user_id: 'user_123',
    business_name: 'Smith Barbershop',
    bio: 'Professional barber with 10 years experience',
    specialties: ['Classic Cuts', 'Beard Specialist'],
    years_experience: 10,
    price_range: '$$',
    location_point: 'POINT(-74.0060 40.7128)',
    address_street: '123 Main St',
    address_city: 'New York',
    address_state: 'NY',
    address_zip: '10001',
    phone: '+1234567890',
    website_url: 'https://smithbarbershop.com',
    instagram_handle: '@smithbarbershop',
    languages: ['English', 'Spanish'],
    is_mobile: false,
    service_radius_km: null,
    working_hours: {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '18:00' },
      friday: { open: '09:00', close: '18:00' },
      saturday: { open: '08:00', close: '16:00' },
      sunday: { closed: true }
    },
    rating: 4.8,
    total_reviews: 127,
    is_verified: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    users: {
      id: 'user_123',
      first_name: 'John',
      last_name: 'Smith',
      avatar_url: 'https://example.com/avatar1.jpg'
    },
    services: [
      {
        id: 'service_1',
        name: 'Classic Haircut',
        description: 'Traditional haircut with styling',
        category: 'haircut',
        price: 35,
        duration: 30,
        tags: ['classic', 'traditional']
      },
      {
        id: 'service_2',
        name: 'Beard Trim',
        description: 'Professional beard trimming and shaping',
        category: 'beard_trim',
        price: 20,
        duration: 15,
        tags: ['beard', 'trim']
      }
    ],
    barber_photos: [
      {
        id: 'photo_1',
        photo_url: 'https://example.com/shop1.jpg',
        is_featured: true
      }
    ],
    user_favorites: [],
    distance_km: 2.5
  },
  {
    id: 'barber_2',
    user_id: 'user_456',
    business_name: 'Garcia Hair Studio',
    bio: 'Modern styling and color specialist',
    specialties: ['Modern Styles', 'Coloring'],
    years_experience: 8,
    price_range: '$$$',
    location_point: 'POINT(-73.9442 40.6782)',
    address_street: '456 Brooklyn Ave',
    address_city: 'Brooklyn',
    address_state: 'NY',
    address_zip: '11201',
    phone: '+1987654321',
    website_url: null,
    instagram_handle: '@garciastudio',
    languages: ['English', 'Spanish', 'French'],
    is_mobile: true,
    service_radius_km: 15,
    working_hours: {
      monday: { open: '10:00', close: '19:00' },
      tuesday: { open: '10:00', close: '19:00' },
      wednesday: { open: '10:00', close: '19:00' },
      thursday: { open: '10:00', close: '19:00' },
      friday: { open: '10:00', close: '19:00' },
      saturday: { open: '09:00', close: '17:00' },
      sunday: { closed: true }
    },
    rating: 4.9,
    total_reviews: 89,
    is_verified: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    users: {
      id: 'user_456',
      first_name: 'Maria',
      last_name: 'Garcia',
      avatar_url: 'https://example.com/avatar2.jpg'
    },
    services: [
      {
        id: 'service_3',
        name: 'Modern Cut & Style',
        description: 'Contemporary haircut with professional styling',
        category: 'styling',
        price: 65,
        duration: 45,
        tags: ['modern', 'styling']
      }
    ],
    barber_photos: [],
    user_favorites: [{ user_id: 'current_user' }],
    distance_km: 5.2
  }
];

describe('/api/barbers/search', () => {
  const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
  const mockAuth = auth as jest.MockedFunction<typeof auth>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockCreateClient.mockReturnValue(mockSupabase as any);
    mockAuth.mockReturnValue({
      userId: 'current_user',
      getToken: jest.fn().mockResolvedValue('mock_token')
    } as any);

    // Setup default query chain
    mockSupabase.from.mockReturnValue(mockQuery as any);
    mockQuery.select.mockResolvedValue({
      data: mockBarberData,
      error: null,
      count: mockBarberData.length
    });
  });

  describe('GET /api/barbers/search', () => {
    it('returns barbers with basic search', async () => {
      const url = new URL('http://localhost:3000/api/barbers/search');
      const request = new NextRequest(url);
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data[0].name).toBe('John Smith');
      expect(data.data[0].business_name).toBe('Smith Barbershop');
    });

    it('applies text search filter', async () => {
      const url = new URL('http://localhost:3000/api/barbers/search?q=haircut');
      const request = new NextRequest(url);
      
      await GET(request);
      
      expect(mockQuery.ilike).toHaveBeenCalledWith('search_vector', '%haircut%');
    });

    it('applies location-based search', async () => {
      const url = new URL('http://localhost:3000/api/barbers/search?latitude=40.7128&longitude=-74.0060&radius=10');
      const request = new NextRequest(url);
      
      mockSupabase.rpc.mockResolvedValue({
        data: mockBarberData,
        error: null
      });
      
      await GET(request);
      
      expect(mockSupabase.rpc).toHaveBeenCalledWith('search_barbers_nearby', {
        search_lat: 40.7128,
        search_lng: -74.0060,
        search_radius_km: 10
      });
    });

    it('applies service category filter', async () => {
      const url = new URL('http://localhost:3000/api/barbers/search?category=haircut');
      const request = new NextRequest(url);
      
      await GET(request);
      
      expect(mockSupabase.from).toHaveBeenCalledWith('barber_profiles');
      // Should filter by services with haircut category
    });

    it('applies rating filter', async () => {
      const url = new URL('http://localhost:3000/api/barbers/search?min_rating=4.5');
      const request = new NextRequest(url);
      
      await GET(request);
      
      expect(mockQuery.gte).toHaveBeenCalledWith('rating', 4.5);
    });

    it('applies price range filter', async () => {
      const url = new URL('http://localhost:3000/api/barbers/search?price_range=$$');
      const request = new NextRequest(url);
      
      await GET(request);
      
      expect(mockQuery.eq).toHaveBeenCalledWith('price_range', '$$');
    });

    it('applies mobile service filter', async () => {
      const url = new URL('http://localhost:3000/api/barbers/search?mobile_service=true');
      const request = new NextRequest(url);
      
      await GET(request);
      
      expect(mockQuery.eq).toHaveBeenCalledWith('is_mobile', true);
    });

    it('applies verified only filter', async () => {
      const url = new URL('http://localhost:3000/api/barbers/search?verified_only=true');
      const request = new NextRequest(url);
      
      await GET(request);
      
      expect(mockQuery.eq).toHaveBeenCalledWith('is_verified', true);
    });

    it('applies specialties filter', async () => {
      const url = new URL('http://localhost:3000/api/barbers/search?specialties=Classic%20Cuts,Beard%20Specialist');
      const request = new NextRequest(url);
      
      await GET(request);
      
      expect(mockQuery.contains).toHaveBeenCalledWith('specialties', ['Classic Cuts', 'Beard Specialist']);
    });

    it('applies languages filter', async () => {
      const url = new URL('http://localhost:3000/api/barbers/search?languages=Spanish,French');
      const request = new NextRequest(url);
      
      await GET(request);
      
      expect(mockQuery.contains).toHaveBeenCalledWith('languages', ['Spanish', 'French']);
    });

    it('applies sorting', async () => {
      const url = new URL('http://localhost:3000/api/barbers/search?sort_by=rating&sort_order=desc');
      const request = new NextRequest(url);
      
      await GET(request);
      
      expect(mockQuery.order).toHaveBeenCalledWith('rating', { ascending: false });
    });

    it('applies pagination', async () => {
      const url = new URL('http://localhost:3000/api/barbers/search?page=2&limit=10');
      const request = new NextRequest(url);
      
      await GET(request);
      
      expect(mockQuery.range).toHaveBeenCalledWith(10, 19); // page 2, limit 10
    });

    it('handles availability filter', async () => {
      const url = new URL('http://localhost:3000/api/barbers/search?date=2024-01-15&time=10:00');
      const request = new NextRequest(url);
      
      mockSupabase.rpc.mockResolvedValue({
        data: ['barber_1'],
        error: null
      });
      
      await GET(request);
      
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_available_barbers', {
        search_date: '2024-01-15',
        search_time: '10:00'
      });
    });

    it('returns proper pagination metadata', async () => {
      const url = new URL('http://localhost:3000/api/barbers/search?page=1&limit=1');
      const request = new NextRequest(url);
      
      mockQuery.select.mockResolvedValue({
        data: [mockBarberData[0]],
        error: null,
        count: 2
      });
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(data.pagination).toEqual({
        page: 1,
        limit: 1,
        total: 2,
        total_pages: 2,
        has_next: true,
        has_prev: false
      });
    });

    it('includes favorite status for authenticated users', async () => {
      const url = new URL('http://localhost:3000/api/barbers/search');
      const request = new NextRequest(url);
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(data.data[0].is_favorited).toBe(false);
      expect(data.data[1].is_favorited).toBe(true);
    });

    it('handles unauthenticated requests', async () => {
      mockAuth.mockReturnValue({ userId: null } as any);
      
      const url = new URL('http://localhost:3000/api/barbers/search');
      const request = new NextRequest(url);
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.data[0].is_favorited).toBe(false);
      expect(data.data[1].is_favorited).toBe(false);
    });

    it('handles database errors', async () => {
      mockQuery.select.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      });
      
      const url = new URL('http://localhost:3000/api/barbers/search');
      const request = new NextRequest(url);
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Database connection failed');
    });

    it('validates search parameters', async () => {
      const url = new URL('http://localhost:3000/api/barbers/search?min_rating=invalid');
      const request = new NextRequest(url);
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('validation');
    });

    it('limits results to maximum allowed', async () => {
      const url = new URL('http://localhost:3000/api/barbers/search?limit=1000');
      const request = new NextRequest(url);
      
      await GET(request);
      
      expect(mockQuery.limit).toHaveBeenCalledWith(100); // Should cap at 100
    });
  });

  describe('POST /api/barbers/search', () => {
    it('handles POST requests with body parameters', async () => {
      const requestBody = {
        q: 'haircut',
        latitude: 40.7128,
        longitude: -74.0060,
        radius: 10,
        category: 'haircut',
        min_rating: 4.0,
        sort_by: 'distance',
        sort_order: 'asc'
      };
      
      const request = new NextRequest('http://localhost:3000/api/barbers/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
    });

    it('validates POST request body', async () => {
      const invalidBody = {
        latitude: 'invalid',
        longitude: 'invalid'
      };
      
      const request = new NextRequest('http://localhost:3000/api/barbers/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidBody)
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('handles malformed JSON in POST body', async () => {
      const request = new NextRequest('http://localhost:3000/api/barbers/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid JSON');
    });
  });

  describe('Search Performance', () => {
    it('uses proper indexes for location search', async () => {
      const url = new URL('http://localhost:3000/api/barbers/search?latitude=40.7128&longitude=-74.0060');
      const request = new NextRequest(url);
      
      mockSupabase.rpc.mockResolvedValue({
        data: mockBarberData,
        error: null
      });
      
      await GET(request);
      
      // Should use PostGIS function for efficient geospatial search
      expect(mockSupabase.rpc).toHaveBeenCalledWith('search_barbers_nearby', expect.any(Object));
    });

    it('uses text search vector for efficient text search', async () => {
      const url = new URL('http://localhost:3000/api/barbers/search?q=haircut');
      const request = new NextRequest(url);
      
      await GET(request);
      
      // Should use search_vector column for efficient text search
      expect(mockQuery.ilike).toHaveBeenCalledWith('search_vector', '%haircut%');
    });
  });

  describe('Data Transformation', () => {
    it('transforms database results to API format', async () => {
      const url = new URL('http://localhost:3000/api/barbers/search');
      const request = new NextRequest(url);
      
      const response = await GET(request);
      const data = await response.json();
      
      const barber = data.data[0];
      
      expect(barber).toHaveProperty('id');
      expect(barber).toHaveProperty('name', 'John Smith');
      expect(barber).toHaveProperty('business_name', 'Smith Barbershop');
      expect(barber).toHaveProperty('rating', 4.8);
      expect(barber).toHaveProperty('total_reviews', 127);
      expect(barber).toHaveProperty('location');
      expect(barber.location).toHaveProperty('city', 'New York');
      expect(barber.location).toHaveProperty('state', 'NY');
      expect(barber).toHaveProperty('services');
      expect(barber.services).toHaveLength(2);
      expect(barber).toHaveProperty('is_favorited', false);
    });

    it('includes available time slots', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [
          {
            barber_id: 'barber_1',
            available_slots: ['2024-01-15T10:00:00Z', '2024-01-15T14:00:00Z']
          }
        ],
        error: null
      });
      
      const url = new URL('http://localhost:3000/api/barbers/search');
      const request = new NextRequest(url);
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(data.data[0].available_slots).toEqual([
        '2024-01-15T10:00:00Z',
        '2024-01-15T14:00:00Z'
      ]);
    });
  });
});