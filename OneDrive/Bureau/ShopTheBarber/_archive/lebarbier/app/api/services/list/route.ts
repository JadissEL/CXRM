import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

interface ServiceFilters {
  search?: string;
  category?: string;
  barber_id?: string;
  min_price?: number;
  max_price?: number;
  min_duration?: number;
  max_duration?: number;
  sort_by?: 'name' | 'price' | 'duration' | 'rating' | 'created_at';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

interface ServiceWithDetails {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  image_url: string | null;
  video_url: string | null;
  gallery_urls: string[] | null;
  rating: number;
  review_count: number;
  booking_enabled: boolean;
  barber_id: string;
  barber_name: string;
  business_name: string | null;
  barber_avatar_url: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

interface ServiceListResponse {
  services: ServiceWithDetails[];
  pagination: PaginationMeta;
  filters_applied: ServiceFilters;
  categories: Array<{
    name: string;
    count: number;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const filters: ServiceFilters = {
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      barber_id: searchParams.get('barber_id') || undefined,
      min_price: searchParams.get('min_price') ? parseFloat(searchParams.get('min_price')!) : undefined,
      max_price: searchParams.get('max_price') ? parseFloat(searchParams.get('max_price')!) : undefined,
      min_duration: searchParams.get('min_duration') ? parseInt(searchParams.get('min_duration')!) : undefined,
      max_duration: searchParams.get('max_duration') ? parseInt(searchParams.get('max_duration')!) : undefined,
      sort_by: (searchParams.get('sort_by') as ServiceFilters['sort_by']) || 'rating',
      sort_order: (searchParams.get('sort_order') as ServiceFilters['sort_order']) || 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '20'), 100), // Max 100 items per page
    };

    // Validate pagination parameters
    if (filters.page < 1) filters.page = 1;
    if (filters.limit < 1) filters.limit = 20;

    const offset = (filters.page - 1) * filters.limit;

    // Build the base query
    let query = supabase
      .from('services')
      .select(`
        id,
        name,
        description,
        price,
        duration,
        category,
        image_url,
        video_url,
        gallery_urls,
        rating,
        review_count,
        booking_enabled,
        barber_id,
        created_at,
        updated_at,
        users!services_barber_id_fkey (
          id,
          name,
          avatar_url
        ),
        barber_profiles!services_barber_id_fkey (
          business_name,
          is_verified
        )
      `, { count: 'exact' })
      .eq('is_active', true)
      .eq('users.role', 'barber');

    // Apply filters
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.barber_id) {
      query = query.eq('barber_id', filters.barber_id);
    }

    if (filters.min_price !== undefined) {
      query = query.gte('price', filters.min_price);
    }

    if (filters.max_price !== undefined) {
      query = query.lte('price', filters.max_price);
    }

    if (filters.min_duration !== undefined) {
      query = query.gte('duration', filters.min_duration);
    }

    if (filters.max_duration !== undefined) {
      query = query.lte('duration', filters.max_duration);
    }

    // Apply sorting
    const sortColumn = filters.sort_by === 'name' ? 'name' :
                      filters.sort_by === 'price' ? 'price' :
                      filters.sort_by === 'duration' ? 'duration' :
                      filters.sort_by === 'rating' ? 'rating' :
                      filters.sort_by === 'created_at' ? 'created_at' : 'rating';
    
    const ascending = filters.sort_order === 'asc';
    query = query.order(sortColumn, { ascending });

    // Add secondary sort by name for consistency
    if (sortColumn !== 'name') {
      query = query.order('name', { ascending: true });
    }

    // Apply pagination
    query = query.range(offset, offset + filters.limit - 1);

    const { data: services, error, count } = await query;

    if (error) {
      console.error('Error fetching services:', error);
      return NextResponse.json(
        { error: 'Failed to fetch services' },
        { status: 500 }
      );
    }

    // Get category counts for filter UI
    const { data: categoryData } = await supabase
      .from('services')
      .select('category')
      .eq('is_active', true);

    const categoryCounts = categoryData?.reduce((acc, service) => {
      acc[service.category] = (acc[service.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const categories = Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      count
    }));

    // Transform the data
    const transformedServices: ServiceWithDetails[] = services?.map(service => ({
      id: service.id,
      name: service.name,
      description: service.description || '',
      price: parseFloat(service.price?.toString() || '0'),
      duration: service.duration || 0,
      category: service.category || 'other',
      image_url: service.image_url,
      video_url: service.video_url,
      gallery_urls: service.gallery_urls,
      rating: parseFloat(service.rating?.toString() || '0'),
      review_count: service.review_count || 0,
      booking_enabled: service.booking_enabled ?? true,
      barber_id: service.barber_id,
      barber_name: service.users?.name || 'Unknown Barber',
      business_name: service.barber_profiles?.business_name,
      barber_avatar_url: service.users?.avatar_url,
      is_verified: service.barber_profiles?.is_verified || false,
      created_at: service.created_at,
      updated_at: service.updated_at,
    })) || [];

    // Calculate pagination metadata
    const total = count || 0;
    const totalPages = Math.ceil(total / filters.limit);
    const pagination: PaginationMeta = {
      page: filters.page,
      limit: filters.limit,
      total,
      total_pages: totalPages,
      has_next: filters.page < totalPages,
      has_prev: filters.page > 1,
    };

    const response: ServiceListResponse = {
      services: transformedServices,
      pagination,
      filters_applied: filters,
      categories,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Unexpected error in services list API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST endpoint for creating new services (barbers only)
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = createClient();
    
    // Verify user is a barber
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError || !user || user.role !== 'barber') {
      return NextResponse.json(
        { error: 'Only barbers can create services' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    const { name, description, price, duration, category } = body;
    
    if (!name || !price || !duration || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: name, price, duration, category' },
        { status: 400 }
      );
    }

    // Validate price and duration
    if (price < 0 || duration < 1) {
      return NextResponse.json(
        { error: 'Price must be non-negative and duration must be at least 1 minute' },
        { status: 400 }
      );
    }

    // Create the service
    const { data: service, error: createError } = await supabase
      .from('services')
      .insert({
        barber_id: userId,
        name: name.trim(),
        description: description?.trim() || null,
        price: parseFloat(price),
        duration: parseInt(duration),
        category,
        image_url: body.image_url || null,
        video_url: body.video_url || null,
        gallery_urls: body.gallery_urls || null,
        booking_enabled: body.booking_enabled ?? true,
        max_advance_booking_days: body.max_advance_booking_days || 30,
        cancellation_policy: body.cancellation_policy || null,
        preparation_time: body.preparation_time || 0,
        cleanup_time: body.cleanup_time || 0,
        is_active: true,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating service:', createError);
      return NextResponse.json(
        { error: 'Failed to create service' },
        { status: 500 }
      );
    }

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in service creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}