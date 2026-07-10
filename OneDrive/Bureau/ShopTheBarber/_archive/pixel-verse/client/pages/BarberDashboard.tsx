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
  Calendar,
  Clock,
  Star,
  MapPin,
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
import { analyticsAPI } from "../../shared/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import BarberVideoManager from "../components/BarberVideoManager";
import BlogArticleEditor from "../components/BlogArticleEditor";
import { ChartComponent } from "../components/analytics/ChartComponent";

export default function BarberDashboard() {
  const [globalError, setGlobalError] = React.useState<string | null>(null);
  const [showNotifications, setShowNotifications] = React.useState<boolean>(false);
  const [activeTab, setActiveTab] = React.useState<string>("overview");
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [dashboardData, setDashboardData] = React.useState<any>(null);
  const [videos, setVideos] = React.useState<any[]>([]);
  const [articles, setArticles] = React.useState<any[]>([]);
  const [barberId, setBarberId] = React.useState<number | null>(null);
  const [notifications, setNotifications] = React.useState<any[]>([]);
  // Ajouter un état pour les données analytics détaillées
  const [analyticsCharts, setAnalyticsCharts] = React.useState<any>(null);

  // Ajout d'un effet pour capturer les erreurs non catchées
  React.useEffect(() => {
    const handler = (event: ErrorEvent) => {
      setGlobalError(event.message || 'Erreur inconnue');
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

  // Ajout d'un log pour vérifier le render
  console.log('Rendering BarberDashboard...');

  // Check authentication on mount
  React.useEffect(() => {
    loadDashboardData();
    loadBarberProfile();
    loadNotifications();
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

  // Charger les données analytics détaillées
  const loadAnalyticsCharts = async () => {
    try {
      const res = await fetch("/api/analytics/barber");
      if (res.ok) {
        setAnalyticsCharts(await res.json());
      }
    } catch (e) {
      setAnalyticsCharts(null);
    }
  };

  React.useEffect(() => {
    loadAnalyticsCharts();
  }, []);

  const loadBarberProfile = async () => {
    try {
      console.log('Loading barber profile...');
      const token = localStorage.getItem('token');
      console.log('Token:', token ? 'Present' : 'Missing');
      
      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Profile response status:', response.status);
      
      if (response.ok) {
        const profile = await response.json();
        console.log('Profile data:', profile);
        
        if (profile.barberProfile) {
          console.log('Barber profile found, ID:', profile.barberProfile.id);
          setBarberId(profile.barberProfile.id);
          loadVideos(profile.barberProfile.id);
          loadArticles();
        } else {
          console.log('No barber profile found in response');
        }
      } else {
        console.log('Profile request failed:', response.status);
      }
    } catch (error) {
      console.error('Error loading barber profile:', error);
    }
  };

  const loadVideos = async (id: number) => {
    try {
      const response = await fetch(`/api/barber-videos/${id}`);
      if (response.ok) {
        const videosData = await response.json();
        setVideos(videosData);
      }
    } catch (error) {
      console.error('Error loading videos:', error);
    }
  };

  const loadArticles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/blog/articles?author=me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setArticles(data.articles || []);
      }
    } catch (error) {
      console.error('Error loading articles:', error);
    }
  };

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const overview = await analyticsAPI.getOverview();
      setDashboardData(overview);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const formatCurrency = (value: number) => `${value.toFixed(2)} MAD`;

  try {
    if (globalError) {
      return (
        <div style={{ color: 'red', background: '#222', padding: 32, fontSize: 18 }}>
          <b>Erreur dans le dashboard barbier :</b>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{globalError}</pre>
        </div>
      );
    }

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
                Dashboard Barbier
              </span>
            </div>

            <div className="flex items-center space-x-3 relative">
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
              <button
                className="relative p-2 rounded-full hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 notifications-container"
                onClick={() => setShowNotifications((v) => !v)}
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5 text-amber-500" />
                {notifications && notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                    {notifications.length}
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
                    {notifications && notifications.length > 0 ? (
                      notifications.map((notif, idx) => (
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
              <Link to="/barber-settings">
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/barber-services">
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                  <Scissors className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/barber-reports">
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                  <BookOpen className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                <User className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {analyticsCharts && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 animate-fade-in">
              <ChartComponent
                data={analyticsCharts.monthlyRevenue || []}
                type="area"
                xKey="month"
                yKey="revenue"
                title="Revenus par Mois"
                colors={["#10B981"]}
                height={260}
              />
              <ChartComponent
                data={analyticsCharts.topServices || []}
                type="bar"
                xKey="service"
                yKey="count"
                title="Top Services"
                colors={["#F59E0B"]}
                height={260}
              />
            </div>
          )}
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Rendez-vous</p>
                    <p className="text-2xl font-bold text-white">
                      {isLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        dashboardData?.totalAppointments || 0
                      )}
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
                    <p className="text-sm text-gray-400">Revenus Totaux</p>
                    <p className="text-2xl font-bold text-white">
                      {isLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        formatCurrency(dashboardData?.totalRevenue || 0)
                      )}
                    </p>
                  </div>
                  <CreditCard className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Note Moyenne</p>
                    <p className="text-2xl font-bold text-white">
                      {isLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        parseFloat(dashboardData?.avgRating || 0).toFixed(1)
                      )}
                    </p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Clients Actifs</p>
                    <p className="text-2xl font-bold text-white">
                      {isLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        dashboardData?.totalClients || 0
                      )}
                    </p>
                  </div>
                  <User className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

                     {/* Tabs */}
           <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg mb-8 overflow-x-auto">
             {[
               { id: "overview", label: "Vue d'ensemble", icon: Home },
               { id: "appointments", label: "Réservations", icon: Calendar },
               { id: "clients", label: "Clients", icon: User },
               { id: "services", label: "Services", icon: Scissors },
               { id: "videos", label: "Vidéos", icon: Camera },
               { id: "articles", label: "Articles", icon: BookOpen },
               { id: "earnings", label: "Revenus", icon: CreditCard },
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Prochaines Réservations */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5" />
                      <span>Prochaines Réservations</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Calendar className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-300 mb-2">
                        Aucune Réservation
                      </h3>
                      <p className="text-gray-500">
                        Aucune réservation enregistrée pour le moment.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Avis Récents */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Star className="h-5 w-5" />
                      <span>Avis Récents</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Star className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-300 mb-2">
                        Aucun Avis
                      </h3>
                      <p className="text-gray-500">
                        Aucun avis reçu pour le moment.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "appointments" && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Gestion des Réservations</CardTitle>
                  <CardDescription>
                    Gérez vos réservations et votre planning
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Calendar className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-300 mb-2">
                      Aucune Réservation
                    </h3>
                    <p className="text-gray-500">
                      Aucune réservation enregistrée pour le moment.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "clients" && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Mes Clients</CardTitle>
                  <CardDescription>
                    Gérez votre base de clients
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <User className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-300 mb-2">
                      Aucun Client
                    </h3>
                    <p className="text-gray-500">
                      Vous n'avez pas encore de clients enregistrés.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "services" && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Mes Services</CardTitle>
                  <CardDescription>
                    Gérez vos services et tarifs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Scissors className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-300 mb-2">
                      Gestion des Services
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Ajoutez, modifiez et gérez vos services avec leurs prix et détails.
                    </p>
                    <Link to="/barber-services">
                      <Button className="bg-amber-500 hover:bg-amber-600 text-black">
                        <Scissors className="h-4 w-4 mr-2" />
                        Gérer mes Services
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "videos" && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Mes Vidéos</CardTitle>
                  <CardDescription>
                    Gérez vos vidéos de présentation (maximum 3)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {barberId ? (
                    <BarberVideoManager
                      barberId={barberId}
                      videos={videos}
                      onVideosChange={() => loadVideos(barberId)}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <div className="h-16 w-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">📹</span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-300 mb-2">
                        Chargement du profil...
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Veuillez patienter pendant le chargement de votre profil barbier.
                      </p>
                      <Button 
                        onClick={() => {
                          console.log('Debug - barberId:', barberId);
                          console.log('Debug - videos:', videos);
                          loadBarberProfile();
                        }}
                        className="bg-amber-500 hover:bg-amber-600 text-black"
                      >
                        Recharger le profil
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "articles" && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Mes Articles</CardTitle>
                  <CardDescription>
                    Créez et gérez vos articles de blog
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BlogArticleEditor
                    articles={articles}
                    onArticlesChange={loadArticles}
                  />
                </CardContent>
              </Card>
            )}

            {activeTab === "earnings" && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Mes Revenus</CardTitle>
                  <CardDescription>
                    Suivez vos revenus et performances
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <CreditCard className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-300 mb-2">
                      Gestion des Revenus
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Consultez vos statistiques de revenus, graphiques et historique des transactions.
                    </p>
                    <Link to="/barber-earnings">
                      <Button className="bg-amber-500 hover:bg-amber-600 text-black">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Voir mes Revenus
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  } catch (err: any) {
    setGlobalError(err?.message || String(err));
    return (
      <div style={{ color: 'red', background: '#222', padding: 32, fontSize: 18 }}>
        <b>Erreur dans le dashboard barbier (render) :</b>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{err?.message || String(err)}</pre>
      </div>
    );
  }
}
