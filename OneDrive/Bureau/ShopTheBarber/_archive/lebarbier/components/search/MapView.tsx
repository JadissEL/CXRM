'use client';

import React from 'react';
const { useState, useEffect, useRef, useCallback } = React;
import { MapPin, Navigation, ZoomIn, ZoomOut, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BarberMapData {
  id: string;
  name: string;
  business_name: string;
  avatar_url?: string;
  rating: number;
  total_reviews: number;
  price_range: string;
  location: {
    city: string;
    state: string;
    latitude?: number;
    longitude?: number;
    distance_km?: number;
  };
  specialties: string[];
  is_mobile: boolean;
}

interface MapViewProps {
  barbers: BarberMapData[];
  userLocation?: { lat: number; lng: number } | null;
  onBarberSelect?: (barberId: string) => void;
  className?: string;
}

interface MapMarker {
  id: string;
  position: { lat: number; lng: number };
  barber: BarberMapData;
}

// Simple map implementation using HTML5 Canvas or fallback to static map
export default function MapView({ 
  barbers, 
  userLocation, 
  onBarberSelect,
  className 
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedBarber, setSelectedBarber] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(
    userLocation || { lat: 40.7128, lng: -74.0060 } // Default to NYC
  );
  const [zoomLevel, setZoomLevel] = useState(12);
  const [mapStyle, setMapStyle] = useState<'roadmap' | 'satellite'>('roadmap');
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Filter barbers with valid coordinates
  const validBarbers = barbers.filter(barber => 
    barber.location.latitude && barber.location.longitude
  );

  const markers: MapMarker[] = validBarbers.map(barber => ({
    id: barber.id,
    position: {
      lat: barber.location.latitude!,
      lng: barber.location.longitude!
    },
    barber
  }));

  // Initialize map center based on barbers or user location
  useEffect(() => {
    if (userLocation) {
      setMapCenter(userLocation);
    } else if (validBarbers.length > 0) {
      // Calculate center of all barber locations
      const avgLat = validBarbers.reduce((sum, b) => sum + (b.location.latitude || 0), 0) / validBarbers.length;
      const avgLng = validBarbers.reduce((sum, b) => sum + (b.location.longitude || 0), 0) / validBarbers.length;
      setMapCenter({ lat: avgLat, lng: avgLng });
    }
  }, [userLocation, validBarbers]);

  // Handle marker click
  const handleMarkerClick = useCallback((barberId: string) => {
    setSelectedBarber(barberId);
    onBarberSelect?.(barberId);
  }, [onBarberSelect]);

  // Handle map controls
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 1, 18));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 1, 1));
  const handleRecenter = () => {
    if (userLocation) {
      setMapCenter(userLocation);
    }
  };

  // Convert coordinates to pixel position (simplified)
  const coordsToPixel = (lat: number, lng: number, mapWidth: number, mapHeight: number) => {
    // Simple mercator projection approximation
    const latRad = (lat * Math.PI) / 180;
    const lngRad = (lng * Math.PI) / 180;
    const centerLatRad = (mapCenter.lat * Math.PI) / 180;
    const centerLngRad = (mapCenter.lng * Math.PI) / 180;
    
    // Scale factor based on zoom level
    const scale = Math.pow(2, zoomLevel - 10);
    
    const x = mapWidth / 2 + (lngRad - centerLngRad) * scale * 100;
    const y = mapHeight / 2 - (latRad - centerLatRad) * scale * 100;
    
    return { x, y };
  };

  // Render static map as fallback
  const renderStaticMap = () => {
    const mapWidth = 800;
    const mapHeight = 600;
    
    return (
      <div className="relative w-full h-full bg-gray-100 overflow-hidden">
        {/* Map Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50">
          {/* Grid pattern to simulate map */}
          <svg className="w-full h-full opacity-20">
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#94a3b8" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        {/* User Location Marker */}
        {userLocation && (
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
            style={{
              left: `${mapWidth / 2}px`,
              top: `${mapHeight / 2}px`
            }}
          >
            <div className="relative">
              <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
              <div className="absolute inset-0 w-4 h-4 bg-blue-500 rounded-full opacity-30 animate-ping" />
            </div>
          </div>
        )}
        
        {/* Barber Markers */}
        {markers.map((marker) => {
          const pixel = coordsToPixel(marker.position.lat, marker.position.lng, mapWidth, mapHeight);
          const isVisible = pixel.x >= 0 && pixel.x <= mapWidth && pixel.y >= 0 && pixel.y <= mapHeight;
          
          if (!isVisible) return null;
          
          return (
            <div
              key={marker.id}
              className="absolute transform -translate-x-1/2 -translate-y-full z-10 cursor-pointer"
              style={{
                left: `${pixel.x}px`,
                top: `${pixel.y}px`
              }}
              onClick={() => handleMarkerClick(marker.id)}
            >
              {/* Marker Pin */}
              <div className={cn(
                "relative transition-all duration-200 hover:scale-110",
                selectedBarber === marker.id && "scale-110 z-30"
              )}>
                <div className={cn(
                  "w-8 h-8 rounded-full border-2 border-white shadow-lg overflow-hidden",
                  selectedBarber === marker.id ? "ring-2 ring-primary" : ""
                )}>
                  <Avatar className="w-full h-full">
                    <AvatarImage src={marker.barber.avatar_url} alt={marker.barber.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {marker.barber.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                {/* Pin pointer */}
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-white" />
                
                {/* Info popup */}
                {selectedBarber === marker.id && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 z-40">
                    <Card className="shadow-lg border-2">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={marker.barber.avatar_url} alt={marker.barber.name} />
                            <AvatarFallback>{marker.barber.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm truncate">
                              {marker.barber.business_name || marker.barber.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">★ {marker.barber.rating}</span>
                              <Badge variant="secondary" className="text-xs">
                                {marker.barber.price_range}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {marker.barber.location.city}, {marker.barber.location.state}
                            </p>
                            {marker.barber.location.distance_km && (
                              <p className="text-xs text-primary font-medium">
                                {marker.barber.location.distance_km.toFixed(1)}km away
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <Button 
                          size="sm" 
                          className="w-full mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/barbers/${marker.id}`;
                          }}
                        >
                          View Profile
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {/* No barbers message */}
        {validBarbers.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Card>
              <CardContent className="p-6 text-center">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No barbers found</h3>
                <p className="text-muted-foreground">
                  No barbers with location data in this area.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("relative w-full h-[600px] rounded-lg overflow-hidden border", className)}>
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full">
        {renderStaticMap()}
      </div>
      
      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-30">
        {/* Zoom Controls */}
        <div className="bg-background border rounded-md shadow-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            className="h-8 w-8 p-0 rounded-b-none border-b"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            className="h-8 w-8 p-0 rounded-t-none"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Recenter Button */}
        {userLocation && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRecenter}
            className="h-8 w-8 p-0 bg-background"
            title="Center on my location"
          >
            <Navigation className="h-4 w-4" />
          </Button>
        )}
        
        {/* Map Style Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMapStyle(prev => prev === 'roadmap' ? 'satellite' : 'roadmap')}
          className="h-8 w-8 p-0 bg-background"
          title="Toggle map style"
        >
          <Layers className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 z-30">
        <Card className="bg-background/95 backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-4 text-xs">
              {userLocation && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span>Your location</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-full" />
                <span>Barbers ({validBarbers.length})</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Loading/Error States */}
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-40">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-destructive mb-4">{mapError}</p>
              <Button onClick={() => setMapError(null)} variant="outline">
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}