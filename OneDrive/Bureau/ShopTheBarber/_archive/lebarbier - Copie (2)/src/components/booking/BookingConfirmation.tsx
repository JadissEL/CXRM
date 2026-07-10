'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, User, MapPin, Phone, Mail, CheckCircle2, Download, Share2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format, addMinutes } from 'date-fns';

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
  avatar_url?: string;
  barber_profiles: {
    business_name?: string;
    phone?: string;
    address_street?: string;
    address_city?: string;
    address_state?: string;
    address_postal_code?: string;
  };
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
}

interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
  client_notes?: string;
  barber_notes?: string;
  total_price: number;
  deposit_amount: number;
  payment_status: string;
  booking_source: string;
  created_at: string;
  client: Client;
  barber: Barber;
  services: Service[];
}

interface BookingConfirmationProps {
  appointmentId: string;
  showSuccessMessage?: boolean;
}

export default function BookingConfirmation({ 
  appointmentId, 
  showSuccessMessage = false 
}: BookingConfirmationProps) {
  const router = useRouter();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch appointment details
  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const response = await fetch(`/api/appointments/${appointmentId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch appointment details');
        }

        const data = await response.json();
        setAppointment(data.appointment);
      } catch (err) {
        console.error('Error fetching appointment:', err);
        setError(err instanceof Error ? err.message : 'Failed to load appointment');
      } finally {
        setLoading(false);
      }
    };

    if (appointmentId) {
      fetchAppointment();
    }
  }, [appointmentId]);

  const formatTime = (time: string) => {
    return format(new Date(`2000-01-01T${time}`), 'h:mm a');
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'EEEE, MMMM d, yyyy');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownloadReceipt = () => {
    // TODO: Implement PDF receipt generation
    console.log('Download receipt for appointment:', appointmentId);
  };

  const handleShareAppointment = async () => {
    if (navigator.share && appointment) {
      try {
        await navigator.share({
          title: 'Appointment Confirmation',
          text: `Appointment with ${appointment.barber.name} on ${formatDate(appointment.appointment_date)} at ${formatTime(appointment.start_time)}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      const shareText = `Appointment with ${appointment?.barber.name} on ${formatDate(appointment?.appointment_date || '')} at ${formatTime(appointment?.start_time || '')}`;
      navigator.clipboard.writeText(shareText);
    }
  };

  const handleEditAppointment = () => {
    router.push(`/appointments/${appointmentId}/edit`);
  };

  const canEditAppointment = (appointment: Appointment) => {
    return appointment.status === 'pending' || appointment.status === 'confirmed';
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            {error || 'Appointment not found'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const totalDuration = appointment.services.reduce((sum, service) => sum + service.duration, 0);
  const remainingBalance = appointment.total_price - appointment.deposit_amount;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Success Message */}
      {showSuccessMessage && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Booking Confirmed!</strong> Your appointment has been successfully booked. 
            You'll receive a confirmation email shortly.
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Appointment Confirmation</h1>
          <p className="text-gray-600">Booking ID: {appointment.id.slice(0, 8).toUpperCase()}</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleShareAppointment}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadReceipt}>
            <Download className="h-4 w-4 mr-2" />
            Receipt
          </Button>
          {canEditAppointment(appointment) && (
            <Button variant="outline" size="sm" onClick={handleEditAppointment}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Appointment Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold">Appointment Status</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getStatusColor(appointment.status)}>
                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                  </Badge>
                  <Badge className={getPaymentStatusColor(appointment.payment_status)}>
                    Payment: {appointment.payment_status.charAt(0).toUpperCase() + appointment.payment_status.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-600">Booked on</div>
              <div className="font-medium">
                {format(new Date(appointment.created_at), 'MMM d, yyyy h:mm a')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Appointment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Date & Time */}
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium">
                  {formatDate(appointment.appointment_date)}
                </div>
                <div className="text-sm text-gray-600">
                  {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                  {' • '}{totalDuration} minutes
                </div>
              </div>
            </div>

            <Separator />

            {/* Services */}
            <div>
              <div className="font-medium mb-3">Services</div>
              <div className="space-y-3">
                {appointment.services.map((service) => (
                  <div key={service.id} className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{service.name}</div>
                      <div className="text-sm text-gray-600">
                        {service.duration} min • {service.category}
                      </div>
                      {service.description && (
                        <div className="text-xs text-gray-500 mt-1">
                          {service.description}
                        </div>
                      )}
                    </div>
                    <div className="font-medium">${service.price}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {appointment.client_notes && (
              <>
                <Separator />
                <div>
                  <div className="font-medium mb-2">Your Notes</div>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {appointment.client_notes}
                  </div>
                </div>
              </>
            )}

            {appointment.barber_notes && (
              <>
                <Separator />
                <div>
                  <div className="font-medium mb-2">Barber Notes</div>
                  <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                    {appointment.barber_notes}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Barber & Payment Info */}
        <div className="space-y-6">
          {/* Barber Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Barber Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                  {appointment.barber.avatar_url ? (
                    <img
                      src={appointment.barber.avatar_url}
                      alt={appointment.barber.name}
                      className="w-12 h-12 object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6 text-gray-500" />
                  )}
                </div>
                <div>
                  <div className="font-medium">{appointment.barber.name}</div>
                  <div className="text-sm text-gray-600">
                    {appointment.barber.barber_profiles.business_name || 'Professional Barber'}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contact Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{appointment.barber.email}</span>
                </div>
                {appointment.barber.barber_profiles.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{appointment.barber.barber_profiles.phone}</span>
                  </div>
                )}
                {appointment.barber.barber_profiles.address_street && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div>
                      <div>{appointment.barber.barber_profiles.address_street}</div>
                      <div>
                        {appointment.barber.barber_profiles.address_city}, {appointment.barber.barber_profiles.address_state} {appointment.barber.barber_profiles.address_postal_code}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${appointment.total_price}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Deposit Paid</span>
                  <span>-${appointment.deposit_amount}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Remaining Balance</span>
                  <span>${remainingBalance}</span>
                </div>
              </div>

              {remainingBalance > 0 && (
                <div className="bg-yellow-50 p-3 rounded text-sm">
                  <strong>Payment Due:</strong> ${remainingBalance} will be due at the time of your appointment.
                </div>
              )}

              {appointment.payment_status === 'paid' && (
                <div className="bg-green-50 p-3 rounded text-sm text-green-800">
                  <strong>Fully Paid:</strong> No additional payment required.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Important Information */}
      <Card>
        <CardHeader>
          <CardTitle>Important Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <div>
              <strong>Cancellation Policy:</strong> Appointments can be cancelled up to 24 hours in advance for a full refund.
            </div>
            <div>
              <strong>Arrival Time:</strong> Please arrive 10 minutes before your scheduled appointment time.
            </div>
            <div>
              <strong>Rescheduling:</strong> To reschedule your appointment, please contact the barber directly or use the edit button above.
            </div>
            <div>
              <strong>Contact:</strong> If you have any questions, please contact {appointment.barber.name} at {appointment.barber.email}.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={() => router.push('/appointments')}>
          View All Appointments
        </Button>
        <Button onClick={() => router.push(`/barbers/${appointment.barber.id}`)}>
          Book Another Appointment
        </Button>
      </div>
    </div>
  );
}