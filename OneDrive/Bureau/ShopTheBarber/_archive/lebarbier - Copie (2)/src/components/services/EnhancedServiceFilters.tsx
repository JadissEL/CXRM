'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X, Filter, Star, Clock, DollarSign, MapPin, Home, Building2, Languages, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface EnhancedServiceFilters {
  // Price Range
  priceRange: [number, number];
  
  // Duration
  durationRange: [number, number];
  
  // Rating
  minRating: number;
  
  // Location/Service Type
  serviceType: 'all' | 'in_shop' | 'home_visit';
  
  // Availability
  availabilityDate: Date | undefined;
  availabilityType: 'all' | 'today' | 'tomorrow' | 'custom';
  
  // Sort Options
  sortBy: 'price' | 'rating' | 'popularity' | 'duration' | 'name';
  sortOrder: 'asc' | 'desc';
  
  // Promotions
  promotionsOnly: boolean;
  
  // Languages
  languages: string[];
  
  // Additional filters
  verifiedBarbersOnly: boolean;
  instantBooking: boolean;
}

export interface EnhancedServiceFiltersProps {
  filters: EnhancedServiceFilters;
  onFiltersChange: (filters: EnhancedServiceFilters) => void;
  className?: string;
}

const DEFAULT_FILTERS: EnhancedServiceFilters = {
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
};

const AVAILABLE_LANGUAGES = [
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
];

const SORT_OPTIONS = [
  { value: 'rating-desc', label: 'Highest Rated', icon: Star },
  { value: 'price-asc', label: 'Price: Low to High', icon: DollarSign },
  { value: 'price-desc', label: 'Price: High to Low', icon: DollarSign },
  { value: 'duration-asc', label: 'Duration: Short to Long', icon: Clock },
  { value: 'duration-desc', label: 'Duration: Long to Short', icon: Clock },
  { value: 'popularity-desc', label: 'Most Popular', icon: Star },
  { value: 'name-asc', label: 'Name: A to Z', icon: Clock },
];

const DURATION_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
  { value: 240, label: '4+ hours' },
];

// Utility function to validate Select options
const validateSelectOption = (option: { value: any; label: string }) => {
  return option.value !== undefined && 
         option.value !== null && 
         option.value !== '' && 
         String(option.value).trim() !== '';
};

export function EnhancedServiceFilters({
  filters,
  onFiltersChange,
  className = ''
}: EnhancedServiceFiltersProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const updateFilters = (updates: Partial<EnhancedServiceFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const clearFilters = () => {
    console.log('Clear filters button clicked');
    onFiltersChange(DEFAULT_FILTERS);
  };

  const hasActiveFilters = 
    filters.priceRange[0] !== DEFAULT_FILTERS.priceRange[0] ||
    filters.priceRange[1] !== DEFAULT_FILTERS.priceRange[1] ||
    filters.durationRange[0] !== DEFAULT_FILTERS.durationRange[0] ||
    filters.durationRange[1] !== DEFAULT_FILTERS.durationRange[1] ||
    filters.minRating > 0 ||
    filters.serviceType !== 'all' ||
    filters.availabilityType !== 'all' ||
    filters.availabilityDate !== null ||
    filters.promotionsOnly ||
    filters.languages.length > 0 ||
    filters.verifiedBarbersOnly ||
    filters.instantBooking;

  const activeFilterCount = [
    filters.priceRange[0] !== DEFAULT_FILTERS.priceRange[0] || filters.priceRange[1] !== DEFAULT_FILTERS.priceRange[1],
    filters.durationRange[0] !== DEFAULT_FILTERS.durationRange[0] || filters.durationRange[1] !== DEFAULT_FILTERS.durationRange[1],
    filters.minRating > 0,
    filters.serviceType !== 'all',
    filters.availabilityType !== 'all' || filters.availabilityDate !== null,
    filters.promotionsOnly,
    filters.languages.length > 0,
    filters.verifiedBarbersOnly,
    filters.instantBooking,
  ].filter(Boolean).length;

  const handleLanguageToggle = (languageCode: string) => {
    const newLanguages = filters.languages.includes(languageCode)
      ? filters.languages.filter(l => l !== languageCode)
      : [...filters.languages, languageCode];
    updateFilters({ languages: newLanguages });
  };

  const handleAvailabilityChange = (type: EnhancedServiceFilters['availabilityType']) => {
        updateFilters({
      availabilityType: type,
      availabilityDate: type === 'custom' ? filters.availabilityDate : undefined
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Price Range */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Price Range (MAD)
          </h4>
          <div className="px-2">
            <Slider
              value={filters.priceRange}
              onValueChange={(value) => updateFilters({ priceRange: [value[0], value[1]] })}
              max={500}
              min={0}
              step={5}
              className="mb-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{filters.priceRange[0]} MAD</span>
              <span>{filters.priceRange[1]} MAD</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Duration */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Duration
          </h4>
          <div className="px-2">
            <Slider
              value={filters.durationRange}
              onValueChange={(value) => updateFilters({ durationRange: [value[0], value[1]] })}
              max={240}
              min={15}
              step={15}
              className="mb-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{filters.durationRange[0]} min</span>
              <span>{filters.durationRange[1]} min</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {DURATION_OPTIONS.slice(0, 4).map((option) => (
              <Button
                key={option.value}
                variant={filters.durationRange[1] === option.value ? "default" : "outline"}
                size="sm"
                className="text-xs"
                onClick={() => updateFilters({ durationRange: [15, option.value] })}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Rating */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Star className="h-4 w-4" />
            Minimum Rating
          </h4>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((rating) => (
              <Button
                key={rating}
                variant={filters.minRating >= rating ? "default" : "outline"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => updateFilters({ minRating: filters.minRating === rating ? 0 : rating })}
              >
                ★
              </Button>
            ))}
          </div>
          {filters.minRating > 0 && (
            <p className="text-xs text-muted-foreground">
              {filters.minRating}+ stars
            </p>
          )}
        </div>

        <Separator />

        {/* Service Type */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Service Type
          </h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="service-all"
                checked={filters.serviceType === 'all'}
                onCheckedChange={() => updateFilters({ serviceType: 'all' })}
              />
              <label htmlFor="service-all" className="text-sm cursor-pointer">
                All Services
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="service-in-shop"
                checked={filters.serviceType === 'in_shop'}
                onCheckedChange={() => updateFilters({ serviceType: 'in_shop' })}
              />
              <label htmlFor="service-in-shop" className="text-sm cursor-pointer flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                In-Barbershop Only
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="service-home"
                checked={filters.serviceType === 'home_visit'}
                onCheckedChange={() => updateFilters({ serviceType: 'home_visit' })}
              />
              <label htmlFor="service-home" className="text-sm cursor-pointer flex items-center gap-2">
                <Home className="h-4 w-4" />
                Home Visit Only
              </label>
            </div>
          </div>
        </div>

        <Separator />

        {/* Availability */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Availability
          </h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="availability-all"
                checked={filters.availabilityType === 'all'}
                onCheckedChange={() => handleAvailabilityChange('all')}
              />
              <label htmlFor="availability-all" className="text-sm cursor-pointer">
                Any Time
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="availability-today"
                checked={filters.availabilityType === 'today'}
                onCheckedChange={() => handleAvailabilityChange('today')}
              />
              <label htmlFor="availability-today" className="text-sm cursor-pointer">
                Available Today
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="availability-tomorrow"
                checked={filters.availabilityType === 'tomorrow'}
                onCheckedChange={() => handleAvailabilityChange('tomorrow')}
              />
              <label htmlFor="availability-tomorrow" className="text-sm cursor-pointer">
                Available Tomorrow
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="availability-custom"
                checked={filters.availabilityType === 'custom'}
                onCheckedChange={() => handleAvailabilityChange('custom')}
              />
              <label htmlFor="availability-custom" className="text-sm cursor-pointer">
                Custom Date
              </label>
            </div>
            
            {filters.availabilityType === 'custom' && (
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.availabilityDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.availabilityDate ? format(filters.availabilityDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.availabilityDate}
                    onSelect={(date) => {
                      updateFilters({ availabilityDate: date });
                      setIsCalendarOpen(false);
                    }}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>

        <Separator />

        {/* Sort Options */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Sort By</h4>
          <Select 
            value={`${filters.sortBy}-${filters.sortOrder}`} 
            onValueChange={(value) => {
              const [sortBy, sortOrder] = value.split('-') as [EnhancedServiceFilters['sortBy'], EnhancedServiceFilters['sortOrder']];
              updateFilters({ sortBy, sortOrder });
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.filter(validateSelectOption).map(option => {
                const IconComponent = option.icon;
                return (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4" />
                      {option.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Promotions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <h4 className="font-medium text-sm">Promotions Only</h4>
            </div>
            <Switch
              checked={filters.promotionsOnly}
              onCheckedChange={(checked) => updateFilters({ promotionsOnly: checked })}
            />
          </div>
          {filters.promotionsOnly && (
            <p className="text-xs text-muted-foreground">
              Show only discounted or promotional services
            </p>
          )}
        </div>

        <Separator />

        {/* Languages */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Languages className="h-4 w-4" />
            Languages Spoken
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {AVAILABLE_LANGUAGES.map((language) => (
              <div key={language.code} className="flex items-center space-x-2">
                <Checkbox
                  id={`lang-${language.code}`}
                  checked={filters.languages.includes(language.code)}
                  onCheckedChange={() => handleLanguageToggle(language.code)}
                />
                <label htmlFor={`lang-${language.code}`} className="text-sm cursor-pointer flex items-center gap-1">
                  <span>{language.flag}</span>
                  {language.name}
                </label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Additional Filters */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Additional Filters</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm cursor-pointer">Verified Barbers Only</label>
              <Switch
                checked={filters.verifiedBarbersOnly}
                onCheckedChange={(checked) => updateFilters({ verifiedBarbersOnly: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm cursor-pointer">Instant Booking Available</label>
              <Switch
                checked={filters.instantBooking}
                onCheckedChange={(checked) => updateFilters({ instantBooking: checked })}
              />
            </div>
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <>
            <Separator />
            <Button variant="outline" onClick={clearFilters} className="w-full">
              <X className="h-4 w-4 mr-2" />
              Clear All Filters
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Active filters display component
export function ActiveFiltersDisplay({
  filters,
  onRemoveFilter
}: {
  filters: EnhancedServiceFilters;
  onRemoveFilter: (filterKey: keyof EnhancedServiceFilters) => void;
}) {
  const activeFilters = [];

  if (filters.priceRange[0] !== DEFAULT_FILTERS.priceRange[0] || filters.priceRange[1] !== DEFAULT_FILTERS.priceRange[1]) {
    activeFilters.push({
      key: 'priceRange' as keyof EnhancedServiceFilters,
      label: `${filters.priceRange[0]}-${filters.priceRange[1]} MAD`,
      icon: DollarSign
    });
  }

  if (filters.minRating > 0) {
    activeFilters.push({
      key: 'minRating' as keyof EnhancedServiceFilters,
      label: `${filters.minRating}+ ★`,
      icon: Star
    });
  }

  if (filters.serviceType !== 'all') {
    activeFilters.push({
      key: 'serviceType' as keyof EnhancedServiceFilters,
      label: filters.serviceType === 'in_shop' ? 'In-Shop Only' : 'Home Visit Only',
      icon: MapPin
    });
  }

  if (filters.promotionsOnly) {
    activeFilters.push({
      key: 'promotionsOnly' as keyof EnhancedServiceFilters,
      label: 'Promotions Only',
      icon: Tag
    });
  }

  if (filters.languages.length > 0) {
    activeFilters.push({
      key: 'languages' as keyof EnhancedServiceFilters,
      label: `${filters.languages.length} language${filters.languages.length > 1 ? 's' : ''}`,
      icon: Languages
    });
  }

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {activeFilters.map((filter) => {
        const IconComponent = filter.icon;
        return (
          <Badge key={filter.key} variant="secondary" className="gap-1">
            <IconComponent className="h-3 w-3" />
            <span>{filter.label}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={() => onRemoveFilter(filter.key)}
              aria-label={`Remove ${filter.label} filter`}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        );
      })}
    </div>
  );
} 