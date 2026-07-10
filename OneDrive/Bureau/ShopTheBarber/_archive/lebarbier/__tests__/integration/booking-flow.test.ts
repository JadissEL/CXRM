import { createMocks } from 'node-mocks-http';
import { NextRequest } from 'next/server';
import { GET as getAvailability, POST as reserveSlot } from '@/app/api/barbers/[id]/availability/route';
import { POST as createAppointment } from '@/app/api/appointments/route';
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

describe('Booking Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockReturnValue(mockSupabase as any);
    mockAuth.mockReturnValue({ userId: 'user-1' } as any);
  });

  describe('Complete booking flow', () => {
    it('should complete full booking flow: check availability -> reserve slot -> create appointment', async () => {
      const barberId = 'barber-1';
      const serviceId = 'service-1';
      const appointmentDate = '2024-01-15';
      const startTime = '09:00:00';
      const endTime = '09:30:00';

      // Step 1: Check availability
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockReturnValueOnce({
              single: jest.fn().mockResolvedValueOnce({
                data: { id: barberId, name: 'Jane Smith' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            in: jest.fn().mockReturnValueOnce({
              eq: jest.fn().mockResolvedValueOnce({
                data: [{ id: serviceId, duration: 30 }],
                error: null,
              }),
            }),
          }),
        });

      mockSupabase.rpc.mockResolvedValueOnce({
        data: [
          {
            slot_start: startTime,
            slot_end: endTime,
            is_available: true,
          },
        ],
        error: null,
      });

      const availabilityUrl = new URL(
        `http://localhost:3000/api/barbers/${barberId}/availability?date=${appointmentDate}&service_ids=${serviceId}`
      );
      const availabilityRequest = new NextRequest(availabilityUrl);
      
      const availabilityResponse = await getAvailability(availabilityRequest, { params: { id: barberId } });
      const availabilityData = await availabilityResponse.json();

      expect(availabilityResponse.status).toBe(200);
      expect(availabilityData.success).toBe(true);
      expect(availabilityData.data.slots).toHaveLength(1);
      expect(availabilityData.data.slots[0].is_available).toBe(true);

      // Step 2: Reserve the slot
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockReturnValueOnce({
              single: jest.fn().mockResolvedValueOnce({
                data: { id: barberId, name: 'Jane Smith' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            in: jest.fn().mockReturnValueOnce({
              eq: jest.fn().mockResolvedValueOnce({
                data: [{ id: serviceId, duration: 30 }],
                error: null,
              }),
            }),
          }),
        });

      mockSupabase.rpc.mockResolvedValueOnce({
        data: {
          id: 'reservation-1',
          expires_at: '2024-01-15T09:15:00Z',
        },
        error: null,
      });

      const reservationBody = {
        date: appointmentDate,
        start_time: startTime,
        end_time: endTime,
        service_ids: [serviceId],
      };

      const reservationRequest = new NextRequest(
        `http://localhost:3000/api/barbers/${barberId}/availability`,
        {
          method: 'POST',
          body: JSON.stringify(reservationBody),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      
      const reservationResponse = await reserveSlot(reservationRequest, { params: { id: barberId } });
      const reservationData = await reservationResponse.json();

      expect(reservationResponse.status).toBe(200);
      expect(reservationData.success).toBe(true);
      expect(reservationData.data.reservation_id).toBe('reservation-1');

      // Step 3: Create appointment
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockReturnValueOnce({
              single: jest.fn().mockResolvedValueOnce({
                data: { id: 'user-1', status: 'active' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockReturnValueOnce({
              single: jest.fn().mockResolvedValueOnce({
                data: { id: barberId, status: 'active' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            in: jest.fn().mockReturnValueOnce({
              eq: jest.fn().mockResolvedValueOnce({
                data: [{ id: serviceId, name: 'Haircut', price: 25, duration: 30 }],
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockReturnValueOnce({
              single: jest.fn().mockResolvedValueOnce({
                data: {
                  id: 'appointment-1',
                  appointment_date: appointmentDate,
                  start_time: startTime,
                  end_time: endTime,
                  status: 'confirmed',
                  client: { id: 'user-1', name: 'John Doe' },
                  barber: { id: barberId, name: 'Jane Smith' },
                  services: [{ id: serviceId, name: 'Haircut', price: 25 }],
                },
                error: null,
              }),
            }),
          }),
        });

      mockSupabase.rpc.mockResolvedValueOnce({
        data: {
          id: 'appointment-1',
          appointment_date: appointmentDate,
          start_time: startTime,
          end_time: endTime,
          status: 'confirmed',
        },
        error: null,
      });

      const appointmentBody = {
        barber_id: barberId,
        service_ids: [serviceId],
        appointment_date: appointmentDate,
        start_time: startTime,
        end_time: endTime,
        client_notes: 'Please be on time',
        deposit_amount: 10,
        reservation_id: 'reservation-1',
      };

      const appointmentRequest = new NextRequest('http://localhost:3000/api/appointments', {
        method: 'POST',
        body: JSON.stringify(appointmentBody),
        headers: { 'Content-Type': 'application/json' },
      });
      
      const appointmentResponse = await createAppointment(appointmentRequest);
      const appointmentData = await appointmentResponse.json();

      expect(appointmentResponse.status).toBe(201);
      expect(appointmentData.success).toBe(true);
      expect(appointmentData.data.appointment.id).toBe('appointment-1');
      expect(appointmentData.data.appointment.status).toBe('confirmed');
    });

    it('should handle slot conflicts during booking flow', async () => {
      const barberId = 'barber-1';
      const serviceId = 'service-1';
      const appointmentDate = '2024-01-15';
      const startTime = '09:00:00';
      const endTime = '09:30:00';

      // Step 1: Check availability - slot is available
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockReturnValueOnce({
              single: jest.fn().mockResolvedValueOnce({
                data: { id: barberId, name: 'Jane Smith' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            in: jest.fn().mockReturnValueOnce({
              eq: jest.fn().mockResolvedValueOnce({
                data: [{ id: serviceId, duration: 30 }],
                error: null,
              }),
            }),
          }),
        });

      mockSupabase.rpc.mockResolvedValueOnce({
        data: [
          {
            slot_start: startTime,
            slot_end: endTime,
            is_available: true,
          },
        ],
        error: null,
      });

      const availabilityUrl = new URL(
        `http://localhost:3000/api/barbers/${barberId}/availability?date=${appointmentDate}&service_ids=${serviceId}`
      );
      const availabilityRequest = new NextRequest(availabilityUrl);
      
      const availabilityResponse = await getAvailability(availabilityRequest, { params: { id: barberId } });
      expect(availabilityResponse.status).toBe(200);

      // Step 2: Try to reserve slot - but it's already taken
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockReturnValueOnce({
              single: jest.fn().mockResolvedValueOnce({
                data: { id: barberId, name: 'Jane Smith' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            in: jest.fn().mockReturnValueOnce({
              eq: jest.fn().mockResolvedValueOnce({
                data: [{ id: serviceId, duration: 30 }],
                error: null,
              }),
            }),
          }),
        });

      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Slot is already reserved or booked' },
      });

      const reservationBody = {
        date: appointmentDate,
        start_time: startTime,
        end_time: endTime,
        service_ids: [serviceId],
      };

      const reservationRequest = new NextRequest(
        `http://localhost:3000/api/barbers/${barberId}/availability`,
        {
          method: 'POST',
          body: JSON.stringify(reservationBody),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      
      const reservationResponse = await reserveSlot(reservationRequest, { params: { id: barberId } });
      const reservationData = await reservationResponse.json();

      expect(reservationResponse.status).toBe(409);
      expect(reservationData.success).toBe(false);
      expect(reservationData.error).toContain('already reserved');
    });

    it('should handle expired reservations during appointment creation', async () => {
      const barberId = 'barber-1';
      const serviceId = 'service-1';
      const appointmentDate = '2024-01-15';
      const startTime = '09:00:00';
      const endTime = '09:30:00';

      // Mock user and barber validation
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockReturnValueOnce({
              single: jest.fn().mockResolvedValueOnce({
                data: { id: 'user-1', status: 'active' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockReturnValueOnce({
              single: jest.fn().mockResolvedValueOnce({
                data: { id: barberId, status: 'active' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            in: jest.fn().mockReturnValueOnce({
              eq: jest.fn().mockResolvedValueOnce({
                data: [{ id: serviceId, name: 'Haircut', price: 25, duration: 30 }],
                error: null,
              }),
            }),
          }),
        });

      // Mock appointment creation failure due to expired reservation
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Reservation has expired or does not exist' },
      });

      const appointmentBody = {
        barber_id: barberId,
        service_ids: [serviceId],
        appointment_date: appointmentDate,
        start_time: startTime,
        end_time: endTime,
        reservation_id: 'expired-reservation',
      };

      const appointmentRequest = new NextRequest('http://localhost:3000/api/appointments', {
        method: 'POST',
        body: JSON.stringify(appointmentBody),
        headers: { 'Content-Type': 'application/json' },
      });
      
      const appointmentResponse = await createAppointment(appointmentRequest);
      const appointmentData = await appointmentResponse.json();

      expect(appointmentResponse.status).toBe(409);
      expect(appointmentData.success).toBe(false);
      expect(appointmentData.error).toContain('expired');
    });

    it('should handle multiple service bookings', async () => {
      const barberId = 'barber-1';
      const serviceIds = ['service-1', 'service-2'];
      const appointmentDate = '2024-01-15';
      const startTime = '09:00:00';
      const endTime = '09:45:00'; // 45 minutes for two services

      // Check availability for multiple services
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockReturnValueOnce({
              single: jest.fn().mockResolvedValueOnce({
                data: { id: barberId, name: 'Jane Smith' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            in: jest.fn().mockReturnValueOnce({
              eq: jest.fn().mockResolvedValueOnce({
                data: [
                  { id: 'service-1', duration: 30 },
                  { id: 'service-2', duration: 15 },
                ],
                error: null,
              }),
            }),
          }),
        });

      mockSupabase.rpc.mockResolvedValueOnce({
        data: [
          {
            slot_start: startTime,
            slot_end: endTime,
            is_available: true,
          },
        ],
        error: null,
      });

      const availabilityUrl = new URL(
        `http://localhost:3000/api/barbers/${barberId}/availability?date=${appointmentDate}&service_ids=${serviceIds.join(',')}`
      );
      const availabilityRequest = new NextRequest(availabilityUrl);
      
      const availabilityResponse = await getAvailability(availabilityRequest, { params: { id: barberId } });
      const availabilityData = await availabilityResponse.json();

      expect(availabilityResponse.status).toBe(200);
      expect(availabilityData.success).toBe(true);
      expect(availabilityData.data.slots[0].start_time).toBe(startTime);
      expect(availabilityData.data.slots[0].end_time).toBe(endTime);
    });

    it('should validate working hours constraints', async () => {
      const barberId = 'barber-1';
      const serviceId = 'service-1';
      const appointmentDate = '2024-01-15';
      const startTime = '06:00:00'; // Before working hours
      const endTime = '06:30:00';

      // Mock barber exists
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockReturnValueOnce({
              single: jest.fn().mockResolvedValueOnce({
                data: { id: barberId, name: 'Jane Smith' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            in: jest.fn().mockReturnValueOnce({
              eq: jest.fn().mockResolvedValueOnce({
                data: [{ id: serviceId, duration: 30 }],
                error: null,
              }),
            }),
          }),
        });

      // Mock no availability outside working hours
      mockSupabase.rpc.mockResolvedValueOnce({
        data: [], // No available slots
        error: null,
      });

      const availabilityUrl = new URL(
        `http://localhost:3000/api/barbers/${barberId}/availability?date=${appointmentDate}&service_ids=${serviceId}&start_time=${startTime}&end_time=${endTime}`
      );
      const availabilityRequest = new NextRequest(availabilityUrl);
      
      const availabilityResponse = await getAvailability(availabilityRequest, { params: { id: barberId } });
      const availabilityData = await availabilityResponse.json();

      expect(availabilityResponse.status).toBe(200);
      expect(availabilityData.success).toBe(true);
      expect(availabilityData.data.slots).toHaveLength(0);
    });
  });

  describe('Real-time behavior simulation', () => {
    it('should handle concurrent booking attempts', async () => {
      const barberId = 'barber-1';
      const serviceId = 'service-1';
      const appointmentDate = '2024-01-15';
      const startTime = '09:00:00';
      const endTime = '09:30:00';

      // First user successfully reserves the slot
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockReturnValueOnce({
              single: jest.fn().mockResolvedValueOnce({
                data: { id: barberId, name: 'Jane Smith' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            in: jest.fn().mockReturnValueOnce({
              eq: jest.fn().mockResolvedValueOnce({
                data: [{ id: serviceId, duration: 30 }],
                error: null,
              }),
            }),
          }),
        });

      mockSupabase.rpc.mockResolvedValueOnce({
        data: {
          id: 'reservation-1',
          expires_at: '2024-01-15T09:15:00Z',
        },
        error: null,
      });

      const reservationBody = {
        date: appointmentDate,
        start_time: startTime,
        end_time: endTime,
        service_ids: [serviceId],
      };

      const firstUserRequest = new NextRequest(
        `http://localhost:3000/api/barbers/${barberId}/availability`,
        {
          method: 'POST',
          body: JSON.stringify(reservationBody),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      
      const firstUserResponse = await reserveSlot(firstUserRequest, { params: { id: barberId } });
      expect(firstUserResponse.status).toBe(200);

      // Second user tries to reserve the same slot - should fail
      mockAuth.mockReturnValue({ userId: 'user-2' } as any);
      
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockReturnValueOnce({
              single: jest.fn().mockResolvedValueOnce({
                data: { id: barberId, name: 'Jane Smith' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            in: jest.fn().mockReturnValueOnce({
              eq: jest.fn().mockResolvedValueOnce({
                data: [{ id: serviceId, duration: 30 }],
                error: null,
              }),
            }),
          }),
        });

      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Slot is already reserved or booked' },
      });

      const secondUserRequest = new NextRequest(
        `http://localhost:3000/api/barbers/${barberId}/availability`,
        {
          method: 'POST',
          body: JSON.stringify(reservationBody),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      
      const secondUserResponse = await reserveSlot(secondUserRequest, { params: { id: barberId } });
      expect(secondUserResponse.status).toBe(409);
    });
  });
});