'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Calendar, Clock, MapPin, User, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function BookingRoutePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const barberId = searchParams.get('barberId');
  
  // State management for booking
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  // If no barberId is provided, show an error message
  if (!barberId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Header */}
        <header className="bg-white border-b border-border">
          <div className="container mx-auto py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">S</span>
                </div>
                <span className="text-xl font-bold gradient-text">ShopTheBarber</span>
              </div>
              
              <nav className="flex items-center space-x-6">
                <Link href="/search" className="text-foreground/80 hover:text-foreground transition-colors">
                  Find Barbers
                </Link>
                <Link href="/services" className="text-foreground/80 hover:text-foreground transition-colors">
                  Services
                </Link>
                <Link href="/dashboard" className="text-foreground/80 hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              </nav>
            </div>
          </div>
        </header>

        <div className="container mx-auto py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground mb-4">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Booking Error</h3>
                <p className="mb-6">No barber selected for booking. Please select a barber first.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild variant="outline">
                  <Link href="/search">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Find Barbers
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/services">
                    Browse Services
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Mock barber data for demonstration
  const mockBarber = {
    id: barberId,
    name: barberId === 'barber1' ? 'John Smith' : 
          barberId === 'barber2' ? 'Ahmed Hassan' : 
          barberId === 'barber3' ? 'Mohammed Alami' : 'Barber',
    business_name: barberId === 'barber1' ? 'Smith\'s Barbershop' :
                   barberId === 'barber2' ? 'Hassan\'s Grooming' :
                   barberId === 'barber3' ? 'Alami\'s Traditional Barbershop' : 'Barbershop',
    rating: 4.8,
    total_reviews: 127,
    location: {
      city: 'Casablanca',
      state: 'Casablanca-Settat'
    }
  };

  const mockServices = [
    { id: 'service1', name: 'Classic Haircut', price: 45, duration: 30, description: 'Professional haircut with styling' },
    { id: 'service2', name: 'Beard Trim', price: 25, duration: 20, description: 'Precise beard shaping and trimming' },
    { id: 'service3', name: 'Hot Shave', price: 35, duration: 25, description: 'Traditional hot towel shave' },
    { id: 'service4', name: 'Haircut + Beard', price: 60, duration: 45, description: 'Complete grooming package' },
    { id: 'service5', name: 'Kids Haircut', price: 30, duration: 25, description: 'Specialized haircut for children' }
  ];

  // Event handlers
  const handleServiceSelect = (serviceId: string) => {
    console.log('Service selected:', serviceId);
    setSelectedService(serviceId);
  };

  const handleDateSelect = (date: Date) => {
    console.log('Date selected:', date);
    setSelectedDate(date);
  };

  const handleTimeSelect = (time: string) => {
    console.log('Time selected:', time);
    setSelectedTime(time);
  };

  const handleBookAppointment = async () => {
    if (!selectedService || !selectedDate || !selectedTime) {
      alert('Please select a service, date, and time before booking.');
      return;
    }

    console.log('Booking appointment:', {
      barberId,
      serviceId: selectedService,
      date: selectedDate,
      time: selectedTime
    });

    setIsBooking(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Success
      setIsBooking(false);
      alert('Appointment booked successfully! You will receive a confirmation email.');
      router.push('/dashboard');
    } catch (error) {
      setIsBooking(false);
      alert('Failed to book appointment. Please try again.');
      console.error('Booking error:', error);
    }
  };

  // Get selected service details
  const selectedServiceDetails = selectedService 
    ? mockServices.find(s => s.id === selectedService) 
    : null;

  // Calculate total price
  const totalPrice = selectedServiceDetails?.price || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-border">
        <div className="container mx-auto py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold gradient-text">ShopTheBarber</span>
            </div>
            
            <nav className="flex items-center space-x-6">
              <Link href="/search" className="text-foreground/80 hover:text-foreground transition-colors">
                Find Barbers
              </Link>
              <Link href="/services" className="text-foreground/80 hover:text-foreground transition-colors">
                Services
              </Link>
              <Link href="/dashboard" className="text-foreground/80 hover:text-foreground transition-colors">
                Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-8">
        {/* Back Button */}
        <Button asChild variant="ghost" className="mb-6">
          <Link href={`/barbers/${barberId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Barber Profile
          </Link>
        </Button>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Barber Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Barber Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold">{mockBarber.name}</h3>
                      <p className="text-muted-foreground">{mockBarber.business_name}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-400">★</span>
                          <span className="font-medium">{mockBarber.rating}</span>
                          <span className="text-muted-foreground">({mockBarber.total_reviews} reviews)</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{mockBarber.location.city}, {mockBarber.location.state}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Services */}
              <Card>
                <CardHeader>
                  <CardTitle>Available Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockServices.map((service) => (
                      <div 
                        key={service.id} 
                        className={`p-4 border rounded-lg transition-all duration-200 cursor-pointer hover:shadow-md ${
                          selectedService === service.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => handleServiceSelect(service.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-lg">{service.name}</h4>
                              {selectedService === service.id && (
                                <Badge variant="default" className="text-xs">
                                  Selected
                                </Badge>
                              )}
                            </div>
                            <p className="text-muted-foreground text-sm mb-2">
                              {service.description}
                            </p>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span className="text-sm">{service.duration} min</span>
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <span className="text-sm">•</span>
                                <span className="text-sm font-medium text-primary">
                                  {service.price} MAD
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant={selectedService === service.id ? "default" : "outline"}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleServiceSelect(service.id);
                            }}
                          >
                            {selectedService === service.id ? "Selected" : "Select"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Booking Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Schedule Appointment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Select Date</label>
                      <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: 7 }, (_, i) => {
                          const date = new Date();
                          date.setDate(date.getDate() + i);
                          const isSelected = selectedDate && 
                            selectedDate.getDate() === date.getDate() && 
                            selectedDate.getMonth() === date.getMonth() && 
                            selectedDate.getFullYear() === date.getFullYear();
                          
                          return (
                            <Button
                              key={i}
                              variant={isSelected ? "default" : "outline"}
                              className="h-12 flex flex-col items-center justify-center text-xs"
                              onClick={() => handleDateSelect(date)}
                            >
                              <span className="font-medium">{date.getDate()}</span>
                              <span className="text-muted-foreground">
                                {date.toLocaleDateString('en-US', { weekday: 'short' })}
                              </span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Select Time</label>
                      <div className="grid grid-cols-4 gap-2">
                        {['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'].map((time) => (
                          <Button 
                            key={time} 
                            variant={selectedTime === time ? "default" : "outline"} 
                            className="h-10"
                            onClick={() => handleTimeSelect(time)}
                          >
                            {time}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Progress Indicator */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Booking Progress</span>
                        <span className="text-sm text-muted-foreground">
                          {[selectedService, selectedDate, selectedTime].filter(Boolean).length}/3
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${([selectedService, selectedDate, selectedTime].filter(Boolean).length / 3) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span className={selectedService ? 'text-primary font-medium' : ''}>Service</span>
                        <span className={selectedDate ? 'text-primary font-medium' : ''}>Date</span>
                        <span className={selectedTime ? 'text-primary font-medium' : ''}>Time</span>
                      </div>
                    </div>

                    <div className="text-center">
                      <Button 
                        size="lg" 
                        className="w-full max-w-md"
                        onClick={handleBookAppointment}
                        disabled={isBooking || !selectedService || !selectedDate || !selectedTime}
                      >
                        {isBooking ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing Booking...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Book Appointment
                          </>
                        )}
                      </Button>
                      <p className="text-sm text-muted-foreground mt-2">
                        {!selectedService || !selectedDate || !selectedTime 
                          ? 'Please select a service, date, and time to continue'
                          : 'You\'ll receive a confirmation email once booked'
                        }
                      </p>
                      {selectedService && selectedDate && selectedTime && (
                        <p className="text-xs text-green-600 mt-1 font-medium">
                          ✓ All selections complete - Ready to book!
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Booking Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <span className="text-muted-foreground">Service</span>
                      <div className="text-right">
                        <span className="font-medium">
                          {selectedServiceDetails?.name || 'Not selected'}
                        </span>
                        {selectedServiceDetails?.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {selectedServiceDetails.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-medium">
                        {selectedServiceDetails?.duration ? `${selectedServiceDetails.duration} min` : 'Not selected'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date</span>
                      <span className="font-medium">
                        {selectedDate 
                          ? selectedDate.toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })
                          : 'Not selected'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Time</span>
                      <span className="font-medium">
                        {selectedTime || 'Not selected'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Barber</span>
                      <span className="font-medium">
                        {mockBarber.name}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span className="text-primary">
                        {totalPrice} MAD
                      </span>
                    </div>
                    {selectedService && selectedDate && selectedTime && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Ready to book!</span>
                        </div>
                        <p className="text-xs text-green-600 mt-1">
                          All selections complete. Click "Book Appointment" to confirm.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Important Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Important Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Please arrive 5 minutes before your appointment</li>
                    <li>• Cancellations must be made 24 hours in advance</li>
                    <li>• Bring any reference photos for your desired style</li>
                    <li>• Payment is due at the time of service</li>
                    <li>• Late arrivals may result in appointment cancellation</li>
                    <li>• No-shows will be charged 50% of service price</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Cancellation Policy */}
              <Card>
                <CardHeader>
                  <CardTitle>Cancellation Policy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">24+ hours notice</span>
                      <span className="font-medium text-green-600">Free cancellation</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">2-24 hours notice</span>
                      <span className="font-medium text-yellow-600">25% charge</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Less than 2 hours</span>
                      <span className="font-medium text-red-600">50% charge</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">No-show</span>
                      <span className="font-medium text-red-600">100% charge</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 