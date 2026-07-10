import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useCart } from "../components/cart/CartContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingBag, CreditCard, Truck, CheckCircle, AlertCircle, Lock, ArrowLeft, MapPin, Package, Clock, Percent, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import PromoCodeInput from "../components/checkout/PromoCodeInput";
import StripePaymentForm from "../components/checkout/StripePaymentForm";
import InstallmentPayment from "../components/checkout/InstallmentPayment";

export default function Checkout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const [step, setStep] = useState(1);
  const [paymentType, setPaymentType] = useState('card');
  const [installmentPlan, setInstallmentPlan] = useState(null);

  const { data: user } = useQuery({ queryKey: ['current-user'], queryFn: () => base44.auth.me() });

  const [shippingInfo, setShippingInfo] = useState({ full_name: user?.full_name || "", email: user?.email || "", phone: user?.phone || "", address: user?.address || "", address_line_2: "", city: user?.city || "", postal_code: "", country: "France" });
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [appliedPromo, setAppliedPromo] = useState(null);

  const shippingOptions = [
    { id: "standard", name: "Livraison Standard", description: "5-7 jours ouvrables", price: 5.99, icon: Package },
    { id: "express", name: "Livraison Express", description: "2-3 jours ouvrables", price: 12.99, icon: Truck },
    { id: "next_day", name: "Livraison Lendemain", description: "Avant 13h le lendemain", price: 19.99, icon: Clock }
  ];

  const cartTotal = getCartTotal();
  const selectedShipping = shippingOptions.find(s => s.id === shippingMethod);
  let shipping = selectedShipping?.price || 0;
  if (appliedPromo?.freeShipping) shipping = 0;
  else if (cartTotal > 50 && shippingMethod === 'standard') shipping = 0;

  const discount = appliedPromo?.discount || 0;
  const subtotal = cartTotal - discount;
  const tax = subtotal * 0.20;
  let finalTotal = subtotal + shipping + tax;
  if (installmentPlan?.plan?.fee) finalTotal += installmentPlan.plan.fee;

  const createOrderMutation = useMutation({
    mutationFn: async (orderData) => {
      const order = await base44.entities.Order.create(orderData);
      await base44.entities.Transaction.create({ order_id: order.id, user_id: user.id, amount: finalTotal, currency: "EUR", payment_method: paymentType === 'installment' ? 'installment' : paymentType, status: "succeeded", stripe_payment_intent_id: orderData.paymentIntentId, installment_plan: installmentPlan?.plan ? { installments: installmentPlan.plan.installments, amount_per_installment: installmentPlan.details.installmentAmount, schedule: installmentPlan.details.schedule } : null, promo_code_used: appliedPromo?.code || null, discount_amount: discount });
      if (appliedPromo?.code) { const promos = await base44.entities.PromoCode.filter({ code: appliedPromo.code }); if (promos[0]) await base44.entities.PromoCode.update(promos[0].id, { usage_count: (promos[0].usage_count || 0) + 1 }); }
      return order;
    },
    onSuccess: (data) => { clearCart(); queryClient.invalidateQueries({ queryKey: ['my-orders'] }); navigate(createPageUrl(`PaymentSuccess?orderId=${data.id}`)); },
    onError: (error) => navigate(createPageUrl(`PaymentError?reason=${encodeURIComponent(error.message)}`))
  });

  const handlePaymentSuccess = (paymentData) => {
    const trackingNumber = `STB${Date.now()}${Math.floor(Math.random() * 1000)}`;
    createOrderMutation.mutate({ client_id: user.id, items: cartItems.map(item => ({ product_id: item.id, name: item.name, quantity: item.quantity, price: item.price })), total_amount: finalTotal, shipping_address: `${shippingInfo.address}${shippingInfo.address_line_2 ? ', ' + shippingInfo.address_line_2 : ''}, ${shippingInfo.postal_code} ${shippingInfo.city}, ${shippingInfo.country}`, shipping_method: selectedShipping.name, shipping_cost: shipping, payment_method: paymentType === 'installment' ? 'installment' : paymentType, status: "processing", payment_status: "paid", tracking_number: trackingNumber, paymentIntentId: paymentData.paymentIntentId });
  };

  const handleChange = (field, value) => setShippingInfo(prev => ({ ...prev, [field]: value }));
  const isStep1Valid = () => shippingInfo.full_name && shippingInfo.email && shippingInfo.phone && shippingInfo.address && shippingInfo.city && shippingInfo.postal_code;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen py-20 bg-[#F7F8FA]">
        <div className="max-w-md mx-auto px-4 text-center">
          <Card className="rounded-[12px] border-2 border-slate-200 p-8">
            <ShoppingBag className="w-20 h-20 text-slate-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-[#0B2545] mb-3">Votre panier est vide</h2>
            <p className="text-[#4B5563] mb-6">Ajoutez des produits pour continuer vos achats</p>
            <Button onClick={() => navigate(createPageUrl("Marketplace"))} className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px] min-h-[44px]">Explorer la Marketplace</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 bg-[#F7F8FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" onClick={() => step === 1 ? navigate(-1) : setStep(step - 1)} className="mb-6 text-[#4B5563] hover:bg-slate-100 rounded-[10px] min-h-[44px]"><ArrowLeft className="w-5 h-5 mr-2" />Retour</Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#0B2545] mb-4">Finaliser ma commande</h1>
          <div className="flex items-center gap-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${s < step ? 'bg-[#1E7A4B] text-white' : s === step ? 'bg-[#D08B3D] text-white' : 'bg-slate-200 text-[#4B5563]'}`}>{s < step ? <CheckCircle className="w-5 h-5" /> : s}</div>
                <span className={`hidden sm:inline font-semibold ${s === step ? 'text-[#0B2545]' : 'text-[#4B5563]'}`}>{s === 1 && 'Livraison'}{s === 2 && 'Paiement'}{s === 3 && 'Confirmation'}</span>
                {s < 3 && <div className="w-12 h-0.5 bg-slate-200" />}
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <Card className="rounded-[12px] border-2 border-slate-200">
                  <CardHeader><CardTitle className="flex items-center gap-3 text-[#0B2545]"><MapPin className="w-6 h-6 text-[#D08B3D]" />Adresse de livraison</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div><Label className="text-[#0B2545]">Nom complet *</Label><Input value={shippingInfo.full_name} onChange={(e) => handleChange('full_name', e.target.value)} placeholder="Jean Dupont" className="mt-1 rounded-[10px] border-slate-200 focus:ring-[#D08B3D] focus:border-[#D08B3D]" /></div>
                      <div><Label className="text-[#0B2545]">Email *</Label><Input type="email" value={shippingInfo.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="jean@exemple.fr" className="mt-1 rounded-[10px] border-slate-200 focus:ring-[#D08B3D] focus:border-[#D08B3D]" /></div>
                    </div>
                    <div><Label className="text-[#0B2545]">Téléphone *</Label><Input value={shippingInfo.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="+33 6 12 34 56 78" className="mt-1 rounded-[10px] border-slate-200 focus:ring-[#D08B3D] focus:border-[#D08B3D]" /></div>
                    <div><Label className="text-[#0B2545]">Adresse *</Label><Input value={shippingInfo.address} onChange={(e) => handleChange('address', e.target.value)} placeholder="123 Rue de la Paix" className="mt-1 rounded-[10px] border-slate-200 focus:ring-[#D08B3D] focus:border-[#D08B3D]" /></div>
                    <div><Label className="text-[#0B2545]">Complément d'adresse</Label><Input value={shippingInfo.address_line_2} onChange={(e) => handleChange('address_line_2', e.target.value)} placeholder="Appartement, étage, etc." className="mt-1 rounded-[10px] border-slate-200 focus:ring-[#D08B3D] focus:border-[#D08B3D]" /></div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div><Label className="text-[#0B2545]">Code postal *</Label><Input value={shippingInfo.postal_code} onChange={(e) => handleChange('postal_code', e.target.value)} placeholder="75001" className="mt-1 rounded-[10px] border-slate-200 focus:ring-[#D08B3D] focus:border-[#D08B3D]" /></div>
                      <div><Label className="text-[#0B2545]">Ville *</Label><Input value={shippingInfo.city} onChange={(e) => handleChange('city', e.target.value)} placeholder="Paris" className="mt-1 rounded-[10px] border-slate-200 focus:ring-[#D08B3D] focus:border-[#D08B3D]" /></div>
                      <div><Label className="text-[#0B2545]">Pays</Label><Select value={shippingInfo.country} onValueChange={(v) => handleChange('country', v)}><SelectTrigger className="mt-1 rounded-[10px] border-slate-200"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="France">France</SelectItem><SelectItem value="Belgique">Belgique</SelectItem><SelectItem value="Suisse">Suisse</SelectItem></SelectContent></Select></div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-[12px] border-2 border-slate-200">
                  <CardHeader><CardTitle className="flex items-center gap-3 text-[#0B2545]"><Truck className="w-6 h-6 text-[#D08B3D]" />Mode de livraison</CardTitle></CardHeader>
                  <CardContent>
                    <RadioGroup value={shippingMethod} onValueChange={setShippingMethod}>
                      {shippingOptions.map((option) => (
                        <div key={option.id} className={`flex items-center justify-between p-4 rounded-[10px] border-2 cursor-pointer transition-all min-h-[44px] ${shippingMethod === option.id ? 'border-[#D08B3D] bg-[#D08B3D]/5' : 'border-slate-200 hover:border-[#D08B3D]/50'}`} onClick={() => setShippingMethod(option.id)}>
                          <div className="flex items-center gap-4">
                            <RadioGroupItem value={option.id} id={option.id} />
                            <div className="w-12 h-12 bg-white rounded-[10px] flex items-center justify-center border border-slate-200"><option.icon className="w-6 h-6 text-[#D08B3D]" /></div>
                            <div><Label htmlFor={option.id} className="font-semibold text-[#0B2545] cursor-pointer">{option.name}</Label><p className="text-sm text-[#4B5563]">{option.description}</p></div>
                          </div>
                          <div className="text-right">{(cartTotal > 50 && option.id === 'standard') || appliedPromo?.freeShipping ? <Badge className="bg-[#1E7A4B]/20 text-[#1E7A4B] border-0">Gratuit</Badge> : <span className="font-bold text-lg text-[#0B2545]">{option.price.toFixed(2)}€</span>}</div>
                        </div>
                      ))}
                    </RadioGroup>
                    {cartTotal > 50 && shippingMethod === 'standard' && !appliedPromo?.freeShipping && <Alert className="mt-4 bg-[#1E7A4B]/10 border-[#1E7A4B] rounded-[10px]"><CheckCircle className="h-4 w-4 text-[#1E7A4B]" /><AlertDescription className="text-[#1E7A4B]">Livraison standard gratuite pour les commandes de plus de 50€</AlertDescription></Alert>}
                  </CardContent>
                </Card>

                <Button onClick={() => setStep(2)} disabled={!isStep1Valid()} className="w-full h-14 bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white text-lg font-bold shadow-lg rounded-[10px] min-h-[44px]">Continuer vers le paiement</Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <Card className="rounded-[12px] border-2 border-slate-200">
                  <CardHeader><CardTitle className="flex items-center gap-3 text-[#0B2545]"><CreditCard className="w-6 h-6 text-[#D08B3D]" />Mode de paiement</CardTitle></CardHeader>
                  <CardContent>
                    <Tabs value={paymentType} onValueChange={setPaymentType}>
                      <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-100 rounded-[10px] p-1">
                        <TabsTrigger value="card" className="rounded-[8px] min-h-[44px] data-[state=active]:bg-white">Carte Bancaire</TabsTrigger>
                        <TabsTrigger value="paypal" className="rounded-[8px] min-h-[44px] data-[state=active]:bg-white">PayPal</TabsTrigger>
                        <TabsTrigger value="installment" className="rounded-[8px] min-h-[44px] data-[state=active]:bg-white">{finalTotal >= 50 ? 'En plusieurs fois' : 'Paiement fractionné'}</TabsTrigger>
                      </TabsList>
                      <TabsContent value="card"><StripePaymentForm amount={finalTotal} onSuccess={handlePaymentSuccess} onError={(msg) => navigate(createPageUrl(`PaymentError?reason=${encodeURIComponent(msg)}`))} /></TabsContent>
                      <TabsContent value="paypal"><div className="p-8 text-center bg-[#F7F8FA] rounded-[10px] border-2 border-slate-200"><div className="w-16 h-16 bg-[#0B2545] rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-2xl font-bold text-white">P</span></div><p className="text-[#4B5563] mb-6">Vous serez redirigé vers PayPal pour finaliser votre paiement de manière sécurisée.</p><Button onClick={() => handlePaymentSuccess({ paymentIntentId: `pp_${Date.now()}`, last4: 'PYPL', brand: 'paypal' })} className="bg-[#0B2545] hover:bg-[#0B2545]/90 text-white rounded-[10px] min-h-[44px]">Payer avec PayPal</Button></div></TabsContent>
                      <TabsContent value="installment">{finalTotal >= 50 ? (<><InstallmentPayment amount={finalTotal} onPlanSelect={setInstallmentPlan} />{installmentPlan && <div className="mt-6"><StripePaymentForm amount={parseFloat(installmentPlan.details.installmentAmount)} onSuccess={handlePaymentSuccess} onError={(msg) => navigate(createPageUrl(`PaymentError?reason=${encodeURIComponent(msg)}`))} /></div>}</>) : <Alert><AlertCircle className="h-4 w-4" /><AlertDescription>Le paiement en plusieurs fois est disponible à partir de 50€</AlertDescription></Alert>}</TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="rounded-[12px] border-2 border-slate-200 sticky top-24">
              <CardHeader className="bg-[#0B2545] rounded-t-[10px]"><CardTitle className="text-white">Récapitulatif</CardTitle></CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3 max-h-60 overflow-y-auto">{cartItems.map((item) => (<div key={item.id} className="flex gap-3"><div className="w-16 h-16 bg-slate-100 rounded-[10px] overflow-hidden flex-shrink-0">{item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-6 h-6 text-slate-300" /></div>}</div><div className="flex-1 min-w-0"><p className="font-semibold text-sm text-[#0B2545] truncate">{item.name}</p><p className="text-sm text-[#4B5563]">Qté: {item.quantity}</p></div><div className="text-right"><p className="font-bold text-[#0B2545]">{(item.price * item.quantity).toFixed(2)}€</p></div></div>))}</div>
                <Separator />
                {step === 1 && <><PromoCodeInput cartTotal={cartTotal} onPromoApplied={setAppliedPromo} /><Separator /></>}
                <div className="space-y-3">
                  <div className="flex justify-between text-[#4B5563]"><span>Sous-total</span><span>{cartTotal.toFixed(2)}€</span></div>
                  {discount > 0 && <div className="flex justify-between text-[#1E7A4B] font-semibold"><span className="flex items-center gap-2"><Percent className="w-4 h-4" />Réduction</span><span>-{discount.toFixed(2)}€</span></div>}
                  <div className="flex justify-between text-[#4B5563]"><span>Livraison</span><span>{shipping === 0 ? 'Gratuit' : `${shipping.toFixed(2)}€`}</span></div>
                  <div className="flex justify-between text-[#4B5563]"><span>TVA (20%)</span><span>{tax.toFixed(2)}€</span></div>
                  {installmentPlan?.plan?.fee > 0 && <div className="flex justify-between text-[#4B5563]"><span>Frais de paiement fractionné</span><span>{installmentPlan.plan.fee.toFixed(2)}€</span></div>}
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold text-[#0B2545]"><span>Total</span><span className="text-2xl text-[#D08B3D]">{finalTotal.toFixed(2)}€</span></div>
                {installmentPlan?.plan && <Alert className="bg-[#0B2545]/10 border-[#0B2545] rounded-[10px]"><Calendar className="h-4 w-4 text-[#0B2545]" /><AlertDescription className="text-sm text-[#0B2545]"><span className="font-semibold">Paiement en {installmentPlan.plan.installments}x</span><br />{installmentPlan.details.installmentAmount}€/mois</AlertDescription></Alert>}
                <div className="flex items-center gap-2 text-xs text-[#4B5563] bg-[#F7F8FA] p-3 rounded-[10px]"><Lock className="w-4 h-4 text-[#4B5563]" /><span>Paiement 100% sécurisé SSL</span></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}