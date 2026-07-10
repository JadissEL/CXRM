import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs';
import { z } from 'zod';

// Validation schemas
const availabilityQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  serviceIds: z.string().transform(str => str.split(',').filter(Boolean)),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)').optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)').optional(),
});

const reserveSlotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  serviceIds: z.array(z.string().uuid()),
  durationMinutes: z.number().min(5).max(60).default(10),
});

interface AvailabilitySlot {
  slot_start: string;
  slot_end: string;
  is_available: boolean;
  total_duration: number;
  total_price: number;
}

interface ServiceInfo {
  id: string;
  name: string;
  duration: number;
  price: number;
}

// GET /api/barbers/[id]/availability - Get available time slots
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = {
      date: searchParams.get('date'),
      serviceIds: searchParams.get('serviceIds') || '',
      startTime: searchParams.get('startTime'),
      endTime: searchParams.get('endTime'),
    };

    // Validate query parameters
    const validatedParams = availabilityQuerySchema.parse(queryParams);
    const { date, serviceIds, startTime, endTime } = validatedParams;
    const barberId = params.id;

    // Validate barber exists and is active
    const supabase = createClient();
    const { data: barber, error: barberError } = await supabase
      .from('users')
      .select(`
        id,
        name,
        status,
        barber_profiles!inner (
          id,
          business_name,
          is_verified
        )
      `)
      .eq('id', barberId)
      .eq('role', 'barber')
      .eq('status', 'active')
      .single();

    if (barberError || !barber) {
      return NextResponse.json(
        { error: 'Barber not found or inactive' },
        { status: 404 }
      );
    }

    // Validate services exist and belong to barber
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name, duration, price')
      .in('id', serviceIds)
      .eq('barber_id', barberId)
      .eq('is_active', true);

    if (servicesError || !services || services.length !== serviceIds.length) {
      return NextResponse.json(
        { error: 'One or more services not found or inactive' },
        { status: 400 }
      );
    }

    // Check if date is not in the past
    const requestDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (requestDate < today) {
      return NextResponse.json(
        { error: 'Cannot book appointments in the past' },
        { status: 400 }
      );
    }

    // Get availability using the database function
    const { data: availability, error: availabilityError } = await supabase
      .rpc('get_barber_availability', {
        p_barber_id: barberId,
        p_date: date,
        p_service_ids: serviceIds,
        p_start_time: startTime || null,
        p_end_time: endTime || null,
      });

    if (availabilityError) {
      console.error('Availability query error:', availabilityError);
      return NextResponse.json(
        { error: 'Failed to fetch availability' },
        { status: 500 }
      );
    }

    // Format response
    const slots = (availability as AvailabilitySlot[]).map(slot => ({
      startTime: slot.slot_start,
      endTime: slot.slot_end,
      isAvailable: slot.is_available,
      duration: slot.total_duration,
      price: parseFloat(slot.total_price.toString()),
    }));

    return NextResponse.json({
      barberId,
      barberName: barber.name,
      businessName: barber.barber_profiles.business_name,
      date,
      services: services.map((service: ServiceInfo) => ({
        id: service.id,
        name: service.name,
        duration: service.duration,
        price: parseFloat(service.price.toString()),
      })),
      slots,
      totalSlots: slots.length,
      availableSlots: slots.filter(slot => slot.isAvailable).length,
    });

  } catch (error) {
    console.error('Availability API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid parameters',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/barbers/[id]/availability - Reserve a time slot temporarily
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = reserveSlotSchema.parse(body);
    const { date, startTime, endTime, serviceIds, durationMinutes } = validatedData;
    const barberId = params.id;

    const supabase = createClient();

    // Validate barber exists and is active
    const { data: barber, error: barberError } = await supabase
      .from('users')
      .select('id, status')
      .eq('id', barberId)
      .eq('role', 'barber')
      .eq('status', 'active')
      .single();

    if (barberError || !barber) {
      return NextResponse.json(
        { error: 'Barber not found or inactive' },
        { status: 404 }
      );
    }

    // Validate services
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, duration, price')
      .in('id', serviceIds)
      .eq('barber_id', barberId)
      .eq('is_active', true);

    if (servicesError || !services || services.length !== serviceIds.length) {
      return NextResponse.json(
        { error: 'One or more services not found or inactive' },
        { status: 400 }
      );
    }

    // Check if date is not in the past
    const requestDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (requestDate < today) {
      return NextResponse.json(
        { error: 'Cannot reserve slots in the past' },
        { status: 400 }
      );
    }

    // Clean up any existing expired reservations for this user
    await supabase
      .from('slot_reservations')
      .delete()
      .eq('client_id', userId)
      .lt('expires_at', new Date().toISOString());

    // Reserve the slot using the database function
    const { data: reservationId, error: reservationError } = await supabase
      .rpc('reserve_time_slot', {
        p_barber_id: barberId,
        p_client_id: userId,
        p_date: date,
        p_start_time: startTime,
        p_end_time: endTime,
        p_service_ids: serviceIds,
        p_duration_minutes: durationMinutes,
      });

    if (reservationError) {
      console.error('Reservation error:', reservationError);
      
      if (reservationError.message.includes('no longer available')) {
        return NextResponse.json(
          { error: 'Time slot is no longer available' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to reserve time slot' },
        { status: 500 }
      );
    }

    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    return NextResponse.json({
      reservationId,
      barberId,
      date,
      startTime,
      endTime,
      serviceIds,
      expiresAt: expiresAt.toISOString(),
      durationMinutes,
      message: 'Time slot reserved successfully',
    });

  } catch (error) {
    console.error('Reservation API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/barbers/[id]/availability - Cancel a reservation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const reservationId = searchParams.get('reservationId');

    if (!reservationId) {
      return NextResponse.json(
        { error: 'Reservation ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Delete the reservation (RLS will ensure user can only delete their own)
    const { error: deleteError } = await supabase
      .from('slot_reservations')
      .delete()
      .eq('id', reservationId)
      .eq('client_id', userId);

    if (deleteError) {
      console.error('Delete reservation error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to cancel reservation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Reservation cancelled successfully',
    });

  } catch (error) {
    console.error('Cancel reservation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}