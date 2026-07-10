import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  CreditCard,
  Lock,
  Loader2
} from 'lucide-react';

export default function StripePaymentForm({ amount, onSuccess, onError }) {
  const [paymentMethod, setPaymentMethod] = useState('new_card');
  const [saveCard, setSaveCard] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [cardDetails, setCardDetails] = useState({
    number: '',
    exp_month: '',
    exp_year: '',
    cvc: '',
    name: ''
  });

  const [errors, setErrors] = useState({});

  const validateCard = () => {
    const newErrors = {};

    // Card number validation (simplified)
    const cardNum = cardDetails.number.replace(/\s/g, '');
    if (!cardNum || cardNum.length < 13 || cardNum.length > 19) {
      newErrors.number = 'Numéro de carte invalide';
    }

    // Expiry validation
    const month = parseInt(cardDetails.exp_month);
    const year = parseInt(cardDetails.exp_year);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (!month || month < 1 || month > 12) {
      newErrors.exp_month = 'Mois invalide';
    }

    if (!year || year < currentYear) {
      newErrors.exp_year = 'Année invalide';
    }

    if (year === currentYear && month < currentMonth) {
      newErrors.exp_month = 'Carte expirée';
    }

    // CVC validation
    if (!cardDetails.cvc || cardDetails.cvc.length < 3 || cardDetails.cvc.length > 4) {
      newErrors.cvc = 'CVC invalide';
    }

    // Name validation
    if (!cardDetails.name.trim()) {
      newErrors.name = 'Nom requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const processPaymentMutation = useMutation({
    mutationFn: async (paymentData) => {
      // Simulate Stripe payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate random success/failure for demo
      const success = Math.random() > 0.1; // 90% success rate

      if (!success) {
        throw new Error('Votre carte a été déclinée. Veuillez vérifier vos informations ou utiliser une autre carte.');
      }

      // Create mock payment intent ID
      const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return {
        success: true,
        paymentIntentId,
        last4: cardDetails.number.slice(-4),
        brand: detectCardBrand(cardDetails.number)
      };
    },
    onSuccess: (data) => {
      setProcessing(false);
      onSuccess(data);
    },
    onError: (error) => {
      setProcessing(false);
      onError(error.message);
    }
  });

  const detectCardBrand = (number) => {
    const cleaned = number.replace(/\s/g, '');
    if (/^4/.test(cleaned)) return 'visa';
    if (/^5[1-5]/.test(cleaned)) return 'mastercard';
    if (/^3[47]/.test(cleaned)) return 'amex';
    return 'card';
  };

  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\s/g, '');
    const match = cleaned.match(/.{1,4}/g);
    return match ? match.join(' ') : cleaned;
  };

  const handleCardNumberChange = (e) => {
    const value = e.target.value.replace(/\s/g, '');
    if (value.length <= 19 && /^\d*$/.test(value)) {
      setCardDetails({ ...cardDetails, number: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateCard()) {
      return;
    }

    setProcessing(true);
    processPaymentMutation.mutate(cardDetails);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="rounded-[12px] border-2 border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-[#0B2545] rounded-[10px] flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-[#D08B3D]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#0B2545]">Paiement Sécurisé</h3>
            <div className="flex items-center gap-2 text-sm text-[#4B5563]">
              <Lock className="w-3 h-3" />
              <span>Chiffré SSL</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Card Number */}
          <div>
            <Label htmlFor="cardNumber" className="text-slate-900 font-semibold">
              Numéro de carte
            </Label>
            <Input
              id="cardNumber"
              placeholder="1234 5678 9012 3456"
              value={formatCardNumber(cardDetails.number)}
              onChange={handleCardNumberChange}
              className={`mt-1 ${errors.number ? 'border-red-500' : 'border-slate-300'}`}
              disabled={processing}
            />
            {errors.number && (
              <p className="text-red-600 text-sm mt-1">{errors.number}</p>
            )}
          </div>

          {/* Expiry & CVC */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="expMonth" className="text-slate-900 font-semibold">
                Mois
              </Label>
              <Input
                id="expMonth"
                placeholder="MM"
                maxLength={2}
                value={cardDetails.exp_month}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*$/.test(value)) {
                    setCardDetails({ ...cardDetails, exp_month: value });
                  }
                }}
                className={`mt-1 ${errors.exp_month ? 'border-red-500' : 'border-slate-300'}`}
                disabled={processing}
              />
              {errors.exp_month && (
                <p className="text-red-600 text-xs mt-1">{errors.exp_month}</p>
              )}
            </div>

            <div>
              <Label htmlFor="expYear" className="text-slate-900 font-semibold">
                Année
              </Label>
              <Input
                id="expYear"
                placeholder="AAAA"
                maxLength={4}
                value={cardDetails.exp_year}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*$/.test(value)) {
                    setCardDetails({ ...cardDetails, exp_year: value });
                  }
                }}
                className={`mt-1 ${errors.exp_year ? 'border-red-500' : 'border-slate-300'}`}
                disabled={processing}
              />
              {errors.exp_year && (
                <p className="text-red-600 text-xs mt-1">{errors.exp_year}</p>
              )}
            </div>

            <div>
              <Label htmlFor="cvc" className="text-slate-900 font-semibold">
                CVC
              </Label>
              <Input
                id="cvc"
                placeholder="123"
                maxLength={4}
                value={cardDetails.cvc}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*$/.test(value)) {
                    setCardDetails({ ...cardDetails, cvc: value });
                  }
                }}
                className={`mt-1 ${errors.cvc ? 'border-red-500' : 'border-slate-300'}`}
                disabled={processing}
              />
              {errors.cvc && (
                <p className="text-red-600 text-xs mt-1">{errors.cvc}</p>
              )}
            </div>
          </div>

          {/* Cardholder Name */}
          <div>
            <Label htmlFor="cardName" className="text-slate-900 font-semibold">
              Nom sur la carte
            </Label>
            <Input
              id="cardName"
              placeholder="Jean Dupont"
              value={cardDetails.name}
              onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
              className={`mt-1 ${errors.name ? 'border-red-500' : 'border-slate-300'}`}
              disabled={processing}
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Save Card */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="saveCard"
              checked={saveCard}
              onCheckedChange={setSaveCard}
              disabled={processing}
            />
            <Label htmlFor="saveCard" className="text-sm text-slate-700 cursor-pointer">
              Enregistrer cette carte pour les prochains achats
            </Label>
          </div>
        </div>
      </Card>

      {/* Security Info */}
      <div className="flex items-start gap-3 p-4 bg-[#0B2545]/5 border border-[#0B2545]/20 rounded-[10px]">
        <Lock className="w-5 h-5 text-[#0B2545] mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-[#0B2545] font-semibold mb-1">
            Paiement 100% sécurisé
          </p>
          <p className="text-xs text-[#4B5563]">
            Vos informations de paiement sont chiffrées et ne sont jamais stockées sur nos serveurs.
            Nous utilisons le standard PCI DSS niveau 1.
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={processing}
        className="w-full h-14 bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white text-lg font-bold shadow-lg rounded-[10px]"
      >
        {processing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Traitement en cours...
          </>
        ) : (
          <>
            <Lock className="w-5 h-5 mr-2" />
            Payer {amount.toFixed(2)}€
          </>
        )}
      </Button>

      <p className="text-xs text-center text-slate-500">
        En payant, vous acceptez nos conditions générales de vente
      </p>
    </form>
  );
}