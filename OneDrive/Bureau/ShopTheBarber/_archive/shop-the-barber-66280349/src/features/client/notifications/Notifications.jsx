import { useNotifications } from './useNotifications';
import { Link } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, Trash2, Calendar, ShoppingBag, MessageSquare, Star, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Notifications() {
    const {
        notifications,
        getUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification
    } = useNotifications();

    const iconMap = { booking: Calendar, order: ShoppingBag, message: MessageSquare, review: Star };
    const colorMap = { booking: "bg-[#0B2545]", order: "bg-[#1E7A4B]", message: "bg-[#D08B3D]", review: "bg-[#D08B3D]" };

    return (
        <div className="min-h-screen py-12 bg-[#F7F8FA]">
            <div className="max-w-5xl mx-auto px-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-4xl font-bold text-[#0B2545] mb-2">Notifications</h1>
                            <p className="text-[#4B5563]">{getUnreadCount()} notification{getUnreadCount() > 1 ? 's' : ''} non lue{getUnreadCount() > 1 ? 's' : ''}</p>
                        </div>
                        <div className="flex gap-2">
                            <Link to="/Settings">
                                <Button variant="outline" className="border-slate-200 text-[#4B5563] rounded-[10px] min-h-[44px]">
                                    <Settings className="w-4 h-4 mr-2" />Paramètres
                                </Button>
                            </Link>
                            {getUnreadCount() > 0 && (
                                <Button onClick={markAllAsRead} className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px] min-h-[44px]">
                                    <CheckCheck className="w-4 h-4 mr-2" />Tout marquer comme lu
                                </Button>
                            )}
                        </div>
                    </div>
                </motion.div>

                <div className="space-y-3">
                    {notifications.length === 0 ? (
                        <Card className="rounded-[12px] border-2 border-slate-200 p-16 text-center">
                            <Bell className="w-20 h-20 text-slate-300 mx-auto mb-6" />
                            <h3 className="text-2xl font-bold text-[#0B2545] mb-3">Aucune notification</h3>
                            <p className="text-[#4B5563]">Vous êtes à jour ! Aucune nouvelle notification.</p>
                        </Card>
                    ) : (
                        <AnimatePresence>
                            {notifications.map((notif, index) => {
                                const Icon = iconMap[notif.type] || Bell;
                                const bgColor = colorMap[notif.type] || "bg-[#4B5563]";
                                return (
                                    <motion.div key={notif.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ delay: index * 0.03 }}>
                                        <Card className={`rounded-[12px] border-2 overflow-hidden transition-all hover:shadow-xl ${notif.is_read ? 'border-slate-200 bg-white' : 'border-[#D08B3D] bg-[#D08B3D]/5'}`}>
                                            <div className="p-5">
                                                <div className="flex items-start gap-4">
                                                    <div className={`w-12 h-12 rounded-full ${bgColor} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                                                        <Icon className="w-6 h-6 text-white" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-3 mb-2">
                                                            <h3 className="font-bold text-[#0B2545] text-lg">{notif.title}</h3>
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                {notif.priority === 'urgent' && <Badge className="bg-[#D6454A]/20 text-[#D6454A] border-0">Urgent</Badge>}
                                                                {notif.priority === 'high' && <Badge className="bg-[#D08B3D]/20 text-[#D08B3D] border-0">Important</Badge>}
                                                            </div>
                                                        </div>
                                                        <p className="text-[#4B5563] mb-3 leading-relaxed">{notif.message}</p>
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm text-[#4B5563]">{format(new Date(notif.created_date), "dd MMM yyyy 'à' HH:mm", { locale: fr })}</p>
                                                            <div className="flex items-center gap-2">
                                                                {notif.link && <Link to={notif.link}><Button size="sm" className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[8px] min-h-[44px]">Voir</Button></Link>}
                                                                {!notif.is_read && <Button size="sm" variant="outline" onClick={() => markAsRead(notif.id)} className="border-slate-200 text-[#4B5563] rounded-[8px] min-h-[44px]"><CheckCheck className="w-4 h-4" /></Button>}
                                                                <Button size="sm" variant="ghost" onClick={() => deleteNotification(notif.id)} className="text-[#D6454A] hover:bg-[#D6454A]/10 min-h-[44px]"><Trash2 className="w-4 h-4" /></Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </div>
    );
}
