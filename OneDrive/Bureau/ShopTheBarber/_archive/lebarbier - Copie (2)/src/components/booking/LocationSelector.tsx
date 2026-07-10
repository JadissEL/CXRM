'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Home, Store, AlertCircle, CheckCircle, Loader2, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { debounce } from 'lodash';

interface LocationSelectorProps {
  barberId: string;
  selectedLocation: 'shop' | 'home';
  onLocationChange: (location: 'shop' | 'home') => void;
  serviceAddress: string;
  onAddressChange: (address: string) => void;
  coordinates: { lat: number; lng: number } | null;
  onCoordinatesChange: (coords: { lat: number; lng: number } | null) => void;
  totalServicePrice: number;
  onTravelFeeChange: (fee: number) => void;
  onValidationChange: (isValid: boolean, error?: string) => void;
  disabled?: boolean;
}

interface BarberHomeVisitInfo {
  offersHomeVisits: boolean;
  baseFee: number;
  perKmFee: number;
  maxDistance: number;
  minPrice: number;
  shopLocation: {
    coordinates: [number, number] | null;
    address: {
      street: string;
      city: string;
      state: string;
    };
  };
}

interface AddressValidationResult {
  isValid: boolean;
  error?: string;
  address: string;
  travelDistance: number | null;
  travelFee: number | null;
  totalPrice: number | null;
  estimatedTravelTime: number | null;
  inServiceArea: boolean;
  barberInfo: {
    offersHomeVisits: boolean;
    baseFee: number;
    perKmFee: number;
    maxDistance: number;
    minPrice: number;
  };
}

export default function LocationSelector({
  barberId,
  selectedLocation,
  onLocationChange,
  serviceAddress,
  onAddressChange,
  coordinates,
  onCoordinatesChange,
  totalServicePrice,
  onTravelFeeChange,
  onValidationChange,
  disabled = false,
}: LocationSelectorProps) {
  const [barberInfo, setBarberInfo] = useState<BarberHomeVisitInfo | null>(null);
  const [validationResult, setValidationResult] = useState<AddressValidationResult | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  // Fetch barber home visit information
  useEffect(() => {
    const fetchBarberInfo = async () => {
      if (!barberId) return;
      
      setIsLoadingInfo(true);
      try {
        const response = await fetch(`/api/appointments/validate-address?barberId=${barberId}`);
        if (response.ok) {
          const data = await response.json();
          setBarberInfo(data);
        } else {
          console.error('Failed to fetch barber info');
        }
      } catch (error) {
        console.error('Error fetching barber info:', error);
      } finally {
        setIsLoadingInfo(false);
      }
    };

    fetchBarberInfo();
  }, [barberId]);

  // Geocoding function (production implementation)
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    // TODO: Implement actual geocoding service
    // Options:
    // - Google Maps Geocoding API
    // - Mapbox Geocoding API
    // - OpenStreetMap Nominatim
    
    try {
      // For now, return null to indicate geocoding is not implemented
      // In production, this would call the actual geocoding service
      console.warn('Geocoding not implemented - using placeholder coordinates');
      
      // Return null to indicate geocoding failed
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  // Validate address and calculate fees
  const validateAddress = async (address: string, coords: { lat: number; lng: number }) => {
    if (!address.trim() || !coords) return;
    
    setIsValidating(true);
    setAddressError(null);
    
    try {
      const response = await fetch('/api/appointments/validate-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          barberId,
          latitude: coords.lat,
          longitude: coords.lng,
          address,
          totalServicePrice,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setValidationResult(data);
        onTravelFeeChange(data.travelFee || 0);
        onValidationChange(data.isValid, data.error);
      } else {
        setAddressError(data.error || 'Failed to validate address');
        onValidationChange(false, data.error);
      }
    } catch (error) {
      console.error('Address validation error:', error);
      setAddressError('Failed to validate address');
      onValidationChange(false, 'Failed to validate address');
    } finally {
      setIsValidating(false);
    }
  };

  // Debounced address validation
  const debouncedValidateAddress = useCallback(
    debounce(async (address: string) => {
      if (selectedLocation === 'home' && address.trim()) {
        const coords = await geocodeAddress(address);
        if (coords) {
          onCoordinatesChange(coords);
          await validateAddress(address, coords);
        } else {
          setAddressError('Could not find coordinates for this address');
          onValidationChange(false, 'Invalid address');
        }
      }
    }, 1000),
    [selectedLocation, barberId, totalServicePrice]
  );

  // Handle address input change
  const handleAddressChange = (value: string) => {
    onAddressChange(value);
    setValidationResult(null);
    setAddressError(null);
    
    if (selectedLocation === 'home') {
      debouncedValidateAddress(value);
    }
  };

  // Handle location type change
  const handleLocationChange = (location: 'shop' | 'home') => {
    onLocationChange(location);
    
    if (location === 'shop') {
      onCoordinatesChange(null);
      onTravelFeeChange(0);
      onValidationChange(true);
      setValidationResult(null);
      setAddressError(null);
    } else if (location === 'home' && serviceAddress.trim()) {
      debouncedValidateAddress(serviceAddress);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format distance
  const formatDistance = (km: number) => {
    return `${km.toFixed(1)} km`;
  };

  // Format time
  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (isLoadingInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Service Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading location options...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Service Location
        </CardTitle>
        <CardDescription>
          Choose where you'd like to receive your service
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Location Type Selector */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            type="button"
            variant={selectedLocation === 'shop' ? 'default' : 'outline'}
            className="h-auto p-4 flex flex-col items-center gap-2"
            onClick={() => handleLocationChange('shop')}
            disabled={disabled}
          >
            <Store className="h-6 w-6" />
            <div className="text-center">
              <div className="font-medium">In Salon</div>
              <div className="text-xs text-muted-foreground">Visit the barber shop</div>
            </div>
          </Button>
          
          <Button
            type="button"
            variant={selectedLocation === 'home' ? 'default' : 'outline'}
            className="h-auto p-4 flex flex-col items-center gap-2"
            onClick={() => handleLocationChange('home')}
            disabled={disabled || !barberInfo?.offersHomeVisits}
          >
            <Home className="h-6 w-6" />
            <div className="text-center">
              <div className="font-medium">At Home</div>
              <div className="text-xs text-muted-foreground">
                {barberInfo?.offersHomeVisits ? 'Service at your location' : 'Not available'}
              </div>
            </div>
          </Button>
        </div>

        {/* Home Visit Information */}
        {barberInfo && !barberInfo.offersHomeVisits && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This barber does not offer home visits. Please select "In Salon" option.
            </AlertDescription>
          </Alert>
        )}

        {/* Home Visit Address Form */}
        {selectedLocation === 'home' && barberInfo?.offersHomeVisits && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serviceAddress">Service Address</Label>
              <Input
                id="serviceAddress"
                placeholder="Enter your full address"
                value={serviceAddress}
                onChange={(e) => handleAddressChange(e.target.value)}
                disabled={disabled}
                className={addressError ? 'border-red-500' : ''}
              />
              {addressError && (
                <p className="text-sm text-red-600">{addressError}</p>
              )}
            </div>

            {/* Address Validation Status */}
            {isValidating && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Validating address and calculating fees...
              </div>
            )}

            {/* Validation Results */}
            {validationResult && (
              <div className="space-y-4">
                {validationResult.isValid ? (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Address is within service area!
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      {validationResult.error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Travel Information */}
                {validationResult.travelDistance && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 font-medium">
                      <Calculator className="h-4 w-4" />
                      Travel Information
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Distance:</span>
                        <div className="font-medium">{formatDistance(validationResult.travelDistance)}</div>
                      </div>
                      
                      {validationResult.estimatedTravelTime && (
                        <div>
                          <span className="text-muted-foreground">Travel Time:</span>
                          <div className="font-medium">{formatTime(validationResult.estimatedTravelTime)}</div>
                        </div>
                      )}
                      
                      <div>
                        <span className="text-muted-foreground">Travel Fee:</span>
                        <div className="font-medium">{formatCurrency(validationResult.travelFee || 0)}</div>
                      </div>
                      
                      <div>
                        <span className="text-muted-foreground">Total Price:</span>
                        <div className="font-medium">{formatCurrency(validationResult.totalPrice || 0)}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Home Visit Pricing Info */}
            {barberInfo && (
              <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                <div className="font-medium text-blue-900">Home Visit Pricing</div>
                <div className="text-sm text-blue-800 space-y-1">
                  <div>Base fee: {formatCurrency(barberInfo.baseFee)}</div>
                  <div>Per kilometer: {formatCurrency(barberInfo.perKmFee)}</div>
                  <div>Maximum distance: {formatDistance(barberInfo.maxDistance)}</div>
                  {barberInfo.minPrice > 0 && (
                    <div>Minimum total: {formatCurrency(barberInfo.minPrice)}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Shop Location Information */}
        {selectedLocation === 'shop' && barberInfo?.shopLocation && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="font-medium mb-2">Salon Location</div>
            <div className="text-sm text-muted-foreground">
              {barberInfo.shopLocation.address.street && (
                <div>{barberInfo.shopLocation.address.street}</div>
              )}
              <div>
                {barberInfo.shopLocation.address.city}, {barberInfo.shopLocation.address.state}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}