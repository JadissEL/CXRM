'use client';

import React from 'react';
const { useState, useEffect } = React;
import { CheckCircle, Calendar, Clock, User, MapPin, Phone, Mail, MessageSquare, Star as Download, Share2, Star as Copy, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';

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
  phone?: string;
  bio?: string;
  image_url?: string;
  rating?: number;
  review_count?: number;
  location?: string;
}

interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
  total_price: number;
  deposit_amount: number;
  client_name: string;
  client_email: string;
  client_phone: string;
  created_at: string;
  barber: Barber;
  services: Service[];
}

interface MultiServiceBookingConfirmationProps {
  appointmentId: string;
  onNewBooking: () => void;
  onViewAppointments: () => void;
}

export default function MultiServiceBookingConfirmation({
  appointmentId,
  onNewBooking,
  onViewAppointments
}: MultiServiceBookingConfirmationProps) {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [notificationSent, setNotificationSent] = useState(false);



  useEffect(() => {
    const fetchAppointment = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('appointments')
          .select(`
            *,
            barber:barbers(*),
            services:appointment_services(
              service:services(*)
            )
          `)
          .eq('id', appointmentId)
          .single();

        if (fetchError) {
          throw new Error('Failed to fetch appointment details');
        }

        // Transform the data to match our interface
        const transformedAppointment: Appointment = {
          ...data,
          services: data.services?.map((item: any) => item.service) || []
        };

        setAppointment(transformedAppointment);
        
        // Send confirmation notification
        await sendConfirmationNotification(transformedAppointment);
      } catch (err) {
        console.error('Error fetching appointment:', err);
        setError(err instanceof Error ? err.message : 'Failed to load appointment details');
      } finally {
        setLoading(false);
      }
    };

    if (appointmentId) {
      fetchAppointment();
    }
  }, [appointmentId, supabase]);

  const sendConfirmationNotification = async (appointment: Appointment) => {
    try {
      const response = await fetch('/api/notifications/booking-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId: appointment.id,
          clientEmail: appointment.client_email,
          clientName: appointment.client_name,
          barberName: appointment.barber.name,
          appointmentDate: appointment.appointment_date,
          startTime: appointment.start_time,
          services: appointment.services,
          totalPrice: appointment.total_price,
          depositAmount: appointment.deposit_amount
        }),
      });

      if (response.ok) {
        setNotificationSent(true);
      }
    } catch (error) {
      console.error('Error sending confirmation notification:', error);
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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTotalDuration = (): number => {
    return appointment?.services.reduce((sum, service) => sum + service.duration, 0) || 0;
  };

  const copyToClipboard = async () => {
    if (!appointment) return;

    const text = `
Booking Confirmation - ${appointment.id}

Barber: ${appointment.barber.name}
Date: ${formatDate(appointment.appointment_date)}
Time: ${formatTime(appointment.start_time)} - ${formatTime(appointment.end_time)}

Services:
${appointment.services.map(service => `• ${service.name} - $${service.price} (${formatDuration(service.duration)})`).join('\n')}

Total: $${appointment.total_price.toFixed(2)}
Deposit Paid: $${appointment.deposit_amount.toFixed(2)}

Contact: ${appointment.client_phone}
Email: ${appointment.client_email}
    `;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const downloadConfirmation = () => {
    if (!appointment) return;

    const content = `
BOOKING CONFIRMATION
====================

Confirmation Number: ${appointment.id}
Booking Date: ${new Date(appointment.created_at).toLocaleDateString()}

CLIENT INFORMATION
------------------
Name: ${appointment.client_name}
Email: ${appointment.client_email}
Phone: ${appointment.client_phone}

APPOINTMENT DETAILS
-------------------
Barber: ${appointment.barber.name}
Date: ${formatDate(appointment.appointment_date)}
Time: ${formatTime(appointment.start_time)} - ${formatTime(appointment.end_time)}
Duration: ${formatDuration(getTotalDuration())}
Status: ${appointment.status}

SERVICES BOOKED
---------------
${appointment.services.map(service => 
  `• ${service.name}\n  Category: ${service.category}\n  Duration: ${formatDuration(service.duration)}\n  Price: $${service.price.toFixed(2)}\n  Description: ${service.description}\n`
).join('\n')}

PRICING BREAKDOWN
-----------------
Subtotal: $${appointment.total_price.toFixed(2)}
Deposit Paid: $${appointment.deposit_amount.toFixed(2)}
Remaining Balance: $${(appointment.total_price - appointment.deposit_amount).toFixed(2)}
Total: $${appointment.total_price.toFixed(2)}

${appointment.notes ? `SPECIAL REQUESTS\n----------------\n${appointment.notes}\n\n` : ''}
BARBER INFORMATION
------------------
Name: ${appointment.barber.name}
Email: ${appointment.barber.email}
${appointment.barber.phone ? `Phone: ${appointment.barber.phone}\n` : ''}${appointment.barber.location ? `Location: ${appointment.barber.location}\n` : ''}

Thank you for choosing our services!
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booking-confirmation-${appointment.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareBooking = async () => {
    if (!appointment || !navigator.share) {
      copyToClipboard();
      return;
    }

    try {
      await navigator.share({
        title: 'Booking Confirmation',
        text: `Appointment confirmed with ${appointment.barber.name} on ${formatDate(appointment.appointment_date)} at ${formatTime(appointment.start_time)}`,
        url: window.location.href
      });
    } catch (error) {
      console.error('Error sharing:', error);
      copyToClipboard();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading confirmation details...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !appointment) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Failed to load appointment details'}
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex gap-2">
            <Button onClick={onNewBooking}>Book Another Appointment</Button>
            <Button variant="outline" onClick={onViewAppointments}>
              View My Appointments
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-green-800 mb-2">
              Booking Confirmed!
            </h1>
            <p className="text-green-700">
              Your appointment has been successfully booked.
            </p>
            <p className="text-sm text-green-600 mt-1">
              Confirmation #: {appointment.id}
            </p>
            {notificationSent && (
              <p className="text-sm text-green-600 mt-1">
                ✓ Confirmation email sent to {appointment.client_email}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Appointment Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Appointment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="font-medium">{appointment.barber.name}</p>
                  <p className="text-sm text-gray-600">Your Barber</p>
                </div>
              </div>
              
              {appointment.barber.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="font-medium">{appointment.barber.location}</p>
                    <p className="text-sm text-gray-600">Location</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="font-medium">{formatDate(appointment.appointment_date)}</p>
                  <p className="text-sm text-gray-600">Date</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="font-medium">
                    {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Duration: {formatDuration(getTotalDuration())}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}
              className="capitalize"
            >
              {appointment.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Services Booked */}
      <Card>
        <CardHeader>
          <CardTitle>Services Booked</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {appointment.services.map((service, index) => (
              <div key={service.id} className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{service.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {service.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(service.duration)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-lg">${service.price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="font-medium">{appointment.client_name}</p>
                  <p className="text-sm text-gray-600">Client Name</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="font-medium">{appointment.client_phone}</p>
                  <p className="text-sm text-gray-600">Phone Number</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="font-medium">{appointment.client_email}</p>
                  <p className="text-sm text-gray-600">Email Address</p>
                </div>
              </div>
              
              {appointment.barber.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="font-medium">{appointment.barber.phone}</p>
                    <p className="text-sm text-gray-600">Barber Phone</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {appointment.notes && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-start gap-3">
                <MessageSquare className="h-4 w-4 text-gray-500 mt-1" />
                <div>
                  <p className="font-medium mb-1">Special Requests</p>
                  <p className="text-sm text-gray-600">{appointment.notes}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${appointment.total_price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Deposit Paid:</span>
              <span>-${appointment.deposit_amount.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-medium">
              <span>Remaining Balance:</span>
              <span>${(appointment.total_price - appointment.deposit_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>${appointment.total_price.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={onNewBooking} className="flex-1">
          Book Another Appointment
        </Button>
        <Button variant="outline" onClick={onViewAppointments} className="flex-1">
          View My Appointments
        </Button>
      </div>

      {/* Share Options */}
      <Card>
        <CardHeader>
          <CardTitle>Share & Save</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={copyToClipboard}
              className="flex items-center gap-2"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy Details'}
            </Button>
            
            <Button
              variant="outline"
              onClick={downloadConfirmation}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            
            <Button
              variant="outline"
              onClick={shareBooking}
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}