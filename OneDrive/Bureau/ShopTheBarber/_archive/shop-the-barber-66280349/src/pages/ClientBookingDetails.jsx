import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, MapPin, Phone, Mail, ChevronLeft, MessageSquare, XCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";

export default function ClientBookingDetails() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const bookingId = searchParams.get('id');

    const { data: booking, isLoading } = useQuery({
        queryKey: ['booking', bookingId],
        queryFn: async () => {
            const bookings = await base44.entities.Booking.list();
            return bookings.find(b => b.id === bookingId);
        },
        enabled: !!bookingId
    });

    const { data: barber } = useQuery({
        queryKey: ['barber', booking?.barber_id],
        queryFn: () => base44.entities.BarberProfile.list().then(list =>
            list.find(b => b.id === booking.barber_id)
        ),
        enabled: !!booking?.barber_id
    });

    const { data: service } = useQuery({
        queryKey: ['service', booking?.service_id],
        queryFn: () => base44.entities.Service.list().then(list =>
            list.find(s => s.id === booking.service_id)
        ),
        enabled: !!booking?.service_id
    });

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
                <Card className="max-w-md w-full">
                    <CardContent className="p-8 text-center">
                        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-charcoal dark:text-white mb-2">Réservation Introuvable</h2>
                        <p className="text-slate dark:text-matte-silver mb-6">Cette réservation n'existe pas ou a été supprimée.</p>
                        <Button onClick={() => navigate(createPageUrl("ClientDashboard"))}>
                            Retour au Tableau de Bord
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const getStatusBadge = (status) => {
        const variants = {
            pending: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-800 dark:text-amber-200", label: "En Attente" },
            confirmed: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-800 dark:text-blue-200", label: "Confirmé" },
            completed: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-800 dark:text-emerald-200", label: "Terminé" },
            cancelled: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-800 dark:text-red-200", label: "Annulé" }
        };
        const variant = variants[status] || variants.pending;
        return <Badge className={`${variant.bg} ${variant.text} border-0`}>{variant.label}</Badge>;
    };

    return (
        <div className="min-h-screen py-12 bg-background-light dark:bg-background-dark font-sans">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <Button
                    variant="ghost"
                    onClick={() => navigate(createPageUrl("ClientDashboard"))}
                    className="mb-6 text-slate hover:text-charcoal dark:text-matte-silver dark:hover:text-white pl-0"
                >
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    Retour aux Réservations
                </Button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {/* Header Card */}
                    <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark overflow-hidden">
                        <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-display font-bold mb-2">Détails de la Réservation</h1>
                                    <p className="text-white/80">Référence: #{booking.id.slice(0, 8)}</p>
                                </div>
                                {getStatusBadge(booking.status)}
                            </div>
                        </div>

                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <Avatar className="w-20 h-20 ring-4 ring-primary/20">
                                    <AvatarImage src={barber?.profile_image} />
                                    <AvatarFallback className="bg-primary text-white text-2xl">
                                        {barber?.shop_name?.[0] || "B"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold text-charcoal dark:text-white">{service?.name || "Service"}</h2>
                                    <p className="text-lg text-slate dark:text-matte-silver">chez {barber?.shop_name}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Booking Information */}
                    <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                        <CardContent className="p-6">
                            <h3 className="text-xl font-bold text-charcoal dark:text-white mb-6">Informations de Réservation</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 bg-background-light dark:bg-background-dark rounded-xl">
                                    <Calendar className="w-6 h-6 text-primary" />
                                    <div className="flex-1">
                                        <p className="text-sm text-slate dark:text-matte-silver">Date</p>
                                        <p className="font-bold text-charcoal dark:text-white">
                                            {booking.booking_date && format(new Date(booking.booking_date), 'EEEE dd MMMM yyyy', { locale: fr })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 bg-background-light dark:bg-background-dark rounded-xl">
                                    <Clock className="w-6 h-6 text-primary" />
                                    <div className="flex-1">
                                        <p className="text-sm text-slate dark:text-matte-silver">Heure</p>
                                        <p className="font-bold text-charcoal dark:text-white">{booking.booking_time}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 bg-background-light dark:bg-background-dark rounded-xl">
                                    <MapPin className="w-6 h-6 text-primary" />
                                    <div className="flex-1">
                                        <p className="text-sm text-slate dark:text-matte-silver">Adresse</p>
                                        <p className="font-bold text-charcoal dark:text-white">{barber?.address || "Non spécifié"}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact Information */}
                    <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                        <CardContent className="p-6">
                            <h3 className="text-xl font-bold text-charcoal dark:text-white mb-6">Contact</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <a href={`tel:${barber?.phone}`} className="flex items-center gap-4 p-4 bg-background-light dark:bg-background-dark rounded-xl hover:bg-primary/5 transition-colors">
                                    <Phone className="w-6 h-6 text-primary" />
                                    <div>
                                        <p className="text-sm text-slate dark:text-matte-silver">Téléphone</p>
                                        <p className="font-bold text-charcoal dark:text-white">{barber?.phone || "Non disponible"}</p>
                                    </div>
                                </a>

                                <a href={`mailto:${barber?.email}`} className="flex items-center gap-4 p-4 bg-background-light dark:bg-background-dark rounded-xl hover:bg-primary/5 transition-colors">
                                    <Mail className="w-6 h-6 text-primary" />
                                    <div>
                                        <p className="text-sm text-slate dark:text-matte-silver">Email</p>
                                        <p className="font-bold text-charcoal dark:text-white">{barber?.email || "Non disponible"}</p>
                                    </div>
                                </a>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Summary */}
                    <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                        <CardContent className="p-6">
                            <h3 className="text-xl font-bold text-charcoal dark:text-white mb-6">Résumé du Paiement</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center pb-3 border-b border-soft-gray dark:border-slate/10">
                                    <span className="text-slate dark:text-matte-silver">{service?.name}</span>
                                    <span className="font-bold text-charcoal dark:text-white">{booking.total_price}€</span>
                                </div>
                                <div className="flex justify-between items-center pt-3">
                                    <span className="text-lg font-bold text-charcoal dark:text-white">Total</span>
                                    <span className="text-2xl font-display font-bold text-primary">{booking.total_price}€</span>
                                </div>
                                <div className="pt-3">
                                    <Badge className={booking.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                                        {booking.payment_status === 'paid' ? 'Payé' : 'En Attente de Paiement'}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    {booking.status === 'pending' && (
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl h-14">
                                <MessageSquare className="w-5 h-5 mr-2" />
                                Contacter le Barbier
                            </Button>
                            <Button variant="outline" className="flex-1 border-2 border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold rounded-xl h-14">
                                <XCircle className="w-5 h-5 mr-2" />
                                Annuler la Réservation
                            </Button>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
