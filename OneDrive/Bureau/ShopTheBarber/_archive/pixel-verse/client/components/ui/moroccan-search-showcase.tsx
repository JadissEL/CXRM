import React from "react";
import { Button } from "./button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card";
import {
  Star,
  MapPin,
  Search,
  Filter,
  Home,
  Building,
  Sparkles,
  Zap,
  ArrowRight,
} from "lucide-react";
import MoroccanPattern from "./MoroccanPattern";
import { MoroccanScissors, MoroccanStar as MoroccanStarIcon } from "./MoroccanIcons";

export function MoroccanSearchShowcase() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [locationFilter, setLocationFilter] = React.useState<"all" | "shop" | "home">("all");
  const [ratingFilter, setRatingFilter] = React.useState<number>(0);
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");

  // Mock data for demonstration
  const mockBarbers = [
    {
      id: 1,
      name: "Hassan Alami",
      salon_name: "Salon Royal",
      location: "Casablanca",
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&h=300&fit=crop",
      accepts_home: true,
      accepts_shop: true,
      services: [
        { id: 1, name: "Coupe Homme", price: 80 },
        { id: 2, name: "Coupe Femme", price: 120 },
        { id: 3, name: "Coloration", price: 200 }
      ]
    },
    {
      id: 2,
      name: "Youssef Bennani",
      salon_name: "Elite Barbershop",
      location: "Marrakech",
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1619895862022-09114b41f16f?w=400&h=300&fit=crop",
      accepts_home: false,
      accepts_shop: true,
      services: [
        { id: 4, name: "Coupe Homme", price: 90 },
        { id: 5, name: "Barbe", price: 60 },
        { id: 6, name: "Shampoing", price: 40 }
      ]
    },
    {
      id: 3,
      name: "Omar Tazi",
      salon_name: "Modern Cut",
      location: "Rabat",
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&h=300&fit=crop",
      accepts_home: true,
      accepts_shop: true,
      services: [
        { id: 7, name: "Coupe Homme", price: 85 },
        { id: 8, name: "Coupe Femme", price: 130 },
        { id: 9, name: "Mèches", price: 180 }
      ]
    },
    {
      id: 4,
      name: "Mehdi Benali",
      salon_name: "Style Master",
      location: "Fès",
      rating: 4.7,
      image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=300&fit=crop",
      accepts_home: false,
      accepts_shop: true,
      services: [
        { id: 10, name: "Coupe Homme", price: 75 },
        { id: 11, name: "Coupe Femme", price: 110 },
        { id: 12, name: "Lissage", price: 250 }
      ]
    }
  ];

  // Filter barbers based on search criteria
  const filteredBarbers = mockBarbers.filter(barber => {
    const matchesSearch = !searchTerm || 
      barber.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      barber.salon_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      barber.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = locationFilter === "all" ||
      (locationFilter === "home" && barber.accepts_home) ||
      (locationFilter === "shop" && barber.accepts_shop);
    
    const matchesRating = ratingFilter === 0 || barber.rating >= ratingFilter;
    
    return matchesSearch && matchesLocation && matchesRating;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setLocationFilter("all");
    setRatingFilter(0);
  };

  return (
    <div className="relative py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-moroccan-gold/20 border border-moroccan-gold/30">
              <Search className="h-6 w-6 text-moroccan-gold" />
            </div>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-moroccan-gold">
              Recherche Premium
            </h2>
          </div>
          <p className="text-lg text-moroccan-offwhite/80 max-w-2xl mx-auto">
            Découvrez notre système de recherche avancé avec filtres intelligents et interface premium
          </p>
        </div>

        {/* Search Interface Demo */}
        <div className="bg-gradient-to-br from-moroccan-charcoal/90 to-moroccan-darkgrey/90 rounded-xl p-8 mb-8 border border-moroccan-gold/20 shadow-moroccan-xl">
          <div className="flex items-center space-x-2 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-moroccan-gold/20 border border-moroccan-gold/30">
              <Filter className="h-4 w-4 text-moroccan-gold" />
            </div>
            <h3 className="text-xl font-heading font-semibold text-moroccan-gold">Interface de Recherche</h3>
          </div>

          {/* Search Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-moroccan-gold" />
              <input
                type="text"
                placeholder="Rechercher un barbier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-moroccan-darkgrey/50 border border-moroccan-gold/30 rounded-lg pl-10 pr-4 py-3 text-moroccan-offwhite placeholder-moroccan-offwhite/50 focus:outline-none focus:ring-2 focus:ring-moroccan-gold focus:border-moroccan-gold transition-all duration-200"
              />
            </div>

            {/* Location Type Filter */}
            <div>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value as "all" | "shop" | "home")}
                className="w-full bg-moroccan-darkgrey/50 border border-moroccan-gold/30 rounded-lg px-3 py-3 text-moroccan-offwhite focus:outline-none focus:ring-2 focus:ring-moroccan-gold focus:border-moroccan-gold transition-all duration-200"
              >
                <option value="all">Tous les lieux</option>
                <option value="shop">Salon uniquement</option>
                <option value="home">Domicile uniquement</option>
              </select>
            </div>

            {/* Rating Filter */}
            <div>
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(parseFloat(e.target.value))}
                className="w-full bg-moroccan-darkgrey/50 border border-moroccan-gold/30 rounded-lg px-3 py-3 text-moroccan-offwhite focus:outline-none focus:ring-2 focus:ring-moroccan-gold focus:border-moroccan-gold transition-all duration-200"
              >
                <option value={0}>Toutes les notes</option>
                <option value={4.5}>4.5+ étoiles</option>
                <option value={4.0}>4.0+ étoiles</option>
                <option value={3.5}>3.5+ étoiles</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div>
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full border-moroccan-gold/30 text-moroccan-gold hover:bg-moroccan-gold/10 hover:border-moroccan-gold transition-all duration-200"
              >
                <Filter className="h-4 w-4 mr-2" />
                Effacer
              </Button>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-moroccan-offwhite text-sm">
                {filteredBarbers.length} résultat{filteredBarbers.length > 1 ? 's' : ''}
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-moroccan-offwhite text-sm">Affichage:</span>
                <div className="flex bg-moroccan-darkgrey/50 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`px-3 py-1 rounded text-sm transition-all ${
                      viewMode === "grid"
                        ? "bg-moroccan-gold text-moroccan-charcoal"
                        : "text-moroccan-offwhite hover:text-moroccan-gold"
                    }`}
                  >
                    Grille
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`px-3 py-1 rounded text-sm transition-all ${
                      viewMode === "list"
                        ? "bg-moroccan-gold text-moroccan-charcoal"
                        : "text-moroccan-offwhite hover:text-moroccan-gold"
                    }`}
                  >
                    Liste
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Grid */}
        {filteredBarbers.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gradient-to-br from-moroccan-charcoal/80 to-moroccan-darkgrey/80 rounded-xl p-8 border border-moroccan-gold/20">
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-moroccan-gold/20 border border-moroccan-gold/30">
                  <MoroccanScissors className="h-8 w-8 text-moroccan-gold" />
                </div>
              </div>
              <h3 className="text-xl font-heading font-semibold mb-2 text-moroccan-gold">Aucun résultat</h3>
              <p className="text-moroccan-offwhite/70 mb-4">
                Aucun barbier ne correspond à vos critères de recherche.
              </p>
              <Button
                onClick={clearFilters}
                className="bg-moroccan-gold hover:bg-moroccan-gold/90 text-moroccan-charcoal"
              >
                Effacer les filtres
              </Button>
            </div>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {filteredBarbers.map((barber) => (
              <Card key={barber.id} className="bg-gradient-to-br from-moroccan-charcoal/90 to-moroccan-darkgrey/90 border-moroccan-gold/20 hover:border-moroccan-gold hover:shadow-moroccan-xl transition-all duration-300 group">
                <CardHeader className="p-0">
                  <div className="relative">
                    <img
                      src={barber.image}
                      alt={`${barber.name} at work`}
                      className="w-full h-48 object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-moroccan-gold text-moroccan-charcoal font-semibold shadow-lg">
                        {barber.rating} <Star className="h-3 w-3 ml-1 fill-current" />
                      </span>
                    </div>
                    {barber.rating >= 4.8 && (
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gradient-to-r from-moroccan-gold to-moroccan-copper text-moroccan-charcoal font-bold">
                          <MoroccanStarIcon className="h-3 w-3 mr-1" />
                          Premium
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <CardTitle className="text-moroccan-gold mb-2 font-heading">{barber.name}</CardTitle>
                  <CardDescription className="text-moroccan-offwhite/80 mb-4 font-medium">
                    {barber.salon_name}
                  </CardDescription>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-moroccan-offwhite">
                      <MapPin className="h-4 w-4 mr-2 text-moroccan-gold" />
                      {barber.location}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm">
                      {barber.accepts_shop && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs border border-moroccan-green text-moroccan-green bg-moroccan-green/10">
                          <Building className="h-3 w-3 mr-1" />
                          Salon
                        </span>
                      )}
                      {barber.accepts_home && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs border border-moroccan-royal-blue text-moroccan-royal-blue bg-moroccan-royal-blue/10">
                          <Home className="h-3 w-3 mr-1" />
                          Domicile
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-moroccan-offwhite/70">
                      À partir de <span className="text-moroccan-gold font-semibold">{Math.min(...barber.services.map((s: any) => s.price))} DH</span>
                    </div>
                    <Button
                      className="bg-moroccan-gold hover:bg-moroccan-gold/90 text-moroccan-charcoal font-semibold transition-all duration-200"
                    >
                      Réserver
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Features Section */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-moroccan-gold/20 border border-moroccan-gold/30">
                <Search className="h-6 w-6 text-moroccan-gold" />
              </div>
            </div>
            <h3 className="text-lg font-heading font-semibold text-moroccan-gold mb-2">Recherche Intelligente</h3>
            <p className="text-moroccan-offwhite/70">
              Recherche avancée par nom, salon, ville avec suggestions en temps réel
            </p>
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-moroccan-gold/20 border border-moroccan-gold/30">
                <Filter className="h-6 w-6 text-moroccan-gold" />
              </div>
            </div>
            <h3 className="text-lg font-heading font-semibold text-moroccan-gold mb-2">Filtres Avancés</h3>
            <p className="text-moroccan-offwhite/70">
              Filtrage par note, type de service, localisation et disponibilité
            </p>
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-moroccan-gold/20 border border-moroccan-gold/30">
                <Zap className="h-6 w-6 text-moroccan-gold" />
              </div>
            </div>
            <h3 className="text-lg font-heading font-semibold text-moroccan-gold mb-2">Performance</h3>
            <p className="text-moroccan-offwhite/70">
              Interface ultra-rapide avec animations fluides et transitions élégantes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 