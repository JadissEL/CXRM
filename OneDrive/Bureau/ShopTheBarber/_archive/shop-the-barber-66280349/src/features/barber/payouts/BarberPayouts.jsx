import { useBarberPayouts } from './useBarberPayouts';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Download, Calendar, CreditCard } from "lucide-react";
import { motion } from "framer-motion";

export default function BarberPayouts() {
    const { payouts, totalEarnings, pendingAmount } = useBarberPayouts();

    return (
        <div className="min-h-screen py-12 bg-background-light dark:bg-background-dark font-sans">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <h1 className="text-4xl font-display font-bold text-charcoal dark:text-white mb-2">Paiements</h1>
                    <p className="text-lg text-slate dark:text-matte-silver">Gérez vos revenus et paiements</p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <Card className="rounded-2xl border-none shadow-soft bg-gradient-to-br from-primary to-primary/80 text-white">
                        <CardContent className="p-6">
                            <DollarSign className="w-10 h-10 mb-3" />
                            <p className="text-sm text-white/80 mb-1">Revenus Totaux</p>
                            <p className="text-4xl font-display font-bold">{totalEarnings}€</p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                        <CardContent className="p-6">
                            <TrendingUp className="w-10 h-10 text-emerald-600 mb-3" />
                            <p className="text-sm text-slate dark:text-matte-silver mb-1">En Attente</p>
                            <p className="text-4xl font-display font-bold text-charcoal dark:text-white">{pendingAmount}€</p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                        <CardContent className="p-6">
                            <Calendar className="w-10 h-10 text-blue-600 mb-3" />
                            <p className="text-sm text-slate dark:text-matte-silver mb-1">Prochain Paiement</p>
                            <p className="text-2xl font-bold text-charcoal dark:text-white">01 Dec</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-charcoal dark:text-white">Historique des Paiements</h3>
                            <Button variant="outline" className="rounded-xl">
                                <Download className="w-4 h-4 mr-2" />
                                Exporter
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {payouts.map((payout, idx) => (
                                <motion.div
                                    key={payout.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="flex items-center justify-between p-4 bg-background-light dark:bg-background-dark rounded-xl"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                                            <CreditCard className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-charcoal dark:text-white">{payout.method}</p>
                                            <p className="text-sm text-slate dark:text-matte-silver">
                                                {new Date(payout.date).toLocaleDateString('fr-FR')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <p className="text-2xl font-bold text-charcoal dark:text-white">{payout.amount}€</p>
                                        <Badge className={payout.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                                            {payout.status === 'completed' ? 'Payé' : 'En Attente'}
                                        </Badge>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
