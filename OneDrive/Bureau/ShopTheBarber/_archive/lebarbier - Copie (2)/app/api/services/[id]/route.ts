import { NextRequest, NextResponse } from 'next/server';

// Mock data for individual services
const mockServices = {
  '1': {
    id: '1',
    name: 'Classic Haircut',
    description: 'Traditional men\'s haircut with wash and style. This service includes consultation, washing, cutting, and styling to give you a clean, professional look.',
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
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    // Additional details for the modal
    long_description: 'Our classic haircut service is perfect for those who want a traditional, clean look. We start with a consultation to understand your preferences, then wash your hair with premium products. Our experienced barbers will then give you a precise cut using professional techniques, followed by styling to complete your look.',
    includes: [
      'Hair consultation',
      'Shampoo and conditioning',
      'Precise cutting and trimming',
      'Professional styling',
      'Style recommendations'
    ],
    requirements: [
      'Please arrive with clean hair if possible',
      'Bring reference photos if you have a specific style in mind'
    ],
    cancellation_policy: 'Free cancellation up to 24 hours before appointment',
    barber_bio: 'John Smith has been cutting hair for over 15 years and specializes in classic men\'s styles. He\'s known for his attention to detail and friendly service.',
    barber_rating: 4.9,
    barber_review_count: 342
  },
  '2': {
    id: '2',
    name: 'Beard Trim & Shape',
    description: 'Professional beard trimming and shaping service',
    price: 20,
    duration: 25,
    category: 'beard_trim',
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
    created_at: '2024-01-10T14:30:00Z',
    updated_at: '2024-01-10T14:30:00Z',
    long_description: 'Get your beard professionally trimmed and shaped to perfection. Our beard service includes consultation, trimming, shaping, and finishing touches.',
    includes: [
      'Beard consultation',
      'Trimming and shaping',
      'Neck line cleanup',
      'Beard oil application',
      'Style recommendations'
    ],
    requirements: [
      'Please arrive with a clean face',
      'Let us know if you have any skin sensitivities'
    ],
    cancellation_policy: 'Free cancellation up to 24 hours before appointment',
    barber_bio: 'Mike Johnson is a beard specialist with 8 years of experience. He\'s passionate about helping clients achieve their perfect beard style.',
    barber_rating: 4.8,
    barber_review_count: 156
  },
  '3': {
    id: '3',
    name: 'Hot Shave',
    description: 'Traditional hot towel shave with straight razor',
    price: 35,
    duration: 45,
    category: 'shave',
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
    created_at: '2024-01-12T09:15:00Z',
    updated_at: '2024-01-12T09:15:00Z',
    long_description: 'Experience the traditional art of straight razor shaving with hot towels. This luxurious service provides the closest, smoothest shave possible.',
    includes: [
      'Hot towel treatment',
      'Pre-shave oil application',
      'Straight razor shave',
      'Post-shave treatment',
      'Moisturizer application'
    ],
    requirements: [
      'Please arrive with a clean face',
      'Avoid shaving 24 hours before appointment'
    ],
    cancellation_policy: 'Free cancellation up to 24 hours before appointment',
    barber_bio: 'John Smith has been cutting hair for over 15 years and specializes in classic men\'s styles. He\'s known for his attention to detail and friendly service.',
    barber_rating: 4.9,
    barber_review_count: 342
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const serviceId = params.id;
    const service = mockServices[serviceId as keyof typeof mockServices];

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error('Error fetching service:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service' },
      { status: 500 }
    );
  }
} 