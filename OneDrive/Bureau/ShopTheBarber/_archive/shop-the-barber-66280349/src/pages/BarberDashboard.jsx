import { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Calendar,
  DollarSign,
  Star,
  Clock,
  Scissors,
  Plus,
  Image,
  BarChart3,
  Eye,
  Loader2,
  Package,
  Gift,
  UserCog,
  Heart,
  Shield,
  ListOrdered,
  Bell
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import BookingCalendar from "../components/barber/BookingCalendar";
import ServiceManager from "../components/barber/ServiceManager";
import AvailabilityManager from "../components/barber/AvailabilityManager";
import PortfolioManager from "../components/barber/PortfolioManager";
import BarberAnalytics from "../components/barber/BarberAnalytics";
import InventoryManager from "../components/barber/InventoryManager";
import LoyaltyManager from "../components/barber/LoyaltyManager";
import StaffManager from "../components/barber/StaffManager";
import ClientCRM from "../components/barber/ClientCRM";
import CancellationPolicyManager from "../components/barber/CancellationPolicyManager";
import VirtualQueueManager from "../components/barber/VirtualQueueManager";
import ReminderSettings from "../components/barber/ReminderSettings";

export default function BarberDashboard() {
  const queryClient = useQueryClient();
  const [isCreateProfileOpen, setIsCreateProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    shop_name: '',
    specialties: '',
    experience_years: ''
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: barberProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['my-barber-profile', user?.id],
    queryFn: () => base44.entities.BarberProfile.filter({ user_id: user.id }).then(profiles => profiles[0]),
    enabled: !!user
  });

  const { data: services = [] } = useQuery({
    queryKey: ['my-services', barberProfile?.id],
    queryFn: () => base44.entities.Service.filter({ barber_id: barberProfile.id }),
    enabled: !!barberProfile
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['my-bookings', barberProfile?.id],
    queryFn: () => base44.entities.Booking.filter({ barber_id: barberProfile.id }, '-booking_date'),
    enabled: !!barberProfile
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['my-reviews', barberProfile?.id],
    queryFn: () => base44.entities.Review.filter({ target_type: 'barber', target_id: barberProfile.id }),
    enabled: !!barberProfile
  });

  const createProfileMutation = useMutation({
    mutationFn: (data) => base44.entities.BarberProfile.create({
      ...data,
      user_id: user.id,
      specialties: data.specialties.split(',').map(s => s.trim()).filter(s => s),
      experience_years: parseInt(data.experience_years) || 0
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-barber-profile'] });
      setIsCreateProfileOpen(false);
    }
  });

  // Statistics
  const todayBookings = bookings.filter(b => 
    b.booking_date === format(new Date(), 'yyyy-MM-dd')
  ).length;

  const pendingBookings = bookings.filter(b => b.status === 'pending').length;

  const totalRevenue = bookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + (b.total_price || 0), 0);

  const stats = [
    {
      title: "Aujourd'hui",
      value: todayBookings,
      icon: Calendar,
      color: "bg-[#0B2545]",
      subtitle: "rendez-vous"
    },
    {
      title: "En Attente",
      value: pendingBookings,
      icon: Clock,
      color: "bg-[#D08B3D]",
      subtitle: "à confirmer"
    },
    {
      title: "Revenus Totaux",
      value: `${totalRevenue.toFixed(0)}€`,
      icon: DollarSign,
      color: "bg-[#1E7A4B]",
      subtitle: "générés"
    },
    {
      title: "Note Moyenne",
      value: barberProfile?.rating?.toFixed(1) || "5.0",
      icon: Star,
      color: "bg-[#D08B3D]",
      subtitle: `${reviews.length} avis`
    }
  ];

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA]">
        <Loader2 className="w-8 h-8 animate-spin text-[#D08B3D]" />
      </div>
    );
  }

  if (!barberProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA] p-4">
        <Card className="max-w-md w-full rounded-[12px] border-2 border-slate-200 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-[#0B2545] rounded-[12px] flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Scissors className="w-10 h-10 text-[#D08B3D]" />
            </div>
            <h2 className="text-2xl font-bold text-[#0B2545] mb-2">Bienvenue !</h2>
            <p className="text-[#4B5563] mb-6">
              Créez votre profil barbier pour commencer à recevoir des réservations
            </p>
            <Button 
              onClick={() => setIsCreateProfileOpen(true)}
              className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white w-full rounded-[10px] min-h-[44px]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer Mon Profil Barbier
            </Button>
          </CardContent>
        </Card>

        {/* Create Profile Dialog */}
        <Dialog open={isCreateProfileOpen} onOpenChange={setIsCreateProfileOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer votre Profil Barbier</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              createProfileMutation.mutate(profileForm);
            }} className="space-y-4">
              <div>
                <Label>Nom du Salon *</Label>
                <Input
                  value={profileForm.shop_name}
                  onChange={(e) => setProfileForm({ ...profileForm, shop_name: e.target.value })}
                  placeholder="Ex: Barber Shop Paris"
                  required
                />
              </div>
              <div>
                <Label>Spécialités (séparées par des virgules)</Label>
                <Input
                  value={profileForm.specialties}
                  onChange={(e) => setProfileForm({ ...profileForm, specialties: e.target.value })}
                  placeholder="Fade, Barbe, Coupe classique"
                />
              </div>
              <div>
                <Label>Années d'expérience</Label>
                <Input
                  type="number"
                  min="0"
                  value={profileForm.experience_years}
                  onChange={(e) => setProfileForm({ ...profileForm, experience_years: e.target.value })}
                  placeholder="5"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateProfileOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={createProfileMutation.isPending}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                >
                  {createProfileMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Créer
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 bg-[#F7F8FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#0B2545] mb-2">
                {barberProfile.shop_name}
              </h1>
              <p className="text-[#4B5563]">
                Tableau de bord barbier • {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
              </p>
            </div>
            <Link to={createPageUrl(`BarberProfile?id=${barberProfile.id}`)}>
              <Button variant="outline" className="border-[#0B2545] text-[#0B2545] rounded-[10px] min-h-[44px]">
                <Eye className="w-4 h-4 mr-2" />
                Voir Mon Profil Public
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="rounded-[12px] border-2 border-slate-200 hover:border-[#D08B3D] hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 ${stat.color} rounded-[10px] flex items-center justify-center mb-4 shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-sm text-[#4B5563] mb-1">{stat.title}</h3>
                  <p className="text-3xl font-bold text-[#0B2545] mb-1">{stat.value}</p>
                  <p className="text-xs text-[#4B5563]">{stat.subtitle}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList className="bg-white rounded-[10px] border border-slate-200 p-1 h-auto flex-wrap">
            <TabsTrigger value="calendar" className="rounded-[8px] min-h-[44px] data-[state=active]:bg-[#0B2545] data-[state=active]:text-white">
              <Calendar className="w-4 h-4 mr-2" />Calendrier
            </TabsTrigger>
            <TabsTrigger value="services" className="rounded-[8px] min-h-[44px] data-[state=active]:bg-[#0B2545] data-[state=active]:text-white">
              <Scissors className="w-4 h-4 mr-2" />Services
            </TabsTrigger>
            <TabsTrigger value="availability" className="rounded-[8px] min-h-[44px] data-[state=active]:bg-[#0B2545] data-[state=active]:text-white">
              <Clock className="w-4 h-4 mr-2" />Disponibilités
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="rounded-[8px] min-h-[44px] data-[state=active]:bg-[#0B2545] data-[state=active]:text-white">
              <Image className="w-4 h-4 mr-2" />Portfolio
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-[8px] min-h-[44px] data-[state=active]:bg-[#0B2545] data-[state=active]:text-white">
              <BarChart3 className="w-4 h-4 mr-2" />Analytics
            </TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-[8px] min-h-[44px] data-[state=active]:bg-[#0B2545] data-[state=active]:text-white">
              <Star className="w-4 h-4 mr-2" />Avis
            </TabsTrigger>
            <TabsTrigger value="inventory" className="rounded-[8px] min-h-[44px] data-[state=active]:bg-[#0B2545] data-[state=active]:text-white">
              <Package className="w-4 h-4 mr-2" />Inventaire
            </TabsTrigger>
            <TabsTrigger value="loyalty" className="rounded-[8px] min-h-[44px] data-[state=active]:bg-[#0B2545] data-[state=active]:text-white">
              <Gift className="w-4 h-4 mr-2" />Fidélité
            </TabsTrigger>
            <TabsTrigger value="staff" className="rounded-[8px] min-h-[44px] data-[state=active]:bg-[#0B2545] data-[state=active]:text-white">
              <UserCog className="w-4 h-4 mr-2" />Équipe
            </TabsTrigger>
            <TabsTrigger value="crm" className="rounded-[8px] min-h-[44px] data-[state=active]:bg-[#0B2545] data-[state=active]:text-white">
              <Heart className="w-4 h-4 mr-2" />CRM
            </TabsTrigger>
            <TabsTrigger value="queue" className="rounded-[8px] min-h-[44px] data-[state=active]:bg-[#0B2545] data-[state=active]:text-white">
              <ListOrdered className="w-4 h-4 mr-2" />File d'Attente
            </TabsTrigger>
            <TabsTrigger value="policies" className="rounded-[8px] min-h-[44px] data-[state=active]:bg-[#0B2545] data-[state=active]:text-white">
              <Shield className="w-4 h-4 mr-2" />Annulation
            </TabsTrigger>
            <TabsTrigger value="reminders" className="rounded-[8px] min-h-[44px] data-[state=active]:bg-[#0B2545] data-[state=active]:text-white">
              <Bell className="w-4 h-4 mr-2" />Rappels
            </TabsTrigger>
          </TabsList>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <BookingCalendar 
              barberId={barberProfile.id} 
              bookings={bookings} 
              services={services} 
            />
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services">
            <ServiceManager 
              barberId={barberProfile.id} 
              services={services} 
            />
          </TabsContent>

          {/* Availability Tab */}
          <TabsContent value="availability">
            <AvailabilityManager barberId={barberProfile.id} />
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio">
            <PortfolioManager barberProfile={barberProfile} />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <BarberAnalytics 
              bookings={bookings} 
              services={services} 
              reviews={reviews} 
            />
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <Card className="border-2 border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Avis Clients ({reviews.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reviews.length === 0 ? (
                    <div className="text-center py-12">
                      <Star className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">Aucun avis pour le moment</p>
                    </div>
                  ) : (
                    reviews.map((review) => (
                      <div key={review.id} className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-5 h-5 ${
                                  i < review.rating
                                    ? "text-yellow-400 fill-current"
                                    : "text-slate-300"
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-slate-500">
                            {format(new Date(review.created_date), 'dd MMMM yyyy', { locale: fr })}
                          </p>
                        </div>
                        {review.title && (
                          <h4 className="font-semibold text-slate-900 mb-2">{review.title}</h4>
                        )}
                        <p className="text-slate-700">{review.comment}</p>
                        
                        {review.images && review.images.length > 0 && (
                          <div className="flex gap-2 mt-3">
                            {review.images.map((img, i) => (
                              <img key={i} src={img} alt={`Review ${i + 1}`} className="w-16 h-16 rounded-lg object-cover" />
                            ))}
                          </div>
                        )}

                        {review.vendor_response && (
                          <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                            <p className="text-sm font-semibold text-blue-900 mb-1">Votre réponse</p>
                            <p className="text-sm text-blue-800">{review.vendor_response}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory">
            <InventoryManager barberId={barberProfile.id} />
          </TabsContent>

          {/* Loyalty Tab */}
          <TabsContent value="loyalty">
            <LoyaltyManager barberId={barberProfile.id} />
          </TabsContent>

          {/* Staff Tab */}
          <TabsContent value="staff">
            <StaffManager barberId={barberProfile.id} bookings={bookings} services={services} />
          </TabsContent>

          {/* CRM Tab */}
          <TabsContent value="crm">
            <ClientCRM barberId={barberProfile.id} />
          </TabsContent>

          {/* Virtual Queue Tab */}
          <TabsContent value="queue">
            <VirtualQueueManager barberId={barberProfile.id} services={services} />
          </TabsContent>

          {/* Cancellation Policies Tab */}
          <TabsContent value="policies">
            <CancellationPolicyManager barberId={barberProfile.id} />
          </TabsContent>

          {/* Reminders Tab */}
          <TabsContent value="reminders">
            <ReminderSettings barberId={barberProfile.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}