import { useCheckout } from './useCheckout';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Checkout() {
    const {
        currentStep,
        setCurrentStep,
        formData,
        handleChange,
        handlePaymentSuccess,
        isStep1Valid,
        createOrderMutation
    } = useCheckout();

    return (
        <div className="min-h-screen py-12 bg-[#F7F8FA]">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <h1 className="text-4xl font-bold text-[#0B2545] mb-2">Paiement</h1>
                    <p className="text-[#4B5563]">Étape {currentStep} sur 3</p>
                </motion.div>

                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <Card className="rounded-[12px] border-2 border-slate-200">
                            <CardContent className="p-6">
                                {currentStep === 1 && (
                                    <div className="space-y-4">
                                        <h2 className="text-2xl font-bold text-[#0B2545] mb-4">Informations de contact</h2>
                                        <div>
                                            <Label>Email</Label>
                                            <Input value={formData.email} onChange={(e) => handleChange('email', e.target.value)} type="email" required />
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <Label>Prénom</Label>
                                                <Input value={formData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} required />
                                            </div>
                                            <div>
                                                <Label>Nom</Label>
                                                <Input value={formData.lastName} onChange={(e) => handleChange('lastName', e.target.value)} required />
                                            </div>
                                        </div>
                                        <div>
                                            <Label>Téléphone</Label>
                                            <Input value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} type="tel" />
                                        </div>
                                        <Button onClick={() => setCurrentStep(2)} disabled={!isStep1Valid()} className="w-full bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px]">
                                            Continuer
                                        </Button>
                                    </div>
                                )}

                                {currentStep === 2 && (
                                    <div className="space-y-4">
                                        <h2 className="text-2xl font-bold text-[#0B2545] mb-4">Adresse de livraison</h2>
                                        <div>
                                            <Label>Adresse</Label>
                                            <Input value={formData.address} onChange={(e) => handleChange('address', e.target.value)} required />
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <Label>Ville</Label>
                                                <Input value={formData.city} onChange={(e) => handleChange('city', e.target.value)} required />
                                            </div>
                                            <div>
                                                <Label>Code postal</Label>
                                                <Input value={formData.postalCode} onChange={(e) => handleChange('postalCode', e.target.value)} required />
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <Button onClick={() => setCurrentStep(1)} variant="outline" className="flex-1">Retour</Button>
                                            <Button onClick={() => setCurrentStep(3)} className="flex-1 bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white">Continuer</Button>
                                        </div>
                                    </div>
                                )}

                                {currentStep === 3 && (
                                    <div className="space-y-4">
                                        <h2 className="text-2xl font-bold text-[#0B2545] mb-4">Paiement</h2>
                                        <p className="text-[#4B5563] mb-4">Formulaire de paiement sécurisé</p>
                                        <Button onClick={() => handlePaymentSuccess({ payment_method: 'card' })} disabled={createOrderMutation.isPending} className="w-full bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px]">
                                            {createOrderMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                            Confirmer le paiement
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-1">
                        <Card className="rounded-[12px] border-2 border-slate-200 sticky top-24">
                            <CardContent className="p-6">
                                <h2 className="text-xl font-bold text-[#0B2545] mb-4">Résumé de la commande</h2>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Sous-total</span>
                                        <span className="font-semibold">0.00€</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Livraison</span>
                                        <span className="text-[#1E7A4B]">Offerte</span>
                                    </div>
                                    <div className="border-t pt-2 flex justify-between font-bold text-lg">
                                        <span>Total</span>
                                        <span className="text-[#D08B3D]">0.00€</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
