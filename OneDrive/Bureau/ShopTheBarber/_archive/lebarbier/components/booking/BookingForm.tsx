'use client';

import React from 'react';
const { useState, useEffect } = React;
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Calendar, Clock, User, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { z } from 'zod';

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
  };
}

interface BookingFormProps {
  barber: Barber;
  services: Service[];
  selectedSlot: SelectedSlot | null;
  onBookingComplete: (appointmentId: string) => void;
  onCancel: () => void;
}

const bookingSchema = z.object({
  clientNotes: z.string().max(500).optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
  depositAmount: z.number().min(0).optional(),
});

export default function BookingForm({
  barber,
  services,
  selectedSlot,
  onBookingComplete,
  onCancel,
}: BookingFormProps) {
  const { userId } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    clientNotes: '',
    phone: '',
    depositAmount: 0,
  });
  const [userProfile, setUserProfile] = useState<any>(null);

  // Calculate totals
  const totalDuration = services.reduce((sum, service) => sum + service.duration, 0);
  const totalPrice = services.reduce((sum, service) => sum + service.price, 0);
  const depositAmount = formData.depositAmount || Math.round(totalPrice * 0.2); // 20% default deposit

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) return;

      try {
        const response = await fetch('/api/user/profile');
        if (response.ok) {
          const data = await response.json();
          setUserProfile(data.user);
          setFormData(prev => ({
            ...prev,
            phone: data.user.phone || '',
          }));
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    };

    fetchUserProfile();
  }, [userId]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  const validateForm = () => {
    try {
      bookingSchema.parse(formData);
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSlot || !userId) {
      setError('Missing required information');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create the appointment
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          barber_id: barber.id,
          service_ids: services.map(s => s.id),
          appointment_date: selectedSlot.date,
          start_time: selectedSlot.start_time,
          end_time: selectedSlot.end_time,
          client_notes: formData.clientNotes || null,
          deposit_amount: depositAmount,
          booking_source: 'web',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create appointment');
      }

      const data = await response.json();
      setSuccess(true);
      
      // Wait a moment to show success message
      setTimeout(() => {
        onBookingComplete(data.appointment.id);
      }, 2000);

    } catch (err) {
      console.error('Error creating appointment:', err);
      setError(err instanceof Error ? err.message : 'Failed to create appointment');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string) => {
    return format(new Date(`2000-01-01T${time}`), 'h:mm a');
  };

  if (!selectedSlot) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            Please select a time slot to continue with booking.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-green-600">Booking Confirmed!</h3>
              <p className="text-gray-600 mt-2">
                Your appointment has been successfully booked. You'll receive a confirmation email shortly.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Booking Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Booking Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Barber Info */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              {barber.avatar_url ? (
                <img
                  src={barber.avatar_url}
                  alt={barber.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <User className="h-6 w-6 text-gray-500" />
              )}
            </div>
            <div>
              <div className="font-medium">{barber.name}</div>
              <div className="text-sm text-gray-600">
                {barber.barber_profiles.business_name || 'Professional Barber'}
              </div>
            </div>
          </div>

          <Separator />

          {/* Date & Time */}
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-blue-600" />
            <div>
              <div className="font-medium">
                {format(new Date(selectedSlot.date), 'EEEE, MMMM d, yyyy')}
              </div>
              <div className="text-sm text-gray-600">
                {formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)}
                {' • '}{totalDuration} minutes
              </div>
            </div>
          </div>

          <Separator />

          {/* Services */}
          <div>
            <div className="font-medium mb-2">Services</div>
            <div className="space-y-2">
              {services.map((service) => (
                <div key={service.id} className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{service.name}</div>
                    <div className="text-sm text-gray-600">
                      {service.duration} min • {service.category}
                    </div>
                  </div>
                  <div className="font-medium">${service.price}</div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Pricing */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${totalPrice}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Deposit Required</span>
              <span>${depositAmount}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg border-t pt-2">
              <span>Total</span>
              <span>${totalPrice}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={userProfile?.name || ''}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={userProfile?.email || ''}
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="Enter your phone number"
              required
            />
          </div>

          <div>
            <Label htmlFor="clientNotes">Special Requests or Notes (Optional)</Label>
            <Textarea
              id="clientNotes"
              value={formData.clientNotes}
              onChange={(e) => handleInputChange('clientNotes', e.target.value)}
              placeholder="Any special requests, preferences, or notes for the barber..."
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-gray-500 mt-1">
              {formData.clientNotes.length}/500 characters
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment & Deposit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-blue-900">Deposit Policy</div>
                <div className="text-blue-700 mt-1">
                  A deposit of ${depositAmount} is required to secure your appointment. 
                  The remaining balance of ${totalPrice - depositAmount} will be due at the time of service.
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="depositAmount">Deposit Amount</Label>
            <Input
              id="depositAmount"
              type="number"
              min={Math.round(totalPrice * 0.2)}
              max={totalPrice}
              step="0.01"
              value={formData.depositAmount || depositAmount}
              onChange={(e) => handleInputChange('depositAmount', parseFloat(e.target.value) || 0)}
            />
            <div className="text-xs text-gray-500 mt-1">
              Minimum: ${Math.round(totalPrice * 0.2)} (20%) • Maximum: ${totalPrice} (100%)
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <strong>Payment will be processed upon confirmation.</strong>
            <br />
            You can pay the deposit now and the remaining balance at your appointment.
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || !selectedSlot}
          className="flex-1"
        >
          {loading ? 'Booking...' : `Book Appointment - $${depositAmount} Deposit`}
        </Button>
      </div>

      {/* Terms */}
      <div className="text-xs text-gray-500 text-center">
        By booking this appointment, you agree to our terms of service and cancellation policy.
        Appointments can be cancelled up to 24 hours in advance for a full refund.
      </div>
    </form>
  );
}