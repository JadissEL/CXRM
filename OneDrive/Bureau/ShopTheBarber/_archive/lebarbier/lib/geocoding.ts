/**
 * Geocoding utilities for address validation and coordinate conversion
 * Supports both Google Maps Geocoding API and Mapbox Geocoding API
 */

interface Coordinates {
  lat: number;
  lng: number;
}

interface GeocodeResult {
  lat: number;
  lng: number;
  formatted_address?: string;
  address_components?: any[];
}

/**
 * Geocode an address using Google Maps Geocoding API
 */
export async function geocodeAddressGoogle(address: string): Promise<GeocodeResult> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    throw new Error('Google Maps API key not configured');
  }

  const encodedAddress = encodeURIComponent(address);
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      throw new Error(`Geocoding failed: ${data.status || 'No results found'}`);
    }

    const result = data.results[0];
    const location = result.geometry.location;

    return {
      lat: location.lat,
      lng: location.lng,
      formatted_address: result.formatted_address,
      address_components: result.address_components,
    };
  } catch (error) {
    console.error('Google Maps geocoding error:', error);
    throw new Error('Failed to geocode address');
  }
}

/**
 * Geocode an address using Mapbox Geocoding API
 */
export async function geocodeAddressMapbox(address: string): Promise<GeocodeResult> {
  const apiKey = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  
  if (!apiKey) {
    throw new Error('Mapbox access token not configured');
  }

  const encodedAddress = encodeURIComponent(address);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${apiKey}&limit=1`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      throw new Error('No results found');
    }

    const feature = data.features[0];
    const [lng, lat] = feature.center;

    return {
      lat,
      lng,
      formatted_address: feature.place_name,
      address_components: feature.context,
    };
  } catch (error) {
    console.error('Mapbox geocoding error:', error);
    throw new Error('Failed to geocode address');
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(coord2.lat - coord1.lat);
  const dLng = toRadians(coord2.lng - coord1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.lat)) * Math.cos(toRadians(coord2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get estimated travel time using Google Maps Distance Matrix API
 */
export async function getTravelTimeGoogle(
  origin: Coordinates,
  destination: Coordinates,
  mode: 'driving' | 'walking' | 'transit' = 'driving'
): Promise<{ distance: number; duration: number }> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    throw new Error('Google Maps API key not configured');
  }

  const originStr = `${origin.lat},${origin.lng}`;
  const destinationStr = `${destination.lat},${destination.lng}`;
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originStr}&destinations=${destinationStr}&mode=${mode}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.rows || data.rows.length === 0) {
      throw new Error(`Distance Matrix API failed: ${data.status}`);
    }

    const element = data.rows[0].elements[0];
    
    if (element.status !== 'OK') {
      throw new Error(`Route not found: ${element.status}`);
    }

    return {
      distance: element.distance.value / 1000, // Convert meters to kilometers
      duration: element.duration.value / 60, // Convert seconds to minutes
    };
  } catch (error) {
    console.error('Google Maps Distance Matrix error:', error);
    throw new Error('Failed to calculate travel time');
  }
}

/**
 * Get estimated travel time using Mapbox Directions API
 */
export async function getTravelTimeMapbox(
  origin: Coordinates,
  destination: Coordinates,
  profile: 'driving' | 'walking' | 'cycling' = 'driving'
): Promise<{ distance: number; duration: number }> {
  const apiKey = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  
  if (!apiKey) {
    throw new Error('Mapbox access token not configured');
  }

  const coordinates = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinates}?access_token=${apiKey}&geometries=geojson`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }

    const route = data.routes[0];
    
    return {
      distance: route.distance / 1000, // Convert meters to kilometers
      duration: route.duration / 60, // Convert seconds to minutes
    };
  } catch (error) {
    console.error('Mapbox Directions error:', error);
    throw new Error('Failed to calculate travel time');
  }
}

/**
 * Main geocoding function that uses the configured provider
 * Falls back to the other provider if the primary one fails
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const primaryProvider = process.env.NEXT_PUBLIC_GEOCODING_PROVIDER || 'google';
  
  try {
    if (primaryProvider === 'mapbox') {
      return await geocodeAddressMapbox(address);
    } else {
      return await geocodeAddressGoogle(address);
    }
  } catch (error) {
    console.warn(`Primary geocoding provider (${primaryProvider}) failed, trying fallback:`, error);
    
    // Try the other provider as fallback
    try {
      if (primaryProvider === 'mapbox') {
        return await geocodeAddressGoogle(address);
      } else {
        return await geocodeAddressMapbox(address);
      }
    } catch (fallbackError) {
      console.error('Both geocoding providers failed:', fallbackError);
      throw new Error('Unable to geocode address with any provider');
    }
  }
}

/**
 * Main travel time function that uses the configured provider
 */
export async function getTravelTime(
  origin: Coordinates,
  destination: Coordinates
): Promise<{ distance: number; duration: number }> {
  const primaryProvider = process.env.NEXT_PUBLIC_GEOCODING_PROVIDER || 'google';
  
  try {
    if (primaryProvider === 'mapbox') {
      return await getTravelTimeMapbox(origin, destination, 'driving');
    } else {
      return await getTravelTimeGoogle(origin, destination, 'driving');
    }
  } catch (error) {
    console.warn(`Primary travel time provider (${primaryProvider}) failed:`, error);
    
    // Fallback to distance calculation if APIs fail
    const distance = calculateDistance(origin, destination);
    const estimatedDuration = distance * 2; // Rough estimate: 2 minutes per km in city
    
    return {
      distance,
      duration: estimatedDuration,
    };
  }
}

/**
 * Validate if an address string looks reasonable
 */
export function validateAddressFormat(address: string): boolean {
  if (!address || address.trim().length < 5) {
    return false;
  }
  
  // Basic validation: should contain at least a number and some letters
  const hasNumber = /\d/.test(address);
  const hasLetters = /[a-zA-Z]/.test(address);
  const hasCommaOrSpace = /[,\s]/.test(address);
  
  return hasNumber && hasLetters && hasCommaOrSpace;
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(coords: Coordinates, precision: number = 4): string {
  return `${coords.lat.toFixed(precision)}, ${coords.lng.toFixed(precision)}`;
}

/**
 * Check if coordinates are within a reasonable range
 */
export function validateCoordinates(coords: Coordinates): boolean {
  return (
    coords.lat >= -90 && coords.lat <= 90 &&
    coords.lng >= -180 && coords.lng <= 180
  );
}