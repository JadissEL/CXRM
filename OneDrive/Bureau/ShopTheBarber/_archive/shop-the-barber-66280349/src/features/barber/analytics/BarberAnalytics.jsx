import { useBarberAnalytics } from './useBarberAnalytics';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Calendar, Users, ArrowUpRight, Download } from "lucide-react";
import { motion } from "framer-motion";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function BarberAnalytics() {
    const { stats, revenueData } = useBarberAnalytics();

    const iconMap = { DollarSign, Calendar, Users, TrendingUp };

    return (
        <div className="min-h-screen py-12 bg-background-light dark:bg-background-dark font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-display font-bold text-charcoal dark:text-white mb-2">Analytiques</h1>
                        <p className="text-lg text-slate dark:text-matte-silver">Suivez vos performances</p>
                    </div>
                    <Button variant="outline" className="rounded-xl">
                        <Download className="w-4 h-4 mr-2" />
                        Exporter
                    </Button>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {stats.map((stat, idx) => {
                        const Icon = iconMap[stat.icon];
                        return (
                            <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                                <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color} bg-current/10`}>
                                                <Icon className={`w-6 h-6 ${stat.color}`} />
                                            </div>
                                            <Badge className="bg-emerald-100 text-emerald-800 border-0">
                                                <ArrowUpRight className="w-3 h-3 mr-1" />
                                                {stat.change}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-slate dark:text-matte-silver mb-1">{stat.label}</p>
                                        <p className="text-3xl font-display font-bold text-charcoal dark:text-white">{stat.value}</p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                        <CardContent className="p-6">
                            <h3 className="text-xl font-bold text-charcoal dark:text-white mb-6">Revenus Mensuels</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="revenue" stroke="#D08B3D" strokeWidth={3} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                        <CardContent className="p-6">
                            <h3 className="text-xl font-bold text-charcoal dark:text-white mb-6">Rendez-vous par Mois</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="revenue" fill="#D08B3D" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
