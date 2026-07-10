import { describe, it, expect, jest, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/appointments/route';
import { POST as NotificationPOST } from '@/app/api/notifications/booking-confirmation/route';
import { createClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs';

// Mock dependencies
jest.mock('../../../lib/supabase');
jest.mock('@clerk/nextjs');

const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      }))
    })),
    insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
    update: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  })),
  rpc: jest.fn(() => Promise.resolve({ data: null, error: null }))
};

const mockAuth = {
  userId: 'user_123',
  sessionClaims: {
    metadata: {
      role: 'client'
    }
  }
};

const mockBarber = {
  id: 'barber_123',
  name: 'Mike Johnson',
  email: 'mike@barbershop.com',
  phone: '+1234567890',
  is_active: true,
  status: 'active'
};

const mockServices = [
  {
    id: 'service_1',
    name: 'Classic Haircut',
    description: 'Traditional haircut with styling',
    duration: 30,
    price: 25.00,
    category: 'Haircut',
    is_active: true,
    barber_id: 'barber_123'
  },
  {
    id: 'service_2',
    name: 'Beard Trim',
    description: 'Professional beard trimming and shaping',
    duration: 15,
    price: 15.00,
    category: 'Beard',
    is_active: true,
    barber_id: 'barber_123'
  },
  {
    id: 'service_3',
    name: 'Hair Wash & Style',
    description: 'Deep cleansing wash with professional styling',
    duration: 20,
    price: 20.00,
    category: 'Styling',
    is_active: true,
    barber_id: 'barber_123'
  }
];

const mockAppointment = {
  id: 'appointment_123',
  barber_id: 'barber_123',
  client_id: 'user_123',
  service_ids: ['service_1', 'service_2'],
  appointment_date: '2024-01-15',
  start_time: '09:00:00',
  end_time: '09:45:00',
  status: 'confirmed',
  total_price: 40.00,
  deposit_amount: 8.00,
  notes: 'Test appointment',
  client_name: 'John Doe',
  client_email: 'john@example.com',
  client_phone: '+1234567890',
  created_at: '2024-01-10T10:00:00Z',
  updated_at: '2024-01-10T10:00:00Z'
};

describe('Multi-Service Booking API Integration Tests', () => {
  beforeEach(() => {
    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
    (auth as jest.Mock).mockReturnValue(mockAuth);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/appointments - Multi-Service Booking Creation', () => {
    it('should create appointment with single service successfully', async () => {
      // Mock user profile check
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: { id: 'user_123', role: 'client' },
                error: null
              })),
              order: jest.fn(() => ({
                limit: jest.fn(() => Promise.resolve({
                  data: [],
                  error: null
                }))
              }))
            }))
          }))
        })),
        insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        delete: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      });

      // Mock barber check
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: mockBarber,
                error: null
              })),
              order: jest.fn(() => ({
                limit: jest.fn(() => Promise.resolve({
                  data: [],
                  error: null
                }))
              }))
            }))
          }))
        })),
        insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        delete: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      });

      // Mock services check
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: mockServices[0],
                error: null
              })),
              order: jest.fn(() => ({
                limit: jest.fn(() => Promise.resolve({
                  data: [],
                  error: null
                }))
              }))
            }))
          }))
        })),
        insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        delete: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      });

      // Mock appointment creation
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: 'appointment_123',
        error: null
      });

      // Mock appointment fetch with details
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: {
                  ...mockAppointment,
                  service_ids: ['service_1'],
                  total_price: 25.00,
                  deposit_amount: 5.00
                },
                error: null
              })),
              order: jest.fn(() => ({
                limit: jest.fn(() => Promise.resolve({
                  data: [],
                  error: null
                }))
              }))
            }))
          }))
        })),
        insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        delete: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      });

      const request = new NextRequest('http://localhost:3000/api/appointments', {
        method: 'POST',
        body: JSON.stringify({
          barber_id: 'barber_123',
          service_ids: ['service_1'],
          appointment_date: '2024-01-15',
          start_time: '09:00',
          notes: 'Single service test',
          client_phone: '+1234567890',
          client_email: 'john@example.com',
          client_name: 'John Doe'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(201);
      expect(result.id).toBe('appointment_123');
      expect(result.service_ids).toEqual(['service_1']);
      expect(result.total_price).toBe(25.00);
    });

    it('should create appointment with multiple services successfully', async () => {
      // Mock user profile check
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: { id: 'user_123', role: 'client' },
                error: null
              })),
              order: jest.fn(() => ({
                limit: jest.fn(() => Promise.resolve({
                  data: [],
                  error: null
                }))
              }))
            }))
          }))
        })),
        insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        delete: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      });

      // Mock barber check
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: mockBarber,
                error: null
              })),
              order: jest.fn(() => ({
                limit: jest.fn(() => Promise.resolve({
                  data: [],
                  error: null
                }))
              }))
            }))
          }))
        }))
      });

      // Mock services check
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: mockServices[0],
                error: null
              })),
              order: jest.fn(() => ({
                limit: jest.fn(() => Promise.resolve({
                  data: [],
                  error: null
                }))
              }))
            }))
          }))
        })),
        insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        delete: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      });

      // Mock appointment creation
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: 'appointment_123',
        error: null
      });

      // Mock appointment fetch with details
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: {
                  ...mockAppointment,
                  service_ids: ['service_1', 'service_2', 'service_3'],
                  total_price: 60.00,
                  deposit_amount: 12.00
                },
                error: null
              })),
              order: jest.fn(() => ({
                limit: jest.fn(() => Promise.resolve({
                  data: [],
                  error: null
                }))
              }))
            }))
          }))
        })),
        insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        delete: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      });

      const request = new NextRequest('http://localhost:3000/api/appointments', {
        method: 'POST',
        body: JSON.stringify({
          barber_id: 'barber_123',
          service_ids: ['service_1', 'service_2', 'service_3'],
          appointment_date: '2024-01-15',
          start_time: '09:00',
          notes: 'Multi-service test',
          client_phone: '+1234567890',
          client_email: 'john@example.com',
          client_name: 'John Doe'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(201);
      expect(result.id).toBe('appointment_123');
      expect(result.service_ids).toEqual(['service_1', 'service_2', 'service_3']);
      expect(result.total_price).toBe(60.00);
    });

    it('should handle invalid service IDs', async () => {
      // Mock user profile check
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: { id: 'user_123', role: 'client' },
              error: null
            }))
          }))
        }))
      });

      // Mock barber check
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: mockBarber,
                error: null
              })),
              order: jest.fn(() => ({
                limit: jest.fn(() => Promise.resolve({
                  data: [],
                  error: null
                }))
              }))
            }))
          }))
        }))
      });

      // Mock services check - return empty array for invalid service IDs
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: null,
                error: null
              })),
              order: jest.fn(() => ({
                limit: jest.fn(() => Promise.resolve({
                  data: [],
                  error: null
                }))
              }))
            }))
          }))
        })),
        insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        delete: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      });

      const request = new NextRequest('http://localhost:3000/api/appointments', {
        method: 'POST',
        body: JSON.stringify({
          barber_id: 'barber_123',
          service_ids: ['invalid_service_id'],
          appointment_date: '2024-01-15',
          start_time: '09:00',
          client_phone: '+1234567890',
          client_email: 'john@example.com',
          client_name: 'John Doe'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toContain('Invalid service IDs');
    });

    it('should handle slot conflicts', async () => {
      // Mock user profile check
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: { id: 'user_123', role: 'client' },
              error: null
            }))
          }))
        }))
      });

      // Mock barber check
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: mockBarber,
                error: null
              })),
              order: jest.fn(() => ({
                limit: jest.fn(() => Promise.resolve({
                  data: [],
                  error: null
                }))
              }))
            }))
          }))
        }))
      });

      // Mock services check
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: mockServices[0],
                error: null
              })),
              order: jest.fn(() => ({
                limit: jest.fn(() => Promise.resolve({
                  data: [],
                  error: null
                }))
              }))
            }))
          }))
        })),
        insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        delete: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      });

      // Mock appointment creation with conflict error
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Time slot is not available' }
      });

      const request = new NextRequest('http://localhost:3000/api/appointments', {
        method: 'POST',
        body: JSON.stringify({
          barber_id: 'barber_123',
          service_ids: ['service_1'],
          appointment_date: '2024-01-15',
          start_time: '09:00',
          client_phone: '+1234567890',
          client_email: 'john@example.com',
          client_name: 'John Doe'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(409);
      expect(result.error).toContain('Time slot is not available');
    });

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/appointments', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required fields
          barber_id: 'barber_123'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toContain('validation');
    });

    it('should handle unauthorized access', async () => {
      (auth as jest.Mock).mockReturnValueOnce({ userId: null });

      const request = new NextRequest('http://localhost:3000/api/appointments', {
        method: 'POST',
        body: JSON.stringify({
          barber_id: 'barber_123',
          service_ids: ['service_1'],
          appointment_date: '2024-01-15',
          start_time: '09:00',
          client_phone: '+1234567890',
          client_email: 'john@example.com',
          client_name: 'John Doe'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.error).toBe('Unauthorized');
    });
  });

  describe('GET /api/appointments - Multi-Service Appointment Retrieval', () => {
    it('should retrieve appointments with service details', async () => {
      const appointmentWithServices = {
        ...mockAppointment,
        barber: mockBarber,
        services: [
          { service: mockServices[0] },
          { service: mockServices[1] }
        ]
      };

      // Mock appointments query
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({
                data: [appointmentWithServices],
                error: null
              }))
            }))
          }))
        }))
      });

      // Mock count query
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: { count: 1 },
              error: null
            }))
          }))
        }))
      });

      const request = new NextRequest('http://localhost:3000/api/appointments?page=1&limit=10');
      const response = await GET(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.appointments).toHaveLength(1);
      expect(result.appointments[0].services).toHaveLength(2);
      expect(result.appointments[0].totalPrice).toBe(40.00);
    });

    it('should filter appointments by status', async () => {
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(() => Promise.resolve({
                  data: [{ ...mockAppointment, status: 'confirmed' }],
                  error: null
                }))
              }))
            }))
          }))
        }))
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: { count: 1 },
                error: null
              }))
            }))
          }))
        }))
      });

      const request = new NextRequest('http://localhost:3000/api/appointments?status=confirmed');
      const response = await GET(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.appointments[0].status).toBe('confirmed');
    });

    it('should handle pagination correctly', async () => {
      const appointments = Array.from({ length: 5 }, (_, i) => ({
        ...mockAppointment,
        id: `appointment_${i + 1}`
      }));

      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({
                data: appointments.slice(0, 3),
                error: null
              }))
            }))
          }))
        }))
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: { count: 5 },
              error: null
            }))
          }))
        }))
      });

      const request = new NextRequest('http://localhost:3000/api/appointments?page=1&limit=3');
      const response = await GET(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.appointments).toHaveLength(3);
      expect(result.pagination.total).toBe(5);
      expect(result.pagination.pages).toBe(2);
    });
  });

  describe('POST /api/notifications/booking-confirmation - Notification Integration', () => {
    it('should send booking confirmation with service details', async () => {
      // Mock appointment verification
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: { id: 'appointment_123', client_id: 'user_123' },
                error: null
              })),
              order: jest.fn(() => ({
                limit: jest.fn(() => Promise.resolve({
                  data: [],
                  error: null
                }))
              }))
            }))
          }))
        })),
        insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        delete: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      });

      // Mock notification logging
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: null,
                error: null
              })),
              order: jest.fn(() => ({
                limit: jest.fn(() => Promise.resolve({
                  data: [],
                  error: null
                }))
              }))
            }))
          }))
        })),
        insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        delete: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      });

      const request = new NextRequest('http://localhost:3000/api/notifications/booking-confirmation', {
        method: 'POST',
        body: JSON.stringify({
          appointmentId: 'appointment_123',
          clientEmail: 'john@example.com',
          clientName: 'John Doe',
          barberName: 'Mike Johnson',
          appointmentDate: '2024-01-15',
          startTime: '09:00',
          services: [
            {
              id: 'service_1',
              name: 'Classic Haircut',
              description: 'Traditional haircut with styling',
              duration: 30,
              price: 25.00,
              category: 'Haircut'
            },
            {
              id: 'service_2',
              name: 'Beard Trim',
              description: 'Professional beard trimming and shaping',
              duration: 15,
              price: 15.00,
              category: 'Beard'
            }
          ],
          totalPrice: 40.00,
          depositAmount: 8.00
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await NotificationPOST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.emailSent).toBe(true);
    });

    it('should handle invalid appointment ID', async () => {
      // Mock appointment verification - not found
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Appointment not found' }
            }))
          }))
        }))
      });

      const request = new NextRequest('http://localhost:3000/api/notifications/booking-confirmation', {
        method: 'POST',
        body: JSON.stringify({
          appointmentId: 'invalid_appointment_id',
          clientEmail: 'john@example.com',
          clientName: 'John Doe',
          barberName: 'Mike Johnson',
          appointmentDate: '2024-01-15',
          startTime: '09:00',
          services: [],
          totalPrice: 0,
          depositAmount: 0
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await NotificationPOST(request);
      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.error).toBe('Appointment not found');
    });
  });

  describe('End-to-End Multi-Service Booking Flow', () => {
    it('should complete full booking flow with multiple services', async () => {
      // Step 1: Create appointment
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: { id: 'user_123', role: 'client' },
              error: null
            }))
          }))
        }))
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: mockBarber,
                error: null
              }))
            }))
          }))
        }))
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          in: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => Promise.resolve({
                data: [mockServices[0], mockServices[1]],
                error: null
              }))
            }))
          }))
        }))
      });

      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: 'appointment_123',
        error: null
      });

      const createdAppointment = {
        ...mockAppointment,
        service_ids: ['service_1', 'service_2'],
        total_price: 40.00,
        deposit_amount: 8.00
      };

      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: createdAppointment,
              error: null
            }))
          }))
        }))
      });

      const createRequest = new NextRequest('http://localhost:3000/api/appointments', {
        method: 'POST',
        body: JSON.stringify({
          barber_id: 'barber_123',
          service_ids: ['service_1', 'service_2'],
          appointment_date: '2024-01-15',
          start_time: '09:00',
          notes: 'E2E test',
          client_phone: '+1234567890',
          client_email: 'john@example.com',
          client_name: 'John Doe'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const createResponse = await POST(createRequest);
      const createResult = await createResponse.json();

      expect(createResponse.status).toBe(201);
      expect(createResult.id).toBe('appointment_123');
      expect(createResult.service_ids).toEqual(['service_1', 'service_2']);
      expect(createResult.total_price).toBe(40.00);

      // Step 2: Send confirmation notification
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: { id: 'appointment_123', client_id: 'user_123' },
              error: null
            }))
          }))
        }))
      });

      mockSupabaseClient.from.mockReturnValueOnce({
        insert: jest.fn(() => Promise.resolve({ data: null, error: null }))
      });

      const notificationRequest = new NextRequest('http://localhost:3000/api/notifications/booking-confirmation', {
        method: 'POST',
        body: JSON.stringify({
          appointmentId: 'appointment_123',
          clientEmail: 'john@example.com',
          clientName: 'John Doe',
          barberName: 'Mike Johnson',
          appointmentDate: '2024-01-15',
          startTime: '09:00',
          services: [
            {
              id: 'service_1',
              name: 'Classic Haircut',
              description: 'Traditional haircut with styling',
              duration: 30,
              price: 25.00,
              category: 'Haircut'
            },
            {
              id: 'service_2',
              name: 'Beard Trim',
              description: 'Professional beard trimming and shaping',
              duration: 15,
              price: 15.00,
              category: 'Beard'
            }
          ],
          totalPrice: 40.00,
          depositAmount: 8.00
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const notificationResponse = await NotificationPOST(notificationRequest);
      const notificationResult = await notificationResponse.json();

      expect(notificationResponse.status).toBe(200);
      expect(notificationResult.success).toBe(true);
      expect(notificationResult.emailSent).toBe(true);

      // Verify the complete flow
      expect(createResult.service_ids).toHaveLength(2);
      expect(createResult.total_price).toBe(40.00);
      expect(notificationResult.emailSent).toBe(true);
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle multiple concurrent booking requests', async () => {
      const concurrentRequests = 5;
      const requests = Array.from({ length: concurrentRequests }, (_, i) => {
        // Mock responses for each request
        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: { id: 'user_123', role: 'client' },
                error: null
              })),
              eq: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({
                  data: mockBarber,
                  error: null
                })),
                eq: jest.fn(() => Promise.resolve({
                  data: [mockServices[0]],
                  error: null
                }))
              }))
            }))
          }))
        });

        mockSupabaseClient.rpc.mockResolvedValue({
          data: `appointment_${i + 1}`,
          error: null
        });

        return new NextRequest('http://localhost:3000/api/appointments', {
          method: 'POST',
          body: JSON.stringify({
            barber_id: 'barber_123',
            service_ids: ['service_1'],
            appointment_date: '2024-01-15',
            start_time: `${9 + i}:00`,
            client_phone: '+1234567890',
            client_email: `user${i}@example.com`,
            client_name: `User ${i}`
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        });
      });

      const responses = await Promise.all(
        requests.map(request => POST(request))
      );

      responses.forEach((response, index) => {
        expect(response.status).toBe(201);
      });
    });
  });
});
