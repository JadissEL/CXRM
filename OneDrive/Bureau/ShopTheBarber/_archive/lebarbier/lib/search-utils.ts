/**
 * Utility functions for barber search functionality
 */

export interface Location {
  latitude: number;
  longitude: number;
}

export interface BarberLocation {
  street: string;
  city: string;
  state: string;
  zip: string;
  latitude?: number;
  longitude?: number;
}

export interface WorkingHours {
  [key: string]: {
    open?: string;
    close?: string;
    closed?: boolean;
  };
}

export interface BarberService {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  duration: number;
  tags: string[];
}

export interface BarberPhoto {
  id: string;
  photo_url: string;
  is_featured: boolean;
}

export interface SearchFilters {
  q?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  category?: string;
  date?: string;
  time?: string;
  min_rating?: number;
  max_rating?: number;
  price_range?: string;
  specialties?: string[];
  languages?: string[];
  mobile_service?: boolean;
  verified_only?: boolean;
  sort_by?: 'distance' | 'rating' | 'price' | 'reviews' | 'name';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

/**
 * Calculate the distance between two geographic points using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
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
 * Format distance for display
 * @param distance Distance in kilometers
 * @returns Formatted distance string
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance}km`;
}

/**
 * Get user's current location using the Geolocation API
 * @returns Promise resolving to user's location or null if unavailable
 */
export function getCurrentLocation(): Promise<Location | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  });
}

/**
 * Parse working hours from database format
 * @param workingHours Working hours object from database
 * @returns Parsed working hours
 */
export function parseWorkingHours(workingHours: any): WorkingHours {
  if (!workingHours || typeof workingHours !== 'object') {
    return {};
  }
  return workingHours as WorkingHours;
}

/**
 * Check if a barber is currently open
 * @param workingHours Barber's working hours
 * @param timezone Barber's timezone (optional)
 * @returns True if currently open
 */
export function isCurrentlyOpen(
  workingHours: WorkingHours,
  timezone?: string
): boolean {
  const now = new Date();
  const dayNames = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  
  const today = dayNames[now.getDay()];
  const todayHours = workingHours[today];
  
  if (!todayHours || todayHours.closed) {
    return false;
  }
  
  if (!todayHours.open || !todayHours.close) {
    return false;
  }
  
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const openTime = parseTimeString(todayHours.open);
  const closeTime = parseTimeString(todayHours.close);
  
  return currentTime >= openTime && currentTime <= closeTime;
}

/**
 * Parse time string (HH:MM) to minutes since midnight
 */
function parseTimeString(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Format working hours for display
 * @param workingHours Working hours object
 * @returns Formatted working hours string
 */
export function formatWorkingHours(workingHours: WorkingHours): string {
  const dayNames = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];
  
  const formatted = dayNames.map((day) => {
    const dayKey = day.toLowerCase();
    const hours = workingHours[dayKey];
    
    if (!hours || hours.closed) {
      return `${day}: Closed`;
    }
    
    if (hours.open && hours.close) {
      return `${day}: ${hours.open} - ${hours.close}`;
    }
    
    return `${day}: Hours not set`;
  });
  
  return formatted.join('\n');
}

/**
 * Get the next available day for a barber
 * @param workingHours Barber's working hours
 * @returns Next available day name or null
 */
export function getNextAvailableDay(workingHours: WorkingHours): string | null {
  const dayNames = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  
  const today = new Date().getDay();
  
  for (let i = 1; i <= 7; i++) {
    const dayIndex = (today + i) % 7;
    const dayName = dayNames[dayIndex];
    const dayHours = workingHours[dayName];
    
    if (dayHours && !dayHours.closed && dayHours.open && dayHours.close) {
      return dayName.charAt(0).toUpperCase() + dayName.slice(1);
    }
  }
  
  return null;
}

/**
 * Calculate pagination information
 * @param page Current page number
 * @param limit Items per page
 * @param total Total number of items
 * @returns Pagination information
 */
export function calculatePagination(
  page: number,
  limit: number,
  total: number
): PaginationInfo {
  const total_pages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    total_pages,
    has_next: page < total_pages,
    has_prev: page > 1,
  };
}

/**
 * Validate search filters
 * @param filters Search filters to validate
 * @returns Validation result with errors if any
 */
export function validateSearchFilters(filters: SearchFilters): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Validate coordinates
  if (filters.latitude !== undefined) {
    if (filters.latitude < -90 || filters.latitude > 90) {
      errors.push('Latitude must be between -90 and 90');
    }
  }
  
  if (filters.longitude !== undefined) {
    if (filters.longitude < -180 || filters.longitude > 180) {
      errors.push('Longitude must be between -180 and 180');
    }
  }
  
  // Validate radius
  if (filters.radius !== undefined) {
    if (filters.radius <= 0 || filters.radius > 100) {
      errors.push('Radius must be between 1 and 100 km');
    }
  }
  
  // Validate rating
  if (filters.min_rating !== undefined) {
    if (filters.min_rating < 0 || filters.min_rating > 5) {
      errors.push('Minimum rating must be between 0 and 5');
    }
  }
  
  if (filters.max_rating !== undefined) {
    if (filters.max_rating < 0 || filters.max_rating > 5) {
      errors.push('Maximum rating must be between 0 and 5');
    }
  }
  
  // Validate pagination
  if (filters.page !== undefined) {
    if (filters.page < 1) {
      errors.push('Page must be greater than 0');
    }
  }
  
  if (filters.limit !== undefined) {
    if (filters.limit < 1 || filters.limit > 100) {
      errors.push('Limit must be between 1 and 100');
    }
  }
  
  // Validate date format
  if (filters.date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(filters.date)) {
      errors.push('Date must be in YYYY-MM-DD format');
    }
  }
  
  // Validate time format
  if (filters.time) {
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(filters.time)) {
      errors.push('Time must be in HH:MM format');
    }
  }
  
  // Validate sort options
  if (filters.sort_by) {
    const validSortFields = ['distance', 'rating', 'price', 'reviews', 'name'];
    if (!validSortFields.includes(filters.sort_by)) {
      errors.push(`Sort field must be one of: ${validSortFields.join(', ')}`);
    }
  }
  
  if (filters.sort_order) {
    const validSortOrders = ['asc', 'desc'];
    if (!validSortOrders.includes(filters.sort_order)) {
      errors.push('Sort order must be either "asc" or "desc"');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Build search query string from filters
 * @param filters Search filters
 * @returns URL search params string
 */
export function buildSearchQuery(filters: SearchFilters): string {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        params.set(key, value.join(','));
      } else {
        params.set(key, String(value));
      }
    }
  });
  
  return params.toString();
}

/**
 * Parse search query string to filters
 * @param searchParams URL search params
 * @returns Parsed search filters
 */
export function parseSearchQuery(searchParams: URLSearchParams): SearchFilters {
  const filters: SearchFilters = {};
  
  // String parameters
  const stringParams = ['q', 'category', 'date', 'time', 'price_range', 'sort_by', 'sort_order'];
  stringParams.forEach((param) => {
    const value = searchParams.get(param);
    if (value) {
      (filters as any)[param] = value;
    }
  });
  
  // Number parameters
  const numberParams = ['latitude', 'longitude', 'radius', 'min_rating', 'max_rating', 'page', 'limit'];
  numberParams.forEach((param) => {
    const value = searchParams.get(param);
    if (value) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        (filters as any)[param] = numValue;
      }
    }
  });
  
  // Boolean parameters
  const booleanParams = ['mobile_service', 'verified_only'];
  booleanParams.forEach((param) => {
    const value = searchParams.get(param);
    if (value) {
      (filters as any)[param] = value === 'true';
    }
  });
  
  // Array parameters
  const arrayParams = ['specialties', 'languages'];
  arrayParams.forEach((param) => {
    const value = searchParams.get(param);
    if (value) {
      (filters as any)[param] = value.split(',').map(s => s.trim()).filter(Boolean);
    }
  });
  
  return filters;
}

/**
 * Generate a cache key for search results
 * @param filters Search filters
 * @returns Cache key string
 */
export function generateCacheKey(filters: SearchFilters): string {
  const sortedFilters = Object.keys(filters)
    .sort()
    .reduce((result, key) => {
      const value = (filters as any)[key];
      if (value !== undefined && value !== null) {
        result[key] = Array.isArray(value) ? value.sort().join(',') : String(value);
      }
      return result;
    }, {} as Record<string, string>);
  
  return `search:${JSON.stringify(sortedFilters)}`;
}

/**
 * Debounce function for search input
 * @param func Function to debounce
 * @param wait Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Format price range for display
 * @param priceRange Price range code (e.g., '$', '$$', '$$$')
 * @returns Formatted price range description
 */
export function formatPriceRange(priceRange: string): string {
  const priceMap: Record<string, string> = {
    '$': 'Budget-friendly ($10-30)',
    '$$': 'Moderate ($30-60)',
    '$$$': 'Premium ($60-100)',
    '$$$$': 'Luxury ($100+)',
  };
  
  return priceMap[priceRange] || priceRange;
}

/**
 * Get price range options for filters
 * @returns Array of price range options
 */
export function getPriceRangeOptions(): Array<{ value: string; label: string }> {
  return [
    { value: '$', label: 'Budget-friendly ($10-30)' },
    { value: '$$', label: 'Moderate ($30-60)' },
    { value: '$$$', label: 'Premium ($60-100)' },
    { value: '$$$$', label: 'Luxury ($100+)' },
  ];
}

/**
 * Get service category options for filters
 * @returns Array of service category options
 */
export function getServiceCategoryOptions(): Array<{ value: string; label: string }> {
  return [
    { value: 'haircut', label: 'Haircuts' },
    { value: 'beard_trim', label: 'Beard Trimming' },
    { value: 'shave', label: 'Shaving' },
    { value: 'styling', label: 'Hair Styling' },
    { value: 'coloring', label: 'Hair Coloring' },
    { value: 'treatment', label: 'Hair Treatment' },
    { value: 'consultation', label: 'Consultation' },
    { value: 'other', label: 'Other Services' },
  ];
}

/**
 * Get specialty options for filters
 * @returns Array of specialty options
 */
export function getSpecialtyOptions(): Array<{ value: string; label: string }> {
  return [
    { value: 'Classic Cuts', label: 'Classic Cuts' },
    { value: 'Modern Styles', label: 'Modern Styles' },
    { value: 'Beard Specialist', label: 'Beard Specialist' },
    { value: 'Fade Expert', label: 'Fade Expert' },
    { value: 'Color Specialist', label: 'Color Specialist' },
    { value: 'Curly Hair', label: 'Curly Hair Specialist' },
    { value: 'Wedding Styling', label: 'Wedding Styling' },
    { value: 'Kids Cuts', label: 'Kids Haircuts' },
    { value: 'Senior Cuts', label: 'Senior Haircuts' },
    { value: 'Ethnic Hair', label: 'Ethnic Hair Specialist' },
  ];
}

/**
 * Get language options for filters
 * @returns Array of language options
 */
export function getLanguageOptions(): Array<{ value: string; label: string }> {
  return [
    { value: 'English', label: 'English' },
    { value: 'Spanish', label: 'Spanish' },
    { value: 'French', label: 'French' },
    { value: 'German', label: 'German' },
    { value: 'Italian', label: 'Italian' },
    { value: 'Portuguese', label: 'Portuguese' },
    { value: 'Russian', label: 'Russian' },
    { value: 'Chinese', label: 'Chinese' },
    { value: 'Japanese', label: 'Japanese' },
    { value: 'Korean', label: 'Korean' },
    { value: 'Arabic', label: 'Arabic' },
    { value: 'Hindi', label: 'Hindi' },
  ];
}