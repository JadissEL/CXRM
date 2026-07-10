import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Gift, Star, Award, Sparkles, Crown } from "lucide-react";
import { motion } from "framer-motion";

export default function Loyalty() {
    const { data: user } = useQuery({
        queryKey: ['current-user'],
        queryFn: () => base44.auth.me()
    });

    const loyaltyPoints = 450;
    const nextTierPoints = 500;
    const progress = (loyaltyPoints / nextTierPoints) * 100;

    const tiers = [
        { name: "Bronze", min: 0, color: "text-amber-700", bg: "bg-amber-100", icon: Star },
        { name: "Silver", min: 500, color: "text-slate-600", bg: "bg-slate-100", icon: Award },
        { name: "Gold", min: 1000, color: "text-yellow-600", bg: "bg-yellow-100", icon: Sparkles },
        { name: "Platinum", min: 2000, color: "text-purple-600", bg: "bg-purple-100", icon: Crown }
    ];

    const rewards = [
        { points: 100, title: "10% de Réduction", description: "Sur votre prochaine visite" },
        { points: 250, title: "Coupe Gratuite", description: "Une coupe offerte" },
        { points: 500, title: "20% de Réduction", description: "Sur tous les services" },
        { points: 1000, title: "Service Premium", description: "Accès aux services VIP" }
    ];

    return (
        <div className="min-h-screen py-12 bg-background-light dark:bg-background-dark font-sans">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <h1 className="text-4xl font-display font-bold text-charcoal dark:text-white mb-2">Programme de Fidélité</h1>
                    <p className="text-lg text-slate dark:text-matte-silver">Gagnez des points à chaque visite et débloquez des récompenses exclusives</p>
                </motion.div>

                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Points Card */}
                        <Card className="rounded-2xl border-none shadow-soft bg-gradient-to-br from-primary to-primary/80 text-white overflow-hidden">
                            <CardContent className="p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <p className="text-white/80 mb-1">Vos Points</p>
                                        <h2 className="text-5xl font-display font-bold">{loyaltyPoints}</h2>
                                    </div>
                                    <Gift className="w-16 h-16 text-white/30" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Progression vers Silver</span>
                                        <span>{loyaltyPoints}/{nextTierPoints}</span>
                                    </div>
                                    <Progress value={progress} className="h-3 bg-white/20" />
                                    <p className="text-sm text-white/80">Plus que {nextTierPoints - loyaltyPoints} points pour le niveau suivant!</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Rewards */}
                        <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                            <CardContent className="p-6">
                                <h3 className="text-2xl font-bold text-charcoal dark:text-white mb-6">Récompenses Disponibles</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {rewards.map((reward, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className={`p-4 rounded-xl border-2 ${loyaltyPoints >= reward.points ? 'border-primary bg-primary/5' : 'border-soft-gray dark:border-slate/20'}`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <h4 className="font-bold text-charcoal dark:text-white">{reward.title}</h4>
                                                <Badge className={loyaltyPoints >= reward.points ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}>
                                                    {reward.points} pts
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-slate dark:text-matte-silver">{reward.description}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tiers Sidebar */}
                    <div className="space-y-6">
                        <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                            <CardContent className="p-6">
                                <h3 className="text-xl font-bold text-charcoal dark:text-white mb-6">Niveaux de Fidélité</h3>
                                <div className="space-y-4">
                                    {tiers.map((tier, idx) => (
                                        <div key={idx} className={`p-4 rounded-xl ${tier.bg} ${loyaltyPoints >= tier.min ? 'ring-2 ring-primary' : ''}`}>
                                            <div className="flex items-center gap-3">
                                                <tier.icon className={`w-6 h-6 ${tier.color}`} />
                                                <div className="flex-1">
                                                    <p className={`font-bold ${tier.color}`}>{tier.name}</p>
                                                    <p className="text-xs text-slate dark:text-matte-silver">{tier.min}+ points</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
