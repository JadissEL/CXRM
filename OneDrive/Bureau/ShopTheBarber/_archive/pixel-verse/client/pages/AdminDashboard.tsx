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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  User,
  Calendar,
  Settings,
  Bell,
  Home,
  Scissors,
  Clock,
  Star,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  X,
  AlertCircle,
  Zap,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ChartComponent } from "../components/analytics/ChartComponent";

export default function AdminDashboard() {
  const [globalError, setGlobalError] = React.useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Ajout d'un état pour les données analytics détaillées
  const [analyticsCharts, setAnalyticsCharts] = React.useState<any>(null);

  // Charger les données analytics détaillées
  const loadAnalyticsCharts = async () => {
    try {
      const res = await fetch("/api/analytics/admin");
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

  // Ajout d'un effet pour capturer les erreurs non catchées
  React.useEffect(() => {
    const handler = (event: ErrorEvent) => {
      setGlobalError(event.message || 'Erreur inconnue');
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

  // Ajout d'un log pour vérifier le render
  console.log('Rendering AdminDashboard...');

  // Vérifier si l'utilisateur est admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-accent mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Accès Refusé</h1>
          <p className="text-muted-foreground mb-4">
            Vous devez être administrateur pour accéder à cette page.
          </p>
          <Button onClick={() => navigate('/')} className="moroccan-button">
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  try {
    if (globalError) {
      return (
        <div style={{ color: 'red', background: '#222', padding: 32, fontSize: 18 }}>
          <b>Erreur dans le dashboard admin :</b>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{globalError}</pre>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <Home className="h-4 w-4 mr-2" />
                  Accueil
                </Button>
              </Link>
                           <div className="flex items-center space-x-2">
               <AlertCircle className="h-6 w-6 text-accent" />
               <span className="font-display text-xl font-bold text-foreground">
                 Admin Dashboard
               </span>
             </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <Bell className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-accent-foreground" />
                </div>
                <span className="text-sm font-medium text-foreground">{user.email}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Bienvenue, {user.email}
            </h1>
            <p className="text-muted-foreground">
              Gérez votre plateforme ShopTheBarber depuis ce tableau de bord.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="moroccan-card animate-fade-in">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Utilisateurs</p>
                    <p className="text-2xl font-bold text-foreground">1,234</p>
                  </div>
                                   <div className="h-12 w-12 bg-primary/20 rounded-lg flex items-center justify-center">
                   <User className="h-6 w-6 text-primary" />
                 </div>
                </div>
              </CardContent>
            </Card>

            <Card className="moroccan-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Barbiers</p>
                    <p className="text-2xl font-bold text-foreground">89</p>
                  </div>
                  <div className="h-12 w-12 bg-accent/20 rounded-lg flex items-center justify-center">
                    <Scissors className="h-6 w-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="moroccan-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Réservations</p>
                    <p className="text-2xl font-bold text-foreground">567</p>
                  </div>
                  <div className="h-12 w-12 bg-secondary/20 rounded-lg flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-secondary-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="moroccan-card animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Revenus</p>
                    <p className="text-2xl font-bold text-foreground">45.2K</p>
                  </div>
                                   <div className="h-12 w-12 bg-moroccan-green/20 rounded-lg flex items-center justify-center">
                   <Star className="h-6 w-6 text-moroccan-green" />
                 </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-muted">
                           <TabsTrigger value="overview" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
               <Home className="h-4 w-4 mr-2" />
               Vue d'ensemble
             </TabsTrigger>
             <TabsTrigger value="users" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
               <User className="h-4 w-4 mr-2" />
               Utilisateurs
             </TabsTrigger>
              <TabsTrigger value="barbers" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                <Scissors className="h-4 w-4 mr-2" />
                Barbiers
              </TabsTrigger>
              <TabsTrigger value="bookings" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                Réservations
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <Card className="moroccan-card">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Home className="h-5 w-5 mr-2 text-accent" />
                      Activité Récente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { action: "Nouveau barbier inscrit", time: "Il y a 2h", icon: Plus, color: "text-green-500" },
                        { action: "Réservation annulée", time: "Il y a 4h", icon: X, color: "text-red-500" },
                        { action: "Paiement reçu", time: "Il y a 6h", icon: CheckCircle, color: "text-green-500" },
                        { action: "Nouveau client", time: "Il y a 8h", icon: User, color: "text-blue-500" },
                      ].map((item, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <div className={`h-8 w-8 rounded-full bg-muted flex items-center justify-center`}>
                            <item.icon className={`h-4 w-4 ${item.color}`} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{item.action}</p>
                            <p className="text-xs text-muted-foreground">{item.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="moroccan-card">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Zap className="h-5 w-5 mr-2 text-accent" />
                      Actions Rapides
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <Button 
                        variant="outline" 
                        className="h-20 flex flex-col border-accent/30 hover:bg-accent/10"
                        onClick={() => navigate('/admin/users')}
                      >
                        <User className="h-6 w-6 mb-2 text-accent" />
                        Gérer Utilisateurs
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-20 flex flex-col border-accent/30 hover:bg-accent/10"
                        onClick={() => navigate('/admin/barbers')}
                      >
                        <Scissors className="h-6 w-6 mb-2 text-accent" />
                        Gérer Barbiers
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-20 flex flex-col border-accent/30 hover:bg-accent/10"
                        onClick={() => navigate('/admin-reports')}
                      >
                        <Calendar className="h-6 w-6 mb-2 text-accent" />
                        Voir Réservations
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-20 flex flex-col border-accent/30 hover:bg-accent/10"
                        onClick={() => navigate('/admin/analytics')}
                      >
                        <Star className="h-6 w-6 mb-2 text-accent" />
                        Voir Analytics
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <Card className="moroccan-card">
                <CardHeader>
                  <CardTitle>Gestion des Utilisateurs</CardTitle>
                  <CardDescription>
                    Gérez les comptes utilisateurs et leurs permissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Consultez et gérez tous les utilisateurs de la plateforme, leurs comptes et leurs permissions.
                    </p>
                    <Button onClick={() => navigate('/admin/users')} className="moroccan-button">
                      <User className="h-4 w-4 mr-2" />
                      Accéder à la Gestion
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="barbers" className="space-y-4">
              <Card className="moroccan-card">
                <CardHeader>
                  <CardTitle>Gestion des Barbiers</CardTitle>
                  <CardDescription>
                    Gérez les profils et services des barbiers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Consultez et gérez tous les barbiers, leurs profils, services et disponibilités.
                    </p>
                    <Button onClick={() => navigate('/admin/barbers')} className="moroccan-button">
                      <Scissors className="h-4 w-4 mr-2" />
                      Accéder à la Gestion
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bookings" className="space-y-4">
              <Card className="moroccan-card">
                <CardHeader>
                  <CardTitle>Gestion des Réservations</CardTitle>
                  <CardDescription>
                    Consultez et gérez toutes les réservations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Consultez et gérez toutes les réservations, les conflits et les annulations.
                    </p>
                    <Button onClick={() => navigate('/admin-reports')} className="moroccan-button">
                      <Calendar className="h-4 w-4 mr-2" />
                      Accéder aux Rapports
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Additional Actions */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="moroccan-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Edit className="h-5 w-5 mr-2 text-accent" />
                  Modération
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Modérez le contenu des articles et vidéos.
                </p>
                <Button onClick={() => navigate('/admin/moderation')} className="moroccan-button w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  Modérer le Contenu
                </Button>
              </CardContent>
            </Card>

            <Card className="moroccan-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="h-5 w-5 mr-2 text-accent" />
                  Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Consultez les statistiques détaillées.
                </p>
                <Button onClick={() => navigate('/admin/analytics')} className="moroccan-button w-full">
                  <Star className="h-4 w-4 mr-2" />
                  Voir les Analytics
                </Button>
              </CardContent>
            </Card>

            <Card className="moroccan-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-accent" />
                  Paramètres
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Configurez les paramètres de la plateforme.
                </p>
                <Button onClick={() => navigate('/admin-settings')} className="moroccan-button w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurer
                </Button>
              </CardContent>
            </Card>
          </div>

          {analyticsCharts && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 animate-fade-in">
              <ChartComponent
                data={analyticsCharts.platformStats || []}
                type="bar"
                xKey="label"
                yKey="value"
                title="Statistiques Plateforme"
                colors={["#3B82F6"]}
                height={260}
              />
              <ChartComponent
                data={analyticsCharts.revenueEvolution || []}
                type="area"
                xKey="month"
                yKey="revenue"
                title="Évolution des Revenus"
                colors={["#F59E0B"]}
                height={260}
              />
            </div>
          )}
        </main>
      </div>
    );
  } catch (err: any) {
    setGlobalError(err?.message || String(err));
    return (
      <div style={{ color: 'red', background: '#222', padding: 32, fontSize: 18 }}>
        <b>Erreur dans le dashboard admin (render) :</b>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{err?.message || String(err)}</pre>
      </div>
    );
  }
}
