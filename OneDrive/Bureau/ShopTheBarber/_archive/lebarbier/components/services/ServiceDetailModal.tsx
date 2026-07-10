'use client';

import React from 'react';
const { useState, useEffect } = React;
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  X, 
  Star, 
  Clock, 
  Star as Dollar, 
  MapPin, 
  Heart, 
  User, 
  CheckCircle, 
  Star as Play, 
  ArrowLeft, 
  ArrowRight,
  Calendar,
  Phone,
  MessageSquare,
  Share2,
  AlertCircle,
  ThumbsUp
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';

interface ServiceDetails {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  image_url: string | null;
  video_url: string | null;
  gallery_urls: string[] | null;
  rating: number;
  review_count: number;
  booking_enabled: boolean;
  max_advance_booking_days: number;
  cancellation_policy: string | null;
  preparation_time: number;
  cleanup_time: number;
  barber_id: string;
  barber_name: string;
  business_name: string | null;
  barber_avatar_url: string | null;
  barber_phone: string | null;
  barber_address: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  addons: ServiceAddon[];
  reviews: ServiceReview[];
  availability: ServiceAvailability[];
  related_services: RelatedService[];
  is_favorited?: boolean;
}

interface ServiceAddon {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  is_required: boolean;
  display_order: number;
}

interface ServiceReview {
  id: string;
  client_name: string;
  client_avatar_url: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  quality_rating: number | null;
  value_rating: number | null;
  would_recommend: boolean;
  is_verified: boolean;
  helpful_count: number;
  created_at: string;
}

interface ServiceAvailability {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface RelatedService {
  id: string;
  name: string;
  price: number;
  duration: number;
  image_url: string | null;
  rating: number;
}

interface ServiceDetailModalProps {
  serviceId: string;
  open: boolean;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  haircut: 'Haircut',
  beard_trim: 'Beard Trim',
  shave: 'Shave',
  styling: 'Styling',
  coloring: 'Coloring',
  treatment: 'Treatment',
  consultation: 'Consultation',
  package: 'Package',
  other: 'Other'
};

const CATEGORY_COLORS: Record<string, string> = {
  haircut: 'bg-blue-100 text-blue-800',
  beard_trim: 'bg-green-100 text-green-800',
  shave: 'bg-yellow-100 text-yellow-800',
  styling: 'bg-purple-100 text-purple-800',
  coloring: 'bg-red-100 text-red-800',
  treatment: 'bg-cyan-100 text-cyan-800',
  consultation: 'bg-lime-100 text-lime-800',
  package: 'bg-orange-100 text-orange-800',
  other: 'bg-gray-100 text-gray-800'
};

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function ServiceDetailModal({ serviceId, open, onClose }: ServiceDetailModalProps) {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [service, setService] = useState<ServiceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // Fetch service details
  useEffect(() => {
    if (!open || !serviceId) return;

    const fetchServiceDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/services/${serviceId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch service details');
        }
        
        const data: ServiceDetails = await response.json();
        setService(data);
        
        // Set required addons as selected by default
        const requiredAddons = data.addons.filter(addon => addon.is_required).map(addon => addon.id);
        setSelectedAddons(requiredAddons);
      } catch (error) {
        console.error('Error fetching service details:', error);
        toast.error('Failed to load service details');
        onClose();
      } finally {
        setLoading(false);
      }
    };

    fetchServiceDetails();
  }, [serviceId, open, onClose]);

  const handleFavoriteToggle = async () => {
    if (!isSignedIn) {
      toast.error('Please sign in to save favorites');
      return;
    }

    if (!service) return;

    setFavoriteLoading(true);
    try {
      const response = await fetch('/api/favorites/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: service.id,
          type: 'service'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle favorite');
      }

      const data = await response.json();
      setService(prev => prev ? { ...prev, is_favorited: data.is_favorited } : null);
      toast.success(data.is_favorited ? 'Added to favorites' : 'Removed from favorites');
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleBookNow = () => {
    if (!service) return;
    
    // Calculate total price with selected addons
    const addonPrice = service.addons
      .filter(addon => selectedAddons.includes(addon.id))
      .reduce((total, addon) => total + addon.price, 0);
    
    const totalPrice = service.price + addonPrice;
    
    // Calculate total duration with selected addons
    const addonDuration = service.addons
      .filter(addon => selectedAddons.includes(addon.id))
      .reduce((total, addon) => total + addon.duration, 0);
    
    const totalDuration = service.duration + addonDuration;
    
    // Navigate to booking page with pre-filled data
    const bookingData = {
      service_id: service.id,
      service_name: service.name,
      barber_id: service.barber_id,
      barber_name: service.barber_name,
      price: totalPrice,
      duration: totalDuration,
      addons: selectedAddons
    };
    
    // Store booking data in sessionStorage for the booking form
    sessionStorage.setItem('booking_data', JSON.stringify(bookingData));
    
    // Navigate to booking page
    router.push('/booking');
    onClose();
  };

  const handleAddonToggle = (addonId: string, isRequired: boolean) => {
    if (isRequired) return; // Can't toggle required addons
    
    setSelectedAddons(prev => 
      prev.includes(addonId)
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    );
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatTime = (time: string) => {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getImageGallery = () => {
    const images: string[] = [];
    if (service?.image_url) images.push(service.image_url);
    if (service?.gallery_urls) images.push(...service.gallery_urls);
    return images;
  };

  const calculateTotalPrice = () => {
    if (!service) return 0;
    const addonPrice = service.addons
      .filter(addon => selectedAddons.includes(addon.id))
      .reduce((total, addon) => total + addon.price, 0);
    return service.price + addonPrice;
  };

  const calculateTotalDuration = () => {
    if (!service) return 0;
    const addonDuration = service.addons
      .filter(addon => selectedAddons.includes(addon.id))
      .reduce((total, addon) => total + addon.duration, 0);
    return service.duration + addonDuration;
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : !service ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Service not found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <DialogHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <DialogTitle className="text-2xl mb-2">{service.name}</DialogTitle>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={CATEGORY_COLORS[service.category] || CATEGORY_COLORS.other}>
                      {CATEGORY_LABELS[service.category] || service.category}
                    </Badge>
                    {service.rating > 0 && (
                      <div className="flex items-center gap-2">
                        {renderStars(service.rating)}
                        <span className="text-sm text-muted-foreground">
                          {service.rating.toFixed(1)} ({service.review_count} reviews)
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-lg">
                    <div className="flex items-center gap-1 font-semibold text-primary">
                      <Dollar className="h-5 w-5" />
                      {formatPrice(calculateTotalPrice())}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {formatDuration(calculateTotalDuration())}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFavoriteToggle}
                    disabled={favoriteLoading}
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        service.is_favorited ? 'fill-red-500 text-red-500' : 'text-gray-400'
                      }`}
                    />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            {/* Image Gallery */}
            {getImageGallery().length > 0 && (
              <div className="relative">
                <div className="relative h-64 rounded-lg overflow-hidden">
                  <Image
                    src={getImageGallery()[currentImageIndex]}
                    alt={service.name}
                    fill
                    className="object-cover"
                  />
                  {service.video_url && currentImageIndex === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                      <Button size="lg" className="rounded-full">
                        <Play className="h-6 w-6 mr-2" />
Play Video
                      </Button>
                    </div>
                  )}
                </div>
                
                {getImageGallery().length > 1 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute left-2 top-1/2 transform -translate-y-1/2"
                      onClick={() => setCurrentImageIndex(prev => 
                        prev === 0 ? getImageGallery().length - 1 : prev - 1
                      )}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      onClick={() => setCurrentImageIndex(prev => 
                        prev === getImageGallery().length - 1 ? 0 : prev + 1
                      )}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex justify-center gap-2 mt-2">
                      {getImageGallery().map((_, index) => (
                        <button
                          key={index}
                          className={`w-2 h-2 rounded-full ${
                            index === currentImageIndex ? 'bg-primary' : 'bg-gray-300'
                          }`}
                          onClick={() => setCurrentImageIndex(index)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="addons">Add-ons</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="barber">Barber</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Service Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {service.description || 'No description available.'}
                    </p>
                  </CardContent>
                </Card>
                
                {service.cancellation_policy && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Cancellation Policy</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {service.cancellation_policy}
                      </p>
                    </CardContent>
                  </Card>
                )}
                
                {service.availability.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Availability</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {service.availability.map((avail, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="font-medium">
                              {DAYS_OF_WEEK[avail.day_of_week]}
                            </span>
                            <span className={avail.is_available ? 'text-green-600' : 'text-red-600'}>
                              {avail.is_available 
                                ? `${formatTime(avail.start_time)} - ${formatTime(avail.end_time)}`
                                : 'Closed'
                              }
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="addons" className="space-y-4">
                {service.addons.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-muted-foreground">No add-ons available for this service.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {service.addons.map(addon => (
                      <Card key={addon.id} className="cursor-pointer" onClick={() => handleAddonToggle(addon.id, addon.is_required)}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">{addon.name}</h4>
                                {addon.is_required && (
                                  <Badge variant="secondary">Required</Badge>
                                )}
                              </div>
                              {addon.description && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  {addon.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-sm">
                                <span className="font-medium">{formatPrice(addon.price)}</span>
                                {addon.duration > 0 && (
                                  <span className="text-muted-foreground">
                                    +{formatDuration(addon.duration)}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedAddons.includes(addon.id)}
                                disabled={addon.is_required}
                                onChange={() => handleAddonToggle(addon.id, addon.is_required)}
                                className="h-4 w-4 text-primary"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="reviews" className="space-y-4">
                {service.reviews.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-muted-foreground">No reviews yet for this service.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {service.reviews.map(review => (
                      <Card key={review.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar>
                              <AvatarImage src={review.client_avatar_url || ''} />
                              <AvatarFallback>
                                {review.client_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h4 className="font-medium">{review.client_name}</h4>
                                  <div className="flex items-center gap-2">
                                    {renderStars(review.rating)}
                                    {review.is_verified && (
                                      <Badge variant="secondary" className="text-xs">
                                        Verified
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(review.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              
                              {review.title && (
                                <h5 className="font-medium mb-1">{review.title}</h5>
                              )}
                              
                              {review.comment && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  {review.comment}
                                </p>
                              )}
                              
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                {review.would_recommend && (
                                  <span className="text-green-600">Recommends</span>
                                )}
                                <button className="flex items-center gap-1 hover:text-primary">
                                  <ThumbsUp className="h-3 w-3" />
                                  {review.helpful_count}
                                </button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="barber" className="space-y-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={service.barber_avatar_url || ''} />
                        <AvatarFallback className="text-lg">
                          {service.barber_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold">{service.barber_name}</h3>
                          {service.is_verified && (
                            <CheckCircle className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                        
                        {service.business_name && (
                          <p className="text-muted-foreground mb-2">{service.business_name}</p>
                        )}
                        
                        <div className="space-y-2">
                          {service.barber_phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4" />
                              <span>{service.barber_phone}</span>
                            </div>
                          )}
                          
                          {service.barber_address && (
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4" />
                              <span>{service.barber_address}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2 mt-4">
                          <Button variant="outline" size="sm">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Message
                          </Button>
                          <Button variant="outline" size="sm">
                            View Profile
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {service.related_services.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Other Services</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {service.related_services.map(relatedService => (
                          <div key={relatedService.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted">
                              {relatedService.image_url ? (
                                <Image
                                  src={relatedService.image_url}
                                  alt={relatedService.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <User className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{relatedService.name}</h4>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{formatPrice(relatedService.price)}</span>
                                <span>•</span>
                                <span>{formatDuration(relatedService.duration)}</span>
                                {relatedService.rating > 0 && (
                                  <>
                                    <span>•</span>
                                    <div className="flex items-center gap-1">
                                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                      <span>{relatedService.rating.toFixed(1)}</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Total: <span className="font-semibold text-lg text-primary">
                  {formatPrice(calculateTotalPrice())}
                </span>
                {selectedAddons.length > 0 && (
                  <span className="ml-2">({formatDuration(calculateTotalDuration())})</span>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button 
                  onClick={handleBookNow}
                  disabled={!service.booking_enabled}
                  size="lg"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {service.booking_enabled ? 'Book Now' : 'Unavailable'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}