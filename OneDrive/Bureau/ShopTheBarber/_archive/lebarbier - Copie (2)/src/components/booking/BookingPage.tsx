'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Calendar, User, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import AvailabilityCalendar from './AvailabilityCalendar';
import BookingForm from './BookingForm';
import { createClient } from '@/lib/supabase';

interface SelectedSlot {
  date: string;
  start_time: string;
  end_time: string;
  price: number;
  duration: number;
}

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
  image_url?: string;
}

interface Barber {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  barber_profiles: {
    business_name?: string;
    phone?: string;
    address_street?: string;
    address_city?: string;
    address_state?: string;
    bio?: string;
    years_experience?: number;
    specialties?: string[];
  };
}

interface BookingPageProps {
  barberId: string;
  serviceIds?: string[];
}

export default function BookingPage({ barberId, serviceIds = [] }: BookingPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  
  const [barber, setBarber] = useState<Barber | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [currentStep, setCurrentStep] = useState<'calendar' | 'booking'>('calendar');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Get service IDs from URL params if not provided
  const finalServiceIds = serviceIds.length > 0 
    ? serviceIds 
    : searchParams.get('services')?.split(',').filter(Boolean) || [];

  // Fetch barber and services data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch barber details
        const { data: barberData, error: barberError } = await supabase
          .from('users')
          .select(`
            id,
            name,
            email,
            avatar_url,
            barber_profiles (
              business_name,
              phone,
              address_street,
              address_city,
              address_state,
              address_postal_code,
              bio,
              years_experience,
              specialties,
              rating,
              total_reviews
            )
          `)
          .eq('id', barberId)
          .eq('role', 'barber')
          .eq('status', 'active')
          .single();

        if (barberError || !barberData) {
          throw new Error('Barber not found or unavailable');
        }

        setBarber(barberData as Barber);

        // Fetch services if service IDs are provided
        if (finalServiceIds.length > 0) {
          const { data: servicesData, error: servicesError } = await supabase
            .from('services')
            .select('*')
            .in('id', finalServiceIds)
            .eq('is_active', true);

          if (servicesError) {
            throw new Error('Failed to fetch services');
          }

          if (!servicesData || servicesData.length === 0) {
            throw new Error('No valid services found');
          }

          setServices(servicesData);
        } else {
          // If no services specified, fetch all services for this barber
          const { data: servicesData, error: servicesError } = await supabase
            .from('services')
            .select('*')
            .eq('barber_id', barberId)
            .eq('is_active', true)
            .order('name');

          if (servicesError) {
            console.error('Error fetching barber services:', servicesError);
          }

          setServices(servicesData || []);
        }

      } catch (err) {
        console.error('Error fetching booking data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load booking information');
      } finally {
        setLoading(false);
      }
    };

    if (barberId) {
      fetchData();
    }
  }, [barberId, finalServiceIds, supabase]);

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      router.push('/sign-in?redirect=' + encodeURIComponent(window.location.pathname + window.location.search));
    }
  }, [isAuthenticated, loading, router]);

  const handleSlotSelect = (slot: SelectedSlot | null) => {
    setSelectedSlot(slot);
    if (slot) {
      setCurrentStep('booking');
    }
  };

  const handleBookingComplete = (appointmentId: string) => {
    router.push(`/appointments/${appointmentId}?success=true`);
  };

  const handleCancel = () => {
    if (currentStep === 'booking') {
      setCurrentStep('calendar');
      setSelectedSlot(null);
    } else {
      router.back();
    }
  };

  const goBackToCalendar = () => {
    setCurrentStep('calendar');
  };

      if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <User className="h-12 w-12 text-gray-400 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Sign In Required</h3>
                <p className="text-gray-600 mt-2">
                  Please sign in to book an appointment.
                </p>
              </div>
              <Button onClick={() => router.push('/sign-in')} className="w-full">
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
            
            {/* Barber Info Skeleton */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Calendar Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-6">
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!barber) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Barber not found or unavailable for booking.</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const totalDuration = services.reduce((sum, service) => sum + service.duration, 0);
  const totalPrice = services.reduce((sum, service) => sum + service.price, 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {currentStep === 'booking' ? 'Back to Calendar' : 'Back'}
            </Button>
            
            <div>
              <h1 className="text-2xl font-bold">
                {currentStep === 'calendar' ? 'Select Appointment Time' : 'Complete Booking'}
              </h1>
              <p className="text-gray-600">
                {currentStep === 'calendar' 
                  ? 'Choose your preferred date and time'
                  : 'Review and confirm your appointment details'
                }
              </p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${
              currentStep === 'calendar' ? 'text-blue-600' : 'text-green-600'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'calendar' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-green-600 text-white'
              }`}>
                1
              </div>
              <span className="font-medium">Select Time</span>
            </div>
            
            <div className={`w-12 h-0.5 ${
              currentStep === 'booking' ? 'bg-green-600' : 'bg-gray-300'
            }`} />
            
            <div className={`flex items-center gap-2 ${
              currentStep === 'booking' ? 'text-blue-600' : 'text-gray-400'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'booking' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
              <span className="font-medium">Book Appointment</span>
            </div>
          </div>

          {/* Barber & Services Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Barber Info */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                    {barber.avatar_url ? (
                      <img
                        src={barber.avatar_url}
                        alt={barber.name}
                        className="w-16 h-16 object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{barber.name}</h3>
                    <p className="text-gray-600">
                      {barber.barber_profiles.business_name || 'Professional Barber'}
                    </p>
                    {barber.barber_profiles.address_city && (
                      <p className="text-sm text-gray-500">
                        {barber.barber_profiles.address_city}, {barber.barber_profiles.address_state}
                      </p>
                    )}
                  </div>
                </div>

                <Separator orientation="vertical" className="hidden md:block" />

                {/* Services Info */}
                <div className="flex-1">
                  <h4 className="font-medium mb-3">Selected Services</h4>
                  {services.length > 0 ? (
                    <div className="space-y-2">
                      {services.map((service) => (
                        <div key={service.id} className="flex justify-between items-center">
                          <div>
                            <span className="font-medium">{service.name}</span>
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {service.category}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">${service.price}</div>
                            <div className="text-sm text-gray-500">{service.duration} min</div>
                          </div>
                        </div>
                      ))}
                      <Separator />
                      <div className="flex justify-between items-center font-semibold">
                        <span>Total ({totalDuration} min)</span>
                        <span>${totalPrice}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      No services selected. Please select services first.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          {services.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please select services before booking an appointment.
                <Button
                  variant="link"
                  className="ml-2 p-0 h-auto"
                  onClick={() => router.push(`/barbers/${barberId}`)}
                >
                  View Services
                </Button>
              </AlertDescription>
            </Alert>
          ) : currentStep === 'calendar' ? (
            <AvailabilityCalendar
              barberId={barberId}
              serviceIds={finalServiceIds}
              onSlotSelect={handleSlotSelect}
              selectedSlot={selectedSlot}
            />
          ) : (
            <BookingForm
              barber={barber}
              services={services}
              selectedSlot={selectedSlot}
              onBookingComplete={handleBookingComplete}
              onCancel={goBackToCalendar}
            />
          )}
        </div>
      </div>
    </div>
  );
}