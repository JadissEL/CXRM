import { useClientBookingDetails } from './useClientBookingDetails';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Phone, Mail, ChevronLeft, MessageSquare, XCircle, Loader2 } from "lucide-react";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from "framer-motion";

export default function ClientBookingDetails() {
    const navigate = useNavigate();
    const { booking, barber, service, getStatusBadge, isLoading } = useClientBookingDetails();

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#D08B3D]" /></div>;
    }

    if (!booking) {
        return <div className="min-h-screen flex items-center justify-center"><p>Réservation non trouvée</p></div>;
    }

    const statusBadge = getStatusBadge(booking.status);

    return (
        <div className="min-h-screen py-12 bg-[#F7F8FA]">
            <div className="max-w-4xl mx-auto px-4">
                <Button variant="ghost" onClick={() => navigate(createPageUrl("ClientDashboard"))} className="mb-6">
                    <ChevronLeft className="w-4 h-4 mr-2" />Retour
                </Button>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="rounded-[12px] border-2 border-slate-200 mb-6">
                        <CardContent className="p-8">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h1 className="text-3xl font-bold text-[#0B2545] mb-2">Détails de la réservation</h1>
                                    <p className="text-[#4B5563]">Réservation #{booking.id?.slice(0, 8)}</p>
                                </div>
                                <Badge className={`${statusBadge.bg} ${statusBadge.text} border-0 px-4 py-2`}>
                                    {statusBadge.label}
                                </Badge>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 mb-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-5 h-5 text-[#D08B3D]" />
                                        <div>
                                            <p className="text-sm text-[#4B5563]">Date</p>
                                            <p className="font-semibold text-[#0B2545]">
                                                {format(new Date(booking.booking_date), 'EEEE dd MMMM yyyy', { locale: fr })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Clock className="w-5 h-5 text-[#D08B3D]" />
                                        <div>
                                            <p className="text-sm text-[#4B5563]">Heure</p>
                                            <p className="font-semibold text-[#0B2545]">{booking.booking_time}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {service && (
                                        <div>
                                            <p className="text-sm text-[#4B5563] mb-1">Service</p>
                                            <p className="font-semibold text-[#0B2545]">{service.name}</p>
                                            <p className="text-2xl font-bold text-[#D08B3D] mt-2">{booking.total_price}€</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {barber && (
                                <div className="border-t pt-6">
                                    <h2 className="font-bold text-[#0B2545] mb-4">Votre barbier</h2>
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-[#D08B3D] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                            {barber.shop_name?.[0] || 'B'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-[#0B2545]">{barber.shop_name}</p>
                                            {barber.phone && (
                                                <div className="flex items-center gap-2 text-sm text-[#4B5563] mt-1">
                                                    <Phone className="w-4 h-4" />
                                                    {barber.phone}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {booking.status === 'confirmed' && (
                                <div className="border-t pt-6 mt-6 flex gap-4">
                                    <Button variant="outline" className="flex-1 rounded-[10px]">
                                        <MessageSquare className="w-4 h-4 mr-2" />Contacter
                                    </Button>
                                    <Button variant="outline" className="flex-1 rounded-[10px] border-red-200 text-red-600 hover:bg-red-50">
                                        <XCircle className="w-4 h-4 mr-2" />Annuler
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
