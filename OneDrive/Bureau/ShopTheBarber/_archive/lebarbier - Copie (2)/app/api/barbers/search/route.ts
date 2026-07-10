import { NextRequest, NextResponse } from 'next/server';

// Mock barber data
const mockBarbers = [
  {
    id: 'barber1',
    name: 'John Smith',
    business_name: 'Smith\'s Barbershop',
    avatar_url: null,
    rating: 4.8,
    total_reviews: 127,
    price_range: '$$',
    specialties: ['Classic Cuts', 'Beard Trimming', 'Fades'],
    location: {
      city: 'Casablanca',
      state: 'Casablanca-Settat',
      distance_km: 2.3
    },
    contact: {
      phone: '+212-522-123-456',
      website: 'https://smithsbarbershop.com',
      instagram: '@smithsbarbershop'
    },
    languages: ['en', 'ar', 'fr'],
    is_mobile: false,
    service_radius_km: 10,
    services: [
      {
        id: 'service1',
        name: 'Classic Haircut',
        category: 'haircut',
        price: 45,
        duration: 30
      },
      {
        id: 'service2',
        name: 'Beard Trim',
        category: 'beard',
        price: 25,
        duration: 20
      }
    ],
    featured_photo: null,
    available_slots: ['09:00', '10:00', '11:00', '14:00', '15:00'],
    is_favorited: false
  },
  {
    id: 'barber2',
    name: 'Ahmed Hassan',
    business_name: 'Hassan\'s Grooming',
    avatar_url: null,
    rating: 4.6,
    total_reviews: 89,
    price_range: '$$$',
    specialties: ['Modern Styles', 'Hair Coloring', 'Kids Cuts'],
    location: {
      city: 'Rabat',
      state: 'Rabat-Salé-Kénitra',
      distance_km: 5.1
    },
    contact: {
      phone: '+212-537-789-012',
      website: 'https://hassansgrooming.com',
      instagram: '@hassansgrooming'
    },
    languages: ['ar', 'fr', 'en'],
    is_mobile: true,
    service_radius_km: 15,
    services: [
      {
        id: 'service3',
        name: 'Modern Fade',
        category: 'haircut',
        price: 60,
        duration: 45
      },
      {
        id: 'service4',
        name: 'Hair Coloring',
        category: 'coloring',
        price: 80,
        duration: 60
      }
    ],
    featured_photo: null,
    available_slots: ['10:00', '11:00', '13:00', '16:00'],
    is_favorited: true
  },
  {
    id: 'barber3',
    name: 'Mohammed Alami',
    business_name: 'Alami\'s Traditional Barbershop',
    avatar_url: null,
    rating: 4.9,
    total_reviews: 203,
    price_range: '$$',
    specialties: ['Traditional Cuts', 'Hot Shaves', 'Head Shaves'],
    location: {
      city: 'Marrakech',
      state: 'Marrakech-Safi',
      distance_km: 1.8
    },
    contact: {
      phone: '+212-524-456-789',
      website: null,
      instagram: '@alamisbarbershop'
    },
    languages: ['ar', 'fr'],
    is_mobile: false,
    service_radius_km: 8,
    services: [
      {
        id: 'service5',
        name: 'Traditional Haircut',
        category: 'haircut',
        price: 40,
        duration: 35
      },
      {
        id: 'service6',
        name: 'Hot Shave',
        category: 'shave',
        price: 35,
        duration: 25
      }
    ],
    featured_photo: null,
    available_slots: ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00'],
    is_favorited: false
  },
  {
    id: 'barber4',
    name: 'David Wilson',
    business_name: 'Wilson\'s Modern Barbershop',
    avatar_url: null,
    rating: 4.7,
    total_reviews: 156,
    price_range: '$$$',
    specialties: ['Contemporary Styles', 'Skin Fades', 'Design Work'],
    location: {
      city: 'Fez',
      state: 'Fès-Meknès',
      distance_km: 3.2
    },
    contact: {
      phone: '+212-535-321-654',
      website: 'https://wilsonsbarbershop.com',
      instagram: '@wilsonsmodern'
    },
    languages: ['en', 'ar'],
    is_mobile: false,
    service_radius_km: 12,
    services: [
      {
        id: 'service7',
        name: 'Contemporary Cut',
        category: 'haircut',
        price: 55,
        duration: 40
      },
      {
        id: 'service8',
        name: 'Skin Fade',
        category: 'haircut',
        price: 50,
        duration: 35
      }
    ],
    featured_photo: null,
    available_slots: ['09:00', '10:00', '11:00', '13:00', '14:00'],
    is_favorited: false
  },
  {
    id: 'barber5',
    name: 'Karim Benjelloun',
    business_name: 'Benjelloun\'s Mobile Barbershop',
    avatar_url: null,
    rating: 4.5,
    total_reviews: 67,
    price_range: '$$',
    specialties: ['Mobile Service', 'Home Visits', 'Emergency Cuts'],
    location: {
      city: 'Tangier',
      state: 'Tanger-Tétouan-Al Hoceïma',
      distance_km: 4.7
    },
    contact: {
      phone: '+212-539-987-654',
      website: null,
      instagram: '@benjellounmobile'
    },
    languages: ['ar', 'fr', 'en', 'es'],
    is_mobile: true,
    service_radius_km: 25,
    services: [
      {
        id: 'service9',
        name: 'Mobile Haircut',
        category: 'haircut',
        price: 50,
        duration: 30
      },
      {
        id: 'service10',
        name: 'Home Beard Trim',
        category: 'beard',
        price: 30,
        duration: 20
      }
    ],
    featured_photo: null,
    available_slots: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'],
    is_favorited: true
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract search parameters
    const location = searchParams.get('location');
    const category = searchParams.get('category');
    const service = searchParams.get('service');
    const minRating = parseFloat(searchParams.get('min_rating') || '0');
    const priceRange = searchParams.get('price_range');
    const mobileService = searchParams.get('mobile_service') === 'true';
    const verifiedOnly = searchParams.get('verified_only') === 'true';
    const languages = searchParams.get('languages')?.split(',') || [];
    const sortBy = searchParams.get('sort_by') || 'distance';
    const sortOrder = searchParams.get('sort_order') || 'asc';
    const q = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Filter barbers based on search parameters
    let filteredBarbers = mockBarbers.filter(barber => {
      // Search query filter
      if (q && !barber.name.toLowerCase().includes(q.toLowerCase()) && 
          !barber.business_name.toLowerCase().includes(q.toLowerCase()) &&
          !barber.specialties.some(s => s.toLowerCase().includes(q.toLowerCase()))) {
        return false;
      }
      
      // Location filter (simplified - just check if location is provided)
      if (location && !barber.location.city.toLowerCase().includes(location.toLowerCase())) {
        return false;
      }
      
      // Category filter
      if (category && !barber.specialties.some(s => s.toLowerCase().includes(category.toLowerCase()))) {
        return false;
      }
      
      // Service filter
      if (service && !barber.services.some(s => s.name.toLowerCase().includes(service.toLowerCase()))) {
        return false;
      }
      
      // Rating filter
      if (minRating > 0 && barber.rating < minRating) {
        return false;
      }
      
      // Price range filter
      if (priceRange && barber.price_range !== priceRange) {
        return false;
      }
      
      // Mobile service filter
      if (mobileService && !barber.is_mobile) {
        return false;
      }
      
      // Languages filter
      if (languages.length > 0 && !languages.some(lang => barber.languages.includes(lang))) {
        return false;
      }
      
      return true;
    });
    
    // Sort barbers
    filteredBarbers.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'distance':
          comparison = (a.location.distance_km || 0) - (b.location.distance_km || 0);
          break;
        case 'rating':
          comparison = b.rating - a.rating;
          break;
        case 'price':
          const aAvgPrice = a.services.reduce((sum, s) => sum + s.price, 0) / a.services.length;
          const bAvgPrice = b.services.reduce((sum, s) => sum + s.price, 0) / b.services.length;
          comparison = aAvgPrice - bAvgPrice;
          break;
        case 'reviews':
          comparison = b.total_reviews - a.total_reviews;
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedBarbers = filteredBarbers.slice(startIndex, endIndex);
    
    // Calculate pagination metadata
    const total = filteredBarbers.length;
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;
    
    // Prepare response
    const response = {
      success: true,
      data: paginatedBarbers,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
        has_next: hasNext,
        has_prev: hasPrev
      },
      filters_applied: {
        location,
        category,
        service,
        min_rating: minRating,
        price_range: priceRange,
        mobile_service: mobileService,
        verified_only: verifiedOnly,
        languages,
        sort_by: sortBy,
        sort_order: sortOrder,
        q
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error in barber search API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to search barbers',
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          total_pages: 0,
          has_next: false,
          has_prev: false
        }
      },
      { status: 500 }
    );
  }
} 