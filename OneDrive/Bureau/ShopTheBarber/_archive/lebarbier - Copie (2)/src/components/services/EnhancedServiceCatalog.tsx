'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { Search, Filter, Grid, List, Star, Clock, DollarSign, MapPin, Heart, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useDebounce } from '@/hooks/useDebounce';
import { ServiceCard } from './ServiceCard';
import { ServiceDetailModal } from './ServiceDetailModal';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ServiceCategories, MEN_BARBER_CATEGORIES, ServiceCategory } from './ServiceCategories';
import { EnhancedServiceFilters, EnhancedServiceFilters as EnhancedFilters } from './EnhancedServiceFilters';

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
  service_type: 'in_shop' | 'home_visit';
  languages: string[];
  has_promotion: boolean;
  instant_booking: boolean;
  created_at: string;
  updated_at: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

interface ServiceListResponse {
  services: ServiceWithDetails[];
  pagination: PaginationMeta;
  filters_applied: any;
  categories: Array<{
    name: string;
    count: number;
  }>;
}

const SORT_OPTIONS = [
  { value: 'rating-desc', label: 'Highest Rated' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'duration-asc', label: 'Duration: Short to Long' },
  { value: 'duration-desc', label: 'Duration: Long to Short' },
  { value: 'popularity-desc', label: 'Most Popular' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'created_at-desc', label: 'Newest First' }
];

export function EnhancedServiceCatalog() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // State
  const [services, setServices] = useState<ServiceWithDetails[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  // Enhanced filters state
  const [filters, setFilters] = useState<EnhancedFilters>({
    priceRange: [parseInt(searchParams.get('min_price') || '0'), parseInt(searchParams.get('max_price') || '500')],
    durationRange: [parseInt(searchParams.get('min_duration') || '15'), parseInt(searchParams.get('max_duration') || '240')],
    minRating: parseFloat(searchParams.get('min_rating') || '0'),
    serviceType: (searchParams.get('service_type') as 'all' | 'in_shop' | 'home_visit') || 'all',
    availabilityDate: undefined,
    availabilityType: 'all',
    sortBy: (searchParams.get('sort_by') as EnhancedFilters['sortBy']) || 'rating',
    sortOrder: (searchParams.get('sort_order') as EnhancedFilters['sortOrder']) || 'desc',
    promotionsOnly: searchParams.get('promotions_only') === 'true',
    languages: searchParams.get('languages')?.split(',') || [],
    verifiedBarbersOnly: searchParams.get('verified_only') === 'true',
    instantBooking: searchParams.get('instant_booking') === 'true',
  });
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get('category') || null
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  
  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  // Current page from URL
  const currentPage = parseInt(searchParams.get('page') || '1');
  
  // Initialize categories with counts
  useEffect(() => {
    const initialCategories = MEN_BARBER_CATEGORIES.map(cat => ({
      ...cat,
      count: 0 // Will be updated when we fetch data
    }));
    setCategories(initialCategories);
  }, []);
  
  // Update URL with current filters
  const updateURL = useCallback((newFilters: any, page = 1) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Update search
    if (debouncedSearch) {
      params.set('search', debouncedSearch);
    } else {
      params.delete('search');
    }
    
    // Update category
    if (selectedCategory) {
      params.set('category', selectedCategory);
    } else {
      params.delete('category');
    }
    
    // Update enhanced filters
    if (newFilters.priceRange && (newFilters.priceRange[0] > 0 || newFilters.priceRange[1] < 500)) {
      params.set('min_price', newFilters.priceRange[0].toString());
      params.set('max_price', newFilters.priceRange[1].toString());
    } else {
      params.delete('min_price');
      params.delete('max_price');
    }
    
    if (newFilters.durationRange && (newFilters.durationRange[0] > 15 || newFilters.durationRange[1] < 240)) {
      params.set('min_duration', newFilters.durationRange[0].toString());
      params.set('max_duration', newFilters.durationRange[1].toString());
    } else {
      params.delete('min_duration');
      params.delete('max_duration');
    }
    
    if (newFilters.minRating > 0) {
      params.set('min_rating', newFilters.minRating.toString());
    } else {
      params.delete('min_rating');
    }
    
    if (newFilters.serviceType !== 'all') {
      params.set('service_type', newFilters.serviceType);
    } else {
      params.delete('service_type');
    }
    
    if (newFilters.promotionsOnly) {
      params.set('promotions_only', 'true');
    } else {
      params.delete('promotions_only');
    }
    
    if (newFilters.verifiedBarbersOnly) {
      params.set('verified_only', 'true');
    } else {
      params.delete('verified_only');
    }
    
    if (newFilters.instantBooking) {
      params.set('instant_booking', 'true');
    } else {
      params.delete('instant_booking');
    }
    
    if (newFilters.languages.length > 0) {
      params.set('languages', newFilters.languages.join(','));
    } else {
      params.delete('languages');
    }
    
    params.set('sort_by', newFilters.sortBy);
    params.set('sort_order', newFilters.sortOrder);
    
    if (page > 1) {
      params.set('page', page.toString());
    } else {
      params.delete('page');
    }
    
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, pathname, router, debouncedSearch, selectedCategory]);
  
  // Fetch services
  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (selectedCategory) params.set('category', selectedCategory);
      if (filters.priceRange[0] > 0) params.set('min_price', filters.priceRange[0].toString());
      if (filters.priceRange[1] < 500) params.set('max_price', filters.priceRange[1].toString());
      if (filters.durationRange[0] > 15) params.set('min_duration', filters.durationRange[0].toString());
      if (filters.durationRange[1] < 240) params.set('max_duration', filters.durationRange[1].toString());
      if (filters.minRating > 0) params.set('min_rating', filters.minRating.toString());
      if (filters.serviceType !== 'all') params.set('service_type', filters.serviceType);
      if (filters.promotionsOnly) params.set('promotions_only', 'true');
      if (filters.verifiedBarbersOnly) params.set('verified_only', 'true');
      if (filters.instantBooking) params.set('instant_booking', 'true');
      if (filters.languages.length > 0) params.set('languages', filters.languages.join(','));
      params.set('sort_by', filters.sortBy);
      params.set('sort_order', filters.sortOrder);
      params.set('page', currentPage.toString());
      params.set('limit', '20');
      
      const response = await fetch(`/api/services/list?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }
      
      const data: ServiceListResponse = await response.json();
      
      setServices(data.services);
      
      // Update categories with real counts
      const updatedCategories = MEN_BARBER_CATEGORIES.map(cat => {
        const apiCategory = data.categories.find(apiCat => apiCat.name === cat.name);
        return {
          ...cat,
          count: apiCategory?.count || 0
        };
      });
      setCategories(updatedCategories);
      
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load services. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedCategory, filters, currentPage]);
  
  // Effects
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);
  
  // Handle filter changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };
  
  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    updateURL({}, 1);
  };
  
  const handleFiltersChange = (newFilters: EnhancedFilters) => {
    setFilters(newFilters);
    updateURL(newFilters, 1);
  };
  
  const clearAllFilters = () => {
    setFilters({
      priceRange: [0, 500],
      durationRange: [15, 240],
      minRating: 0,
      serviceType: 'all',
      availabilityDate: undefined,
      availabilityType: 'all',
      sortBy: 'rating',
      sortOrder: 'desc',
      promotionsOnly: false,
      languages: [],
      verifiedBarbersOnly: false,
      instantBooking: false,
    });
    setSelectedCategory(null);
    setSearchQuery('');
    router.push(pathname);
  };
  
  const handlePageChange = (page: number) => {
    updateURL(filters, page);
  };
  
  const hasActiveFilters = 
    selectedCategory ||
    searchQuery ||
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < 500 ||
    filters.durationRange[0] > 15 ||
    filters.durationRange[1] < 240 ||
    filters.minRating > 0 ||
    filters.serviceType !== 'all' ||
    filters.promotionsOnly ||
    filters.languages.length > 0 ||
    filters.verifiedBarbersOnly ||
    filters.instantBooking;
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Men's Barber Services</h1>
        <p className="text-muted-foreground">
          Discover and book professional men's grooming services in your area
        </p>
      </div>
      
      {/* Categories Section */}
      <div className="mb-8">
        <ServiceCategories
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategorySelect}
        />
      </div>
      
      {/* Search and Controls */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search services, barbers, or styles..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {selectedCategory && (
              <Badge variant="secondary" className="gap-1">
                {categories.find(c => c.id === selectedCategory)?.label}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => handleCategorySelect(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="secondary" className="gap-1">
                "{searchQuery}"
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={clearAllFilters}>
              Clear All
            </Button>
          </div>
        )}
        
        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Mobile Filter Button */}
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="sm:hidden">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription>
                    Refine your search to find the perfect service
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6">
                  <EnhancedServiceFilters
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                  />
                </div>
              </SheetContent>
            </Sheet>
            
            {/* Results Count */}
            {pagination && (
              <span className="text-sm text-muted-foreground">
                {pagination.total} service{pagination.total !== 1 ? 's' : ''} found
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Mode */}
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex gap-8">
        {/* Desktop Sidebar Filters */}
        <div className="hidden sm:block w-80 flex-shrink-0">
          <EnhancedServiceFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </div>
        
        {/* Main Content */}
        <div className="flex-1">
          {loading ? (
            <LoadingSkeleton viewMode={viewMode} />
          ) : services.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-muted-foreground mb-4">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No services found</h3>
                <p>Try adjusting your filters or search terms</p>
              </div>
              <Button onClick={clearAllFilters} variant="outline">
                Clear All Filters
              </Button>
            </Card>
          ) : (
            <>
              {/* Services Grid/List */}
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
              }>
                {services.map(service => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    viewMode={viewMode}
                    onSelect={() => setSelectedService(service.id)}
                  />
                ))}
              </div>
              
              {/* Pagination */}
              {pagination && pagination.total_pages > 1 && (
                <div className="mt-8 flex justify-center">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!pagination.has_prev}
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
                          >
                            {page}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!pagination.has_next}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Service Detail Modal */}
      {selectedService && (
        <ServiceDetailModal
          serviceId={selectedService}
          open={!!selectedService}
          onClose={() => setSelectedService(null)}
        />
      )}
    </div>
  );
} 