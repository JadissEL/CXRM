'use client';

import React from 'react';
const { useState, useEffect } = React;
import { Calendar, Clock, User, MapPin, Phone, Mail, MessageSquare, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useUser } from '@clerk/nextjs';
import MultiServiceSelector from './MultiServiceSelector';

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
  image_url?: string;
  is_popular?: boolean;
  rating?: number;
  review_count?: number;
}

interface SelectedService extends Service {
  quantity: number;
}

interface Barber {
  id: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  image_url?: string;
  rating?: number;
  review_count?: number;
  location?: string;
}

interface AvailableSlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
  conflicts?: string[];
}

interface MultiServiceBookingFormProps {
  barberId: string;
  selectedDate: Date;
  onBookingComplete: (appointmentId: string) => void;
  onBack: () => void;
}

interface BookingFormData {
  notes: string;
  phone: string;
  email: string;
  name: string;
}

export default function MultiServiceBookingForm({
  barberId,
  selectedDate,
  onBookingComplete,
  onBack
}: MultiServiceBookingFormProps) {
  const { user } = useUser();
  const [barber, setBarber] = useState<Barber | null>(null);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [formData, setFormData] = useState<BookingFormData>({
    notes: '',
    phone: '',
    email: user?.emailAddresses[0]?.emailAddress || '',
    name: user?.fullName || ''
  });
  const [loading, setLoading] = useState({
    barber: true,
    availability: false,
    booking: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [reservationId, setReservationId] = useState<string | null>(null);



  // Calculate totals
  const totalDuration = selectedServices.reduce((sum, service) => sum + (service.duration * service.quantity), 0);
  const totalPrice = selectedServices.reduce((sum, service) => sum + (service.price * service.quantity), 0);
  const depositAmount = totalPrice * 0.2; // 20% deposit

  // Fetch barber details
  useEffect(() => {
    const fetchBarber = async () => {
      setLoading(prev => ({ ...prev, barber: true }));
      
      try {
        const { data, error } = await supabase
          .from('barbers')
          .select('*')
          .eq('id', barberId)
          .single();

        if (error) throw error;
        setBarber(data);
      } catch (error) {
        console.error('Error fetching barber:', error);
      } finally {
        setLoading(prev => ({ ...prev, barber: false }));
      }
    };

    fetchBarber();
  }, [barberId, supabase]);

  // Check availability when services change
  useEffect(() => {
    if (selectedServices.length > 0 && totalDuration > 0) {
      checkAvailability();
    } else {
      setAvailableSlots([]);
      setSelectedSlot(null);
      setAvailabilityError(null);
    }
  }, [selectedServices, selectedDate]);

  const checkAvailability = async () => {
    setLoading(prev => ({ ...prev, availability: true }));
    setAvailabilityError(null);
    
    try {
      const serviceIds = selectedServices.flatMap(service => 
        Array(service.quantity).fill(service.id)
      );

      const { data, error } = await supabase
        .rpc('get_barber_availability', {
          p_barber_id: barberId,
          p_date: selectedDate.toISOString().split('T')[0],
          p_service_ids: serviceIds
        });

      if (error) {
        throw new Error(error.message);
      }

      if (data && data.length > 0) {
        setAvailableSlots(data);
      } else {
        setAvailableSlots([]);
        setAvailabilityError('No available slots for the selected services on this date.');
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailabilityError(
        error instanceof Error ? error.message : 'Failed to check availability'
      );
      setAvailableSlots([]);
    } finally {
      setLoading(prev => ({ ...prev, availability: false }));
    }
  };

  const reserveSlot = async (slot: AvailableSlot) => {
    try {
      const serviceIds = selectedServices.flatMap(service => 
        Array(service.quantity).fill(service.id)
      );

      const { data, error } = await supabase
        .rpc('reserve_time_slot', {
          p_barber_id: barberId,
          p_start_time: `${selectedDate.toISOString().split('T')[0]} ${slot.start_time}`,
          p_service_ids: serviceIds
        });

      if (error) throw error;
      
      setReservationId(data);
      setSelectedSlot(slot);
    } catch (error) {
      console.error('Error reserving slot:', error);
      setAvailabilityError('Failed to reserve time slot. Please try again.');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (selectedServices.length === 0) {
      newErrors.services = 'Please select at least one service';
    }

    if (!selectedSlot) {
      newErrors.slot = 'Please select an available time slot';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(prev => ({ ...prev, booking: true }));
    
    try {
      const serviceIds = selectedServices.flatMap(service => 
        Array(service.quantity).fill(service.id)
      );

      const appointmentData = {
        barber_id: barberId,
        service_ids: serviceIds,
        appointment_date: selectedDate.toISOString().split('T')[0],
        start_time: selectedSlot!.start_time,
        notes: formData.notes,
        client_phone: formData.phone,
        client_email: formData.email,
        client_name: formData.name,
        reservation_id: reservationId
      };

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create appointment');
      }

      onBookingComplete(result.id);
    } catch (error) {
      console.error('Error creating appointment:', error);
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to create appointment'
      });
    } finally {
      setLoading(prev => ({ ...prev, booking: false }));
    }
  };

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  if (loading.barber) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading barber information...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Book Multiple Services</h1>
          <p className="text-gray-600">
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        <Button variant="outline" onClick={onBack}>
          Back to Calendar
        </Button>
      </div>

      {/* Barber Info */}
      {barber && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              {barber.image_url && (
                <img
                  src={barber.image_url}
                  alt={barber.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              )}
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{barber.name}</h3>
                {barber.location && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <MapPin className="h-3 w-3" />
                    {barber.location}
                  </div>
                )}
                {barber.rating && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <span>⭐ {barber.rating.toFixed(1)}</span>
                    {barber.review_count && (
                      <span>({barber.review_count} reviews)</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Selection */}
      <MultiServiceSelector
        barberId={barberId}
        selectedServices={selectedServices}
        onServicesChange={setSelectedServices}
        maxServices={5}
      />

      {errors.services && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errors.services}</AlertDescription>
        </Alert>
      )}

      {/* Available Time Slots */}
      {selectedServices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Time Slots</CardTitle>
            <p className="text-sm text-gray-600">
              Duration needed: {formatDuration(totalDuration)}
            </p>
          </CardHeader>
          <CardContent>
            {loading.availability ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Checking availability...</span>
              </div>
            ) : availabilityError ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{availabilityError}</AlertDescription>
              </Alert>
            ) : availableSlots.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {availableSlots.map((slot, index) => (
                  <Button
                    key={index}
                    variant={selectedSlot === slot ? "default" : "outline"}
                    className="h-auto p-3 flex flex-col items-center"
                    onClick={() => reserveSlot(slot)}
                    disabled={!slot.is_available}
                  >
                    <Clock className="h-4 w-4 mb-1" />
                    <span className="text-sm font-medium">
                      {formatTime(slot.start_time)}
                    </span>
                    <span className="text-xs text-gray-500">
                      to {formatTime(slot.end_time)}
                    </span>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No available slots found for the selected services.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {errors.slot && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errors.slot}</AlertDescription>
        </Alert>
      )}

      {/* Booking Form */}
      {selectedSlot && (
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter your phone number"
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500">{errors.phone}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email address"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Special Requests (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any special requests or notes for your barber..."
                  rows={3}
                />
              </div>

              {errors.submit && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.submit}</AlertDescription>
                </Alert>
              )}

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading.booking}
                >
                  {loading.booking ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating Appointment...
                    </>
                  ) : (
                    `Book Appointment - $${totalPrice.toFixed(2)}`
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Booking Summary */}
      {selectedServices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Booking Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Barber:</span>
                <span>{barber?.name}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Date:</span>
                <span>
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
              
              {selectedSlot && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Time:</span>
                  <span>
                    {formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)}
                  </span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Duration:</span>
                <span>{formatDuration(totalDuration)}</span>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <h4 className="font-medium">Services:</h4>
              {selectedServices.map(service => (
                <div key={service.id} className="flex justify-between text-sm">
                  <span>
                    {service.name}
                    {service.quantity > 1 && ` × ${service.quantity}`}
                  </span>
                  <span>${(service.price * service.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Subtotal:</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Deposit (20%):</span>
                <span>${depositAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}