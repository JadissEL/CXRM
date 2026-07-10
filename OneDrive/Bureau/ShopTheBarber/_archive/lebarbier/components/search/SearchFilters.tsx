'use client';

import React from 'react';
const { useState, useEffect } = React;
import { CalendarDays, Clock, MapPin, Star, Star as DollarSign, Star as Languages, Star as Smartphone, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

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

interface SearchFiltersProps {
  filters: SearchFilters;
  onFilterChange: (key: keyof SearchFilters, value: any) => void;
  userLocation?: { lat: number; lng: number } | null;
}

const SERVICE_CATEGORIES = [
  { value: 'haircut', label: 'Haircut', icon: '✂️' },
  { value: 'beard_trim', label: 'Beard Trim', icon: '🧔' },
  { value: 'shave', label: 'Shave', icon: '🪒' },
  { value: 'styling', label: 'Styling', icon: '💇' },
  { value: 'coloring', label: 'Coloring', icon: '🎨' },
  { value: 'treatment', label: 'Treatment', icon: '💆' },
  { value: 'consultation', label: 'Consultation', icon: '💬' },
  { value: 'package', label: 'Package', icon: '📦' }
];

const SPECIALTIES = [
  'Classic Cuts', 'Modern Styles', 'Beard Specialist', 'Fade Expert',
  'Straight Razor', 'Hair Washing', 'Scalp Treatment', 'Wedding Prep',
  'Kids Cuts', 'Senior Cuts', 'Curly Hair', 'Textured Hair'
];

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Arabic', 'Chinese', 'Japanese', 'Korean', 'Russian', 'Hindi'
];

const PRICE_RANGES = [
  { value: '$', label: '$ (Under $30)', min: 0, max: 30 },
  { value: '$$', label: '$$ ($30-60)', min: 30, max: 60 },
  { value: '$$$', label: '$$$ ($60-100)', min: 60, max: 100 },
  { value: '$$$$', label: '$$$$ ($100+)', min: 100, max: 500 }
];

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
];

export default function SearchFilters({ filters, onFilterChange, userLocation }: SearchFiltersProps) {
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(
    filters.specialties ? filters.specialties.split(',') : []
  );
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    filters.languages ? filters.languages.split(',') : []
  );
  const [customLocation, setCustomLocation] = useState(filters.location || '');
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.min_price || 0,
    filters.max_price || 500
  ]);

  // Update specialties filter when selection changes
  useEffect(() => {
    onFilterChange('specialties', selectedSpecialties.length > 0 ? selectedSpecialties.join(',') : undefined);
  }, [selectedSpecialties, onFilterChange]);

  // Update languages filter when selection changes
  useEffect(() => {
    onFilterChange('languages', selectedLanguages.length > 0 ? selectedLanguages.join(',') : undefined);
  }, [selectedLanguages, onFilterChange]);

  // Update price range filters
  useEffect(() => {
    onFilterChange('min_price', priceRange[0]);
    onFilterChange('max_price', priceRange[1]);
  }, [priceRange, onFilterChange]);

  const handleSpecialtyToggle = (specialty: string) => {
    setSelectedSpecialties(prev => 
      prev.includes(specialty)
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  };

  const handleLanguageToggle = (language: string) => {
    setSelectedLanguages(prev => 
      prev.includes(language)
        ? prev.filter(l => l !== language)
        : [...prev, language]
    );
  };

  const handleLocationSearch = async () => {
    if (!customLocation.trim()) return;
    
    try {
      // Use a geocoding service to convert address to coordinates
      // For now, we'll just update the location filter
      onFilterChange('location', customLocation);
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  const clearAllFilters = () => {
    setSelectedSpecialties([]);
    setSelectedLanguages([]);
    setCustomLocation('');
    setPriceRange([0, 500]);
    
    // Reset all filters to defaults
    const defaultFilters: SearchFilters = {
      radius: 25,
      sort_by: 'distance',
      sort_order: 'asc'
    };
    
    Object.entries(defaultFilters).forEach(([key, value]) => {
      onFilterChange(key as keyof SearchFilters, value);
    });
    
    // Clear other filters
    ['location', 'category', 'service', 'date', 'time', 'min_rating', 'price_range', 
     'specialties', 'languages', 'mobile_service', 'verified_only'].forEach(key => {
      onFilterChange(key as keyof SearchFilters, undefined);
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.category) count++;
    if (filters.service) count++;
    if (filters.date) count++;
    if (filters.time) count++;
    if (filters.min_rating && filters.min_rating > 0) count++;
    if (filters.price_range) count++;
    if (selectedSpecialties.length > 0) count++;
    if (selectedLanguages.length > 0) count++;
    if (filters.mobile_service) count++;
    if (filters.verified_only) count++;
    if (customLocation) count++;
    return count;
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Search Filters</CardTitle>
          <div className="flex items-center gap-2">
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary">
                {getActiveFiltersCount()} active
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear All
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Location & Radius */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Location & Distance</Label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location" className="text-xs text-muted-foreground">
                Custom Location
              </Label>
              <div className="flex gap-2">
                <Input
                  id="location"
                  placeholder="Enter city, address, or ZIP"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch()}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLocationSearch}
                  disabled={!customLocation.trim()}
                >
                  Search
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Search Radius: {filters.radius || 25} km
              </Label>
              <Slider
                value={[filters.radius || 25]}
                onValueChange={([value]) => onFilterChange('radius', value)}
                max={100}
                min={1}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 km</span>
                <span>100 km</span>
              </div>
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Service Categories */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="h-4 w-4 rounded-full" />
            <Label className="text-sm font-medium">Service Category</Label>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {SERVICE_CATEGORIES.map((category) => (
              <Button
                key={category.value}
                variant={filters.category === category.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFilterChange('category', 
                  filters.category === category.value ? undefined : category.value
                )}
                className="justify-start h-auto p-3"
              >
                <span className="mr-2">{category.icon}</span>
                <span className="text-xs">{category.label}</span>
              </Button>
            ))}
          </div>
        </div>
        
        <Separator />
        
        {/* Date & Time */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Availability</Label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-xs text-muted-foreground">
                Preferred Date
              </Label>
              <Input
                id="date"
                type="date"
                value={filters.date || ''}
                onChange={(e) => onFilterChange('date', e.target.value || undefined)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Preferred Time
              </Label>
              <Select
                value={filters.time || ''}
                onValueChange={(value) => onFilterChange('time', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any time</SelectItem>
                  {TIME_SLOTS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Rating & Price */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Quality & Price</Label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Minimum Rating: {filters.min_rating || 0}★
              </Label>
              <Slider
                value={[filters.min_rating || 0]}
                onValueChange={([value]) => onFilterChange('min_rating', value)}
                max={5}
                min={0}
                step={0.5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Any rating</span>
                <span>5★ only</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Price Range: ${priceRange[0]} - ${priceRange[1]}
              </Label>
              <Slider
                value={priceRange}
                onValueChange={setPriceRange}
                max={500}
                min={0}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>$0</span>
                <span>$500+</span>
              </div>
            </div>
          </div>
          
          {/* Quick Price Range Buttons */}
          <div className="flex flex-wrap gap-2">
            {PRICE_RANGES.map((range) => (
              <Button
                key={range.value}
                variant={filters.price_range === range.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  onFilterChange('price_range', 
                    filters.price_range === range.value ? undefined : range.value
                  );
                  if (filters.price_range !== range.value) {
                    setPriceRange([range.min, range.max]);
                  }
                }}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
        
        <Separator />
        
        {/* Specialties */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="h-4 w-4 rounded-full" />
            <Label className="text-sm font-medium">Specialties</Label>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {SPECIALTIES.map((specialty) => (
              <div key={specialty} className="flex items-center space-x-2">
                <Checkbox
                  id={`specialty-${specialty}`}
                  checked={selectedSpecialties.includes(specialty)}
                  onCheckedChange={() => handleSpecialtyToggle(specialty)}
                />
                <Label
                  htmlFor={`specialty-${specialty}`}
                  className="text-xs cursor-pointer"
                >
                  {specialty}
                </Label>
              </div>
            ))}
          </div>
        </div>
        
        <Separator />
        
        {/* Languages */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Languages</Label>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {LANGUAGES.map((language) => (
              <div key={language} className="flex items-center space-x-2">
                <Checkbox
                  id={`language-${language}`}
                  checked={selectedLanguages.includes(language)}
                  onCheckedChange={() => handleLanguageToggle(language)}
                />
                <Label
                  htmlFor={`language-${language}`}
                  className="text-xs cursor-pointer"
                >
                  {language}
                </Label>
              </div>
            ))}
          </div>
        </div>
        
        <Separator />
        
        {/* Additional Options */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Additional Options</Label>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="mobile-service" className="text-sm">
                  Mobile Service Available
                </Label>
              </div>
              <Switch
                id="mobile-service"
                checked={filters.mobile_service || false}
                onCheckedChange={(checked) => onFilterChange('mobile_service', checked || undefined)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="verified-only" className="text-sm">
                  Verified Barbers Only
                </Label>
              </div>
              <Switch
                id="verified-only"
                checked={filters.verified_only || false}
                onCheckedChange={(checked) => onFilterChange('verified_only', checked || undefined)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}