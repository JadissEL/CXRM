import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Search, Phone, Mail, Calendar } from "lucide-react";
import { motion } from "framer-motion";

export default function BarberClientList() {
    const clients = [
        { id: 1, name: "Jean Dupont", email: "jean@email.com", phone: "+33 6 12 34 56 78", visits: 12, lastVisit: "2024-11-28", avatar: null },
        { id: 2, name: "Marie Martin", email: "marie@email.com", phone: "+33 6 23 45 67 89", visits: 8, lastVisit: "2024-11-25", avatar: null },
        { id: 3, name: "Pierre Dubois", email: "pierre@email.com", phone: "+33 6 34 56 78 90", visits: 15, lastVisit: "2024-11-30", avatar: null }
    ];

    return (
        <div className="min-h-screen py-12 bg-background-light dark:bg-background-dark font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <h1 className="text-4xl font-display font-bold text-charcoal dark:text-white mb-2">Mes Clients</h1>
                    <p className="text-lg text-slate dark:text-matte-silver">Gérez votre base de clients</p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                        <CardContent className="p-6">
                            <Users className="w-10 h-10 text-primary mb-3" />
                            <p className="text-sm text-slate dark:text-matte-silver mb-1">Total Clients</p>
                            <p className="text-4xl font-display font-bold text-charcoal dark:text-white">{clients.length}</p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                        <CardContent className="p-6">
                            <Calendar className="w-10 h-10 text-emerald-600 mb-3" />
                            <p className="text-sm text-slate dark:text-matte-silver mb-1">Visites Totales</p>
                            <p className="text-4xl font-display font-bold text-charcoal dark:text-white">
                                {clients.reduce((sum, c) => sum + c.visits, 0)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                        <CardContent className="p-6">
                            <Users className="w-10 h-10 text-blue-600 mb-3" />
                            <p className="text-sm text-slate dark:text-matte-silver mb-1">Clients Réguliers</p>
                            <p className="text-4xl font-display font-bold text-charcoal dark:text-white">
                                {clients.filter(c => c.visits >= 10).length}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark mb-6">
                    <CardContent className="p-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate" />
                            <Input placeholder="Rechercher un client..." className="pl-10 rounded-xl" />
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    {clients.map((client, idx) => (
                        <motion.div key={client.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                            <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="w-16 h-16 ring-4 ring-primary/20">
                                                <AvatarImage src={client.avatar} />
                                                <AvatarFallback className="bg-primary text-white text-xl">{client.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h3 className="font-bold text-charcoal dark:text-white text-lg mb-2">{client.name}</h3>
                                                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                                                    <div className="flex items-center gap-2 text-sm text-slate dark:text-matte-silver">
                                                        <Mail className="w-4 h-4" />
                                                        <span>{client.email}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-slate dark:text-matte-silver">
                                                        <Phone className="w-4 h-4" />
                                                        <span>{client.phone}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-center">
                                                <p className="text-sm text-slate dark:text-matte-silver mb-1">Visites</p>
                                                <p className="text-2xl font-bold text-primary">{client.visits}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm text-slate dark:text-matte-silver mb-1">Dernière Visite</p>
                                                <p className="text-sm font-medium text-charcoal dark:text-white">
                                                    {new Date(client.lastVisit).toLocaleDateString('fr-FR')}
                                                </p>
                                            </div>
                                            <Button variant="outline" className="rounded-xl">Contacter</Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
