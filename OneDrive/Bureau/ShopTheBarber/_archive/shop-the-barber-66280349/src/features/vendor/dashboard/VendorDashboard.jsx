import { useVendorDashboard } from './useVendorDashboard';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, DollarSign, ShoppingCart, Plus, Edit, Eye, Star, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function VendorDashboard() {
    const { products, stats, isLoading } = useVendorDashboard();

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#D08B3D]" /></div>;
    }

    return (
        <div className="min-h-screen py-12 bg-[#F7F8FA]">
            <div className="max-w-7xl mx-auto px-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-[#0B2545] mb-2">Tableau de bord Vendeur</h1>
                        <p className="text-[#4B5563]">Gérez vos produits et commandes</p>
                    </div>
                    <Button className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px]">
                        <Plus className="w-4 h-4 mr-2" />Nouveau Produit
                    </Button>
                </motion.div>

                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    {[
                        { icon: Package, label: "Produits", value: stats.totalProducts, color: "text-[#0B2545]" },
                        { icon: ShoppingCart, label: "Commandes", value: stats.totalOrders, color: "text-[#1E7A4B]" },
                        { icon: DollarSign, label: "Revenus", value: `${stats.totalRevenue.toFixed(0)}€`, color: "text-[#D08B3D]" },
                        { icon: Star, label: "Note moyenne", value: stats.averageRating, color: "text-[#D08B3D]" }
                    ].map((stat, index) => (
                        <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                            <Card className="rounded-[12px] border-2 border-slate-200">
                                <CardContent className="p-6">
                                    <stat.icon className={`w-10 h-10 ${stat.color} mb-3`} />
                                    <p className="text-sm text-[#4B5563] mb-1">{stat.label}</p>
                                    <p className="text-3xl font-bold text-[#0B2545]">{stat.value}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <Card className="rounded-[12px] border-2 border-slate-200">
                    <CardContent className="p-6">
                        <h2 className="text-2xl font-bold text-[#0B2545] mb-6">Mes Produits</h2>
                        {products.length === 0 ? (
                            <div className="text-center py-12">
                                <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <p className="text-[#4B5563]">Aucun produit pour le moment</p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {products.map((product, index) => (
                                    <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                                        <Card className="rounded-[12px] border-2 border-slate-200 hover:border-[#D08B3D] transition-all overflow-hidden">
                                            <div className="aspect-square bg-slate-100">
                                                {product.image_url && <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />}
                                            </div>
                                            <CardContent className="p-4">
                                                <h3 className="font-bold text-[#0B2545] mb-2">{product.name}</h3>
                                                <p className="text-2xl font-bold text-[#D08B3D] mb-3">{product.price}€</p>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm" className="flex-1 rounded-[8px]">
                                                        <Edit className="w-4 h-4 mr-1" />Modifier
                                                    </Button>
                                                    <Link to={createPageUrl("ProductDetail", `?id=${product.id}`)}>
                                                        <Button variant="outline" size="sm" className="rounded-[8px]">
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
