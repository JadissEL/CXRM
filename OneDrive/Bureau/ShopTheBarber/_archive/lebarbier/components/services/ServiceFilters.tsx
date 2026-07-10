'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

export interface ServiceFilters {
  categories: string[];
  priceRange: [number, number];
  durationRange: [number, number];
  rating: number;
  barberId?: string;
}

interface ServiceFiltersProps {
  filters: ServiceFilters;
  onFiltersChange: (filters: ServiceFilters) => void;
  categories: Array<{ id: string; name: string; count: number }>;
  priceRange: [number, number];
  durationRange: [number, number];
  className?: string;
}

const DEFAULT_FILTERS: ServiceFilters = {
  categories: [],
  priceRange: [0, 500],
  durationRange: [15, 240],
  rating: 0,
};

export function ServiceFilters({
  filters,
  onFiltersChange,
  categories,
  priceRange,
  durationRange,
  className,
}: ServiceFiltersProps) {
  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    const newCategories = checked
      ? [...filters.categories, categoryId]
      : filters.categories.filter(id => id !== categoryId);
    
    onFiltersChange({
      ...filters,
      categories: newCategories,
    });
  };

  const handlePriceRangeChange = (value: number[]) => {
    onFiltersChange({
      ...filters,
      priceRange: [value[0], value[1]],
    });
  };

  const handleDurationRangeChange = (value: number[]) => {
    onFiltersChange({
      ...filters,
      durationRange: [value[0], value[1]],
    });
  };

  const handleRatingChange = (rating: number) => {
    onFiltersChange({
      ...filters,
      rating: filters.rating === rating ? 0 : rating,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      ...DEFAULT_FILTERS,
      priceRange,
      durationRange,
    });
  };

  const hasActiveFilters = 
    filters.categories.length > 0 ||
    filters.priceRange[0] !== priceRange[0] ||
    filters.priceRange[1] !== priceRange[1] ||
    filters.durationRange[0] !== durationRange[0] ||
    filters.durationRange[1] !== durationRange[1] ||
    filters.rating > 0;

  const activeFilterCount = 
    filters.categories.length +
    (filters.priceRange[0] !== priceRange[0] || filters.priceRange[1] !== priceRange[1] ? 1 : 0) +
    (filters.durationRange[0] !== durationRange[0] || filters.durationRange[1] !== durationRange[1] ? 1 : 0) +
    (filters.rating > 0 ? 1 : 0);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Categories */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Categories</h4>
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={filters.categories.includes(category.id)}
                    onCheckedChange={(checked) => 
                      handleCategoryChange(category.id, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={`category-${category.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {category.name}
                  </label>
                </div>
                <span className="text-xs text-muted-foreground">
                  ({category.count})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Price Range</h4>
          <div className="px-2">
            <Slider
              value={filters.priceRange}
              onValueChange={handlePriceRangeChange}
              max={priceRange[1]}
              min={priceRange[0]}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>${filters.priceRange[0]}</span>
              <span>${filters.priceRange[1]}</span>
            </div>
          </div>
        </div>

        {/* Duration Range */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Duration (minutes)</h4>
          <div className="px-2">
            <Slider
              value={filters.durationRange}
              onValueChange={handleDurationRangeChange}
              max={durationRange[1]}
              min={durationRange[0]}
              step={15}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>{filters.durationRange[0]}m</span>
              <span>{filters.durationRange[1]}m</span>
            </div>
          </div>
        </div>

        {/* Rating Filter */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Minimum Rating</h4>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((rating) => (
              <Button
                key={rating}
                variant={filters.rating >= rating ? "default" : "outline"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleRatingChange(rating)}
              >
                ★
              </Button>
            ))}
          </div>
          {filters.rating > 0 && (
            <p className="text-xs text-muted-foreground">
              {filters.rating}+ stars
            </p>
          )}
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Active Filters</h4>
            <div className="flex flex-wrap gap-2">
              {filters.categories.map((categoryId) => {
                const category = categories.find(c => c.id === categoryId);
                return category ? (
                  <Badge key={categoryId} variant="secondary" className="text-xs">
                    {category.name}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                      onClick={() => handleCategoryChange(categoryId, false)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ) : null;
              })}
              
              {(filters.priceRange[0] !== priceRange[0] || filters.priceRange[1] !== priceRange[1]) && (
                <Badge variant="secondary" className="text-xs">
                  ${filters.priceRange[0]} - ${filters.priceRange[1]}
                </Badge>
              )}
              
              {(filters.durationRange[0] !== durationRange[0] || filters.durationRange[1] !== durationRange[1]) && (
                <Badge variant="secondary" className="text-xs">
                  {filters.durationRange[0]}m - {filters.durationRange[1]}m
                </Badge>
              )}
              
              {filters.rating > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {filters.rating}+ ★
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                    onClick={() => handleRatingChange(0)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="w-full"
          >
            Clear All Filters
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Mobile filter sheet component
export function MobileServiceFilters({
  filters,
  onFiltersChange,
  categories,
  priceRange,
  durationRange,
}: Omit<ServiceFiltersProps, 'className'>) {
  return (
    <div className="p-4 space-y-6 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filters</h3>
      </div>
      
      <ServiceFilters
        filters={filters}
        onFiltersChange={onFiltersChange}
        categories={categories}
        priceRange={priceRange}
        durationRange={durationRange}
      />
    </div>
  );
}