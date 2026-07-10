import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import BookingPage from '@/components/booking/BookingPage';
import { createClient } from '@/lib/supabase';

interface BookingPageProps {
  params: {
    barberId: string;
  };
  searchParams: {
    services?: string;
  };
}

// Loading component
function BookingPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center gap-4">
            <div className="h-10 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
            </div>
          </div>
          
          {/* Progress Indicator Skeleton */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
            </div>
            <div className="w-12 h-0.5 bg-gray-200 animate-pulse" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
            </div>
          </div>
          
          {/* Barber Info Skeleton */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse" />
                <div className="space-y-2">
                  <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Calendar Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border p-4">
                <div className="space-y-3">
                  <div className="text-center space-y-1">
                    <div className="h-4 bg-gray-200 rounded w-12 mx-auto animate-pulse" />
                    <div className="h-6 bg-gray-200 rounded w-8 mx-auto animate-pulse" />
                    <div className="h-5 bg-gray-200 rounded w-16 mx-auto animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    {[...Array(4)].map((_, j) => (
                      <div key={j} className="h-8 bg-gray-200 rounded animate-pulse" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Validate barber exists and is available for booking
async function validateBarber(barberId: string) {
  const supabase = createClient();
  
  const { data: barber, error } = await supabase
    .from('users')
    .select(`
      id,
      name,
      email,
      status,
      role,
      barber_profiles (
        id,
        business_name,
        is_accepting_bookings
      )
    `)
    .eq('id', barberId)
    .eq('role', 'barber')
    .eq('status', 'active')
    .single();

  if (error || !barber) {
    return null;
  }

  // Check if barber is accepting bookings
  if (barber.barber_profiles && !barber.barber_profiles.is_accepting_bookings) {
    return null;
  }

  return barber;
}

export default async function BookingPageRoute({ params, searchParams }: BookingPageProps) {
  const { barberId } = params;
  const serviceIds = searchParams.services?.split(',').filter(Boolean) || [];

  // Validate barber
  const barber = await validateBarber(barberId);
  
  if (!barber) {
    notFound();
  }

  return (
    <Suspense fallback={<BookingPageSkeleton />}>
      <BookingPage 
        barberId={barberId} 
        serviceIds={serviceIds}
      />
    </Suspense>
  );
}

// Generate metadata for the page
export async function generateMetadata({ params }: { params: { barberId: string } }) {
  const barber = await validateBarber(params.barberId);
  
  if (!barber) {
    return {
      title: 'Barber Not Found - Le Barbier',
      description: 'The requested barber could not be found.',
    };
  }

  const barberName = barber.name;
  const businessName = barber.barber_profiles?.business_name;
  
  return {
    title: `Book with ${barberName}${businessName ? ` - ${businessName}` : ''} - Le Barbier`,
    description: `Book an appointment with ${barberName}${businessName ? ` at ${businessName}` : ''}. Choose your preferred date and time for professional barber services.`,
    openGraph: {
      title: `Book with ${barberName} - Le Barbier`,
      description: `Book an appointment with ${barberName} for professional barber services.`,
      type: 'website',
    },
  };
}

// Static params generation for better performance (optional)
export async function generateStaticParams() {
  // This could be used to pre-generate pages for popular barbers
  // For now, we'll use dynamic generation
  return [];
}