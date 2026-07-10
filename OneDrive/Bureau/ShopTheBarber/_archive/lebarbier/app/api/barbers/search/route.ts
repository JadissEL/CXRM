import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Validation schema for search parameters
const searchParamsSchema = z.object({
  // Location-based search
  latitude: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  longitude: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  radius: z.string().optional().transform(val => val ? parseFloat(val) : 25), // Default 25km
  location: z.string().optional(), // City/address search
  
  // Service filters
  category: z.enum(['haircut', 'beard_trim', 'shave', 'styling', 'coloring', 'treatment', 'consultation', 'package']).optional(),
  service: z.string().optional(), // Specific service name
  
  // Availability filters
  date: z.string().optional(), // ISO date string
  time: z.string().optional(), // Time in HH:MM format
  duration: z.string().optional().transform(val => val ? parseInt(val) : 30), // Service duration in minutes
  
  // Quality filters
  min_rating: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  verified_only: z.string().optional().transform(val => val === 'true'),
  
  // Price filters
  price_range: z.enum(['$', '$$', '$$$', '$$$$']).optional(),
  min_price: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  max_price: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  
  // Specialty filters
  specialties: z.string().optional(), // Comma-separated list
  languages: z.string().optional(), // Comma-separated list
  
  // Service type filters
  mobile_service: z.string().optional().transform(val => val === 'true'),
  
  // Sorting and pagination
  sort_by: z.enum(['distance', 'rating', 'price', 'reviews', 'newest']).optional().default('distance'),
  sort_order: z.enum(['asc', 'desc']).optional().default('asc'),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val), 50) : 20), // Max 50 results
  
  // Search query
  q: z.string().optional(), // Text search query
});

type SearchParams = z.infer<typeof searchParamsSchema>;

/**
 * GET /api/barbers/search
 * Search and filter barbers based on various criteria
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication (optional for search, but helps with personalization)
    const { userId } = auth();
    
    // Parse and validate search parameters
    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    
    const validatedParams = searchParamsSchema.parse(searchParams);
    
    // Build the search query
    const searchResults = await searchBarbers(validatedParams, userId);
    
    return NextResponse.json({
      success: true,
      data: searchResults.data,
      pagination: {
        page: validatedParams.page,
        limit: validatedParams.limit,
        total: searchResults.total,
        total_pages: Math.ceil(searchResults.total / validatedParams.limit),
        has_next: validatedParams.page * validatedParams.limit < searchResults.total,
        has_prev: validatedParams.page > 1
      },
      filters_applied: getAppliedFilters(validatedParams)
    });
    
  } catch (error) {
    console.error('Barber search error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid search parameters', 
          details: error.errors 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to search barbers' 
      },
      { status: 500 }
    );
  }
}

/**
 * Main search function that builds and executes the query
 */
async function searchBarbers(params: SearchParams, userId?: string | null) {
  let query = supabase
    .from('barber_profiles')
    .select(`
      user_id,
      business_name,
      rating,
      total_reviews,
      price_range,
      specialties,
      address_city,
      address_state,
      phone,
      website_url,
      instagram_handle,
      languages,
      is_mobile,
      service_radius_km,
      location_point,
      users!inner (
        id,
        name,
        avatar_url,
        status
      ),
      services (
        id,
        name,
        category,
        price,
        duration,
        is_active
      ),
      barber_photos (
        id,
        image_url,
        is_featured
      )
    `, { count: 'exact' })
    .eq('users.status', 'active')
    .eq('is_verified', true);

  // Apply filters
  query = applyFilters(query, params);
  
  // Apply text search if query provided
  if (params.q) {
    query = query.textSearch('search_vector', params.q);
  }
  
  // Apply sorting
  query = applySorting(query, params);
  
  // Apply pagination
  const offset = (params.page - 1) * params.limit;
  query = query.range(offset, offset + params.limit - 1);
  
  const { data, error, count } = await query;
  
  if (error) {
    throw new Error(`Database query failed: ${error.message}`);
  }
  
  // Process results to add computed fields
  const processedData = await processSearchResults(data || [], params, userId);
  
  return {
    data: processedData,
    total: count || 0
  };
}

/**
 * Apply various filters to the query
 */
function applyFilters(query: any, params: SearchParams) {
  // Rating filter
  if (params.min_rating) {
    query = query.gte('rating', params.min_rating);
  }
  
  // Price range filter
  if (params.price_range) {
    query = query.eq('price_range', params.price_range);
  }
  
  // Mobile service filter
  if (params.mobile_service !== undefined) {
    query = query.eq('is_mobile', params.mobile_service);
  }
  
  // Location filter (city/state)
  if (params.location) {
    query = query.or(`address_city.ilike.%${params.location}%,address_state.ilike.%${params.location}%`);
  }
  
  // Specialties filter
  if (params.specialties) {
    const specialtiesArray = params.specialties.split(',').map(s => s.trim());
    query = query.overlaps('specialties', specialtiesArray);
  }
  
  // Languages filter
  if (params.languages) {
    const languagesArray = params.languages.split(',').map(l => l.trim());
    query = query.overlaps('languages', languagesArray);
  }
  
  return query;
}

/**
 * Apply sorting to the query
 */
function applySorting(query: any, params: SearchParams) {
  const { sort_by, sort_order } = params;
  const ascending = sort_order === 'asc';
  
  switch (sort_by) {
    case 'rating':
      return query.order('rating', { ascending: !ascending }); // Default desc for rating
    case 'reviews':
      return query.order('total_reviews', { ascending: !ascending });
    case 'newest':
      return query.order('created_at', { ascending: false });
    case 'distance':
    default:
      // Distance sorting will be handled in post-processing for geospatial queries
      return query.order('rating', { ascending: false }); // Fallback to rating
  }
}

/**
 * Process search results to add computed fields and filter by additional criteria
 */
async function processSearchResults(data: any[], params: SearchParams, userId?: string | null) {
  const processedResults = [];
  
  for (const barber of data) {
    // Calculate distance if coordinates provided
    let distance = null;
    if (params.latitude && params.longitude && barber.location_point) {
      distance = await calculateDistance(
        params.latitude,
        params.longitude,
        barber.location_point
      );
      
      // Filter by radius
      if (params.radius && distance > params.radius) {
        continue;
      }
    }
    
    // Filter by service category and price
    let matchingServices = barber.services?.filter((service: any) => {
      if (!service.is_active) return false;
      
      if (params.category && service.category !== params.category) {
        return false;
      }
      
      if (params.service && !service.name.toLowerCase().includes(params.service.toLowerCase())) {
        return false;
      }
      
      if (params.min_price && service.price < params.min_price) {
        return false;
      }
      
      if (params.max_price && service.price > params.max_price) {
        return false;
      }
      
      return true;
    }) || [];
    
    // Skip if no matching services found when service filters are applied
    if ((params.category || params.service || params.min_price || params.max_price) && matchingServices.length === 0) {
      continue;
    }
    
    // Check availability if date/time specified
    let availableSlots = [];
    if (params.date) {
      availableSlots = await getAvailableSlots(
        barber.user_id,
        params.date,
        params.time,
        params.duration
      );
      
      // Skip if no availability when time filters are applied
      if (params.time && availableSlots.length === 0) {
        continue;
      }
    }
    
    // Get featured photo
    const featuredPhoto = barber.barber_photos?.find((photo: any) => photo.is_featured) || 
                         barber.barber_photos?.[0];
    
    // Check if user has favorited this barber
    let isFavorited = false;
    if (userId) {
      const { data: favorite } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('favorite_type', 'barber')
        .eq('favorite_id', barber.user_id)
        .single();
      
      isFavorited = !!favorite;
    }
    
    processedResults.push({
      id: barber.user_id,
      name: barber.users.name,
      business_name: barber.business_name,
      avatar_url: barber.users.avatar_url,
      rating: barber.rating,
      total_reviews: barber.total_reviews,
      price_range: barber.price_range,
      specialties: barber.specialties,
      location: {
        city: barber.address_city,
        state: barber.address_state,
        distance_km: distance
      },
      contact: {
        phone: barber.phone,
        website: barber.website_url,
        instagram: barber.instagram_handle
      },
      languages: barber.languages,
      is_mobile: barber.is_mobile,
      service_radius_km: barber.service_radius_km,
      services: matchingServices,
      featured_photo: featuredPhoto?.image_url,
      available_slots: availableSlots,
      is_favorited: isFavorited
    });
  }
  
  // Sort by distance if coordinates provided
  if (params.latitude && params.longitude && params.sort_by === 'distance') {
    processedResults.sort((a, b) => {
      const distanceA = a.location.distance_km || Infinity;
      const distanceB = b.location.distance_km || Infinity;
      return params.sort_order === 'desc' ? distanceB - distanceA : distanceA - distanceB;
    });
  }
  
  return processedResults;
}

/**
 * Calculate distance between two points using Supabase PostGIS
 */
async function calculateDistance(
  lat1: number,
  lon1: number,
  locationPoint: any
): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('st_distance', {
      geom1: `POINT(${lon1} ${lat1})`,
      geom2: locationPoint
    });
    
    if (error) throw error;
    
    // Convert meters to kilometers
    return Math.round((data / 1000) * 100) / 100;
  } catch (error) {
    console.error('Distance calculation error:', error);
    return 0;
  }
}

/**
 * Get available time slots for a barber on a specific date
 */
async function getAvailableSlots(
  barberId: string,
  date: string,
  requestedTime?: string,
  duration: number = 30
): Promise<string[]> {
  try {
    const { data, error } = await supabase.rpc('get_available_slots', {
      p_barber_id: barberId,
      p_date: date,
      p_service_duration: duration
    });
    
    if (error) throw error;
    
    let availableSlots = data?.map((slot: any) => slot.slot_time) || [];
    
    // Filter by requested time if specified
    if (requestedTime) {
      availableSlots = availableSlots.filter((slot: string) => {
        const slotTime = new Date(`2000-01-01T${slot}`);
        const requestedDateTime = new Date(`2000-01-01T${requestedTime}`);
        const timeDiff = Math.abs(slotTime.getTime() - requestedDateTime.getTime());
        return timeDiff <= 30 * 60 * 1000; // Within 30 minutes
      });
    }
    
    return availableSlots;
  } catch (error) {
    console.error('Available slots error:', error);
    return [];
  }
}

/**
 * Get summary of applied filters for response
 */
function getAppliedFilters(params: SearchParams) {
  const filters: Record<string, any> = {};
  
  if (params.latitude && params.longitude) {
    filters.location = { latitude: params.latitude, longitude: params.longitude, radius: params.radius };
  }
  if (params.location) filters.location_text = params.location;
  if (params.category) filters.category = params.category;
  if (params.service) filters.service = params.service;
  if (params.date) filters.date = params.date;
  if (params.time) filters.time = params.time;
  if (params.min_rating) filters.min_rating = params.min_rating;
  if (params.price_range) filters.price_range = params.price_range;
  if (params.min_price) filters.min_price = params.min_price;
  if (params.max_price) filters.max_price = params.max_price;
  if (params.specialties) filters.specialties = params.specialties.split(',');
  if (params.languages) filters.languages = params.languages.split(',');
  if (params.mobile_service !== undefined) filters.mobile_service = params.mobile_service;
  if (params.verified_only) filters.verified_only = params.verified_only;
  if (params.q) filters.search_query = params.q;
  
  return filters;
}

/**
 * POST /api/barbers/search
 * Advanced search with complex filters (same as GET but with request body)
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    const body = await request.json();
    
    const validatedParams = searchParamsSchema.parse(body);
    const searchResults = await searchBarbers(validatedParams, userId);
    
    return NextResponse.json({
      success: true,
      data: searchResults.data,
      pagination: {
        page: validatedParams.page,
        limit: validatedParams.limit,
        total: searchResults.total,
        total_pages: Math.ceil(searchResults.total / validatedParams.limit),
        has_next: validatedParams.page * validatedParams.limit < searchResults.total,
        has_prev: validatedParams.page > 1
      },
      filters_applied: getAppliedFilters(validatedParams)
    });
    
  } catch (error) {
    console.error('Barber search error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid search parameters', 
          details: error.errors 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to search barbers' 
      },
      { status: 500 }
    );
  }
}