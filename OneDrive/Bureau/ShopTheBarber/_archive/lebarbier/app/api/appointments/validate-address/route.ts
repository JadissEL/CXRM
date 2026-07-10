import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs';
import { z } from 'zod';

// Validation schema for address validation
const validateAddressSchema = z.object({
  barberId: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().min(1),
  totalServicePrice: z.number().min(0),
});

// POST /api/appointments/validate-address - Validate home visit address and calculate fees
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
    const validatedData = validateAddressSchema.parse(body);
    const { barberId, latitude, longitude, address, totalServicePrice } = validatedData;

    const supabase = createClient();

    // Validate user is a client
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role, status')
      .eq('id', userId)
      .single();

    if (userError || !user || user.role !== 'client' || user.status !== 'active') {
      return NextResponse.json(
        { error: 'Only active clients can validate addresses' },
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

    // Get barber profile to check home visit availability
    const { data: barberProfile, error: profileError } = await supabase
      .from('barber_profiles')
      .select(`
        offers_home_visits,
        location_point,
        home_visit_fee_base,
        home_visit_fee_per_km,
        max_travel_distance,
        min_home_visit_price
      `)
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
        {
          isValid: false,
          error: 'This barber does not offer home visits',
          travelDistance: null,
          travelFee: null,
          totalPrice: null,
          estimatedTravelTime: null,
        },
        { status: 200 }
      );
    }

    // Validate home visit booking using database function
    const { data: validationResult, error: validationError } = await supabase
      .rpc('validate_home_visit_booking', {
        p_barber_id: barberId,
        p_service_latitude: latitude,
        p_service_longitude: longitude,
        p_total_service_price: totalServicePrice,
      });

    if (validationError) {
      console.error('Home visit validation error:', validationError);
      return NextResponse.json(
        { error: 'Failed to validate home visit' },
        { status: 500 }
      );
    }

    const validation = validationResult[0];
    
    // Calculate travel time and distance
    let estimatedTravelTime = null;
    if (barberProfile.location_point) {
      const { data: travelInfo, error: travelError } = await supabase
        .rpc('calculate_travel_info', {
          p_barber_lat: barberProfile.location_point.coordinates[1],
          p_barber_lng: barberProfile.location_point.coordinates[0],
          p_service_lat: latitude,
          p_service_lng: longitude,
        });

      if (!travelError && travelInfo && travelInfo.length > 0) {
        estimatedTravelTime = travelInfo[0].estimated_time_minutes;
      }
    }

    // Check if address is in service area
    const { data: inServiceArea, error: areaError } = await supabase
      .rpc('is_address_in_service_area', {
        p_barber_id: barberId,
        p_latitude: latitude,
        p_longitude: longitude,
      });

    if (areaError) {
      console.error('Service area check error:', areaError);
      return NextResponse.json(
        { error: 'Failed to check service area' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      isValid: validation.is_valid,
      error: validation.error_message,
      address,
      travelDistance: validation.travel_distance,
      travelFee: validation.travel_fee,
      totalPrice: validation.total_price,
      estimatedTravelTime,
      inServiceArea,
      barberInfo: {
        offersHomeVisits: barberProfile.offers_home_visits,
        baseFee: barberProfile.home_visit_fee_base,
        perKmFee: barberProfile.home_visit_fee_per_km,
        maxDistance: barberProfile.max_travel_distance,
        minPrice: barberProfile.min_home_visit_price,
      },
    });

  } catch (error) {
    console.error('Address validation API error:', error);
    
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

// GET /api/appointments/validate-address - Get barber home visit info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barberId = searchParams.get('barberId');

    if (!barberId) {
      return NextResponse.json(
        { error: 'Barber ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get barber home visit information
    const { data: barberProfile, error: profileError } = await supabase
      .from('barber_profiles')
      .select(`
        offers_home_visits,
        home_visit_fee_base,
        home_visit_fee_per_km,
        max_travel_distance,
        min_home_visit_price,
        location_point,
        address_street,
        address_city,
        address_state
      `)
      .eq('user_id', barberId)
      .single();

    if (profileError || !barberProfile) {
      return NextResponse.json(
        { error: 'Barber profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      offersHomeVisits: barberProfile.offers_home_visits,
      baseFee: barberProfile.home_visit_fee_base,
      perKmFee: barberProfile.home_visit_fee_per_km,
      maxDistance: barberProfile.max_travel_distance,
      minPrice: barberProfile.min_home_visit_price,
      shopLocation: {
        coordinates: barberProfile.location_point?.coordinates,
        address: {
          street: barberProfile.address_street,
          city: barberProfile.address_city,
          state: barberProfile.address_state,
        },
      },
    });

  } catch (error) {
    console.error('Get barber home visit info API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}