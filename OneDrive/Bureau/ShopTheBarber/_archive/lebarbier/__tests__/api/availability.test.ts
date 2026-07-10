import { createMocks } from 'node-mocks-http';
import { NextRequest } from 'next/server';
import { GET, POST, DELETE } from '@/app/api/barbers/[id]/availability/route';
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

describe('/api/barbers/[id]/availability', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockReturnValue(mockSupabase as any);
  });

  describe('GET /api/barbers/[id]/availability', () => {
    it('should return available slots for valid request', async () => {
      // Mock barber exists
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({
              data: { id: 'barber-1', name: 'John Doe' },
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
              data: [{ id: 'service-1', duration: 30 }],
              error: null,
            }),
          }),
        }),
      });

      // Mock availability RPC
      mockSupabase.rpc.mockResolvedValueOnce({
        data: [
          {
            slot_start: '09:00:00',
            slot_end: '09:30:00',
            is_available: true,
          },
          {
            slot_start: '09:30:00',
            slot_end: '10:00:00',
            is_available: true,
          },
        ],
        error: null,
      });

      const url = new URL('http://localhost:3000/api/barbers/barber-1/availability?date=2024-01-15&service_ids=service-1');
      const request = new NextRequest(url);
      
      const response = await GET(request, { params: { id: 'barber-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.slots).toHaveLength(2);
      expect(data.data.slots[0]).toEqual({
        start_time: '09:00:00',
        end_time: '09:30:00',
        is_available: true,
      });
    });

    it('should return 400 for missing required parameters', async () => {
      const url = new URL('http://localhost:3000/api/barbers/barber-1/availability');
      const request = new NextRequest(url);
      
      const response = await GET(request, { params: { id: 'barber-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('date');
    });

    it('should return 404 for non-existent barber', async () => {
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

      const url = new URL('http://localhost:3000/api/barbers/invalid-id/availability?date=2024-01-15&service_ids=service-1');
      const request = new NextRequest(url);
      
      const response = await GET(request, { params: { id: 'invalid-id' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Barber not found');
    });

    it('should return 400 for invalid date format', async () => {
      const url = new URL('http://localhost:3000/api/barbers/barber-1/availability?date=invalid-date&service_ids=service-1');
      const request = new NextRequest(url);
      
      const response = await GET(request, { params: { id: 'barber-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid date format');
    });

    it('should return 400 for past dates', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const pastDate = yesterday.toISOString().split('T')[0];

      const url = new URL(`http://localhost:3000/api/barbers/barber-1/availability?date=${pastDate}&service_ids=service-1`);
      const request = new NextRequest(url);
      
      const response = await GET(request, { params: { id: 'barber-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Cannot check availability for past dates');
    });
  });

  describe('POST /api/barbers/[id]/availability', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: 'user-1' } as any);
    });

    it('should reserve a time slot successfully', async () => {
      // Mock barber exists
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({
              data: { id: 'barber-1', name: 'John Doe' },
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
              data: [{ id: 'service-1', duration: 30 }],
              error: null,
            }),
          }),
        }),
      });

      // Mock reservation RPC
      mockSupabase.rpc.mockResolvedValueOnce({
        data: {
          id: 'reservation-1',
          expires_at: '2024-01-15T10:15:00Z',
        },
        error: null,
      });

      const requestBody = {
        date: '2024-01-15',
        start_time: '09:00:00',
        end_time: '09:30:00',
        service_ids: ['service-1'],
      };

      const request = new NextRequest('http://localhost:3000/api/barbers/barber-1/availability', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });
      
      const response = await POST(request, { params: { id: 'barber-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.reservation_id).toBe('reservation-1');
      expect(data.data.expires_at).toBe('2024-01-15T10:15:00Z');
    });

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockReturnValue({ userId: null } as any);

      const requestBody = {
        date: '2024-01-15',
        start_time: '09:00:00',
        end_time: '09:30:00',
        service_ids: ['service-1'],
      };

      const request = new NextRequest('http://localhost:3000/api/barbers/barber-1/availability', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });
      
      const response = await POST(request, { params: { id: 'barber-1' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Authentication required');
    });

    it('should return 400 for invalid request body', async () => {
      const requestBody = {
        date: '2024-01-15',
        // Missing required fields
      };

      const request = new NextRequest('http://localhost:3000/api/barbers/barber-1/availability', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });
      
      const response = await POST(request, { params: { id: 'barber-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('start_time');
    });

    it('should return 409 when slot is already reserved', async () => {
      // Mock barber exists
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({
              data: { id: 'barber-1', name: 'John Doe' },
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
              data: [{ id: 'service-1', duration: 30 }],
              error: null,
            }),
          }),
        }),
      });

      // Mock reservation RPC failure
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Slot is already reserved or booked' },
      });

      const requestBody = {
        date: '2024-01-15',
        start_time: '09:00:00',
        end_time: '09:30:00',
        service_ids: ['service-1'],
      };

      const request = new NextRequest('http://localhost:3000/api/barbers/barber-1/availability', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });
      
      const response = await POST(request, { params: { id: 'barber-1' } });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toContain('already reserved');
    });
  });

  describe('DELETE /api/barbers/[id]/availability', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: 'user-1' } as any);
    });

    it('should cancel reservation successfully', async () => {
      const url = new URL('http://localhost:3000/api/barbers/barber-1/availability?reservation_id=reservation-1');
      const request = new NextRequest(url, { method: 'DELETE' });

      mockSupabase.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockResolvedValueOnce({
              data: null,
              error: null,
            }),
          }),
        }),
      });
      
      const response = await DELETE(request, { params: { id: 'barber-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('cancelled');
    });

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockReturnValue({ userId: null } as any);

      const url = new URL('http://localhost:3000/api/barbers/barber-1/availability?reservation_id=reservation-1');
      const request = new NextRequest(url, { method: 'DELETE' });
      
      const response = await DELETE(request, { params: { id: 'barber-1' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Authentication required');
    });

    it('should return 400 for missing reservation_id', async () => {
      const url = new URL('http://localhost:3000/api/barbers/barber-1/availability');
      const request = new NextRequest(url, { method: 'DELETE' });
      
      const response = await DELETE(request, { params: { id: 'barber-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('reservation_id');
    });
  });
});