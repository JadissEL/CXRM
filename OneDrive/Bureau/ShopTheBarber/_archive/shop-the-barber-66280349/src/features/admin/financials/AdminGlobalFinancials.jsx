import { useAdminGlobalFinancials } from './useAdminGlobalFinancials';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminGlobalFinancials() {
    const { financialData, transactions } = useAdminGlobalFinancials();

    return (
        <div className="min-h-screen py-12 bg-background-light dark:bg-background-dark font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-display font-bold text-charcoal dark:text-white mb-2">Finances Globales</h1>
                        <p className="text-lg text-slate dark:text-matte-silver">Vue d'ensemble des finances de la plateforme</p>
                    </div>
                    <Button variant="outline" className="rounded-xl">
                        <Download className="w-4 h-4 mr-2" />
                        Rapport Financier
                    </Button>
                </motion.div>

                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    {[
                        { label: "Revenus Totaux", value: `${financialData.totalRevenue.toLocaleString()}€`, icon: DollarSign, color: "text-emerald-600" },
                        { label: "Commissions", value: `${financialData.totalCommissions.toLocaleString()}€`, icon: TrendingUp, color: "text-blue-600" },
                        { label: "Paiements en Attente", value: `${financialData.pendingPayouts.toLocaleString()}€`, icon: AlertCircle, color: "text-amber-600" },
                        { label: "Frais Plateforme", value: `${financialData.platformFees.toLocaleString()}€`, icon: FileText, color: "text-purple-600" }
                    ].map((stat, idx) => (
                        <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                            <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                                <CardContent className="p-6">
                                    <stat.icon className={`w-10 h-10 ${stat.color} mb-3`} />
                                    <p className="text-sm text-slate dark:text-matte-silver mb-1">{stat.label}</p>
                                    <p className="text-3xl font-display font-bold text-charcoal dark:text-white">{stat.value}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                    <CardContent className="p-6">
                        <h3 className="text-2xl font-bold text-charcoal dark:text-white mb-6">Transactions Récentes</h3>
                        <div className="space-y-4">
                            {transactions.map((transaction, idx) => (
                                <motion.div
                                    key={transaction.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="flex items-center justify-between p-4 bg-background-light dark:bg-background-dark rounded-xl"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                                            <DollarSign className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-charcoal dark:text-white">{transaction.shop}</h4>
                                            <p className="text-sm text-slate dark:text-matte-silver">
                                                {new Date(transaction.date).toLocaleDateString('fr-FR')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-sm text-slate dark:text-matte-silver">Montant</p>
                                            <p className="text-xl font-bold text-charcoal dark:text-white">{transaction.amount}€</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-slate dark:text-matte-silver">Commission</p>
                                            <p className="text-xl font-bold text-primary">{transaction.commission}€</p>
                                        </div>
                                        <Badge variant="outline" className={transaction.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                                            {transaction.status === 'completed' ? 'Complété' : 'En Attente'}
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
