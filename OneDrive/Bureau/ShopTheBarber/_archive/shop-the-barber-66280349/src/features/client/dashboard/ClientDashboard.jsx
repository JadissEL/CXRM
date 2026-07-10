import { useClientDashboard } from './useClientDashboard';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Calendar,
    ShoppingBag,
    Star,
    Clock,
    Package,
    TrendingUp,
    XCircle,
    RotateCcw,
    ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";

export default function ClientDashboard() {
    const {
        user,
        bookings,
        orders,
        upcomingBookings,
        pastBookings,
        stats,
        statusColors,
        statusLabels
    } = useClientDashboard();

    return (
        <div className="min-h-screen py-12 bg-background-light dark:bg-background-dark font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                    <h1 className="text-3xl md:text-4xl font-display font-bold text-charcoal dark:text-white mb-2">
                        Bonjour, {user?.full_name || "Client"} 👋
                    </h1>
                    <p className="text-slate dark:text-matte-silver text-lg">
                        Gérez vos réservations et commandes en un coup d'œil.
                    </p>
                </motion.div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                    {[
                        { icon: Calendar, label: "RDV à venir", value: stats.upcomingCount, color: "text-primary" },
                        { icon: ShoppingBag, label: "Commandes", value: stats.ordersCount, color: "text-emerald-600" },
                        { icon: Star, label: "Visites", value: stats.completedVisits, color: "text-amber-500" },
                        { icon: TrendingUp, label: "Dépenses", value: `${stats.totalSpent}€`, color: "text-slate" }
                    ].map((stat, index) => (
                        <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                            <Card className="rounded-2xl border-none shadow-soft hover:shadow-soft-md transition-all duration-300 bg-surface-light dark:bg-surface-dark">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl bg-background-light dark:bg-background-dark ${stat.color}`}>
                                            <stat.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-charcoal dark:text-white">{stat.value}</p>
                                            <p className="text-sm text-slate dark:text-matte-silver font-medium">{stat.label}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <Tabs defaultValue="bookings" className="space-y-8">
                    <TabsList className="bg-surface-light dark:bg-surface-dark p-1 rounded-xl shadow-sm border border-soft-gray dark:border-slate/20 inline-flex h-auto">
                        <TabsTrigger value="bookings" className="rounded-lg px-6 py-3 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                            <Calendar className="w-4 h-4 mr-2" />
                            Mes Réservations
                        </TabsTrigger>
                        <TabsTrigger value="orders" className="rounded-lg px-6 py-3 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                            <Package className="w-4 h-4 mr-2" />
                            Mes Commandes
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="bookings" className="space-y-8">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-display font-bold text-charcoal dark:text-white">Mes Réservations</h2>
                            <Link to={createPageUrl("Barbers")}>
                                <Button className="bg-primary hover:bg-primary/90 text-white rounded-button shadow-soft hover:shadow-soft-md transition-all">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Nouvelle Réservation
                                </Button>
                            </Link>
                        </div>

                        {upcomingBookings.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-slate dark:text-matte-silver mb-4 uppercase tracking-wider text-sm">À Venir</h3>
                                <div className="grid md:grid-cols-2 gap-6">
                                    {upcomingBookings.map((booking, index) => (
                                        <motion.div key={booking.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                                            <Card className="rounded-2xl border border-soft-gray dark:border-slate/20 shadow-soft hover:shadow-soft-md transition-all bg-surface-light dark:bg-surface-dark overflow-hidden group">
                                                <CardContent className="p-0">
                                                    <div className="p-6 border-b border-soft-gray dark:border-slate/10">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <Badge className={`${statusColors[booking.status]} border-none px-3 py-1 rounded-full`}>
                                                                {statusLabels[booking.status]}
                                                            </Badge>
                                                            <span className="text-xl font-bold text-primary">{booking.total_price}€</span>
                                                        </div>
                                                        <div className="space-y-3">
                                                            <div className="flex items-center gap-3 text-charcoal dark:text-white">
                                                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                                                    <Calendar className="w-4 h-4" />
                                                                </div>
                                                                <span className="font-semibold text-lg">
                                                                    {format(new Date(booking.booking_date), 'EEEE dd MMMM yyyy', { locale: fr })}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-3 text-slate dark:text-matte-silver">
                                                                <div className="p-2 rounded-lg bg-soft-gray dark:bg-slate/20">
                                                                    <Clock className="w-4 h-4" />
                                                                </div>
                                                                <span className="font-medium">{booking.booking_time}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="p-4 bg-background-light dark:bg-background-dark/50 flex gap-3">
                                                        <Button variant="outline" size="sm" className="flex-1 rounded-button border-soft-gray dark:border-slate/30 hover:bg-white dark:hover:bg-surface-dark">
                                                            <RotateCcw className="w-4 h-4 mr-2" />
                                                            Reporter
                                                        </Button>
                                                        <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-button">
                                                            <XCircle className="w-4 h-4 mr-2" />
                                                            Annuler
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {pastBookings.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-slate dark:text-matte-silver mb-4 uppercase tracking-wider text-sm">Historique</h3>
                                <div className="space-y-4">
                                    {pastBookings.map((booking) => (
                                        <Card key={booking.id} className="rounded-xl border border-soft-gray dark:border-slate/20 shadow-sm bg-surface-light dark:bg-surface-dark hover:bg-background-light dark:hover:bg-surface-dark/80 transition-colors cursor-pointer group">
                                            <CardContent className="p-6">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-12 h-12 bg-soft-gray dark:bg-slate/20 rounded-xl flex items-center justify-center group-hover:bg-white dark:group-hover:bg-surface-dark transition-colors">
                                                            <Calendar className="w-6 h-6 text-slate dark:text-matte-silver" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-charcoal dark:text-white text-lg">
                                                                {format(new Date(booking.booking_date), 'dd MMM yyyy', { locale: fr })}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-slate dark:text-matte-silver text-sm">{booking.booking_time}</span>
                                                                <span className="w-1 h-1 rounded-full bg-slate/50"></span>
                                                                <Badge className={`${statusColors[booking.status]} text-xs border-none`}>
                                                                    {statusLabels[booking.status]}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        <p className="font-bold text-charcoal dark:text-white text-lg">{booking.total_price}€</p>
                                                        <ArrowRight className="w-5 h-5 text-slate/50 group-hover:text-primary transition-colors" />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {bookings.length === 0 && (
                            <div className="text-center py-16 bg-surface-light dark:bg-surface-dark rounded-3xl border border-dashed border-slate/30">
                                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Calendar className="w-10 h-10 text-primary" />
                                </div>
                                <h3 className="text-2xl font-bold text-charcoal dark:text-white mb-3">Aucune réservation</h3>
                                <p className="text-slate dark:text-matte-silver mb-8 max-w-md mx-auto">
                                    Vous n'avez pas encore de rendez-vous prévu. Découvrez nos barbiers et réservez votre prochaine coupe !
                                </p>
                                <Link to={createPageUrl("Barbers")}>
                                    <Button className="bg-primary hover:bg-primary/90 text-white rounded-button px-8 py-6 text-lg shadow-soft hover:shadow-soft-md transition-all">
                                        Trouver un Barbier
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="orders" className="space-y-8">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-display font-bold text-charcoal dark:text-white">Mes Commandes</h2>
                            <Link to={createPageUrl("Marketplace")}>
                                <Button className="bg-primary hover:bg-primary/90 text-white rounded-button shadow-soft hover:shadow-soft-md transition-all">
                                    <ShoppingBag className="w-4 h-4 mr-2" />
                                    Continuer mes Achats
                                </Button>
                            </Link>
                        </div>

                        {orders.length === 0 ? (
                            <div className="text-center py-16 bg-surface-light dark:bg-surface-dark rounded-3xl border border-dashed border-slate/30">
                                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <ShoppingBag className="w-10 h-10 text-primary" />
                                </div>
                                <h3 className="text-2xl font-bold text-charcoal dark:text-white mb-3">Aucune commande</h3>
                                <p className="text-slate dark:text-matte-silver mb-8 max-w-md mx-auto">
                                    Votre historique de commandes est vide. Explorez notre boutique pour trouver les meilleurs produits.
                                </p>
                                <Link to={createPageUrl("Marketplace")}>
                                    <Button className="bg-primary hover:bg-primary/90 text-white rounded-button px-8 py-6 text-lg shadow-soft hover:shadow-soft-md transition-all">
                                        Voir la Marketplace
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {orders.map((order) => (
                                    <Card key={order.id} className="rounded-2xl border border-soft-gray dark:border-slate/20 shadow-sm bg-surface-light dark:bg-surface-dark overflow-hidden">
                                        <CardContent className="p-6">
                                            <div className="flex justify-between items-start mb-6">
                                                <div>
                                                    <p className="font-bold text-charcoal dark:text-white text-lg mb-1">
                                                        Commande #{order.id.slice(0, 8)}
                                                    </p>
                                                    <p className="text-sm text-slate dark:text-matte-silver">
                                                        {format(new Date(order.created_date), 'dd MMMM yyyy', { locale: fr })}
                                                    </p>
                                                </div>
                                                <Badge className={`${statusColors[order.status]} border-none px-3 py-1 rounded-full`}>
                                                    {statusLabels[order.status]}
                                                </Badge>
                                            </div>
                                            <div className="bg-background-light dark:bg-background-dark/50 rounded-xl p-4 mb-6 space-y-3">
                                                {order.items?.map((item, i) => (
                                                    <div key={i} className="flex justify-between text-sm items-center">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-white dark:bg-surface-dark rounded-lg flex items-center justify-center border border-soft-gray dark:border-slate/20">
                                                                <span className="text-xs font-bold text-slate">x{item.quantity}</span>
                                                            </div>
                                                            <span className="text-charcoal dark:text-white font-medium">{item.name}</span>
                                                        </div>
                                                        <span className="text-charcoal dark:text-white font-bold">{(item.price * item.quantity).toFixed(2)}€</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex justify-between items-center pt-2">
                                                <span className="font-semibold text-slate dark:text-matte-silver">Total payé</span>
                                                <span className="text-2xl font-bold text-primary">{order.total_amount}€</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
