'use client';

import React from 'react';
const { useState, useEffect, useCallback, useMemo } = React;
import { useUser } from '@clerk/nextjs';
import { Search, MapPin, Filter, Star as Grid, Star as List, Star, Clock, Phone, Globe, Star as Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import SearchFilters from './SearchFilters';
import BarberCard from './BarberCard';
import MapView from './MapView';
import { useDebounce } from '@/hooks/useDebounce';

// Types
interface BarberSearchResult {
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
}

interface SearchFilters {
  location?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  category?: string;
  service?: string;
  date?: string;
  time?: string;
  min_rating?: number;
  price_range?: string;
  min_price?: number;
  max_price?: number;
  specialties?: string;
  languages?: string;
  mobile_service?: boolean;
  verified_only?: boolean;
  sort_by?: 'distance' | 'rating' | 'price' | 'reviews' | 'newest';
  sort_order?: 'asc' | 'desc';
  q?: string;
}

interface SearchResponse {
  success: boolean;
  data: BarberSearchResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  filters_applied: Record<string, any>;
  error?: string;
}

const PRICE_RANGES = [
  { value: '$', label: '$ (Under $30)' },
  { value: '$$', label: '$$ ($30-60)' },
  { value: '$$$', label: '$$$ ($60-100)' },
  { value: '$$$$', label: '$$$$ ($100+)' }
];

const SERVICE_CATEGORIES = [
  { value: 'haircut', label: 'Haircut' },
  { value: 'beard_trim', label: 'Beard Trim' },
  { value: 'shave', label: 'Shave' },
  { value: 'styling', label: 'Styling' },
  { value: 'coloring', label: 'Coloring' },
  { value: 'treatment', label: 'Treatment' },
  { value: 'consultation', label: 'Consultation' },
  { value: 'package', label: 'Package' }
];

const SORT_OPTIONS = [
  { value: 'distance', label: 'Distance' },
  { value: 'rating', label: 'Rating' },
  { value: 'reviews', label: 'Most Reviews' },
  { value: 'price', label: 'Price' },
  { value: 'newest', label: 'Newest' }
];

export default function BarberSearch() {
  const { user, isLoaded } = useUser();
  
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    radius: 25,
    sort_by: 'distance',
    sort_order: 'asc'
  });
  const [results, setResults] = useState<BarberSearchResult[]>([]);
  const [pagination, setPagination] = useState<SearchResponse['pagination'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Debounced search query
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setFilters(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
        },
        (error) => {
          console.warn('Geolocation error:', error);
          // Fallback to IP-based location or default location
        }
      );
    }
  }, []);
  
  // Search function
  const searchBarbers = useCallback(async (page = 1) => {
    if (!isLoaded) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const searchParams = new URLSearchParams();
      
      // Add search query
      if (debouncedSearchQuery) {
        searchParams.append('q', debouncedSearchQuery);
      }
      
      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
      
      // Add pagination
      searchParams.append('page', page.toString());
      searchParams.append('limit', '20');
      
      const response = await fetch(`/api/barbers/search?${searchParams.toString()}`);
      const data: SearchResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Search failed');
      }
      
      setResults(data.data);
      setPagination(data.pagination);
      setCurrentPage(page);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchQuery, filters, isLoaded]);
  
  // Trigger search when query or filters change
  useEffect(() => {
    searchBarbers(1);
  }, [searchBarbers]);
  
  // Handle filter changes
  const handleFilterChange = useCallback((key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);
  
  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    searchBarbers(page);
  }, [searchBarbers]);
  
  // Handle favorite toggle
  const handleFavoriteToggle = useCallback(async (barberId: string, isFavorited: boolean) => {
    if (!user) {
      toast.error('Please sign in to save favorites');
      return;
    }
    
    try {
      const response = await fetch('/api/profile/favorites', {
        method: isFavorited ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          favorite_type: 'barber',
          favorite_id: barberId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update favorite');
      }
      
      // Update local state
      setResults(prev => prev.map(barber => 
        barber.id === barberId 
          ? { ...barber, is_favorited: !isFavorited }
          : barber
      ));
      
      toast.success(isFavorited ? 'Removed from favorites' : 'Added to favorites');
      
    } catch (err) {
      toast.error('Failed to update favorite');
    }
  }, [user]);
  
  // Memoized filtered and sorted results
  const displayResults = useMemo(() => {
    return results;
  }, [results]);
  
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Find Your Perfect Barber</h1>
        <p className="text-muted-foreground">
          Discover skilled barbers near you with real-time availability
        </p>
      </div>
      
      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name, service, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={showFilters ? 'default' : 'outline'}
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
              
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-r-none"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'map' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('map')}
                  className="rounded-l-none"
                >
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Filters */}
      {showFilters && (
        <SearchFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          userLocation={userLocation}
        />
      )}
      
      {/* Results Summary */}
      {pagination && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {((pagination.page - 1) * pagination.limit) + 1}-
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} barbers
          </span>
          
          <Select
            value={`${filters.sort_by}-${filters.sort_order}`}
            onValueChange={(value) => {
              const [sort_by, sort_order] = value.split('-') as [typeof filters.sort_by, typeof filters.sort_order];
              handleFilterChange('sort_by', sort_by);
              handleFilterChange('sort_order', sort_order);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(option => (
                <React.Fragment key={option.value}>
                  <SelectItem value={`${option.value}-asc`}>
                    {option.label} (Low to High)
                  </SelectItem>
                  <SelectItem value={`${option.value}-desc`}>
                    {option.label} (High to Low)
                  </SelectItem>
                </React.Fragment>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-muted-foreground">Searching barbers...</span>
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => searchBarbers(currentPage)} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Results */}
      {!loading && !error && (
        <>
          {viewMode === 'list' ? (
            <div className="space-y-4">
              {displayResults.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No barbers found</h3>
                    <p className="text-muted-foreground mb-4">
                      Try adjusting your search criteria or expanding your search radius.
                    </p>
                    <Button 
                      onClick={() => {
                        setFilters({ radius: 50, sort_by: 'distance', sort_order: 'asc' });
                        setSearchQuery('');
                      }}
                      variant="outline"
                    >
                      Reset Filters
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                displayResults.map((barber) => (
                  <BarberCard
                    key={barber.id}
                    barber={barber}
                    onFavoriteToggle={handleFavoriteToggle}
                    showDistance={!!userLocation}
                  />
                ))
              )}
            </div>
          ) : (
            <MapView
              barbers={displayResults}
              userLocation={userLocation}
              onBarberSelect={(barberId) => {
                const element = document.getElementById(`barber-${barberId}`);
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          )}
          
          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!pagination.has_prev || loading}
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={page === currentPage ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      disabled={loading}
                    >
                      {page}
                    </Button>
                  );
                })}
                
                {pagination.total_pages > 5 && (
                  <>
                    <span className="px-2">...</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.total_pages)}
                      disabled={loading}
                    >
                      {pagination.total_pages}
                    </Button>
                  </>
                )}
              </div>
              
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!pagination.has_next || loading}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}