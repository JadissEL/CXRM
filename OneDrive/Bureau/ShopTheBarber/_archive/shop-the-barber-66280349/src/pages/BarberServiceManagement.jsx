import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, DollarSign, Clock, Scissors } from "lucide-react";
import { motion } from "framer-motion";

export default function BarberServiceManagement() {
    const [services, setServices] = useState([
        { id: 1, name: "Coupe Classique", price: 25, duration: 30, category: "haircut", active: true },
        { id: 2, name: "Barbe", price: 15, duration: 20, category: "beard", active: true },
        { id: 3, name: "Coupe + Barbe", price: 35, duration: 45, category: "package", active: true }
    ]);

    const categoryIcons = { haircut: Scissors, beard: "🧔", package: "📦" };
    const categoryLabels = { haircut: "Coupe", beard: "Barbe", package: "Forfait" };

    return (
        <div className="min-h-screen py-12 bg-background-light dark:bg-background-dark font-sans">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-display font-bold text-charcoal dark:text-white mb-2">Gestion des Services</h1>
                        <p className="text-lg text-slate dark:text-matte-silver">Gérez vos services et tarifs</p>
                    </div>
                    <Button className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl h-12 px-6">
                        <Plus className="w-5 h-5 mr-2" />
                        Nouveau Service
                    </Button>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-6">
                    {services.map((service, idx) => (
                        <motion.div key={service.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                            <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                                                <Scissors className="w-6 h-6 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-charcoal dark:text-white text-lg">{service.name}</h3>
                                                <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-0 mt-1">
                                                    {categoryLabels[service.category]}
                                                </Badge>
                                            </div>
                                        </div>
                                        <Badge className={service.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}>
                                            {service.active ? "Actif" : "Inactif"}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="p-3 bg-background-light dark:bg-background-dark rounded-xl">
                                            <div className="flex items-center gap-2 mb-1">
                                                <DollarSign className="w-4 h-4 text-primary" />
                                                <span className="text-sm text-slate dark:text-matte-silver">Prix</span>
                                            </div>
                                            <p className="text-2xl font-bold text-charcoal dark:text-white">{service.price}€</p>
                                        </div>
                                        <div className="p-3 bg-background-light dark:bg-background-dark rounded-xl">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Clock className="w-4 h-4 text-primary" />
                                                <span className="text-sm text-slate dark:text-matte-silver">Durée</span>
                                            </div>
                                            <p className="text-2xl font-bold text-charcoal dark:text-white">{service.duration} min</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button variant="outline" className="flex-1 rounded-xl">
                                            <Edit className="w-4 h-4 mr-2" />
                                            Modifier
                                        </Button>
                                        <Button variant="outline" className="flex-1 rounded-xl border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Supprimer
                                        </Button>
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
