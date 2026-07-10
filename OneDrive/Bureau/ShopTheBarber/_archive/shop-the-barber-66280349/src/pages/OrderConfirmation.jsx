import { Link, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Package, Truck, Home, Mail, Phone, MapPin, Download } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function OrderConfirmation() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => { const orders = await base44.entities.Order.list(); return orders.find(o => o.id === orderId); },
    enabled: !!orderId
  });

  const { data: user } = useQuery({ queryKey: ['current-user'], queryFn: () => base44.auth.me() });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D08B3D]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 bg-[#F7F8FA]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-24 h-24 bg-[#1E7A4B] rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-[#0B2545] mb-3">Commande Confirmée !</h1>
          <p className="text-xl text-[#4B5563] mb-8">Merci pour votre achat sur ShopTheBarber</p>

          {order && (
            <>
              <Card className="rounded-[12px] border-2 border-slate-200 text-left mb-8">
                <CardHeader className="bg-[#0B2545] rounded-t-[10px]">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl text-white">Commande #{order.id.slice(0, 8)}</CardTitle>
                      <p className="text-sm text-white/70 mt-1">{format(new Date(order.created_date), 'dd MMMM yyyy à HH:mm', { locale: fr })}</p>
                    </div>
                    <Badge className="bg-[#1E7A4B] text-white border-0 text-sm px-4 py-2">Confirmée</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {order.tracking_number && (
                    <div className="p-4 bg-[#D08B3D]/10 border-2 border-[#D08B3D] rounded-[10px]">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-[#D08B3D] font-medium mb-1">Numéro de Suivi</p>
                          <p className="text-2xl font-bold text-[#0B2545]">{order.tracking_number}</p>
                        </div>
                        <Link to={createPageUrl(`OrderTracking?orderId=${order.id}`)}>
                          <Button className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px] min-h-[44px]"><Package className="w-4 h-4 mr-2" />Suivre</Button>
                        </Link>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold text-[#0B2545] mb-4">Articles Commandés</h3>
                    <div className="space-y-3">
                      {order.items?.map((item, i) => (
                        <div key={i} className="flex justify-between items-center p-3 bg-[#F7F8FA] rounded-[10px]">
                          <div><p className="font-semibold text-[#0B2545]">{item.name}</p><p className="text-sm text-[#4B5563]">Quantité: {item.quantity}</p></div>
                          <span className="font-bold text-[#0B2545]">{(item.price * item.quantity).toFixed(2)}€</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-[#4B5563]"><span>Sous-total</span><span className="font-semibold text-[#0B2545]">{(order.total_amount - (order.shipping_cost || 0) - (order.total_amount * 0.20)).toFixed(2)}€</span></div>
                    <div className="flex justify-between text-[#4B5563]"><span>Livraison ({order.shipping_method || 'Standard'})</span><span className="font-semibold">{order.shipping_cost === 0 ? <Badge className="bg-[#1E7A4B]/20 text-[#1E7A4B] border-0">Gratuite</Badge> : `${(order.shipping_cost || 0).toFixed(2)}€`}</span></div>
                    <div className="flex justify-between text-[#4B5563]"><span>TVA (20%)</span><span className="font-semibold text-[#0B2545]">{(order.total_amount * 0.20).toFixed(2)}€</span></div>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center"><span className="text-xl font-bold text-[#0B2545]">Total</span><span className="text-3xl font-bold text-[#D08B3D]">{order.total_amount.toFixed(2)}€</span></div>

                  <div className="p-4 bg-[#F7F8FA] rounded-[10px]"><h4 className="font-semibold text-[#0B2545] mb-2 flex items-center gap-2"><MapPin className="w-4 h-4" />Adresse de Livraison</h4><p className="text-[#4B5563]">{order.shipping_address}</p></div>

                  <div className="p-4 bg-[#0B2545]/10 border border-[#0B2545] rounded-[10px]">
                    <p className="text-sm text-[#0B2545] flex items-center gap-2"><Truck className="w-4 h-4" /><strong>Livraison estimée:</strong> {order.shipping_method?.includes('Express') ? ' 2-3 jours ouvrables' : order.shipping_method?.includes('Lendemain') ? ' Demain avant 13h' : ' 5-7 jours ouvrables'}</p>
                  </div>

                  <div className="p-4 bg-[#1E7A4B]/10 border border-[#1E7A4B] rounded-[10px]">
                    <p className="text-sm text-[#1E7A4B] flex items-center gap-2"><Mail className="w-4 h-4" />Un email de confirmation a été envoyé à <strong>{user?.email}</strong></p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid sm:grid-cols-3 gap-4">
                <Link to={createPageUrl(`OrderTracking?orderId=${order.id}`)} className="w-full"><Button className="w-full bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white h-14 rounded-[10px] min-h-[44px]"><Truck className="w-4 h-4 mr-2" />Suivre ma Commande</Button></Link>
                <Button variant="outline" className="w-full border-2 border-slate-200 text-[#4B5563] h-14 rounded-[10px] min-h-[44px]"><Download className="w-4 h-4 mr-2" />Télécharger Facture</Button>
                <Link to={createPageUrl("Home")} className="w-full"><Button variant="outline" className="w-full border-2 border-slate-200 text-[#4B5563] h-14 rounded-[10px] min-h-[44px]"><Home className="w-4 h-4 mr-2" />Retour à l'Accueil</Button></Link>
              </div>

              <Card className="rounded-[12px] border-2 border-slate-200 mt-8">
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold text-[#0B2545] mb-3">Besoin d'aide ?</h3>
                  <p className="text-[#4B5563] mb-4">Notre équipe est là pour vous</p>
                  <div className="flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2 text-[#4B5563]"><Mail className="w-4 h-4" /><span className="text-sm">support@shopthebarber.com</span></div>
                    <div className="flex items-center gap-2 text-[#4B5563]"><Phone className="w-4 h-4" /><span className="text-sm">+33 1 23 45 67 89</span></div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}