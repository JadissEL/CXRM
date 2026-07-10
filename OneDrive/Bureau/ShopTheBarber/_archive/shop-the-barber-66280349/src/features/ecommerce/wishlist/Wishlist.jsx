import { useWishlist } from './useWishlist';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart, Trash2, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

export default function Wishlist() {
    const { products, selectedProducts, toggleProductSelection, handleCompare, isLoading } = useWishlist();

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center"><p>Chargement...</p></div>;
    }

    return (
        <div className="min-h-screen py-12 bg-[#F7F8FA]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <h1 className="text-4xl font-bold text-[#0B2545] mb-2">Ma Liste de Souhaits</h1>
                    <p className="text-[#4B5563]">{products.length} produit{products.length > 1 ? 's' : ''}</p>
                </motion.div>

                {selectedProducts.length >= 2 && (
                    <div className="mb-6">
                        <Button onClick={handleCompare} className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white">
                            Comparer ({selectedProducts.length})
                        </Button>
                    </div>
                )}

                {products.length === 0 ? (
                    <Card className="rounded-[12px] border-2 border-slate-200 p-16 text-center">
                        <Heart className="w-24 h-24 text-slate-300 mx-auto mb-6" />
                        <h2 className="text-3xl font-bold text-[#0B2545] mb-4">Votre liste est vide</h2>
                        <p className="text-[#4B5563] mb-8">Ajoutez des produits à votre liste de souhaits</p>
                        <Link to={createPageUrl("Marketplace")}>
                            <Button className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white">Explorer la Marketplace</Button>
                        </Link>
                    </Card>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map((product, index) => (
                            <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                                <Card className="rounded-[12px] border-2 border-slate-200 hover:border-[#D08B3D] transition-all overflow-hidden">
                                    <div className="aspect-square bg-slate-100 relative">
                                        {product.image_url && <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />}
                                        <Button size="icon" variant="ghost" className="absolute top-2 right-2 bg-white/90 hover:bg-white">
                                            <Trash2 className="w-4 h-4 text-red-600" />
                                        </Button>
                                        {product.discount && (
                                            <Badge className="absolute top-2 left-2 bg-red-600 text-white">-{product.discount}%</Badge>
                                        )}
                                    </div>
                                    <CardContent className="p-4">
                                        <h3 className="font-bold text-[#0B2545] mb-2">{product.name}</h3>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-2xl font-bold text-[#D08B3D]">{product.price}€</span>
                                            {product.original_price && (
                                                <span className="text-sm text-slate-400 line-through">{product.original_price}€</span>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button className="flex-1 bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white">
                                                <ShoppingCart className="w-4 h-4 mr-2" />Ajouter
                                            </Button>
                                            <Button variant="outline" size="icon" onClick={() => toggleProductSelection(product.id)}>
                                                <input type="checkbox" checked={selectedProducts.includes(product.id)} readOnly />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
