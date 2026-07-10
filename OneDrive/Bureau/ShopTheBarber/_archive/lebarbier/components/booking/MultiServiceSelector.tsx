'use client';

import React from 'react';
const { useState, useEffect } = React;
import { Search, Plus, Star as Minus, Clock, Star as DollarSign, Star as Tag, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/lib/supabase';

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
  image_url?: string;
  is_popular?: boolean;
  rating?: number;
  review_count?: number;
}

interface SelectedService extends Service {
  quantity: number;
}

interface MultiServiceSelectorProps {
  barberId: string;
  selectedServices: SelectedService[];
  onServicesChange: (services: SelectedService[]) => void;
  maxServices?: number;
  showCategories?: boolean;
}

const SERVICE_CATEGORIES = [
  'All',
  'Haircut',
  'Beard',
  'Styling',
  'Treatment',
  'Coloring',
  'Special'
];

export default function MultiServiceSelector({
  barberId,
  selectedServices,
  onServicesChange,
  maxServices = 5,
  showCategories = true
}: MultiServiceSelectorProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCompatibilityWarning, setShowCompatibilityWarning] = useState(false);



  // Calculate totals
  const totalDuration = selectedServices.reduce((sum, service) => sum + (service.duration * service.quantity), 0);
  const totalPrice = selectedServices.reduce((sum, service) => sum + (service.price * service.quantity), 0);
  const totalItems = selectedServices.reduce((sum, service) => sum + service.quantity, 0);

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('services')
          .select('*')
          .eq('barber_id', barberId)
          .eq('is_active', true)
          .order('is_popular', { ascending: false })
          .order('name');

        if (fetchError) {
          throw new Error('Failed to fetch services');
        }

        setServices(data || []);
      } catch (err) {
        console.error('Error fetching services:', err);
        setError(err instanceof Error ? err.message : 'Failed to load services');
      } finally {
        setLoading(false);
      }
    };

    if (barberId) {
      fetchServices();
    }
  }, [barberId, supabase]);

  // Filter services based on search and category
  useEffect(() => {
    let filtered = services;

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(service => service.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(service => 
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredServices(filtered);
  }, [services, searchTerm, selectedCategory]);

  // Check for service compatibility
  useEffect(() => {
    const hasIncompatibleServices = selectedServices.some(service => {
      // Example: Hair coloring might not be compatible with certain treatments
      const coloringServices = selectedServices.filter(s => s.category === 'Coloring');
      const treatmentServices = selectedServices.filter(s => s.category === 'Treatment');
      
      return coloringServices.length > 0 && treatmentServices.length > 0;
    });

    setShowCompatibilityWarning(hasIncompatibleServices);
  }, [selectedServices]);

  const getSelectedQuantity = (serviceId: string): number => {
    const selected = selectedServices.find(s => s.id === serviceId);
    return selected ? selected.quantity : 0;
  };

  const addService = (service: Service) => {
    if (totalItems >= maxServices) {
      return;
    }

    const existingIndex = selectedServices.findIndex(s => s.id === service.id);
    
    if (existingIndex >= 0) {
      // Increase quantity
      const updated = [...selectedServices];
      updated[existingIndex].quantity += 1;
      onServicesChange(updated);
    } else {
      // Add new service
      onServicesChange([...selectedServices, { ...service, quantity: 1 }]);
    }
  };

  const removeService = (serviceId: string) => {
    const existingIndex = selectedServices.findIndex(s => s.id === serviceId);
    
    if (existingIndex >= 0) {
      const updated = [...selectedServices];
      
      if (updated[existingIndex].quantity > 1) {
        // Decrease quantity
        updated[existingIndex].quantity -= 1;
      } else {
        // Remove service completely
        updated.splice(existingIndex, 1);
      }
      
      onServicesChange(updated);
    }
  };

  const toggleService = (service: Service) => {
    const isSelected = selectedServices.some(s => s.id === service.id);
    
    if (isSelected) {
      removeService(service.id);
    } else {
      addService(service);
    }
  };

  const clearAllServices = () => {
    onServicesChange([]);
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select Services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Service Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Select Services</span>
            <Badge variant="outline">
              {totalItems}/{maxServices} selected
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {showCategories && (
              <div className="flex flex-wrap gap-2">
                {SERVICE_CATEGORIES.map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Compatibility Warning */}
          {showCompatibilityWarning && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Some selected services may not be compatible. Please consult with your barber.
              </AlertDescription>
            </Alert>
          )}

          {/* Services List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredServices.map(service => {
              const quantity = getSelectedQuantity(service.id);
              const isSelected = quantity > 0;
              const canAdd = totalItems < maxServices || isSelected;

              return (
                <div
                  key={service.id}
                  className={`border rounded-lg p-4 transition-all ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleService(service)}
                        disabled={!canAdd && !isSelected}
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{service.name}</h4>
                          {service.is_popular && (
                            <Badge variant="secondary" className="text-xs">
                              Popular
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1">
                          {service.description}
                        </p>
                        
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Clock className="h-3 w-3" />
                            {formatDuration(service.duration)}
                          </div>
                          
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <DollarSign className="h-3 w-3" />
                            ${service.price}
                          </div>
                          
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Tag className="h-3 w-3" />
                            {service.category}
                          </div>
                          
                          {service.rating && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {service.rating.toFixed(1)}
                              {service.review_count && (
                                <span>({service.review_count})</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {isSelected && (
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeService(service.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        
                        <span className="min-w-[2rem] text-center font-medium">
                          {quantity}
                        </span>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addService(service)}
                          disabled={totalItems >= maxServices}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredServices.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No services found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Services Summary */}
      {selectedServices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Selected Services</span>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllServices}
              >
                Clear All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {selectedServices.map(service => (
                <div key={service.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{service.name}</div>
                    <div className="text-sm text-gray-600">
                      {formatDuration(service.duration)} • ${service.price}
                      {service.quantity > 1 && ` × ${service.quantity}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      ${(service.price * service.quantity).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDuration(service.duration * service.quantity)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Duration:</span>
                <span className="font-medium">{formatDuration(totalDuration)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Price:</span>
                <span className="font-medium text-lg">${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}