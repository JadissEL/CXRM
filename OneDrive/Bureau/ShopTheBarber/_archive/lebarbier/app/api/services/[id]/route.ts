import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

interface ServiceDetails {
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
  max_advance_booking_days: number;
  cancellation_policy: string | null;
  preparation_time: number;
  cleanup_time: number;
  barber_id: string;
  barber_name: string;
  business_name: string | null;
  barber_avatar_url: string | null;
  barber_phone: string | null;
  barber_address: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  addons: ServiceAddon[];
  reviews: ServiceReview[];
  availability: ServiceAvailability[];
  related_services: RelatedService[];
  is_favorited?: boolean;
}

interface ServiceAddon {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  is_required: boolean;
  display_order: number;
}

interface ServiceReview {
  id: string;
  client_name: string;
  client_avatar_url: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  quality_rating: number | null;
  value_rating: number | null;
  would_recommend: boolean;
  is_verified: boolean;
  helpful_count: number;
  created_at: string;
}

interface ServiceAvailability {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface RelatedService {
  id: string;
  name: string;
  price: number;
  duration: number;
  image_url: string | null;
  rating: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = createClient();
    const { userId } = auth();

    // Validate service ID
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid service ID' },
        { status: 400 }
      );
    }

    // Get service details with barber information
    const { data: service, error: serviceError } = await supabase
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
        max_advance_booking_days,
        cancellation_policy,
        preparation_time,
        cleanup_time,
        barber_id,
        created_at,
        updated_at,
        users!services_barber_id_fkey (
          id,
          name,
          avatar_url,
          phone
        ),
        barber_profiles!services_barber_id_fkey (
          business_name,
          address,
          is_verified
        )
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (serviceError || !service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    // Get service add-ons
    const { data: addons } = await supabase
      .from('service_addons')
      .select(`
        id,
        name,
        description,
        price,
        duration,
        is_required,
        display_order
      `)
      .eq('service_id', id)
      .eq('is_active', true)
      .order('display_order');

    // Get service reviews (latest 10)
    const { data: reviews } = await supabase
      .from('service_reviews')
      .select(`
        id,
        rating,
        title,
        comment,
        quality_rating,
        value_rating,
        would_recommend,
        is_verified,
        helpful_count,
        created_at,
        users!service_reviews_client_id_fkey (
          name,
          avatar_url
        )
      `)
      .eq('service_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get service availability
    const { data: availability } = await supabase
      .from('service_availability')
      .select(`
        day_of_week,
        start_time,
        end_time,
        is_available
      `)
      .eq('service_id', id)
      .order('day_of_week')
      .order('start_time');

    // Get related services (same barber, different services)
    const { data: relatedServices } = await supabase
      .from('services')
      .select(`
        id,
        name,
        price,
        duration,
        image_url,
        rating
      `)
      .eq('barber_id', service.barber_id)
      .eq('is_active', true)
      .neq('id', id)
      .order('rating', { ascending: false })
      .limit(4);

    // Check if service is favorited by current user
    let isFavorited = false;
    if (userId) {
      const { data: favorite } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('service_id', id)
        .single();
      
      isFavorited = !!favorite;
    }

    // Transform the data
    const serviceDetails: ServiceDetails = {
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
      max_advance_booking_days: service.max_advance_booking_days || 30,
      cancellation_policy: service.cancellation_policy,
      preparation_time: service.preparation_time || 0,
      cleanup_time: service.cleanup_time || 0,
      barber_id: service.barber_id,
      barber_name: service.users?.name || 'Unknown Barber',
      business_name: service.barber_profiles?.business_name,
      barber_avatar_url: service.users?.avatar_url,
      barber_phone: service.users?.phone,
      barber_address: service.barber_profiles?.address,
      is_verified: service.barber_profiles?.is_verified || false,
      created_at: service.created_at,
      updated_at: service.updated_at,
      addons: addons?.map(addon => ({
        id: addon.id,
        name: addon.name,
        description: addon.description,
        price: parseFloat(addon.price?.toString() || '0'),
        duration: addon.duration || 0,
        is_required: addon.is_required || false,
        display_order: addon.display_order || 0,
      })) || [],
      reviews: reviews?.map(review => ({
        id: review.id,
        client_name: review.users?.name || 'Anonymous',
        client_avatar_url: review.users?.avatar_url,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        quality_rating: review.quality_rating,
        value_rating: review.value_rating,
        would_recommend: review.would_recommend ?? true,
        is_verified: review.is_verified || false,
        helpful_count: review.helpful_count || 0,
        created_at: review.created_at,
      })) || [],
      availability: availability?.map(avail => ({
        day_of_week: avail.day_of_week,
        start_time: avail.start_time,
        end_time: avail.end_time,
        is_available: avail.is_available,
      })) || [],
      related_services: relatedServices?.map(related => ({
        id: related.id,
        name: related.name,
        price: parseFloat(related.price?.toString() || '0'),
        duration: related.duration || 0,
        image_url: related.image_url,
        rating: parseFloat(related.rating?.toString() || '0'),
      })) || [],
      is_favorited: isFavorited,
    };

    return NextResponse.json(serviceDetails);
  } catch (error) {
    console.error('Unexpected error in service details API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT endpoint for updating service details (barber only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = createClient();
    
    // Verify service exists and user owns it
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('barber_id')
      .eq('id', id)
      .single();

    if (serviceError || !service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    if (service.barber_id !== userId) {
      return NextResponse.json(
        { error: 'You can only update your own services' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate price and duration if provided
    if (body.price !== undefined && body.price < 0) {
      return NextResponse.json(
        { error: 'Price must be non-negative' },
        { status: 400 }
      );
    }

    if (body.duration !== undefined && body.duration < 1) {
      return NextResponse.json(
        { error: 'Duration must be at least 1 minute' },
        { status: 400 }
      );
    }

    // Update the service
    const updateData: any = {};
    
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.price !== undefined) updateData.price = parseFloat(body.price);
    if (body.duration !== undefined) updateData.duration = parseInt(body.duration);
    if (body.category !== undefined) updateData.category = body.category;
    if (body.image_url !== undefined) updateData.image_url = body.image_url;
    if (body.video_url !== undefined) updateData.video_url = body.video_url;
    if (body.gallery_urls !== undefined) updateData.gallery_urls = body.gallery_urls;
    if (body.booking_enabled !== undefined) updateData.booking_enabled = body.booking_enabled;
    if (body.max_advance_booking_days !== undefined) updateData.max_advance_booking_days = body.max_advance_booking_days;
    if (body.cancellation_policy !== undefined) updateData.cancellation_policy = body.cancellation_policy;
    if (body.preparation_time !== undefined) updateData.preparation_time = body.preparation_time;
    if (body.cleanup_time !== undefined) updateData.cleanup_time = body.cleanup_time;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;

    updateData.updated_at = new Date().toISOString();

    const { data: updatedService, error: updateError } = await supabase
      .from('services')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating service:', updateError);
      return NextResponse.json(
        { error: 'Failed to update service' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedService);
  } catch (error) {
    console.error('Unexpected error in service update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE endpoint for soft-deleting a service (barber only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = createClient();
    
    // Verify service exists and user owns it
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('barber_id')
      .eq('id', id)
      .single();

    if (serviceError || !service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    if (service.barber_id !== userId) {
      return NextResponse.json(
        { error: 'You can only delete your own services' },
        { status: 403 }
      );
    }

    // Soft delete by setting is_active to false
    const { error: deleteError } = await supabase
      .from('services')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting service:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete service' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Unexpected error in service deletion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}