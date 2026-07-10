import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Phone, Mail, RotateCcw, FileText, ArrowLeft, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import OrderTimeline from '../components/order/OrderTimeline';
import ReturnRequestForm from '../components/order/ReturnRequestForm';

export default function OrderTracking() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const orderId = searchParams.get('orderId');
  const [showReturnForm, setShowReturnForm] = useState(false);

  const { data: user } = useQuery({ queryKey: ['current-user'], queryFn: () => base44.auth.me() });
  const { data: order, isLoading: orderLoading } = useQuery({ queryKey: ['order', orderId], queryFn: async () => { const orders = await base44.entities.Order.list(); return orders.find(o => o.id === orderId); }, enabled: !!orderId });
  const { data: statusHistory = [] } = useQuery({ queryKey: ['order-status-history', orderId], queryFn: () => base44.entities.OrderStatus.filter({ order_id: orderId }, '-created_date'), enabled: !!orderId });
  const { data: deliveryProof } = useQuery({ queryKey: ['delivery-proof', orderId], queryFn: async () => { const proofs = await base44.entities.DeliveryProof.filter({ order_id: orderId }); return proofs[0]; }, enabled: !!orderId && order?.status === 'delivered' });
  const { data: returnRequest } = useQuery({ queryKey: ['return-request', orderId], queryFn: async () => { const returns = await base44.entities.Return.filter({ order_id: orderId }); return returns[0]; }, enabled: !!orderId });

  useEffect(() => { if (!orderId) return; const interval = setInterval(() => { queryClient.invalidateQueries({ queryKey: ['order', orderId] }); queryClient.invalidateQueries({ queryKey: ['order-status-history', orderId] }); }, 30000); return () => clearInterval(interval); }, [orderId, queryClient]);

  const canRequestReturn = () => { if (!order || returnRequest || order.status !== 'delivered') return false; const daysSinceDelivery = (Date.now() - new Date(order.updated_date).getTime()) / (1000 * 60 * 60 * 24); return daysSinceDelivery <= 30; };
  const handleReturnSuccess = () => { setShowReturnForm(false); queryClient.invalidateQueries({ queryKey: ['return-request', orderId] }); };

  if (orderLoading) return <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA]"><div className="text-center"><div className="w-16 h-16 border-4 border-[#D08B3D] border-t-transparent rounded-full animate-spin mx-auto mb-4" /><p className="text-[#4B5563]">Chargement du suivi...</p></div></div>;

  if (!order) return <div className="min-h-screen py-20 bg-[#F7F8FA]"><div className="max-w-md mx-auto px-4 text-center"><Card className="rounded-[12px] border-2 border-slate-200 p-8"><AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" /><h2 className="text-2xl font-bold text-[#0B2545] mb-3">Commande introuvable</h2><p className="text-[#4B5563] mb-6">Cette commande n'existe pas ou vous n'y avez pas accès</p><Link to={createPageUrl("ClientDashboard")}><Button className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px] min-h-[44px]">Mes commandes</Button></Link></Card></div></div>;

  return (
    <div className="min-h-screen py-12 bg-[#F7F8FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to={createPageUrl("ClientDashboard")}><Button variant="ghost" className="mb-6 text-[#4B5563] hover:bg-slate-100 rounded-[10px] min-h-[44px]"><ArrowLeft className="w-5 h-5 mr-2" />Retour à mes commandes</Button></Link>
        <div className="mb-8"><h1 className="text-4xl font-bold text-[#0B2545] mb-2">Suivi de commande</h1><p className="text-[#4B5563] text-lg">Commande #{orderId.slice(0, 8)} • Passée le {format(new Date(order.created_date), 'dd MMMM yyyy', { locale: fr })}</p></div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {showReturnForm ? (
                <motion.div key="return-form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}><ReturnRequestForm order={order} onSuccess={handleReturnSuccess} onCancel={() => setShowReturnForm(false)} /></motion.div>
              ) : (
                <motion.div key="tracking" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                  <OrderTimeline order={order} statusHistory={statusHistory} />
                  {deliveryProof && (
                    <Card className="rounded-[12px] border-2 border-[#1E7A4B] bg-[#1E7A4B]/5">
                      <CardHeader><CardTitle className="flex items-center gap-3 text-[#1E7A4B]"><CheckCircle className="w-6 h-6" />Preuve de livraison</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded-[10px] border border-[#1E7A4B]"><p className="text-sm text-[#1E7A4B] mb-1">Livrée à</p><p className="font-bold text-[#0B2545]">{deliveryProof.delivered_to}</p></div>
                          <div className="bg-white p-4 rounded-[10px] border border-[#1E7A4B]"><p className="text-sm text-[#1E7A4B] mb-1">Date de livraison</p><p className="font-bold text-[#0B2545]">{format(new Date(deliveryProof.delivered_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}</p></div>
                        </div>
                        {deliveryProof.photo_url && <div><p className="text-sm text-[#1E7A4B] mb-2">Photo de livraison</p><img src={deliveryProof.photo_url} alt="Preuve de livraison" className="w-full rounded-[10px] border-2 border-[#1E7A4B]" /></div>}
                      </CardContent>
                    </Card>
                  )}
                  {returnRequest && (
                    <Card className="rounded-[12px] border-2 border-[#D08B3D] bg-[#D08B3D]/5">
                      <CardHeader><CardTitle className="flex items-center gap-3 text-[#D08B3D]"><RotateCcw className="w-6 h-6" />Demande de retour</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between"><span className="text-[#4B5563]">Statut</span><Badge className="bg-[#D08B3D] text-white border-0">{returnRequest.status === 'requested' && 'En attente'}{returnRequest.status === 'approved' && 'Approuvée'}{returnRequest.status === 'refunded' && 'Remboursée'}</Badge></div>
                        {returnRequest.refund_amount > 0 && <Alert className="bg-[#1E7A4B]/10 border-[#1E7A4B] rounded-[10px]"><CheckCircle className="h-4 w-4 text-[#1E7A4B]" /><AlertDescription className="text-[#1E7A4B]">Remboursement de {returnRequest.refund_amount}€ effectué</AlertDescription></Alert>}
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-6">
            <Card className="rounded-[12px] border-2 border-slate-200 sticky top-24">
              <CardHeader><CardTitle className="text-[#0B2545]">Récapitulatif</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><p className="text-sm text-[#4B5563] mb-2">Articles ({order.items?.length || 0})</p><div className="space-y-2">{order.items?.map((item, idx) => <div key={idx} className="flex justify-between text-sm"><span className="text-[#4B5563]">{item.name} x{item.quantity}</span><span className="font-semibold text-[#0B2545]">{(item.price * item.quantity).toFixed(2)}€</span></div>)}</div></div>
                <Separator />
                <div className="space-y-2"><div className="flex justify-between text-sm"><span className="text-[#4B5563]">Sous-total</span><span className="text-[#0B2545]">{(order.total_amount - order.shipping_cost).toFixed(2)}€</span></div><div className="flex justify-between text-sm"><span className="text-[#4B5563]">Livraison</span><span className="text-[#0B2545]">{order.shipping_cost.toFixed(2)}€</span></div></div>
                <Separator />
                <div className="flex justify-between text-lg font-bold"><span className="text-[#0B2545]">Total</span><span className="text-2xl text-[#D08B3D]">{order.total_amount.toFixed(2)}€</span></div>
                <Separator />
                <div><p className="text-sm text-[#4B5563] mb-2 flex items-center gap-2"><MapPin className="w-4 h-4" />Adresse de livraison</p><p className="text-sm text-[#0B2545]">{order.shipping_address}</p></div>
                <div className="space-y-2 pt-4">
                  {canRequestReturn() && !showReturnForm && <Button onClick={() => setShowReturnForm(true)} variant="outline" className="w-full border-[#D08B3D] text-[#D08B3D] hover:bg-[#D08B3D]/10 rounded-[10px] min-h-[44px]"><RotateCcw className="w-4 h-4 mr-2" />Demander un retour</Button>}
                  <Button variant="outline" className="w-full rounded-[10px] border-slate-200 min-h-[44px]" onClick={() => window.print()}><FileText className="w-4 h-4 mr-2" />Imprimer le récapitulatif</Button>
                  <Link to={createPageUrl("Messages")}><Button variant="outline" className="w-full rounded-[10px] border-slate-200 min-h-[44px]"><MessageSquare className="w-4 h-4 mr-2" />Contacter le support</Button></Link>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-[12px] border-2 border-[#0B2545] bg-[#0B2545]/5">
              <CardContent className="p-6"><h3 className="font-bold text-[#0B2545] mb-4">Besoin d'aide ?</h3><div className="space-y-3 text-sm"><a href="tel:+33123456789" className="flex items-center gap-2 text-[#4B5563] hover:text-[#0B2545]"><Phone className="w-4 h-4" /><span>01 23 45 67 89</span></a><a href="mailto:support@shopthebarber.com" className="flex items-center gap-2 text-[#4B5563] hover:text-[#0B2545]"><Mail className="w-4 h-4" /><span>support@shopthebarber.com</span></a></div></CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}