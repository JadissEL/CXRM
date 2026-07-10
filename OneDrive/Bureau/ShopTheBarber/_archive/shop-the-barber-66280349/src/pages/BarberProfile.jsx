
import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Star, MapPin, Clock, Phone, ChevronLeft, Share2, Heart } from "lucide-react";

export default function BarberProfile() {
  const [searchParams] = useSearchParams();
  const barberId = searchParams.get('id');

  const { data: barber, isLoading: barberLoading } = useQuery({
    queryKey: ['barber', barberId],
    queryFn: () => base44.entities.BarberProfile.list().then(list =>
      list.find(b => b.id === barberId)
    ),
    enabled: !!barberId
  });

  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['services', barberId],
    queryFn: () => base44.entities.Service.filter({ barber_id: barberId, is_active: true }),
    enabled: !!barberId
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', barberId],
    queryFn: () => base44.entities.Review.filter({ target_type: 'barber', target_id: barberId }),
    enabled: !!barberId
  });

  const { data: barberUser } = useQuery({
    queryKey: ['barber-user', barber?.user_id],
    queryFn: () => base44.entities.User.list().then(users =>
      users.find(u => u.id === barber.user_id)
    ),
    enabled: !!barber?.user_id
  });

  if (barberLoading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <Skeleton className="h-64 w-full" />
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="w-32 h-32 rounded-full" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!barber) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background-light dark:bg-background-dark">
        <h2 className="text-2xl font-bold text-charcoal dark:text-white mb-4">Barbier non trouvé</h2>
        <Link to={createPageUrl("Barbers")}>
          <Button>Retour à la liste</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-sans pb-24">
      {/* Header / Cover */}
      <header className="relative h-64 md:h-80 bg-charcoal">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60"
          style={{ backgroundImage: `url(${barber.cover_image || barber.portfolio_images?.[0] || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=2074'})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background-light dark:from-background-dark to-transparent" />

        {/* Navigation */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
          <Link to={createPageUrl("Barbers")}>
            <Button variant="ghost" size="icon" className="bg-white/20 backdrop-blur-md text-white hover:bg-white/30 rounded-full">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="bg-white/20 backdrop-blur-md text-white hover:bg-white/30 rounded-full">
              <Share2 className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="bg-white/20 backdrop-blur-md text-white hover:bg-white/30 rounded-full">
              <Heart className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 -mt-20 relative z-10">
        {/* Profile Info */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-32 h-32 rounded-full border-4 border-background-light dark:border-background-dark overflow-hidden shadow-xl mb-4 bg-surface-light">
            <img
              src={barberUser?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + barber.id}
              alt={barber.shop_name}
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-3xl font-display font-bold text-charcoal dark:text-white text-center mb-1">
            {barber.shop_name}
          </h1>
          <p className="text-slate dark:text-matte-silver text-lg mb-2">Master Barber</p>
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 fill-primary text-primary" />
            <span className="font-bold text-charcoal dark:text-white">{barber.rating?.toFixed(1) || "5.0"}</span>
            <span className="text-slate dark:text-matte-silver">({barber.total_reviews || 120} avis)</span>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-sm text-slate dark:text-matte-silver">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {barberUser?.address || "Paris, France"}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Ouvert jusqu'à 20h
            </div>
          </div>
        </div>

        {/* Services Section */}
        <div className="mb-8">
          <h2 className="text-xl font-display font-bold text-charcoal dark:text-white mb-4 px-2">Services</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {servicesLoading ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="aspect-square rounded-2xl" />)
            ) : services.length > 0 ? (
              services.map((service) => (
                <div key={service.id} className="group cursor-pointer">
                  <div className="aspect-square rounded-2xl overflow-hidden mb-3 bg-surface-light dark:bg-surface-dark shadow-sm group-hover:shadow-md transition-all">
                    <img
                      src={service.image || `https://source.unsplash.com/random/400x400/?barber,${service.category}`}
                      alt={service.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div >
                  <h3 className="font-bold text-charcoal dark:text-white leading-tight mb-1">{service.name}</h3>
                  <p className="text-primary font-bold">{service.price}€</p>
                </div >
              ))
            ) : (
              <p className="text-slate col-span-full text-center py-8">Aucun service disponible</p>
            )}
          </div >
        </div >

        {/* Reviews Section */}
        < div className="mb-8" >
          <h2 className="text-xl font-display font-bold text-charcoal dark:text-white mb-4 px-2">Avis Clients</h2>
          <div className="space-y-4">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.id} className="bg-surface-light dark:bg-surface-dark p-4 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {review.client_id[0]}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-charcoal dark:text-white">Client</h4>
                      <p className="text-xs text-slate">Il y a 2 mois</p>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < review.rating ? "fill-primary text-primary" : "text-slate/30"}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-slate dark:text-matte-silver text-sm leading-relaxed">
                    {review.comment}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 bg-surface-light dark:bg-surface-dark rounded-2xl">
                <p className="text-slate">Aucun avis pour le moment</p>
              </div>
            )}
          </div>
        </div >
      </div >

      {/* Sticky Bottom Action */}
      < div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-background-dark/80 backdrop-blur-lg border-t border-soft-gray dark:border-slate/10 z-50" >
        <div className="max-w-3xl mx-auto">
          <Link to={createPageUrl(`BookingForm?barberId=${barber.id}`)}>
            <Button className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-primary/25">
              Réserver Maintenant
            </Button>
          </Link>
        </div>
      </div >
    </div >
  );
}
