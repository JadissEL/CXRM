import React from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Star,
  MapPin,
  Clock,
  Scissors,
  User,
  CheckCircle,
  ChevronRight,
  Phone,
  Mail,
  Search,
  Calendar,
  Sparkles,
  ArrowRight,
  Zap,
  Heart,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { UserNav } from "../components/UserNav";
import { Footer } from "../components/Footer";
import { useAuth } from "../hooks/useAuth";
import BookingModal from "../components/BookingModal";
import MoroccanPattern from "@/components/ui/MoroccanPattern";
import { Input } from "../components/ui/input";
import { useState, useEffect } from "react";

// Carrousel dynamique (exemple simple)
const testimonials = [
  {
    name: "Yassine B.",
    text: "Service impeccable, réservation ultra simple !",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg"
  },
  {
    name: "Fatima Z.",
    text: "J’ai trouvé le meilleur barbier de Casablanca grâce à ShopTheBarber.",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg"
  },
  {
    name: "Omar K.",
    text: "Interface moderne, rappels pratiques, je recommande !",
    avatar: "https://randomuser.me/api/portraits/men/45.jpg"
  }
];

function Carousel() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setIndex(i => (i + 1) % testimonials.length), 4000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="w-full max-w-xl mx-auto mb-12">
      <div className="bg-moroccan-darkgrey rounded-xl p-6 shadow-lg flex flex-col items-center transition-all duration-500 animate-fade-in">
        <img src={testimonials[index].avatar} alt={testimonials[index].name} className="w-16 h-16 rounded-full mb-3 border-4 border-moroccan-gold" />
        <p className="text-lg text-moroccan-offwhite italic mb-2">“{testimonials[index].text}”</p>
        <span className="text-moroccan-gold font-bold">{testimonials[index].name}</span>
      </div>
      <div className="flex justify-center mt-2 space-x-2">
        {testimonials.map((_, i) => (
          <button key={i} className={`w-3 h-3 rounded-full ${i === index ? 'bg-moroccan-gold' : 'bg-moroccan-sand/30'}`} onClick={() => setIndex(i)} />
        ))}
      </div>
    </div>
  );
}

export default function Index() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [selectedBarber, setSelectedBarber] = React.useState<any>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = React.useState(false);
  const [featuredBarbers, setFeaturedBarbers] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [globalError, setGlobalError] = React.useState<string | null>(null);
  const [selectedCity, setSelectedCity] = React.useState("");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<any[]>([]);

  // Error handling
  React.useEffect(() => {
    const handler = (event: ErrorEvent) => {
      setGlobalError(event.message || 'Erreur inconnue');
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

  // Load featured barbers
  React.useEffect(() => {
    loadFeaturedBarbers();
  }, []);

  const loadFeaturedBarbers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:3001/api/barbers');
      if (response.ok) {
        const barbers = await response.json();
        const sortedBarbers = barbers
          .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 6);
        setFeaturedBarbers(sortedBarbers);
      } else {
        setFeaturedBarbers([]);
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
      setFeaturedBarbers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookingClick = (barber: any) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSelectedBarber(barber);
    setIsBookingModalOpen(true);
  };

  const handleCityClick = (city: string) => {
    navigate(`/city/${city.toLowerCase()}`);
  };

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    if (e.target.value.length > 1) {
      const res = await fetch(`/api/search?q=${encodeURIComponent(e.target.value)}`);
      if (res.ok) setSuggestions(await res.json());
      else setSuggestions([]);
    } else {
      setSuggestions([]);
    }
  };

  if (globalError) {
    return (
      <div className="min-h-screen bg-moroccan-charcoal text-moroccan-offwhite flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-moroccan-gold mb-4">Erreur</h2>
          <p className="text-moroccan-sand">{globalError}</p>
        </div>
      </div>
    );
  }

  // Images réelles pour les villes marocaines
  const cities = [
    { 
      name: "Casablanca", 
      image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop",
      description: "La capitale économique du Maroc"
    },
    { 
      name: "Marrakech", 
      image: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&h=600&fit=crop",
      description: "La ville rouge et ses souks légendaires"
    },
    { 
      name: "Rabat", 
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop",
      description: "La capitale administrative du Maroc"
    },
    { 
      name: "Fès", 
      image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop",
      description: "La ville spirituelle et culturelle"
    },
    { 
      name: "Tanger", 
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop",
      description: "La porte de l'Afrique sur l'Europe"
    },
    { 
      name: "Agadir", 
      image: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&h=600&fit=crop",
      description: "La perle du sud et ses plages"
    },
  ];

  // Images pour les services de coiffure
  const features = [
    {
      icon: CheckCircle,
      title: "Barbers Vérifiés",
      description: "Tous nos barbiers sont certifiés et évalués par notre communauté",
      image: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&h=300&fit=crop"
    },
    {
      icon: Calendar,
      title: "Réservation Facile",
      description: "Réservez votre créneau en quelques clics, 24h/24 et 7j/7",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop"
    },
    {
      icon: Zap,
      title: "Qualité Premium",
      description: "Des services de coiffure de qualité professionnelle garantie",
      image: "https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?w=400&h=300&fit=crop"
    },
    {
      icon: Heart,
      title: "Satisfaction Client",
      description: "Notre priorité est votre satisfaction et votre bien-être",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop"
    }
  ];

  // Images de profil pour les barbiers (fallback)
  const barberImages = [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=200&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?w=200&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=200&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?w=200&h=200&fit=crop&crop=face",
  ];

  return (
    <div className="min-h-screen bg-moroccan-charcoal text-moroccan-offwhite">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-moroccan-darkgrey/50 bg-moroccan-charcoal/95 backdrop-blur supports-[backdrop-filter]:bg-moroccan-charcoal/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-moroccan-gradient-primary text-moroccan-charcoal shadow-lg">
              <Scissors className="h-5 w-5" />
            </div>
            <span className="font-heading text-2xl font-bold text-moroccan-gold">
              ShopTheBarber
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <a href="#barbers" className="nav-link text-moroccan-sand hover:text-moroccan-gold transition-colors">
              Barbiers
            </a>
            <a href="#cities" className="nav-link text-moroccan-sand hover:text-moroccan-gold transition-colors">
              Villes
            </a>
            <Link to="/marketplace" className="nav-link text-moroccan-sand hover:text-moroccan-gold transition-colors">
              Marketplace
            </Link>
            <Link to="/blog" className="nav-link text-moroccan-sand hover:text-moroccan-gold transition-colors">
              Blog
            </Link>
          </nav>

          <div className="flex items-center space-x-3">
            <UserNav />
          </div>
        </div>
      </header>

      {/* Hero Section avec image de fond */}
      <section className="relative py-20 px-4 overflow-hidden min-h-screen flex items-center">
        {/* Image de fond hero */}
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?w=1920&h=1080&fit=crop" 
            alt="Barbershop moderne"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-moroccan-charcoal/90 via-moroccan-charcoal/80 to-moroccan-darkgrey/70"></div>
        </div>
        
        <div className="container mx-auto relative z-10 text-center">
          <div className="mb-6">
            <div className="bg-moroccan-gradient-primary text-moroccan-charcoal border-0 px-4 py-2 text-sm font-semibold rounded-full inline-flex items-center">
              <Sparkles className="h-4 w-4 mr-2" />
              Style Supérieur
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-heading font-bold text-moroccan-gold mb-6 leading-tight">
            L'Art du
            <span className="block bg-moroccan-gradient-primary bg-clip-text text-transparent">
              Barbier Moderne
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-moroccan-sand max-w-3xl mx-auto mb-10 leading-relaxed">
            Découvrez les meilleurs barbiers du Maroc. Réservez en ligne, 
            profitez de services premium et transformez votre style.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button 
              size="lg" 
              className="bg-moroccan-gradient-primary text-moroccan-charcoal hover:scale-105 transition-all duration-300 px-8 py-4 text-lg font-semibold shadow-xl"
              onClick={() => document.getElementById('barbers')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Découvrir les Barbiers
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="border-moroccan-gold text-moroccan-gold hover:bg-moroccan-gold hover:text-moroccan-charcoal transition-all duration-300 px-8 py-4 text-lg font-semibold"
              onClick={() => navigate('/marketplace')}
            >
              Explorer le Marketplace
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto mb-8">
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder="Rechercher un barbier, un service..."
              className="w-full p-3 rounded-lg bg-moroccan-darkgrey text-moroccan-offwhite border border-moroccan-gold focus:outline-none focus:ring-2 focus:ring-moroccan-gold"
            />
            {suggestions.length > 0 && (
              <ul className="absolute left-0 right-0 bg-moroccan-charcoal border border-moroccan-gold rounded-lg mt-1 z-10 max-h-60 overflow-y-auto">
                {suggestions.map((s, i) => (
                  <li key={i} className="p-3 hover:bg-moroccan-gold/10 cursor-pointer text-moroccan-offwhite border-b border-moroccan-darkgrey last:border-b-0">
                    {s.name || s.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Features Section avec images */}
      <section className="py-20 px-4 bg-moroccan-darkgrey/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-moroccan-gold mb-6">
              Pourquoi Choisir ShopTheBarber ?
            </h2>
            <p className="text-xl text-moroccan-sand max-w-2xl mx-auto">
              Une expérience premium qui allie tradition marocaine et modernité
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="bg-moroccan-charcoal/50 border-moroccan-gold/20 hover:border-moroccan-gold/40 transition-all duration-300 hover:scale-105 overflow-hidden">
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={feature.image} 
                      alt={feature.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-moroccan-charcoal/60 to-transparent"></div>
                  </div>
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-moroccan-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 -mt-8 relative z-10">
                      <Icon className="h-8 w-8 text-moroccan-charcoal" />
                    </div>
                    <h3 className="text-xl font-bold text-moroccan-gold mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-moroccan-sand leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Barbers Section avec photos de profil */}
      <section id="barbers" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-moroccan-gold mb-6">
              Nos Barbiers Vedettes
            </h2>
            <p className="text-xl text-moroccan-sand max-w-2xl mx-auto">
              Découvrez les meilleurs barbiers sélectionnés par notre communauté
            </p>
          </div>
          
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-moroccan-charcoal/50 border-moroccan-darkgrey animate-pulse">
                  <CardContent className="p-6">
                    <div className="w-20 h-20 bg-moroccan-darkgrey rounded-full mb-4"></div>
                    <div className="h-6 bg-moroccan-darkgrey rounded mb-2"></div>
                    <div className="h-4 bg-moroccan-darkgrey rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredBarbers.map((barber, index) => (
                <Card key={barber.id} className="bg-moroccan-charcoal/50 border-moroccan-gold/20 hover:border-moroccan-gold/40 transition-all duration-300 hover:scale-105 group overflow-hidden">
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={barberImages[index % barberImages.length]} 
                      alt={barber.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-moroccan-charcoal/80 to-transparent"></div>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-16 h-16 bg-moroccan-gradient-primary rounded-full flex items-center justify-center -mt-8 relative z-10">
                        <User className="h-8 w-8 text-moroccan-charcoal" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-moroccan-gold">
                          {barber.name}
                        </h3>
                        <p className="text-moroccan-sand">
                          {barber.salon_name || "Salon Premium"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-moroccan-gold fill-current" />
                        <span className="text-moroccan-sand font-semibold">
                          {barber.rating || 4.8}
                        </span>
                      </div>
                      <div className="bg-moroccan-gradient-primary text-moroccan-charcoal border-0 px-3 py-1 rounded-full text-sm font-semibold">
                        {barber.location || "Casablanca"}
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full bg-moroccan-gradient-primary text-moroccan-charcoal hover:scale-105 transition-all duration-300"
                      onClick={() => handleBookingClick(barber)}
                    >
                      Réserver
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Cities Section avec images spécifiques */}
      <section id="cities" className="py-20 px-4 bg-moroccan-darkgrey/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-moroccan-gold mb-6">
              Explorez par Ville
            </h2>
            <p className="text-xl text-moroccan-sand max-w-2xl mx-auto">
              Trouvez les meilleurs barbiers dans votre ville
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {cities.map((city, index) => (
              <Card 
                key={index} 
                className="bg-moroccan-charcoal/50 border-moroccan-gold/20 hover:border-moroccan-gold/40 transition-all duration-300 hover:scale-105 cursor-pointer group overflow-hidden"
                onClick={() => handleCityClick(city.name)}
              >
                <CardContent className="p-0 overflow-hidden">
                  <div className="relative h-64 bg-moroccan-darkgrey">
                    <img 
                      src={city.image} 
                      alt={city.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-moroccan-charcoal/90 via-moroccan-charcoal/50 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-2xl font-bold text-moroccan-gold mb-2">
                        {city.name}
                      </h3>
                      <p className="text-moroccan-sand text-sm mb-2">
                        {city.description}
                      </p>
                      <div className="flex items-center space-x-2 text-moroccan-sand">
                        <MapPin className="h-4 w-4" />
                        <span>Découvrir les barbiers</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section avec image de fond */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&h=800&fit=crop" 
            alt="Style masculin"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-moroccan-charcoal/90 to-moroccan-darkgrey/80"></div>
        </div>
        
        <div className="container mx-auto text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-moroccan-gold mb-6">
              Prêt à Transformer Votre Style ?
            </h2>
            <p className="text-xl text-moroccan-sand mb-10 max-w-2xl mx-auto">
              Rejoignez des milliers d'hommes qui font confiance à ShopTheBarber 
              pour leur style et leur bien-être.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-moroccan-gradient-primary text-moroccan-charcoal hover:scale-105 transition-all duration-300 px-8 py-4 text-lg font-semibold shadow-xl"
                onClick={() => navigate('/signup')}
              >
                Commencer Maintenant
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                className="border-moroccan-gold text-moroccan-gold hover:bg-moroccan-gold hover:text-moroccan-charcoal transition-all duration-300 px-8 py-4 text-lg font-semibold"
                onClick={() => navigate('/login')}
              >
                Se Connecter
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Booking Modal */}
      {selectedBarber && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          barber={selectedBarber}
        />
      )}
    </div>
  );
}
