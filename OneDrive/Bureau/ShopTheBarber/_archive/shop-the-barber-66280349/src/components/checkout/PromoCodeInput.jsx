import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Tag, X, Percent, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PromoCodeInput({ cartTotal, onPromoApplied }) {
  const [code, setCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [error, setError] = useState('');

  const validatePromoMutation = useMutation({
    mutationFn: async (promoCode) => {
      const promos = await base44.entities.PromoCode.filter({ 
        code: promoCode.toUpperCase(),
        is_active: true 
      });
      
      if (promos.length === 0) {
        throw new Error('Code promo invalide');
      }

      const promo = promos[0];
      const now = new Date();

      // Vérifications
      if (promo.valid_from && new Date(promo.valid_from) > now) {
        throw new Error('Ce code promo n\'est pas encore valide');
      }

      if (promo.valid_until && new Date(promo.valid_until) < now) {
        throw new Error('Ce code promo a expiré');
      }

      if (promo.usage_limit && promo.usage_count >= promo.usage_limit) {
        throw new Error('Ce code promo a atteint sa limite d\'utilisation');
      }

      if (promo.min_purchase && cartTotal < promo.min_purchase) {
        throw new Error(`Montant minimum requis: ${promo.min_purchase}€`);
      }

      return promo;
    },
    onSuccess: (promo) => {
      setAppliedPromo(promo);
      setError('');
      setCode('');
      
      let discount = 0;
      if (promo.discount_type === 'percentage') {
        discount = (cartTotal * promo.discount_value) / 100;
        if (promo.max_discount && discount > promo.max_discount) {
          discount = promo.max_discount;
        }
      } else if (promo.discount_type === 'fixed_amount') {
        discount = promo.discount_value;
      }

      onPromoApplied({
        code: promo.code,
        discount,
        freeShipping: promo.discount_type === 'free_shipping'
      });
    },
    onError: (error) => {
      setError(error.message);
    }
  });

  const handleApply = () => {
    if (!code.trim()) {
      setError('Veuillez entrer un code promo');
      return;
    }
    setError('');
    validatePromoMutation.mutate(code.trim());
  };

  const handleRemove = () => {
    setAppliedPromo(null);
    setError('');
    onPromoApplied(null);
  };

  const getDiscountIcon = (type) => {
    switch (type) {
      case 'percentage':
        return Percent;
      case 'free_shipping':
        return Truck;
      default:
        return Tag;
    }
  };

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {appliedPromo ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert className="bg-[#1E7A4B]/10 border-[#1E7A4B] rounded-[10px]">
              <CheckCircle className="h-4 w-4 text-[#1E7A4B]" />
              <AlertDescription className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[#1E7A4B] font-semibold">
                    Code promo appliqué: {appliedPromo.code}
                  </span>
                  <Badge className="bg-[#1E7A4B]/20 text-[#1E7A4B] border-0">
                    {appliedPromo.discount_type === 'percentage' && `${appliedPromo.discount_value}%`}
                    {appliedPromo.discount_type === 'fixed_amount' && `${appliedPromo.discount_value}€`}
                    {appliedPromo.discount_type === 'free_shipping' && 'Livraison Gratuite'}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                  className="text-[#1E7A4B] hover:bg-[#1E7A4B]/10 min-h-[44px]"
                >
                  <X className="w-4 h-4" />
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Code promo"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleApply()}
                className="pl-10 uppercase"
                disabled={validatePromoMutation.isPending}
              />
            </div>
            <Button
              onClick={handleApply}
              disabled={!code.trim() || validatePromoMutation.isPending}
              className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px] min-h-[44px]"
            >
              {validatePromoMutation.isPending ? 'Vérification...' : 'Appliquer'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert className="bg-[#D6454A]/10 border-[#D6454A] rounded-[10px]">
              <AlertCircle className="h-4 w-4 text-[#D6454A]" />
              <AlertDescription className="text-[#D6454A]">
                {error}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}