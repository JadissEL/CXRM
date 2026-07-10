'use client';

import React from 'react';
const { useState } = React;
import Link from 'next/link';
import { Heart, MapPin, Star, Clock, Phone, Star as Globe, Star as Instagram, MessageSquare, Calendar, CheckCircle, Star as Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BarberCardProps {
  barber: {
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
  };
  onFavoriteToggle: (barberId: string, isFavorited: boolean) => void;
  showDistance?: boolean;
  className?: string;
}

const PRICE_RANGE_LABELS: Record<string, string> = {
  '$': 'Budget-friendly',
  '$$': 'Moderate',
  '$$$': 'Premium',
  '$$$$': 'Luxury'
};

const CATEGORY_ICONS: Record<string, string> = {
  'haircut': '✂️',
  'beard_trim': '🧔',
  'shave': '🪒',
  'styling': '💇',
  'coloring': '🎨',
  'treatment': '💆',
  'consultation': '💬',
  'package': '📦'
};

export default function BarberCard({ 
  barber, 
  onFavoriteToggle, 
  showDistance = false,
  className 
}: BarberCardProps) {
  const [imageError, setImageError] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setFavoriteLoading(true);
    try {
      await onFavoriteToggle(barber.id, barber.is_favorited);
    } catch (error) {
      toast.error('Failed to update favorite');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleContactClick = (type: 'phone' | 'website' | 'instagram', value: string) => {
    switch (type) {
      case 'phone':
        window.open(`tel:${value}`);
        break;
      case 'website':
        window.open(value, '_blank', 'noopener,noreferrer');
        break;
      case 'instagram':
        window.open(`https://instagram.com/${value.replace('@', '')}`, '_blank', 'noopener,noreferrer');
        break;
    }
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return null;
    return distance < 1 
      ? `${Math.round(distance * 1000)}m away`
      : `${distance.toFixed(1)}km away`;
  };

  const getTopServices = () => {
    return barber.services
      .sort((a, b) => a.price - b.price)
      .slice(0, 3);
  };

  const getAvailabilityStatus = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);
    
    const todaySlots = barber.available_slots.filter(slot => 
      slot.startsWith(today) && slot.split('T')[1] > currentTime
    );
    
    if (todaySlots.length > 0) {
      return {
        status: 'available',
        message: `${todaySlots.length} slots today`,
        color: 'text-green-600'
      };
    }
    
    const tomorrowSlots = barber.available_slots.filter(slot => {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return slot.startsWith(tomorrow.toISOString().split('T')[0]);
    });
    
    if (tomorrowSlots.length > 0) {
      return {
        status: 'tomorrow',
        message: 'Available tomorrow',
        color: 'text-blue-600'
      };
    }
    
    return {
      status: 'limited',
      message: 'Limited availability',
      color: 'text-orange-600'
    };
  };

  const availability = getAvailabilityStatus();
  const topServices = getTopServices();
  const displayName = barber.business_name || barber.name;

  return (
    <Card 
      id={`barber-${barber.id}`}
      className={cn(
        "group hover:shadow-lg transition-all duration-200 cursor-pointer border-border/50 hover:border-border",
        className
      )}
    >
      <Link href={`/barbers/${barber.id}`} className="block">
        <CardHeader className="pb-4">
          <div className="flex items-start gap-4">
            {/* Avatar and Featured Photo */}
            <div className="relative flex-shrink-0">
              <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
                <AvatarImage 
                  src={!imageError ? (barber.avatar_url || barber.featured_photo) : undefined}
                  alt={displayName}
                  onError={() => setImageError(true)}
                />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {/* Verified Badge */}
              <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1">
                <CheckCircle className="h-4 w-4 text-blue-500 fill-current" />
              </div>
            </div>
            
            {/* Main Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-lg leading-tight truncate group-hover:text-primary transition-colors">
                    {displayName}
                  </h3>
                  {barber.business_name && barber.business_name !== barber.name && (
                    <p className="text-sm text-muted-foreground truncate">
                      {barber.name}
                    </p>
                  )}
                </div>
                
                {/* Favorite Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFavoriteClick}
                  disabled={favoriteLoading}
                  className={cn(
                    "h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600",
                    barber.is_favorited && "text-red-600"
                  )}
                >
                  <Heart 
                    className={cn(
                      "h-4 w-4 transition-all",
                      barber.is_favorited && "fill-current",
                      favoriteLoading && "animate-pulse"
                    )} 
                  />
                </Button>
              </div>
              
              {/* Rating and Reviews */}
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="font-medium text-sm">{barber.rating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">({barber.total_reviews})</span>
                </div>
                
                <Badge variant="secondary" className="text-xs">
                  {PRICE_RANGE_LABELS[barber.price_range] || barber.price_range}
                </Badge>
                
                {barber.is_mobile && (
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    <Smartphone className="h-3 w-3" />
                    Mobile
                  </Badge>
                )}
              </div>
              
              {/* Location and Distance */}
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">
                  {barber.location.city}, {barber.location.state}
                </span>
                {showDistance && barber.location.distance_km && (
                  <>
                    <span>•</span>
                    <span className="text-primary font-medium">
                      {formatDistance(barber.location.distance_km)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 space-y-4">
          {/* Specialties */}
          {barber.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {barber.specialties.slice(0, 4).map((specialty, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {specialty}
                </Badge>
              ))}
              {barber.specialties.length > 4 && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  +{barber.specialties.length - 4} more
                </Badge>
              )}
            </div>
          )}
          
          {/* Top Services */}
          {topServices.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Popular Services</h4>
              <div className="space-y-1">
                {topServices.map((service) => (
                  <div key={service.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span>{CATEGORY_ICONS[service.category] || '✂️'}</span>
                      <span className="truncate">{service.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>${service.price}</span>
                      <span>•</span>
                      <span>{service.duration}min</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <Separator />
          
          {/* Availability and Contact */}
          <div className="flex items-center justify-between">
            {/* Availability Status */}
            <div className="flex items-center gap-2">
              <Clock className={cn("h-4 w-4", availability.color)} />
              <span className={cn("text-sm font-medium", availability.color)}>
                {availability.message}
              </span>
            </div>
            
            {/* Quick Contact Actions */}
            <div className="flex items-center gap-1">
              {barber.contact.phone && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleContactClick('phone', barber.contact.phone!);
                  }}
                  className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
                >
                  <Phone className="h-4 w-4" />
                </Button>
              )}
              
              {barber.contact.website && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleContactClick('website', barber.contact.website!);
                  }}
                  className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Globe className="h-4 w-4" />
                </Button>
              )}
              
              {barber.contact.instagram && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleContactClick('instagram', barber.contact.instagram!);
                  }}
                  className="h-8 w-8 p-0 hover:bg-pink-50 hover:text-pink-600"
                >
                  <Instagram className="h-4 w-4" />
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Navigate to booking page
                  window.location.href = `/barbers/${barber.id}/book`;
                }}
                className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Languages */}
          {barber.languages.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Languages:</span>
              <span>{barber.languages.slice(0, 3).join(', ')}</span>
              {barber.languages.length > 3 && (
                <span>+{barber.languages.length - 3} more</span>
              )}
            </div>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}