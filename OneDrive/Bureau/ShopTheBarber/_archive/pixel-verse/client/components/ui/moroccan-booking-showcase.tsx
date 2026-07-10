import React from "react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { MoroccanServiceCard } from "./moroccan-service-card";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Star, 
  Scissors, 
  Sparkles,
  User
} from "lucide-react";

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  is_popular?: boolean;
  bookings_count?: number;
  rating?: number;
}

interface Barber {
  id: number;
  name: string;
  salon_name: string;
  description: string;
  location: string;
  accepts_home: boolean;
  accepts_shop: boolean;
  rating: number;
  services: Array<{
    id: number;
    name: string;
    price: number;
  }>;
}

export function MoroccanBookingShowcase() {
  const [showBookingModal, setShowBookingModal] = React.useState(false);
  const [editingService, setEditingService] = React.useState<Service | null>(null);

  // Mock data for showcase
  const mockServices: Service[] = [
    {
      id: 1,
      name: "Coupe Classique Premium",
      description: "Une coupe traditionnelle avec finitions soignées et conseils personnalisés pour un style intemporel.",
      price: 150,
      duration: 45,
      category: "coupe",
      is_popular: true,
      bookings_count: 127,
      rating: 4.8
    },
    {
      id: 2,
      name: "Rasage à l'Ancienne",
      description: "Rasage traditionnel avec lame et produits d'exception pour une expérience authentique.",
      price: 200,
      duration: 60,
      category: "barbier",
      bookings_count: 89,
      rating: 4.9
    },
    {
      id: 3,
      name: "Soin Capillaire Royal",
      description: "Soin complet avec huiles essentielles marocaines pour des cheveux sains et brillants.",
      price: 180,
      duration: 75,
      category: "soins",
      bookings_count: 64,
      rating: 4.7
    },
    {
      id: 4,
      name: "Coloration Naturelle",
      description: "Coloration avec henné et produits naturels pour un résultat éclatant et respectueux.",
      price: 250,
      duration: 90,
      category: "coloration",
      bookings_count: 42,
      rating: 4.6
    }
  ];

  const mockBarber: Barber = {
    id: 1,
    name: "Ahmed Alami",
    salon_name: "Salon Royal Marocain",
    description: "Maître barbier avec 15 ans d'expérience dans l'art traditionnel marocain",
    location: "Casablanca, Maroc",
    accepts_home: true,
    accepts_shop: true,
    rating: 4.8,
    services: [
      { id: 1, name: "Coupe Classique Premium", price: 150 },
      { id: 2, name: "Rasage à l'Ancienne", price: 200 },
      { id: 3, name: "Soin Capillaire Royal", price: 180 },
      { id: 4, name: "Coloration Naturelle", price: 250 }
    ]
  };

  const handleServiceEdit = (service: Service) => {
    setEditingService(service);
  };

  const handleServiceSave = (updatedService: Service) => {
    console.log("Service updated:", updatedService);
    setEditingService(null);
  };

  const handleServiceDelete = (serviceId: number) => {
    console.log("Service deleted:", serviceId);
  };

  const handleServiceCancel = () => {
    setEditingService(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-moroccan-charcoal via-moroccan-darkgrey to-moroccan-charcoal moroccan-pattern">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-moroccan-gold to-moroccan-copper rounded-xl">
              <Scissors className="h-8 w-8 text-moroccan-charcoal" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-moroccan-offwhite">
              Réservation Premium
            </h1>
          </div>
          <p className="text-xl text-moroccan-cream max-w-3xl mx-auto">
            Découvrez notre système de réservation élégant et nos services de gestion premium, 
            conçus pour offrir une expérience exceptionnelle aux barbiers et clients.
          </p>
        </div>

        {/* Barber Profile Card */}
        <div className="mb-16">
          <Card className="relative overflow-hidden bg-gradient-to-br from-moroccan-darkgrey/90 to-moroccan-charcoal/90 border-2 border-moroccan-gold/30 moroccan-pattern">
            <div className="absolute inset-0 bg-gradient-to-br from-moroccan-gold/5 to-transparent"></div>
            <CardHeader className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-moroccan-gold to-moroccan-copper rounded-full flex items-center justify-center">
                    <span className="text-2xl font-display font-bold text-moroccan-charcoal">
                      {mockBarber.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-3xl font-display font-bold text-moroccan-offwhite mb-2">
                      {mockBarber.name}
                    </CardTitle>
                    <p className="text-xl text-moroccan-cream mb-3">{mockBarber.salon_name}</p>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Star className="h-5 w-5 fill-moroccan-gold text-moroccan-gold" />
                        <span className="text-moroccan-gold font-semibold">{mockBarber.rating}</span>
                      </div>
                      <span className="text-moroccan-cream">•</span>
                      <span className="text-moroccan-cream">{mockBarber.location}</span>
                      <span className="text-moroccan-cream">•</span>
                      <span className="text-moroccan-cream">{mockBarber.description}</span>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => setShowBookingModal(true)}
                  className="bg-gradient-to-r from-moroccan-gold to-moroccan-copper hover:from-moroccan-copper hover:to-moroccan-gold text-moroccan-charcoal font-bold px-8 py-3 shadow-moroccan-lg transition-all duration-300 transform hover:scale-105"
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  Réserver maintenant
                </Button>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Services Grid */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-moroccan-offwhite mb-4">
              Services Premium
            </h2>
            <p className="text-moroccan-cream text-lg">
              Gestion complète des services avec interface élégante et fonctionnalités avancées
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {mockServices.map((service) => (
              <MoroccanServiceCard
                key={service.id}
                service={service}
                isEditing={editingService?.id === service.id}
                onEdit={handleServiceEdit}
                onSave={handleServiceSave}
                onDelete={handleServiceDelete}
                onCancel={handleServiceCancel}
                isOwner={true}
              />
            ))}
          </div>
        </div>

        {/* Features Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="relative overflow-hidden bg-gradient-to-br from-moroccan-darkgrey/90 to-moroccan-charcoal/90 border-2 border-moroccan-gold/30 moroccan-pattern">
            <div className="absolute inset-0 bg-gradient-to-br from-moroccan-gold/5 to-transparent"></div>
            <CardHeader className="relative z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-moroccan-gold to-moroccan-copper rounded-lg">
                  <Calendar className="h-5 w-5 text-moroccan-charcoal" />
                </div>
                <CardTitle className="text-moroccan-offwhite font-display">
                  Réservation Intelligente
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <p className="text-moroccan-cream">
                Interface intuitive pour la sélection de services, dates et créneaux horaires avec validation en temps réel.
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-moroccan-darkgrey/90 to-moroccan-charcoal/90 border-2 border-moroccan-gold/30 moroccan-pattern">
            <div className="absolute inset-0 bg-gradient-to-br from-moroccan-gold/5 to-transparent"></div>
            <CardHeader className="relative z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-moroccan-green to-moroccan-gold rounded-lg">
                  <Sparkles className="h-5 w-5 text-moroccan-charcoal" />
                </div>
                <CardTitle className="text-moroccan-offwhite font-display">
                  Gestion des Services
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <p className="text-moroccan-cream">
                Édition en ligne des services, prix et disponibilités avec statistiques et analyses détaillées.
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-moroccan-darkgrey/90 to-moroccan-charcoal/90 border-2 border-moroccan-gold/30 moroccan-pattern">
            <div className="absolute inset-0 bg-gradient-to-br from-moroccan-gold/5 to-transparent"></div>
            <CardHeader className="relative z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-moroccan-royal-blue to-moroccan-green rounded-lg">
                  <Award className="h-5 w-5 text-moroccan-charcoal" />
                </div>
                <CardTitle className="text-moroccan-offwhite font-display">
                  Expérience Premium
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <p className="text-moroccan-cream">
                Design élégant avec animations fluides et micro-interactions pour une expérience utilisateur exceptionnelle.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-moroccan-darkgrey/80 to-moroccan-charcoal/80 border-2 border-moroccan-gold/30 rounded-2xl p-8 moroccan-pattern">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-display font-bold text-moroccan-offwhite mb-2">
              Statistiques de Performance
            </h3>
            <p className="text-moroccan-cream">
              Données en temps réel sur l'utilisation de la plateforme
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-display font-bold text-moroccan-gold mb-2">1,247</div>
              <div className="text-moroccan-cream text-sm">Réservations</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-display font-bold text-moroccan-gold mb-2">89%</div>
              <div className="text-moroccan-cream text-sm">Satisfaction</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-display font-bold text-moroccan-gold mb-2">24</div>
              <div className="text-moroccan-cream text-sm">Services Actifs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-display font-bold text-moroccan-gold mb-2">4.8</div>
              <div className="text-moroccan-cream text-sm">Note Moyenne</div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal would be rendered here */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-moroccan-charcoal via-moroccan-darkgrey to-moroccan-charcoal border-2 border-moroccan-gold/30 rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto moroccan-pattern">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-bold text-moroccan-offwhite">
                Réserver {mockBarber.name}
              </h2>
              <Button
                variant="ghost"
                onClick={() => setShowBookingModal(false)}
                className="text-moroccan-gold hover:bg-moroccan-gold/20"
              >
                ✕
              </Button>
            </div>
            <div className="text-moroccan-cream text-center py-12">
              <Sparkles className="h-16 w-16 text-moroccan-gold mx-auto mb-4" />
              <p className="text-lg">
                Interface de réservation premium avec sélection de services, 
                gestion des créneaux et validation en temps réel.
              </p>
              <p className="text-sm text-moroccan-cream/70 mt-2">
                (Modal de réservation complet disponible dans l'application)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 