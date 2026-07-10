import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard, Wallet, Lock, Shield, Loader2, AlertTriangle } from 'lucide-react';

export default function BookingPaymentForm({ 
  totalAmount, 
  depositAmount = 0, 
  depositRequired = false,
  onPaymentComplete,
  cancellationPolicy = null
}) {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [paymentType, setPaymentType] = useState(depositRequired ? 'deposit' : 'full');
  const [processing, setProcessing] = useState(false);
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvc: '', name: '' });

  const amountToPay = paymentType === 'deposit' ? depositAmount : totalAmount;
  const remainingAmount = paymentType === 'deposit' ? totalAmount - depositAmount : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    // Simulation du paiement
    await new Promise(r => setTimeout(r, 2000));
    setProcessing(false);
    onPaymentComplete?.({
      method: paymentMethod,
      type: paymentType,
      amount: amountToPay,
      transactionId: 'TXN_' + Date.now()
    });
  };

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <Card className="border-2 border-slate-200">
        <CardHeader className="pb-2"><CardTitle>Récapitulatif</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-slate-600">Total service</span><span className="font-semibold">{totalAmount.toFixed(2)}€</span></div>
            {depositRequired && (
              <>
                <div className="flex justify-between text-blue-600"><span>Acompte requis</span><span>{depositAmount.toFixed(2)}€</span></div>
                {paymentType === 'deposit' && <div className="flex justify-between text-slate-500"><span>Reste à payer sur place</span><span>{remainingAmount.toFixed(2)}€</span></div>}
              </>
            )}
            <div className="border-t pt-2 flex justify-between text-lg font-bold">
              <span>À payer maintenant</span><span className="text-blue-600">{amountToPay.toFixed(2)}€</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cancellation Policy */}
      {cancellationPolicy && (
        <Card className="border-2 border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-amber-800">Politique d'annulation</p>
                <p className="text-amber-700">Annulation gratuite jusqu'à {cancellationPolicy.hours_before}h avant le RDV. Après: {cancellationPolicy.cancellation_fee_value}{cancellationPolicy.cancellation_fee_type === 'percentage' ? '%' : '€'} de frais.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Type Selection */}
      {depositRequired && (
        <Card className="border-2 border-slate-200">
          <CardHeader className="pb-2"><CardTitle>Type de Paiement</CardTitle></CardHeader>
          <CardContent>
            <RadioGroup value={paymentType} onValueChange={setPaymentType} className="space-y-3">
              <label className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer ${paymentType === 'deposit' ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="deposit" />
                  <div><p className="font-medium">Payer l'acompte</p><p className="text-sm text-slate-500">Reste à payer sur place</p></div>
                </div>
                <span className="font-bold text-blue-600">{depositAmount.toFixed(2)}€</span>
              </label>
              <label className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer ${paymentType === 'full' ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="full" />
                  <div><p className="font-medium">Payer la totalité</p><p className="text-sm text-slate-500">Rien à payer sur place</p></div>
                </div>
                <span className="font-bold text-green-600">{totalAmount.toFixed(2)}€</span>
              </label>
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {/* Payment Method */}
      <Card className="border-2 border-slate-200">
        <CardHeader className="pb-2"><CardTitle>Mode de Paiement</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button onClick={() => setPaymentMethod('card')} className={`p-4 rounded-lg border-2 flex items-center gap-3 ${paymentMethod === 'card' ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}>
              <CreditCard className="w-6 h-6 text-blue-600" />
              <span className="font-medium">Carte bancaire</span>
            </button>
            <button onClick={() => setPaymentMethod('paypal')} className={`p-4 rounded-lg border-2 flex items-center gap-3 ${paymentMethod === 'paypal' ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}>
              <Wallet className="w-6 h-6 text-blue-600" />
              <span className="font-medium">PayPal</span>
            </button>
          </div>

          {paymentMethod === 'card' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label>Numéro de carte</Label>
                <Input placeholder="4242 4242 4242 4242" value={cardDetails.number} onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Expiration</Label><Input placeholder="MM/AA" value={cardDetails.expiry} onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})} required /></div>
                <div><Label>CVC</Label><Input placeholder="123" value={cardDetails.cvc} onChange={(e) => setCardDetails({...cardDetails, cvc: e.target.value})} required /></div>
              </div>
              <div><Label>Nom sur la carte</Label><Input placeholder="Jean Dupont" value={cardDetails.name} onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})} required /></div>
              <Button type="submit" disabled={processing} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-6">
                {processing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Paiement en cours...</> : <><Lock className="w-5 h-5 mr-2" />Payer {amountToPay.toFixed(2)}€</>}
              </Button>
            </form>
          )}

          {paymentMethod === 'paypal' && (
            <div className="text-center py-6">
              <Button onClick={handleSubmit} disabled={processing} className="bg-[#0070ba] hover:bg-[#003087] text-white px-12 py-6">
                {processing ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Wallet className="w-5 h-5 mr-2" />}
                Payer avec PayPal
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security */}
      <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
        <div className="flex items-center gap-1"><Shield className="w-4 h-4" />Paiement sécurisé</div>
        <div className="flex items-center gap-1"><Lock className="w-4 h-4" />SSL 256-bit</div>
      </div>
    </div>
  );
}