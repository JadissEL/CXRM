import { useCart } from './useCart';
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag, Trash2, Plus, Minus, ArrowLeft, ShoppingCart, Package } from "lucide-react";
import { motion } from "framer-motion";

export default function Cart() {
    const navigate = useNavigate();
    const { cartItems, updateQuantity, removeFromCart, total, itemCount } = useCart();

    if (itemCount === 0) {
        return (
            <div className="min-h-screen py-20 bg-[#F7F8FA]">
                <div className="max-w-md mx-auto px-4 text-center">
                    <Card className="rounded-[12px] border-2 border-slate-200 p-12">
                        <ShoppingBag className="w-24 h-24 text-slate-300 mx-auto mb-6" />
                        <h2 className="text-3xl font-bold text-[#0B2545] mb-4">Votre panier est vide</h2>
                        <p className="text-[#4B5563] mb-8">Découvrez nos produits premium et commencez vos achats</p>
                        <Link to={createPageUrl("Marketplace")}>
                            <Button className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white px-8 py-6 text-lg rounded-[10px] min-h-[44px]">
                                <Package className="w-5 h-5 mr-2" />Explor la Marketplace
                            </Button>
                        </Link>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12 bg-[#F7F8FA]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <Button variant="ghost" onClick={() => navigate(createPageUrl("Marketplace"))} className="mb-4 text-[#4B5563] hover:bg-slate-100 rounded-[10px] min-h-[44px]">
                        <ArrowLeft className="w-5 h-5 mr-2" />Continuer mes achats
                    </Button>
                    <h1 className="text-4xl font-bold text-[#0B2545] mb-2">Mon Panier</h1>
                    <p className="text-[#4B5563]">{itemCount} {itemCount > 1 ? 'articles' : 'article'}</p>
                </motion.div>

                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                        {cartItems.map((item, index) => (
                            <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                                <Card className="rounded-[12px] border-2 border-slate-200 hover:border-[#D08B3D] transition-all">
                                    <CardContent className="p-6">
                                        <div className="flex gap-6">
                                            <div className="w-32 h-32 rounded-[10px] overflow-hidden bg-slate-100 flex-shrink-0">
                                                {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-12 h-12 text-slate-300" /></div>}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-[#0B2545] mb-2">{item.name}</h3>
                                                {item.brand && <p className="text-sm text-[#4B5563] mb-3">{item.brand}</p>}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Button variant="outline" size="icon" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="h-10 w-10 rounded-[8px] border-slate-200 min-h-[44px] min-w-[44px]"><Minus className="w-4 h-4" /></Button>
                                                        <span className="text-lg font-semibold w-12 text-center text-[#0B2545]">{item.quantity}</span>
                                                        <Button variant="outline" size="icon" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="h-10 w-10 rounded-[8px] border-slate-200 min-h-[44px] min-w-[44px]"><Plus className="w-4 h-4" /></Button>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl font-bold text-[#D08B3D]">{(item.price * item.quantity).toFixed(2)}€</p>
                                                        <p className="text-sm text-[#4B5563]">{item.price.toFixed(2)}€ / unité</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)} className="text-[#D6454A] hover:bg-[#D6454A]/10 min-h-[44px] min-w-[44px]"><Trash2 className="w-5 h-5" /></Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    <div className="lg:col-span-1">
                        <Card className="rounded-[12px] border-2 border-slate-200 sticky top-24">
                            <CardContent className="p-6">
                                <h2 className="text-2xl font-bold text-[#0B2545] mb-6">Résumé</h2>
                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between text-[#4B5563]">
                                        <span>Sous-total</span><span className="font-semibold text-[#0B2545]">{total.toFixed(2)}€</span>
                                    </div>
                                    <div className="flex justify-between text-[#4B5563]">
                                        <span>Livraison</span><Badge variant="outline" className="border-[#1E7A4B] text-[#1E7A4B]">Offerte</Badge>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between text-xl font-bold text-[#0B2545]">
                                        <span>Total</span><span className="text-[#D08B3D]">{total.toFixed(2)}€</span>
                                    </div>
                                </div>
                                <Link to={createPageUrl("Checkout")} className="block">
                                    <Button className="w-full bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white h-14 text-lg font-bold shadow-lg rounded-[10px]">
                                        <ShoppingCart className="w-5 h-5 mr-2" />Passer la commande
                                    </Button>
                                </Link>
                                <p className="text-sm text-[#4B5563] text-center mt-4">Paiement 100% sécurisé</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
