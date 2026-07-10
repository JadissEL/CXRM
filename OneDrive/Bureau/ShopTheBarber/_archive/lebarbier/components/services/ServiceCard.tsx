'use client';

import React from 'react';
const { useState } = React;
import Image from 'next/image';
import { Star, Clock, Star as DollarSign, MapPin, Heart, User, CheckCircle, Play } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';

interface ServiceWithDetails {
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
  barber_id: string;
  barber_name: string;
  business_name: string | null;
  barber_avatar_url: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

interface ServiceCardProps {
  service: ServiceWithDetails;
  viewMode: 'grid' | 'list';
  onSelect: () => void;
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

export function ServiceCard({ service, viewMode, onSelect }: ServiceCardProps) {
  const { isSignedIn } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isSignedIn) {
      toast.error('Please sign in to save favorites');
      return;
    }

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
      setIsFavorited(data.is_favorited);
      toast.success(data.is_favorited ? 'Added to favorites' : 'Removed from favorites');
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites');
    } finally {
      setFavoriteLoading(false);
    }
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

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const ServiceImage = () => {
    if (imageError || !service.image_url) {
      return (
        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <User className="h-8 w-8 mx-auto mb-2" />
            <span className="text-xs">{CATEGORY_LABELS[service.category] || 'Service'}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="relative w-full h-full">
        <Image
          src={service.image_url}
          alt={service.name}
          fill
          className="object-cover"
          onError={() => setImageError(true)}
        />
        {service.video_url && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
            <div className="bg-white bg-opacity-90 rounded-full p-2">
              <Play className="h-4 w-4 text-gray-700" />
            </div>
          </div>
        )}
      </div>
    );
  };

  if (viewMode === 'list') {
    return (
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onSelect}>
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Image */}
            <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
              <ServiceImage />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">{service.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={service.barber_avatar_url || ''} />
                      <AvatarFallback className="text-xs">
                        {service.barber_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground truncate">
                      {service.business_name || service.barber_name}
                    </span>
                    {service.is_verified && (
          <CheckCircle className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFavoriteToggle}
                  disabled={favoriteLoading}
                  className="flex-shrink-0"
                >
                  <Heart
                    className={`h-4 w-4 ${
                      isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-400'
                    }`}
                  />
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {service.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge className={CATEGORY_COLORS[service.category] || CATEGORY_COLORS.other}>
                    {CATEGORY_LABELS[service.category] || service.category}
                  </Badge>
                  
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      <span className="font-medium">{formatPrice(service.price)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDuration(service.duration)}</span>
                    </div>
                    
                    {service.rating > 0 && (
                      <div className="flex items-center gap-1">
                        {renderStars(service.rating)}
                        <span className="text-xs">({service.review_count})</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <Button size="sm" disabled={!service.booking_enabled}>
                  {service.booking_enabled ? 'Book Now' : 'Unavailable'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid view
  return (
    <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 group" onClick={onSelect}>
      <div className="relative">
        {/* Image */}
        <div className="relative h-48 rounded-t-lg overflow-hidden">
          <ServiceImage />
          
          {/* Favorite Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFavoriteToggle}
            disabled={favoriteLoading}
            className="absolute top-2 right-2 bg-white bg-opacity-90 hover:bg-opacity-100"
          >
            <Heart
              className={`h-4 w-4 ${
                isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'
              }`}
            />
          </Button>
          
          {/* Category Badge */}
          <div className="absolute top-2 left-2">
            <Badge className={CATEGORY_COLORS[service.category] || CATEGORY_COLORS.other}>
              {CATEGORY_LABELS[service.category] || service.category}
            </Badge>
          </div>
        </div>
        
        <CardContent className="p-4">
          {/* Service Name */}
          <h3 className="font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
            {service.name}
          </h3>
          
          {/* Barber Info */}
          <div className="flex items-center gap-2 mb-3">
            <Avatar className="h-6 w-6">
              <AvatarImage src={service.barber_avatar_url || ''} />
              <AvatarFallback className="text-xs">
                {service.barber_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground truncate flex-1">
              {service.business_name || service.barber_name}
            </span>
            {service.is_verified && (
          <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
            )}
          </div>
          
          {/* Description */}
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {service.description}
          </p>
          
          {/* Price and Duration */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1 text-lg font-semibold text-primary">
              <DollarSign className="h-4 w-4" />
              {formatPrice(service.price)}
            </div>
            
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDuration(service.duration)}
            </div>
          </div>
          
          {/* Rating */}
          {service.rating > 0 && (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {renderStars(service.rating)}
                <span className="text-sm text-muted-foreground">
                  {service.rating.toFixed(1)} ({service.review_count} review{service.review_count !== 1 ? 's' : ''})
                </span>
              </div>
            </div>
          )}
          
          {/* Book Button */}
          <Button 
            className="w-full" 
            disabled={!service.booking_enabled}
            onClick={(e) => {
              e.stopPropagation();
              // Handle booking - this will be implemented later
              onSelect();
            }}
          >
            {service.booking_enabled ? 'View Details' : 'Unavailable'}
          </Button>
        </CardContent>
      </div>
    </Card>
  );
}