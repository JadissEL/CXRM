import { NextRequest, NextResponse } from 'next/server';

// Mock data for services - in a real app, this would come from your database
const mockServices = [
  {
    id: '1',
    name: 'Classic Haircut',
    description: 'Traditional men\'s haircut with wash and style',
    price: 25,
    duration: 30,
    category: 'haircut',
    image_url: null,
    video_url: null,
    gallery_urls: null,
    rating: 4.8,
    review_count: 127,
    booking_enabled: true,
    barber_id: 'barber1',
    barber_name: 'John Smith',
    business_name: 'Smith\'s Barbershop',
    barber_avatar_url: null,
    is_verified: true,
    service_type: 'in_shop',
    languages: ['en', 'ar'],
    has_promotion: false,
    instant_booking: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    name: 'Beard Trim & Shape',
    description: 'Professional beard trimming and shaping service',
    price: 20,
    duration: 25,
    category: 'shave_beard',
    image_url: null,
    video_url: null,
    gallery_urls: null,
    rating: 4.9,
    review_count: 89,
    booking_enabled: true,
    barber_id: 'barber2',
    barber_name: 'Mike Johnson',
    business_name: 'Johnson\'s Cuts',
    barber_avatar_url: null,
    is_verified: true,
    service_type: 'in_shop',
    languages: ['en', 'fr'],
    has_promotion: true,
    instant_booking: false,
    created_at: '2024-01-10T14:30:00Z',
    updated_at: '2024-01-10T14:30:00Z'
  },
  {
    id: '3',
    name: 'Hot Shave',
    description: 'Traditional hot towel shave with straight razor',
    price: 35,
    duration: 45,
    category: 'shave_beard',
    image_url: null,
    video_url: null,
    gallery_urls: null,
    rating: 4.7,
    review_count: 156,
    booking_enabled: true,
    barber_id: 'barber1',
    barber_name: 'John Smith',
    business_name: 'Smith\'s Barbershop',
    barber_avatar_url: null,
    is_verified: true,
    service_type: 'in_shop',
    languages: ['en', 'ar'],
    has_promotion: false,
    instant_booking: true,
    created_at: '2024-01-12T09:15:00Z',
    updated_at: '2024-01-12T09:15:00Z'
  },
  {
    id: '4',
    name: 'Hair Styling',
    description: 'Modern hair styling and finishing',
    price: 30,
    duration: 35,
    category: 'haircut',
    image_url: null,
    video_url: null,
    gallery_urls: null,
    rating: 4.6,
    review_count: 73,
    booking_enabled: true,
    barber_id: 'barber3',
    barber_name: 'David Wilson',
    business_name: 'Wilson\'s Style Studio',
    barber_avatar_url: null,
    is_verified: false,
    service_type: 'home_visit',
    languages: ['en', 'es'],
    has_promotion: false,
    instant_booking: true,
    created_at: '2024-01-08T16:45:00Z',
    updated_at: '2024-01-08T16:45:00Z'
  },
  {
    id: '5',
    name: 'Hair Coloring',
    description: 'Professional hair coloring and highlights',
    price: 60,
    duration: 90,
    category: 'coloring',
    image_url: null,
    video_url: null,
    gallery_urls: null,
    rating: 4.5,
    review_count: 42,
    booking_enabled: true,
    barber_id: 'barber3',
    barber_name: 'David Wilson',
    business_name: 'Wilson\'s Style Studio',
    barber_avatar_url: null,
    is_verified: false,
    service_type: 'in_shop',
    languages: ['en', 'es'],
    has_promotion: true,
    instant_booking: false,
    created_at: '2024-01-05T11:20:00Z',
    updated_at: '2024-01-05T11:20:00Z'
  },
  {
    id: '6',
    name: 'Kids Haircut',
    description: 'Specialized haircut for children and teens',
    price: 15,
    duration: 20,
    category: 'kids_teens',
    image_url: null,
    video_url: null,
    gallery_urls: null,
    rating: 4.8,
    review_count: 95,
    booking_enabled: true,
    barber_id: 'barber1',
    barber_name: 'John Smith',
    business_name: 'Smith\'s Barbershop',
    barber_avatar_url: null,
    is_verified: true,
    service_type: 'in_shop',
    languages: ['en', 'ar'],
    has_promotion: false,
    instant_booking: true,
    created_at: '2024-01-14T11:00:00Z',
    updated_at: '2024-01-14T11:00:00Z'
  },
  {
    id: '7',
    name: 'Haircut + Beard Package',
    description: 'Complete grooming package including haircut and beard trim',
    price: 40,
    duration: 60,
    category: 'packages',
    image_url: null,
    video_url: null,
    gallery_urls: null,
    rating: 4.9,
    review_count: 203,
    booking_enabled: true,
    barber_id: 'barber2',
    barber_name: 'Mike Johnson',
    business_name: 'Johnson\'s Cuts',
    barber_avatar_url: null,
    is_verified: true,
    service_type: 'in_shop',
    languages: ['en', 'fr'],
    has_promotion: true,
    instant_booking: true,
    created_at: '2024-01-13T09:30:00Z',
    updated_at: '2024-01-13T09:30:00Z'
  },
  {
    id: '8',
    name: 'Eyebrow Grooming',
    description: 'Professional eyebrow shaping and maintenance',
    price: 12,
    duration: 15,
    category: 'eyebrow',
    image_url: null,
    video_url: null,
    gallery_urls: null,
    rating: 4.4,
    review_count: 67,
    booking_enabled: true,
    barber_id: 'barber1',
    barber_name: 'John Smith',
    business_name: 'Smith\'s Barbershop',
    barber_avatar_url: null,
    is_verified: true,
    service_type: 'in_shop',
    languages: ['en', 'ar'],
    has_promotion: false,
    instant_booking: true,
    created_at: '2024-01-11T14:15:00Z',
    updated_at: '2024-01-11T14:15:00Z'
  },
  {
    id: '9',
    name: 'Men\'s Facial',
    description: 'Deep cleansing facial treatment for men',
    price: 45,
    duration: 75,
    category: 'facial',
    image_url: null,
    video_url: null,
    gallery_urls: null,
    rating: 4.6,
    review_count: 88,
    booking_enabled: true,
    barber_id: 'barber3',
    barber_name: 'David Wilson',
    business_name: 'Wilson\'s Style Studio',
    barber_avatar_url: null,
    is_verified: false,
    service_type: 'home_visit',
    languages: ['en', 'es'],
    has_promotion: false,
    instant_booking: false,
    created_at: '2024-01-09T10:45:00Z',
    updated_at: '2024-01-09T10:45:00Z'
  },
  {
    id: '10',
    name: 'Keratin Treatment',
    description: 'Professional keratin treatment for smooth, manageable hair',
    price: 80,
    duration: 120,
    category: 'treatments',
    image_url: null,
    video_url: null,
    gallery_urls: null,
    rating: 4.7,
    review_count: 54,
    booking_enabled: true,
    barber_id: 'barber2',
    barber_name: 'Mike Johnson',
    business_name: 'Johnson\'s Cuts',
    barber_avatar_url: null,
    is_verified: true,
    service_type: 'in_shop',
    languages: ['en', 'fr'],
    has_promotion: true,
    instant_booking: false,
    created_at: '2024-01-07T13:20:00Z',
    updated_at: '2024-01-07T13:20:00Z'
  },
  {
    id: '11',
    name: 'Male Manicure',
    description: 'Professional nail care and hand grooming for men',
    price: 18,
    duration: 25,
    category: 'nails',
    image_url: null,
    video_url: null,
    gallery_urls: null,
    rating: 4.3,
    review_count: 41,
    booking_enabled: true,
    barber_id: 'barber1',
    barber_name: 'John Smith',
    business_name: 'Smith\'s Barbershop',
    barber_avatar_url: null,
    is_verified: true,
    service_type: 'in_shop',
    languages: ['en', 'ar'],
    has_promotion: false,
    instant_booking: true,
    created_at: '2024-01-06T16:30:00Z',
    updated_at: '2024-01-06T16:30:00Z'
  },
  {
    id: '12',
    name: 'Custom Styling',
    description: 'Custom hair styling and consultation',
    price: 35,
    duration: 45,
    category: 'other',
    image_url: null,
    video_url: null,
    gallery_urls: null,
    rating: 4.8,
    review_count: 76,
    booking_enabled: true,
    barber_id: 'barber3',
    barber_name: 'David Wilson',
    business_name: 'Wilson\'s Style Studio',
    barber_avatar_url: null,
    is_verified: false,
    service_type: 'home_visit',
    languages: ['en', 'es'],
    has_promotion: false,
    instant_booking: true,
    created_at: '2024-01-04T12:00:00Z',
    updated_at: '2024-01-04T12:00:00Z'
  }
];

const categories = [
  { name: 'haircut', count: 2 },
  { name: 'shave_beard', count: 2 },
  { name: 'coloring', count: 1 },
  { name: 'kids_teens', count: 1 },
  { name: 'packages', count: 1 },
  { name: 'eyebrow', count: 1 },
  { name: 'facial', count: 1 },
  { name: 'treatments', count: 1 },
  { name: 'nails', count: 1 },
  { name: 'other', count: 1 }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const sortBy = searchParams.get('sort_by') || 'rating';
    const sortOrder = searchParams.get('sort_order') || 'desc';
    const minPrice = parseFloat(searchParams.get('min_price') || '0');
    const maxPrice = parseFloat(searchParams.get('max_price') || '1000');
    const minDuration = parseInt(searchParams.get('min_duration') || '0');
    const maxDuration = parseInt(searchParams.get('max_duration') || '480');
    const minRating = parseFloat(searchParams.get('min_rating') || '0');
    const serviceType = searchParams.get('service_type') || '';
    const promotionsOnly = searchParams.get('promotions_only') === 'true';
    const verifiedOnly = searchParams.get('verified_only') === 'true';
    const instantBooking = searchParams.get('instant_booking') === 'true';
    const languages = searchParams.get('languages')?.split(',') || [];

    // Filter services based on search parameters
    let filteredServices = mockServices.filter(service => {
      const matchesSearch = !search || 
        service.name.toLowerCase().includes(search.toLowerCase()) ||
        service.description.toLowerCase().includes(search.toLowerCase());
      
      const matchesCategory = !category || service.category === category;
      const matchesPrice = service.price >= minPrice && service.price <= maxPrice;
      const matchesDuration = service.duration >= minDuration && service.duration <= maxDuration;
      const matchesRating = service.rating >= minRating;
      const matchesServiceType = !serviceType || service.service_type === serviceType;
      const matchesPromotions = !promotionsOnly || service.has_promotion;
      const matchesVerified = !verifiedOnly || service.is_verified;
      const matchesInstantBooking = !instantBooking || service.instant_booking;
      const matchesLanguages = languages.length === 0 || 
        languages.some(lang => service.languages.includes(lang));
      
      return matchesSearch && matchesCategory && matchesPrice && matchesDuration && 
             matchesRating && matchesServiceType && matchesPromotions && matchesVerified && 
             matchesInstantBooking && matchesLanguages;
    });

    // Sort services
    filteredServices.sort((a, b) => {
      let aValue: any = a[sortBy as keyof typeof a];
      let bValue: any = b[sortBy as keyof typeof b];
      
      if (sortBy === 'price' || sortBy === 'duration' || sortBy === 'rating') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedServices = filteredServices.slice(startIndex, endIndex);
    
    const total = filteredServices.length;
    const totalPages = Math.ceil(total / limit);

    const response = {
      services: paginatedServices,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1
      },
      filters_applied: {
        search,
        category,
        sort_by: sortBy,
        sort_order: sortOrder,
        min_price: minPrice,
        max_price: maxPrice,
        min_duration: minDuration,
        max_duration: maxDuration
      },
      categories
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
} 