import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { ScrollArea } from '../components/ui/scroll-area';
import { Skeleton } from '../components/ui/skeleton';
import { useToast } from '../hooks/use-toast';
import { UserNav } from '../components/UserNav';
import { useAuth } from '../hooks/useAuth';
import BookingModal from '../components/BookingModal';
import MoroccanPattern from '../components/ui/MoroccanPattern';
import { 
  Search as SearchIcon, 
  MapPin, 
  Star, 
  Filter, 
  Navigation, 
  Clock, 
  Home, 
  Building,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp,
  Map,
  Users,
  Award,
  Zap
} from 'lucide-react';
import { searchAPI } from '../../shared/api';

interface SearchFilters {
  query: string;
  location: string;
  latitude?: number;
  longitude?: number;
  maxDistance: number;
  minRating: number;
  maxRating: number;
  serviceCategory: string;
  acceptsHome: boolean | null;
  acceptsShop: boolean | null;
  isVerified: boolean | null;
  sortBy: 'rating' | 'distance' | 'name' | 'review_count';
  sortOrder: 'ASC' | 'DESC';
}

export default function Search() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  
  const [selectedBarber, setSelectedBarber] = useState<any>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Initialize filters from URL params
  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get('q') || '',
    location: searchParams.get('location') || '',
    maxDistance: parseInt(searchParams.get('maxDistance') || '50'),
    minRating: parseFloat(searchParams.get('minRating') || '0'),
    maxRating: parseFloat(searchParams.get('maxRating') || '5'),
    serviceCategory: searchParams.get('serviceCategory') || '',
    acceptsHome: searchParams.get('acceptsHome') ? searchParams.get('acceptsHome') === 'true' : null,
    acceptsShop: searchParams.get('acceptsShop') ? searchParams.get('acceptsShop') === 'true' : null,
    isVerified: searchParams.get('isVerified') ? searchParams.get('isVerified') === 'true' : null,
    sortBy: (searchParams.get('sortBy') as any) || 'rating',
    sortOrder: (searchParams.get('sortOrder') as any) || 'DESC',
  });

  // Get user's current location
  const getCurrentLocation = useCallback(() => {
    setIsLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          setFilters(prev => ({
            ...prev,
            latitude,
            longitude
          }));
          setIsLoadingLocation(false);
          toast({
            title: "Localisation obtenue",
            description: "Votre position a été détectée avec succès.",
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          setIsLoadingLocation(false);
          toast({
            title: "Erreur de localisation",
            description: "Impossible d'obtenir votre position. Vérifiez les permissions.",
            variant: "destructive",
          });
        }
      );
    } else {
      setIsLoadingLocation(false);
      toast({
        title: "Géolocalisation non supportée",
        description: "Votre navigateur ne supporte pas la géolocalisation.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params.set(key, String(value));
      }
    });
    setSearchParams(params);
  }, [filters, setSearchParams]);

  // Fetch service categories
  const { data: serviceCategories = [] } = useQuery({
    queryKey: ['serviceCategories'],
    queryFn: async () => {
      const response = await searchAPI.getServiceCategories();
      return response.data || [];
    },
  });

  // Fetch popular search terms
  const { data: popularTerms = [] } = useQuery({
    queryKey: ['popularTerms'],
    queryFn: async () => {
      const response = await searchAPI.getPopularSearchTerms(8);
      return response.data || [];
    },
  });

  // Infinite query for barber search
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error
  } = useInfiniteQuery({
    queryKey: ['barberSearch', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await searchAPI.searchBarbers({
        ...filters,
        page: pageParam,
        limit: 12
      });
      return response.data || { barbers: [], total: 0, page: 1, limit: 12, hasMore: false };
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.page + 1 : undefined;
    },
    enabled: filters.query.length > 0 || filters.location.length > 0 || userLocation !== null,
  });

  const allBarbers = data?.pages.flatMap(page => page.barbers) || [];

  // Handle filter changes
  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handle search
  const handleSearch = (searchQuery: string) => {
    updateFilter('query', searchQuery);
  };

  // Handle location search
  const handleLocationSearch = (location: string) => {
    updateFilter('location', location);
  };

  // Handle booking
  const handleBookingClick = (barber: any) => {
    if (!isAuthenticated) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour réserver.",
        variant: "destructive",
      });
      return;
    }
    setSelectedBarber(barber);
    setIsBookingModalOpen(true);
  };

  // Handle popular term click
  const handlePopularTermClick = (term: string) => {
    updateFilter('query', term);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      query: '',
      location: '',
      maxDistance: 50,
      minRating: 0,
      maxRating: 5,
      serviceCategory: '',
      acceptsHome: null,
      acceptsShop: null,
      isVerified: null,
      sortBy: 'rating',
      sortOrder: 'DESC',
    });
    setUserLocation(null);
  };

  // Check if any filters are active
  const hasActiveFilters = filters.query || 
    filters.location || 
    filters.minRating > 0 || 
    filters.maxRating < 5 || 
    filters.serviceCategory || 
    filters.acceptsHome !== null || 
    filters.acceptsShop !== null || 
    filters.isVerified !== null ||
    userLocation !== null;

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">
              Erreur lors de la recherche
            </h1>
            <p className="text-muted-foreground mb-4">
              Une erreur s'est produite lors de la recherche des barbiers.
            </p>
            <Button onClick={() => window.location.reload()}>
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="text-muted-foreground"
              >
                ← Retour
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Recherche de Barbiers</h1>
                <p className="text-sm text-muted-foreground">
                  Trouvez le barbier parfait pour vos besoins
                </p>
              </div>
            </div>
            <UserNav />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filtres
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              
              {showFilters && (
                <CardContent className="space-y-6">
                  {/* Search Query */}
                  <div className="space-y-2">
                    <Label>Recherche</Label>
                    <Input
                      placeholder="Nom, salon, service..."
                      value={filters.query}
                      onChange={(e) => updateFilter('query', e.target.value)}
                    />
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label>Localisation</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ville, quartier..."
                        value={filters.location}
                        onChange={(e) => updateFilter('location', e.target.value)}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={getCurrentLocation}
                        disabled={isLoadingLocation}
                      >
                        <Navigation className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Distance */}
                  <div className="space-y-2">
                    <Label>Distance maximale: {filters.maxDistance} km</Label>
                    <Slider
                      value={[filters.maxDistance]}
                      onValueChange={([value]) => updateFilter('maxDistance', value)}
                      max={100}
                      min={1}
                      step={1}
                    />
                  </div>

                  {/* Rating Range */}
                  <div className="space-y-2">
                    <Label>Note minimum: {filters.minRating}</Label>
                    <Slider
                      value={[filters.minRating]}
                      onValueChange={([value]) => updateFilter('minRating', value)}
                      max={5}
                      min={0}
                      step={0.5}
                    />
                  </div>

                  {/* Service Category */}
                  <div className="space-y-2">
                    <Label>Catégorie de service</Label>
                    <Select
                      value={filters.serviceCategory}
                      onValueChange={(value) => updateFilter('serviceCategory', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Toutes les catégories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Toutes les catégories</SelectItem>
                        {serviceCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Location Type */}
                  <div className="space-y-3">
                    <Label>Type de prestation</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="acceptsHome"
                          checked={filters.acceptsHome === true}
                          onCheckedChange={(checked) => 
                            updateFilter('acceptsHome', checked ? true : null)
                          }
                        />
                        <Label htmlFor="acceptsHome" className="flex items-center gap-2">
                          <Home className="h-4 w-4" />
                          Domicile
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="acceptsShop"
                          checked={filters.acceptsShop === true}
                          onCheckedChange={(checked) => 
                            updateFilter('acceptsShop', checked ? true : null)
                          }
                        />
                        <Label htmlFor="acceptsShop" className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          Salon
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Verified Only */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isVerified"
                      checked={filters.isVerified === true}
                      onCheckedChange={(checked) => 
                        updateFilter('isVerified', checked ? true : null)
                      }
                    />
                    <Label htmlFor="isVerified" className="flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Barbiers vérifiés uniquement
                    </Label>
                  </div>

                  {/* Sort Options */}
                  <div className="space-y-2">
                    <Label>Trier par</Label>
                    <Select
                      value={filters.sortBy}
                      onValueChange={(value) => updateFilter('sortBy', value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rating">Note</SelectItem>
                        <SelectItem value="distance">Distance</SelectItem>
                        <SelectItem value="name">Nom</SelectItem>
                        <SelectItem value="review_count">Nombre d'avis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Clear Filters */}
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="w-full"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Effacer les filtres
                    </Button>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Popular Search Terms */}
            {popularTerms.length > 0 && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-sm">Recherches populaires</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {popularTerms.map((term) => (
                      <Badge
                        key={term.term}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                        onClick={() => handlePopularTermClick(term.term)}
                      >
                        {term.term}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">
                  {isLoading ? 'Recherche en cours...' : `${allBarbers.length} barbiers trouvés`}
                </h2>
                {hasActiveFilters && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Filtres actifs
                  </p>
                )}
              </div>
              
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filtres
              </Button>
            </div>

            {/* Search Results */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full mb-2" />
                      <Skeleton className="h-3 w-full mb-1" />
                      <Skeleton className="h-3 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : allBarbers.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allBarbers.map((barber) => (
                    <Card key={barber.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{barber.name}</CardTitle>
                            <CardDescription>{barber.salon_name}</CardDescription>
                          </div>
                          {barber.is_verified && (
                            <Badge variant="default" className="bg-green-500">
                              <Award className="h-3 w-3 mr-1" />
                              Vérifié
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {/* Rating and Reviews */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold">{barber.rating}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            ({barber.review_count} avis)
                          </span>
                        </div>

                        {/* Location and Distance */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{barber.location}</span>
                          {barber.distance && (
                            <Badge variant="outline">
                              {barber.distance.toFixed(1)} km
                            </Badge>
                          )}
                        </div>

                        {/* Services */}
                        {barber.service_names && (
                          <div className="flex flex-wrap gap-1">
                            {barber.service_names.split(',').slice(0, 3).map((service, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {service.trim()}
                              </Badge>
                            ))}
                            {barber.service_names.split(',').length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{barber.service_names.split(',').length - 3}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Location Types */}
                        <div className="flex gap-2">
                          {barber.accepts_home && (
                            <Badge variant="outline" className="text-xs">
                              <Home className="h-3 w-3 mr-1" />
                              Domicile
                            </Badge>
                          )}
                          {barber.accepts_shop && (
                            <Badge variant="outline" className="text-xs">
                              <Building className="h-3 w-3 mr-1" />
                              Salon
                            </Badge>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleBookingClick(barber)}
                            className="flex-1"
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            Réserver
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => navigate(`/barber/${barber.id}`)}
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Load More */}
                {hasNextPage && (
                  <div className="flex justify-center mt-8">
                    <Button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      variant="outline"
                    >
                      {isFetchingNextPage ? 'Chargement...' : 'Charger plus'}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun barbier trouvé</h3>
                <p className="text-muted-foreground mb-4">
                  Essayez de modifier vos critères de recherche ou de supprimer certains filtres.
                </p>
                <Button onClick={clearFilters}>
                  Effacer les filtres
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {selectedBarber && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          barber={selectedBarber}
        />
      )}

      {/* Moroccan Pattern Background */}
      <MoroccanPattern className="fixed inset-0 -z-10 opacity-5" />
    </div>
  );
} 