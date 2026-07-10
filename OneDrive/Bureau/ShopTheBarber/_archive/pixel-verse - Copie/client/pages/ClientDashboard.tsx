import React from "react";
import { authAPI, barbersAPI, appointmentsAPI, favoritesAPI, notificationsAPI, profileAPI, isAuthenticated, logout, analyticsAPI } from "../../shared/api";
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
  Calendar,
  Clock,
  Star,
  MapPin,
  Heart,
  Search,
  Filter,
  Bell,
  Settings,
  User,
  Scissors,
  History,
  Phone,
  MessageSquare,
  ChevronRight,
  Edit,
  Trash2,
  Plus,
  X,
  Check,
  AlertCircle,
  BookOpen,
  Gift,
  CreditCard,
  Share2,
  ThumbsUp,
  Eye,
  EyeOff,
  Mail,
  ArrowLeft,
  Navigation,
  Loader2,
  Camera,
  StarOff,
  Upload,
  Image,
  Home,
  Building,
  Car,
  CheckCircle,
  Palette,
  Sparkles,
  Zap,
  Waves,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { ChartComponent } from "../components/analytics/ChartComponent";

export default function ClientDashboard() {
  const [activeTab, setActiveTab] = React.useState<string>("overview");
  const [showSearchModal, setShowSearchModal] = React.useState<boolean>(false);
  const [showBookingModal, setShowBookingModal] = React.useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = React.useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = React.useState<boolean>(false);
  const [selectedAppointment, setSelectedAppointment] = React.useState<any>(null);
  const [selectedBarber, setSelectedBarber] = React.useState<any>(null);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [uploadedPhoto, setUploadedPhoto] = React.useState<any>(null);
  const [searchDate, setSearchDate] = React.useState<string>("");
  const [searchTime, setSearchTime] = React.useState<string>("");
  const [locationType, setLocationType] = React.useState<string>("both"); // both, shop, home
  const [searchStep, setSearchStep] = React.useState<number>(1); // 1: services, 2: search
  const [selectedServices, setSelectedServices] = React.useState<string[]>([]);

  // Real data states
  const [realUserProfile, setRealUserProfile] = React.useState<any>(null);
  const [realUpcomingBookings, setRealUpcomingBookings] = React.useState<any[]>([]);
  const [realBookingHistory, setRealBookingHistory] = React.useState<any[]>([]);
  const [realFavoriteBarbers, setRealFavoriteBarbers] = React.useState<any[]>([]);
  const [realAvailableBarbers, setRealAvailableBarbers] = React.useState<any[]>([]);
  const [realNotifications, setRealNotifications] = React.useState<any[]>([]);
  const [realServices, setRealServices] = React.useState<any[]>([]);
  const [analytics, setAnalytics] = React.useState<any>(null);

  // Ajout d'un état pour les données analytics détaillées
  const [analyticsCharts, setAnalyticsCharts] = React.useState<any>(null);

  // Charger les données analytics détaillées
  const loadAnalyticsCharts = async () => {
    try {
      const res = await fetch("/api/analytics/client");
      if (res.ok) {
        setAnalyticsCharts(await res.json());
      }
    } catch (e) {
      setAnalyticsCharts(null);
    }
  };

  // Check authentication on mount
  React.useEffect(() => {
    if (!isAuthenticated()) {
      window.location.href = '/login';
      return;
    }
    loadDashboardData();
    loadAnalytics();
    loadAnalyticsCharts();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load user profile
      const profile = await profileAPI.get();
      setRealUserProfile(profile);
      setUserProfile(profile);

      // Load appointments
      const appointments = await appointmentsAPI.getAll();
      const upcoming = appointments.filter((apt: any) => 
        new Date(`${apt.appointment_date} ${apt.appointment_time}`) > new Date() && apt.status !== 'cancelled'
      );
      const history = appointments.filter((apt: any) => 
        new Date(`${apt.appointment_date} ${apt.appointment_time}`) <= new Date() || apt.status === 'cancelled'
      );
      setRealUpcomingBookings(upcoming);
      setRealBookingHistory(history);
      setUpcomingBookings(upcoming);
      setBookingHistory(history);

      // Load favorites
      const favorites = await favoritesAPI.getAll();
      setRealFavoriteBarbers(favorites);
      setFavoriteBarbers(favorites);

      // Load all barbers
      const barbers = await barbersAPI.getAll();
      setRealAvailableBarbers(barbers);
      setAvailableBarbers(barbers);

      // Load notifications
      const notifs = await notificationsAPI.getAll();
      setRealNotifications(notifs);
      setNotifications(notifs);

      // Load services
      const servicesData = await fetch('http://localhost:3001/api/services').then(res => res.json());
      setRealServices(servicesData);
      setAvailableServices(servicesData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const data = await analyticsAPI.getOverview();
      setAnalytics(data);
    } catch (error) {
      console.error('Erreur chargement analytics:', error);
    }
  };

  // Services will be loaded from API
  const [availableServices, setAvailableServices] = React.useState<any[]>([]);

  // Booking form state
  const [bookingForm, setBookingForm] = React.useState({
    services: [],
    date: "",
    time: "",
    location: "shop", // shop or home
    address: "",
    notes: "",
    expectedPhoto: null,
    pricing: null,
  });

  // Fonction pour vérifier si l'annulation est possible (24h avant)
  const canCancelAppointment = (dateTime: string): boolean => {
    const appointmentDate = new Date(dateTime);
    const now = new Date();
    const timeDiff = appointmentDate.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);
    return hoursDiff >= 24;
  };

  // Upcoming bookings will be loaded from API
  const [upcomingBookings, setUpcomingBookings] = React.useState<any[]>([]);

  // Booking history will be loaded from API
  const [bookingHistory, setBookingHistory] = React.useState<any[]>([]);

  // Favorite barbers will be loaded from API
  const [favoriteBarbers, setFavoriteBarbers] = React.useState<any[]>([]);

  // Available barbers will be loaded from API
  const [availableBarbers, setAvailableBarbers] = React.useState<any[]>([]);

  // User profile will be loaded from API
  const [userProfile, setUserProfile] = React.useState<any>(null);

  // Notifications will be loaded from API
  const [notifications, setNotifications] = React.useState<any[]>([]);

  // Filter barbers based on search criteria and selected services
  const getFilteredBarbers = () => {
    // Combine all barbers
    let allBarbers = [...availableBarbers, ...favoriteBarbers];

    // Remove duplicates based on ID
    allBarbers = allBarbers.filter(
      (barber, index, self) =>
        index === self.findIndex((b) => b.id === barber.id),
    );

    let filtered = allBarbers;

    // Filter by selected services - barbier must have ALL selected services
    if (selectedServices.length > 0) {
      filtered = filtered.filter((barber) =>
        selectedServices.every((serviceId) =>
          barber.services && barber.services.includes(serviceId)
        )
      );
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (barber) =>
          barber.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          barber.salon_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          barber.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by location type
    if (locationType === "home") {
      filtered = filtered.filter((barber) => barber.accepts_home);
    } else if (locationType === "shop") {
      filtered = filtered.filter((barber) => barber.accepts_shop);
    }

    return filtered;
  };

  const toggleServiceSelection = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const calculateTotalPrice = (
    barber: any,
    services: string[],
    selectedDate: string | null = null,
    selectedTime: string | null = null,
  ) => {
    if (!barber || !barber.priceList) return 0;

    let total = 0;
    services.forEach((serviceId) => {
      const price = barber.priceList[serviceId];
      if (price) total += price;
    });

    // Apply combo offers
    if (barber.comboOffers) {
      barber.comboOffers.forEach((offer: any) => {
        const hasAllServices = offer.services.every((serviceId: string) =>
          services.includes(serviceId)
        );
        if (hasAllServices) {
          const offerTotal = offer.services.reduce(
            (sum: number, serviceId: string) =>
              sum + (barber.priceList[serviceId] || 0),
            0
          );
          const discount = (offerTotal * offer.discount) / 100;
          total -= discount;
        }
      });
    }

    // Apply time-based offers
    if (barber.timeOffers && selectedDate && selectedTime) {
      const appointmentDate = new Date(`${selectedDate} ${selectedTime}`);
      const dayOfWeek = appointmentDate.getDay();
      const hour = appointmentDate.getHours();

      barber.timeOffers.forEach((offer: any) => {
        if (
          offer.days.includes(dayOfWeek) &&
          hour >= offer.startHour &&
          hour <= offer.endHour
        ) {
          total = total * (1 - offer.discount / 100);
        }
      });
    }

    return Math.round(total);
  };

  const getServiceName = (serviceId: string): string => {
    const service = availableServices.find((s) => s.id === serviceId);
    return service ? service.name : serviceId;
  };

  const handlePhotoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedPhoto(e.target?.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCancelAppointment = async (appointmentId: number) => {
    try {
      await appointmentsAPI.cancel(appointmentId);
      // Reload appointments
      loadDashboardData();
      setShowCancelModal(false);
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedBarber || selectedServices.length === 0) return;

    try {
      const appointmentData = {
        barberId: selectedBarber.id,
        services: selectedServices,
        date: searchDate,
        time: searchTime,
        locationType: bookingForm.location as 'shop' | 'home',
        address: bookingForm.address,
        notes: bookingForm.notes,
      };

      await appointmentsAPI.create(appointmentData);
      
      // Reset form and close modal
      setBookingForm({
        services: [],
        date: "",
        time: "",
        location: "shop",
        address: "",
        notes: "",
        expectedPhoto: null,
        pricing: null,
      });
      setShowBookingModal(false);
      setSelectedBarber(null);
      setSelectedServices([]);
      
      // Reload data
      loadDashboardData();
    } catch (error) {
      console.error('Error booking appointment:', error);
    }
  };

  const toggleFavorite = (barberId: number) => {
    setFavoriteBarbers((prev) =>
      prev.map((barber) =>
        barber.id === barberId
          ? { ...barber, isFavorite: !barber.isFavorite }
          : barber
      )
    );
  };

  const addToFavorites = (barber: any) => {
    setFavoriteBarbers((prev) => [
      ...prev,
      { ...barber, isFavorite: true },
    ]);
  };

  const getAvailableTimeSlots = (barber: any, date: string): string[] => {
    // This would be loaded from the barber's availability
    return ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];
  };

  const proceedToSearch = () => {
    if (selectedServices.length === 0) return;
    setSearchStep(2);
  };

  const backToServices = () => {
    setSearchStep(1);
  };

  const [globalError, setGlobalError] = React.useState<string | null>(null);
  const [showNotifications, setShowNotifications] = React.useState(false);

  // Ajout d'un effet pour capturer les erreurs non catchées
  React.useEffect(() => {
    const handler = (event: ErrorEvent) => {
      setGlobalError(event.message || 'Erreur inconnue');
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

  // Fermer les notifications quand on clique en dehors
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showNotifications && !target.closest('.notifications-container')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  // Ajout d'un log pour vérifier le render
  console.log('Rendering ClientDashboard...');

  try {
    if (globalError) {
      return (
        <div style={{ color: 'red', background: '#222', padding: 32, fontSize: 18 }}>
          <b>Erreur dans le dashboard :</b>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{globalError}</pre>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-amber-500" />
            <p>Chargement de votre dashboard...</p>
          </div>
        </div>
      );
    }

    // Remplace toutes les utilisations de notifications.filter par une version sûre
    const safeNotifications = Array.isArray(notifications) ? notifications : [];

    return (
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/60">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-black">
                <Scissors className="h-4 w-4" />
              </div>
              <span className="font-display text-xl font-bold text-white">
                Mon Dashboard
              </span>
            </div>

            <div className="flex items-center space-x-3 relative">
              <button
                className="relative p-2 rounded-full hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 notifications-container"
                onClick={() => setShowNotifications((v) => !v)}
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5 text-amber-500" />
                {realNotifications && realNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                    {realNotifications.length}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-12 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50 animate-fade-in notifications-container">
                  <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <span className="font-semibold text-white">Notifications</span>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                      aria-label="Fermer les notifications"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-800">
                    {realNotifications && realNotifications.length > 0 ? (
                      realNotifications.map((notif, idx) => (
                        <div key={idx} className="p-4 text-sm text-gray-200 hover:bg-gray-800 transition">
                          {notif.message || notif.title || 'Notification'}
                          {notif.date && (
                            <div className="text-xs text-gray-500 mt-1">{new Date(notif.date).toLocaleString('fr-FR')}</div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-gray-400 text-center">Aucune notification</div>
                    )}
                  </div>
                </div>
              )}
              <Link to="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-300 hover:text-white"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Accueil
                </Button>
              </Link>
              <Link to="/client-settings">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-300 hover:text-white"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Paramètres
                </Button>
              </Link>

              <Link to="/client-reports">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-300 hover:text-white"
                >
                  <BookOpen className="h-4 w-4" />
                </Button>
              </Link>
              <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center text-black text-sm font-medium">
                {userProfile?.firstName?.charAt(0) || "U"}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Prochains RDV</p>
                    <p className="text-2xl font-bold text-white">
                      {analytics ? analytics.upcomingBookings ?? 0 : <Loader2 className='h-6 w-6 animate-spin' />}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Barbiers Favoris</p>
                    <p className="text-2xl font-bold text-white">
                      {analytics ? analytics.favoriteBarbers ?? 0 : <Loader2 className='h-6 w-6 animate-spin' />}
                    </p>
                  </div>
                  <Heart className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Visites Total</p>
                    <p className="text-2xl font-bold text-white">
                      {analytics ? analytics.totalBookings ?? 0 : <Loader2 className='h-6 w-6 animate-spin' />}
                    </p>
                  </div>
                  <History className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Notifications</p>
                    <p className="text-2xl font-bold text-white">
                      {analytics ? analytics.unreadNotifications ?? 0 : <Loader2 className='h-6 w-6 animate-spin' />}
                    </p>
                  </div>
                  <Bell className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg mb-8">
            {[
              { id: "overview", label: "Ajouter une réservation", icon: Plus },
              { id: "bookings", label: "Mes Réservations", icon: Calendar },
              { id: "favorites", label: "Favoris", icon: Heart },
              { id: "history", label: "Historique", icon: History },
              { id: "profile", label: "Mon Profil", icon: User },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-amber-500 text-black"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 gap-6">
                {/* Prochains Rendez-vous */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5" />
                      <span>Prochains Rendez-vous</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {upcomingBookings.length === 0 ? (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-400 mb-4">Aucun rendez-vous à venir</p>
                        <Button
                          onClick={() => setShowSearchModal(true)}
                          className="bg-amber-500 hover:bg-amber-600 text-black"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Réserver maintenant
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {upcomingBookings.slice(0, 3).map((booking) => (
                          <div
                            key={booking.id}
                            className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
                          >
                            <div>
                              <p className="font-medium text-white">
                                {booking.barber_name}
                              </p>
                              <p className="text-sm text-gray-400">
                                {booking.service_names}
                              </p>
                              <p className="text-xs text-gray-500">
                                {booking.appointment_date} à {booking.appointment_time}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-white">
                                {booking.total_price} MAD
                              </p>
                                                         <span
                               className={`text-xs px-2 py-1 rounded-full ${
                                 booking.status === "confirmed" 
                                   ? "bg-green-500 text-white" 
                                   : "bg-gray-500 text-white"
                               }`}
                             >
                               {booking.status}
                             </span>
                            </div>
                          </div>
                        ))}
                        {upcomingBookings.length > 3 && (
                          <Button
                            variant="outline"
                            className="w-full border-gray-600 text-gray-300"
                            onClick={() => setActiveTab("bookings")}
                          >
                            Voir tous ({upcomingBookings.length})
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "bookings" && (
              <div className="space-y-6">
                {/* Filtres */}
                <div className="flex flex-wrap gap-4">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-40 bg-gray-700 border-gray-600">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="confirmed">Confirmé</SelectItem>
                      <SelectItem value="completed">Terminé</SelectItem>
                      <SelectItem value="cancelled">Annulé</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select defaultValue="upcoming">
                    <SelectTrigger className="w-40 bg-gray-700 border-gray-600">
                      <SelectValue placeholder="Période" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">À venir</SelectItem>
                      <SelectItem value="past">Passés</SelectItem>
                      <SelectItem value="all">Tous</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    onClick={() => setShowSearchModal(true)}
                    className="bg-amber-500 hover:bg-amber-600 text-black"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle Réservation
                  </Button>
                </div>

                {/* Liste des réservations */}
                <div className="space-y-4">
                  {upcomingBookings.length === 0 && bookingHistory.length === 0 ? (
                    <Card className="bg-gray-800 border-gray-700">
                      <CardContent className="text-center py-12">
                        <Calendar className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">Aucune réservation</h3>
                        <p className="text-gray-400 mb-6">Vous n'avez pas encore de rendez-vous</p>
                        <Button
                          onClick={() => setShowSearchModal(true)}
                          className="bg-amber-500 hover:bg-amber-600 text-black"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Réserver maintenant
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {/* Réservations à venir */}
                      {upcomingBookings.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-white">Réservations à venir</h3>
                          {upcomingBookings.map((booking) => (
                            <Card key={booking.id} className="bg-gray-800 border-gray-700">
                              <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-4">
                                    <div className="h-12 w-12 rounded-full bg-amber-500 flex items-center justify-center">
                                      <Scissors className="h-6 w-6 text-black" />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-white">{booking.barber_name}</h4>
                                      <p className="text-sm text-gray-400">{booking.service_names}</p>
                                      <p className="text-xs text-gray-500">
                                        {booking.appointment_date} à {booking.appointment_time}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold text-white">{booking.total_price} MAD</p>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      booking.status === "confirmed" 
                                        ? "bg-green-500 text-white" 
                                        : booking.status === "pending"
                                        ? "bg-yellow-500 text-black"
                                        : "bg-gray-500 text-white"
                                    }`}>
                                      {booking.status}
                                    </span>
                                    <div className="mt-2 space-x-2">
                                      {canCancelAppointment(`${booking.appointment_date} ${booking.appointment_time}`) && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                                          onClick={() => {
                                            setSelectedAppointment(booking);
                                            setShowCancelModal(true);
                                          }}
                                        >
                                          Annuler
                                        </Button>
                                      )}
                                      <Button
                                        size="sm"
                                        className="bg-amber-500 hover:bg-amber-600 text-black"
                                        onClick={() => {
                                          setSelectedBarber({ id: booking.barber_id, name: booking.barber_name });
                                          setShowBookingModal(true);
                                        }}
                                      >
                                        Modifier
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}

                      {/* Historique des réservations */}
                      {bookingHistory.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-white">Historique des réservations</h3>
                          {bookingHistory.map((booking) => (
                            <Card key={booking.id} className="bg-gray-800 border-gray-700">
                              <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-4">
                                    <div className="h-12 w-12 rounded-full bg-gray-600 flex items-center justify-center">
                                      <History className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-white">{booking.barber_name}</h4>
                                      <p className="text-sm text-gray-400">{booking.service_names}</p>
                                      <p className="text-xs text-gray-500">
                                        {booking.appointment_date} à {booking.appointment_time}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold text-white">{booking.total_price} MAD</p>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      booking.status === "completed" 
                                        ? "bg-green-500 text-white" 
                                        : booking.status === "cancelled"
                                        ? "bg-red-500 text-white"
                                        : "bg-gray-500 text-white"
                                    }`}>
                                      {booking.status}
                                    </span>
                                    {booking.status === "completed" && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="mt-2 border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black"
                                      >
                                        Laisser un avis
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === "favorites" && (
              <div className="space-y-6">
                {/* En-tête avec statistiques */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4 text-center">
                      <Heart className="h-8 w-8 text-red-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">{favoriteBarbers.length}</p>
                      <p className="text-sm text-gray-400">Barbiers favoris</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4 text-center">
                      <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">
                        {favoriteBarbers.length > 0 
                          ? (favoriteBarbers.reduce((sum, barber) => sum + (barber.rating || 0), 0) / favoriteBarbers.length).toFixed(1)
                          : 0
                        }
                      </p>
                      <p className="text-sm text-gray-400">Note moyenne</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4 text-center">
                      <Calendar className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">
                        {favoriteBarbers.length > 0 
                          ? favoriteBarbers.reduce((sum, barber) => sum + (barber.total_bookings || 0), 0)
                          : 0
                        }
                      </p>
                      <p className="text-sm text-gray-400">Réservations totales</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-white">Mes Barbiers Favoris</h2>
                  <Button
                    onClick={() => setShowSearchModal(true)}
                    className="bg-amber-500 hover:bg-amber-600 text-black"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Découvrir des barbiers
                  </Button>
                </div>

                {/* Liste des favoris */}
                {favoriteBarbers.length === 0 ? (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="text-center py-12">
                      <Heart className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">Aucun barbier favori</h3>
                      <p className="text-gray-400 mb-6">Ajoutez des barbiers à vos favoris pour des réservations rapides</p>
                      <Button
                        onClick={() => setShowSearchModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-black"
                      >
                        <Search className="mr-2 h-4 w-4" />
                        Découvrir des barbiers
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favoriteBarbers.map((barber) => (
                      <Card key={barber.id} className="bg-gray-800 border-gray-700 hover:border-amber-500/50 transition-all duration-300">
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-4 mb-4">
                            <div className="h-16 w-16 rounded-full bg-amber-500 flex items-center justify-center">
                              <Scissors className="h-8 w-8 text-black" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-white">{barber.name}</h4>
                              <p className="text-sm text-gray-400">{barber.salon_name}</p>
                              <div className="flex items-center space-x-1 mt-1">
                                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                <span className="text-sm text-gray-300">{barber.rating}</span>
                                <span className="text-sm text-gray-500">•</span>
                                <span className="text-sm text-gray-300">{barber.location}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Dernière visite:</span>
                              <span className="text-white">
                                {barber.last_visit ? new Date(barber.last_visit).toLocaleDateString('fr-FR') : 'Jamais'}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Réservations:</span>
                              <span className="text-white">{barber.total_bookings || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Prix moyen:</span>
                              <span className="text-white">{barber.average_price || 0} MAD</span>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2 mt-4">
                            <Button
                              size="sm"
                              className="flex-1 bg-amber-500 hover:bg-amber-600 text-black"
                              onClick={() => {
                                setSelectedBarber(barber);
                                setShowBookingModal(true);
                              }}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              Réserver
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                              onClick={() => toggleFavorite(barber.id)}
                            >
                              <Heart className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "history" && (
              <div className="space-y-6">
                {/* Statistiques de l'historique */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4 text-center">
                      <History className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">{bookingHistory.length}</p>
                      <p className="text-sm text-gray-400">Visites totales</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4 text-center">
                      <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">
                        {bookingHistory.filter(b => b.status === 'completed').length}
                      </p>
                      <p className="text-sm text-gray-400">Visites terminées</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4 text-center">
                      <CreditCard className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">
                        {bookingHistory.reduce((sum, booking) => sum + (booking.total_price || 0), 0)} MAD
                      </p>
                      <p className="text-sm text-gray-400">Total dépensé</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4 text-center">
                      <Star className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">
                        {bookingHistory.filter(b => b.reviewed).length}
                      </p>
                      <p className="text-sm text-gray-400">Avis laissés</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Filtres */}
                <div className="flex flex-wrap gap-4">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-40 bg-gray-700 border-gray-600">
                      <SelectValue placeholder="Période" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toute la période</SelectItem>
                      <SelectItem value="month">Ce mois</SelectItem>
                      <SelectItem value="quarter">Ce trimestre</SelectItem>
                      <SelectItem value="year">Cette année</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select defaultValue="all">
                    <SelectTrigger className="w-40 bg-gray-700 border-gray-600">
                      <SelectValue placeholder="Barbier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les barbiers</SelectItem>
                      {Array.from(new Set(bookingHistory.map(b => b.barber_name))).map(name => (
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select defaultValue="all">
                    <SelectTrigger className="w-40 bg-gray-700 border-gray-600">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="completed">Terminé</SelectItem>
                      <SelectItem value="cancelled">Annulé</SelectItem>
                      <SelectItem value="no-show">Absence</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Liste de l'historique */}
                {bookingHistory.length === 0 ? (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="text-center py-12">
                      <History className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">Aucun historique</h3>
                      <p className="text-gray-400 mb-6">Vous n'avez pas encore d'historique de visites</p>
                      <Button
                        onClick={() => setShowSearchModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-black"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Réserver maintenant
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {bookingHistory.map((booking) => (
                      <Card key={booking.id} className="bg-gray-800 border-gray-700">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="h-12 w-12 rounded-full bg-gray-600 flex items-center justify-center">
                                <Scissors className="h-6 w-6 text-gray-400" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-white">{booking.barber_name}</h4>
                                <p className="text-sm text-gray-400">{booking.service_names}</p>
                                <p className="text-xs text-gray-500">
                                  {booking.appointment_date} à {booking.appointment_time}
                                </p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    booking.status === "completed" 
                                      ? "bg-green-500 text-white" 
                                      : booking.status === "cancelled"
                                      ? "bg-red-500 text-white"
                                      : "bg-gray-500 text-white"
                                  }`}>
                                    {booking.status}
                                  </span>
                                  {booking.reviewed && (
                                    <span className="text-xs px-2 py-1 rounded-full bg-amber-500 text-black">
                                      Avis laissé
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-white">{booking.total_price} MAD</p>
                              <div className="mt-2 space-x-2">
                                {booking.status === "completed" && !booking.reviewed && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black"
                                  >
                                    <Star className="mr-2 h-4 w-4" />
                                    Laisser un avis
                                  </Button>
                                )}
                                {booking.status === "completed" && booking.reviewed && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    Voir l'avis
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-gray-500 text-gray-500 hover:bg-gray-500 hover:text-white"
                                  onClick={() => {
                                    setSelectedBarber({ id: booking.barber_id, name: booking.barber_name });
                                    setShowBookingModal(true);
                                  }}
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  Réserver à nouveau
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "profile" && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Mon Profil</span>
                  </CardTitle>
                  <CardDescription>
                    Gérez vos informations personnelles et préférences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {userProfile ? (
                    <div className="space-y-6">
                      {/* Profile Picture Section */}
                      <div className="flex items-center space-x-6">
                        <div className="relative">
                          <div className="h-24 w-24 rounded-full bg-amber-500 flex items-center justify-center text-2xl font-bold text-black">
                            {userProfile.firstName?.charAt(0) || "U"}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 border-gray-600"
                          >
                            <Camera className="h-4 w-4" />
                          </Button>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-white">
                            {userProfile.firstName} {userProfile.lastName}
                          </h3>
                          <p className="text-gray-400">{userProfile.email}</p>
                          <p className="text-sm text-gray-500">Client depuis {new Date().getFullYear()}</p>
                        </div>
                      </div>

                      {/* Personal Information Form */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-white">Informations Personnelles</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="firstName" className="text-white">Prénom</Label>
                            <Input
                              id="firstName"
                              value={userProfile.firstName || ""}
                              onChange={(e) => setUserProfile({...userProfile, firstName: e.target.value})}
                              className="bg-gray-700 border-gray-600 text-white"
                            />
                          </div>
                          <div>
                            <Label htmlFor="lastName" className="text-white">Nom</Label>
                            <Input
                              id="lastName"
                              value={userProfile.lastName || ""}
                              onChange={(e) => setUserProfile({...userProfile, lastName: e.target.value})}
                              className="bg-gray-700 border-gray-600 text-white"
                            />
                          </div>
                          <div>
                            <Label htmlFor="phone" className="text-white">Téléphone</Label>
                            <Input
                              id="phone"
                              value={userProfile.phone || ""}
                              onChange={(e) => setUserProfile({...userProfile, phone: e.target.value})}
                              className="bg-gray-700 border-gray-600 text-white"
                              placeholder="06 12 34 56 78"
                            />
                          </div>
                          <div>
                            <Label htmlFor="city" className="text-white">Ville</Label>
                            <Input
                              id="city"
                              value={userProfile.city || ""}
                              onChange={(e) => setUserProfile({...userProfile, city: e.target.value})}
                              className="bg-gray-700 border-gray-600 text-white"
                              placeholder="Casablanca"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="address" className="text-white">Adresse</Label>
                          <Input
                            id="address"
                            value={userProfile.address || ""}
                            onChange={(e) => setUserProfile({...userProfile, address: e.target.value})}
                            className="bg-gray-700 border-gray-600 text-white"
                            placeholder="123 Rue Example, Quartier..."
                          />
                        </div>
                      </div>

                      {/* Preferences Section */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-white">Préférences</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-white">Type de rendez-vous préféré</Label>
                            <div className="flex space-x-4">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name="locationType"
                                  value="shop"
                                  defaultChecked
                                  className="text-amber-500"
                                />
                                <span className="text-gray-300">En salon</span>
                              </label>
                              <label className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name="locationType"
                                  value="home"
                                  className="text-amber-500"
                                />
                                <span className="text-gray-300">À domicile</span>
                              </label>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-white">Notifications</Label>
                            <div className="space-y-2">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  defaultChecked
                                  className="text-amber-500"
                                />
                                <span className="text-gray-300">Rappels de rendez-vous</span>
                              </label>
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  defaultChecked
                                  className="text-amber-500"
                                />
                                <span className="text-gray-300">Offres spéciales</span>
                              </label>
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  defaultChecked
                                  className="text-amber-500"
                                />
                                <span className="text-gray-300">Nouveaux barbiers</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Statistics Section */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-white">Mes Statistiques</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-gray-700 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-amber-500">{bookingHistory.length}</div>
                            <div className="text-sm text-gray-400">Visites totales</div>
                          </div>
                          <div className="bg-gray-700 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-amber-500">{favoriteBarbers.length}</div>
                            <div className="text-sm text-gray-400">Barbiers favoris</div>
                          </div>
                          <div className="bg-gray-700 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-amber-500">
                              {bookingHistory.length > 0 ? 
                                Math.round(bookingHistory.reduce((sum, booking) => sum + (booking.total_price || 0), 0)) : 0
                              } MAD
                            </div>
                            <div className="text-sm text-gray-400">Total dépensé</div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-between pt-6">
                        <Button
                          variant="outline"
                          className="border-gray-600 text-gray-300"
                          onClick={() => {
                            // Reset form to original values
                            loadDashboardData();
                          }}
                        >
                          Annuler
                        </Button>
                        <Button
                          className="bg-amber-500 hover:bg-amber-600 text-black"
                          onClick={async () => {
                            try {
                              await profileAPI.update({
                                firstName: userProfile.firstName,
                                lastName: userProfile.lastName,
                                phone: userProfile.phone,
                                city: userProfile.city,
                                address: userProfile.address,
                              });
                              // Reload data to get updated profile
                              loadDashboardData();
                            } catch (error) {
                              console.error('Error updating profile:', error);
                            }
                          }}
                        >
                          Sauvegarder les modifications
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <User className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400">Chargement du profil...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Search/Booking Modal */}
        <Dialog open={showSearchModal} onOpenChange={setShowSearchModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Réserver un Rendez-vous</DialogTitle>
              <DialogDescription className="text-gray-300">
                Choisissez vos services et trouvez le barbier parfait
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Step 1: Service Selection */}
              {searchStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-white text-lg font-semibold">1. Choisissez vos services</Label>
                    <p className="text-gray-400 text-sm mt-1">Sélectionnez les services que vous souhaitez</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableServices.map((service) => (
                      <div
                        key={service.id}
                        onClick={() => toggleServiceSelection(service.id)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedServices.includes(service.id)
                            ? "border-amber-500 bg-amber-500/10"
                            : "border-gray-600 bg-gray-700 hover:border-gray-500"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-white">{service.name}</h3>
                            <p className="text-sm text-gray-400">{service.description}</p>
                            <p className="text-amber-500 font-medium mt-1">À partir de {service.basePrice} MAD</p>
                          </div>
                          {selectedServices.includes(service.id) && (
                            <Check className="h-5 w-5 text-amber-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowSearchModal(false)}
                      className="border-gray-600 text-gray-300"
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={proceedToSearch}
                      disabled={selectedServices.length === 0}
                      className="bg-amber-500 hover:bg-amber-600 text-black"
                    >
                      Continuer
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Barber Search */}
              {searchStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white text-lg font-semibold">2. Trouvez votre barbier</Label>
                      <p className="text-gray-400 text-sm mt-1">Recherchez et sélectionnez un barbier</p>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={backToServices}
                      className="text-gray-400 hover:text-white"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Retour
                    </Button>
                  </div>

                  {/* Search Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-white">Recherche</Label>
                      <Input
                        placeholder="Nom, salon, ville..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Date</Label>
                      <Input
                        type="date"
                        value={searchDate}
                        onChange={(e) => setSearchDate(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Heure</Label>
                      <Select value={searchTime} onValueChange={setSearchTime}>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Choisir une heure" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-700 border-gray-600">
                          {["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"].map((time) => (
                            <SelectItem key={time} value={time} className="text-white">
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Location Type */}
                  <div>
                    <Label className="text-white">Type de rendez-vous</Label>
                    <div className="flex space-x-4 mt-2">
                      {[
                        { id: "both", label: "Les deux", icon: Building },
                        { id: "shop", label: "En salon", icon: Home },
                        { id: "home", label: "À domicile", icon: Car },
                      ].map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setLocationType(type.id)}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all ${
                            locationType === type.id
                              ? "border-amber-500 bg-amber-500/10 text-amber-500"
                              : "border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500"
                          }`}
                        >
                          <type.icon className="h-4 w-4" />
                          <span>{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Barber Results */}
                  <div className="space-y-4">
                    <h3 className="text-white font-semibold">
                      Barbiers disponibles ({getFilteredBarbers().length})
                    </h3>
                    
                    {getFilteredBarbers().length === 0 ? (
                      <div className="text-center py-8">
                        <Search className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-400">Aucun barbier trouvé avec ces critères</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
                        {getFilteredBarbers().map((barber) => (
                          <div
                            key={barber.id}
                            className="p-4 bg-gray-700 rounded-lg border border-gray-600 hover:border-amber-500/50 transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="h-12 w-12 rounded-full bg-amber-500 flex items-center justify-center">
                                  <Scissors className="h-6 w-6 text-black" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-white">{barber.name}</h4>
                                  <p className="text-sm text-gray-400">{barber.salon_name}</p>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                    <span className="text-sm text-gray-300">{barber.rating}</span>
                                    <span className="text-sm text-gray-500">•</span>
                                    <span className="text-sm text-gray-300">{barber.location}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-white">
                                  {calculateTotalPrice(barber, selectedServices, searchDate, searchTime)} MAD
                                </p>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedBarber(barber);
                                    setShowSearchModal(false);
                                    setShowBookingModal(true);
                                  }}
                                  className="bg-amber-500 hover:bg-amber-600 text-black mt-2"
                                >
                                  Réserver
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Booking Confirmation Modal */}
        <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
          <DialogContent className="max-w-2xl bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Confirmer la Réservation</DialogTitle>
              <DialogDescription className="text-gray-300">
                Vérifiez les détails de votre rendez-vous
              </DialogDescription>
            </DialogHeader>

            {selectedBarber && (
              <div className="space-y-6">
                {/* Barber Info */}
                <div className="p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-amber-500 flex items-center justify-center">
                      <Scissors className="h-6 w-6 text-black" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{selectedBarber.name}</h3>
                      <p className="text-sm text-gray-400">{selectedBarber.salon_name}</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        <span className="text-sm text-gray-300">{selectedBarber.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Services */}
                <div>
                  <Label className="text-white font-semibold">Services sélectionnés</Label>
                  <div className="mt-2 space-y-2">
                    {selectedServices.map((serviceId) => (
                      <div key={serviceId} className="flex justify-between items-center p-2 bg-gray-700 rounded">
                        <span className="text-white">{getServiceName(serviceId)}</span>
                        <span className="text-amber-500 font-medium">
                          {selectedBarber.priceList?.[serviceId] || 0} MAD
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Date</Label>
                    <p className="text-gray-300 mt-1">{searchDate}</p>
                  </div>
                  <div>
                    <Label className="text-white">Heure</Label>
                    <p className="text-gray-300 mt-1">{searchTime}</p>
                  </div>
                </div>

                {/* Total Price */}
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold">Total</span>
                    <span className="text-amber-500 font-bold text-xl">
                      {calculateTotalPrice(selectedBarber, selectedServices, searchDate, searchTime)} MAD
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setShowBookingModal(false)}
                    className="border-gray-600 text-gray-300"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleBookAppointment}
                    className="bg-amber-500 hover:bg-amber-600 text-black"
                  >
                    Confirmer la Réservation
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Ajout du dashboard analytics interactif */}
        <div className="container mx-auto px-4 py-8">
          {analyticsCharts && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 animate-fade-in">
              <ChartComponent
                data={analyticsCharts.monthlyBookings || []}
                type="bar"
                xKey="month"
                yKey="count"
                title="Réservations par Mois"
                colors={["#F59E0B"]}
                height={260}
              />
              <ChartComponent
                data={analyticsCharts.statusDistribution || []}
                type="pie"
                xKey="status"
                yKey="count"
                title="Répartition des Statuts"
                colors={["#10B981", "#EF4444", "#F59E0B", "#3B82F6"]}
                height={260}
              />
            </div>
          )}
        </div>
      </div>
    );
  } catch (err: any) {
    setGlobalError(err?.message || String(err));
    return (
      <div style={{ color: 'red', background: '#222', padding: 32, fontSize: 18 }}>
        <b>Erreur dans le dashboard (render) :</b>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{err?.message || String(err)}</pre>
      </div>
    );
  }
}
