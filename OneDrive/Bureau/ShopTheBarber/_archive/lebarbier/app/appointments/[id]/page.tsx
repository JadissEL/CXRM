import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import BookingConfirmation from '@/components/booking/BookingConfirmation';
import { createClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs';

interface AppointmentPageProps {
  params: {
    id: string;
  };
  searchParams: {
    success?: string;
  };
}

// Loading component
function AppointmentPageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 bg-gray-200 rounded w-20 animate-pulse" />
            <div className="h-9 bg-gray-200 rounded w-24 animate-pulse" />
            <div className="h-9 bg-gray-200 rounded w-16 animate-pulse" />
          </div>
        </div>

        {/* Status Card Skeleton */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
              <div className="space-y-2">
                <div className="h-6 bg-gray-200 rounded w-40 animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-5 bg-gray-200 rounded w-20 animate-pulse" />
                  <div className="h-5 bg-gray-200 rounded w-24 animate-pulse" />
                </div>
              </div>
            </div>
            <div className="text-right space-y-1">
              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
              <div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Content Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-40 animate-pulse" />
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-36 animate-pulse" />
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border p-6">
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Skeleton */}
        <div className="flex gap-3 justify-center">
          <div className="h-10 bg-gray-200 rounded w-40 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded w-48 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// Validate appointment access
async function validateAppointmentAccess(appointmentId: string, userId: string | null) {
  if (!userId) {
    return null;
  }

  const supabase = createClient();
  
  const { data: appointment, error } = await supabase
    .from('appointments')
    .select(`
      id,
      client_id,
      barber_id,
      appointment_date,
      start_time,
      end_time,
      status
    `)
    .eq('id', appointmentId)
    .single();

  if (error || !appointment) {
    return null;
  }

  // Check if user has access to this appointment
  if (appointment.client_id !== userId && appointment.barber_id !== userId) {
    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (!user || user.role !== 'admin') {
      return null;
    }
  }

  return appointment;
}

export default async function AppointmentPage({ params, searchParams }: AppointmentPageProps) {
  const { id: appointmentId } = params;
  const showSuccess = searchParams.success === 'true';
  
  // Get current user
  const { userId } = auth();
  
  if (!userId) {
    notFound();
  }

  // Validate appointment access
  const appointment = await validateAppointmentAccess(appointmentId, userId);
  
  if (!appointment) {
    notFound();
  }

  return (
    <Suspense fallback={<AppointmentPageSkeleton />}>
      <BookingConfirmation 
        appointmentId={appointmentId}
        showSuccessMessage={showSuccess}
      />
    </Suspense>
  );
}

// Generate metadata for the page
export async function generateMetadata({ params }: { params: { id: string } }) {
  const { userId } = auth();
  
  if (!userId) {
    return {
      title: 'Appointment Not Found - Le Barbier',
      description: 'The requested appointment could not be found.',
    };
  }

  const appointment = await validateAppointmentAccess(params.id, userId);
  
  if (!appointment) {
    return {
      title: 'Appointment Not Found - Le Barbier',
      description: 'The requested appointment could not be found.',
    };
  }

  const appointmentDate = new Date(appointment.appointment_date).toLocaleDateString();
  const appointmentTime = new Date(`2000-01-01T${appointment.start_time}`).toLocaleTimeString([], { 
    hour: 'numeric', 
    minute: '2-digit' 
  });
  
  return {
    title: `Appointment on ${appointmentDate} - Le Barbier`,
    description: `Appointment details for ${appointmentDate} at ${appointmentTime}. Status: ${appointment.status}.`,
    openGraph: {
      title: `Appointment Confirmation - Le Barbier`,
      description: `Your appointment is confirmed for ${appointmentDate} at ${appointmentTime}.`,
      type: 'website',
    },
  };
}

// Static params generation (optional)
export async function generateStaticParams() {
  // For appointments, we typically don't pre-generate static pages
  // as they are user-specific and created dynamically
  return [];
}