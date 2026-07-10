import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs';
import { z } from 'zod';

// Validation schemas
const createAppointmentSchema = z.object({
  barberId: z.string().uuid(),
  serviceIds: z.array(z.string().uuid()).min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  locationType: z.enum(['shop', 'home']).default('shop'),
  serviceAddress: z.string().min(1).optional(),
  serviceLatitude: z.number().min(-90).max(90).optional(),
  serviceLongitude: z.number().min(-180).max(180).optional(),
  notes: z.string().max(500).optional(),
  reservationId: z.string().uuid().optional(),
}).refine(
  (data) => {
    if (data.locationType === 'home') {
      return data.serviceAddress && data.serviceLatitude !== undefined && data.serviceLongitude !== undefined;
    }
    return true;
  },
  {
    message: 'Service address, latitude, and longitude are required for home visits',
    path: ['serviceAddress'],
  }
);

const updateAppointmentSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']).optional(),
  notes: z.string().max(500).optional(),
  clientNotes: z.string().max(500).optional(),
  barberNotes: z.string().max(500).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'partial', 'refunded']).optional(),
});

const appointmentQuerySchema = z.object({
  status: z.string().optional(),
  barberId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.string().transform(str => parseInt(str) || 1).optional(),
  limit: z.string().transform(str => Math.min(parseInt(str) || 10, 50)).optional(),
});

interface AppointmentWithDetails {
  id: string;
  client_id: string;
  barber_id: string;
  service_ids: string[];
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  client_notes: string | null;
  barber_notes: string | null;
  total_price: number;
  payment_status: string;
  location_type: string;
  service_address: string | null;
  service_latitude: number | null;
  service_longitude: number | null;
  travel_fee: number | null;
  travel_distance: number | null;
  travel_time: number | null;
  created_at: string;
  updated_at: string;
  client: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
  };
  barber: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
    barber_profiles: {
      business_name: string | null;
      phone: string | null;
      offers_home_visits: boolean | null;
      home_visit_fee_base: number | null;
      home_visit_fee_per_km: number | null;
      max_travel_distance: number | null;
    };
  };
  services: {
    id: string;
    name: string;
    duration: number;
    price: number;
  }[];
}

// GET /api/appointments - List appointments with filtering
export async function GET(request: NextRequest) {
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
    const queryParams = {
      status: searchParams.get('status'),
      barberId: searchParams.get('barberId'),
      clientId: searchParams.get('clientId'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    };

    const validatedParams = appointmentQuerySchema.parse(queryParams);
    const { status, barberId, clientId, startDate, endDate, page = 1, limit = 10 } = validatedParams;

    const supabase = createClient();

    // Get user role to determine access
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Build query based on user role and filters
    let query = supabase
      .from('appointments')
      .select(`
        id,
        client_id,
        barber_id,
        service_ids,
        appointment_date,
        start_time,
        end_time,
        status,
        notes,
        client_notes,
        barber_notes,
        total_price,
        payment_status,
        location_type,
        service_address,
        service_latitude,
        service_longitude,
        travel_fee,
        travel_distance,
        travel_time,
        created_at,
        updated_at,
        client:users!appointments_client_id_fkey (
          id,
          name,
          email,
          phone,
          avatar_url
        ),
        barber:users!appointments_barber_id_fkey (
          id,
          name,
          email,
          phone,
          avatar_url,
          barber_profiles (
            business_name,
            phone,
            offers_home_visits,
            home_visit_fee_base,
            home_visit_fee_per_km,
            max_travel_distance
          )
        )
      `);

    // Apply role-based filtering
    if (user.role === 'client') {
      query = query.eq('client_id', userId);
    } else if (user.role === 'barber') {
      query = query.eq('barber_id', userId);
    } else if (user.role === 'admin') {
      // Admin can see all appointments, apply optional filters
      if (barberId) query = query.eq('barber_id', barberId);
      if (clientId) query = query.eq('client_id', clientId);
    } else {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Apply common filters
    if (status) query = query.eq('status', status);
    if (startDate) query = query.gte('appointment_date', startDate);
    if (endDate) query = query.lte('appointment_date', endDate);

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query
      .order('appointment_date', { ascending: true })
      .order('start_time', { ascending: true })
      .range(offset, offset + limit - 1);

    const { data: appointments, error: appointmentsError, count } = await query;

    if (appointmentsError) {
      console.error('Appointments query error:', appointmentsError);
      return NextResponse.json(
        { error: 'Failed to fetch appointments' },
        { status: 500 }
      );
    }

    // Get service details for each appointment
    const appointmentsWithServices = await Promise.all(
      (appointments as AppointmentWithDetails[]).map(async (appointment) => {
        const { data: services } = await supabase
          .from('services')
          .select('id, name, duration, price')
          .in('id', appointment.service_ids);

        return {
          ...appointment,
          services: services || [],
          totalPrice: parseFloat(appointment.total_price.toString()),
        };
      })
    );

    return NextResponse.json({
      appointments: appointmentsWithServices,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });

  } catch (error) {
    console.error('Appointments API error:', error);
    
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

// POST /api/appointments - Create a new appointment
export async function POST(request: NextRequest) {
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
    const validatedData = createAppointmentSchema.parse(body);
    const { barberId, serviceIds, date, startTime, endTime, locationType, serviceAddress, serviceLatitude, serviceLongitude, notes, reservationId } = validatedData;

    const supabase = createClient();

    // Validate user is a client
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role, status')
      .eq('id', userId)
      .single();

    if (userError || !user || user.role !== 'client' || user.status !== 'active') {
      return NextResponse.json(
        { error: 'Only active clients can create appointments' },
        { status: 403 }
      );
    }

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

    // Validate services and calculate base price
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

    const basePrice = services.reduce((sum, service) => sum + parseFloat(service.price.toString()), 0);
    let totalPrice = basePrice;
    let travelFee = 0;
    let travelDistance = null;
    let travelTime = null;

    // Validate home visit if applicable
    if (locationType === 'home') {
      // Check if barber offers home visits
      const { data: barberProfile, error: profileError } = await supabase
        .from('barber_profiles')
        .select('offers_home_visits, location_point')
        .eq('user_id', barberId)
        .single();

      if (profileError || !barberProfile) {
        return NextResponse.json(
          { error: 'Barber profile not found' },
          { status: 404 }
        );
      }

      if (!barberProfile.offers_home_visits) {
        return NextResponse.json(
          { error: 'This barber does not offer home visits' },
          { status: 400 }
        );
      }

      // Validate home visit booking using database function
      const { data: validationResult, error: validationError } = await supabase
        .rpc('validate_home_visit_booking', {
          p_barber_id: barberId,
          p_service_latitude: serviceLatitude,
          p_service_longitude: serviceLongitude,
          p_total_service_price: basePrice,
        });

      if (validationError) {
        console.error('Home visit validation error:', validationError);
        return NextResponse.json(
          { error: 'Failed to validate home visit' },
          { status: 500 }
        );
      }

      const validation = validationResult[0];
      if (!validation.is_valid) {
        return NextResponse.json(
          { 
            error: validation.error_message,
            travelDistance: validation.travel_distance,
            travelFee: validation.travel_fee,
            totalPrice: validation.total_price,
          },
          { status: 400 }
        );
      }

      travelFee = parseFloat(validation.travel_fee.toString());
      travelDistance = parseFloat(validation.travel_distance.toString());
      totalPrice = parseFloat(validation.total_price.toString());

      // Calculate travel time
      const { data: travelInfo, error: travelError } = await supabase
        .rpc('calculate_travel_info', {
          p_barber_lat: barberProfile.location_point ? parseFloat(barberProfile.location_point.coordinates[1]) : null,
          p_barber_lng: barberProfile.location_point ? parseFloat(barberProfile.location_point.coordinates[0]) : null,
          p_service_lat: serviceLatitude,
          p_service_lng: serviceLongitude,
        });

      if (!travelError && travelInfo && travelInfo.length > 0) {
        travelTime = travelInfo[0].estimated_time_minutes;
      }
    }

    // Check if date is not in the past
    const appointmentDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (appointmentDate < today) {
      return NextResponse.json(
        { error: 'Cannot create appointments in the past' },
        { status: 400 }
      );
    }

    // Create appointment using the enhanced database function with location support
    const { data: appointmentResult, error: createError } = await supabase
      .rpc('create_appointment_with_validation', {
        p_client_id: userId,
        p_barber_id: barberId,
        p_service_ids: serviceIds,
        p_appointment_date: date,
        p_start_time: startTime,
        p_location_type: locationType,
        p_service_address: serviceAddress || null,
        p_service_latitude: serviceLatitude || null,
        p_service_longitude: serviceLongitude || null,
        p_notes: notes || null,
      });

    if (createError) {
      console.error('Create appointment error:', createError);
      
      if (createError.message.includes('Time slot is not available')) {
        return NextResponse.json(
          { error: 'Time slot is no longer available' },
          { status: 409 }
        );
      }
      
      if (createError.message.includes('does not offer home visits')) {
        return NextResponse.json(
          { error: 'This barber does not offer home visits' },
          { status: 400 }
        );
      }
      
      if (createError.message.includes('outside the barber\'s service area')) {
        return NextResponse.json(
          { error: 'Service address is outside the barber\'s service area' },
          { status: 400 }
        );
      }
      
      if (createError.message.includes('minimum requirement')) {
        return NextResponse.json(
          { error: createError.message },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create appointment' },
        { status: 500 }
      );
    }

    const result = appointmentResult[0];
    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error_message,
          totalPrice: result.total_price,
          travelFee: result.travel_fee,
        },
        { status: 400 }
      );
    }

    const appointmentId = result.appointment_id;



    // Fetch the created appointment with full details
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        id,
        client_id,
        barber_id,
        service_ids,
        appointment_date,
        start_time,
        end_time,
        status,
        notes,
        total_price,
        payment_status,
        location_type,
        service_address,
        service_latitude,
        service_longitude,
        travel_fee,
        travel_distance,
        travel_time,
        created_at,
        client:users!appointments_client_id_fkey (
          id,
          name,
          email,
          phone
        ),
        barber:users!appointments_barber_id_fkey (
          id,
          name,
          email,
          barber_profiles (
            business_name,
            phone,
            offers_home_visits,
            home_visit_fee_base,
            home_visit_fee_per_km,
            max_travel_distance
          )
        )
      `)
      .eq('id', appointmentId)
      .single();

    if (fetchError || !appointment) {
      console.error('Fetch appointment error:', fetchError);
      return NextResponse.json(
        { error: 'Appointment created but failed to fetch details' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      appointment: {
        ...appointment,
        services,
        totalPrice: result.total_price,
        travelFee: result.travel_fee,
        basePrice,
      },
      message: 'Appointment created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Create appointment API error:', error);
    
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