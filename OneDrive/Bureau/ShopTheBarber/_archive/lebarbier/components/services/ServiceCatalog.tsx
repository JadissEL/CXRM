'use client';

import React from 'react';
const { useState, useEffect, useCallback } = React;
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { Search, Filter, Star as Grid, Star as List, Star, Clock, Star as DollarSign, MapPin, Heart, ArrowRight as ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useDebounce } from '@/hooks/useDebounce';
import { ServiceCard } from './ServiceCard';
import { ServiceDetailModal } from './ServiceDetailModal';
import { LoadingSkeleton } from './LoadingSkeleton';

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

interface ServiceFilters {
  search: string;
  category: string;
  barber_id: string;
  min_price: number;
  max_price: number;
  min_duration: number;
  max_duration: number;
  sort_by: 'name' | 'price' | 'duration' | 'rating' | 'created_at';
  sort_order: 'asc' | 'desc';
}

const CATEGORY_LABELS: Record<string, string> = {
  haircut: 'Haircuts',
  beard_trim: 'Beard Trim',
  shave: 'Shaving',
  styling: 'Styling',
  coloring: 'Coloring',
  treatment: 'Treatments',
  consultation: 'Consultation',
  package: 'Packages',
  other: 'Other'
};

const SORT_OPTIONS = [
  { value: 'rating-desc', label: 'Highest Rated' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'duration-asc', label: 'Duration: Short to Long' },
  { value: 'duration-desc', label: 'Duration: Long to Short' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'created_at-desc', label: 'Newest First' }
];

export function ServiceCatalog() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // State
  const [services, setServices] = useState<ServiceWithDetails[]>([]);
  const [categories, setCategories] = useState<Array<{ name: string; count: number }>>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState<ServiceFilters>({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    barber_id: searchParams.get('barber_id') || '',
    min_price: parseInt(searchParams.get('min_price') || '0'),
    max_price: parseInt(searchParams.get('max_price') || '500'),
    min_duration: parseInt(searchParams.get('min_duration') || '0'),
    max_duration: parseInt(searchParams.get('max_duration') || '300'),
    sort_by: (searchParams.get('sort_by') as ServiceFilters['sort_by']) || 'rating',
    sort_order: (searchParams.get('sort_order') as ServiceFilters['sort_order']) || 'desc'
  });
  
  const [priceRange, setPriceRange] = useState([filters.min_price, filters.max_price]);
  const [durationRange, setDurationRange] = useState([filters.min_duration, filters.max_duration]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    filters.category ? [filters.category] : []
  );
  
  // Debounced search
  const debouncedSearch = useDebounce(filters.search, 300);
  
  // Current page from URL
  const currentPage = parseInt(searchParams.get('page') || '1');
  
  // Update URL with current filters
  const updateURL = useCallback((newFilters: Partial<ServiceFilters>, page = 1) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== '' && value !== 0) {
        params.set(key, value.toString());
      } else {
        params.delete(key);
      }
    });
    
    if (page > 1) {
      params.set('page', page.toString());
    } else {
      params.delete('page');
    }
    
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, pathname, router]);
  
  // Fetch services
  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (selectedCategories.length === 1) params.set('category', selectedCategories[0]);
      if (filters.barber_id) params.set('barber_id', filters.barber_id);
      if (priceRange[0] > 0) params.set('min_price', priceRange[0].toString());
      if (priceRange[1] < 500) params.set('max_price', priceRange[1].toString());
      if (durationRange[0] > 0) params.set('min_duration', durationRange[0].toString());
      if (durationRange[1] < 300) params.set('max_duration', durationRange[1].toString());
      params.set('sort_by', filters.sort_by);
      params.set('sort_order', filters.sort_order);
      params.set('page', currentPage.toString());
      params.set('limit', '20');
      
      const response = await fetch(`/api/services/list?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }
      
      const data: ServiceListResponse = await response.json();
      
      setServices(data.services);
      setCategories(data.categories);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load services. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedCategories, filters.barber_id, priceRange, durationRange, filters.sort_by, filters.sort_order, currentPage]);
  
  // Effects
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);
  
  // Handle filter changes
  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    updateURL({ search: value });
  };
  
  const handleCategoryChange = (category: string, checked: boolean) => {
    let newCategories: string[];
    if (checked) {
      newCategories = [category]; // Single selection for now
    } else {
      newCategories = selectedCategories.filter(c => c !== category);
    }
    
    setSelectedCategories(newCategories);
    updateURL({ category: newCategories[0] || '' });
  };
  
  const handleSortChange = (value: string) => {
    const [sort_by, sort_order] = value.split('-') as [ServiceFilters['sort_by'], ServiceFilters['sort_order']];
    setFilters(prev => ({ ...prev, sort_by, sort_order }));
    updateURL({ sort_by, sort_order });
  };
  
  const handlePriceRangeChange = (value: number[]) => {
    setPriceRange(value);
    setFilters(prev => ({ ...prev, min_price: value[0], max_price: value[1] }));
    updateURL({ min_price: value[0], max_price: value[1] });
  };
  
  const handleDurationRangeChange = (value: number[]) => {
    setDurationRange(value);
    setFilters(prev => ({ ...prev, min_duration: value[0], max_duration: value[1] }));
    updateURL({ min_duration: value[0], max_duration: value[1] });
  };
  
  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      barber_id: '',
      min_price: 0,
      max_price: 500,
      min_duration: 0,
      max_duration: 300,
      sort_by: 'rating',
      sort_order: 'desc'
    });
    setPriceRange([0, 500]);
    setDurationRange([0, 300]);
    setSelectedCategories([]);
    router.push(pathname);
  };
  
  const handlePageChange = (page: number) => {
    updateURL({}, page);
  };
  
  // Filter panel component
  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-semibold mb-3">Categories</h3>
        <div className="space-y-2">
          {categories.map(category => (
            <div key={category.name} className="flex items-center space-x-2">
              <Checkbox
                id={category.name}
                checked={selectedCategories.includes(category.name)}
                onCheckedChange={(checked) => handleCategoryChange(category.name, checked as boolean)}
              />
              <label htmlFor={category.name} className="text-sm flex-1 cursor-pointer">
                {CATEGORY_LABELS[category.name] || category.name}
              </label>
              <span className="text-xs text-muted-foreground">({category.count})</span>
            </div>
          ))}
        </div>
      </div>
      
      <Separator />
      
      {/* Price Range */}
      <div>
        <h3 className="font-semibold mb-3">Price Range</h3>
        <div className="px-2">
          <Slider
            value={priceRange}
            onValueChange={handlePriceRangeChange}
            max={500}
            min={0}
            step={5}
            className="mb-2"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>${priceRange[0]}</span>
            <span>${priceRange[1]}</span>
          </div>
        </div>
      </div>
      
      <Separator />
      
      {/* Duration Range */}
      <div>
        <h3 className="font-semibold mb-3">Duration (minutes)</h3>
        <div className="px-2">
          <Slider
            value={durationRange}
            onValueChange={handleDurationRangeChange}
            max={300}
            min={0}
            step={15}
            className="mb-2"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{durationRange[0]}m</span>
            <span>{durationRange[1]}m</span>
          </div>
        </div>
      </div>
      
      <Separator />
      
      {/* Clear Filters */}
      <Button variant="outline" onClick={clearFilters} className="w-full">
        Clear All Filters
      </Button>
    </div>
  );
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Service Catalog</h1>
        <p className="text-muted-foreground">
          Discover and book professional barber services in your area
        </p>
      </div>
      
      {/* Search and Controls */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search services..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
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
                  <FilterPanel />
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
            {/* Sort */}
            <Select value={`${filters.sort_by}-${filters.sort_order}`} onValueChange={handleSortChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
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
        <div className="hidden sm:block w-64 flex-shrink-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <FilterPanel />
            </CardContent>
          </Card>
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
              <Button onClick={clearFilters} variant="outline">
                Clear Filters
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