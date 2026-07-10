import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Plus, Edit, Trash2, TrendingUp, Eye } from "lucide-react";
import { motion } from "framer-motion";

export default function BarberPromotionManagement() {
    const promotions = [
        { id: 1, title: "Réduction Première Visite", discount: 20, type: "percentage", active: true, used: 45, expiry: "2024-12-31" },
        { id: 2, title: "Forfait Coupe + Barbe", discount: 10, type: "fixed", active: true, used: 23, expiry: "2024-12-15" },
        { id: 3, title: "Offre Étudiants", discount: 15, type: "percentage", active: false, used: 67, expiry: "2024-11-30" }
    ];

    return (
        <div className="min-h-screen py-12 bg-background-light dark:bg-background-dark font-sans">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-display font-bold text-charcoal dark:text-white mb-2">Promotions</h1>
                        <p className="text-lg text-slate dark:text-matte-silver">Créez et gérez vos offres promotionnelles</p>
                    </div>
                    <Button className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl h-12 px-6">
                        <Plus className="w-5 h-5 mr-2" />
                        Nouvelle Promotion
                    </Button>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                        <CardContent className="p-6">
                            <Megaphone className="w-10 h-10 text-primary mb-3" />
                            <p className="text-sm text-slate dark:text-matte-silver mb-1">Promotions Actives</p>
                            <p className="text-4xl font-display font-bold text-charcoal dark:text-white">
                                {promotions.filter(p => p.active).length}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                        <CardContent className="p-6">
                            <TrendingUp className="w-10 h-10 text-emerald-600 mb-3" />
                            <p className="text-sm text-slate dark:text-matte-silver mb-1">Utilisations Totales</p>
                            <p className="text-4xl font-display font-bold text-charcoal dark:text-white">
                                {promotions.reduce((sum, p) => sum + p.used, 0)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                        <CardContent className="p-6">
                            <Eye className="w-10 h-10 text-blue-600 mb-3" />
                            <p className="text-sm text-slate dark:text-matte-silver mb-1">Taux de Conversion</p>
                            <p className="text-4xl font-display font-bold text-charcoal dark:text-white">68%</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    {promotions.map((promo, idx) => (
                        <motion.div key={promo.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                            <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                                                <Megaphone className="w-6 h-6 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-charcoal dark:text-white text-lg mb-1">{promo.title}</h3>
                                                <div className="flex items-center gap-3">
                                                    <Badge className={promo.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}>
                                                        {promo.active ? "Active" : "Inactive"}
                                                    </Badge>
                                                    <span className="text-sm text-slate dark:text-matte-silver">
                                                        Expire le {new Date(promo.expiry).toLocaleDateString('fr-FR')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-center">
                                                <p className="text-sm text-slate dark:text-matte-silver mb-1">Réduction</p>
                                                <p className="text-2xl font-bold text-primary">
                                                    {promo.type === 'percentage' ? `${promo.discount}%` : `${promo.discount}€`}
                                                </p>
                                            </div>

                                            <div className="text-center">
                                                <p className="text-sm text-slate dark:text-matte-silver mb-1">Utilisations</p>
                                                <p className="text-2xl font-bold text-charcoal dark:text-white">{promo.used}</p>
                                            </div>

                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" className="rounded-lg">
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button variant="outline" size="sm" className="rounded-lg border-red-200 text-red-600 hover:bg-red-50">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
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
