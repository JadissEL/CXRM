import { useOrderTracking } from './useOrderTracking';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Circle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function OrderTracking() {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('id');
    const { order, trackingSteps, isLoading } = useOrderTracking(orderId);

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#D08B3D]" /></div>;
    }

    return (
        <div className="min-h-screen py-12 bg-[#F7F8FA]">
            <div className="max-w-4xl mx-auto px-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <h1 className="text-4xl font-bold text-[#0B2545] mb-2">Suivi de commande</h1>
                    {order && <p className="text-[#4B5563]">Commande #{order.id?.slice(0, 8)}</p>}
                </motion.div>

                <Card className="rounded-[12px] border-2 border-slate-200 mb-8">
                    <CardContent className="p-8">
                        <div className="relative">
                            {trackingSteps.map((step, index) => (
                                <div key={step.id} className="flex gap-4 mb-8 last:mb-0">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${step.status === 'completed' ? 'bg-green-600' : step.status === 'current' ? 'bg-[#D08B3D]' : 'bg-slate-200'}`}>
                                            {step.status === 'completed' ? (
                                                <CheckCircle className="w-6 h-6 text-white" />
                                            ) : step.status === 'current' ? (
                                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                                            ) : (
                                                <Circle className="w-6 h-6 text-slate-400" />
                                            )}
                                        </div>
                                        {index < trackingSteps.length - 1 && (
                                            <div className={`w-0.5 h-16 ${step.status === 'completed' ? 'bg-green-600' : 'bg-slate-200'}`} />
                                        )}
                                    </div>
                                    <div className="flex-1 pt-2">
                                        <h3 className={`font-bold text-lg ${step.status === 'completed' || step.status === 'current' ? 'text-[#0B2545]' : 'text-slate-400'}`}>
                                            {step.label}
                                        </h3>
                                        {step.date && (
                                            <p className="text-sm text-[#4B5563]">
                                                {format(new Date(step.date), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {order && (
                    <Card className="rounded-[12px] border-2 border-slate-200">
                        <CardContent className="p-6">
                            <h2 className="text-2xl font-bold text-[#0B2545] mb-4">Détails de la commande</h2>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-[#4B5563]">Total</span>
                                    <span className="font-bold text-[#0B2545]">{order.total_amount}€</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#4B5563]">Date de commande</span>
                                    <span className="text-[#0B2545]">{format(new Date(order.created_date), 'dd MMMM yyyy', { locale: fr })}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
