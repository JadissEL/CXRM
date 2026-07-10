import { useOrderConfirmation } from './useOrderConfirmation';
import { useSearchParams, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Package, Home } from "lucide-react";
import { motion } from "framer-motion";

export default function OrderConfirmation() {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('id');
    const { order, isLoading } = useOrderConfirmation(orderId);

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center"><p>Chargement...</p></div>;
    }

    return (
        <div className="min-h-screen py-12 bg-[#F7F8FA]">
            <div className="max-w-2xl mx-auto px-4">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                    <Card className="rounded-[12px] border-2 border-slate-200 text-center p-12">
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        </div>
                        <h1 className="text-4xl font-bold text-[#0B2545] mb-4">Commande confirmée !</h1>
                        <p className="text-[#4B5563] mb-2">Merci pour votre commande</p>
                        {order && (
                            <p className="text-lg font-semibold text-[#D08B3D] mb-8">Commande #{order.id?.slice(0, 8)}</p>
                        )}

                        <div className="bg-slate-50 rounded-[10px] p-6 mb-8 text-left">
                            <h2 className="font-bold text-[#0B2545] mb-4">Détails de la commande</h2>
                            {order && (
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-[#4B5563]">Total</span>
                                        <span className="font-bold text-[#0B2545]">{order.total_amount}€</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#4B5563]">Statut</span>
                                        <span className="font-semibold text-blue-600">En traitement</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <Link to={createPageUrl("OrderTracking", `?id=${orderId}`)} className="flex-1">
                                <Button variant="outline" className="w-full rounded-[10px]">
                                    <Package className="w-4 h-4 mr-2" />Suivre ma commande
                                </Button>
                            </Link>
                            <Link to={createPageUrl("Home")} className="flex-1">
                                <Button className="w-full bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px]">
                                    <Home className="w-4 h-4 mr-2" />Retour à l'accueil
                                </Button>
                            </Link>
                        </div>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
