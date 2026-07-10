'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Star, 
  MapPin, 
  Phone, 
  Globe, 
  Instagram, 
  Clock, 
  Calendar,
  Heart,
  Share2,
  ArrowLeft,
  CheckCircle,
  Smartphone,
  Building2,
  Languages,
  Award,
  Users,
  Clock as ClockIcon
} from 'lucide-react';

interface BarberProfile {
  id: string;
  name: string;
  business_name: string;
  avatar_url?: string;
  rating: number;
  total_reviews: number;
  price_range: string;
  specialties: string[];
  location: {
    city: string;
    state: string;
    distance_km?: number;
  };
  contact: {
    phone?: string;
    website?: string;
    instagram?: string;
  };
  languages: string[];
  is_mobile: boolean;
  service_radius_km?: number;
  services: Array<{
    id: string;
    name: string;
    category: string;
    price: number;
    duration: number;
  }>;
  featured_photo?: string;
  available_slots: string[];
  is_favorited: boolean;
  description?: string;
  working_hours?: {
    [key: string]: { open: string | null; close: string | null };
  };
  gallery?: string[];
  reviews?: Array<{
    id: string;
    user_name: string;
    rating: number;
    comment: string;
    date: string;
  }>;
}

const PRICE_RANGE_LABELS: Record<string, string> = {
  '$': 'Budget',
  '$$': 'Moderate',
  '$$$': 'Premium',
  '$$$$': 'Luxury'
};

const LANGUAGE_LABELS: Record<string, string> = {
  'en': 'English',
  'ar': 'Arabic',
  'fr': 'French',
  'es': 'Spanish',
  'de': 'German'
};

export default function BarberProfilePage() {
  const params = useParams();
  const router = useRouter();
  const barberId = params.barberId as string;
  
  const [barber, setBarber] = useState<BarberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const fetchBarberProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/barbers/${barberId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch barber profile');
        }

        setBarber(data.data);
        setIsFavorited(data.data.is_favorited);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (barberId) {
      fetchBarberProfile();
    }
  }, [barberId]);

  const handleFavoriteToggle = async () => {
    // In a real app, this would make an API call to toggle favorite status
    setIsFavorited(!isFavorited);
  };

  const handleBookAppointment = () => {
    console.log('Book appointment button clicked for barber:', barberId);
    router.push(`/booking?barberId=${barberId}`);
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return '';
    if (distance < 1) return `${Math.round(distance * 1000)}m`;
    return `${distance.toFixed(1)}km`;
  };

  const getWorkingHoursDisplay = (hours: any) => {
    if (!hours) return 'Contact for hours';
    
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const todayHours = hours[today];
    
    if (!todayHours || !todayHours.open) return 'Closed today';
    return `${todayHours.open} - ${todayHours.close}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Loading barber profile...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !barber) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground mb-4">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Barber Not Found</h3>
                <p className="mb-6">{error || 'The requested barber profile could not be found.'}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => router.back()} variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
                <Button onClick={() => router.push('/search')}>
                  Find Other Barbers
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Search
        </Button>

        {/* Barber Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Avatar and Basic Info */}
              <div className="flex items-start gap-4">
                <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                  <AvatarImage 
                    src={barber.avatar_url || barber.featured_photo}
                    alt={barber.name}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
                    {barber.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-bold text-foreground mb-1">
                        {barber.name}
                      </h1>
                      {barber.business_name && barber.business_name !== barber.name && (
                        <p className="text-lg text-muted-foreground mb-2">
                          {barber.business_name}
                        </p>
                      )}
                      
                      {/* Rating and Reviews */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-1">
                          <Star className="h-5 w-5 text-yellow-400 fill-current" />
                          <span className="font-semibold">{barber.rating.toFixed(1)}</span>
                          <span className="text-muted-foreground">({barber.total_reviews} reviews)</span>
                        </div>
                        
                        <Badge variant="secondary">
                          {PRICE_RANGE_LABELS[barber.price_range] || barber.price_range}
                        </Badge>
                        
                        {barber.is_mobile && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Smartphone className="h-3 w-3" />
                            Mobile
                          </Badge>
                        )}
                      </div>
                      
                      {/* Location */}
                      <div className="flex items-center gap-2 text-muted-foreground mb-3">
                        <MapPin className="h-4 w-4" />
                        <span>{barber.location.city}, {barber.location.state}</span>
                        {barber.location.distance_km && (
                          <>
                            <span>•</span>
                            <span className="text-primary font-medium">
                              {formatDistance(barber.location.distance_km)}
                            </span>
                          </>
                        )}
                      </div>
                      
                      {/* Specialties */}
                      <div className="flex flex-wrap gap-2">
                        {barber.specialties.map((specialty, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                      <Button onClick={handleFavoriteToggle} variant="outline" size="sm">
                        <Heart className={`h-4 w-4 mr-2 ${isFavorited ? 'fill-current text-red-500' : ''}`} />
                        {isFavorited ? 'Favorited' : 'Favorite'}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="gallery">Gallery</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6">
                {/* Description */}
                {barber.description && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">About</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{barber.description}</p>
                    </CardContent>
                  </Card>
                )}
                
                {/* Languages */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Languages className="h-5 w-5" />
                      Languages Spoken
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {barber.languages.map((lang) => (
                        <Badge key={lang} variant="secondary">
                          {LANGUAGE_LABELS[lang] || lang}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="services" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Services & Pricing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {barber.services.map((service) => (
                        <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h4 className="font-semibold">{service.name}</h4>
                            <p className="text-sm text-muted-foreground capitalize">{service.category}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{service.price} MAD</p>
                            <p className="text-sm text-muted-foreground">{service.duration} min</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="reviews" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Customer Reviews</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {barber.reviews && barber.reviews.length > 0 ? (
                      <div className="space-y-4">
                        {barber.reviews.map((review) => (
                          <div key={review.id} className="border-b pb-4 last:border-b-0">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{review.user_name}</span>
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: 5 }, (_, i) => (
                                    <Star 
                                      key={i} 
                                      className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                                    />
                                  ))}
                                </div>
                              </div>
                              <span className="text-sm text-muted-foreground">{review.date}</span>
                            </div>
                            <p className="text-muted-foreground">{review.comment}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">No reviews yet</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="gallery" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Gallery</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {barber.gallery && barber.gallery.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {barber.gallery.map((image, index) => (
                          <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                            <img 
                              src={image} 
                              alt={`Gallery image ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">No gallery images available</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Book Appointment */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Book Appointment</h3>
                <Button onClick={handleBookAppointment} className="w-full mb-4">
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Now
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  Available slots: {barber.available_slots.length}
                </p>
              </CardContent>
            </Card>
            
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {barber.contact.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${barber.contact.phone}`} className="text-sm hover:text-primary">
                      {barber.contact.phone}
                    </a>
                  </div>
                )}
                
                {barber.contact.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={barber.contact.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm hover:text-primary"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
                
                {barber.contact.instagram && (
                  <div className="flex items-center gap-3">
                    <Instagram className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={`https://instagram.com/${barber.contact.instagram.replace('@', '')}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm hover:text-primary"
                    >
                      {barber.contact.instagram}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Working Hours */}
            {barber.working_hours && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ClockIcon className="h-5 w-5" />
                    Working Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Today</span>
                      <span className="text-sm font-medium">
                        {getWorkingHoursDisplay(barber.working_hours)}
                      </span>
                    </div>
                    <Separator />
                    {Object.entries(barber.working_hours).map(([day, hours]) => (
                      <div key={day} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{day}</span>
                        <span className="text-sm text-muted-foreground">
                          {hours.open ? `${hours.open} - ${hours.close}` : 'Closed'}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Service Area */}
            {barber.is_mobile && barber.service_radius_km && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Service Area
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Mobile service within {barber.service_radius_km}km of {barber.location.city}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 