import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function InstallmentPayment({ amount, onPlanSelect }) {
  const [selectedPlan, setSelectedPlan] = useState(null);

  const installmentPlans = [
    {
      id: '2x',
      name: 'Paiement en 2 fois',
      installments: 2,
      fee: 0,
      available: amount >= 50,
      minAmount: 50
    },
    {
      id: '3x',
      name: 'Paiement en 3 fois',
      installments: 3,
      fee: amount * 0.02, // 2% de frais
      available: amount >= 100,
      minAmount: 100
    },
    {
      id: '4x',
      name: 'Paiement en 4 fois',
      installments: 4,
      fee: amount * 0.03, // 3% de frais
      available: amount >= 150,
      minAmount: 150
    }
  ];

  const calculateInstallments = (plan) => {
    const totalAmount = amount + plan.fee;
    const installmentAmount = totalAmount / plan.installments;
    return {
      installmentAmount: installmentAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      schedule: Array.from({ length: plan.installments }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() + i);
        return {
          number: i + 1,
          date: date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
          amount: installmentAmount.toFixed(2)
        };
      })
    };
  };

  const handlePlanSelect = (planId) => {
    const plan = installmentPlans.find(p => p.id === planId);
    setSelectedPlan(plan);
    if (onPlanSelect) {
      const details = calculateInstallments(plan);
      onPlanSelect({ plan, details });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-[#D08B3D]" />
        <h3 className="text-lg font-bold text-[#0B2545]">Paiement en plusieurs fois</h3>
      </div>

      <RadioGroup value={selectedPlan?.id} onValueChange={handlePlanSelect}>
        {installmentPlans.map((plan) => {
          const details = calculateInstallments(plan);
          
          return (
            <Card
              key={plan.id}
              className={`rounded-[12px] p-4 cursor-pointer transition-all ${
                !plan.available
                  ? 'opacity-50 cursor-not-allowed bg-slate-50'
                  : selectedPlan?.id === plan.id
                  ? 'border-2 border-[#D08B3D] bg-[#D08B3D]/5'
                  : 'border-2 border-slate-200 hover:border-[#D08B3D]'
              }`}
              onClick={() => plan.available && handlePlanSelect(plan.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <RadioGroupItem
                    value={plan.id}
                    id={plan.id}
                    disabled={!plan.available}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={plan.id}
                      className={`text-base font-semibold cursor-pointer ${
                        !plan.available ? 'text-slate-500' : 'text-slate-900'
                      }`}
                    >
                      {plan.name}
                    </Label>
                    
                    {plan.available ? (
                      <>
                        <p className="text-sm text-[#4B5563] mt-1">
                          {plan.installments} x <span className="font-bold text-lg text-[#0B2545]">{details.installmentAmount}€</span>/mois
                        </p>
                        
                        {plan.fee > 0 && (
                          <p className="text-xs text-slate-500 mt-1">
                            + {plan.fee.toFixed(2)}€ de frais ({(plan.fee / amount * 100).toFixed(1)}%)
                          </p>
                        )}

                        {plan.fee === 0 && (
                          <Badge className="mt-2 bg-[#1E7A4B]/20 text-[#1E7A4B] border-0">
                            Sans frais
                          </Badge>
                        )}

                        {selectedPlan?.id === plan.id && (
                          <div className="mt-4 p-3 bg-white rounded-[10px] border border-[#D08B3D]/30">
                            <p className="text-xs font-semibold text-slate-700 mb-2">
                              Échéancier de paiement:
                            </p>
                            <div className="space-y-2">
                              {details.schedule.map((payment) => (
                                <div key={payment.number} className="flex items-center justify-between text-xs">
                                  <span className="text-slate-600">
                                    {payment.number === 1 ? "Aujourd'hui" : payment.date}
                                  </span>
                                  <span className="font-semibold text-slate-900">
                                    {payment.amount}€
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-700">Total:</span>
                              <span className="text-sm font-bold text-slate-900">{details.totalAmount}€</span>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-slate-500 mt-1">
                        Montant minimum: {plan.minAmount}€
                      </p>
                    )}
                  </div>
                </div>

                {selectedPlan?.id === plan.id && (
                  <CheckCircle className="w-5 h-5 text-[#D08B3D] flex-shrink-0" />
                )}
              </div>
            </Card>
          );
        })}
      </RadioGroup>

      {selectedPlan && (
        <Alert className="bg-[#0B2545]/5 border-[#0B2545]/20 rounded-[10px]">
          <Info className="h-4 w-4 text-[#0B2545]" />
          <AlertDescription className="text-sm text-[#0B2545]">
            Le premier paiement sera prélevé aujourd'hui. Les paiements suivants seront automatiquement 
            prélevés le même jour chaque mois.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}