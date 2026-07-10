import { useBarberMessageCenter } from './useBarberMessageCenter';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function BarberMessageCenter() {
    const { conversations } = useBarberMessageCenter();

    return (
        <div className="min-h-screen py-12 bg-background-light dark:bg-background-dark font-sans">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <h1 className="text-4xl font-display font-bold text-charcoal dark:text-white mb-2">Messages</h1>
                    <p className="text-lg text-slate dark:text-matte-silver">Communiquez avec vos clients</p>
                </motion.div>

                <div className="grid lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-1 rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                        <CardContent className="p-6">
                            <div className="mb-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate" />
                                    <Input placeholder="Rechercher..." className="pl-10 rounded-xl" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                {conversations.map((conv, idx) => (
                                    <motion.div key={conv.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} className="p-4 bg-background-light dark:bg-background-dark rounded-xl cursor-pointer hover:bg-primary/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={conv.avatar} />
                                                <AvatarFallback className="bg-primary text-white">{conv.client[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="font-bold text-charcoal dark:text-white truncate">{conv.client}</p>
                                                    {conv.unread > 0 && <Badge className="bg-primary text-white border-0">{conv.unread}</Badge>}
                                                </div>
                                                <p className="text-sm text-slate dark:text-matte-silver truncate">{conv.lastMessage}</p>
                                            </div>
                                            <span className="text-xs text-slate dark:text-matte-silver">{conv.time}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2 rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4 pb-4 border-b border-soft-gray dark:border-slate/10 mb-4">
                                <Avatar className="w-12 h-12">
                                    <AvatarFallback className="bg-primary text-white">JD</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-bold text-charcoal dark:text-white">Jean Dupont</h3>
                                    <p className="text-sm text-slate dark:text-matte-silver">En ligne</p>
                                </div>
                            </div>

                            <div className="h-96 overflow-y-auto mb-4 space-y-4">
                                <div className="flex justify-end">
                                    <div className="bg-primary text-white p-3 rounded-2xl rounded-tr-sm max-w-xs">
                                        <p>Bonjour! Disponible pour un rendez-vous demain?</p>
                                        <span className="text-xs text-white/70">10:25</span>
                                    </div>
                                </div>
                                <div className="flex justify-start">
                                    <div className="bg-background-light dark:bg-background-dark p-3 rounded-2xl rounded-tl-sm max-w-xs">
                                        <p className="text-charcoal dark:text-white">Oui, j'ai un créneau à 14h</p>
                                        <span className="text-xs text-slate dark:text-matte-silver">10:26</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Input placeholder="Écrivez votre message..." className="flex-1 rounded-xl" />
                                <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl">
                                    <Send className="w-5 h-5" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
