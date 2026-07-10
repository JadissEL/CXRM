'use client';

import React from 'react';
const { useState, useEffect, useCallback, useMemo } = React;
import { Calendar, Clock, User, CreditCard, MapPin, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useUser } from '@clerk/nextjs';
import { format, parseISO, isValid } from 'date-fns';
import { toast } from 'sonner';
import MultiServiceSelector from './MultiServiceSelector';
import LocationSelector from './LocationSelector';
import type {
  Service,
  SelectedService,
  Barber,
  TimeSlot,
  ContactInfo,
  BookingData,
  Coordinates,
  LocationType,
  EnhancedBookingFormProps,
  ApiResponse,
  AppointmentResponse,
} from '@/types/booking';

// Constants
const DEPOSIT_PERCENTAGE = 0.2;
const MIN_PHONE_LENGTH = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Error messages
const ERROR_MESSAGES = {
  MISSING_SERVICES: 'Please select at least one service',
  MISSING_TIME_SLOT: 'Please select a time slot',
  INVALID_LOCATION: 'Please provide a valid service address',
  MISSING_CONTACT: 'Please provide your contact information',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number (10+ digits)',
  BOOKING_FAILED: 'Failed to create appointment. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  UNEXPECTED_ERROR: 'An unexpected error occurred. Please try again.',
} as const;

export default function EnhancedBookingForm({
  barber,
  selectedDate,
  onBookingComplete,
  onBack,
}: EnhancedBookingFormProps) {
  const { user } = useUser();
  
  // State management
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [locationType, setLocationType] = useState<LocationType>('shop');
  const [serviceAddress, setServiceAddress] = useState('');
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [travelFee, setTravelFee] = useState(0);
  const [isLocationValid, setIsLocationValid] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    name: user?.fullName || '',
    email: user?.emailAddresses?.[0]?.emailAddress || '',
    phone: '',
  });
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  
  // Error states
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Memoized calculations for performance
  const calculations = useMemo(() => {
    const totalDuration = selectedServices.reduce((sum, service) => sum + (service.duration * service.quantity), 0);
    const basePrice = selectedServices.reduce((sum, service) => sum + (service.price * service.quantity), 0);
    const totalPrice = basePrice + travelFee;
    const depositAmount = totalPrice * DEPOSIT_PERCENTAGE;
    const remainingBalance = totalPrice - depositAmount;
    
    return {
      totalDuration,
      basePrice,
      totalPrice,
      depositAmount,
      remainingBalance,
    };
  }, [selectedServices, travelFee]);

  // Validation helpers
  const validateEmail = useCallback((email: string): boolean => {
    return EMAIL_REGEX.test(email.trim());
  }, []);

  const validatePhone = useCallback((phone: string): boolean => {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= MIN_PHONE_LENGTH;
  }, []);

  const validateContactInfo = useCallback((): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    if (!contactInfo.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!contactInfo.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(contactInfo.email)) {
      errors.email = ERROR_MESSAGES.INVALID_EMAIL;
    }
    
    if (contactInfo.phone && !validatePhone(contactInfo.phone)) {
      errors.phone = ERROR_MESSAGES.INVALID_PHONE;
    }
    
    return errors;
  }, [contactInfo, validateEmail, validatePhone]);

  // Fetch services with improved error handling
  const fetchServices = useCallback(async () => {
    if (!barber.id) return;
    
    setIsLoadingServices(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/services?barberId=${barber.id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ApiResponse<{ services: Service[] }> = await response.json();
      
      if (data.success && data.data?.services) {
        setServices(data.data.services);
      } else {
        setServices([]);
        console.warn('No services found for barber:', barber.id);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Failed to load services. Please refresh the page.');
      setServices([]);
      toast.error('Failed to load services');
    } finally {
      setIsLoadingServices(false);
    }
  }, [barber.id]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Fetch available slots with improved error handling and debouncing
  const fetchAvailableSlots = useCallback(async () => {
    if (!selectedServices.length || !selectedDate || !isValid(parseISO(selectedDate))) {
      setAvailableSlots([]);
      return;
    }

    // Reset selected slot when fetching new slots
    setSelectedSlot(null);
    setIsLoadingSlots(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        barberId: barber.id,
        date: selectedDate,
        duration: calculations.totalDuration.toString(),
        locationType,
      });

      if (locationType === 'home' && coordinates) {
        params.append('latitude', coordinates.lat.toString());
        params.append('longitude', coordinates.lng.toString());
      }

      const response = await fetch(`/api/availability?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ApiResponse<{ slots: TimeSlot[] }> = await response.json();
      
      if (data.success && data.data?.slots) {
        setAvailableSlots(data.data.slots);
      } else {
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      setAvailableSlots([]);
      toast.error('Failed to load available time slots');
    } finally {
      setIsLoadingSlots(false);
    }
  }, [barber.id, selectedDate, selectedServices, calculations.totalDuration, locationType, coordinates]);

  // Debounced effect for fetching slots
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAvailableSlots();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [fetchAvailableSlots]);

  // Enhanced event handlers
  const handleServiceChange = useCallback((services: SelectedService[]) => {
    setSelectedServices(services);
    setSelectedSlot(null); // Reset selected slot when services change
    setError(null); // Clear any previous errors
    
    // Clear validation errors related to services
    setValidationErrors(prev => {
      const { services: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const handleLocationValidation = useCallback((isValid: boolean, error?: string) => {
    setIsLocationValid(isValid);
    setLocationError(error || null);
    
    if (isValid) {
      setError(null);
      setValidationErrors(prev => {
        const { location: _, ...rest } = prev;
        return rest;
      });
    }
  }, []);

  const handleContactInfoChange = useCallback((field: keyof ContactInfo, value: string) => {
    setContactInfo(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    setValidationErrors(prev => {
      const { [field]: _, ...rest } = prev;
      return rest;
    });
    
    // Clear general error
    setError(null);
  }, []);

  const handleTimeSlotSelect = useCallback((slot: TimeSlot) => {
    setSelectedSlot(slot);
    setError(null);
    
    setValidationErrors(prev => {
      const { timeSlot: _, ...rest } = prev;
      return rest;
    });
  }, []);

  // Comprehensive form validation
  const validateForm = useCallback((): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};
    
    // Validate services
    if (!selectedServices.length) {
      errors.services = ERROR_MESSAGES.MISSING_SERVICES;
    }
    
    // Validate time slot
    if (!selectedSlot) {
      errors.timeSlot = ERROR_MESSAGES.MISSING_TIME_SLOT;
    }
    
    // Validate location for home visits
    if (locationType === 'home') {
      if (!isLocationValid || !coordinates || !serviceAddress.trim()) {
        errors.location = ERROR_MESSAGES.INVALID_LOCATION;
      }
    }
    
    // Validate contact information
    const contactErrors = validateContactInfo();
    Object.assign(errors, contactErrors);
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }, [selectedServices, selectedSlot, locationType, isLocationValid, coordinates, serviceAddress, validateContactInfo]);

  // Enhanced booking submission with comprehensive error handling
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setError(null);
    setValidationErrors({});
    
    // Validate form
    const validation = validateForm();
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      
      // Set a general error message
      const firstError = Object.values(validation.errors)[0];
      setError(firstError);
      
      // Focus on the first invalid field
      const firstErrorField = Object.keys(validation.errors)[0];
      const element = document.querySelector(`[data-field="${firstErrorField}"]`) as HTMLElement;
      element?.focus();
      
      return;
    }

    setIsLoading(true);
    
    try {
      const bookingData: BookingData = {
        barberId: barber.id,
        serviceIds: selectedServices.flatMap(service => 
          Array(service.quantity).fill(service.id)
        ),
        date: selectedDate,
        startTime: selectedSlot!.start_time,
        endTime: selectedSlot!.end_time,
        locationType,
        serviceAddress: locationType === 'home' ? serviceAddress.trim() : undefined,
        serviceLatitude: locationType === 'home' ? coordinates?.lat : undefined,
        serviceLongitude: locationType === 'home' ? coordinates?.lng : undefined,
        notes: notes.trim() || undefined,
        contactInfo: {
          name: contactInfo.name.trim(),
          email: contactInfo.email.trim(),
          phone: contactInfo.phone.trim(),
        },
      };

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data: AppointmentResponse = await response.json();
      
      if (data.appointment?.id) {
        toast.success('Appointment booked successfully!');
        onBookingComplete(data.appointment.id);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Booking error:', error);
      
      let errorMessage: string = ERROR_MESSAGES.UNEXPECTED_ERROR;
      
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.message.includes('timeout')) {
          errorMessage = ERROR_MESSAGES.TIMEOUT_ERROR;
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
        } else if (error.message !== ERROR_MESSAGES.UNEXPECTED_ERROR) {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [validateForm, selectedServices, selectedSlot, locationType, serviceAddress, coordinates, notes, contactInfo, barber.id, selectedDate, onBookingComplete]);

  // Memoized utility functions for better performance
  const formatCurrency = useCallback((amount: number): string => {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return '$0.00';
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }, []);

  const formatTime = useCallback((timeString: string): string => {
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      
      if (isNaN(date.getTime())) {
        return timeString; // Fallback to original string
      }
      
      return format(date, 'h:mm a');
    } catch (error) {
      console.warn('Error formatting time:', timeString, error);
      return timeString;
    }
  }, []);

  const formatDuration = useCallback((minutes: number): string => {
    if (typeof minutes !== 'number' || minutes < 0) {
      return '0 min';
    }
    
    if (minutes < 60) {
      return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }, []);

  const formatDate = useCallback((dateString: string): string => {
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) {
        return dateString;
      }
      return format(date, 'EEEE, MMMM d, yyyy');
    } catch (error) {
      console.warn('Error formatting date:', dateString, error);
      return dateString;
    }
  }, []);

  // Check if form can be submitted
  const canSubmit = useMemo(() => {
    return (
      !isLoading &&
      selectedServices.length > 0 &&
      selectedSlot !== null &&
      (locationType === 'shop' || (locationType === 'home' && isLocationValid)) &&
      contactInfo.name.trim() &&
      contactInfo.email.trim() &&
      validateEmail(contactInfo.email) &&
      (!contactInfo.phone || validatePhone(contactInfo.phone))
    );
  }, [
    isLoading,
    selectedServices.length,
    selectedSlot,
    locationType,
    isLocationValid,
    contactInfo.name,
    contactInfo.email,
    contactInfo.phone,
    validateEmail,
    validatePhone,
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-6" role="main" aria-label="Book appointment form">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" id="booking-title">
            Book Appointment
          </h1>
          <p className="text-muted-foreground" aria-describedby="booking-title">
            {barber.barber_profiles.business_name || barber.name} • {formatDate(selectedDate)}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={onBack}
          aria-label="Go back to previous page"
        >
          Back
        </Button>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Service Selection and Location */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Selection */}
            <section aria-labelledby="services-heading">
              <MultiServiceSelector
                barberId={barber.id}
                selectedServices={selectedServices}
                onServicesChange={handleServiceChange}
                maxServices={5}
                showCategories={true}
              />
              {validationErrors.services && (
                <Alert className="mt-2 border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800" id="services-error">
                    {validationErrors.services}
                  </AlertDescription>
                </Alert>
              )}
            </section>

            {/* Location Selection */}
            <section aria-labelledby="location-heading">
              <LocationSelector
                barberId={barber.id}
                selectedLocation={locationType}
                onLocationChange={setLocationType}
                serviceAddress={serviceAddress}
                onAddressChange={setServiceAddress}
                coordinates={coordinates}
                onCoordinatesChange={setCoordinates}
                totalServicePrice={calculations.basePrice}
                onTravelFeeChange={setTravelFee}
                onValidationChange={handleLocationValidation}
                disabled={isLoading}
                data-field="location"
                aria-describedby={validationErrors.location ? 'location-error' : undefined}
              />
              {validationErrors.location && (
                <Alert className="mt-2 border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800" id="location-error">
                    {validationErrors.location}
                  </AlertDescription>
                </Alert>
              )}
            </section>

            {/* Time Slot Selection */}
            {selectedServices.length > 0 && (
              <section aria-labelledby="timeslots-heading">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2" id="timeslots-heading">
                      <Clock className="h-5 w-5" aria-hidden="true" />
                      Available Times
                    </CardTitle>
                    <CardDescription>
                      Select your preferred appointment time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingSlots ? (
                      <div className="text-center py-8" role="status" aria-live="polite">
                        <Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" aria-hidden="true" />
                        <p className="mt-2 text-muted-foreground">Loading available times...</p>
                      </div>
                    ) : availableSlots.length > 0 ? (
                      <div 
                        className="grid grid-cols-2 md:grid-cols-3 gap-3"
                        role="radiogroup"
                        aria-labelledby="timeslots-heading"
                        data-field="timeSlot"
                      >
                        {availableSlots.map((slot, index) => (
                          <Button
                            key={`${slot.start_time}-${index}`}
                            type="button"
                            variant={selectedSlot === slot ? 'default' : 'outline'}
                            className="h-auto p-3 flex flex-col items-center"
                            onClick={() => handleTimeSlotSelect(slot)}
                            disabled={!slot.is_available || isLoading}
                            role="radio"
                            aria-checked={selectedSlot === slot}
                            aria-label={`${formatTime(slot.start_time)} to ${formatTime(slot.end_time)}, duration ${formatDuration(calculations.totalDuration)}${locationType === 'home' && slot.travel_time_before ? `, plus ${slot.travel_time_before} minutes travel time` : ''}`}
                          >
                            <div className="font-medium">
                              {formatTime(slot.start_time)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDuration(calculations.totalDuration)}
                            </div>
                            {locationType === 'home' && slot.travel_time_before && (
                              <div className="text-xs text-blue-600">
                                +{slot.travel_time_before}m travel
                              </div>
                            )}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8" role="status">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
                        <p className="text-muted-foreground">
                          {locationType === 'home' && !isLocationValid
                            ? 'Please provide a valid address to see available times'
                            : 'No available time slots for the selected services and date'}
                        </p>
                      </div>
                    )}
                    {validationErrors.timeSlot && (
                      <Alert className="mt-4 border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800" id="timeslot-error">
                          {validationErrors.timeSlot}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </section>
            )}

            {/* Contact Information */}
            <section aria-labelledby="contact-heading">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" id="contact-heading">
                    <User className="h-5 w-5" aria-hidden="true" />
                    Contact Information
                  </CardTitle>
                  <CardDescription>
                    We'll use this information to confirm your appointment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={contactInfo.name}
                        onChange={(e) => handleContactInfoChange('name', e.target.value)}
                        disabled={isLoading}
                        required
                        aria-describedby={validationErrors.name ? 'name-error' : undefined}
                        aria-invalid={!!validationErrors.name}
                        data-field="name"
                      />
                      {validationErrors.name && (
                        <Alert className="border-red-200 bg-red-50">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-800" id="name-error">
                            {validationErrors.name}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={contactInfo.email}
                        onChange={(e) => handleContactInfoChange('email', e.target.value)}
                        disabled={isLoading}
                        required
                        aria-describedby={validationErrors.email ? 'email-error' : undefined}
                        aria-invalid={!!validationErrors.email}
                        data-field="email"
                      />
                      {validationErrors.email && (
                        <Alert className="border-red-200 bg-red-50">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-800" id="email-error">
                            {validationErrors.email}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={contactInfo.phone}
                      onChange={(e) => handleContactInfoChange('phone', e.target.value)}
                      disabled={isLoading}
                      aria-describedby={validationErrors.phone ? 'phone-error' : 'phone-help'}
                      aria-invalid={!!validationErrors.phone}
                      data-field="phone"
                    />
                    {validationErrors.phone ? (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800" id="phone-error">
                          {validationErrors.phone}
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <p id="phone-help" className="text-sm text-muted-foreground">
                        Optional: We'll use this to send appointment reminders
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Special Requests or Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any special requests, allergies, or preferences..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      disabled={isLoading}
                      rows={3}
                      aria-describedby="notes-help"
                    />
                    <p id="notes-help" className="text-sm text-muted-foreground">
                      Optional: Share any specific preferences or requirements for your appointment
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>

          {/* Right Column - Booking Summary */}
          <div className="space-y-6">
            <aside aria-labelledby="summary-heading">
              {/* Barber Information */}
              <Card>
                <CardHeader>
                  <CardTitle id="barber-info-heading">Your Barber</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3">
                    {barber.avatar_url && (
                      <img
                        src={barber.avatar_url}
                        alt={barber.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <div className="font-medium">{barber.barber_profiles.business_name || barber.name}</div>
                      {barber.barber_profiles.rating && (
                        <div className="text-sm text-muted-foreground">
                          ⭐ {barber.barber_profiles.rating.toFixed(1)} ({barber.barber_profiles.total_reviews} reviews)
                        </div>
                      )}
                      {barber.barber_profiles.phone && (
                        <div className="text-sm text-muted-foreground">{barber.barber_profiles.phone}</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Booking Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" id="summary-heading">
                    <CreditCard className="h-5 w-5" aria-hidden="true" />
                    Booking Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Selected Services */}
                  {selectedServices.length > 0 && (
                    <section aria-labelledby="selected-services-heading">
                      <h4 className="font-medium" id="selected-services-heading">
                        Services
                      </h4>
                      <div className="space-y-2 mt-2" role="list">
                        {selectedServices.map((service) => (
                          <div key={service.id} className="flex justify-between text-sm" role="listitem">
                            <span>
                              {service.name}
                              {service.quantity > 1 && ` × ${service.quantity}`}
                            </span>
                            <span>{formatCurrency(service.price * service.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                {/* Location and Travel */}
                <section aria-labelledby="location-summary-heading">
                  <h4 className="font-medium" id="location-summary-heading">Location</h4>
                  <div className="flex items-center gap-2 text-sm mt-2">
                    {locationType === 'shop' ? (
                      <><MapPin className="h-4 w-4" /> In Salon</>
                    ) : (
                      <><MapPin className="h-4 w-4" /> Home Visit</>
                    )}
                  </div>
                  {locationType === 'home' && serviceAddress && (
                    <div className="text-sm text-muted-foreground mt-1">{serviceAddress}</div>
                  )}
                  {travelFee > 0 && (
                    <div className="flex justify-between text-sm mt-2">
                      <span>Travel Fee</span>
                      <span>{formatCurrency(travelFee)}</span>
                    </div>
                  )}
                </section>

                {/* Date and Time */}
                {selectedSlot && (
                  <section aria-labelledby="datetime-summary-heading">
                    <h4 className="font-medium" id="datetime-summary-heading">Date & Time</h4>
                    <div className="text-sm mt-2">
                      <div>{formatDate(selectedDate)}</div>
                      <div>{formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)}</div>
                      <div className="text-muted-foreground">Duration: {formatDuration(calculations.totalDuration)}</div>
                    </div>
                  </section>
                )}

                <Separator />

                {/* Pricing */}
                <section aria-labelledby="pricing-summary-heading">
                  <h4 className="font-medium mb-3" id="pricing-summary-heading">Pricing</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatCurrency(calculations.basePrice)}</span>
                    </div>
                    {travelFee > 0 && (
                      <div className="flex justify-between">
                        <span>Travel Fee</span>
                        <span>{formatCurrency(travelFee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium text-lg pt-2 border-t">
                      <span>Total</span>
                      <span>{formatCurrency(calculations.totalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Deposit Required</span>
                      <span>{formatCurrency(calculations.depositAmount)}</span>
                    </div>
                  </div>
                </section>
              </CardContent>
            </Card>
            </aside>

            {/* Error Display */}
            {error && (
              <Alert className="border-red-200 bg-red-50" role="alert" aria-live="polite">
                <AlertCircle className="h-4 w-4 text-red-600" aria-hidden="true" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {/* Location Error */}
            {locationError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{locationError}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={!canSubmit}
              aria-describedby="submit-help"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" aria-hidden="true" />
                  Creating Appointment...
                </>
              ) : (
                `Book Appointment • ${formatCurrency(calculations.depositAmount)} Deposit`
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center" id="submit-help">
              You'll pay a {formatCurrency(calculations.depositAmount)} deposit now and the remaining {formatCurrency(calculations.remainingBalance)} at your appointment.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}