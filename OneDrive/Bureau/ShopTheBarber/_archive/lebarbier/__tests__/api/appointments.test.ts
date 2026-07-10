import { createMocks } from 'node-mocks-http';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/appointments/route';
import { createClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs';

// Mock dependencies
jest.mock('../../lib/supabase');
jest.mock('@clerk/nextjs');

const mockSupabase = {
  from: jest.fn(),
  rpc: jest.fn(),
};

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('/api/appointments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockReturnValue(mockSupabase as any);
  });

  describe('GET /api/appointments', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: 'user-1' } as any);
    });

    it('should return appointments for authenticated user', async () => {
      // Mock user role check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({
              data: { role: 'client' },
              error: null,
            }),
          }),
        }),
      });

      // Mock appointments query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            order: jest.fn().mockReturnValueOnce({
              range: jest.fn().mockResolvedValueOnce({
                data: [
                  {
                    id: 'appointment-1',
                    appointment_date: '2024-01-15',
                    start_time: '09:00:00',
                    end_time: '09:30:00',
                    status: 'confirmed',
                    client: { id: 'user-1', name: 'John Doe' },
                    barber: { id: 'barber-1', name: 'Jane Smith' },
                    services: [{ id: 'service-1', name: 'Haircut', price: 25 }],
                  },
                ],
                error: null,
                count: 1,
              }),
            }),
          }),
        }),
      });

      const url = new URL('http://localhost:3000/api/appointments');
      const request = new NextRequest(url);
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.appointments).toHaveLength(1);
      expect(data.data.appointments[0].id).toBe('appointment-1');
      expect(data.data.pagination.total).toBe(1);
    });

    it('should filter appointments by status', async () => {
      // Mock user role check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({
              data: { role: 'client' },
              error: null,
            }),
          }),
        }),
      });

      // Mock appointments query with status filter
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockReturnValueOnce({
              order: jest.fn().mockReturnValueOnce({
                range: jest.fn().mockResolvedValueOnce({
                  data: [],
                  error: null,
                  count: 0,
                }),
              }),
            }),
          }),
        }),
      });

      const url = new URL('http://localhost:3000/api/appointments?status=confirmed');
      const request = new NextRequest(url);
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.appointments).toHaveLength(0);
    });

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockReturnValue({ userId: null } as any);

      const url = new URL('http://localhost:3000/api/appointments');
      const request = new NextRequest(url);
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Authentication required');
    });

    it('should handle pagination correctly', async () => {
      // Mock user role check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({
              data: { role: 'client' },
              error: null,
            }),
          }),
        }),
      });

      // Mock appointments query with pagination
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            order: jest.fn().mockReturnValueOnce({
              range: jest.fn().mockResolvedValueOnce({
                data: [],
                error: null,
                count: 25,
              }),
            }),
          }),
        }),
      });

      const url = new URL('http://localhost:3000/api/appointments?page=2&limit=10');
      const request = new NextRequest(url);
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.pagination.page).toBe(2);
      expect(data.data.pagination.limit).toBe(10);
      expect(data.data.pagination.total).toBe(25);
      expect(data.data.pagination.total_pages).toBe(3);
    });
  });

  describe('POST /api/appointments', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: 'user-1' } as any);
    });

    it('should create appointment successfully', async () => {
      // Mock user exists and is active
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({
              data: { id: 'user-1', status: 'active' },
              error: null,
            }),
          }),
        }),
      });

      // Mock barber exists and is active
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({
              data: { id: 'barber-1', status: 'active' },
              error: null,
            }),
          }),
        }),
      });

      // Mock services exist
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          in: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockResolvedValueOnce({
              data: [{ id: 'service-1', name: 'Haircut', price: 25, duration: 30 }],
              error: null,
            }),
          }),
        }),
      });

      // Mock appointment creation RPC
      mockSupabase.rpc.mockResolvedValueOnce({
        data: {
          id: 'appointment-1',
          appointment_date: '2024-01-15',
          start_time: '09:00:00',
          end_time: '09:30:00',
          status: 'confirmed',
        },
        error: null,
      });

      // Mock appointment details fetch
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({
              data: {
                id: 'appointment-1',
                appointment_date: '2024-01-15',
                start_time: '09:00:00',
                end_time: '09:30:00',
                status: 'confirmed',
                client: { id: 'user-1', name: 'John Doe' },
                barber: { id: 'barber-1', name: 'Jane Smith' },
                services: [{ id: 'service-1', name: 'Haircut', price: 25 }],
              },
              error: null,
            }),
          }),
        }),
      });

      const requestBody = {
        barber_id: 'barber-1',
        service_ids: ['service-1'],
        appointment_date: '2024-01-15',
        start_time: '09:00:00',
        end_time: '09:30:00',
        client_notes: 'Please be on time',
        deposit_amount: 10,
      };

      const request = new NextRequest('http://localhost:3000/api/appointments', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.appointment.id).toBe('appointment-1');
      expect(data.data.appointment.status).toBe('confirmed');
    });

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockReturnValue({ userId: null } as any);

      const requestBody = {
        barber_id: 'barber-1',
        service_ids: ['service-1'],
        appointment_date: '2024-01-15',
        start_time: '09:00:00',
        end_time: '09:30:00',
      };

      const request = new NextRequest('http://localhost:3000/api/appointments', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Authentication required');
    });

    it('should return 400 for invalid request body', async () => {
      const requestBody = {
        barber_id: 'barber-1',
        // Missing required fields
      };

      const request = new NextRequest('http://localhost:3000/api/appointments', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('service_ids');
    });

    it('should return 400 for past appointment date', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const pastDate = yesterday.toISOString().split('T')[0];

      const requestBody = {
        barber_id: 'barber-1',
        service_ids: ['service-1'],
        appointment_date: pastDate,
        start_time: '09:00:00',
        end_time: '09:30:00',
      };

      const request = new NextRequest('http://localhost:3000/api/appointments', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('past date');
    });

    it('should return 404 for non-existent barber', async () => {
      // Mock user exists and is active
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({
              data: { id: 'user-1', status: 'active' },
              error: null,
            }),
          }),
        }),
      });

      // Mock barber not found
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      });

      const requestBody = {
        barber_id: 'invalid-barber',
        service_ids: ['service-1'],
        appointment_date: '2024-01-15',
        start_time: '09:00:00',
        end_time: '09:30:00',
      };

      const request = new NextRequest('http://localhost:3000/api/appointments', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Barber not found');
    });

    it('should return 409 when appointment creation fails due to conflict', async () => {
      // Mock user exists and is active
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({
              data: { id: 'user-1', status: 'active' },
              error: null,
            }),
          }),
        }),
      });

      // Mock barber exists and is active
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({
              data: { id: 'barber-1', status: 'active' },
              error: null,
            }),
          }),
        }),
      });

      // Mock services exist
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          in: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockResolvedValueOnce({
              data: [{ id: 'service-1', name: 'Haircut', price: 25, duration: 30 }],
              error: null,
            }),
          }),
        }),
      });

      // Mock appointment creation RPC failure
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Time slot is no longer available' },
      });

      const requestBody = {
        barber_id: 'barber-1',
        service_ids: ['service-1'],
        appointment_date: '2024-01-15',
        start_time: '09:00:00',
        end_time: '09:30:00',
      };

      const request = new NextRequest('http://localhost:3000/api/appointments', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toContain('no longer available');
    });
  });
});