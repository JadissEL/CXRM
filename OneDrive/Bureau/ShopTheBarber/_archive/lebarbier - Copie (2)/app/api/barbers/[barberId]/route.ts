import { NextRequest, NextResponse } from 'next/server';

// Mock barber data (same as in search route)
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
    is_favorited: false,
    description: 'Professional barber with over 10 years of experience in classic cuts and modern styles.',
    working_hours: {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '18:00' },
      friday: { open: '09:00', close: '18:00' },
      saturday: { open: '10:00', close: '16:00' },
      sunday: { open: null, close: null }
    },
    gallery: [
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400',
      'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400',
      'https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?w=400'
    ],
    reviews: [
      {
        id: 'review1',
        user_name: 'Ahmed K.',
        rating: 5,
        comment: 'Excellent service! Very professional and clean cuts.',
        date: '2024-01-15'
      },
      {
        id: 'review2',
        user_name: 'Mohammed L.',
        rating: 4,
        comment: 'Great barber, very skilled with fades.',
        date: '2024-01-10'
      }
    ]
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
    is_favorited: true,
    description: 'Mobile barber service bringing professional grooming to your doorstep.',
    working_hours: {
      monday: { open: '10:00', close: '19:00' },
      tuesday: { open: '10:00', close: '19:00' },
      wednesday: { open: '10:00', close: '19:00' },
      thursday: { open: '10:00', close: '19:00' },
      friday: { open: '10:00', close: '19:00' },
      saturday: { open: '11:00', close: '17:00' },
      sunday: { open: null, close: null }
    },
    gallery: [
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400',
      'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400'
    ],
    reviews: [
      {
        id: 'review3',
        user_name: 'Youssef M.',
        rating: 5,
        comment: 'Convenient mobile service, great quality!',
        date: '2024-01-12'
      }
    ]
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
      distance_km: 8.7
    },
    contact: {
      phone: '+212-524-456-789',
      website: 'https://alamisbarbershop.com',
      instagram: '@alamisbarbershop'
    },
    languages: ['ar', 'fr', 'en'],
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
    available_slots: ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
    is_favorited: false,
    description: 'Traditional barbershop with authentic Moroccan grooming techniques.',
    working_hours: {
      monday: { open: '08:00', close: '19:00' },
      tuesday: { open: '08:00', close: '19:00' },
      wednesday: { open: '08:00', close: '19:00' },
      thursday: { open: '08:00', close: '19:00' },
      friday: { open: '08:00', close: '19:00' },
      saturday: { open: '09:00', close: '17:00' },
      sunday: { open: '09:00', close: '15:00' }
    },
    gallery: [
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400',
      'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400',
      'https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?w=400',
      'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400'
    ],
    reviews: [
      {
        id: 'review4',
        user_name: 'Karim B.',
        rating: 5,
        comment: 'Best traditional barbershop in Marrakech!',
        date: '2024-01-18'
      },
      {
        id: 'review5',
        user_name: 'Hassan R.',
        rating: 5,
        comment: 'Authentic experience, highly recommended.',
        date: '2024-01-16'
      }
    ]
  }
];

export async function GET(
  request: NextRequest,
  { params }: { params: { barberId: string } }
) {
  try {
    const { barberId } = params;

    // Find the barber by ID
    const barber = mockBarbers.find(b => b.id === barberId);

    if (!barber) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Barber not found',
          message: 'The requested barber profile could not be found.'
        },
        { status: 404 }
      );
    }

    // Return the barber data
    return NextResponse.json({
      success: true,
      data: barber
    });

  } catch (error) {
    console.error('Error fetching barber profile:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch barber profile',
        message: 'An error occurred while fetching the barber profile.'
      },
      { status: 500 }
    );
  }
} 